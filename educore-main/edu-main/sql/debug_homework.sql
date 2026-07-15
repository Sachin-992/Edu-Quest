-- Debug why homework isn't showing for students
-- Run this in Supabase SQL Editor

-- 1. Check if there's any homework in daily_homework table
SELECT 'All homework in daily_homework:' as label;
SELECT id, class_id, title, description, homework_date, created_at FROM daily_homework;

-- 2. Check classes table to see what class IDs exist
SELECT 'All classes:' as label;
SELECT id, grade_level, section FROM classes;

-- 3. Check the student balan's class info
SELECT 'Student balan class info:' as label;
SELECT s.id as student_id, s.class, s.section, u.name, u.auth_id
FROM students s
JOIN users u ON u.id = s.user_id
WHERE u.name ILIKE '%balan%';

-- 4. Find the class_id for balan's class
SELECT 'Class ID for balan (Class 1, Section A):' as label;
SELECT c.id as class_uuid, c.grade_level, c.section 
FROM classes c 
WHERE c.grade_level = 'Class 1' AND c.section = 'A';

-- 5. Check if homework exists for balan's class
SELECT 'Homework for Class 1-A:' as label;
SELECT dh.* 
FROM daily_homework dh
JOIN classes c ON c.id = dh.class_id
WHERE c.grade_level = 'Class 1' AND c.section = 'A';

-- 6. Test the RLS policy subquery for balan
-- This simulates what the RLS policy checks
SELECT 'Classes accessible by student via RLS formula:' as label;
SELECT c.id FROM classes c 
JOIN students s ON s.class = c.grade_level AND s.section = c.section 
JOIN users u ON u.id = s.user_id 
WHERE u.name ILIKE '%balan%';
