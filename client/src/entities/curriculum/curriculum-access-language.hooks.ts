/**
 * React hooks for Learning System access (language-based)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LearningSystemAccessService,
  type Language,
  type UserAccessSummary,
  type AccessCheckResult,
} from './curriculum-access-language.service';

/**
 * Hook to check access for a specific language
 */
export function useLanguageAccess(userId: string | undefined, language: Language) {
  return useQuery({
    queryKey: ['learning-system-access', userId, language],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const result = await LearningSystemAccessService.checkAccess(userId, language);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get all user accesses (EN and AR)
 */
export function useUserAccesses(userId: string | undefined) {
  return useQuery({
    queryKey: ['learning-system-accesses', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const result = await LearningSystemAccessService.getUserAccesses(userId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get available languages for user
 */
export function useAvailableLanguages(userId: string | undefined) {
  return useQuery({
    queryKey: ['learning-system-languages', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const result = await LearningSystemAccessService.getAvailableLanguages(userId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check Question Bank access
 */
export function useQuestionBankAccess(userId: string | undefined, language: Language) {
  return useQuery({
    queryKey: ['question-bank-access', userId, language],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const result = await LearningSystemAccessService.hasQuestionBankAccess(
        userId,
        language
      );
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to check Flashcards access
 */
export function useFlashcardsAccess(userId: string | undefined, language: Language) {
  return useQuery({
    queryKey: ['flashcards-access', userId, language],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const result = await LearningSystemAccessService.hasFlashcardsAccess(
        userId,
        language
      );
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to grant access (admin only)
 */
export function useGrantAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      language,
      validityMonths,
      includesQuestionBank,
      includesFlashcards,
    }: {
      userId: string;
      language: Language;
      validityMonths?: number;
      includesQuestionBank?: boolean;
      includesFlashcards?: boolean;
    }) => {
      const result = await LearningSystemAccessService.grantAccess(
        userId,
        language,
        validityMonths,
        includesQuestionBank,
        includesFlashcards
      );
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['learning-system-access', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['learning-system-accesses', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-learning-system-access'],
      });
    },
  });
}

/**
 * Hook to revoke access (admin only)
 */
export function useRevokeAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      language,
    }: {
      userId: string;
      language: Language;
    }) => {
      const result = await LearningSystemAccessService.revokeAccess(userId, language);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['learning-system-access', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['learning-system-accesses', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-learning-system-access'],
      });
    },
  });
}

/**
 * Hook to get all users with access (admin only)
 */
export function useAdminAccessList() {
  return useQuery({
    queryKey: ['admin-learning-system-access'],
    queryFn: async () => {
      const result = await LearningSystemAccessService.getAllUsersWithAccess();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
