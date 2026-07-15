-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC: Check Assignments Data and RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Check if assignments table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'assignments'
);

-- 2. Check if any assignments records exist
SELECT 
    id,
    title,
    class_id,
    subject_id,
    teacher_id,
    due_date,
    type,
    created_at
FROM assignments
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check RLS policies on assignments table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'assignments'
ORDER BY policyname;

-- 4. Check if RLS is enabled on assignments
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'assignments';

-- 5. Check classes table to see valid class_ids
SELECT 
    id,
    grade_level,
    section,
    academic_year
FROM classes
LIMIT 10;
