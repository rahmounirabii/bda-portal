import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, Send, X } from 'lucide-react';
import { useCreateTicket } from '@/entities/support';
import { FileUploader, type UploadedFile } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import type { TicketCategory, TicketPriority, CreateTicketDTO } from '@/entities/support';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_DESCRIPTIONS,
  TICKET_PRIORITY_LABELS,
  TICKET_TEXT_LIMITS,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
} from '@/shared/constants/ticket.constants';

/**
 * CreateTicketForm Component
 *
 * Form for creating a new support ticket with file attachments
 */

interface FormData {
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
}

export interface CreateTicketFormProps {
  /**
   * Callback when ticket is successfully created
   */
  onSuccess?: (ticketId: string) => void;

  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Auto-focus first field
   */
  autoFocus?: boolean;
}

export const CreateTicketForm = ({
  onSuccess,
  onCancel,
  isArabic = false,
  className,
  autoFocus = true,
}: CreateTicketFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      category: 'technical',
      priority: 'normal',
    },
  });

  const createTicket = useCreateTicket();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Watch fields for character count
  const subject = watch('subject') || '';
  const description = watch('description') || '';
  const selectedCategory = watch('category');

  // Handle file selection
  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Handle file removal
  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      const ticketData: CreateTicketDTO = {
        category: data.category,
        subject: data.subject.trim(),
        description: data.description.trim(),
        priority: data.priority,
        attachments: files.map((f) => f.file),
      };

      const result = await createTicket.mutateAsync(ticketData);

      // Show success message
      setShowSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        setFiles([]);
        onSuccess?.(result.id);
      }, 2000);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Categories for dropdown
  const categories: TicketCategory[] = [
    'certification',
    'exam',
    'pdc',
    'account',
    'partnership',
    'technical',
    'other',
  ];

  const priorities: TicketPriority[] = ['low', 'normal', 'high'];

  const isSubmitting = createTicket.isPending;
  const hasError = createTicket.isError;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success Message */}
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">
                {messages.SUCCESS.TICKET_CREATED}
              </h3>
              <p className="mt-1 text-sm text-green-700">
                {messages.INFO.TICKET_CREATED_INFO}
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
                {isArabic ? 'فشل إنشاء التذكرة' : 'Failed to create ticket'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {createTicket.error instanceof Error
                  ? createTicket.error.message
                  : messages.ERROR.NETWORK_ERROR}
              </p>
            </div>
            <button
              onClick={() => createTicket.reset()}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isArabic ? 'الفئة' : 'Category'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category', {
              required: isArabic ? 'الفئة مطلوبة' : 'Category is required',
            })}
            className={cn(
              'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              {
                'border-red-300 bg-red-50': errors.category,
                'border-gray-300 bg-white': !errors.category,
              }
            )}
            dir={isArabic ? 'rtl' : 'ltr'}
            autoFocus={autoFocus}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {TICKET_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category.message}</p>
          )}
          {selectedCategory && (
            <p className="text-xs text-gray-600">
              {TICKET_CATEGORY_DESCRIPTIONS[selectedCategory]}
            </p>
          )}
        </div>

        {/* Priority Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isArabic ? 'الأولوية' : 'Priority'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {priorities.map((priority) => (
              <label
                key={priority}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg border-2 p-3 text-center transition-all',
                  'hover:border-blue-500',
                  {
                    'border-blue-500 bg-blue-50':
                      watch('priority') === priority,
                    'border-gray-300 bg-white':
                      watch('priority') !== priority,
                  }
                )}
              >
                <input
                  type="radio"
                  {...register('priority')}
                  value={priority}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">
                  {TICKET_PRIORITY_LABELS[priority]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isArabic ? 'الموضوع' : 'Subject'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('subject', {
              required: isArabic ? 'الموضوع مطلوب' : 'Subject is required',
              minLength: {
                value: TICKET_TEXT_LIMITS.MIN_SUBJECT_LENGTH,
                message: isArabic
                  ? `الحد الأدنى ${TICKET_TEXT_LIMITS.MIN_SUBJECT_LENGTH} أحرف`
                  : `Minimum ${TICKET_TEXT_LIMITS.MIN_SUBJECT_LENGTH} characters`,
              },
              maxLength: {
                value: TICKET_TEXT_LIMITS.MAX_SUBJECT_LENGTH,
                message: isArabic
                  ? `الحد الأقصى ${TICKET_TEXT_LIMITS.MAX_SUBJECT_LENGTH} حرف`
                  : `Maximum ${TICKET_TEXT_LIMITS.MAX_SUBJECT_LENGTH} characters`,
              },
            })}
            placeholder={
              isArabic
                ? 'اكتب موضوع تذكرتك هنا...'
                : 'Enter a brief summary of your issue...'
            }
            className={cn(
              'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              {
                'border-red-300 bg-red-50': errors.subject,
                'border-gray-300 bg-white': !errors.subject,
              }
            )}
            dir={isArabic ? 'rtl' : 'ltr'}
          />
          <div className="flex items-center justify-between text-xs">
            {errors.subject && (
              <p className="text-red-600">{errors.subject.message}</p>
            )}
            <p
              className={cn('ml-auto text-gray-500', {
                'text-red-600':
                  subject.length > TICKET_TEXT_LIMITS.MAX_SUBJECT_LENGTH,
              })}
            >
              {subject.length} / {TICKET_TEXT_LIMITS.MAX_SUBJECT_LENGTH}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isArabic ? 'الوصف' : 'Description'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description', {
              required: isArabic ? 'الوصف مطلوب' : 'Description is required',
              minLength: {
                value: TICKET_TEXT_LIMITS.MIN_DESCRIPTION_LENGTH,
                message: isArabic
                  ? `الحد الأدنى ${TICKET_TEXT_LIMITS.MIN_DESCRIPTION_LENGTH} أحرف`
                  : `Minimum ${TICKET_TEXT_LIMITS.MIN_DESCRIPTION_LENGTH} characters`,
              },
              maxLength: {
                value: TICKET_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH,
                message: isArabic
                  ? `الحد الأقصى ${TICKET_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH} حرف`
                  : `Maximum ${TICKET_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH} characters`,
              },
            })}
            rows={6}
            placeholder={
              isArabic
                ? 'صف مشكلتك بالتفصيل...'
                : 'Describe your issue in detail...'
            }
            className={cn(
              'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors resize-none',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              {
                'border-red-300 bg-red-50': errors.description,
                'border-gray-300 bg-white': !errors.description,
              }
            )}
            dir={isArabic ? 'rtl' : 'ltr'}
          />
          <div className="flex items-center justify-between text-xs">
            {errors.description && (
              <p className="text-red-600">{errors.description.message}</p>
            )}
            <p
              className={cn('ml-auto text-gray-500', {
                'text-red-600':
                  description.length > TICKET_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH,
              })}
            >
              {description.length} / {TICKET_TEXT_LIMITS.MAX_DESCRIPTION_LENGTH}
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isArabic ? 'المرفقات (اختياري)' : 'Attachments (Optional)'}
          </label>
          <FileUploader
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            files={files}
            maxFiles={5}
            multiple
            disabled={isSubmitting}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {isArabic ? 'جاري الإرسال...' : 'Creating...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isArabic ? 'إنشاء التذكرة' : 'Create Ticket'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

CreateTicketForm.displayName = 'CreateTicketForm';
