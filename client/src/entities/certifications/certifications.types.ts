/**
 * Certifications Types
 * User earned certifications (CP™, SCP™)
 */

export type CertificationStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export interface UserCertification {
  id: string;
  user_id: string;
  certification_type: 'CP' | 'SCP';
  credential_id: string; // e.g., CP-2024-0001
  quiz_attempt_id?: string;
  issued_date: string;
  expiry_date: string;
  status: CertificationStatus;
  certificate_url?: string;
  renewal_count: number;
  last_renewed_at?: string;
  pdc_credits_earned: number;
  notes?: string;
  revocation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CertificationFilters {
  status?: CertificationStatus;
  certification_type?: 'CP' | 'SCP';
  search?: string;
}

export interface CertificationStats {
  total_certifications: number;
  active_certifications: number;
  expired_certifications: number;
  cp_certifications: number;
  scp_certifications: number;
  expiring_soon: number; // Within 60 days
}

export interface CertificationResult<T> {
  data: T | null;
  error: Error | null;
}
