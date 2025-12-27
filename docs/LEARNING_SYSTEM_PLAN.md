# BDA Learning System - Complete Implementation Plan

## Overview

The Learning System will have **3 main sections**, all following the same hierarchical structure based on the BDABoK 2025 framework:

```
Learning System
├── Training Kits (Main Curriculum) - TEXT + IMAGES
├── Question Bank - MCQs with feedback
└── Flashcards - Quick revision cards
```

Each section follows the same content hierarchy:
- **Block A**: Introduction
- **Block B**: Behavioral Competencies (7 competencies × 3-4 sub-units each)
- **Block C**: Knowledge-Based Competencies (7 competencies × 3-4 sub-units each)

---

## PHASE 1: Database Schema

### 1.1 Question Bank Tables

```sql
-- Question sets organized by competency/sub-unit
CREATE TABLE curriculum_question_sets (
  id UUID PRIMARY KEY,
  certification_type certification_type NOT NULL, -- CP, SCP
  section_type module_section_type NOT NULL, -- knowledge_based, behavioral, introduction
  competency_id UUID REFERENCES curriculum_modules(id), -- links to existing module
  sub_unit_id UUID REFERENCES curriculum_lessons(id), -- links to lesson (sub-unit)
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  question_count INTEGER DEFAULT 0,
  is_final_test BOOLEAN DEFAULT FALSE, -- true for competency final tests
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual practice questions
CREATE TABLE curriculum_practice_questions (
  id UUID PRIMARY KEY,
  question_set_id UUID REFERENCES curriculum_question_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_text_ar TEXT,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false
  options JSONB NOT NULL, -- [{id, text, text_ar}]
  correct_option_id TEXT NOT NULL,
  explanation TEXT, -- shown after answering
  explanation_ar TEXT,
  difficulty_level TEXT DEFAULT 'medium', -- easy, medium, hard
  order_index INTEGER NOT NULL,
  tags TEXT[], -- for filtering
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress in question bank
CREATE TABLE user_question_bank_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_set_id UUID REFERENCES curriculum_question_sets(id) ON DELETE CASCADE,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_score_percentage DECIMAL(5,2),
  best_score_percentage DECIMAL(5,2),
  attempts_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_set_id)
);

-- Track individual question attempts for review
CREATE TABLE user_question_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES curriculum_practice_questions(id) ON DELETE CASCADE,
  question_set_id UUID REFERENCES curriculum_question_sets(id) ON DELETE CASCADE,
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  is_marked_for_review BOOLEAN DEFAULT FALSE,
  is_favorited BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Flashcard Tables

```sql
-- Flashcard decks organized by competency/sub-unit
CREATE TABLE curriculum_flashcard_decks (
  id UUID PRIMARY KEY,
  certification_type certification_type NOT NULL,
  section_type module_section_type NOT NULL,
  competency_id UUID REFERENCES curriculum_modules(id),
  sub_unit_id UUID REFERENCES curriculum_lessons(id),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  card_count INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual flashcards
CREATE TABLE curriculum_flashcards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL, -- Question/concept
  front_text_ar TEXT,
  back_text TEXT NOT NULL, -- Answer/definition
  back_text_ar TEXT,
  hint TEXT, -- Optional hint
  hint_ar TEXT,
  tags TEXT[],
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User flashcard progress (spaced repetition)
CREATE TABLE user_flashcard_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES curriculum_flashcards(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'new', -- new, learning, reviewing, mastered
  ease_factor DECIMAL(4,2) DEFAULT 2.5, -- SM-2 algorithm
  interval_days INTEGER DEFAULT 0,
  repetition_count INTEGER DEFAULT 0,
  next_review_date DATE,
  is_favorited BOOLEAN DEFAULT FALSE,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- User deck progress summary
CREATE TABLE user_flashcard_deck_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES curriculum_flashcard_decks(id) ON DELETE CASCADE,
  cards_new INTEGER DEFAULT 0,
  cards_learning INTEGER DEFAULT 0,
  cards_reviewing INTEGER DEFAULT 0,
  cards_mastered INTEGER DEFAULT 0,
  study_streak_days INTEGER DEFAULT 0,
  last_studied_at TIMESTAMPTZ,
  total_study_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, deck_id)
);
```

---

## PHASE 2: URL Structure

### User Routes
```
/learning-system                                    → Main Dashboard (3 sections)
/learning-system/curriculum                         → Training Kits Dashboard
/learning-system/curriculum/module/:moduleId        → Module Viewer (existing)
/learning-system/curriculum/module/:moduleId/lesson/:lessonId → Lesson Viewer (existing)

/learning-system/questions                          → Question Bank Dashboard
/learning-system/questions/set/:setId               → Practice Questions
/learning-system/questions/set/:setId/review        → Review Answers
/learning-system/questions/favorites                → Favorited Questions

