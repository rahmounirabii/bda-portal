-- Temporarily disable ALL triggers to test if signup works without them
-- This will help identify if the trigger is causing the signup failure

-- Disable the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Log that triggers are disabled
DO $$
BEGIN
  RAISE NOTICE 'All signup triggers have been disabled for testing';
END $$;