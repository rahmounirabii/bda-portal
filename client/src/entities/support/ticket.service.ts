import { supabase } from '@/shared/config/supabase.config';
import type {
  SupportTicket,
  TicketWithDetails,
  TicketWithMeta,
  TicketMessage,
  MessageWithUser,
  TicketAttachment,
  AttachmentWithUser,
  TicketStatusHistory,
  TicketTemplate,
  TicketCategory,
  CreateTicketDTO,
  UpdateTicketDTO,
  CreateMessageDTO,
  UpdateMessageDTO,
  UploadAttachmentDTO,
  UpdateTicketStatusDTO,
  AssignTicketDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TicketFilters,
  TicketQueryOptions,
  TicketStats,
  TicketError,
  TicketResult,
  FileValidationResult,
} from './ticket.types';
import { FILE_UPLOAD_CONSTRAINTS } from './ticket.types';

/**
 * Service for Support Ticket operations
 * Handles all ticket-related database interactions and file uploads
 */
export class TicketService {
  // ==========================================================================
  // FILE UPLOAD UTILITIES
  // ==========================================================================

  /**
   * Validate file before upload
   */
  static validateFile(file: File): FileValidationResult {
    // Check file size
    if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Check MIME type
    if (!FILE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: 'File type not allowed',
      };
    }

