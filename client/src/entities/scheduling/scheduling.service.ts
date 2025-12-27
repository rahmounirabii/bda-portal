/**
 * Scheduling Service
 *
 * Service layer for exam scheduling and booking management
 * Requirements: task.md Step 4 - Schedule the Exam
 */

import { supabase } from '@/shared/config/supabase.config';
import {
  ExamTimeslot,
  ExamBooking,
  BookingWithDetails,
  CreateBookingSubmission,
  RescheduleBookingSubmission,
  CancelBookingSubmission,
  CreateTimeslotSubmission,
  TimeslotFilters,
  BookingFilters,
  SchedulingResponse,
} from './scheduling.types';

// ============================================================================
// Timeslot Management
// ============================================================================

/**
 * Get available timeslots for a quiz
 *
 * @param filters - Filters for timeslot search
 * @returns SchedulingResponse with array of available timeslots
 */
export async function getAvailableTimeslots(
  filters: TimeslotFilters
): Promise<SchedulingResponse<ExamTimeslot[]>> {
  try {
    const startDate = filters.start_date || new Date();
    const endDate = filters.end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    const { data, error } = await supabase.rpc('get_available_timeslots', {
      p_quiz_id: filters.quiz_id,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (error) {
      console.error('Error getting available timeslots:', error);
      return {
        error: {
          message: error.message || 'Failed to get available timeslots',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getAvailableTimeslots:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get available timeslots',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Check if a timeslot is available
 *
 * @param timeslotId - Timeslot ID to check
 * @returns SchedulingResponse with boolean result
 */
export async function isTimeslotAvailable(
  timeslotId: string
): Promise<SchedulingResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('is_timeslot_available', {
      p_timeslot_id: timeslotId,
    });

    if (error) {
      console.error('Error checking timeslot availability:', error);
      return {
        error: {
          message: error.message || 'Failed to check timeslot availability',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in isTimeslotAvailable:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to check timeslot availability',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Create a new timeslot (Admin only)
 *
 * @param submission - Timeslot creation data
 * @returns SchedulingResponse with created timeslot
 */
export async function createTimeslot(
  submission: CreateTimeslotSubmission
): Promise<SchedulingResponse<ExamTimeslot>> {
  try {
    const { data, error} = await supabase
      .from('exam_timeslots')
      .insert({
        quiz_id: submission.quiz_id,
        certification_product_id: submission.certification_product_id,
        start_time: submission.start_time.toISOString(),
        end_time: submission.end_time.toISOString(),
        timezone: submission.timezone || 'UTC',
        max_capacity: submission.max_capacity || 1,
        notes: submission.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating timeslot:', error);
      return {
        error: {
          message: error.message || 'Failed to create timeslot',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in createTimeslot:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create timeslot',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Booking Management
// ============================================================================

/**
 * Create an exam booking
 *
 * @param submission - Booking creation data
 * @returns SchedulingResponse with booking ID
 */
export async function createExamBooking(
  submission: CreateBookingSubmission
): Promise<SchedulingResponse<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    // Call database function to create booking
    const { data, error } = await supabase.rpc('create_exam_booking', {
      p_user_id: user.id,
      p_quiz_id: submission.quiz_id,
      p_timeslot_id: submission.timeslot_id,
      p_voucher_id: submission.voucher_id || null,
      p_timezone: submission.timezone || 'UTC',
    });

    if (error) {
      console.error('Error creating exam booking:', error);
      return {
        error: {
          message: error.message || 'Failed to create exam booking',
          code: error.code,
        },
      };
    }

    // Log audit event
    try {
      const { logAuditEvent } = await import('@/entities/audit');
      await logAuditEvent({
        event_type: 'exam_registered',
        description: 'User scheduled exam',
        quiz_id: submission.quiz_id,
        subject_type: 'exam_booking',
        subject_id: data,
        event_details: {
          timeslot_id: submission.timeslot_id,
          timezone: submission.timezone,
        },
        security_level: 'high',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    return { data };
  } catch (error) {
    console.error('Error in createExamBooking:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to create exam booking',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user's upcoming bookings
 *
 * @param userId - Optional user ID (defaults to current user)
 * @returns SchedulingResponse with array of upcoming bookings
 */
export async function getUserUpcomingBookings(
  userId?: string
): Promise<SchedulingResponse<ExamBooking[]>> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          error: {
            message: 'User not authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase.rpc('get_user_upcoming_bookings', {
      p_user_id: targetUserId,
    });

    if (error) {
      console.error('Error getting upcoming bookings:', error);
      return {
        error: {
          message: error.message || 'Failed to get upcoming bookings',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserUpcomingBookings:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get upcoming bookings',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get booking by ID with details
 *
 * @param bookingId - Booking ID
 * @returns SchedulingResponse with booking details
 */
export async function getBookingById(
  bookingId: string
): Promise<SchedulingResponse<BookingWithDetails>> {
  try {
    const { data, error } = await supabase
      .from('exam_bookings')
      .select(`
        *,
        quiz:quizzes(id, title, certification_type, time_limit_minutes),
        timeslot:exam_timeslots(*),
        user:users!exam_bookings_user_id_fkey(id, email, first_name, last_name)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error getting booking:', error);
      return {
        error: {
          message: error.message || 'Failed to get booking',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in getBookingById:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get booking',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get booking by confirmation code
 *
 * @param confirmationCode - Confirmation code
 * @returns SchedulingResponse with booking details
 */
export async function getBookingByConfirmationCode(
  confirmationCode: string
): Promise<SchedulingResponse<BookingWithDetails>> {
  try {
    const { data, error } = await supabase
      .from('exam_bookings')
      .select(`
        *,
        quiz:quizzes(id, title, certification_type, time_limit_minutes),
        timeslot:exam_timeslots(*),
        user:users!exam_bookings_user_id_fkey(id, email, first_name, last_name)
      `)
      .eq('confirmation_code', confirmationCode)
      .single();

    if (error) {
      console.error('Error getting booking by confirmation code:', error);
      return {
        error: {
          message: error.message || 'Booking not found',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in getBookingByConfirmationCode:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get booking',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user's booking history
 *
 * @param filters - Optional filters
 * @returns SchedulingResponse with array of bookings
 */
export async function getUserBookingHistory(
  filters?: BookingFilters
): Promise<SchedulingResponse<BookingWithDetails[]>> {
  try {
    let targetUserId = filters?.user_id;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          error: {
            message: 'User not authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        };
      }
      targetUserId = user.id;
    }

    let query = supabase
      .from('exam_bookings')
      .select(`
        *,
        quiz:quizzes(id, title, certification_type, time_limit_minutes),
        timeslot:exam_timeslots(*),
        user:users!exam_bookings_user_id_fkey(id, email, first_name, last_name)
      `)
      .eq('user_id', targetUserId)
      .order('scheduled_start_time', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.quiz_id) {
      query = query.eq('quiz_id', filters.quiz_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting booking history:', error);
      return {
        error: {
          message: error.message || 'Failed to get booking history',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserBookingHistory:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get booking history',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Reschedule an exam booking
 *
 * @param submission - Reschedule submission data
 * @returns SchedulingResponse with updated booking
 */
export async function rescheduleBooking(
  submission: RescheduleBookingSubmission
): Promise<SchedulingResponse<ExamBooking>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    // Get current booking
    const { data: currentBooking, error: fetchError } = await supabase
      .from('exam_bookings')
      .select('*')
      .eq('id', submission.booking_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentBooking) {
      return {
        error: {
          message: 'Booking not found or access denied',
          code: 'NOT_FOUND',
        },
      };
    }

    // Get new timeslot details
    const { data: newTimeslot, error: timeslotError } = await supabase
      .from('exam_timeslots')
      .select('*')
      .eq('id', submission.new_timeslot_id)
      .single();

    if (timeslotError || !newTimeslot) {
      return {
        error: {
          message: 'Timeslot not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check availability
    const availCheck = await isTimeslotAvailable(submission.new_timeslot_id);
    if (availCheck.error || !availCheck.data) {
      return {
        error: {
          message: 'Selected timeslot is not available',
          code: 'TIMESLOT_UNAVAILABLE',
        },
      };
    }

    // Update booking
    const { data, error } = await supabase
      .from('exam_bookings')
      .update({
        timeslot_id: submission.new_timeslot_id,
        scheduled_start_time: newTimeslot.start_time,
        scheduled_end_time: newTimeslot.end_time,
        status: 'rescheduled',
        rescheduled_from_time: currentBooking.scheduled_start_time,
        reschedule_count: currentBooking.reschedule_count + 1,
        reschedule_reason: submission.reschedule_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.booking_id)
      .select()
      .single();

    if (error) {
      console.error('Error rescheduling booking:', error);
      return {
        error: {
          message: error.message || 'Failed to reschedule booking',
          code: error.code,
        },
      };
    }

    // Decrement old timeslot count, increment new timeslot count
    await supabase
      .from('exam_timeslots')
      .update({ current_bookings: currentBooking.timeslot_id ? supabase.rpc('current_bookings - 1') : 0 })
      .eq('id', currentBooking.timeslot_id);

    await supabase
      .from('exam_timeslots')
      .update({ current_bookings: supabase.rpc('current_bookings + 1') })
      .eq('id', submission.new_timeslot_id);

    // Log audit event
    try {
      const { logAuditEvent } = await import('@/entities/audit');
      await logAuditEvent({
        event_type: 'exam_registered',
        description: 'User rescheduled exam',
        quiz_id: currentBooking.quiz_id,
        subject_type: 'exam_booking',
        subject_id: submission.booking_id,
        event_details: {
          old_timeslot: currentBooking.timeslot_id,
          new_timeslot: submission.new_timeslot_id,
          reason: submission.reschedule_reason,
        },
        security_level: 'high',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    return { data };
  } catch (error) {
    console.error('Error in rescheduleBooking:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to reschedule booking',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Cancel an exam booking
 *
 * @param submission - Cancellation submission data
 * @returns SchedulingResponse with updated booking
 */
export async function cancelBooking(
  submission: CancelBookingSubmission
): Promise<SchedulingResponse<ExamBooking>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    // Get current booking
    const { data: currentBooking, error: fetchError } = await supabase
      .from('exam_bookings')
      .select('*')
      .eq('id', submission.booking_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentBooking) {
      return {
        error: {
          message: 'Booking not found or access denied',
          code: 'NOT_FOUND',
        },
      };
    }

    // Update booking
    const { data, error } = await supabase
      .from('exam_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: submission.cancellation_reason,
        cancelled_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.booking_id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling booking:', error);
      return {
        error: {
          message: error.message || 'Failed to cancel booking',
          code: error.code,
        },
      };
    }

    // Decrement timeslot count
    if (currentBooking.timeslot_id) {
      await supabase.rpc('decrement_timeslot_bookings', {
        p_timeslot_id: currentBooking.timeslot_id,
      });
    }

    // Log audit event
    try {
      const { logAuditEvent } = await import('@/entities/audit');
      await logAuditEvent({
        event_type: 'exam_registered',
        description: 'User cancelled exam booking',
        quiz_id: currentBooking.quiz_id,
        subject_type: 'exam_booking',
        subject_id: submission.booking_id,
        event_details: {
          reason: submission.cancellation_reason,
        },
        security_level: 'high',
      });
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }

    return { data };
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to cancel booking',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Get all bookings (Admin only)
 *
 * @param filters - Optional filters
 * @returns SchedulingResponse with array of bookings
 */
export async function getAllBookings(
  filters?: BookingFilters
): Promise<SchedulingResponse<BookingWithDetails[]>> {
  try {
    let query = supabase
      .from('exam_bookings')
      .select(`
        *,
        quiz:quizzes(id, title, certification_type, time_limit_minutes),
        timeslot:exam_timeslots(*),
        user:users!exam_bookings_user_id_fkey(id, email, first_name, last_name)
      `)
      .order('scheduled_start_time', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.quiz_id) {
      query = query.eq('quiz_id', filters.quiz_id);
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting all bookings:', error);
      return {
        error: {
          message: error.message || 'Failed to get bookings',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get bookings',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get all timeslots (Admin only)
 *
 * @param quizId - Optional quiz ID filter
 * @returns SchedulingResponse with array of timeslots
 */
export async function getAllTimeslots(
  quizId?: string
): Promise<SchedulingResponse<ExamTimeslot[]>> {
  try {
    let query = supabase
      .from('exam_timeslots')
      .select('*')
      .order('start_time', { ascending: true });

    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting all timeslots:', error);
      return {
        error: {
          message: error.message || 'Failed to get timeslots',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getAllTimeslots:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get timeslots',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}
