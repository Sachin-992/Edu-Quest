-- ============================================================
-- EDUCORE-OMEGA PRODUCTION FIX SCRIPT
-- Run this AFTER NEW_COMPLETE_SCHEMA.sql
-- Fixes: Schema mismatches, missing columns, identity pipeline
-- ============================================================

-- 1. ADD MISSING COLUMNS TO STUDENTS (Extended Profile)
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_number TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_joining INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;

-- Ensure roll_no column exists (handle both cases: already exists OR needs rename)
DO $$ 
BEGIN
    -- First check if roll_no already exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'students' AND column_name = 'roll_no') THEN
        -- roll_no exists, do nothing
        RAISE NOTICE 'roll_no column already exists, skipping';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'roll_number') THEN
        -- roll_number exists, rename to roll_no
        ALTER TABLE students RENAME COLUMN roll_number TO roll_no;
        RAISE NOTICE 'Renamed roll_number to roll_no';
    ELSE
        -- Neither exists, create roll_no
        ALTER TABLE students ADD COLUMN roll_no INTEGER;
        RAISE NOTICE 'Created roll_no column';
    END IF;
END $$;

-- 2. ADD MISSING COLUMNS TO TEACHERS (Extended Profile)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Teacher';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. FIX USERS TABLE (Identity Link)
-- Ensure name column exists with proper default
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'User';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Backfill missing names from email
UPDATE users SET name = split_part(email, '@', 1) WHERE name IS NULL OR name = '';

-- 4. CREATE NOTICES TABLE (For Academic Service)
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id TEXT, -- NULL means school-wide
    type TEXT NOT NULL CHECK (type IN ('homework', 'announcement', 'exam', 'event')),
    title TEXT NOT NULL,
    content TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE DAILY_HOMEWORK TABLE (For Academic Service)
CREATE TABLE IF NOT EXISTS daily_homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    content TEXT NOT NULL,
    homework_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT daily_homework_unique UNIQUE (class_id, subject_id, homework_date)
);

-- 6. CREATE EXAMS TABLE (For Academic Service)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'published')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENABLE RLS ON NEW TABLES
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES FOR NEW TABLES
DROP POLICY IF EXISTS "notices_admin_all" ON notices;
CREATE POLICY "notices_admin_all" ON notices FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "notices_teacher_crud" ON notices;
CREATE POLICY "notices_teacher_crud" ON notices FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "notices_read_all" ON notices;
CREATE POLICY "notices_read_all" ON notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "homework_admin_all" ON daily_homework;
CREATE POLICY "homework_admin_all" ON daily_homework FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "homework_teacher_crud" ON daily_homework;
CREATE POLICY "homework_teacher_crud" ON daily_homework FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "homework_read_all" ON daily_homework;
CREATE POLICY "homework_read_all" ON daily_homework FOR SELECT USING (true);

DROP POLICY IF EXISTS "exams_admin_all" ON exams;
CREATE POLICY "exams_admin_all" ON exams FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "exams_read_all" ON exams;
CREATE POLICY "exams_read_all" ON exams FOR SELECT USING (true);

-- 9. CREATE PERIOD_ATTENDANCE TABLE (For Attendance Marking)
CREATE TABLE IF NOT EXISTS period_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_period_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    CONSTRAINT unique_period_attendance UNIQUE (timetable_period_id, student_id, date)
);

ALTER TABLE period_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "period_attendance_admin_all" ON period_attendance;
CREATE POLICY "period_attendance_admin_all" ON period_attendance FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "period_attendance_teacher_all" ON period_attendance;
CREATE POLICY "period_attendance_teacher_all" ON period_attendance FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "period_attendance_student_read" ON period_attendance;
CREATE POLICY "period_attendance_student_read" ON period_attendance FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
);

-- 10. CREATE MARKS TABLE (For Academic Marks Entry)
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
    grade TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marks_admin_all" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "marks_teacher_crud" ON marks;
CREATE POLICY "marks_teacher_crud" ON marks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "marks_student_read" ON marks;
CREATE POLICY "marks_student_read" ON marks FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
);

