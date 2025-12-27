/**
 * Scheduling Hooks
 *
 * React Query hooks for exam scheduling and booking management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SchedulingService from './scheduling.service';
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
  ExamBookingStatus,
} from './scheduling.types';

// ============================================================================
// Query Keys
// ============================================================================

export const schedulingKeys = {
  all: ['scheduling'] as const,
  timeslots: () => [...schedulingKeys.all, 'timeslots'] as const,
  timeslotsByQuiz: (quizId: string) => [...schedulingKeys.timeslots(), quizId] as const,
  availableTimeslots: (filters: TimeslotFilters) => [...schedulingKeys.timeslots(), 'available', filters] as const,
  bookings: () => [...schedulingKeys.all, 'bookings'] as const,
  allBookings: (filters?: BookingFilters) => [...schedulingKeys.bookings(), 'all', filters] as const,
  userBookings: (userId?: string) => [...schedulingKeys.bookings(), 'user', userId] as const,
  upcomingBookings: (userId?: string) => [...schedulingKeys.bookings(), 'upcoming', userId] as const,
  bookingById: (id: string) => [...schedulingKeys.bookings(), id] as const,
  bookingByCode: (code: string) => [...schedulingKeys.bookings(), 'code', code] as const,
  stats: () => [...schedulingKeys.all, 'stats'] as const,
};

// ============================================================================
// Timeslot Queries
// ============================================================================

/**
 * Get all timeslots (admin)
 */
export function useAllTimeslots(quizId?: string) {
  return useQuery({
    queryKey: quizId ? schedulingKeys.timeslotsByQuiz(quizId) : schedulingKeys.timeslots(),
    queryFn: async () => {
      const result = await SchedulingService.getAllTimeslots(quizId);
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
  });
}

/**
 * Get available timeslots for booking
 */
export function useAvailableTimeslots(filters: TimeslotFilters, enabled = true) {
  return useQuery({
    queryKey: schedulingKeys.availableTimeslots(filters),
    queryFn: async () => {
      const result = await SchedulingService.getAvailableTimeslots(filters);
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
    enabled,
  });
}

// ============================================================================
// Booking Queries
// ============================================================================

/**
 * Get all bookings (admin)
 */
export function useAllBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: schedulingKeys.allBookings(filters),
    queryFn: async () => {
      const result = await SchedulingService.getAllBookings(filters);
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
  });
}

/**
 * Get user's upcoming bookings
 */
export function useUpcomingBookings(userId?: string) {
  return useQuery({
    queryKey: schedulingKeys.upcomingBookings(userId),
    queryFn: async () => {
      const result = await SchedulingService.getUserUpcomingBookings(userId);
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
  });
}

/**
 * Get user's booking history
 */
export function useUserBookingHistory(filters?: BookingFilters) {
  return useQuery({
    queryKey: schedulingKeys.userBookings(filters?.user_id),
    queryFn: async () => {
      const result = await SchedulingService.getUserBookingHistory(filters);
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
  });
}

/**
 * Get booking by ID
 */
export function useBookingById(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: schedulingKeys.bookingById(bookingId),
    queryFn: async () => {
      const result = await SchedulingService.getBookingById(bookingId);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: enabled && !!bookingId,
  });
}

/**
 * Get booking by confirmation code
 */
export function useBookingByConfirmationCode(code: string, enabled = true) {
  return useQuery({
    queryKey: schedulingKeys.bookingByCode(code),
    queryFn: async () => {
      const result = await SchedulingService.getBookingByConfirmationCode(code);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: enabled && !!code,
  });
}

// ============================================================================
// Timeslot Mutations
// ============================================================================

/**
 * Create a new timeslot (admin)
 */
export function useCreateTimeslot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: CreateTimeslotSubmission) => {
      const result = await SchedulingService.createTimeslot(submission);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.timeslots() });
    },
  });
}

/**
 * Update a timeslot (admin)
 */
