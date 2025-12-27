-- Migration: Add Mock Exam Constraints (After Enum Values Committed)
-- Date: 2025-10-10
-- Description: Add check constraints that use new enum values (must be separate transaction)

-- =============================================================================
-- ADD CHECK CONSTRAINT
-- This must be in a separate migration because PostgreSQL doesn't allow
-- using newly added enum values in the same transaction
-- =============================================================================

-- Add check constraint: competency_assessment must have module_id
ALTER TABLE public.mock_exams
DROP CONSTRAINT IF EXISTS mock_exam_competency_link_check;

ALTER TABLE public.mock_exams
ADD CONSTRAINT mock_exam_competency_link_check CHECK (
    (category = 'competency_assessment' AND competency_module_id IS NOT NULL) OR
    (category != 'competency_assessment')
);

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Mock exam constraints added successfully!' as status;
