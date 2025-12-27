import type { User } from '@supabase/supabase-js';
import type { Database } from '@/../../shared/database.types';

// Type pour le profil utilisateur depuis Supabase
export type UserProfile = Database['public']['Tables']['users']['Row'];

// Utilisateur authentifié avec profil
export interface AuthUser extends User {
  profile?: UserProfile;
}

// États d'authentification
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Actions d'authentification
export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

// Context complet
export interface AuthContextType extends AuthState, AuthActions {}

// Types pour les erreurs
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Types pour les événements d'auth
export type AuthEvent =
  | { type: 'SIGN_IN'; user: AuthUser }
  | { type: 'SIGN_OUT' }
  | { type: 'LOADING'; isLoading: boolean }
  | { type: 'ERROR'; error: AuthError };