-- ============================================================================
-- FIX PARTNER RECORDS - PRODUCTION DATABASE
-- ============================================================================
-- This script fixes the issue where partner users exist in the users table
-- but don't have corresponding records in the partners table.
--
-- ISSUE: Partners show in /admin/users but not in /admin/pdp-management
--        or /admin/ecp-management
--
-- SOLUTION:
-- 1. Create partner records for all orphaned partner users
-- 2. Create partner profiles for PDP partners
-- 3. Add trigger to prevent this issue in the future
--
-- SAFE TO RUN: This script uses INSERT ... ON CONFLICT DO NOTHING
--              to avoid duplicate records.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Report current state
-- ============================================================================
DO $$
DECLARE
  v_total_partner_users INTEGER;
  v_orphaned_users INTEGER;
  v_pdp_users INTEGER;
  v_ecp_users INTEGER;
BEGIN
  -- Count total partner users
  SELECT COUNT(*)
  INTO v_total_partner_users
  FROM public.users
  WHERE role IN ('pdp_partner', 'ecp_partner');

  -- Count orphaned partner users (no partner record)
  SELECT COUNT(*)
  INTO v_orphaned_users
  FROM public.users u
  LEFT JOIN public.partners p ON p.id = u.id
  WHERE u.role IN ('pdp_partner', 'ecp_partner')
    AND p.id IS NULL;

  -- Count by type
  SELECT COUNT(*)
  INTO v_pdp_users
  FROM public.users u
  LEFT JOIN public.partners p ON p.id = u.id
  WHERE u.role = 'pdp_partner'
    AND p.id IS NULL;

  SELECT COUNT(*)
  INTO v_ecp_users
  FROM public.users u
  LEFT JOIN public.partners p ON p.id = u.id
  WHERE u.role = 'ecp_partner'
    AND p.id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT STATE:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total partner users: %', v_total_partner_users;
  RAISE NOTICE 'Orphaned partner users: %', v_orphaned_users;
  RAISE NOTICE '  - PDP partners: %', v_pdp_users;
  RAISE NOTICE '  - ECP partners: %', v_ecp_users;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 2: Create partner records for orphaned users
