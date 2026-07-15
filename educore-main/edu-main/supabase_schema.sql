-- ============================================
-- EDUCORE-OMEGA: Production Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (central identity)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- For demo, can use Supabase Auth instead
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'PROFESSIONAL')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_no INTEGER NOT NULL,
    admission_number TEXT UNIQUE,
    fee_status TEXT DEFAULT 'pending' CHECK (fee_status IN ('paid', 'pending', 'overdue')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    classes TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'leave', 'resigned')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-Student Links (Many-to-Many)
CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'guardian',
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES users(id),
    UNIQUE(parent_id, student_id)
);

-- ============================================
-- ACADEMIC TABLES
-- ============================================

-- Classes/Sections
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    class_teacher_id UUID REFERENCES teachers(id),
    UNIQUE(name, section, academic_year)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    class_id UUID REFERENCES classes(id),
    teacher_id UUID REFERENCES teachers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Marks/Grades
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL,
    grade TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES teachers(id),
    class_id UUID REFERENCES classes(id),
    due_date DATE,
    max_marks INTEGER DEFAULT 100,
    type TEXT CHECK (type IN ('Homework', 'Project', 'Exam')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remarks (Teacher notes on students)
CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    type TEXT CHECK (type IN ('academic', 'behavior', 'counselling')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FINANCE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS fee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    paid NUMERIC(10,2) DEFAULT 0,
    due NUMERIC(10,2) GENERATED ALWAYS AS (amount - paid) STORED,
    status TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN paid >= amount THEN 'paid'
            WHEN paid > 0 THEN 'partial'
            ELSE 'pending'
        END
    ) STORED,
    due_date DATE,
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FILE STORAGE METADATA
-- ============================================

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    owner_id UUID REFERENCES users(id),
    owner_role TEXT,
    assigned_to_class TEXT,
    assigned_to_student UUID REFERENCES students(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- IMMUTABLE AUDIT LOG (CRITICAL)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT DEFAULT '0.0.0.0',
    session_id TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER audit_logs_immutable_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- ============================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- For demo purposes, allow all operations (configure properly in production)
-- In production, use auth.uid() and auth.jwt() for role-based access

CREATE POLICY "Allow all for demo" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON students FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON parents FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON parent_student_links FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON marks FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON remarks FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON files FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON audit_logs FOR ALL USING (true);

-- ============================================
-- SEED DATA (Demo Accounts)
-- ============================================

INSERT INTO users (id, name, email, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Demo Admin', 'admin@educore.local', 'ADMIN'),
    ('00000000-0000-0000-0000-000000000002', 'Demo Teacher', 'teacher@educore.local', 'TEACHER'),
    ('00000000-0000-0000-0000-000000000003', 'Demo Student', 'student@educore.local', 'STUDENT'),
    ('00000000-0000-0000-0000-000000000004', 'Demo Parent', 'parent@educore.local', 'PARENT')
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (id, user_id, name, class, section, roll_no, admission_number) VALUES
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 'Demo Student', '6', 'A', 1, 'ADM2026001')
ON CONFLICT (admission_number) DO NOTHING;

INSERT INTO teachers (id, user_id, name, subject, classes, experience_years) VALUES
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000002', 'Demo Teacher', 'Mathematics', ARRAY['6-A', '7-A'], 5)
ON CONFLICT DO NOTHING;

INSERT INTO parents (id, user_id, name, phone) VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000004', 'Demo Parent', '+91-9876543210')
ON CONFLICT DO NOTHING;

INSERT INTO parent_student_links (parent_id, student_id, relationship, linked_by) VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'parent', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
SELECT 'EDUCORE-OMEGA Schema Created Successfully!' as status;
