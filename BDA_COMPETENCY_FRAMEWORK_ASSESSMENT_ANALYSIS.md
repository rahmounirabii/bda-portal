# 🎓 BDA Competency Framework Assessment Architecture - Analysis & Implementation Plan

## 📋 Executive Summary

This document analyzes the current BDA Portal assessment system against the requirements for the **BDA Competency Framework (BDA BoCK™)** and provides a detailed implementation plan.

**Status**: ⚠️ **Partial Match** - Current system supports some requirements but needs significant extensions.

---

## 🎯 Client Requirements (From Ticket)

### Framework Structure
The BDA BoCK™ framework consists of:
- **7 Behavioral Competencies** (with 3 sub-pillars each = 21 lessons)
- **7 Technical (Knowledge-Based) Competencies** (with 3 sub-pillars each = 21 lessons)
- **Total**: 14 main competencies, 42 sub-competencies (lessons)

### Assessment Requirements

#### 1. Pre-Assessment
- **Timing**: Before starting any competencies
- **Coverage**: Both Behavioral & Technical areas
- **Questions**: 120 total
- **Purpose**: Diagnostic baseline

#### 2. Post-Assessment
- **Timing**: After completing all competencies
- **Coverage**: Same as pre-assessment
- **Questions**: 120 total
- **Purpose**: Final evaluation & progress measurement

#### 3. Main Competency Assessments
- **Count**: 14 assessments (one per main competency)
- **Timing**: After completing each of the 14 main competencies
- **Purpose**: Validate competency mastery

#### 4. Sub-Competency (Lesson-Level) Assessments
- **Count**: 42 assessments (one per sub-pillar/lesson)
- **Timing**: After each individual lesson
- **Purpose**: Immediate knowledge check

### Admin Requirements
- Add, edit, and manage questions across all levels
- Question banks organized by:
  - Lesson level (sub-competency)
  - Main competency level
  - Overall framework level (pre/post)
- Backend admin panel access

---

## 🔍 Current System Analysis

### ✅ What EXISTS (Database Layer)

#### 1. **Quiz System** (`quizzes` table)
```sql
Features:
✓ Quiz creation and management
✓ Bilingual support (EN/AR)
✓ Certification type (CP/SCP)
✓ Difficulty levels (easy/medium/hard)
✓ Time limits & passing scores
✓ Active/inactive status
✓ Question management via quiz_questions
```

**Fields**:
- `id`, `title`, `title_ar`, `description`, `description_ar`
- `certification_type` (CP/SCP)
- `difficulty_level`, `time_limit_minutes`, `passing_score_percentage`
- `is_active`, `created_by`, `created_at`, `updated_at`

#### 2. **Questions System** (`quiz_questions` table)
```sql
Features:
✓ Multiple question types (multiple_choice, true_false, multi_select)
✓ Bilingual questions
✓ BoCK domain field (TEXT) - for competency tagging
✓ Difficulty levels
✓ Point values
✓ Question ordering
```

**Fields**:
- `id`, `quiz_id` (FK to quizzes)
- `question_text`, `question_text_ar`
- `question_type`
- `bock_domain` ← **KEY FIELD for competency mapping**
- `difficulty`, `points`, `order_index`

#### 3. **Answers System** (`quiz_answers` table)
```sql
Features:
✓ Multiple answers per question
✓ Correct/incorrect marking
✓ Explanations (bilingual)
✓ Answer ordering
```

**Fields**:
- `id`, `question_id` (FK to quiz_questions)
- `answer_text`, `answer_text_ar`
- `is_correct`
- `explanation`, `explanation_ar`
- `order_index`

#### 4. **Curriculum System** (`curriculum_modules` table)
```sql
Features:
✓ 14-module structure (7 knowledge + 7 behavioral)
✓ Section types (knowledge_based, behavioral)
✓ Order indexing (1-14)
✓ Quiz integration via quiz_id FK
✓ Sequential unlocking (prerequisite logic)
✓ Published/draft status
```

**Structure**:
- Supports exactly 14 main competencies ✅
- Each module can link to ONE quiz (`quiz_id`)
- Prerequisite chain for sequential unlock
- BoCK structure: `section_type`, `competency_name`, `order_index`

**⚠️ LIMITATION**:
- Modules are the "main competencies"
- No **sub-module** or **lesson** table for the 3 sub-pillars per competency
- Each module links to only ONE quiz (not flexible for multiple assessments)

