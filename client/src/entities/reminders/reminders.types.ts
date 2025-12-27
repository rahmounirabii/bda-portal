/**
 * Reminder System Types
 *
 * TypeScript types for exam reminder system
 * Requirements: task.md Step 5 - Reminder System
 */

// ============================================================================
// Reminder Types
// ============================================================================

export type ReminderType = '48h' | '24h';

export interface UpcomingReminder {
  booking_id: string;
  user_email: string;
  exam_time: string;
  hours_until_exam: number;
  needs_48h_reminder: boolean;
  needs_24h_reminder: boolean;
  confirmation_code: string;
}

export interface ReminderProcessResult {
  reminder_type: ReminderType;
  bookings_processed: number;
  emails_queued: number;
}

export interface QueuedReminder {
  booking_id: string;
  recipient_email: string;
  exam_time: string;
  queued: boolean;
}

export interface ReminderStats {
  pending48h: number;
  pending24h: number;
  sentToday: number;
  sentThisWeek: number;
  upcomingExams: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ReminderResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// Display Labels
// ============================================================================

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  '48h': '48 Hours Before',
  '24h': '24 Hours Before',
};

export const REMINDER_TYPE_COLORS: Record<ReminderType, string> = {
  '48h': 'bg-blue-100 text-blue-700',
  '24h': 'bg-orange-100 text-orange-700',
};
