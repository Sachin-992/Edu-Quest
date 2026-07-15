-- ═══════════════════════════════════════════════════════════════════════════════
-- DYNAMIC ATTENDANCE SUMMARY VIEW
-- ═══════════════════════════════════════════════════════════════════════════════
-- This view ensures that the Dashboard stats (Percentage, Days Present) 
-- automatically update whenever a teacher marks attendance.

-- 1. robustly drop existing object (Table or View) to avoid type errors
DO $$ 
BEGIN 
  -- Check if it's a table and drop
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'attendance_summary') THEN
    DROP TABLE public.attendance_summary CASCADE;
  END IF;
  
  -- Check if it's a view and drop
  IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'attendance_summary') THEN
    DROP VIEW public.attendance_summary CASCADE;
  END IF;
END $$;

-- 2. Create the Dynamic View
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    student_id,
    -- Count unique days where attendance was logged for this student
    COUNT(DISTINCT attendance_date) as total_periods, 
    -- Count unique days where status was 'present'
    COUNT(DISTINCT CASE WHEN status = 'present' THEN attendance_date END) as attended_periods
FROM attendance_periods
GROUP BY student_id;

-- 3. Grant Access Permissions
GRANT SELECT ON attendance_summary TO authenticated;
GRANT SELECT ON attendance_summary TO anon;

SELECT '✓ Attendance View Created Successfully' as status;
