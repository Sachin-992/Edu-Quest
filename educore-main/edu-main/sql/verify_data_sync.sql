-- ═══════════════════════════════════════════════════════════════════════════════
-- QUICK DATA VERIFICATION
-- Run this AFTER master_data_sync.sql to verify everything is correct
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Teacher Period Access Test
-- This shows what the logged-in teacher should see
SELECT 
    '👨‍🏫 TEACHER PERIODS' as section,
    t.name as teacher_name,
    t.id as teacher_id,
    t.user_id,
    COUNT(tp.id) as periods_assigned
FROM teachers t
LEFT JOIN timetable_periods tp ON tp.teacher_id = t.id
GROUP BY t.id, t.name, t.user_id
ORDER BY t.name;

-- 2. Class-Subject Mapping
SELECT 
    '📚 SUBJECTS PER CLASS' as section,
    c.grade_level || '-' || c.section as class_name,
    COUNT(s.id) as subjects
FROM classes c
LEFT JOIN subjects s ON s.class_id = c.id
GROUP BY c.id, c.grade_level, c.section
ORDER BY c.grade_level, c.section;

-- 3. Student Class Assignment
SELECT 
    '🎓 STUDENTS PER CLASS' as section,
    COALESCE(c.grade_level || '-' || c.section, 'NO CLASS') as class_name,
    COUNT(s.id) as students
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
GROUP BY c.id, c.grade_level, c.section
ORDER BY c.grade_level NULLS LAST, c.section;

-- 4. Academic Resources
SELECT 
    '📁 RESOURCES PER CLASS' as section,
    COALESCE(c.grade_level || '-' || c.section, 'NO CLASS') as class_name,
    COUNT(af.id) as files
FROM academic_files af
LEFT JOIN classes c ON c.id = af.class_id
GROUP BY c.id, c.grade_level, c.section
ORDER BY c.grade_level NULLS LAST;

-- 5. User-Role Distribution
SELECT 
    '👥 USERS BY ROLE' as section,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- 6. CRITICAL: Test specific teacher login flow
-- Replace 'ragu' with the teacher name you're testing
SELECT 
    '🔍 LOGIN FLOW TEST' as section,
    u.id as users_table_id,
    u.email,
    u.role,
    t.id as teacher_id,
    t.name as teacher_name,
    (SELECT COUNT(*) FROM timetable_periods tp WHERE tp.teacher_id = t.id) as periods
FROM users u
JOIN teachers t ON t.user_id = u.id
WHERE u.role = 'teacher';
