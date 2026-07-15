-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: ATTENDANCE AUDIT TRIGGER
-- ISSUE: Original trigger only logged INSERT. We need to log UPDATEs too.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_log_attendance()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_details TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'ATTENDANCE_MARK';
        v_details := format('Status=%s Date=%s', NEW.status, NEW.attendance_date);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'ATTENDANCE_UPDATE';
        v_details := format('Updated Status: %s -> %s', OLD.status, NEW.status);
    END IF;

    INSERT INTO audit_logs (
        actor_id, actor_role, action, entity, entity_id, details, severity
    ) VALUES (
        NEW.marked_by::TEXT,
        'teacher', -- Assumes teacher/admin based on logic, marked_by is ID
        v_action,
        'attendance_periods',
        NEW.id::TEXT,
        v_details,
        'info'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_attendance ON attendance_periods;
CREATE TRIGGER trg_log_attendance
    AFTER INSERT OR UPDATE ON attendance_periods
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_attendance();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION OF FILE DOWNLOAD PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure policy allows student download of their class files
DROP POLICY IF EXISTS "files_student_select" ON academic_files;
CREATE POLICY "files_student_select" ON academic_files
    FOR SELECT USING (
        is_student() AND (
            (class, section) IN (SELECT * FROM get_my_class_section())
            OR
            assigned_to_student = get_my_student_id()
        )
    );
