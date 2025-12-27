-- =============================================================================
-- PDP System Enhancement - Full Spec Implementation
-- =============================================================================
-- This migration enhances the PDP system to match the full specification:
-- - Correct BoCK competencies (14 competencies: 7 behavioral + 7 knowledge)
-- - Program slot control system
-- - PDP license management
-- - Auto-generated Program IDs (PDP-{CountryCode}-{Year}-{Sequence})
-- =============================================================================

-- =============================================================================
-- UPDATE: BoCK Competencies (14 Official BDA BoCK® Competencies)
-- =============================================================================

-- First, clear existing generic competencies and insert correct ones
DELETE FROM public.bock_competencies;

-- Insert the 14 official BDA BoCK® competencies
INSERT INTO public.bock_competencies (code, name, name_ar, description, domain, sort_order) VALUES
  -- Behavioral Competencies (7)
  ('BC01', 'Strategic Leadership', 'القيادة الاستراتيجية',
   'Ability to lead business development initiatives, align teams with organizational goals, and drive strategic outcomes.',
   'Behavioral', 1),
  ('BC02', 'Effective Communication', 'التواصل الفعال',
   'Skills in conveying ideas clearly, active listening, and adapting communication style to different stakeholders.',
   'Behavioral', 2),
  ('BC03', 'Business Acumen', 'الفطنة التجارية',
   'Understanding of business fundamentals, financial principles, and how organizations create value.',
   'Behavioral', 3),
  ('BC04', 'Emotional Intelligence (EQ)', 'الذكاء العاطفي',
   'Self-awareness, empathy, and ability to manage relationships and emotions in professional settings.',
   'Behavioral', 4),
  ('BC05', 'Critical Thinking & Problem Solving', 'التفكير النقدي وحل المشكلات',
   'Analytical skills to evaluate information, identify root causes, and develop effective solutions.',
   'Behavioral', 5),
  ('BC06', 'Consultative Mindset', 'العقلية الاستشارية',
   'Approach to understanding client needs, providing expert guidance, and building trust-based relationships.',
   'Behavioral', 6),
  ('BC07', 'Negotiation & Relationship Management', 'التفاوض وإدارة العلاقات',
   'Skills in negotiating agreements, managing stakeholder expectations, and maintaining long-term partnerships.',
   'Behavioral', 7),

  -- Knowledge-Based Competencies (7)
  ('KC01', 'Growth & Expansion Strategies', 'استراتيجيات النمو والتوسع',
   'Knowledge of methods for business growth, market expansion, and scaling operations.',
   'Knowledge', 8),
  ('KC02', 'Market & Competitive Analysis', 'تحليل السوق والمنافسة',
   'Understanding of market research, competitive intelligence, and industry analysis techniques.',
   'Knowledge', 9),
  ('KC03', 'Innovation in Business Development', 'الابتكار في تطوير الأعمال',
   'Knowledge of innovation frameworks, emerging technologies, and their application to business growth.',
   'Knowledge', 10),
  ('KC04', 'Business Project Management', 'إدارة مشاريع الأعمال',
   'Skills in planning, executing, and delivering business development projects successfully.',
   'Knowledge', 11),
  ('KC05', 'Financial & Pricing Models', 'النماذج المالية والتسعير',
   'Understanding of financial analysis, pricing strategies, and ROI calculation for business decisions.',
   'Knowledge', 12),
  ('KC06', 'Marketing & Sales Strategies', 'استراتيجيات التسويق والمبيعات',
   'Knowledge of marketing principles, sales methodologies, and go-to-market strategies.',
   'Knowledge', 13),
  ('KC07', 'Legal & Compliance in Business Development', 'الجوانب القانونية والامتثال',
   'Understanding of legal considerations, regulatory compliance, and risk management in business development.',
   'Knowledge', 14)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- TABLE: pdp_licenses
