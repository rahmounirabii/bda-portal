-- Migration: Consent and Honor Code System
-- Date: 2025-11-05
-- Description: Implements consent tracking and honor code acceptance for compliance
-- Requirements: task.md Step 1 - Accept Terms, Privacy Policy, and Exam Code of Conduct

-- ============================================================================
-- 1. Create consent_types ENUM
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.consent_type AS ENUM (
        'terms_of_use',
        'privacy_policy',
        'exam_code_of_conduct',
        'data_processing',
        'marketing_communications'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.consent_type IS 'Types of consent that can be tracked';

-- ============================================================================
-- 2. Create consent_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Consent details
    consent_type public.consent_type NOT NULL,
    consent_version TEXT NOT NULL, -- Version of the document (e.g., 'v1.0', '2024-01-15')

    -- Consent action
    consented BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = accepted, FALSE = rejected/withdrawn
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    ip_address INET,
    user_agent TEXT,
    consent_text TEXT, -- Store the actual consent text at the time of acceptance

    -- Additional data (optional)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_consent_version CHECK (length(consent_version) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id
ON public.consent_logs(user_id, consent_type);

CREATE INDEX IF NOT EXISTS idx_consent_logs_type_consented
ON public.consent_logs(consent_type, consented, consented_at DESC);

CREATE INDEX IF NOT EXISTS idx_consent_logs_user_latest
ON public.consent_logs(user_id, consent_type, consented_at DESC);

-- Comments
COMMENT ON TABLE public.consent_logs IS 'Tracks all consent acceptances and withdrawals for GDPR compliance';
COMMENT ON COLUMN public.consent_logs.consent_type IS 'Type of consent: terms_of_use, privacy_policy, exam_code_of_conduct, etc.';
COMMENT ON COLUMN public.consent_logs.consent_version IS 'Version identifier of the consent document';
COMMENT ON COLUMN public.consent_logs.consented IS 'TRUE if accepted, FALSE if withdrawn';
COMMENT ON COLUMN public.consent_logs.consent_text IS 'Snapshot of consent text at time of acceptance (for legal proof)';

-- ============================================================================
-- 3. Create honor_code_acceptances table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.honor_code_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Context of acceptance
    context TEXT NOT NULL, -- 'exam_registration', 'before_exam_launch', 'profile_completion'

    -- Exam context (if applicable)
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,

    -- Acceptance details
    honor_code_version TEXT NOT NULL DEFAULT 'v1.0',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Digital signature
    signature_type TEXT DEFAULT 'checkbox', -- 'checkbox', 'typed_name', 'drawn_signature'
    signature_data TEXT, -- Typed name or base64 signature image

    -- IP and device tracking
    ip_address INET,
    user_agent TEXT,

    -- Full honor code text (snapshot)
    honor_code_text TEXT NOT NULL,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_context CHECK (context IN ('exam_registration', 'before_exam_launch', 'profile_completion', 'identity_verification'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_honor_code_user_id
ON public.honor_code_acceptances(user_id, accepted_at DESC);

CREATE INDEX IF NOT EXISTS idx_honor_code_quiz_attempt
ON public.honor_code_acceptances(quiz_id, attempt_id);

CREATE INDEX IF NOT EXISTS idx_honor_code_context
ON public.honor_code_acceptances(context, accepted_at DESC);

-- Comments
COMMENT ON TABLE public.honor_code_acceptances IS 'Tracks honor code acceptances before exams (compliance requirement)';
COMMENT ON COLUMN public.honor_code_acceptances.context IS 'Where the honor code was signed: exam_registration, before_exam_launch, etc.';
COMMENT ON COLUMN public.honor_code_acceptances.signature_type IS 'Type of signature: checkbox, typed_name, or drawn_signature';
COMMENT ON COLUMN public.honor_code_acceptances.honor_code_text IS 'Full text of honor code at time of acceptance (legal record)';

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_code_acceptances ENABLE ROW LEVEL SECURITY;

-- Consent Logs Policies
CREATE POLICY "Users can view own consent logs"
    ON public.consent_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own consent logs"
    ON public.consent_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all consent logs"
    ON public.consent_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Honor Code Policies
CREATE POLICY "Users can view own honor code acceptances"
    ON public.honor_code_acceptances
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own honor code acceptances"
    ON public.honor_code_acceptances
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all honor code acceptances"
    ON public.honor_code_acceptances
    FOR SELECT
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

-- Function to check if user has given consent for a specific type
CREATE OR REPLACE FUNCTION public.has_user_consented(
    p_user_id UUID,
    p_consent_type public.consent_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_latest_consent BOOLEAN;
BEGIN
    -- Get the latest consent action for this type
    SELECT consented INTO v_latest_consent
    FROM public.consent_logs
    WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    ORDER BY consented_at DESC
    LIMIT 1;

    -- Return FALSE if no consent found, otherwise return the consent status
    RETURN COALESCE(v_latest_consent, FALSE);
END;
$$;

-- Function to check if user has accepted honor code for a specific context
CREATE OR REPLACE FUNCTION public.has_accepted_honor_code(
    p_user_id UUID,
    p_context TEXT DEFAULT NULL,
    p_quiz_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If quiz_id is provided, check for that specific exam
    IF p_quiz_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.honor_code_acceptances
            WHERE user_id = p_user_id
            AND quiz_id = p_quiz_id
            AND accepted_at >= NOW() - INTERVAL '24 hours' -- Honor code valid for 24h
        );
    END IF;

    -- If context is provided, check for that context
    IF p_context IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.honor_code_acceptances
            WHERE user_id = p_user_id
            AND context = p_context
            AND accepted_at >= NOW() - INTERVAL '7 days' -- General honor code valid for 7 days
        );
    END IF;

    -- Otherwise, check if user has any honor code acceptance
    RETURN EXISTS (
        SELECT 1 FROM public.honor_code_acceptances
        WHERE user_id = p_user_id
    );
END;
$$;

-- Function to log consent
CREATE OR REPLACE FUNCTION public.log_consent(
    p_user_id UUID,
    p_consent_type public.consent_type,
    p_consent_version TEXT,
    p_consented BOOLEAN,
    p_consent_text TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    INSERT INTO public.consent_logs (
        user_id,
        consent_type,
        consent_version,
        consented,
        consent_text,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_consent_type,
        p_consent_version,
        p_consented,
        p_consent_text,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_consent_id;

    RETURN v_consent_id;
END;
$$;

-- Function to log honor code acceptance
CREATE OR REPLACE FUNCTION public.log_honor_code_acceptance(
    p_user_id UUID,
    p_context TEXT,
    p_honor_code_text TEXT,
    p_quiz_id UUID DEFAULT NULL,
    p_attempt_id UUID DEFAULT NULL,
    p_signature_type TEXT DEFAULT 'checkbox',
    p_signature_data TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acceptance_id UUID;
BEGIN
    INSERT INTO public.honor_code_acceptances (
        user_id,
        context,
        quiz_id,
        attempt_id,
        honor_code_text,
        signature_type,
        signature_data,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_context,
        p_quiz_id,
        p_attempt_id,
        p_honor_code_text,
        p_signature_type,
        p_signature_data,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_acceptance_id;

    RETURN v_acceptance_id;
END;
$$;

-- Function to get user's consent summary
CREATE OR REPLACE FUNCTION public.get_user_consent_summary(p_user_id UUID)
RETURNS TABLE (
    consent_type public.consent_type,
    is_consented BOOLEAN,
    last_updated TIMESTAMPTZ,
    consent_version TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (cl.consent_type)
        cl.consent_type,
        cl.consented as is_consented,
        cl.consented_at as last_updated,
        cl.consent_version
    FROM public.consent_logs cl
    WHERE cl.user_id = p_user_id
    ORDER BY cl.consent_type, cl.consented_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_user_consented(UUID, public.consent_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_accepted_honor_code(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_consent(UUID, public.consent_type, TEXT, BOOLEAN, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_honor_code_acceptance(UUID, TEXT, TEXT, UUID, UUID, TEXT, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_consent_summary(UUID) TO authenticated;

-- ============================================================================
-- 6. Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Consent and Honor Code system created successfully';
    RAISE NOTICE '📝 Tables created:';
    RAISE NOTICE '   - consent_logs (GDPR compliance)';
    RAISE NOTICE '   - honor_code_acceptances (exam integrity)';
    RAISE NOTICE '📝 Functions created:';
    RAISE NOTICE '   - has_user_consented()';
    RAISE NOTICE '   - has_accepted_honor_code()';
    RAISE NOTICE '   - log_consent()';
    RAISE NOTICE '   - log_honor_code_acceptance()';
    RAISE NOTICE '   - get_user_consent_summary()';
END $$;

SELECT
    '✅ Consent & Honor Code System' as component,
    'Created' as status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('consent_logs', 'honor_code_acceptances')) as tables_created;
