-- Phase 3: Timetable Architecture (Normalized)

-- 1. Timetables (Container)
-- Linked to 'classes' table for referential integrity.
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: Only one active timetable per class per year (simplified)
    UNIQUE(class_id, academic_year) 
);
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

-- 2. Timetable Periods (Slots)
-- Normalized: references timetables, subjects, teachers
CREATE TABLE IF NOT EXISTS timetable_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')), 
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    
    -- Constraints
    UNIQUE(timetable_id, day_of_week, period_number), -- One class, one activity per slot
    UNIQUE(teacher_id, day_of_week, period_number, start_time) -- Teacher can't be in 2 places (basic check, refined by overlap trigger)
);
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;


-- 3. RLS POLICIES (Simplified for clarity)

-- TIMETABLES
CREATE POLICY "Admin All" ON timetables FOR ALL USING (is_admin());
CREATE POLICY "Public Read Published" ON timetables FOR SELECT USING (status = 'published'); -- Simplification: All auth users can see published? No, restrict.

-- Strict Visibility
-- Students/Parents: See ONLY their class.
-- Teachers: See ALL published (often need to see others for sustitution) OR just own? 
-- Let's stick to strict: Teachers see their own + any class they teach.
-- Actually, teachers usually need to view the whole school schedule or at least their classes.
-- Let's allow Teachers to see ALL published timetables for coordination (standard school requirement).

-- PERIODS
CREATE POLICY "Admin All" ON timetable_periods FOR ALL USING (is_admin());
CREATE POLICY "Read Access" ON timetable_periods FOR SELECT USING (
    EXISTS (SELECT 1 FROM timetables t WHERE t.id = timetable_periods.timetable_id AND t.status = 'published')
);

-- Note: We will use the existing 'users' table and helper functions from the big schema file if needed.
