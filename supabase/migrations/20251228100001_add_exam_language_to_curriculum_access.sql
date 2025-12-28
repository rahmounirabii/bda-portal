-- Migration: Add exam_language to user_curriculum_access
-- Date: 2025-12-28
-- Description: Add exam_language field to track EN/AR for curriculum access per spec

-- =============================================================================
-- ADD EXAM LANGUAGE TO CURRICULUM ACCESS
-- =============================================================================

-- Add exam_language column to user_curriculum_access
-- Using the existing exam_language enum type from vouchers migration
ALTER TABLE public.user_curriculum_access
ADD COLUMN IF NOT EXISTS exam_language exam_language NOT NULL DEFAULT 'en';

-- Update unique constraint to include language
-- First drop the existing constraint
ALTER TABLE public.user_curriculum_access
DROP CONSTRAINT IF EXISTS unique_user_cert_access;

-- Create new unique constraint including language
ALTER TABLE public.user_curriculum_access
ADD CONSTRAINT unique_user_cert_lang_access UNIQUE (user_id, certification_type, exam_language);

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_user_curriculum_access_language
ON public.user_curriculum_access(exam_language);

-- Comment
COMMENT ON COLUMN public.user_curriculum_access.exam_language IS 'Language for curriculum access: en (English) or ar (Arabic)';
