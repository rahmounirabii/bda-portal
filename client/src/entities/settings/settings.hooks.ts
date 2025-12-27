/**
 * Settings Hooks
 * React Query hooks for settings management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { SettingsService } from './settings.service';
import type { NotificationSettings, UserPreferences, UpdateProfileDTO } from './settings.types';

// Query keys for cache management
export const settingsKeys = {
  all: ['settings'] as const,
  notifications: (userId: string) => [...settingsKeys.all, 'notifications', userId] as const,
  preferences: (userId: string) => [...settingsKeys.all, 'preferences', userId] as const,
};

/**
 * Hook to fetch user notification settings
 */
export function useNotificationSettings(userId: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.notifications(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const result = await SettingsService.getNotificationSettings(userId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      settings,
    }: {
      userId: string;
      settings: Partial<NotificationSettings>;
    }) => {
      const result = await SettingsService.updateNotificationSettings(userId, settings);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.notifications(variables.userId),
      });
      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notification settings.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch user preferences (theme, language)
 */
export function useUserPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.preferences(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const result = await SettingsService.getUserPreferences(userId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: Partial<UserPreferences>;
    }) => {
      const result = await SettingsService.updatePreferences(userId, preferences);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.preferences(variables.userId),
      });
      toast({
        title: 'Preferences Saved',
        description: 'Your preferences have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preferences.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: UpdateProfileDTO;
    }) => {
      const result = await SettingsService.updateProfile(userId, updates);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newPassword: string) => {
      const result = await SettingsService.changePassword(newPassword);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password.',
        variant: 'destructive',
      });
    },
  });
}
