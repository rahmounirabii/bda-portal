import { ROLE_CONFIG, type UserRole, type Permission } from '@/shared/config/app.config';

/**
 * Utilitaires pour la gestion des permissions
 */

/**
 * Vérifier si un utilisateur a une permission spécifique
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const roleConfig = ROLE_CONFIG[userRole];

  if (!roleConfig) {
    return false;
  }

  // Si l'utilisateur a toutes les permissions
  if (roleConfig.permissions.includes('*')) {
    return true;
  }

  return roleConfig.permissions.includes(permission);
}

/**
 * Vérifier si un utilisateur a au moins une des permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Vérifier si un utilisateur a toutes les permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Obtenir toutes les permissions d'un rôle
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  const roleConfig = ROLE_CONFIG[userRole];
  return roleConfig?.permissions || [];
}

/**
 * Vérifier si un rôle est admin (admin ou super_admin)
 */
export function isAdminRole(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'super_admin';
}

/**
 * Obtenir la route par défaut pour un rôle
 */
export function getDefaultRouteForRole(userRole: UserRole): string {
  const roleConfig = ROLE_CONFIG[userRole];
  return roleConfig?.defaultRoute || '/dashboard';
}

/**
 * Obtenir le nom d'affichage d'un rôle
 */
export function getRoleDisplayName(userRole: UserRole): string {
  const roleConfig = ROLE_CONFIG[userRole];
  return roleConfig?.name || userRole;
}