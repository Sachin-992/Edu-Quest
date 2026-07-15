CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    gender TEXT,
    date_of_birth DATE,
    blood_group TEXT,
    nationality TEXT DEFAULT 'Indian',
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    admission_number TEXT UNIQUE,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_no INTEGER NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    stream TEXT,
    enrollment_status TEXT DEFAULT 'active',
    parent_name TEXT,
    parent_contact TEXT,
    parent_email TEXT,
    medical_notes TEXT,
    emergency_contact TEXT,
    academic_achievements JSONB DEFAULT '[]'::jsonb,
    co_curricular_achievements JSONB DEFAULT '[]'::jsonb,
    extra_curricular_achievements JSONB DEFAULT '[]'::jsonb,
    fee_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'active',
    aadhaar_encrypted TEXT,
    aadhaar_last4 TEXT,
    aadhaar_verified BOOLEAN DEFAULT false,
    aadhaar_updated_at TIMESTAMPTZ,
    aadhaar_updated_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    gender TEXT,
    date_of_birth DATE,
    blood_group TEXT,
    nationality TEXT DEFAULT 'Indian',
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT NOT NULL,
    employee_id TEXT UNIQUE,
    designation TEXT DEFAULT 'Teacher',
    department TEXT,
    subject TEXT NOT NULL,
    subjects_assigned TEXT[] DEFAULT ARRAY[]::TEXT[],
    classes TEXT[] DEFAULT ARRAY[]::TEXT[],
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    employment_status TEXT DEFAULT 'active',
    academic_achievements JSONB DEFAULT '[]'::jsonb,
    research_publications JSONB DEFAULT '[]'::jsonb,
    awards JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    aadhaar_encrypted TEXT,
    aadhaar_last4 TEXT,
    aadhaar_verified BOOLEAN DEFAULT false,
    aadhaar_updated_at TIMESTAMPTZ,
    aadhaar_updated_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'parent',
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

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

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    class TEXT NOT NULL,
    due_date DATE NOT NULL,
    max_marks NUMERIC(5,2) DEFAULT 100,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    class TEXT NOT NULL,
    fee_type TEXT DEFAULT 'tuition',
    amount NUMERIC(10,2) NOT NULL,
    paid NUMERIC(10,2) DEFAULT 0,
    due_date DATE NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_record_id UUID NOT NULL REFERENCES fee_records(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    transaction_id TEXT,
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_type TEXT,
    size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    visibility TEXT DEFAULT 'assigned',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    severity TEXT DEFAULT 'info'
);

CREATE TABLE IF NOT EXISTS aadhaar_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_name TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class, section);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION prevent_audit_update() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Audit updates forbidden'; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_audit_delete() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Audit deletions forbidden'; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

DROP TRIGGER IF EXISTS audit_no_delete ON audit_logs;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aadhaar_access_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'teacher');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_student_ids() RETURNS SETOF UUID AS $$
    SELECT psl.student_id FROM parent_student_links psl
    JOIN parents p ON p.id = psl.parent_id
    JOIN users u ON u.id = p.user_id WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_student_id() RETURNS UUID AS $$
    SELECT s.id FROM students s JOIN users u ON u.id = s.user_id WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_read_self" ON users;
CREATE POLICY "users_admin_all" ON users FOR ALL USING (is_admin());
CREATE POLICY "users_read_self" ON users FOR SELECT USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "students_admin_all" ON students;
DROP POLICY IF EXISTS "students_teacher_read" ON students;
DROP POLICY IF EXISTS "students_parent_read" ON students;
DROP POLICY IF EXISTS "students_self_read" ON students;
CREATE POLICY "students_admin_all" ON students FOR ALL USING (is_admin());
CREATE POLICY "students_teacher_read" ON students FOR SELECT USING (is_teacher());
CREATE POLICY "students_parent_read" ON students FOR SELECT USING (id IN (SELECT get_my_student_ids()));
CREATE POLICY "students_self_read" ON students FOR SELECT USING (id = get_my_student_id());

DROP POLICY IF EXISTS "teachers_admin_all" ON teachers;
DROP POLICY IF EXISTS "teachers_self_read" ON teachers;
CREATE POLICY "teachers_admin_all" ON teachers FOR ALL USING (is_admin());
CREATE POLICY "teachers_self_read" ON teachers FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "parents_admin_all" ON parents;
DROP POLICY IF EXISTS "parents_self_read" ON parents;
CREATE POLICY "parents_admin_all" ON parents FOR ALL USING (is_admin());
CREATE POLICY "parents_self_read" ON parents FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "psl_admin_all" ON parent_student_links;
DROP POLICY IF EXISTS "psl_parent_read" ON parent_student_links;
CREATE POLICY "psl_admin_all" ON parent_student_links FOR ALL USING (is_admin());
CREATE POLICY "psl_parent_read" ON parent_student_links FOR SELECT USING (parent_id IN (SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.auth_id = auth.uid()));

