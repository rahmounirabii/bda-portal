import { supabase } from '@/lib/supabase';
import type {
  Resource,
  ResourceType,
  ResourceCategory,
  ResourceVisibilityRule,
  CreateResourceDTO,
  UpdateResourceDTO,
  CreateResourceTypeDTO,
  UpdateResourceTypeDTO,
  CreateResourceCategoryDTO,
  UpdateResourceCategoryDTO,
  ResourceFilters,
  ResourceResult,
  ResourceStats,
} from './resources.types';

/**
 * Resources Service
 * Handles all resource operations (dynamic & configurable)
 */

const STORAGE_BUCKET = 'resources';

export class ResourcesService {
  // ============================================================================
  // CONFIGURATION MANAGEMENT (Admin)
  // ============================================================================

  /**
   * Get all resource types
   */
  static async getResourceTypes(): Promise<ResourceResult<ResourceType[]>> {
    try {
      const { data, error } = await supabase
        .from('resource_types')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return { data: data as ResourceType[], error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Create resource type
   */
  static async createResourceType(dto: CreateResourceTypeDTO): Promise<ResourceResult<ResourceType>> {
    try {
      const { data, error } = await supabase
        .from('resource_types')
        .insert(dto)
        .select()
        .single();

      if (error) throw error;
      return { data: data as ResourceType, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'CREATE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Update resource type
   */
  static async updateResourceType(
    id: string,
    dto: UpdateResourceTypeDTO
  ): Promise<ResourceResult<ResourceType>> {
    try {
      const { data, error } = await supabase
        .from('resource_types')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as ResourceType, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'UPDATE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Delete resource type
   */
  static async deleteResourceType(id: string): Promise<ResourceResult<boolean>> {
    try {
      const { error } = await supabase.from('resource_types').delete().eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'DELETE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Get all resource categories
   */
  static async getResourceCategories(): Promise<ResourceResult<ResourceCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('resource_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return { data: data as ResourceCategory[], error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Create resource category
   */
  static async createResourceCategory(
    dto: CreateResourceCategoryDTO
  ): Promise<ResourceResult<ResourceCategory>> {
    try {
      const { data, error } = await supabase
        .from('resource_categories')
        .insert(dto)
        .select()
        .single();

      if (error) throw error;
      return { data: data as ResourceCategory, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'CREATE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Update resource category
   */
  static async updateResourceCategory(
    id: string,
    dto: UpdateResourceCategoryDTO
  ): Promise<ResourceResult<ResourceCategory>> {
    try {
      const { data, error } = await supabase
        .from('resource_categories')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as ResourceCategory, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'UPDATE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Get all visibility rules
   */
  static async getVisibilityRules(): Promise<ResourceResult<ResourceVisibilityRule[]>> {
    try {
      const { data, error } = await supabase
        .from('resource_visibility_rules')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return { data: data as ResourceVisibilityRule[], error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: err.message, details: err },
      };
    }
  }

  // ============================================================================
  // RESOURCES MANAGEMENT
  // ============================================================================

  /**
   * Get resources with filters (includes joined data)
   */
  static async getResources(filters?: ResourceFilters): Promise<ResourceResult<Resource[]>> {
    try {
      let query = supabase
        .from('resources')
        .select(`
          *,
          resource_type:resource_types(*),
          category:resource_categories(*),
          visibility_rule:resource_visibility_rules(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.resource_type_id) {
        query = query.eq('resource_type_id', filters.resource_type_id);
      }

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters?.certification_type && filters.certification_type !== 'all') {
        query = query.eq('certification_type', filters.certification_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.visibility_rule_id) {
        query = query.eq('visibility_rule_id', filters.visibility_rule_id);
      }

      if (filters?.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as Resource[], error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  static async uploadFile(file: File, folder = 'general'): Promise<ResourceResult<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;
      return { data: data.path, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'UPLOAD_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Create resource (with file upload)
   */
  static async createResource(dto: CreateResourceDTO): Promise<ResourceResult<Resource>> {
    try {
      // Upload main file
      const fileResult = await this.uploadFile(dto.file, 'files');
      if (fileResult.error) throw new Error(fileResult.error.message);

      // Upload thumbnail if provided
      let thumbnailPath: string | undefined;
      if (dto.thumbnail) {
        const thumbResult = await this.uploadFile(dto.thumbnail, 'thumbnails');
        if (thumbResult.error) throw new Error(thumbResult.error.message);
        thumbnailPath = thumbResult.data!;
      }

      // Create resource record
      const { data, error } = await supabase
        .from('resources')
        .insert({
          title: dto.title,
          title_ar: dto.title_ar,
          description: dto.description,
          description_ar: dto.description_ar,
          file_path: fileResult.data!,
          file_size: dto.file.size,
          file_type: dto.file.type,
          thumbnail_path: thumbnailPath,
          resource_type_id: dto.resource_type_id,
          category_id: dto.category_id,
          certification_type: dto.certification_type,
          tags: dto.tags || [],
          visibility_rule_id: dto.visibility_rule_id,
          requires_certification: dto.requires_certification || false,
          requires_purchase: dto.requires_purchase || false,
          woocommerce_product_id: dto.woocommerce_product_id,
          language: dto.language || 'en',
          version: dto.version || '1.0',
        })
        .select(`
          *,
          resource_type:resource_types(*),
          category:resource_categories(*),
          visibility_rule:resource_visibility_rules(*)
        `)
        .single();

      if (error) throw error;
      return { data: data as Resource, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'CREATE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Update resource
   */
  static async updateResource(
    id: string,
    dto: UpdateResourceDTO
  ): Promise<ResourceResult<Resource>> {
    try {
      const { data, error } = await supabase
        .from('resources')
        .update(dto)
        .eq('id', id)
        .select(`
          *,
          resource_type:resource_types(*),
          category:resource_categories(*),
          visibility_rule:resource_visibility_rules(*)
        `)
        .single();

      if (error) throw error;
      return { data: data as Resource, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'UPDATE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Delete resource
   */
  static async deleteResource(id: string): Promise<ResourceResult<boolean>> {
    try {
      // Get resource to delete file from storage
      const { data: resource } = await supabase
        .from('resources')
        .select('file_path, thumbnail_path')
        .eq('id', id)
        .single();

      // Delete from database
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;

      // Delete files from storage
      if (resource) {
        await supabase.storage.from(STORAGE_BUCKET).remove([resource.file_path]);
        if (resource.thumbnail_path) {
          await supabase.storage.from(STORAGE_BUCKET).remove([resource.thumbnail_path]);
        }
      }

      return { data: true, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'DELETE_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Get download URL for resource (signed URL for private storage)
   */
  static async getDownloadUrl(filePath: string): Promise<ResourceResult<string>> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, 3600); // 1 hour validity

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to generate signed URL');

      return { data: data.signedUrl, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'URL_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Log resource access
   */
  static async logAccess(
    resourceId: string,
    userId: string,
    action: 'view' | 'download'
  ): Promise<ResourceResult<boolean>> {
    try {
      const { error } = await supabase.from('resource_access_log').insert({
        resource_id: resourceId,
        user_id: userId,
        action,
      });

      if (error) throw error;
      return { data: true, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'LOG_ERROR', message: err.message, details: err },
      };
    }
  }

  /**
   * Get resource stats (Admin)
   */
  static async getResourceStats(): Promise<ResourceResult<ResourceStats>> {
    try {
      const { data: resources, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_type:resource_types(type_key),
          category:resource_categories(category_key)
        `)
        .eq('status', 'published');

      if (error) throw error;

      const stats: ResourceStats = {
        total_resources: resources?.length || 0,
        total_downloads: resources?.reduce((sum, r) => sum + (r.download_count || 0), 0) || 0,
        by_type: {},
        by_category: {},
        most_downloaded: (resources || [])
          .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
          .slice(0, 5) as Resource[],
        recent_uploads: (resources || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5) as Resource[],
      };

      // Count by type
      resources?.forEach((r: any) => {
        const typeKey = r.resource_type?.type_key || 'unknown';
        stats.by_type[typeKey] = (stats.by_type[typeKey] || 0) + 1;
      });

      // Count by category
      resources?.forEach((r: any) => {
        const catKey = r.category?.category_key || 'uncategorized';
        stats.by_category[catKey] = (stats.by_category[catKey] || 0) + 1;
      });

      return { data: stats, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: { code: 'STATS_ERROR', message: err.message, details: err },
      };
    }
  }
}
