-- ============================================
-- FIX V4: Universal Type-Safe Notification RLS
-- ============================================
-- Fixes error: operator does not exist: text = user_role
-- Strategy: Cast EVERYTHING to TEXT to ensure safe comparisons
-- regardless of whether the underlying columns are ENUM or TEXT.
-- ============================================

DROP POLICY IF EXISTS "notifications_read_policy" ON notifications;
DROP POLICY IF EXISTS notifications_user_policy ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;

-- 1. READ POLICY (Universal Casting)
CREATE POLICY "notifications_read_policy" ON notifications
    FOR SELECT
    USING (
        -- 1. Broadcast (Public)
        (user_id IS NULL AND target_role IS NULL)
        OR 
        -- 2. Direct user targeting
        user_id = auth.uid() 
        OR 
        -- 3. Role targeting (Cast both sides to TEXT)
        (
            user_id IS NULL 
            AND target_role::text = (                -- Cast notifications.target_role to TEXT
                SELECT role::text                    -- Cast users.role to TEXT
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
                AND role::text = 'admin'             -- Cast users.role to TEXT for comparison
            )
        )
    );

-- 2. INSERT POLICY (Admins only)
CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_id = auth.uid() 
            AND role::text = 'admin'                 -- Cast users.role to TEXT
        )
    );

-- 3. UPDATE POLICY (Users can mark as read)
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR
        (
             -- Allow updating if targeted by role (need to check role again)
             user_id IS NULL 
             AND target_role::text = (
                SELECT role::text
                FROM users 
                WHERE auth_id = auth.uid() 
                LIMIT 1
             )
        )
    )
    WITH CHECK (
        -- Can only update 'read' or 'dismissed' status generally, 
        -- but simpler RLS often just checks ownership.
        -- We'll allow updates if you can see it.
        user_id = auth.uid()
        OR
        (
             user_id IS NULL 
             AND target_role::text = (
                SELECT role::text
                FROM users 
                WHERE auth_id = auth.uid() 
                LIMIT 1
             )
        )
    );
