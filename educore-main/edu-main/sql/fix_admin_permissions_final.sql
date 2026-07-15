-- FINAL PERMS FIX
-- 1. Ensure is_admin() exists and is correct
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user has 'admin' role in public.users
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE auth_id = auth.uid()
        AND role = 'ADMIN' -- Strict role check against schema
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Unlock Timetable Periods
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "periods_full_admin" ON timetable_periods;
CREATE POLICY "periods_full_admin" ON timetable_periods FOR ALL 
USING (is_admin());

DROP POLICY IF EXISTS "periods_view" ON timetable_periods;
CREATE POLICY "periods_view" ON timetable_periods FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Unlock Audit Logs (Crucial for Triggers)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_insert_all" ON audit_logs;
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allow all auth users (teachers/admins) to log events via triggers

DROP POLICY IF EXISTS "audit_view_admin" ON audit_logs;
CREATE POLICY "audit_view_admin" ON audit_logs FOR SELECT 
USING (is_admin());

-- 4. Unlock Subject-Teacher-Assignments
ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sta_full_admin" ON subject_teacher_assignments;
CREATE POLICY "sta_full_admin" ON subject_teacher_assignments FOR ALL 
USING (is_admin());

-- 5. Verification
SELECT 'Permissions Reset' as status;
