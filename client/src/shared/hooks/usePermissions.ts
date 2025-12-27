import { useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { AuthService } from '@/entities/auth/auth.service';

/**
 * Hook avancé pour la gestion des permissions
 * Système robuste basé sur les fonctions Supabase
 */
export function usePermissions() {
  const { user } = useAuthContext();
  const [permissionCache, setPermissionCache] = useState<Record<string, boolean>>({});

  // Permissions locales basées sur le rôle (pour performance)
  const localPermissions = useMemo(() => {
    const role = user?.profile?.role;
    if (!role) return {};

    const permissions: Record<string, boolean> = {
      view_profile: true, // Tous les utilisateurs
      edit_profile: true, // Tous les utilisateurs
    };

    switch (role) {
      case 'super_admin':
        return {
          ...permissions,
          manage_users: true,
          view_all_users: true,
          manage_roles: true,
          view_analytics: true,
          manage_content: true,
          manage_system: true,
          promote_users: true,
        };

      case 'admin':
        return {
          ...permissions,
          manage_users: true,
          view_all_users: true,
          view_analytics: true,
          manage_content: true,
        };

      case 'ecp':
        return {
          ...permissions,
          manage_content: true,
          view_analytics: true,
          manage_candidates: true,
        };

      case 'pdp':
        return {
          ...permissions,
          view_analytics: true,
          manage_programs: true,
        };

      case 'individual':
      default:
        return permissions;
    }
  }, [user?.profile?.role]);

  /**
   * Vérifier une permission (avec cache et fallback serveur)
   */
  const can = useCallback(async (permission: string): Promise<boolean> => {
    // Vérification locale d'abord (performance)
    if (localPermissions[permission] !== undefined) {
      return localPermissions[permission];
    }

    // Vérification en cache
    if (permissionCache[permission] !== undefined) {
      return permissionCache[permission];
    }

    // Vérification serveur (pour permissions complexes)
    try {
      const { hasPermission, error } = await AuthService.checkPermission(permission);

      if (!error) {
        // Mettre en cache le résultat
        setPermissionCache(prev => ({
          ...prev,
          [permission]: hasPermission,
        }));
        return hasPermission;
      }
    } catch (error) {
      console.warn(`Permission check failed for ${permission}:`, error);
    }

    // Fallback : refuser la permission en cas d'erreur
    return false;
  }, [localPermissions, permissionCache]);

  /**
   * Vérifier une permission de manière synchrone (basé sur le rôle local)
   */
  const canSync = useCallback((permission: string): boolean => {
    return localPermissions[permission] || false;
  }, [localPermissions]);

  /**
   * Vérifier si l'utilisateur a au moins une des permissions
   */
  const canAny = useCallback(async (permissions: string[]): Promise<boolean> => {
    for (const permission of permissions) {
      if (await can(permission)) {
        return true;
      }
    }
    return false;
  }, [can]);

  /**
   * Vérifier si l'utilisateur a toutes les permissions
   */
  const canAll = useCallback(async (permissions: string[]): Promise<boolean> => {
    for (const permission of permissions) {
      if (!(await can(permission))) {
        return false;
      }
    }
    return true;
  }, [can]);

  /**
   * Helpers pour les rôles communs
   */
  const roleHelpers = useMemo(() => ({
    isAdmin: canSync('manage_users'),
    isSuperAdmin: user?.profile?.role === 'super_admin',
    isECP: user?.profile?.role === 'ecp',
    isPDP: user?.profile?.role === 'pdp',
    isIndividual: user?.profile?.role === 'individual',
  }), [canSync, user?.profile?.role]);

  /**
   * Promouvoir un utilisateur (super admin seulement)
   */
  const promoteUser = useCallback(async (targetUserId: string, newRole: string): Promise<boolean> => {
    if (!roleHelpers.isSuperAdmin) {
      throw new Error('Insufficient permissions to promote user');
    }

    const { success, error } = await AuthService.promoteUser(targetUserId, newRole);

    if (error) {
      throw new Error(error.message);
    }

    return success;
  }, [roleHelpers.isSuperAdmin]);

  /**
   * Nettoyer le cache des permissions
   */
  const clearPermissionCache = useCallback(() => {
    setPermissionCache({});
  }, []);

  return {
    // Vérification de permissions
    can,
    canSync,
    canAny,
    canAll,

    // Helpers de rôles
    ...roleHelpers,

    // Actions
    promoteUser,
    clearPermissionCache,

    // État
    currentRole: user?.profile?.role || 'individual',
    permissions: localPermissions,
  };
}

/**
 * Hook simplifié pour les cas courants
 */
export function useRole() {
  const { user } = useAuthContext();

  return {
    role: user?.profile?.role || 'individual',
    isAdmin: ['admin', 'super_admin'].includes(user?.profile?.role || ''),
    isSuperAdmin: user?.profile?.role === 'super_admin',
    isAuthenticated: !!user,
  };
}