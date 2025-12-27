-- =============================================================================
-- Fix get_pdp_partner_profile RPC function
-- Handle case where partner record doesn't exist in partners table
-- =============================================================================

-- Drop and recreate the function with proper error handling
CREATE OR REPLACE FUNCTION public.get_pdp_partner_profile(p_partner_id UUID)
RETURNS public.pdp_partner_profiles AS $$
DECLARE
  v_profile public.pdp_partner_profiles;
  v_user public.users;
  v_partner public.partners;
BEGIN
  -- First, try to get existing profile
  SELECT * INTO v_profile
  FROM public.pdp_partner_profiles
  WHERE partner_id = p_partner_id;

  -- If profile exists, return it
  IF v_profile IS NOT NULL THEN
    RETURN v_profile;
  END IF;

  -- Check if partner record exists in partners table
  SELECT * INTO v_partner FROM public.partners WHERE id = p_partner_id;

  -- If no partner record exists, we cannot create a profile (FK constraint)
  -- Return NULL instead of throwing an error
  IF v_partner IS NULL THEN
    -- Try to find partner by looking up the user and checking if they have a partner record
    SELECT p.* INTO v_partner
    FROM public.partners p
    JOIN public.users u ON p.contact_email = u.email
    WHERE u.id = p_partner_id
    LIMIT 1;

    -- Still no partner found, return NULL
    IF v_partner IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Get user info for defaults
  SELECT * INTO v_user FROM public.users WHERE id = p_partner_id;

  -- Create the profile with the partner_id from partners table
  INSERT INTO public.pdp_partner_profiles (
    partner_id,
    organization_name,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    country,
    timezone
  ) VALUES (
    v_partner.id,
    COALESCE(v_partner.company_name, v_user.organization, v_user.company_name),
    COALESCE(v_partner.contact_person, v_user.first_name || ' ' || v_user.last_name, ''),
    COALESCE(v_partner.contact_email, v_user.email),
    COALESCE(v_partner.contact_phone, v_user.phone),
    COALESCE(v_partner.country, v_user.country_code),
    COALESCE(v_user.timezone, 'UTC')
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Partner doesn't exist in partners table, return NULL
    RETURN NULL;
  WHEN unique_violation THEN
    -- Profile was created by another process, fetch it
    SELECT * INTO v_profile
    FROM public.pdp_partner_profiles
    WHERE partner_id = p_partner_id OR partner_id = v_partner.id;
    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_pdp_partner_profile(UUID) IS 'Get or create PDP partner profile. Returns NULL if partner record does not exist in partners table.';
