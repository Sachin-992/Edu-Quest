-- ═══════════════════════════════════════════════════════════════════════════════
-- FINAL RLS CLEANUP: REMOVE RESIDUAL POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- The previous screenshot revealed policies that were not cleaned up because they had different names.
-- These "zombie" policies are likely still causing the recursion.

-- 1. DROP the specific leftovers seen in the screenshot
DROP POLICY IF EXISTS "admin_full_access_users" ON users;
DROP POLICY IF EXISTS "users_read_self" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;  -- Guessing this exists
DROP POLICY IF EXISTS "users_delete_self" ON users;  -- Guessing this exists

-- 2. Ensure only the "_final" policies remain
-- (No need to re-create the _final ones, they were in the screenshot)

-- Verification:
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'users';
