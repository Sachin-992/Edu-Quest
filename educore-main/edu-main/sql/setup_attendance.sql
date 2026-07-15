-- ================================================================
-- ATTENDANCE SYSTEM COMPLETE SETUP
-- Run this in Supabase SQL Editor to enable attendance features
-- ================================================================

-- 1. CREATE ATTENDANCE STATUS ENUM (if not exists)
DO $$ BEGIN
    CREATE TYPE period_attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CREATE ATTENDANCE_PERIODS TABLE
CREATE TABLE IF NOT EXISTS attendance_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    timetable_period_id UUID NOT NULL REFERENCES timetable_periods(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status period_attendance_status NOT NULL,
    marked_by UUID REFERENCES teachers(id),
    marked_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_attendance UNIQUE (student_id, timetable_period_id, attendance_date)
);

COMMENT ON TABLE attendance_periods IS 'Per-period attendance records - Teacher marks attendance for each period';

-- 3. CREATE ATTENDANCE_SUMMARY TABLE (for analytics)
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class VARCHAR(10) NOT NULL,
    section VARCHAR(5) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_periods INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    absent_count INTEGER NOT NULL DEFAULT 0,
    late_count INTEGER NOT NULL DEFAULT 0,
    attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_student_month UNIQUE (student_id, month, year)
);

COMMENT ON TABLE attendance_summary IS 'Monthly attendance aggregates for reporting';

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_periods(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_periods(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_period ON attendance_periods(timetable_period_id);
CREATE INDEX IF NOT EXISTS idx_summary_student ON attendance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_summary_class ON attendance_summary(class, section);

-- 5. ENABLE RLS
ALTER TABLE attendance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- Policy: Admin can do everything on attendance_periods
DROP POLICY IF EXISTS "attendance_admin_all" ON attendance_periods;
CREATE POLICY "attendance_admin_all" ON attendance_periods FOR ALL 
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Teachers can read and write attendance
DROP POLICY IF EXISTS "attendance_teacher_all" ON attendance_periods;
CREATE POLICY "attendance_teacher_all" ON attendance_periods FOR ALL 
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
);

-- Policy: Students can only view their own attendance
DROP POLICY IF EXISTS "attendance_student_view" ON attendance_periods;
CREATE POLICY "attendance_student_view" ON attendance_periods FOR SELECT 
USING (
    student_id IN (
        SELECT s.id FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.id = auth.uid()
    )
);

-- Similar policies for attendance_summary
DROP POLICY IF EXISTS "summary_admin_all" ON attendance_summary;
CREATE POLICY "summary_admin_all" ON attendance_summary FOR ALL 
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "summary_teacher_view" ON attendance_summary;
CREATE POLICY "summary_teacher_view" ON attendance_summary FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
);

DROP POLICY IF EXISTS "summary_student_view" ON attendance_summary;
CREATE POLICY "summary_student_view" ON attendance_summary FOR SELECT 
USING (
    student_id IN (
        SELECT s.id FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.id = auth.uid()
    )
);

-- 7. CREATE TRIGGER TO AUTO-UPDATE SUMMARY
CREATE OR REPLACE FUNCTION fn_update_attendance_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_student RECORD;
    v_month INTEGER;
    v_year INTEGER;
    v_class VARCHAR(10);
    v_section VARCHAR(5);
    v_total INTEGER;
    v_present INTEGER;
    v_absent INTEGER;
    v_late INTEGER;
BEGIN
    -- Get student info
    SELECT class, section INTO v_class, v_section 
    FROM students WHERE id = NEW.student_id;

    v_month := EXTRACT(MONTH FROM NEW.attendance_date);
    v_year := EXTRACT(YEAR FROM NEW.attendance_date);

    -- Count totals for the month
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) FILTER (WHERE status = 'late') as late
    INTO v_total, v_present, v_absent, v_late
    FROM attendance_periods
    WHERE student_id = NEW.student_id
      AND EXTRACT(MONTH FROM attendance_date) = v_month
      AND EXTRACT(YEAR FROM attendance_date) = v_year;

    -- Upsert summary
    INSERT INTO attendance_summary (student_id, class, section, month, year, total_periods, present_count, absent_count, late_count, attendance_percentage, updated_at)
    VALUES (
        NEW.student_id, v_class, v_section, v_month, v_year, 
        v_total, v_present, v_absent, v_late,
        CASE WHEN v_total > 0 THEN ROUND((v_present::NUMERIC / v_total) * 100, 2) ELSE 0 END,
        now()
    )
    ON CONFLICT (student_id, month, year) 
    DO UPDATE SET
        total_periods = EXCLUDED.total_periods,
        present_count = EXCLUDED.present_count,
        absent_count = EXCLUDED.absent_count,
        late_count = EXCLUDED.late_count,
        attendance_percentage = EXCLUDED.attendance_percentage,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_attendance_summary ON attendance_periods;
CREATE TRIGGER trg_attendance_summary
    AFTER INSERT OR UPDATE ON attendance_periods
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_attendance_summary();

-- 8. CREATE VIEW FOR ADMIN ANALYTICS
CREATE OR REPLACE VIEW v_attendance_analytics AS
SELECT 
    s.class,
    s.section,
    EXTRACT(MONTH FROM ap.attendance_date) as month,
    EXTRACT(YEAR FROM ap.attendance_date) as year,
    COUNT(DISTINCT ap.student_id) as total_students,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE ap.status = 'present') as present_count,
    COUNT(*) FILTER (WHERE ap.status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE ap.status = 'late') as late_count,
    ROUND(
        COUNT(*) FILTER (WHERE ap.status = 'present')::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as attendance_percentage
FROM attendance_periods ap
JOIN students s ON ap.student_id = s.id
GROUP BY s.class, s.section, EXTRACT(MONTH FROM ap.attendance_date), EXTRACT(YEAR FROM ap.attendance_date)
ORDER BY year DESC, month DESC, s.class, s.section;

-- 9. VERIFY SETUP
SELECT 'Setup Complete!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('attendance_periods', 'attendance_summary')
ORDER BY table_name;
