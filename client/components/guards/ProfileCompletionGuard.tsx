import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import {
  shouldRedirectToCompletion,
  getProfileCompletionRoute,
} from '@/services/profile-completion.service';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component qui vérifie la complétude du profil
 * et redirige vers la page de completion si nécessaire
 */
export function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    const shouldRedirect = shouldRedirectToCompletion(user?.profile || null, location.pathname);

    if (shouldRedirect && user?.profile) {
      const completionRoute = getProfileCompletionRoute(user.profile.role);
      navigate(completionRoute, { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
