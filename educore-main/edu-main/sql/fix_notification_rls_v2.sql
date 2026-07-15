-- ============================================
-- FIX V2: Robust Notification RLS (Database Lookup)
-- ============================================
-- Reverting to database lookup for roles, as JWT metadata 
-- might be stale or case-mismatched.
-- Since 'users' table RLS is now fixed (non-recursive), 
-- this is safe and more reliable.
-- ============================================

DROP POLICY IF EXISTS "notifications_read_policy" ON notifications;
DROP POLICY IF EXISTS notifications_user_policy ON notifications; -- Old one

CREATE POLICY "notifications_read_policy" ON notifications
    FOR SELECT
    USING (
        -- 1. Broadcast (Public to all)
        (user_id IS NULL AND target_role IS NULL)
        
        OR 
        
        -- 2. Direct user targeting
        user_id = auth.uid() 
        
        OR 
        
        -- 3. Role targeting (Reliable DB Lookup)
        (
            user_id IS NULL 
            AND target_role = (
                SELECT role FROM users 
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
                AND role = 'admin'
            )
        )
    );

-- Ensure admin insert policy is also robust
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND role = 'admin'
        )
    );
