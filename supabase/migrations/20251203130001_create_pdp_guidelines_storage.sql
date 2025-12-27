-- Migration: Create PDP Guidelines Storage Bucket
-- Date: 2025-12-03
-- Description: Create Supabase Storage bucket for PDP guideline documents

-- Create storage bucket for pdp-guidelines
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdp-guidelines', 'pdp-guidelines', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects

-- Allow PDP partners and admins to read/download guidelines
DROP POLICY IF EXISTS "PDP partners can download guidelines" ON storage.objects;
CREATE POLICY "PDP partners can download guidelines"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pdp-guidelines' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('pdp_partner', 'pdp', 'admin', 'super_admin')
    )
  );

-- Allow admins to upload guidelines
DROP POLICY IF EXISTS "Admins can upload pdp guidelines" ON storage.objects;
CREATE POLICY "Admins can upload pdp guidelines"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pdp-guidelines' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to update guidelines
DROP POLICY IF EXISTS "Admins can update pdp guidelines" ON storage.objects;
CREATE POLICY "Admins can update pdp guidelines"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pdp-guidelines' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete guidelines
DROP POLICY IF EXISTS "Admins can delete pdp guidelines" ON storage.objects;
CREATE POLICY "Admins can delete pdp guidelines"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pdp-guidelines' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Verification
SELECT '✅ PDP Guidelines storage bucket created with RLS policies!' as status;
