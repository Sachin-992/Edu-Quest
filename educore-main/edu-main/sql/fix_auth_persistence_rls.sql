-- ============================================
-- FIX: RLS Policy WITHOUT Recursion
-- ============================================
-- Problem: Previous policy had a subquery on users table
-- inside a policy ON users table = infinite recursion = hang
-- 
-- Solution: Simple policy that only uses auth.uid()
-- ============================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_self_select" ON users;
DROP POLICY IF EXISTS "users_own_select" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "allow_users_select" ON users;
DROP POLICY IF EXISTS "users_self_read" ON users;
DROP POLICY IF EXISTS "admins_read_all_users" ON users;

-- Step 2: Create ONE simple policy - users can read their own record
-- Uses auth.uid() directly which is NOT recursive
CREATE POLICY "users_read_own"
ON users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- Step 3: For admin to read all users, we check role in auth.jwt()
-- NOT by querying the users table (which would be recursive)
CREATE POLICY "admin_read_all"
ON users
FOR SELECT  
TO authenticated
USING (
    -- Check if current user's role in JWT metadata is 'admin'
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- ============================================
-- VERIFY: Run this after to confirm
-- ============================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'users';
