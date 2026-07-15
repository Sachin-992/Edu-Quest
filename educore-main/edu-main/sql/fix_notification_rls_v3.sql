-- ============================================
-- FIX V3: Type-Safe Notification RLS
-- ============================================
-- Fixes error: operator does not exist: text = user_role
-- Reason: 'users.role' is likely TEXT, while 'notifications.target_role' is ENUM.
-- Solution: Explicitly cast the text role to user_role enum.
-- ============================================

DROP POLICY IF EXISTS "notifications_read_policy" ON notifications;
DROP POLICY IF EXISTS notifications_user_policy ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;

-- Create ROBUST V3 Policy (With Type Casting)
CREATE POLICY "notifications_read_policy" ON notifications
    FOR SELECT
    USING (
        -- 1. Broadcast (Public)
        (user_id IS NULL AND target_role IS NULL)
        OR 
        -- 2. Direct user targeting
        user_id = auth.uid() 
        OR 
        -- 3. Role targeting (With Type Cast)
        (
            user_id IS NULL 
            AND target_role = (
                SELECT role::text::user_role  -- Cast text -> user_role
                FROM users 
                WHERE auth_id = auth.uid() 
                LIMIT 1
            )
        )
        OR
        -- 4. Admins see everything
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_id = auth.uid() 
                AND role = 'admin'  -- This comparison is fine (text = text)
            )
        )
    );

-- Insert Policy
CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND role = 'admin'
        )
    );
