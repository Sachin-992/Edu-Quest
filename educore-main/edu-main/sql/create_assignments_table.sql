-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE: Assignments Table - SIMPLIFIED VERSION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop table if exists (start fresh)
DROP TABLE IF EXISTS assignments CASCADE;

-- Create assignments table - MINIMAL VERSION
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID,
    subject_id UUID,
    subject_name TEXT,
    teacher_id UUID,
    due_date DATE,
    homework_date DATE DEFAULT CURRENT_DATE,
    max_marks INTEGER DEFAULT 100,
    type TEXT DEFAULT 'Homework',
    submission_mode TEXT DEFAULT 'offline',
    allow_late_submission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "assignments_admin_all" ON assignments FOR ALL 
    USING (is_admin());

-- Teacher: Full CRUD
CREATE POLICY "assignments_teacher_crud" ON assignments FOR ALL
    USING (is_teacher());

-- Student: View all
CREATE POLICY "assignments_student_view" ON assignments FOR SELECT
    USING (is_student());

-- Parent: View all  
CREATE POLICY "assignments_parent_view" ON assignments FOR SELECT
    USING (is_parent());
