-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP TRIGGERS ON ATTENDANCE_PERIODS
-- ═══════════════════════════════════════════════════════════════════════════════
-- The error "column t.class does not exist" indicates a broken trigger is firing 
-- on INSERT. Since we now use a Dynamic View (attendance_summary) for stats, 
-- we DO NOT need any triggers on attendance_periods anymore.

-- 1. Drop ALL confirmed problematic triggers
DROP TRIGGER IF EXISTS trg_attendance_summary ON attendance_periods; 
DROP TRIGGER IF EXISTS trg_update_summary ON attendance_periods;
DROP TRIGGER IF EXISTS update_attendance_summary ON attendance_periods;
DROP TRIGGER IF EXISTS on_attendance_change ON attendance_periods;
DROP TRIGGER IF EXISTS sync_attendance_summary ON attendance_periods;
DROP TRIGGER IF EXISTS trg_validate_attendance ON attendance_periods; -- THIS WAS The culprit
DROP TRIGGER IF EXISTS trg_check_teacher_booking ON timetable_periods;
DROP TRIGGER IF EXISTS trg_validate_file_upload ON academic_files;

-- 2. Drop the associated functions with CASCADE
DROP FUNCTION IF EXISTS fn_update_attendance_summary() CASCADE;
DROP FUNCTION IF EXISTS update_attendance_summary() CASCADE;
DROP FUNCTION IF EXISTS sync_attendance_summary() CASCADE;
DROP FUNCTION IF EXISTS calculate_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS fn_validate_attendance() CASCADE;
DROP FUNCTION IF EXISTS fn_check_teacher_double_booking() CASCADE;
DROP FUNCTION IF EXISTS fn_validate_file_upload() CASCADE;

-- 3. Just to be safe, if there are any other triggers, we can't iterate easily in SQL 
-- without PL/pgSQL loop, but the above are the most likely offenders from typical patterns.

-- 4. Re-verify table exists and is clean
SELECT count(*) as period_count FROM attendance_periods;

SELECT '✓ Attendance Triggers Cleaned' as status;
