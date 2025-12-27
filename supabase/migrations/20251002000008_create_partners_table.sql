-- Migration: Create Partners Table
-- Date: 2025-10-02
-- Description: Create partners table for ECP and PDP partner management

-- Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type TEXT NOT NULL CHECK (partner_type IN ('ecp', 'pdp')),
  company_name TEXT NOT NULL,
  company_name_ar TEXT,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  website TEXT,
  industry TEXT,
  description TEXT,
  description_ar TEXT,
  license_number TEXT,
  license_valid_from DATE,
  license_valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index on partner_type
CREATE INDEX idx_partners_type ON public.partners(partner_type);
CREATE INDEX idx_partners_active ON public.partners(is_active);
CREATE INDEX idx_partners_created_at ON public.partners(created_at);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view active partners
CREATE POLICY "Anyone can view active partners"
  ON public.partners
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can view all partners
CREATE POLICY "Admins can view all partners"
  ON public.partners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can insert partners
CREATE POLICY "Admins can insert partners"
  ON public.partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update partners
CREATE POLICY "Admins can update partners"
  ON public.partners
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

-- Admins can delete partners
CREATE POLICY "Admins can delete partners"
  ON public.partners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Verification
SELECT '✅ Partners table created successfully!' as status;
