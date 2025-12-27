/**
 * Curriculum Access Service - Language-based
 * New service for language-based (EN/AR) Learning System access
 * Supports the new architecture where users purchase by language
 */

import { supabase } from '@/shared/config/supabase.config';
import type { ServiceResponse } from './curriculum.types';

export type Language = 'EN' | 'AR';

export interface LearningSystemAccess {
  id: string;
  language: Language;
  expires_at: string;
  is_active: boolean;
  includes_question_bank: boolean;
  includes_flashcards: boolean;
  purchased_at: string;
  certification_type: 'CP' | 'SCP';
}

export interface UserAccessSummary {
  accesses: LearningSystemAccess[];
  has_en: boolean;
  has_ar: boolean;
}

export interface AccessCheckResult {
  has_access: boolean;
  access_id?: string;
  language?: Language;
  certification_type?: 'CP' | 'SCP';
  expires_at?: string;
  includes_curriculum?: boolean;
  includes_question_bank?: boolean;
  includes_flashcards?: boolean;
  reason?: 'no_active_access' | 'expired' | 'no_purchase';
}

/**
 * Learning System Access Service (Language-based)
 * Manages access based on language (EN/AR) instead of certification type
 */
export class LearningSystemAccessService {
  /**
   * Check if user has active access for a specific language
   */
  static async checkAccess(
    userId: string,
    language: Language
  ): Promise<ServiceResponse<AccessCheckResult>> {
    try {
      const { data, error } = await supabase.rpc('check_learning_system_access', {
        p_user_id: userId,
        p_language: language,
      });

      if (error) throw error;

      return { data: data as AccessCheckResult };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'CHECK_ACCESS_ERROR',
          message: 'Failed to check Learning System access',
          details: error,
        },
      };
    }
  }

  /**
   * Get all active accesses for a user (both EN and AR if available)
   */
  static async getUserAccesses(
    userId: string
  ): Promise<ServiceResponse<UserAccessSummary>> {
    try {
      const { data, error } = await supabase.rpc('get_user_learning_system_accesses', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { data: data as UserAccessSummary };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'GET_ACCESSES_ERROR',
          message: 'Failed to get user Learning System accesses',
          details: error,
        },
      };
    }
  }

  /**
   * Check which languages the user has access to
   * Returns array of available languages
   */
  static async getAvailableLanguages(userId: string): Promise<ServiceResponse<Language[]>> {
    try {
      const accessSummary = await this.getUserAccesses(userId);

      if (accessSummary.error) {
        throw accessSummary.error;
      }

      const languages: Language[] = [];
      if (accessSummary.data?.has_en) {
        languages.push('EN');
      }
      if (accessSummary.data?.has_ar) {
        languages.push('AR');
      }

      return { data: languages };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'GET_LANGUAGES_ERROR',
          message: 'Failed to get available languages',
          details: error,
        },
      };
    }
  }

  /**
   * Check if user has access to Question Bank for a specific language
   */
  static async hasQuestionBankAccess(
    userId: string,
    language: Language
  ): Promise<ServiceResponse<boolean>> {
    try {
      const accessCheck = await this.checkAccess(userId, language);

      if (accessCheck.error) {
        throw accessCheck.error;
      }

      const hasAccess =
        accessCheck.data?.has_access &&
        accessCheck.data?.includes_question_bank === true;

      return { data: hasAccess };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'CHECK_QB_ACCESS_ERROR',
          message: 'Failed to check Question Bank access',
          details: error,
        },
      };
    }
  }

  /**
   * Check if user has access to Flashcards for a specific language
   */
  static async hasFlashcardsAccess(
    userId: string,
    language: Language
  ): Promise<ServiceResponse<boolean>> {
    try {
      const accessCheck = await this.checkAccess(userId, language);

      if (accessCheck.error) {
        throw accessCheck.error;
      }

      const hasAccess =
        accessCheck.data?.has_access &&
        accessCheck.data?.includes_flashcards === true;

      return { data: hasAccess };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'CHECK_FC_ACCESS_ERROR',
          message: 'Failed to check Flashcards access',
          details: error,
        },
      };
    }
  }

  /**
   * Admin: Grant access manually
   */
  static async grantAccess(
    userId: string,
    language: Language,
    validityMonths: number = 12,
    includesQuestionBank: boolean = true,
    includesFlashcards: boolean = true
  ): Promise<ServiceResponse<string>> {
    try {
      const purchasedAt = new Date().toISOString();

      const { data, error } = await supabase.rpc('grant_learning_system_access', {
        p_user_id: userId,
        p_language: language,
        p_woocommerce_order_id: null,
        p_woocommerce_product_id: null,
        p_purchased_at: purchasedAt,
        p_validity_months: validityMonths,
        p_includes_question_bank: includesQuestionBank,
        p_includes_flashcards: includesFlashcards,
      });

      if (error) throw error;

      return { data: data as string };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'GRANT_ACCESS_ERROR',
          message: 'Failed to grant Learning System access',
          details: error,
        },
      };
    }
  }

  /**
   * Admin: Revoke access
   */
  static async revokeAccess(
    userId: string,
    language: Language
  ): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_curriculum_access')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('language', language);

      if (error) throw error;

      return { data: undefined };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'REVOKE_ACCESS_ERROR',
          message: 'Failed to revoke access',
          details: error,
        },
      };
    }
  }

  /**
   * Admin: Get all users with Learning System access
   */
  static async getAllUsersWithAccess(): Promise<
    ServiceResponse<
      Array<{
        id: string;
        user_id: string;
        email: string;
        first_name: string;
        last_name: string;
        language: Language;
        purchased_at: string;
        expires_at: string;
        currently_active: boolean;
      }>
    >
  > {
    try {
      const { data, error } = await supabase
        .from('admin_learning_system_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'GET_ALL_ACCESS_ERROR',
          message: 'Failed to get all users with access',
          details: error,
        },
      };
    }
  }
}
