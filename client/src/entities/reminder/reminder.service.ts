/**
 * Reminder Service
 *
 * Service layer for exam reminder system
 * Requirements: task.md Step 5 - Reminder System
 */

import { supabase } from '@/lib/supabase';
import type {
  UpcomingReminder,
  ReminderProcessingResult,
  ReminderStatistics,
  ReminderResponse,
} from './reminder.types';

// ============================================================================
// Process All Reminders
// ============================================================================

/**
 * Process both 48h and 24h reminders
 * This should be called by a cron job every hour
 */
export async function processAllReminders(): Promise<
  ReminderResponse<ReminderProcessingResult[]>
> {
  try {
    const { data, error } = await supabase.rpc('process_all_reminders');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error processing reminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to process reminders',
      },
    };
  }
}

// ============================================================================
// Queue 48h Reminders
// ============================================================================

/**
 * Queue 48-hour reminders for upcoming exams
 */
export async function queue48hReminders(): Promise<
  ReminderResponse<UpcomingReminder[]>
> {
  try {
    const { data, error } = await supabase.rpc('queue_48h_reminders');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error queueing 48h reminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to queue 48h reminders',
      },
    };
  }
}

// ============================================================================
// Queue 24h Reminders
// ============================================================================

/**
 * Queue 24-hour reminders for upcoming exams
 */
export async function queue24hReminders(): Promise<
  ReminderResponse<UpcomingReminder[]>
> {
  try {
    const { data, error } = await supabase.rpc('queue_24h_reminders');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error queueing 24h reminders:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to queue 24h reminders',
      },
    };
  }
}

// ============================================================================
// Get Upcoming Reminders
// ============================================================================

/**
 * Get list of bookings that need reminders (for monitoring/dashboard)
 */
export async function getUpcomingReminders(): Promise<
  ReminderResponse<UpcomingReminder[]>
> {
  try {
    const { data, error } = await supabase.rpc('get_upcoming_reminders');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    return {
      error: {
        message:
          error instanceof Error ? error.message : 'Failed to fetch upcoming reminders',
      },
    };
  }
}

// ============================================================================
// Get Reminder Statistics
// ============================================================================

/**
 * Get statistics about reminders (for admin dashboard)
 */
export async function getReminderStatistics(): Promise<
  ReminderResponse<ReminderStatistics>
> {
  try {
    const { data, error } = await supabase
      .from('exam_bookings')
      .select('reminder_48h_sent, reminder_24h_sent, status, scheduled_start_time')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', new Date().toISOString());

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    // Calculate statistics
    let sent48h = 0;
    let pending48h = 0;
    let sent24h = 0;
    let pending24h = 0;

    data?.forEach((booking: any) => {
      if (booking.reminder_48h_sent) {
        sent48h++;
      } else {
        pending48h++;
      }

      if (booking.reminder_24h_sent) {
        sent24h++;
      } else {
        pending24h++;
      }
    });

    const stats: ReminderStatistics = {
      reminder_48h: {
        sent: sent48h,
        pending: pending48h,
      },
      reminder_24h: {
        sent: sent24h,
        pending: pending24h,
      },
      total_upcoming_bookings: data?.length || 0,
    };

    return { data: stats };
  } catch (error) {
    console.error('Error fetching reminder statistics:', error);
    return {
      error: {
        message:
          error instanceof Error ? error.message : 'Failed to fetch reminder statistics',
      },
    };
  }
}

// ============================================================================
// Get Booking Reminder Status
// ============================================================================

/**
 * Get reminder status for a specific booking
 */
export async function getBookingReminderStatus(bookingId: string): Promise<
  ReminderResponse<{
    reminder_48h_sent: boolean;
    reminder_48h_sent_at?: string;
    reminder_24h_sent: boolean;
    reminder_24h_sent_at?: string;
  }>
> {
  try {
    const { data, error } = await supabase
      .from('exam_bookings')
      .select(
        'reminder_48h_sent, reminder_48h_sent_at, reminder_24h_sent, reminder_24h_sent_at'
      )
      .eq('id', bookingId)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  } catch (error) {
    console.error('Error fetching booking reminder status:', error);
    return {
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch booking reminder status',
      },
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export const ReminderService = {
  processAllReminders,
  queue48hReminders,
  queue24hReminders,
  getUpcomingReminders,
  getReminderStatistics,
  getBookingReminderStatus,
};

export default ReminderService;
