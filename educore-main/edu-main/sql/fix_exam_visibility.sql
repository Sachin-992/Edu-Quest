-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX EXAM VISIBILITY FOR ALL ROLES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Published exams should be visible to students, teachers, and parents
-- Only admins can create/edit/delete exams

-- 1. Enable RLS on exams table (if not already)
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Admin full access exams" ON exams;
DROP POLICY IF EXISTS "View published exams" ON exams;
DROP POLICY IF EXISTS "Anyone view published exams" ON exams;

-- 3. CREATE POLICIES

-- Admin: Full Access (CRUD)
CREATE POLICY "Admin full access exams" ON exams
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- All Authenticated Users: View published/active/completed exams
-- Students, Teachers, Parents can see exams that are NOT drafts
CREATE POLICY "View published exams" ON exams
    FOR SELECT USING (
        status IN ('published', 'active', 'completed')
    );

-- 4. Grant permissions
GRANT SELECT ON exams TO authenticated;
GRANT ALL ON exams TO authenticated;

SELECT '✓ Exam visibility fixed - Published exams now visible to all roles' as status;
