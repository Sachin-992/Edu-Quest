-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA PRODUCTION DATABASE
-- Complete Schema for Supabase Deployment
-- Run this ENTIRE script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fee_status AS ENUM ('paid', 'partial', 'pending', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_severity AS ENUM ('info', 'success', 'warning', 'error', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- USERS (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    grade_levels INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
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

-- FILES
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_type TEXT,
    size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    assigned_to TEXT[],
    visibility TEXT DEFAULT 'assigned' CHECK (visibility IN ('public', 'assigned', 'private')),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT_LOGS (IMMUTABLE)
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class, section);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_user ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: AUDIT LOG IMMUTABILITY TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Prevent UPDATE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AUDIT VIOLATION: Updates to audit_logs are forbidden';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_update();

-- Prevent DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AUDIT VIOLATION: Deletions from audit_logs are forbidden';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_delete ON audit_logs;
CREATE TRIGGER audit_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_delete();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: HELPER FUNCTIONS FOR RLS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get current user's role from users table
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role::TEXT FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'teacher'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get student IDs linked to current parent
CREATE OR REPLACE FUNCTION get_my_student_ids()
RETURNS SETOF UUID AS $$
    SELECT psl.student_id
    FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    JOIN users u ON u.id = p.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's student record (if student)
CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS UUID AS $$
    SELECT s.id FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 8: ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- *** USERS ***
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_read_self" ON users;
CREATE POLICY "users_admin_all" ON users FOR ALL USING (is_admin());
CREATE POLICY "users_read_self" ON users FOR SELECT USING (auth_id = auth.uid());

-- *** CLASSES ***
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
DROP POLICY IF EXISTS "classes_read_all" ON classes;
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (is_admin());
CREATE POLICY "classes_read_all" ON classes FOR SELECT USING (true);

-- *** SUBJECTS ***
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
DROP POLICY IF EXISTS "subjects_read_all" ON subjects;
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (is_admin());
CREATE POLICY "subjects_read_all" ON subjects FOR SELECT USING (true);

-- *** STUDENTS ***
DROP POLICY IF EXISTS "students_admin_all" ON students;
DROP POLICY IF EXISTS "students_teacher_read" ON students;
DROP POLICY IF EXISTS "students_parent_read_linked" ON students;
DROP POLICY IF EXISTS "students_self_read" ON students;
CREATE POLICY "students_admin_all" ON students FOR ALL USING (is_admin());
CREATE POLICY "students_teacher_read" ON students FOR SELECT USING (is_teacher());
CREATE POLICY "students_parent_read_linked" ON students FOR SELECT USING (id IN (SELECT get_my_student_ids()));
CREATE POLICY "students_self_read" ON students FOR SELECT USING (id = get_my_student_id());

-- *** TEACHERS ***
DROP POLICY IF EXISTS "teachers_admin_all" ON teachers;
DROP POLICY IF EXISTS "teachers_self_read" ON teachers;
CREATE POLICY "teachers_admin_all" ON teachers FOR ALL USING (is_admin());
CREATE POLICY "teachers_self_read" ON teachers FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- *** PARENTS ***
DROP POLICY IF EXISTS "parents_admin_all" ON parents;
DROP POLICY IF EXISTS "parents_self_read" ON parents;
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (is_admin());
CREATE POLICY "parents_self_read" ON parents FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- *** PARENT_STUDENT_LINKS ***
DROP POLICY IF EXISTS "psl_admin_all" ON parent_student_links;
DROP POLICY IF EXISTS "psl_parent_read" ON parent_student_links;
CREATE POLICY "psl_admin_all" ON parent_student_links FOR ALL USING (is_admin());
CREATE POLICY "psl_parent_read" ON parent_student_links FOR SELECT USING (
    parent_id IN (
        SELECT p.id FROM parents p 
        JOIN users u ON u.id = p.user_id 
        WHERE u.auth_id = auth.uid()
    )
);

-- *** ATTENDANCE ***
DROP POLICY IF EXISTS "attendance_admin_all" ON attendance;
DROP POLICY IF EXISTS "attendance_teacher_crud" ON attendance;
DROP POLICY IF EXISTS "attendance_student_read" ON attendance;
DROP POLICY IF EXISTS "attendance_parent_read" ON attendance;
CREATE POLICY "attendance_admin_all" ON attendance FOR ALL USING (is_admin());
CREATE POLICY "attendance_teacher_crud" ON attendance FOR ALL USING (is_teacher());
CREATE POLICY "attendance_student_read" ON attendance FOR SELECT USING (student_id = get_my_student_id());
CREATE POLICY "attendance_parent_read" ON attendance FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

-- *** MARKS ***
DROP POLICY IF EXISTS "marks_admin_all" ON marks;
DROP POLICY IF EXISTS "marks_teacher_crud" ON marks;
DROP POLICY IF EXISTS "marks_student_read" ON marks;
DROP POLICY IF EXISTS "marks_parent_read" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());
CREATE POLICY "marks_teacher_crud" ON marks FOR ALL USING (is_teacher());
CREATE POLICY "marks_student_read" ON marks FOR SELECT USING (student_id = get_my_student_id());
CREATE POLICY "marks_parent_read" ON marks FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

-- *** ASSIGNMENTS ***
DROP POLICY IF EXISTS "assignments_admin_all" ON assignments;
DROP POLICY IF EXISTS "assignments_teacher_crud" ON assignments;
DROP POLICY IF EXISTS "assignments_read_all" ON assignments;
CREATE POLICY "assignments_admin_all" ON assignments FOR ALL USING (is_admin());
CREATE POLICY "assignments_teacher_crud" ON assignments FOR ALL USING (is_teacher());
CREATE POLICY "assignments_read_all" ON assignments FOR SELECT USING (true);

-- *** REMARKS ***
DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
DROP POLICY IF EXISTS "remarks_teacher_crud" ON remarks;
DROP POLICY IF EXISTS "remarks_parent_read" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL USING (is_admin());
CREATE POLICY "remarks_teacher_crud" ON remarks FOR ALL USING (is_teacher());
CREATE POLICY "remarks_parent_read" ON remarks FOR SELECT USING (
    student_id IN (SELECT get_my_student_ids()) AND visibility IN ('parent', 'student')
);

-- *** FEE_RECORDS ***
DROP POLICY IF EXISTS "fees_admin_all" ON fee_records;
DROP POLICY IF EXISTS "fees_parent_read" ON fee_records;
CREATE POLICY "fees_admin_all" ON fee_records FOR ALL USING (is_admin());
CREATE POLICY "fees_parent_read" ON fee_records FOR SELECT USING (
    student_id IN (SELECT get_my_student_ids())
);

-- *** PAYMENTS ***
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "payments_parent_read" ON payments;
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (is_admin());
CREATE POLICY "payments_parent_read" ON payments FOR SELECT USING (
    fee_record_id IN (
        SELECT id FROM fee_records WHERE student_id IN (SELECT get_my_student_ids())
    )
);

-- *** FILES ***
DROP POLICY IF EXISTS "files_admin_all" ON files;
DROP POLICY IF EXISTS "files_teacher_own" ON files;
DROP POLICY IF EXISTS "files_read_assigned" ON files;
CREATE POLICY "files_admin_all" ON files FOR ALL USING (is_admin());
CREATE POLICY "files_teacher_own" ON files FOR ALL USING (
    is_teacher() AND owner_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);
CREATE POLICY "files_read_assigned" ON files FOR SELECT USING (
    visibility = 'public' OR 
    owner_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- *** AUDIT_LOGS ***
DROP POLICY IF EXISTS "audit_insert_all" ON audit_logs;
DROP POLICY IF EXISTS "audit_read_admin" ON audit_logs;
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_read_admin" ON audit_logs FOR SELECT USING (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 9: SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert classes
INSERT INTO classes (name, grade_level) VALUES
    ('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4),
    ('Class 5', 5), ('Class 6', 6), ('Class 7', 7), ('Class 8', 8),
    ('Class 9', 9), ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT DO NOTHING;

-- Insert subjects
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 10: STORAGE BUCKET POLICY (Run in Storage -> Policies)
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- After running this SQL, go to Supabase Dashboard > Storage and:
-- 1. Create bucket: "academic-files"
-- 2. Keep bucket PRIVATE (do not enable public access)
-- 3. Add the following policies in the Storage section:
--
-- SELECT policy (Download):
--   Name: "Allow authenticated downloads"
--   Target: authenticated
--   Expression: true
--
-- INSERT policy (Upload):
--   Name: "Allow teacher/admin uploads"
--   Target: authenticated
--   Expression: (SELECT role FROM users WHERE auth_id = auth.uid()) IN ('admin', 'teacher')
--
-- DELETE policy (Delete):
--   Name: "Allow owner delete"
--   Target: authenticated
--   Expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPLOYMENT COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- SUMMARY:
-- ✅ 16 tables created
-- ✅ Enums for type safety
-- ✅ Foreign keys for referential integrity
-- ✅ Indexes for performance
-- ✅ RLS enabled on all tables
-- ✅ Role-based policies (no USING(true) in write policies)
-- ✅ Audit log immutability triggers
-- ✅ Helper functions for RLS
-- ✅ Seed data for classes and subjects
--
-- NEXT STEPS:
-- 1. Create Storage bucket "academic-files" (private)
-- 2. Add storage policies as described above
-- 3. Create users via Supabase Auth
-- 4. Link auth users to users table with role
--
-- ═══════════════════════════════════════════════════════════════════════════════
