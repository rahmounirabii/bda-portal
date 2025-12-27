import React, { createContext, useContext } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import type { AuthContextType } from '@/shared/types/auth.types';

// Context d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props du provider
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider d'authentification global
 * Utilise le hook useAuth et expose le context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook pour utiliser le context d'authentification
 * Vérifie que le context est disponible
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}

// Export pour compatibilité
export { useAuthContext as useAuth };