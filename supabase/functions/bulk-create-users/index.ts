// Supabase Edge Function: bulk-create-users
// Creates multiple users using Supabase's built-in invite system
// Emails are sent automatically via Supabase's configured SMTP (Inbucket for local dev)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface BulkUploadItem {
  row_number: number
  email: string
  full_name: string
  phone?: string
  country_code: string
  language: string
  certification_track?: string
}

interface RequestBody {
  items: BulkUploadItem[]
  send_welcome_email?: boolean
  activate_content?: boolean
  user_role?: 'individual' | 'ecp' | 'pdp'
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
    const { items, send_welcome_email = true, activate_content = false, user_role = 'individual' } = body

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items to process' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[bulk-create] Creating job with', items.length, 'items')

    // Create job for tracking
    const { data: job, error: jobError } = await adminClient
      .from('bulk_upload_jobs')
      .insert({
        created_by: user.id,
        status: 'processing',
        total_users: items.length,
        send_welcome_email,
        activate_content,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    const jobId = job.id

    // Create item records
    const itemRecords = items.map(item => ({
      job_id: jobId,
      row_number: item.row_number,
      email: item.email,
      full_name: item.full_name,
      phone: item.phone,
      country_code: item.country_code,
      language: item.language,
      certification_track: item.certification_track,
      status: 'pending',
    }))

    await adminClient.from('bulk_upload_items').insert(itemRecords)

    // Process each user with delay to avoid SMTP rate limiting
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    let emailSentCount = 0

    // Helper function to delay between emails (Mailtrap free: ~1 email/sec on sandbox)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Helper function to send invite with retry on rate limit
    const sendInviteWithRetry = async (email: string, metadata: any, redirectTo: string, maxRetries = 2) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: metadata,
          redirectTo,
        })

        if (!error) {
          return { data, error: null }
        }

        // Check if it's a rate limit error
        const isRateLimit = error.message.includes('Too many') ||
                           error.message.includes('rate limit') ||
                           error.message.includes('sending invite email')

        if (isRateLimit && attempt < maxRetries) {
          console.log(`[bulk-create] Rate limited for ${email}, retrying in ${(attempt + 1) * 3}s...`)
          await delay((attempt + 1) * 3000) // Exponential backoff: 3s, 6s
          continue
        }

        return { data: null, error }
      }
      return { data: null, error: new Error('Max retries exceeded') }
    }

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]

      // Add delay between emails to avoid rate limiting (except first one)
      // Mailtrap sandbox is very strict - need 2.5+ seconds between emails
      if (idx > 0 && send_welcome_email) {
        await delay(2500) // 2.5 second delay between emails
      }

      try {
        // Update item to processing - creating user
        await adminClient
          .from('bulk_upload_items')
          .update({
            status: 'processing',
            email_status: send_welcome_email ? 'pending' : 'skipped'
          })
          .eq('job_id', jobId)
          .eq('email', item.email)

        // Split full name
        const nameParts = item.full_name.trim().split(/\s+/)
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || ''

        let userId: string

        if (send_welcome_email) {
          // Update status to show we're sending email
          await adminClient
            .from('bulk_upload_items')
            .update({ email_status: 'sending' })
            .eq('job_id', jobId)
            .eq('email', item.email)

          console.log('[bulk-create] Inviting user:', item.email, `(${idx + 1}/${items.length})`)

          // Determine redirect URL based on environment
          // Edge Runtime uses internal Docker URL (kong:8000), so check for that too
          const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost') || supabaseUrl.includes('kong:')
          const siteUrl = isLocal
            ? 'http://localhost:8082'
            : (Deno.env.get('SITE_URL') || 'https://bda-global.org')
          const redirectUrl = `${siteUrl}/auth/set-password`

          const { data: inviteData, error: inviteError } = await sendInviteWithRetry(
            item.email,
            {
              first_name: firstName,
              last_name: lastName,
              full_name: item.full_name,
              bda_role: user_role,
              source: 'bulk_upload',
            },
            redirectUrl
          )

          if (inviteError) {
            if (inviteError.message.includes('already been registered') ||
                inviteError.message.includes('already registered')) {
              console.log('[bulk-create] User already exists:', item.email)
              skippedCount++
              await adminClient
                .from('bulk_upload_items')
                .update({
                  status: 'skipped',
                  error_message: 'User already exists',
                  email_queued: false,
                  email_status: 'skipped',
                })
                .eq('job_id', jobId)
                .eq('email', item.email)

              // Update job progress
              await adminClient
                .from('bulk_upload_jobs')
                .update({
                  processed_count: successCount + errorCount + skippedCount,
                  success_count: successCount,
                  error_count: errorCount,
                  skipped_count: skippedCount,
                  email_sent_count: emailSentCount,
                })
                .eq('id', jobId)
              continue
            }

            // Email sending failed
            await adminClient
              .from('bulk_upload_items')
              .update({ email_status: 'failed' })
              .eq('job_id', jobId)
              .eq('email', item.email)

            throw inviteError
          }

          userId = inviteData.user.id
          emailSentCount++

          // Mark email as sent
          await adminClient
            .from('bulk_upload_items')
            .update({ email_status: 'sent' })
            .eq('job_id', jobId)
            .eq('email', item.email)

          console.log('[bulk-create] Email sent for:', item.email, `(${emailSentCount} emails sent)`)

        } else {
          // Create user without invite email
          console.log('[bulk-create] Creating user (no email):', item.email)

          const tempPassword = generateTempPassword()
          const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
            email: item.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
              full_name: item.full_name,
              bda_role: user_role,
              source: 'bulk_upload',
            },
          })

          if (createError) {
            if (createError.message.includes('already been registered') ||
                createError.message.includes('already registered')) {
              skippedCount++
              await adminClient
                .from('bulk_upload_items')
                .update({
                  status: 'skipped',
                  error_message: 'User already exists',
                  email_status: 'skipped',
                })
                .eq('job_id', jobId)
                .eq('email', item.email)

              await adminClient
                .from('bulk_upload_jobs')
                .update({
                  processed_count: successCount + errorCount + skippedCount,
                  success_count: successCount,
                  error_count: errorCount,
                  skipped_count: skippedCount,
                  email_sent_count: emailSentCount,
                })
                .eq('id', jobId)
              continue
            }
            throw createError
          }

          userId = createData.user.id
        }

        // Update user profile in public.users table
        await adminClient
          .from('users')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: item.phone || null,
            country_code: item.country_code,
            preferred_language: item.language?.toLowerCase() || 'en',
            role: user_role,
            profile_completed: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        // Grant curriculum access if requested
        if (activate_content && item.certification_track) {
          const certType = item.certification_track === 'BDA-CP' ? 'cp' : 'scp'
          await adminClient
            .from('user_curriculum_access')
            .upsert({
              user_id: userId,
              certification_type: certType,
              granted_at: new Date().toISOString(),
              source: 'bulk_upload',
            })
        }

        // Update item as success
        await adminClient
          .from('bulk_upload_items')
          .update({
            status: 'success',
            created_user_id: userId,
            email_queued: send_welcome_email,
          })
          .eq('job_id', jobId)
          .eq('email', item.email)

        successCount++

        // Update job progress with email count
        await adminClient
          .from('bulk_upload_jobs')
          .update({
            processed_count: successCount + errorCount + skippedCount,
            success_count: successCount,
            error_count: errorCount,
            skipped_count: skippedCount,
            email_sent_count: emailSentCount,
          })
          .eq('id', jobId)

      } catch (error: any) {
        console.error('[bulk-create] Error for', item.email, ':', error.message)
        errorCount++

        await adminClient
          .from('bulk_upload_items')
          .update({
            status: 'error',
            error_message: error.message,
            email_status: 'failed',
          })
          .eq('job_id', jobId)
          .eq('email', item.email)

        await adminClient
          .from('bulk_upload_jobs')
          .update({
            processed_count: successCount + errorCount + skippedCount,
            success_count: successCount,
            error_count: errorCount,
            skipped_count: skippedCount,
            email_sent_count: emailSentCount,
          })
          .eq('id', jobId)
      }
    }

    // Mark job as completed
    await adminClient
      .from('bulk_upload_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_count: successCount + errorCount + skippedCount,
        success_count: successCount,
        error_count: errorCount,
        skipped_count: skippedCount,
        email_sent_count: emailSentCount,
      })
      .eq('id', jobId)

    console.log('[bulk-create] Job completed:', { successCount, errorCount, skippedCount, emailSentCount })

    return new Response(
      JSON.stringify({
        job_id: jobId,
        success_count: successCount,
        error_count: errorCount,
        skipped_count: skippedCount,
        message: send_welcome_email
          ? 'Users created. Invite emails sent via Supabase (check Inbucket for local dev).'
          : 'Users created without invite emails.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[bulk-create] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
