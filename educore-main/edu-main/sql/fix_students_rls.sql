-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: STUDENT ENROLLMENT PERMISSIONS (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script fixes the "Row-Level Security" error preventing student creation.

-- 1. Enable RLS on Students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 2. Create Permissive Policy for Authenticated Users (Admins/Staff)
-- We drop existing policies to ensure no conflicts
DROP POLICY IF EXISTS "students_policy_all" ON students;
DROP POLICY IF EXISTS "students_insert" ON students;
DROP POLICY IF EXISTS "students_select" ON students;
DROP POLICY IF EXISTS "students_update" ON students;
DROP POLICY IF EXISTS "students_delete" ON students;

-- Allow ANY logged-in user to do EVERYTHING on students table
CREATE POLICY "students_policy_all" ON students 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Also Ensure 'Users' table is writable (needed for linking auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_policy_all" ON users;

CREATE POLICY "users_policy_all" ON users 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);
