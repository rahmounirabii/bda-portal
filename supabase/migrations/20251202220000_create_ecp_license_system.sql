-- Migration: Create ECP License Management System
-- Date: 2025-12-02
-- Description: Tables for managing ECP partner licenses, agreements, renewal requests, and documents

-- =============================================================================
-- TABLE: ecp_licenses
-- Main license information for ECP partners
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference (user with ecp_partner role)
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- License identification
  license_number VARCHAR(50) UNIQUE NOT NULL,
  partner_code VARCHAR(20) NOT NULL, -- e.g., ECP-EG-001

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended', 'pending_renewal')),

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  last_renewal_date DATE,

  -- Licensed scope
  territories TEXT[] NOT NULL DEFAULT '{}', -- Countries/regions
  programs certification_type[] NOT NULL DEFAULT '{CP}', -- CP, SCP

  -- Agreement
  agreement_signed_date DATE,
  agreement_document_url TEXT,

  -- Renewal tracking
  renewal_requested BOOLEAN NOT NULL DEFAULT false,
  renewal_requested_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),

  UNIQUE(partner_id)
);

-- =============================================================================
-- TABLE: ecp_license_requests
-- Requests for license renewals or scope updates
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_license_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- License reference
  license_id UUID NOT NULL REFERENCES public.ecp_licenses(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Request type
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('renewal', 'scope_update', 'territory_expansion', 'program_addition')),

  -- Request details
  description TEXT NOT NULL,

  -- For scope updates
  requested_territories TEXT[],
  requested_programs certification_type[],

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
-- TABLE: ecp_license_documents
-- Documents associated with ECP licenses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_license_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- License reference
  license_id UUID NOT NULL REFERENCES public.ecp_licenses(id) ON DELETE CASCADE,

  -- Document info
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'license_agreement',
    'brand_guidelines',
    'training_standards',
    'compliance_checklist',
    'renewal_contract',
    'amendment',
    'other'
  )),

  title TEXT NOT NULL,
  description TEXT,

  -- File
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  -- Version tracking
  version VARCHAR(20) DEFAULT '1.0',
  is_current BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id)
);

-- =============================================================================
-- TABLE: ecp_license_terms
-- License terms and conditions (can be shown to partners)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_license_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Term info
  term_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'training_delivery_rights'
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,

  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: ecp_compliance_requirements
