/**
 * Email Worker
 *
 * Background worker to process email queue
 * Run this via cron or as a daemon process
 *
 * Usage:
 *   npm run email-worker
 *   or setup cron: *//* * * * * cd /path/to/bda-portal && npm run email-worker
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const BATCH_SIZE = 10; // Process 10 emails at a time
const MAX_RUNTIME = 5 * 60 * 1000; // 5 minutes max runtime

// Detect if running locally (Mailpit available at port 54325)
const IS_LOCAL = SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost');

// Email configuration
// Local: Use Supabase's Mailpit (SMTP on port 54325)
// Production: Use configured SMTP provider
const EMAIL_CONFIG = IS_LOCAL
  ? {
      host: '127.0.0.1',
      port: 54325, // Mailpit SMTP port
      secure: false,
      auth: undefined as any, // No auth needed for Mailpit
    }
  : {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@bda-global.org';
const FROM_NAME = process.env.FROM_NAME || 'BDA Association';

// ============================================================================
// Initialize Supabase Client
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Initialize Email Transporter
// ============================================================================

let transporter: nodemailer.Transporter;

try {
  transporter = nodemailer.createTransport(EMAIL_CONFIG);
} catch (error) {
  console.error('Failed to initialize email transporter:', error);
  process.exit(1);
}

// ============================================================================
// Template Variable Replacement
// ============================================================================

function replaceTemplateVariables(
  template: string,
  data: Record<string, any>
): string {
  let result = template;

  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(data[key] || ''));
  });

  return result;
}

// ============================================================================
// Get Email Template
// ============================================================================

async function getEmailTemplate(templateName: string): Promise<{
  subject: string;
  html_body: string;
  text_body: string;
} | null> {
  try {
    const { data, error } = await supabase.rpc('get_email_template', {
      p_template_name: templateName,
    });

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data[0] || null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

// ============================================================================
// Send Email
// ============================================================================

async function sendEmail(emailItem: any): Promise<boolean> {
  try {
    let subject: string;
    let htmlBody: string;
    let textBody: string;

    // Check if template_data contains embedded html_body/text_body
    // (used by welcome_account_created and other inline templates)
    if (emailItem.template_data?.html_body && emailItem.template_data?.text_body) {
      // Use embedded template content
      subject = emailItem.subject; // Subject is already set in email_queue
      htmlBody = emailItem.template_data.html_body;
      textBody = emailItem.template_data.text_body;
      console.log(`📧 Using embedded template for: ${emailItem.template_name}`);
    } else {
      // Fetch template from database
      const template = await getEmailTemplate(emailItem.template_name);

      if (!template) {
        throw new Error(`Template not found: ${emailItem.template_name}`);
      }

      // Replace variables in subject and body
      subject = replaceTemplateVariables(template.subject, emailItem.template_data);
      htmlBody = replaceTemplateVariables(template.html_body, emailItem.template_data);
      textBody = replaceTemplateVariables(template.text_body, emailItem.template_data);
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: emailItem.recipient_email,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`✅ Email sent to ${emailItem.recipient_email} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${emailItem.recipient_email}:`, error);
    return false;
  }
}

// ============================================================================
// Update Email Status
// ============================================================================

async function updateEmailStatus(
  emailId: string,
  status: 'sent' | 'failed' | 'retrying',
  errorMessage?: string
): Promise<void> {
  try {
    // Get current attempts
    const { data: current } = await supabase
      .from('email_queue')
      .select('attempts, max_attempts')
      .eq('id', emailId)
      .single();

    const updates: any = {
      status,
      last_attempt_at: new Date().toISOString(),
      attempts: (current?.attempts || 0) + 1,
    };

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    // If max attempts reached, mark as failed
    if (current && updates.attempts >= current.max_attempts && status !== 'sent') {
      updates.status = 'failed';
    } else if (status === 'failed' && current && updates.attempts < current.max_attempts) {
      updates.status = 'retrying';
    }

    await supabase
      .from('email_queue')
      .update(updates)
      .eq('id', emailId);

  } catch (error) {
    console.error('Error updating email status:', error);
  }
}

// ============================================================================
// Process Email Queue
// ============================================================================

async function processEmailQueue(): Promise<void> {
  console.log('🔄 Starting email worker...');
  const startTime = Date.now();

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get pending emails
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Error fetching pending emails:', error);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('📭 No pending emails to process');
      return;
    }

    console.log(`📬 Found ${emails.length} emails to process`);

    // Process each email
    for (const email of emails) {
      if (Date.now() - startTime > MAX_RUNTIME) {
        console.log('⏰ Max runtime reached, stopping...');
        break;
      }

      processed++;
      console.log(`\n📧 Processing email ${processed}/${emails.length} (ID: ${email.id})`);
      console.log(`   Template: ${email.template_name}`);
      console.log(`   To: ${email.recipient_email}`);
      console.log(`   Attempts: ${email.attempts}/${email.max_attempts}`);

      const success = await sendEmail(email);

      if (success) {
        succeeded++;
        await updateEmailStatus(email.id, 'sent');
      } else {
        failed++;
        await updateEmailStatus(
          email.id,
          'failed',
          'Failed to send email'
        );
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error) {
    console.error('Error processing email queue:', error);
  } finally {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n📊 Email Worker Summary:`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Succeeded: ${succeeded}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${duration}s`);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('\n📬 BDA Email Worker');
  console.log('==================');

  // Verify configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  // Check SMTP configuration (not required for local Mailpit)
  if (IS_LOCAL) {
    console.log('🔧 Mode: LOCAL DEVELOPMENT (Mailpit)');
    console.log('📮 View emails at: http://127.0.0.1:54324');
  } else {
    console.log('🔧 Mode: PRODUCTION');
    if (!EMAIL_CONFIG.auth?.user || !EMAIL_CONFIG.auth?.pass) {
      console.error('❌ Missing SMTP configuration');
      console.log('   Please set SMTP_USER and SMTP_PASS environment variables');
      process.exit(1);
    }
    console.log(`📧 SMTP: ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
  }

  // Verify email transporter
  try {
    await transporter.verify();
    console.log('✅ Email transporter ready\n');
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error);
    process.exit(1);
  }

  // Process queue
  await processEmailQueue();

  console.log('\n✅ Email worker completed\n');
  process.exit(0);
}

// Run if called directly
// Using ESM-compatible check
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1]?.endsWith('email-worker.ts');

if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processEmailQueue, sendEmail, updateEmailStatus };
