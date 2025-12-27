/**
 * Reminder Types
 *
 * TypeScript types for exam reminder system
 * Requirements: task.md Step 5 - Reminder System
 */

// ============================================================================
// Reminder Types
// ============================================================================

export type ReminderType = '48h' | '24h';

// ============================================================================
// Upcoming Reminder Interface
// ============================================================================

export interface UpcomingReminder {
  booking_id: string;
  user_email: string;
  exam_time: string;
  hours_until_exam: number;
  needs_48h_reminder: boolean;
  needs_24h_reminder: boolean;
  confirmation_code: string;
}

// ============================================================================
// Reminder Processing Result
// ============================================================================

export interface ReminderProcessingResult {
  reminder_type: ReminderType;
  bookings_processed: number;
  emails_queued: number;
}

// ============================================================================
// Reminder Statistics
// ============================================================================

export interface ReminderStatistics {
  reminder_48h: {
    sent: number;
    pending: number;
  };
  reminder_24h: {
    sent: number;
    pending: number;
  };
  total_upcoming_bookings: number;
}

// ============================================================================
// Response Type
// ============================================================================

export interface ReminderResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
