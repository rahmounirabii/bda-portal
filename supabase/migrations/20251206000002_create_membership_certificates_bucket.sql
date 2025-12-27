-- Migration: Create membership-certificates storage bucket
-- Date: 2025-12-06
-- Description: Creates storage bucket for professional membership certificate PDFs
-- Related: US3 - Display Membership Certificate (Professional Only)

-- Create the membership-certificates bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('membership-certificates', 'membership-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for membership-certificates bucket

-- Allow authenticated users to read their own membership certificates
CREATE POLICY "Users can view own membership certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-certificates'
  AND EXISTS (
    SELECT 1 FROM public.user_memberships um
    WHERE um.user_id = auth.uid()
    AND um.certificate_url = name
  )
);

-- Allow service role to upload membership certificates
CREATE POLICY "Service role can upload membership certificates"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'membership-certificates');

-- Allow service role to update membership certificates (for re-issue)
CREATE POLICY "Service role can update membership certificates"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'membership-certificates');

-- Allow service role to delete membership certificates
CREATE POLICY "Service role can delete membership certificates"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'membership-certificates');

-- Allow admins to manage all membership certificates
CREATE POLICY "Admins can manage membership certificates"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'membership-certificates'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

SELECT '✅ Membership certificates storage bucket created successfully!' as status;
