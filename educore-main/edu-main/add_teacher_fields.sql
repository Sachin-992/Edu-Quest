-- ============================================
-- MIGRATION: Add Extended Teacher Profile Fields
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Teacher',
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', NULL)),
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;
