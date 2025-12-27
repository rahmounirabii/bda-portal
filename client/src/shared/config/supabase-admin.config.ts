import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

/**
 * SECURITY WARNING - LOCAL DEVELOPMENT ONLY
 *
 * This admin client uses the service role key which bypasses Row Level Security (RLS).
 *
 * FOR PRODUCTION:
 * - Replace this with an Edge Function that runs server-side
 * - Never expose the service role key to the frontend
 * - Use proper authentication and authorization
 *
 * The service role key should ONLY be used:
 * - In local development (localhost)
 * - In server-side code (Edge Functions, backend APIs)
 * - Never committed to version control
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Only allow admin client in development
if (import.meta.env.PROD && supabaseServiceKey) {
  console.error(
    'SECURITY ERROR: Service role key detected in production build. ' +
    'Admin operations should use Edge Functions in production.'
  );
}

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

/**
 * Admin client for operations requiring elevated privileges
 * Uses service role key which bypasses RLS
 *
 * LOCAL DEVELOPMENT ONLY - Replace with Edge Function for production
 */
export const createAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error(
      'Admin operations require VITE_SUPABASE_SERVICE_KEY. ' +
      'For production, use an Edge Function instead.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Check if admin operations are available
 */
export const isAdminAvailable = (): boolean => {
  return !!supabaseServiceKey && !import.meta.env.PROD;
};
