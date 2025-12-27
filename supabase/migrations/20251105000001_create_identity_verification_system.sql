-- Migration: Identity Verification System
-- Date: 2025-11-05
-- Description: Implements identity verification workflow for certification compliance
-- Requirements: Candidates must verify identity with government-issued ID (task.md Step 1)

-- ============================================================================
-- 1. Add identity fields to users table
-- ============================================================================

-- Add identity-related fields to existing users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS national_id_number TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS identity_verified_by UUID REFERENCES auth.users(id);

-- Add index for verification status queries
CREATE INDEX IF NOT EXISTS idx_users_identity_verified
ON public.users(identity_verified, identity_verified_at);

-- Add index for identity search (admin)
CREATE INDEX IF NOT EXISTS idx_users_national_id
ON public.users(national_id_number)
WHERE national_id_number IS NOT NULL;

-- Comment
COMMENT ON COLUMN public.users.national_id_number IS 'National ID number for identity verification';
COMMENT ON COLUMN public.users.passport_number IS 'Passport number for identity verification (alternative to national ID)';
COMMENT ON COLUMN public.users.date_of_birth IS 'Date of birth must match government ID';
COMMENT ON COLUMN public.users.nationality IS 'Nationality/citizenship';
COMMENT ON COLUMN public.users.identity_verified IS 'Whether identity has been verified by admin';
COMMENT ON COLUMN public.users.identity_verified_at IS 'Timestamp when identity was verified';
COMMENT ON COLUMN public.users.identity_verified_by IS 'Admin user who verified the identity';

-- ============================================================================
-- 2. Create identity_verifications table
-- ============================================================================

