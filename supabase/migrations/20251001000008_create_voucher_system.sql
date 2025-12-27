-- Migration: Create Voucher System for Certification Exams
-- Date: 2025-10-01
-- Description: Tables for linking WooCommerce products to certifications and managing exam vouchers

-- =============================================================================
-- TYPES ENUM
-- =============================================================================

CREATE TYPE voucher_status AS ENUM ('unused', 'used', 'expired', 'revoked');

-- =============================================================================
-- TABLE: certification_products
-- Links WooCommerce products to certifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.certification_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- WooCommerce product info
    woocommerce_product_id INTEGER NOT NULL UNIQUE,
    woocommerce_product_name TEXT NOT NULL,
    woocommerce_product_sku TEXT,

    -- Certification link
    certification_type certification_type NOT NULL,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,

    -- Voucher configuration
    vouchers_per_purchase INTEGER NOT NULL DEFAULT 1,
    voucher_validity_months INTEGER NOT NULL DEFAULT 6,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_vouchers_count CHECK (vouchers_per_purchase > 0),
    CONSTRAINT valid_validity_months CHECK (voucher_validity_months > 0)
);

-- Indexes
CREATE INDEX idx_certification_products_wc_id ON public.certification_products(woocommerce_product_id);
CREATE INDEX idx_certification_products_cert_type ON public.certification_products(certification_type);
CREATE INDEX idx_certification_products_quiz ON public.certification_products(quiz_id);
CREATE INDEX idx_certification_products_active ON public.certification_products(is_active);

-- Comment
COMMENT ON TABLE public.certification_products IS 'Links WooCommerce products to certification exams';

-- =============================================================================
-- TABLE: exam_vouchers
-- Manages exam vouchers for users
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.exam_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Voucher code
    code TEXT NOT NULL UNIQUE,

    -- User assignment
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Certification info
    certification_type certification_type NOT NULL,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,

    -- Purchase/Origin info (optional - for manual creation it's NULL)
    woocommerce_order_id INTEGER,
    certification_product_id UUID REFERENCES public.certification_products(id) ON DELETE SET NULL,
    purchased_at TIMESTAMPTZ,

    -- Status
    status voucher_status NOT NULL DEFAULT 'unused',
    expires_at TIMESTAMPTZ NOT NULL,

    -- Usage tracking
    used_at TIMESTAMPTZ,
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,

    -- Notes (for admin manual creation)
    admin_notes TEXT,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_dates CHECK (
        (used_at IS NULL OR used_at <= NOW()) AND
        (purchased_at IS NULL OR purchased_at <= NOW())
    ),
    CONSTRAINT valid_usage CHECK (
        (status = 'used' AND used_at IS NOT NULL AND attempt_id IS NOT NULL) OR
        (status != 'used')
    )
);

-- Indexes
CREATE INDEX idx_exam_vouchers_user ON public.exam_vouchers(user_id);
CREATE INDEX idx_exam_vouchers_code ON public.exam_vouchers(code);
CREATE INDEX idx_exam_vouchers_status ON public.exam_vouchers(status);
CREATE INDEX idx_exam_vouchers_cert_type ON public.exam_vouchers(certification_type);
CREATE INDEX idx_exam_vouchers_quiz ON public.exam_vouchers(quiz_id);
CREATE INDEX idx_exam_vouchers_expires ON public.exam_vouchers(expires_at);
CREATE INDEX idx_exam_vouchers_order ON public.exam_vouchers(woocommerce_order_id);

-- Comment
COMMENT ON TABLE public.exam_vouchers IS 'Exam vouchers for certification attempts';
COMMENT ON COLUMN public.exam_vouchers.code IS 'Unique voucher code (e.g., CERT-CP-ABC123)';
COMMENT ON COLUMN public.exam_vouchers.status IS 'Voucher status: unused, used, expired, revoked';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger for updated_at on certification_products
CREATE TRIGGER update_certification_products_updated_at
    BEFORE UPDATE ON public.certification_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on exam_vouchers
CREATE TRIGGER update_exam_vouchers_updated_at
    BEFORE UPDATE ON public.exam_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire vouchers
CREATE OR REPLACE FUNCTION check_voucher_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire if past expiration date and still unused
    IF NEW.status = 'unused' AND NEW.expires_at < NOW() THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-expire vouchers on read
CREATE TRIGGER auto_expire_vouchers
    BEFORE UPDATE ON public.exam_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION check_voucher_expiration();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.certification_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_vouchers ENABLE ROW LEVEL SECURITY;

-- ====================================
-- POLICIES: certification_products
-- ====================================

-- SELECT: All authenticated users can view active product links
CREATE POLICY "Users can view active certification products"
ON public.certification_products FOR SELECT
TO authenticated
USING (is_active = true);

-- SELECT: Admins can view all product links
CREATE POLICY "Admins can view all certification products"
ON public.certification_products FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ALL: Admins can manage product links
CREATE POLICY "Admins can manage certification products"
ON public.certification_products FOR ALL
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

-- ====================================
-- POLICIES: exam_vouchers
-- ====================================

-- SELECT: Users can view their own vouchers
CREATE POLICY "Users can view their own vouchers"
ON public.exam_vouchers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Admins can view all vouchers
CREATE POLICY "Admins can view all vouchers"
ON public.exam_vouchers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- UPDATE: Users can update their own vouchers (for usage)
CREATE POLICY "Users can update their own vouchers"
ON public.exam_vouchers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ALL: Admins can manage all vouchers
CREATE POLICY "Admins can manage all vouchers"
ON public.exam_vouchers FOR ALL
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
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to generate voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code(cert_type certification_type)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    random_suffix TEXT;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    -- Set prefix based on certification type
    prefix := CASE
        WHEN cert_type = 'CP' THEN 'CERT-CP-'
        WHEN cert_type = 'SCP' THEN 'CERT-SCP-'
        ELSE 'CERT-'
    END;

    -- Generate unique code
    LOOP
        -- Generate random 8-character alphanumeric suffix
        random_suffix := upper(substring(md5(random()::text) from 1 for 8));
        new_code := prefix || random_suffix;

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.exam_vouchers WHERE code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION generate_voucher_code IS 'Generates a unique voucher code based on certification type';
