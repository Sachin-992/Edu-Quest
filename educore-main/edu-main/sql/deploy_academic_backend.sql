-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPLOY: ACADEMIC FILES BACKEND
-- Creates Storage Bucket and Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Storage Bucket 'academic_resources' if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'academic_resources', 
    'academic_resources', 
    true, -- Make public for easier download access (or false if using signed URLs)
    52428800, -- 50MB limit
    array[
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800;

-- 2. Storage Policies for 'academic_resources'

-- Policy: Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'academic_resources' );

-- Policy: Everyone can view (if public=true) OR Authenticated view
DROP POLICY IF EXISTS "Authenticated Users Can Select" ON storage.objects;
CREATE POLICY "Authenticated Users Can Select" ON storage.objects
FOR SELECT TO authenticated
USING ( bucket_id = 'academic_resources' );

-- Policy: Teachers can update/delete their own files (Optional)
-- (Skipping complex logic for now, basic upload/read is MVP)

-- 3. Verify academic_files Table Exists (from previous migration)
-- Just ensuring RLS is active
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions to Service Role (for Edge Function admin usage if needed)
GRANT ALL ON academic_files TO service_role;
GRANT ALL ON storage.objects TO service_role;
