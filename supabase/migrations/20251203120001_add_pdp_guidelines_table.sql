-- =============================================================================
-- PDP Guidelines Documents Table
-- Downloadable resources for PDP partners: policies, templates, logo usage, etc.
-- =============================================================================

-- Create category enum type
DO $$ BEGIN
  CREATE TYPE pdp_guideline_category AS ENUM (
    'policy',
    'template',
    'guide',
    'logo',
    'format'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the pdp_guidelines table
CREATE TABLE IF NOT EXISTS public.pdp_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document Info
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'guide',

  -- File Info
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- pdf, doc, xlsx, png, etc.
  file_size INTEGER, -- in bytes

  -- Metadata
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false, -- Required reading for partners
  sort_order INTEGER DEFAULT 0,

  -- Tracking
  download_count INTEGER DEFAULT 0,
  last_updated_by UUID REFERENCES public.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pdp_guidelines_category ON public.pdp_guidelines(category);
CREATE INDEX IF NOT EXISTS idx_pdp_guidelines_active ON public.pdp_guidelines(is_active);
CREATE INDEX IF NOT EXISTS idx_pdp_guidelines_sort ON public.pdp_guidelines(sort_order);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_pdp_guidelines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pdp_guidelines_updated_at ON public.pdp_guidelines;
CREATE TRIGGER set_pdp_guidelines_updated_at
  BEFORE UPDATE ON public.pdp_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION update_pdp_guidelines_updated_at();

-- Enable RLS
ALTER TABLE public.pdp_guidelines ENABLE ROW LEVEL SECURITY;

-- Policy: PDP partners can view active guidelines
DROP POLICY IF EXISTS pdp_guidelines_partner_view ON public.pdp_guidelines;
CREATE POLICY pdp_guidelines_partner_view ON public.pdp_guidelines
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('pdp_partner', 'admin', 'super_admin')
    )
  );

-- Policy: Admins can manage all guidelines
DROP POLICY IF EXISTS pdp_guidelines_admin_manage ON public.pdp_guidelines;
CREATE POLICY pdp_guidelines_admin_manage ON public.pdp_guidelines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_guideline_download(p_guideline_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.pdp_guidelines
  SET download_count = download_count + 1
  WHERE id = p_guideline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_guideline_download(UUID) TO authenticated;

-- =============================================================================
-- Seed initial guideline documents
-- =============================================================================

INSERT INTO public.pdp_guidelines (title, description, category, file_url, file_name, file_type, version, is_required, sort_order)
VALUES
  -- Policy Documents
  ('PDP Partner Agreement', 'Official partnership agreement and terms of service for PDP partners', 'policy', '/documents/pdp/PDP_Partner_Agreement.pdf', 'PDP_Partner_Agreement.pdf', 'pdf', '2.0', true, 1),
  ('PDP Accreditation Policy', 'Complete policy for program accreditation requirements and procedures', 'policy', '/documents/pdp/PDP_Accreditation_Policy.pdf', 'PDP_Accreditation_Policy.pdf', 'pdf', '1.5', true, 2),
  ('Quality Assurance Standards', 'Standards and requirements for maintaining program quality', 'policy', '/documents/pdp/Quality_Assurance_Standards.pdf', 'Quality_Assurance_Standards.pdf', 'pdf', '1.2', false, 3),
  ('PDC Audit Procedures', 'Procedures for PDC verification and compliance audits', 'policy', '/documents/pdp/PDC_Audit_Procedures.pdf', 'PDC_Audit_Procedures.pdf', 'pdf', '1.0', false, 4),

  -- Templates
  ('Program Submission Template', 'Standard template for submitting new programs for accreditation', 'template', '/documents/pdp/Program_Submission_Template.docx', 'Program_Submission_Template.docx', 'doc', '2.1', false, 1),
  ('PDC Credit Calculation Worksheet', 'Excel template for calculating Professional Development Credits', 'template', '/documents/pdp/PDC_Calculation_Worksheet.xlsx', 'PDC_Calculation_Worksheet.xlsx', 'xlsx', '1.3', false, 2),
  ('Annual Report Template', 'Template for submitting annual partner reports', 'template', '/documents/pdp/Annual_Report_Template.docx', 'Annual_Report_Template.docx', 'doc', '1.1', false, 3),
  ('Participant Feedback Form', 'Standard feedback form template for program participants', 'template', '/documents/pdp/Participant_Feedback_Form.docx', 'Participant_Feedback_Form.docx', 'doc', '1.0', false, 4),

  -- Guides
  ('BoCK Competency Alignment Guide', 'How to map your program content to BDA Body of Competency & Knowledge', 'guide', '/documents/pdp/BoCK_Alignment_Guide.pdf', 'BoCK_Alignment_Guide.pdf', 'pdf', '3.0', true, 1),
  ('Program ID Format Specification', 'Technical specification for program ID generation and format', 'format', '/documents/pdp/Program_ID_Format_Spec.pdf', 'Program_ID_Format_Spec.pdf', 'pdf', '1.0', false, 2),
  ('Partner Onboarding Guide', 'Step-by-step guide for new PDP partners', 'guide', '/documents/pdp/Partner_Onboarding_Guide.pdf', 'Partner_Onboarding_Guide.pdf', 'pdf', '2.0', true, 3),

  -- Logo & Brand Assets
  ('BDA Logo Usage Guidelines', 'Rules and guidelines for using BDA logos and branding', 'logo', '/documents/pdp/BDA_Logo_Guidelines.pdf', 'BDA_Logo_Guidelines.pdf', 'pdf', '1.5', true, 1),
  ('PDP Partner Badge Package', 'Official PDP partner badges in various formats (PNG, SVG, EPS)', 'logo', '/documents/pdp/PDP_Badge_Package.zip', 'PDP_Badge_Package.zip', 'zip', '1.2', false, 2),
  ('Co-Branding Guidelines', 'Guidelines for co-branding materials with BDA', 'logo', '/documents/pdp/Co_Branding_Guidelines.pdf', 'Co_Branding_Guidelines.pdf', 'pdf', '1.0', false, 3)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.pdp_guidelines IS 'Downloadable guideline documents for PDP partners including policies, templates, and logo usage';
