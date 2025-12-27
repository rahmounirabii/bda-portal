-- Safe migration: Add certification results columns if they don't exist
-- Date: 2025-10-01

-- Add columns to quiz_attempts (IF NOT EXISTS)
ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS total_points_earned INTEGER,
ADD COLUMN IF NOT EXISTS total_points_possible INTEGER,
ADD COLUMN IF NOT EXISTS passed BOOLEAN,
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER;

-- Add constraints (DROP IF EXISTS first to avoid conflicts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_score') THEN
        ALTER TABLE public.quiz_attempts
        ADD CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= 100));
    END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.quiz_attempts.score IS 'Final score as percentage (0-100)';
COMMENT ON COLUMN public.quiz_attempts.total_points_earned IS 'Total points earned by user';
COMMENT ON COLUMN public.quiz_attempts.total_points_possible IS 'Total possible points for the quiz';
COMMENT ON COLUMN public.quiz_attempts.passed IS 'Whether user passed the exam';
COMMENT ON COLUMN public.quiz_attempts.time_spent_minutes IS 'Time spent in minutes';

-- Create quiz_attempt_answers table if not exists
CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer_ids UUID[] NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- Indexes (DROP IF EXISTS first)
DROP INDEX IF EXISTS idx_quiz_attempt_answers_attempt;
DROP INDEX IF EXISTS idx_quiz_attempt_answers_question;

CREATE INDEX idx_quiz_attempt_answers_attempt ON public.quiz_attempt_answers(attempt_id);
CREATE INDEX idx_quiz_attempt_answers_question ON public.quiz_attempt_answers(question_id);

-- Enable RLS
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_attempt_answers (DROP IF EXISTS first)
DROP POLICY IF EXISTS "Users can view their own attempt answers" ON public.quiz_attempt_answers;
DROP POLICY IF EXISTS "Users can insert answers for their attempts" ON public.quiz_attempt_answers;
DROP POLICY IF EXISTS "Users can update their own attempt answers" ON public.quiz_attempt_answers;
DROP POLICY IF EXISTS "Admins can manage all attempt answers" ON public.quiz_attempt_answers;

CREATE POLICY "Users can view their own attempt answers"
ON public.quiz_attempt_answers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts
        WHERE id = quiz_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Users can insert answers for their attempts"
ON public.quiz_attempt_answers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts
        WHERE id = quiz_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own attempt answers"
ON public.quiz_attempt_answers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts
        WHERE id = quiz_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts
        WHERE id = quiz_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all attempt answers"
ON public.quiz_attempt_answers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);
