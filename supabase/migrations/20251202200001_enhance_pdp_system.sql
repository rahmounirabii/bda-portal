-- Migration: Enhance PDP (Professional Development Provider) System
-- Date: 2025-12-02
-- Description: Enhanced schema for PDP partner management with BoCK competency mapping

-- =============================================================================
-- TABLE: bock_competencies (BDA Body of Knowledge)
-- The 14 BoCK competencies for PDP program alignment
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bock_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'BC01', 'BC02'
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  domain TEXT NOT NULL, -- e.g., 'Planning', 'Analysis', 'Solution Evaluation'
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed BoCK competencies (14 competencies from BDA BoCK®)
INSERT INTO public.bock_competencies (code, name, domain, sort_order) VALUES
  ('BC01', 'Business Analysis Planning', 'Planning', 1),
  ('BC02', 'Stakeholder Engagement', 'Planning', 2),
  ('BC03', 'Requirements Elicitation', 'Elicitation', 3),
  ('BC04', 'Requirements Analysis', 'Analysis', 4),
  ('BC05', 'Requirements Modeling', 'Analysis', 5),
  ('BC06', 'Requirements Specification', 'Analysis', 6),
  ('BC07', 'Requirements Validation', 'Analysis', 7),
  ('BC08', 'Solution Assessment', 'Solution Evaluation', 8),
  ('BC09', 'Business Process Analysis', 'Solution Evaluation', 9),
  ('BC10', 'Data Analysis', 'Solution Evaluation', 10),
  ('BC11', 'Enterprise Analysis', 'Strategy', 11),
  ('BC12', 'Strategic Planning', 'Strategy', 12),
  ('BC13', 'Change Management', 'Implementation', 13),
  ('BC14', 'Professional Development', 'Professional', 14)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- ALTER pdp_programs: Add enhanced fields
-- =============================================================================

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Program status for approval workflow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'status') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired'));
  END IF;

  -- Learning outcomes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'learning_outcomes') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN learning_outcomes TEXT[];
  END IF;

  -- Duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'duration_hours') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN duration_hours INTEGER;
  END IF;

  -- Delivery mode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'delivery_mode') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN delivery_mode VARCHAR(20) DEFAULT 'in_person' CHECK (delivery_mode IN ('in_person', 'online', 'hybrid', 'self_paced'));
  END IF;

  -- Target audience
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'target_audience') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN target_audience TEXT;
  END IF;

  -- Prerequisites
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'prerequisites') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN prerequisites TEXT;
  END IF;

  -- Review notes (for admin feedback)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'review_notes') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN review_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'reviewed_by') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN reviewed_by UUID REFERENCES public.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'reviewed_at') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================================================
-- TABLE: pdp_program_competencies
-- Mapping between programs and BoCK competencies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_program_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.pdp_programs(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.bock_competencies(id) ON DELETE CASCADE,
  relevance_level VARCHAR(10) NOT NULL DEFAULT 'primary' CHECK (relevance_level IN ('primary', 'secondary', 'supporting')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(program_id, competency_id)
);

-- =============================================================================
-- TABLE: pdp_program_slots
-- Slot management for controlling program availability
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_program_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.pdp_programs(id) ON DELETE CASCADE,

  -- Slot configuration
  total_slots INTEGER NOT NULL,
  used_slots INTEGER NOT NULL DEFAULT 0,
  available_slots INTEGER GENERATED ALWAYS AS (total_slots - used_slots) STORED,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Pricing (if applicable)
  slot_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_slots CHECK (used_slots >= 0 AND used_slots <= total_slots),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- =============================================================================
-- TABLE: pdp_program_enrollments
-- Participants enrolled in PDP programs
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.pdp_programs(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.pdp_program_slots(id) ON DELETE SET NULL,

  -- Participant info
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,

  -- Enrollment details
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date DATE,

  -- PDC credits
  pdc_credits_earned INTEGER,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'cancelled')),

  -- Certificate
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number VARCHAR(50),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: pdp_annual_reports
-- Annual compliance reports submitted by PDP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_annual_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Report period
  report_year INTEGER NOT NULL,

  -- Metrics
  total_programs INTEGER NOT NULL DEFAULT 0,
  total_enrollments INTEGER NOT NULL DEFAULT 0,
  total_completions INTEGER NOT NULL DEFAULT 0,
  total_pdc_credits_issued INTEGER NOT NULL DEFAULT 0,

  -- Satisfaction metrics
  average_satisfaction_score DECIMAL(3,2),
  completion_rate DECIMAL(5,2),

  -- Report content
  summary TEXT,
  challenges TEXT,
  improvements_planned TEXT,

  -- Attachments
  report_file_url TEXT,
  supporting_documents JSONB DEFAULT '[]',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),

  -- Review
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Audit
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(partner_id, report_year)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_bock_competencies_domain ON public.bock_competencies(domain);
CREATE INDEX IF NOT EXISTS idx_bock_competencies_active ON public.bock_competencies(is_active);

CREATE INDEX IF NOT EXISTS idx_pdp_program_competencies_program ON public.pdp_program_competencies(program_id);
CREATE INDEX IF NOT EXISTS idx_pdp_program_competencies_competency ON public.pdp_program_competencies(competency_id);

