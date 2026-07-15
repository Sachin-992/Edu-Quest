-- RUN THESE ONE BY ONE AND SHARE THE RESULTS

-- 1. Check total periods count
SELECT COUNT(*) as total_periods FROM timetable_periods;

-- 2. Check if ANY periods exist with their teacher_id
SELECT tp.id, tp.teacher_id, tp.subject, tp.day_of_week, tp.period_number
FROM timetable_periods tp
LIMIT 10;

-- 3. Check all teachers
SELECT id, name FROM teachers;

-- 4. The logged-in teacher - check their ID
SELECT t.id as teacher_id, t.name, t.email, u.id as user_id
FROM teachers t
JOIN users u ON u.id = t.user_id;
