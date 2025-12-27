-- Fix mock_exam_attempts.completed_at to allow NULL for in-progress attempts
-- This allows attempts to be created without a completion timestamp,
-- which will be set when the exam is actually completed and graded

ALTER TABLE public.mock_exam_attempts
  ALTER COLUMN completed_at DROP NOT NULL;

-- Comment
COMMENT ON COLUMN public.mock_exam_attempts.completed_at IS 'Timestamp when exam was completed and graded. NULL for in-progress attempts.';
