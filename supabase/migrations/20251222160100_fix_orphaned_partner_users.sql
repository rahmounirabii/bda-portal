-- ============================================================================
-- Fix Orphaned Partner Users
-- ============================================================================
-- This migration creates partner records for users with pdp_partner or ecp_partner
-- roles that don't have corresponding records in the partners table.
-- This fixes the issue where partners show in /admin/users but not in
-- /admin/pdp-management or /admin/ecp-management

DO $$
DECLARE
  v_user RECORD;
  v_partner_type TEXT;
BEGIN
  -- Process each partner user that doesn't have a partner record
  FOR v_user IN
    SELECT
      u.id,
      u.email,
      u.role,
      u.first_name,
      u.last_name,
      u.created_at
    FROM public.users u
    LEFT JOIN public.partners p ON p.id = u.id
    WHERE u.role IN ('pdp_partner', 'ecp_partner')
      AND p.id IS NULL
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
      NULL,
      NULL,
      NULL,
      NULL,
      true,
      v_user.created_at,
      NOW()
    );

    RAISE NOTICE 'Created partner record for user: % (%, %)',
      v_user.email, v_user.role, v_partner_type;

    -- Create PDP partner profile if PDP
    IF v_partner_type = 'pdp' THEN
      INSERT INTO public.pdp_partner_profiles (
        partner_id,
        organization_name,
        legal_name,
        primary_contact_name,
        primary_contact_email,
        created_at,
        updated_at
      ) VALUES (
        v_user.id,
        COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Organization'),
        COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Organization'),
        COALESCE(v_user.first_name || ' ' || v_user.last_name, 'Partner Contact'),
        v_user.email,
        NOW(),
        NOW()
      )
      ON CONFLICT (partner_id) DO NOTHING;

      RAISE NOTICE 'Created PDP partner profile for user: %', v_user.email;
    END IF;

  END LOOP;

  RAISE NOTICE 'Migration completed: All orphaned partner users now have partner records';
END $$;

-- Verify the fix
DO $$
DECLARE
  v_orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_orphaned_count
  FROM public.users u
  LEFT JOIN public.partners p ON p.id = u.id
  WHERE u.role IN ('pdp_partner', 'ecp_partner')
    AND p.id IS NULL;

  IF v_orphaned_count > 0 THEN
    RAISE WARNING 'Still have % orphaned partner users!', v_orphaned_count;
  ELSE
    RAISE NOTICE 'All partner users have corresponding partner records ✓';
  END IF;
END $$;
