-- Migration: Create Memberships System
-- Date: 2025-12-06
-- Description: Implements the full Memberships module per specification
-- User Stories: US1-US8 from Memberships.pdf

-- =============================================================================
-- ENUM: membership_type
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE membership_type AS ENUM ('basic', 'professional');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- ENUM: membership_status
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'expired', 'cancelled', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- TABLE: user_memberships
-- Stores user membership records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Membership details
    membership_type membership_type NOT NULL,
    membership_id TEXT NOT NULL UNIQUE, -- Format: BDA-MEM-2024-XXXX

    -- Dates
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,

    -- Status
    status membership_status NOT NULL DEFAULT 'active',

    -- Certificate (Professional only)
    certificate_url TEXT, -- PDF stored in Supabase Storage

    -- WooCommerce reference
    woocommerce_order_id INTEGER,
    woocommerce_product_id INTEGER,

    -- Renewal tracking
    renewal_count INTEGER NOT NULL DEFAULT 0,
    last_renewed_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT false,

    -- Admin controls
    activated_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL = webhook
    deactivated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    deactivation_reason TEXT,
    admin_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_membership_dates CHECK (expiry_date > start_date),
    CONSTRAINT valid_renewal_count CHECK (renewal_count >= 0)
);

-- =============================================================================
-- TABLE: membership_benefits
-- Defines what each membership type includes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.membership_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    membership_type membership_type NOT NULL,
    benefit_key TEXT NOT NULL, -- e.g., 'bda_bock_access', 'certificate', 'discounts'
    benefit_name TEXT NOT NULL,
    benefit_name_ar TEXT,
    benefit_description TEXT,
    benefit_description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(membership_type, benefit_key)
);

-- =============================================================================
-- TABLE: membership_product_mapping
-- Maps WooCommerce products to membership types
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.membership_product_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    woocommerce_product_id INTEGER NOT NULL UNIQUE,
    membership_type membership_type NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 12,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: membership_activation_logs
