-- Migration: Add test certifications for verification
-- Date: 2025-10-02
-- Description: Insert sample certifications for testing verification feature

-- =============================================================================
-- TEST DATA: Certifications
-- =============================================================================

-- Insert test certifications (only if they don't exist)
DO $$
DECLARE
  test_user_id UUID;
  test_user2_id UUID;
BEGIN
  -- Get or create test users
  SELECT id INTO test_user_id FROM public.users WHERE email = 'test@bda.com' LIMIT 1;
  SELECT id INTO test_user2_id FROM public.users WHERE email = 'test2@bda.com' LIMIT 1;

  -- Only insert if users exist
  IF test_user_id IS NOT NULL THEN
    -- Insert CP certification (active)
    INSERT INTO public.user_certifications (
      user_id,
      certification_type,
      credential_id,
      issued_date,
      expiry_date,
      status,
      renewal_count,
      pdc_credits_earned
    ) VALUES (
      test_user_id,
      'CP',
      'CP-2024-0001',
      '2024-01-15',
      '2027-01-15',
      'active',
      0,
      25
    )
    ON CONFLICT (credential_id) DO NOTHING;

    -- Insert SCP certification (active, expiring soon)
    INSERT INTO public.user_certifications (
      user_id,
      certification_type,
      credential_id,
      issued_date,
      expiry_date,
      status,
      renewal_count,
      pdc_credits_earned
    ) VALUES (
      test_user_id,
      'SCP',
      'SCP-2024-0001',
      '2022-03-01',
      '2025-12-01',
      'active',
      1,
      52
    )
    ON CONFLICT (credential_id) DO NOTHING;
  END IF;

  IF test_user2_id IS NOT NULL THEN
    -- Insert expired CP certification
    INSERT INTO public.user_certifications (
      user_id,
      certification_type,
      credential_id,
      issued_date,
      expiry_date,
      status,
      renewal_count,
      pdc_credits_earned
    ) VALUES (
      test_user2_id,
      'CP',
      'CP-2023-0001',
      '2021-06-01',
      '2024-06-01',
      'expired',
      0,
      45
    )
    ON CONFLICT (credential_id) DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Test certifications added (if test users exist)';
END $$;

-- Verification
SELECT
  uc.credential_id,
  CONCAT(u.first_name, ' ', u.last_name) as holder_name,
  uc.certification_type,
  uc.status,
  uc.issued_date,
  uc.expiry_date
FROM public.user_certifications uc
JOIN public.users u ON u.id = uc.user_id
WHERE uc.credential_id LIKE '%-2024-0001'
   OR uc.credential_id LIKE '%-2023-0001'
ORDER BY uc.credential_id;