#### 5. **Progress Tracking** (`user_curriculum_progress`)
```sql
Features:
✓ Tracks module completion
✓ Quiz scores and attempts
✓ Sequential unlocking logic
```

### ✅ What EXISTS (Admin UI Layer)

#### 1. **Quiz Manager** (`/admin/quiz-manager` or similar)
Location: `/client/src/features/quiz/admin/QuizManager.tsx`

**Features**:
- ✅ View all quizzes
- ✅ Create new quizzes
- ✅ Edit existing quizzes
- ✅ Delete quizzes
- ✅ Toggle active/inactive
- ✅ Filter by certification type, difficulty
- ✅ Search quizzes

#### 2. **Quiz Editor**
Location: `/client/src/features/quiz/admin/QuizEditor.tsx`

**Features**:
- ✅ Edit quiz metadata (title, description, settings)
- ✅ Add/edit/remove questions
- ✅ Add/edit/remove answers
- ✅ Set correct answers
- ✅ Reorder questions
- ✅ Bilingual content editing

#### 3. **Curriculum Module Manager**
Location: `/client/src/features/curriculum/admin/pages/CurriculumModuleManager.tsx`

**Features**:
- ✅ Manage 14 main competencies
- ✅ Edit module content (rich text JSONB)
- ✅ Link quiz to module (`quiz_id`)
- ✅ Publish/unpublish modules
- ✅ Set prerequisites
- ✅ Filter by section (knowledge/behavioral)

---

## ❌ What's MISSING (Gaps Analysis)

### 1. **Sub-Competency (Lesson) Structure** 🔴
**Current State**: No database table or system for lessons/sub-pillars

**Required**:
- 3 sub-competencies per main competency = 42 lessons total
- Each lesson needs:
  - Content (text, videos, resources)
  - Quiz/assessment link
  - Progress tracking
  - Sequential unlocking within the competency

**Gap**: Need to create:
```sql
curriculum_lessons (or curriculum_sub_modules)
- id
- module_id (FK to curriculum_modules)
- title, title_ar
- content, content_ar (JSONB)
- order_index (1, 2, 3)
- quiz_id (FK to quizzes)
- is_published
```

### 2. **Pre/Post Assessment System** 🔴
**Current State**: Quizzes can be created but no special "framework-level" distinction

**Required**:
- Pre-assessment (120 questions, diagnostic)
- Post-assessment (120 questions, final evaluation)
- Questions should cover ALL 14 competencies
- Questions should be reusable across multiple quizzes

**Gap**: Need:
- Quiz categorization (`quiz_category` field: 'lesson', 'competency', 'pre_assessment', 'post_assessment')
- Question bank system (questions not tied to ONE quiz)
- Question tagging by competency

### 3. **Question Bank System** 🔴
**Current State**: Questions belong to a specific quiz only (`quiz_id` FK)

**Required**:
- Centralized question repository
- Questions tagged by:
  - Competency (main)
  - Sub-competency (lesson)
  - Type (behavioral vs technical)
  - Difficulty
- Ability to reuse questions across multiple quizzes

**Gap**: Need:
```sql
Option 1: Separate question_bank table
Option 2: Many-to-many relationship (quiz_question_links)
```

### 4. **Competency Taxonomy/Tagging** 🟡
**Current State**: `bock_domain` field exists but is TEXT (no validation)

**Required**:
- Structured competency taxonomy
- Clear mapping of questions to:
  - Behavioral vs Technical
  - Which of the 14 main competencies
  - Which of the 42 sub-competencies

**Gap**: Need:
- Enum or reference table for competencies
- Better field naming (`competency_id` instead of `bock_domain`)

### 5. **Multi-Level Assessment Navigation** 🔴
**Current State**: Quiz UI shows questions for one quiz

**Required**:
- Admin can assign questions to:
  - Lesson quiz (sub-competency)
  - Competency quiz (main competency)
  - Pre/Post assessment (framework level)

**Gap**: Need admin UI improvements:
- Question assignment wizard
- Bulk question import
- Question bank browser

---

## 📊 Feature Comparison Matrix

