-- ═══════════════════════════════════════════════════════════════════════════════
-- TIMETABLE SCHEMA: Complete Setup + Fixes
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Timetables table (Container)
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, academic_year) 
);
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

-- 2. Create Timetable Periods table (with nullable subject/teacher for manual activities)
CREATE TABLE IF NOT EXISTS timetable_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')), 
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    activity_label TEXT, -- For manual activities (Games, Library, Lunch, etc.)
    subject TEXT, -- Legacy text field for backward compatibility
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '10:00',
    room_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(timetable_id, day_of_week, period_number)
);
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;

-- 3. If tables exist, add missing columns
ALTER TABLE timetable_periods 
ADD COLUMN IF NOT EXISTS activity_label TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT;

-- 4. Make subject_id and teacher_id nullable (for manual activities)
ALTER TABLE timetable_periods ALTER COLUMN subject_id DROP NOT NULL;
ALTER TABLE timetable_periods ALTER COLUMN teacher_id DROP NOT NULL;

-- 5. RLS Policies
DROP POLICY IF EXISTS "timetables_admin_all" ON timetables;
CREATE POLICY "timetables_admin_all" ON timetables FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "timetables_read_published" ON timetables;  
CREATE POLICY "timetables_read_published" ON timetables FOR SELECT USING (status = 'published' OR is_admin() OR is_teacher());

DROP POLICY IF EXISTS "periods_admin_all" ON timetable_periods;
CREATE POLICY "periods_admin_all" ON timetable_periods FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "periods_read_access" ON timetable_periods;
CREATE POLICY "periods_read_access" ON timetable_periods FOR SELECT USING (
    EXISTS (SELECT 1 FROM timetables t WHERE t.id = timetable_periods.timetable_id AND (t.status = 'published' OR is_admin() OR is_teacher()))
);

-- 6. Verification
SELECT 'timetables' as table_name, count(*) as row_count FROM timetables
UNION ALL
SELECT 'timetable_periods', count(*) FROM timetable_periods;