-- ============================================================================
DO $$
DECLARE
  v_user RECORD;
  v_partner_type TEXT;
  v_created_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Creating partner records...';

  -- Process each partner user that doesn't have a partner record
  FOR v_user IN
    SELECT
      u.id,
      u.email,
      u.role,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_active,
      u.created_at
    FROM public.users u
    LEFT JOIN public.partners p ON p.id = u.id
    WHERE u.role IN ('pdp_partner', 'ecp_partner')
      AND p.id IS NULL
    ORDER BY u.role, u.email
  LOOP
    -- Determine partner type from role
    IF v_user.role = 'pdp_partner' THEN
      v_partner_type := 'pdp';
    ELSIF v_user.role = 'ecp_partner' THEN
      v_partner_type := 'ecp';
    ELSE
      CONTINUE;
    END IF;

    -- Create partner record
    INSERT INTO public.partners (
      id,
      partner_type,
      company_name,
      company_name_ar,
      contact_person,
      contact_email,
      contact_phone,
      country,
      city,
      address,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      v_partner_type,
      COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Organization'),
      NULL,
      COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Contact'),
      v_user.email,
      v_user.phone,
      NULL,
      NULL,
      NULL,
      v_user.is_active,
      v_user.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    v_created_count := v_created_count + 1;

    RAISE NOTICE '  ✓ Created partner record: % (%, %)',
      v_user.email, v_user.role, v_partner_type;

    -- Create PDP partner profile if PDP
    IF v_partner_type = 'pdp' THEN
      INSERT INTO public.pdp_partner_profiles (
        partner_id,
        organization_name,
        legal_name,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        created_at,
        updated_at
      ) VALUES (
        v_user.id,
        COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Organization'),
        COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Organization'),
        COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Contact'),
        v_user.email,
        v_user.phone,
        NOW(),
        NOW()
      )
      ON CONFLICT (partner_id) DO NOTHING;

      RAISE NOTICE '    ✓ Created PDP partner profile';
    END IF;

  END LOOP;

  RAISE NOTICE 'Created % partner records', v_created_count;
END $$;

-- ============================================================================
-- STEP 3: Create auto-create trigger for future
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_partner_record ON public.users;
DROP FUNCTION IF EXISTS auto_create_partner_record();

-- Create function to auto-create partner records
CREATE OR REPLACE FUNCTION auto_create_partner_record()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_type TEXT;
  v_partner_exists BOOLEAN;
BEGIN
  -- Only proceed if role is a partner role
  IF NEW.role NOT IN ('pdp_partner', 'ecp_partner') THEN
    RETURN NEW;
  END IF;

  -- Check if partner record already exists
  SELECT EXISTS(SELECT 1 FROM public.partners WHERE id = NEW.id)
  INTO v_partner_exists;

  IF v_partner_exists THEN
    RETURN NEW;
  END IF;

  -- Determine partner type
  IF NEW.role = 'pdp_partner' THEN
    v_partner_type := 'pdp';
  ELSIF NEW.role = 'ecp_partner' THEN
    v_partner_type := 'ecp';
  END IF;

  -- Create partner record
  INSERT INTO public.partners (
    id,
    partner_type,
    company_name,
    company_name_ar,
    contact_person,
    contact_email,
    contact_phone,
    country,
    city,
    address,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_partner_type,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Partner Organization'),
    NULL,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Partner Contact'),
    NEW.email,
    NEW.phone,
    NULL,
    NULL,
    NULL,
    NEW.is_active,
    NOW(),
    NOW()
  );

  -- Create PDP partner profile if PDP
  IF v_partner_type = 'pdp' THEN
    INSERT INTO public.pdp_partner_profiles (
      partner_id,
      organization_name,
      legal_name,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Partner Organization'),
      COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Partner Organization'),
      COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Partner Contact'),
      NEW.email,
      NEW.phone,
      NOW(),
      NOW()
    )
    ON CONFLICT (partner_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER auto_create_partner_record
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partner_record();

DO $$
BEGIN
  RAISE NOTICE 'Created auto_create_partner_record trigger';
END $$;

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================
DO $$
DECLARE
  v_orphaned_count INTEGER;
  v_total_partners INTEGER;
  v_pdp_count INTEGER;
  v_ecp_count INTEGER;
BEGIN
  -- Count orphaned users
  SELECT COUNT(*)
  INTO v_orphaned_count
  FROM public.users u
  LEFT JOIN public.partners p ON p.id = u.id
  WHERE u.role IN ('pdp_partner', 'ecp_partner')
    AND p.id IS NULL;

  -- Count total partners
  SELECT COUNT(*)
  INTO v_total_partners
  FROM public.partners;

  -- Count by type
  SELECT COUNT(*)
  INTO v_pdp_count
  FROM public.partners
  WHERE partner_type = 'pdp';

  SELECT COUNT(*)
  INTO v_ecp_count
  FROM public.partners
  WHERE partner_type = 'ecp';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STATE:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total partners in partners table: %', v_total_partners;
  RAISE NOTICE '  - PDP partners: %', v_pdp_count;
  RAISE NOTICE '  - ECP partners: %', v_ecp_count;
  RAISE NOTICE 'Orphaned partner users: %', v_orphaned_count;
  RAISE NOTICE '========================================';

  IF v_orphaned_count > 0 THEN
    RAISE WARNING 'Still have % orphaned partner users!', v_orphaned_count;
  ELSE
    RAISE NOTICE '✓ SUCCESS: All partner users have corresponding partner records';
  END IF;
END $$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCRIPT COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Check /admin/dashboard - partners should now appear';
  RAISE NOTICE '2. Check /admin/pdp-management - PDP partners should be listed';
  RAISE NOTICE '3. Check /admin/ecp-management - ECP partners should be listed';
  RAISE NOTICE '4. Trigger is now active - future partner users will auto-create partner records';
  RAISE NOTICE '========================================';
END $$;
