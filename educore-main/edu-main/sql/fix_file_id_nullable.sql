-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: MAKE file_id NULLABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- The academicService.ts doesn't use the files table, so file_id should be nullable
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE academic_files ALTER COLUMN file_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'academic_files' AND column_name = 'file_id';

-- Expected: file_id | YES
