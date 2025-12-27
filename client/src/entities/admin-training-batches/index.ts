/**
 * Admin Training Batches Entity
 * Barrel exports for admin batch management module (US12-13)
 */

// Types
export * from './admin-training-batches.types';

// Service
export { AdminTrainingBatchService } from './admin-training-batches.service';

// Hooks
export {
  useAdminBatches,
  useAdminBatch,
  useBatchTrainees,
  useAllTrainees,
  useAdminBatchStats,
  useECPPartners,
  useUpdateBatchStatus,
  useReviewBatch,
  useCreateTraineeAccounts,
  useCreateSingleTraineeAccount,
} from './admin-training-batches.hooks';
