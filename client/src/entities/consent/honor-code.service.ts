/**
 * Honor Code Service
 *
 * Service layer for honor code acceptance tracking
 * Requirements: task.md Step 1 - Accept Honor Code before exams
 */

import { supabase } from '@/shared/config/supabase.config';
import {
  HonorCodeContext,
  HonorCodeAcceptance,
  HonorCodeSubmission,
  ConsentResponse,
  DEFAULT_HONOR_CODE_VERSION,
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
// Honor Code Functions
// ============================================================================

/**
 * Log an honor code acceptance
 *
 * @param submission - Honor code submission data
 * @returns ConsentResponse with acceptance ID
 */
export async function logHonorCodeAcceptance(
  submission: HonorCodeSubmission
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

    const { data, error } = await supabase.rpc('log_honor_code_acceptance', {
      p_user_id: user.id,
      p_context: submission.context,
      p_honor_code_text: submission.honor_code_text,
      p_quiz_id: submission.quiz_id || null,
      p_attempt_id: submission.attempt_id || null,
      p_signature_type: submission.signature_type || 'checkbox',
      p_signature_data: submission.signature_data || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('Error logging honor code acceptance:', error);
      return {
        error: {
          message: error.message || 'Failed to log honor code acceptance',
          code: error.code,
        },
      };
    }

    // Log audit event for honor code acceptance
    try {
      const { logHonorCodeAccepted } = await import('@/entities/audit');
      await logHonorCodeAccepted(submission.context, submission.quiz_id);
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
      // Don't fail the honor code logging if audit logging fails
    }

    return { data };
  } catch (error) {
    console.error('Error in logHonorCodeAcceptance:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to log honor code acceptance',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Check if user has accepted honor code
 *
 * @param context - Optional context to check (e.g., 'before_exam_launch')
 * @param quizId - Optional quiz ID to check for specific exam
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with boolean result
 */
export async function hasAcceptedHonorCode(
  context?: HonorCodeContext,
  quizId?: string,
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

    const { data, error } = await supabase.rpc('has_accepted_honor_code', {
      p_user_id: targetUserId,
      p_context: context || null,
      p_quiz_id: quizId || null,
    });

    if (error) {
      console.error('Error checking honor code acceptance:', error);
      return {
        error: {
          message: error.message || 'Failed to check honor code acceptance',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in hasAcceptedHonorCode:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to check honor code acceptance',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get user's honor code acceptance history
 *
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with array of honor code acceptances
 */
export async function getHonorCodeHistory(
  userId?: string
): Promise<ConsentResponse<HonorCodeAcceptance[]>> {
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
      .from('honor_code_acceptances')
      .select('*')
      .eq('user_id', targetUserId)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error getting honor code history:', error);
      return {
        error: {
          message: error.message || 'Failed to get honor code history',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getHonorCodeHistory:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get honor code history',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get honor code acceptances for a specific quiz
 *
 * @param quizId - Quiz ID
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with array of honor code acceptances
 */
export async function getHonorCodeForQuiz(
  quizId: string,
  userId?: string
): Promise<ConsentResponse<HonorCodeAcceptance[]>> {
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
      .from('honor_code_acceptances')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('quiz_id', quizId)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error getting honor code for quiz:', error);
      return {
        error: {
          message: error.message || 'Failed to get honor code for quiz',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getHonorCodeForQuiz:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get honor code for quiz',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get the latest honor code acceptance for a specific context
 *
 * @param context - Honor code context
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with honor code acceptance or null
 */
export async function getLatestHonorCodeForContext(
  context: HonorCodeContext,
  userId?: string
): Promise<ConsentResponse<HonorCodeAcceptance | null>> {
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
      .from('honor_code_acceptances')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('context', context)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return { data: null };
      }

      console.error('Error getting latest honor code:', error);
      return {
        error: {
          message: error.message || 'Failed to get latest honor code',
          code: error.code,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error('Error in getLatestHonorCodeForContext:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get latest honor code',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Check if user needs to accept honor code before starting exam
 *
 * @param quizId - Quiz ID
 * @param userId - Optional user ID (defaults to current user)
 * @returns ConsentResponse with object containing needs_acceptance and acceptance details
 */
export async function needsHonorCodeForExam(
  quizId: string,
  userId?: string
): Promise<ConsentResponse<{ needs_acceptance: boolean; latest_acceptance?: HonorCodeAcceptance }>> {
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

    // Check if user has accepted honor code for this specific quiz within 24 hours
    const hasAccepted = await hasAcceptedHonorCode('before_exam_launch', quizId, targetUserId);

    if (hasAccepted.error) {
      return hasAccepted as ConsentResponse<any>;
    }

    if (hasAccepted.data) {
      // Get the latest acceptance
      const latestResult = await getHonorCodeForQuiz(quizId, targetUserId);

      if (latestResult.error) {
        return latestResult as ConsentResponse<any>;
      }

      return {
        data: {
          needs_acceptance: false,
          latest_acceptance: latestResult.data?.[0],
        },
      };
    }

    return {
      data: {
        needs_acceptance: true,
      },
    };
  } catch (error) {
    console.error('Error in needsHonorCodeForExam:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to check honor code requirement',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Get all honor code acceptances for a specific user (Admin only)
 *
 * @param userId - User ID to get acceptances for
 * @returns ConsentResponse with array of honor code acceptances
 */
export async function getAllUserHonorCodeAcceptances(
  userId: string
): Promise<ConsentResponse<HonorCodeAcceptance[]>> {
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
      .from('honor_code_acceptances')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error getting user honor code acceptances:', error);
      return {
        error: {
          message: error.message || 'Failed to get user honor code acceptances',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getAllUserHonorCodeAcceptances:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get user honor code acceptances',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get honor code acceptances for a specific quiz (Admin only)
 *
 * @param quizId - Quiz ID
 * @returns ConsentResponse with array of honor code acceptances with user details
 */
export async function getQuizHonorCodeAcceptances(
  quizId: string
): Promise<ConsentResponse<HonorCodeAcceptance[]>> {
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
      .from('honor_code_acceptances')
      .select(`
        *,
        user:users!honor_code_acceptances_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('quiz_id', quizId)
      .order('accepted_at', { ascending: false });

    if (error) {
      console.error('Error getting quiz honor code acceptances:', error);
      return {
        error: {
          message: error.message || 'Failed to get quiz honor code acceptances',
          code: error.code,
        },
      };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getQuizHonorCodeAcceptances:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to get quiz honor code acceptances',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}
