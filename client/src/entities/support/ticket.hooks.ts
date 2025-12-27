import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketService } from './ticket.service';
import type {
  SupportTicket,
  TicketWithDetails,
  TicketWithMeta,
  TicketMessage,
  TicketTemplate,
  TicketStats,
  TicketCategory,
  CreateTicketDTO,
  UpdateTicketDTO,
  CreateMessageDTO,
  UpdateMessageDTO,
  UpdateTicketStatusDTO,
  AssignTicketDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TicketFilters,
  TicketQueryOptions,
} from './ticket.types';

/**
 * React hooks for Support Ticket operations
 * Uses React Query for data fetching and caching
 */

// =============================================================================
// QUERY KEYS
// =============================================================================

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters?: TicketFilters, options?: TicketQueryOptions) =>
    [...ticketKeys.lists(), { filters, options }] as const,
  myTickets: (filters?: TicketFilters, options?: TicketQueryOptions) =>
    [...ticketKeys.all, 'my-tickets', { filters, options }] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  templates: () => [...ticketKeys.all, 'templates'] as const,
  template: (category?: string) => [...ticketKeys.templates(), category] as const,
  stats: () => [...ticketKeys.all, 'stats'] as const,
};

// =============================================================================
// USER TICKET HOOKS
// =============================================================================

/**
 * Hook to fetch user's own tickets
 */
export const useMyTickets = (filters?: TicketFilters, options?: TicketQueryOptions) => {
  return useQuery({
    queryKey: ticketKeys.myTickets(filters, options),
    queryFn: async () => {
      const result = await TicketService.getMyTickets(filters, options);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a single ticket with full details
 */
export const useTicket = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const result = await TicketService.getTicketById(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (fresher data for active tickets)
  });
};

/**
 * Hook to create a new ticket
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTicketDTO) => {
      const result = await TicketService.createTicket(dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate my tickets list
      queryClient.invalidateQueries({ queryKey: ticketKeys.myTickets() });
    },
  });
};

/**
 * Hook to add a message to a ticket
 */
export const useAddMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateMessageDTO) => {
      const result = await TicketService.addMessage(dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate specific ticket to refresh messages
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(data.ticket_id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.myTickets() });
    },
  });
};

/**
 * Hook to close user's own ticket
 */
export const useCloseTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await TicketService.closeTicket(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate ticket and lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.myTickets() });
    },
  });
};

// =============================================================================
// ADMIN TICKET HOOKS
// =============================================================================

/**
 * Hook to fetch all tickets (admin)
 */
export const useAllTickets = (filters?: TicketFilters, options?: TicketQueryOptions) => {
  return useQuery({
    queryKey: ticketKeys.list(filters, options),
    queryFn: async () => {
      const result = await TicketService.getAllTickets(filters, options);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to update a ticket (admin)
 */
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTicketDTO }) => {
      const result = await TicketService.updateTicket(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate specific ticket and lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
};

/**
 * Hook to update ticket status (admin)
 */
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTicketStatusDTO }) => {
      const result = await TicketService.updateTicketStatus(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate specific ticket and lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
};

/**
 * Hook to assign ticket to agent (admin)
 */
export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: AssignTicketDTO }) => {
      const result = await TicketService.assignTicket(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate specific ticket and lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};

/**
 * Hook to delete a ticket (admin)
 */
export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await TicketService.deleteTicket(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return id;
    },
    onSuccess: (id) => {
      // Invalidate specific ticket and lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
};

// =============================================================================
// ATTACHMENT HOOKS
// =============================================================================

/**
 * Hook to get file download URL
 */
export const useFileUrl = (filePath: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['file-url', filePath],
    queryFn: async () => {
      const result = await TicketService.getFileUrl(filePath);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes (signed URLs last 1 hour)
  });
};

/**
 * Hook to delete an attachment
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ticketId }: { id: string; ticketId: string }) => {
      const result = await TicketService.deleteAttachment(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return { id, ticketId };
    },
    onSuccess: ({ ticketId }) => {
      // Invalidate ticket to refresh attachments
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
};

// =============================================================================
// TEMPLATE HOOKS (Admin)
// =============================================================================

/**
 * Hook to fetch ticket templates (admin)
 */
export const useTemplates = (category?: TicketCategory) => {
  return useQuery({
    queryKey: ticketKeys.template(category),
    queryFn: async () => {
      const result = await TicketService.getTemplates(category);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a template (admin)
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTemplateDTO) => {
      const result = await TicketService.createTemplate(dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: ticketKeys.templates() });
    },
  });
};

/**
 * Hook to update a template (admin)
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTemplateDTO }) => {
      const result = await TicketService.updateTemplate(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: ticketKeys.templates() });
    },
  });
};

/**
 * Hook to delete a template (admin)
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await TicketService.deleteTemplate(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return id;
    },
    onSuccess: () => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: ticketKeys.templates() });
    },
  });
};

// =============================================================================
// STATISTICS HOOKS (Admin)
// =============================================================================

/**
 * Hook to fetch ticket statistics (admin)
 */
export const useTicketStats = () => {
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: async () => {
      const result = await TicketService.getTicketStats();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to prefetch a ticket (for optimistic loading)
 */
export const usePrefetchTicket = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ticketKeys.detail(id),
      queryFn: async () => {
        const result = await TicketService.getTicketById(id);
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.data!;
      },
      staleTime: 1 * 60 * 1000,
    });
  };
};

/**
 * Hook to validate file before upload
 */
export const useValidateFile = () => {
  return (file: File) => {
    return TicketService.validateFile(file);
  };
};

/**
 * Hook for real-time ticket updates (using Supabase Realtime)
 * TODO: Implement when real-time feature is needed
 */
export const useTicketRealtime = (ticketId: string) => {
  const queryClient = useQueryClient();

  // TODO: Set up Supabase Realtime subscription
  // useEffect(() => {
  //   const channel = supabase
  //     .channel(`ticket:${ticketId}`)
  //     .on('postgres_changes', {
  //       event: '*',
  //       schema: 'public',
  //       table: 'support_tickets',
  //       filter: `id=eq.${ticketId}`,
  //     }, () => {
  //       queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
  //     })
  //     .subscribe();
  //
  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [ticketId, queryClient]);
};
