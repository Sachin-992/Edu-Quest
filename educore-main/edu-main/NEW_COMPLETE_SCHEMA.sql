-- ============================================================
-- EDUCORE-OMEGA MASTER SCHEMA (FIXED & IDEMPOTENT)
-- Combines Core Identity with V2 Academic System
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Safe Creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE fee_status AS ENUM ('paid', 'partial', 'pending', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE audit_severity AS ENUM ('info', 'success', 'warning', 'error', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE timetable_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE period_attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. CORE TABLES (With Schema Evolution Checks)

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'active',
    first_login BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Schema Migration for Users
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Remove Duplicates in Classes (Fix for "could not create unique index")
DELETE FROM classes a USING classes b
WHERE a.id < b.id AND a.name = b.name AND a.grade_level = b.grade_level;

-- Ensure Unique Constraint for Classes (for safe seeding)
DO $$ BEGIN
    ALTER TABLE classes ADD CONSTRAINT classes_name_grade_key UNIQUE (name, grade_level);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- SECTIONS
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 40,
    class_teacher_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, name)
);

-- SUBJECTS (Fixed Migration)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    grade_levels INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Schema Migration for Subjects (Fixes "grade_levels does not exist" error)
DO $$ BEGIN
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS grade_levels INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12];
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
-- Fix for Legacy Schema (Make class_id nullable if it exists)
DO $$ BEGIN
    ALTER TABLE subjects ALTER COLUMN class_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- Drop class_level NOT NULL constraint if it exists from legacy EduQuest setup
DO $$ BEGIN
    ALTER TABLE subjects ALTER COLUMN class_level DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; WHEN OTHERS THEN NULL; END $$;

-- Schema Migration for Subjects (Fixes missing code column)
DO $$ BEGIN
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Remove Duplicates in Subjects
DELETE FROM subjects a USING subjects b
WHERE a.id < b.id AND a.code = b.code;

-- Ensure Unique Constraint for Subjects logic
DO $$ BEGIN
    ALTER TABLE subjects ADD CONSTRAINT subjects_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;


-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_no INTEGER NOT NULL,
    date_of_birth DATE,
    address TEXT,
    guardian_phone TEXT,
    fee_status fee_status DEFAULT 'pending',
    status user_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    classes TEXT[] DEFAULT ARRAY[]::TEXT[],
    experience_years INTEGER DEFAULT 0,
    qualification TEXT,
    status user_status DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Schema Migration for Teachers
DO $$ BEGIN
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS classes TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- PARENTS
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    occupation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARENT-STUDENT LINKS
CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'other')),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- TIMETABLES (V2)
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    status timetable_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TIMETABLE PERIODS (V2)
CREATE TABLE IF NOT EXISTS timetable_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    subject TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_period_slot UNIQUE (timetable_id, day_of_week, period_number)
);

-- ATTENDANCE (V2 - Period Wise)
-- Note: 'attendance' table from V1 is deprecated in favor of 'attendance_periods' for granular tracking
CREATE TABLE IF NOT EXISTS attendance_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    timetable_period_id UUID NOT NULL REFERENCES timetable_periods(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status period_attendance_status NOT NULL,
    marked_by UUID REFERENCES users(id), -- Loosened constraint to avoid circular dependency issues during migration
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remarks TEXT,
    CONSTRAINT unique_attendance UNIQUE (student_id, timetable_period_id, attendance_date)
);

-- ATTENDANCE SUMMARY (V2 - Auto Calculated)
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    total_periods INTEGER NOT NULL DEFAULT 0,
    attended_periods INTEGER NOT NULL DEFAULT 0,
    attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_summary UNIQUE (student_id, class, section, subject)
);

-- MARKS
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL CHECK (marks >= 0),
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (max_marks > 0),
    grade TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id),
    class TEXT NOT NULL,
    due_date DATE NOT NULL,
    max_marks NUMERIC(5,2) DEFAULT 100,
    assignment_type TEXT DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'project', 'test', 'quiz', 'other')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMARKS
CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('academic', 'behavioral', 'achievement', 'counselling', 'other')),
    content TEXT NOT NULL,
    added_by UUID REFERENCES users(id),
    visibility TEXT DEFAULT 'parent' CHECK (visibility IN ('internal', 'parent', 'student')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEE_RECORDS
CREATE TABLE IF NOT EXISTS fee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    class TEXT NOT NULL,
    fee_type TEXT DEFAULT 'tuition' CHECK (fee_type IN ('tuition', 'transport', 'exam', 'library', 'misc')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    paid NUMERIC(10,2) DEFAULT 0 CHECK (paid >= 0),
    due NUMERIC(10,2) GENERATED ALWAYS AS (amount - paid) STORED,
    status fee_status GENERATED ALWAYS AS (
        CASE 
            WHEN (amount - paid) <= 0 THEN 'paid'::fee_status
            WHEN (amount - paid) < amount THEN 'partial'::fee_status
            ELSE 'pending'::fee_status
        END
    ) STORED,
    due_date DATE NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_record_id UUID NOT NULL REFERENCES fee_records(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
    transaction_id TEXT,
    received_by UUID REFERENCES users(id),
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACADEMIC FILES (V2)
CREATE TABLE IF NOT EXISTS academic_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    timetable_period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT DEFAULT 'client',
    severity audit_severity DEFAULT 'info',
    session_id TEXT
);

-- 4. ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. HELPER FUNCTIONS (Idempotent)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role::TEXT FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'teacher');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'student');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'parent');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_student_ids()
RETURNS SETOF UUID AS $$
    SELECT psl.student_id
    FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    JOIN users u ON u.id = p.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS UUID AS $$
    SELECT s.id FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_teacher_id()
RETURNS UUID AS $$
    SELECT t.id FROM teachers t
    JOIN users u ON u.id = t.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_period_ids()
RETURNS SETOF UUID AS $$
    SELECT tp.id FROM timetable_periods tp
    WHERE tp.teacher_id = get_my_teacher_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. POLICIES (Idempotent - Drop before Create)

-- USERS
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "users_read_self" ON users;
CREATE POLICY "users_read_self" ON users FOR SELECT USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_self" ON users;
CREATE POLICY "users_insert_self" ON users FOR INSERT WITH CHECK (auth_id = auth.uid());

-- CLASSES
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "classes_read_all" ON classes;
CREATE POLICY "classes_read_all" ON classes FOR SELECT USING (true);

-- SUBJECTS
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "subjects_read_all" ON subjects;
CREATE POLICY "subjects_read_all" ON subjects FOR SELECT USING (true);

-- STUDENTS
DROP POLICY IF EXISTS "students_admin_all" ON students;
CREATE POLICY "students_admin_all" ON students FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "students_teacher_read" ON students;
CREATE POLICY "students_teacher_read" ON students FOR SELECT USING (is_teacher());

DROP POLICY IF EXISTS "students_parent_read_linked" ON students;
CREATE POLICY "students_parent_read_linked" ON students FOR SELECT USING (id IN (SELECT get_my_student_ids()));

DROP POLICY IF EXISTS "students_self_read" ON students;
CREATE POLICY "students_self_read" ON students FOR SELECT USING (id = get_my_student_id());

-- TEACHERS
DROP POLICY IF EXISTS "teachers_admin_all" ON teachers;
CREATE POLICY "teachers_admin_all" ON teachers FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "teachers_self_read" ON teachers;
CREATE POLICY "teachers_self_read" ON teachers FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- PARENTS
DROP POLICY IF EXISTS "parents_admin_all" ON parents;
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "parents_self_read" ON parents;
CREATE POLICY "parents_self_read" ON parents FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- PARENT_STUDENT_LINKS
DROP POLICY IF EXISTS "psl_admin_all" ON parent_student_links;
CREATE POLICY "psl_admin_all" ON parent_student_links FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "psl_parent_read" ON parent_student_links;
CREATE POLICY "psl_parent_read" ON parent_student_links FOR SELECT USING (
    parent_id IN (SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.auth_id = auth.uid())
);

