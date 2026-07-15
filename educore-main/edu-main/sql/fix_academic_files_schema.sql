-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: ACADEMIC FILES SCHEMA & POLICY
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add missing column 'assigned_to_student' to academic_files
ALTER TABLE academic_files 
ADD COLUMN IF NOT EXISTS assigned_to_student UUID REFERENCES students(id) ON DELETE SET NULL;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_files_assigned_student 
ON academic_files(assigned_to_student);

-- 3. Now apply the Policy that failed previously
DROP POLICY IF EXISTS "files_student_select" ON academic_files;
CREATE POLICY "files_student_select" ON academic_files
    FOR SELECT USING (
        is_student() AND (
            -- Student can see files for their class/section
            (class, section) IN (SELECT * FROM get_my_class_section())
            OR
            -- Student can see files explicitly assigned to them
            assigned_to_student = get_my_student_id()
        )
    );

-- 4. Ensure Teacher policy includes this new column if needed
DROP POLICY IF EXISTS "files_teacher_select" ON academic_files;
CREATE POLICY "files_teacher_select" ON academic_files
    FOR SELECT USING (
        is_teacher() AND (
            uploaded_by = current_user_id() OR
            (class, section, subject) IN (
                SELECT t.class, t.section, tp.subject
                FROM timetable_periods tp
                JOIN timetables t ON t.id = tp.timetable_id
                WHERE tp.teacher_id = get_my_teacher_id()
            ) OR
            -- Allow seeing files they assigned to students?
            -- Broadening slightly to allow teachers to see files where they are the uploader (covered above)
            -- or files for their periods.
            timetable_period_id IN (SELECT get_my_period_ids())
        )
    );
