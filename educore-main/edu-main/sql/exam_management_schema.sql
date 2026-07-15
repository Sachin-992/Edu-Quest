-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCORE-OMEGA: EXAM MANAGEMENT SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Admin: Full Access
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
CREATE POLICY "exams_admin_all" ON exams FOR ALL USING (is_admin());

-- Teacher: Read Only (to enter marks)
DROP POLICY IF EXISTS "exams_teacher_select" ON exams;
CREATE POLICY "exams_teacher_select" ON exams FOR SELECT USING (is_teacher());

-- Student/Parent: Read Only (only if Active/Published -- actually maybe just Published for results, or Active for knowing schedule)
-- Let's allow Students to see non-draft exams (so they know schedule)
DROP POLICY IF EXISTS "exams_student_parent_select" ON exams;
CREATE POLICY "exams_student_parent_select" ON exams FOR SELECT USING (
    (status != 'draft') AND (is_student() OR is_parent()) 
);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
