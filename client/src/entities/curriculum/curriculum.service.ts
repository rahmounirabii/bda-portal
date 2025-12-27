import { supabase } from '@/shared/config/supabase.config';
import type {
  CurriculumModule,
  CurriculumModuleInsert,
  CurriculumModuleUpdate,
  UserCurriculumProgress,
  ModuleFilters,
  ServiceResponse,
  CurriculumModuleWithStatus,
  ModuleDetail,
} from './curriculum.types';

/**
 * Curriculum Service
 * Handles all curriculum module operations
 */
export class CurriculumService {
  // ==========================================================================
  // MODULE CRUD OPERATIONS (Admin)
  // ==========================================================================

  /**
   * Get all modules with optional filters
   */
  static async getModules(
    filters?: ModuleFilters
  ): Promise<ServiceResponse<CurriculumModule[]>> {
    try {
      let query = supabase
        .from('curriculum_modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (filters?.section_type) {
        query = query.eq('section_type', filters.section_type);
      }

      if (filters?.certification_type) {
        query = query.eq('certification_type', filters.certification_type);
      }

      if (filters?.is_published !== undefined) {
        query = query.eq('is_published', filters.is_published);
      }

      if (filters?.search) {
        query = query.or(
          `competency_name.ilike.%${filters.search}%,competency_name_ar.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'FETCH_ERROR',
          message: 'Failed to fetch curriculum modules',
          details: error,
        },
      };
    }
  }

  /**
   * Get single module by ID
   */
  static async getModuleById(
    moduleId: string
  ): Promise<ServiceResponse<CurriculumModule>> {
    try {
      const { data, error } = await supabase
        .from('curriculum_modules')
        .select('*')
        .eq('id', moduleId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'Module not found',
          },
        };
      }

      return { data };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'FETCH_ERROR',
          message: 'Failed to fetch module',
          details: error,
        },
      };
    }
  }

  /**
   * Create new module (Admin only)
   */
  static async createModule(
    module: CurriculumModuleInsert
  ): Promise<ServiceResponse<CurriculumModule>> {
    try {
      const { data, error } = await supabase
        .from('curriculum_modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;

      return { data };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'CREATE_ERROR',
          message: 'Failed to create module',
          details: error,
        },
      };
    }
  }

  /**
   * Update existing module (Admin only)
   */
  static async updateModule(
    moduleId: string,
    updates: CurriculumModuleUpdate
  ): Promise<ServiceResponse<CurriculumModule>> {
    try {
      const { data, error } = await supabase
        .from('curriculum_modules')
        .update(updates)
        .eq('id', moduleId)
        .select()
        .single();

      if (error) throw error;

      return { data };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'UPDATE_ERROR',
          message: 'Failed to update module',
          details: error,
        },
      };
    }
  }

  /**
   * Delete module (Admin only)
   */
  static async deleteModule(moduleId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('curriculum_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      return { data: undefined };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'DELETE_ERROR',
          message: 'Failed to delete module',
          details: error,
        },
      };
    }
  }

  /**
   * Publish/unpublish module (Admin only)
   */
  static async togglePublishModule(
    moduleId: string,
    isPublished: boolean
  ): Promise<ServiceResponse<CurriculumModule>> {
    return this.updateModule(moduleId, { is_published: isPublished });
  }

  // ==========================================================================
  // USER-FACING OPERATIONS
  // ==========================================================================

  /**
   * Get modules with user progress and unlock status
   */
  static async getModulesWithProgress(
    userId: string,
    certificationType: string
  ): Promise<ServiceResponse<CurriculumModuleWithStatus[]>> {
    try {
      // Get all published modules
      const { data: modules, error: modulesError } = await supabase
        .from('curriculum_modules')
        .select('*')
        .eq('certification_type', certificationType)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Get user progress for all modules
      const { data: progress, error: progressError } = await supabase
        .from('user_curriculum_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Create map of progress
      const progressMap = new Map(
        progress?.map((p) => [p.module_id, p]) || []
      );

      // Combine modules with progress and check unlock status
      const modulesWithStatus: CurriculumModuleWithStatus[] = [];

      for (const module of modules || []) {
        const userProgress = progressMap.get(module.id);

        // Check if module is unlocked
        const { data: isUnlocked } = await supabase.rpc('is_module_unlocked', {
          p_user_id: userId,
          p_module_id: module.id,
        });

        modulesWithStatus.push({
          ...module,
          is_unlocked: isUnlocked || false,
          user_progress: userProgress,
        });
      }

      return { data: modulesWithStatus };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'FETCH_ERROR',
          message: 'Failed to fetch modules with progress',
          details: error,
        },
      };
    }
  }

  /**
   * Get module detail with full context
   */
  static async getModuleDetail(
    userId: string,
    moduleId: string
  ): Promise<ServiceResponse<ModuleDetail>> {
    try {
      // Get module
      const { data: module, error: moduleError } = await supabase
        .from('curriculum_modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;

      // Get user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_curriculum_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        // PGRST116 = not found, which is OK
        throw progressError;
      }

      // Check unlock status
      const { data: isUnlocked } = await supabase.rpc('is_module_unlocked', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      // Get prerequisite module if exists
      let prerequisiteModule: CurriculumModule | undefined;
      if (module.prerequisite_module_id) {
        const { data: prereq } = await supabase
          .from('curriculum_modules')
          .select('*')
          .eq('id', module.prerequisite_module_id)
          .single();

        prerequisiteModule = prereq || undefined;
      }

      // Get next module
      const { data: nextModule } = await supabase
        .from('curriculum_modules')
        .select('*')
        .eq('certification_type', module.certification_type)
        .eq('is_published', true)
        .gt('order_index', module.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      return {
        data: {
          module,
          progress: progress || {
            user_id: userId,
            module_id: moduleId,
            status: 'locked',
            progress_percentage: 0,
            time_spent_minutes: 0,
            quiz_attempts_count: 0,
          } as UserCurriculumProgress,
          isUnlocked: isUnlocked || false,
          prerequisiteModule,
          nextModule: nextModule || undefined,
        },
      };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'FETCH_ERROR',
          message: 'Failed to fetch module detail',
          details: error,
        },
      };
    }
  }

  /**
   * Get next unlocked module for user
   */
  static async getNextUnlockedModule(
    userId: string,
    certificationType: string
  ): Promise<ServiceResponse<CurriculumModule | null>> {
    try {
      const { data: moduleId, error } = await supabase.rpc(
        'get_next_unlocked_module',
        {
          p_user_id: userId,
          p_certification_type: certificationType,
        }
      );

      if (error) throw error;

      if (!moduleId) {
        return { data: null };
      }

      const { data: module } = await this.getModuleById(moduleId);

      return { data: module || null };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'FETCH_ERROR',
          message: 'Failed to get next module',
          details: error,
        },
      };
    }
  }

  // ==========================================================================
  // PREREQUISITE CHECKS
  // ==========================================================================

  /**
   * Check if a module is unlocked for a user
   */
  static async checkModuleUnlocked(
    userId: string,
    moduleId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase.rpc('is_module_unlocked', {
        p_user_id: userId,
        p_module_id: moduleId,
      });

      if (error) throw error;

      return { data: data || false };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'CHECK_ERROR',
          message: 'Failed to check module unlock status',
          details: error,
        },
      };
    }
  }

  /**
   * Get prerequisite chain for a module
   */
  static async getPrerequisiteChain(
    moduleId: string
  ): Promise<ServiceResponse<CurriculumModule[]>> {
    try {
      const chain: CurriculumModule[] = [];
      let currentModuleId: string | null = moduleId;

      while (currentModuleId) {
        const { data: module, error } = await supabase
          .from('curriculum_modules')
          .select('*')
          .eq('id', currentModuleId)
          .single();

        if (error) throw error;

        chain.unshift(module);
        currentModuleId = module.prerequisite_module_id;
      }

      return { data: chain };
    } catch (error: any) {
      return {
        error: {
          code: error.code || 'FETCH_ERROR',
          message: 'Failed to fetch prerequisite chain',
          details: error,
        },
      };
    }
  }
}
