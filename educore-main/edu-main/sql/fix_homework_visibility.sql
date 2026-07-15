-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX HOMEWORK/ASSIGNMENT VISIBILITY FOR STUDENTS
-- ═══════════════════════════════════════════════════════════════════════════════
-- The RLS policy was incorrectly comparing s.user_id = auth.uid()
-- It should compare users.auth_id = auth.uid() to match the JWT token

-- 1. FIX STUDENT VIEW POLICY ON daily_homework
DROP POLICY IF EXISTS "homework_student_view" ON daily_homework;
CREATE POLICY "homework_student_view" ON daily_homework FOR SELECT
USING (
    is_student() AND
    class_id IN (
        SELECT c.id FROM classes c 
        JOIN students s ON s.class = c.grade_level AND s.section = c.section 
        JOIN users u ON u.id = s.user_id 
        WHERE u.auth_id = auth.uid()
    )
);

-- 2. FIX PARENT VIEW POLICY ON daily_homework  
DROP POLICY IF EXISTS "homework_parent_view" ON daily_homework;
CREATE POLICY "homework_parent_view" ON daily_homework FOR SELECT
USING (
    is_parent() AND
    class_id IN (
        SELECT c.id FROM classes c 
        WHERE (c.grade_level, c.section) IN (
            SELECT s.class, s.section FROM students s
            JOIN parent_student_links psl ON psl.student_id = s.id
            JOIN parents p ON p.id = psl.parent_id
            JOIN users u ON u.id = p.user_id
            WHERE u.auth_id = auth.uid()
        )
    )
);

-- 3. ENSURE ADMIN CAN SEE ALL HOMEWORK
DROP POLICY IF EXISTS "homework_admin_all" ON daily_homework;
CREATE POLICY "homework_admin_all" ON daily_homework FOR ALL
USING (is_admin());

-- 4. GRANT PERMISSIONS
GRANT SELECT ON daily_homework TO authenticated;
GRANT ALL ON daily_homework TO authenticated;

-- 5. ALSO FIX assignments table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') THEN
        -- Drop existing student view policy
        DROP POLICY IF EXISTS "assignments_student_view" ON assignments;
        
        -- Create corrected policy
        CREATE POLICY "assignments_student_view" ON assignments FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM students s 
                JOIN users u ON u.id = s.user_id 
                WHERE u.auth_id = auth.uid()
            )
        );
        
        -- Admin full access
        DROP POLICY IF EXISTS "assignments_admin_all" ON assignments;
        CREATE POLICY "assignments_admin_all" ON assignments FOR ALL
        USING (
            EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
        );
        
        GRANT SELECT ON assignments TO authenticated;
    END IF;
END $$;

SELECT '✓ Homework/Assignment visibility fixed for students and parents' as status;
