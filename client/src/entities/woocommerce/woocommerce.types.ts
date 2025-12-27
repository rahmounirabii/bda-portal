/**
 * WooCommerce Integration Types
 * Types for WooCommerce products, orders, and customers
 */

// =============================================================================
// WOOCOMMERCE PRODUCT TYPES
// =============================================================================

export interface WooCommerceProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  type: 'simple' | 'grouped' | 'external' | 'variable';
  description: string;
  image: string | null;
  permalink: string;
  created_at: string;
}

// =============================================================================
// WOOCOMMERCE ORDER TYPES
// =============================================================================

export interface WooCommerceCustomer {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface WooCommerceBillingAddress {
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface WooCommerceOrderItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  subtotal?: string;
  total: string;
}

export interface WooCommerceOrder {
  id: number;
  order_number: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  total: string;
  currency: string;
  date_created: string;
  date_completed: string | null;
  customer: WooCommerceCustomer;
  billing?: WooCommerceBillingAddress;
  items: WooCommerceOrderItem[];
  vouchers_generated: boolean;
  vouchers_generated_at?: string;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface WooCommerceOrderFilters {
  status?: string;
  product_id?: number;
  customer_email?: string;
  limit?: number;
  page?: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface WooCommerceProductsResponse {
  success: boolean;
  data: WooCommerceProduct[];
  count: number;
  message?: string;
}

export interface WooCommerceOrdersResponse {
  success: boolean;
  data: WooCommerceOrder[];
  count: number;
  message?: string;
}

export interface WooCommerceOrderResponse {
  success: boolean;
  data: WooCommerceOrder;
  message?: string;
}

export interface WooCommerceMarkOrderResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    vouchers_generated: boolean;
    vouchers_generated_at: string;
  };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface WooCommerceError {
  success: false;
  message: string;
  code?: string;
}
