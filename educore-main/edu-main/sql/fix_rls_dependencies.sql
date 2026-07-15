-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX RLS DEPENDENCIES (CRITICAL)
-- ═══════════════════════════════════════════════════════════════════════════════
-- The previous RLS failed because valid teachers couldn't "see" themselves
-- in the 'teachers' or 'users' table to prove their identity.

-- 1. Unblock 'teachers' table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_read_access" ON teachers;
-- Allow any authenticated user to read teacher profiles (needed for the join check)
CREATE POLICY "teachers_read_access" ON teachers
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Unblock 'users' table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_access" ON users;
-- Allow reading own user record or generally open for auth check (safe for basic profile)
CREATE POLICY "users_read_access" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Re-apply the main policy (Corrected)
DROP POLICY IF EXISTS "Teacher view own periods" ON timetable_periods;
CREATE POLICY "Teacher view own periods" ON timetable_periods
    FOR SELECT USING (
        -- Now this subquery will actually return data!
        EXISTS (
            SELECT 1 FROM teachers t
            JOIN users u ON u.id = t.user_id
            WHERE t.id = timetable_periods.teacher_id
            AND u.auth_id = auth.uid()
        )
        OR 
        -- Admin Access
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_id = auth.uid() 
            AND u.role IN ('admin')
        )
    );

SELECT '✓ RLS Dependencies Fixed. NOW it should work.' as status;
