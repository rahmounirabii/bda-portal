-- Migration: Create Lesson Progress Tracking
-- Date: 2025-10-10
-- Description: Track user progress through individual lessons (42 total)

-- =============================================================================
-- TABLE: user_lesson_progress
-- Tracks progress through individual lessons (sub-competencies)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,

    -- Progress Status
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'quiz_pending', 'completed')),

    -- Reading Progress
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- Quiz Progress (links to QUIZ system)
    best_quiz_score INTEGER CHECK (best_quiz_score BETWEEN 0 AND 100),
    quiz_attempts_count INTEGER NOT NULL DEFAULT 0,
    last_quiz_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,

    -- Completion
    completed_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_lesson_progress UNIQUE (user_id, lesson_id),
    CONSTRAINT valid_lesson_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL AND best_quiz_score IS NOT NULL) OR
        (status != 'completed')
    )
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_user_lesson_progress_user ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON public.user_lesson_progress(lesson_id);
CREATE INDEX idx_user_lesson_progress_status ON public.user_lesson_progress(status);
CREATE INDEX idx_user_lesson_progress_completed ON public.user_lesson_progress(completed_at);
CREATE INDEX idx_user_lesson_progress_user_status ON public.user_lesson_progress(user_id, status);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.user_lesson_progress IS 'Tracks user progress through curriculum lessons (42 sub-competencies)';
COMMENT ON COLUMN public.user_lesson_progress.status IS 'locked: not yet accessible, in_progress: reading content, quiz_pending: read but not passed quiz, completed: passed quiz';
COMMENT ON COLUMN public.user_lesson_progress.best_quiz_score IS 'Best score achieved on lesson quiz (0-100)';
COMMENT ON COLUMN public.user_lesson_progress.last_quiz_attempt_id IS 'Links to latest quiz attempt in quiz_attempts table';

-- =============================================================================
-- FUNCTION: is_lesson_unlocked
-- Check if a lesson is unlocked for a user (previous lesson completed)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_lesson_unlocked(
    p_user_id UUID,
    p_lesson_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_lesson_order INTEGER;
    v_module_id UUID;
    v_previous_lesson_id UUID;
    v_previous_status TEXT;
    v_module_unlocked BOOLEAN;
BEGIN
    -- Get lesson details
    SELECT order_index, module_id INTO v_lesson_order, v_module_id
    FROM public.curriculum_lessons
    WHERE id = p_lesson_id;

    -- First, check if parent module is unlocked
    v_module_unlocked := public.is_module_unlocked(p_user_id, v_module_id);
    IF NOT v_module_unlocked THEN
        RETURN FALSE;
    END IF;

    -- If first lesson (order_index = 1), it's unlocked if module is unlocked
    IF v_lesson_order = 1 THEN
        RETURN TRUE;
    END IF;

    -- Get previous lesson ID
    SELECT id INTO v_previous_lesson_id
    FROM public.curriculum_lessons
    WHERE module_id = v_module_id
    AND order_index = v_lesson_order - 1;

    -- Check if previous lesson is completed
    SELECT status INTO v_previous_status
    FROM public.user_lesson_progress
    WHERE user_id = p_user_id AND lesson_id = v_previous_lesson_id;

    RETURN COALESCE(v_previous_status = 'completed', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_lesson_unlocked IS 'Checks if a lesson is unlocked: parent module must be unlocked AND previous lesson completed';

-- =============================================================================
-- FUNCTION: get_lesson_progress_summary
-- Get progress summary for a user across all lessons
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_lesson_progress_summary(p_user_id UUID)
RETURNS TABLE (
    total_lessons INTEGER,
    completed_lessons INTEGER,
    in_progress_lessons INTEGER,
    locked_lessons INTEGER,
    completion_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_lessons,
        COUNT(*) FILTER (WHERE lp.status = 'completed')::INTEGER as completed_lessons,
        COUNT(*) FILTER (WHERE lp.status = 'in_progress')::INTEGER as in_progress_lessons,
        COUNT(*) FILTER (WHERE lp.status = 'locked')::INTEGER as locked_lessons,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE lp.status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100)::INTEGER
            ELSE 0
        END as completion_percentage
    FROM public.curriculum_lessons l
    LEFT JOIN public.user_lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = p_user_id
    WHERE l.is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lesson_progress_summary IS 'Returns summary of lesson progress for a user';

-- =============================================================================
-- FUNCTION: initialize_lesson_progress
-- Create progress records for all published lessons when user gets curriculum access
-- =============================================================================

CREATE OR REPLACE FUNCTION public.initialize_lesson_progress(
    p_user_id UUID,
    p_certification_type certification_type
) RETURNS INTEGER AS $$
DECLARE
    v_inserted_count INTEGER := 0;
BEGIN
    -- Insert progress records for all published lessons of the certification type
    INSERT INTO public.user_lesson_progress (user_id, lesson_id, status)
    SELECT
        p_user_id,
        l.id,
        CASE
            -- First lesson of first module is unlocked
            WHEN m.order_index = 1 AND l.order_index = 1 THEN 'in_progress'
            ELSE 'locked'
        END as status
    FROM public.curriculum_lessons l
    JOIN public.curriculum_modules m ON m.id = l.module_id
    WHERE m.certification_type = p_certification_type
    AND l.is_published = true
    AND NOT EXISTS (
        SELECT 1 FROM public.user_lesson_progress
        WHERE user_id = p_user_id AND lesson_id = l.id
    );

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.initialize_lesson_progress IS 'Initialize progress records for all lessons when user gets curriculum access';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_user_lesson_progress_updated_at
    BEFORE UPDATE ON public.user_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "user_lesson_progress_read_own" ON public.user_lesson_progress
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "user_lesson_progress_update_own" ON public.user_lesson_progress
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "user_lesson_progress_insert_own" ON public.user_lesson_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all progress
CREATE POLICY "user_lesson_progress_admin_read" ON public.user_lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can manage all progress
CREATE POLICY "user_lesson_progress_admin_write" ON public.user_lesson_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.user_lesson_progress TO authenticated;
GRANT ALL ON public.user_lesson_progress TO service_role;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ user_lesson_progress table created successfully!' as status;
SELECT '✅ Lesson progress tracking functions created!' as status;
