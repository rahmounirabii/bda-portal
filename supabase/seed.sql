-- Seed data for BDA Portal
-- Note: Using INSERT ON CONFLICT to handle existing data
-- Note: Roles are already created by migration 20241126000001_create_roles_table.sql

-- Mock Exams
INSERT INTO public.mock_exams (id, title, title_ar, description, description_ar, category, difficulty, duration_minutes, total_questions, passing_score, is_active, created_at, updated_at, created_by, competency_module_id) VALUES
('11111111-1111-1111-1111-111111111111', 'CP Practice Test - Easy Level', 'اختبار تدريبي CP - مستوى سهل', 'A beginner-friendly practice test for the Certified Professional (CP) exam. Perfect for those just starting their preparation.', 'اختبار تدريبي للمبتدئين لامتحان المحترف المعتمد (CP). مثالي لأولئك الذين بدأوا للتو التحضير.', 'cp', 'easy', 30, 10, 70, true, '2025-11-04 21:08:32.183192+00', '2025-11-04 21:08:32.183192+00', NULL, NULL),
('22222222-2222-2222-2222-222222222222', 'SCP Practice Test - Medium Level', 'اختبار تدريبي SCP - مستوى متوسط', 'An intermediate practice test for the Senior Certified Professional (SCP) exam. Tests advanced knowledge and skills.', 'اختبار تدريبي متوسط لامتحان المحترف المعتمد الأول (SCP). يختبر المعرفة والمهارات المتقدمة.', 'scp', 'medium', 45, 15, 75, true, '2025-11-04 21:08:32.183192+00', '2025-11-04 21:08:32.183192+00', NULL, NULL),
('33333333-3333-3333-3333-333333333333', 'General Professional Knowledge Test', 'اختبار المعرفة المهنية العامة', 'A general knowledge test covering fundamental professional concepts. Good for beginners.', 'اختبار معرفة عامة يغطي المفاهيم المهنية الأساسية. جيد للمبتدئين.', 'general', 'easy', 20, 8, 65, true, '2025-11-04 21:08:32.183192+00', '2025-11-04 21:08:32.183192+00', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Quizzes (Certification Exams)
INSERT INTO public.quizzes (id, title, title_ar, description, description_ar, certification_type, difficulty_level, time_limit_minutes, passing_score_percentage, is_active, created_by, created_at, updated_at) VALUES
('5b055073-9f13-498a-94e3-3ed3459bbca7', 'Test Certification Exam', NULL, 'Test exam for CP certification', NULL, 'CP', 'medium', 120, 70, true, NULL, '2025-11-05 17:49:57.890508+00', '2025-11-27 01:26:33.299336+00')
ON CONFLICT (id) DO NOTHING;

-- Quiz Questions
INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_text_ar, question_type, bock_domain, difficulty, points, order_index, created_at, updated_at) VALUES
('1d137b65-df92-403e-937a-6cfc552c5e8c', '5b055073-9f13-498a-94e3-3ed3459bbca7', 'What are the key components of business development strategy?', NULL, 'multi_select', NULL, 'medium', 1, 0, '2025-11-27 01:27:08.670989+00', '2025-11-27 01:27:08.670989+00'),
('32ed3d88-087c-4a2e-b145-14ee98633a67', '5b055073-9f13-498a-94e3-3ed3459bbca7', 'Which factors influence market positioning?', NULL, 'multi_select', NULL, 'hard', 1, 1, '2025-11-27 01:27:43.215274+00', '2025-11-27 01:27:43.215274+00')
ON CONFLICT (id) DO NOTHING;

