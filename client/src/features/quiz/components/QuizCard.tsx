import { Clock, FileQuestion, Award, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import type { QuizWithStats } from '@/entities/quiz';
import {
  CERTIFICATION_TYPE_LABELS,
  CERTIFICATION_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
} from '@/shared/constants/quiz.constants';

/**
 * QuizCard Component
 *
 * Displays a quiz preview card with key information and CTA
 * Used in quiz lists and browsing interfaces
 */

export interface QuizCardProps {
  /**
   * Quiz data to display
   */
  quiz: QuizWithStats;

  /**
   * Callback when user clicks to start quiz
   */
  onStartQuiz?: (quizId: string) => void;

  /**
   * Whether the card is in a loading state
   */
  isLoading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Compact mode (smaller card)
   */
  compact?: boolean;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;
}

export const QuizCard = ({
  quiz,
  onStartQuiz,
  isLoading = false,
  className,
  compact = false,
  isArabic = false,
}: QuizCardProps) => {
  const title = isArabic && quiz.title_ar ? quiz.title_ar : quiz.title;
  const description =
    isArabic && quiz.description_ar ? quiz.description_ar : quiz.description;

  const handleClick = () => {
    if (!isLoading && onStartQuiz) {
      onStartQuiz(quiz.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-lg',
        {
          'border-gray-200 hover:border-blue-300': !isLoading,
          'border-gray-100 opacity-60': isLoading,
          'p-6': !compact,
          'p-4': compact,
        },
        className
      )}
      data-testid="quiz-card"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className={cn('font-semibold text-gray-900 line-clamp-2', {
              'text-lg': !compact,
              'text-base': compact,
            })}
            title={title}
          >
            {title}
          </h3>

          {description && (
            <p
              className={cn('text-gray-600 line-clamp-2', {
                'mt-2 text-sm': !compact,
                'mt-1 text-xs': compact,
              })}
              title={description}
            >
              {description}
            </p>
          )}
        </div>

        {/* Certification Badge */}
        <StatusBadge
          variant={quiz.certification_type}
          size={compact ? 'sm' : 'md'}
          icon={<Award className="h-3 w-3" />}
          className="shrink-0"
        >
          {quiz.certification_type}
        </StatusBadge>
      </div>

      {/* Metadata Row */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        {/* Difficulty */}
        <StatusBadge
          variant={quiz.difficulty_level}
          size={compact ? 'sm' : 'md'}
          className="shrink-0"
        >
          <span className="mr-1">
            {DIFFICULTY_ICONS[quiz.difficulty_level]}
          </span>
          {DIFFICULTY_LABELS[quiz.difficulty_level]}
        </StatusBadge>

        {/* Questions Count */}
        <div className="flex items-center gap-1.5">
          <FileQuestion className="h-4 w-4 text-gray-400" />
          <span>
            {quiz.question_count || 0}{' '}
            {isArabic ? 'سؤال' : compact ? 'Qs' : 'Questions'}
          </span>
        </div>

        {/* Time Limit */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>
            {quiz.time_limit_minutes} {isArabic ? 'دقيقة' : 'min'}
          </span>
        </div>

        {/* Passing Score */}
        {!compact && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>
              {isArabic ? 'درجة النجاح' : 'Pass'}:{' '}
              {quiz.passing_score_percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'w-full rounded-lg font-medium transition-all',
          'flex items-center justify-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          {
            'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800':
              !isLoading,
            'bg-gray-100 text-gray-400 cursor-not-allowed': isLoading,
            'py-3 text-sm': !compact,
            'py-2 text-xs': compact,
          }
        )}
        aria-label={`Start ${title}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {isArabic ? 'جاري التحميل...' : 'Loading...'}
          </span>
        ) : (
          <>
            <span>{isArabic ? 'ابدأ الاختبار' : 'Start Quiz'}</span>
            <ArrowRight
              className={cn('transition-transform group-hover:translate-x-1', {
                'h-4 w-4': !compact,
                'h-3 w-3': compact,
              })}
            />
          </>
        )}
      </button>

      {/* Inactive Overlay (if quiz is not active) */}
      {!quiz.is_active && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
            {isArabic ? 'غير متاح حالياً' : 'Not Available'}
          </div>
        </div>
      )}

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-500/20 transition-colors pointer-events-none" />
    </div>
  );
};

QuizCard.displayName = 'QuizCard';

/**
 * QuizCardSkeleton - Loading skeleton for QuizCard
 */
export const QuizCardSkeleton = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white animate-pulse',
        {
          'p-6': !compact,
          'p-4': compact,
        }
      )}
      data-testid="quiz-card-skeleton"
    >
      {/* Header skeleton */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full shrink-0" />
      </div>

      {/* Metadata skeleton */}
      <div className="mb-4 flex gap-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-6 w-20 bg-gray-200 rounded" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg w-full" />
    </div>
  );
};

QuizCardSkeleton.displayName = 'QuizCardSkeleton';
