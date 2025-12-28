/**
 * Types for Quiz System - Mock Exams
 *
 * Defines all TypeScript types and interfaces for the Quiz feature
 * Based on Supabase schema: quizzes, quiz_questions, quiz_answers, quiz_attempts
 */

// =============================================================================
// ENUMS
// =============================================================================

export type CertificationType = 'CP' | 'SCP';

export type ExamLanguage = 'en' | 'ar';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type QuestionType = 'multiple_choice' | 'true_false' | 'multi_select';

export type VoucherStatus = 'available' | 'assigned' | 'used' | 'expired' | 'cancelled';

// =============================================================================
// DATABASE TYPES (matching Supabase schema)
// =============================================================================

/**
 * Quiz from database
 */
export interface Quiz {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  certification_type: CertificationType;
  difficulty_level: DifficultyLevel;
  time_limit_minutes: number;
  passing_score_percentage: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Quiz Question from database
 */
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_text_ar: string | null;
  question_type: QuestionType;
  bock_domain: string | null;
  difficulty: DifficultyLevel;
  points: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Quiz Answer from database
 */
export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  answer_text_ar: string | null;
  is_correct: boolean;
  explanation: string | null;
  explanation_ar: string | null;
  order_index: number;
  created_at: string;
}

/**
 * Quiz Attempt from database
 */
export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_points_earned: number | null;
  total_points_possible: number | null;
  passed: boolean | null;
  time_spent_minutes: number | null;
}

/**
 * Quiz Attempt Answer from database
 */
export interface QuizAttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer_ids: string[];
  is_correct: boolean;
  points_earned: number;
  created_at: string;
}

/**
 * Certification Product from database
 * Links WooCommerce products to certifications
 */
