// Supabase Edge Function: send-emails
// Processes email queue and sends via Resend/SMTP API/Mailtrap
// Can be called manually or via scheduled trigger

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

// Configuration
const BATCH_SIZE = 10
const FROM_EMAIL = 'noreply@bda-global.org'
const FROM_NAME = 'BDA Association'

interface EmailQueueItem {
  id: string
  recipient_email: string
  recipient_name?: string
  subject: string
  template_name: string
  template_data: Record<string, any>
  status: string
  attempts: number
  max_attempts: number
}

// Send email via Resend API
async function sendViaResend(
  apiKey: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: htmlBody,
        text: textBody,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || 'Resend API error' }
    }

    return { success: true, messageId: data.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Send email via generic SMTP API (Mailgun, SendGrid, etc.)
async function sendViaSMTPAPI(
  config: { apiKey: string; domain: string; provider: string },
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // SendGrid
  if (config.provider === 'sendgrid') {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          subject: subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody },
          ],
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, error: text }
      }

      return { success: true, messageId: response.headers.get('x-message-id') || 'sent' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Mailgun
  if (config.provider === 'mailgun') {
    try {
      const formData = new FormData()
      formData.append('from', `${FROM_NAME} <${FROM_EMAIL}>`)
      formData.append('to', to)
      formData.append('subject', subject)
      formData.append('text', textBody)
      formData.append('html', htmlBody)

      const response = await fetch(
        `https://api.mailgun.net/v3/${config.domain}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${config.apiKey}`)}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.message || 'Mailgun API error' }
      }

      return { success: true, messageId: data.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return { success: false, error: `Unknown provider: ${config.provider}` }
}

// Send email via Mailtrap HTTP API (for sandbox and sending)
// Uses Mailtrap's Sending API: https://api.mailtrap.io
// Get API token from: https://mailtrap.io/sending/domains
async function sendViaMailtrap(
  config: { apiToken: string; inboxId?: string },
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Use Mailtrap Sending API
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: to }],
        subject: subject,
        html: htmlBody,
        text: textBody,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[send-emails] Mailtrap API error:', data)
      return { success: false, error: data.errors?.[0] || data.message || 'Mailtrap API error' }
    }

    return { success: true, messageId: data.message_ids?.[0] || 'sent' }
  } catch (error: any) {
    console.error('[send-emails] Mailtrap error:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  console.log('[send-emails] Request received:', req.method)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Email provider configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')

    // Mailtrap API configuration (HTTP API, not SMTP - works in Edge Functions)
    // Get API token from: https://mailtrap.io/sending/domains
    const mailtrapApiToken = Deno.env.get('MAILTRAP_API_TOKEN')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine email provider (priority: Mailtrap for testing, then production providers)
    let emailProvider: string | null = null
    if (mailtrapApiToken) emailProvider = 'mailtrap'
    else if (resendApiKey) emailProvider = 'resend'
    else if (sendgridApiKey) emailProvider = 'sendgrid'
    else if (mailgunApiKey && mailgunDomain) emailProvider = 'mailgun'

    if (!emailProvider) {
      console.log('[send-emails] No email provider configured, emails will be marked as sent (dry run)')
    } else {
      console.log(`[send-emails] Using email provider: ${emailProvider}`)
    }

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse request body for options
    let limit = BATCH_SIZE
    let dryRun = !emailProvider

    try {
      const body = await req.json()
      if (body.limit) limit = Math.min(body.limit, 50)
      if (body.dry_run !== undefined) dryRun = body.dry_run
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Fetch pending emails
    const { data: emails, error: fetchError } = await adminClient
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(limit)

    if (fetchError) {
      console.error('[send-emails] Fetch error:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch emails', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-emails] Processing ${emails.length} emails via ${emailProvider || 'dry-run'}`)

    let succeeded = 0
    let failed = 0
    const results: { email: string; status: string; error?: string }[] = []

    for (const emailItem of emails as EmailQueueItem[]) {
      try {
        // Get email content
        let subject = emailItem.subject
        let htmlBody = ''
        let textBody = ''

        // Check for embedded template (welcome emails)
        if (emailItem.template_data?.html_body && emailItem.template_data?.text_body) {
          htmlBody = emailItem.template_data.html_body
          textBody = emailItem.template_data.text_body
        } else {
          // Would need to fetch from templates table if implemented
          console.warn(`[send-emails] No embedded template for: ${emailItem.template_name}`)
          throw new Error(`Template not found: ${emailItem.template_name}`)
        }

        let sendResult = { success: false, error: 'No provider', messageId: '' }

        if (dryRun) {
          // Dry run - just mark as sent
          console.log(`[send-emails] DRY RUN: Would send to ${emailItem.recipient_email}`)
          sendResult = { success: true, messageId: 'dry-run' }
        } else if (emailProvider === 'resend') {
          sendResult = await sendViaResend(
            resendApiKey!,
            emailItem.recipient_email,
            subject,
            htmlBody,
            textBody
          )
        } else if (emailProvider === 'sendgrid') {
          sendResult = await sendViaSMTPAPI(
            { apiKey: sendgridApiKey!, domain: '', provider: 'sendgrid' },
            emailItem.recipient_email,
            subject,
            htmlBody,
            textBody
          )
        } else if (emailProvider === 'mailgun') {
          sendResult = await sendViaSMTPAPI(
            { apiKey: mailgunApiKey!, domain: mailgunDomain!, provider: 'mailgun' },
            emailItem.recipient_email,
            subject,
            htmlBody,
            textBody
          )
        } else if (emailProvider === 'mailtrap') {
          sendResult = await sendViaMailtrap(
            { apiToken: mailtrapApiToken! },
            emailItem.recipient_email,
            subject,
            htmlBody,
            textBody
          )
        }

        if (sendResult.success) {
          // Update as sent
          await adminClient
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              last_attempt_at: new Date().toISOString(),
              attempts: emailItem.attempts + 1,
            })
            .eq('id', emailItem.id)

          succeeded++
          results.push({ email: emailItem.recipient_email, status: 'sent' })
          console.log(`[send-emails] ✅ Sent to ${emailItem.recipient_email}`)
        } else {
          throw new Error(sendResult.error)
        }

      } catch (error: any) {
        // Update as failed/retrying
        const newAttempts = emailItem.attempts + 1
        const newStatus = newAttempts >= emailItem.max_attempts ? 'failed' : 'retrying'

        await adminClient
          .from('email_queue')
          .update({
            status: newStatus,
            error_message: error.message,
            last_attempt_at: new Date().toISOString(),
            attempts: newAttempts,
          })
          .eq('id', emailItem.id)

        failed++
        results.push({ email: emailItem.recipient_email, status: newStatus, error: error.message })
        console.error(`[send-emails] ❌ Failed for ${emailItem.recipient_email}:`, error.message)
      }
    }

    return new Response(
      JSON.stringify({
        processed: emails.length,
        succeeded,
        failed,
        provider: emailProvider || 'dry-run',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[send-emails] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
