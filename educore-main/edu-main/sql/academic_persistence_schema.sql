-- ═══════════════════════════════════════════════════════════════════════════════
-- DEPLOY: ACADEMIC PERSISTENCE (Attendance, Marks, Remarks)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID, -- Can be NULL or reference users/teachers
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_attendance UNIQUE (student_id, date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 2. MARKS TABLE
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL, -- Storing name for now as per frontend, ideally subject_id
    exam_type TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL,
    grade TEXT,
    entered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- 3. REMARKS TABLE
CREATE TABLE IF NOT EXISTS remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id), -- Optional link to teacher profile
    type TEXT NOT NULL CHECK (type IN ('academic', 'behavior', 'counselling')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- ATTENDANCE POLICIES
DROP POLICY IF EXISTS "attendance_admin_all" ON attendance;
CREATE POLICY "attendance_admin_all" ON attendance FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "attendance_teacher_all" ON attendance;
CREATE POLICY "attendance_teacher_all" ON attendance FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "attendance_student_view" ON attendance;
CREATE POLICY "attendance_student_view" ON attendance FOR SELECT 
    USING (student_id IN (SELECT get_my_student_id()));

-- MARKS POLICIES
DROP POLICY IF EXISTS "marks_admin_all" ON marks;
CREATE POLICY "marks_admin_all" ON marks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "marks_teacher_all" ON marks;
CREATE POLICY "marks_teacher_all" ON marks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "marks_student_view" ON marks;
CREATE POLICY "marks_student_view" ON marks FOR SELECT 
    USING (student_id IN (SELECT get_my_student_id()));

-- REMARKS POLICIES
DROP POLICY IF EXISTS "remarks_admin_all" ON remarks;
CREATE POLICY "remarks_admin_all" ON remarks FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "remarks_teacher_all" ON remarks;
CREATE POLICY "remarks_teacher_all" ON remarks FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "remarks_student_view" ON remarks;
CREATE POLICY "remarks_student_view" ON remarks FOR SELECT 
    USING (student_id IN (SELECT get_my_student_id()));

-- 5. ANALYTICS HELPER INDEXES
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_remarks_student ON remarks(student_id);
