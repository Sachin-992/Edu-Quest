-- ============================================
-- EDUCORE-OMEGA FINAL SCHEMA FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add ALL missing columns to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_joining INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_encrypted TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_masked TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_last4 TEXT;

-- 2. Add ALL missing columns to teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS classes TEXT[] DEFAULT '{}';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Add missing columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE users SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL;

-- 4. Add missing columns to parents
ALTER TABLE parents ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS address TEXT;

-- 5. Disable RLS for admin access (temporary)
-- RLS SECURITY MAINTAINED --
-- Removed dangerous DISABLE ROW LEVEL SECURITY commands
-- Ensure RLS policies are applied via supabase_production_schema.sql

-- Keep audit_logs RLS enabled (for immutability)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Verify all tables
SELECT 'students' as table_name, column_name FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position;
SELECT 'teachers' as table_name, column_name FROM information_schema.columns WHERE table_name = 'teachers' ORDER BY ordinal_position;
SELECT 'users' as table_name, column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
SELECT 'parents' as table_name, column_name FROM information_schema.columns WHERE table_name = 'parents' ORDER BY ordinal_position;

-- Done!
SELECT '✅ Schema fix complete!' as status;
