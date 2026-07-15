-- 1. Fix Academic Files RLS
ALTER TABLE academic_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher Upload" ON academic_files;
CREATE POLICY "Teacher Upload" ON academic_files
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "View Class Resources" ON academic_files;
CREATE POLICY "View Class Resources" ON academic_files
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 2. Fix Notifications RLS (Case Indifference via Text Cast)
-- We cast to text first to avoid "function lower(user_role) does not exist" error
DROP POLICY IF EXISTS "notifications_read_policy" ON notifications;
CREATE POLICY "notifications_read_policy" ON notifications
    FOR SELECT
    USING (
        -- 1. Broadcast (Public to all)
        (user_id IS NULL AND target_role IS NULL)
        
        OR 
        
        -- 2. Direct user targeting
        user_id = auth.uid() 
        
        OR 
        
        -- 3. Role targeting (Case Insensitive with Cast)
        (
            user_id IS NULL 
            AND lower(target_role::text) = (
                SELECT lower(role::text) FROM users 
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
                AND role::text = 'admin'
            )
        )
    );
