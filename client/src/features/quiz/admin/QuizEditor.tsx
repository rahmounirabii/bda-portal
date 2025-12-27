import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  useQuiz,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  type CreateQuizDTO,
  type UpdateQuizDTO,
  type CertificationType,
  type DifficultyLevel,
  QUIZ_CONSTRAINTS,
  QUIZ_DEFAULTS,
} from '@/entities/quiz';
import { cn } from '@/shared/utils/cn';
import {
  CERTIFICATION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  QUIZ_MESSAGES,
  QUIZ_MESSAGES_AR,
} from '@/shared/constants/quiz.constants';
import { ROUTES } from '@/shared/constants/routes';

/**
 * QuizEditor Component
 *
 * Form for creating and editing quizzes
 */

interface FormData {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  certification_type: CertificationType;
  difficulty_level: DifficultyLevel;
  time_limit_minutes: number;
  passing_score_percentage: number;
  is_active: boolean;
}

export interface QuizEditorProps {
  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const TEXT_LIMITS = {
  MIN_TITLE: 3,
  MAX_TITLE: 200,
  MAX_DESCRIPTION: 1000,
} as const;

export const QuizEditor = ({ isArabic = false, className }: QuizEditorProps) => {
  const navigate = useNavigate();
  const { id: quizId } = useParams<{ id: string }>();

  const isEditMode = Boolean(quizId && quizId !== 'new');

  // Fetch quiz data in edit mode
  const { data: quiz, isLoading: isLoadingQuiz, isError: isErrorQuiz } = useQuiz(
    quizId || '',
    isEditMode
  );

  // Mutations
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const messages = isArabic ? QUIZ_MESSAGES_AR : QUIZ_MESSAGES;

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      certification_type: 'CP',
      difficulty_level: 'medium',
      time_limit_minutes: QUIZ_DEFAULTS.TIME_LIMIT_MINUTES,
      passing_score_percentage: QUIZ_DEFAULTS.PASSING_SCORE_PERCENTAGE,
      is_active: true,
    },
  });

  // Watch fields for character counters
  const title = watch('title') || '';
  const title_ar = watch('title_ar') || '';
  const description = watch('description') || '';
  const description_ar = watch('description_ar') || '';
  const certType = watch('certification_type');
  const difficulty = watch('difficulty_level');

  // Populate form in edit mode
  useEffect(() => {
    if (isEditMode && quiz) {
      reset({
        title: quiz.title,
        title_ar: quiz.title_ar || '',
        description: quiz.description || '',
        description_ar: quiz.description_ar || '',
        certification_type: quiz.certification_type,
        difficulty_level: quiz.difficulty_level,
        time_limit_minutes: quiz.time_limit_minutes,
        passing_score_percentage: quiz.passing_score_percentage,
        is_active: quiz.is_active,
      });
    }
  }, [quiz, isEditMode, reset]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && quizId) {
        // Update quiz
        const dto: UpdateQuizDTO = {
          title: data.title.trim(),
          title_ar: data.title_ar.trim() || undefined,
          description: data.description.trim() || undefined,
          description_ar: data.description_ar.trim() || undefined,
          difficulty_level: data.difficulty_level,
          time_limit_minutes: data.time_limit_minutes,
          passing_score_percentage: data.passing_score_percentage,
          is_active: data.is_active,
        };

        await updateQuiz.mutateAsync({ id: quizId, dto });
      } else {
        // Create quiz
        const dto: CreateQuizDTO = {
          title: data.title.trim(),
          title_ar: data.title_ar.trim() || undefined,
          description: data.description.trim() || undefined,
          description_ar: data.description_ar.trim() || undefined,
          certification_type: data.certification_type,
          difficulty_level: data.difficulty_level,
          time_limit_minutes: data.time_limit_minutes,
          passing_score_percentage: data.passing_score_percentage,
          is_active: data.is_active,
        };

        await createQuiz.mutateAsync(dto);
      }

      // Show success message
      setShowSuccess(true);

      // Navigate back after delay
      setTimeout(() => {
        navigate(ROUTES.ADMIN.QUIZZES);
      }, 1500);
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!quizId) return;

    try {
      await deleteQuiz.mutateAsync(quizId);
      setShowDeleteConfirm(false);
      navigate(ROUTES.ADMIN.QUIZZES);
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(ROUTES.ADMIN.QUIZZES);
  };

  const isSaving = createQuiz.isPending || updateQuiz.isPending;
  const hasError = createQuiz.isError || updateQuiz.isError;

  // Loading state
  if (isEditMode && isLoadingQuiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">
            {isArabic ? 'جاري تحميل الاختبار...' : 'Loading quiz...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state (quiz not found)
  if (isEditMode && isErrorQuiz) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">
                {isArabic ? 'لم يتم العثور على الاختبار' : 'Quiz not found'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {messages.ERROR.QUIZ_NOT_FOUND}
              </p>
              <button
                onClick={handleCancel}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                {isArabic ? 'العودة' : 'Go back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-4xl mx-auto p-6 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isArabic ? 'العودة إلى لوحة التحكم' : 'Back to Quiz Manager'}
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode
            ? isArabic
              ? 'تعديل الاختبار'
              : 'Edit Quiz'
            : isArabic
            ? 'إنشاء اختبار جديد'
            : 'Create New Quiz'}
        </h1>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">
                {isEditMode ? messages.SUCCESS.QUIZ_UPDATED : messages.SUCCESS.QUIZ_CREATED}
              </h3>
              <p className="mt-1 text-sm text-green-700">
                {isArabic
                  ? 'جاري التوجيه...'
                  : 'Redirecting to Quiz Manager...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">
                {isArabic ? 'فشل حفظ الاختبار' : 'Failed to save quiz'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {createQuiz.error instanceof Error
                  ? createQuiz.error.message
                  : updateQuiz.error instanceof Error
                  ? updateQuiz.error.message
                  : messages.ERROR.NETWORK_ERROR}
              </p>
            </div>
            <button
              onClick={() => {
                createQuiz.reset();
                updateQuiz.reset();
              }}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <div className="rounded-lg border bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
            {isArabic ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>

          {/* Title (English) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', {
                required: isArabic ? 'العنوان مطلوب' : 'Title is required',
                minLength: {
                  value: TEXT_LIMITS.MIN_TITLE,
                  message: isArabic
                    ? `الحد الأدنى ${TEXT_LIMITS.MIN_TITLE} أحرف`
                    : `Minimum ${TEXT_LIMITS.MIN_TITLE} characters`,
                },
                maxLength: {
                  value: TEXT_LIMITS.MAX_TITLE,
                  message: isArabic
                    ? `الحد الأقصى ${TEXT_LIMITS.MAX_TITLE} حرف`
                    : `Maximum ${TEXT_LIMITS.MAX_TITLE} characters`,
                },
              })}
              placeholder={isArabic ? 'أدخل عنوان الاختبار...' : 'Enter quiz title...'}
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.title,
                  'border-gray-300 bg-white': !errors.title,
                }
              )}
            />
            <div className="flex items-center justify-between text-xs">
              {errors.title && <p className="text-red-600">{errors.title.message}</p>}
              <p
                className={cn('ml-auto text-gray-500', {
                  'text-red-600': title.length > TEXT_LIMITS.MAX_TITLE,
                })}
              >
                {title.length} / {TEXT_LIMITS.MAX_TITLE}
              </p>
            </div>
          </div>

          {/* Title (Arabic) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
            </label>
            <input
              type="text"
              {...register('title_ar', {
                maxLength: {
                  value: TEXT_LIMITS.MAX_TITLE,
                  message: isArabic
                    ? `الحد الأقصى ${TEXT_LIMITS.MAX_TITLE} حرف`
                    : `Maximum ${TEXT_LIMITS.MAX_TITLE} characters`,
                },
              })}
              placeholder={isArabic ? 'أدخل العنوان بالعربية...' : 'Enter Arabic title...'}
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.title_ar,
                  'border-gray-300 bg-white': !errors.title_ar,
                }
              )}
              dir="rtl"
            />
            <div className="flex items-center justify-between text-xs">
              {errors.title_ar && (
                <p className="text-red-600">{errors.title_ar.message}</p>
              )}
              <p
                className={cn('ml-auto text-gray-500', {
                  'text-red-600': title_ar.length > TEXT_LIMITS.MAX_TITLE,
                })}
              >
                {title_ar.length} / {TEXT_LIMITS.MAX_TITLE}
              </p>
            </div>
          </div>

          {/* Description (English) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}
            </label>
            <textarea
              {...register('description', {
                maxLength: {
                  value: TEXT_LIMITS.MAX_DESCRIPTION,
                  message: isArabic
                    ? `الحد الأقصى ${TEXT_LIMITS.MAX_DESCRIPTION} حرف`
                    : `Maximum ${TEXT_LIMITS.MAX_DESCRIPTION} characters`,
                },
              })}
              rows={4}
              placeholder={
                isArabic ? 'أدخل وصف الاختبار...' : 'Enter quiz description...'
              }
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors resize-none',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.description,
                  'border-gray-300 bg-white': !errors.description,
                }
              )}
            />
            <div className="flex items-center justify-between text-xs">
              {errors.description && (
                <p className="text-red-600">{errors.description.message}</p>
              )}
              <p
                className={cn('ml-auto text-gray-500', {
                  'text-red-600': description.length > TEXT_LIMITS.MAX_DESCRIPTION,
                })}
              >
                {description.length} / {TEXT_LIMITS.MAX_DESCRIPTION}
              </p>
            </div>
          </div>

          {/* Description (Arabic) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}
            </label>
            <textarea
              {...register('description_ar', {
                maxLength: {
                  value: TEXT_LIMITS.MAX_DESCRIPTION,
                  message: isArabic
                    ? `الحد الأقصى ${TEXT_LIMITS.MAX_DESCRIPTION} حرف`
                    : `Maximum ${TEXT_LIMITS.MAX_DESCRIPTION} characters`,
                },
              })}
              rows={4}
              placeholder={isArabic ? 'أدخل الوصف بالعربية...' : 'Enter Arabic description...'}
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors resize-none',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.description_ar,
                  'border-gray-300 bg-white': !errors.description_ar,
                }
              )}
              dir="rtl"
            />
            <div className="flex items-center justify-between text-xs">
              {errors.description_ar && (
                <p className="text-red-600">{errors.description_ar.message}</p>
              )}
              <p
                className={cn('ml-auto text-gray-500', {
                  'text-red-600': description_ar.length > TEXT_LIMITS.MAX_DESCRIPTION,
                })}
              >
                {description_ar.length} / {TEXT_LIMITS.MAX_DESCRIPTION}
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="rounded-lg border bg-white p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
            {isArabic ? 'الإعدادات' : 'Configuration'}
          </h2>

          {/* Certification Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'نوع الشهادة' : 'Certification Type'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              {...register('certification_type', {
                required: isArabic ? 'نوع الشهادة مطلوب' : 'Certification type is required',
              })}
              disabled={isEditMode} // Can't change cert type in edit mode
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.certification_type,
                  'border-gray-300 bg-white': !errors.certification_type,
                  'opacity-50 cursor-not-allowed': isEditMode,
                }
              )}
            >
              <option value="CP">{CERTIFICATION_TYPE_LABELS['CP']}</option>
              <option value="SCP">{CERTIFICATION_TYPE_LABELS['SCP']}</option>
            </select>
            {errors.certification_type && (
              <p className="text-sm text-red-600">{errors.certification_type.message}</p>
            )}
            {isEditMode && (
              <p className="text-xs text-gray-500">
                {isArabic
                  ? 'لا يمكن تغيير نوع الشهادة بعد الإنشاء'
                  : 'Certification type cannot be changed after creation'}
              </p>
            )}
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'مستوى الصعوبة' : 'Difficulty Level'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                <label
                  key={level}
                  className={cn(
                    'cursor-pointer rounded-lg border-2 p-3 text-center transition-all',
                    'hover:border-blue-500',
                    {
                      'border-blue-500 bg-blue-50': difficulty === level,
                      'border-gray-300 bg-white': difficulty !== level,
                    }
                  )}
                >
                  <input
                    type="radio"
                    {...register('difficulty_level')}
                    value={level}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-900">
                    {DIFFICULTY_LABELS[level]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'الوقت المحدد (دقائق)' : 'Time Limit (minutes)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('time_limit_minutes', {
                required: isArabic ? 'الوقت المحدد مطلوب' : 'Time limit is required',
                min: {
                  value: QUIZ_CONSTRAINTS.MIN_TIME_LIMIT,
                  message: isArabic
                    ? `الحد الأدنى ${QUIZ_CONSTRAINTS.MIN_TIME_LIMIT} دقيقة`
                    : `Minimum ${QUIZ_CONSTRAINTS.MIN_TIME_LIMIT} minute`,
                },
                max: {
                  value: QUIZ_CONSTRAINTS.MAX_TIME_LIMIT,
                  message: isArabic
                    ? `الحد الأقصى ${QUIZ_CONSTRAINTS.MAX_TIME_LIMIT} دقيقة`
                    : `Maximum ${QUIZ_CONSTRAINTS.MAX_TIME_LIMIT} minutes`,
                },
                valueAsNumber: true,
              })}
              placeholder="60"
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.time_limit_minutes,
                  'border-gray-300 bg-white': !errors.time_limit_minutes,
                }
              )}
            />
            {errors.time_limit_minutes && (
              <p className="text-sm text-red-600">{errors.time_limit_minutes.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {isArabic
                ? `بين ${QUIZ_CONSTRAINTS.MIN_TIME_LIMIT} و ${QUIZ_CONSTRAINTS.MAX_TIME_LIMIT} دقيقة`
                : `Between ${QUIZ_CONSTRAINTS.MIN_TIME_LIMIT} and ${QUIZ_CONSTRAINTS.MAX_TIME_LIMIT} minutes`}
            </p>
          </div>

          {/* Passing Score */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isArabic ? 'درجة النجاح (%)' : 'Passing Score (%)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('passing_score_percentage', {
                required: isArabic ? 'درجة النجاح مطلوبة' : 'Passing score is required',
                min: {
                  value: QUIZ_CONSTRAINTS.MIN_PASSING_SCORE,
                  message: isArabic
                    ? `الحد الأدنى ${QUIZ_CONSTRAINTS.MIN_PASSING_SCORE}%`
                    : `Minimum ${QUIZ_CONSTRAINTS.MIN_PASSING_SCORE}%`,
                },
                max: {
                  value: QUIZ_CONSTRAINTS.MAX_PASSING_SCORE,
                  message: isArabic
                    ? `الحد الأقصى ${QUIZ_CONSTRAINTS.MAX_PASSING_SCORE}%`
                    : `Maximum ${QUIZ_CONSTRAINTS.MAX_PASSING_SCORE}%`,
                },
                valueAsNumber: true,
              })}
              placeholder="70"
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                {
                  'border-red-300 bg-red-50': errors.passing_score_percentage,
                  'border-gray-300 bg-white': !errors.passing_score_percentage,
                }
              )}
            />
            {errors.passing_score_percentage && (
              <p className="text-sm text-red-600">
                {errors.passing_score_percentage.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {isArabic
                ? `بين ${QUIZ_CONSTRAINTS.MIN_PASSING_SCORE}% و ${QUIZ_CONSTRAINTS.MAX_PASSING_SCORE}%`
                : `Between ${QUIZ_CONSTRAINTS.MIN_PASSING_SCORE}% and ${QUIZ_CONSTRAINTS.MAX_PASSING_SCORE}%`}
            </p>
          </div>

          {/* Is Active */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">
                  {isArabic ? 'نشط' : 'Active'}
                </p>
                <p className="text-sm text-gray-600">
                  {isArabic
                    ? 'الاختبارات النشطة فقط مرئية للمستخدمين'
                    : 'Only active quizzes are visible to users'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {isEditMode && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || deleteQuiz.isPending}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                {isArabic ? 'حذف الاختبار' : 'Delete Quiz'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isArabic ? 'حفظ' : 'Save Quiz'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {isArabic
                ? 'هل أنت متأكد من حذف هذا الاختبار؟ سيتم حذف جميع الأسئلة والإجابات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this quiz? All questions and answers will also be deleted. This action cannot be undone.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteQuiz.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteQuiz.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteQuiz.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {isArabic ? 'حذف نهائياً' : 'Delete Permanently'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

QuizEditor.displayName = 'QuizEditor';
