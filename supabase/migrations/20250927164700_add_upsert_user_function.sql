-- Create a function to upsert user with conflict handling
-- This allows updating existing users even if they're in a bad state

CREATE OR REPLACE FUNCTION public.upsert_user_account(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role user_role,
  p_wp_user_id INTEGER DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_result json;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- User exists, update their metadata
    UPDATE auth.users
    SET
      raw_user_meta_data = jsonb_build_object(
        'first_name', p_first_name,
        'last_name', p_last_name,
        'bda_role', p_role,
        'wp_user_id', p_wp_user_id
      ),
      updated_at = NOW()
    WHERE id = v_user_id;

    -- Ensure user exists in public.users
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      role,
      wp_user_id,
      created_from,
      updated_at
    )
    VALUES (
      v_user_id,
      p_email,
      p_first_name,
      p_last_name,
      p_role,
      p_wp_user_id,
      'portal',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      wp_user_id = COALESCE(EXCLUDED.wp_user_id, public.users.wp_user_id),
      updated_at = NOW();

    v_result := json_build_object(
      'success', true,
      'action', 'updated',
      'user_id', v_user_id,
      'message', 'User account recovered and updated'
    );
  ELSE
    -- User doesn't exist, return error (signup should be used instead)
    v_result := json_build_object(
      'success', false,
      'action', 'not_found',
      'message', 'User does not exist. Please use signup instead.'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_account TO service_role;