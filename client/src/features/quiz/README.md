# Quiz Feature

Mock Exams feature for practice quizzes and self-assessment.

## Structure

```
quiz/
├── components/          # User-facing components
│   ├── QuizList.tsx         # List of available quizzes
│   ├── QuizCard.tsx         # Individual quiz card display
│   ├── QuizPlayer.tsx       # Quiz taking interface
│   ├── QuestionCard.tsx     # Individual question display
│   ├── QuizResults.tsx      # Results after quiz completion
│   └── QuizTimer.tsx        # Timer component for quiz
│
├── admin/               # Admin components for quiz management
│   ├── QuizManager.tsx      # Quiz list and management dashboard
│   ├── QuizEditor.tsx       # Create/edit quiz form
│   ├── QuestionEditor.tsx   # Create/edit questions
│   └── QuestionBank.tsx     # Question library management
│
└── index.ts             # Barrel export
```

## Components Overview

### User Components

#### QuizList
- Displays all active quizzes
- Filtering by certification type, difficulty
- Search functionality
- Pagination

#### QuizCard
- Quiz preview card
- Shows: title, description, question count, time limit
- CTA button to start quiz

#### QuizPlayer
- Full quiz taking interface
- Question navigation
- Answer selection
- Timer display
- Submit quiz functionality

#### QuestionCard
- Displays a single question
- Shows answers based on question type
- Handles user selection

#### QuizResults
- Shows quiz completion results
- Score breakdown
- Correct/incorrect answers
- Detailed explanation for each question

#### QuizTimer
- Countdown timer
- Visual warnings when time running out
- Auto-submit when time expires

### Admin Components

#### QuizManager
- List all quizzes (active/inactive)
- CRUD operations
- Quick actions (activate/deactivate, duplicate)

#### QuizEditor
- Create/edit quiz form
- Set quiz properties:
  - Title (EN/AR)
  - Description (EN/AR)
  - Certification type
  - Difficulty
  - Time limit
  - Passing score

#### QuestionEditor
- Create/edit questions
- Add multiple answers
- Mark correct answers
- Add explanations
- Reorder questions

#### QuestionBank
- Library of all questions
- Filter by quiz, difficulty, BoCK domain
- Bulk operations
- Question reuse across quizzes

## Dependencies

- Entity layer: `/entities/quiz`
- Shared UI: `/shared/ui`
- Constants: `/shared/constants/quiz.constants.ts`
- Routes: `/shared/constants/routes.ts`

## State Management

Uses React Query hooks from `/entities/quiz/quiz.hooks.ts`:
- `useActiveQuizzes()` - Fetch quizzes
- `useQuiz(id)` - Fetch single quiz
- `useStartQuizAttempt()` - Start quiz
- `useCompleteQuizAttempt()` - Complete quiz
- Admin hooks for CRUD operations

## Routes

- `/mock-exams` - Quiz list
- `/mock-exams/:id` - Quiz detail
- `/mock-exams/:id/play` - Take quiz
- `/mock-exams/:id/results` - Quiz results
- `/admin/quizzes` - Admin quiz list
- `/admin/quizzes/new` - Create quiz
- `/admin/quizzes/:id/edit` - Edit quiz
- `/admin/quizzes/:id/questions` - Manage questions
