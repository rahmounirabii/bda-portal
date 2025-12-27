-- ============================================================================
-- MIGRATION: Seed BDA-CP Curriculum Modules
-- ============================================================================
-- Migration: 20251008155210
-- Description: Seeds 14 professional curriculum modules for BDA-CP certification
-- Modules: 14 (7 Knowledge-Based + 7 Behavioral Competencies)
-- Language: Bilingual (English + Arabic)
-- Author: BDA Development Team
-- Created: 2025-10-08
-- ============================================================================
-- IDEMPOTENT: Safe to run multiple times (deletes existing CP modules first)
-- ============================================================================

-- Delete existing CP modules if they exist (ensures idempotency)
DELETE FROM public.curriculum_modules WHERE certification_type = 'CP';

BEGIN;

-- ============================================================================
-- KNOWLEDGE-BASED MODULES (1-7)
-- ============================================================================

-- Module 1: Growth & Expansion Strategies
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Growth & Expansion Strategies',
    'استراتيجيات النمو والتوسع',
    1,
    'trending-up',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Growth & Expansion Strategies"}]},{"type":"paragraph","content":[{"type":"text","text":"Master the fundamentals of strategic growth planning and sustainable value creation."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"استراتيجيات النمو والتوسع"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان أساسيات التخطيط الاستراتيجي للنمو وخلق القيمة المستدامة."}]}]}'::jsonb,
    'Master the fundamentals of strategic growth planning, market expansion models, and sustainable value creation frameworks essential for business development success.',
    'إتقان أساسيات التخطيط الاستراتيجي للنمو ونماذج التوسع في الأسواق وأطر خلق القيمة المستدامة الضرورية لنجاح تطوير الأعمال.',
    ARRAY['Understand and apply the Ansoff Matrix to evaluate growth opportunities', 'Distinguish between organic and inorganic growth strategies', 'Design geographic expansion plans considering market entry barriers'],
    ARRAY['فهم وتطبيق مصفوفة أنسوف لتقييم فرص النمو', 'التمييز بين استراتيجيات النمو العضوي وغير العضوي', 'تصميم خطط التوسع الجغرافي مع مراعاة حواجز دخول السوق'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 2: Market & Competitive Analysis
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Market & Competitive Analysis',
    'تحليل السوق والمنافسة',
    2,
    'search',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Market & Competitive Analysis"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop advanced skills in market sizing, competitive intelligence, and strategic positioning."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"تحليل السوق والمنافسة"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير مهارات متقدمة في تحديد حجم السوق والذكاء التنافسي والتموضع الاستراتيجي."}]}]}'::jsonb,
    'Develop advanced skills in market sizing, competitive intelligence, strategic positioning, and data-driven analysis to inform business development decisions.',
    'تطوير مهارات متقدمة في تحديد حجم السوق والذكاء التنافسي والتموضع الاستراتيجي والتحليل القائم على البيانات.',
    ARRAY['Calculate and interpret TAM, SAM, and SOM for market assessment', 'Apply Porter''s Five Forces to evaluate industry attractiveness', 'Conduct comprehensive competitive analysis and benchmarking'],
    ARRAY['حساب وتفسير TAM و SAM و SOM لتقييم السوق', 'تطبيق قوى بورتر الخمس لتقييم جاذبية الصناعة', 'إجراء تحليل تنافسي شامل'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 3: Strategic Partnerships & Alliances
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Strategic Partnerships & Alliances',
    'الشراكات والتحالفات الاستراتيجية',
    3,
    'handshake',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Partnerships & Alliances"}]},{"type":"paragraph","content":[{"type":"text","text":"Learn to identify, structure, and manage strategic partnerships that drive business growth."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"الشراكات والتحالفات الاستراتيجية"}]},{"type":"paragraph","content":[{"type":"text","text":"تعلم كيفية تحديد وهيكلة وإدارة الشراكات الاستراتيجية التي تدفع نمو الأعمال."}]}]}'::jsonb,
    'Learn to identify, structure, and manage strategic partnerships and alliances that create mutual value and accelerate business growth.',
    'تعلم كيفية تحديد وهيكلة وإدارة الشراكات والتحالفات الاستراتيجية التي تخلق قيمة متبادلة وتسرع نمو الأعمال.',
    ARRAY['Identify and evaluate strategic partnership opportunities', 'Structure win-win partnership agreements', 'Manage and optimize ongoing partnership relationships'],
    ARRAY['تحديد وتقييم فرص الشراكة الاستراتيجية', 'هيكلة اتفاقيات شراكة مربحة للطرفين', 'إدارة وتحسين علاقات الشراكة المستمرة'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 4: Opportunity Identification & Qualification
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Opportunity Identification & Qualification',
    'تحديد وتأهيل الفرص',
    4,
    'target',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Opportunity Identification & Qualification"}]},{"type":"paragraph","content":[{"type":"text","text":"Master systematic approaches to identify, evaluate, and prioritize business opportunities."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"تحديد وتأهيل الفرص"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان المناهج المنهجية لتحديد وتقييم وتحديد أولويات الفرص التجارية."}]}]}'::jsonb,
    'Master systematic approaches to identify, evaluate, and prioritize business opportunities using proven frameworks and methodologies.',
    'إتقان المناهج المنهجية لتحديد وتقييم وتحديد أولويات الفرص التجارية باستخدام الأطر والمنهجيات المثبتة.',
    ARRAY['Identify high-potential business opportunities', 'Apply qualification frameworks (BANT, MEDDIC)', 'Prioritize opportunities based on strategic fit and ROI'],
    ARRAY['تحديد الفرص التجارية ذات الإمكانات العالية', 'تطبيق أطر التأهيل (BANT، MEDDIC)', 'تحديد أولويات الفرص بناءً على الملاءمة الاستراتيجية والعائد على الاستثمار'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 5: Value Proposition Development
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Value Proposition Development',
    'تطوير عروض القيمة',
    5,
    'gift',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Value Proposition Development"}]},{"type":"paragraph","content":[{"type":"text","text":"Create compelling value propositions that resonate with target customers and drive conversion."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"تطوير عروض القيمة"}]},{"type":"paragraph","content":[{"type":"text","text":"إنشاء عروض قيمة مقنعة تتوافق مع العملاء المستهدفين وتدفع التحويل."}]}]}'::jsonb,
    'Create compelling value propositions that clearly articulate benefits, differentiate from competitors, and drive customer action.',
    'إنشاء عروض قيمة مقنعة توضح الفوائد بوضوح، وتميز عن المنافسين، وتدفع العملاء إلى اتخاذ إجراء.',
    ARRAY['Understand customer pain points and desired outcomes', 'Craft differentiated value propositions', 'Test and refine value propositions based on feedback'],
    ARRAY['فهم نقاط الألم لدى العملاء والنتائج المرغوبة', 'صياغة عروض قيمة متميزة', 'اختبار وتحسين عروض القيمة بناءً على التعليقات'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 6: Marketing & Sales Strategies
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Marketing & Sales Strategies',
    'استراتيجيات التسويق والمبيعات',
    6,
    'megaphone',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Marketing & Sales Strategies"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop integrated marketing and sales strategies that generate demand and close deals."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"استراتيجيات التسويق والمبيعات"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير استراتيجيات تسويق ومبيعات متكاملة تولد الطلب وتغلق الصفقات."}]}]}'::jsonb,
    'Develop integrated marketing and sales strategies that generate qualified leads, nurture prospects, and accelerate deal closure.',
    'تطوير استراتيجيات تسويق ومبيعات متكاملة تولد عملاء محتملين مؤهلين، وترعى العملاء المحتملين، وتسرع إغلاق الصفقات.',
    ARRAY['Design multi-channel marketing campaigns', 'Align sales and marketing processes', 'Implement account-based marketing (ABM) strategies'],
    ARRAY['تصميم حملات تسويقية متعددة القنوات', 'مواءمة عمليات المبيعات والتسويق', 'تنفيذ استراتيجيات التسويق القائم على الحسابات (ABM)'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 7: Financial Acumen & Business Cases
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Financial Acumen & Business Cases',
    'الفطنة المالية ودراسات الجدوى',
    7,
    'calculator',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Financial Acumen & Business Cases"}]},{"type":"paragraph","content":[{"type":"text","text":"Build strong financial skills to create compelling business cases and drive profitable growth."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"الفطنة المالية ودراسات الجدوى"}]},{"type":"paragraph","content":[{"type":"text","text":"بناء مهارات مالية قوية لإنشاء دراسات جدوى مقنعة ودفع النمو المربح."}]}]}'::jsonb,
    'Build strong financial acumen to analyze opportunities, create compelling business cases, and make data-driven investment decisions.',
    'بناء فطنة مالية قوية لتحليل الفرص، وإنشاء دراسات جدوى مقنعة، واتخاذ قرارات استثمارية قائمة على البيانات.',
    ARRAY['Read and interpret financial statements', 'Calculate key financial metrics (ROI, NPV, IRR, Payback Period)', 'Build comprehensive business cases with financial projections'],
    ARRAY['قراءة وتفسير البيانات المالية', 'حساب المقاييس المالية الرئيسية (العائد على الاستثمار، صافي القيمة الحالية، معدل العائد الداخلي، فترة الاسترداد)', 'بناء دراسات جدوى شاملة مع التوقعات المالية'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- ============================================================================
-- BEHAVIORAL COMPETENCY MODULES (8-14)
-- ============================================================================

-- Module 8: Strategic Leadership
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Strategic Leadership',
    'القيادة الاستراتيجية',
    8,
    'users',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Leadership"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop strategic leadership capabilities to set vision, inspire change, and build high-performing teams."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"القيادة الاستراتيجية"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير قدرات القيادة الاستراتيجية لتحديد الرؤية وإلهام التغيير وبناء فرق عالية الأداء."}]}]}'::jsonb,
    'Develop strategic leadership capabilities to set vision, inspire change, build teams, and make decisions under uncertainty.',
    'تطوير قدرات القيادة الاستراتيجية لتحديد الرؤية وإلهام التغيير وبناء الفرق واتخاذ القرارات في ظل عدم اليقين.',
    ARRAY['Distinguish between leadership and management roles', 'Articulate compelling visions and strategic narratives', 'Build and sustain high-performing teams'],
    ARRAY['التمييز بين أدوار القيادة والإدارة', 'صياغة رؤى مقنعة وروايات استراتيجية', 'بناء والحفاظ على فرق عالية الأداء'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 9: Relationship Building
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Relationship Building',
    'بناء العلاقات',
    9,
    'heart',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Relationship Building"}]},{"type":"paragraph","content":[{"type":"text","text":"Master the art of building authentic, long-lasting business relationships based on trust and mutual value."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"بناء العلاقات"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان فن بناء علاقات تجارية أصيلة وطويلة الأمد قائمة على الثقة والقيمة المتبادلة."}]}]}'::jsonb,
    'Master the art of building authentic, long-lasting business relationships based on trust, credibility, and mutual value creation.',
    'إتقان فن بناء علاقات تجارية أصيلة وطويلة الأمد قائمة على الثقة والمصداقية وخلق القيمة المتبادلة.',
    ARRAY['Build rapport and trust with diverse stakeholders', 'Leverage networking for business development', 'Maintain and nurture long-term relationships'],
    ARRAY['بناء العلاقات والثقة مع مختلف أصحاب المصلحة', 'الاستفادة من التواصل لتطوير الأعمال', 'الحفاظ على العلاقات طويلة الأمد ورعايتها'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 10: Negotiation & Influence
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Negotiation & Influence',
    'التفاوض والتأثير',
    10,
    'scale',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Negotiation & Influence"}]},{"type":"paragraph","content":[{"type":"text","text":"Master principled negotiation techniques and influence strategies to create win-win outcomes."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"التفاوض والتأثير"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان تقنيات التفاوض المبدئي واستراتيجيات التأثير لتحقيق نتائج مربحة للطرفين."}]}]}'::jsonb,
    'Master principled negotiation techniques and influence strategies to create mutually beneficial agreements and drive stakeholder alignment.',
    'إتقان تقنيات التفاوض المبدئي واستراتيجيات التأثير لإنشاء اتفاقيات مفيدة للطرفين ودفع توافق أصحاب المصلحة.',
    ARRAY['Apply principled negotiation frameworks (Getting to Yes)', 'Use persuasion and influence tactics ethically', 'Navigate complex multi-party negotiations'],
    ARRAY['تطبيق أطر التفاوض المبدئي (الوصول إلى نعم)', 'استخدام تكتيكات الإقناع والتأثير بشكل أخلاقي', 'التنقل في المفاوضات متعددة الأطراف المعقدة'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 11: Communication Excellence
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Communication Excellence',
    'التميز في التواصل',
    11,
    'message-square',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Communication Excellence"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop exceptional communication skills for presentations, storytelling, and stakeholder engagement."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"التميز في التواصل"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير مهارات تواصل استثنائية للعروض التقديمية ورواية القصص وإشراك أصحاب المصلحة."}]}]}'::jsonb,
    'Develop exceptional communication skills across all formats: presentations, written proposals, storytelling, and executive engagement.',
    'تطوير مهارات تواصل استثنائية عبر جميع الأشكال: العروض التقديمية، والمقترحات المكتوبة، ورواية القصص، والتواصل التنفيذي.',
    ARRAY['Deliver compelling executive presentations', 'Craft persuasive business proposals', 'Use storytelling to inspire action'],
    ARRAY['تقديم عروض تنفيذية مقنعة', 'صياغة مقترحات أعمال مقنعة', 'استخدام رواية القصص لإلهام العمل'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 12: Adaptability & Resilience
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Adaptability & Resilience',
    'القدرة على التكيف والمرونة',
    12,
    'refresh-cw',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Adaptability & Resilience"}]},{"type":"paragraph","content":[{"type":"text","text":"Build mental agility and resilience to thrive in dynamic business environments and overcome setbacks."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"القدرة على التكيف والمرونة"}]},{"type":"paragraph","content":[{"type":"text","text":"بناء خفة الحركة الذهنية والمرونة للنجاح في بيئات الأعمال الديناميكية والتغلب على النكسات."}]}]}'::jsonb,
    'Build mental agility and resilience to thrive in dynamic, uncertain business environments and bounce back from setbacks stronger.',
    'بناء خفة الحركة الذهنية والمرونة للنجاح في بيئات الأعمال الديناميكية وغير المؤكدة والتعافي من النكسات بشكل أقوى.',
    ARRAY['Adapt strategies in response to market changes', 'Develop resilience and growth mindset', 'Learn from failures and pivot effectively'],
    ARRAY['تكييف الاستراتيجيات استجابة لتغيرات السوق', 'تطوير المرونة وعقلية النمو', 'التعلم من الإخفاقات والتحول بفعالية'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 13: Problem Solving & Critical Thinking
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Problem Solving & Critical Thinking',
    'حل المشكلات والتفكير النقدي',
    13,
    'lightbulb',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Problem Solving & Critical Thinking"}]},{"type":"paragraph","content":[{"type":"text","text":"Apply structured problem-solving frameworks and critical thinking to tackle complex business challenges."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"حل المشكلات والتفكير النقدي"}]},{"type":"paragraph","content":[{"type":"text","text":"تطبيق أطر حل المشكلات المنظمة والتفكير النقدي لمعالجة تحديات الأعمال المعقدة."}]}]}'::jsonb,
    'Apply structured problem-solving frameworks and critical thinking methodologies to tackle complex, ambiguous business challenges.',
    'تطبيق أطر حل المشكلات المنظمة ومنهجيات التفكير النقدي لمعالجة تحديات الأعمال المعقدة والغامضة.',
    ARRAY['Apply structured problem-solving frameworks (5 Whys, Fishbone)', 'Use data and evidence for decision-making', 'Generate creative solutions through design thinking'],
    ARRAY['تطبيق أطر حل المشكلات المنظمة (5 لماذا، عظم السمكة)', 'استخدام البيانات والأدلة لاتخاذ القرارات', 'توليد حلول إبداعية من خلال التفكير التصميمي'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

-- Module 14: Ethical Decision Making
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Ethical Decision Making',
    'اتخاذ القرارات الأخلاقية',
    14,
    'shield',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Ethical Decision Making"}]},{"type":"paragraph","content":[{"type":"text","text":"Navigate ethical dilemmas and make principled decisions that build trust and sustainable business practices."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"اتخاذ القرارات الأخلاقية"}]},{"type":"paragraph","content":[{"type":"text","text":"التعامل مع المعضلات الأخلاقية واتخاذ قرارات مبدئية تبني الثقة وممارسات الأعمال المستدامة."}]}]}'::jsonb,
    'Navigate ethical dilemmas and make principled decisions that build trust, reputation, and sustainable business practices.',
    'التعامل مع المعضلات الأخلاقية واتخاذ قرارات مبدئية تبني الثقة والسمعة وممارسات الأعمال المستدامة.',
    ARRAY['Apply ethical frameworks to business decisions', 'Navigate conflicts of interest and dilemmas', 'Build cultures of integrity and accountability'],
    ARRAY['تطبيق الأطر الأخلاقية على قرارات الأعمال', 'التعامل مع تضارب المصالح والمعضلات', 'بناء ثقافات النزاهة والمساءلة'],
    3,
    NULL,
    NULL,
    true,
    70,
    'CP',
    true
);

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
    certification_type,
    section_type,
    COUNT(*) as module_count
FROM public.curriculum_modules
WHERE certification_type = 'CP'
GROUP BY certification_type, section_type
ORDER BY certification_type, section_type;
