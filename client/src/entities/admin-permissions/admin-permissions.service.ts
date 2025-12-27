/**
 * Admin Permissions Service
 * Service methods for admin permissions management (US1-US3)
 */

import { supabase } from '@/lib/supabase';
import type {
  AdminRole,
  AdminPermission,
  AdminUser,
  AdminUserWithDetails,
  AdminActivityLog,
  AdminActivityLogWithDetails,
  AdminUserFilters,
  ActivityLogFilters,
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminStats,
  AdminRoleType,
} from './admin-permissions.types';

export const AdminPermissionsService = {
  // ============================================
  // ADMIN ROLES
  // ============================================

  /**
   * Get all admin roles
   */
  async getAdminRoles(): Promise<AdminRole[]> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('is_active', true)
      .order('hierarchy_level', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get admin role by type
   */
  async getAdminRole(roleType: AdminRoleType): Promise<AdminRole | null> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('role_type', roleType)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ============================================
  // PERMISSIONS
  // ============================================

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<AdminPermission[]> {
    const { data, error } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('is_active', true)
      .order('module')
      .order('permission_key');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleType: AdminRoleType): Promise<string[]> {
    const { data, error } = await supabase
      .from('admin_role_permissions')
      .select(`
        permission_id,
        admin_permissions!inner (
          permission_key
        )
      `)
      .eq('role_type', roleType);

    if (error) throw error;
    return data?.map((d: any) => d.admin_permissions.permission_key) || [];
  },

  /**
   * Get permissions for current user
   */
  async getCurrentUserPermissions(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .rpc('get_admin_permissions', { p_user_id: user.id });

    if (error) throw error;
    return data || [];
  },

  /**
   * Check if current user has a specific permission
   */
  async hasPermission(permissionKey: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('admin_has_permission', {
        p_user_id: user.id,
        p_permission_key: permissionKey,
      });

    if (error) throw error;
    return data || false;
  },

  /**
   * Update role permissions (Super Admin only)
   */
  async updateRolePermissions(
    roleType: AdminRoleType,
    permissionIds: string[]
  ): Promise<void> {
    // First delete existing permissions
    const { error: deleteError } = await supabase
      .from('admin_role_permissions')
      .delete()
      .eq('role_type', roleType);

    if (deleteError) throw deleteError;

    // Then insert new permissions
    if (permissionIds.length > 0) {
      const { error: insertError } = await supabase
        .from('admin_role_permissions')
        .insert(
          permissionIds.map((permissionId) => ({
            role_type: roleType,
            permission_id: permissionId,
          }))
        );

      if (insertError) throw insertError;
    }
  },

  // ============================================
  // ADMIN USERS (US1, US3)
  // ============================================

  /**
   * Get all admin users with details
   */
  async getAdminUsers(filters?: AdminUserFilters): Promise<AdminUserWithDetails[]> {
    let query = supabase
      .from('admin_users')
      .select(`
        *,
        user:users!inner (
          id,
          email,
          first_name,
          last_name,
          phone,
          country_code,
          is_active,
          last_login_at
        ),
        role:admin_roles!inner (
          id,
          role_type,
          display_name,
          display_name_ar,
          description,
          description_ar,
          hierarchy_level
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.role_type) {
      query = query.eq('admin_role_type', filters.role_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }

    if (filters?.search) {
      query = query.or(
        `user.email.ilike.%${filters.search}%,user.first_name.ilike.%${filters.search}%,user.last_name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get permissions for each admin
    const adminsWithPermissions = await Promise.all(
      (data || []).map(async (admin: any) => {
        const permissions = await this.getEffectivePermissions(
          admin.admin_role_type,
          admin.custom_permissions_added || [],
          admin.custom_permissions_removed || []
        );
        return { ...admin, permissions };
      })
    );

    return adminsWithPermissions;
  },

  /**
   * Get admin user by ID
   */
  async getAdminUserById(adminUserId: string): Promise<AdminUserWithDetails | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        user:users!inner (
          id,
          email,
          first_name,
          last_name,
          phone,
          country_code,
          is_active,
          last_login_at
        ),
        role:admin_roles!inner (
          id,
          role_type,
          display_name,
          display_name_ar,
          description,
          description_ar,
          hierarchy_level
        )
      `)
      .eq('id', adminUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const permissions = await this.getEffectivePermissions(
      data.admin_role_type,
      data.custom_permissions_added || [],
      data.custom_permissions_removed || []
    );

    return { ...data, permissions } as AdminUserWithDetails;
  },

  /**
   * Get admin user by user ID
   */
  async getAdminUserByUserId(userId: string): Promise<AdminUserWithDetails | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        user:users!inner (
          id,
          email,
          first_name,
          last_name,
          phone,
          country_code,
          is_active,
          last_login_at
        ),
        role:admin_roles!inner (
          id,
          role_type,
          display_name,
          display_name_ar,
          description,
          description_ar,
          hierarchy_level
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const permissions = await this.getEffectivePermissions(
      data.admin_role_type,
      data.custom_permissions_added || [],
      data.custom_permissions_removed || []
    );

    return { ...data, permissions } as AdminUserWithDetails;
  },

  /**
   * Calculate effective permissions for an admin
   */
  async getEffectivePermissions(
    roleType: AdminRoleType,
    customAdded: string[],
    customRemoved: string[]
  ): Promise<string[]> {
    // Super admin gets all permissions
    if (roleType === 'super_admin') {
      const allPerms = await this.getAllPermissions();
      return allPerms.map((p) => p.permission_key);
    }

    // Get role default permissions
    const rolePerms = await this.getRolePermissions(roleType);

    // Add custom added, remove custom removed
    const effectivePerms = new Set([...rolePerms, ...customAdded]);
    customRemoved.forEach((p) => effectivePerms.delete(p));

    return Array.from(effectivePerms);
  },

  /**
   * Create a new admin user (US1 - Super Admin only)
   * Uses Edge Function in production for secure user creation
   */
  async createAdminUser(request: CreateAdminRequest): Promise<AdminUser> {
    // First check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', request.email)
      .single();

    if (userError && userError.code !== 'PGRST116') throw userError;

    let userId = existingUser?.id;

    // If user doesn't exist, we need to create them through Edge Function
    if (!userId) {
      if (!request.password) {
        throw new Error('Password is required to create a new user');
      }

      // Call Edge Function to create user securely
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-user', {
        body: {
          email: request.email,
          password: request.password,
          first_name: request.first_name,
          last_name: request.last_name,
          role: 'admin',
          admin_role_type: request.admin_role_type,
          department: request.department,
          source: 'admin_created',
        },
      });

      if (createError) throw new Error(createError.message || 'Failed to create user');
      if (createResult?.error) throw new Error(createResult.error);

      userId = createResult?.user_id;
      if (!userId) throw new Error('User ID not returned');

      // The Edge Function already creates the admin_users entry, so fetch it
      const { data, error } = await supabase
        .from('admin_users')
        .select()
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('account_create', 'admin', data.id, null, {
        email: request.email,
        role: request.admin_role_type,
      });

      return data;
    }

    // User exists, just update their profile and create admin entry
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: request.first_name,
        last_name: request.last_name,
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create admin_users entry
    const { data, error } = await supabase
      .from('admin_users')
      .upsert(
        {
          user_id: userId,
          admin_role_type: request.admin_role_type,
          department: request.department || null,
          is_active: true,
          password_reset_required: true,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity('account_create', 'admin', data.id, null, {
      email: request.email,
      role: request.admin_role_type,
    });

    return data;
  },

  /**
   * Update admin user (US2, US3)
   */
  async updateAdminUser(
    adminUserId: string,
    updates: UpdateAdminRequest
  ): Promise<AdminUser> {
    const { data: currentAdmin } = await supabase
      .from('admin_users')
      .select('admin_role_type')
      .eq('id', adminUserId)
      .single();

    const { data, error } = await supabase
      .from('admin_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminUserId)
      .select()
      .single();

    if (error) throw error;

    // Log role change if applicable
    if (updates.admin_role_type && updates.admin_role_type !== currentAdmin?.admin_role_type) {
      await this.logActivity('role_change', 'admin', adminUserId,
        { role: currentAdmin?.admin_role_type },
        { role: updates.admin_role_type }
      );
    }

    return data;
  },

  /**
   * Deactivate admin user (US3)
   */
  async deactivateAdminUser(adminUserId: string, reason: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    // Get admin's user_id
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('id', adminUserId)
      .single();

    if (adminError) throw adminError;

    // Update admin_users
    const { error } = await supabase
      .from('admin_users')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: user?.id,
        deactivation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminUserId);

    if (error) throw error;

    // Downgrade user role
    await supabase
      .from('users')
      .update({
        role: 'individual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminData.user_id);

    // Log activity
    await this.logActivity('account_deactivate', 'admin', adminUserId, null, { reason });
  },

  /**
   * Reactivate admin user (US3)
   */
  async reactivateAdminUser(adminUserId: string): Promise<void> {
    // Get admin's user_id
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('id', adminUserId)
      .single();

    if (adminError) throw adminError;

    // Update admin_users
    const { error } = await supabase
      .from('admin_users')
      .update({
        is_active: true,
        deactivated_at: null,
        deactivated_by: null,
        deactivation_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminUserId);

    if (error) throw error;

    // Restore admin role
    await supabase
      .from('users')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminData.user_id);

    // Log activity
    await this.logActivity('account_reactivate', 'admin', adminUserId);
  },

  /**
   * Reset admin password (US3)
   */
  async resetAdminPassword(adminUserId: string): Promise<void> {
    // Get admin's email
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('user:users!inner(email)')
      .eq('id', adminUserId)
      .single();

    if (adminError) throw adminError;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(
      (adminData as any).user.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) throw error;

    // Update password_reset_required flag
    await supabase
      .from('admin_users')
      .update({
        password_reset_required: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminUserId);

    // Log activity
    await this.logActivity('password_reset', 'admin', adminUserId);
  },

  // ============================================
  // ACTIVITY LOGS (US3)
  // ============================================

  /**
   * Get activity logs
   */
  async getActivityLogs(filters?: ActivityLogFilters): Promise<AdminActivityLogWithDetails[]> {
    let query = supabase
      .from('admin_activity_logs')
      .select(`
        *,
        admin_user:admin_users (
          id,
          user:users (
            email,
            first_name,
            last_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.admin_user_id) {
      query = query.eq('admin_user_id', filters.admin_user_id);
    }

    if (filters?.action_type) {
      query = query.eq('action_type', filters.action_type);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Log an admin activity
   */
  async logActivity(
    actionType: string,
    targetType?: string,
    targetId?: string,
    oldValue?: Record<string, unknown> | null,
    newValue?: Record<string, unknown> | null
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get admin_user_id
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_user_id: adminUser?.id || null,
        action_type: actionType,
        action_target_type: targetType || null,
        action_target_id: targetId || null,
        old_value: oldValue || null,
        new_value: newValue || null,
      });
  },

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    // Get total and active/inactive counts
    const { data: adminCounts, error: countError } = await supabase
      .from('admin_users')
      .select('is_active, admin_role_type');

    if (countError) throw countError;

    const stats: AdminStats = {
      total_admins: adminCounts?.length || 0,
      active_admins: adminCounts?.filter((a) => a.is_active).length || 0,
      inactive_admins: adminCounts?.filter((a) => !a.is_active).length || 0,
      by_role: {} as Record<AdminRoleType, number>,
      recent_activity_count: 0,
    };

    // Count by role
    adminCounts?.forEach((admin) => {
      const role = admin.admin_role_type as AdminRoleType;
      stats.by_role[role] = (stats.by_role[role] || 0) + 1;
    });

    // Get recent activity count (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: activityCount } = await supabase
      .from('admin_activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    stats.recent_activity_count = activityCount || 0;

    return stats;
  },
};
