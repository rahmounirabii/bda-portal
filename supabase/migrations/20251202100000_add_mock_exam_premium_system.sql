-- Migration: Add Free/Premium Mock Exam System
-- Date: 2025-12-02
-- Description: Add is_premium, language fields to mock_exams and create premium access tracking

-- =============================================================================
-- TYPES
-- =============================================================================

-- Language type for exam content (used for UI separation)
CREATE TYPE mock_exam_language AS ENUM ('en', 'ar');

-- =============================================================================
-- ALTER TABLE: mock_exams
-- Add premium/language fields
-- =============================================================================

-- Add is_premium flag (false = free, true = requires purchase)
ALTER TABLE public.mock_exams
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Add language field for UI categorization
ALTER TABLE public.mock_exams
ADD COLUMN IF NOT EXISTS language mock_exam_language NOT NULL DEFAULT 'en';

-- Add WooCommerce product ID for premium exams (for purchase verification)
ALTER TABLE public.mock_exams
ADD COLUMN IF NOT EXISTS woocommerce_product_id INTEGER;

-- =============================================================================
-- TABLE: mock_exam_premium_access
-- Track user access to premium mock exams (via WooCommerce purchase)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mock_exam_premium_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mock_exam_id UUID NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,

    -- Purchase info
    woocommerce_order_id INTEGER,
    granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- For manual grants by admin

    -- Validity
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = lifetime access

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique access per user/exam
    UNIQUE(user_id, mock_exam_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_mock_exams_is_premium ON public.mock_exams(is_premium);
CREATE INDEX IF NOT EXISTS idx_mock_exams_language ON public.mock_exams(language);
CREATE INDEX IF NOT EXISTS idx_mock_exam_premium_access_user ON public.mock_exam_premium_access(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_premium_access_exam ON public.mock_exam_premium_access(mock_exam_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.mock_exam_premium_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access
CREATE POLICY "Users can view their own premium access"
ON public.mock_exam_premium_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all access
CREATE POLICY "Admins can view all premium access"
ON public.mock_exam_premium_access FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Admins can manage all access
CREATE POLICY "Admins can manage premium access"
ON public.mock_exam_premium_access FOR ALL
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

-- =============================================================================
-- UPDATE RLS POLICY FOR mock_exams
-- Allow viewing free exams or premium exams user has access to
-- =============================================================================

-- Drop and recreate the user view policy to add premium check
DROP POLICY IF EXISTS "Users can view active mock exams" ON public.mock_exams;

CREATE POLICY "Users can view accessible mock exams"
ON public.mock_exams FOR SELECT
TO authenticated
USING (
    is_active = true
    AND (
        -- Free exams are always visible
        is_premium = false
        OR
        -- Premium exams visible if user has access
        EXISTS (
            SELECT 1 FROM public.mock_exam_premium_access
            WHERE mock_exam_id = mock_exams.id
            AND user_id = auth.uid()
            AND (expires_at IS NULL OR expires_at > NOW())
        )
        OR
        -- Admins can always see all exams
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    )
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.mock_exams.is_premium IS 'If true, requires purchase/access grant to take the exam';
COMMENT ON COLUMN public.mock_exams.language IS 'Primary language of the exam content (en/ar)';
COMMENT ON COLUMN public.mock_exams.woocommerce_product_id IS 'WooCommerce product ID for purchase verification';
COMMENT ON TABLE public.mock_exam_premium_access IS 'Tracks user access to premium mock exams via purchase or admin grant';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Mock exam premium system added!' as status;