-- Quiz Answers
INSERT INTO public.quiz_answers (id, question_id, answer_text, answer_text_ar, is_correct, explanation, explanation_ar, order_index, created_at) VALUES
('c5102227-4fb9-4211-81aa-861acc81dab5', '1d137b65-df92-403e-937a-6cfc552c5e8c', 'Market Analysis', NULL, true, NULL, NULL, 0, '2025-11-27 01:27:08.701657+00'),
('e4a98ba5-62db-45f8-800f-7b2f44e5bd7c', '1d137b65-df92-403e-937a-6cfc552c5e8c', 'Random Decisions', NULL, false, NULL, NULL, 1, '2025-11-27 01:27:08.701657+00'),
('2de67866-5ca1-46a2-b4ee-1a83d1dad107', '1d137b65-df92-403e-937a-6cfc552c5e8c', 'Strategic Planning', NULL, true, NULL, NULL, 2, '2025-11-27 01:27:08.701657+00'),
('60d35618-56f2-46ad-a938-7587de579052', '32ed3d88-087c-4a2e-b145-14ee98633a67', 'Competitive Analysis', NULL, true, NULL, NULL, 0, '2025-11-27 01:27:43.244222+00'),
('b41d543b-a0f0-48b1-88fc-b4632b1be3e1', '32ed3d88-087c-4a2e-b145-14ee98633a67', 'Customer Segments', NULL, true, NULL, NULL, 1, '2025-11-27 01:27:43.244222+00'),
('912a2fc4-0b65-493f-a750-e3f0bc3cabc1', '32ed3d88-087c-4a2e-b145-14ee98633a67', 'Office Location', NULL, false, NULL, NULL, 2, '2025-11-27 01:27:43.244222+00'),
('df61b580-1bdf-48c9-bc34-2cfbd44fbd90', '32ed3d88-087c-4a2e-b145-14ee98633a67', 'Brand Strength', NULL, true, NULL, NULL, 3, '2025-11-27 01:27:43.244222+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Test Admin User
-- ============================================================================
-- Create test admin user for development/testing
-- Email: studio.aquadev@gmail.com
-- Password: R@b!0H0me

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'studio.aquadev@gmail.com';

  IF v_user_id IS NULL THEN
    -- Create auth.users entry
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'studio.aquadev@gmail.com',
      crypt('R@b!0H0me', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{}'
    )
    RETURNING id INTO v_user_id;

    -- Update public.users to admin role (trigger should have created it)
    UPDATE public.users
    SET 
      role = 'admin',
      first_name = 'Admin',
      last_name = 'User',
      is_active = true,
      profile_completed = true
    WHERE id = v_user_id;

    RAISE NOTICE 'Created test admin user: studio.aquadev@gmail.com';
  ELSE
    RAISE NOTICE 'Test admin user already exists';
  END IF;
END $$;

-- ============================================================================
-- Test Individual User
-- ============================================================================
-- Create test individual user for development/testing
-- Email: individual@test.com
-- Password: Test123!

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'individual@test.com';

  IF v_user_id IS NULL THEN
    -- Create auth.users entry
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'individual@test.com',
      crypt('Test123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{}'
    )
    RETURNING id INTO v_user_id;

    -- Update public.users to individual role (trigger should have created it)
    UPDATE public.users
    SET
      role = 'individual',
      first_name = 'Test',
      last_name = 'Individual',
      is_active = true,
      profile_completed = true
    WHERE id = v_user_id;

    RAISE NOTICE 'Created test individual user: individual@test.com';
  ELSE
    RAISE NOTICE 'Test individual user already exists';
  END IF;
END $$;

-- ============================================================================
-- Test ECP Partner User
-- ============================================================================
-- Create test ECP partner user for development/testing
-- Email: ecp@test.com
-- Password: Test123!

DO $$
DECLARE
  v_user_id UUID;
  v_partner_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'ecp@test.com';

  IF v_user_id IS NULL THEN
    -- Generate IDs
    v_user_id := gen_random_uuid();
    v_partner_id := gen_random_uuid();

    -- Create auth.users entry
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      recovery_token,
      reauthentication_token,
      phone_change_token,
      phone_change,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'ecp@test.com',
      crypt('Test123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"ECP","last_name":"Partner"}'
    );

    -- Update public.users to ecp role (trigger should have created it)
    UPDATE public.users
    SET
      role = 'ecp',
      first_name = 'ECP',
      last_name = 'Partner',
      company_name = 'ECP Training Academy',
      job_title = 'Training Director',
      is_active = true,
      profile_completed = true
    WHERE id = v_user_id;

    -- Create partner record
    INSERT INTO public.partners (
      id,
      partner_type,
      company_name,
      company_name_ar,
      contact_person,
      contact_email,
      contact_phone,
      country,
      city,
      website,
      industry,
      description,
      description_ar,
      is_active,
      created_by
    ) VALUES (
      v_partner_id,
      'ecp',
      'ECP Training Academy',
      'أكاديمية التدريب ECP',
      'ECP Partner',
      'ecp@test.com',
      '+1234567890',
      'United States',
      'New York',
      'https://ecp-academy.example.com',
      'Professional Training',
      'A leading provider of BDA certification training programs with experienced trainers.',
      'مزود رائد لبرامج تدريب شهادات BDA مع مدربين ذوي خبرة.',
      true,
      v_user_id
    );

    RAISE NOTICE 'Created test ECP user: ecp@test.com';
  ELSE
    RAISE NOTICE 'Test ECP user already exists';
  END IF;
END $$;

-- ============================================================================
-- Test PDP Partner User
-- ============================================================================
-- Create test PDP partner user for development/testing
-- Email: pdp@test.com
-- Password: Test123!

DO $$
DECLARE
  v_user_id UUID;
  v_partner_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'pdp@test.com';

  IF v_user_id IS NULL THEN
    -- Generate IDs
    v_user_id := gen_random_uuid();
    v_partner_id := gen_random_uuid();

    -- Create auth.users entry
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      recovery_token,
      reauthentication_token,
      phone_change_token,
      phone_change,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'pdp@test.com',
      crypt('Test123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"PDP","last_name":"Partner"}'
    );

    -- Update public.users to pdp role (trigger should have created it)
    UPDATE public.users
    SET
      role = 'pdp',
      first_name = 'PDP',
      last_name = 'Partner',
      company_name = 'PDP Development Institute',
      job_title = 'Program Director',
      is_active = true,
      profile_completed = true
    WHERE id = v_user_id;

    -- Create partner record
    INSERT INTO public.partners (
      id,
      partner_type,
      company_name,
      company_name_ar,
      contact_person,
      contact_email,
      contact_phone,
      country,
      city,
      website,
      industry,
      description,
      description_ar,
      is_active,
      created_by
    ) VALUES (
      v_partner_id,
      'pdp',
      'PDP Development Institute',
      'معهد التطوير PDP',
      'PDP Partner',
      'pdp@test.com',
      '+1234567891',
      'United Arab Emirates',
      'Dubai',
      'https://pdp-institute.example.com',
      'Professional Development',
      'A premier provider of professional development programs offering PDC-eligible courses.',
      'مزود رائد لبرامج التطوير المهني يقدم دورات مؤهلة لـ PDC.',
      true,
      v_user_id
    );

    RAISE NOTICE 'Created test PDP user: pdp@test.com';
  ELSE
    RAISE NOTICE 'Test PDP user already exists';
  END IF;
END $$;
