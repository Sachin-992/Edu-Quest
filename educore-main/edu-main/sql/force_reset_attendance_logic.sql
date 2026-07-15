-- ═══════════════════════════════════════════════════════════════════════════════
-- FORCE RESET ATTENDANCE LOGIC
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script aggressively removes any legacy triggers or functions attached 
-- to 'attendance_periods' to clean up "column not found" errors.

-- 1. DROP FUNCTIONS (CASCADE will auto-drop triggers)
DROP FUNCTION IF EXISTS fn_update_attendance_summary() CASCADE;
DROP FUNCTION IF EXISTS update_attendance_summary() CASCADE;
DROP FUNCTION IF EXISTS sync_attendance_summary() CASCADE;
DROP FUNCTION IF EXISTS calculate_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS fn_validate_attendance() CASCADE;
DROP FUNCTION IF EXISTS fn_check_teacher_double_booking() CASCADE;
DROP FUNCTION IF EXISTS fn_validate_file_upload() CASCADE;
DROP FUNCTION IF EXISTS fn_log_attendance() CASCADE; -- Drop audit trigger too just in case

-- 2. EXPLICITLY DROP TRIGGERS (In case CASCADE missed them due to detached ownership)
DROP TRIGGER IF EXISTS trg_attendance_summary ON attendance_periods;
DROP TRIGGER IF EXISTS trg_update_summary ON attendance_periods;
DROP TRIGGER IF EXISTS trg_validate_attendance ON attendance_periods;
DROP TRIGGER IF EXISTS trg_log_attendance ON attendance_periods;
DROP TRIGGER IF EXISTS update_attendance_summary ON attendance_periods;

-- 3. ENSURE ATTENDANCE SUMMARY VIEW EXISTS
-- Drop table if it somehow came back
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'attendance_summary') THEN
    DROP TABLE public.attendance_summary CASCADE;
  END IF;
END $$;

CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    student_id,
    COUNT(DISTINCT attendance_date) as total_periods, 
    COUNT(DISTINCT CASE WHEN status = 'present' THEN attendance_date END) as attended_periods
FROM attendance_periods
GROUP BY student_id;

-- 4. VERIFY CLEAN SLATE
SELECT * FROM information_schema.triggers WHERE event_object_table = 'attendance_periods';

SELECT '✓ Attendance System Reset & Cleaned' as status;
