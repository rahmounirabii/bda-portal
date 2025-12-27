-- Migration: Create Curriculum Lessons (Sub-Competencies)
-- Date: 2025-10-10
-- Description: Adds lesson/sub-competency structure - 3 lessons per competency (42 total)

-- =============================================================================
-- TABLE: curriculum_lessons
-- Sub-competencies (3 per main competency = 42 total)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relation to main competency
    module_id UUID NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,

    -- Lesson metadata
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,

    -- Rich Content (JSON format for TipTap/Lexical editor)
    content JSONB NOT NULL DEFAULT '{}',
    content_ar JSONB DEFAULT '{}',

    -- Learning objectives
    learning_objectives TEXT[] DEFAULT '{}',
    learning_objectives_ar TEXT[] DEFAULT '{}',
    estimated_duration_hours INTEGER DEFAULT 1,

    -- Order within competency (1, 2, or 3)
    order_index INTEGER NOT NULL CHECK (order_index BETWEEN 1 AND 3),

    -- Quiz Integration (QUIZ SYSTEM - formative assessment)
    lesson_quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    quiz_required BOOLEAN NOT NULL DEFAULT true,
    quiz_passing_score INTEGER NOT NULL DEFAULT 70 CHECK (quiz_passing_score BETWEEN 0 AND 100),

    -- Publishing control
    is_published BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_module_lesson_order UNIQUE (module_id, order_index)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_curriculum_lessons_module ON public.curriculum_lessons(module_id);
CREATE INDEX idx_curriculum_lessons_quiz ON public.curriculum_lessons(lesson_quiz_id);
CREATE INDEX idx_curriculum_lessons_order ON public.curriculum_lessons(module_id, order_index);
CREATE INDEX idx_curriculum_lessons_published ON public.curriculum_lessons(is_published);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.curriculum_lessons IS 'Sub-competencies (lessons) - 3 per main competency, 42 total for BDA BoCK';
COMMENT ON COLUMN public.curriculum_lessons.lesson_quiz_id IS 'Links to QUIZ system for formative lesson assessment';
COMMENT ON COLUMN public.curriculum_lessons.order_index IS 'Position within parent competency (1-3)';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_curriculum_lessons_updated_at
    BEFORE UPDATE ON public.curriculum_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;

-- Users can view published lessons if they have curriculum access
CREATE POLICY "curriculum_lessons_read" ON public.curriculum_lessons
    FOR SELECT USING (
        is_published = true
        AND EXISTS (
            SELECT 1 FROM public.curriculum_modules m
            JOIN public.user_curriculum_access a ON a.certification_type = m.certification_type
            WHERE m.id = curriculum_lessons.module_id
            AND a.user_id = auth.uid()
            AND a.is_active = true
            AND a.expires_at > NOW()
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can create/update/delete lessons
CREATE POLICY "curriculum_lessons_write" ON public.curriculum_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.curriculum_lessons TO authenticated;
GRANT ALL ON public.curriculum_lessons TO service_role;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ curriculum_lessons table created successfully!' as status;
