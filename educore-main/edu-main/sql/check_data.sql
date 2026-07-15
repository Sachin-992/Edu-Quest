-- check_data.sql
-- Check Classes
SELECT id, grade_level, section, status FROM classes ORDER BY grade_level, section;

-- Check Student Class
SELECT s.name, c.grade_level, c.section, c.id as class_id 
FROM students s 
JOIN classes c ON s.class = c.grade_level AND s.section = c.section
WHERE s.name ilike '%balan%';

-- Check Timetable Counts per Class
SELECT t.class_id, c.grade_level, c.section, COUNT(*) as periods
FROM timetable_periods t
JOIN classes c ON t.class_id = c.id
GROUP BY t.class_id, c.grade_level, c.section;
