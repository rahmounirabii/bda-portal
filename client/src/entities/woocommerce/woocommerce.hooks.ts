import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WooCommerceService } from './woocommerce.service';
import type { WooCommerceOrderFilters } from './woocommerce.types';

/**
 * React Query hooks for WooCommerce operations
 */

// =============================================================================
// QUERY KEYS
// =============================================================================

export const woocommerceKeys = {
  all: ['woocommerce'] as const,
  products: () => [...woocommerceKeys.all, 'products'] as const,
  orders: () => [...woocommerceKeys.all, 'orders'] as const,
  ordersList: (filters?: WooCommerceOrderFilters) =>
    [...woocommerceKeys.orders(), 'list', filters] as const,
  order: (id: number) => [...woocommerceKeys.orders(), 'detail', id] as const,
};

// =============================================================================
// PRODUCT HOOKS
// =============================================================================

/**
 * Hook to fetch all WooCommerce products
 */
export const useWooCommerceProducts = () => {
  return useQuery({
    queryKey: woocommerceKeys.products(),
    queryFn: async () => {
      const response = await WooCommerceService.getProducts();
      if (WooCommerceService.isError(response)) {
        throw new Error(response.message);
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// =============================================================================
// ORDER HOOKS
// =============================================================================

/**
 * Hook to fetch WooCommerce orders with filters
 */
export const useWooCommerceOrders = (filters?: WooCommerceOrderFilters) => {
  return useQuery({
    queryKey: woocommerceKeys.ordersList(filters),
    queryFn: async () => {
      const response = await WooCommerceService.getOrders(filters);
      if (WooCommerceService.isError(response)) {
        throw new Error(response.message);
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a specific order
 */
export const useWooCommerceOrder = (orderId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: woocommerceKeys.order(orderId),
    queryFn: async () => {
      const response = await WooCommerceService.getOrder(orderId);
      if (WooCommerceService.isError(response)) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to mark order as vouchers generated
 */
export const useMarkOrderVouchersGenerated = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: number) => {
      const response = await WooCommerceService.markOrderVouchersGenerated(orderId);
      if (WooCommerceService.isError(response)) {
        throw new Error(response.message);
      }
      return response;
    },
    onSuccess: (_, orderId) => {
      // Invalidate orders list and specific order
      queryClient.invalidateQueries({ queryKey: woocommerceKeys.orders() });
      queryClient.invalidateQueries({ queryKey: woocommerceKeys.order(orderId) });
    },
  });
};

/**
 * Hook to get certification orders
 * Fetches orders containing certification products
 */
export const useCertificationOrders = (certificationProductIds: number[]) => {
  return useQuery({
    queryKey: [...woocommerceKeys.orders(), 'certification', certificationProductIds],
    queryFn: async () => {
      return await WooCommerceService.getCertificationOrders(certificationProductIds);
    },
    enabled: certificationProductIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to prefetch WooCommerce products
 */
export const usePrefetchWooCommerceProducts = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: woocommerceKeys.products(),
      queryFn: async () => {
        const response = await WooCommerceService.getProducts();
        if (WooCommerceService.isError(response)) {
          throw new Error(response.message);
        }
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};
