/**
 * Types for Support Ticket System
 *
 * Defines all TypeScript types and interfaces for the Support feature
 * Based on Supabase schema: support_tickets, ticket_messages, ticket_attachments,
 * ticket_status_history, ticket_templates
 */

// =============================================================================
// ENUMS
// =============================================================================

export type TicketCategory =
  | 'certification'
  | 'exam'
  | 'pdc'
  | 'account'
  | 'partnership'
  | 'technical'
  | 'other';

export type TicketPriority = 'low' | 'normal' | 'high';

export type TicketStatus = 'new' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

// =============================================================================
// DATABASE TYPES (matching Supabase schema)
// =============================================================================

/**
 * Support Ticket from database
 */
export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  assigned_to: string | null;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

/**
 * Ticket Message from database
 */
export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Ticket Attachment from database
 */
export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

/**
 * Ticket Status History from database
 */
export interface TicketStatusHistory {
  id: string;
  ticket_id: string;
  changed_by: string;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  change_reason: string | null;
  created_at: string;
}

/**
 * Ticket Template from database (admin only)
 */
export interface TicketTemplate {
  id: string;
  title: string;
  category: TicketCategory | null;
  content: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// EXTENDED TYPES (with relations and computed data)
// =============================================================================

/**
 * User info for ticket display
 */
export interface TicketUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

/**
 * Message with user info
 */
export interface MessageWithUser extends TicketMessage {
  user: TicketUser;
}

/**
 * Attachment with uploader info
 */
export interface AttachmentWithUser extends TicketAttachment {
  uploader: TicketUser;
}

/**
 * Ticket with full details (user, agent, messages, attachments)
 */
export interface TicketWithDetails extends SupportTicket {
  user: TicketUser;
  assigned_agent?: TicketUser | null;
  messages: MessageWithUser[];
  attachments: AttachmentWithUser[];
  status_history?: TicketStatusHistory[];
  message_count?: number;
  unread_count?: number;
}

/**
 * Ticket with basic metadata (for lists)
 */
export interface TicketWithMeta extends SupportTicket {
  user: TicketUser;
  assigned_agent?: TicketUser | null;
  latest_message?: TicketMessage;
  message_count: number;
  unread_count: number;
  attachment_count?: number;
}

// =============================================================================
// DTO TYPES (for creating/updating)
// =============================================================================

/**
 * Data Transfer Object for creating a ticket
 */
export interface CreateTicketDTO {
  category: TicketCategory;
  subject: string;
  description: string;
  priority?: TicketPriority;
  attachments?: File[];
}

/**
 * Data Transfer Object for updating a ticket
 */
export interface UpdateTicketDTO {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string | null;
}

/**
 * Data Transfer Object for creating a message
 */
export interface CreateMessageDTO {
  ticket_id: string;
  message: string;
  is_internal_note?: boolean;
  attachments?: File[];
}

/**
 * Data Transfer Object for updating a message
 */
export interface UpdateMessageDTO {
  message: string;
}

/**
 * Data Transfer Object for uploading attachment
 */
export interface UploadAttachmentDTO {
  ticket_id: string;
  message_id?: string;
  file: File;
}

/**
 * Data Transfer Object for updating ticket status
 */
export interface UpdateTicketStatusDTO {
  status: TicketStatus;
  change_reason?: string;
}

/**
 * Data Transfer Object for assigning ticket
 */
export interface AssignTicketDTO {
  assigned_to: string | null;
  note?: string;
}

/**
 * Data Transfer Object for creating a template (admin)
 */
export interface CreateTemplateDTO {
  title: string;
  category?: TicketCategory;
  content: string;
  is_active?: boolean;
}

/**
 * Data Transfer Object for updating a template (admin)
 */
export interface UpdateTemplateDTO {
  title?: string;
  category?: TicketCategory;
  content?: string;
  is_active?: boolean;
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

/**
 * Filters for ticket list queries
 */
export interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  category?: TicketCategory | TicketCategory[];
  priority?: TicketPriority | TicketPriority[];
  assigned_to?: string;
  user_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Query options for pagination and sorting
 */
export interface TicketQueryOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status' | 'ticket_number';
  sort_order?: 'asc' | 'desc';
}

// =============================================================================
// STATISTICS & METRICS TYPES
// =============================================================================

/**
 * Ticket statistics for dashboard
 */
export interface TicketStats {
  total: number;
  new: number;
  in_progress: number;
  waiting_user: number;
  resolved: number;
  closed: number;
  by_category: Record<TicketCategory, number>;
  by_priority: Record<TicketPriority, number>;
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
}

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
  agent_id: string;
  agent_name: string;
  assigned_tickets: number;
  resolved_tickets: number;
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
}

/**
 * SLA (Service Level Agreement) metrics
 */
export interface SLAMetrics {
  ticket_id: string;
  response_time_hours: number;
  resolution_time_hours: number;
  is_response_sla_met: boolean;
  is_resolution_sla_met: boolean;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Ticket-specific error types
 */
export interface TicketError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Ticket operation result wrapper
 */
export interface TicketResult<T> {
  data: T | null;
  error: TicketError | null;
}

// =============================================================================
// FILE UPLOAD TYPES
// =============================================================================

/**
 * File upload progress
 */
export interface FileUploadProgress {
  file_name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Ticket notification
 */
export interface TicketNotification {
  id: string;
  ticket_id: string;
  user_id: string;
  type: 'new_message' | 'status_change' | 'assignment' | 'mention';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Ticket category labels
 */
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  certification: 'Certification Questions',
  exam: 'Exam Issues',
  pdc: 'PDC Management',
  account: 'Account/Login Issues',
  partnership: 'Partnership Application',
  technical: 'Technical Problems',
  other: 'Other',
};

/**
 * Ticket priority labels
 */
export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

/**
 * Ticket status labels
 */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  waiting_user: 'Waiting for User',
  resolved: 'Resolved',
  closed: 'Closed',
};

/**
 * Ticket status colors (for UI badges)
 */
export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  new: 'blue',
  in_progress: 'yellow',
  waiting_user: 'orange',
  resolved: 'green',
  closed: 'gray',
};

/**
 * Ticket priority colors (for UI badges)
 */
export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'gray',
  normal: 'blue',
  high: 'red',
};

/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
} as const;

/**
 * SLA thresholds (in hours)
 */
export const SLA_THRESHOLDS = {
  RESPONSE_TIME: {
    low: 48,
    normal: 24,
    high: 4,
  },
  RESOLUTION_TIME: {
    low: 168, // 7 days
    normal: 72, // 3 days
    high: 24, // 1 day
  },
} as const;

/**
 * Ticket pagination defaults
 */
export const TICKET_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
