-- ==============================================================================
-- FIX: Missing Helper Functions for RLS (With Cascade & Restore)
-- ==============================================================================

-- 1. Helper to get Class IDs for the current teacher
DROP FUNCTION IF EXISTS get_my_assigned_class_ids() CASCADE;
CREATE OR REPLACE FUNCTION get_my_assigned_class_ids()
RETURNS SETOF UUID AS $$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Resolve Teacher ID from current auth user
    v_teacher_id := get_my_teacher_id();
    
    IF v_teacher_id IS NULL THEN
        RETURN;
    END IF;

    -- 1. Get classes via Subject Assignments
    RETURN QUERY
    SELECT s.class_id
    FROM subject_teacher_assignments sta
    JOIN subjects s ON s.id = sta.subject_id
    WHERE sta.teacher_id = v_teacher_id;

    -- 2. Get classes via Direct Class Assignments (Class Teacher)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'class_teacher_assignments') THEN
        RETURN QUERY EXECUTE 'SELECT class_id FROM class_teacher_assignments WHERE teacher_id = $1' USING v_teacher_id;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper for Parents (Cascading Drop to handle dependencies)
DROP FUNCTION IF EXISTS get_linked_classes() CASCADE;
CREATE OR REPLACE FUNCTION get_linked_classes()
RETURNS TABLE (grade_level TEXT, section TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT c.grade_level, c.section
    FROM classes c
    JOIN students s ON s.class = c.grade_level AND s.section = c.section
    JOIN parent_student_links psl ON psl.student_id = s.id
    JOIN parents p ON p.id = psl.parent_id
    WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- RESTORE DROPPED POLICIES (Lost due to CASCADE)
-- ==============================================================================

-- Restore "timetables_parent_select"
-- Depends on: get_linked_classes()
DROP POLICY IF EXISTS "timetables_parent_select" ON timetables;
CREATE POLICY "timetables_parent_select" ON timetables
    FOR SELECT USING (
        is_parent() AND status = 'published' AND
        (class, section) IN (SELECT * FROM get_linked_classes())
    );

-- Restore "periods_parent_select"
-- Depends on: get_linked_classes()
DROP POLICY IF EXISTS "periods_parent_select" ON timetable_periods;
CREATE POLICY "periods_parent_select" ON timetable_periods
    FOR SELECT USING (
        is_parent() AND
        timetable_id IN (
            SELECT id FROM timetables 
            WHERE status = 'published' AND
            (class, section) IN (SELECT * FROM get_linked_classes())
        )
    );

-- Restore "notices_parent_view" (If it existed in governance RLS)
-- Depends on: get_linked_classes()
DROP POLICY IF EXISTS "notices_parent_view" ON notices;
CREATE POLICY "notices_parent_view" ON notices FOR SELECT
USING (
    is_parent() AND
    (class_id IS NULL OR class_id IN (SELECT id FROM classes WHERE (grade_level, section) IN (SELECT * FROM get_linked_classes())))
);

-- Restore "homework_parent_view" (If it existed in governance RLS)
-- Depends on: get_linked_classes()
DROP POLICY IF EXISTS "homework_parent_view" ON daily_homework;
CREATE POLICY "homework_parent_view" ON daily_homework FOR SELECT
USING (
    is_parent() AND
    class_id IN (SELECT id FROM classes WHERE (grade_level, section) IN (SELECT * FROM get_linked_classes()))
);
