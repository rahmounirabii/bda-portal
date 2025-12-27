import type { UserBook, BookFilters, BookResult } from './books.types';

/**
 * Books Service
 * Fetches user's purchased books from WordPress/WooCommerce
 */

const WP_API_BASE_URL = import.meta.env.VITE_WP_API_BASE_URL || 'http://localhost:8080/wp-json';

export class BooksService {
  /**
   * Get user's purchased books
   */
  static async getUserBooks(
    userEmail: string,
    filters?: BookFilters
  ): Promise<BookResult<UserBook[]>> {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('customer_email', userEmail);
      params.append('status', 'completed'); // Only completed orders

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const endpoint = `${WP_API_BASE_URL}/bda-portal/v1/woocommerce/user-books?${params}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Return empty array for 404 (endpoint not available yet)
        if (response.status === 404) {
          console.warn('WordPress endpoint not available. Please flush permalinks in WP Admin.');
          return { data: [], error: null };
        }
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: `Failed to fetch books: ${response.statusText}`,
          },
        };
      }

      const result = await response.json();

      if (!result.success) {
        return {
          data: null,
          error: {
            code: result.code || 'API_ERROR',
            message: result.message || 'Failed to fetch books',
          },
        };
      }

      // Filter by format if specified
      let books = result.data || [];
      if (filters?.format) {
        books = books.filter((book: UserBook) => book.format === filters.format);
      }

      // Filter expired if specified
      if (filters?.expired !== undefined) {
        const now = new Date();
        books = books.filter((book: UserBook) => {
          if (!book.expires_at) return !filters.expired; // No expiry = not expired
          const expiryDate = new Date(book.expires_at);
          const isExpired = expiryDate < now;
          return filters.expired ? isExpired : !isExpired;
        });
      }

      return { data: books, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching books',
          details: err,
        },
      };
    }
  }

  /**
   * Get download URL for a book
   */
  static async getBookDownloadUrl(
    productId: number,
    orderId: number
  ): Promise<BookResult<string>> {
    try {
      const endpoint = `${WP_API_BASE_URL}/bda-portal/v1/woocommerce/book-download`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
        }),
      });

      if (!response.ok) {
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to get download URL',
          },
        };
      }

      const result = await response.json();

      if (!result.success || !result.data?.download_url) {
        return {
          data: null,
          error: {
            code: 'NO_DOWNLOAD_URL',
            message: 'Download URL not available',
          },
        };
      }

      return { data: result.data.download_url, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          details: err,
        },
      };
    }
  }
}
