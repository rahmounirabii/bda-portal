-- =============================================================================
-- ECP Toolkit Items Table
-- =============================================================================

-- Create helper function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.ecp_toolkit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('logos', 'templates', 'guidelines', 'marketing', 'social_media')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category queries
CREATE INDEX IF NOT EXISTS idx_ecp_toolkit_category ON public.ecp_toolkit_items(category);
CREATE INDEX IF NOT EXISTS idx_ecp_toolkit_active ON public.ecp_toolkit_items(is_active);

-- Updated at trigger
DROP TRIGGER IF EXISTS set_ecp_toolkit_items_updated_at ON public.ecp_toolkit_items;
CREATE TRIGGER set_ecp_toolkit_items_updated_at
  BEFORE UPDATE ON public.ecp_toolkit_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.ecp_toolkit_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active toolkit items (partners need access)
DROP POLICY IF EXISTS ecp_toolkit_read_policy ON public.ecp_toolkit_items;
CREATE POLICY ecp_toolkit_read_policy ON public.ecp_toolkit_items
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage toolkit items
DROP POLICY IF EXISTS ecp_toolkit_admin_policy ON public.ecp_toolkit_items;
CREATE POLICY ecp_toolkit_admin_policy ON public.ecp_toolkit_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- =============================================================================
-- Sample ECP Toolkit Items
-- =============================================================================

INSERT INTO public.ecp_toolkit_items (category, title, description, file_url, file_type, file_size, sort_order) VALUES
  -- Logos
  ('logos', 'BDA Logo - Full Color', 'Official BDA logo in full color for marketing materials', '/assets/toolkit/bda-logo-color.svg', 'svg', 25600, 1),
  ('logos', 'BDA Logo - White', 'White version for use on dark backgrounds', '/assets/toolkit/bda-logo-white.svg', 'svg', 24500, 2),
  ('logos', 'ECP Partner Badge', 'Official ECP Partner certification badge', '/assets/toolkit/ecp-partner-badge.svg', 'svg', 32000, 3),
  ('logos', 'CP Certification Logo', 'Logo for Certified Professional program', '/assets/toolkit/cp-logo.svg', 'svg', 28000, 4),
  ('logos', 'SCP Certification Logo', 'Logo for Senior Certified Professional program', '/assets/toolkit/scp-logo.svg', 'svg', 29000, 5),

  -- Templates
  ('templates', 'Training Certificate Template', 'Certificate of completion template for training programs', '/assets/toolkit/certificate-template.pptx', 'pptx', 3276800, 1),
  ('templates', 'Training Flyer Template', 'Promotional flyer template for upcoming trainings', '/assets/toolkit/flyer-template.pptx', 'pptx', 2867200, 2),
  ('templates', 'Email Signature Template', 'Official email signature with ECP badge', '/assets/toolkit/email-signature.html', 'html', 15360, 3),
  ('templates', 'PowerPoint Template', 'Branded presentation template for training materials', '/assets/toolkit/ppt-template.pptx', 'pptx', 5529600, 4),

  -- Guidelines
  ('guidelines', 'Brand Guidelines', 'Complete BDA brand usage guidelines', '/assets/toolkit/brand-guidelines.pdf', 'pdf', 8388608, 1),
  ('guidelines', 'Logo Usage Guidelines', 'Rules for logo placement and sizing', '/assets/toolkit/logo-guidelines.pdf', 'pdf', 2150400, 2),
  ('guidelines', 'Co-Branding Policy', 'Guidelines for using BDA and partner logos together', '/assets/toolkit/cobranding-policy.pdf', 'pdf', 1536000, 3),

  -- Social Media
  ('social_media', 'LinkedIn Banner', 'Company page banner with ECP branding', '/assets/toolkit/linkedin-banner.png', 'png', 1126400, 1),
  ('social_media', 'Instagram Post Templates', 'Set of post templates for promotions', '/assets/toolkit/instagram-templates.zip', 'zip', 12800000, 2),
  ('social_media', 'Facebook Cover', 'Facebook page cover image', '/assets/toolkit/facebook-cover.png', 'png', 870400, 3),
  ('social_media', 'Twitter/X Header', 'Twitter profile header image', '/assets/toolkit/twitter-header.png', 'png', 634880, 4)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.ecp_toolkit_items IS 'ECP partner toolkit resources - logos, templates, guidelines';
