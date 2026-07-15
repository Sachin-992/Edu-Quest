-- ═══════════════════════════════════════════════════════════════════════════════
-- MASTER DATA INTEGRITY & SYNC SCRIPT (FIXED)
-- EDUCORE-OMEGA Platform
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: SCHEMA MIGRATION (Ensure columns exist first!)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1.1 Add user_id to teachers if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'user_id') THEN
        ALTER TABLE teachers ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- 1.2 Add user_id to students if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
        ALTER TABLE students ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- 1.3 Add class_id to students if missing (CRITICAL FIX)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_id') THEN
        ALTER TABLE students ADD COLUMN class_id UUID REFERENCES classes(id);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: DIAGNOSTICS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Diagnostic checks running...' as status;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: FIX RELATIONSHIPS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3.1 Link Teachers to Users
UPDATE teachers t
SET user_id = u.id
FROM users u
WHERE LOWER(t.email) = LOWER(u.email)
AND u.role = 'teacher'
AND (t.user_id IS NULL OR t.user_id != u.id);

-- 3.2 Link Students to Users
UPDATE students s
SET user_id = u.id
FROM users u
WHERE LOWER(s.email) = LOWER(u.email)
AND u.role = 'student'
AND (s.user_id IS NULL OR s.user_id != u.id);

-- 3.3 Link Students to Classes (Using Text Match)
-- This populates the new class_id column based on class/section text columns
UPDATE students s
SET class_id = c.id
FROM classes c
WHERE s.class_id IS NULL
AND s.class IS NOT NULL
AND s.section IS NOT NULL
AND (
    c.grade_level::TEXT = s.class 
    OR c.grade_level::TEXT = REGEXP_REPLACE(s.class, '[^0-9]', '', 'g')
    OR ('Class ' || c.grade_level::TEXT) = s.class
)
AND c.section = s.section;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: SYNC SUBJECTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO subjects (class_id, name, code)
SELECT 
    c.id as class_id,
    subj.name,
    subj.name || '-' || c.grade_level || c.section as code
FROM classes c
CROSS JOIN (
    VALUES 
        ('English'), ('Mathematics'), ('Science'), ('Social Studies'), 
        ('Hindi'), ('Computer Science'), ('Physical Education'), ('Art'), ('Music')
) as subj(name)
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s 
    WHERE s.class_id = c.id AND s.name = subj.name
)
ON CONFLICT (class_id, name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: RLS POLICIES (Fix Permissions)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure teachers can read their timetable periods
DROP POLICY IF EXISTS "timetable_periods_teacher_select" ON timetable_periods;
CREATE POLICY "timetable_periods_teacher_select" ON timetable_periods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t
            JOIN users u ON u.id = t.user_id
            WHERE t.id = timetable_periods.teacher_id
            AND u.auth_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
    );

-- Ensure teachers can read timetables
DROP POLICY IF EXISTS "timetables_teacher_select" ON timetables;
CREATE POLICY "timetables_teacher_select" ON timetables
    FOR SELECT USING (true); -- Teachers need to read basic timetable info

-- Final Status
SELECT 
    'Sync Complete' as status,
    (SELECT COUNT(*) FROM teachers WHERE user_id IS NOT NULL) as linked_teachers,
    (SELECT COUNT(*) FROM students WHERE class_id IS NOT NULL) as linked_students;
