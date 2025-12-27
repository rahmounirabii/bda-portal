/**
 * PDC Hooks
 * React Query hooks for PDC management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PdcsService } from './pdcs.service';
import type {
  PdcFilters,
  CreatePdcEntryDTO,
  UpdatePdcEntryDTO,
  ReviewPdcDTO,
  CertificationType,
} from './pdcs.types';

// Query keys
export const pdcsKeys = {
  all: ['pdcs'] as const,
  lists: () => [...pdcsKeys.all, 'list'] as const,
  list: (filters: PdcFilters) => [...pdcsKeys.lists(), filters] as const,
  details: () => [...pdcsKeys.all, 'detail'] as const,
  detail: (id: string) => [...pdcsKeys.details(), id] as const,
  stats: () => [...pdcsKeys.all, 'stats'] as const,
  userSummary: (userId: string, certType: CertificationType) =>
    [...pdcsKeys.all, 'user-summary', userId, certType] as const,
  programs: () => [...pdcsKeys.all, 'programs'] as const,
};

/**
 * Get PDC entries
 */
export function usePdcEntries(filters: PdcFilters = {}) {
  return useQuery({
    queryKey: pdcsKeys.list(filters),
    queryFn: async () => {
      const result = await PdcsService.getPdcEntries(filters);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * Get single PDC entry
 */
export function usePdcEntry(id: string) {
  return useQuery({
    queryKey: pdcsKeys.detail(id),
    queryFn: async () => {
      const result = await PdcsService.getPdcEntryById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Get PDC statistics
 */
export function usePdcStats() {
  return useQuery({
    queryKey: pdcsKeys.stats(),
    queryFn: async () => {
      const result = await PdcsService.getPdcStats();
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * Get user PDC summary
 */
export function useUserPdcSummary(userId: string, certificationType: CertificationType) {
  return useQuery({
    queryKey: pdcsKeys.userSummary(userId, certificationType),
    queryFn: async () => {
      const result = await PdcsService.getUserPdcSummary(userId, certificationType);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!userId && !!certificationType,
  });
}

/**
 * Get active PDP programs
 */
export function useActivePrograms() {
  return useQuery({
    queryKey: pdcsKeys.programs(),
    queryFn: async () => {
      const result = await PdcsService.getActivePrograms();
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * Create PDC entry
 */
export function useCreatePdcEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, dto }: { userId: string; dto: CreatePdcEntryDTO }) => {
      const result = await PdcsService.createPdcEntry(userId, dto);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdcsKeys.all });
      toast.success('PDC entry submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit PDC entry: ${error.message}`);
    },
  });
}

/**
 * Update PDC entry
 */
export function useUpdatePdcEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePdcEntryDTO }) => {
      const result = await PdcsService.updatePdcEntry(id, dto);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdcsKeys.all });
      toast.success('PDC entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update PDC entry: ${error.message}`);
    },
  });
}

/**
 * Delete PDC entry
 */
export function useDeletePdcEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await PdcsService.deletePdcEntry(id);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdcsKeys.all });
      toast.success('PDC entry deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete PDC entry: ${error.message}`);
    },
  });
}

/**
 * Review PDC entry (Admin)
 */
export function useReviewPdcEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reviewerId,
      dto,
    }: {
      id: string;
      reviewerId: string;
      dto: ReviewPdcDTO;
    }) => {
      const result = await PdcsService.reviewPdcEntry(id, reviewerId, dto);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pdcsKeys.all });
      toast.success(
        variables.dto.status === 'approved' ? 'PDC entry approved' : 'PDC entry rejected'
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to review PDC entry: ${error.message}`);
    },
  });
}

/**
 * Validate program ID
 */
export function useValidateProgramId() {
  return useMutation({
    mutationFn: async (programId: string) => {
      const result = await PdcsService.validateProgramId(programId);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}
