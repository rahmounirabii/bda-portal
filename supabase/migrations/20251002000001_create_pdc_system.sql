-- Migration: Create PDC (Professional Development Credits) System
-- Date: 2025-10-02
-- Description: Tables for PDC management and tracking

-- =============================================================================
-- TYPES ENUM
-- =============================================================================

CREATE TYPE pdc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE pdc_activity_type AS ENUM (
  'training_course',
  'conference',
  'workshop',
  'webinar',
  'self_study',
  'teaching',
  'publication',
  'volunteer_work',
  'other'
);

-- =============================================================================
-- TABLE: pdp_programs
-- Approved programs from PDP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Program information
  program_id VARCHAR(50) UNIQUE NOT NULL, -- Public Program ID for user entry
  program_name TEXT NOT NULL,
  program_name_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- Provider
  provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- PDP partner
  provider_name TEXT NOT NULL,

  -- PDC configuration
  max_pdc_credits INTEGER NOT NULL, -- Maximum credits available
  activity_type pdc_activity_type NOT NULL DEFAULT 'training_course',

  -- BoCK alignment
  bock_domain TEXT[], -- Related BoCK domains

  -- Validity
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_credits CHECK (max_pdc_credits > 0 AND max_pdc_credits <= 100),
  CONSTRAINT valid_dates CHECK (valid_until >= valid_from)
);

-- Indexes
CREATE INDEX idx_pdp_programs_program_id ON public.pdp_programs(program_id);
CREATE INDEX idx_pdp_programs_provider ON public.pdp_programs(provider_id);
CREATE INDEX idx_pdp_programs_active ON public.pdp_programs(is_active);
CREATE INDEX idx_pdp_programs_validity ON public.pdp_programs(valid_from, valid_until);

-- =============================================================================
-- TABLE: pdc_entries
-- User PDC submissions and claims
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdc_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and certification
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  certification_id UUID, -- References future certifications table
  certification_type certification_type NOT NULL,

  -- Activity details
  program_id VARCHAR(50), -- References pdp_programs.program_id (nullable for manual entries)
  activity_type pdc_activity_type NOT NULL,
  activity_title TEXT NOT NULL,
  activity_title_ar TEXT,
  activity_description TEXT,

  -- Credits
  credits_claimed INTEGER NOT NULL,
  credits_approved INTEGER,

  -- Dates
  activity_date DATE NOT NULL,
  submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Documentation
  certificate_url TEXT, -- Upload proof (Supabase Storage)
  notes TEXT,

  -- Status
  status pdc_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_credits_claimed CHECK (credits_claimed > 0 AND credits_claimed <= 100),
  CONSTRAINT valid_credits_approved CHECK (credits_approved IS NULL OR (credits_approved >= 0 AND credits_approved <= credits_claimed)),
  CONSTRAINT valid_activity_date CHECK (activity_date <= CURRENT_DATE)
);

-- Indexes
CREATE INDEX idx_pdc_entries_user ON public.pdc_entries(user_id);
CREATE INDEX idx_pdc_entries_certification ON public.pdc_entries(certification_id);
CREATE INDEX idx_pdc_entries_program ON public.pdc_entries(program_id);
CREATE INDEX idx_pdc_entries_status ON public.pdc_entries(status);
CREATE INDEX idx_pdc_entries_submitted ON public.pdc_entries(submission_date);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger for updated_at on pdp_programs
CREATE TRIGGER update_pdp_programs_updated_at
  BEFORE UPDATE ON public.pdp_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on pdc_entries
CREATE TRIGGER update_pdc_entries_updated_at
  BEFORE UPDATE ON public.pdc_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.pdp_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdc_entries ENABLE ROW LEVEL SECURITY;

-- Policies: pdp_programs
CREATE POLICY "Anyone can view active programs"
ON public.pdp_programs FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "PDP partners can manage their programs"
ON public.pdp_programs FOR ALL
TO authenticated
USING (
  provider_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Policies: pdc_entries
CREATE POLICY "Users can view their own PDC entries"
ON public.pdc_entries FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can create their own PDC entries"
ON public.pdc_entries FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending PDC entries"
ON public.pdc_entries FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all PDC entries"
ON public.pdc_entries FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

/**
 * Get user's total approved PDC credits for a certification
 */
CREATE OR REPLACE FUNCTION get_user_pdc_total(
  p_user_id UUID,
  p_certification_type certification_type
)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(credits_approved)
      FROM public.pdc_entries
      WHERE user_id = p_user_id
        AND certification_type = p_certification_type
        AND status = 'approved'
        AND activity_date >= (CURRENT_DATE - INTERVAL '3 years')
    ),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Validate program ID and get max credits
 */
CREATE OR REPLACE FUNCTION validate_program_id(p_program_id VARCHAR)
RETURNS TABLE (
  is_valid BOOLEAN,
  max_credits INTEGER,
  program_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.pdp_programs
      WHERE program_id = p_program_id
        AND is_active = true
        AND CURRENT_DATE BETWEEN valid_from AND valid_until
    ) as is_valid,
    pdp_programs.max_pdc_credits,
    pdp_programs.program_name
  FROM public.pdp_programs
  WHERE program_id = p_program_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.pdp_programs IS 'Approved PDC programs from PDP partners';
COMMENT ON TABLE public.pdc_entries IS 'User PDC submissions and claims';
COMMENT ON FUNCTION get_user_pdc_total IS 'Calculate total approved PDC credits for user in last 3 years';
COMMENT ON FUNCTION validate_program_id IS 'Validate program ID and return details';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ PDC system created successfully!' as status;
