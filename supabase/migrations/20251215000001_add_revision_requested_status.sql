-- Add 'revision_requested' and 'pending' to pdp_programs status constraint
-- This migration updates the status field to support the full review workflow

-- Drop the existing constraint
ALTER TABLE public.pdp_programs
  DROP CONSTRAINT IF EXISTS pdp_programs_status_check;

-- Add the new constraint with additional statuses
ALTER TABLE public.pdp_programs
  ADD CONSTRAINT pdp_programs_status_check
  CHECK (status IN ('draft', 'pending', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested', 'expired'));

-- Update 'submitted' status to 'pending' for clarity
UPDATE public.pdp_programs
SET status = 'pending'
WHERE status = 'submitted';