DROP POLICY IF EXISTS "classes_admin_all" ON classes;
DROP POLICY IF EXISTS "classes_read_all" ON classes;
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (is_admin());
CREATE POLICY "classes_read_all" ON classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
DROP POLICY IF EXISTS "subjects_read_all" ON subjects;
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (is_admin());
CREATE POLICY "subjects_read_all" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "attendance_admin_all" ON attendance;
DROP POLICY IF EXISTS "attendance_teacher_all" ON attendance;
DROP POLICY IF EXISTS "attendance_student_read" ON attendance;
DROP POLICY IF EXISTS "attendance_parent_read" ON attendance;
CREATE POLICY "attendance_admin_all" ON attendance FOR ALL USING (is_admin());
CREATE POLICY "attendance_teacher_all" ON attendance FOR ALL USING (is_teacher());
CREATE POLICY "attendance_student_read" ON attendance FOR SELECT USING (student_id = get_my_student_id());
CREATE POLICY "attendance_parent_read" ON attendance FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

DROP POLICY IF EXISTS "marks_admin_all" ON marks;
DROP POLICY IF EXISTS "marks_teacher_all" ON marks;
DROP POLICY IF EXISTS "marks_student_read" ON marks;
DROP POLICY IF EXISTS "marks_parent_read" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());
CREATE POLICY "marks_teacher_all" ON marks FOR ALL USING (is_teacher());
CREATE POLICY "marks_student_read" ON marks FOR SELECT USING (student_id = get_my_student_id());
CREATE POLICY "marks_parent_read" ON marks FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

DROP POLICY IF EXISTS "assignments_admin_all" ON assignments;
DROP POLICY IF EXISTS "assignments_teacher_all" ON assignments;
DROP POLICY IF EXISTS "assignments_read_all" ON assignments;
CREATE POLICY "assignments_admin_all" ON assignments FOR ALL USING (is_admin());
CREATE POLICY "assignments_teacher_all" ON assignments FOR ALL USING (is_teacher());
CREATE POLICY "assignments_read_all" ON assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
DROP POLICY IF EXISTS "remarks_teacher_all" ON remarks;
DROP POLICY IF EXISTS "remarks_parent_read" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL USING (is_admin());
CREATE POLICY "remarks_teacher_all" ON remarks FOR ALL USING (is_teacher());
CREATE POLICY "remarks_parent_read" ON remarks FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

DROP POLICY IF EXISTS "fees_admin_all" ON fee_records;
DROP POLICY IF EXISTS "fees_parent_read" ON fee_records;
CREATE POLICY "fees_admin_all" ON fee_records FOR ALL USING (is_admin());
CREATE POLICY "fees_parent_read" ON fee_records FOR SELECT USING (student_id IN (SELECT get_my_student_ids()));

DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "payments_parent_read" ON payments;
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (is_admin());
CREATE POLICY "payments_parent_read" ON payments FOR SELECT USING (fee_record_id IN (SELECT id FROM fee_records WHERE student_id IN (SELECT get_my_student_ids())));

DROP POLICY IF EXISTS "files_admin_all" ON files;
DROP POLICY IF EXISTS "files_owner" ON files;
CREATE POLICY "files_admin_all" ON files FOR ALL USING (is_admin());
CREATE POLICY "files_owner" ON files FOR ALL USING (owner_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "audit_insert_all" ON audit_logs;
DROP POLICY IF EXISTS "audit_read_admin" ON audit_logs;
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_read_admin" ON audit_logs FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "aadhaar_logs_insert" ON aadhaar_access_logs;
DROP POLICY IF EXISTS "aadhaar_logs_admin_read" ON aadhaar_access_logs;
CREATE POLICY "aadhaar_logs_insert" ON aadhaar_access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "aadhaar_logs_admin_read" ON aadhaar_access_logs FOR SELECT USING (is_admin());

INSERT INTO classes (name, grade_level) VALUES
    ('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4),
    ('Class 5', 5), ('Class 6', 6), ('Class 7', 7), ('Class 8', 8),
    ('Class 9', 9), ('Class 10', 10), ('Class 11', 11), ('Class 12', 12)
ON CONFLICT DO NOTHING;

INSERT INTO subjects (name, code) VALUES
    ('Mathematics', 'MATH'), ('Science', 'SCI'), ('English', 'ENG'),
    ('Hindi', 'HIN'), ('Social Science', 'SST'), ('Computer Science', 'CS')
ON CONFLICT (code) DO NOTHING;

INSERT INTO students (name, class, section, roll_no, admission_number, gender, fee_status, status) VALUES 
    ('Priya Patel', '6', 'A', 1, 'ADM2025001', 'female', 'paid', 'active'),
    ('Arjun Singh', '6', 'A', 2, 'ADM2025002', 'male', 'pending', 'active'),
    ('Zara Khan', '6', 'B', 1, 'ADM2025003', 'female', 'paid', 'active'),
    ('Rohan Gupta', '7', 'A', 1, 'ADM2025004', 'male', 'overdue', 'active'),
    ('Ananya Sharma', '8', 'A', 1, 'ADM2025005', 'female', 'paid', 'active')
ON CONFLICT (admission_number) DO NOTHING;

INSERT INTO teachers (name, email, subject, employee_id, designation, qualification, experience_years) VALUES 
    ('Dr. Ramesh Kumar', 'ramesh@school.edu', 'Mathematics', 'EMP001', 'Senior Teacher', 'Ph.D Mathematics', 15),
    ('Mrs. Priya Sharma', 'priya@school.edu', 'Science', 'EMP002', 'Teacher', 'M.Sc Physics', 8),
    ('Mr. Amit Verma', 'amit@school.edu', 'English', 'EMP003', 'Teacher', 'M.A English', 5)
ON CONFLICT (employee_id) DO NOTHING;
