import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  type TicketCategory,
  type CreateTemplateDTO,
  type UpdateTemplateDTO,
} from '@/entities/support';
import { cn } from '@/shared/utils/cn';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
} from '@/shared/constants/ticket.constants';

/**
 * TemplateManager Component
 *
 * Manage response templates for support tickets
 */

export interface TemplateManagerProps {
  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

interface FormData {
  title: string;
  category: TicketCategory;
  content: string;
}

const TEXT_LIMITS = {
  MIN_TITLE: 3,
  MAX_TITLE: 200,
  MIN_CONTENT: 10,
  MAX_CONTENT: 2000,
} as const;

export const TemplateManager = ({ isArabic = false, className }: TemplateManagerProps) => {
  // Filter by category
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | undefined>(
    undefined
  );

  // Fetch templates
  const { data: templates, isLoading, isError, error } = useTemplates(selectedCategory);

  // Mutations
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

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
      category: 'technical',
      content: '',
    },
  });

  // Watch fields
  const title = watch('title') || '';
  const content = watch('content') || '';

  // Handle create
  const handleCreate = () => {
    setEditingTemplate(null);
    reset({
      title: '',
      category: 'technical',
      content: '',
    });
    setShowForm(true);
  };

  // Handle edit
  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    reset({
      title: template.title,
      category: template.category,
      content: template.content,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      setTemplateToDelete(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Handle copy
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Show toast notification
    alert(isArabic ? 'تم النسخ!' : 'Copied to clipboard!');
  };

  // Handle form submit
  const onSubmit = async (data: FormData) => {
    try {
      if (editingTemplate) {
        // Update
        const dto: UpdateTemplateDTO = {
          title: data.title.trim(),
          category: data.category,
          content: data.content.trim(),
        };

        await updateTemplate.mutateAsync({ id: editingTemplate.id, dto });
      } else {
        // Create
        const dto: CreateTemplateDTO = {
          title: data.title.trim(),
          category: data.category,
          content: data.content.trim(),
        };

        await createTemplate.mutateAsync(dto);
      }

      setShowForm(false);
      setEditingTemplate(null);
      reset();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isArabic ? 'إدارة القوالب' : 'Template Manager'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isArabic
              ? 'إنشاء وإدارة قوالب الرد على التذاكر'
              : 'Create and manage response templates for tickets'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {isArabic ? 'قالب جديد' : 'New Template'}
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <p className="font-medium text-green-900">
              {isArabic ? 'تم الحفظ بنجاح' : 'Saved successfully'}
            </p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          {isArabic ? 'تصفية حسب الفئة' : 'Filter by category'}:
        </label>
        <select
          value={selectedCategory || ''}
          onChange={(e) =>
            setSelectedCategory((e.target.value as TicketCategory) || undefined)
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">{isArabic ? 'الكل' : 'All'}</option>
          {(
            [
              'certification',
              'exam',
              'pdc',
              'account',
              'partnership',
              'technical',
              'other',
            ] as TicketCategory[]
          ).map((category) => (
            <option key={category} value={category}>
              {TICKET_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      {/* Form (Create/Edit) */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingTemplate
                ? isArabic
                  ? 'تعديل القالب'
                  : 'Edit Template'
                : isArabic
                ? 'قالب جديد'
                : 'New Template'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingTemplate(null);
                reset();
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                placeholder={isArabic ? 'أدخل العنوان...' : 'Enter template title...'}
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

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {isArabic ? 'الفئة' : 'Category'} <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', {
                  required: isArabic ? 'الفئة مطلوبة' : 'Category is required',
                })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {(
                  [
                    'certification',
                    'exam',
                    'pdc',
                    'account',
                    'partnership',
                    'technical',
                    'other',
                  ] as TicketCategory[]
                ).map((category) => (
                  <option key={category} value={category}>
                    {TICKET_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            {/* Content (English) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {isArabic ? 'المحتوى (إنجليزي)' : 'Content (English)'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('content', {
                  required: isArabic ? 'المحتوى مطلوب' : 'Content is required',
                  minLength: {
                    value: TEXT_LIMITS.MIN_CONTENT,
                    message: isArabic
                      ? `الحد الأدنى ${TEXT_LIMITS.MIN_CONTENT} أحرف`
                      : `Minimum ${TEXT_LIMITS.MIN_CONTENT} characters`,
                  },
                  maxLength: {
                    value: TEXT_LIMITS.MAX_CONTENT,
                    message: isArabic
                      ? `الحد الأقصى ${TEXT_LIMITS.MAX_CONTENT} حرف`
                      : `Maximum ${TEXT_LIMITS.MAX_CONTENT} characters`,
                  },
                })}
                rows={8}
                placeholder={isArabic ? 'أدخل محتوى القالب...' : 'Enter template content...'}
                className={cn(
                  'w-full rounded-lg border px-4 py-2.5 text-gray-900 transition-colors resize-none',
                  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                  {
                    'border-red-300 bg-red-50': errors.content,
                    'border-gray-300 bg-white': !errors.content,
                  }
                )}
              />
              <div className="flex items-center justify-between text-xs">
                {errors.content && <p className="text-red-600">{errors.content.message}</p>}
                <p
                  className={cn('ml-auto text-gray-500', {
                    'text-red-600': content.length > TEXT_LIMITS.MAX_CONTENT,
                  })}
                >
                  {content.length} / {TEXT_LIMITS.MAX_CONTENT}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                  reset();
                }}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isArabic ? 'حفظ' : 'Save Template'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {isArabic ? 'جاري تحميل القوالب...' : 'Loading templates...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">
                {isArabic ? 'خطأ في تحميل القوالب' : 'Error loading templates'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error ? error.message : messages.ERROR.NETWORK_ERROR}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      {!isLoading && !isError && templates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {isArabic ? 'لا توجد قوالب' : 'No templates yet'}
              </p>
            </div>
          ) : (
            templates.map((template: any) => (
              <div
                key={template.id}
                className="rounded-lg border bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {template.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(template.content)}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                      title={isArabic ? 'نسخ' : 'Copy'}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                      title={isArabic ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setTemplateToDelete(template.id)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                      title={isArabic ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {TICKET_CATEGORY_LABELS[template.category]}
                </p>

                <p className="text-sm text-gray-700 line-clamp-4">
                  {template.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {isArabic
                ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this template? This action cannot be undone.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setTemplateToDelete(null)}
                disabled={deleteTemplate.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(templateToDelete)}
                disabled={deleteTemplate.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteTemplate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {isArabic ? 'حذف' : 'Delete'}
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

TemplateManager.displayName = 'TemplateManager';
