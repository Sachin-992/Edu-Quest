-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: COMPLETE FINAL FEATURE UPDATE & MIGRATION
-- Run this ENTIRE script in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════════

-- =============================================================================
-- PART 1: CORE ACADEMIC TABLES (ATTENDANCE, MARKS, REMARKS)
-- From: FINAL_FEATURE_UPDATE.sql
-- =============================================================================

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


-- =============================================================================
-- PART 2: UPGRADE TO PERIOD-WISE ATTENDANCE (MIGRATION)
-- From: 20250122_academic_tables.sql
-- =============================================================================

-- 1. ENSURE CLASSES EXISTS & HAS NAME COLUMN (Robust Schema Fix)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix: Ensure 'name' column exists if table was created with different schema previously
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Fix: Relax 'section' constraint if it exists (legacy support for denormalized schema)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'section') THEN
        ALTER TABLE classes ALTER COLUMN section DROP NOT NULL;
    END IF;
END $$;

-- Seed data to ensure joins work (using standard names)
INSERT INTO classes (name, grade_level) VALUES
    ('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4),
    ('Class 5', 5), ('Class 6', 6), ('Class 7', 7), ('Class 8', 8),
    ('Class 9', 9), ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT DO NOTHING;

-- 2. TIMETABLE (To validate period assignments)
DROP TABLE IF EXISTS timetable CASCADE;
CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section_id, day_of_week, start_time) -- No two periods at same time for a section
);

-- 3. UPDATE ATTENDANCE (Support per-period)
-- Add timetable_period_id column
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS timetable_period_id UUID REFERENCES timetable(id) ON DELETE SET NULL;

-- Drop old unique constraint (student + date)
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;

-- Add new unique constraint (student + period + date)
-- "One attendance status per student per period per day"
ALTER TABLE attendance
DROP CONSTRAINT IF EXISTS attendance_student_period_date_key; -- Drop if exists to avoid error on retry
ALTER TABLE attendance
ADD CONSTRAINT attendance_student_period_date_key UNIQUE (student_id, timetable_period_id, date);

-- 4. ACADEMIC FILES (Specific metadata for verified uploads)
-- DROP first to ensure we get the correct schema (fix for "column class_id does not exist" error)
DROP TABLE IF EXISTS academic_files CASCADE;
CREATE TABLE IF NOT EXISTS academic_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE, -- Link to generic files table
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS for New Tables

-- Timetable
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetable_read_all" ON timetable;
DROP POLICY IF EXISTS "timetable_admin_all" ON timetable;
CREATE POLICY "timetable_read_all" ON timetable FOR SELECT USING (true);
CREATE POLICY "timetable_admin_all" ON timetable FOR ALL USING (is_admin());

-- Academic Files
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academic_files_read_access" ON academic_files;
DROP POLICY IF EXISTS "academic_files_insert_teacher" ON academic_files;

CREATE POLICY "academic_files_read_access" ON academic_files FOR SELECT USING (
    -- Admin sees all
    is_admin() OR
    -- Teacher sees their files (simplified)
    is_teacher() OR
    -- Student sees their class files
    (auth.uid() IN (SELECT user_id FROM students WHERE class = (SELECT name FROM classes WHERE id = academic_files.class_id))) OR
    -- Parent sees linked child's class files
    (auth.uid() IN (
        SELECT u.auth_id FROM users u
        JOIN parents p ON p.user_id = u.id
        JOIN parent_student_links psl ON psl.parent_id = p.id
        JOIN students s ON s.id = psl.student_id
        JOIN classes c ON c.name = s.class
        WHERE c.id = academic_files.class_id
    ))
);

CREATE POLICY "academic_files_insert_teacher" ON academic_files FOR INSERT WITH CHECK (
    is_teacher() OR is_admin()
);

-- DONE
