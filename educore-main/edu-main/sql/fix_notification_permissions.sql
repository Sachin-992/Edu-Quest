-- FIX: Grant permissions for Notification System
-- Ensures Teachers (and other auth users) can read students/parents to send notifications

-- 1. Students Table
DROP POLICY IF EXISTS "allow_auth_read_students" ON students;
CREATE POLICY "allow_auth_read_students" ON students
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Parent-Student Links
DROP POLICY IF EXISTS "allow_auth_read_parent_links" ON parent_student_links;
CREATE POLICY "allow_auth_read_parent_links" ON parent_student_links
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Classes (Ensure we can read class details)
DROP POLICY IF EXISTS "allow_auth_read_classes" ON classes;
CREATE POLICY "allow_auth_read_classes" ON classes
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Notifications (Ensure we can insert)
DROP POLICY IF EXISTS "allow_auth_insert_notifications" ON notifications;
CREATE POLICY "allow_auth_insert_notifications" ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 5. Force Grant
GRANT SELECT ON students TO authenticated;
GRANT SELECT ON parent_student_links TO authenticated;
GRANT SELECT ON classes TO authenticated;
GRANT INSERT ON notifications TO authenticated;
