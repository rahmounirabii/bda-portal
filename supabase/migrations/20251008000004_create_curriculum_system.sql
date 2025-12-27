-- Migration: Create Curriculum Learning System
-- Date: 2025-10-08
-- Description: Complete curriculum system with BoCK structure, access control, and sequential unlocking

-- =============================================================================
-- TABLE: curriculum_modules
-- Main table for curriculum content (14 modules: 7 knowledge + 7 behavioral)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- BoCK Structure (Business Development Association Body of Competency Knowledge)
    section_type TEXT NOT NULL CHECK (section_type IN ('knowledge_based', 'behavioral')),
    competency_name TEXT NOT NULL,
    competency_name_ar TEXT,
    order_index INTEGER NOT NULL UNIQUE CHECK (order_index BETWEEN 1 AND 14),
    icon TEXT, -- Icon name for UI (e.g., 'chart', 'users', 'brain')

    -- Rich Content (JSON format for TipTap/Lexical editor)
    content JSONB NOT NULL DEFAULT '{}',
    content_ar JSONB DEFAULT '{}',

    -- Module metadata
    description TEXT,
    description_ar TEXT,
    learning_objectives TEXT[] DEFAULT '{}',
    learning_objectives_ar TEXT[] DEFAULT '{}',
    estimated_duration_hours INTEGER DEFAULT 2,

    -- Prerequisites and Sequential Logic
    prerequisite_module_id UUID REFERENCES public.curriculum_modules(id) ON DELETE SET NULL,

    -- Quiz Integration (using existing quiz system)
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    quiz_required BOOLEAN NOT NULL DEFAULT true,
    quiz_passing_score INTEGER NOT NULL DEFAULT 70 CHECK (quiz_passing_score BETWEEN 0 AND 100),

    -- Certification link
    certification_type certification_type NOT NULL,

    -- Publishing control (admin only)
    is_published BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_order_per_section CHECK (
        (section_type = 'knowledge_based' AND order_index BETWEEN 1 AND 7) OR
        (section_type = 'behavioral' AND order_index BETWEEN 8 AND 14)
    )
);

-- Indexes for performance
CREATE INDEX idx_curriculum_modules_section_type ON public.curriculum_modules(section_type);
CREATE INDEX idx_curriculum_modules_order ON public.curriculum_modules(order_index);
CREATE INDEX idx_curriculum_modules_cert_type ON public.curriculum_modules(certification_type);
CREATE INDEX idx_curriculum_modules_published ON public.curriculum_modules(is_published);
CREATE INDEX idx_curriculum_modules_prerequisite ON public.curriculum_modules(prerequisite_module_id);
CREATE INDEX idx_curriculum_modules_quiz ON public.curriculum_modules(quiz_id);

-- Comment
COMMENT ON TABLE public.curriculum_modules IS 'Curriculum modules based on BDA BoCK - 14 competencies (7 knowledge-based + 7 behavioral)';

-- =============================================================================
-- TABLE: user_curriculum_access
-- Manages user access to curriculum (1 year after purchase)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_curriculum_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User reference
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Certification type
    certification_type certification_type NOT NULL,

    -- Purchase info (from WooCommerce)
    woocommerce_order_id INTEGER,
    woocommerce_product_id INTEGER,

    -- Access period
    purchased_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Auto-grant tracking
    last_checked_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_access_dates CHECK (expires_at > purchased_at),
    CONSTRAINT unique_user_cert_access UNIQUE (user_id, certification_type)
);

-- Indexes
CREATE INDEX idx_user_curriculum_access_user ON public.user_curriculum_access(user_id);
CREATE INDEX idx_user_curriculum_access_cert_type ON public.user_curriculum_access(certification_type);
CREATE INDEX idx_user_curriculum_access_active ON public.user_curriculum_access(is_active);
CREATE INDEX idx_user_curriculum_access_expires ON public.user_curriculum_access(expires_at);

-- Comment
COMMENT ON TABLE public.user_curriculum_access IS 'Tracks user access to curriculum (1 year from purchase)';

-- =============================================================================
-- TABLE: user_curriculum_progress
-- Tracks user progress through modules (reading, quiz, completion)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_curriculum_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,

    -- Progress Status
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'quiz_pending', 'completed')),

    -- Reading Progress
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- Quiz Progress
    best_quiz_score INTEGER CHECK (best_quiz_score BETWEEN 0 AND 100),
    quiz_attempts_count INTEGER NOT NULL DEFAULT 0,
    last_quiz_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,

    -- Completion
    completed_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_module_progress UNIQUE (user_id, module_id),
    CONSTRAINT valid_completion CHECK (
        (status = 'completed' AND completed_at IS NOT NULL AND best_quiz_score IS NOT NULL) OR
        (status != 'completed')
    )
);

-- Indexes
CREATE INDEX idx_user_curriculum_progress_user ON public.user_curriculum_progress(user_id);
CREATE INDEX idx_user_curriculum_progress_module ON public.user_curriculum_progress(module_id);
CREATE INDEX idx_user_curriculum_progress_status ON public.user_curriculum_progress(status);
CREATE INDEX idx_user_curriculum_progress_completed ON public.user_curriculum_progress(completed_at);

-- Comment
COMMENT ON TABLE public.user_curriculum_progress IS 'Tracks user progress through curriculum modules';

