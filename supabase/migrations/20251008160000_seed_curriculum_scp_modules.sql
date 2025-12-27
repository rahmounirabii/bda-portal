-- ============================================================================
-- MIGRATION: Seed BDA-SCP Curriculum Modules
-- ============================================================================
-- Migration: 20251008160000
-- Description: Seeds 14 professional curriculum modules for BDA-SCP certification
-- Modules: 14 (7 Knowledge-Based + 7 Behavioral Competencies)
-- Language: Bilingual (English + Arabic)
-- Author: BDA Development Team
-- Created: 2025-10-08
-- ============================================================================
-- IDEMPOTENT: Safe to run multiple times (deletes existing SCP modules first)
-- ============================================================================

-- Delete existing SCP modules if they exist (ensures idempotency)
DELETE FROM public.curriculum_modules WHERE certification_type = 'SCP';

BEGIN;

-- ============================================================================
-- KNOWLEDGE-BASED MODULES (1-7)
-- ============================================================================

-- Module 1: Growth & Expansion Strategies (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Advanced Growth & Expansion Strategies',
    'استراتيجيات النمو والتوسع المتقدمة',
    1,
    'trending-up',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Advanced Growth & Expansion Strategies"}]},{"type":"paragraph","content":[{"type":"text","text":"Master advanced strategic growth frameworks including M&A, global expansion, and portfolio optimization for senior business development leaders."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"استراتيجيات النمو والتوسع المتقدمة"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان أطر النمو الاستراتيجي المتقدمة بما في ذلك الاندماج والاستحواذ والتوسع العالمي وتحسين المحفظة لقادة تطوير الأعمال الكبار."}]}]}'::jsonb,
    'Master advanced strategic growth frameworks including M&A strategy, international expansion, portfolio optimization, and transformation initiatives for senior business development leaders.',
    'إتقان أطر النمو الاستراتيجي المتقدمة بما في ذلك استراتيجية الاندماج والاستحواذ والتوسع الدولي وتحسين المحفظة ومبادرات التحول لقادة تطوير الأعمال الكبار.',
    ARRAY['Design and execute complex M&A strategies', 'Lead international market entry and expansion initiatives', 'Optimize business unit portfolios for strategic fit', 'Drive enterprise-wide transformation programs'],
    ARRAY['تصميم وتنفيذ استراتيجيات اندماج واستحواذ معقدة', 'قيادة مبادرات دخول وتوسع السوق الدولية', 'تحسين محافظ وحدات الأعمال للملاءمة الاستراتيجية', 'دفع برامج التحول على مستوى المؤسسة'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 2: Market & Competitive Analysis (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Advanced Market Intelligence & Competitive Strategy',
    'الذكاء السوقي والاستراتيجية التنافسية المتقدمة',
    2,
    'search',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Advanced Market Intelligence & Competitive Strategy"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop executive-level skills in market intelligence, competitive dynamics, disruption analysis, and strategic foresight."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"الذكاء السوقي والاستراتيجية التنافسية المتقدمة"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير مهارات على المستوى التنفيذي في الذكاء السوقي والديناميكيات التنافسية وتحليل الاضطراب والبصيرة الاستراتيجية."}]}]}'::jsonb,
    'Develop executive-level capabilities in market intelligence, competitive dynamics analysis, disruption forecasting, and strategic scenario planning.',
    'تطوير قدرات على المستوى التنفيذي في الذكاء السوقي وتحليل الديناميكيات التنافسية والتنبؤ بالاضطراب والتخطيط الاستراتيجي للسيناريوهات.',
    ARRAY['Build enterprise market intelligence systems', 'Anticipate and respond to market disruptions', 'Conduct war gaming and competitive simulations', 'Lead strategic foresight and scenario planning'],
    ARRAY['بناء أنظمة الذكاء السوقي المؤسسي', 'توقع والاستجابة لاضطرابات السوق', 'إجراء ألعاب حرب ومحاكاة تنافسية', 'قيادة البصيرة الاستراتيجية والتخطيط للسيناريوهات'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 3: Strategic Partnerships & Alliances (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Strategic Partnership Ecosystems & Alliances',
    'أنظمة الشراكة الاستراتيجية والتحالفات',
    3,
    'handshake',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Partnership Ecosystems & Alliances"}]},{"type":"paragraph","content":[{"type":"text","text":"Master the orchestration of complex partnership ecosystems, joint ventures, and strategic alliances at the enterprise level."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"أنظمة الشراكة الاستراتيجية والتحالفات"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان تنسيق أنظمة الشراكة المعقدة والمشاريع المشتركة والتحالفات الاستراتيجية على مستوى المؤسسة."}]}]}'::jsonb,
    'Master the design and orchestration of complex partnership ecosystems, joint ventures, and strategic alliances that create sustainable competitive advantage.',
    'إتقان تصميم وتنسيق أنظمة الشراكة المعقدة والمشاريع المشتركة والتحالفات الاستراتيجية التي تخلق ميزة تنافسية مستدامة.',
    ARRAY['Design and manage multi-party partnership ecosystems', 'Structure and govern joint ventures and strategic alliances', 'Create platform-based partnership strategies', 'Navigate cross-cultural and international partnerships'],
    ARRAY['تصميم وإدارة أنظمة شراكة متعددة الأطراف', 'هيكلة وحوكمة المشاريع المشتركة والتحالفات الاستراتيجية', 'إنشاء استراتيجيات شراكة قائمة على المنصة', 'التنقل في الشراكات عبر الثقافات والدولية'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 4: Opportunity Identification & Qualification (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Strategic Opportunity Assessment & Portfolio Management',
    'تقييم الفرص الاستراتيجية وإدارة المحفظة',
    4,
    'target',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Opportunity Assessment & Portfolio Management"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop advanced frameworks for identifying transformational opportunities and managing strategic opportunity portfolios."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"تقييم الفرص الاستراتيجية وإدارة المحفظة"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير أطر متقدمة لتحديد الفرص التحويلية وإدارة محافظ الفرص الاستراتيجية."}]}]}'::jsonb,
    'Develop advanced frameworks for identifying transformational opportunities, conducting strategic due diligence, and managing enterprise opportunity portfolios.',
    'تطوير أطر متقدمة لتحديد الفرص التحويلية وإجراء العناية الواجبة الاستراتيجية وإدارة محافظ الفرص المؤسسية.',
    ARRAY['Identify and evaluate transformational market opportunities', 'Conduct strategic due diligence for major initiatives', 'Manage and optimize opportunity portfolios', 'Build business development pipeline forecasting models'],
    ARRAY['تحديد وتقييم فرص السوق التحويلية', 'إجراء العناية الواجبة الاستراتيجية للمبادرات الكبرى', 'إدارة وتحسين محافظ الفرص', 'بناء نماذج التنبؤ بخطوط أنابيب تطوير الأعمال'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 5: Value Proposition Development (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Enterprise Value Architecture & Positioning',
    'هندسة القيمة المؤسسية والتموضع',
    5,
    'gift',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Enterprise Value Architecture & Positioning"}]},{"type":"paragraph","content":[{"type":"text","text":"Design comprehensive value architectures and strategic positioning frameworks for enterprise solutions and transformational offerings."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"هندسة القيمة المؤسسية والتموضع"}]},{"type":"paragraph","content":[{"type":"text","text":"تصميم هياكل قيمة شاملة وأطر تموضع استراتيجية للحلول المؤسسية والعروض التحويلية."}]}]}'::jsonb,
    'Design comprehensive value architectures, strategic positioning frameworks, and ROI models for enterprise solutions and transformational offerings.',
    'تصميم هياكل قيمة شاملة وأطر تموضع استراتيجية ونماذج عائد استثمار للحلول المؤسسية والعروض التحويلية.',
    ARRAY['Design enterprise-level value architectures', 'Create strategic positioning for complex solutions', 'Build comprehensive business case and ROI models', 'Develop category-creating value propositions'],
    ARRAY['تصميم هياكل القيمة على مستوى المؤسسة', 'إنشاء تموضع استراتيجي للحلول المعقدة', 'بناء نماذج شاملة لدراسة الجدوى والعائد على الاستثمار', 'تطوير عروض قيمة تخلق فئات جديدة'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 6: Marketing & Sales Strategies (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Enterprise Revenue Strategy & Go-to-Market Excellence',
    'استراتيجية الإيرادات المؤسسية والتميز في الذهاب إلى السوق',
    6,
    'megaphone',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Enterprise Revenue Strategy & Go-to-Market Excellence"}]},{"type":"paragraph","content":[{"type":"text","text":"Master enterprise go-to-market strategies, revenue architecture, and sales transformation for complex B2B environments."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"استراتيجية الإيرادات المؤسسية والتميز في الذهاب إلى السوق"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان استراتيجيات الذهاب إلى السوق المؤسسية وهندسة الإيرادات وتحول المبيعات لبيئات B2B المعقدة."}]}]}'::jsonb,
    'Master enterprise go-to-market strategies, revenue architecture, sales transformation, and strategic customer engagement for complex B2B environments.',
    'إتقان استراتيجيات الذهاب إلى السوق المؤسسية وهندسة الإيرادات وتحول المبيعات والمشاركة الاستراتيجية للعملاء لبيئات B2B المعقدة.',
    ARRAY['Design enterprise go-to-market strategies', 'Architect revenue models and pricing strategies', 'Lead sales transformation initiatives', 'Build strategic customer engagement programs'],
    ARRAY['تصميم استراتيجيات الذهاب إلى السوق المؤسسية', 'هندسة نماذج الإيرادات واستراتيجيات التسعير', 'قيادة مبادرات تحول المبيعات', 'بناء برامج المشاركة الاستراتيجية للعملاء'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 7: Financial Acumen & Business Cases (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'knowledge_based',
    'Strategic Finance & Investment Decision Making',
    'التمويل الاستراتيجي واتخاذ قرارات الاستثمار',
    7,
    'calculator',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Finance & Investment Decision Making"}]},{"type":"paragraph","content":[{"type":"text","text":"Master advanced financial modeling, capital allocation, valuation, and strategic investment decisions for business development leaders."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"التمويل الاستراتيجي واتخاذ قرارات الاستثمار"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان النمذجة المالية المتقدمة وتخصيص رأس المال والتقييم وقرارات الاستثمار الاستراتيجية لقادة تطوير الأعمال."}]}]}'::jsonb,
    'Master advanced financial modeling, capital allocation, valuation methodologies, and strategic investment decisions for major business development initiatives.',
    'إتقان النمذجة المالية المتقدمة وتخصيص رأس المال ومنهجيات التقييم وقرارات الاستثمار الاستراتيجية لمبادرات تطوير الأعمال الكبرى.',
    ARRAY['Build complex financial models for major initiatives', 'Conduct business valuations and M&A analysis', 'Optimize capital allocation and portfolio investments', 'Present financial cases to boards and investors'],
    ARRAY['بناء نماذج مالية معقدة للمبادرات الكبرى', 'إجراء تقييمات الأعمال وتحليل الاندماج والاستحواذ', 'تحسين تخصيص رأس المال واستثمارات المحفظة', 'تقديم الحالات المالية لمجالس الإدارة والمستثمرين'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- ============================================================================
-- BEHAVIORAL COMPETENCY MODULES (8-14)
-- ============================================================================

-- Module 8: Strategic Leadership (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Executive Leadership & Organizational Influence',
    'القيادة التنفيذية والتأثير التنظيمي',
    8,
    'users',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Executive Leadership & Organizational Influence"}]},{"type":"paragraph","content":[{"type":"text","text":"Develop executive leadership capabilities to drive organizational transformation, influence at the C-suite level, and shape corporate strategy."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"القيادة التنفيذية والتأثير التنظيمي"}]},{"type":"paragraph","content":[{"type":"text","text":"تطوير قدرات القيادة التنفيذية لدفع التحول التنظيمي والتأثير على مستوى الإدارة التنفيذية وتشكيل استراتيجية الشركة."}]}]}'::jsonb,
    'Develop executive leadership capabilities to drive organizational transformation, influence at the C-suite level, shape corporate strategy, and lead enterprise-wide initiatives.',
    'تطوير قدرات القيادة التنفيذية لدفع التحول التنظيمي والتأثير على مستوى الإدارة التنفيذية وتشكيل استراتيجية الشركة وقيادة المبادرات على مستوى المؤسسة.',
    ARRAY['Lead enterprise-wide transformation initiatives', 'Influence and collaborate with C-suite executives', 'Shape corporate strategy and business direction', 'Build and lead high-performing BD organizations'],
    ARRAY['قيادة مبادرات التحول على مستوى المؤسسة', 'التأثير والتعاون مع المديرين التنفيذيين', 'تشكيل استراتيجية الشركة واتجاه الأعمال', 'بناء وقيادة منظمات تطوير أعمال عالية الأداء'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 9: Relationship Building (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Strategic Relationship Architecture & Executive Networking',
    'هندسة العلاقات الاستراتيجية والتواصل التنفيذي',
    9,
    'heart',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Relationship Architecture & Executive Networking"}]},{"type":"paragraph","content":[{"type":"text","text":"Master the art of building and orchestrating strategic relationship networks at the executive level across multiple stakeholder ecosystems."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"هندسة العلاقات الاستراتيجية والتواصل التنفيذي"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان فن بناء وتنسيق شبكات العلاقات الاستراتيجية على المستوى التنفيذي عبر أنظمة متعددة من أصحاب المصلحة."}]}]}'::jsonb,
    'Master the orchestration of strategic relationship networks at the executive level, building influence across multiple stakeholder ecosystems and industry communities.',
    'إتقان تنسيق شبكات العلاقات الاستراتيجية على المستوى التنفيذي، وبناء التأثير عبر أنظمة متعددة من أصحاب المصلحة ومجتمعات الصناعة.',
    ARRAY['Build and manage executive relationship networks', 'Orchestrate multi-stakeholder relationship ecosystems', 'Develop industry thought leadership and influence', 'Navigate complex political and organizational dynamics'],
    ARRAY['بناء وإدارة شبكات العلاقات التنفيذية', 'تنسيق أنظمة علاقات متعددة أصحاب المصلحة', 'تطوير القيادة الفكرية والتأثير في الصناعة', 'التنقل في الديناميكيات السياسية والتنظيمية المعقدة'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 10: Negotiation & Influence (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Complex Negotiation & Strategic Influence',
    'التفاوض المعقد والتأثير الاستراتيجي',
    10,
    'scale',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Complex Negotiation & Strategic Influence"}]},{"type":"paragraph","content":[{"type":"text","text":"Master advanced negotiation strategies for complex, high-stakes deals and develop sophisticated influence tactics for executive environments."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"التفاوض المعقد والتأثير الاستراتيجي"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان استراتيجيات التفاوض المتقدمة للصفقات المعقدة عالية المخاطر وتطوير تكتيكات التأثير المتطورة للبيئات التنفيذية."}]}]}'::jsonb,
    'Master advanced negotiation strategies for complex, high-stakes deals and develop sophisticated influence tactics for executive-level stakeholder management.',
    'إتقان استراتيجيات التفاوض المتقدمة للصفقات المعقدة عالية المخاطر وتطوير تكتيكات التأثير المتطورة لإدارة أصحاب المصلحة على المستوى التنفيذي.',
    ARRAY['Lead complex, multi-party, high-stakes negotiations', 'Deploy advanced influence strategies at executive level', 'Negotiate across cultures and international contexts', 'Resolve high-stakes conflicts and impasses'],
    ARRAY['قيادة المفاوضات المعقدة متعددة الأطراف عالية المخاطر', 'نشر استراتيجيات التأثير المتقدمة على المستوى التنفيذي', 'التفاوض عبر الثقافات والسياقات الدولية', 'حل النزاعات والمآزق عالية المخاطر'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 11: Communication Excellence (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Executive Communication & Strategic Storytelling',
    'التواصل التنفيذي ورواية القصص الاستراتيجية',
    11,
    'message-square',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Executive Communication & Strategic Storytelling"}]},{"type":"paragraph","content":[{"type":"text","text":"Master executive-level communication, board presentations, strategic storytelling, and thought leadership for maximum organizational impact."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"التواصل التنفيذي ورواية القصص الاستراتيجية"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان التواصل على المستوى التنفيذي وعروض مجلس الإدارة ورواية القصص الاستراتيجية والقيادة الفكرية لتحقيق أقصى تأثير تنظيمي."}]}]}'::jsonb,
    'Master executive-level communication including board presentations, strategic storytelling, crisis communication, and thought leadership for maximum organizational impact.',
    'إتقان التواصل على المستوى التنفيذي بما في ذلك عروض مجلس الإدارة ورواية القصص الاستراتيجية والتواصل في الأزمات والقيادة الفكرية لتحقيق أقصى تأثير تنظيمي.',
    ARRAY['Deliver compelling board and investor presentations', 'Craft strategic narratives for organizational transformation', 'Lead crisis communication and reputation management', 'Build executive thought leadership and public presence'],
    ARRAY['تقديم عروض مقنعة لمجلس الإدارة والمستثمرين', 'صياغة روايات استراتيجية للتحول التنظيمي', 'قيادة التواصل في الأزمات وإدارة السمعة', 'بناء القيادة الفكرية التنفيذية والحضور العام'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 12: Adaptability & Resilience (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Strategic Agility & Organizational Resilience',
    'الرشاقة الاستراتيجية والمرونة التنظيمية',
    12,
    'refresh-cw',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Agility & Organizational Resilience"}]},{"type":"paragraph","content":[{"type":"text","text":"Build strategic agility to lead organizations through disruption, transformation, and continuous adaptation in volatile markets."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"الرشاقة الاستراتيجية والمرونة التنظيمية"}]},{"type":"paragraph","content":[{"type":"text","text":"بناء الرشاقة الاستراتيجية لقيادة المنظمات عبر الاضطراب والتحول والتكيف المستمر في الأسواق المتقلبة."}]}]}'::jsonb,
    'Build strategic agility to lead organizations through disruption, transformation, and continuous adaptation while maintaining operational excellence in volatile markets.',
    'بناء الرشاقة الاستراتيجية لقيادة المنظمات عبر الاضطراب والتحول والتكيف المستمر مع الحفاظ على التميز التشغيلي في الأسواق المتقلبة.',
    ARRAY['Lead organizations through major disruptions and pivots', 'Build organizational resilience and adaptive capacity', 'Foster cultures of continuous learning and innovation', 'Navigate volatility while maintaining performance'],
    ARRAY['قيادة المنظمات عبر الاضطرابات والتحولات الكبرى', 'بناء المرونة التنظيمية والقدرة على التكيف', 'تعزيز ثقافات التعلم المستمر والابتكار', 'التنقل في التقلبات مع الحفاظ على الأداء'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 13: Problem Solving & Critical Thinking (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Strategic Problem Solving & Systems Thinking',
    'حل المشكلات الاستراتيجية والتفكير النظمي',
    13,
    'lightbulb',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Strategic Problem Solving & Systems Thinking"}]},{"type":"paragraph","content":[{"type":"text","text":"Master advanced problem-solving frameworks, systems thinking, and strategic decision-making for complex organizational challenges."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"حل المشكلات الاستراتيجية والتفكير النظمي"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان أطر حل المشكلات المتقدمة والتفكير النظمي واتخاذ القرارات الاستراتيجية للتحديات التنظيمية المعقدة."}]}]}'::jsonb,
    'Master advanced problem-solving frameworks, systems thinking, and strategic decision-making methodologies to address complex, interconnected organizational challenges.',
    'إتقان أطر حل المشكلات المتقدمة والتفكير النظمي ومنهجيات اتخاذ القرارات الاستراتيجية لمعالجة التحديات التنظيمية المعقدة والمترابطة.',
    ARRAY['Apply systems thinking to complex organizational problems', 'Lead strategic problem-solving at enterprise scale', 'Make high-stakes decisions with incomplete information', 'Foster organizational problem-solving capabilities'],
    ARRAY['تطبيق التفكير النظمي على المشكلات التنظيمية المعقدة', 'قيادة حل المشكلات الاستراتيجية على نطاق المؤسسة', 'اتخاذ قرارات عالية المخاطر بمعلومات غير كاملة', 'تعزيز قدرات حل المشكلات التنظيمية'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
    true
);

