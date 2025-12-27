import type {
  WooCommerceProduct,
  WooCommerceOrder,
  WooCommerceOrderFilters,
  WooCommerceProductsResponse,
  WooCommerceOrdersResponse,
  WooCommerceOrderResponse,
  WooCommerceMarkOrderResponse,
  WooCommerceError,
} from './woocommerce.types';

/**
 * WooCommerce Service
 * Handles API calls to WordPress WooCommerce endpoints
 */

const WP_API_BASE_URL = import.meta.env.VITE_WP_API_BASE_URL || 'http://localhost/wp-json';
const API_NAMESPACE = 'bda-portal/v1/woocommerce';

/**
 * Base fetch function for WooCommerce API calls
 */
async function fetchWooCommerceAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | WooCommerceError> {
  try {
    const url = `${WP_API_BASE_URL}/${API_NAMESPACE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        code: data.code,
      } as WooCommerceError;
    }

    return data as T;
  } catch (error) {
    console.error('WooCommerce API Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    } as WooCommerceError;
  }
}

export class WooCommerceService {
  // ==========================================================================
  // PRODUCT OPERATIONS
  // ==========================================================================

  /**
   * Get all WooCommerce products
   */
  static async getProducts(): Promise<WooCommerceProductsResponse | WooCommerceError> {
    return await fetchWooCommerceAPI<WooCommerceProductsResponse>('/products');
  }

  // ==========================================================================
  // ORDER OPERATIONS
  // ==========================================================================

  /**
   * Get WooCommerce orders with optional filters
   */
  static async getOrders(
    filters?: WooCommerceOrderFilters
  ): Promise<WooCommerceOrdersResponse | WooCommerceError> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.customer_email) params.append('customer_email', filters.customer_email);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';

    return await fetchWooCommerceAPI<WooCommerceOrdersResponse>(endpoint);
  }

  /**
   * Get a specific order by ID
   */
  static async getOrder(orderId: number): Promise<WooCommerceOrderResponse | WooCommerceError> {
    return await fetchWooCommerceAPI<WooCommerceOrderResponse>(`/orders/${orderId}`);
  }

  /**
   * Mark an order as vouchers generated
   */
  static async markOrderVouchersGenerated(
    orderId: number
  ): Promise<WooCommerceMarkOrderResponse | WooCommerceError> {
    return await fetchWooCommerceAPI<WooCommerceMarkOrderResponse>(
      `/orders/${orderId}/mark-vouchers-generated`,
      {
        method: 'POST',
      }
    );
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Check if response is an error
   */
  static isError(response: any): response is WooCommerceError {
    return response && response.success === false;
  }

  /**
   * Get orders for certification products only
   * Filters orders that contain products linked to certifications
   */
  static async getCertificationOrders(
    certificationProductIds: number[]
  ): Promise<WooCommerceOrder[]> {
    if (certificationProductIds.length === 0) {
      return [];
    }

    const allOrders: WooCommerceOrder[] = [];

    // Fetch orders for each certification product
    for (const productId of certificationProductIds) {
      const response = await this.getOrders({
        product_id: productId,
        status: 'completed',
      });

      if (!this.isError(response) && response.data) {
        allOrders.push(...response.data);
      }
    }

    // Remove duplicates (orders with multiple certification products)
    const uniqueOrders = allOrders.reduce((acc, order) => {
      if (!acc.find((o) => o.id === order.id)) {
        acc.push(order);
      }
      return acc;
    }, [] as WooCommerceOrder[]);

    return uniqueOrders;
  }
}
