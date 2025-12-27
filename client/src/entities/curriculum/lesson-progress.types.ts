/**
 * Lesson Progress Types
 * Tracks user progress through lessons
 */

import type { Database } from '@/shared/database.types';

// Database row type
export type LessonProgressRow = Database['public']['Tables']['user_lesson_progress']['Row'];
export type LessonProgressInsert = Database['public']['Tables']['user_lesson_progress']['Insert'];
export type LessonProgressUpdate = Database['public']['Tables']['user_lesson_progress']['Update'];

// Progress status enum
export type LessonProgressStatus = 'locked' | 'in_progress' | 'quiz_pending' | 'completed';

// Create progress DTO
export interface CreateLessonProgressDTO {
  user_id: string;
  lesson_id: string;
  status?: LessonProgressStatus;
  progress_percentage?: number;
}

// Lesson progress with lesson details
export interface LessonProgress extends LessonProgressRow {
  lesson?: {
    id: string;
    title: string;
    title_ar?: string | null;
    module_id: string;
    order_index: number;
    quiz_passing_score?: number;
    quiz_required?: boolean;
  };
}

// Update progress DTO
export interface UpdateLessonProgressDTO {
  status?: LessonProgressStatus;
  progress_percentage?: number;
  time_spent_minutes?: number;
  best_quiz_score?: number;
  quiz_attempts_count?: number;
  last_quiz_attempt_id?: string;
  completed_at?: string | null;
}

// Progress summary (from database function)
export interface LessonProgressSummary {
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  locked_lessons: number;
  completion_percentage: number;
}

// Progress filters
export interface LessonProgressFilters {
  user_id?: string;
  lesson_id?: string;
  module_id?: string;
  status?: LessonProgressStatus;
  certification_type?: 'CP' | 'SCP';
}

// Initialize progress options
export interface InitializeLessonProgressOptions {
  user_id: string;
  certification_type: 'CP' | 'SCP';
}

// Lesson unlock status
export interface LessonUnlockStatus {
  lesson_id: string;
  is_unlocked: boolean;
  reason?: string; // Why locked (e.g., "Previous lesson not completed")
  previous_lesson_id?: string;
}
