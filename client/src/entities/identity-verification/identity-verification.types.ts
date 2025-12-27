/**
 * Identity Verification Types
 *
 * Types for identity verification system (Step 1 of certification workflow)
 */

/**
 * Identity verification status
 */
export type IdentityVerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requires_resubmission';

/**
 * Document type for identity verification
 */
export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'drivers_license';

/**
 * Identity verification record
 */
export interface IdentityVerification {
  id: string;
  user_id: string;

  // Status
  status: IdentityVerificationStatus;

  // Document information
  document_type: DocumentType;
  document_number?: string;
  document_expiry_date?: string;

  // Uploaded files (Supabase Storage paths)
  document_front_url?: string;
  document_back_url?: string;
  selfie_url?: string;

  // Verification metadata
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;

  // Admin notes
  admin_notes?: string;
  rejection_reason?: string;

  // Third-party verification (optional)
  external_verification_id?: string;
  external_verification_status?: string;
  external_verification_response?: Record<string, any>;

  // Audit
  created_at: string;
  updated_at: string;
}

/**
 * Identity verification submission data
 */
export interface IdentityVerificationSubmission {
  document_type: DocumentType;
  document_number?: string;
  document_expiry_date?: string;
  document_front_file?: File;
  document_back_file?: File;
  selfie_file?: File;
}

/**
 * Identity verification status check
 */
export interface IdentityVerificationStatusCheck {
  has_submitted: boolean;
  is_verified: boolean;
  latest_verification?: IdentityVerification;
  can_submit: boolean;
  requires_action: boolean;
  action_message?: string;
}

/**
 * Admin verification action
 */
export interface VerificationAction {
  verification_id: string;
  action: 'approve' | 'reject';
  admin_notes?: string;
  rejection_reason?: string;
}

/**
 * Service response type
 */
export interface IdentityVerificationResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Document upload progress
 */
export interface UploadProgress {
  file_name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

/**
 * Document labels for UI
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  national_id: 'National ID',
  passport: 'Passport',
  drivers_license: "Driver's License",
};

/**
 * Status labels for UI
 */
export const STATUS_LABELS: Record<IdentityVerificationStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_resubmission: 'Requires Resubmission',
};

/**
 * Status colors for UI
 */
export const STATUS_COLORS: Record<IdentityVerificationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  requires_resubmission: 'bg-orange-100 text-orange-800',
};
