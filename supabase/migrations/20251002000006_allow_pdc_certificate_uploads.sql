-- Migration: Allow PDC Certificate Uploads
-- Date: 2025-10-02
-- Description: Add RLS policy to allow authenticated users to upload PDC certificates

-- Allow authenticated users to upload their PDC certificates to pdc-certificates folder
CREATE POLICY "Users can upload PDC certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resources' AND
    (storage.foldername(name))[1] = 'pdc-certificates'
  );

-- Verification
SELECT '✅ PDC certificate upload policy created!' as status;
