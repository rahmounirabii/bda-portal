-- ============================================================================
-- MIGRATION: Force remove ALL order_index CHECK constraints
-- ============================================================================
-- Migration: 20251008223000
-- Description: Forces removal of ALL CHECK constraints on order_index
-- ============================================================================

-- Drop ALL CHECK constraints related to order_index
ALTER TABLE public.curriculum_modules
DROP CONSTRAINT IF EXISTS curriculum_modules_order_index_check CASCADE;

ALTER TABLE public.curriculum_modules
DROP CONSTRAINT IF EXISTS valid_order_per_section CASCADE;

-- Verify: Show remaining constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.curriculum_modules'::regclass;
