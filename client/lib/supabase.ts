/**
 * Re-export de l'instance unique Supabase
 * Ce fichier maintient la compatibilité avec l'ancien système
 * tout en utilisant une seule instance pour éviter les conflits
 */

import { supabase as supabaseInstance } from '@/shared/config/supabase.config';

// Re-export de l'instance unique
export const supabase = supabaseInstance;

// Helper pour vérifier l'état d'authentification
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Helper pour la connexion
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// Helper pour la déconnexion
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper pour l'inscription
export const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
};

// Helper pour la réinitialisation du mot de passe
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};