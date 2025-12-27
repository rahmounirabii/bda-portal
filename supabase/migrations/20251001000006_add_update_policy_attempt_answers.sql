-- Migration: Add UPDATE policy for mock_exam_attempt_answers
-- Date: 2025-10-01
-- Description: Allow updating answer corrections during exam completion

-- UPDATE: System can update answers for correction (is_correct, points_earned)
-- This allows the completeExam() function to update the correction results
CREATE POLICY "Allow updating attempt answers for correction"
ON public.mock_exam_attempt_answers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mock_exam_attempts
        WHERE id = mock_exam_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mock_exam_attempts
        WHERE id = mock_exam_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
);
