-- ═══════════════════════════════════════════════════════════════════════════════
-- CHECK TIMETABLE SCHEMA AND TEACHER PERIODS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Check actual timetables table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'timetables';

-- 2. Check timetable_periods table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'timetable_periods';

-- 3. Check current timetable_periods with teacher info
SELECT 
    tp.id as period_id,
    tp.teacher_id,
    t.name as teacher_name,
    tp.subject,
    tp.day_of_week,
    tp.period_number
FROM timetable_periods tp
LEFT JOIN teachers t ON t.id = tp.teacher_id
LIMIT 20;

-- 4. Check all teachers
SELECT id, name, email, user_id FROM teachers;

-- 5. Check timetables
SELECT * FROM timetables LIMIT 10;
