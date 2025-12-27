-- Migration: Create Storage Bucket for Identity Documents
-- Date: 2025-11-05
-- Description: Creates storage bucket with RLS policies for identity documents

-- Note: Supabase storage buckets and policies are managed separately
-- This file documents the required configuration

-- ============================================================================
-- Storage Bucket Configuration (via Supabase Dashboard or API)
-- ============================================================================

-- Bucket name: identity-documents
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf

-- This migration creates the necessary RLS policies for the bucket
-- The bucket itself must be created via Supabase Dashboard

-- ============================================================================
-- Storage RLS Policies
-- ============================================================================

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload own identity documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'identity-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can read their own documents
CREATE POLICY "Users can view own identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'identity-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own documents (for resubmission)
CREATE POLICY "Users can update own identity documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'identity-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own documents
CREATE POLICY "Users can delete own identity documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'identity-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Admins can read all documents
CREATE POLICY "Admins can view all identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'identity-documents' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Storage policies created for identity-documents bucket';
    RAISE NOTICE '📝 Manual step required:';
    RAISE NOTICE '   Create storage bucket "identity-documents" via Supabase Dashboard:';
    RAISE NOTICE '   - Navigate to Storage in Supabase Dashboard';
    RAISE NOTICE '   - Click "New bucket"';
    RAISE NOTICE '   - Name: identity-documents';
    RAISE NOTICE '   - Public: false';
    RAISE NOTICE '   - File size limit: 10485760 (10MB)';
    RAISE NOTICE '   - Allowed MIME types: image/jpeg,image/png,image/webp,application/pdf';
END $$;

SELECT '✅ Storage RLS Policies Created' as status;
