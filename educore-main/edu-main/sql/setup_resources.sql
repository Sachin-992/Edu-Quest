-- Setup Resources & File Upload Infrastructure

-- 1. Create table for file metadata
CREATE TABLE IF NOT EXISTS public.academic_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    class TEXT NOT NULL,   -- e.g. "10"
    section TEXT NOT NULL, -- e.g. "A"
    subject TEXT NOT NULL, -- e.g. "English"
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE public.academic_files ENABLE ROW LEVEL SECURITY;

-- Policies for academic_files table
-- Students: Read files for their class (Actually, to simplify, let's allow all authenticated to read metadata for now, or filter by class)
-- Better: Authenticated can read (simpler, relies on application filter)
DROP POLICY IF EXISTS "View Files" ON public.academic_files;
CREATE POLICY "View Files" ON public.academic_files FOR SELECT
    USING (auth.role() = 'authenticated');

-- Teachers: Insert/Update/Delete
DROP POLICY IF EXISTS "Manage Files" ON public.academic_files;
CREATE POLICY "Manage Files" ON public.academic_files FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

-- 2. Storage Bucket Setup
-- Note: Creating buckets via SQL is specific to Supabase Storage schema
INSERT INTO storage.buckets (id, name, public)
VALUES ('academic-files', 'academic-files', false) -- Private bucket, requires signed URLs
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- We need to allow uploads to 'academic-files' bucket for teachers
DROP POLICY IF EXISTS "Give teachers access" ON storage.objects;
CREATE POLICY "Give teachers access" ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'academic-files' AND 
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('teacher', 'admin')
        )
    );

-- Allow viewing/downloading for authenticated users
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;
CREATE POLICY "Allow authenticated read" ON storage.objects FOR SELECT
    USING (
        bucket_id = 'academic-files' AND 
        auth.role() = 'authenticated'
    );

-- Allow teachers to delete their own uploads? 
DROP POLICY IF EXISTS "Allow teachers update/delete" ON storage.objects;
CREATE POLICY "Allow teachers update/delete" ON storage.objects FOR ALL
    USING (
        bucket_id = 'academic-files' AND 
        auth.uid() = owner  -- storage.objects has 'owner' column usually set to auth.uid()
    );
