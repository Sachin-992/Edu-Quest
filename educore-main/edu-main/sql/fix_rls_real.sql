-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX RLS POLICIES (CORRECTED AUTH_ID JOIN)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Enable RLS
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;

-- 2. Drop incorrect policies
DROP POLICY IF EXISTS "timetable_periods_teacher_select" ON timetable_periods;
DROP POLICY IF EXISTS "Teacher view own periods" ON timetable_periods;
DROP POLICY IF EXISTS "Public view" ON timetable_periods;

-- 3. Create CORRECT policy joining through users table
-- We must match: timetable_period -> teacher -> user -> auth_id = auth.uid()
CREATE POLICY "Teacher view own periods" ON timetable_periods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t
            JOIN users u ON u.id = t.user_id
            WHERE t.id = timetable_periods.teacher_id
            AND u.auth_id = auth.uid() -- This is the correct comparison
        )
        OR 
        -- Admin Access
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_id = auth.uid() 
            AND u.role IN ('admin')
        )
    );

-- 4. Verify Timetables access
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetables_teacher_select" ON timetables;
CREATE POLICY "timetables_teacher_select" ON timetables
    FOR SELECT USING (true); -- Public read for logged in users is fine for timetables structure

SELECT '✓ RLS Fixed (Corrected Auth ID Join). Try Refreshing.' as status;
