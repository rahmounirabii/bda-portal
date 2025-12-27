/**
 * Partner Management Hooks
 * React Query hooks for partner management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PartnersService } from './partners.service';
import type { PartnerFilters, UpdatePartnerDTO } from './partners.types';

// Query keys
export const partnersKeys = {
  all: ['partners'] as const,
  lists: () => [...partnersKeys.all, 'list'] as const,
  list: (filters: PartnerFilters) => [...partnersKeys.lists(), filters] as const,
  details: () => [...partnersKeys.all, 'detail'] as const,
  detail: (id: string) => [...partnersKeys.details(), id] as const,
  stats: () => [...partnersKeys.all, 'stats'] as const,
};

/**
 * Get all partners
 */
export function usePartners(filters: PartnerFilters = {}) {
  return useQuery({
    queryKey: partnersKeys.list(filters),
    queryFn: async () => {
      const result = await PartnersService.getPartners(filters);
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * Get single partner
 */
export function usePartner(id: string) {
  return useQuery({
    queryKey: partnersKeys.detail(id),
    queryFn: async () => {
      const result = await PartnersService.getPartnerById(id);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Get partner statistics
 */
export function usePartnerStats() {
  return useQuery({
    queryKey: partnersKeys.stats(),
    queryFn: async () => {
      const result = await PartnersService.getPartnerStats();
      if (result.error) throw result.error;
      return result.data;
    },
  });
}

/**
 * Update partner
 */
export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePartnerDTO }) => {
      const result = await PartnersService.updatePartner(id, dto);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnersKeys.all });
      toast.success('Partner updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update partner: ${error.message}`);
    },
  });
}

/**
 * Toggle partner active status
 */
export function useTogglePartnerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const result = await PartnersService.togglePartnerStatus(id, is_active);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partnersKeys.all });
      toast.success(variables.is_active ? 'Partner activated' : 'Partner deactivated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle partner status: ${error.message}`);
    },
  });
}
