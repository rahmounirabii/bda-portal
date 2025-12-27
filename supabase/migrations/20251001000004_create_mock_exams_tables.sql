-- Migration: Création des tables pour le système Mock Exams
-- Date: 2025-10-01
-- Description: Tables pour examens blancs, questions, réponses, tentatives et historique

-- =============================================================================
-- TYPES ENUM
-- =============================================================================

CREATE TYPE exam_category AS ENUM ('cp', 'scp', 'general');
CREATE TYPE exam_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE exam_question_type AS ENUM ('single_choice', 'multiple_choice');

-- =============================================================================
-- TABLE: mock_exams
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mock_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informations de base
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT NOT NULL,
    description_ar TEXT,

    -- Catégorie et difficulté
    category exam_category NOT NULL,
    difficulty exam_difficulty NOT NULL DEFAULT 'medium',

    -- Configuration de l'examen
    duration_minutes INTEGER NOT NULL, -- Durée en minutes
    total_questions INTEGER NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 70, -- Score de passage en %

    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- =============================================================================
-- TABLE: mock_exam_questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mock_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relation avec l'examen
    exam_id UUID NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,

    -- Contenu de la question
    question_text TEXT NOT NULL,
    question_text_ar TEXT,
    explanation TEXT, -- Explication de la réponse
    explanation_ar TEXT,

    -- Type et configuration
    question_type exam_question_type NOT NULL DEFAULT 'single_choice',
    points INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: mock_exam_answers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mock_exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relation avec la question
    question_id UUID NOT NULL REFERENCES public.mock_exam_questions(id) ON DELETE CASCADE,

    -- Contenu de la réponse
    answer_text TEXT NOT NULL,
    answer_text_ar TEXT,

    -- Correction
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: mock_exam_attempts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mock_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    exam_id UUID NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Résultats
    score INTEGER NOT NULL, -- Score sur 100
    total_points_earned INTEGER NOT NULL,
    total_points_possible INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,

    -- Temps
    time_spent_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: mock_exam_attempt_answers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mock_exam_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    attempt_id UUID NOT NULL REFERENCES public.mock_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.mock_exam_questions(id) ON DELETE CASCADE,

    -- Réponse(s) de l'utilisateur
    selected_answer_ids UUID[] NOT NULL, -- Array pour supporter les questions à choix multiples

    -- Correction
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER NOT NULL,

    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index pour mock_exams
CREATE INDEX idx_mock_exams_category ON public.mock_exams(category);
CREATE INDEX idx_mock_exams_is_active ON public.mock_exams(is_active);

-- Index pour mock_exam_questions
CREATE INDEX idx_mock_exam_questions_exam_id ON public.mock_exam_questions(exam_id);
CREATE INDEX idx_mock_exam_questions_order ON public.mock_exam_questions(exam_id, order_index);

-- Index pour mock_exam_answers
CREATE INDEX idx_mock_exam_answers_question_id ON public.mock_exam_answers(question_id);

-- Index pour mock_exam_attempts
CREATE INDEX idx_mock_exam_attempts_user_id ON public.mock_exam_attempts(user_id);
CREATE INDEX idx_mock_exam_attempts_exam_id ON public.mock_exam_attempts(exam_id);
CREATE INDEX idx_mock_exam_attempts_created_at ON public.mock_exam_attempts(created_at DESC);

-- Index pour mock_exam_attempt_answers
CREATE INDEX idx_mock_exam_attempt_answers_attempt_id ON public.mock_exam_attempt_answers(attempt_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exam_attempt_answers ENABLE ROW LEVEL SECURITY;

-- ====================================
-- POLICIES: mock_exams
-- ====================================

-- SELECT: Tous les utilisateurs authentifiés peuvent voir les examens actifs
CREATE POLICY "Users can view active mock exams"
ON public.mock_exams FOR SELECT
TO authenticated
USING (is_active = true);

-- SELECT: Admins peuvent voir tous les examens
CREATE POLICY "Admins can view all mock exams"
ON public.mock_exams FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- INSERT, UPDATE, DELETE: Admins seulement
CREATE POLICY "Admins can manage mock exams"
ON public.mock_exams FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ====================================
-- POLICIES: mock_exam_questions
-- ====================================

-- SELECT: Utilisateurs peuvent voir les questions des examens actifs
CREATE POLICY "Users can view questions from active exams"
ON public.mock_exam_questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mock_exams
        WHERE id = mock_exam_questions.exam_id
        AND is_active = true
    )
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- INSERT, UPDATE, DELETE: Admins seulement
CREATE POLICY "Admins can manage questions"
ON public.mock_exam_questions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ====================================
-- POLICIES: mock_exam_answers
-- ====================================

-- SELECT: Utilisateurs peuvent voir les réponses des questions actives
CREATE POLICY "Users can view answers from active exams"
ON public.mock_exam_answers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mock_exam_questions q
        JOIN public.mock_exams e ON e.id = q.exam_id
        WHERE q.id = mock_exam_answers.question_id
        AND e.is_active = true
    )
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- INSERT, UPDATE, DELETE: Admins seulement
CREATE POLICY "Admins can manage answers"
ON public.mock_exam_answers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ====================================
-- POLICIES: mock_exam_attempts
-- ====================================

-- SELECT: Utilisateurs peuvent voir leurs propres tentatives
CREATE POLICY "Users can view their own attempts"
ON public.mock_exam_attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Admins peuvent voir toutes les tentatives
CREATE POLICY "Admins can view all attempts"
ON public.mock_exam_attempts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- INSERT: Utilisateurs peuvent créer leurs propres tentatives
CREATE POLICY "Users can create their own attempts"
ON public.mock_exam_attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE, DELETE: Seulement admins
CREATE POLICY "Admins can manage attempts"
ON public.mock_exam_attempts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ====================================
-- POLICIES: mock_exam_attempt_answers
-- ====================================

-- SELECT: Utilisateurs peuvent voir les réponses de leurs propres tentatives
CREATE POLICY "Users can view their own attempt answers"
ON public.mock_exam_attempt_answers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mock_exam_attempts
        WHERE id = mock_exam_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- INSERT: Utilisateurs peuvent créer des réponses pour leurs tentatives
CREATE POLICY "Users can create answers for their attempts"
ON public.mock_exam_attempt_answers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mock_exam_attempts
        WHERE id = mock_exam_attempt_answers.attempt_id
        AND user_id = auth.uid()
    )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger pour mettre à jour updated_at sur mock_exams
CREATE TRIGGER update_mock_exams_updated_at
    BEFORE UPDATE ON public.mock_exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur mock_exam_questions
CREATE TRIGGER update_mock_exam_questions_updated_at
    BEFORE UPDATE ON public.mock_exam_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