-- Logs all membership activations/changes for audit
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.membership_activation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    membership_id UUID REFERENCES public.user_memberships(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    action TEXT NOT NULL, -- 'activated', 'renewed', 'expired', 'cancelled', 'extended', 'reissued_certificate'
    previous_status membership_status,
    new_status membership_status,
    previous_expiry_date DATE,
    new_expiry_date DATE,

    -- Source of action
    triggered_by TEXT NOT NULL, -- 'webhook', 'admin', 'system'
    admin_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    woocommerce_order_id INTEGER,

    -- Details
    notes TEXT,
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_type ON public.user_memberships(membership_type);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON public.user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_expiry ON public.user_memberships(expiry_date);
CREATE INDEX IF NOT EXISTS idx_user_memberships_membership_id ON public.user_memberships(membership_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_woo_order ON public.user_memberships(woocommerce_order_id);

CREATE INDEX IF NOT EXISTS idx_membership_benefits_type ON public.membership_benefits(membership_type);
CREATE INDEX IF NOT EXISTS idx_membership_activation_logs_user ON public.membership_activation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_activation_logs_membership ON public.membership_activation_logs(membership_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.user_memberships IS 'User membership records (Basic/Professional)';
COMMENT ON COLUMN public.user_memberships.membership_id IS 'Unique membership ID (e.g., BDA-MEM-2024-0001)';
COMMENT ON COLUMN public.user_memberships.certificate_url IS 'PDF certificate for Professional members';
COMMENT ON TABLE public.membership_benefits IS 'Benefits included in each membership type';
COMMENT ON TABLE public.membership_product_mapping IS 'WooCommerce product to membership type mapping';
COMMENT ON TABLE public.membership_activation_logs IS 'Audit log for all membership changes';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_product_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_activation_logs ENABLE ROW LEVEL SECURITY;

-- user_memberships policies
CREATE POLICY "Users can view their own memberships"
    ON public.user_memberships
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all memberships"
    ON public.user_memberships
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert memberships"
    ON public.user_memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update memberships"
    ON public.user_memberships
    FOR UPDATE
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

CREATE POLICY "Admins can delete memberships"
    ON public.user_memberships
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- membership_benefits policies (read-only for all authenticated)
CREATE POLICY "Anyone can view membership benefits"
    ON public.membership_benefits
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage membership benefits"
    ON public.membership_benefits
    FOR ALL
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

-- membership_product_mapping policies
CREATE POLICY "Admins can manage product mapping"
    ON public.membership_product_mapping
    FOR ALL
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

-- membership_activation_logs policies
CREATE POLICY "Users can view their own activation logs"
    ON public.membership_activation_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activation logs"
    ON public.membership_activation_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert activation logs"
    ON public.membership_activation_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to generate membership ID
CREATE OR REPLACE FUNCTION generate_membership_id()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    sequence_num INTEGER;
    membership_code TEXT;
BEGIN
    -- Get current year
    year := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(membership_id FROM '\d{4}$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.user_memberships
    WHERE membership_id LIKE 'BDA-MEM-' || year || '-%';

    -- Format: BDA-MEM-2024-0001
    membership_code := 'BDA-MEM-' || year || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN membership_code;
END;
$$ LANGUAGE plpgsql;

-- Function to check if membership is expiring soon (within 30 days)
CREATE OR REPLACE FUNCTION is_membership_expiring_soon(mem_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    days_until_expiry INTEGER;
    mem_status membership_status;
BEGIN
    SELECT
        DATE_PART('day', expiry_date - CURRENT_DATE)::INTEGER,
        status
    INTO days_until_expiry, mem_status
    FROM public.user_memberships
    WHERE id = mem_id;

    RETURN mem_status = 'active' AND days_until_expiry IS NOT NULL AND days_until_expiry <= 30 AND days_until_expiry > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get days remaining for a membership
CREATE OR REPLACE FUNCTION get_membership_days_remaining(mem_id UUID)
RETURNS INTEGER AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    SELECT DATE_PART('day', expiry_date - CURRENT_DATE)::INTEGER
    INTO days_remaining
    FROM public.user_memberships
    WHERE id = mem_id;

    RETURN GREATEST(days_remaining, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check user's active membership
CREATE OR REPLACE FUNCTION get_user_active_membership(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    membership_type membership_type,
    membership_id TEXT,
    start_date DATE,
    expiry_date DATE,
    status membership_status,
    certificate_url TEXT,
    days_remaining INTEGER,
    is_expiring_soon BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        um.id,
        um.membership_type,
        um.membership_id,
        um.start_date,
        um.expiry_date,
        um.status,
        um.certificate_url,
        GREATEST(DATE_PART('day', um.expiry_date - CURRENT_DATE)::INTEGER, 0) as days_remaining,
        (um.status = 'active' AND DATE_PART('day', um.expiry_date - CURRENT_DATE)::INTEGER <= 30 AND DATE_PART('day', um.expiry_date - CURRENT_DATE)::INTEGER > 0) as is_expiring_soon
    FROM public.user_memberships um
    WHERE um.user_id = p_user_id
    AND um.status = 'active'
    ORDER BY um.expiry_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to activate membership (for webhook/admin use)
CREATE OR REPLACE FUNCTION activate_membership(
    p_user_id UUID,
    p_membership_type membership_type,
    p_woocommerce_order_id INTEGER DEFAULT NULL,
    p_woocommerce_product_id INTEGER DEFAULT NULL,
    p_duration_months INTEGER DEFAULT 12,
    p_admin_user_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
    v_membership_code TEXT;
    v_existing_membership RECORD;
    v_start_date DATE;
    v_expiry_date DATE;
    v_triggered_by TEXT;
BEGIN
    -- Determine trigger source
    v_triggered_by := CASE WHEN p_admin_user_id IS NOT NULL THEN 'admin' ELSE 'webhook' END;

    -- Check for existing active membership
    SELECT * INTO v_existing_membership
    FROM public.user_memberships
    WHERE user_id = p_user_id
    AND status = 'active'
    ORDER BY expiry_date DESC
    LIMIT 1;

    IF v_existing_membership.id IS NOT NULL THEN
        -- Extend existing membership
        v_start_date := v_existing_membership.start_date;
        v_expiry_date := v_existing_membership.expiry_date + (p_duration_months || ' months')::INTERVAL;

        UPDATE public.user_memberships
        SET
            expiry_date = v_expiry_date,
            renewal_count = renewal_count + 1,
            last_renewed_at = NOW(),
            membership_type = CASE
                WHEN p_membership_type = 'professional' THEN 'professional'::membership_type
                ELSE membership_type
            END,
            woocommerce_order_id = COALESCE(p_woocommerce_order_id, woocommerce_order_id),
            updated_at = NOW()
        WHERE id = v_existing_membership.id
        RETURNING id INTO v_membership_id;

        -- Log renewal
        INSERT INTO public.membership_activation_logs (
            membership_id, user_id, action, previous_status, new_status,
            previous_expiry_date, new_expiry_date, triggered_by, admin_user_id,
            woocommerce_order_id, notes
        ) VALUES (
            v_membership_id, p_user_id, 'renewed', 'active', 'active',
            v_existing_membership.expiry_date, v_expiry_date, v_triggered_by, p_admin_user_id,
            p_woocommerce_order_id, p_notes
        );
    ELSE
        -- Create new membership
        v_membership_code := generate_membership_id();
        v_start_date := CURRENT_DATE;
        v_expiry_date := CURRENT_DATE + (p_duration_months || ' months')::INTERVAL;

        INSERT INTO public.user_memberships (
            user_id, membership_type, membership_id, start_date, expiry_date,
            status, woocommerce_order_id, woocommerce_product_id, activated_by, admin_notes
        ) VALUES (
            p_user_id, p_membership_type, v_membership_code, v_start_date, v_expiry_date,
            'active', p_woocommerce_order_id, p_woocommerce_product_id, p_admin_user_id, p_notes
        ) RETURNING id INTO v_membership_id;

        -- Log activation
        INSERT INTO public.membership_activation_logs (
            membership_id, user_id, action, new_status, new_expiry_date,
            triggered_by, admin_user_id, woocommerce_order_id, notes
        ) VALUES (
            v_membership_id, p_user_id, 'activated', 'active', v_expiry_date,
            v_triggered_by, p_admin_user_id, p_woocommerce_order_id, p_notes
        );
    END IF;

    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire memberships (called by cron/scheduled job)
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH expired AS (
        UPDATE public.user_memberships
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active'
        AND expiry_date < CURRENT_DATE
        RETURNING id, user_id, expiry_date
    )
    INSERT INTO public.membership_activation_logs (
        membership_id, user_id, action, previous_status, new_status,
        previous_expiry_date, new_expiry_date, triggered_by
    )
    SELECT
        id, user_id, 'expired', 'active', 'expired',
        expiry_date, expiry_date, 'system'
    FROM expired;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_memberships_updated_at ON public.user_memberships;
CREATE TRIGGER user_memberships_updated_at
    BEFORE UPDATE ON public.user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_user_memberships_updated_at();

-- =============================================================================
-- SEED DATA: Default benefits
-- =============================================================================

INSERT INTO public.membership_benefits (membership_type, benefit_key, benefit_name, benefit_name_ar, benefit_description, display_order)
VALUES
    -- Basic membership benefits
    ('basic', 'member_badge', 'BDA Member Badge', 'شارة عضو BDA', 'Display your BDA membership badge on professional profiles', 1),
    ('basic', 'newsletter', 'Monthly Newsletter', 'النشرة الإخبارية الشهرية', 'Receive exclusive industry insights and updates', 2),
    ('basic', 'community_access', 'Community Access', 'الوصول إلى المجتمع', 'Join the BDA professional community forums', 3),
    ('basic', 'event_discounts', 'Event Discounts', 'خصومات الفعاليات', 'Get discounts on BDA events and webinars', 4),
    ('basic', 'job_board', 'Job Board Access', 'الوصول إلى لوحة الوظائف', 'Access exclusive BA job postings', 5),

    -- Professional membership benefits (includes all basic + more)
    ('professional', 'member_badge', 'BDA Professional Member Badge', 'شارة العضو المحترف BDA', 'Premium professional membership badge', 1),
    ('professional', 'newsletter', 'Monthly Newsletter', 'النشرة الإخبارية الشهرية', 'Receive exclusive industry insights and updates', 2),
    ('professional', 'community_access', 'Community Access', 'الوصول إلى المجتمع', 'Join the BDA professional community forums', 3),
    ('professional', 'event_discounts', 'Premium Event Discounts', 'خصومات الفعاليات المميزة', 'Get premium discounts on BDA events (up to 30%)', 4),
    ('professional', 'job_board', 'Priority Job Board Access', 'أولوية الوصول إلى لوحة الوظائف', 'Priority access to exclusive BA job postings', 5),
    ('professional', 'bda_bock_access', 'BDA BoCK® Access', 'الوصول إلى BDA BoCK®', 'Full access to the BDA Body of Knowledge', 6),
    ('professional', 'membership_certificate', 'Membership Certificate', 'شهادة العضوية', 'Official downloadable membership certificate', 7),
    ('professional', 'certification_discount', 'Certification Discount', 'خصم الشهادة', '15% discount on BDA certification exams', 8),
    ('professional', 'mentorship_program', 'Mentorship Program', 'برنامج الإرشاد', 'Access to the BDA mentorship network', 9),
    ('professional', 'resource_library', 'Resource Library', 'مكتبة الموارد', 'Access to templates, guides, and best practices', 10)
ON CONFLICT (membership_type, benefit_key) DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Memberships system created successfully!' as status;
