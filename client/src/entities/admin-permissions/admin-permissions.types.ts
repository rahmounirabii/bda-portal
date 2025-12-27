/**
 * Admin Permissions Types
 * Types for the admin permissions system (US1-US3)
 */

// Admin role types from the database enum
export type AdminRoleType =
  | 'super_admin'
  | 'certification_manager'
  | 'partner_manager'
  | 'pdc_manager'
  | 'content_manager'
  | 'finance_admin'
  | 'support_admin'
  | 'read_only_reviewer';

// Permission modules for grouping in UI
export type PermissionModule =
  | 'users'
  | 'admins'
  | 'certifications'
  | 'exams'
  | 'mocks'
  | 'partners'
  | 'vouchers'
  | 'pdcs'
  | 'learning'
  | 'memberships'
  | 'support'
  | 'content'
  | 'reports'
  | 'settings'
  | 'audit';

// Admin role definition
export interface AdminRole {
  id: string;
  role_type: AdminRoleType;
  display_name: string;
  display_name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Permission definition
export interface AdminPermission {
  id: string;
  permission_key: string;
  display_name: string;
  display_name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  module: PermissionModule;
  is_active: boolean;
  created_at: string;
}

// Role-permission mapping
export interface AdminRolePermission {
  id: string;
  role_type: AdminRoleType;
  permission_id: string;
  is_customizable: boolean;
  created_at: string;
}

// Admin user record
export interface AdminUser {
  id: string;
  user_id: string;
  admin_role_type: AdminRoleType;
  department: string | null;
  employee_id: string | null;
  custom_permissions_added: string[];
  custom_permissions_removed: string[];
  is_active: boolean;
  deactivated_at: string | null;
  deactivated_by: string | null;
  deactivation_reason: string | null;
  password_reset_required: boolean;
  last_password_change: string | null;
  login_count: number;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Admin user with joined user data
export interface AdminUserWithDetails extends AdminUser {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    country_code: string | null;
    is_active: boolean;
    last_login_at: string | null;
  };
  role: AdminRole;
  permissions: string[];
}

// Activity log entry
export interface AdminActivityLog {
  id: string;
  admin_user_id: string | null;
  action_type: string;
  action_target_type: string | null;
  action_target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Activity log with admin details
export interface AdminActivityLogWithDetails extends AdminActivityLog {
  admin_user?: {
    id: string;
    user: {
      email: string;
      first_name: string | null;
      last_name: string | null;
    };
  };
}

// Filters for admin users list
export interface AdminUserFilters {
  role_type?: AdminRoleType;
  is_active?: boolean;
  search?: string; // Search by name/email
  department?: string;
}

// Filters for activity logs
export interface ActivityLogFilters {
  admin_user_id?: string;
  action_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// Create admin request
export interface CreateAdminRequest {
  email: string;
  first_name: string;
  last_name: string;
  admin_role_type: AdminRoleType;
  department?: string;
  password?: string; // For creating new auth user
}

// Update admin request
export interface UpdateAdminRequest {
  admin_role_type?: AdminRoleType;
  department?: string;
  employee_id?: string;
  custom_permissions_added?: string[];
  custom_permissions_removed?: string[];
}

// Statistics for admin dashboard
export interface AdminStats {
  total_admins: number;
  active_admins: number;
  inactive_admins: number;
  by_role: Record<AdminRoleType, number>;
  recent_activity_count: number;
}

// Role display info for UI
export const ADMIN_ROLE_INFO: Record<
  AdminRoleType,
  {
    label: string;
    labelAr: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  super_admin: {
    label: 'Super Administrator',
    labelAr: 'المسؤول الأعلى',
    description: 'Full system access with all permissions',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  certification_manager: {
    label: 'Certification Manager',
    labelAr: 'مدير الشهادات',
    description: 'Manages certifications and exam results',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  partner_manager: {
    label: 'Partner Manager',
    labelAr: 'مدير الشركاء',
    description: 'Manages ECP and PDP partners',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  pdc_manager: {
    label: 'PDC Manager',
    labelAr: 'مدير PDC',
    description: 'Reviews PDC submissions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  content_manager: {
    label: 'Content Manager',
    labelAr: 'مدير المحتوى',
    description: 'Manages curriculum and learning content',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  finance_admin: {
    label: 'Finance Administrator',
    labelAr: 'مسؤول المالية',
    description: 'Manages vouchers and finances',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  support_admin: {
    label: 'Support Administrator',
    labelAr: 'مسؤول الدعم',
    description: 'Handles support tickets',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  read_only_reviewer: {
    label: 'Read-only Reviewer',
    labelAr: 'مراجع للقراءة فقط',
    description: 'Can view but not modify data',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

// Permission module display info
export const PERMISSION_MODULE_INFO: Record<
  PermissionModule,
  { label: string; labelAr: string }
> = {
  users: { label: 'User Management', labelAr: 'إدارة المستخدمين' },
  admins: { label: 'Admin Management', labelAr: 'إدارة المسؤولين' },
  certifications: { label: 'Certifications', labelAr: 'الشهادات' },
  exams: { label: 'Official Exams', labelAr: 'الامتحانات الرسمية' },
  mocks: { label: 'Mock Exams', labelAr: 'الامتحانات التجريبية' },
  partners: { label: 'Partners (ECP/PDP)', labelAr: 'الشركاء' },
  vouchers: { label: 'Vouchers', labelAr: 'القسائم' },
  pdcs: { label: 'PDC Management', labelAr: 'إدارة PDC' },
  learning: { label: 'Learning System', labelAr: 'نظام التعلم' },
  memberships: { label: 'Memberships', labelAr: 'العضويات' },
  support: { label: 'Support', labelAr: 'الدعم' },
  content: { label: 'Content & Resources', labelAr: 'المحتوى والموارد' },
  reports: { label: 'Reports & Analytics', labelAr: 'التقارير والتحليلات' },
  settings: { label: 'System Settings', labelAr: 'إعدادات النظام' },
  audit: { label: 'Audit Logs', labelAr: 'سجلات التدقيق' },
};
