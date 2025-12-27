-- ============================================================================
-- MIGRATION: Fix curriculum_modules order_index constraint
-- ============================================================================
-- Migration: 20251008155500
-- Description: Updates order_index constraint to allow multiple certifications
--              with same order_index (unique per certification_type)
-- ============================================================================

BEGIN;

-- Drop the existing UNIQUE constraint on order_index
ALTER TABLE public.curriculum_modules
DROP CONSTRAINT IF EXISTS curriculum_modules_order_index_key;

-- Drop the existing CHECK constraint
ALTER TABLE public.curriculum_modules
DROP CONSTRAINT IF EXISTS curriculum_modules_order_index_check;

-- Add new CHECK constraint that allows 1-14 for each certification
ALTER TABLE public.curriculum_modules
ADD CONSTRAINT curriculum_modules_order_index_check
CHECK (order_index BETWEEN 1 AND 14);

-- Add composite UNIQUE constraint (order_index + certification_type)
-- This allows CP Module 1 and SCP Module 1 to coexist
ALTER TABLE public.curriculum_modules
ADD CONSTRAINT curriculum_modules_order_cert_unique
UNIQUE (order_index, certification_type);

COMMIT;

-- Verify constraint
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.curriculum_modules'::regclass
    AND conname LIKE '%order%';
