-- Fix ALL orphaned users in auth.users that don't have corresponding entries in public.users
-- This fixes the 406 error when loading profiles

-- First, let's see how many orphaned users we have
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;

  RAISE NOTICE 'Found % orphaned users in auth.users', orphan_count;
END $$;

-- Insert all orphaned users into public.users
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  role,
  wp_user_id,
  organization,
  signup_type,
  created_from,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', au.raw_user_meta_data->>'lastName', ''),
  COALESCE(
    (au.raw_user_meta_data->>'bda_role')::user_role,
    (au.raw_user_meta_data->>'role')::user_role,
    'individual'
  ),
  CASE
    WHEN au.raw_user_meta_data->>'wp_user_id' IS NOT NULL
    THEN (au.raw_user_meta_data->>'wp_user_id')::INTEGER
    WHEN au.raw_user_meta_data->>'wpUserId' IS NOT NULL
    THEN (au.raw_user_meta_data->>'wpUserId')::INTEGER
    ELSE NULL
  END,
  au.raw_user_meta_data->>'organization',
  COALESCE(
    au.raw_user_meta_data->>'signup_type',
    au.raw_user_meta_data->>'signupType',
    'portal-only'
  ),
  COALESCE(au.raw_user_meta_data->>'created_from', 'portal'),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
  last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
  role = COALESCE(EXCLUDED.role, public.users.role),
  wp_user_id = COALESCE(EXCLUDED.wp_user_id, public.users.wp_user_id),
  updated_at = NOW();

-- Count how many were fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM auth.users au
  INNER JOIN public.users pu ON au.id = pu.id;

  RAISE NOTICE 'Successfully synced % users between auth.users and public.users', fixed_count;
END $$;

-- Also update any existing users that might have missing data
UPDATE public.users pu
SET
  first_name = COALESCE(pu.first_name, au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'firstName', ''),
  last_name = COALESCE(pu.last_name, au.raw_user_meta_data->>'last_name', au.raw_user_meta_data->>'lastName', ''),
  wp_user_id = COALESCE(
    pu.wp_user_id,
    CASE
      WHEN au.raw_user_meta_data->>'wp_user_id' IS NOT NULL
      THEN (au.raw_user_meta_data->>'wp_user_id')::INTEGER
      WHEN au.raw_user_meta_data->>'wpUserId' IS NOT NULL
      THEN (au.raw_user_meta_data->>'wpUserId')::INTEGER
      ELSE NULL
    END
  ),
  updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
  AND (pu.first_name = '' OR pu.last_name = '' OR pu.first_name IS NULL OR pu.last_name IS NULL);