import { supabase } from '@/lib/supabase';
import type {
  PDCEntry,
  PDPProgram,
  PDCSummary,
  CreatePDCEntryDTO,
  PDCFilters,
  PDCResult,
  CertificationType,
} from './pdc.types';

/**
 * PDC Service
 * Handles Professional Development Credits operations
 */

export class PDCService {
  /**
   * Get user's PDC entries
   */
  static async getUserPDCEntries(
    userId: string,
    filters?: PDCFilters
  ): Promise<PDCResult<PDCEntry[]>> {
    try {
      let query = supabase
        .from('pdc_entries')
        .select('*')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }

      if (filters?.date_from) {
        query = query.gte('activity_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('activity_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return { data: data as PDCEntry[], error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while fetching PDC entries',
          details: err,
        },
      };
    }
  }

  /**
   * Get PDC summary for user
   */
  static async getPDCSummary(
    userId: string,
    certificationType: CertificationType
  ): Promise<PDCResult<PDCSummary>> {
    try {
      // Get total approved PDCs using database function
      const { data: totalData, error: totalError } = await supabase.rpc(
        'get_user_pdc_total',
        {
          p_user_id: userId,
          p_certification_type: certificationType,
        }
      );

      if (totalError) {
        throw totalError;
      }

      // Get pending and rejected counts
      const { data: entries, error: entriesError } = await supabase
        .from('pdc_entries')
        .select('status, credits_claimed')
        .eq('user_id', userId)
        .eq('certification_type', certificationType);

      if (entriesError) {
        throw entriesError;
      }

      const total_pending = entries
        ?.filter((e: any) => e.status === 'pending')
        .reduce((sum: number, e: any) => sum + e.credits_claimed, 0) || 0;

      const total_rejected = entries
        ?.filter((e: any) => e.status === 'rejected')
        .reduce((sum: number, e: any) => sum + e.credits_claimed, 0) || 0;

      const goal = 60; // Standard 3-year requirement
      const total_approved = totalData || 0;
      const progress_percentage = Math.min(100, Math.round((total_approved / goal) * 100));

      const summary: PDCSummary = {
        total_approved,
        total_pending,
        total_rejected,
        goal,
        progress_percentage,
      };

      return { data: summary, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to get PDC summary',
          details: err,
        },
      };
    }
  }

  /**
   * Create new PDC entry
   */
  static async createPDCEntry(
    userId: string,
    dto: CreatePDCEntryDTO
  ): Promise<PDCResult<PDCEntry>> {
    try {
      // Validate program ID if provided
      if (dto.program_id) {
        const { data: validation } = await supabase.rpc('validate_program_id', {
          p_program_id: dto.program_id,
        });

        if (validation && validation.length > 0 && !validation[0].is_valid) {
          return {
            data: null,
            error: {
              code: 'INVALID_PROGRAM_ID',
              message: 'Invalid or inactive program ID',
            },
          };
        }

        // Check if credits claimed exceed program max
        if (validation && validation.length > 0 && dto.credits_claimed > validation[0].max_credits) {
          return {
            data: null,
            error: {
              code: 'CREDITS_EXCEEDED',
              message: `Credits claimed (${dto.credits_claimed}) exceed program maximum (${validation[0].max_credits})`,
            },
          };
        }
      }

      const { data, error } = await supabase
        .from('pdc_entries')
        .insert({
          user_id: userId,
          ...dto,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: 'INSERT_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return { data: data as PDCEntry, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to create PDC entry',
          details: err,
        },
      };
    }
  }

  /**
   * Update PDC entry (only if pending)
   */
  static async updatePDCEntry(
    entryId: string,
    dto: Partial<CreatePDCEntryDTO>
  ): Promise<PDCResult<PDCEntry>> {
    try {
      const { data, error } = await supabase
        .from('pdc_entries')
        .update(dto)
        .eq('id', entryId)
        .eq('status', 'pending') // Only allow updating pending entries
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: {
            code: 'UPDATE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      if (!data) {
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'PDC entry not found or not pending',
          },
        };
      }

      return { data: data as PDCEntry, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to update PDC entry',
          details: err,
        },
      };
    }
  }

  /**
   * Delete PDC entry (only if pending)
   */
  static async deletePDCEntry(entryId: string): Promise<PDCResult<boolean>> {
    try {
      const { error } = await supabase
        .from('pdc_entries')
        .delete()
        .eq('id', entryId)
        .eq('status', 'pending'); // Only allow deleting pending entries

      if (error) {
        return {
          data: null,
          error: {
            code: 'DELETE_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to delete PDC entry',
          details: err,
        },
      };
    }
  }

  /**
   * Get active PDP programs
   */
  static async getActivePDPPrograms(): Promise<PDCResult<PDPProgram[]>> {
    try {
      const { data, error } = await supabase
        .from('pdp_programs')
        .select('*')
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .order('program_name');

      if (error) {
        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return { data: data as PDPProgram[], error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to fetch PDP programs',
          details: err,
        },
      };
    }
  }

  /**
   * Validate program ID
   */
  static async validateProgramId(programId: string): Promise<PDCResult<PDPProgram | null>> {
    try {
      const { data, error } = await supabase
        .from('pdp_programs')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .gte('valid_until', new Date().toISOString().split('T')[0])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return { data: null, error: null };
        }

        return {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: error.message,
            details: error,
          },
        };
      }

      return { data: data as PDPProgram, error: null };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to validate program ID',
          details: err,
        },
      };
    }
  }
}
