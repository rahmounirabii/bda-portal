-- =============================================================================
-- PDP Partner Profiles Table
-- Extended profile information for PDP partners
-- =============================================================================

-- Create the pdp_partner_profiles table
CREATE TABLE IF NOT EXISTS public.pdp_partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- Organization Info
  organization_name VARCHAR(255),
  legal_name VARCHAR(255),
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  year_established INTEGER,
  website VARCHAR(500),
  description TEXT,

  -- Address
  street_address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Primary Contact
  primary_contact_name VARCHAR(255),
  primary_contact_title VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),

  -- Billing Contact
  billing_contact_name VARCHAR(255),
  billing_contact_email VARCHAR(255),
  billing_contact_phone VARCHAR(50),

  -- Specializations (stored as JSONB arrays)
  specializations JSONB DEFAULT '[]'::jsonb,
  delivery_methods JSONB DEFAULT '[]'::jsonb,
  target_audiences JSONB DEFAULT '[]'::jsonb,

  -- Social Media
  linkedin_url VARCHAR(500),
  twitter_url VARCHAR(500),
  facebook_url VARCHAR(500),

  -- Branding
  logo_url VARCHAR(500),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pdp_partner_profiles_partner_id ON public.pdp_partner_profiles(partner_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_pdp_partner_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pdp_partner_profiles_updated_at ON public.pdp_partner_profiles;
CREATE TRIGGER set_pdp_partner_profiles_updated_at
  BEFORE UPDATE ON public.pdp_partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_pdp_partner_profiles_updated_at();

-- Enable RLS
ALTER TABLE public.pdp_partner_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can view their own profile
DROP POLICY IF EXISTS pdp_partner_profiles_view_own ON public.pdp_partner_profiles;
CREATE POLICY pdp_partner_profiles_view_own ON public.pdp_partner_profiles
  FOR SELECT
  USING (partner_id = auth.uid());

-- Policy: Partners can update their own profile
DROP POLICY IF EXISTS pdp_partner_profiles_update_own ON public.pdp_partner_profiles;
CREATE POLICY pdp_partner_profiles_update_own ON public.pdp_partner_profiles
  FOR UPDATE
  USING (partner_id = auth.uid());

-- Policy: Partners can insert their own profile
DROP POLICY IF EXISTS pdp_partner_profiles_insert_own ON public.pdp_partner_profiles;
CREATE POLICY pdp_partner_profiles_insert_own ON public.pdp_partner_profiles
  FOR INSERT
  WITH CHECK (partner_id = auth.uid());

-- Policy: Admins can view all profiles
DROP POLICY IF EXISTS pdp_partner_profiles_admin_view ON public.pdp_partner_profiles;
CREATE POLICY pdp_partner_profiles_admin_view ON public.pdp_partner_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can manage all profiles
DROP POLICY IF EXISTS pdp_partner_profiles_admin_manage ON public.pdp_partner_profiles;
CREATE POLICY pdp_partner_profiles_admin_manage ON public.pdp_partner_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- Function to get or create PDP partner profile
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_pdp_partner_profile(p_partner_id UUID)
RETURNS public.pdp_partner_profiles AS $$
DECLARE
  v_profile public.pdp_partner_profiles;
  v_user public.users;
BEGIN
  -- Try to get existing profile
  SELECT * INTO v_profile
  FROM public.pdp_partner_profiles
  WHERE partner_id = p_partner_id;

  -- If no profile exists, create one with defaults from users table
  IF v_profile IS NULL THEN
    SELECT * INTO v_user FROM public.users WHERE id = p_partner_id;

    INSERT INTO public.pdp_partner_profiles (
      partner_id,
      organization_name,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      country,
      timezone
    ) VALUES (
      p_partner_id,
      COALESCE(v_user.organization, v_user.company_name),
      COALESCE(v_user.first_name || ' ' || v_user.last_name, ''),
      v_user.email,
      v_user.phone,
      v_user.country_code,
      COALESCE(v_user.timezone, 'UTC')
    )
    RETURNING * INTO v_profile;
  END IF;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_pdp_partner_profile(UUID) TO authenticated;

COMMENT ON TABLE public.pdp_partner_profiles IS 'Extended profile information for PDP partners including organization details, contacts, and specializations';
