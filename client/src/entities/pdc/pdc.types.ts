/**
 * PDC Entity - Types
 * Manages Professional Development Credits
 */

export type PDCStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type PDCActivityType =
  | 'training_course'
  | 'conference'
  | 'workshop'
  | 'webinar'
  | 'self_study'
  | 'teaching'
  | 'publication'
  | 'volunteer_work'
  | 'other';

export type CertificationType = 'CP' | 'SCP';

export interface PDCEntry {
  id: string;
  user_id: string;
  certification_id?: string;
  certification_type: CertificationType;

  // Activity
  program_id?: string;
  activity_type: PDCActivityType;
  activity_title: string;
  activity_title_ar?: string;
  activity_description?: string;

  // Credits
  credits_claimed: number;
  credits_approved?: number;

  // Dates
  activity_date: string;
  submission_date: string;

  // Documentation
  certificate_url?: string;
  notes?: string;

  // Status
  status: PDCStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;

  created_at: string;
  updated_at: string;
}

export interface PDPProgram {
  id: string;
  program_id: string; // Public Program ID
  program_name: string;
  program_name_ar?: string;
  description?: string;
  description_ar?: string;

  provider_id?: string;
  provider_name: string;

  max_pdc_credits: number;
  activity_type: PDCActivityType;

  bock_domain?: string[];

  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface PDCSummary {
  total_approved: number;
  total_pending: number;
  total_rejected: number;
  goal: number; // Usually 60 for 3 years
  progress_percentage: number;
  expires_in_days?: number;
}

export interface CreatePDCEntryDTO {
  certification_type: CertificationType;
  program_id?: string;
  activity_type: PDCActivityType;
  activity_title: string;
  activity_description?: string;
  credits_claimed: number;
  activity_date: string;
  certificate_url?: string;
  notes?: string;
}

export interface PDCFilters {
  status?: PDCStatus;
  activity_type?: PDCActivityType;
  date_from?: string;
  date_to?: string;
}

export interface PDCError {
  code: string;
  message: string;
  details?: any;
}

export interface PDCResult<T> {
  data: T | null;
  error: PDCError | null;
}
