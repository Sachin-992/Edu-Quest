-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: COMPLETE TEACHER FEATURES UPDATE
-- 
-- 1. ATTENDANCE, MARKS, REMARKS Schema
-- 2. FILE STORAGE (PPT, Docs, Excel, PDF)
-- 3. RLS SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- PART 1: ACADEMIC TABLES (Persistence)

-- Reference: academic_persistence_schema.sql

-- 1.1 ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_attendance UNIQUE (student_id, date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 1.2 MARKS
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL, 
    exam_type TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL,
    grade TEXT,
    entered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- 1.3 REMARKS
CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id), 
    type TEXT NOT NULL CHECK (type IN ('academic', 'behavior', 'counselling')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;

-- PART 2: RLS POLICIES (Security)

-- ATTENDANCE
DROP POLICY IF EXISTS "attendance_admin_all" ON attendance;
CREATE POLICY "attendance_admin_all" ON attendance FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "attendance_teacher_all" ON attendance;
CREATE POLICY "attendance_teacher_all" ON attendance FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "attendance_student_view" ON attendance;
CREATE POLICY "attendance_student_view" ON attendance FOR SELECT 
    USING (student_id IN (SELECT get_my_student_id()));

-- MARKS
DROP POLICY IF EXISTS "marks_admin_all" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "marks_teacher_all" ON marks;
CREATE POLICY "marks_teacher_all" ON marks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "marks_student_view" ON marks;
CREATE POLICY "marks_student_view" ON marks FOR SELECT 
    USING (student_id IN (SELECT get_my_student_id()));

-- REMARKS
DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "remarks_teacher_all" ON remarks;
CREATE POLICY "remarks_teacher_all" ON remarks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "remarks_student_view" ON remarks;
CREATE POLICY "remarks_student_view" ON remarks FOR SELECT 
    USING (student_id IN (SELECT get_my_student_id()));

-- PART 3: FILE STORAGE (Resources Tab)

-- 3.1 Create Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'academic_resources', 
    'academic_resources', 
    true, 
    52428800, -- 50MB
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
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3.2 Storage Policies
DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'academic_resources' );

DROP POLICY IF EXISTS "Authenticated Users Can Select" ON storage.objects;
CREATE POLICY "Authenticated Users Can Select" ON storage.objects
FOR SELECT TO authenticated
USING ( bucket_id = 'academic_resources' );

-- 3.3 Ensure RLS on metadata
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;
GRANT ALL ON academic_files TO service_role;
GRANT ALL ON storage.objects TO service_role;

-- 4. ANALYTICS INDEXES
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_remarks_student ON remarks(student_id);
