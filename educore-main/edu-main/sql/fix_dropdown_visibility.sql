-- FIX DROPDOWN DATA VISIBILITY
-- Ensure Admin + Authenticated users can READ Subjects and Teachers for dropdowns.

-- 1. FIX SUBJECTS READ POLICY
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_read_admin" ON subjects;
CREATE POLICY "subjects_read_admin" ON subjects FOR ALL USING (is_admin());

-- Allow ALL authenticated users (Teachers/Students) to see subjects 
-- (Strictly speaking, students only need their class, but for dropdowns/consistency, generic read is often safer if filtered by UI)
-- However, strict requirements say "Student View Own". 
-- But TEACHERS assigning things need to see them.
-- And ADMINS need to see them.
DROP POLICY IF EXISTS "subjects_read_auth" ON subjects;
CREATE POLICY "subjects_read_auth" ON subjects FOR SELECT
USING (
    is_admin() OR is_teacher() OR 
    (is_student() AND class_id IN (
        SELECT c.id FROM classes c 
        JOIN students s ON s.class::text = c.grade_level::text AND s.section = c.section
        WHERE s.user_id = auth.uid()
    ))
);

-- 2. FIX TEACHERS READ POLICY (For the Teacher Dropdown)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_read_admin" ON teachers;
CREATE POLICY "teachers_read_admin" ON teachers FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "teachers_read_general" ON teachers;
CREATE POLICY "teachers_read_general" ON teachers FOR SELECT
USING (auth.role() = 'authenticated'); -- Needed so Students can see teacher names in Timetable

-- 3. FIX CLASSES READ POLICY (For Class Dropdown)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_read_all_auth" ON classes;
CREATE POLICY "classes_read_all_auth" ON classes FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. VERIFY DATA EXISTS (Just in case)
SELECT 'Subjects Count' as entity, count(*) FROM subjects
UNION ALL
SELECT 'Teachers Count', count(*) FROM teachers;
