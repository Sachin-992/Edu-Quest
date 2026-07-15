-- ============================================
-- COMPLETE SCHEMA FIX
-- Run this in Supabase SQL Editor to add ALL missing columns
-- ============================================

-- =============================================
-- 1. STUDENTS TABLE - Add missing columns
-- =============================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_joining INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- =============================================
-- 2. TEACHERS TABLE - Add missing columns
-- =============================================
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

-- =============================================
-- 3. USERS TABLE - Add missing columns (for display purposes)
-- =============================================
-- Note: 'name' is for UI display convenience
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Update name from email if null
UPDATE users SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL;

-- =============================================
-- 4. PARENTS TABLE - Add missing columns
-- =============================================
ALTER TABLE parents ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS address TEXT;

-- =============================================
-- 5. Verify all columns exist
-- =============================================
-- Check students table
SELECT column_name FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position;

-- Check teachers table
SELECT column_name FROM information_schema.columns WHERE table_name = 'teachers' ORDER BY ordinal_position;

-- Check users table
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

-- Check parents table
SELECT column_name FROM information_schema.columns WHERE table_name = 'parents' ORDER BY ordinal_position;
