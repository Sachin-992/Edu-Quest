-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC: Check Marks Data and Student IDs
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Check if any marks exist in the database
SELECT 
    id,
    student_id,
    subject,
    exam_type,
    marks,
    max_marks,
    entered_by,
    created_at
FROM marks
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check students table to see student IDs
SELECT 
    s.id as student_id,
    s.user_id,
    u.email,
    u.name,
    s.class,
    s.section,
    s.roll_number
FROM students s
JOIN users u ON u.id = s.user_id
WHERE u.email LIKE '%balan%' OR u.name LIKE '%balan%'
ORDER BY u.name;

-- 3. Check what get_my_student_id() returns for a specific user
-- (This needs to be run while logged in as that user, or we can check the function logic)
SELECT 
    s.id as student_id,
    s.user_id,
    u.auth_id,
    u.email,
    u.name
FROM students s
JOIN users u ON u.id = s.user_id
WHERE u.email = 'balan@1a.com';

-- 4. Check if student_id in marks matches student_id in students table
SELECT 
    m.id as mark_id,
    m.student_id as mark_student_id,
    m.subject,
    m.marks,
    s.id as actual_student_id,
    u.email,
    u.name
FROM marks m
LEFT JOIN students s ON s.id = m.student_id
LEFT JOIN users u ON u.id = s.user_id
ORDER BY m.created_at DESC;

-- 5. Check for orphaned marks (marks with student_id that doesn't exist)
SELECT 
    m.*
FROM marks m
WHERE NOT EXISTS (
    SELECT 1 FROM students s WHERE s.id = m.student_id
);
