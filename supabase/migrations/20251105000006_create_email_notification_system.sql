-- Migration: Email Notification System
-- Date: 2025-11-05
-- Description: Database triggers and functions for email notifications
-- Requirements: task.md Step 4 - Email Confirmations

-- ============================================================================
-- 1. Create email_queue table for reliable delivery
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Email Details
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    template_name TEXT NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Delivery Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message TEXT,

    -- Priority
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=highest, 10=lowest

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    related_entity_type TEXT, -- 'exam_booking', 'identity_verification', etc.
    related_entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status
ON public.email_queue(status, scheduled_for)
WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_email_queue_related
ON public.email_queue(related_entity_type, related_entity_id);

-- Comments
COMMENT ON TABLE public.email_queue IS 'Queue for outgoing emails with retry logic';
COMMENT ON COLUMN public.email_queue.priority IS '1=highest priority, 10=lowest priority';

-- ============================================================================
-- 2. Email Templates Constants
-- ============================================================================

-- Create a function to get email template content
CREATE OR REPLACE FUNCTION public.get_email_template(
    p_template_name TEXT
)
RETURNS TABLE (
    subject TEXT,
    html_body TEXT,
    text_body TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Booking Confirmation Template
    IF p_template_name = 'booking_confirmation' THEN
        RETURN QUERY SELECT
            'BDA Exam Booking Confirmed - {{confirmation_code}}'::TEXT as subject,
            E'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exam Booking Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">✓ Booking Confirmed!</h1>
    </div>

    <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Dear {{candidate_name}},</p>

        <p>Your BDA certification exam has been successfully scheduled!</p>

        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">Confirmation Code</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 10px 0; letter-spacing: 2px;">{{confirmation_code}}</p>
        </div>

        <h3 style="color: #667eea;">Exam Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 120px;">Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{exam_date}}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Time:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{exam_time}}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Timezone:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{timezone}}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Duration:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{duration}}</td>
            </tr>
        </table>

        <h3 style="color: #667eea;">What''s Next?</h3>
        <ul style="padding-left: 20px;">
            <li><strong>Email Reminders:</strong> We''ll send reminders 48 and 24 hours before your exam</li>
            <li><strong>System Check:</strong> Test your computer, camera, and internet connection</li>
            <li><strong>ID Ready:</strong> Have your government-issued ID ready for verification</li>
            <li><strong>Join Early:</strong> Log in 15 minutes before your scheduled time</li>
        </ul>

        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> Keep this confirmation code safe. You may need it to access your exam.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_url}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Dashboard</a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you need to reschedule or cancel, please contact support or visit your dashboard at least 24 hours before the exam.
        </p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

        <p style="color: #999; font-size: 12px; text-align: center;">
            BDA Association - Business Data Analytics Certification<br>
            This is an automated message. Please do not reply to this email.
        </p>
    </div>
</body>
</html>'::TEXT as html_body,
            E'BDA Exam Booking Confirmed

Dear {{candidate_name}},

Your BDA certification exam has been successfully scheduled!

CONFIRMATION CODE: {{confirmation_code}}

EXAM DETAILS:
- Date: {{exam_date}}
- Time: {{exam_time}}
- Timezone: {{timezone}}
- Duration: {{duration}}

WHAT''S NEXT:
1. Email Reminders: We''ll send reminders 48 and 24 hours before your exam
2. System Check: Test your computer, camera, and internet connection
3. ID Ready: Have your government-issued ID ready for verification
4. Join Early: Log in 15 minutes before your scheduled time

IMPORTANT: Keep this confirmation code safe. You may need it to access your exam.

View in Dashboard: {{dashboard_url}}

If you need to reschedule or cancel, please contact support or visit your dashboard at least 24 hours before the exam.

---
BDA Association - Business Data Analytics Certification
This is an automated message. Please do not reply to this email.'::TEXT as text_body;

    -- Exam Reminder Template (48h)
    ELSIF p_template_name = 'exam_reminder_48h' THEN
        RETURN QUERY SELECT
            'Reminder: Your BDA Exam in 48 Hours'::TEXT as subject,
            E'<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #667eea;">📅 Your Exam is in 48 Hours!</h2>
    <p>Dear {{candidate_name}},</p>
    <p>This is a friendly reminder that your BDA certification exam is scheduled for:</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> {{exam_date}}</p>
        <p><strong>Time:</strong> {{exam_time}}</p>
        <p><strong>Confirmation Code:</strong> {{confirmation_code}}</p>
    </div>
    <p><strong>Action Items:</strong></p>
    <ul>
        <li>✅ Complete system compatibility check</li>
        <li>✅ Prepare your government-issued ID</li>
        <li>✅ Ensure stable internet connection</li>
        <li>✅ Test your webcam and microphone</li>
        <li>✅ Prepare a quiet, well-lit environment</li>
    </ul>
    <p>Good luck with your exam!</p>
</body>
</html>'::TEXT as html_body,
            'Your BDA exam is in 48 hours on {{exam_date}} at {{exam_time}}. Confirmation: {{confirmation_code}}.'::TEXT as text_body;

    -- Exam Reminder Template (24h)
    ELSIF p_template_name = 'exam_reminder_24h' THEN
        RETURN QUERY SELECT
            'Final Reminder: Your BDA Exam Tomorrow'::TEXT as subject,
            E'<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc3545;">⏰ Your Exam is Tomorrow!</h2>
    <p>Dear {{candidate_name}},</p>
    <p>Final reminder: Your BDA certification exam is scheduled for tomorrow!</p>
    <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> {{exam_date}}</p>
        <p><strong>Time:</strong> {{exam_time}}</p>
        <p><strong>Confirmation Code:</strong> {{confirmation_code}}</p>
    </div>
    <p><strong>Last Checklist:</strong></p>
    <ul>
        <li>🆔 Government-issued ID ready</li>
        <li>💻 Computer fully charged/plugged in</li>
        <li>🌐 Stable internet connection tested</li>
        <li>📹 Webcam and microphone working</li>
        <li>🔇 Quiet, private environment arranged</li>
    </ul>
    <p><strong>Remember:</strong> Join at least 15 minutes early for identity verification.</p>
    <p>We wish you the best of luck!</p>