-- =============================================================================
-- FUNCTION: is_module_unlocked
-- Checks if a module is unlocked for a user (prerequisite completed)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_module_unlocked(
    p_user_id UUID,
    p_module_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_prerequisite_id UUID;
    v_prerequisite_status TEXT;
BEGIN
    -- Get prerequisite module ID
    SELECT prerequisite_module_id INTO v_prerequisite_id
    FROM public.curriculum_modules
    WHERE id = p_module_id;

    -- If no prerequisite (Module 1), always unlocked
    IF v_prerequisite_id IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if prerequisite is completed
    SELECT status INTO v_prerequisite_status
    FROM public.user_curriculum_progress
    WHERE user_id = p_user_id AND module_id = v_prerequisite_id;

    RETURN COALESCE(v_prerequisite_status = 'completed', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_module_unlocked IS 'Checks if a module is unlocked based on prerequisite completion';

-- =============================================================================
-- FUNCTION: get_next_unlocked_module
-- Returns the next module the user should take
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_next_unlocked_module(
    p_user_id UUID,
    p_certification_type certification_type
) RETURNS UUID AS $$
DECLARE
    v_next_module_id UUID;
BEGIN
    -- Find first incomplete module in order
    SELECT cm.id INTO v_next_module_id
    FROM public.curriculum_modules cm
    LEFT JOIN public.user_curriculum_progress ucp
        ON cm.id = ucp.module_id AND ucp.user_id = p_user_id
    WHERE cm.certification_type = p_certification_type
        AND cm.is_published = true
        AND (ucp.status IS NULL OR ucp.status != 'completed')
        AND public.is_module_unlocked(p_user_id, cm.id) = true
    ORDER BY cm.order_index
    LIMIT 1;

    RETURN v_next_module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_next_unlocked_module IS 'Returns the next unlocked module for a user';

-- =============================================================================
-- FUNCTION: initialize_user_progress
-- Creates initial progress records for all modules when user gets access
-- =============================================================================

CREATE OR REPLACE FUNCTION public.initialize_user_progress(
    p_user_id UUID,
    p_certification_type certification_type
) RETURNS VOID AS $$
DECLARE
    v_module RECORD;
    v_first_module BOOLEAN := TRUE;
BEGIN
    -- Create progress records for all modules
    FOR v_module IN
        SELECT id, order_index FROM public.curriculum_modules
        WHERE certification_type = p_certification_type AND is_published = true
        ORDER BY order_index
    LOOP
        INSERT INTO public.user_curriculum_progress (
            user_id,
            module_id,
            status,
            progress_percentage
        ) VALUES (
            p_user_id,
            v_module.id,
            CASE WHEN v_first_module THEN 'in_progress' ELSE 'locked' END,
            0
        )
        ON CONFLICT (user_id, module_id) DO NOTHING;

        v_first_module := FALSE;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.initialize_user_progress IS 'Initializes progress records for all curriculum modules';

-- =============================================================================
-- TRIGGER: Update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_curriculum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER curriculum_modules_updated_at
    BEFORE UPDATE ON public.curriculum_modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_curriculum_updated_at();

CREATE TRIGGER user_curriculum_access_updated_at
    BEFORE UPDATE ON public.user_curriculum_access
    FOR EACH ROW
    EXECUTE FUNCTION public.update_curriculum_updated_at();

CREATE TRIGGER user_curriculum_progress_updated_at
    BEFORE UPDATE ON public.user_curriculum_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_curriculum_updated_at();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_curriculum_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_curriculum_progress ENABLE ROW LEVEL SECURITY;

-- CURRICULUM MODULES POLICIES

-- Read: Admin always, users only if they have active access
CREATE POLICY "curriculum_modules_read" ON public.curriculum_modules
FOR SELECT USING (
    -- Admin can see all (including drafts)
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ) OR
    (
        -- Users can only see published modules if they have active access
        is_published = true AND
        EXISTS (
            SELECT 1 FROM public.user_curriculum_access
            WHERE user_id = auth.uid()
            AND certification_type = curriculum_modules.certification_type
            AND is_active = true
            AND expires_at > NOW()
        )
    )
);

-- Write: Admin only
CREATE POLICY "curriculum_modules_write" ON public.curriculum_modules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- USER CURRICULUM ACCESS POLICIES

-- Read: Users see their own, admins see all
CREATE POLICY "user_curriculum_access_read" ON public.user_curriculum_access
FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Write: Admin only (auto-grant via service role)
CREATE POLICY "user_curriculum_access_write" ON public.user_curriculum_access
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- USER CURRICULUM PROGRESS POLICIES

-- Read: Users see their own, admins see all
CREATE POLICY "user_curriculum_progress_read" ON public.user_curriculum_progress
FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Insert: Users create their own, admins create any
CREATE POLICY "user_curriculum_progress_insert" ON public.user_curriculum_progress
FOR INSERT WITH CHECK (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Update: Users update their own, admins update any
CREATE POLICY "user_curriculum_progress_update" ON public.user_curriculum_progress
FOR UPDATE USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Delete: Admin only
CREATE POLICY "user_curriculum_progress_delete" ON public.user_curriculum_progress
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.curriculum_modules TO authenticated;
GRANT SELECT ON public.user_curriculum_access TO authenticated;
GRANT ALL ON public.user_curriculum_progress TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.is_module_unlocked TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_unlocked_module TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_progress TO authenticated;
