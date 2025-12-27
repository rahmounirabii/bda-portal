-- ============================================================================
-- Fix get_user_learning_system_accesses function
-- Date: 2024-12-24
-- ============================================================================

-- First add the includes_curriculum column if it doesn't exist
ALTER TABLE user_curriculum_access
  ADD COLUMN IF NOT EXISTS includes_curriculum BOOLEAN DEFAULT true;

-- Create or replace the function
CREATE OR REPLACE FUNCTION get_user_learning_system_accesses(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_accesses JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'language', language,
      'expires_at', expires_at,
      'is_active', is_active AND expires_at > NOW(),
      'includes_curriculum', COALESCE(includes_curriculum, true),
      'includes_question_bank', COALESCE(includes_question_bank, true),
      'includes_flashcards', COALESCE(includes_flashcards, true),
      'purchased_at', purchased_at,
      'certification_type', certification_type
    )
  )
  INTO v_accesses
  FROM user_curriculum_access
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW();

  IF v_accesses IS NULL THEN
    v_accesses := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'accesses', v_accesses,
    'has_en', EXISTS (
      SELECT 1 FROM user_curriculum_access
      WHERE user_id = p_user_id
        AND language = 'EN'
        AND is_active = true
        AND expires_at > NOW()
    ),
    'has_ar', EXISTS (
      SELECT 1 FROM user_curriculum_access
      WHERE user_id = p_user_id
        AND language = 'AR'
        AND is_active = true
        AND expires_at > NOW()
    )
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_learning_system_accesses TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_learning_system_accesses IS 'Get all active Learning System accesses for a user';
