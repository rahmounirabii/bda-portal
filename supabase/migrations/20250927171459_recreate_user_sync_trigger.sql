-- Recreate user sync trigger after fixing auth.users creation
-- This will automatically create public.users entries when auth.users are created

-- 1. Create the trigger function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
    COALESCE(
      (NEW.raw_user_meta_data->>'bda_role')::user_role,
      (NEW.raw_user_meta_data->>'role')::user_role,
      'individual'
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

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. Test the complete flow
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  BEGIN
    -- Generate a test user ID
    test_user_id := gen_random_uuid();

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
      'test-sync@example.com',
      crypt('testpassword123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"first_name": "Test", "last_name": "User", "bda_role": "individual", "created_from": "portal"}'
    );

    -- Check if public.users was created
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
      RAISE NOTICE 'SUCCESS: User sync trigger is working correctly!';
    ELSE
      RAISE NOTICE 'WARNING: User was created in auth.users but not synced to public.users';
    END IF;

    -- Clean up test data
    DELETE FROM public.users WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST FAILED: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  END;
END $$;