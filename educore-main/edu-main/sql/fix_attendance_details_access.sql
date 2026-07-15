-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX ATTENDANCE DETAILS ACCESS
-- ═══════════════════════════════════════════════════════════════════════════════
-- The attendance_summary view works because it uses SECURITY DEFINER.
-- For detailed records, we need either:
-- Option 1: Fix the RLS policy (already done but may not be applied)
-- Option 2: Create a SECURITY DEFINER function to fetch records

-- OPTION 1: Re-apply the RLS policy for students (in case it wasn't applied)
DROP POLICY IF EXISTS "Student view own attendance" ON attendance_periods;
CREATE POLICY "Student view own attendance" ON attendance_periods
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.auth_id = auth.uid()
        )
    );

-- OPTION 2: Create a function that students can call (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_attendance_details()
RETURNS TABLE (
    id UUID,
    student_id UUID,
    attendance_date DATE,
    status TEXT,
    marked_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
    v_student_id UUID;
BEGIN
    -- Get the current user's role and student_id
    SELECT u.role INTO v_user_role FROM users u WHERE u.auth_id = auth.uid();
    
    -- For students, get their student_id
    IF v_user_role = 'student' THEN
        SELECT s.id INTO v_student_id FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.auth_id = auth.uid();
        
        RETURN QUERY
        SELECT ap.id, ap.student_id, ap.attendance_date, ap.status::TEXT, ap.marked_at
        FROM attendance_periods ap
        WHERE ap.student_id = v_student_id
        ORDER BY ap.attendance_date DESC;
    END IF;
    
    -- For parents, get their linked children's records
    IF v_user_role = 'parent' THEN
        RETURN QUERY
        SELECT ap.id, ap.student_id, ap.attendance_date, ap.status::TEXT, ap.marked_at
        FROM attendance_periods ap
        WHERE ap.student_id IN (
            SELECT psl.student_id 
            FROM parent_student_links psl
            JOIN parents p ON p.id = psl.parent_id
            JOIN users u ON u.id = p.user_id
            WHERE u.auth_id = auth.uid()
        )
        ORDER BY ap.attendance_date DESC;
    END IF;
    
    -- For teachers/admins, return all (they can use direct queries)
    IF v_user_role IN ('teacher', 'admin') THEN
        RETURN QUERY
        SELECT ap.id, ap.student_id, ap.attendance_date, ap.status::TEXT, ap.marked_at
        FROM attendance_periods ap
        ORDER BY ap.attendance_date DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_my_attendance_details() TO authenticated;

SELECT '✓ Attendance Details Function Created' as status;
