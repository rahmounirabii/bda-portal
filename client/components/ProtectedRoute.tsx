import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !user) {
    // Sauvegarder la route actuelle pour redirection après login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Redirect to intended page if user is authenticated but trying to access login page
  if (!requireAuth && user && location.pathname === '/login') {
    // Récupérer la route originale depuis l'état ou rediriger vers dashboard
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;