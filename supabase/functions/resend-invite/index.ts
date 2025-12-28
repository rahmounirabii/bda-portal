// Supabase Edge Function: resend-invite
// Resends invitation email for a specific user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface RequestBody {
  item_id: string // bulk_upload_items.id
}

serve(async (req) => {
  console.log('resend-invite: Request received', req.method)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request has a valid JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify calling user is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userData, error: userError } = await userClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request body
    const body: RequestBody = await req.json()
    const { item_id } = body

    if (!item_id) {
      return new Response(
        JSON.stringify({ error: 'item_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the item details
    const { data: item, error: itemError } = await adminClient
      .from('bulk_upload_items')
      .select('*')
      .eq('id', item_id)
      .single()

    if (itemError || !item) {
      return new Response(
        JSON.stringify({ error: 'Item not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[resend-invite] Resending invite for:', item.email)

    // Update status to sending
    await adminClient
      .from('bulk_upload_items')
      .update({
        email_status: 'sending',
        error_message: null
      })
      .eq('id', item_id)

    // Check if user exists in auth
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === item.email)

    // Determine redirect URL based on environment
    // Edge Runtime uses internal Docker URL (kong:8000), so check for that too
    const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost') || supabaseUrl.includes('kong:')
    const siteUrl = isLocal
      ? 'http://localhost:8082'
      : (Deno.env.get('SITE_URL') || 'https://bda-global.org')
    const redirectUrl = `${siteUrl}/auth/set-password`

    let success = false
    let errorMessage = ''

    if (existingUser) {
      // User exists - generate a new magic link or password reset
      console.log('[resend-invite] User exists, generating password reset link')

      const { error: resetError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: item.email,
        options: {
          redirectTo: redirectUrl,
        }
      })

      if (resetError) {
        errorMessage = resetError.message
        console.error('[resend-invite] Password reset error:', resetError.message)
      } else {
        success = true
      }
    } else {
      // User doesn't exist in auth - send fresh invite
      console.log('[resend-invite] Sending fresh invite')

      const nameParts = item.full_name.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        item.email,
        {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: item.full_name,
            source: 'bulk_upload_resend',
          },
          redirectTo: redirectUrl,
        }
      )

      if (inviteError) {
        errorMessage = inviteError.message
        console.error('[resend-invite] Invite error:', inviteError.message)
      } else {
        success = true
      }
    }

    // Update item status
    if (success) {
      await adminClient
        .from('bulk_upload_items')
        .update({
          email_status: 'sent',
          email_queued: true,
          error_message: null,
          status: item.created_user_id ? 'success' : item.status, // Keep original status if user was created
        })
        .eq('id', item_id)

      // Update job email_sent_count
      const { data: job } = await adminClient
        .from('bulk_upload_jobs')
        .select('email_sent_count')
        .eq('id', item.job_id)
        .single()

      if (job) {
        await adminClient
          .from('bulk_upload_jobs')
          .update({ email_sent_count: (job.email_sent_count || 0) + 1 })
          .eq('id', item.job_id)
      }

      console.log('[resend-invite] Successfully resent invite for:', item.email)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Invite email resent successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      await adminClient
        .from('bulk_upload_items')
        .update({
          email_status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', item_id)

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: any) {
    console.error('[resend-invite] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
