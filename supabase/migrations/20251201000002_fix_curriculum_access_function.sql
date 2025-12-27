-- Migration: Fix curriculum access function - cast text to enum
-- Date: 2024-12-01
-- Description: Fix the auto_grant_curriculum_access function to properly cast text to certification_type enum

-- Drop and recreate the function with proper type casting
CREATE OR REPLACE FUNCTION public.auto_grant_curriculum_access(
    p_user_id UUID,
    p_certification_type TEXT,
    p_woocommerce_order_id INTEGER DEFAULT NULL,
    p_woocommerce_product_id INTEGER DEFAULT NULL,
    p_purchased_at TIMESTAMPTZ DEFAULT NOW(),
    p_expires_at TIMESTAMPTZ DEFAULT NULL
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
BEGIN
    -- Cast text to certification_type enum
    v_cert_type := p_certification_type::certification_type;

    -- Calculate expiry date (1 year from purchase if not provided)
    v_expires_at := COALESCE(p_expires_at, p_purchased_at + INTERVAL '1 year');

    -- Upsert the access record
    INSERT INTO public.user_curriculum_access (
        user_id,
        certification_type,
        woocommerce_order_id,
        woocommerce_product_id,
        purchased_at,
        expires_at,
        is_active,
        last_checked_at
    ) VALUES (
        p_user_id,
        v_cert_type,
        p_woocommerce_order_id,
        p_woocommerce_product_id,
        p_purchased_at,
        v_expires_at,
        TRUE,
        NOW()
    )
    ON CONFLICT (user_id, certification_type)
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
        'purchased_at', purchased_at,
        'expires_at', expires_at,
        'is_active', is_active
    ) INTO v_result;

    RETURN v_result;
END;
$$;
