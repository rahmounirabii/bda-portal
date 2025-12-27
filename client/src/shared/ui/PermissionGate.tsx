import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { LoadingSpinner } from './LoadingSpinner';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // Si true, requiert toutes les permissions
  roles?: string[];
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  showLoader?: boolean;
}

/**
 * Composant professionnel de protection par permissions
 * Supporte permissions multiples, rôles, et gestion d'erreurs
 */
export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  roles = [],
  fallback = null,
  loading,
  showLoader = true,
}: PermissionGateProps) {
  const { can, canAny, canAll, currentRole } = usePermissions();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      setIsLoading(true);

      try {
        let result = true;

        // Vérification des rôles (synchrone)
        if (roles.length > 0) {
          result = result && roles.includes(currentRole);
        }

        // Vérification des permissions (asynchrone)
        if (permission) {
          result = result && await can(permission);
        }

        if (permissions.length > 0) {
          if (requireAll) {
            result = result && await canAll(permissions);
          } else {
            result = result && await canAny(permissions);
          }
        }

        setHasAccess(result);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [permission, permissions, requireAll, roles, currentRole, can, canAny, canAll]);

  // Affichage du loader
  if (isLoading && showLoader) {
    return loading || <LoadingSpinner size="sm" fullScreen={false} message="" />;
  }

  // Accès refusé
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  // Accès autorisé
  return <>{children}</>;
}

/**
 * Variante synchrone pour les cas simples (basée sur les rôles)
 */
interface RoleGateProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
}

export function RoleGate({ children, roles, fallback = null }: RoleGateProps) {
  const { currentRole } = usePermissions();

  if (!roles.includes(currentRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Composant pour afficher différent contenu selon le rôle
 */
interface RoleSwitchProps {
  adminComponent?: React.ReactNode;
  ecpComponent?: React.ReactNode;
  pdpComponent?: React.ReactNode;
  individualComponent?: React.ReactNode;
  defaultComponent?: React.ReactNode;
}

export function RoleSwitch({
  adminComponent,
  ecpComponent,
  pdpComponent,
  individualComponent,
  defaultComponent,
}: RoleSwitchProps) {
  const { currentRole, isAdmin } = usePermissions();

  switch (currentRole) {
    case 'super_admin':
    case 'admin':
      return <>{adminComponent || defaultComponent}</>;
    case 'ecp':
      return <>{ecpComponent || defaultComponent}</>;
    case 'pdp':
      return <>{pdpComponent || defaultComponent}</>;
    case 'individual':
      return <>{individualComponent || defaultComponent}</>;
    default:
      return <>{defaultComponent}</>;
  }
}