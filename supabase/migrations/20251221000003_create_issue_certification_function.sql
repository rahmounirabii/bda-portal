-- Create function to issue certifications (bypasses RLS with SECURITY DEFINER)
-- This allows the application to automatically issue certifications when users pass exams

CREATE OR REPLACE FUNCTION issue_certification(
  p_user_id UUID,
  p_certification_type certification_type,
  p_quiz_attempt_id UUID,
  p_credential_id TEXT,
  p_issued_date DATE,
  p_expiry_date DATE
)
RETURNS user_certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_cert user_certifications;
  v_new_cert user_certifications;
BEGIN
  -- Check if user already has an active certification of this type
  SELECT * INTO v_existing_cert
  FROM user_certifications
  WHERE user_id = p_user_id
    AND certification_type = p_certification_type
    AND status = 'active';

  IF FOUND THEN
    RAISE EXCEPTION 'User already has an active % certification', p_certification_type;
  END IF;

  -- Insert the new certification
  INSERT INTO user_certifications (
    user_id,
    certification_type,
    quiz_attempt_id,
    credential_id,
    issued_date,
    expiry_date,
    status,
    renewal_count
  ) VALUES (
    p_user_id,
    p_certification_type,
    p_quiz_attempt_id,
    p_credential_id,
    p_issued_date,
    p_expiry_date,
    'active',
    0
  )
  RETURNING * INTO v_new_cert;

  RETURN v_new_cert;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION issue_certification(UUID, certification_type, UUID, TEXT, DATE, DATE) TO authenticated;

-- Comment
COMMENT ON FUNCTION issue_certification IS 'Issues a certification to a user after passing an exam. Uses SECURITY DEFINER to bypass RLS policies.';
