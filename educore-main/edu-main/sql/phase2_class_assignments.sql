-- Phase 2: Class Governance & Assignments
-- FINAL FIX: Resolved UUID/Text mismatch by joining through 'classes' table.

-- 1. Create Assignments Table
CREATE TABLE IF NOT EXISTS class_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    is_primary BOOLEAN DEFAULT FALSE, -- For Class Teacher role
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, subject_id, teacher_id) -- Prevent duplicate assignments
);

-- 2. ENABLE RLS
ALTER TABLE class_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES

-- ADMIN: Full Access
CREATE POLICY "Admin All Access" ON class_teacher_assignments
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- TEACHER: View Own Assignments
CREATE POLICY "Teacher View Own" ON class_teacher_assignments
    FOR SELECT
    USING (
        teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    );

-- STUDENT: View Assignments for their Class
-- Fix: Join students -> classes (via grade_level/section) to get UUID
CREATE POLICY "Student View Class Teachers" ON class_teacher_assignments
    FOR SELECT
    USING (
        class_id IN (
            SELECT c.id
            FROM classes c
            JOIN students s ON s.class::text = c.grade_level::text AND s.section = c.section
            WHERE s.user_id = auth.uid()
        )
    );

-- PARENT: View Assignments for Child's Class
-- Fix: Join students -> classes (via grade_level/section) to get UUID
CREATE POLICY "Parent View Child Teachers" ON class_teacher_assignments
    FOR SELECT
    USING (
        class_id IN (
            SELECT c.id
            FROM classes c
            JOIN students s ON s.class::text = c.grade_level::text AND s.section = c.section
            JOIN parent_student_links psl ON s.id = psl.student_id
            JOIN parents p ON psl.parent_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );
