/**
 * Email Service
 *
 * Service layer for email notifications
 * Requirements: task.md Step 4 - Email Confirmations
 */

import { supabase } from '@/lib/supabase';
import type {
  EmailQueueItem,
  QueueEmailSubmission,
  EmailResponse,
  EmailStatus,
  EmailTemplateName,
} from './email.types';

// ============================================================================
// Queue Email
// ============================================================================

/**
 * Queue an email for sending
 */
export async function queueEmail(
  submission: QueueEmailSubmission
): Promise<EmailResponse<string>> {
  try {
    const { data, error } = await supabase.rpc('queue_email', {
      p_recipient_email: submission.recipient_email,
      p_recipient_name: submission.recipient_name || null,
      p_template_name: submission.template_name,
      p_template_data: submission.template_data,
      p_priority: submission.priority || 5,
      p_scheduled_for: submission.scheduled_for?.toISOString() || new Date().toISOString(),
      p_related_entity_type: submission.related_entity_type || null,
      p_related_entity_id: submission.related_entity_id || null,
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  } catch (error) {
    console.error('Error queueing email:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to queue email',
      },
    };
  }
}

// ============================================================================
// Get Email Queue Items
// ============================================================================

/**
 * Get all emails in queue (admin only)
 */
export async function getEmailQueue(filters?: {
  status?: EmailStatus;
  template_name?: EmailTemplateName;
  limit?: number;
}): Promise<EmailResponse<EmailQueueItem[]>> {
  try {
    let query = supabase
      .from('email_queue')
      .select('*')
      .order('scheduled_for', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.template_name) {
      query = query.eq('template_name', filters.template_name);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching email queue:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch email queue',
      },
    };
  }
}

// ============================================================================
// Get Pending Emails
// ============================================================================

/**
 * Get pending emails ready to be sent
 */
export async function getPendingEmails(
  limit: number = 100
): Promise<EmailResponse<EmailQueueItem[]>> {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching pending emails:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch pending emails',
      },
    };
  }
}

// ============================================================================
// Update Email Status
// ============================================================================

/**
 * Update email status after send attempt
 */
export async function updateEmailStatus(
  emailId: string,
  status: EmailStatus,
  errorMessage?: string
): Promise<EmailResponse<void>> {
  try {
    const updates: any = {
      status,
      last_attempt_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    // Increment attempts
    const { data: current } = await supabase
      .from('email_queue')
      .select('attempts, max_attempts')
      .eq('id', emailId)
      .single();

    if (current) {
      updates.attempts = current.attempts + 1;

      // If max attempts reached, mark as failed
      if (updates.attempts >= current.max_attempts && status !== 'sent') {
        updates.status = 'failed';
      }
    }

    const { error } = await supabase
      .from('email_queue')
      .update(updates)
      .eq('id', emailId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error updating email status:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update email status',
      },
    };
  }
}

// ============================================================================
// Get Email Statistics
// ============================================================================

/**
 * Get email sending statistics (admin only)
 */
export async function getEmailStatistics(): Promise<
  EmailResponse<{
    pending: number;
    sent: number;
    failed: number;
    retrying: number;
  }>
> {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('status');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const stats = {
      pending: 0,
      sent: 0,
      failed: 0,
      retrying: 0,
    };

    data?.forEach((item) => {
      if (item.status in stats) {
        stats[item.status as keyof typeof stats]++;
      }
    });

    return { data: stats };
  } catch (error) {
    console.error('Error fetching email statistics:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch statistics',
      },
    };
  }
}

// ============================================================================
// Helper: Replace Template Variables
// ============================================================================

/**
 * Replace template variables in text
 * Example: "Hello {{name}}" with {name: "John"} => "Hello John"
 */
export function replaceTemplateVariables(
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
// Exports
// ============================================================================

export const EmailService = {
  queueEmail,
  getEmailQueue,
  getPendingEmails,
  updateEmailStatus,
  getEmailStatistics,
  replaceTemplateVariables,
};

export default EmailService;
