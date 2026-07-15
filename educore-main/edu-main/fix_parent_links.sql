-- ============================================
-- FIX: Add missing 'linked_by' column to parent_student_links
-- Run this in Supabase SQL Editor
-- ============================================

-- Add the missing column (safe to run even if it exists)
ALTER TABLE parent_student_links 
ADD COLUMN IF NOT EXISTS linked_by UUID REFERENCES users(id);

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parent_student_links';