/learning-system/flashcards                         → Flashcards Dashboard
/learning-system/flashcards/deck/:deckId            → Study Deck
/learning-system/flashcards/deck/:deckId/review     → Review Due Cards
/learning-system/flashcards/favorites               → Favorited Cards
```

### Admin Routes
```
/admin/learning-system                              → Learning System Admin Dashboard
/admin/learning-system/curriculum                   → Module/Lesson Manager (existing)
/admin/learning-system/curriculum/lessons           → Lesson Manager (existing)

/admin/learning-system/questions                    → Question Bank Manager
/admin/learning-system/questions/sets               → Question Set Manager
/admin/learning-system/questions/sets/:setId        → Edit Question Set
/admin/learning-system/questions/import             → Bulk Import Questions

/admin/learning-system/flashcards                   → Flashcard Manager
/admin/learning-system/flashcards/decks             → Deck Manager
/admin/learning-system/flashcards/decks/:deckId     → Edit Deck
/admin/learning-system/flashcards/import            → Bulk Import Flashcards

/admin/learning-system/access                       → Access Management (existing)
/admin/learning-system/analytics                    → Learning Analytics Dashboard
```

---

## PHASE 3: UI Components

### 3.1 Main Learning System Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Learning System                                                 │
│  ─────────────────────────────────────────────────────────────── │
│  Access valid until: Dec 15, 2025 (365 days remaining)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 📚           │  │ ❓           │  │ 🃏           │           │
│  │ Training     │  │ Question     │  │ Flashcards   │           │
│  │ Kits         │  │ Bank         │  │              │           │
│  │              │  │              │  │              │           │
│  │ 14 Modules   │  │ 1,800+ Qs    │  │ 500+ Cards   │           │
│  │ 42 Lessons   │  │              │  │              │           │
│  │              │  │              │  │              │           │
│  │ ▓▓▓▓▓░░░░░   │  │ ▓▓░░░░░░░░   │  │ ▓░░░░░░░░░   │           │
│  │ 45% Complete │  │ 15% Complete │  │ 8% Mastered  │           │
│  │              │  │              │  │              │           │
│  │ [Continue]   │  │ [Practice]   │  │ [Study]      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  Recent Activity                                                 │
│  ─────────────────────────────────────────────────────────────── │
│  • Completed Lesson 2.1: Strategic Leadership Fundamentals      │
│  • Practiced 30 questions in Business Acumen                     │
│  • Reviewed 15 flashcards in Financial Models                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Question Bank Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Question Bank                                    [← Back]       │
│  ─────────────────────────────────────────────────────────────── │
│  Practice questions organized by competency                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Progress Overview                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ 1,847      │ │ 425        │ │ 78%        │ │ 12         │    │
│  │ Total Qs   │ │ Attempted  │ │ Avg Score  │ │ Favorited  │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                  │
│  [Filter: All ▼] [Difficulty: All ▼] [Search...]                │
│                                                                  │
│  BEHAVIORAL COMPETENCIES                                         │
│  ─────────────────────────────────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 1. Strategic Leadership                         [Practice]  │ │
│  │    ├── Sub-unit 1.1 (30 Qs) ▓▓▓▓▓░░░░░ 50%                 │ │
│  │    ├── Sub-unit 1.2 (30 Qs) ▓▓░░░░░░░░ 20%                 │ │
│  │    ├── Sub-unit 1.3 (30 Qs) ░░░░░░░░░░ 0%                  │ │
│  │    └── Final Test (40 Qs) 🔒 Locked                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 2. Effective Communication                      [Practice]  │ │
│  │    ├── Sub-unit 2.1 (30 Qs) ░░░░░░░░░░ 0%                  │ │
│  │    ...                                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  KNOWLEDGE-BASED COMPETENCIES                                    │
│  ─────────────────────────────────────────────────────────────── │
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Flashcards Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Flashcards                                       [← Back]       │
│  ─────────────────────────────────────────────────────────────── │
│  Quick revision with spaced repetition                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Today's Review                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🔥 15 cards due for review today                           │ │
│  │  Study streak: 7 days                                       │ │
│  │  [Start Review Session]                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Progress Overview                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ 523        │ │ 89         │ │ 156        │ │ 45         │    │
│  │ Total      │ │ Mastered   │ │ Learning   │ │ New        │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                  │
│  Decks by Competency                                             │
│  ─────────────────────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📚 Strategic Leadership (45 cards)              [Study]    │  │
│  │    ▓▓▓▓▓▓░░░░ 60% mastered                                 │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 📚 Effective Communication (38 cards)           [Study]    │  │
│  │    ▓▓▓░░░░░░░ 30% mastered                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHASE 4: Admin Features

### 4.1 Question Bank Admin

**Features:**
- Create/Edit/Delete Question Sets
- Create/Edit/Delete Individual Questions
- Bulk import from CSV/Excel
- Reorder questions via drag-and-drop
- Preview questions as user would see
- Publish/Unpublish sets
- View analytics (most missed questions, avg scores)
- Duplicate question sets
- Export questions

**Question Editor Fields:**
- Question text (EN/AR)
- Question type (MCQ, True/False)
- Options (4 options with EN/AR)
- Correct answer
- Explanation (EN/AR)
- Difficulty level
- Tags
- Published status

### 4.2 Flashcard Admin

**Features:**
- Create/Edit/Delete Decks
- Create/Edit/Delete Cards
- Bulk import from CSV/Excel
- Reorder cards via drag-and-drop
- Preview cards with flip animation
- Publish/Unpublish decks
- View analytics (most difficult cards)
- Duplicate decks
- Export cards

**Card Editor Fields:**
- Front text (EN/AR) - the question/concept
- Back text (EN/AR) - the answer/definition
- Hint (optional, EN/AR)
- Tags
- Published status

### 4.3 Analytics Dashboard

**Metrics to track:**
- User engagement per section
- Question difficulty analysis
- Most common wrong answers
- Flashcard mastery rates
- Time spent per section
- Completion rates
- User progress over time

---

## PHASE 5: Implementation Order

### Week 1: Database & Core Structure
1. ✅ Create database migrations
2. ✅ Create TypeScript types
3. ✅ Create service layer (CRUD operations)
4. ✅ Create React Query hooks

### Week 2: User UI - Learning System Dashboard
1. ✅ New Learning System main dashboard with 3 sections
2. ✅ Update existing curriculum routes
3. ✅ Access control integration

### Week 3: Question Bank - User Side
1. ✅ Question Bank dashboard
2. ✅ Question set browser
3. ✅ Practice mode UI
4. ✅ Immediate feedback system
5. ✅ Review & favorites

### Week 4: Flashcards - User Side
1. ✅ Flashcard dashboard
2. ✅ Deck browser
3. ✅ Study mode with flip animation
4. ✅ Spaced repetition logic
5. ✅ Favorites & review

### Week 5: Admin UI
1. ✅ Question Bank admin (CRUD, import, analytics)
2. ✅ Flashcard admin (CRUD, import, analytics)
3. ✅ Learning analytics dashboard

### Week 6: Polish & Testing
1. ✅ Bilingual support (EN/AR)
2. ✅ Mobile responsiveness
3. ✅ Performance optimization
4. ✅ Testing & bug fixes

---

## Access Logic (Critical)

Users see content based on purchased product:
| Product Purchased | Curriculum | Question Bank | Flashcards |
|-------------------|------------|---------------|------------|
| Curriculum – EN   | EN Only    | EN Only       | EN Only    |
| Curriculum – AR   | AR Only    | AR Only       | AR Only    |
| Both EN + AR      | Both       | Both          | Both       |

Access is controlled via `user_curriculum_access` table with `certification_type` field.

---

## File Structure

```
client/src/features/learning-system/
├── index.ts
├── components/
│   ├── LearningSystemDashboard.tsx
│   ├── SectionCard.tsx
│   ├── ProgressOverview.tsx
│   └── RecentActivity.tsx
├── pages/
│   ├── LearningSystemHome.tsx
│   └── index.ts
└── hooks/
    └── useLearningSystemStats.ts