| Feature | Required | Current Status | Gap Size |
|---------|----------|----------------|----------|
| **14 Main Competencies** | ✓ | ✅ EXISTS (curriculum_modules) | None |
| **42 Sub-Competencies (Lessons)** | ✓ | ❌ MISSING | 🔴 LARGE |
| **Lesson-Level Quizzes (42)** | ✓ | ⚠️ PARTIAL (can create, no structure) | 🟡 MEDIUM |
| **Competency-Level Quizzes (14)** | ✓ | ⚠️ PARTIAL (exists via module.quiz_id) | 🟢 SMALL |
| **Pre-Assessment** | ✓ | ⚠️ PARTIAL (can create quiz, no tagging) | 🟡 MEDIUM |
| **Post-Assessment** | ✓ | ⚠️ PARTIAL (can create quiz, no tagging) | 🟡 MEDIUM |
| **Question Bank** | ✓ | ❌ MISSING | 🔴 LARGE |
| **Question Reusability** | ✓ | ❌ MISSING | 🔴 LARGE |
| **Competency Tagging** | ✓ | ⚠️ PARTIAL (bock_domain exists) | 🟡 MEDIUM |
| **Admin Question Management** | ✓ | ✅ EXISTS (QuizEditor) | None |
| **Bulk Question Import** | ✓ | ❌ MISSING | 🟡 MEDIUM |
| **Multi-Level Question Assignment** | ✓ | ❌ MISSING | 🔴 LARGE |

---

## 🎯 Recommended Implementation Plan

### Phase 1: Database Schema Extensions (Priority: HIGH)

#### Step 1.1: Create Lessons Table
```sql
CREATE TABLE public.curriculum_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relation to main competency
    module_id UUID NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,

    -- Content
    title TEXT NOT NULL,
    title_ar TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    content_ar JSONB DEFAULT '{}',
    description TEXT,
    description_ar TEXT,

    -- Order (1, 2, 3)
    order_index INTEGER NOT NULL CHECK (order_index BETWEEN 1 AND 3),

    -- Quiz link
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    quiz_required BOOLEAN NOT NULL DEFAULT true,
    quiz_passing_score INTEGER NOT NULL DEFAULT 70,

    -- Publishing
    is_published BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_module_lesson_order UNIQUE (module_id, order_index)
);

-- Indexes
CREATE INDEX idx_curriculum_lessons_module ON public.curriculum_lessons(module_id);
CREATE INDEX idx_curriculum_lessons_quiz ON public.curriculum_lessons(quiz_id);
CREATE INDEX idx_curriculum_lessons_order ON public.curriculum_lessons(module_id, order_index);
```

#### Step 1.2: Add Quiz Category/Type
```sql
-- Add quiz category enum
CREATE TYPE quiz_category AS ENUM (
    'lesson',           -- Sub-competency quiz
    'competency',       -- Main competency quiz
    'pre_assessment',   -- Pre-diagnostic
    'post_assessment'   -- Final assessment
);

-- Add category field to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN category quiz_category NOT NULL DEFAULT 'lesson';

-- Add competency/lesson reference
ALTER TABLE public.quizzes
ADD COLUMN module_id UUID REFERENCES public.curriculum_modules(id) ON DELETE SET NULL,
ADD COLUMN lesson_id UUID REFERENCES public.curriculum_lessons(id) ON DELETE SET NULL;

-- Add check constraint
ALTER TABLE public.quizzes
ADD CONSTRAINT quiz_category_reference_check CHECK (
    (category = 'lesson' AND lesson_id IS NOT NULL) OR
    (category = 'competency' AND module_id IS NOT NULL) OR
    (category IN ('pre_assessment', 'post_assessment'))
);
```

#### Step 1.3: Create Question Bank (Option A: Soft Approach)
```sql
-- Add competency taxonomy fields to quiz_questions
ALTER TABLE public.quiz_questions
ADD COLUMN competency_section TEXT CHECK (competency_section IN ('knowledge_based', 'behavioral')),
ADD COLUMN competency_name TEXT,  -- Which of the 14 competencies
ADD COLUMN sub_competency TEXT,   -- Which of the 3 sub-pillars
ADD COLUMN is_shared BOOLEAN DEFAULT false;  -- Can be used in multiple quizzes

-- Create index for question bank queries
CREATE INDEX idx_quiz_questions_competency ON public.quiz_questions(competency_section, competency_name);
CREATE INDEX idx_quiz_questions_shared ON public.quiz_questions(is_shared);
```

