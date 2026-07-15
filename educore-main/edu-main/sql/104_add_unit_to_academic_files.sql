-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: ACADEMIC FILES - ADD UNIT COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Purpose: Add unit column to support subject-wise and unit-wise grouping of notes/documents.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE academic_files 
ADD COLUMN IF NOT EXISTS unit TEXT;

CREATE INDEX IF NOT EXISTS idx_academic_files_unit ON academic_files(unit);
