-- Migration: Seed data pour Mock Exams
-- Date: 2025-10-01
-- Description: Données de test pour les examens blancs (CP et SCP)

-- =============================================================================
-- MOCK EXAM 1: CP Practice Test (Easy)
-- =============================================================================

INSERT INTO public.mock_exams (id, title, title_ar, description, description_ar, category, difficulty, duration_minutes, total_questions, passing_score, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'CP Practice Test - Easy Level',
    'اختبار تدريبي CP - مستوى سهل',
    'A beginner-friendly practice test for the Certified Professional (CP) exam. Perfect for those just starting their preparation.',
    'اختبار تدريبي للمبتدئين لامتحان المحترف المعتمد (CP). مثالي لأولئك الذين بدأوا للتو التحضير.',
    'cp',
    'easy',
    30,
    10,
    70,
    true
);

-- Questions pour CP Easy
INSERT INTO public.mock_exam_questions (id, exam_id, question_text, question_text_ar, explanation, explanation_ar, question_type, points, order_index)
VALUES
-- Question 1
('01111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'What does BDA stand for?',
 'ماذا تعني BDA؟',
 'BDA stands for Business Development Association, an organization focused on professional development.',
 'BDA تعني جمعية تطوير الأعمال، وهي منظمة مركزة على التطوير المهني.',
 'single_choice', 1, 1),

-- Question 2
('01111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Which of the following are core values of professional certification? (Select all that apply)',
 'ما هي القيم الأساسية للشهادة المهنية؟ (اختر كل ما ينطبق)',
 'Professional certification values include competence, ethics, and continuous learning.',
 'تشمل قيم الشهادة المهنية الكفاءة والأخلاقيات والتعلم المستمر.',
 'multiple_choice', 2, 2),

-- Question 3
('01111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'How many PDC hours are required annually to maintain CP certification?',
 'كم عدد ساعات PDC المطلوبة سنوياً للحفاظ على شهادة CP؟',
 'CP certification requires 20 PDC hours annually for maintenance.',
 'تتطلب شهادة CP 20 ساعة PDC سنوياً للحفاظ عليها.',
 'single_choice', 1, 3),

-- Question 4
('01111114-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'What is the purpose of a Code of Ethics in professional certification?',
 'ما هو الغرض من قواعد الأخلاقيات في الشهادة المهنية؟',
 'A Code of Ethics establishes standards of conduct and professional behavior.',
 'تحدد قواعد الأخلاقيات معايير السلوك والسلوك المهني.',
 'single_choice', 1, 4),

-- Question 5
('01111115-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Which skills are essential for a Certified Professional? (Select all that apply)',
 'ما هي المهارات الأساسية للمحترف المعتمد؟ (اختر كل ما ينطبق)',
 'Essential skills include communication, problem-solving, and teamwork.',
 'تشمل المهارات الأساسية التواصل وحل المشكلات والعمل الجماعي.',
 'multiple_choice', 2, 5),

-- Question 6
('01111116-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'What is the minimum passing score for the CP exam?',
 'ما هو الحد الأدنى لدرجة النجاح في امتحان CP؟',
 'The minimum passing score for CP exam is 70%.',
 'الحد الأدنى لدرجة النجاح في امتحان CP هو 70٪.',
 'single_choice', 1, 6),

-- Question 7
('01111117-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Which of the following are benefits of professional certification? (Select all that apply)',
 'ما هي فوائد الشهادة المهنية؟ (اختر كل ما ينطبق)',
 'Benefits include career advancement, increased credibility, and professional networking.',
 'تشمل الفوائد التقدم الوظيفي وزيادة المصداقية والتواصل المهني.',
 'multiple_choice', 2, 7),

-- Question 8
('01111118-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'What does PDC stand for?',
 'ماذا تعني PDC؟',
 'PDC stands for Professional Development Credit, used to track continuing education.',
 'PDC تعني رصيد التطوير المهني، وتستخدم لتتبع التعليم المستمر.',
 'single_choice', 1, 8),

-- Question 9
('01111119-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'How long is a CP certification valid before renewal?',
 'كم مدة صلاحية شهادة CP قبل التجديد؟',
 'CP certification is valid for 3 years before renewal is required.',
 'شهادة CP صالحة لمدة 3 سنوات قبل أن يكون التجديد مطلوباً.',
 'single_choice', 1, 9),

-- Question 10
('0111111a-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Which activities can contribute to PDC hours? (Select all that apply)',
 'ما هي الأنشطة التي يمكن أن تساهم في ساعات PDC؟ (اختر كل ما ينطبق)',
 'PDC activities include workshops, conferences, online courses, and mentoring.',
 'تشمل أنشطة PDC ورش العمل والمؤتمرات والدورات عبر الإنترنت والإرشاد.',
 'multiple_choice', 2, 10);