client/src/features/question-bank/
├── index.ts
├── components/
│   ├── QuestionBankDashboard.tsx
│   ├── QuestionSetList.tsx
│   ├── QuestionCard.tsx
│   ├── PracticeMode.tsx
│   ├── QuestionFeedback.tsx
│   ├── ReviewAnswers.tsx
│   └── FavoriteQuestions.tsx
├── pages/
│   ├── QuestionBankHome.tsx
│   ├── PracticeQuestions.tsx
│   └── ReviewPage.tsx
├── admin/
│   ├── QuestionSetManager.tsx
│   ├── QuestionEditor.tsx
│   ├── QuestionImport.tsx
│   └── QuestionAnalytics.tsx
└── hooks/
    ├── useQuestionSets.ts
    ├── useQuestions.ts
    └── useQuestionProgress.ts

client/src/features/flashcards/
├── index.ts
├── components/
│   ├── FlashcardDashboard.tsx
│   ├── DeckList.tsx
│   ├── FlashcardCard.tsx
│   ├── StudyMode.tsx
│   ├── FlipCard.tsx
│   └── SpacedRepetition.tsx
├── pages/
│   ├── FlashcardHome.tsx
│   ├── StudyDeck.tsx
│   └── ReviewCards.tsx
├── admin/
│   ├── DeckManager.tsx
│   ├── FlashcardEditor.tsx
│   ├── FlashcardImport.tsx
│   └── FlashcardAnalytics.tsx
├── hooks/
│   ├── useDecks.ts
│   ├── useFlashcards.ts
│   └── useFlashcardProgress.ts
└── utils/
    └── sm2Algorithm.ts

client/src/entities/question-bank/
├── index.ts
├── question-bank.types.ts
├── question-bank.service.ts
└── question-bank.hooks.ts

client/src/entities/flashcards/
├── index.ts
├── flashcard.types.ts
├── flashcard.service.ts
└── flashcard.hooks.ts
```

---

## Next Steps

1. **Create database migrations** for all new tables
2. **Update navigation** to include new Learning System structure
3. **Build Learning System dashboard** with 3 section cards
4. **Implement Question Bank** (user + admin)
5. **Implement Flashcards** (user + admin)
6. **Add analytics dashboard**

Ready to start implementation!
