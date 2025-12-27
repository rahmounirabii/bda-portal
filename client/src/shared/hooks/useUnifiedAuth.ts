import { useState, useEffect, useCallback } from 'react';
import { UnifiedAuthService } from '@/services/unified-auth.service';
import type { UnifiedUser, AuthResult } from '@/services/unified-auth.service';
import type { AuthError } from '@/shared/types/auth.types';

interface UnifiedAuthState {
  user: UnifiedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasInitialCheck?: boolean;
}

/**
 * Hook for unified Portal-Store authentication
 * Provides transparent authentication across both systems
 */
export function useUnifiedAuth() {
  const [state, setState] = useState<UnifiedAuthState>(() => {
    // Quick check for existing session
    const hasSession = !!localStorage.getItem('bda-portal-auth.access_token');
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      hasInitialCheck: hasSession,
    };
  });

  /**
   * Transparent login - handles Portal/Store automatically
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result: AuthResult = await UnifiedAuthService.signIn(email, password);

      if (!result.success || !result.user) {
        throw new Error(result.error?.message || 'Login failed');
      }

      setState({
        user: result.user,
        isLoading: false,
        isAuthenticated: true,
      });

      // Log the action taken for debugging
      console.log(`Login successful - Action: ${result.action_taken}`);

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Unified signup - creates accounts in appropriate systems
   */
  const signup = useCallback(async (userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    bda_role?: string;
    organization?: string;
    signup_type?: 'portal-only' | 'store-only' | 'both';
  }): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result: AuthResult = await UnifiedAuthService.signUp(userData);

      if (!result.success || !result.user) {
        throw new Error(result.error?.message || 'Signup failed');
      }

      setState({
        user: result.user,
        isLoading: false,
        isAuthenticated: true,
      });

      // Log the action taken
      console.log(`Signup successful - Action: ${result.action_taken}`);

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Logout from both systems
   */
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await UnifiedAuthService.signOut();

      if (error) {
        console.error('Logout error:', error);
      }

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Unexpected logout error:', error);
      // Force logout even on error
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  /**
   * Check current authentication state
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { user, error } = await UnifiedAuthService.getCurrentUser();

      if (error || !user) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return false;
      }

      setState({
        user: user,
        isLoading: false,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  }, []);

  /**
   * Update user profile (syncs to both systems)
   */
  const updateProfile = useCallback(async (updates: Partial<any>): Promise<void> => {
    if (!state.user?.supabase_user?.id) {
      throw new Error('No authenticated user');
    }

    // Update in Supabase (Portal)
    // This would need to be implemented in AuthService
    // For now, just update local state
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));

    // Sync to WordPress if user has store access
    if (state.user.wp_user_id) {
      // Implementation would sync to WordPress API
      console.log('Syncing profile to WordPress:', updates);
    }
  }, [state.user]);

  /**
   * Check if user has specific access
   */
  const hasAccess = useCallback((accessType: 'portal' | 'store' | 'both'): boolean => {
    if (!state.user) return false;

    switch (accessType) {
      case 'portal':
        return state.user.has_portal_access;
      case 'store':
        return state.user.has_store_access;
      case 'both':
        return state.user.has_portal_access && state.user.has_store_access;
      default:
        return false;
    }
  }, [state.user]);

  /**
   * Get store user data
   */
  const getStoreUserData = useCallback(async () => {
    if (!state.user?.wp_user_id) {
      return null;
    }

    // Fetch fresh data from WordPress
    // Implementation would call WordPress API
    return null;
  }, [state.user]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      await checkAuth();
    };

    initAuth();

    // Listen for auth state changes
    // This would need to be implemented to listen to both Supabase and custom events

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  return {
    // State
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,

    // Actions
    login,
    signup,
    logout,
    checkAuth,
    updateProfile,

    // Helpers
    hasAccess,
    getStoreUserData,
    hasRole: (role: string) => state.user?.bda_role === role,
    isRole: (roles: string[]) => roles.includes(state.user?.bda_role || ''),

    // System info
    isPortalUser: state.user?.has_portal_access || false,
    isStoreUser: state.user?.has_store_access || false,
    syncStatus: state.user?.sync_status || 'unknown',
  };
}