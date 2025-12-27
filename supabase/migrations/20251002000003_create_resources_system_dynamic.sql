-- Migration: Create Resources & Content Management System (Dynamic & Flexible)
-- Date: 2025-10-02
-- Description: Dynamic resource system with configurable types, categories, and visibility

-- =============================================================================
-- CLEANUP: Drop old resources system (from migration 002)
-- =============================================================================

DROP TABLE IF EXISTS public.resource_access_log CASCADE;
DROP TABLE IF EXISTS public.curriculum_modules CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS resource_visibility CASCADE;
DROP TYPE IF EXISTS resource_status CASCADE;

-- =============================================================================
-- CONFIGURATION TABLES (Admin-manageable)
-- =============================================================================

-- Resource Types Configuration
CREATE TABLE IF NOT EXISTS public.resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type_key TEXT UNIQUE NOT NULL, -- 'document', 'video', etc.
  label_en TEXT NOT NULL,
  label_ar TEXT,

  -- UI Configuration
  icon TEXT, -- Lucide icon name: 'FileText', 'Video', etc.
  color TEXT, -- Tailwind color: 'blue', 'purple', etc.

  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resource Categories Configuration
CREATE TABLE IF NOT EXISTS public.resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  category_key TEXT UNIQUE NOT NULL, -- 'bock', 'exam_prep', 'templates', etc.
  label_en TEXT NOT NULL,
  label_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- UI Configuration
  icon TEXT,
  color TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visibility Rules Configuration
CREATE TABLE IF NOT EXISTS public.resource_visibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rule_key TEXT UNIQUE NOT NULL, -- 'public', 'certification', 'purchased', etc.
  label_en TEXT NOT NULL,
  label_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for config tables
CREATE INDEX idx_resource_types_active ON public.resource_types(is_active);
CREATE INDEX idx_resource_types_order ON public.resource_types(display_order);
CREATE INDEX idx_resource_categories_active ON public.resource_categories(is_active);
CREATE INDEX idx_resource_categories_order ON public.resource_categories(display_order);

-- =============================================================================
-- MAIN RESOURCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- File info
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  file_type TEXT, -- MIME type
  thumbnail_path TEXT,

  -- Classification (FK to config tables)
  resource_type_id UUID NOT NULL REFERENCES public.resource_types(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.resource_categories(id) ON DELETE SET NULL,
  certification_type certification_type, -- NULL = General
  tags TEXT[], -- Flexible tagging

  -- Visibility & Access (FK to config table)
  visibility_rule_id UUID NOT NULL REFERENCES public.resource_visibility_rules(id) ON DELETE RESTRICT,
  requires_certification BOOLEAN DEFAULT false,
  requires_purchase BOOLEAN DEFAULT false,
  woocommerce_product_id INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  version TEXT DEFAULT '1.0',
  language TEXT DEFAULT 'en',
  download_count INTEGER DEFAULT 0,

  -- Audit
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size > 0),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- Indexes
CREATE INDEX idx_resources_type ON public.resources(resource_type_id);
CREATE INDEX idx_resources_category ON public.resources(category_id);
CREATE INDEX idx_resources_cert_type ON public.resources(certification_type);
CREATE INDEX idx_resources_visibility ON public.resources(visibility_rule_id);
CREATE INDEX idx_resources_status ON public.resources(status);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resources_featured ON public.resources(is_featured) WHERE is_featured = true;

-- =============================================================================
-- CURRICULUM MODULES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Module info
  module_name TEXT NOT NULL,
  module_name_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- Hierarchy
  certification_type certification_type NOT NULL,
  module_number INTEGER NOT NULL,
  parent_module_id UUID REFERENCES public.curriculum_modules(id) ON DELETE SET NULL,

  -- Learning objectives
  learning_objectives TEXT[],
  learning_objectives_ar TEXT[],

  -- BoCK alignment
  bock_domains TEXT[],

  -- Resources (many-to-many via array)
  resource_ids UUID[],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_module_number UNIQUE (certification_type, module_number)
);

CREATE INDEX idx_curriculum_cert_type ON public.curriculum_modules(certification_type);
CREATE INDEX idx_curriculum_module_num ON public.curriculum_modules(module_number);
CREATE INDEX idx_curriculum_parent ON public.curriculum_modules(parent_module_id);

-- =============================================================================
-- ACCESS LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.resource_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  action TEXT NOT NULL, -- 'view', 'download'
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  CONSTRAINT valid_action CHECK (action IN ('view', 'download'))
);

CREATE INDEX idx_access_log_resource ON public.resource_access_log(resource_id);
CREATE INDEX idx_access_log_user ON public.resource_access_log(user_id);
CREATE INDEX idx_access_log_time ON public.resource_access_log(accessed_at);

-- =============================================================================
-- SEED DATA - Default Configuration
-- =============================================================================

-- Seed Resource Types
INSERT INTO public.resource_types (type_key, label_en, label_ar, icon, color, display_order) VALUES
  ('document', 'Document', 'وثيقة', 'FileText', 'blue', 1),
  ('video', 'Video', 'فيديو', 'Video', 'purple', 2),
  ('template', 'Template', 'قالب', 'FileCode', 'green', 3),
  ('guide', 'Study Guide', 'دليل الدراسة', 'BookOpen', 'orange', 4),
  ('audio', 'Audio', 'صوت', 'Mic', 'pink', 5),
  ('interactive', 'Interactive', 'تفاعلي', 'Monitor', 'indigo', 6)
