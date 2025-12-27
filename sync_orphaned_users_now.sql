-- Immediately sync all orphaned users from auth.users to public.users
-- Run this in Supabase SQL Editor

-- Insert all orphaned users from auth.users into public.users
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
  COALESCE(au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', au.raw_user_meta_data->>'lastName', ''),
  COALESCE(
    (au.raw_user_meta_data->>'bda_role')::user_role,
    (au.raw_user_meta_data->>'role')::user_role,
    'individual'
  ),
  COALESCE((au.raw_user_meta_data->>'wp_user_id')::integer, NULL),
  COALESCE(au.raw_user_meta_data->>'created_from', 'portal'),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL  -- Only users that don't exist in public.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
  last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
  role = COALESCE(EXCLUDED.role, public.users.role),
  wp_user_id = COALESCE(EXCLUDED.wp_user_id, public.users.wp_user_id),
  updated_at = NOW();

-- Show the results
SELECT
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id as public_id,
  pu.first_name,
  pu.last_name,
  pu.role,
  pu.wp_user_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;