-- Migration: Create certificates storage bucket
-- Date: 2025-11-27
-- Description: Creates storage bucket for certificate PDFs

-- Create the certificates bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('certificates', 'certificates')
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certificates bucket

-- Allow authenticated users to read their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (storage.foldername(name))[1] = 'certificates'
  AND EXISTS (
    SELECT 1 FROM public.user_certifications uc
    WHERE uc.user_id = auth.uid()
    AND uc.certificate_url LIKE '%' || name
  )
);

-- Allow service role to upload certificates
CREATE POLICY "Service role can upload certificates"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'certificates');

-- Allow service role to update certificates
CREATE POLICY "Service role can update certificates"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'certificates');

-- Allow admins to manage all certificates
CREATE POLICY "Admins can manage certificates"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'certificates'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

SELECT '✅ Certificates storage bucket created successfully!' as status;
