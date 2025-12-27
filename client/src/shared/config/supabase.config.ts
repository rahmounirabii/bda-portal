import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Instance unique de Supabase - Singleton pattern pour éviter multiple GoTrueClient
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

const createSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window?.localStorage, // Utilisation explicite du localStorage
      storageKey: 'bda-portal-auth', // Clé unique pour éviter les conflits
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'bda-portal',
      },
    },
  });

  return supabaseInstance;
};

// Export de l'instance unique
export const supabase = createSupabaseClient();

// Configuration des timeouts
export const AUTH_CONFIG = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24h
  refreshBuffer: 5 * 60 * 1000, // 5min avant expiration
  retryAttempts: 3,
  retryDelay: 1000,
} as const;