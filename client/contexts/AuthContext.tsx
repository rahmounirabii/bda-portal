import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, signIn, signOut } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/../../shared/database.types';

// Type pour l'utilisateur avec profil Supabase
type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthUser extends User {
  profile?: UserProfile;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from Supabase
  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setUser(authUser); // Set auth user without profile
      } else {
        setUser({ ...authUser, profile });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(authUser); // Set auth user without profile
    }
  };

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error || !authUser) {
        setUser(null);
        setIsLoading(false);
        return false;
      }

      await loadUserProfile(authUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        throw new Error(error.message);
      }

      if (data?.user) {
        await loadUserProfile(data.user);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null); // Force logout on error
    }
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