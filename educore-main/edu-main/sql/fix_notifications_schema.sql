-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Notifications Schema
-- Ensure notifications table exists and has necessary columns
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_role TEXT, -- 'student', 'teacher', 'admin', 'parent'
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'announcement'
    category TEXT DEFAULT 'system', -- 'system', 'academic', 'financial', 'urgent', 'announcement'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name TEXT,
    read BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Add metadata column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Users can see their own notifications
DROP POLICY IF EXISTS "notifications_self_view" ON notifications;
CREATE POLICY "notifications_self_view" ON notifications FOR SELECT
    USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Users can update their own notifications (mark as read/dismiss)
DROP POLICY IF EXISTS "notifications_self_update" ON notifications;
CREATE POLICY "notifications_self_update" ON notifications FOR UPDATE
    USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Admins/Teachers/System can insert notifications
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
CREATE POLICY "notifications_insert_policy" ON notifications FOR INSERT
    WITH CHECK (true); -- Allow all inserts for now (or restrict to authorized roles)

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 6. Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
