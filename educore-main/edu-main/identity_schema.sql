-- ============================================================
-- EDUCORE-OMEGA PRODUCTION IDENTITY SCHEMA
-- ============================================================
-- This schema implements a REAL, DATABASE-ENFORCED identity system
-- with Supabase Auth integration and Row Level Security (RLS)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE (Links to Supabase Auth)
-- ============================================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'teacher', 'student', 'parent')) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    first_login BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin can see and manage all users
CREATE POLICY "admin_full_access_users" ON users
FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Users can view their own record
CREATE POLICY "user_self_read" ON users
FOR SELECT USING (id = auth.uid());

-- ============================================================
-- 2. STUDENTS TABLE
-- ============================================================
DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    admission_number TEXT UNIQUE,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number INTEGER,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    address TEXT,
    phone TEXT,
    email TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    fee_status TEXT DEFAULT 'pending' CHECK (fee_status IN ('paid', 'pending', 'overdue')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Student can only view their own record
CREATE POLICY "student_self_view" ON students
FOR SELECT USING (user_id = auth.uid());

-- Admin has full access
CREATE POLICY "admin_full_access_students" ON students
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Teachers can view students in their assigned classes
CREATE POLICY "teacher_view_assigned_students" ON students
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN teachers t ON t.user_id = u.id
        WHERE u.id = auth.uid() 
        AND u.role = 'teacher'
        AND students.class = ANY(t.classes)
    )
);

-- ============================================================
-- 3. TEACHERS TABLE
-- ============================================================
DROP TABLE IF EXISTS teachers CASCADE;
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    employee_id TEXT UNIQUE,
    email TEXT NOT NULL,
    phone TEXT,
    subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
    classes TEXT[] DEFAULT ARRAY[]::TEXT[],
    designation TEXT DEFAULT 'Teacher',
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    date_of_birth DATE,
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'leave', 'resigned', 'retired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Teacher can only view their own record
CREATE POLICY "teacher_self_view" ON teachers
FOR SELECT USING (user_id = auth.uid());

-- Admin has full access
CREATE POLICY "admin_full_access_teachers" ON teachers
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 4. PARENTS TABLE
-- ============================================================
DROP TABLE IF EXISTS parents CASCADE;
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    occupation TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Parent can only view their own record
CREATE POLICY "parent_self_view" ON parents
FOR SELECT USING (user_id = auth.uid());

-- Admin has full access
CREATE POLICY "admin_full_access_parents" ON parents
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 5. PARENT-STUDENT LINKS (Multi-child support)
-- ============================================================
DROP TABLE IF EXISTS parent_student_links CASCADE;
CREATE TABLE parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent' CHECK (relationship IN ('father', 'mother', 'guardian', 'parent')),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parent can view their own links
CREATE POLICY "parent_view_own_links" ON parent_student_links
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM parents p 
        WHERE p.id = parent_student_links.parent_id 
        AND p.user_id = auth.uid()
    )
);

-- Admin has full access
CREATE POLICY "admin_full_access_links" ON parent_student_links
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- CRITICAL: Parents can view their linked students
CREATE POLICY "parent_view_linked_students" ON students
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM parent_student_links psl
        JOIN parents p ON psl.parent_id = p.id
        WHERE p.user_id = auth.uid()
        AND psl.student_id = students.id
    )
);

-- ============================================================
-- 6. AUDIT LOGS (IMMUTABLE)
-- ============================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    actor_id UUID,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
        'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT',
        'PASSWORD_RESET', 'PASSWORD_CHANGE',
        'DATA_READ', 'DATA_WRITE', 'DATA_DELETE',
        'PERMISSION_DENIED', 'PORTAL_ACCESS',
        'STUDENT_LINK', 'STUDENT_UNLINK'
    )),
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "admin_read_audit" ON audit_logs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Anyone can insert audit logs (for logging their own actions)
CREATE POLICY "all_insert_audit" ON audit_logs
FOR INSERT WITH CHECK (true);

-- IMMUTABILITY: Prevent updates and deletes
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS audit_no_delete ON audit_logs;
CREATE TRIGGER audit_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- 7. ATTENDANCE TABLE (with RLS)
-- ============================================================
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Students see their own attendance
CREATE POLICY "student_view_own_attendance" ON attendance
FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = attendance.student_id AND s.user_id = auth.uid())
);

-- Parents see linked children's attendance
CREATE POLICY "parent_view_child_attendance" ON attendance
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM parent_student_links psl
        JOIN parents p ON psl.parent_id = p.id
        WHERE p.user_id = auth.uid()
        AND psl.student_id = attendance.student_id
    )
);

-- Teachers can view/mark attendance for assigned classes
CREATE POLICY "teacher_manage_attendance" ON attendance
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN teachers t ON t.user_id = u.id
        JOIN students s ON s.id = attendance.student_id
        WHERE u.id = auth.uid() 
        AND u.role = 'teacher'
        AND s.class = ANY(t.classes)
    )
);

-- Admin full access
CREATE POLICY "admin_full_attendance" ON attendance
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 8. MARKS/GRADES TABLE (with RLS)
-- ============================================================
DROP TABLE IF EXISTS marks CASCADE;
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    marks_obtained NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
    grade TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Students see their own marks
CREATE POLICY "student_view_own_marks" ON marks
FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = marks.student_id AND s.user_id = auth.uid())
);

-- Parents see linked children's marks
CREATE POLICY "parent_view_child_marks" ON marks
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM parent_student_links psl
        JOIN parents p ON psl.parent_id = p.id
        WHERE p.user_id = auth.uid()
        AND psl.student_id = marks.student_id
    )
);

-- Teachers can manage marks for assigned classes
CREATE POLICY "teacher_manage_marks" ON marks
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN teachers t ON t.user_id = u.id
        JOIN students s ON s.id = marks.student_id
        WHERE u.id = auth.uid() 
        AND u.role = 'teacher'
        AND s.class = ANY(t.classes)
    )
);

-- Admin full access
CREATE POLICY "admin_full_marks" ON marks
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 9. HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get students linked to current parent
CREATE OR REPLACE FUNCTION get_my_linked_students()
RETURNS SETOF UUID AS $$
    SELECT psl.student_id 
    FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    WHERE p.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class, section);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_psl_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_psl_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
-- Run this script in Supabase SQL Editor
-- Then configure Auth settings in Supabase Dashboard