-- Compliance requirements that partners must meet
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ecp_compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Requirement info
  requirement_key VARCHAR(100) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ecp_licenses_partner ON public.ecp_licenses(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_licenses_status ON public.ecp_licenses(status);
CREATE INDEX IF NOT EXISTS idx_ecp_licenses_expiry ON public.ecp_licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ecp_license_requests_license ON public.ecp_license_requests(license_id);
CREATE INDEX IF NOT EXISTS idx_ecp_license_requests_partner ON public.ecp_license_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_ecp_license_requests_status ON public.ecp_license_requests(status);
CREATE INDEX IF NOT EXISTS idx_ecp_license_documents_license ON public.ecp_license_documents(license_id);
CREATE INDEX IF NOT EXISTS idx_ecp_license_documents_type ON public.ecp_license_documents(document_type);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.ecp_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_license_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_license_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecp_compliance_requirements ENABLE ROW LEVEL SECURITY;

-- ECP Licenses policies
CREATE POLICY "ECP partners can view their own license"
  ON public.ecp_licenses FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all licenses"
  ON public.ecp_licenses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- License requests policies
CREATE POLICY "ECP partners can view their own requests"
  ON public.ecp_license_requests FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "ECP partners can create requests"
  ON public.ecp_license_requests FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "ECP partners can update their pending requests"
  ON public.ecp_license_requests FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid() AND status = 'pending')
  WITH CHECK (partner_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all requests"
  ON public.ecp_license_requests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- License documents policies
CREATE POLICY "ECP partners can view documents for their license"
  ON public.ecp_license_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ecp_licenses l
      WHERE l.id = ecp_license_documents.license_id
      AND l.partner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all documents"
  ON public.ecp_license_documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- License terms - everyone can view active terms
CREATE POLICY "Anyone can view active license terms"
  ON public.ecp_license_terms FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage license terms"
  ON public.ecp_license_terms FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Compliance requirements - everyone can view active requirements
CREATE POLICY "Anyone can view active compliance requirements"
  ON public.ecp_compliance_requirements FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage compliance requirements"
  ON public.ecp_compliance_requirements FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_ecp_licenses_updated_at ON public.ecp_licenses;
CREATE TRIGGER update_ecp_licenses_updated_at
  BEFORE UPDATE ON public.ecp_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecp_license_requests_updated_at ON public.ecp_license_requests;
CREATE TRIGGER update_ecp_license_requests_updated_at
  BEFORE UPDATE ON public.ecp_license_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecp_license_terms_updated_at ON public.ecp_license_terms;
CREATE TRIGGER update_ecp_license_terms_updated_at
  BEFORE UPDATE ON public.ecp_license_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION: Auto-update license status based on expiry
-- =============================================================================

CREATE OR REPLACE FUNCTION update_license_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on expiry date
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN
    NEW.status := 'expiring_soon';
  ELSIF NEW.status NOT IN ('suspended', 'pending_renewal') THEN
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_license_status ON public.ecp_licenses;
CREATE TRIGGER auto_update_license_status
  BEFORE INSERT OR UPDATE OF expiry_date ON public.ecp_licenses
  FOR EACH ROW EXECUTE FUNCTION update_license_status();

-- =============================================================================
-- FUNCTION: Generate license number
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_license_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(license_number FROM 'BDA-ECP-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.ecp_licenses
  WHERE license_number LIKE 'BDA-ECP-' || v_year || '-%';

  RETURN 'BDA-ECP-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Get license info for partner
-- =============================================================================

CREATE OR REPLACE FUNCTION get_partner_license_info(p_partner_id UUID)
RETURNS JSON AS $$
DECLARE
  v_license RECORD;
  v_documents JSON;
  v_terms JSON;
  v_compliance JSON;
  v_pending_requests JSON;
  v_result JSON;
BEGIN
  -- Get license
  SELECT * INTO v_license
  FROM public.ecp_licenses
  WHERE partner_id = p_partner_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No license found for this partner');
  END IF;

  -- Get documents
  SELECT json_agg(json_build_object(
    'id', d.id,
    'document_type', d.document_type,
    'title', d.title,
    'description', d.description,
    'file_url', d.file_url,
    'file_name', d.file_name,
    'version', d.version,
    'uploaded_at', d.uploaded_at
  ) ORDER BY d.document_type, d.uploaded_at DESC)
  INTO v_documents
  FROM public.ecp_license_documents d
  WHERE d.license_id = v_license.id AND d.is_current = true;

  -- Get terms
  SELECT json_agg(json_build_object(
    'id', t.id,
    'term_key', t.term_key,
    'title', t.title,
    'description', t.description
  ) ORDER BY t.display_order)
  INTO v_terms
  FROM public.ecp_license_terms t
  WHERE t.is_active = true;

  -- Get compliance requirements
  SELECT json_agg(json_build_object(
    'id', c.id,
    'requirement_key', c.requirement_key,
    'title', c.title,
    'description', c.description
  ) ORDER BY c.display_order)
  INTO v_compliance
  FROM public.ecp_compliance_requirements c
  WHERE c.is_active = true;

  -- Get pending requests
  SELECT json_agg(json_build_object(
    'id', r.id,
    'request_type', r.request_type,
    'description', r.description,
    'status', r.status,
    'created_at', r.created_at
  ) ORDER BY r.created_at DESC)
  INTO v_pending_requests
  FROM public.ecp_license_requests r
  WHERE r.partner_id = p_partner_id AND r.status IN ('pending', 'under_review');

  -- Build result
  SELECT json_build_object(
    'id', v_license.id,
    'license_number', v_license.license_number,
    'partner_code', v_license.partner_code,
    'status', v_license.status,
    'issue_date', v_license.issue_date,
    'expiry_date', v_license.expiry_date,
    'last_renewal_date', v_license.last_renewal_date,
    'territories', v_license.territories,
    'programs', v_license.programs,
    'agreement_signed_date', v_license.agreement_signed_date,
    'agreement_document_url', v_license.agreement_document_url,
    'renewal_requested', v_license.renewal_requested,
    'renewal_requested_at', v_license.renewal_requested_at,
    'documents', COALESCE(v_documents, '[]'::json),
    'terms', COALESCE(v_terms, '[]'::json),
    'compliance_requirements', COALESCE(v_compliance, '[]'::json),
    'pending_requests', COALESCE(v_pending_requests, '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SEED DATA: Default license terms
-- =============================================================================

INSERT INTO public.ecp_license_terms (term_key, title, title_ar, description, description_ar, display_order) VALUES
('training_delivery_rights', 'Training Delivery Rights', 'حقوق تقديم التدريب',
 'Authorized to deliver official BDA certification training programs within licensed territories.',
 'مخول بتقديم برامج التدريب الرسمية لشهادات BDA ضمن المناطق المرخصة.', 1),
('use_bda_branding', 'Use of BDA Branding', 'استخدام علامة BDA التجارية',
 'Licensed to use BDA and ECP logos in marketing materials according to brand guidelines.',
 'مرخص باستخدام شعارات BDA و ECP في المواد التسويقية وفقًا لإرشادات العلامة التجارية.', 2),
('exam_administration', 'Exam Administration', 'إدارة الامتحانات',
 'Authorized to purchase and distribute exam vouchers to registered candidates.',
 'مخول بشراء وتوزيع قسائم الامتحانات للمرشحين المسجلين.', 3),
('certified_trainer_assignment', 'Certified Trainer Assignment', 'تعيين المدربين المعتمدين',
 'Must use only BDA-approved Certified Trainers for all training deliveries.',
 'يجب استخدام المدربين المعتمدين من BDA فقط لجميع التدريبات.', 4)
ON CONFLICT (term_key) DO NOTHING;

-- =============================================================================
-- SEED DATA: Default compliance requirements
-- =============================================================================

INSERT INTO public.ecp_compliance_requirements (requirement_key, title, title_ar, description, description_ar, display_order) VALUES
('quarterly_reports', 'Submit quarterly activity reports', 'تقديم تقارير النشاط الربع سنوية',
 'Partners must submit activity reports every quarter detailing trainings delivered and candidates enrolled.',
 'يجب على الشركاء تقديم تقارير النشاط كل ربع سنة توضح التدريبات المقدمة والمرشحين المسجلين.', 1),
('pass_rate_standards', 'Maintain minimum pass rate standards', 'الحفاظ على الحد الأدنى من معايير معدل النجاح',
 'Training programs must maintain a minimum candidate pass rate as specified in the agreement.',
 'يجب أن تحافظ برامج التدريب على الحد الأدنى لمعدل نجاح المرشحين كما هو محدد في الاتفاقية.', 2),
('approved_materials', 'Use only approved training materials', 'استخدام المواد التدريبية المعتمدة فقط',
 'All training must use official BDA-approved curriculum and materials.',
 'يجب أن تستخدم جميع التدريبات المنهج والمواد المعتمدة رسميًا من BDA.', 3),
('training_reporting', 'Report all training deliveries within 14 days', 'الإبلاغ عن جميع التدريبات خلال 14 يومًا',
 'All training deliveries must be reported in the portal within 14 days of completion.',
 'يجب الإبلاغ عن جميع التدريبات في البوابة خلال 14 يومًا من الانتهاء.', 4)
ON CONFLICT (requirement_key) DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ ECP License system created successfully!' as status;
