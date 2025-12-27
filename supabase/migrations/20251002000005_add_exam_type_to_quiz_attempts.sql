-- Migration: Add exam_type column to quiz_attempts table
-- Date: 2025-10-02
-- Description: Add exam_type to distinguish between mock exams and real certification exams

-- Add exam_type column to quiz_attempts
ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'mock';

-- Add constraint to ensure valid exam types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_exam_type'
        AND conrelid = 'public.quiz_attempts'::regclass
    ) THEN
        ALTER TABLE public.quiz_attempts
        ADD CONSTRAINT valid_exam_type
        CHECK (exam_type IN ('mock', 'certification', 'practice'));
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_exam_type
ON public.quiz_attempts(exam_type);

-- Comment
COMMENT ON COLUMN public.quiz_attempts.exam_type IS 'Type of exam: mock (practice), certification (official), practice (general)';

SELECT '✅ exam_type column added to quiz_attempts table' as status;
