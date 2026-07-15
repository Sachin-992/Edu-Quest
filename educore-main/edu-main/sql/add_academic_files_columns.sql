-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: ACADEMIC FILES - ADD ALL MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Purpose: The academicService.ts uploadResource function expects these columns:
--   name, storage_path, mime_type, size_bytes, class, section, subject, uploaded_by
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add ALL missing columns expected by academicService.ts
ALTER TABLE academic_files 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_academic_files_class ON academic_files(class);
CREATE INDEX IF NOT EXISTS idx_academic_files_section ON academic_files(section);
CREATE INDEX IF NOT EXISTS idx_academic_files_subject ON academic_files(subject);
CREATE INDEX IF NOT EXISTS idx_academic_files_uploaded_by ON academic_files(uploaded_by);

-- 3. Ensure RLS policies allow teacher inserts
DROP POLICY IF EXISTS "academic_files_teacher_insert" ON academic_files;
CREATE POLICY "academic_files_teacher_insert" ON academic_files 
FOR INSERT WITH CHECK (is_teacher() OR is_admin());

-- 4. Ensure RLS policies allow teacher/admin reads
DROP POLICY IF EXISTS "academic_files_teacher_read" ON academic_files;
CREATE POLICY "academic_files_teacher_read" ON academic_files 
FOR SELECT USING (is_teacher() OR is_admin());

-- 5. Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'academic_files' 
  AND column_name IN ('name', 'storage_path', 'mime_type', 'size_bytes', 'class', 'section', 'subject', 'uploaded_by');

-- Expected result: 8 rows showing all columns
