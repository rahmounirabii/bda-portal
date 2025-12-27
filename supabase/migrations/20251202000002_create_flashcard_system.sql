-- ============================================================================
-- BDA Portal - Flashcard System
-- Migration: 20251202000002_create_flashcard_system.sql
-- Description: Creates tables for the Flashcard feature with spaced repetition
-- ============================================================================

-- ============================================================================
-- TABLE: curriculum_flashcard_decks
-- Purpose: Flashcard decks organized by competency/sub-unit
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_flashcard_decks (
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
  cover_image_url TEXT, -- optional deck cover image

  -- Metadata
  card_count INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 1,
  estimated_study_time_minutes INTEGER DEFAULT 10,

  -- Status
  is_published BOOLEAN DEFAULT FALSE,

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_certification ON curriculum_flashcard_decks(certification_type);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_competency ON curriculum_flashcard_decks(competency_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_sub_unit ON curriculum_flashcard_decks(sub_unit_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_published ON curriculum_flashcard_decks(is_published);

-- ============================================================================
-- TABLE: curriculum_flashcards
-- Purpose: Individual flashcards within a deck
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent deck
  deck_id UUID NOT NULL REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,

  -- Card content (front = question/concept, back = answer/definition)
  front_text TEXT NOT NULL,
  front_text_ar TEXT,
  back_text TEXT NOT NULL,
  back_text_ar TEXT,

  -- Optional hint (shown before flipping)
  hint TEXT,
  hint_ar TEXT,

  -- Optional image
  front_image_url TEXT,
  back_image_url TEXT,

  -- Metadata
  order_index INTEGER NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),

  -- Status
  is_published BOOLEAN DEFAULT TRUE,

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON curriculum_flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_published ON curriculum_flashcards(is_published);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON curriculum_flashcards USING GIN(tags);

-- ============================================================================
-- TABLE: user_flashcard_progress
-- Purpose: Track user progress for individual flashcards (SM-2 algorithm)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES curriculum_flashcards(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,

  -- SM-2 Algorithm fields
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'reviewing', 'mastered')),
  ease_factor DECIMAL(4,2) DEFAULT 2.5, -- SM-2 ease factor (starts at 2.5)
  interval_days INTEGER DEFAULT 0, -- days until next review
  repetition_count INTEGER DEFAULT 0, -- number of successful reviews
  next_review_date DATE, -- when this card is due for review

  -- User actions
  is_favorited BOOLEAN DEFAULT FALSE,

  -- Timestamps
  last_reviewed_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ, -- when user mastered this card

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, flashcard_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user ON user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_deck ON user_flashcard_progress(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_review ON user_flashcard_progress(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_status ON user_flashcard_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_favorited ON user_flashcard_progress(user_id, is_favorited) WHERE is_favorited = TRUE;

-- ============================================================================
-- TABLE: user_flashcard_deck_progress
-- Purpose: Aggregated progress per deck for dashboard display
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_flashcard_deck_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,

  -- Card counts by status
  cards_new INTEGER DEFAULT 0,
  cards_learning INTEGER DEFAULT 0,
  cards_reviewing INTEGER DEFAULT 0,
  cards_mastered INTEGER DEFAULT 0,

  -- Streak tracking
  study_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_studied_at TIMESTAMPTZ,

  -- Time tracking
  total_study_time_minutes INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, deck_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deck_progress_user ON user_flashcard_deck_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_progress_deck ON user_flashcard_deck_progress(deck_id);

-- ============================================================================
-- TABLE: user_flashcard_study_sessions
-- Purpose: Track individual study sessions for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_flashcard_study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,

  -- Session data
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  cards_incorrect INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON user_flashcard_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_deck ON user_flashcard_study_sessions(deck_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON user_flashcard_study_sessions(started_at);

-- ============================================================================
-- FUNCTION: Update flashcard count in deck
-- ============================================================================

CREATE OR REPLACE FUNCTION update_flashcard_deck_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE curriculum_flashcard_decks
    SET card_count = (
      SELECT COUNT(*) FROM curriculum_flashcards
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
      AND is_published = TRUE
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update flashcard count
DROP TRIGGER IF EXISTS trigger_update_flashcard_count ON curriculum_flashcards;
CREATE TRIGGER trigger_update_flashcard_count
AFTER INSERT OR DELETE OR UPDATE OF is_published ON curriculum_flashcards
FOR EACH ROW
EXECUTE FUNCTION update_flashcard_deck_count();

-- ============================================================================
-- FUNCTION: Update deck progress summary
-- ============================================================================

CREATE OR REPLACE FUNCTION update_flashcard_deck_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert or update deck progress
  INSERT INTO user_flashcard_deck_progress (user_id, deck_id)
  VALUES (NEW.user_id, NEW.deck_id)
  ON CONFLICT (user_id, deck_id) DO NOTHING;

  -- Update counts
  UPDATE user_flashcard_deck_progress
  SET
    cards_new = (SELECT COUNT(*) FROM user_flashcard_progress WHERE user_id = NEW.user_id AND deck_id = NEW.deck_id AND status = 'new'),
    cards_learning = (SELECT COUNT(*) FROM user_flashcard_progress WHERE user_id = NEW.user_id AND deck_id = NEW.deck_id AND status = 'learning'),
    cards_reviewing = (SELECT COUNT(*) FROM user_flashcard_progress WHERE user_id = NEW.user_id AND deck_id = NEW.deck_id AND status = 'reviewing'),
    cards_mastered = (SELECT COUNT(*) FROM user_flashcard_progress WHERE user_id = NEW.user_id AND deck_id = NEW.deck_id AND status = 'mastered'),
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND deck_id = NEW.deck_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update deck progress
DROP TRIGGER IF EXISTS trigger_update_deck_progress ON user_flashcard_progress;
CREATE TRIGGER trigger_update_deck_progress
AFTER INSERT OR UPDATE OF status ON user_flashcard_progress
FOR EACH ROW
EXECUTE FUNCTION update_flashcard_deck_progress();

-- ============================================================================
-- FUNCTION: Calculate SM-2 spaced repetition
-- Parameters:
--   p_quality: 0-5 rating (0-2 = again, 3 = hard, 4 = good, 5 = easy)
--   p_ease_factor: current ease factor
--   p_interval: current interval in days
--   p_repetition: number of successful reviews
-- Returns: JSON with new_ease_factor, new_interval, new_repetition
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_sm2(
  p_quality INTEGER,
  p_ease_factor DECIMAL,
  p_interval INTEGER,
  p_repetition INTEGER
) RETURNS JSONB AS $$
DECLARE
  new_ease_factor DECIMAL;
  new_interval INTEGER;
  new_repetition INTEGER;
BEGIN
  -- Calculate new ease factor
  new_ease_factor := p_ease_factor + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));

  -- Minimum ease factor is 1.3
  IF new_ease_factor < 1.3 THEN
    new_ease_factor := 1.3;
  END IF;

  -- If quality < 3, reset repetition and interval
  IF p_quality < 3 THEN
    new_repetition := 0;
    new_interval := 1;
  ELSE
    new_repetition := p_repetition + 1;

    -- Calculate new interval based on repetition count
    IF p_repetition = 0 THEN
      new_interval := 1;
    ELSIF p_repetition = 1 THEN
      new_interval := 6;
    ELSE
      new_interval := CEIL(p_interval * new_ease_factor)::INTEGER;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ease_factor', new_ease_factor,
    'interval', new_interval,
    'repetition', new_repetition
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Get cards due for review
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cards_due_for_review(p_user_id UUID, p_deck_id UUID DEFAULT NULL)
RETURNS TABLE (
  flashcard_id UUID,
  deck_id UUID,
  front_text TEXT,
  front_text_ar TEXT,
  back_text TEXT,
  back_text_ar TEXT,
  hint TEXT,
  hint_ar TEXT,
  status TEXT,
  ease_factor DECIMAL,
  interval_days INTEGER,
  repetition_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS flashcard_id,
    f.deck_id,
    f.front_text,
    f.front_text_ar,
    f.back_text,
    f.back_text_ar,
    f.hint,
    f.hint_ar,
    COALESCE(p.status, 'new') AS status,
    COALESCE(p.ease_factor, 2.5) AS ease_factor,
    COALESCE(p.interval_days, 0) AS interval_days,
    COALESCE(p.repetition_count, 0) AS repetition_count
  FROM curriculum_flashcards f
  LEFT JOIN user_flashcard_progress p ON f.id = p.flashcard_id AND p.user_id = p_user_id
  WHERE f.is_published = TRUE
    AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
    AND (
      p.id IS NULL -- new cards (no progress record)
      OR p.next_review_date IS NULL -- cards never reviewed
      OR p.next_review_date <= CURRENT_DATE -- cards due for review
    )
  ORDER BY
    CASE WHEN p.id IS NULL THEN 0 ELSE 1 END, -- new cards first
    p.next_review_date ASC NULLS FIRST
  LIMIT 50; -- limit to 50 cards per session
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE curriculum_flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_deck_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_study_sessions ENABLE ROW LEVEL SECURITY;

-- Flashcard Decks: Anyone can view published, admins can manage
CREATE POLICY "Anyone can view published flashcard decks"
  ON curriculum_flashcard_decks FOR SELECT
  USING (is_published = TRUE OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can insert flashcard decks"
  ON curriculum_flashcard_decks FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update flashcard decks"
  ON curriculum_flashcard_decks FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can delete flashcard decks"
  ON curriculum_flashcard_decks FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

-- Flashcards: Anyone can view from published decks, admins can manage
CREATE POLICY "Anyone can view flashcards from published decks"
  ON curriculum_flashcards FOR SELECT
  USING (
    deck_id IN (SELECT id FROM curriculum_flashcard_decks WHERE is_published = TRUE)
    OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can insert flashcards"
  ON curriculum_flashcards FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update flashcards"
  ON curriculum_flashcards FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can delete flashcards"
  ON curriculum_flashcards FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

-- User Flashcard Progress: Users see their own
CREATE POLICY "Users can view their own flashcard progress"
  ON user_flashcard_progress FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Users can insert their own flashcard progress"
  ON user_flashcard_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard progress"
  ON user_flashcard_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- User Deck Progress: Users see their own
CREATE POLICY "Users can view their own deck progress"
  ON user_flashcard_deck_progress FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Users can insert their own deck progress"
  ON user_flashcard_deck_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deck progress"
  ON user_flashcard_deck_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Study Sessions: Users see their own
CREATE POLICY "Users can view their own study sessions"
  ON user_flashcard_study_sessions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Users can insert their own study sessions"
  ON user_flashcard_study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON user_flashcard_study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE curriculum_flashcard_decks IS 'Flashcard decks organized by competency/sub-unit';
COMMENT ON TABLE curriculum_flashcards IS 'Individual flashcards within a deck';
COMMENT ON TABLE user_flashcard_progress IS 'User progress for individual flashcards using SM-2 algorithm';
COMMENT ON TABLE user_flashcard_deck_progress IS 'Aggregated deck progress for dashboard display';
COMMENT ON TABLE user_flashcard_study_sessions IS 'Individual study sessions for analytics';
COMMENT ON FUNCTION calculate_sm2 IS 'SM-2 spaced repetition algorithm for calculating next review interval';
COMMENT ON FUNCTION get_cards_due_for_review IS 'Get cards due for review for a user, optionally filtered by deck';
