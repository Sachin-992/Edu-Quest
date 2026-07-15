-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX ATTENDANCE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════
-- The policies were incorrectly comparing auth.uid() to users.id instead of users.auth_id

-- 1. DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Admin full access attendance" ON attendance_periods;
DROP POLICY IF EXISTS "Teacher manage attendance" ON attendance_periods;
DROP POLICY IF EXISTS "Student view own attendance" ON attendance_periods;
DROP POLICY IF EXISTS "Parent view child attendance" ON attendance_periods;

-- 2. RECREATE WITH CORRECT AUTH COMPARISON

-- Admin: Full Access
CREATE POLICY "Admin full access attendance" ON attendance_periods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- Teacher: Manage (View/Edit)
CREATE POLICY "Teacher manage attendance" ON attendance_periods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'teacher')
    );

-- Student: View Own
CREATE POLICY "Student view own attendance" ON attendance_periods
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.auth_id = auth.uid()
        )
    );

-- Parent: View Child's
CREATE POLICY "Parent view child attendance" ON attendance_periods
    FOR SELECT USING (
        student_id IN (
            SELECT psl.student_id 
            FROM parent_student_links psl
            JOIN parents p ON p.id = psl.parent_id
            JOIN users u ON u.id = p.user_id
            WHERE u.auth_id = auth.uid()
        )
    );

-- 3. VERIFY VIEW EXISTS AND HAS CORRECT PERMISSIONS
GRANT SELECT ON attendance_summary TO authenticated;
GRANT ALL ON attendance_periods TO authenticated;

SELECT '✓ Attendance RLS Policies Fixed' as status;
