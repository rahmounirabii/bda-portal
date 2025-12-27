/**
 * Consent Service
 *
 * Service layer for GDPR-compliant consent tracking
 * Requirements: task.md Step 1 - Accept Terms, Privacy Policy, and Exam Code of Conduct
 */

import { supabase } from '@/shared/config/supabase.config';
import {
  ConsentType,
  ConsentLog,
  ConsentSubmission,
  ConsentSummary,
  ConsentResponse,
  DEFAULT_CONSENT_VERSION,
} from './consent.types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | undefined> {
  try {
    // In production, this should come from server-side
    // For now, return undefined and let server capture it
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Get user agent string
 */
function getUserAgent(): string | undefined {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return undefined;
}

// ============================================================================
// Consent Logging Functions
// ============================================================================

/**
 * Log a consent acceptance or withdrawal
 *
 * @param submission - Consent submission data
 * @returns ConsentResponse with consent log ID
 */
export async function logConsent(
  submission: ConsentSubmission
): Promise<ConsentResponse<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    const ipAddress = submission.ip_address || await getClientIP();
    const userAgent = submission.user_agent || getUserAgent();

    const { data, error } = await supabase.rpc('log_consent', {
      p_user_id: user.id,
      p_consent_type: submission.consent_type,
      p_consent_version: submission.consent_version || DEFAULT_CONSENT_VERSION,
      p_consented: submission.consented,
      p_consent_text: submission.consent_text,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('Error logging consent:', error);
      return {
        error: {
          message: error.message || 'Failed to log consent',
          code: error.code,
        },
      };
    }

    // Log audit event for consent acceptance/withdrawal
    try {
      const { logConsentAccepted } = await import('@/entities/audit');
      await logConsentAccepted(submission.consent_type, submission.consent_version || DEFAULT_CONSENT_VERSION);
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
      // Don't fail the consent logging if audit logging fails
    }

    return { data };
  } catch (error) {
    console.error('Error in logConsent:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to log consent',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Check if user has consented to a specific type
 *
 * @param consentType - Type of consent to check
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with boolean result
 */
export async function hasUserConsented(
  consentType: ConsentType,
  userId?: string
): Promise<ConsentResponse<boolean>> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          error: {
            message: 'User not authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase.rpc('has_user_consented', {
      p_user_id: targetUserId,
      p_consent_type: consentType,
    });

    if (error) {
      console.error('Error checking consent:', error);
      return {
        error: {
          message: error.message || 'Failed to check consent',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in hasUserConsented:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to check consent',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user's consent summary (all consent types and their status)
 *
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with array of consent summaries
 */
export async function getUserConsentSummary(
  userId?: string
): Promise<ConsentResponse<ConsentSummary[]>> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          error: {
            message: 'User not authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase.rpc('get_user_consent_summary', {
      p_user_id: targetUserId,
    });

    if (error) {
      console.error('Error getting consent summary:', error);
      return {
        error: {
          message: error.message || 'Failed to get consent summary',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserConsentSummary:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get consent summary',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user's full consent history for a specific type
 *
 * @param consentType - Type of consent
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with array of consent logs
 */
export async function getUserConsentHistory(
  consentType: ConsentType,
  userId?: string
): Promise<ConsentResponse<ConsentLog[]>> {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          error: {
            message: 'User not authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('consent_type', consentType)
      .order('consented_at', { ascending: false });

    if (error) {
      console.error('Error getting consent history:', error);
      return {
        error: {
          message: error.message || 'Failed to get consent history',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserConsentHistory:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get consent history',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Withdraw consent for a specific type
 *
 * @param consentType - Type of consent to withdraw
 * @param reason - Optional reason for withdrawal
 * @returns ConsentResponse with new consent log ID
 */
export async function withdrawConsent(
  consentType: ConsentType,
  reason?: string
): Promise<ConsentResponse<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    const ipAddress = await getClientIP();
    const userAgent = getUserAgent();

    const withdrawalText = reason
      ? `Consent withdrawn. Reason: ${reason}`
      : 'Consent withdrawn by user.';

    const { data, error } = await supabase.rpc('log_consent', {
      p_user_id: user.id,
      p_consent_type: consentType,
      p_consent_version: DEFAULT_CONSENT_VERSION,
      p_consented: false, // FALSE = withdrawal
      p_consent_text: withdrawalText,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('Error withdrawing consent:', error);
      return {
        error: {
          message: error.message || 'Failed to withdraw consent',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in withdrawConsent:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to withdraw consent',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Check if user has accepted all required consents
 *
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with boolean result
 */
export async function hasAllRequiredConsents(
  userId?: string
): Promise<ConsentResponse<boolean>> {
  try {
    const requiredConsents: ConsentType[] = [
      'terms_of_use',
      'privacy_policy',
      'exam_code_of_conduct',
    ];

    let allConsented = true;

    for (const consentType of requiredConsents) {
      const result = await hasUserConsented(consentType, userId);

      if (result.error) {
        return result;
      }

      if (!result.data) {
        allConsented = false;
        break;
      }
    }

    return { data: allConsented };
  } catch (error) {
    console.error('Error in hasAllRequiredConsents:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to check required consents',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Get all consent logs for a specific user (Admin only)
 *
 * @param userId - User ID to get consent logs for
 * @returns ConsentResponse with array of consent logs
 */
export async function getAllUserConsentLogs(
  userId: string
): Promise<ConsentResponse<ConsentLog[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    const { data, error } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('user_id', userId)
      .order('consented_at', { ascending: false });

    if (error) {
      console.error('Error getting user consent logs:', error);
      return {
        error: {
          message: error.message || 'Failed to get user consent logs',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getAllUserConsentLogs:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get user consent logs',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}
