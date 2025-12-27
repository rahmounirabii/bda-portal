/**
 * Identity Verification Service
 *
 * Handles identity verification workflow for certification compliance
 * Requirements: task.md Step 1 - Account Creation & Identity Verification
 */

import { supabase } from '@/shared/config/supabase.config';
import type {
  IdentityVerification,
  IdentityVerificationSubmission,
  IdentityVerificationStatusCheck,
  IdentityVerificationResponse,
  VerificationAction,
  UploadProgress,
} from './identity-verification.types';

const STORAGE_BUCKET = 'identity-documents';

/**
 * Upload document file to Supabase Storage
 */
async function uploadDocument(
  userId: string,
  file: File,
  fileType: 'front' | 'back' | 'selfie',
  onProgress?: (progress: UploadProgress) => void
): Promise<IdentityVerificationResponse<string>> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${fileType}_${Date.now()}.${fileExtension}`;

    onProgress?.({
      file_name: file.name,
      progress: 0,
      status: 'uploading',
    });

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      onProgress?.({
        file_name: file.name,
        progress: 0,
        status: 'error',
        error: error.message,
      });

      return {
        error: {
          message: `Failed to upload ${fileType}: ${error.message}`,
          code: error.name,
          details: error,
        },
      };
    }

    onProgress?.({
      file_name: file.name,
      progress: 100,
      status: 'completed',
    });

    return {
      data: data.path,
    };
  } catch (error) {
    console.error(`Error uploading ${fileType}:`, error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Upload failed',
        details: error,
      },
    };
  }
}

/**
 * Submit identity verification
 */
export async function submitIdentityVerification(
  submission: IdentityVerificationSubmission,
  onProgress?: (progress: UploadProgress) => void
): Promise<IdentityVerificationResponse<IdentityVerification>> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'AUTH_ERROR',
        },
      };
    }

    // Upload documents
    const uploads: Record<string, string> = {};

    if (submission.document_front_file) {
      const frontResult = await uploadDocument(
        user.id,
        submission.document_front_file,
        'front',
        onProgress
      );

      if (frontResult.error) {
        return { error: frontResult.error };
      }

      uploads.document_front_url = frontResult.data!;
    }

    if (submission.document_back_file) {
      const backResult = await uploadDocument(
        user.id,
        submission.document_back_file,
        'back',
        onProgress
      );

      if (backResult.error) {
        return { error: backResult.error };
      }

      uploads.document_back_url = backResult.data!;
    }

    if (submission.selfie_file) {
      const selfieResult = await uploadDocument(
        user.id,
        submission.selfie_file,
        'selfie',
        onProgress
      );

      if (selfieResult.error) {
        return { error: selfieResult.error };
      }

      uploads.selfie_url = selfieResult.data!;
    }

    // Create verification record
    const { data, error } = await supabase
      .from('identity_verifications')
      .insert({
        user_id: user.id,
        document_type: submission.document_type,
        document_number: submission.document_number,
        document_expiry_date: submission.document_expiry_date,
        ...uploads,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating verification:', error);
      return {
        error: {
          message: 'Failed to submit verification',
          code: error.code,
          details: error,
        },
      };
    }

    // Log audit event for identity verification submission
    try {
      const { logIdentityVerificationSubmitted } = await import('@/entities/audit');
      await logIdentityVerificationSubmitted(data.id, submission.document_type);
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
      // Don't fail the submission if audit logging fails
    }

    return { data };
  } catch (error) {
    console.error('Error submitting verification:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Submission failed',
        details: error,
      },
    };
  }
}

/**
 * Get user's verification status
 */
export async function getVerificationStatus(
  userId?: string
): Promise<IdentityVerificationResponse<IdentityVerificationStatusCheck>> {
  try {
    let targetUserId = userId;

    // If no userId provided, get current user
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          error: {
            message: 'User not authenticated',
            code: 'AUTH_ERROR',
          },
        };
      }

      targetUserId = user.id;
    }

    // Get user's identity_verified flag
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('identity_verified')
      .eq('id', targetUserId)
      .single();

    if (userError) {
      return {
        error: {
          message: 'Failed to get user data',
          code: userError.code,
          details: userError,
        },
      };
    }

    // Get latest verification
    const { data: latestVerification } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    const has_submitted = !!latestVerification;
    const is_verified = userData.identity_verified === true;

    // Determine if user can submit (new or resubmission)
    const can_submit =
      !has_submitted ||
      latestVerification?.status === 'rejected' ||
      latestVerification?.status === 'requires_resubmission';

    // Determine if action is required
    let requires_action = false;
    let action_message: string | undefined;

    if (!has_submitted) {
      requires_action = true;
      action_message = 'Please submit your identity verification to access certification exams';
    } else if (latestVerification?.status === 'rejected') {
      requires_action = true;
      action_message = `Your verification was rejected: ${latestVerification.rejection_reason}. Please resubmit with correct documents.`;
    } else if (latestVerification?.status === 'requires_resubmission') {
      requires_action = true;
      action_message = 'Please resubmit your identity verification with the required corrections';
    } else if (latestVerification?.status === 'pending') {
      requires_action = false;
      action_message = 'Your identity verification is pending admin review';
    }

    return {
      data: {
        has_submitted,
        is_verified,
        latest_verification: latestVerification || undefined,
        can_submit,
        requires_action,
        action_message,
      },
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get status',
        details: error,
      },
    };
  }
}

/**
 * Get all verifications for a user (admin use or user history)
 */
export async function getUserVerifications(
  userId: string
): Promise<IdentityVerificationResponse<IdentityVerification[]>> {
  try {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (error) {
      return {
        error: {
          message: 'Failed to get verifications',
          code: error.code,
          details: error,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting user verifications:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get verifications',
        details: error,
      },
    };
  }
}

/**
 * Get document URL from storage (with signed URL for private access)
 */
export async function getDocumentUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<IdentityVerificationResponse<string>> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return {
        error: {
          message: 'Failed to get document URL',
          code: error.name,
          details: error,
        },
      };
    }

    return { data: data.signedUrl };
  } catch (error) {
    console.error('Error getting document URL:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get URL',
        details: error,
      },
    };
  }
}

/**
 * Admin: Get all pending verifications
 */
export async function getPendingVerifications(): Promise<
  IdentityVerificationResponse<IdentityVerification[]>
> {
  try {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select(`
        *,
        user:users!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      return {
        error: {
          message: 'Failed to get pending verifications',
          code: error.code,
          details: error,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get verifications',
        details: error,
      },
    };
  }
}

