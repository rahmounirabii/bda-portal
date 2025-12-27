/**
 * Reminder Service
 *
 * Service layer for exam reminder system
 * Requirements: task.md Step 5 - Reminder System
 */

import { supabase } from '@/shared/config/supabase.config';
import {
  UpcomingReminder,
  ReminderProcessResult,
  QueuedReminder,
  ReminderStats,
  ReminderResponse,
} from './reminders.types';

// ============================================================================
// Reminder Processing Functions
// ============================================================================

/**
 * Process all pending reminders (48h and 24h)
 * This should be called by a cron job or scheduled task
 *
 * @returns ReminderResponse with processing results
 */
export async function processAllReminders(): Promise<ReminderResponse<ReminderProcessResult[]>> {
  try {
    const { data, error } = await supabase.rpc('process_all_reminders');

    if (error) {
      console.error('Error processing reminders:', error);
      return {
        error: {
          message: error.message || 'Failed to process reminders',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in processAllReminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to process reminders',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Queue 48-hour reminders
 *
 * @returns ReminderResponse with queued reminders
 */
export async function queue48hReminders(): Promise<ReminderResponse<QueuedReminder[]>> {
  try {
    const { data, error } = await supabase.rpc('queue_48h_reminders');

    if (error) {
      console.error('Error queuing 48h reminders:', error);
      return {
        error: {
          message: error.message || 'Failed to queue 48h reminders',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in queue48hReminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to queue 48h reminders',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Queue 24-hour reminders
 *
 * @returns ReminderResponse with queued reminders
 */
export async function queue24hReminders(): Promise<ReminderResponse<QueuedReminder[]>> {
  try {
    const { data, error } = await supabase.rpc('queue_24h_reminders');

    if (error) {
      console.error('Error queuing 24h reminders:', error);
      return {
        error: {
          message: error.message || 'Failed to queue 24h reminders',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in queue24hReminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to queue 24h reminders',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Monitoring Functions
// ============================================================================

/**
 * Get upcoming reminders that need to be sent
 *
 * @returns ReminderResponse with upcoming reminders
 */
export async function getUpcomingReminders(): Promise<ReminderResponse<UpcomingReminder[]>> {
  try {
    const { data, error } = await supabase.rpc('get_upcoming_reminders');

    if (error) {
      console.error('Error getting upcoming reminders:', error);
      return {
        error: {
          message: error.message || 'Failed to get upcoming reminders',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUpcomingReminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get upcoming reminders',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get reminder statistics
 *
 * @returns ReminderResponse with statistics
 */
export async function getReminderStats(): Promise<ReminderResponse<ReminderStats>> {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get pending reminders
    const upcomingResult = await getUpcomingReminders();
    const upcoming = upcomingResult.data || [];

    const pending48h = upcoming.filter(r => r.needs_48h_reminder).length;
    const pending24h = upcoming.filter(r => r.needs_24h_reminder).length;

    // Get sent reminders (from exam_bookings table)
    const { data: sentToday } = await supabase
      .from('exam_bookings')
      .select('id')
      .or(`reminder_48h_sent_at.gte.${todayStart.toISOString()},reminder_24h_sent_at.gte.${todayStart.toISOString()}`);

    const { data: sentThisWeek } = await supabase
      .from('exam_bookings')
      .select('id')
      .or(`reminder_48h_sent_at.gte.${weekStart.toISOString()},reminder_24h_sent_at.gte.${weekStart.toISOString()}`);

    // Get upcoming exams count
    const { data: upcomingExams } = await supabase
      .from('exam_bookings')
      .select('id')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', now.toISOString());

    return {
      data: {
        pending48h,
        pending24h,
        sentToday: sentToday?.length || 0,
        sentThisWeek: sentThisWeek?.length || 0,
        upcomingExams: upcomingExams?.length || 0,
      },
    };
  } catch (error) {
    console.error('Error in getReminderStats:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get reminder stats',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Manual Reminder Functions
// ============================================================================

/**
 * Send a manual reminder for a specific booking
 *
 * @param bookingId - The booking ID to send reminder for
 * @param reminderType - Type of reminder ('48h' or '24h')
 * @returns ReminderResponse with success status
 */
export async function sendManualReminder(
  bookingId: string,
  reminderType: '48h' | '24h'
): Promise<ReminderResponse<boolean>> {
  try {
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('exam_bookings')
      .select(`
        *,
        user:users(id, email, first_name, last_name),
        quiz:quizzes(id, title)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return {
        error: {
          message: 'Booking not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Queue the email (this would typically go through an email service)
    // For now, we just mark the reminder as sent
    const updateField = reminderType === '48h'
      ? { reminder_48h_sent: true, reminder_48h_sent_at: new Date().toISOString() }
      : { reminder_24h_sent: true, reminder_24h_sent_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from('exam_bookings')
      .update(updateField)
      .eq('id', bookingId);

    if (updateError) {
      return {
        error: {
          message: updateError.message || 'Failed to update reminder status',
          code: updateError.code,
        },
      };
    }

    // Log audit event
    try {
      const { logAuditEvent } = await import('@/entities/audit');
      await logAuditEvent({
        event_type: 'reminder_sent',
        description: `Manual ${reminderType} reminder sent`,
        subject_type: 'exam_booking',
        subject_id: bookingId,
        quiz_id: booking.quiz_id,
        event_details: {
          reminder_type: reminderType,
          manual: true,
        },
        security_level: 'medium',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    return { data: true };
  } catch (error) {
    console.error('Error in sendManualReminder:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to send manual reminder',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Reset reminder status for a booking (e.g., after rescheduling)
 *
 * @param bookingId - The booking ID to reset reminders for
 * @returns ReminderResponse with success status
 */
export async function resetReminderStatus(
  bookingId: string
): Promise<ReminderResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('exam_bookings')
      .update({
        reminder_48h_sent: false,
        reminder_48h_sent_at: null,
        reminder_24h_sent: false,
        reminder_24h_sent_at: null,
      })
      .eq('id', bookingId);

    if (error) {
      return {
        error: {
          message: error.message || 'Failed to reset reminder status',
          code: error.code,
        },
      };
    }

    return { data: true };
  } catch (error) {
    console.error('Error in resetReminderStatus:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to reset reminder status',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}
