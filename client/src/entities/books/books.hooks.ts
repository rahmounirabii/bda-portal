import { useQuery, useMutation } from '@tanstack/react-query';
import { BooksService } from './books.service';
import type { BookFilters, UserBook } from './books.types';

/**
 * React hooks for Books operations
 */

// Query keys
export const booksKeys = {
  all: ['books'] as const,
  lists: () => [...booksKeys.all, 'list'] as const,
  list: (email: string, filters?: BookFilters) =>
    [...booksKeys.lists(), email, filters] as const,
};

/**
 * Hook to fetch user's books
 */
export const useUserBooks = (userEmail: string, filters?: BookFilters) => {
  return useQuery({
    queryKey: booksKeys.list(userEmail, filters),
    queryFn: async () => {
      if (!userEmail) {
        throw new Error('User email is required');
      }
      const result = await BooksService.getUserBooks(userEmail, filters);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get book download URL
 */
export const useBookDownload = () => {
  return useMutation({
    mutationFn: async ({
      productId,
      orderId,
    }: {
      productId: number;
      orderId: number;
    }) => {
      const result = await BooksService.getBookDownloadUrl(productId, orderId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
  });
};