**OR Option B: Full Question Bank System**
```sql
-- Separate question bank table
CREATE TABLE public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_text_ar TEXT,
    question_type question_type NOT NULL,

    -- Competency taxonomy
    competency_section TEXT NOT NULL CHECK (competency_section IN ('knowledge_based', 'behavioral')),
    competency_name TEXT NOT NULL,
    sub_competency TEXT,

    -- Metadata
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    points INTEGER NOT NULL DEFAULT 1,
    bock_domain TEXT,

    -- Tags for advanced filtering
    tags TEXT[] DEFAULT '{}',

    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link questions to quizzes (many-to-many)
CREATE TABLE public.quiz_question_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT unique_quiz_question_link UNIQUE (quiz_id, question_id)
);

-- Answers still reference question_bank
ALTER TABLE public.quiz_answers
DROP CONSTRAINT quiz_answers_question_id_fkey,
ADD CONSTRAINT quiz_answers_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES public.question_bank(id) ON DELETE CASCADE;
```

---

### Phase 2: Admin UI Extensions (Priority: HIGH)

#### Step 2.1: Lesson Manager Component
**Location**: `/client/src/features/curriculum/admin/pages/LessonManager.tsx`

**Features**:
- View all 42 lessons grouped by module
- Create/edit/delete lessons
- Link quizzes to lessons
- Publish/unpublish lessons
- Rich text editor for lesson content

#### Step 2.2: Question Bank Manager
**Location**: `/client/src/features/quiz/admin/QuestionBankManager.tsx`

**Features**:
- Browse all questions
- Filter by:
  - Competency (14 main)
  - Sub-competency (42 lessons)
  - Section (behavioral/technical)
  - Difficulty
  - Shared/quiz-specific
- Create/edit/delete questions
- Tag questions with competencies
- Bulk import questions (CSV/JSON)

#### Step 2.3: Enhanced Quiz Editor
**Update**: `/client/src/features/quiz/admin/QuizEditor.tsx`

**New Features**:
- Select quiz category (lesson/competency/pre/post)
- Link to specific module or lesson
- "Add from Question Bank" button
  - Opens question browser modal
  - Filter questions by competency
  - Select questions to add to quiz
- Reorder questions (drag & drop)
- Preview quiz

#### Step 2.4: Assessment Wizard
**Location**: `/client/src/features/curriculum/admin/pages/AssessmentWizard.tsx`

**Purpose**: Guide admin through creating the complete assessment structure

**Flow**:
1. **Pre-Assessment Setup**
   - Select 120 questions from question bank
   - Ensure coverage across all 14 competencies
   - Set as "pre_assessment" category

2. **Competency Quiz Setup** (14 quizzes)
   - For each module, create competency quiz
   - Select questions from question bank
   - Auto-tag with competency

3. **Lesson Quiz Setup** (42 quizzes)
   - For each lesson, create quiz
   - Select questions from question bank
   - Auto-tag with sub-competency

4. **Post-Assessment Setup**
   - Similar to pre-assessment
   - Optionally reuse same questions

---

### Phase 3: User-Facing Features (Priority: MEDIUM)

#### Step 3.1: Pre-Assessment Flow
- User starts curriculum
- Redirected to pre-assessment first
- Must complete before accessing lessons
- Results stored for comparison

#### Step 3.2: Lesson Progress Tracking
```sql
-- Add lesson progress table
CREATE TABLE public.user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'quiz_pending', 'completed')),
    progress_percentage INTEGER DEFAULT 0,
    best_quiz_score INTEGER,
    quiz_attempts_count INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_lesson_progress UNIQUE (user_id, lesson_id)
);
```

#### Step 3.3: Post-Assessment Unlock
- Unlocks only after all 14 competencies completed
- Shows comparison with pre-assessment
- Generates competency radar chart

---

## 🚀 Implementation Roadmap

### Week 1: Foundation
- [x] Analyze current system
- [ ] Design database schema changes
- [ ] Write migration files
- [ ] Update TypeScript types
- [ ] Update service layer

### Week 2: Database & Backend
- [ ] Execute migrations (test environment)
- [ ] Create lesson CRUD services
- [ ] Create question bank services
- [ ] Update quiz services for new categories
- [ ] Add competency tagging logic

### Week 3: Admin UI - Core
- [ ] Lesson Manager component
- [ ] Update Curriculum Module Manager (add lessons tab)
- [ ] Question Bank Manager (basic version)
- [ ] Update Quiz Editor (add category selection)

