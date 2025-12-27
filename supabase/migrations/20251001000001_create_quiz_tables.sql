-- Migration: Création des tables pour le système de Quiz (Mock Exams)
-- Date: 2025-10-01
-- Description: Tables pour quiz, questions, réponses et tentatives

-- =============================================================================
-- TYPES ENUM
-- =============================================================================

CREATE TYPE certification_type AS ENUM ('CP', 'SCP');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'multi_select');

-- =============================================================================
-- TABLE: quizzes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informations générales
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,

    -- Configuration
    certification_type certification_type NOT NULL,
    difficulty_level difficulty_level NOT NULL DEFAULT 'medium',
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    passing_score_percentage INTEGER NOT NULL DEFAULT 70,

    -- État
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_time_limit CHECK (time_limit_minutes > 0 AND time_limit_minutes <= 240),
    CONSTRAINT valid_passing_score CHECK (passing_score_percentage >= 0 AND passing_score_percentage <= 100)
);

-- Index
CREATE INDEX idx_quizzes_certification ON public.quizzes(certification_type);
CREATE INDEX idx_quizzes_active ON public.quizzes(is_active);
CREATE INDEX idx_quizzes_created_at ON public.quizzes(created_at);

-- =============================================================================
-- TABLE: quiz_questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,

    -- Contenu
    question_text TEXT NOT NULL,
    question_text_ar TEXT,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',

    -- Métadonnées
    bock_domain TEXT, -- Domaine BoCK™
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    points INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_points CHECK (points > 0)
);

-- Index
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(quiz_id, order_index);

-- =============================================================================
-- TABLE: quiz_answers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,

    -- Contenu
    answer_text TEXT NOT NULL,
    answer_text_ar TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,

    -- Feedback
    explanation TEXT,
    explanation_ar TEXT,

    -- Ordre d'affichage
    order_index INTEGER NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_quiz_answers_question ON public.quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_order ON public.quiz_answers(question_id, order_index);

-- =============================================================================
-- TABLE: quiz_attempts (Analytics optionnel - pas de scoring)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Note: Pas de score enregistré - juste pour analytics anonymes

    -- Contraintes
    CONSTRAINT valid_completion CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Index
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON public.quiz_attempts(completed_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger pour updated_at sur quizzes
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur quiz_questions
CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON public.quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activer RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies: quizzes
CREATE POLICY "Users can view active quizzes" ON public.quizzes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND is_active = true
    );

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies: quiz_questions
CREATE POLICY "Users can view questions of active quizzes" ON public.quiz_questions
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE id = quiz_questions.quiz_id
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage questions" ON public.quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies: quiz_answers
-- Note: is_correct est visible seulement après soumission (géré côté client)
CREATE POLICY "Users can view answers of active quizzes" ON public.quiz_answers
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.quiz_questions q
            JOIN public.quizzes qz ON q.quiz_id = qz.id
            WHERE q.id = quiz_answers.question_id
            AND qz.is_active = true
        )
    );

CREATE POLICY "Admins can manage answers" ON public.quiz_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies: quiz_attempts
CREATE POLICY "Users can view their own attempts" ON public.quiz_attempts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE id = quiz_attempts.quiz_id
            AND is_active = true
        )
    );

CREATE POLICY "Users can update their own attempts" ON public.quiz_attempts
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all attempts" ON public.quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================================================
-- FONCTIONS HELPER
-- =============================================================================

-- Fonction pour obtenir le nombre de questions d'un quiz
CREATE OR REPLACE FUNCTION get_quiz_question_count(quiz_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.quiz_questions
        WHERE quiz_id = quiz_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut accéder à un quiz
CREATE OR REPLACE FUNCTION can_access_quiz(quiz_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.quizzes
        WHERE id = quiz_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DONNÉES DE TEST (Optionnel - à retirer en production)
-- =============================================================================

-- Commentez cette section en production
/*
-- Quiz de test
INSERT INTO public.quizzes (title, title_ar, description, certification_type, difficulty_level, time_limit_minutes)
VALUES (
    'CP™ Mock Exam - Sample',
    'امتحان تجريبي CP™',
    'Practice exam for Certified Professional certification',
    'CP',
    'medium',
    90
);
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Quiz tables created successfully!' as status;