    // Check extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(extension as any)) {
      return {
        valid: false,
        error: 'File extension not allowed',
      };
    }

    return { valid: true, file };
  }

  /**
   * Upload file to Supabase Storage
   */
  static async uploadFile(file: File, ticketId: string): Promise<TicketResult<string>> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error!,
          },
        };
      }

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${ticketId}/${timestamp}-${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return {
          data: null,
          error: {
            code: error.name,
            message: 'Failed to upload file',
            details: error,
          },
        };
      }

      return { data: data.path, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred during file upload',
          details: err,
        },
      };
    }
  }

  /**
   * Get signed URL for file download
   */
  static async getFileUrl(filePath: string): Promise<TicketResult<string>> {
    try {
      const { data, error } = await supabase.storage
        .from('support-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        return {
          data: null,
          error: {
            code: error.name,
            message: 'Failed to get file URL',
            details: error,
          },
        };
      }

      return { data: data.signedUrl, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while getting file URL',
          details: err,
        },
      };
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filePath: string): Promise<TicketResult<void>> {
    try {
      const { error } = await supabase.storage.from('support-attachments').remove([filePath]);

      if (error) {
        return {
          data: null,
          error: {
            code: error.name,
            message: 'Failed to delete file',
            details: error,
          },
        };
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while deleting file',
          details: err,
        },
      };
    }
  }

  // ==========================================================================
  // USER TICKET OPERATIONS
  // ==========================================================================

  /**
   * Get user's own tickets
   */
  static async getMyTickets(
    filters?: TicketFilters,
    options?: TicketQueryOptions
  ): Promise<TicketResult<TicketWithMeta[]>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User must be authenticated',
          },
        };
      }

      let query = supabase
        .from('support_tickets')
        .select(
          `
          *,
          user:users!user_id(id, first_name, last_name, email),
          assigned_agent:users!assigned_to(id, first_name, last_name, email)
        `
        )
        .eq('user_id', user.id);

      // Apply filters
      query = this.applyTicketFilters(query, filters);

      // Apply sorting
      const sortBy = options?.sort_by || 'created_at';
      const sortOrder = options?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to fetch tickets',
            details: error,
          },
        };
      }

      // Enrich with metadata
      const ticketsWithMeta = await Promise.all(
        (data || []).map(async (ticket: any) => {
          const [messageCount, attachmentCount] = await Promise.all([
            this.getMessageCount(ticket.id),
            this.getAttachmentCount(ticket.id),
          ]);
          return {
            ...ticket,
            message_count: messageCount,
            attachment_count: attachmentCount,
            unread_count: 0, // TODO: Implement unread tracking
          };
        })
      );

      return { data: ticketsWithMeta, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching tickets',
          details: err,
        },
      };
    }
  }

  /**
   * Get a single ticket with full details
   */
  static async getTicketById(id: string): Promise<TicketResult<TicketWithDetails>> {
    try {
      // Fetch ticket with user and agent info
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select(
          `
          *,
          user:users!user_id(id, first_name, last_name, email, role),
          assigned_agent:users!assigned_to(id, first_name, last_name, email, role)
        `
        )
        .eq('id', id)
        .single();

      if (ticketError || !ticket) {
        return {
          data: null,
          error: {
            code: ticketError?.code || 'NOT_FOUND',
            message: 'Ticket not found',
            details: ticketError,
          },
        };
      }

      // Fetch messages with user info
      const { data: messages, error: messagesError } = await supabase
        .from('ticket_messages')
        .select(
          `
          *,
          user:users!user_id(id, first_name, last_name, email, role)
        `
        )
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return {
          data: null,
          error: {
            code: messagesError.code,
            message: 'Failed to fetch messages',
            details: messagesError,
          },
        };
      }

      // Fetch attachments with uploader info
      const { data: attachments, error: attachmentsError } = await supabase
        .from('ticket_attachments')
        .select(
          `
          *,
          uploader:users!uploaded_by(id, first_name, last_name, email)
        `
        )
        .eq('ticket_id', id)
        .order('created_at', { ascending: false });

      if (attachmentsError) {
        return {
          data: null,
          error: {
            code: attachmentsError.code,
            message: 'Failed to fetch attachments',
            details: attachmentsError,
          },
        };
      }

      const ticketWithDetails: TicketWithDetails = {
        ...ticket,
        messages: messages || [],
        attachments: attachments || [],
        message_count: messages?.length || 0,
        unread_count: 0, // TODO: Implement unread tracking
      };

      return { data: ticketWithDetails, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching ticket',
          details: err,
        },
      };
    }
  }

  /**
   * Create a new ticket
   */
  static async createTicket(dto: CreateTicketDTO): Promise<TicketResult<SupportTicket>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User must be authenticated',
          },
        };
      }

      // Create ticket
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: dto.category,
          subject: dto.subject,
          description: dto.description,
          priority: dto.priority || 'normal',
        } as any)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to create ticket',
            details: error,
          },
        };
      }

      // Upload attachments if provided
      if (dto.attachments && dto.attachments.length > 0) {
        await this.uploadTicketAttachments(data.id, dto.attachments);
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while creating ticket',
          details: err,
        },
      };
    }
  }

  /**
   * Add a message to a ticket
   */
  static async addMessage(dto: CreateMessageDTO): Promise<TicketResult<TicketMessage>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User must be authenticated',
          },
        };
      }

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: dto.ticket_id,
          user_id: user.id,
          message: dto.message,
          is_internal_note: dto.is_internal_note || false,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to add message',
            details: error,
          },
        };
      }

      // Upload attachments if provided
      if (dto.attachments && dto.attachments.length > 0) {
        await this.uploadMessageAttachments(dto.ticket_id, data.id, dto.attachments);
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while adding message',
          details: err,
        },
      };
    }
  }

  /**
   * Close user's own ticket
   */
  static async closeTicket(id: string): Promise<TicketResult<SupportTicket>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to close ticket',
            details: error,
          },
        };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while closing ticket',
          details: err,
        },
      };
    }
  }

  // ==========================================================================
  // ADMIN TICKET OPERATIONS
  // ==========================================================================

  /**
   * Get all tickets (admin)
   */
  static async getAllTickets(
    filters?: TicketFilters,
    options?: TicketQueryOptions
  ): Promise<TicketResult<TicketWithMeta[]>> {
    try {
      let query = supabase.from('support_tickets').select(
        `
          *,
          user:users!user_id(id, first_name, last_name, email),
          assigned_agent:users!assigned_to(id, first_name, last_name, email)
        `
      );

      // Apply filters
      query = this.applyTicketFilters(query, filters);

      // Apply sorting
      const sortBy = options?.sort_by || 'created_at';
      const sortOrder = options?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to fetch tickets',
            details: error,
          },
        };
      }

      // Enrich with metadata
      const ticketsWithMeta = await Promise.all(
        (data || []).map(async (ticket: any) => {
          const [messageCount, attachmentCount] = await Promise.all([
            this.getMessageCount(ticket.id),
            this.getAttachmentCount(ticket.id),
          ]);
          return {
            ...ticket,
            message_count: messageCount,
            attachment_count: attachmentCount,
            unread_count: 0,
          };
        })
      );

      return { data: ticketsWithMeta, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching tickets',
          details: err,
        },
      };
    }
  }

  /**
   * Update ticket (admin)
   */
  static async updateTicket(id: string, dto: UpdateTicketDTO): Promise<TicketResult<SupportTicket>> {
    try {
      const { data, error } = await supabase.from('support_tickets').update(dto).eq('id', id).select().single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to update ticket',
            details: error,
          },
        };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while updating ticket',
          details: err,
        },
      };
    }
  }

  /**
   * Update ticket status (admin)
   */
  static async updateTicketStatus(id: string, dto: UpdateTicketStatusDTO): Promise<TicketResult<SupportTicket>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ status: dto.status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to update ticket status',
            details: error,
          },
        };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while updating status',
          details: err,
        },
      };
    }
  }

  /**
   * Assign ticket to agent (admin)
   */
  static async assignTicket(id: string, dto: AssignTicketDTO): Promise<TicketResult<SupportTicket>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: dto.assigned_to })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to assign ticket',
            details: error,
          },
        };
      }

      // Add internal note if provided
      if (dto.note) {
        await this.addMessage({
          ticket_id: id,
          message: dto.note,
          is_internal_note: true,
        });
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while assigning ticket',
          details: err,
        },
      };
    }
  }

  /**
   * Delete ticket (admin)
   */
  static async deleteTicket(id: string): Promise<TicketResult<void>> {
    try {
      const { error } = await supabase.from('support_tickets').delete().eq('id', id);

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to delete ticket',
            details: error,
          },
        };
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while deleting ticket',
          details: err,
        },
      };
    }
  }

  // ==========================================================================
  // ATTACHMENT OPERATIONS
  // ==========================================================================

  /**
   * Upload ticket attachments (initial ticket creation)
   */
  private static async uploadTicketAttachments(ticketId: string, files: File[]): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of files) {
      const uploadResult = await this.uploadFile(file, ticketId);
      if (uploadResult.error || !uploadResult.data) continue;

      await supabase.from('ticket_attachments').insert({
        ticket_id: ticketId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: uploadResult.data,
        file_size: file.size,
        mime_type: file.type,
      });
    }
  }

  /**
   * Upload message attachments
   */
  private static async uploadMessageAttachments(ticketId: string, messageId: string, files: File[]): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of files) {
      const uploadResult = await this.uploadFile(file, ticketId);
      if (uploadResult.error || !uploadResult.data) continue;

      await supabase.from('ticket_attachments').insert({
        ticket_id: ticketId,
        message_id: messageId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: uploadResult.data,
        file_size: file.size,
        mime_type: file.type,
      });
    }
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(id: string): Promise<TicketResult<void>> {
    try {
      // Get attachment to delete file from storage
      const { data: attachment, error: fetchError } = await supabase
        .from('ticket_attachments')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError || !attachment) {
        return {
          data: null,
          error: {
            code: fetchError?.code || 'NOT_FOUND',
            message: 'Attachment not found',
            details: fetchError,
          },
        };
      }

      // Delete from storage
      await this.deleteFile(attachment.file_path);

      // Delete from database
      const { error } = await supabase.from('ticket_attachments').delete().eq('id', id);

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to delete attachment',
            details: error,
          },
        };
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while deleting attachment',
          details: err,
        },
      };
    }
  }

  // ==========================================================================
  // TEMPLATE OPERATIONS (Admin)
  // ==========================================================================

  /**
   * Get all templates (admin)
   */
  static async getTemplates(category?: TicketCategory): Promise<TicketResult<TicketTemplate[]>> {
    try {
      let query = supabase.from('ticket_templates').select('*').eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('title');

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to fetch templates',
            details: error,
          },
        };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching templates',
          details: err,
        },
      };
    }
  }

  /**
   * Create template (admin)
   */
  static async createTemplate(dto: CreateTemplateDTO): Promise<TicketResult<TicketTemplate>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User must be authenticated',
          },
        };
      }

      const { data, error } = await supabase
        .from('ticket_templates')
        .insert({
          ...dto,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to create template',
            details: error,
          },
        };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while creating template',
          details: err,
        },
      };
    }
  }

  /**
   * Update template (admin)
   */
  static async updateTemplate(id: string, dto: UpdateTemplateDTO): Promise<TicketResult<TicketTemplate>> {
    try {
      const { data, error } = await supabase.from('ticket_templates').update(dto).eq('id', id).select().single();

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to update template',
            details: error,
          },
        };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while updating template',
          details: err,
        },
      };
    }
  }

  /**
   * Delete template (admin)
   */
  static async deleteTemplate(id: string): Promise<TicketResult<void>> {
    try {
      const { error } = await supabase.from('ticket_templates').delete().eq('id', id);

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to delete template',
            details: error,
          },
        };
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while deleting template',
          details: err,
        },
      };
    }
  }

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  /**
   * Apply filters to ticket query
   */
  private static applyTicketFilters(query: any, filters?: TicketFilters): any {
    if (!filters) return query;

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.category) {
      if (Array.isArray(filters.category)) {
        query = query.in('category', filters.category);
      } else {
        query = query.eq('category', filters.category);
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in('priority', filters.priority);
      } else {
        query = query.eq('priority', filters.priority);
      }
    }

    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.search) {
      query = query.or(
        `ticket_number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    return query;
  }

  /**
   * Get message count for a ticket
   */
  private static async getMessageCount(ticketId: string): Promise<number> {
    const { count } = await supabase
      .from('ticket_messages')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId);

    return count || 0;
  }

  /**
   * Get attachment count for a ticket
   */
  private static async getAttachmentCount(ticketId: string): Promise<number> {
    const { count } = await supabase
      .from('ticket_attachments')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId);

    return count || 0;
  }

  /**
   * Get ticket statistics (admin)
   */
  static async getTicketStats(): Promise<TicketResult<TicketStats>> {
    try {
      const { data, error } = await supabase.from('support_tickets').select('status, category, priority');

      if (error) {
        return {
          data: null,
          error: {
            code: error.code,
            message: 'Failed to fetch ticket statistics',
            details: error,
          },
        };
      }

      const tickets = data || [];

      // Calculate stats
      const stats: TicketStats = {
        total: tickets.length,
        new: tickets.filter((t) => t.status === 'new').length,
        in_progress: tickets.filter((t) => t.status === 'in_progress').length,
        waiting_user: tickets.filter((t) => t.status === 'waiting_user').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        closed: tickets.filter((t) => t.status === 'closed').length,
        by_category: {
          certification: tickets.filter((t) => t.category === 'certification').length,
          exam: tickets.filter((t) => t.category === 'exam').length,
          pdc: tickets.filter((t) => t.category === 'pdc').length,
          account: tickets.filter((t) => t.category === 'account').length,
          partnership: tickets.filter((t) => t.category === 'partnership').length,
          technical: tickets.filter((t) => t.category === 'technical').length,
          other: tickets.filter((t) => t.category === 'other').length,
        },
        by_priority: {
          low: tickets.filter((t) => t.priority === 'low').length,
          normal: tickets.filter((t) => t.priority === 'normal').length,
          high: tickets.filter((t) => t.priority === 'high').length,
        },
        avg_response_time_hours: 0, // TODO: Calculate from ticket_messages
        avg_resolution_time_hours: 0, // TODO: Calculate from resolved_at - created_at
      };

      return { data: stats, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching statistics',
          details: err,
        },
      };
    }
  }
}