</body>
</html>'::TEXT as html_body,
            'Final reminder: Your BDA exam is tomorrow, {{exam_date}} at {{exam_time}}. Join 15 minutes early. Confirmation: {{confirmation_code}}.'::TEXT as text_body;

    ELSE
        RAISE EXCEPTION 'Unknown template name: %', p_template_name;
    END IF;
END;
$$;

-- ============================================================================
-- 3. Function to Queue Email
-- ============================================================================

CREATE OR REPLACE FUNCTION public.queue_email(
    p_recipient_email TEXT,
    p_recipient_name TEXT,
    p_template_name TEXT,
    p_template_data JSONB,
    p_priority INTEGER DEFAULT 5,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email_id UUID;
    v_template RECORD;
BEGIN
    -- Validate template exists
    SELECT * INTO v_template FROM public.get_email_template(p_template_name);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid template name: %', p_template_name;
    END IF;

    -- Insert email into queue
    INSERT INTO public.email_queue (
        recipient_email,
        recipient_name,
        subject,
        template_name,
        template_data,
        priority,
        scheduled_for,
        related_entity_type,
        related_entity_id
    ) VALUES (
        p_recipient_email,
        p_recipient_name,
        v_template.subject,
        p_template_name,
        p_template_data,
        p_priority,
        p_scheduled_for,
        p_related_entity_type,
        p_related_entity_id
    ) RETURNING id INTO v_email_id;

    RETURN v_email_id;
END;
$$;

-- ============================================================================
-- 4. Trigger to Send Booking Confirmation Email
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_booking_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_timeslot RECORD;
    v_quiz RECORD;
    v_template_data JSONB;
    v_duration TEXT;
BEGIN
    -- Only send for new bookings with 'scheduled' status
    IF TG_OP = 'INSERT' AND NEW.status = 'scheduled' THEN

        -- Get user details
        SELECT email, first_name, last_name
        INTO v_user
        FROM public.users
        WHERE id = NEW.user_id;

        IF NOT FOUND THEN
            RAISE WARNING 'User not found for booking %', NEW.id;
            RETURN NEW;
        END IF;

        -- Get timeslot details
        SELECT *
        INTO v_timeslot
        FROM public.exam_timeslots
        WHERE id = NEW.timeslot_id;

        -- Get quiz details
        SELECT title, time_limit_minutes
        INTO v_quiz
        FROM public.quizzes
        WHERE id = NEW.quiz_id;

        -- Calculate duration
        IF v_quiz.time_limit_minutes IS NOT NULL THEN
            v_duration := v_quiz.time_limit_minutes || ' minutes';
        ELSE
            v_duration := EXTRACT(EPOCH FROM (v_timeslot.end_time - v_timeslot.start_time)) / 60 || ' minutes';
        END IF;

        -- Prepare template data
        v_template_data := jsonb_build_object(
            'candidate_name', COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            'confirmation_code', NEW.confirmation_code,
            'exam_date', to_char(NEW.scheduled_start_time AT TIME ZONE NEW.timezone, 'Day, Month DD, YYYY'),
            'exam_time', to_char(NEW.scheduled_start_time AT TIME ZONE NEW.timezone, 'HH12:MI AM') || ' - ' ||
                         to_char(NEW.scheduled_end_time AT TIME ZONE NEW.timezone, 'HH12:MI AM'),
            'timezone', NEW.timezone,
            'duration', v_duration,
            'exam_title', v_quiz.title,
            'dashboard_url', 'https://portal.bda-association.com/dashboard'
        );

        -- Queue the confirmation email
        PERFORM public.queue_email(
            p_recipient_email := v_user.email,
            p_recipient_name := COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            p_template_name := 'booking_confirmation',
            p_template_data := v_template_data,
            p_priority := 3, -- High priority
            p_related_entity_type := 'exam_booking',
            p_related_entity_id := NEW.id
        );

        -- Mark confirmation as queued
        NEW.confirmation_email_sent := TRUE;
        NEW.confirmation_sent_at := NOW();

    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_send_booking_confirmation ON public.exam_bookings;
CREATE TRIGGER trigger_send_booking_confirmation
BEFORE INSERT ON public.exam_bookings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_booking_confirmation_email();

-- ============================================================================
-- 5. Enable RLS
-- ============================================================================

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view all emails
CREATE POLICY "Admins can view all emails"
    ON public.email_queue
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
-- 6. Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_email_template(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_email(TEXT, TEXT, TEXT, JSONB, INTEGER, TIMESTAMPTZ, TEXT, UUID) TO authenticated;

-- ============================================================================
-- 7. Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Email Notification System created successfully';
    RAISE NOTICE '📝 Table created: email_queue';
    RAISE NOTICE '📝 Functions created: get_email_template(), queue_email()';
    RAISE NOTICE '📝 Trigger created: trigger_send_booking_confirmation';
    RAISE NOTICE '📧 Email templates: booking_confirmation, exam_reminder_48h, exam_reminder_24h';
END $$;
