/**
 * Audit Service
 *
 * Service layer for comprehensive audit logging
 * Requirements: task.md - Audit trail for certification exam workflow
 */

import { supabase } from '@/shared/config/supabase.config';
import {
  AuditEventType,
  AuditLog,
  AuditLogSubmission,
  AuditHistoryFilters,
  ExamAuditFilters,
  UserEventSummary,
  SuspiciousActivity,
  AuditResponse,
  SecurityLevel,
} from './audit.types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | undefined> {
  try {
    // In production, this should come from server-side
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
// Core Audit Functions
// ============================================================================

/**
 * Log an audit event
 *
 * @param submission - Audit log submission data
 * @returns AuditResponse with audit log ID
 */
export async function logAuditEvent(
  submission: AuditLogSubmission
): Promise<AuditResponse<string>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Some events (like failed login) may not have an authenticated user
      // In such cases, we still want to log the event
      console.warn('Logging audit event without authenticated user');
    }

    const ipAddress = submission.ip_address || await getClientIP();
    const userAgent = submission.user_agent || getUserAgent();

    const { data, error } = await supabase.rpc('log_audit_event', {
      p_event_type: submission.event_type,
      p_user_id: user?.id || null,
      p_description: submission.description,
      p_subject_user_id: submission.subject_user_id || null,
      p_subject_type: submission.subject_type || null,
      p_subject_id: submission.subject_id || null,
      p_quiz_id: submission.quiz_id || null,
      p_attempt_id: submission.attempt_id || null,
      p_event_details: submission.event_details || {},
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
      p_security_level: submission.security_level || 'normal',
      p_flagged_as_suspicious: submission.flagged_as_suspicious || false,
      p_success: submission.success !== undefined ? submission.success : true,
      p_error_message: submission.error_message || null,
    });

    if (error) {
      console.error('Error logging audit event:', error);
      return {
        error: {
          message: error.message || 'Failed to log audit event',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to log audit event',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user's audit history
 *
 * @param filters - Optional filters for audit history
 * @returns AuditResponse with array of audit logs
 */
export async function getUserAuditHistory(
  filters?: AuditHistoryFilters
): Promise<AuditResponse<AuditLog[]>> {
  try {
    let targetUserId = filters?.user_id;

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

    const { data, error } = await supabase.rpc('get_user_audit_history', {
      p_user_id: targetUserId,
      p_limit: filters?.limit || 100,
      p_offset: filters?.offset || 0,
    });

    if (error) {
      console.error('Error getting user audit history:', error);
      return {
        error: {
          message: error.message || 'Failed to get audit history',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserAuditHistory:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get audit history',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get exam audit trail
 *
 * @param filters - Exam audit filters (quiz_id required)
 * @returns AuditResponse with array of audit logs
 */
export async function getExamAuditTrail(
  filters: ExamAuditFilters
): Promise<AuditResponse<AuditLog[]>> {
  try {
    const { data, error } = await supabase.rpc('get_exam_audit_trail', {
      p_quiz_id: filters.quiz_id,
      p_attempt_id: filters.attempt_id || null,
    });

    if (error) {
      console.error('Error getting exam audit trail:', error);
      return {
        error: {
          message: error.message || 'Failed to get exam audit trail',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getExamAuditTrail:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get exam audit trail',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get suspicious activities (Admin only)
 *
 * @param limit - Maximum number of records to return
 * @param offset - Number of records to skip
 * @returns AuditResponse with array of suspicious activities
 */
export async function getSuspiciousActivities(
  limit = 50,
  offset = 0
): Promise<AuditResponse<SuspiciousActivity[]>> {
  try {
    const { data, error } = await supabase.rpc('get_suspicious_activities', {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error getting suspicious activities:', error);
      return {
        error: {
          message: error.message || 'Failed to get suspicious activities',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getSuspiciousActivities:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get suspicious activities',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user event summary
 *
 * @param userId - Optional user ID (defaults to current user)
 * @param startDate - Optional start date (defaults to 30 days ago)
 * @param endDate - Optional end date (defaults to now)
 * @returns AuditResponse with array of event summaries
 */
export async function getUserEventSummary(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<AuditResponse<UserEventSummary[]>> {
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

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const { data, error } = await supabase.rpc('get_user_event_summary', {
      p_user_id: targetUserId,
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString(),
    });

    if (error) {
      console.error('Error getting user event summary:', error);
      return {
        error: {
          message: error.message || 'Failed to get event summary',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getUserEventSummary:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get event summary',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Convenience Functions for Common Events
// ============================================================================

/**
 * Log user login
 */
export async function logUserLogin(method: string = 'email'): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'user_login',
    description: `User logged in via ${method}`,
    event_details: { login_method: method },
    security_level: 'normal',
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'user_logout',
    description: 'User logged out',
    security_level: 'low',
  });
}

/**
 * Log exam started
 */
export async function logExamStarted(
  quizId: string,
  attemptId: string,
  examName: string
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'exam_started',
    description: `User started exam: ${examName}`,
    quiz_id: quizId,
    attempt_id: attemptId,
    event_details: { exam_name: examName },
    security_level: 'high',
  });
}

/**
 * Log exam submitted
 */
export async function logExamSubmitted(
  quizId: string,
  attemptId: string,
  examName: string
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'exam_submitted',
    description: `User submitted exam: ${examName}`,
    quiz_id: quizId,
    attempt_id: attemptId,
    event_details: { exam_name: examName },
    security_level: 'high',
  });
}

/**
 * Log answer saved
 */
export async function logAnswerSaved(
  quizId: string,
  attemptId: string,
  questionId: string
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'answer_saved',
    description: 'User saved answer to question',
    quiz_id: quizId,
    attempt_id: attemptId,
    subject_type: 'answer',
    subject_id: questionId,
    event_details: { question_id: questionId },
    security_level: 'normal',
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  description: string,
  details?: Record<string, any>,
  securityLevel: SecurityLevel = 'critical'
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'suspicious_activity_detected',
    description,
    event_details: details,
    security_level: securityLevel,
    flagged_as_suspicious: true,
  });
}

/**
 * Log profile update
 */
export async function logProfileUpdate(
  changedFields: string[]
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'profile_updated',
    description: 'User updated profile information',
    event_details: { changed_fields: changedFields },
    security_level: 'normal',
  });
}

/**
 * Log consent acceptance
 */
export async function logConsentAccepted(
  consentType: string,
  consentVersion: string
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'consent_accepted',
    description: `User accepted ${consentType}`,
    subject_type: 'consent',
    subject_id: consentType,
    event_details: { consent_type: consentType, consent_version: consentVersion },
    security_level: 'high',
  });
}

/**
 * Log honor code acceptance
 */
export async function logHonorCodeAccepted(
  context: string,
  quizId?: string
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'honor_code_accepted',
    description: `User accepted honor code (${context})`,
    quiz_id: quizId,
    subject_type: 'honor_code',
    event_details: { context },
    security_level: 'high',
  });
}

/**
 * Log identity verification submission
 */
export async function logIdentityVerificationSubmitted(
  verificationId: string,
  documentType: string
): Promise<AuditResponse<string>> {
  return logAuditEvent({
    event_type: 'identity_verification_submitted',
    description: `User submitted identity verification (${documentType})`,
    subject_type: 'identity_verification',
    subject_id: verificationId,
    event_details: { document_type: documentType },
    security_level: 'high',
  });
}
