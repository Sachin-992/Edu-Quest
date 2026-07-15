-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 105 ATTENDANCE INTELLIGENCE
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script updates the check constraints on attendance tables to allow 
-- all 10 status options and rebuilds the attendance summary view with the 
-- education-grade attendance percentage calculations.

-- 1. DYNAMICALLY DROP EXISTING CHECK CONSTRAINTS containing 'status' on attendance tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all check constraints on attendance_periods status column
    FOR r IN (
        SELECT conname 
        FROM pg_constraint con
        JOIN pg_class cl ON con.conrelid = cl.oid
        JOIN pg_namespace nsp ON cl.relnamespace = nsp.oid
        WHERE cl.relname = 'attendance_periods' AND con.contype = 'c' AND con.conname LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE attendance_periods DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;

    -- Drop all check constraints on period_attendance status column
    FOR r IN (
        SELECT conname 
        FROM pg_constraint con
        JOIN pg_class cl ON con.conrelid = cl.oid
        JOIN pg_namespace nsp ON cl.relnamespace = nsp.oid
        WHERE cl.relname = 'period_attendance' AND con.contype = 'c' AND con.conname LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE period_attendance DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. APPLY EXPANDED STATUS CHECK CONSTRAINTS (10 Statuses)
ALTER TABLE attendance_periods ADD CONSTRAINT attendance_periods_status_check 
    CHECK (status IN (
        'present', 'absent', 'late', 'medical_leave', 'on_duty', 
        'half_day', 'excused_leave', 'holiday', 'special_permission', 'transfer_pending'
    ));

ALTER TABLE period_attendance ADD CONSTRAINT period_attendance_status_check 
    CHECK (status IN (
        'present', 'absent', 'late', 'medical_leave', 'on_duty', 
        'half_day', 'excused_leave', 'holiday', 'special_permission', 'transfer_pending'
    ));

-- 3. REBUILD ATTENDANCE_SUMMARY VIEW WITH EDUCATION STATS
-- Calculations:
--   - working_days = present, absent, late, on_duty, half_day, special_permission
--   - present_days = present, late, on_duty, special_permission + (half_day * 0.5)
--   - medical_leave, excused_leave, holiday, and transfer_pending are excluded from working_days
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    student_id,
    COUNT(id) as total_periods,
    
    -- Attendance status aggregates
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN status = 'medical_leave' THEN 1 END) as medical_leave_count,
    COUNT(CASE WHEN status = 'on_duty' THEN 1 END) as on_duty_count,
    COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day_count,
    COUNT(CASE WHEN status = 'excused_leave' THEN 1 END) as excused_leave_count,
    COUNT(CASE WHEN status = 'holiday' THEN 1 END) as holiday_count,
    COUNT(CASE WHEN status = 'special_permission' THEN 1 END) as special_permission_count,
    COUNT(CASE WHEN status = 'transfer_pending' THEN 1 END) as transfer_pending_count,

    -- Custom mapped fields for legacy compatibility
    (
        COUNT(CASE WHEN status IN ('present', 'late', 'on_duty', 'special_permission') THEN 1 END)::NUMERIC +
        (COUNT(CASE WHEN status = 'half_day' THEN 1 END)::NUMERIC * 0.5)
    ) as attended_periods, -- present_days equivalent

    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_periods, -- absent_count equivalent

    COUNT(CASE WHEN status IN ('present', 'absent', 'late', 'on_duty', 'half_day', 'special_permission') THEN 1 END) as working_days,

    CASE 
        WHEN COUNT(CASE WHEN status IN ('present', 'absent', 'late', 'on_duty', 'half_day', 'special_permission') THEN 1 END) > 0 THEN 
            ROUND(
                ((
                    COUNT(CASE WHEN status IN ('present', 'late', 'on_duty', 'special_permission') THEN 1 END)::NUMERIC +
                    (COUNT(CASE WHEN status = 'half_day' THEN 1 END)::NUMERIC * 0.5)
                ) / COUNT(CASE WHEN status IN ('present', 'absent', 'late', 'on_duty', 'half_day', 'special_permission') THEN 1 END)) * 100, 
                1
            )
        ELSE 100.0 -- default if no working days
    END as attendance_percentage
FROM attendance_periods
GROUP BY student_id;

-- 4. GRANT PERMISSIONS
GRANT SELECT ON attendance_summary TO authenticated;
GRANT ALL ON attendance_periods TO authenticated;
GRANT ALL ON period_attendance TO authenticated;

SELECT '✓ Attendance constraints expanded and summary view rebuilt' as status;
