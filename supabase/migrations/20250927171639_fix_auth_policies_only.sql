-- Fix auth.users policies without touching table permissions
-- This works within Supabase's permission model

-- First, check what policies exist and remove potentially problematic ones
DO $$
DECLARE
    pol record;
BEGIN
    -- List and drop existing custom policies on auth.users
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'auth' AND tablename = 'users'
        AND policyname NOT LIKE 'Enable%'  -- Keep Supabase default policies
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON auth.users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Test if we can create a user now
DO $$
BEGIN
  BEGIN
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
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test-minimal-fix@example.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"test": true}'
    );

    -- Clean up immediately
    DELETE FROM auth.users WHERE email = 'test-minimal-fix@example.com';

    RAISE NOTICE 'SUCCESS: User creation is now working!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'STILL FAILING: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  END;
END $$;