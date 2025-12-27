// Supabase Edge Function: bulk-create-users
// Creates multiple users securely using service role key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface UserData {
  email: string
  full_name: string
  phone?: string
  country: string
  language: string
  certification_track?: string
}

interface RequestBody {
  users: UserData[]
  send_welcome_email?: boolean
  activate_content?: boolean
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

serve(async (req) => {
  console.log('bulk-create-users: Request received', req.method)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request has a valid JWT
    const authHeader = req.headers.get('Authorization')
    console.log('bulk-create-users: Auth header present:', !!authHeader)

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('bulk-create-users: Environment check - URL:', !!supabaseUrl, 'Service:', !!supabaseServiceKey, 'Anon:', !!supabaseAnonKey)

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error - missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First, verify the calling user is an admin using their JWT
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

    // Check if user is admin
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

    // Parse request body
    const body: RequestBody = await req.json()
    const { users, send_welcome_email = true, activate_content = false } = body

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const createdUsers: { id: string; email: string; full_name: string }[] = []
    const errors: { email: string; error: string }[] = []
    let skippedCount = 0

    for (const userData of users) {
      try {
        // Split full name
        const nameParts = userData.full_name.trim().split(/\s+/)
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || ''

        // Generate temp password
        const tempPassword = generateTempPassword()

        // Step 1: Create user in Supabase Auth
        console.log('[bulk-create] Step 1: Creating auth user:', userData.email)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: userData.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            source: 'bulk_upload',
          },
        })

        if (authError) {
          console.error('[bulk-create] Auth error for', userData.email, ':', authError.message)
          if (authError.message.includes('already registered')) {
            console.log('[bulk-create] User already exists, skipping:', userData.email)
            skippedCount++
            continue
          }
          throw new Error(`Auth creation failed: ${authError.message}`)
        }

        const userId = authData.user?.id
        if (!userId) {
          throw new Error('Auth succeeded but no user ID returned')
        }
        console.log('[bulk-create] Step 1 complete: User created with ID:', userId)

        // Step 2: Wait briefly for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 100))

        // Step 3: Update user profile
        console.log('[bulk-create] Step 3: Updating profile for:', userData.email)
        const { error: profileError } = await adminClient
          .from('users')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: userData.phone || null,
            country_code: userData.country,
            preferred_language: userData.language.toLowerCase(),
            profile_completed: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (profileError) {
          console.error('[bulk-create] Profile update error:', profileError)
          throw new Error(`Profile update failed: ${profileError.message}`)
        }
        console.log('[bulk-create] Step 3 complete: Profile updated')

        // Step 4: Grant curriculum access if specified
        if (activate_content && userData.certification_track) {
          console.log('[bulk-create] Step 4: Granting curriculum access')
          const certType = userData.certification_track === 'BDA-CP' ? 'cp' : 'scp'
          const now = new Date().toISOString()
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

          const { error: accessError } = await adminClient
            .from('user_curriculum_access')
            .upsert({
              user_id: userId,
              certification_type: certType,
              language: userData.language || 'EN',
              purchased_at: now,
              expires_at: expiresAt,
              is_active: true,
              source: 'bulk_upload',
            }, { onConflict: 'user_id,language' })

          if (accessError) {
            console.error('[bulk-create] Curriculum access error:', accessError)
            // Don't fail the whole user creation for this
            console.warn('[bulk-create] Continuing despite curriculum access error')
          } else {
            console.log('[bulk-create] Step 4 complete: Curriculum access granted')
          }
        }

        console.log('[bulk-create] User creation complete:', userData.email)
        createdUsers.push({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
        })

      } catch (error: any) {
        console.error('[bulk-create] Error creating user', userData.email, ':', error.message)
        errors.push({
          email: userData.email,
          error: error.message || 'Unknown error',
        })
      }
    }

    return new Response(
      JSON.stringify({
        success_count: createdUsers.length,
        error_count: errors.length,
        skipped_count: skippedCount,
        created_users: createdUsers,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
