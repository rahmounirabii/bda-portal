import type { ReactNode } from 'react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import type { Permission } from '@/shared/types/roles.types';
import { roleHasPermission } from '@/shared/types/roles.types';

export interface PermissionGuardProps {
  /**
   * Contenu à afficher si l'utilisateur a la permission
   */
  children: ReactNode;

  /**
   * Permission(s) requise(s)
   */
  permission: Permission | Permission[];

  /**
   * Mode de vérification:
   * - 'any': L'utilisateur doit avoir AU MOINS UNE des permissions
   * - 'all': L'utilisateur doit avoir TOUTES les permissions
   */
  mode?: 'any' | 'all';

  /**
   * Contenu de secours si l'utilisateur n'a pas la permission
   */
  fallback?: ReactNode;

  /**
   * Afficher un message d'erreur si pas de permission
   */
  showError?: boolean;

  /**
   * Message d'erreur personnalisé
   */
  errorMessage?: string;
}

/**
 * PermissionGuard - Composant pour protéger le contenu basé sur les permissions
 *
 * Exemples:
 * ```tsx
 * // Protéger avec une permission
 * <PermissionGuard permission="manage_users">
 *   <UserManagement />
 * </PermissionGuard>
 *
 * // Protéger avec plusieurs permissions (ANY)
 * <PermissionGuard permission={['manage_quizzes', 'manage_questions']} mode="any">
 *   <QuizManagement />
 * </PermissionGuard>
 *
 * // Protéger avec plusieurs permissions (ALL)
 * <PermissionGuard permission={['manage_users', 'manage_roles']} mode="all">
 *   <RoleManagement />
 * </PermissionGuard>
 *
 * // Avec fallback
 * <PermissionGuard permission="manage_content" fallback={<div>No access</div>}>
 *   <ContentEditor />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  permission,
  mode = 'all',
  fallback = null,
  showError = false,
  errorMessage,
}: PermissionGuardProps) {
  const { user } = useAuthContext();

  const userRole = user?.profile?.role;

  // Si pas de rôle, pas de permission
  if (!userRole) {
    if (showError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {errorMessage || 'You must be logged in to access this content'}
          </p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  // Normaliser les permissions en tableau
  const permissions = Array.isArray(permission) ? permission : [permission];

  // Vérifier les permissions
  let hasPermission = false;

  if (mode === 'any') {
    // L'utilisateur doit avoir AU MOINS UNE des permissions
    hasPermission = permissions.some((perm) =>
      roleHasPermission(userRole as any, perm)
    );
  } else {
    // L'utilisateur doit avoir TOUTES les permissions
    hasPermission = permissions.every((perm) =>
      roleHasPermission(userRole as any, perm)
    );
  }

  if (!hasPermission) {
    if (showError) {
      return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-yellow-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-yellow-700">
              {errorMessage ||
                `You don't have the required permission(s): ${permissions.join(', ')}`}
            </p>
          </div>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  // Afficher le contenu si l'utilisateur a la permission
  return <>{children}</>;
}

PermissionGuard.displayName = 'PermissionGuard';
