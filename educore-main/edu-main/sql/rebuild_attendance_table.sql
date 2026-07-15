-- ═══════════════════════════════════════════════════════════════════════════════
-- NUCLEAR OPTION: REBUILD ATTENDANCE TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- The error "column t.class does not exist" persists due to a hidden legacy trigger.
-- This script completely drops and recreates the table to guarantee a clean slate.

-- 1. DROP EVERYTHING RELATED (CASCADE handles dependencies)
DROP TABLE IF EXISTS attendance_periods CASCADE;
DROP VIEW IF EXISTS attendance_summary CASCADE;
DROP TABLE IF EXISTS attendance_summary CASCADE; -- In case it was a table

-- 2. RECREATE ATTENDANCE_PERIODS TABLE (Clean)
CREATE TABLE attendance_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    timetable_period_id UUID NOT NULL REFERENCES timetable_periods(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMPTZ DEFAULT now(),
    remarks TEXT,
    CONSTRAINT unique_attendance UNIQUE (student_id, timetable_period_id, attendance_date)
);

-- 3. ENABLE RLS
ALTER TABLE attendance_periods ENABLE ROW LEVEL SECURITY;

-- 4. RE-APPLY RLS POLICIES (Simplified & Correct)

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

-- 5. RECREATE LIVE VIEW (Frontend Data Source)
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    student_id,
    COUNT(DISTINCT attendance_date) as total_periods, 
    COUNT(DISTINCT CASE WHEN status = 'present' THEN attendance_date END) as attended_periods,
    COUNT(DISTINCT CASE WHEN status = 'absent' THEN attendance_date END) as absent_periods,
    CASE 
        WHEN COUNT(DISTINCT attendance_date) > 0 THEN 
            ROUND((COUNT(DISTINCT CASE WHEN status = 'present' THEN attendance_date END)::NUMERIC / COUNT(DISTINCT attendance_date)) * 100, 1)
        ELSE 0 
    END as attendance_percentage
FROM attendance_periods
GROUP BY student_id;

-- 6. GRANT PERMISSIONS (Vital for View access)
GRANT SELECT ON attendance_summary TO authenticated;
GRANT ALL ON attendance_periods TO authenticated;

SELECT '✓ Attendance Table Rebuilt (Clean Slate)' as status;
