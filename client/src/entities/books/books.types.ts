/**
 * Books Entity - Types
 * Manages digital books purchased from WooCommerce
 */

export interface UserBook {
  id: string;
  product_id: number;
  product_name: string;
  sku: string;
  cover_image?: string;
  download_url?: string;
  purchased_at: string;
  expires_at?: string;
  order_id: number;
  order_status: string;
  format?: 'pdf' | 'epub' | 'mobi';
  pages?: number;
  description?: string;
}

export interface BookFilters {
  search?: string;
  format?: 'pdf' | 'epub' | 'mobi';
  expired?: boolean;
}

export interface BookDownloadRequest {
  product_id: number;
  order_id: number;
}

export interface BookError {
  code: string;
  message: string;
  details?: any;
}

export interface BookResult<T> {
  data: T | null;
  error: BookError | null;
}
