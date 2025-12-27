-- Migration: Add Competency Tagging to Questions
-- Date: 2025-10-10
-- Description: Add structured competency taxonomy to quiz and mock exam questions

-- =============================================================================
-- ALTER TABLE: quiz_questions
-- Add competency taxonomy fields for Quiz System questions
-- =============================================================================

-- Add competency section (knowledge_based vs behavioral)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS competency_section TEXT CHECK (competency_section IN ('knowledge_based', 'behavioral'));

-- Add main competency name (one of the 14)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS competency_name TEXT;

-- Add sub-competency (lesson) name (one of 42)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS sub_competency_name TEXT;

-- Add tags for additional filtering
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add flag for shared questions (can be used across multiple quizzes)
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- =============================================================================
-- INDEXES for quiz_questions
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_quiz_questions_competency_section ON public.quiz_questions(competency_section);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_competency_name ON public.quiz_questions(competency_name);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_sub_competency ON public.quiz_questions(sub_competency_name);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_shared ON public.quiz_questions(is_shared);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_tags ON public.quiz_questions USING gin(tags);

-- Composite index for competency taxonomy lookup
CREATE INDEX IF NOT EXISTS idx_quiz_questions_taxonomy
ON public.quiz_questions(competency_section, competency_name, sub_competency_name);

-- =============================================================================
-- ALTER TABLE: mock_exam_questions
-- Add competency taxonomy fields for Mock Exam questions
-- =============================================================================

-- Add competency section (knowledge_based vs behavioral)
ALTER TABLE public.mock_exam_questions
ADD COLUMN IF NOT EXISTS competency_section TEXT CHECK (competency_section IN ('knowledge_based', 'behavioral'));

-- Add main competency name (one of the 14)
ALTER TABLE public.mock_exam_questions
ADD COLUMN IF NOT EXISTS competency_name TEXT;

-- Add sub-competency (lesson) name (one of 42)
ALTER TABLE public.mock_exam_questions
ADD COLUMN IF NOT EXISTS sub_competency_name TEXT;

-- Add tags for additional filtering
ALTER TABLE public.mock_exam_questions
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add difficulty level (reuse existing if available, or add)
-- Note: mock_exam_questions doesn't have difficulty in original schema, so we add it
ALTER TABLE public.mock_exam_questions
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium';

-- =============================================================================
-- INDEXES for mock_exam_questions
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_competency_section ON public.mock_exam_questions(competency_section);
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_competency_name ON public.mock_exam_questions(competency_name);
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_sub_competency ON public.mock_exam_questions(sub_competency_name);
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_difficulty ON public.mock_exam_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_tags ON public.mock_exam_questions USING gin(tags);

-- Composite index for competency taxonomy lookup
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_taxonomy
ON public.mock_exam_questions(competency_section, competency_name, sub_competency_name);

-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Quiz questions
COMMENT ON COLUMN public.quiz_questions.competency_section IS 'BDA BoCK section: knowledge_based (1-7) or behavioral (8-14)';
COMMENT ON COLUMN public.quiz_questions.competency_name IS 'Main competency name (one of 14)';
COMMENT ON COLUMN public.quiz_questions.sub_competency_name IS 'Sub-competency/lesson name (one of 42)';
COMMENT ON COLUMN public.quiz_questions.is_shared IS 'If true, question can be reused across multiple quizzes';
COMMENT ON COLUMN public.quiz_questions.tags IS 'Additional tags for filtering (e.g., ["communication", "leadership"])';

-- Mock exam questions
COMMENT ON COLUMN public.mock_exam_questions.competency_section IS 'BDA BoCK section: knowledge_based (1-7) or behavioral (8-14)';
COMMENT ON COLUMN public.mock_exam_questions.competency_name IS 'Main competency name (one of 14)';
COMMENT ON COLUMN public.mock_exam_questions.sub_competency_name IS 'Sub-competency/lesson name (one of 42)';
COMMENT ON COLUMN public.mock_exam_questions.difficulty IS 'Question difficulty level';
COMMENT ON COLUMN public.mock_exam_questions.tags IS 'Additional tags for filtering (e.g., ["strategic-thinking", "problem-solving"])';

-- =============================================================================
-- HELPER FUNCTION: Get questions by competency
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_questions_by_competency(
    p_competency_section TEXT,
    p_competency_name TEXT DEFAULT NULL,
    p_sub_competency_name TEXT DEFAULT NULL,
    p_include_shared BOOLEAN DEFAULT true
)
RETURNS TABLE (
    question_id UUID,
    question_text TEXT,
    question_type TEXT,
    source_table TEXT,
    competency_section TEXT,
    competency_name TEXT,
    sub_competency_name TEXT
) AS $$
BEGIN
    -- Return questions from both quiz_questions and mock_exam_questions
    RETURN QUERY

    -- Quiz questions
    SELECT
        q.id,
        q.question_text,
        q.question_type::TEXT,
        'quiz_questions'::TEXT as source_table,
        q.competency_section,
        q.competency_name,
        q.sub_competency_name
    FROM public.quiz_questions q
    WHERE q.competency_section = p_competency_section
    AND (p_competency_name IS NULL OR q.competency_name = p_competency_name)
    AND (p_sub_competency_name IS NULL OR q.sub_competency_name = p_sub_competency_name)
    AND (p_include_shared = true OR q.is_shared = true)

    UNION ALL

    -- Mock exam questions
    SELECT
        m.id,
        m.question_text,
        m.question_type::TEXT,
        'mock_exam_questions'::TEXT as source_table,
        m.competency_section,
        m.competency_name,
        m.sub_competency_name
    FROM public.mock_exam_questions m
    WHERE m.competency_section = p_competency_section
    AND (p_competency_name IS NULL OR m.competency_name = p_competency_name)
    AND (p_sub_competency_name IS NULL OR m.sub_competency_name = p_sub_competency_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_questions_by_competency IS 'Get questions filtered by competency taxonomy from both quiz and mock exam systems';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Quiz questions competency tagging added' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions'
    AND column_name = 'competency_section'
);

SELECT '✅ Mock exam questions competency tagging added' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_exam_questions'
    AND column_name = 'competency_section'
);

SELECT '✅ Competency tagging complete!' as status;
