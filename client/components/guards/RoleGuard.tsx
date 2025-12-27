import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * Guard component qui vérifie que l'utilisateur a le bon rôle
 * pour accéder à une route
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, rediriger vers login (ne devrait pas arriver car ProtectedRoute est avant)
  if (!user?.profile) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Vérifier si l'utilisateur a le rôle requis
  const hasRequiredRole = allowedRoles.includes(user.profile.role);

  // Si l'utilisateur n'a pas le bon rôle, rediriger silencieusement vers /dashboard
  // qui le redirigera automatiquement vers son dashboard spécifique
  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
