/**
 * Admin Permissions Hooks
 * React Query hooks for admin permissions management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminPermissionsService } from './admin-permissions.service';
import type {
  AdminUserFilters,
  ActivityLogFilters,
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminRoleType,
} from './admin-permissions.types';

// ============================================
// ADMIN ROLES HOOKS
// ============================================

/**
 * Get all admin roles
 */
export const useAdminRoles = () => {
  return useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => AdminPermissionsService.getAdminRoles(),
  });
};

/**
 * Get a specific admin role
 */
export const useAdminRole = (roleType: AdminRoleType) => {
  return useQuery({
    queryKey: ['admin-role', roleType],
    queryFn: () => AdminPermissionsService.getAdminRole(roleType),
    enabled: !!roleType,
  });
};

// ============================================
// PERMISSIONS HOOKS
// ============================================

/**
 * Get all available permissions
 */
export const useAllPermissions = () => {
  return useQuery({
    queryKey: ['admin-permissions-all'],
    queryFn: () => AdminPermissionsService.getAllPermissions(),
  });
};

/**
 * Get permissions for a specific role
 */
export const useRolePermissions = (roleType: AdminRoleType) => {
  return useQuery({
    queryKey: ['role-permissions', roleType],
    queryFn: () => AdminPermissionsService.getRolePermissions(roleType),
    enabled: !!roleType,
  });
};

/**
 * Get current user's permissions
 */
export const useCurrentUserPermissions = () => {
  return useQuery({
    queryKey: ['current-user-permissions'],
    queryFn: () => AdminPermissionsService.getCurrentUserPermissions(),
  });
};

/**
 * Check if current user has a specific permission
 */
export const useHasPermission = (permissionKey: string) => {
  return useQuery({
    queryKey: ['has-permission', permissionKey],
    queryFn: () => AdminPermissionsService.hasPermission(permissionKey),
    enabled: !!permissionKey,
  });
};

/**
 * Update role permissions (Super Admin only)
 */
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleType,
      permissionIds,
    }: {
      roleType: AdminRoleType;
      permissionIds: string[];
    }) => AdminPermissionsService.updateRolePermissions(roleType, permissionIds),
    onSuccess: (_, { roleType }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', roleType] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

// ============================================
// ADMIN USERS HOOKS
// ============================================

/**
 * Get all admin users with details
 */
export const useAdminUsers = (filters?: AdminUserFilters) => {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => AdminPermissionsService.getAdminUsers(filters),
  });
};

/**
 * Get admin user by ID
 */
export const useAdminUser = (adminUserId: string) => {
  return useQuery({
    queryKey: ['admin-user', adminUserId],
    queryFn: () => AdminPermissionsService.getAdminUserById(adminUserId),
    enabled: !!adminUserId,
  });
};

/**
 * Get admin user by user ID
 */
export const useAdminUserByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['admin-user-by-user', userId],
    queryFn: () => AdminPermissionsService.getAdminUserByUserId(userId),
    enabled: !!userId,
  });
};

/**
 * Create admin user (Super Admin only)
 */
export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAdminRequest) =>
      AdminPermissionsService.createAdminUser(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });
};

/**
 * Update admin user
 */
export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      adminUserId,
      updates,
    }: {
      adminUserId: string;
      updates: UpdateAdminRequest;
    }) => AdminPermissionsService.updateAdminUser(adminUserId, updates),
    onSuccess: (_, { adminUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', adminUserId] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });
};

/**
 * Deactivate admin user
 */
export const useDeactivateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      adminUserId,
      reason,
    }: {
      adminUserId: string;
      reason: string;
    }) => AdminPermissionsService.deactivateAdminUser(adminUserId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });
};

/**
 * Reactivate admin user
 */
export const useReactivateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminUserId: string) =>
      AdminPermissionsService.reactivateAdminUser(adminUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });
};

/**
 * Reset admin password
 */
export const useResetAdminPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminUserId: string) =>
      AdminPermissionsService.resetAdminPassword(adminUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
    },
  });
};

// ============================================
// ACTIVITY LOGS HOOKS
// ============================================

/**
 * Get activity logs
 */
export const useAdminActivityLogs = (filters?: ActivityLogFilters) => {
  return useQuery({
    queryKey: ['admin-activity-logs', filters],
    queryFn: () => AdminPermissionsService.getActivityLogs(filters),
  });
};

// ============================================
// STATISTICS HOOKS
// ============================================

/**
 * Get admin statistics
 */
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => AdminPermissionsService.getAdminStats(),
  });
};
