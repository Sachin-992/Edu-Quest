-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETE DIAGNOSIS AND FIX FOR TEACHER PERIODS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Check if timetable_periods has data
SELECT COUNT(*) as total_periods FROM timetable_periods;

-- 2. Check timetable_periods with teacher names
SELECT 
    tp.id,
    tp.teacher_id,
    t.name as teacher_name,
    tp.subject,
    tp.day_of_week,
    tp.period_number
FROM timetable_periods tp
LEFT JOIN teachers t ON t.id = tp.teacher_id
LIMIT 20;

-- 3. If no periods exist, let's check the admin UI saved them correctly
-- Check all timetables and their class_id
SELECT id, class_id, academic_year, status FROM timetables;

-- 4. Get teacher info to match with current login
SELECT id, name, email, user_id FROM teachers;

-- 5. Check users table to understand the link
SELECT id, email, role FROM users WHERE role = 'teacher' OR role = 'admin';

-- 6. CRITICAL: If timetable_periods.teacher_id has NULL values, this is the problem
SELECT * FROM timetable_periods WHERE teacher_id IS NULL;

-- 7. Check if there's a mismatch - periods might store teacher name as text
-- First, let's see the actual column types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'timetable_periods';
