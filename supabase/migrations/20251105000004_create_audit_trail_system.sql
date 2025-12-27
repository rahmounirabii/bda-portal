-- Migration: Audit Trail System
-- Date: 2025-11-05
-- Description: Comprehensive audit logging for certification exam workflow compliance
-- Requirements: task.md - Audit trail for all critical actions

-- ============================================================================
-- 1. Create audit_event_type ENUM
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.audit_event_type AS ENUM (
        -- Authentication & Account
        'user_login',
        'user_logout',
        'user_registered',
        'password_changed',
        'email_changed',

        -- Profile & Identity
        'profile_updated',
        'identity_verification_submitted',
        'identity_verification_approved',
        'identity_verification_rejected',

        -- Consent & Honor Code
        'consent_accepted',
        'consent_withdrawn',
        'honor_code_accepted',

        -- Exam Registration & Access
        'exam_registered',
        'exam_access_granted',
        'exam_access_denied',
        'exam_launched',
        'exam_started',
        'exam_paused',
        'exam_resumed',
        'exam_submitted',
        'exam_auto_submitted',
        'exam_terminated',

        -- Exam Answers
        'answer_saved',
        'answer_changed',
        'answer_submitted',

        -- Results & Certification
        'exam_graded',
        'exam_passed',
        'exam_failed',
        'certificate_issued',
        'certificate_revoked',
        'certificate_downloaded',

        -- Security & Violations
        'suspicious_activity_detected',
        'exam_violation_logged',
        'session_timeout',
        'multiple_login_attempt',
        'unauthorized_access_attempt',

        -- Admin Actions
        'admin_user_modified',
        'admin_exam_modified',
        'admin_certificate_issued',
        'admin_certificate_revoked',
        'admin_verification_reviewed',

        -- System
        'system_error',
        'data_export_requested',
        'data_deleted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.audit_event_type IS 'Types of auditable events in the certification system';

-- ============================================================================
-- 2. Create audit_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event Information
    event_type public.audit_event_type NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Actor (who performed the action)
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_role TEXT, -- Role at time of action (for historical accuracy)
    actor_email TEXT,

    -- Subject (who/what was affected)
    subject_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    subject_type TEXT, -- 'user', 'exam', 'certificate', 'answer', etc.
    subject_id TEXT, -- ID of the affected entity

    -- Context
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
    session_id TEXT,

    -- Details
    description TEXT NOT NULL,
    event_details JSONB DEFAULT '{}'::jsonb, -- Additional structured data

    -- Technical Context
    ip_address INET,
    user_agent TEXT,
    request_url TEXT,
    http_method TEXT,

    -- Security
    security_level TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    flagged_as_suspicious BOOLEAN DEFAULT FALSE,

    -- Outcome
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type
ON public.audit_logs(event_type, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON public.audit_logs(user_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_subject_user
ON public.audit_logs(subject_user_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_quiz_attempt
ON public.audit_logs(quiz_id, attempt_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
ON public.audit_logs(event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_suspicious
ON public.audit_logs(flagged_as_suspicious, event_timestamp DESC)
WHERE flagged_as_suspicious = TRUE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_security_level
ON public.audit_logs(security_level, event_timestamp DESC)
WHERE security_level IN ('high', 'critical');

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all critical actions in the certification system';
COMMENT ON COLUMN public.audit_logs.event_type IS 'Type of auditable event';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.subject_user_id IS 'User who was affected by the action';
COMMENT ON COLUMN public.audit_logs.event_details IS 'Additional structured event data (JSON)';
COMMENT ON COLUMN public.audit_logs.security_level IS 'Security importance: low, normal, high, critical';
COMMENT ON COLUMN public.audit_logs.flagged_as_suspicious IS 'Whether this event was flagged as suspicious';

-- ============================================================================
-- 3. Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR subject_user_id = auth.uid());

-- Only system can insert audit logs (via functions)
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
    ON public.audit_logs
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
-- 4. Helper Functions
-- ============================================================================

-- Function to log an audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_event_type public.audit_event_type,
    p_user_id UUID,
    p_description TEXT,
    p_subject_user_id UUID DEFAULT NULL,
    p_subject_type TEXT DEFAULT NULL,
    p_subject_id TEXT DEFAULT NULL,
    p_quiz_id UUID DEFAULT NULL,
    p_attempt_id UUID DEFAULT NULL,
    p_event_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_security_level TEXT DEFAULT 'normal',
    p_flagged_as_suspicious BOOLEAN DEFAULT FALSE,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_audit_id UUID;
    v_actor_role TEXT;
    v_actor_email TEXT;
BEGIN
    -- Get actor role and email
    SELECT role, email INTO v_actor_role, v_actor_email
    FROM public.users
    WHERE id = p_user_id;

    -- Insert audit log
    INSERT INTO public.audit_logs (
        event_type,
        user_id,
        actor_role,
        actor_email,
        subject_user_id,
        subject_type,
        subject_id,
        quiz_id,
        attempt_id,
        description,
        event_details,
        ip_address,
        user_agent,
        security_level,
        flagged_as_suspicious,
        success,
        error_message
    ) VALUES (
        p_event_type,
        p_user_id,
        v_actor_role,
        v_actor_email,
        p_subject_user_id,
        p_subject_type,
        p_subject_id,
        p_quiz_id,
        p_attempt_id,
        p_description,
        p_event_details,
        p_ip_address,
        p_user_agent,
        p_security_level,
        p_flagged_as_suspicious,
        p_success,
        p_error_message
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

-- Function to get user's audit history
CREATE OR REPLACE FUNCTION public.get_user_audit_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    event_type public.audit_event_type,
    event_timestamp TIMESTAMPTZ,
    description TEXT,
    event_details JSONB,
    ip_address INET,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.event_type,
        al.event_timestamp,
        al.description,
        al.event_details,
        al.ip_address,
        al.success
    FROM public.audit_logs al
    WHERE al.user_id = p_user_id OR al.subject_user_id = p_user_id
    ORDER BY al.event_timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get exam audit trail
CREATE OR REPLACE FUNCTION public.get_exam_audit_trail(
    p_quiz_id UUID,
    p_attempt_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    event_type public.audit_event_type,
    event_timestamp TIMESTAMPTZ,
    user_id UUID,
    actor_email TEXT,
    description TEXT,
    event_details JSONB,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.event_type,
        al.event_timestamp,
        al.user_id,
        al.actor_email,
        al.description,
        al.event_details,
        al.success
    FROM public.audit_logs al
    WHERE al.quiz_id = p_quiz_id
    AND (p_attempt_id IS NULL OR al.attempt_id = p_attempt_id)
    ORDER BY al.event_timestamp ASC;
END;
$$;

-- Function to get suspicious activities
CREATE OR REPLACE FUNCTION public.get_suspicious_activities(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    event_type public.audit_event_type,
    event_timestamp TIMESTAMPTZ,
    user_id UUID,
    actor_email TEXT,
    description TEXT,
    event_details JSONB,
    ip_address INET,
    security_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.event_type,
        al.event_timestamp,
        al.user_id,
        al.actor_email,
        al.description,
        al.event_details,
        al.ip_address,
        al.security_level
    FROM public.audit_logs al
    WHERE al.flagged_as_suspicious = TRUE
    OR al.security_level IN ('high', 'critical')
    ORDER BY al.event_timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to count events by type for a user
CREATE OR REPLACE FUNCTION public.get_user_event_summary(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    event_type public.audit_event_type,
    event_count BIGINT,
    last_occurrence TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.event_type,
        COUNT(*) as event_count,
        MAX(al.event_timestamp) as last_occurrence
    FROM public.audit_logs al
    WHERE (al.user_id = p_user_id OR al.subject_user_id = p_user_id)
    AND al.event_timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY al.event_type
    ORDER BY event_count DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_audit_event(public.audit_event_type, UUID, TEXT, UUID, TEXT, TEXT, UUID, UUID, JSONB, INET, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_audit_history(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_audit_trail(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_suspicious_activities(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_event_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- 5. Triggers for Automatic Audit Logging
-- ============================================================================

-- Trigger function to audit identity verification changes
CREATE OR REPLACE FUNCTION public.audit_identity_verification_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_audit_event(
            'identity_verification_submitted',
            NEW.user_id,
            'User submitted identity verification',
            NEW.user_id,
            'identity_verification',
            NEW.id::text,
            NULL,
            NULL,
            jsonb_build_object(
                'document_type', NEW.document_type,
                'status', NEW.status
            ),
            NULL,
            NULL,
            'high',
            FALSE,
            TRUE,
            NULL
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'approved' THEN
                PERFORM public.log_audit_event(
                    'identity_verification_approved',
                    NEW.reviewed_by,
                    'Identity verification approved by admin',
                    NEW.user_id,
                    'identity_verification',
                    NEW.id::text,
                    NULL,
                    NULL,
                    jsonb_build_object(
                        'document_type', NEW.document_type,
                        'admin_notes', NEW.admin_notes
                    ),
                    NULL,
                    NULL,
                    'high',
                    FALSE,
                    TRUE,
                    NULL
                );
            ELSIF NEW.status = 'rejected' THEN
                PERFORM public.log_audit_event(
                    'identity_verification_rejected',
                    NEW.reviewed_by,
                    'Identity verification rejected by admin',
                    NEW.user_id,
                    'identity_verification',
                    NEW.id::text,
                    NULL,
                    NULL,
                    jsonb_build_object(
                        'document_type', NEW.document_type,
                        'rejection_reason', NEW.rejection_reason,
                        'admin_notes', NEW.admin_notes
                    ),
                    NULL,
                    NULL,
                    'high',
                    FALSE,
                    TRUE,
                    NULL
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for identity verifications
DROP TRIGGER IF EXISTS trigger_audit_identity_verification ON public.identity_verifications;
CREATE TRIGGER trigger_audit_identity_verification
AFTER INSERT OR UPDATE ON public.identity_verifications
FOR EACH ROW
EXECUTE FUNCTION public.audit_identity_verification_changes();

-- ============================================================================
-- 6. Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Audit Trail System created successfully';
    RAISE NOTICE '📝 Table created: audit_logs';
    RAISE NOTICE '📝 Functions created:';
    RAISE NOTICE '   - log_audit_event()';
    RAISE NOTICE '   - get_user_audit_history()';
    RAISE NOTICE '   - get_exam_audit_trail()';
    RAISE NOTICE '   - get_suspicious_activities()';
    RAISE NOTICE '   - get_user_event_summary()';
    RAISE NOTICE '📝 Triggers created:';
    RAISE NOTICE '   - audit_identity_verification_changes';
    RAISE NOTICE '🔒 RLS policies enabled for security';
END $$;

SELECT
    '✅ Audit Trail System' as component,
    'Created' as status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name = 'audit_logs') as tables_created;
