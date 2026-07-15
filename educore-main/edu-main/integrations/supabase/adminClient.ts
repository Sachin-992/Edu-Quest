/**
 * Admin Supabase Client
 * 
 * Previously used a service-role key to bypass RLS for admin queries.
 * Now returns the regular anon client — admin access is granted through
 * RLS policies that check the user's role (admin / school_admin).
 * 
 * This wrapper is kept so that all existing imports continue to work
 * without touching every admin component.
 * 
 * USAGE:
 *   import { getAdminClient } from "@/integrations/supabase/adminClient";
 *   const adminClient = getAdminClient();
 *   const { data } = await adminClient.from("student_progress").select("*");
 */

import { supabase } from "./client";

/**
 * Returns the Supabase client for admin data queries.
 * Admin access is now enforced via RLS policies, not a service-role key.
 */
export function getAdminClient() {
    return supabase;
}
