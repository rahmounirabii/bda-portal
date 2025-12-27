-- Fix the handle_new_user trigger to use bda_role instead of role
-- This fixes the 500 error during signup

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that handles bda_role field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract metadata from the auth signup
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        role,
        organization,
        signup_type,
        wp_user_id,
        created_from
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        -- Use bda_role from metadata, fallback to 'individual'
        COALESCE(
            (NEW.raw_user_meta_data->>'bda_role')::user_role,
            'individual'
        ),
        NEW.raw_user_meta_data->>'organization',
        COALESCE(NEW.raw_user_meta_data->>'signup_type', 'portal-only'),
        CASE
            WHEN NEW.raw_user_meta_data->>'wp_user_id' IS NOT NULL
            THEN (NEW.raw_user_meta_data->>'wp_user_id')::INTEGER
            ELSE NULL
        END,
        'portal'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();