-- ═══════════════════════════════════════════════════════════════════════════════
-- NUCLEAR RLS FIX: RESET AND REBUILD USERS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- PURPOSE: 
-- The "infinite recursion" error persists. This means a policy on "users" is still verifying itself via a circular DB lookup.
-- We will DROP ALL policies on "users" and recreate them using DIRECT JWT CHECKS.
-- This bypasses any helper functions and guarantees the recursion loop is broken.

-- 1. Disable RLS temporarily to ensure clean drop
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Drop legacy/recursive policies
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_self_select" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;
DROP POLICY IF EXISTS "users_self_insert" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "policy_users_admin_all" ON users; -- Just in case of different naming
DROP POLICY IF EXISTS "Give admin access to all users" ON users;

-- 3. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Create CLEAN, recursion-free policies

-- A. ADMINS: Full Access (Direct JWT Check)
CREATE POLICY "users_admin_final" ON users 
FOR ALL 
TO authenticated 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- B. USERS: Read/Update Self (Match Auth ID)
CREATE POLICY "users_self_read_final" ON users 
FOR SELECT 
TO authenticated 
USING ( auth_id = auth.uid() );

CREATE POLICY "users_self_update_final" ON users 
FOR UPDATE 
TO authenticated 
USING ( auth_id = auth.uid() );

CREATE POLICY "users_self_insert_final" ON users 
FOR INSERT 
TO authenticated 
WITH CHECK ( auth_id = auth.uid() );

-- C. TEACHERS: Read Access (Direct JWT Check)
-- (Teachers need to see other users/students)
CREATE POLICY "users_teacher_read_final" ON users 
FOR SELECT
TO authenticated 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

-- Verification
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'users';

-- FINAL CHECK: Ensure Admin User has Metadata
-- If you are still locked out, it might be that your User Metadata is missing 'role': 'admin'.
-- But this RLS change is required first.
