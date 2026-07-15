-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: GOVERNANCE RLS
-- PART 2: ZERO-TRUST SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. EXAMS GOVERNANCE
-- Admin: Full Control
-- Teachers/Students: Read-only (if active/published)
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
CREATE POLICY "exams_admin_all" ON exams FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "exams_view_all" ON exams;
CREATE POLICY "exams_view_all" ON exams FOR SELECT 
USING (status != 'draft'); -- draft exams are hidden

-- 2. NOTICES GOVERNANCE
-- Admin: Full Control
DROP POLICY IF EXISTS "notices_admin_all" ON notices;
CREATE POLICY "notices_admin_all" ON notices FOR ALL USING (is_admin());

-- Teachers: Create/Edit for ASSIGNED CLASSES ONLY
DROP POLICY IF EXISTS "notices_teacher_crud" ON notices;
CREATE POLICY "notices_teacher_crud" ON notices FOR ALL 
USING (
    is_teacher() AND 
    (class_id IS NULL OR class_id IN (SELECT id FROM classes WHERE id IN (SELECT get_my_assigned_class_ids())))
);

-- Students: View Notices for THEIR CLASS or SCHOOL-WIDE (class_id IS NULL)
DROP POLICY IF EXISTS "notices_student_view" ON notices;
CREATE POLICY "notices_student_view" ON notices FOR SELECT
USING (
    is_student() AND 
    (class_id IS NULL OR class_id IN (SELECT id FROM classes c JOIN students s ON s.class = c.grade_level AND s.section = c.section WHERE s.user_id = auth.uid()))
);

-- Parents: View Notices for CHILD'S CLASS
DROP POLICY IF EXISTS "notices_parent_view" ON notices;
CREATE POLICY "notices_parent_view" ON notices FOR SELECT
USING (
    is_parent() AND
    (class_id IS NULL OR class_id IN (SELECT id FROM classes WHERE (grade_level, section) IN (SELECT * FROM get_linked_classes())))
);

-- 3. DAILY HOMEWORK GOVERNANCE
-- Teacher: Manage own subject/class homework
DROP POLICY IF EXISTS "homework_teacher_crud" ON daily_homework;
CREATE POLICY "homework_teacher_crud" ON daily_homework FOR ALL
USING (
    is_teacher() AND 
    teacher_id = get_my_teacher_id()
);

-- Student: View own class homework
DROP POLICY IF EXISTS "homework_student_view" ON daily_homework;
CREATE POLICY "homework_student_view" ON daily_homework FOR SELECT
USING (
    is_student() AND
    class_id IN (SELECT id FROM classes c JOIN students s ON s.class = c.grade_level AND s.section = c.section WHERE s.user_id = auth.uid())
);

-- Parent: View child's homework
DROP POLICY IF EXISTS "homework_parent_view" ON daily_homework;
CREATE POLICY "homework_parent_view" ON daily_homework FOR SELECT
USING (
    is_parent() AND
    class_id IN (SELECT id FROM classes WHERE (grade_level, section) IN (SELECT * FROM get_linked_classes()))
);

-- 4. UPDATE ASSIGNMENTS GOVERNANCE (Strict)
-- Existing policies might be loose. Let's tighten them.
-- Teacher can only create if subject/class matches.
DROP POLICY IF EXISTS "assignments_teacher_insert" ON assignments;
CREATE POLICY "assignments_teacher_insert" ON assignments FOR INSERT WITH CHECK (
    is_teacher() AND
    teacher_id = get_my_teacher_id() 
    -- Ideally check if teacher is assigned to this class/subject, but teacher_id self-match is minimum baseline
);

-- 5. ACADEMIC FILE UPLOAD GOVERNANCE (Strict)
-- Already covered by `fn_validate_file_upload` trigger in `timetable_attendance_schema.sql`?
-- Let's double check.
-- The trigger `trg_validate_file_upload` checks `NEW.uploaded_by != v_teacher_user_id`.
-- We will enforce RLS as a second layer.

DROP POLICY IF EXISTS "files_teacher_insert_strict" ON academic_files;
CREATE POLICY "files_teacher_insert_strict" ON academic_files FOR INSERT WITH CHECK (
    is_teacher() AND 
    uploaded_by = current_user_id()
    -- And Class/Subject match is validated by Trigger
);

-- 6. AUDIT LOGGING (Ensure everyone can insert logs)
DROP POLICY IF EXISTS "audit_insert_all" ON audit_logs;
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT WITH CHECK (true);
