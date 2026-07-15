-- ============================================
-- FIX: Add missing columns to students table
-- to match what the studentService expects
-- ============================================

-- Check current columns
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'students';

-- Add 'name' column (alias for full_name)
ALTER TABLE students ADD COLUMN IF NOT EXISTS name TEXT;

-- Add 'roll_no' column (alias for roll_number)
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_no INTEGER;

-- Update name from full_name where needed
UPDATE students SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

-- Update roll_no from roll_number where needed  
UPDATE students SET roll_no = roll_number WHERE roll_no IS NULL AND roll_number IS NOT NULL;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;
