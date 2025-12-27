-- Migration: Drop and recreate curriculum system
-- This fixes any partial/incomplete curriculum tables

-- Drop existing curriculum tables if they exist (CASCADE to drop dependent objects)
DROP TABLE IF EXISTS public.user_curriculum_progress CASCADE;
DROP TABLE IF EXISTS public.user_curriculum_access CASCADE;
DROP TABLE IF EXISTS public.curriculum_modules CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.is_module_unlocked CASCADE;
DROP FUNCTION IF EXISTS public.get_next_unlocked_module CASCADE;
DROP FUNCTION IF EXISTS public.initialize_user_progress CASCADE;
DROP FUNCTION IF EXISTS public.update_curriculum_updated_at CASCADE;

-- Now we can safely apply the full curriculum migration
-- This will be handled by the next migration file
SELECT '✅ Old curriculum tables and functions dropped successfully' as status;
