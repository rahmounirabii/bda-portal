-- ============================================================================
-- MIGRATION: Rename estimated_duration_hours to estimated_minutes
-- ============================================================================
-- Migration: 20251008161000
-- Description: Renames column for better precision and frontend compatibility
-- ============================================================================

BEGIN;

-- Rename the column
ALTER TABLE public.curriculum_modules
RENAME COLUMN estimated_duration_hours TO estimated_minutes;

-- Update existing values: convert hours to minutes (multiply by 60)
-- CP modules: 3 hours -> 180 minutes
-- SCP modules: 4 hours -> 240 minutes
UPDATE public.curriculum_modules
SET estimated_minutes = estimated_minutes * 60
WHERE certification_type IN ('CP', 'SCP');

COMMIT;

-- Verify
SELECT
    certification_type,
    competency_name,
    estimated_minutes
FROM public.curriculum_modules
ORDER BY certification_type, order_index
LIMIT 5;
