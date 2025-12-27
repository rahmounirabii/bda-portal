-- Re-enable the fixed trigger and also fix existing users without public.users entry
-- This fixes the 406 error when loading profile

-- First, insert any missing users from auth.users into public.users
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  role,
  wp_user_id,
  created_from,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  COALESCE((au.raw_user_meta_data->>'bda_role')::user_role, 'individual'),
  (au.raw_user_meta_data->>'wp_user_id')::INTEGER,
  'portal',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the fixed trigger function
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
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    wp_user_id = COALESCE(EXCLUDED.wp_user_id, public.users.wp_user_id),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();