-- Module 14: Ethical Decision Making (Senior Level)
INSERT INTO public.curriculum_modules (
    section_type, competency_name, competency_name_ar, order_index, icon,
    content, content_ar, description, description_ar,
    learning_objectives, learning_objectives_ar,
    estimated_duration_hours, prerequisite_module_id, quiz_id,
    quiz_required, quiz_passing_score, certification_type, is_published
) VALUES (
    'behavioral',
    'Ethics, Governance & Corporate Responsibility',
    'الأخلاقيات والحوكمة والمسؤولية المؤسسية',
    14,
    'shield',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Ethics, Governance & Corporate Responsibility"}]},{"type":"paragraph","content":[{"type":"text","text":"Master ethical leadership, corporate governance, stakeholder capitalism, and sustainable business practices at the enterprise level."}]}]}'::jsonb,
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"الأخلاقيات والحوكمة والمسؤولية المؤسسية"}]},{"type":"paragraph","content":[{"type":"text","text":"إتقان القيادة الأخلاقية وحوكمة الشركات ورأسمالية أصحاب المصلحة وممارسات الأعمال المستدامة على مستوى المؤسسة."}]}]}'::jsonb,
    'Master ethical leadership, corporate governance, stakeholder capitalism, ESG integration, and sustainable business practices that create long-term value for all stakeholders.',
    'إتقان القيادة الأخلاقية وحوكمة الشركات ورأسمالية أصحاب المصلحة ودمج ESG وممارسات الأعمال المستدامة التي تخلق قيمة طويلة الأجل لجميع أصحاب المصلحة.',
    ARRAY['Lead ethical decision-making in complex situations', 'Implement governance frameworks and compliance programs', 'Integrate ESG and sustainability into business strategy', 'Balance stakeholder interests and long-term value creation'],
    ARRAY['قيادة اتخاذ القرارات الأخلاقية في المواقف المعقدة', 'تنفيذ أطر الحوكمة وبرامج الامتثال', 'دمج ESG والاستدامة في استراتيجية الأعمال', 'الموازنة بين مصالح أصحاب المصلحة وخلق القيمة طويلة الأجل'],
    4,
    NULL,
    NULL,
    true,
    75,
    'SCP',
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
WHERE certification_type = 'SCP'
GROUP BY certification_type, section_type
ORDER BY certification_type, section_type;
