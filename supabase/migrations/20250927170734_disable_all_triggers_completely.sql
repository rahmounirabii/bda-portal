-- Disable ALL triggers to allow account creation
-- This is temporary to diagnose the issue

-- Drop all triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Drop all trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_deleted_user() CASCADE;

-- List remaining triggers (should be empty)
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false;

-- Notify that triggers are disabled
DO $$
BEGIN
  RAISE NOTICE 'All auth.users triggers have been disabled';
END $$;