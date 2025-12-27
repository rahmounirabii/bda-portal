/**
 * Curriculum Entity - Centralized exports
 *
 * Architecture: Learning system for BDA BoCK competencies
 * - 7 Knowledge-Based competencies
 * - 7 Behavioral competencies
 * - Sequential unlocking with quiz gates
 * - 1-year access from WooCommerce purchase
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Database types
  CurriculumModule,
  CurriculumModuleInsert,
  CurriculumModuleUpdate,
  UserCurriculumAccess,
  UserCurriculumAccessInsert,
  UserCurriculumAccessUpdate,
  UserCurriculumProgress,
  UserCurriculumProgressInsert,
  UserCurriculumProgressUpdate,

  // Enums
  SectionType,
  ModuleStatus,
  CertificationType,

  // Content types
  ContentNode,
  RichContent,

  // Business logic types
  CurriculumModuleWithStatus,
  BoCKCompetency,
  CurriculumDashboard,
  ModuleDetail,
  QuizCompletionResult,
  AccessCheckResult,

  // DTO types
  CreateModuleDTO,
  UpdateProgressDTO,
  GrantAccessDTO,

  // Filter types
  ModuleFilters,
  ProgressFilters,

  // Service response types
  ServiceResponse,
  PaginatedResponse,
} from './curriculum.types';

// Lesson types
export type {
  Lesson,
  LessonRow,
  LessonInsert,
  LessonUpdate,
  CreateLessonDTO,
  UpdateLessonDTO,
  LessonFilters,
  LessonSummary,
} from './lesson.types';

// Lesson Progress types
export type {
  LessonProgress,
  LessonProgressRow,
  LessonProgressInsert,
  LessonProgressUpdate,
  CreateLessonProgressDTO,
  UpdateLessonProgressDTO,
  LessonProgressFilters,
  LessonProgressSummary,
  LessonProgressStatus,
} from './lesson-progress.types';

// =============================================================================
// SERVICES
// =============================================================================

export { CurriculumService } from './curriculum.service';
export { CurriculumAccessService } from './curriculum-access.service';
export { CurriculumProgressService } from './curriculum-progress.service';
export { LessonService } from './lesson.service';
export { LessonProgressService } from './lesson-progress.service';

// Language-based access (NEW)
export { LearningSystemAccessService } from './curriculum-access-language.service';
export type {
  Language,
  LearningSystemAccess,
  UserAccessSummary,
} from './curriculum-access-language.service';

// =============================================================================
// HOOKS
// =============================================================================

export {
  // Query keys
  curriculumKeys,

  // Access hooks
  useCurriculumAccess,

  // Module hooks
  useModulesWithProgress,
  useModuleDetail,
  useNextModule,

  // Progress hooks
  useModuleProgress,
  useOverallProgress,

  // Dashboard (combined)
  useCurriculumDashboard,

  // Mutation hooks
  useUpdateProgress,
  useMarkReadyForQuiz,
  useHandleQuizCompletion,
  useIncrementTimeSpent,

  // Admin hooks
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
} from './curriculum.hooks';

// Lesson hooks
export {
  // Query keys
  lessonKeys,

  // Query hooks
  useLessons,
  useLesson,
  useLessonsByModule,
  useLessonSummary,
  useCheckOrderIndex,

  // Mutation hooks
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useTogglePublished,
} from './lesson.hooks';

// Lesson Progress hooks
export {
  // Query keys
  lessonProgressKeys,

  // Query hooks
  useLessonProgress,
  useLessonProgressById,
  useLessonProgressSummary,
  useIsLessonUnlocked,
  useLockedLessons,
  useInProgressLessons,
  useCompletedLessons,

  // Mutation hooks
  useCreateLessonProgress,
  useUpdateLessonProgress,
  useInitializeLessonProgress,
  useStartLesson,
  useCompleteContent,
  useCompleteQuiz,
  useResetProgress,
} from './lesson-progress.hooks';

// Language-based access hooks (NEW)
export {
  useLanguageAccess,
  useUserAccesses,
  useAvailableLanguages,
  useQuestionBankAccess,
  useFlashcardsAccess,
  useGrantAccess,
  useRevokeAccess,
  useAdminAccessList,
} from './curriculum-access-language.hooks';
