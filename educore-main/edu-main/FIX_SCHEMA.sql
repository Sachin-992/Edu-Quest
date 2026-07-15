-- ===================================================
-- URGENT: FIX FOR "COULD NOT FIND COLUMN" ERROR
-- Run this script in your Supabase SQL Editor to fix the schema cache error
-- ===================================================

-- 1. Add the missing columns to the students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS year_of_joining INTEGER;

-- 2. Force a schema cache reload (usually happens automatically, but good to ensure permissions)
NOTIFY pgrst, 'reload schema';

-- 3. Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;
