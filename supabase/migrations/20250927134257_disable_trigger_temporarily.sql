-- Temporarily disable the trigger to test signup without it
-- This will help us isolate if the trigger is causing the 500 error

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;