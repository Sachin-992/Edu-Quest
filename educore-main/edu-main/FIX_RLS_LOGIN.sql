-- FIX USER LOGIN RLS POLICIES
-- Run this in Supabase SQL Editor

-- Allow users to read their own record (essential for login)
DROP POLICY IF EXISTS "users_read_self" ON users;
CREATE POLICY "users_read_self" ON users 
FOR SELECT USING (auth_id = auth.uid());

-- Ensure admins can still do everything
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users 
FOR ALL USING (is_admin());

-- Verify the fix by checking if user exists
SELECT id, auth_id, email, name, role, status 
FROM users 
WHERE email = 'balanp212121@gmail.com';
