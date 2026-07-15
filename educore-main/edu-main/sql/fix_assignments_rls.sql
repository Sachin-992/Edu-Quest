-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX ASSIGNMENTS TABLE RLS FOR STUDENT ACCESS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Students need to be able to SELECT assignments for their class

-- 1. Enable RLS on assignments table (if not already)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 2. DROP existing student view policy if any
DROP POLICY IF EXISTS "assignments_student_view" ON assignments;
DROP POLICY IF EXISTS "students_can_view_class_assignments" ON assignments;

-- 3. CREATE policy for students to view assignments for their class
CREATE POLICY "students_can_view_class_assignments" ON assignments
FOR SELECT
USING (
    -- Students can see assignments where:
    -- 1. The assignment's class_id matches the student's class
    EXISTS (
        SELECT 1 FROM classes c
        JOIN students s ON s.class = c.grade_level AND s.section = c.section
        JOIN users u ON u.id = s.user_id
        WHERE u.auth_id = auth.uid()
        AND c.id = assignments.class_id
    )
);

-- 4. CREATE policy for parents to view child's assignments
DROP POLICY IF EXISTS "parents_can_view_child_assignments" ON assignments;
CREATE POLICY "parents_can_view_child_assignments" ON assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM classes c
        JOIN students s ON s.class = c.grade_level AND s.section = c.section
        JOIN parent_student_links psl ON psl.student_id = s.id
        JOIN parents p ON p.id = psl.parent_id
        JOIN users u ON u.id = p.user_id
        WHERE u.auth_id = auth.uid()
        AND c.id = assignments.class_id
    )
);

-- 5. CREATE policy for teachers (already exists, but ensure it)
DROP POLICY IF EXISTS "teachers_can_manage_assignments" ON assignments;
CREATE POLICY "teachers_can_manage_assignments" ON assignments
FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'teacher')
);

-- 6. CREATE policy for admin full access
DROP POLICY IF EXISTS "admin_full_access_assignments" ON assignments;
CREATE POLICY "admin_full_access_assignments" ON assignments
FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- 7. Grant permissions
GRANT SELECT ON assignments TO authenticated;
GRANT ALL ON assignments TO authenticated;

SELECT '✓ Assignments RLS policies created for students, parents, teachers, and admin' as status;
