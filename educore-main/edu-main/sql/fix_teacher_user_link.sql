-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX TEACHER-USER LINKAGE AND VERIFY PERIODS
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Check teachers and their user_id
SELECT 
    t.id as teacher_id, 
    t.name as teacher_name, 
    t.email as teacher_email,
    t.user_id,
    u.id as users_table_id,
    u.email as users_email
FROM teachers t
LEFT JOIN users u ON u.id = t.user_id;

-- STEP 2: Check users table for teachers
SELECT id, email, name, role, auth_id FROM users WHERE role = 'teacher';

-- STEP 3: Find missing links (teachers without user_id OR mismatched emails)
SELECT 
    t.id as teacher_id,
    t.name,
    t.email as teacher_email,
    t.user_id,
    u.id as matching_user_id,
    u.email as matching_user_email
FROM teachers t
LEFT JOIN users u ON LOWER(u.email) = LOWER(t.email)
WHERE t.user_id IS NULL OR t.user_id != u.id;

-- =============================================================================
-- FIX: Update teachers.user_id to match users table based on email
-- =============================================================================
UPDATE teachers t
SET user_id = u.id
FROM users u
WHERE LOWER(t.email) = LOWER(u.email)
AND (t.user_id IS NULL OR t.user_id != u.id);

-- STEP 4: Verify the fix
SELECT 
    t.id as teacher_id, 
    t.name, 
    t.user_id,
    u.id as users_id,
    CASE WHEN t.user_id = u.id THEN 'LINKED ✓' ELSE 'NOT LINKED ✗' END as status
FROM teachers t
LEFT JOIN users u ON u.id = t.user_id;

-- STEP 5: Now check if periods match teacher IDs
SELECT 
    'Period Check' as check_type,
    tp.teacher_id,
    t.name as teacher_name,
    t.user_id,
    COUNT(*) as period_count
FROM timetable_periods tp
JOIN teachers t ON t.id = tp.teacher_id
GROUP BY tp.teacher_id, t.name, t.user_id;
