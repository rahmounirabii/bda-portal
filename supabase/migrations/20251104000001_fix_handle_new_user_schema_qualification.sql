-- Fix handle_new_user() function to use proper schema qualification
-- This fixes the "type 'user_role' does not exist" error that occurs when
-- the trigger executes in the auth schema context but references unqualified types

-- 1. Drop and recreate the trigger function with proper schema qualification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
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
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', ''),
    -- FIX: Explicitly qualify user_role type with public schema
    COALESCE(
      (NEW.raw_user_meta_data->>'bda_role')::public.user_role,
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'individual'::public.user_role
    ),
    COALESCE((NEW.raw_user_meta_data->>'wp_user_id')::integer, NULL),
    COALESCE(NEW.raw_user_meta_data->>'created_from', 'portal'),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    role = COALESCE(EXCLUDED.role, public.users.role),
    wp_user_id = COALESCE(EXCLUDED.wp_user_id, public.users.wp_user_id),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Failed to sync user to public.users: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- 2. Recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure necessary permissions are granted
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. Test the fixed function with a complete signup flow
DO $$
DECLARE
  test_user_id uuid;
  user_exists boolean;
BEGIN
  BEGIN
    -- Generate a test user ID
    test_user_id := gen_random_uuid();

    RAISE NOTICE 'Testing user sync trigger with schema-qualified types...';

    -- Insert into auth.users (this should trigger the sync)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      test_user_id,
      'authenticated',
      'authenticated',
      'test-trigger-fix@example.com',
      crypt('testpassword123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"first_name": "Trigger", "last_name": "Test", "bda_role": "individual", "created_from": "portal"}'::jsonb
    );

    -- Check if public.users was created
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) INTO user_exists;

    IF user_exists THEN
      RAISE NOTICE '✅ SUCCESS: User sync trigger is working correctly with schema-qualified types!';
    ELSE
      RAISE NOTICE '❌ FAILED: User was created in auth.users but not synced to public.users';
    END IF;

    -- Clean up test data
    DELETE FROM public.users WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;

    RAISE NOTICE 'Test cleanup completed';

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST FAILED: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    -- Attempt cleanup even on failure
    BEGIN
      DELETE FROM public.users WHERE id = test_user_id;
      DELETE FROM auth.users WHERE id = test_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignore cleanup errors
    END;
  END;
END $$;
