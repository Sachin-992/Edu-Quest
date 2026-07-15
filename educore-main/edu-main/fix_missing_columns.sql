-- FIX MISSING COLUMNS IN USERS TABLE
-- Run this to fix Error 42703 (column "first_login" of relation "users" does not exist)

-- Add first_login if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Add other potentially missing columns just in case
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Re-apply the admin policy just to be sure
DROP POLICY IF EXISTS "admin_full_access_users" ON users;
CREATE POLICY "admin_full_access_users" ON users
FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
