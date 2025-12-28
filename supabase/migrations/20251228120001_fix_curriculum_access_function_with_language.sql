-- Migration: Fix curriculum access function to support exam_language
-- Date: 2025-12-28
-- Description: Update auto_grant_curriculum_access function to support exam_language parameter
--              and match the new unique constraint (user_id, certification_type, exam_language)

-- =============================================================================
-- UPDATE AUTO_GRANT_CURRICULUM_ACCESS FUNCTION
-- =============================================================================

-- Drop and recreate the function with exam_language support
CREATE OR REPLACE FUNCTION public.auto_grant_curriculum_access(
    p_user_id UUID,
    p_certification_type TEXT,
    p_woocommerce_order_id INTEGER DEFAULT NULL,
    p_woocommerce_product_id INTEGER DEFAULT NULL,
    p_purchased_at TIMESTAMPTZ DEFAULT NOW(),
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_exam_language TEXT DEFAULT 'en'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expires_at TIMESTAMPTZ;
    v_result JSONB;
    v_cert_type certification_type;
    v_exam_lang exam_language;
BEGIN
    -- Cast text to certification_type enum (lowercase)
    v_cert_type := LOWER(p_certification_type)::certification_type;

    -- Cast text to exam_language enum
    v_exam_lang := LOWER(p_exam_language)::exam_language;

    -- Calculate expiry date (1 year from purchase if not provided)
    v_expires_at := COALESCE(p_expires_at, p_purchased_at + INTERVAL '1 year');

    -- Upsert the access record
    INSERT INTO public.user_curriculum_access (
        user_id,
        certification_type,
        exam_language,
        woocommerce_order_id,
        woocommerce_product_id,
        purchased_at,
        expires_at,
        is_active,
        last_checked_at
    ) VALUES (
        p_user_id,
        v_cert_type,
        v_exam_lang,
        p_woocommerce_order_id,
        p_woocommerce_product_id,
        p_purchased_at,
        v_expires_at,
        TRUE,
        NOW()
    )
    ON CONFLICT (user_id, certification_type, exam_language)
    DO UPDATE SET
        woocommerce_order_id = COALESCE(EXCLUDED.woocommerce_order_id, user_curriculum_access.woocommerce_order_id),
        woocommerce_product_id = COALESCE(EXCLUDED.woocommerce_product_id, user_curriculum_access.woocommerce_product_id),
        purchased_at = EXCLUDED.purchased_at,
        expires_at = EXCLUDED.expires_at,
        is_active = TRUE,
        last_checked_at = NOW()
    RETURNING jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'certification_type', certification_type,
        'exam_language', exam_language,
        'purchased_at', purchased_at,
        'expires_at', expires_at,
        'is_active', is_active
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_grant_curriculum_access TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.auto_grant_curriculum_access IS
'Auto-grants curriculum access to users. Supports exam_language (en/ar). Uses SECURITY DEFINER to bypass RLS.';

-- =============================================================================
-- CREATE ADMIN GRANT ACCESS FUNCTION
-- =============================================================================
-- This function is specifically for admins to grant access to users by email

CREATE OR REPLACE FUNCTION public.admin_grant_curriculum_access(
    p_user_email TEXT,
    p_certification_type TEXT,
    p_exam_language TEXT DEFAULT 'en',
    p_duration_months INTEGER DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_result JSONB;
    v_cert_type certification_type;
    v_exam_lang exam_language;
BEGIN
    -- Find user by email
    SELECT id INTO v_user_id
    FROM public.users
    WHERE LOWER(email) = LOWER(p_user_email);

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found with email: ' || p_user_email
        );
    END IF;

    -- Cast text to certification_type enum (lowercase)
    v_cert_type := LOWER(p_certification_type)::certification_type;

    -- Cast text to exam_language enum
    v_exam_lang := LOWER(p_exam_language)::exam_language;

    -- Calculate expiry date
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;

    -- Upsert the access record
    INSERT INTO public.user_curriculum_access (
        user_id,
        certification_type,
        exam_language,
        purchased_at,
        expires_at,
        is_active,
        last_checked_at
    ) VALUES (
        v_user_id,
        v_cert_type,
        v_exam_lang,
        NOW(),
        v_expires_at,
        TRUE,
        NOW()
    )
    ON CONFLICT (user_id, certification_type, exam_language)
    DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        is_active = TRUE,
        last_checked_at = NOW()
    RETURNING jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'certification_type', certification_type,
        'exam_language', exam_language,
        'purchased_at', purchased_at,
        'expires_at', expires_at,
        'is_active', is_active
    ) INTO v_result;

    RETURN jsonb_build_object(
        'success', true,
        'access', v_result,
        'email', p_user_email
    );
END;
$$;

-- Grant execute permission to authenticated users (RLS on admin check happens in app)
GRANT EXECUTE ON FUNCTION public.admin_grant_curriculum_access TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.admin_grant_curriculum_access IS
'Admin function to grant curriculum access by user email. Returns success/error status.';