export interface CertificationProduct {
  id: string;
  woocommerce_product_id: number;
  woocommerce_product_name: string;
  woocommerce_product_sku: string | null;
  certification_type: CertificationType;
  quiz_id: string | null;
  vouchers_per_purchase: number;
  voucher_validity_months: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Exam Voucher from database
 * Manages exam vouchers for certification attempts
 */
export interface ExamVoucher {
  id: string;
  code: string;
  user_id: string;
  certification_type: CertificationType;
  exam_language: ExamLanguage;
  quiz_id: string | null;
  woocommerce_order_id: number | null;
  certification_product_id: string | null;
  purchased_at: string | null;
  status: VoucherStatus;
  expires_at: string;
  used_at: string | null;
  attempt_id: string | null;
  admin_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// EXTENDED TYPES (with relations and computed data)
// =============================================================================

/**
 * Quiz with additional metadata
 */
export interface QuizWithStats extends Quiz {
  question_count?: number;
  total_points?: number;
  attempt_count?: number;
}

/**
 * Question with answers included
 */
export interface QuestionWithAnswers extends QuizQuestion {
  answers: QuizAnswer[];
}

/**
 * Quiz with full questions and answers
 */
export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithAnswers[];
}

/**
 * Certification Product with related quiz data
 */
export interface CertificationProductWithQuiz extends CertificationProduct {
  quiz?: Quiz;
}

/**
 * Exam Voucher with user information
 */
export interface ExamVoucherWithUser extends ExamVoucher {
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Exam Voucher with quiz information
 */
export interface ExamVoucherWithQuiz extends ExamVoucher {
  quiz?: Quiz;
}

/**
 * Complete Exam Voucher with all relations
 */
export interface ExamVoucherComplete extends ExamVoucher {
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  quiz?: Quiz;
  certification_product?: CertificationProduct;
  attempt?: QuizAttempt;
}

// =============================================================================
// DTO TYPES (for creating/updating)
// =============================================================================

/**
 * Data Transfer Object for creating a new quiz
 */
export interface CreateQuizDTO {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  certification_type: CertificationType;
  difficulty_level: DifficultyLevel;
  time_limit_minutes: number;
  passing_score_percentage: number;
  is_active?: boolean;
}

/**
 * Data Transfer Object for updating a quiz
 */
export interface UpdateQuizDTO {
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  difficulty_level?: DifficultyLevel;
  time_limit_minutes?: number;
  passing_score_percentage?: number;
  is_active?: boolean;
}

/**
 * Data Transfer Object for creating a question
 */
export interface CreateQuestionDTO {
  quiz_id: string;
  question_text: string;
  question_text_ar?: string;
  question_type: QuestionType;
  bock_domain?: string;
  difficulty: DifficultyLevel;
  points?: number;
  order_index: number;
  answers: CreateAnswerDTO[];
}

/**
 * Data Transfer Object for updating a question
 */
export interface UpdateQuestionDTO {
  question_text?: string;
  question_text_ar?: string;
  question_type?: QuestionType;
  bock_domain?: string;
  difficulty?: DifficultyLevel;
  points?: number;
  order_index?: number;
}

/**
 * Data Transfer Object for creating an answer
 */
export interface CreateAnswerDTO {
  answer_text: string;
  answer_text_ar?: string;
  is_correct: boolean;
  explanation?: string;
  explanation_ar?: string;
  order_index: number;
}

/**
 * Data Transfer Object for updating an answer
 */
export interface UpdateAnswerDTO {
  answer_text?: string;
  answer_text_ar?: string;
  is_correct?: boolean;
  explanation?: string;
  explanation_ar?: string;
  order_index?: number;
}

/**
 * Data Transfer Object for creating a certification product
 */
export interface CreateCertificationProductDTO {
  woocommerce_product_id: number;
  woocommerce_product_name: string;
  woocommerce_product_sku?: string;
  certification_type: CertificationType;
  quiz_id?: string;
  vouchers_per_purchase?: number;
  voucher_validity_months?: number;
  is_active?: boolean;
}

/**
 * Data Transfer Object for updating a certification product
 */
export interface UpdateCertificationProductDTO {
  woocommerce_product_name?: string;
  woocommerce_product_sku?: string;
  quiz_id?: string;
  vouchers_per_purchase?: number;
  voucher_validity_months?: number;
  is_active?: boolean;
}

/**
 * Data Transfer Object for creating an exam voucher
 */
export interface CreateExamVoucherDTO {
  user_id: string;
  certification_type: CertificationType;
  exam_language: ExamLanguage;
  quiz_id?: string;
  expires_at: string;
  woocommerce_order_id?: number;
  certification_product_id?: string;
  admin_notes?: string;
}

/**
 * Data Transfer Object for updating an exam voucher
 */
export interface UpdateExamVoucherDTO {
  status?: VoucherStatus;
  expires_at?: string;
  admin_notes?: string;
}

/**
 * Data Transfer Object for using a voucher
 */
export interface UseVoucherDTO {
  voucher_code: string;
  quiz_id: string;
  attempt_id: string;
}

// =============================================================================
// QUIZ PLAYER TYPES
// =============================================================================

/**
 * User's answer to a question
 */
export interface UserAnswer {
  question_id: string;
  selected_answer_ids: string[]; // Array for multi_select support
  is_correct?: boolean; // Calculated after submission
}

/**
 * Quiz session state
 */
export interface QuizSession {
  quiz: QuizWithQuestions;
  started_at: Date;
  time_remaining_seconds: number;
  current_question_index: number;
  user_answers: Map<string, UserAnswer>;
  is_completed: boolean;
}

/**
 * Quiz results after completion
 */
export interface QuizResults {
  quiz_id: string;
  quiz_title: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
  passed: boolean;
  time_spent_minutes: number;
  answers_detail: UserAnswerResult[];
}

/**
 * Detailed result for a single question
 */
export interface UserAnswerResult {
  question: QuizQuestion;
  user_answer_ids: string[];
  correct_answer_ids: string[];
  is_correct: boolean;
  explanation?: string;
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

/**
 * Filters for quiz list queries
 */
export interface QuizFilters {
  certification_type?: CertificationType;
  difficulty_level?: DifficultyLevel;
  is_active?: boolean;
  search?: string;
}

/**
 * Query options for pagination and sorting
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'title' | 'difficulty_level';
  sort_order?: 'asc' | 'desc';
}

/**
 * Filters for certification products list queries
 */
export interface CertificationProductFilters {
  certification_type?: CertificationType;
  is_active?: boolean;
  search?: string;
}

/**
 * Filters for exam vouchers list queries
 */
export interface ExamVoucherFilters {
  user_id?: string;
  certification_type?: CertificationType;
  exam_language?: ExamLanguage;
  status?: VoucherStatus;
  quiz_id?: string;
  search?: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Quiz-specific error types
 */
export interface QuizError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Quiz operation result wrapper
 */
export interface QuizResult<T> {
  data: T | null;
  error: QuizError | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default values for quiz configuration
 */
export const QUIZ_DEFAULTS = {
  TIME_LIMIT_MINUTES: 60,
  PASSING_SCORE_PERCENTAGE: 70,
  DEFAULT_POINTS: 1,
} as const;

/**
 * Quiz validation constraints
 */
export const QUIZ_CONSTRAINTS = {
  MIN_TIME_LIMIT: 1,
  MAX_TIME_LIMIT: 240,
  MIN_PASSING_SCORE: 0,
  MAX_PASSING_SCORE: 100,
  MIN_POINTS: 1,
} as const;
