-- ============================================================================
-- BDA Portal - Question Bank System
-- Migration: 20251202000001_create_question_bank_system.sql
-- Description: Creates tables for the Question Bank feature
-- ============================================================================

-- ============================================================================
-- TABLE: curriculum_question_sets
-- Purpose: Question sets organized by competency/sub-unit
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content organization
  certification_type certification_type NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('introduction', 'knowledge', 'behavioral')),
  competency_id UUID REFERENCES curriculum_modules(id) ON DELETE SET NULL,
  sub_unit_id UUID REFERENCES curriculum_lessons(id) ON DELETE SET NULL,

  -- Content
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,

  -- Metadata
  question_count INTEGER DEFAULT 0,
  is_final_test BOOLEAN DEFAULT FALSE, -- true for competency final tests (40 questions)
  order_index INTEGER NOT NULL DEFAULT 1,
  time_limit_minutes INTEGER, -- optional time limit for the set
  passing_score INTEGER DEFAULT 70, -- percentage required to pass

  -- Status
  is_published BOOLEAN DEFAULT FALSE,

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_sets_certification ON curriculum_question_sets(certification_type);
CREATE INDEX IF NOT EXISTS idx_question_sets_competency ON curriculum_question_sets(competency_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_sub_unit ON curriculum_question_sets(sub_unit_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_published ON curriculum_question_sets(is_published);

-- ============================================================================
-- TABLE: curriculum_practice_questions
-- Purpose: Individual practice questions within a set
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent set
  question_set_id UUID NOT NULL REFERENCES curriculum_question_sets(id) ON DELETE CASCADE,

  -- Question content
  question_text TEXT NOT NULL,
  question_text_ar TEXT,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),

  -- Options as JSONB array: [{id: "a", text: "Option A", text_ar: "الخيار أ"}]
  options JSONB NOT NULL DEFAULT '[]',
  correct_option_id TEXT NOT NULL,

  -- Feedback
  explanation TEXT, -- shown after answering
  explanation_ar TEXT,

  -- Metadata
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  order_index INTEGER NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 1, -- points for correct answer

  -- Status
  is_published BOOLEAN DEFAULT TRUE,

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_questions_set ON curriculum_practice_questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_difficulty ON curriculum_practice_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_practice_questions_published ON curriculum_practice_questions(is_published);
CREATE INDEX IF NOT EXISTS idx_practice_questions_tags ON curriculum_practice_questions USING GIN(tags);

-- ============================================================================
-- TABLE: user_question_bank_progress
-- Purpose: Track user progress through question sets
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_question_bank_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_set_id UUID NOT NULL REFERENCES curriculum_question_sets(id) ON DELETE CASCADE,

  -- Progress tracking
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_score_percentage DECIMAL(5,2),
  best_score_percentage DECIMAL(5,2),
  attempts_count INTEGER DEFAULT 0,

  -- Timestamps
  last_attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ, -- set when user completes the set

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, question_set_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_progress_user ON user_question_bank_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_question_progress_set ON user_question_bank_progress(question_set_id);

-- ============================================================================
-- TABLE: user_question_attempts
-- Purpose: Track individual question attempts for review and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES curriculum_practice_questions(id) ON DELETE CASCADE,
  question_set_id UUID NOT NULL REFERENCES curriculum_question_sets(id) ON DELETE CASCADE,

  -- Attempt data
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,

  -- User actions
  is_marked_for_review BOOLEAN DEFAULT FALSE,
  is_favorited BOOLEAN DEFAULT FALSE,

  -- Timestamp
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON user_question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_set ON user_question_attempts(question_set_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_favorited ON user_question_attempts(user_id, is_favorited) WHERE is_favorited = TRUE;

-- ============================================================================
-- FUNCTION: Update question count in question set
-- ============================================================================

CREATE OR REPLACE FUNCTION update_question_set_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE curriculum_question_sets
    SET question_count = (
      SELECT COUNT(*) FROM curriculum_practice_questions
      WHERE question_set_id = COALESCE(NEW.question_set_id, OLD.question_set_id)
      AND is_published = TRUE
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.question_set_id, OLD.question_set_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update question count
DROP TRIGGER IF EXISTS trigger_update_question_count ON curriculum_practice_questions;
CREATE TRIGGER trigger_update_question_count
AFTER INSERT OR DELETE OR UPDATE OF is_published ON curriculum_practice_questions
FOR EACH ROW
EXECUTE FUNCTION update_question_set_count();

-- ============================================================================
-- FUNCTION: Update user question bank progress
-- ============================================================================

CREATE OR REPLACE FUNCTION update_question_bank_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert progress record
  INSERT INTO user_question_bank_progress (
    user_id,
    question_set_id,
    questions_attempted,
    questions_correct,
    last_attempted_at
  )
  VALUES (
    NEW.user_id,
    NEW.question_set_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, question_set_id)
  DO UPDATE SET
    questions_attempted = user_question_bank_progress.questions_attempted + 1,
    questions_correct = user_question_bank_progress.questions_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    last_attempted_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update progress
DROP TRIGGER IF EXISTS trigger_update_question_progress ON user_question_attempts;
CREATE TRIGGER trigger_update_question_progress
AFTER INSERT ON user_question_attempts
FOR EACH ROW
EXECUTE FUNCTION update_question_bank_progress();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE curriculum_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_bank_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;

-- Question Sets: Anyone can view published sets, admins can manage all
CREATE POLICY "Anyone can view published question sets"
  ON curriculum_question_sets FOR SELECT
  USING (is_published = TRUE OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can insert question sets"
  ON curriculum_question_sets FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update question sets"
  ON curriculum_question_sets FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can delete question sets"
  ON curriculum_question_sets FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

-- Practice Questions: Anyone can view from published sets, admins can manage
CREATE POLICY "Anyone can view questions from published sets"
  ON curriculum_practice_questions FOR SELECT
  USING (
    question_set_id IN (SELECT id FROM curriculum_question_sets WHERE is_published = TRUE)
    OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can insert questions"
  ON curriculum_practice_questions FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update questions"
  ON curriculum_practice_questions FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can delete questions"
  ON curriculum_practice_questions FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

-- User Progress: Users can only see their own progress
CREATE POLICY "Users can view their own question progress"
  ON user_question_bank_progress FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Users can insert their own question progress"
  ON user_question_bank_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question progress"
  ON user_question_bank_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- User Attempts: Users can only see their own attempts
CREATE POLICY "Users can view their own question attempts"
  ON user_question_attempts FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Users can insert their own question attempts"
  ON user_question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question attempts"
  ON user_question_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE curriculum_question_sets IS 'Question sets organized by competency/sub-unit for practice';
COMMENT ON TABLE curriculum_practice_questions IS 'Individual practice questions within a question set';
COMMENT ON TABLE user_question_bank_progress IS 'User progress tracking for question sets';
COMMENT ON TABLE user_question_attempts IS 'Individual question attempt records for analytics and review';