-- PDP partner license and slot management
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- License details
  license_number VARCHAR(50) UNIQUE NOT NULL,
  partner_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'PDP-EG-001'

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'pending', 'expiring_soon')),

  -- Validity
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,

  -- Program slot control (critical feature per spec)
  max_programs INTEGER NOT NULL DEFAULT 5, -- Minimum PDP partnership capacity: 5 programs
  programs_used INTEGER NOT NULL DEFAULT 0,
  program_submission_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Agreement
  agreement_signed_date DATE,
  agreement_document_url TEXT,

  -- Renewal
  renewal_requested BOOLEAN NOT NULL DEFAULT false,
  renewal_requested_at TIMESTAMPTZ,

  -- Admin notes
  admin_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(partner_id)
);

-- =============================================================================
-- TABLE: pdp_license_terms
-- Terms and conditions for PDP licenses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_license_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.pdp_licenses(id) ON DELETE CASCADE,

  term_key VARCHAR(100) NOT NULL,
  term_title TEXT NOT NULL,
  term_description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(license_id, term_key)
);

-- =============================================================================
-- TABLE: pdp_license_documents
-- Documents associated with PDP licenses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_license_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.pdp_licenses(id) ON DELETE CASCADE,

  document_type VARCHAR(50) NOT NULL, -- 'agreement', 'certificate', 'compliance_report'
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,

  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id)
);

-- =============================================================================
-- TABLE: pdp_license_requests
-- Requests for license changes (renewal, slot increase, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_license_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.pdp_licenses(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('renewal', 'slot_increase', 'scope_update', 'suspension_appeal')),

  -- Request details
  requested_slots INTEGER, -- For slot increase requests
  current_slots INTEGER,
  justification TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),

  -- Admin response
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: pdp_toolkit_items
-- Downloadable resources for PDP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pdp_toolkit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  category VARCHAR(50) NOT NULL CHECK (category IN ('logos', 'templates', 'guidelines', 'marketing', 'social_media')),
  title TEXT NOT NULL,
  description TEXT,

  file_url TEXT NOT NULL,
  file_type VARCHAR(20), -- 'pdf', 'png', 'svg', 'docx', 'xlsx'
  file_size INTEGER,

  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- UPDATE: pdp_programs - Add country and fix program ID generation
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'country') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN country VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'country_code') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN country_code VARCHAR(3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'delivery_language') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN delivery_language VARCHAR(10) DEFAULT 'en';
  END IF;

  -- Content/Agenda file URL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'agenda_url') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN agenda_url TEXT;
  END IF;

  -- Brochure URL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'brochure_url') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN brochure_url TEXT;
  END IF;

  -- Key topics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'key_topics') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN key_topics TEXT[];
  END IF;

  -- Admin modification tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'edited_by_admin') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN edited_by_admin BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'admin_edited_at') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN admin_edited_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdp_programs' AND column_name = 'removed_by_admin') THEN
    ALTER TABLE public.pdp_programs ADD COLUMN removed_by_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_pdp_licenses_partner ON public.pdp_licenses(partner_id);
CREATE INDEX IF NOT EXISTS idx_pdp_licenses_status ON public.pdp_licenses(status);
CREATE INDEX IF NOT EXISTS idx_pdp_license_terms_license ON public.pdp_license_terms(license_id);
CREATE INDEX IF NOT EXISTS idx_pdp_license_documents_license ON public.pdp_license_documents(license_id);
CREATE INDEX IF NOT EXISTS idx_pdp_license_requests_license ON public.pdp_license_requests(license_id);
CREATE INDEX IF NOT EXISTS idx_pdp_license_requests_status ON public.pdp_license_requests(status);
CREATE INDEX IF NOT EXISTS idx_pdp_toolkit_items_category ON public.pdp_toolkit_items(category);
CREATE INDEX IF NOT EXISTS idx_pdp_toolkit_items_active ON public.pdp_toolkit_items(is_active);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.pdp_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_license_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_license_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdp_toolkit_items ENABLE ROW LEVEL SECURITY;

-- PDP partners can view their own license
CREATE POLICY "PDP partners can view their license"
  ON public.pdp_licenses FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admins can manage all licenses
CREATE POLICY "Admins can manage all pdp licenses"
  ON public.pdp_licenses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- License terms policies
