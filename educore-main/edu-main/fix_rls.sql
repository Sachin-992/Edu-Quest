-- ============================================
-- FIX RLS: Allow users to read their own record
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "admin_full_access_users" ON users;
DROP POLICY IF EXISTS "user_self_read" ON users;

-- Create a simpler policy that allows authenticated users to read their own record
CREATE POLICY "users_read_own" ON users
FOR SELECT 
USING (auth.uid() = id);

-- Allow admins full access to users table
CREATE POLICY "admin_manage_users" ON users
FOR ALL 
USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- IMPORTANT: Also allow INSERT for admin user creation
-- This is needed when admins create new users
CREATE POLICY "admin_insert_users" ON users
FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ============================================
-- Verify the user can now be queried
-- ============================================
SELECT * FROM users WHERE email = 'admin@myschool.edu';
