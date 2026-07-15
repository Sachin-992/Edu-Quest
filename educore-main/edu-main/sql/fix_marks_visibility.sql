-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Marks Visibility for Students and Parents
-- ISSUE: RLS policy uses IN (SELECT ...) which doesn't work correctly with scalar function
-- ═══════════════════════════════════════════════════════════════════════════════

-- Fix the marks_student_view policy to use equality instead of IN
DROP POLICY IF EXISTS "marks_student_view" ON marks;
CREATE POLICY "marks_student_view" ON marks FOR SELECT 
    USING (student_id = get_my_student_id());

-- Add parent view policy for marks (missing in original schema)
DROP POLICY IF EXISTS "marks_parent_view" ON marks;
CREATE POLICY "marks_parent_view" ON marks FOR SELECT
    USING (
        is_parent() AND student_id IN (
            SELECT psl.student_id 
            FROM parent_student_links psl
            JOIN parents p ON p.id = psl.parent_id
            WHERE p.user_id = current_user_id()
        )
    );

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'marks'
ORDER BY policyname;
