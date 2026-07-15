import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '[Supabase] FATAL: Missing VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, or VITE_SUPABASE_ANON_KEY. The app cannot connect to the backend.'
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-key',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,  // Layer 2: Skip URL hash check (not using OAuth)
      flowType: 'implicit',       // Layer 2: No PKCE exchange round-trip
    },
    global: {
      headers: { 'x-client-info': 'eduquest/1.0' },
    },
  }
);