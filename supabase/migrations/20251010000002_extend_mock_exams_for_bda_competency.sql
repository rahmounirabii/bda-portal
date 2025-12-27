-- Migration: Extend Mock Exams for BDA Competency Framework
-- Date: 2025-10-10
-- Description: Add new categories for pre/post/competency assessments and link to curriculum

-- =============================================================================
-- EXTEND ENUM: exam_category
-- Add new assessment types for BDA BoCK
-- =============================================================================

-- Add new category values for BDA Competency Framework assessments
ALTER TYPE exam_category ADD VALUE IF NOT EXISTS 'pre_assessment';
ALTER TYPE exam_category ADD VALUE IF NOT EXISTS 'post_assessment';
ALTER TYPE exam_category ADD VALUE IF NOT EXISTS 'competency_assessment';

COMMENT ON TYPE exam_category IS 'Mock exam categories: cp, scp, general, pre_assessment (BoCK diagnostic), post_assessment (BoCK final), competency_assessment (per main competency)';

-- =============================================================================
-- ALTER TABLE: mock_exams
-- Link competency assessments to curriculum modules
-- =============================================================================

-- Add reference to curriculum module for competency assessments
ALTER TABLE public.mock_exams
ADD COLUMN IF NOT EXISTS competency_module_id UUID REFERENCES public.curriculum_modules(id) ON DELETE SET NULL;

-- NOTE: Check constraint will be added in next migration after enum values are committed
-- This is required because PostgreSQL doesn't allow using new enum values in same transaction

-- Create index for competency module lookup
CREATE INDEX IF NOT EXISTS idx_mock_exams_competency_module ON public.mock_exams(competency_module_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.mock_exams.competency_module_id IS 'Links competency assessment to curriculum module (for competency_assessment category only)';

-- =============================================================================
-- ALTER TABLE: curriculum_modules
-- Add reference to competency assessment (Mock Exam)
-- =============================================================================

-- Add link to competency-level mock exam
ALTER TABLE public.curriculum_modules
ADD COLUMN IF NOT EXISTS competency_assessment_exam_id UUID REFERENCES public.mock_exams(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_curriculum_modules_assessment_exam ON public.curriculum_modules(competency_assessment_exam_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.curriculum_modules.competency_assessment_exam_id IS 'Links to MOCK EXAM system for summative competency assessment (with full scoring)';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Note: Cannot use enum_range with new values in same transaction
-- New enum values are committed but queries using them must be in next migration

SELECT '✅ Mock exams extended for BDA Competency Framework!' as status;
