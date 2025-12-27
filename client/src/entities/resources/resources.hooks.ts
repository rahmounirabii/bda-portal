import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResourcesService } from './resources.service';
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
  ResourceStats,
} from './resources.types';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const resourcesKeys = {
  all: ['resources'] as const,

  // Configuration
  types: () => [...resourcesKeys.all, 'types'] as const,
  categories: () => [...resourcesKeys.all, 'categories'] as const,
  visibilityRules: () => [...resourcesKeys.all, 'visibility-rules'] as const,

  // Resources
  resources: (filters?: ResourceFilters) => [...resourcesKeys.all, 'list', filters] as const,
  resource: (id: string) => [...resourcesKeys.all, 'detail', id] as const,
  stats: () => [...resourcesKeys.all, 'stats'] as const,

  // Download
  downloadUrl: (filePath: string) => [...resourcesKeys.all, 'download', filePath] as const,
};

// ============================================================================
// CONFIGURATION HOOKS (Admin)
// ============================================================================

/**
 * Get all resource types
 */
export function useResourceTypes() {
  return useQuery({
    queryKey: resourcesKeys.types(),
    queryFn: async () => {
      const result = await ResourcesService.getResourceTypes();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create resource type (Admin)
 */
export function useCreateResourceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateResourceTypeDTO) => {
      const result = await ResourcesService.createResourceType(dto);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.types() });
      toast.success('Resource type created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create resource type: ${error.message}`);
    },
  });
}

/**
 * Update resource type (Admin)
 */
export function useUpdateResourceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateResourceTypeDTO }) => {
      const result = await ResourcesService.updateResourceType(id, dto);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.types() });
      toast.success('Resource type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update resource type: ${error.message}`);
    },
  });
}

/**
 * Delete resource type (Admin)
 */
export function useDeleteResourceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await ResourcesService.deleteResourceType(id);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.types() });
      toast.success('Resource type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete resource type: ${error.message}`);
    },
  });
}

/**
 * Get all resource categories
 */
export function useResourceCategories() {
  return useQuery({
    queryKey: resourcesKeys.categories(),
    queryFn: async () => {
      const result = await ResourcesService.getResourceCategories();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create resource category (Admin)
 */
export function useCreateResourceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateResourceCategoryDTO) => {
      const result = await ResourcesService.createResourceCategory(dto);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.categories() });
      toast.success('Resource category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create resource category: ${error.message}`);
    },
  });
}

/**
 * Update resource category (Admin)
 */
export function useUpdateResourceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateResourceCategoryDTO }) => {
      const result = await ResourcesService.updateResourceCategory(id, dto);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.categories() });
      toast.success('Resource category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update resource category: ${error.message}`);
    },
  });
}

/**
 * Get all visibility rules
 */
export function useVisibilityRules() {
  return useQuery({
    queryKey: resourcesKeys.visibilityRules(),
    queryFn: async () => {
      const result = await ResourcesService.getVisibilityRules();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// RESOURCES HOOKS
// ============================================================================

/**
 * Get resources with filters
 */
export function useResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: resourcesKeys.resources(filters),
    queryFn: async () => {
      const result = await ResourcesService.getResources(filters);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create resource with file upload (Admin)
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateResourceDTO) => {
      const result = await ResourcesService.createResource(dto);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      toast.success('Resource uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload resource: ${error.message}`);
    },
  });
}

/**
 * Update resource (Admin)
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateResourceDTO }) => {
      const result = await ResourcesService.updateResource(id, dto);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      if (data) {
        queryClient.setQueryData(resourcesKeys.resource(data.id), data);
      }
      toast.success('Resource updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update resource: ${error.message}`);
    },
  });
}

/**
 * Delete resource (Admin)
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await ResourcesService.deleteResource(id);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      toast.success('Resource deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete resource: ${error.message}`);
    },
  });
}

/**
 * Get download URL for resource
 */
export function useResourceDownloadUrl(filePath: string | null) {
  return useQuery({
    queryKey: resourcesKeys.downloadUrl(filePath || ''),
    queryFn: async () => {
      if (!filePath) return null;
      const result = await ResourcesService.getDownloadUrl(filePath);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!filePath,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Log resource access
 */
export function useLogResourceAccess() {
  return useMutation({
    mutationFn: async ({
      resourceId,
      userId,
      action,
    }: {
      resourceId: string;
      userId: string;
      action: 'view' | 'download';
    }) => {
      const result = await ResourcesService.logAccess(resourceId, userId, action);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onError: (error: Error) => {
      console.error('Failed to log resource access:', error.message);
    },
  });
}

/**
 * Get resource statistics (Admin)
 */
export function useResourceStats() {
  return useQuery({
    queryKey: resourcesKeys.stats(),
    queryFn: async () => {
      const result = await ResourcesService.getResourceStats();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Upload file to Supabase Storage (Admin)
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const result = await ResourcesService.uploadFile(file, folder);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onError: (error: Error) => {
      toast.error(`File upload failed: ${error.message}`);
    },
  });
}
