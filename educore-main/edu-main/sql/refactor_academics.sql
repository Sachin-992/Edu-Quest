-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: ACADEMIC REFACTOR (Classes-Subjects-Teachers)
-- ═══════════════════════════════════════════════════════════════════════════════
-- GOAL: Enforce strict hierarchy: Class -> Subject -> Assigned Teacher
-- FIXED: Dependency Order (Tables first, then Policies)
-- FIXED: Type Mismatch (Text vs Integer)
-- FIXED: Legacy Schema Conflict (Drop old tables to ensure columns exist)

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (Force Schema Sync)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS subject_teacher_assignments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREATE ALL TABLES FIRST (Resolves dependencies)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 CLASSES
CREATE TABLE classes ( -- Removed IF NOT EXISTS to ensure it matches THIS definition
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_level TEXT NOT NULL, 
    section TEXT NOT NULL,     
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT idx_unique_class UNIQUE (grade_level, section)
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 1.2 SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,        
    code TEXT,                 
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT idx_unique_subject_in_class UNIQUE (class_id, name)
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 1.3 ASSIGNMENTS
CREATE TABLE IF NOT EXISTS subject_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT idx_unique_subject_teacher UNIQUE (subject_id)
);
ALTER TABLE subject_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. APPLY RLS POLICIES (Now that all tables exist)
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 CLASSES POLICIES
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "classes_read_all" ON classes;
CREATE POLICY "classes_read_all" ON classes FOR SELECT USING (auth.role() = 'authenticated');

-- 2.2 SUBJECTS POLICIES
DROP POLICY IF EXISTS "subjects_admin_all" ON subjects;
CREATE POLICY "subjects_admin_all" ON subjects FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "subjects_teacher_assigned" ON subjects;
CREATE POLICY "subjects_teacher_assigned" ON subjects FOR SELECT
USING (
    is_teacher() AND 
    id IN (
        SELECT subject_id FROM subject_teacher_assignments 
        WHERE teacher_id = get_my_teacher_id()
    )
);

DROP POLICY IF EXISTS "subjects_student_class" ON subjects;
CREATE POLICY "subjects_student_class" ON subjects FOR SELECT
USING (
    is_student() AND 
    class_id IN (
        SELECT c.id FROM classes c
        JOIN students s ON s.class::text = c.grade_level::text AND s.section = c.section
        WHERE s.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "subjects_parent_class" ON subjects;
CREATE POLICY "subjects_parent_class" ON subjects FOR SELECT
USING (
    is_parent() AND 
    class_id IN (
        SELECT c.id FROM classes c
        JOIN students s ON s.class::text = c.grade_level::text AND s.section = c.section
        JOIN parent_student_links psl ON psl.student_id = s.id
        JOIN parents p ON p.id = psl.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- 2.3 ASSIGNMENTS POLICIES
DROP POLICY IF EXISTS "assign_admin_all" ON subject_teacher_assignments;
CREATE POLICY "assign_admin_all" ON subject_teacher_assignments FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "assign_teacher_own" ON subject_teacher_assignments;
CREATE POLICY "assign_teacher_own" ON subject_teacher_assignments FOR SELECT
USING (teacher_id = get_my_teacher_id());

DROP POLICY IF EXISTS "assign_student_view" ON subject_teacher_assignments;
CREATE POLICY "assign_student_view" ON subject_teacher_assignments FOR SELECT
USING (
    is_student() AND 
    subject_id IN (
        SELECT id FROM subjects WHERE class_id IN (
            SELECT c.id FROM classes c
            JOIN students s ON s.class::text = c.grade_level::text AND s.section = c.section
            WHERE s.user_id = auth.uid()
        )
    )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DATA MIGRATION
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO classes (grade_level, section)
SELECT DISTINCT class, section 
FROM students 
WHERE class IS NOT NULL AND section IS NOT NULL
ON CONFLICT (grade_level, section) DO NOTHING;

-- Verification
SELECT 'Classes Created' as entity, count(*) FROM classes
UNION ALL
SELECT 'Subjects Table Ready', 0;