-- TIMETABLES
DROP POLICY IF EXISTS "timetables_admin_all" ON timetables;
CREATE POLICY "timetables_admin_all" ON timetables FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "timetables_teacher_select" ON timetables;
CREATE POLICY "timetables_teacher_select" ON timetables FOR SELECT USING (
    is_teacher() AND status = 'published' AND
    id IN (SELECT timetable_id FROM timetable_periods WHERE teacher_id = get_my_teacher_id())
);

DROP POLICY IF EXISTS "timetables_user_select" ON timetables;
CREATE POLICY "timetables_user_select" ON timetables FOR SELECT USING (true); -- Broad read open for now, refine if needed

-- TIMETABLE PERIODS
DROP POLICY IF EXISTS "periods_admin_all" ON timetable_periods;
CREATE POLICY "periods_admin_all" ON timetable_periods FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "periods_read_all" ON timetable_periods;
CREATE POLICY "periods_read_all" ON timetable_periods FOR SELECT USING (true);

-- ATTENDANCE PERIODS
DROP POLICY IF EXISTS "attendance_admin_all" ON attendance_periods;
CREATE POLICY "attendance_admin_all" ON attendance_periods FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "attendance_teacher_crud" ON attendance_periods;
CREATE POLICY "attendance_teacher_crud" ON attendance_periods FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "attendance_student_read" ON attendance_periods;
CREATE POLICY "attendance_student_read" ON attendance_periods FOR SELECT USING (student_id = get_my_student_id());

DROP POLICY IF EXISTS "attendance_parent_read" ON attendance_periods;
CREATE POLICY "attendance_parent_read" ON attendance_periods FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

-- ATTENDANCE SUMMARY
DROP POLICY IF EXISTS "summary_admin_all" ON attendance_summary;
CREATE POLICY "summary_admin_all" ON attendance_summary FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "summary_read_all" ON attendance_summary;
CREATE POLICY "summary_read_all" ON attendance_summary FOR SELECT USING (true); -- Simplified for dashboard view

-- MARKS
DROP POLICY IF EXISTS "marks_admin_all" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "marks_teacher_crud" ON marks;
CREATE POLICY "marks_teacher_crud" ON marks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "marks_student_read" ON marks;
CREATE POLICY "marks_student_read" ON marks FOR SELECT USING (student_id = get_my_student_id());

DROP POLICY IF EXISTS "marks_parent_read" ON marks;
CREATE POLICY "marks_parent_read" ON marks FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

-- ASSIGNMENTS
DROP POLICY IF EXISTS "assignments_admin_all" ON assignments;
CREATE POLICY "assignments_admin_all" ON assignments FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "assignments_teacher_crud" ON assignments;
CREATE POLICY "assignments_teacher_crud" ON assignments FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "assignments_read_all" ON assignments;
CREATE POLICY "assignments_read_all" ON assignments FOR SELECT USING (true);

-- REMARKS
DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "remarks_teacher_crud" ON remarks;
CREATE POLICY "remarks_teacher_crud" ON remarks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "remarks_parent_read" ON remarks;
CREATE POLICY "remarks_parent_read" ON remarks FOR SELECT USING (
    student_id IN (SELECT get_my_student_ids()) AND visibility IN ('parent', 'student')
);

-- FEE RECORDS
DROP POLICY IF EXISTS "fees_admin_all" ON fee_records;
CREATE POLICY "fees_admin_all" ON fee_records FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "fees_parent_read" ON fee_records;
CREATE POLICY "fees_parent_read" ON fee_records FOR SELECT USING (
    student_id IN (SELECT get_my_student_ids())
);

-- PAYMENTS
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "payments_parent_read" ON payments;
CREATE POLICY "payments_parent_read" ON payments FOR SELECT USING (
    fee_record_id IN (SELECT id FROM fee_records WHERE student_id IN (SELECT get_my_student_ids()))
);

