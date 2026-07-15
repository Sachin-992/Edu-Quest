-- 20250122_academic_tables.sql
-- Migration for Academic Edge Platform (Attendance & Files)

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
-- We need this because we seed 'Grade' level rows (Class 1) which have no section.
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
-- Note: If 'name' is not unique constraint, duplicates might appear if IDs differ. 
-- Schema typically has no unique on name, but we rely on name for linking.
-- We assume clean state or reasonable duplicates.

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

