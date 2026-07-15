-- ============================================================
-- EDUCORE-OMEGA CRITICAL HOTFIX
-- Run this to fix remaining issues
-- ============================================================

-- 1. ADD roll_number ALIAS (Some services expect roll_number)
-- We'll add it as a generated column that mirrors roll_no
DO $$ BEGIN
    -- First check if roll_number column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'roll_number') THEN
        -- Add roll_number as a regular column (not generated - Supabase doesn't support generated columns well)
        ALTER TABLE students ADD COLUMN roll_number INTEGER;
    END IF;
END $$;

-- Sync roll_number from roll_no for existing records
UPDATE students SET roll_number = roll_no WHERE roll_number IS NULL;

-- Create trigger to keep roll_number in sync with roll_no
CREATE OR REPLACE FUNCTION sync_roll_number() RETURNS TRIGGER AS $$
BEGIN
    NEW.roll_number := NEW.roll_no;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_roll_number ON students;
CREATE TRIGGER trg_sync_roll_number
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION sync_roll_number();

-- 2. CREATE STORAGE BUCKET (Must be done via API or Dashboard)
-- NOTE: Run this in Supabase Dashboard → SQL Editor with service role
-- Or manually create bucket in Storage → Create Bucket → academic-files

-- Insert bucket record directly (if you have permissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('academic-files', 'academic-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- 3. STORAGE POLICIES
-- Allow authenticated users to upload
INSERT INTO storage.objects (bucket_id, name, owner)
SELECT 'academic-files', '.keep', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'academic-files' AND name = '.keep');

-- Policy: Authenticated users can upload
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'academic-files');

-- Policy: Authenticated users can read
DROP POLICY IF EXISTS "authenticated_read" ON storage.objects;
CREATE POLICY "authenticated_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'academic-files');

-- 4. DISABLE EMAIL CONFIRMATION REQUIREMENT
-- This must be done in Supabase Dashboard → Authentication → Settings
-- Set "Enable email confirmations" to OFF
-- OR use the following to auto-confirm existing users:
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

