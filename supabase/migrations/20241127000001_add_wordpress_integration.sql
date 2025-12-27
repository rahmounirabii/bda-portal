-- Migration: Add WordPress Integration Fields
-- Date: 2024-11-27
-- Description: Adds fields for transparent Portal-Store authentication

-- Add WordPress user ID to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS wp_user_id INTEGER,
ADD COLUMN IF NOT EXISTS wp_sync_status TEXT DEFAULT 'not_synced' CHECK (wp_sync_status IN ('not_synced', 'synced', 'pending', 'failed')),
ADD COLUMN IF NOT EXISTS wp_last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS signup_type TEXT DEFAULT 'portal-only' CHECK (signup_type IN ('portal-only', 'store-only', 'both')),
ADD COLUMN IF NOT EXISTS created_from TEXT DEFAULT 'portal' CHECK (created_from IN ('portal', 'store'));

-- Create index for WordPress user ID
CREATE INDEX IF NOT EXISTS idx_users_wp_user_id ON public.users(wp_user_id);
CREATE INDEX IF NOT EXISTS idx_users_wp_sync_status ON public.users(wp_sync_status);
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization);

-- Create a view for unified user data
CREATE OR REPLACE VIEW public.users_unified AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.organization,
    u.wp_user_id,
    u.wp_sync_status,
    u.wp_last_sync,
    u.signup_type,
    u.created_from,
    u.phone,
    u.country_code,
    u.job_title,
    u.company_name,
    u.preferred_language,
    u.timezone,
    u.is_active,
    u.created_at,
    u.updated_at,
    -- Computed fields
    CASE
        WHEN u.wp_user_id IS NOT NULL THEN true
        ELSE false
    END as has_store_access,
    CASE
        WHEN u.id IS NOT NULL THEN true
        ELSE false
    END as has_portal_access
FROM public.users u;

-- Grant permissions on the view
GRANT SELECT ON public.users_unified TO authenticated;

-- Function to sync user from WordPress
CREATE OR REPLACE FUNCTION public.sync_from_wordpress(
    p_email TEXT,
    p_wp_user_id INTEGER,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_organization TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Check if user exists
    SELECT id INTO v_user_id FROM public.users WHERE email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE public.users
        SET
            wp_user_id = p_wp_user_id,
            wp_sync_status = 'synced',
            wp_last_sync = NOW(),
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            organization = COALESCE(p_organization, organization),
            updated_at = NOW()
        WHERE id = v_user_id;

        v_result := json_build_object(
            'success', true,
            'action', 'updated',
            'user_id', v_user_id
        );
    ELSE
        -- User doesn't exist in portal yet
        v_result := json_build_object(
            'success', false,
            'action', 'not_found',
            'message', 'User not found in portal'
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create portal user from WordPress
CREATE OR REPLACE FUNCTION public.create_portal_user_from_wp(
    p_user_id UUID,
    p_email TEXT,
    p_wp_user_id INTEGER,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_role user_role DEFAULT 'individual',
    p_organization TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Insert new user
    INSERT INTO public.users (
        id,
        email,
        wp_user_id,
        first_name,
        last_name,
        role,
        organization,
        wp_sync_status,
        wp_last_sync,
        created_from,
        signup_type,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_wp_user_id,
        p_first_name,
        p_last_name,
        p_role,
        p_organization,
        'synced',
        NOW(),
        'store',
        'both',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET
        wp_user_id = EXCLUDED.wp_user_id,
        wp_sync_status = 'synced',
        wp_last_sync = NOW(),
        updated_at = NOW();

    v_result := json_build_object(
        'success', true,
        'action', 'created',
        'user_id', p_user_id
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        v_result := json_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for WordPress sync
CREATE POLICY "Service role can manage WordPress sync" ON public.users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Update existing RLS to handle WordPress fields
-- Users can view their own WordPress sync status
CREATE POLICY "Users can view own WordPress sync" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Comment on new columns
COMMENT ON COLUMN public.users.wp_user_id IS 'WordPress user ID for store integration';
COMMENT ON COLUMN public.users.wp_sync_status IS 'Synchronization status with WordPress';
COMMENT ON COLUMN public.users.wp_last_sync IS 'Last synchronization timestamp with WordPress';
COMMENT ON COLUMN public.users.organization IS 'User organization for BDA membership';
COMMENT ON COLUMN public.users.signup_type IS 'Type of signup: portal-only, store-only, or both';
COMMENT ON COLUMN public.users.created_from IS 'Origin system: portal or store';