/**
 * Admin: Approve verification
 */
export async function approveVerification(
  verificationId: string,
  adminNotes?: string
): Promise<IdentityVerificationResponse<boolean>> {
  try {
    const { error } = await supabase.rpc('approve_identity_verification', {
      p_verification_id: verificationId,
      p_admin_notes: adminNotes || null,
    });

    if (error) {
      return {
        error: {
          message: 'Failed to approve verification',
          code: error.code,
          details: error,
        },
      };
    }

    return { data: true };
  } catch (error) {
    console.error('Error approving verification:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Approval failed',
        details: error,
      },
    };
  }
}

/**
 * Admin: Reject verification
 */
export async function rejectVerification(
  verificationId: string,
  rejectionReason: string,
  adminNotes?: string
): Promise<IdentityVerificationResponse<boolean>> {
  try {
    const { error } = await supabase.rpc('reject_identity_verification', {
      p_verification_id: verificationId,
      p_rejection_reason: rejectionReason,
      p_admin_notes: adminNotes || null,
    });

    if (error) {
      return {
        error: {
          message: 'Failed to reject verification',
          code: error.code,
          details: error,
        },
      };
    }

    return { data: true };
  } catch (error) {
    console.error('Error rejecting verification:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Rejection failed',
        details: error,
      },
    };
  }
}

/**
 * Check if user is verified (helper for guards)
 */
export async function isUserVerified(userId?: string): Promise<boolean> {
  try {
    const status = await getVerificationStatus(userId);
    return status.data?.is_verified === true;
  } catch (error) {
    console.error('Error checking verification:', error);
    return false;
  }
}

/**
 * Export all service functions
 */
export const IdentityVerificationService = {
  submitIdentityVerification,
  getVerificationStatus,
  getUserVerifications,
  getDocumentUrl,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  isUserVerified,
};
