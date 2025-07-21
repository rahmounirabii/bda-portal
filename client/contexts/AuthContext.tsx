import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authManager, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null && authManager.isTokenValid();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Get user from session storage
      const storedUser = authManager.getCurrentUser();
      
      // Check if we have both user data and valid token
      if (storedUser && authManager.isTokenValid()) {
        // For page reloads, trust the token without API validation to avoid delays
        // The token will be validated on actual API calls
        setUser(storedUser);
        setIsLoading(false);
        return true;
      }
      
      // Clear invalid session (without redirect)
      authManager.clearSession();
      setUser(null);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      authManager.clearSession();
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const userData = await authManager.login(username, password);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authManager.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}