CREATE POLICY "View pdp license terms"
  ON public.pdp_license_terms FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pdp_licenses WHERE id = pdp_license_terms.license_id AND partner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage pdp license terms"
  ON public.pdp_license_terms FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- License documents policies
CREATE POLICY "View pdp license documents"
  ON public.pdp_license_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pdp_licenses WHERE id = pdp_license_documents.license_id AND partner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage pdp license documents"
  ON public.pdp_license_documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- License requests policies
CREATE POLICY "PDP partners can view their requests"
  ON public.pdp_license_requests FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "PDP partners can create requests"
  ON public.pdp_license_requests FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "PDP partners can cancel their pending requests"
  ON public.pdp_license_requests FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid() AND status = 'pending')
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Admins can manage all pdp license requests"
  ON public.pdp_license_requests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Toolkit items - everyone can view active items
CREATE POLICY "Anyone can view active pdp toolkit items"
  ON public.pdp_toolkit_items FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage pdp toolkit items"
  ON public.pdp_toolkit_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_pdp_licenses_updated_at
  BEFORE UPDATE ON public.pdp_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdp_license_requests_updated_at
  BEFORE UPDATE ON public.pdp_license_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdp_toolkit_items_updated_at
  BEFORE UPDATE ON public.pdp_toolkit_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Generate unique PDP program ID per spec: PDP-{CountryCode}-{Year}-{Sequence}
DROP FUNCTION IF EXISTS generate_pdp_program_id(UUID);
DROP FUNCTION IF EXISTS generate_pdp_program_id(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION generate_pdp_program_id(p_provider_id UUID, p_country_code VARCHAR DEFAULT 'XX')
RETURNS TEXT AS $$
DECLARE
  v_sequence INTEGER;
  v_year TEXT;
  v_code VARCHAR(3);
BEGIN
  -- Get current year
  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Use provided country code or default
  v_code := UPPER(COALESCE(p_country_code, 'XX'));

  -- Get next sequence for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(program_id FROM 'PDP-[A-Z]{2,3}-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.pdp_programs
  WHERE program_id LIKE 'PDP-%-' || v_year || '-%';

  -- Generate: PDP-EG-2025-0012
  RETURN 'PDP-' || v_code || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Get PDP license info for a partner
CREATE OR REPLACE FUNCTION get_pdp_license_info(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'license', row_to_json(l),
    'terms', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM public.pdp_license_terms t
      WHERE t.license_id = l.id
    ), '[]'),
    'documents', COALESCE((
      SELECT json_agg(row_to_json(d))
      FROM public.pdp_license_documents d
      WHERE d.license_id = l.id
    ), '[]'),
    'pending_requests', COALESCE((
      SELECT json_agg(row_to_json(r))
      FROM public.pdp_license_requests r
      WHERE r.license_id = l.id AND r.status IN ('pending', 'under_review')
    ), '[]')
  )
  INTO v_result
  FROM public.pdp_licenses l
  WHERE l.partner_id = p_partner_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if PDP can submit more programs (slot control)