-- Answers pour Question 1 (BDA stands for)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111111-1111-1111-1111-111111111111', 'Business Development Association', 'جمعية تطوير الأعمال', true, 1),
('01111111-1111-1111-1111-111111111111', 'Business Data Analytics', 'تحليلات بيانات الأعمال', false, 2),
('01111111-1111-1111-1111-111111111111', 'Board of Directors Assembly', 'جمعية مجلس الإدارة', false, 3),
('01111111-1111-1111-1111-111111111111', 'Business Development Agency', 'وكالة تطوير الأعمال', false, 4);

-- Answers pour Question 2 (Core values - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111112-1111-1111-1111-111111111111', 'Competence', 'الكفاءة', true, 1),
('01111112-1111-1111-1111-111111111111', 'Ethics', 'الأخلاقيات', true, 2),
('01111112-1111-1111-1111-111111111111', 'Continuous Learning', 'التعلم المستمر', true, 3),
('01111112-1111-1111-1111-111111111111', 'Maximum Profit', 'أقصى ربح', false, 4);

-- Answers pour Question 3 (PDC hours)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111113-1111-1111-1111-111111111111', '10 hours', '10 ساعات', false, 1),
('01111113-1111-1111-1111-111111111111', '20 hours', '20 ساعة', true, 2),
('01111113-1111-1111-1111-111111111111', '30 hours', '30 ساعة', false, 3),
('01111113-1111-1111-1111-111111111111', '40 hours', '40 ساعة', false, 4);

-- Answers pour Question 4 (Code of Ethics purpose)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111114-1111-1111-1111-111111111111', 'To establish standards of conduct', 'لتحديد معايير السلوك', true, 1),
('01111114-1111-1111-1111-111111111111', 'To increase company profits', 'لزيادة أرباح الشركة', false, 2),
('01111114-1111-1111-1111-111111111111', 'To reduce exam difficulty', 'لتقليل صعوبة الامتحان', false, 3),
('01111114-1111-1111-1111-111111111111', 'To limit competition', 'للحد من المنافسة', false, 4);

-- Answers pour Question 5 (Essential skills - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111115-1111-1111-1111-111111111111', 'Communication', 'التواصل', true, 1),
('01111115-1111-1111-1111-111111111111', 'Problem-solving', 'حل المشكلات', true, 2),
('01111115-1111-1111-1111-111111111111', 'Teamwork', 'العمل الجماعي', true, 3),
('01111115-1111-1111-1111-111111111111', 'Working alone always', 'العمل بمفردك دائماً', false, 4);

-- Answers pour Question 6 (Minimum passing score)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111116-1111-1111-1111-111111111111', '60%', '60٪', false, 1),
('01111116-1111-1111-1111-111111111111', '70%', '70٪', true, 2),
('01111116-1111-1111-1111-111111111111', '80%', '80٪', false, 3),
('01111116-1111-1111-1111-111111111111', '90%', '90٪', false, 4);

-- Answers pour Question 7 (Benefits - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111117-1111-1111-1111-111111111111', 'Career advancement', 'التقدم الوظيفي', true, 1),
('01111117-1111-1111-1111-111111111111', 'Increased credibility', 'زيادة المصداقية', true, 2),
('01111117-1111-1111-1111-111111111111', 'Professional networking', 'التواصل المهني', true, 3),
('01111117-1111-1111-1111-111111111111', 'Guaranteed salary increase', 'زيادة مضمونة في الراتب', false, 4);

-- Answers pour Question 8 (PDC meaning)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111118-1111-1111-1111-111111111111', 'Professional Development Credit', 'رصيد التطوير المهني', true, 1),
('01111118-1111-1111-1111-111111111111', 'Professional Data Center', 'مركز البيانات المهنية', false, 2),
('01111118-1111-1111-1111-111111111111', 'Personal Development Course', 'دورة التنمية الشخصية', false, 3),
('01111118-1111-1111-1111-111111111111', 'Primary Development Certificate', 'شهادة التطوير الأساسية', false, 4);

-- Answers pour Question 9 (Certification validity)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('01111119-1111-1111-1111-111111111111', '1 year', 'سنة واحدة', false, 1),
('01111119-1111-1111-1111-111111111111', '2 years', 'سنتان', false, 2),
('01111119-1111-1111-1111-111111111111', '3 years', '3 سنوات', true, 3),
('01111119-1111-1111-1111-111111111111', '5 years', '5 سنوات', false, 4);

-- Answers pour Question 10 (PDC activities - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('0111111a-1111-1111-1111-111111111111', 'Workshops', 'ورش العمل', true, 1),
('0111111a-1111-1111-1111-111111111111', 'Conferences', 'المؤتمرات', true, 2),
('0111111a-1111-1111-1111-111111111111', 'Online courses', 'الدورات عبر الإنترنت', true, 3),
('0111111a-1111-1111-1111-111111111111', 'Watching TV shows', 'مشاهدة البرامج التلفزيونية', false, 4);

-- =============================================================================
-- MOCK EXAM 2: SCP Practice Test (Medium)
-- =============================================================================

INSERT INTO public.mock_exams (id, title, title_ar, description, description_ar, category, difficulty, duration_minutes, total_questions, passing_score, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'SCP Practice Test - Medium Level',
    'اختبار تدريبي SCP - مستوى متوسط',
    'An intermediate practice test for the Senior Certified Professional (SCP) exam. Tests advanced knowledge and skills.',
    'اختبار تدريبي متوسط لامتحان المحترف المعتمد الأول (SCP). يختبر المعرفة والمهارات المتقدمة.',
    'scp',
    'medium',
    45,
    15,
    75,
    true
);

-- Questions pour SCP Medium (5 questions comme exemple)
INSERT INTO public.mock_exam_questions (id, exam_id, question_text, question_text_ar, explanation, explanation_ar, question_type, points, order_index)
VALUES
-- Question 1
('02222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'What are the prerequisites for SCP certification?',
 'ما هي المتطلبات الأساسية لشهادة SCP؟',
 'SCP requires holding CP certification and 3 years of professional experience.',
 'تتطلب SCP الحصول على شهادة CP و 3 سنوات من الخبرة المهنية.',
 'single_choice', 2, 1),

-- Question 2
('02222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'Which leadership qualities are essential for SCP holders? (Select all that apply)',
 'ما هي الصفات القيادية الأساسية لحاملي SCP؟ (اختر كل ما ينطبق)',
 'SCP holders should demonstrate strategic thinking, team leadership, and decision-making.',
 'يجب على حاملي SCP إظهار التفكير الاستراتيجي وقيادة الفريق واتخاذ القرار.',
 'multiple_choice', 3, 2),

-- Question 3
('02222223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'How many PDC hours are required annually for SCP maintenance?',
 'كم عدد ساعات PDC المطلوبة سنوياً للحفاظ على SCP؟',
 'SCP certification requires 30 PDC hours annually.',
 'تتطلب شهادة SCP 30 ساعة PDC سنوياً.',
 'single_choice', 2, 3),

-- Question 4
('02222224-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'What is the difference between CP and SCP certifications?',
 'ما الفرق بين شهادتي CP و SCP؟',
 'SCP is an advanced certification requiring CP, more experience, and higher competency.',
 'SCP هي شهادة متقدمة تتطلب CP والمزيد من الخبرة والكفاءة العالية.',
 'single_choice', 2, 4),

-- Question 5
('02222225-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
 'Which areas of expertise are covered in the SCP exam? (Select all that apply)',
 'ما هي مجالات الخبرة المشمولة في امتحان SCP؟ (اختر كل ما ينطبق)',
 'SCP covers leadership, strategic planning, change management, and advanced professional skills.',
 'تغطي SCP القيادة والتخطيط الاستراتيجي وإدارة التغيير والمهارات المهنية المتقدمة.',
 'multiple_choice', 3, 5);

-- Answers pour SCP Question 1
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('02222221-2222-2222-2222-222222222222', 'CP certification + 3 years experience', 'شهادة CP + 3 سنوات خبرة', true, 1),
('02222221-2222-2222-2222-222222222222', 'Only a university degree', 'فقط درجة جامعية', false, 2),
('02222221-2222-2222-2222-222222222222', 'No prerequisites', 'لا توجد متطلبات', false, 3),
('02222221-2222-2222-2222-222222222222', 'Only work experience', 'فقط خبرة عمل', false, 4);

-- Answers pour SCP Question 2 (Leadership - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('02222222-2222-2222-2222-222222222222', 'Strategic thinking', 'التفكير الاستراتيجي', true, 1),
('02222222-2222-2222-2222-222222222222', 'Team leadership', 'قيادة الفريق', true, 2),
('02222222-2222-2222-2222-222222222222', 'Decision-making', 'اتخاذ القرار', true, 3),
('02222222-2222-2222-2222-222222222222', 'Following orders only', 'اتباع الأوامر فقط', false, 4);

-- Answers pour SCP Question 3 (PDC hours)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('02222223-2222-2222-2222-222222222222', '20 hours', '20 ساعة', false, 1),
('02222223-2222-2222-2222-222222222222', '25 hours', '25 ساعة', false, 2),
('02222223-2222-2222-2222-222222222222', '30 hours', '30 ساعة', true, 3),
('02222223-2222-2222-2222-222222222222', '40 hours', '40 ساعة', false, 4);

-- Answers pour SCP Question 4 (Difference)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('02222224-2222-2222-2222-222222222222', 'SCP is more advanced and requires CP', 'SCP أكثر تقدماً وتتطلب CP', true, 1),
('02222224-2222-2222-2222-222222222222', 'They are the same certification', 'هما نفس الشهادة', false, 2),
('02222224-2222-2222-2222-222222222222', 'CP is more advanced than SCP', 'CP أكثر تقدماً من SCP', false, 3),
('02222224-2222-2222-2222-222222222222', 'No difference at all', 'لا فرق على الإطلاق', false, 4);

-- Answers pour SCP Question 5 (Areas - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('02222225-2222-2222-2222-222222222222', 'Leadership', 'القيادة', true, 1),
('02222225-2222-2222-2222-222222222222', 'Strategic planning', 'التخطيط الاستراتيجي', true, 2),
('02222225-2222-2222-2222-222222222222', 'Change management', 'إدارة التغيير', true, 3),
('02222225-2222-2222-2222-222222222222', 'Basic data entry', 'إدخال البيانات الأساسي', false, 4);

-- =============================================================================
-- MOCK EXAM 3: General Knowledge Test (Easy)
-- =============================================================================

INSERT INTO public.mock_exams (id, title, title_ar, description, description_ar, category, difficulty, duration_minutes, total_questions, passing_score, is_active)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'General Professional Knowledge Test',
    'اختبار المعرفة المهنية العامة',
    'A general knowledge test covering fundamental professional concepts. Good for beginners.',
    'اختبار معرفة عامة يغطي المفاهيم المهنية الأساسية. جيد للمبتدئين.',
    'general',
    'easy',
    20,
    8,
    65,
    true
);

-- Questions pour General (3 questions comme exemple)
INSERT INTO public.mock_exam_questions (id, exam_id, question_text, question_text_ar, explanation, explanation_ar, question_type, points, order_index)
VALUES
-- Question 1
('03333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
 'What is professional development?',
 'ما هو التطوير المهني؟',
 'Professional development is the continuous process of acquiring new knowledge and skills.',
 'التطوير المهني هو العملية المستمرة لاكتساب المعرفة والمهارات الجديدة.',
 'single_choice', 1, 1),

-- Question 2
('03333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
 'Which are good professional practices? (Select all that apply)',
 'ما هي الممارسات المهنية الجيدة؟ (اختر كل ما ينطبق)',
 'Good practices include punctuality, clear communication, and continuous learning.',
 'تشمل الممارسات الجيدة الالتزام بالمواعيد والتواصل الواضح والتعلم المستمر.',
 'multiple_choice', 2, 2),

-- Question 3
('03333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
 'Why is networking important in professional growth?',
 'لماذا يعد التواصل مهماً في النمو المهني؟',
 'Networking helps build relationships, share knowledge, and discover opportunities.',
 'يساعد التواصل على بناء العلاقات ومشاركة المعرفة واكتشاف الفرص.',
 'single_choice', 1, 3);

-- Answers pour General Question 1
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('03333331-3333-3333-3333-333333333333', 'Continuous learning and skill acquisition', 'التعلم المستمر واكتساب المهارات', true, 1),
('03333331-3333-3333-3333-333333333333', 'Only attending one training course', 'حضور دورة تدريبية واحدة فقط', false, 2),
('03333331-3333-3333-3333-333333333333', 'Getting promotions automatically', 'الحصول على ترقيات تلقائياً', false, 3),
('03333331-3333-3333-3333-333333333333', 'Changing jobs frequently', 'تغيير الوظائف بشكل متكرر', false, 4);

-- Answers pour General Question 2 (Practices - multiple)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('03333332-3333-3333-3333-333333333333', 'Punctuality', 'الالتزام بالمواعيد', true, 1),
('03333332-3333-3333-3333-333333333333', 'Clear communication', 'التواصل الواضح', true, 2),
('03333332-3333-3333-3333-333333333333', 'Continuous learning', 'التعلم المستمر', true, 3),
('03333332-3333-3333-3333-333333333333', 'Ignoring feedback', 'تجاهل الملاحظات', false, 4);

-- Answers pour General Question 3 (Networking)
INSERT INTO public.mock_exam_answers (question_id, answer_text, answer_text_ar, is_correct, order_index)
VALUES
('03333333-3333-3333-3333-333333333333', 'Builds relationships and discovers opportunities', 'بناء العلاقات واكتشاف الفرص', true, 1),
('03333333-3333-3333-3333-333333333333', 'Only for getting free food at events', 'فقط للحصول على طعام مجاني في الفعاليات', false, 2),
('03333333-3333-3333-3333-333333333333', 'Not important at all', 'غير مهم على الإطلاق', false, 3),
('03333333-3333-3333-3333-333333333333', 'Only for extroverted people', 'فقط للأشخاص المنفتحين', false, 4);