### Week 4: Admin UI - Advanced
- [ ] Question Bank browser modal
- [ ] Bulk question import (CSV)
- [ ] Assessment Wizard (guided setup)
- [ ] Question tagging UI

### Week 5: User-Facing
- [ ] Pre-assessment flow
- [ ] Lesson progress tracking UI
- [ ] Post-assessment unlock logic
- [ ] Progress comparison charts

### Week 6: Testing & Refinement
- [ ] End-to-end testing
- [ ] Admin training
- [ ] Question bank migration
- [ ] Production deployment

---

## 📝 Immediate Next Steps (For Client)

### 1. **Access Existing System** ✅
You already have admin access. Here's what you can do NOW:

**Quiz Management**:
- Navigate to: `/admin/quiz-manager` (or check admin menu)
- Create quizzes for the 14 competencies
- Add questions manually

**Curriculum Management**:
- Navigate to: `/admin/curriculum`
- View the 14 main competencies
- Link quizzes to modules

### 2. **Temporary Workaround** (While we build Phase 1-3)

#### Workflow:
1. **Create 14 Competency Quizzes**:
   - Use Quiz Manager
   - Name them: "Competency 1: [Name]", "Competency 2: [Name]", etc.
   - Set `certification_type` = CP or SCP
   - Set `difficulty_level` appropriately

2. **Create 42 Lesson Quizzes**:
   - Name them: "Competency 1 - Lesson 1", "Competency 1 - Lesson 2", etc.
   - Use `description` field to note which sub-competency it covers

3. **Create Pre/Post Assessments**:
   - Name them: "BDA BoCK Pre-Assessment" and "BDA BoCK Post-Assessment"
   - Create 120 questions each
   - Use `bock_domain` field in each question to tag competency

4. **Tag Questions**:
   - When creating questions, use the `bock_domain` field
   - Format: "Behavioral - Competency Name" or "Technical - Competency Name"

### 3. **Question Import Template** (CSV)
We can create a CSV template for bulk import:
```csv
question_text,question_type,competency_section,competency_name,sub_competency,difficulty,answer_1,answer_2,answer_3,answer_4,correct_answer,explanation
"What is...?",multiple_choice,behavioral,Leadership,Communication,easy,"Answer A","Answer B","Answer C","Answer D",1,"Explanation here"
```

---

## 🎯 Recommendations

### Option A: **Quick Start (Use Existing System with Workarounds)**
- **Timeline**: Immediate
- **Pros**: Can start adding questions today
- **Cons**: Manual tagging, no question bank, less organized

### Option B: **Full Implementation (Phases 1-3)**
- **Timeline**: 6 weeks
- **Pros**: Proper structure, scalable, professional
- **Cons**: Requires development time

### Option C: **Hybrid Approach** ⭐ RECOMMENDED
- **Week 1-2**: Use existing system with workarounds (start adding questions)
- **Week 3-6**: Implement Phase 1-2 (database + admin UI)
- **Migration**: Automatically migrate existing quizzes to new structure

---

## 📊 Cost-Benefit Analysis

| Approach | Time | Quality | Scalability | Admin Effort |
|----------|------|---------|-------------|--------------|
| **Workaround** | 0 weeks | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ (High) |
| **Full Build** | 6 weeks | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ (Low) |
| **Hybrid** ⭐ | 2-6 weeks | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ (Medium) |

---

## 🎬 Conclusion

**Summary**:
- ✅ Your portal HAS a quiz system (quizzes, questions, answers)
- ✅ You HAVE an admin interface to manage quizzes
- ⚠️ You're MISSING the 3-level structure (lesson/competency/framework)
- ⚠️ You're MISSING a proper question bank system
- ⚠️ You're MISSING competency-based question organization

**My Recommendation**: **Hybrid Approach**
1. I'll give you access to existing Quiz Manager TODAY
2. You can start creating quizzes and questions with manual tagging
3. We build the proper 3-tier system over 4-6 weeks
4. We migrate your questions automatically once ready

**Immediate Action**:
- I'll provide you with:
  - Admin panel walkthrough document
  - CSV template for question import
  - Naming conventions for temporary workaround
  - Access credentials verification

Would you like me to:
1. ✅ Create the admin walkthrough guide?
2. ✅ Create the CSV import template?
3. ✅ Start Phase 1 development (database schema)?
4. ✅ All of the above?
