-- FIX TIMETABLE PERIODS RLS
-- RLS was enabled but policies might be missing or restrictive.

-- 1. Reset Policies
DROP POLICY IF EXISTS "periods_admin_all" ON timetable_periods;
CREATE POLICY "periods_admin_all" ON timetable_periods FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "periods_view_authenticated" ON timetable_periods;
CREATE POLICY "periods_view_authenticated" ON timetable_periods FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Verify Timetables (Parent Table) just in case
DROP POLICY IF EXISTS "timetables_admin_all" ON timetables;
CREATE POLICY "timetables_admin_all" ON timetables FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "timetables_view_authenticated" ON timetables;
CREATE POLICY "timetables_view_authenticated" ON timetables FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Success Check
SELECT 'Policies Applied' as status;
