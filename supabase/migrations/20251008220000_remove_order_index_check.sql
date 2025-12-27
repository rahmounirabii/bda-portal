-- ============================================================================
-- MIGRATION: Remove order_index CHECK constraints
-- ============================================================================
-- Migration: 20251008220000
-- Description: Removes CHECK constraints limiting order_index ranges
--              to allow flexible module creation without range restrictions
-- ============================================================================

BEGIN;

-- Drop the CHECK constraint that limits order_index to 1-14
ALTER TABLE public.curriculum_modules
DROP CONSTRAINT IF EXISTS curriculum_modules_order_index_check;

-- Drop the CHECK constraint that limits order_index based on section_type
-- (knowledge_based: 1-7, behavioral: 8-14)
ALTER TABLE public.curriculum_modules
DROP CONSTRAINT IF EXISTS valid_order_per_section;

-- The composite UNIQUE constraint (order_index, certification_type) remains
-- This ensures no duplicate order_index within same certification type
-- But allows any positive integer as order_index

COMMIT;

-- Verify constraints after change
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.curriculum_modules'::regclass
    AND conname LIKE '%order%';
