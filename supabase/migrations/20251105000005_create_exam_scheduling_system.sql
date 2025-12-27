-- Migration: Exam Scheduling System
-- Date: 2025-11-05
-- Description: Complete exam scheduling system with timezone support and availability management
-- Requirements: task.md Step 4 - Schedule the Exam

-- ============================================================================
-- 1. Create exam_booking_status ENUM
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.exam_booking_status AS ENUM (
        'scheduled',      -- Booking confirmed
        'rescheduled',    -- Booking was rescheduled
        'cancelled',      -- Booking cancelled by user
        'no_show',        -- User didn't show up
        'completed',      -- Exam completed
        'expired'         -- Booking expired (not used within validity period)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.exam_booking_status IS 'Status of exam booking';

-- ============================================================================
-- 2. Create exam_timeslots table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_timeslots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Exam Configuration
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    certification_product_id UUID REFERENCES public.certification_products(id) ON DELETE SET NULL,

    -- Timeslot Details
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',

    -- Capacity Management
    max_capacity INTEGER NOT NULL DEFAULT 1, -- How many candidates can book this slot
    current_bookings INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadata
    notes TEXT, -- Admin notes about this timeslot
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_timeslot_duration CHECK (end_time > start_time),
    CONSTRAINT valid_capacity CHECK (max_capacity > 0),
    CONSTRAINT valid_bookings CHECK (current_bookings >= 0 AND current_bookings <= max_capacity)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_timeslots_quiz
ON public.exam_timeslots(quiz_id, start_time);

CREATE INDEX IF NOT EXISTS idx_exam_timeslots_availability
ON public.exam_timeslots(quiz_id, is_available, start_time)
WHERE is_available = TRUE;

CREATE INDEX IF NOT EXISTS idx_exam_timeslots_date_range
ON public.exam_timeslots(start_time, end_time);

-- Comments
COMMENT ON TABLE public.exam_timeslots IS 'Available timeslots for exam scheduling';
COMMENT ON COLUMN public.exam_timeslots.max_capacity IS 'Maximum number of concurrent candidates for this slot';
COMMENT ON COLUMN public.exam_timeslots.current_bookings IS 'Current number of confirmed bookings';

-- ============================================================================
-- 3. Create exam_bookings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Booking Details
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    timeslot_id UUID REFERENCES public.exam_timeslots(id) ON DELETE SET NULL,

    -- Scheduling
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL,

    -- Status
    status public.exam_booking_status NOT NULL DEFAULT 'scheduled',

    -- Voucher Link
    voucher_id UUID REFERENCES public.exam_vouchers(id) ON DELETE SET NULL,

    -- Confirmation
    confirmation_code TEXT UNIQUE,
    confirmation_sent_at TIMESTAMPTZ,
    confirmation_email_sent BOOLEAN DEFAULT FALSE,

    -- Reminders
    reminder_48h_sent BOOLEAN DEFAULT FALSE,
    reminder_48h_sent_at TIMESTAMPTZ,
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_24h_sent_at TIMESTAMPTZ,

    -- Exam Attempt Link
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,

    -- Rescheduling History
    original_booking_id UUID REFERENCES public.exam_bookings(id) ON DELETE SET NULL,
    rescheduled_from_time TIMESTAMPTZ,
    reschedule_count INTEGER DEFAULT 0,
    reschedule_reason TEXT,

    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Metadata
    booking_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_scheduled_duration CHECK (scheduled_end_time > scheduled_start_time),
    CONSTRAINT valid_reschedule_count CHECK (reschedule_count >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_bookings_user
ON public.exam_bookings(user_id, scheduled_start_time DESC);

CREATE INDEX IF NOT EXISTS idx_exam_bookings_quiz
ON public.exam_bookings(quiz_id, scheduled_start_time);

CREATE INDEX IF NOT EXISTS idx_exam_bookings_timeslot
ON public.exam_bookings(timeslot_id, status);

CREATE INDEX IF NOT EXISTS idx_exam_bookings_status
ON public.exam_bookings(status, scheduled_start_time);

-- Note: Partial index on future bookings - filtered at query time since NOW() is not immutable
CREATE INDEX IF NOT EXISTS idx_exam_bookings_upcoming
ON public.exam_bookings(scheduled_start_time)
WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_exam_bookings_reminders
ON public.exam_bookings(scheduled_start_time, reminder_48h_sent, reminder_24h_sent)
WHERE status = 'scheduled';

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_bookings_confirmation_code
ON public.exam_bookings(confirmation_code)
WHERE confirmation_code IS NOT NULL;

-- Comments
COMMENT ON TABLE public.exam_bookings IS 'Exam booking records with scheduling and reminder tracking';
COMMENT ON COLUMN public.exam_bookings.confirmation_code IS 'Unique confirmation code sent to candidate';
COMMENT ON COLUMN public.exam_bookings.reschedule_count IS 'Number of times this booking has been rescheduled';

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE public.exam_timeslots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_bookings ENABLE ROW LEVEL SECURITY;

-- Timeslots: Everyone can view available slots
CREATE POLICY "Anyone can view available timeslots"
    ON public.exam_timeslots
    FOR SELECT
    TO authenticated
    USING (is_available = TRUE);

-- Timeslots: Admins can manage all
CREATE POLICY "Admins can manage all timeslots"
    ON public.exam_timeslots
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
    ON public.exam_bookings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Bookings: Users can create their own bookings
CREATE POLICY "Users can create own bookings"
    ON public.exam_bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Bookings: Users can update their own bookings (for rescheduling/cancellation)
CREATE POLICY "Users can update own bookings"
    ON public.exam_bookings
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Bookings: Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
    ON public.exam_bookings
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

-- Function to generate unique confirmation code
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code (e.g., BDA-X7K9M2P4)
        v_code := 'BDA-' || upper(substring(md5(random()::text) from 1 for 8));

        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM public.exam_bookings WHERE confirmation_code = v_code
        ) INTO v_exists;

        EXIT WHEN NOT v_exists;
    END LOOP;

    RETURN v_code;
END;
$$;

-- Function to check timeslot availability
CREATE OR REPLACE FUNCTION public.is_timeslot_available(
    p_timeslot_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot RECORD;
BEGIN
    SELECT
        is_available,
        max_capacity,
        current_bookings,
        start_time
    INTO v_slot
    FROM public.exam_timeslots
    WHERE id = p_timeslot_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if slot is available, has capacity, and is in the future
    RETURN v_slot.is_available
        AND v_slot.current_bookings < v_slot.max_capacity
        AND v_slot.start_time > NOW();
END;
$$;

-- Function to create exam booking
CREATE OR REPLACE FUNCTION public.create_exam_booking(
    p_user_id UUID,
    p_quiz_id UUID,
    p_timeslot_id UUID,
    p_voucher_id UUID DEFAULT NULL,
    p_timezone TEXT DEFAULT 'UTC'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id UUID;
    v_timeslot RECORD;
    v_confirmation_code TEXT;
BEGIN
    -- Get timeslot details
    SELECT * INTO v_timeslot
    FROM public.exam_timeslots
    WHERE id = p_timeslot_id
    FOR UPDATE; -- Lock the row

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timeslot not found';
    END IF;

    -- Check availability
    IF NOT public.is_timeslot_available(p_timeslot_id) THEN
        RAISE EXCEPTION 'Timeslot is not available';
    END IF;

    -- Generate confirmation code
    v_confirmation_code := public.generate_confirmation_code();

    -- Create booking
    INSERT INTO public.exam_bookings (
        user_id,
        quiz_id,
        timeslot_id,
        scheduled_start_time,
        scheduled_end_time,
        timezone,
        voucher_id,
        confirmation_code,
        status
    ) VALUES (
        p_user_id,
        p_quiz_id,
        p_timeslot_id,
        v_timeslot.start_time,
        v_timeslot.end_time,
        p_timezone,
        p_voucher_id,
        v_confirmation_code,
        'scheduled'
    ) RETURNING id INTO v_booking_id;

    -- Increment timeslot booking count
    UPDATE public.exam_timeslots
    SET current_bookings = current_bookings + 1,
        updated_at = NOW()
    WHERE id = p_timeslot_id;

    -- Log audit event
    PERFORM public.log_audit_event(
        'exam_registered',
        p_user_id,
        'User scheduled exam',
        p_user_id,
        'exam_booking',
        v_booking_id::text,
        p_quiz_id,
        NULL,
        jsonb_build_object(
            'timeslot_id', p_timeslot_id,
            'scheduled_time', v_timeslot.start_time,
            'confirmation_code', v_confirmation_code
        ),
        NULL,
        NULL,
        'high',
        FALSE,
        TRUE,
        NULL
    );

    RETURN v_booking_id;
END;
$$;

-- Function to get available timeslots for a quiz
CREATE OR REPLACE FUNCTION public.get_available_timeslots(
    p_quiz_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW(),
    p_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
)
RETURNS TABLE (
    id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    timezone TEXT,
    available_slots INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.start_time,
        t.end_time,
        t.timezone,
        (t.max_capacity - t.current_bookings) as available_slots
    FROM public.exam_timeslots t
    WHERE t.quiz_id = p_quiz_id
    AND t.is_available = TRUE
    AND t.start_time BETWEEN p_start_date AND p_end_date
    AND t.start_time > NOW()
    AND t.current_bookings < t.max_capacity
    ORDER BY t.start_time ASC;
END;
$$;

-- Function to get user's upcoming bookings
CREATE OR REPLACE FUNCTION public.get_user_upcoming_bookings(
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    quiz_id UUID,
    scheduled_start_time TIMESTAMPTZ,
    scheduled_end_time TIMESTAMPTZ,
    timezone TEXT,
    status public.exam_booking_status,
    confirmation_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.quiz_id,
        b.scheduled_start_time,
        b.scheduled_end_time,
        b.timezone,
        b.status,
        b.confirmation_code
    FROM public.exam_bookings b
    WHERE b.user_id = p_user_id
    AND b.status = 'scheduled'
    AND b.scheduled_start_time > NOW()
    ORDER BY b.scheduled_start_time ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_confirmation_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_timeslot_available(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_exam_booking(UUID, UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_timeslots(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_upcoming_bookings(UUID) TO authenticated;

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_exam_timeslots_updated_at
BEFORE UPDATE ON public.exam_timeslots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_exam_bookings_updated_at
BEFORE UPDATE ON public.exam_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Exam Scheduling System created successfully';
    RAISE NOTICE '📝 Tables created:';
    RAISE NOTICE '   - exam_timeslots';
    RAISE NOTICE '   - exam_bookings';
    RAISE NOTICE '📝 Functions created:';
    RAISE NOTICE '   - create_exam_booking()';
    RAISE NOTICE '   - get_available_timeslots()';
    RAISE NOTICE '   - get_user_upcoming_bookings()';
    RAISE NOTICE '🔒 RLS policies enabled for security';
END $$;

SELECT
    '✅ Exam Scheduling System' as component,
    'Created' as status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('exam_timeslots', 'exam_bookings')) as tables_created;
