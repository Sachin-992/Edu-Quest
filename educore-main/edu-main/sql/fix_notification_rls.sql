-- ============================================
-- FIX: Optimized Notification RLS Policies
-- ============================================
-- Problem: Previous policies queried the 'users' table to check roles.
-- This is slow and can cause recursion issues (infinite loading).
--
-- Solution: Use JWT Metadata (auth.jwt()) to check roles instantly.
-- ============================================

-- 1. Drop existing policies (to be safe, dropping all variants)
DROP POLICY IF EXISTS notifications_user_policy ON notifications;
DROP POLICY IF EXISTS notifications_admin_insert ON notifications;
DROP POLICY IF EXISTS notifications_user_update ON notifications;
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
DROP POLICY IF EXISTS notifications_insert_policy ON notifications;

-- 2. SELECT Policy: Users see their own + role-targeted + broadcast
-- Uses JWT role instead of querying users table
CREATE POLICY "notifications_read_policy" ON notifications
    FOR SELECT
    USING (
        -- 1. Direct user targeting
        user_id = auth.uid() 
        OR 
        -- 2. Role targeting (using JWT metadata)
        (
            user_id IS NULL 
            AND target_role::text = ((auth.jwt() -> 'user_metadata' ->> 'role')::text)
        )
        OR 
        -- 3. Broadcast to all
        (
            user_id IS NULL AND target_role IS NULL
        )
        OR
        -- 4. Admins can see EVERYTHING (for management)
        (
            ((auth.jwt() -> 'user_metadata' ->> 'role')::text) = 'admin'
        )
    );

-- 3. INSERT Policy: Only Admins can send notifications
CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT
    WITH CHECK (
        ((auth.jwt() -> 'user_metadata' ->> 'role')::text) = 'admin'
    );

-- 4. UPDATE Policy: Users can mark as read/dismissed (their own only)
CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE
    USING (
        -- Can only update if it's targeted to them or their role
        user_id = auth.uid() 
        OR 
        (
            target_role::text = ((auth.jwt() -> 'user_metadata' ->> 'role')::text)
        )
        OR
        (target_role IS NULL AND user_id IS NULL)
    );

-- 5. Enable Realtime (ensure it's on)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 6. Grant permissions explicitly
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
