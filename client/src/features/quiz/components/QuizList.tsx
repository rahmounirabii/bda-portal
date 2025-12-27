import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, BookOpen } from 'lucide-react';
import { useActiveQuizzes } from '@/entities/quiz';
import { QuizCard, QuizCardSkeleton } from './QuizCard';
import type { CertificationType, DifficultyLevel, QuizFilters } from '@/entities/quiz';
import {
  CERTIFICATION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  QUIZ_MESSAGES,
  QUIZ_MESSAGES_AR,
} from '@/shared/constants/quiz.constants';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';

/**
 * QuizList Component
 *
 * Displays a filterable, searchable list of available quizzes
 * Handles loading, error, and empty states
 */

export interface QuizListProps {
  /**
   * Whether to show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Compact grid mode (more cards per row)
   */
  compact?: boolean;
}

export const QuizList = ({
  isArabic = false,
  className,
  compact = false,
}: QuizListProps) => {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<QuizFilters>({
    certification_type: undefined,
    difficulty_level: undefined,
    search: undefined,
  });

  // Fetch quizzes with filters
  const { data: quizzes, isLoading, isError, error } = useActiveQuizzes(filters);

  // Local search filter (client-side for better UX)
  const [searchTerm, setSearchTerm] = useState('');

  // Filter quizzes by search term locally
  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];
    if (!searchTerm.trim()) return quizzes;

    const term = searchTerm.toLowerCase();
    return quizzes.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(term) ||
        quiz.title_ar?.toLowerCase().includes(term) ||
        quiz.description?.toLowerCase().includes(term) ||
        quiz.description_ar?.toLowerCase().includes(term)
    );
  }, [quizzes, searchTerm]);

  // Handle quiz start
  const handleStartQuiz = (quizId: string) => {
    navigate(ROUTES.QUIZ.DETAIL.replace(':id', quizId));
  };

  // Handle filter change
  const handleCertificationFilter = (type?: CertificationType) => {
    setFilters((prev) => ({
      ...prev,
      certification_type: prev.certification_type === type ? undefined : type,
    }));
  };

  const handleDifficultyFilter = (level?: DifficultyLevel) => {
    setFilters((prev) => ({
      ...prev,
      difficulty_level: prev.difficulty_level === level ? undefined : level,
    }));
  };

  // Messages
  const messages = isArabic ? QUIZ_MESSAGES_AR : QUIZ_MESSAGES;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isArabic
                ? 'ابحث عن الاختبارات...'
                : 'Search quizzes by title or description...'
            }
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 text-gray-900',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'transition-all placeholder:text-gray-400',
              {
                'pl-10 pr-4': !isArabic,
                'pr-10 pl-4': isArabic,
              }
            )}
            dir={isArabic ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            <span>{isArabic ? 'تصفية' : 'Filter'}:</span>
          </div>

          {/* Certification Type Filters */}
          <div className="flex flex-wrap gap-2">
            {(['CP', 'SCP'] as CertificationType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleCertificationFilter(type)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  'border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  {
                    'bg-blue-600 text-white border-blue-600':
                      filters.certification_type === type,
                    'bg-white text-gray-700 border-gray-300 hover:border-blue-500':
                      filters.certification_type !== type,
                  }
                )}
              >
                {CERTIFICATION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Difficulty Filters */}
          <div className="flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyFilter(level)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  'border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  {
                    'bg-blue-600 text-white border-blue-600':
                      filters.difficulty_level === level,
                    'bg-white text-gray-700 border-gray-300 hover:border-blue-500':
                      filters.difficulty_level !== level,
                  }
                )}
              >
                {DIFFICULTY_LABELS[level]}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {(filters.certification_type || filters.difficulty_level) && (
            <button
              onClick={() =>
                setFilters({
                  certification_type: undefined,
                  difficulty_level: undefined,
                  search: undefined,
                })
              }
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {isArabic ? 'مسح الفلاتر' : 'Clear filters'}
            </button>
          )}
        </div>

        {/* Results count */}
        {!isLoading && filteredQuizzes && (
          <p className="text-sm text-gray-600">
            {isArabic
              ? `${filteredQuizzes.length} اختبار${filteredQuizzes.length !== 1 ? 'ات' : ''}`
              : `${filteredQuizzes.length} quiz${filteredQuizzes.length !== 1 ? 'zes' : ''} found`}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className={cn('grid gap-6', {
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': !compact,
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': compact,
          })}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <QuizCardSkeleton key={i} compact={compact} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">
                {isArabic ? 'خطأ في تحميل الاختبارات' : 'Error loading quizzes'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error
                  ? error.message
                  : messages.ERROR.NETWORK_ERROR}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                {isArabic ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredQuizzes && filteredQuizzes.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filters.certification_type || filters.difficulty_level
              ? isArabic
                ? 'لم يتم العثور على اختبارات'
                : 'No quizzes found'
              : isArabic
              ? 'لا توجد اختبارات متاحة'
              : 'No quizzes available'}
          </h3>
          <p className="text-sm text-gray-600">
            {searchTerm || filters.certification_type || filters.difficulty_level
              ? isArabic
                ? 'حاول تعديل معايير البحث أو الفلتر'
                : 'Try adjusting your search or filter criteria'
              : messages.INFO.NO_QUIZZES_AVAILABLE}
          </p>
          {(searchTerm || filters.certification_type || filters.difficulty_level) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  certification_type: undefined,
                  difficulty_level: undefined,
                  search: undefined,
                });
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {isArabic ? 'مسح البحث والفلاتر' : 'Clear search and filters'}
            </button>
          )}
        </div>
      )}

      {/* Quiz Grid */}
      {!isLoading && !isError && filteredQuizzes && filteredQuizzes.length > 0 && (
        <div
          className={cn('grid gap-6', {
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': !compact,
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': compact,
          })}
        >
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStartQuiz={handleStartQuiz}
              isArabic={isArabic}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

QuizList.displayName = 'QuizList';
