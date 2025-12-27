import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { ROUTES } from '@/shared/constants/routes';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  fallbackPath?: string;
}

/**
 * Composant de protection des routes
 * Gère l'authentification et les permissions par rôle
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
  fallbackPath = ROUTES.LOGIN,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  // Afficher le spinner pendant le chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirection si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Redirection si l'utilisateur est connecté mais essaie d'accéder à une page publique
  if (!requireAuth && isAuthenticated && location.pathname === ROUTES.LOGIN) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Vérification des rôles si spécifiés
  if (requireAuth && allowedRoles && user?.profile?.role) {
    const hasAllowedRole = allowedRoles.includes(user.profile.role);

    if (!hasAllowedRole) {
      return (
        <Navigate
          to={ROUTES.DASHBOARD}
          state={{ error: 'Accès non autorisé pour votre rôle' }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}