CREATE OR REPLACE FUNCTION can_pdp_submit_program(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_license RECORD;
  v_programs_count INTEGER;
BEGIN
  -- Get license
  SELECT * INTO v_license
  FROM public.pdp_licenses
  WHERE partner_id = p_partner_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'can_submit', false,
      'reason', 'No active license found',
      'max_programs', 0,
      'programs_used', 0,
      'remaining_slots', 0
    );
  END IF;

  -- Check if submission is enabled
  IF NOT v_license.program_submission_enabled THEN
    RETURN json_build_object(
      'can_submit', false,
      'reason', 'Program submission is temporarily disabled by BDA',
      'max_programs', v_license.max_programs,
      'programs_used', v_license.programs_used,
      'remaining_slots', v_license.max_programs - v_license.programs_used
    );
  END IF;

  -- Check license status
  IF v_license.status NOT IN ('active', 'expiring_soon') THEN
    RETURN json_build_object(
      'can_submit', false,
      'reason', 'License is not active (status: ' || v_license.status || ')',
      'max_programs', v_license.max_programs,
      'programs_used', v_license.programs_used,
      'remaining_slots', v_license.max_programs - v_license.programs_used
    );
  END IF;

  -- Count actual programs
  SELECT COUNT(*) INTO v_programs_count
  FROM public.pdp_programs
  WHERE provider_id = p_partner_id
    AND status NOT IN ('rejected', 'expired')
    AND removed_by_admin = false;

  -- Update programs_used if different
  IF v_programs_count != v_license.programs_used THEN
    UPDATE public.pdp_licenses SET programs_used = v_programs_count WHERE id = v_license.id;
    v_license.programs_used := v_programs_count;
  END IF;

  -- Check slot availability
  IF v_license.programs_used >= v_license.max_programs THEN
    RETURN json_build_object(
      'can_submit', false,
      'reason', 'Your program capacity is full. Please contact BDA HQ to request additional program slots.',
      'max_programs', v_license.max_programs,
      'programs_used', v_license.programs_used,
      'remaining_slots', 0
    );
  END IF;

  RETURN json_build_object(
    'can_submit', true,
    'reason', null,
    'max_programs', v_license.max_programs,
    'programs_used', v_license.programs_used,
    'remaining_slots', v_license.max_programs - v_license.programs_used
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update programs_used when program is added/removed
CREATE OR REPLACE FUNCTION update_pdp_license_programs_used()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pdp_licenses
    SET programs_used = programs_used + 1
    WHERE partner_id = NEW.provider_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pdp_licenses
    SET programs_used = GREATEST(programs_used - 1, 0)
    WHERE partner_id = OLD.provider_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pdp_license_programs_used ON public.pdp_programs;
CREATE TRIGGER trigger_update_pdp_license_programs_used
  AFTER INSERT OR DELETE ON public.pdp_programs
  FOR EACH ROW EXECUTE FUNCTION update_pdp_license_programs_used();

-- =============================================================================
-- SEED: Default license terms for PDP
-- =============================================================================

-- (Terms will be created when licenses are created)

-- =============================================================================
-- SEED: Sample toolkit items
-- =============================================================================

INSERT INTO public.pdp_toolkit_items (category, title, description, file_url, file_type, sort_order) VALUES
  ('logos', 'PDP Partner Logo (Full Color)', 'Official BDA PDP Partner logo for print and digital use', '/toolkit/pdp-logo-color.png', 'png', 1),
  ('logos', 'PDP Partner Logo (White)', 'White version for dark backgrounds', '/toolkit/pdp-logo-white.png', 'png', 2),
  ('logos', 'PDP Partner Logo (SVG)', 'Scalable vector format for any size', '/toolkit/pdp-logo.svg', 'svg', 3),
  ('templates', 'Program Submission Template', 'Template for documenting program details', '/toolkit/program-submission-template.docx', 'docx', 1),
  ('templates', 'PDC Calculation Worksheet', 'Excel template for calculating PDC credits', '/toolkit/pdc-calculation.xlsx', 'xlsx', 2),
  ('templates', 'Annual Report Template', 'Template for annual compliance reports', '/toolkit/annual-report-template.docx', 'docx', 3),
  ('guidelines', 'BDA Brand Guidelines', 'Official brand usage guidelines', '/toolkit/brand-guidelines.pdf', 'pdf', 1),
  ('guidelines', 'BoCK Competency Guide', 'Detailed guide to the 14 BDA BoCK competencies', '/toolkit/bock-guide.pdf', 'pdf', 2),
  ('guidelines', 'Program Accreditation Handbook', 'Complete guide to getting programs accredited', '/toolkit/accreditation-handbook.pdf', 'pdf', 3),
  ('marketing', 'Partner Marketing Kit', 'Marketing materials for promoting your PDP status', '/toolkit/marketing-kit.zip', 'zip', 1),
  ('social_media', 'Social Media Assets', 'Ready-to-use social media graphics', '/toolkit/social-media-assets.zip', 'zip', 1)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION generate_pdp_program_id(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pdp_license_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_pdp_submit_program(UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ PDP System Enhanced Successfully!' as status;
