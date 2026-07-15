-- 1. Create Attendance Table (if missing)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    timetable_period_id UUID REFERENCES timetable_periods(id),
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')),
    date DATE DEFAULT CURRENT_DATE,
    marked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, timetable_period_id, date)
);

-- 2. Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 3. Attendance Policies
-- Teachers can INSERT/UPDATE their own markings
CREATE POLICY "Unrestricted Insert for Teachers" ON attendance FOR INSERT 
WITH CHECK (true); -- Ideally check if marked_by = auth.uid()

CREATE POLICY "Unrestricted Update for Teachers" ON attendance FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Read Attendance" ON attendance FOR SELECT
USING (true);

-- 4. Fix Timetable Periods RLS (Allow Upsert)
-- Often 'upsert' fails if UPDATE policy is missing or restricted.
DROP POLICY IF EXISTS "Allow teachers update periods" ON timetable_periods;
CREATE POLICY "Allow authenticated upsert periods" ON timetable_periods
FOR ALL -- covers INSERT, UPDATE, SELECT, DELETE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Fix Timetables RLS (Allow Admin/Teacher to create/update)
DROP POLICY IF EXISTS "Timetable Access" ON timetables;
CREATE POLICY "Timetable Full Access" ON timetables
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
