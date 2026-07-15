-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX RLS POLICIES FOR TEACHER ACCESS (FINAL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Enable RLS on timetable_periods (just in case)
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "timetable_periods_teacher_select" ON timetable_periods;
DROP POLICY IF EXISTS "Teacher view own periods" ON timetable_periods;
DROP POLICY IF EXISTS "Public view" ON timetable_periods;

-- 3. Create a SIMPLE, direct policy for teachers
-- "If I am a teacher, show me periods where teacher_id is My Teacher ID"
CREATE POLICY "Teacher view own periods" ON timetable_periods
    FOR SELECT USING (
        -- Option A: Direct link to user_id (if your teacher record has your user_id)
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = timetable_periods.teacher_id
            AND t.user_id = auth.uid()
        )
        OR 
        -- Option B: Admin override
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_id = auth.uid() 
            AND u.role IN ('admin')
        )
    );

-- 4. ALSO allow viewing if there is NO specific restriction (Fallback)
-- Sometimes complexity breaks things. Let's verify if we need to be open for debug.
-- UNCOMMENT ONLY IF ABOVE FAILS:
-- CREATE POLICY "Debug Open Access" ON timetable_periods FOR SELECT USING (true);

-- 5. Fix Timetables access as well (since we join on it)
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetables_teacher_select" ON timetables;
CREATE POLICY "timetables_teacher_select" ON timetables
    FOR SELECT USING (true); -- Timetables are general info, safe to read

-- 6. Verify Linkage Again
SELECT 
    t.name, 
    t.id as teacher_id, 
    t.user_id as app_user_id,
    u.auth_id as auth_system_id
FROM teachers t
JOIN users u ON u.id = t.user_id
WHERE t.email = 'devi11@gmail.com';

SELECT '✓ RLS Policies Updated. Try Refreshing.' as status;
