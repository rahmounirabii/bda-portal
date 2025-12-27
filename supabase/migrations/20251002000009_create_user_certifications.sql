-- Migration: Create User Certifications Table
-- Date: 2025-10-02
-- Description: Track user's earned certifications (CP™, SCP™)

-- =============================================================================
-- TABLE: user_certifications
-- Stores user's earned certifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Certification details
    certification_type certification_type NOT NULL,
    credential_id TEXT NOT NULL UNIQUE, -- Format: CP-2024-XXXX or SCP-2024-XXXX

    -- Exam/Quiz reference
    quiz_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,

    -- Dates
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),

    -- Certificate
    certificate_url TEXT, -- PDF certificate stored in Supabase Storage

    -- Renewal tracking
    renewal_count INTEGER NOT NULL DEFAULT 0,
    last_renewed_at TIMESTAMPTZ,
    pdc_credits_earned INTEGER DEFAULT 0, -- PDCs earned for this certification period

    -- Admin notes
    notes TEXT,
    revocation_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT valid_dates CHECK (expiry_date > issued_date),
    CONSTRAINT valid_renewal_count CHECK (renewal_count >= 0),
    CONSTRAINT valid_pdc_credits CHECK (pdc_credits_earned >= 0)
);

-- Indexes
CREATE INDEX idx_user_certifications_user ON public.user_certifications(user_id);
CREATE INDEX idx_user_certifications_type ON public.user_certifications(certification_type);
CREATE INDEX idx_user_certifications_credential ON public.user_certifications(credential_id);
CREATE INDEX idx_user_certifications_status ON public.user_certifications(status);
CREATE INDEX idx_user_certifications_expiry ON public.user_certifications(expiry_date);
CREATE INDEX idx_user_certifications_issued ON public.user_certifications(issued_date);

-- Comments
COMMENT ON TABLE public.user_certifications IS 'User earned certifications (CP™, SCP™)';
COMMENT ON COLUMN public.user_certifications.credential_id IS 'Unique credential ID (e.g., CP-2024-1234)';
COMMENT ON COLUMN public.user_certifications.pdc_credits_earned IS 'PDC credits earned during current certification period';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own certifications
CREATE POLICY "Users can view their own certifications"
  ON public.user_certifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all certifications
CREATE POLICY "Admins can view all certifications"
  ON public.user_certifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can insert certifications
CREATE POLICY "Admins can insert certifications"
  ON public.user_certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update certifications
CREATE POLICY "Admins can update certifications"
  ON public.user_certifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can delete certifications
CREATE POLICY "Admins can delete certifications"
  ON public.user_certifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to generate credential ID
CREATE OR REPLACE FUNCTION generate_credential_id(cert_type certification_type)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year TEXT;
    sequence_num INTEGER;
    credential TEXT;
BEGIN
    -- Get prefix based on type
    prefix := CASE
        WHEN cert_type = 'CP' THEN 'CP'
        WHEN cert_type = 'SCP' THEN 'SCP'
        ELSE 'CERT'
    END;

    -- Get current year
    year := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year and type
    SELECT COALESCE(MAX(CAST(SUBSTRING(credential_id FROM '\d{4}$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.user_certifications
    WHERE credential_id LIKE prefix || '-' || year || '-%';

    -- Format: CP-2024-0001
    credential := prefix || '-' || year || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN credential;
END;
$$ LANGUAGE plpgsql;

-- Function to check if certification is expiring soon (within 60 days)
CREATE OR REPLACE FUNCTION is_certification_expiring_soon(cert_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    days_until_expiry INTEGER;
BEGIN
    SELECT DATE_PART('day', expiry_date - CURRENT_DATE)::INTEGER
    INTO days_until_expiry
    FROM public.user_certifications
    WHERE id = cert_id;

    RETURN days_until_expiry IS NOT NULL AND days_until_expiry <= 60 AND days_until_expiry > 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_certifications_updated_at
    BEFORE UPDATE ON public.user_certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_user_certifications_updated_at();

-- Verification
SELECT '✅ User certifications table created successfully!' as status;
