-- Migration: Reminder System
-- Date: 2025-11-05
-- Description: Automated reminder scheduling for upcoming exams
-- Requirements: task.md Step 5 - Reminder System

-- ============================================================================
-- 1. Function to Queue 48h Reminders
-- ============================================================================

CREATE OR REPLACE FUNCTION public.queue_48h_reminders()
RETURNS TABLE (
    booking_id UUID,
    recipient_email TEXT,
    exam_time TIMESTAMPTZ,
    queued BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_user RECORD;
    v_template_data JSONB;
    v_email_id UUID;
BEGIN
    -- Find bookings that need 48h reminders
    -- Criteria:
    --   - Status is 'scheduled'
    --   - Exam is between 47-49 hours from now
    --   - 48h reminder not yet sent
    FOR v_booking IN
        SELECT
            b.id,
            b.user_id,
            b.quiz_id,
            b.scheduled_start_time,
            b.scheduled_end_time,
            b.timezone,
            b.confirmation_code,
            q.title as exam_title
        FROM public.exam_bookings b
        JOIN public.quizzes q ON q.id = b.quiz_id
        WHERE b.status = 'scheduled'
        AND b.reminder_48h_sent = FALSE
        AND b.scheduled_start_time BETWEEN NOW() + INTERVAL '47 hours' AND NOW() + INTERVAL '49 hours'
    LOOP
        -- Get user details
        SELECT email, first_name, last_name
        INTO v_user
        FROM public.users
        WHERE id = v_booking.user_id;

        IF NOT FOUND THEN
            CONTINUE; -- Skip if user not found
        END IF;

        -- Prepare template data
        v_template_data := jsonb_build_object(
            'candidate_name', COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            'exam_date', to_char(v_booking.scheduled_start_time AT TIME ZONE v_booking.timezone, 'Day, Month DD, YYYY'),
            'exam_time', to_char(v_booking.scheduled_start_time AT TIME ZONE v_booking.timezone, 'HH12:MI AM') || ' - ' ||
                         to_char(v_booking.scheduled_end_time AT TIME ZONE v_booking.timezone, 'HH12:MI AM'),
            'confirmation_code', v_booking.confirmation_code,
            'exam_title', v_booking.exam_title,
            'dashboard_url', 'https://portal.bda-association.com/dashboard'
        );

        -- Queue the reminder email
        v_email_id := public.queue_email(
            p_recipient_email := v_user.email,
            p_recipient_name := COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            p_template_name := 'exam_reminder_48h',
            p_template_data := v_template_data,
            p_priority := 4, -- Medium-high priority
            p_related_entity_type := 'exam_booking',
            p_related_entity_id := v_booking.id
        );

        -- Mark reminder as sent
        UPDATE public.exam_bookings
        SET
            reminder_48h_sent = TRUE,
            reminder_48h_sent_at = NOW()
        WHERE id = v_booking.id;

        -- Log audit event
        PERFORM public.log_audit_event(
            'reminder_sent',
            v_booking.user_id,
            '48-hour exam reminder sent',
            v_booking.user_id,
            'exam_booking',
            v_booking.id::text,
            v_booking.quiz_id,
            NULL,
            jsonb_build_object(
                'reminder_type', '48h',
                'email_id', v_email_id,
                'scheduled_time', v_booking.scheduled_start_time
            ),
            NULL,
            NULL,
            'medium',
            FALSE,
            TRUE,
            NULL
        );

        -- Return result
        RETURN QUERY SELECT
            v_booking.id,
            v_user.email,
            v_booking.scheduled_start_time,
            TRUE;
    END LOOP;
END;
$$;

-- ============================================================================
-- 2. Function to Queue 24h Reminders
-- ============================================================================

CREATE OR REPLACE FUNCTION public.queue_24h_reminders()
RETURNS TABLE (
    booking_id UUID,
    recipient_email TEXT,
    exam_time TIMESTAMPTZ,
    queued BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_user RECORD;
    v_template_data JSONB;
    v_email_id UUID;
BEGIN
    -- Find bookings that need 24h reminders
    -- Criteria:
    --   - Status is 'scheduled'
    --   - Exam is between 23-25 hours from now
    --   - 24h reminder not yet sent
    FOR v_booking IN
        SELECT
            b.id,
            b.user_id,
            b.quiz_id,
            b.scheduled_start_time,
            b.scheduled_end_time,
            b.timezone,
            b.confirmation_code,
            q.title as exam_title
        FROM public.exam_bookings b
        JOIN public.quizzes q ON q.id = b.quiz_id
        WHERE b.status = 'scheduled'
        AND b.reminder_24h_sent = FALSE
        AND b.scheduled_start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
    LOOP
        -- Get user details
        SELECT email, first_name, last_name
        INTO v_user
        FROM public.users
        WHERE id = v_booking.user_id;

        IF NOT FOUND THEN
            CONTINUE; -- Skip if user not found
        END IF;

        -- Prepare template data
        v_template_data := jsonb_build_object(
            'candidate_name', COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            'exam_date', to_char(v_booking.scheduled_start_time AT TIME ZONE v_booking.timezone, 'Day, Month DD, YYYY'),
            'exam_time', to_char(v_booking.scheduled_start_time AT TIME ZONE v_booking.timezone, 'HH12:MI AM') || ' - ' ||
                         to_char(v_booking.scheduled_end_time AT TIME ZONE v_booking.timezone, 'HH12:MI AM'),
            'confirmation_code', v_booking.confirmation_code,
            'exam_title', v_booking.exam_title,
            'dashboard_url', 'https://portal.bda-association.com/dashboard'
        );

        -- Queue the reminder email
        v_email_id := public.queue_email(
            p_recipient_email := v_user.email,
            p_recipient_name := COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            p_template_name := 'exam_reminder_24h',
            p_template_data := v_template_data,
            p_priority := 3, -- High priority (more urgent than 48h)
            p_related_entity_type := 'exam_booking',
            p_related_entity_id := v_booking.id
        );

        -- Mark reminder as sent
        UPDATE public.exam_bookings
        SET
            reminder_24h_sent = TRUE,
            reminder_24h_sent_at = NOW()
        WHERE id = v_booking.id;

        -- Log audit event
        PERFORM public.log_audit_event(
            'reminder_sent',
            v_booking.user_id,
            '24-hour exam reminder sent',
            v_booking.user_id,
            'exam_booking',
            v_booking.id::text,
            v_booking.quiz_id,
            NULL,
            jsonb_build_object(
                'reminder_type', '24h',
                'email_id', v_email_id,
                'scheduled_time', v_booking.scheduled_start_time
            ),
            NULL,
            NULL,
            'high',
            FALSE,
            TRUE,
            NULL
        );

        -- Return result
        RETURN QUERY SELECT
            v_booking.id,
            v_user.email,
            v_booking.scheduled_start_time,
            TRUE;
    END LOOP;
END;
$$;

-- ============================================================================
-- 3. Combined Function to Process All Reminders
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_all_reminders()
RETURNS TABLE (
    reminder_type TEXT,
    bookings_processed INTEGER,
    emails_queued INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_48h_count INTEGER := 0;
    v_24h_count INTEGER := 0;
BEGIN
    -- Process 48h reminders
    SELECT COUNT(*) INTO v_48h_count
    FROM public.queue_48h_reminders();

    -- Process 24h reminders
    SELECT COUNT(*) INTO v_24h_count
    FROM public.queue_24h_reminders();

    -- Return summary
    RETURN QUERY
    SELECT '48h'::TEXT, v_48h_count, v_48h_count
    UNION ALL
    SELECT '24h'::TEXT, v_24h_count, v_24h_count;
END;
$$;

-- ============================================================================
-- 4. Function to Get Upcoming Reminders (for monitoring)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_upcoming_reminders()
RETURNS TABLE (
    booking_id UUID,
    user_email TEXT,
    exam_time TIMESTAMPTZ,
    hours_until_exam NUMERIC,
    needs_48h_reminder BOOLEAN,
    needs_24h_reminder BOOLEAN,
    confirmation_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id as booking_id,
        u.email as user_email,
        b.scheduled_start_time as exam_time,
        EXTRACT(EPOCH FROM (b.scheduled_start_time - NOW())) / 3600 as hours_until_exam,
        (NOT b.reminder_48h_sent AND b.scheduled_start_time BETWEEN NOW() + INTERVAL '47 hours' AND NOW() + INTERVAL '49 hours') as needs_48h_reminder,
        (NOT b.reminder_24h_sent AND b.scheduled_start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours') as needs_24h_reminder,
        b.confirmation_code
    FROM public.exam_bookings b
    JOIN public.users u ON u.id = b.user_id
    WHERE b.status = 'scheduled'
    AND b.scheduled_start_time > NOW()
    AND (
        (NOT b.reminder_48h_sent AND b.scheduled_start_time < NOW() + INTERVAL '49 hours')
        OR
        (NOT b.reminder_24h_sent AND b.scheduled_start_time < NOW() + INTERVAL '25 hours')
    )
    ORDER BY b.scheduled_start_time ASC;
END;
$$;

-- ============================================================================
-- 5. Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.queue_48h_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_24h_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_all_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_upcoming_reminders() TO authenticated;

-- Grant service role access for cron jobs
GRANT EXECUTE ON FUNCTION public.queue_48h_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_24h_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_all_reminders() TO service_role;

-- ============================================================================
-- 6. Create Indexes for Reminder Queries
-- ============================================================================

-- Index for finding bookings needing 48h reminders
CREATE INDEX IF NOT EXISTS idx_exam_bookings_48h_reminders
ON public.exam_bookings(scheduled_start_time)
WHERE status = 'scheduled' AND reminder_48h_sent = FALSE;

-- Index for finding bookings needing 24h reminders
CREATE INDEX IF NOT EXISTS idx_exam_bookings_24h_reminders
ON public.exam_bookings(scheduled_start_time)
WHERE status = 'scheduled' AND reminder_24h_sent = FALSE;

-- ============================================================================
-- 7. Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Reminder System created successfully';
    RAISE NOTICE '📝 Functions created:';
    RAISE NOTICE '   - queue_48h_reminders()';
    RAISE NOTICE '   - queue_24h_reminders()';
    RAISE NOTICE '   - process_all_reminders()';
    RAISE NOTICE '   - get_upcoming_reminders()';
    RAISE NOTICE '📝 Indexes created for optimal performance';
    RAISE NOTICE '⏰ Ready to schedule cron job';
END $$;

SELECT
    '✅ Reminder System' as component,
    'Created' as status,
    (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%reminder%') as functions_created;
