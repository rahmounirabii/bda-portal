import { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/shared/types/roles.types';

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: LucideIcon;
  action?: 'logout';
  external?: boolean;
  children?: NavItem[];
  roles?: UserRole[];
  section?: string; // Group header label (only first item in group needs this)
}

export type NavigationConfig = Record<UserRole, NavItem[]>;