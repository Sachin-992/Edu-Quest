-- ═══════════════════════════════════════════════════════════════════════════════
-- SYNC SUBJECTS FOR ALL CLASSES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to ensure all classes have standard subjects
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. First, check if `code` column has unique constraint and drop it if needed
-- The code should be unique per class, not globally
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_code_key;

-- 2. Create standard subjects for ALL classes that don't have them
DO $$
DECLARE
    class_rec RECORD;
    subject_names TEXT[] := ARRAY['Science', 'Mathematics', 'English', 'Hindi', 'Social Studies', 'General', 'Computer Science', 'Physical Education', 'Art', 'Music'];
    subject_name TEXT;
BEGIN
    FOR class_rec IN SELECT id, grade_level, section FROM classes LOOP
        FOREACH subject_name IN ARRAY subject_names LOOP
            INSERT INTO subjects (class_id, name, code, status)
            VALUES (
                class_rec.id, 
                subject_name, 
                UPPER(LEFT(subject_name, 3)) || '-' || class_rec.grade_level || class_rec.section,
                'active'
            )
            ON CONFLICT (class_id, name) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. Also allow teachers to insert subjects (for when they upload resources)
DROP POLICY IF EXISTS "subjects_teacher_insert" ON subjects;
CREATE POLICY "subjects_teacher_insert" ON subjects 
FOR INSERT WITH CHECK (is_teacher() OR is_admin());

-- 4. Verification
SELECT c.grade_level || '-' || c.section as class, s.name as subject, s.id as subject_id
FROM subjects s
JOIN classes c ON c.id = s.class_id
ORDER BY c.grade_level, c.section, s.name;

-- 5. Count of subjects per class
SELECT c.grade_level || '-' || c.section as class, COUNT(s.id) as subject_count
FROM classes c
LEFT JOIN subjects s ON s.class_id = c.id
GROUP BY c.id, c.grade_level, c.section
ORDER BY c.grade_level, c.section;

-- Expected: Each class should have at least 10 subjects (the standard ones)
