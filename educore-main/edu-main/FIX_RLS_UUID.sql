-- ============================================================
-- FIX: RLS and UUID Errors (v2 - handles foreign keys)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. DROP FOREIGN KEY CONSTRAINTS first
ALTER TABLE class_teacher_assignments DROP CONSTRAINT IF EXISTS class_teacher_assignments_assigned_by_fkey;
ALTER TABLE subject_teacher_assignments DROP CONSTRAINT IF EXISTS subject_teacher_assignments_assigned_by_fkey;

-- 2. CHANGE assigned_by columns to TEXT
ALTER TABLE class_teacher_assignments ALTER COLUMN assigned_by TYPE TEXT;
ALTER TABLE subject_teacher_assignments ALTER COLUMN assigned_by TYPE TEXT;

-- 3. ADD RLS POLICIES for class_teacher_assignments
ALTER TABLE class_teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_teacher_assignments_admin" ON class_teacher_assignments;
CREATE POLICY "class_teacher_assignments_admin" ON class_teacher_assignments
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "class_teacher_assignments_read" ON class_teacher_assignments;
CREATE POLICY "class_teacher_assignments_read" ON class_teacher_assignments
    FOR SELECT USING (true);

-- 4. ADD RLS POLICIES for subject_teacher_assignments  
ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subject_teacher_assignments_admin" ON subject_teacher_assignments;
CREATE POLICY "subject_teacher_assignments_admin" ON subject_teacher_assignments
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "subject_teacher_assignments_read" ON subject_teacher_assignments;
CREATE POLICY "subject_teacher_assignments_read" ON subject_teacher_assignments
    FOR SELECT USING (true);

-- 5. ADD RLS POLICIES for timetable_periods
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_periods_admin" ON timetable_periods;
CREATE POLICY "timetable_periods_admin" ON timetable_periods
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "timetable_periods_teacher" ON timetable_periods;
CREATE POLICY "timetable_periods_teacher" ON timetable_periods
    FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "timetable_periods_read" ON timetable_periods;
CREATE POLICY "timetable_periods_read" ON timetable_periods
    FOR SELECT USING (true);

-- 6. ADD RLS POLICIES for timetables
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetables_admin" ON timetables;
CREATE POLICY "timetables_admin" ON timetables
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "timetables_teacher" ON timetables;
CREATE POLICY "timetables_teacher" ON timetables
    FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "timetables_read" ON timetables;
CREATE POLICY "timetables_read" ON timetables
    FOR SELECT USING (true);

-- 7. ENSURE exams table has proper RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exams_admin" ON exams;
CREATE POLICY "exams_admin" ON exams
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "exams_teacher" ON exams;
CREATE POLICY "exams_teacher" ON exams
    FOR ALL USING (is_teacher());

DROP POLICY IF EXISTS "exams_read" ON exams;
CREATE POLICY "exams_read" ON exams
    FOR SELECT USING (true);

-- Done!
SELECT 'All fixes applied successfully!' AS status;