-- Table to track all identity verification attempts and documents
CREATE TABLE IF NOT EXISTS public.identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Verification status
    status TEXT NOT NULL DEFAULT 'pending',
    -- Status values: pending, approved, rejected, requires_resubmission

    -- Document information
    document_type TEXT NOT NULL,
    -- Document types: national_id, passport, drivers_license

    document_number TEXT,
    document_expiry_date DATE,

    -- Uploaded files (Supabase Storage paths)
    document_front_url TEXT,
    document_back_url TEXT,
    selfie_url TEXT,

    -- Verification metadata
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),

    -- Admin notes
    admin_notes TEXT,
    rejection_reason TEXT,

    -- Third-party verification (optional - for future Jumio/Veriff integration)
    external_verification_id TEXT,
    external_verification_status TEXT,
    external_verification_response JSONB,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'requires_resubmission')),
    CONSTRAINT valid_document_type CHECK (document_type IN ('national_id', 'passport', 'drivers_license')),
    CONSTRAINT approved_must_have_reviewer CHECK (
        (status = 'approved' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL) OR
        (status != 'approved')
    ),
    CONSTRAINT rejected_must_have_reason CHECK (
        (status = 'rejected' AND rejection_reason IS NOT NULL) OR
        (status != 'rejected')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id
ON public.identity_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_status
ON public.identity_verifications(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_reviewed_by
ON public.identity_verifications(reviewed_by, reviewed_at DESC);

-- Comments
COMMENT ON TABLE public.identity_verifications IS 'Tracks identity verification attempts and document uploads for compliance';
COMMENT ON COLUMN public.identity_verifications.status IS 'Verification status: pending, approved, rejected, requires_resubmission';
COMMENT ON COLUMN public.identity_verifications.document_type IS 'Type of ID document: national_id, passport, drivers_license';
COMMENT ON COLUMN public.identity_verifications.document_front_url IS 'Supabase Storage path to front of ID document';
COMMENT ON COLUMN public.identity_verifications.document_back_url IS 'Supabase Storage path to back of ID document';
COMMENT ON COLUMN public.identity_verifications.selfie_url IS 'Supabase Storage path to selfie for liveness check';

-- ============================================================================
-- 3. Create updated_at trigger
-- ============================================================================

CREATE TRIGGER update_identity_verifications_updated_at
    BEFORE UPDATE ON public.identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification records
CREATE POLICY "Users can view own identity verifications"
    ON public.identity_verifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create their own verification submissions
CREATE POLICY "Users can create own identity verifications"
    ON public.identity_verifications
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own pending verifications (resubmission)
CREATE POLICY "Users can update own pending verifications"
    ON public.identity_verifications
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() AND
        status IN ('pending', 'requires_resubmission')
    )
    WITH CHECK (
        user_id = auth.uid() AND
        status IN ('pending', 'requires_resubmission')
    );

-- Admins can view all verifications
CREATE POLICY "Admins can view all identity verifications"
    ON public.identity_verifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can update verifications (approve/reject)
CREATE POLICY "Admins can update identity verifications"
    ON public.identity_verifications
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to get latest verification for a user
CREATE OR REPLACE FUNCTION public.get_latest_identity_verification(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    status TEXT,
    document_type TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        iv.id,
        iv.status,
        iv.document_type,
        iv.submitted_at,
        iv.reviewed_at,
        iv.rejection_reason
    FROM public.identity_verifications iv
    WHERE iv.user_id = p_user_id
    ORDER BY iv.submitted_at DESC
    LIMIT 1;
END;
$$;

-- Function to check if user has verified identity
CREATE OR REPLACE FUNCTION public.is_identity_verified(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_verified BOOLEAN;
BEGIN
    SELECT identity_verified INTO v_verified
    FROM public.users
    WHERE id = p_user_id;

    RETURN COALESCE(v_verified, FALSE);
END;
$$;

-- Function to approve identity verification (admin use)
CREATE OR REPLACE FUNCTION public.approve_identity_verification(
    p_verification_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_admin_id UUID;
    v_document_number TEXT;
BEGIN
    -- Get current user (must be admin)
    v_admin_id := auth.uid();

    -- Verify admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = v_admin_id
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Only admins can approve identity verifications';
    END IF;

    -- Get verification details
    SELECT user_id, document_number INTO v_user_id, v_document_number
    FROM public.identity_verifications
    WHERE id = p_verification_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Verification not found';
    END IF;

    -- Update verification record
    UPDATE public.identity_verifications
    SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = v_admin_id,
        admin_notes = p_admin_notes,
        updated_at = NOW()
    WHERE id = p_verification_id;

    -- Update user record
    UPDATE public.users
    SET
        identity_verified = TRUE,
        identity_verified_at = NOW(),
        identity_verified_by = v_admin_id,
        -- Store document number if provided
        national_id_number = COALESCE(national_id_number, v_document_number),
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN TRUE;
END;
$$;

-- Function to reject identity verification (admin use)
CREATE OR REPLACE FUNCTION public.reject_identity_verification(
    p_verification_id UUID,
    p_rejection_reason TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Get current user (must be admin)
    v_admin_id := auth.uid();

    -- Verify admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = v_admin_id
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Only admins can reject identity verifications';
    END IF;

    -- Update verification record
    UPDATE public.identity_verifications
    SET
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = v_admin_id,
        rejection_reason = p_rejection_reason,
        admin_notes = p_admin_notes,
        updated_at = NOW()
    WHERE id = p_verification_id;

    RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_latest_identity_verification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_identity_verified(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_identity_verification(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_identity_verification(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 6. Create Storage Bucket for ID Documents
-- ============================================================================

-- Note: Storage buckets are created via Supabase Dashboard or API
-- This is a reference for required bucket configuration:
--
-- Bucket name: identity-documents
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--
-- RLS Policies for storage bucket:
-- 1. Users can upload to their own folder: identity-documents/{user_id}/*
-- 2. Admins can read all documents
-- 3. Users can read their own documents

-- ============================================================================
-- 7. Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Identity verification system created successfully';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Create storage bucket: identity-documents (via Supabase Dashboard)';
    RAISE NOTICE '   2. Configure bucket RLS policies';
    RAISE NOTICE '   3. Build IdentityVerificationService';
    RAISE NOTICE '   4. Build upload UI component';
    RAISE NOTICE '   5. Build admin verification interface';
END $$;

SELECT
    '✅ Identity Verification System' as component,
    'Created' as status,
    COUNT(*) as tables_added
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'identity_verifications';
