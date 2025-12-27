-- ============================================================================
-- User Settings Tables
-- Creates tables for notification settings and user preferences
-- ============================================================================

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification preferences
    membership_updates BOOLEAN DEFAULT true,
    certification_updates BOOLEAN DEFAULT true,
    new_resources BOOLEAN DEFAULT true,
    exam_reminders BOOLEAN DEFAULT true,
    pdc_reminders BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Appearance preferences
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),

    -- Regional preferences
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    timezone TEXT DEFAULT 'UTC',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- notification_settings policies
CREATE POLICY "Users can view own notification settings"
    ON user_notification_settings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification settings"
    ON user_notification_settings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification settings"
    ON user_notification_settings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all notification settings"
    ON user_notification_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- user_preferences policies
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all preferences"
    ON user_preferences FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp for notification_settings
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- Auto-update updated_at timestamp for preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- Default Settings Creation
-- ============================================================================

-- Automatically create default notification settings when user signs up
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification settings with all enabled by default
    -- Use fully qualified table names for cross-schema triggers
    INSERT INTO public.user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create user preferences with defaults
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when user is created
CREATE TRIGGER on_user_created_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE user_notification_settings IS 'Stores user notification preferences for email and in-app alerts';
COMMENT ON TABLE user_preferences IS 'Stores user preferences for theme, language, and timezone';
COMMENT ON COLUMN user_notification_settings.membership_updates IS 'Notifications for membership renewals and updates';
COMMENT ON COLUMN user_notification_settings.certification_updates IS 'Notifications for certification status changes';
COMMENT ON COLUMN user_notification_settings.new_resources IS 'Notifications when new learning resources are added';
COMMENT ON COLUMN user_notification_settings.exam_reminders IS 'Reminders for upcoming exams (48h, 24h before)';
COMMENT ON COLUMN user_notification_settings.pdc_reminders IS 'Reminders for PDC submissions and renewals';
COMMENT ON COLUMN user_notification_settings.system_alerts IS 'Important system-wide alerts and announcements';
