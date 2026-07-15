/**
 * EDUCORE-OMEGA Supabase Client
 * 
 * PRODUCTION VERSION
 * - Uses environment variables for configuration
 * - Provides auth status checking
 * - Session persistence enabled
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Production check: both variables must be present
const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn('[EDUCORE-OMEGA] Supabase credentials not configured.');
  console.warn('[EDUCORE-OMEGA] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

// Create client with explicit session persistence settings
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,        // CRITICAL: Persist session in localStorage
      autoRefreshToken: true,      // Auto-refresh before expiry
      detectSessionInUrl: true,    // Handle OAuth redirects
      storageKey: 'educore-auth',  // Custom storage key
    }
  })
  : null;

export const isAnalyticsEnabled = isConfigured;

/**
 * Check if Supabase is available for production use
 */
export const isProductionReady = (): boolean => {
  return isConfigured && supabase !== null;
};

/**
 * Get configuration status message
 */
export const getConfigStatus = (): { configured: boolean; message: string } => {
  if (isConfigured) {
    return { configured: true, message: '✓ Supabase connected' };
  }
  return {
    configured: false,
    message: '⚠️ Configuration Missing: Database not connected'
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CLIENT (Service Role) — used ONLY for admin operations like createUser.
// NEVER stores a session — does not affect the currently logged-in admin user.
// ─────────────────────────────────────────────────────────────────────────────
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const adminSupabase: SupabaseClient | null =
  (supabaseUrl && serviceRoleKey)
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,      // Never persist — admin-only operations
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'educore-admin-noop', // separate key so it never pollutes the real session
        }
      })
    : null;

export default supabase;
