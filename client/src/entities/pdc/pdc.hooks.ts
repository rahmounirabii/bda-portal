import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PDCService } from './pdc.service';
import type { PDCFilters, CreatePDCEntryDTO, CertificationType } from './pdc.types';

/**
 * React hooks for PDC operations
 */

// Query keys
export const pdcKeys = {
  all: ['pdc'] as const,
  lists: () => [...pdcKeys.all, 'list'] as const,
  list: (userId: string, filters?: PDCFilters) =>
    [...pdcKeys.lists(), userId, filters] as const,
  summaries: () => [...pdcKeys.all, 'summary'] as const,
  summary: (userId: string, certType: CertificationType) =>
    [...pdcKeys.summaries(), userId, certType] as const,
  programs: () => [...pdcKeys.all, 'programs'] as const,
};

/**
 * Hook to fetch user's PDC entries
 */
export const useUserPDCEntries = (userId: string, filters?: PDCFilters) => {
  return useQuery({
    queryKey: pdcKeys.list(userId, filters),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const result = await PDCService.getUserPDCEntries(userId, filters);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get PDC summary
 */
export const usePDCSummary = (userId: string, certType: CertificationType) => {
  return useQuery({
    queryKey: pdcKeys.summary(userId, certType),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const result = await PDCService.getPDCSummary(userId, certType);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create PDC entry
 */
export const useCreatePDCEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, dto }: { userId: string; dto: CreatePDCEntryDTO }) => {
      const result = await PDCService.createPDCEntry(userId, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdcKeys.all });
    },
  });
};

/**
 * Hook to update PDC entry
 */
export const useUpdatePDCEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      dto,
    }: {
      entryId: string;
      dto: Partial<CreatePDCEntryDTO>;
    }) => {
      const result = await PDCService.updatePDCEntry(entryId, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdcKeys.all });
    },
  });
};

/**
 * Hook to delete PDC entry
 */
export const useDeletePDCEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const result = await PDCService.deletePDCEntry(entryId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdcKeys.all });
    },
  });
};

/**
 * Hook to get active PDP programs
 */
export const useActivePDPPrograms = () => {
  return useQuery({
    queryKey: pdcKeys.programs(),
    queryFn: async () => {
      const result = await PDCService.getActivePDPPrograms();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to validate program ID
 */
export const useValidateProgramId = () => {
  return useMutation({
    mutationFn: async (programId: string) => {
      const result = await PDCService.validateProgramId(programId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
};