export function useUpdateTimeslot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTimeslotSubmission> }) => {
      // Using the service directly - need to add update function to service
      const { supabase } = await import('@/shared/config/supabase.config');
      const { data: updated, error } = await supabase
        .from('exam_timeslots')
        .update({
          ...data,
          start_time: data.start_time instanceof Date ? data.start_time.toISOString() : data.start_time,
          end_time: data.end_time instanceof Date ? data.end_time.toISOString() : data.end_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.timeslots() });
    },
  });
}

/**
 * Delete a timeslot (admin)
 */
export function useDeleteTimeslot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeslotId: string) => {
      const { supabase } = await import('@/shared/config/supabase.config');
      const { error } = await supabase
        .from('exam_timeslots')
        .delete()
        .eq('id', timeslotId);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.timeslots() });
    },
  });
}

// ============================================================================
// Booking Mutations
// ============================================================================

/**
 * Create exam booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: CreateBookingSubmission) => {
      const result = await SchedulingService.createExamBooking(submission);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.timeslots() });
    },
  });
}

/**
 * Reschedule booking
 */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: RescheduleBookingSubmission) => {
      const result = await SchedulingService.rescheduleBooking(submission);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.timeslots() });
    },
  });
}

/**
 * Cancel booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: CancelBookingSubmission) => {
      const result = await SchedulingService.cancelBooking(submission);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.timeslots() });
    },
  });
}

/**
 * Update booking status (admin)
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: ExamBookingStatus }) => {
      const { supabase } = await import('@/shared/config/supabase.config');
      const { data, error } = await supabase
        .from('exam_bookings')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.bookings() });
    },
  });
}

// ============================================================================
// Stats Query
// ============================================================================

interface SchedulingStats {
  totalTimeslots: number;
  availableTimeslots: number;
  totalBookings: number;
  scheduledBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  upcomingToday: number;
  upcomingThisWeek: number;
}

/**
 * Get scheduling statistics (admin)
 */
export function useSchedulingStats() {
  return useQuery({
    queryKey: schedulingKeys.stats(),
    queryFn: async (): Promise<SchedulingStats> => {
      const { supabase } = await import('@/shared/config/supabase.config');
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get timeslot stats
      const { data: timeslots } = await supabase
        .from('exam_timeslots')
        .select('id, current_bookings, max_capacity');

      const totalTimeslots = timeslots?.length || 0;
      const availableTimeslots = timeslots?.filter(
        (t: any) => t.current_bookings < t.max_capacity
      ).length || 0;

      // Get booking stats
      const { data: bookings } = await supabase
        .from('exam_bookings')
        .select('id, status, scheduled_start_time');

      const totalBookings = bookings?.length || 0;
      const scheduledBookings = bookings?.filter((b: any) => b.status === 'scheduled' || b.status === 'rescheduled').length || 0;
      const completedBookings = bookings?.filter((b: any) => b.status === 'completed').length || 0;
      const cancelledBookings = bookings?.filter((b: any) => b.status === 'cancelled').length || 0;
      const noShowBookings = bookings?.filter((b: any) => b.status === 'no_show').length || 0;

      const upcomingToday = bookings?.filter((b: any) => {
        const bookingDate = new Date(b.scheduled_start_time);
        return (b.status === 'scheduled' || b.status === 'rescheduled') &&
          bookingDate >= now && bookingDate <= todayEnd;
      }).length || 0;

      const upcomingThisWeek = bookings?.filter((b: any) => {
        const bookingDate = new Date(b.scheduled_start_time);
        return (b.status === 'scheduled' || b.status === 'rescheduled') &&
          bookingDate >= now && bookingDate <= weekEnd;
      }).length || 0;

      return {
        totalTimeslots,
        availableTimeslots,
        totalBookings,
        scheduledBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        upcomingToday,
        upcomingThisWeek,
      };
    },
  });
}
