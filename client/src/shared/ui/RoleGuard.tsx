import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import type { UserRole } from '@/shared/types/roles.types';
import { ROLE_HOME_ROUTES } from '@/shared/types/roles.types';
import { LoadingSpinner } from './LoadingSpinner';

export interface RoleGuardProps {
  /**
   * Contenu à afficher si l'utilisateur a le bon rôle
   */
  children: ReactNode;

  /**
   * Rôles autorisés à voir ce contenu
   */
  allowedRoles: UserRole[];

  /**
   * Chemin de redirection si l'utilisateur n'a pas le bon rôle
   * Par défaut: redirection vers la page d'accueil du rôle de l'utilisateur
   */
  fallbackPath?: string;

  /**
   * Message d'erreur à afficher
   */
  errorMessage?: string;

  /**
   * Afficher un message au lieu de rediriger
   */
  showError?: boolean;
}

/**
 * RoleGuard - Composant pour protéger le contenu basé sur le rôle utilisateur
 *
 * Exemples:
 * ```tsx
 * // Protéger une route admin
 * <RoleGuard allowedRoles={['admin', 'super_admin']}>
 *   <AdminDashboard />
 * </RoleGuard>
 *
 * // Protéger avec message d'erreur
 * <RoleGuard allowedRoles={['ecp']} showError>
 *   <ECPOnlyFeature />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath,
  errorMessage,
  showError = false,
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuthContext();

  // Afficher le spinner pendant le chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Rediriger si non authentifié
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.profile?.role;

  // Vérifier si l'utilisateur a un rôle autorisé
  const hasAllowedRole = userRole && allowedRoles.includes(userRole as UserRole);

  if (!hasAllowedRole) {
    // Afficher un message d'erreur
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
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
              <div>
                <h3 className="font-medium text-red-900">Access Denied</h3>
                <p className="mt-1 text-sm text-red-700">
                  {errorMessage ||
                    `This content is restricted to: ${allowedRoles.join(', ')}. Your role: ${userRole || 'unknown'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Rediriger vers la page appropriée
    const redirectPath =
      fallbackPath ||
      (userRole ? ROLE_HOME_ROUTES[userRole as UserRole] : '/dashboard');

    return <Navigate to={redirectPath} replace />;
  }

  // Afficher le contenu si l'utilisateur a le bon rôle
  return <>{children}</>;
}

RoleGuard.displayName = 'RoleGuard';
