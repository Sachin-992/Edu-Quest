-- ═══════════════════════════════════════════════════════════════════════════════
-- EMERGENCY UNBLOCK: MAKE PERIODS VISIBLE (TEMPORARY)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Reset Policies to "Authenticated Read" (Open for all logged-in users)
-- This confirms if the issue is the specific "Teacher Check" logic or RLS entirely.

ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teacher view own periods" ON timetable_periods;
DROP POLICY IF EXISTS "timetable_periods_teacher_select" ON timetable_periods;

-- ALLOW ALL AUTHENTICATED USERS TO VIEW PERIODS (Temporary Fix)
CREATE POLICY "Authenticated View All" ON timetable_periods
    FOR SELECT USING (auth.role() = 'authenticated');


-- 2. Ensure Timetables are also open
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetables_teacher_select" ON timetables;
CREATE POLICY "Authenticated View All Timetables" ON timetables
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Verify IDs just in case
SELECT t.id as teacher_id, u.auth_id
FROM teachers t
JOIN users u ON u.id = t.user_id
WHERE t.email = 'devi11@gmail.com';

SELECT '✓ RLS set to OPEN (Authenticated Only). Please Refresh.' as status;