-- 11. CREATE REMARKS TABLE (For Student Remarks)
CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    type TEXT NOT NULL CHECK (type IN ('academic', 'behavior', 'counselling')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "remarks_teacher_crud" ON remarks;
CREATE POLICY "remarks_teacher_crud" ON remarks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "remarks_student_read" ON remarks;
CREATE POLICY "remarks_student_read" ON remarks FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
);

-- 12. CREATE ASSIGNMENTS TABLE (For Assignment Management)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID,
    teacher_id UUID REFERENCES teachers(id),
    class_id UUID,
    due_date DATE,
    max_marks NUMERIC(5,2) DEFAULT 100,
    type TEXT DEFAULT 'Homework' CHECK (type IN ('Homework', 'Project', 'Exam')),
    submission_mode TEXT DEFAULT 'online' CHECK (submission_mode IN ('online', 'offline')),
    allow_late_submission BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_admin_all" ON assignments;
CREATE POLICY "assignments_admin_all" ON assignments FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "assignments_teacher_crud" ON assignments;
CREATE POLICY "assignments_teacher_crud" ON assignments FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "assignments_read_all" ON assignments;
CREATE POLICY "assignments_read_all" ON assignments FOR SELECT USING (true);

-- 13. CREATE ACADEMIC_FILES TABLE (For File Uploads)
CREATE TABLE IF NOT EXISTS academic_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    timetable_period_id UUID,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on academic_files
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;

-- Policies for academic_files
DROP POLICY IF EXISTS "academic_files_admin_all" ON academic_files;
CREATE POLICY "academic_files_admin_all" ON academic_files FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "academic_files_teacher_crud" ON academic_files;
CREATE POLICY "academic_files_teacher_crud" ON academic_files FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "academic_files_read_all" ON academic_files;
CREATE POLICY "academic_files_read_all" ON academic_files FOR SELECT USING (true);

-- 14. CREATE PARENTS TABLE (For Parent Management)
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on parents
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Policies for parents
DROP POLICY IF EXISTS "parents_admin_all" ON parents;
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "parents_self_read" ON parents;
CREATE POLICY "parents_self_read" ON parents FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- 15. CREATE PARENT_STUDENT_LINKS TABLE (For Parent-Student Relationship)
CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'guardian',
    is_primary BOOLEAN DEFAULT false,
    is_primary_for_password BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_parent_student UNIQUE (parent_id, student_id)
);

-- Enable RLS on parent_student_links
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policies for parent_student_links
DROP POLICY IF EXISTS "links_admin_all" ON parent_student_links;
CREATE POLICY "links_admin_all" ON parent_student_links FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "links_parent_read" ON parent_student_links;
CREATE POLICY "links_parent_read" ON parent_student_links FOR SELECT USING (
    parent_id IN (SELECT id FROM parents WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
);

-- 16. STORAGE BUCKET FOR ACADEMIC FILES
-- NOTE: Run this manually in Supabase Dashboard → Storage → Create Bucket
-- Bucket Name: academic-files
-- Public: No
-- File size limit: 50MB

-- 17. RPC FOR IDENTITY REPAIR (Bypasses RLS for self-healing)
-- Drop existing function first (return type change requires this)
DROP FUNCTION IF EXISTS repair_identity_rpc(TEXT, TEXT);

CREATE OR REPLACE FUNCTION repair_identity_rpc(p_role TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth_user_id UUID;
    v_email TEXT;
    v_new_user RECORD;
BEGIN
    -- Get current auth user
    v_auth_user_id := auth.uid();
    IF v_auth_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get email from auth.users
    SELECT email INTO v_email FROM auth.users WHERE id = v_auth_user_id;

    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM users WHERE auth_id = v_auth_user_id) THEN
        SELECT id, email, role, status, first_login, created_at INTO v_new_user 
        FROM users WHERE auth_id = v_auth_user_id;
        RETURN jsonb_build_object('success', true, 'user', row_to_json(v_new_user));
    END IF;

    -- Create new user record
    INSERT INTO users (auth_id, email, name, role, status, first_login)
    VALUES (v_auth_user_id, v_email, p_name, p_role::user_role, 'active', false)
    RETURNING id, email, role, status, first_login, created_at INTO v_new_user;

    RETURN jsonb_build_object('success', true, 'user', row_to_json(v_new_user));
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION repair_identity_rpc TO authenticated;