-- ACADEMIC FILES
DROP POLICY IF EXISTS "files_admin_all" ON academic_files;
CREATE POLICY "files_admin_all" ON academic_files FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "files_read_all" ON academic_files;
CREATE POLICY "files_read_all" ON academic_files FOR SELECT USING (true); -- Simplified

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_insert_all" ON audit_logs;
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "audit_read_admin" ON audit_logs;
CREATE POLICY "audit_read_admin" ON audit_logs FOR SELECT USING (is_admin());

-- 7. TRIGGERS (Safe Creation)

-- Audit Immutability
CREATE OR REPLACE FUNCTION prevent_audit_update() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'AUDIT VIOLATION: Updates to audit_logs are forbidden'; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE OR REPLACE FUNCTION prevent_audit_delete() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'AUDIT VIOLATION: Deletions from audit_logs are forbidden'; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_delete ON audit_logs;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

-- Attendance Summary Auto-Update
CREATE OR REPLACE FUNCTION fn_update_attendance_summary() RETURNS TRIGGER AS $$
DECLARE
    v_period RECORD;
    v_total INTEGER;
    v_attended INTEGER;
    v_percentage NUMERIC(5,2);
    v_student_id UUID;
BEGIN
    v_student_id := COALESCE(NEW.student_id, OLD.student_id);
    SELECT tp.subject, t.class, t.section INTO v_period
    FROM timetable_periods tp JOIN timetables t ON t.id = tp.timetable_id
    WHERE tp.id = COALESCE(NEW.timetable_period_id, OLD.timetable_period_id);
    
    IF v_period IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
    
    SELECT count(*), count(*) FILTER (WHERE ap.status IN ('present', 'late'))
    INTO v_total, v_attended FROM attendance_periods ap
    JOIN timetable_periods tp ON tp.id = ap.timetable_period_id
    JOIN timetables t ON t.id = tp.timetable_id
    WHERE ap.student_id = v_student_id AND tp.subject = v_period.subject
      AND t.class = v_period.class AND t.section = v_period.section;
    
    v_percentage := CASE WHEN v_total > 0 THEN ROUND((v_attended::NUMERIC / v_total) * 100, 2) ELSE 0.00 END;
    
    INSERT INTO attendance_summary (student_id, class, section, subject, total_periods, attended_periods, attendance_percentage, last_updated_at)
    VALUES (v_student_id, v_period.class, v_period.section, v_period.subject, v_total, v_attended, v_percentage, NOW())
    ON CONFLICT (student_id, class, section, subject)
    DO UPDATE SET total_periods = v_total, attended_periods = v_attended, attendance_percentage = v_percentage, last_updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_summary ON attendance_periods;
CREATE TRIGGER trg_update_summary AFTER INSERT OR UPDATE OR DELETE ON attendance_periods FOR EACH ROW EXECUTE FUNCTION fn_update_attendance_summary();


-- 8. INITIAL DATA (Safe Insert)
INSERT INTO classes (name, grade_level) VALUES
    ('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4),
    ('Class 5', 5), ('Class 6', 6), ('Class 7', 7), ('Class 8', 8),
    ('Class 9', 9), ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT (name, grade_level) DO NOTHING;

INSERT INTO subjects (name, code, grade_levels) VALUES
    ('Mathematics', 'MATH', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
    ('Science', 'SCI', ARRAY[1,2,3,4,5,6,7,8,9,10]),
    ('Physics', 'PHY', ARRAY[11,12]),
    ('Chemistry', 'CHEM', ARRAY[11,12]),
    ('Biology', 'BIO', ARRAY[11,12]),
    ('English', 'ENG', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
    ('Hindi', 'HIN', ARRAY[1,2,3,4,5,6,7,8,9,10]),
    ('Social Science', 'SST', ARRAY[1,2,3,4,5,6,7,8,9,10]),
    ('Computer Science', 'CS', ARRAY[6,7,8,9,10,11,12])
ON CONFLICT (code) DO NOTHING;

