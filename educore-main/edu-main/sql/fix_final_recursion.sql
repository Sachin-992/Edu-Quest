-- FIX INFINITE RECURSION IN RLS POLICIES
-- Problem: 'subjects' policy queries 'subject_teacher_assignments', which queries 'subjects'.
-- Solution: Use SECURITY DEFINER functions to bypass RLS in the subquery.

-- 1. Helper Function: Get Subjects for a Student (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_allowed_subjects_for_student(user_uid UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT s.id
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    JOIN students stu ON stu.class::text = c.grade_level::text AND stu.section = c.section
    WHERE stu.user_id = user_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <--- MAGIC: Bypasses RLS recursion

-- 2. Helper Function: Get Subjects for a Teacher (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_assigned_subjects_for_teacher(user_uid UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT sta.subject_id
    FROM subject_teacher_assignments sta
    JOIN teachers t ON sta.teacher_id = t.id
    WHERE t.user_id = user_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- 3. Update Policy on `subject_teacher_assignments` (Break cycle from this side)
ALTER TABLE subject_teacher_assignments DISABLE ROW LEVEL SECURITY; -- Temp disable/enable to ensure fresh start
ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assign_student_view" ON subject_teacher_assignments;
CREATE POLICY "assign_student_view" ON subject_teacher_assignments FOR SELECT
USING (
    is_student() AND 
    subject_id IN ( SELECT get_allowed_subjects_for_student(auth.uid()) )
);

-- 4. Update Policy on `subjects` (Break cycle from other side too, just in case)
DROP POLICY IF EXISTS "subjects_teacher_assigned" ON subjects;
CREATE POLICY "subjects_teacher_assigned" ON subjects FOR SELECT
USING (
    is_teacher() AND 
    id IN ( SELECT get_assigned_subjects_for_teacher(auth.uid()) )
);

-- 5. Ensure Admin Policies are clean
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "assign_admin_all" ON subject_teacher_assignments;
CREATE POLICY "assign_admin_all" ON subject_teacher_assignments FOR ALL USING (is_admin());
