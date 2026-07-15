-- ═══════════════════════════════════════════════════════════════════════════════
-- MASTER FIX: TIMETABLE & PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Reset and Fix RLS Policies (Allow verified users to do everything)
-- 2. Manually Create Timetables for ALL Classes
-- 3. Fix potential Foreign Key issues
-- ═══════════════════════════════════════════════════════════════════════════════

-- A. Enable permissive policies for Timetables
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetables_admin_all" ON timetables;
DROP POLICY IF EXISTS "timetables_auth_all" ON timetables;
CREATE POLICY "timetables_auth_all" ON timetables FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- B. Enable permissive policies for Timetable Periods
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "periods_admin_all" ON timetable_periods;
DROP POLICY IF EXISTS "periods_auth_all" ON timetable_periods;
CREATE POLICY "periods_auth_all" ON timetable_periods FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- C. Ensure Teachers and Subjects are readable
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers_read_all" ON teachers FOR SELECT USING (true);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read_all" ON subjects FOR SELECT USING (true);

-- D. MANUAL DATA FIX: Create Timetables for All Classes
-- This ensures 'No timetable found' error never happens
INSERT INTO timetables (class_id, academic_year, status, created_at, updated_at)
SELECT 
    c.id, 
    '2025-2026', 
    'draft', 
    NOW(), 
    NOW()
FROM classes c
WHERE NOT EXISTS (
    SELECT 1 FROM timetables t 
    WHERE t.class_id = c.id AND t.academic_year = '2025-2026'
);

-- E. Verification
SELECT 
    count(*) as total_classes,
    (SELECT count(*) FROM timetables) as total_timetables,
    (SELECT count(*) FROM timetable_periods) as total_periods
FROM classes;
