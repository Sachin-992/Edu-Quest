-- ============================================================================
-- EDUCORE-OMEGA Notifications Schema
-- Purpose: Database-persisted notifications with role-based access
-- ============================================================================

-- Notification priority levels
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Notification categories
CREATE TYPE notification_category AS ENUM (
    'system',       -- System alerts, maintenance
    'academic',     -- Grades, assignments, attendance
    'financial',    -- Fees, payments, dues
    'urgent',       -- Time-sensitive alerts
    'announcement'  -- Broadcast announcements
);

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Targeting
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast to role
    target_role user_role,                                 -- Target specific role (NULL = specific user)
    
    -- Content
    type VARCHAR(50) NOT NULL DEFAULT 'info',             -- info, success, warning, error, announcement
    category notification_category NOT NULL DEFAULT 'system',
    priority notification_priority NOT NULL DEFAULT 'normal',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Actions
    action_url VARCHAR(500),                              -- Optional click action URL
    action_label VARCHAR(100),                            -- Button label for action
    
    -- Sender info
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255),
    
    -- State
    read BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                               -- Auto-expire old notifications
    read_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb                    -- Extensible data
);

-- Index for fast user notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role) WHERE target_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- ============================================================================
-- Push Notification Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Web Push API fields
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,          -- Public key
    auth TEXT NOT NULL,            -- Auth secret
    
    -- Device info
    user_agent TEXT,
    device_name VARCHAR(255),
    
    -- State
    active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one subscription per endpoint per user
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id) WHERE active = TRUE;

-- ============================================================================
-- Notification Preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Channel preferences
    enable_in_app BOOLEAN DEFAULT TRUE,
    enable_push BOOLEAN DEFAULT TRUE,
    enable_email BOOLEAN DEFAULT FALSE,
    
    -- Category preferences
    mute_system BOOLEAN DEFAULT FALSE,
    mute_academic BOOLEAN DEFAULT FALSE,
    mute_financial BOOLEAN DEFAULT FALSE,
    mute_announcements BOOLEAN DEFAULT FALSE,
    
    -- Quiet hours
    quiet_hours_start TIME,         -- e.g., 22:00
    quiet_hours_end TIME,           -- e.g., 07:00
    
    -- Sound preferences
    enable_sound BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications RLS: Users see their own + role-targeted notifications
CREATE POLICY notifications_user_policy ON notifications
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (
            user_id IS NULL 
            AND target_role = (SELECT role FROM users WHERE auth_id = auth.uid())
        )
        OR (
            user_id IS NULL AND target_role IS NULL  -- Broadcast to all
        )
    );

-- Admin can insert notifications
CREATE POLICY notifications_admin_insert ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- Users can update their own notification read/dismissed state
CREATE POLICY notifications_user_update ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Push subscriptions: Users manage their own
CREATE POLICY push_subscriptions_user_policy ON push_subscriptions
    FOR ALL
    USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Notification preferences: Users manage their own
CREATE POLICY notification_preferences_user_policy ON notification_preferences
    FOR ALL
    USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID DEFAULT NULL,
    p_target_role user_role DEFAULT NULL,
    p_type VARCHAR DEFAULT 'info',
    p_category notification_category DEFAULT 'system',
    p_priority notification_priority DEFAULT 'normal',
    p_title VARCHAR,
    p_message TEXT,
    p_action_url VARCHAR DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_sender_name VARCHAR DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, target_role, type, category, priority,
        title, message, action_url, sender_id, sender_name, expires_at
    ) VALUES (
        p_user_id, p_target_role, p_type, p_category, p_priority,
        p_title, p_message, p_action_url, p_sender_id, p_sender_name, p_expires_at
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = NOW()
    WHERE id = p_notification_id 
    AND (user_id = auth.uid() OR user_id IS NULL);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for current user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = NOW()
    WHERE 
        read = FALSE
        AND (
            user_id = auth.uid() 
            OR (
                user_id IS NULL 
                AND target_role = (SELECT role FROM users WHERE auth_id = auth.uid())
            )
        );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired notifications (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Enable Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;

COMMENT ON TABLE notifications IS 'EDUCORE-OMEGA notification system with role-based targeting';
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions for browser notifications';
COMMENT ON TABLE notification_preferences IS 'User notification channel and category preferences';