ON CONFLICT (type_key) DO NOTHING;

-- Seed Resource Categories
INSERT INTO public.resource_categories (category_key, label_en, label_ar, description_en, icon, color, display_order) VALUES
  ('bock', 'BoCK Framework', 'إطار BoCK', 'BDA Body of Competencies and Knowledge', 'Layers', 'blue', 1),
  ('exam_prep', 'Exam Preparation', 'التحضير للامتحان', 'Study materials for certification exams', 'GraduationCap', 'green', 2),
  ('templates', 'Templates', 'قوالب', 'Ready-to-use templates and frameworks', 'FileCode', 'purple', 3),
  ('tutorials', 'Tutorials', 'دروس', 'Step-by-step tutorials and guides', 'PlayCircle', 'orange', 4),
  ('case_studies', 'Case Studies', 'دراسات الحالة', 'Real-world case studies', 'Briefcase', 'indigo', 5),
  ('tools', 'Tools & Software', 'أدوات وبرامج', 'Software tools and utilities', 'Wrench', 'gray', 6)
ON CONFLICT (category_key) DO NOTHING;

-- Seed Visibility Rules
INSERT INTO public.resource_visibility_rules (rule_key, label_en, label_ar, description_en) VALUES
  ('public', 'Public', 'عام', 'Available to all authenticated users'),
  ('certification', 'Certification-Based', 'حسب الشهادة', 'Available based on user certification type'),
  ('purchased', 'Purchase Required', 'يتطلب الشراء', 'Available only after purchasing from store'),
  ('admin_only', 'Admin Only', 'للمسؤولين فقط', 'Restricted to administrators')
ON CONFLICT (rule_key) DO NOTHING;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_resource_types_updated_at
  BEFORE UPDATE ON public.resource_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_categories_updated_at
  BEFORE UPDATE ON public.resource_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_modules_updated_at
  BEFORE UPDATE ON public.curriculum_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment download count on access
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'download' THEN
    UPDATE public.resources
    SET download_count = download_count + 1
    WHERE id = NEW.resource_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_resource_download
  AFTER INSERT ON public.resource_access_log
  FOR EACH ROW EXECUTE FUNCTION increment_download_count();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_visibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_access_log ENABLE ROW LEVEL SECURITY;

-- Config tables: Everyone can read, only admins can write
CREATE POLICY "Anyone can view active resource types"
  ON public.resource_types FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage resource types"
  ON public.resource_types FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Anyone can view active categories"
  ON public.resource_categories FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage categories"
  ON public.resource_categories FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Anyone can view visibility rules"
  ON public.resource_visibility_rules FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage visibility rules"
  ON public.resource_visibility_rules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Resources: Complex visibility logic
CREATE POLICY "Users see published resources based on visibility"
  ON public.resources FOR SELECT
  TO authenticated USING (
    status = 'published' AND (
      -- Admin sees all
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
      OR
      -- Check visibility rule
      EXISTS (
        SELECT 1 FROM public.resource_visibility_rules rv
        WHERE rv.id = resources.visibility_rule_id
        AND (
          rv.rule_key = 'public'
          OR (rv.rule_key = 'certification' AND (
            resources.certification_type IS NULL
            OR EXISTS (
              SELECT 1 FROM public.quiz_attempts qa
              JOIN public.quizzes q ON qa.quiz_id = q.id
              WHERE qa.user_id = auth.uid() AND qa.passed = true
              AND q.certification_type::text = resources.certification_type::text
            )
          ))
        )
      )
    )
  );

CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Curriculum: Read for all, write for admins
CREATE POLICY "Users see active curriculum"
  ON public.curriculum_modules FOR SELECT
  TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage curriculum"
  ON public.curriculum_modules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Access log
CREATE POLICY "Users log their access"
  ON public.resource_access_log FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own access log"
  ON public.resource_access_log FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

/**
 * Get accessible resources for user (with full metadata)
 */
CREATE OR REPLACE FUNCTION get_accessible_resources(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  file_path TEXT,
  resource_type_key TEXT,
  resource_type_label TEXT,
  category_key TEXT,
  category_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.file_path,
    rt.type_key,
    rt.label_en,
    rc.category_key,
    rc.label_en
  FROM public.resources r
  JOIN public.resource_types rt ON r.resource_type_id = rt.id
  LEFT JOIN public.resource_categories rc ON r.category_id = rc.id
  JOIN public.resource_visibility_rules rv ON r.visibility_rule_id = rv.id
  WHERE r.status = 'published'
  AND (
    rv.rule_key = 'public'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND role IN ('admin', 'super_admin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.resource_types IS 'Configurable resource types (admin-manageable)';
COMMENT ON TABLE public.resource_categories IS 'Configurable resource categories (admin-manageable)';
COMMENT ON TABLE public.resource_visibility_rules IS 'Visibility rules configuration';
COMMENT ON TABLE public.resources IS 'Resources and learning materials';
COMMENT ON TABLE public.curriculum_modules IS 'Curriculum structure by certification';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Dynamic Resources & Content Management system created!' as status;
