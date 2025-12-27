import { CheckCircle2, XCircle, Circle, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { QuestionWithAnswers, QuizAnswer } from '@/entities/quiz';
import { QUESTION_TYPE_LABELS } from '@/shared/constants/quiz.constants';

/**
 * QuestionCard Component
 *
 * Displays a quiz question with its answers
 * Supports different question types and selection modes
 */

export interface QuestionCardProps {
  /**
   * Question data with answers
   */
  question: QuestionWithAnswers;

  /**
   * Currently selected answer IDs
   */
  selectedAnswerIds: string[];

  /**
   * Callback when answer is selected/deselected
   */
  onAnswerSelect: (answerId: string) => void;

  /**
   * Question number (for display)
   */
  questionNumber: number;

  /**
   * Total number of questions
   */
  totalQuestions: number;

  /**
   * Review mode - shows correct/incorrect answers
   */
  isReviewMode?: boolean;

  /**
   * Correct answer IDs (for review mode)
   */
  correctAnswerIds?: string[];

  /**
   * Whether answers are disabled (after submission)
   */
  disabled?: boolean;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const QuestionCard = ({
  question,
  selectedAnswerIds,
  onAnswerSelect,
  questionNumber,
  totalQuestions,
  isReviewMode = false,
  correctAnswerIds = [],
  disabled = false,
  isArabic = false,
  className,
}: QuestionCardProps) => {
  const questionText =
    isArabic && question.question_text_ar
      ? question.question_text_ar
      : question.question_text;

  const isMultiSelect = question.question_type === 'multi_select';
  const isTrueFalse = question.question_type === 'true_false';

  // Sort answers by order_index
  const sortedAnswers = [...question.answers].sort(
    (a, b) => a.order_index - b.order_index
  );

  const handleAnswerClick = (answerId: string) => {
    if (disabled) return;
    onAnswerSelect(answerId);
  };

  const isAnswerSelected = (answerId: string) =>
    selectedAnswerIds.includes(answerId);

  const isAnswerCorrect = (answerId: string) => correctAnswerIds.includes(answerId);

  const getAnswerState = (
    answer: QuizAnswer
  ): 'selected' | 'correct' | 'incorrect' | 'default' => {
    if (!isReviewMode) {
      return isAnswerSelected(answer.id) ? 'selected' : 'default';
    }

    const selected = isAnswerSelected(answer.id);
    const correct = isAnswerCorrect(answer.id);

    if (selected && correct) return 'correct';
    if (selected && !correct) return 'incorrect';
    if (!selected && correct) return 'correct';
    return 'default';
  };

  const getAnswerIcon = (answer: QuizAnswer) => {
    const state = getAnswerState(answer);
    const selected = isAnswerSelected(answer.id);

    if (isReviewMode) {
      if (state === 'correct') {
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      }
      if (state === 'incorrect') {
        return <XCircle className="h-5 w-5 text-red-600" />;
      }
    }

    if (isMultiSelect) {
      return selected ? (
        <CheckSquare className="h-5 w-5 text-blue-600" />
      ) : (
        <Square className="h-5 w-5 text-gray-400" />
      );
    }

    return selected ? (
      <CheckCircle2 className="h-5 w-5 text-blue-600" />
    ) : (
      <Circle className="h-5 w-5 text-gray-400" />
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Question Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            {isArabic ? 'السؤال' : 'Question'} {questionNumber} {isArabic ? 'من' : 'of'}{' '}
            {totalQuestions}
          </span>
          <span className="text-xs text-gray-500">
            {QUESTION_TYPE_LABELS[question.question_type]}
            {isMultiSelect &&
              ` (${isArabic ? 'اختر جميع الإجابات الصحيحة' : 'Select all that apply'})`}
          </span>
        </div>

        <div className="rounded-lg bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
            {questionText}
          </h2>

          {question.bock_domain && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {isArabic ? 'المجال' : 'Domain'}: {question.bock_domain}
            </div>
          )}
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-3">
        {sortedAnswers.map((answer, index) => {
          const answerText =
            isArabic && answer.answer_text_ar
              ? answer.answer_text_ar
              : answer.answer_text;
          const state = getAnswerState(answer);
          const selected = isAnswerSelected(answer.id);

          return (
            <div key={answer.id} className="space-y-2">
              {/* Answer Option */}
              <button
                onClick={() => handleAnswerClick(answer.id)}
                disabled={disabled && !isReviewMode}
                className={cn(
                  'w-full text-left rounded-lg border-2 p-4 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'flex items-start gap-3 group',
                  {
                    // Default state
                    'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50':
                      state === 'default' && !disabled,
                    // Selected state (non-review)
                    'border-blue-500 bg-blue-50': state === 'selected' && !isReviewMode,
                    // Correct answer (review mode)
                    'border-green-500 bg-green-50': state === 'correct',
                    // Incorrect answer (review mode)
                    'border-red-500 bg-red-50': state === 'incorrect',
                    // Disabled
                    'cursor-not-allowed opacity-60': disabled && !isReviewMode,
                    'cursor-default': isReviewMode,
                  }
                )}
                type="button"
                aria-pressed={selected}
                aria-label={`Answer ${String.fromCharCode(65 + index)}: ${answerText}`}
              >
                {/* Icon */}
                <span className="shrink-0 mt-0.5">{getAnswerIcon(answer)}</span>

                {/* Answer Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full h-6 w-6 text-xs font-bold shrink-0',
                        {
                          'bg-gray-200 text-gray-700': state === 'default',
                          'bg-blue-200 text-blue-800':
                            state === 'selected' && !isReviewMode,
                          'bg-green-200 text-green-800': state === 'correct',
                          'bg-red-200 text-red-800': state === 'incorrect',
                        }
                      )}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span
                      className={cn('text-gray-900 font-medium', {
                        'text-green-900': state === 'correct',
                        'text-red-900': state === 'incorrect',
                      })}
                    >
                      {answerText}
                    </span>
                  </div>

                  {/* Explanation (Review Mode) */}
                  {isReviewMode && (answer.explanation || answer.explanation_ar) && (
                    <div
                      className={cn('mt-3 pt-3 border-t text-sm', {
                        'border-green-200': state === 'correct',
                        'border-red-200': state === 'incorrect',
                        'border-gray-200': state === 'default',
                      })}
                    >
                      <p className="font-medium text-gray-700 mb-1">
                        {isArabic ? 'التوضيح:' : 'Explanation:'}
                      </p>
                      <p className="text-gray-600">
                        {isArabic && answer.explanation_ar
                          ? answer.explanation_ar
                          : answer.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Points Display */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
        <span>
          {isArabic ? 'النقاط' : 'Points'}: {question.points || 1}
        </span>
        {isMultiSelect && !isReviewMode && (
          <span className="text-xs text-blue-600">
            {isArabic
              ? '* يمكن اختيار أكثر من إجابة'
              : '* Multiple answers may be correct'}
          </span>
        )}
      </div>
    </div>
  );
};

QuestionCard.displayName = 'QuestionCard';
