/**
 * ECP (Exclusive Certification Partner) Service
 * API calls for ECP partner management
 */

import { supabase } from '@/lib/supabase';
import type {
  TrainingBatch,
  CreateBatchDTO,
  UpdateBatchDTO,
  Trainer,
  CreateTrainerDTO,
  UpdateTrainerDTO,
  Trainee,
  CreateTraineeDTO,
  UpdateTraineeDTO,
  VoucherAllocation,
  PerformanceMetrics,
  ECPDashboardStats,
  BatchFilters,
  TrainerFilters,
  TraineeFilters,
  BulkTraineeUpload,
  LicenseInfo,
  LicenseRequest,
  CreateLicenseRequestDTO,
  LicenseDocument,
  LicenseTerm,
  ComplianceRequirement,
  ECPLicense,
  Voucher,
  VoucherRequest,
  VoucherStats,
  VoucherFilters,
  CreateVoucherRequestDTO,
  AssignVoucherDTO,
  ECPToolkitItem,
  ECPToolkitCategory,
} from './ecp.types';

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export class ECPService {
  // ==========================================================================
  // Dashboard
  // ==========================================================================

  static async getDashboardStats(): Promise<ServiceResult<ECPDashboardStats>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_ecp_dashboard_stats', {
        p_partner_id: user.id,
      });

      if (error) throw error;
      return { data: data as ECPDashboardStats, error: null };
    } catch (error) {
      console.error('Error fetching ECP dashboard stats:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Training Batches
  // ==========================================================================

  static async getBatches(filters: BatchFilters = {}): Promise<ServiceResult<TrainingBatch[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('ecp_training_batches')
        .select(`
          *,
          trainer:ecp_trainers(id, first_name, last_name, email)
        `)
        .eq('partner_id', user.id)
        .order('training_start_date', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.certification_type) {
        query = query.eq('certification_type', filters.certification_type);
      }
      if (filters.trainer_id) {
        query = query.eq('trainer_id', filters.trainer_id);
      }
      if (filters.search) {
        query = query.or(`batch_name.ilike.%${filters.search}%,batch_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get trainee counts
      const batchIds = data?.map(b => b.id) || [];
      if (batchIds.length > 0) {
        const { data: counts } = await supabase
          .from('ecp_trainees')
          .select('batch_id')
          .in('batch_id', batchIds);

        const countMap = (counts || []).reduce((acc, t) => {
          acc[t.batch_id] = (acc[t.batch_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        data?.forEach(batch => {
          batch.trainee_count = countMap[batch.id] || 0;
        });
      }

      return { data: data as TrainingBatch[], error: null };
    } catch (error) {
      console.error('Error fetching batches:', error);
      return { data: null, error: error as Error };
    }
  }

  static async getBatchById(id: string): Promise<ServiceResult<TrainingBatch>> {
    try {
      const { data, error } = await supabase
        .from('ecp_training_batches')
        .select(`
          *,
          trainer:ecp_trainers(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data: data as TrainingBatch, error: null };
    } catch (error) {
      console.error('Error fetching batch:', error);
      return { data: null, error: error as Error };
    }
  }

  static async createBatch(dto: CreateBatchDTO): Promise<ServiceResult<TrainingBatch>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate batch code
      const { data: codeData } = await supabase.rpc('generate_batch_code', {
        p_partner_id: user.id,
        p_certification_type: dto.certification_type,
      });

      const { data, error } = await supabase
        .from('ecp_training_batches')
        .insert({
          ...dto,
          partner_id: user.id,
          batch_code: codeData || `BATCH-${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as TrainingBatch, error: null };
    } catch (error) {
      console.error('Error creating batch:', error);
      return { data: null, error: error as Error };
    }
  }

  static async updateBatch(id: string, dto: UpdateBatchDTO): Promise<ServiceResult<TrainingBatch>> {
    try {
      const { data, error } = await supabase
        .from('ecp_training_batches')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as TrainingBatch, error: null };
    } catch (error) {
      console.error('Error updating batch:', error);
      return { data: null, error: error as Error };
    }
  }

  static async deleteBatch(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('ecp_training_batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting batch:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Trainers
  // ==========================================================================

  static async getTrainers(filters: TrainerFilters = {}): Promise<ServiceResult<Trainer[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('ecp_trainers')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.certification) {
        query = query.contains('certifications', [filters.certification]);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Add full_name
      const trainers = (data || []).map(t => ({
        ...t,
        full_name: `${t.first_name} ${t.last_name}`,
      }));

      return { data: trainers as Trainer[], error: null };
    } catch (error) {
      console.error('Error fetching trainers:', error);
      return { data: null, error: error as Error };
    }
  }

  static async getTrainer(id: string): Promise<ServiceResult<Trainer>> {
    try {
      const { data, error } = await supabase
        .from('ecp_trainers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const trainer = {
        ...data,
        full_name: `${data.first_name} ${data.last_name}`,
      };

      return { data: trainer as Trainer, error: null };
    } catch (error) {
      console.error('Error fetching trainer:', error);
      return { data: null, error: error as Error };
    }
  }

  static async createTrainer(dto: CreateTrainerDTO): Promise<ServiceResult<Trainer>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ecp_trainers')
        .insert({
          ...dto,
          partner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as Trainer, error: null };
    } catch (error) {
      console.error('Error creating trainer:', error);
      return { data: null, error: error as Error };
    }
  }

  static async updateTrainer(id: string, dto: UpdateTrainerDTO): Promise<ServiceResult<Trainer>> {
    try {
      const { data, error } = await supabase
        .from('ecp_trainers')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Trainer, error: null };
    } catch (error) {
      console.error('Error updating trainer:', error);
      return { data: null, error: error as Error };
    }
  }

  static async deleteTrainer(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('ecp_trainers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting trainer:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Trainees
  // ==========================================================================

  static async getTrainees(filters: TraineeFilters = {}): Promise<ServiceResult<Trainee[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('ecp_trainees')
        .select(`
          *,
          batch:ecp_training_batches(id, batch_code, batch_name, certification_type)
        `)
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (filters.batch_id) {
        query = query.eq('batch_id', filters.batch_id);
      }
      if (filters.certification_type) {
        query = query.eq('certification_type', filters.certification_type);
      }
      if (filters.enrollment_status) {
        query = query.eq('enrollment_status', filters.enrollment_status);
      }
      if (filters.certified !== undefined) {
        query = query.eq('certified', filters.certified);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Add full_name
      const trainees = (data || []).map(t => ({
        ...t,
        full_name: `${t.first_name} ${t.last_name}`,
      }));

      return { data: trainees as Trainee[], error: null };
    } catch (error) {
      console.error('Error fetching trainees:', error);
      return { data: null, error: error as Error };
    }
  }

  static async createTrainee(dto: CreateTraineeDTO): Promise<ServiceResult<Trainee>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Clean the DTO - convert empty strings to null for foreign keys
      const cleanedDto = {
        ...dto,
        partner_id: user.id,
        batch_id: dto.batch_id || null, // Convert empty string to null
      };

      const { data, error } = await supabase
        .from('ecp_trainees')
        .insert(cleanedDto)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Trainee, error: null };
    } catch (error) {
      console.error('Error creating trainee:', error);
      return { data: null, error: error as Error };
    }
  }

  static async createTraineesBulk(trainees: BulkTraineeUpload[], batchId: string, certificationType: string): Promise<ServiceResult<{ created: number; errors: string[] }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const errors: string[] = [];
      let created = 0;

      for (const trainee of trainees) {
        const { error } = await supabase
          .from('ecp_trainees')
          .insert({
            ...trainee,
            partner_id: user.id,
            batch_id: batchId,
            certification_type: certificationType,
          });

        if (error) {
          errors.push(`${trainee.email}: ${error.message}`);
        } else {
          created++;
        }
      }

      return { data: { created, errors }, error: null };
    } catch (error) {
      console.error('Error bulk creating trainees:', error);
      return { data: null, error: error as Error };
    }
  }

  static async updateTrainee(id: string, dto: UpdateTraineeDTO): Promise<ServiceResult<Trainee>> {
    try {
      const { data, error } = await supabase
        .from('ecp_trainees')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Trainee, error: null };
    } catch (error) {
      console.error('Error updating trainee:', error);
      return { data: null, error: error as Error };
    }
  }

  static async deleteTrainee(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('ecp_trainees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting trainee:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Vouchers
  // ==========================================================================

  static async getVoucherAllocations(): Promise<ServiceResult<VoucherAllocation[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ecp_voucher_allocations')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as VoucherAllocation[], error: null };
    } catch (error) {
      console.error('Error fetching voucher allocations:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Performance Metrics
  // ==========================================================================

  static async getPerformanceMetrics(periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<ServiceResult<PerformanceMetrics[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ecp_performance_metrics')
        .select('*')
        .eq('partner_id', user.id)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(12);

      if (error) throw error;
      return { data: data as PerformanceMetrics[], error: null };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // License Management
  // ==========================================================================

  /**
   * Get complete license info for the current partner
   * Uses the get_partner_license_info RPC function
   */
  static async getLicenseInfo(): Promise<ServiceResult<LicenseInfo>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_partner_license_info', {
        p_partner_id: user.id,
      });

      if (error) throw error;

      // Check for error in response
      if (data?.error) {
        throw new Error(data.error);
      }

      return { data: data as LicenseInfo, error: null };
    } catch (error) {
      console.error('Error fetching license info:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get the license record directly
   */
  static async getLicense(): Promise<ServiceResult<ECPLicense | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ecp_licenses')
        .select('*')
        .eq('partner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return { data: data as ECPLicense | null, error: null };
    } catch (error) {
      console.error('Error fetching license:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get license documents
   */
  static async getLicenseDocuments(): Promise<ServiceResult<LicenseDocument[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First get the license
      const { data: license } = await supabase
        .from('ecp_licenses')
        .select('id')
        .eq('partner_id', user.id)
        .maybeSingle();

      if (!license) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('ecp_license_documents')
        .select('*')
        .eq('license_id', license.id)
        .eq('is_current', true)
        .order('document_type');

      if (error) throw error;
      return { data: data as LicenseDocument[], error: null };
    } catch (error) {
      console.error('Error fetching license documents:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get license terms (for display)
   */
  static async getLicenseTerms(): Promise<ServiceResult<LicenseTerm[]>> {
    try {
      const { data, error } = await supabase
        .from('ecp_license_terms')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return { data: data as LicenseTerm[], error: null };
    } catch (error) {
      console.error('Error fetching license terms:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get compliance requirements
   */
  static async getComplianceRequirements(): Promise<ServiceResult<ComplianceRequirement[]>> {
    try {
      const { data, error } = await supabase
        .from('ecp_compliance_requirements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return { data: data as ComplianceRequirement[], error: null };
    } catch (error) {
      console.error('Error fetching compliance requirements:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get license requests
   */
  static async getLicenseRequests(): Promise<ServiceResult<LicenseRequest[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ecp_license_requests')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as LicenseRequest[], error: null };
    } catch (error) {
      console.error('Error fetching license requests:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Submit a license request (renewal or scope update)
   */
  static async submitLicenseRequest(dto: CreateLicenseRequestDTO): Promise<ServiceResult<LicenseRequest>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the license ID
      const { data: license } = await supabase
        .from('ecp_licenses')
        .select('id')
        .eq('partner_id', user.id)
        .single();

      if (!license) {
        throw new Error('No license found');
      }

      const { data, error } = await supabase
        .from('ecp_license_requests')
        .insert({
          ...dto,
          license_id: license.id,
          partner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // If it's a renewal request, update the license
      if (dto.request_type === 'renewal') {
        await supabase
          .from('ecp_licenses')
          .update({
            renewal_requested: true,
            renewal_requested_at: new Date().toISOString(),
          })
          .eq('id', license.id);
      }

      return { data: data as LicenseRequest, error: null };
    } catch (error) {
      console.error('Error submitting license request:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Cancel a pending license request
   */
  static async cancelLicenseRequest(requestId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('ecp_license_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error cancelling license request:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Voucher Management
  // ==========================================================================

  /**
   * Get all vouchers for the current partner
   */
  static async getVouchers(filters?: VoucherFilters): Promise<ServiceResult<Voucher[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('ecp_vouchers')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.certification_type) {
        query = query.eq('certification_type', filters.certification_type);
      }
      if (filters?.search) {
        query = query.or(`voucher_code.ilike.%${filters.search}%,assigned_to_email.ilike.%${filters.search}%,assigned_to_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as Voucher[], error: null };
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get voucher stats for the current partner
   */
  static async getVoucherStats(): Promise<ServiceResult<VoucherStats>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_partner_voucher_stats', {
        p_partner_id: user.id,
      });

      if (error) throw error;
      return { data: data as VoucherStats, error: null };
    } catch (error) {
      console.error('Error fetching voucher stats:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get voucher requests for the current partner
   */
  static async getVoucherRequests(): Promise<ServiceResult<VoucherRequest[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ecp_voucher_requests')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as VoucherRequest[], error: null };
    } catch (error) {
      console.error('Error fetching voucher requests:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Submit a voucher request
   */
  static async submitVoucherRequest(dto: CreateVoucherRequestDTO): Promise<ServiceResult<VoucherRequest>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const unitPrice = dto.unit_price ?? 150.00;

      const { data, error } = await supabase
        .from('ecp_voucher_requests')
        .insert({
          partner_id: user.id,
          certification_type: dto.certification_type,
          quantity: dto.quantity,
          unit_price: unitPrice,
          total_amount: dto.quantity * unitPrice,
          payment_method: dto.payment_method || 'invoice',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as VoucherRequest, error: null };
    } catch (error) {
      console.error('Error submitting voucher request:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Cancel a pending voucher request
   */
  static async cancelVoucherRequest(requestId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('ecp_voucher_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error cancelling voucher request:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Assign a voucher to a candidate
   */
  static async assignVoucher(dto: AssignVoucherDTO): Promise<ServiceResult<Voucher>> {
    try {
      const { data, error } = await supabase.rpc('assign_voucher', {
        p_voucher_id: dto.voucher_id,
        p_email: dto.email,
        p_name: dto.name,
        p_trainee_id: dto.trainee_id || null,
      });

      if (error) throw error;

      // Fetch the updated voucher
      const { data: voucher, error: fetchError } = await supabase
        .from('ecp_vouchers')
        .select('*')
        .eq('id', dto.voucher_id)
        .single();

      if (fetchError) throw fetchError;
      return { data: voucher as Voucher, error: null };
    } catch (error) {
      console.error('Error assigning voucher:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Unassign a voucher
   */
  static async unassignVoucher(voucherId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase.rpc('unassign_voucher', {
        p_voucher_id: voucherId,
      });

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error unassigning voucher:', error);
      return { data: null, error: error as Error };
    }
  }

  // ==========================================================================
  // Toolkit
  // ==========================================================================

  static async getToolkitItems(category?: ECPToolkitCategory): Promise<ServiceResult<ECPToolkitItem[]>> {
    try {
      let query = supabase
        .from('ecp_toolkit_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data as ECPToolkitItem[], error: null };
    } catch (error) {
      console.error('Error fetching toolkit items:', error);
      return { data: null, error: error as Error };
    }
  }
}
