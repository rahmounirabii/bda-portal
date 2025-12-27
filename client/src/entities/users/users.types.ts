/**
 * User Management Types
 * Admin user management for BDA Portal (Supabase users, not WooCommerce)
 */

export type UserRole = 'individual' | 'ecp' | 'pdp' | 'admin' | 'super_admin';

export interface User {
  id: string;
  role: UserRole;

  // Personal Information
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  country_code: string | null;

  // Professional Information
  job_title: string | null;
  company_name: string | null;
  industry: string | null;
  experience_years: number | null;

  // Preferences
  preferred_language: 'en' | 'ar';
  timezone: string;
  notifications_enabled: boolean;

  // Metadata
  profile_completed: boolean;
  last_login_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  profile_completed?: boolean;
  search?: string; // Search in name, email
  country_code?: string;
}

export interface UpdateUserDTO {
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country_code?: string;
  job_title?: string;
  company_name?: string;
  industry?: string;
  experience_years?: number;
  preferred_language?: 'en' | 'ar';
  timezone?: string;
  notifications_enabled?: boolean;
  is_active?: boolean;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  by_role: Record<UserRole, number>;
  profile_completion_rate: number;
  new_users_this_month: number;
}

export interface UserResult<T> {
  data: T | null;
  error: Error | null;
}
