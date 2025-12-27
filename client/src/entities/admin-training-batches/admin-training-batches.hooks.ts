/**
 * Admin Training Batch Hooks
 * React Query hooks for admin batch management (US12-13)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminTrainingBatchService } from './admin-training-batches.service';
import type {
  AdminBatchFilters,
  AdminTraineeFilters,
  BatchReviewAction,
  BulkCreateAccountsDTO,
} from './admin-training-batches.types';

// Query keys
const QUERY_KEYS = {
  batches: 'admin-training-batches',
  batch: 'admin-training-batch',
  trainees: 'admin-batch-trainees',
  allTrainees: 'admin-all-trainees',
  stats: 'admin-batch-stats',
  partners: 'ecp-partners',
};

// =============================================================================
// Batch Queries
// =============================================================================

export function useAdminBatches(filters?: AdminBatchFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.batches, filters],
    queryFn: async () => {
      const { data, error } = await AdminTrainingBatchService.getAllBatches(filters);
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminBatch(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.batch, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await AdminTrainingBatchService.getBatchById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Trainee Queries
// =============================================================================

export function useBatchTrainees(batchId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.trainees, batchId],
    queryFn: async () => {
      if (!batchId) return [];
      const { data, error } = await AdminTrainingBatchService.getBatchTrainees(batchId);
      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
  });
}

export function useAllTrainees(filters?: AdminTraineeFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.allTrainees, filters],
    queryFn: async () => {
      const { data, error } = await AdminTrainingBatchService.getAllTrainees(filters);
      if (error) throw error;
      return data;
    },
  });
}

// =============================================================================
// Stats Query
// =============================================================================

export function useAdminBatchStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: async () => {
      const { data, error } = await AdminTrainingBatchService.getStats();
      if (error) throw error;
      return data;
    },
  });
}

// =============================================================================
// Partners Query
// =============================================================================

export function useECPPartners() {
  return useQuery({
    queryKey: [QUERY_KEYS.partners],
    queryFn: async () => {
      const { data, error } = await AdminTrainingBatchService.getECPPartners();
      if (error) throw error;
      return data;
    },
  });
}

// =============================================================================
// Mutations
// =============================================================================

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await AdminTrainingBatchService.updateBatchStatus(id, status);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batch] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

export function useReviewBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: BatchReviewAction) => {
      const { data, error } = await AdminTrainingBatchService.reviewBatch(action);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batches] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.batch] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.trainees] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

export function useCreateTraineeAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: BulkCreateAccountsDTO) => {
      const { data, error } = await AdminTrainingBatchService.createTraineeAccounts(dto);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.trainees] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allTrainees] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

export function useCreateSingleTraineeAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      traineeId,
      options,
    }: {
      traineeId: string;
      options?: {
        send_welcome_email?: boolean;
        activate_membership?: boolean;
        membership_type?: 'basic' | 'professional';
        grant_curriculum_access?: boolean;
      };
    }) => {
      const { data, error } = await AdminTrainingBatchService.createSingleTraineeAccount(
        traineeId,
        options
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.trainees] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.allTrainees] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}