CREATE INDEX IF NOT EXISTS idx_pdp_program_slots_program ON public.pdp_program_slots(program_id);
CREATE INDEX IF NOT EXISTS idx_pdp_program_slots_period ON public.pdp_program_slots(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pdp_program_slots_active ON public.pdp_program_slots(is_active);

CREATE INDEX IF NOT EXISTS idx_pdp_enrollments_program ON public.pdp_program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_pdp_enrollments_user ON public.pdp_program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_pdp_enrollments_status ON public.pdp_program_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_pdp_reports_partner ON public.pdp_annual_reports(partner_id);
CREATE INDEX IF NOT EXISTS idx_pdp_reports_year ON public.pdp_annual_reports(report_year);
CREATE INDEX IF NOT EXISTS idx_pdp_reports_status ON public.pdp_annual_reports(status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.bock_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_program_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_program_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_annual_reports ENABLE ROW LEVEL SECURITY;

-- Everyone can view BoCK competencies
CREATE POLICY "Anyone can view competencies"
  ON public.bock_competencies FOR SELECT
  TO authenticated
  USING (is_active = true);

-- PDP partners can manage their program competencies
CREATE POLICY "PDP partners can view program competencies"
  ON public.pdp_program_competencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_competencies.program_id
      AND (p.provider_id = auth.uid() OR p.is_active = true)
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "PDP partners can manage their program competencies"
  ON public.pdp_program_competencies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_competencies.program_id AND p.provider_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_competencies.program_id AND p.provider_id = auth.uid()
    )
  );

-- PDP partners can manage their program slots
CREATE POLICY "PDP partners can view their slots"
  ON public.pdp_program_slots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_slots.program_id AND p.provider_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "PDP partners can manage their slots"
  ON public.pdp_program_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_slots.program_id AND p.provider_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_slots.program_id AND p.provider_id = auth.uid()
    )
  );

-- PDP partners can manage enrollments
CREATE POLICY "PDP partners can view their enrollments"
  ON public.pdp_program_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_enrollments.program_id AND p.provider_id = auth.uid()
    )
    OR pdp_program_enrollments.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "PDP partners can manage their enrollments"
  ON public.pdp_program_enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_enrollments.program_id AND p.provider_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdp_programs p
      WHERE p.id = pdp_program_enrollments.program_id AND p.provider_id = auth.uid()
    )
  );

-- PDP partners can manage their annual reports
CREATE POLICY "PDP partners can view their reports"
  ON public.pdp_annual_reports FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "PDP partners can manage their reports"
  ON public.pdp_annual_reports FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage competencies"
  ON public.bock_competencies FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all program competencies"
  ON public.pdp_program_competencies FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all slots"
  ON public.pdp_program_slots FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all enrollments"
  ON public.pdp_program_enrollments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all reports"
  ON public.pdp_annual_reports FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_pdp_program_slots_updated_at
  BEFORE UPDATE ON public.pdp_program_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdp_enrollments_updated_at
  BEFORE UPDATE ON public.pdp_program_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdp_reports_updated_at
  BEFORE UPDATE ON public.pdp_annual_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate unique program ID
CREATE OR REPLACE FUNCTION generate_pdp_program_id(p_provider_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_provider_code TEXT;
  v_sequence INTEGER;
  v_year TEXT;
BEGIN
  -- Get provider company initials
  SELECT UPPER(SUBSTRING(COALESCE(company_name, 'PDP') FROM 1 FOR 3))
  INTO v_provider_code
  FROM public.users WHERE id = p_provider_id;

  -- Get current year
  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(program_id FROM LENGTH(program_id) - 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.pdp_programs
  WHERE provider_id = p_provider_id
    AND program_id LIKE 'PDC-' || v_provider_code || '-' || v_year || '-%';

  RETURN 'PDC-' || v_provider_code || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Get PDP partner dashboard stats
CREATE OR REPLACE FUNCTION get_pdp_dashboard_stats(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_programs', (SELECT COUNT(*) FROM public.pdp_programs WHERE provider_id = p_partner_id),
    'active_programs', (SELECT COUNT(*) FROM public.pdp_programs WHERE provider_id = p_partner_id AND is_active = true AND status = 'approved'),
    'pending_programs', (SELECT COUNT(*) FROM public.pdp_programs WHERE provider_id = p_partner_id AND status IN ('submitted', 'under_review')),
    'total_enrollments', (
      SELECT COUNT(*) FROM public.pdp_program_enrollments e
      JOIN public.pdp_programs p ON p.id = e.program_id
      WHERE p.provider_id = p_partner_id
    ),
    'completions', (
      SELECT COUNT(*) FROM public.pdp_program_enrollments e
      JOIN public.pdp_programs p ON p.id = e.program_id
      WHERE p.provider_id = p_partner_id AND e.status = 'completed'
    ),
    'total_pdc_credits', (
      SELECT COALESCE(SUM(e.pdc_credits_earned), 0) FROM public.pdp_program_enrollments e
      JOIN public.pdp_programs p ON p.id = e.program_id
      WHERE p.provider_id = p_partner_id AND e.status = 'completed'
    ),
    'completion_rate', (
      SELECT CASE
        WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE e.status = 'completed')::DECIMAL / COUNT(*) * 100, 1)
        ELSE NULL
      END
      FROM public.pdp_program_enrollments e
      JOIN public.pdp_programs p ON p.id = e.program_id
      WHERE p.provider_id = p_partner_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ PDP system enhanced successfully!' as status;
