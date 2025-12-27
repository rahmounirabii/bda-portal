/**
 * Reminder Hooks
 *
 * React Query hooks for exam reminder system
 * Requirements: task.md Step 5 - Reminder System
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ReminderService from './reminders.service';
import { UpcomingReminder, ReminderProcessResult, ReminderStats } from './reminders.types';

// ============================================================================
// Query Keys
// ============================================================================

export const reminderKeys = {
  all: ['reminders'] as const,
  upcoming: () => [...reminderKeys.all, 'upcoming'] as const,
  stats: () => [...reminderKeys.all, 'stats'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Get upcoming reminders that need to be sent
 */
export function useUpcomingReminders() {
  return useQuery({
    queryKey: reminderKeys.upcoming(),
    queryFn: async (): Promise<UpcomingReminder[]> => {
      const result = await ReminderService.getUpcomingReminders();
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Get reminder statistics
 */
export function useReminderStats() {
  return useQuery({
    queryKey: reminderKeys.stats(),
    queryFn: async (): Promise<ReminderStats> => {
      const result = await ReminderService.getReminderStats();
      if (result.error) throw new Error(result.error.message);
      return result.data || {
        pending48h: 0,
        pending24h: 0,
        sentToday: 0,
        sentThisWeek: 0,
        upcomingExams: 0,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Process all pending reminders
 */
export function useProcessReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ReminderProcessResult[]> => {
      const result = await ReminderService.processAllReminders();
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

/**
 * Queue 48h reminders
 */
export function useQueue48hReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await ReminderService.queue48hReminders();
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

/**
 * Queue 24h reminders
 */
export function useQueue24hReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await ReminderService.queue24hReminders();
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

/**
 * Send manual reminder for a specific booking
 */
export function useSendManualReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reminderType }: { bookingId: string; reminderType: '48h' | '24h' }) => {
      const result = await ReminderService.sendManualReminder(bookingId, reminderType);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

/**
 * Reset reminder status for a booking
 */
export function useResetReminderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const result = await ReminderService.resetReminderStatus(bookingId);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}
