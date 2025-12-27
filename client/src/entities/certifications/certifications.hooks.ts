/**
 * Certifications Hooks
 * React Query hooks for certifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CertificationsService } from './certifications.service';
import type { CertificationFilters } from './certifications.types';

// ============================================
// USER HOOKS
// ============================================

export const useUserCertifications = (userId: string, filters?: CertificationFilters) => {
  return useQuery({
    queryKey: ['user-certifications', userId, filters],
    queryFn: () => CertificationsService.getUserCertifications(userId, filters),
    enabled: !!userId,
  });
};

export const useCertificationById = (id: string) => {
  return useQuery({
    queryKey: ['certification', id],
    queryFn: () => CertificationsService.getCertificationById(id),
    enabled: !!id,
  });
};

export const useCertificationStats = (userId: string) => {
  return useQuery({
    queryKey: ['certification-stats', userId],
    queryFn: () => CertificationsService.getCertificationStats(userId),
    enabled: !!userId,
  });
};

// ============================================
// ADMIN HOOKS (US24: Certification Management)
// ============================================

/**
 * Get all certifications with filters (Admin)
 */
export const useAllCertifications = (filters?: CertificationFilters & { expiring_soon?: boolean }) => {
  return useQuery({
    queryKey: ['all-certifications', filters],
    queryFn: () => CertificationsService.getAllCertifications(filters),
  });
};

/**
 * Get global certification statistics (Admin)
 */
export const useGlobalCertificationStats = () => {
  return useQuery({
    queryKey: ['global-certification-stats'],
    queryFn: () => CertificationsService.getGlobalCertificationStats(),
  });
};

/**
 * Revoke certification mutation (Admin)
 */
export const useRevokeCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      reason,
      adminId,
    }: {
      certificationId: string;
      reason: string;
      adminId: string;
    }) => CertificationsService.revokeCertification(certificationId, reason, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['global-certification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
    },
  });
};

/**
 * Suspend certification mutation (Admin)
 */
export const useSuspendCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      reason,
      adminId,
    }: {
      certificationId: string;
      reason: string;
      adminId: string;
    }) => CertificationsService.suspendCertification(certificationId, reason, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['global-certification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
    },
  });
};

/**
 * Reinstate certification mutation (Admin)
 */
export const useReinstateCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      adminId,
    }: {
      certificationId: string;
      adminId: string;
    }) => CertificationsService.reinstateCertification(certificationId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['global-certification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
    },
  });
};

/**
 * Extend certification mutation (Admin)
 */
export const useExtendCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      additionalMonths,
      adminId,
    }: {
      certificationId: string;
      additionalMonths: number;
      adminId: string;
    }) => CertificationsService.extendCertification(certificationId, additionalMonths, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['global-certification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
    },
  });
};

/**
 * Reassign certification mutation (Admin)
 */
export const useReassignCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      newUserId,
      reason,
      adminId,
    }: {
      certificationId: string;
      newUserId: string;
      reason: string;
      adminId: string;
    }) => CertificationsService.reassignCertification(certificationId, newUserId, reason, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['global-certification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-stats'] });
    },
  });
};

/**
 * Re-issue certificate mutation (Admin)
 */
export const useReissueCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      adminId,
    }: {
      certificationId: string;
      adminId: string;
    }) => CertificationsService.reissueCertificate(certificationId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification'] });
    },
  });
};
