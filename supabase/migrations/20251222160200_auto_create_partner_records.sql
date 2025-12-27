-- ============================================================================
-- Auto-Create Partner Records
-- ============================================================================
-- This migration creates a trigger to automatically create partner records
-- when a user's role is changed to pdp_partner or ecp_partner.
-- This prevents the orphaned partner user issue.

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

  RAISE NOTICE 'Auto-created partner record for user: % (role: %)', NEW.email, NEW.role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER auto_create_partner_record
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partner_record();

COMMENT ON FUNCTION auto_create_partner_record() IS 'Automatically creates partner records when a user is assigned a partner role';
COMMENT ON TRIGGER auto_create_partner_record ON public.users IS 'Ensures partner records are created for partner users';
