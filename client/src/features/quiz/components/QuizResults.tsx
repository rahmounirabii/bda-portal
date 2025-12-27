import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  List,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import type { QuizResults as QuizResultsType } from '@/entities/quiz';
import {
  getScoreColor,
  getScoreEvaluation,
  getScoreEvaluationAr,
} from '@/shared/constants/quiz.constants';
import { ROUTES } from '@/shared/constants/routes';

/**
 * QuizResults Component
 *
 * Displays quiz completion results with detailed answer review
 */

export interface QuizResultsProps {
  /**
   * Quiz results data
   */
  results?: QuizResultsType;

  /**
   * Quiz ID (used if results not provided)
   */
  quizId?: string;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Callback when user wants to retake quiz
   */
  onRetakeQuiz?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const QuizResults = ({
  results: providedResults,
  quizId,
  isArabic = false,
  onRetakeQuiz,
  className,
}: QuizResultsProps) => {
  const navigate = useNavigate();
  const [results, setResults] = useState<QuizResultsType | null>(
    providedResults || null
  );
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );

  // Load results from sessionStorage if not provided
  useEffect(() => {
    if (!results && quizId) {
      const storedResults = sessionStorage.getItem('quiz_results');
      if (storedResults) {
        const parsedResults: QuizResultsType = JSON.parse(storedResults);
        if (parsedResults.quiz_id === quizId) {
          setResults(parsedResults);
          // Clear sessionStorage after loading
          sessionStorage.removeItem('quiz_results');
        }
      }
    }
  }, [results, quizId]);

  // Toggle question expansion
  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Expand all questions
  const expandAll = () => {
    if (!results) return;
    setExpandedQuestions(
      new Set(Array.from({ length: results.answers_detail.length }, (_, i) => i))
    );
  };

  // Collapse all questions
  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  // Handlers
  const handleRetakeQuiz = () => {
    if (onRetakeQuiz) {
      onRetakeQuiz();
    } else if (quizId) {
      navigate(ROUTES.QUIZ.PLAY.replace(':id', quizId));
    }
  };

  const handleBackToList = () => {
    navigate(ROUTES.QUIZ.LIST);
  };

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <p className="text-gray-600">
            {isArabic
              ? 'لم يتم العثور على نتائج'
              : 'No results found'}
          </p>
          <button
            onClick={handleBackToList}
            className="mt-4 text-blue-600 hover:text-blue-700 hover:underline"
          >
            {isArabic ? 'العودة إلى القائمة' : 'Back to quiz list'}
          </button>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor(results.score_percentage);
  const scoreEvaluation = isArabic
    ? getScoreEvaluationAr(results.score_percentage)
    : getScoreEvaluation(results.score_percentage);

  return (
    <div className={cn('min-h-screen bg-gray-50 py-8', className)}>
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Results Header */}
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          {/* Pass/Fail Badge */}
          <div className="mb-6 flex justify-center">
            <StatusBadge
              variant={results.passed ? 'success' : 'danger'}
              size="lg"
              icon={
                results.passed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )
              }
            >
              {results.passed
                ? isArabic
                  ? 'نجحت!'
                  : 'Passed!'
                : isArabic
                ? 'لم تنجح'
                : 'Not Passed'}
            </StatusBadge>
          </div>

          {/* Quiz Title */}
          <h1 className="text-center text-2xl font-bold text-gray-900 mb-2">
            {results.quiz_title}
          </h1>
          <p className="text-center text-gray-600">
            {isArabic ? 'نتائج الاختبار' : 'Quiz Results'}
          </p>

          {/* Score Display */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Percentage */}
            <div className="text-center">
              <div
                className={cn(
                  'mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 text-3xl font-bold',
                  scoreColor
                )}
              >
                {results.score_percentage}%
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">
                {scoreEvaluation}
              </p>
            </div>

            {/* Correct Answers */}
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">
                {results.correct_answers} {isArabic ? 'صحيح' : 'Correct'}
              </p>
            </div>

            {/* Incorrect Answers */}
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-red-200 bg-red-50">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">
                {results.incorrect_answers} {isArabic ? 'خطأ' : 'Incorrect'}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 border-t pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-400" />
              <span>
                {results.total_questions}{' '}
                {isArabic ? 'سؤال' : 'Questions'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {results.time_spent_minutes} {isArabic ? 'دقيقة' : 'minutes'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleRetakeQuiz}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              {isArabic ? 'إعادة الاختبار' : 'Retake Quiz'}
            </button>
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <List className="h-4 w-4" />
              {isArabic ? 'العودة للقائمة' : 'Back to List'}
            </button>
          </div>
        </div>

        {/* Answer Review Section */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'مراجعة الإجابات' : 'Answer Review'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {isArabic ? 'توسيع الكل' : 'Expand All'}
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {isArabic ? 'طي الكل' : 'Collapse All'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {results.answers_detail.map((detail, index) => {
              const isExpanded = expandedQuestions.has(index);

              return (
                <div
                  key={detail.question.id}
                  className={cn('rounded-lg border transition-all', {
                    'border-green-200 bg-green-50/50': detail.is_correct,
                    'border-red-200 bg-red-50/50': !detail.is_correct,
                  })}
                >
                  {/* Question Summary */}
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {detail.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">
                          {isArabic ? 'السؤال' : 'Question'} {index + 1}
                        </span>
                        <p className="text-gray-900 font-medium truncate">
                          {isArabic && detail.question.question_text_ar
                            ? detail.question.question_text_ar
                            : detail.question.question_text}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Question Detail (Expanded) */}
                  {isExpanded && (
                    <div className="border-t p-4 bg-white">
                      <QuestionCard
                        question={{ ...detail.question, answers: [] } as any}
                        selectedAnswerIds={detail.user_answer_ids}
                        onAnswerSelect={() => {}} // Read-only
                        questionNumber={index + 1}
                        totalQuestions={results.total_questions}
                        isReviewMode
                        correctAnswerIds={detail.correct_answer_ids}
                        disabled
                        isArabic={isArabic}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p>
            {isArabic
              ? '📝 ملاحظة: هذا اختبار تدريبي. لن يتم حفظ نتائجك.'
              : '📝 Note: This is a practice quiz. Your results are not saved.'}
          </p>
        </div>
      </div>
    </div>
  );
};

QuizResults.displayName = 'QuizResults';
