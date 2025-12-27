import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Send, Upload, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCreateTicket, useValidateFile } from '@/entities/support/ticket.hooks';
import type { CreateTicketDTO, TicketCategory, TicketPriority } from '@/entities/support/ticket.types';
import { TICKET_CATEGORY_LABELS, FILE_UPLOAD_CONSTRAINTS } from '@/entities/support/ticket.types';
import { cn } from '@/shared/utils/cn';
import { useToast } from '@/hooks/use-toast';

/**
 * NewTicket Page
 *
 * Allows users to create a new support ticket
 * - Category selection
 * - Subject and description
 * - Priority level
 * - File attachments
 */

interface FormData {
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
}

export default function NewTicket() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createTicket = useCreateTicket();
  const validateFile = useValidateFile();

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      category: 'other',
      priority: 'normal',
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    setAttachments((prev) => [...prev, ...validFiles]);
    setUploadErrors(newErrors);

    // Clear errors after 5 seconds
    if (newErrors.length > 0) {
      setTimeout(() => setUploadErrors([]), 5000);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit ticket
  const onSubmit = async (data: FormData) => {
    try {
      const dto: CreateTicketDTO = {
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await createTicket.mutateAsync(dto);

      toast({
        title: 'Ticket Created',
        description: 'Your support ticket has been submitted successfully.',
      });

      navigate('/support/my-tickets');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="mt-2 text-gray-600">
            Describe your issue and our support team will get back to you as soon as possible.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Form Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm space-y-6">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                {...register('category', { required: 'Category is required' })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.category ? 'border-red-300' : 'border-gray-300'
                )}
              >
                {(Object.entries(TICKET_CATEGORY_LABELS) as [TicketCategory, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                {...register('priority', { required: 'Priority is required' })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.priority ? 'border-red-300' : 'border-gray-300'
                )}
              >
                <option value="low">Low - General inquiry</option>
                <option value="normal">Normal - Standard issue</option>
                <option value="high">High - Urgent issue</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                {...register('subject', {
                  required: 'Subject is required',
                  minLength: { value: 5, message: 'Subject must be at least 5 characters' },
                  maxLength: { value: 200, message: 'Subject must be less than 200 characters' },
                })}
                placeholder="Brief description of your issue"
                className={cn(
                  'w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.subject ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={8}
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' },
                  maxLength: { value: 5000, message: 'Description must be less than 5000 characters' },
                })}
                placeholder="Please provide detailed information about your issue..."
                className={cn(
                  'w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                  errors.description ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Choose Files</span>
                    <input
                      type="file"
                      multiple
                      accept={FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    Max {FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB per file
                  </p>
                </div>

                {/* Upload Errors */}
                {uploadErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">File validation errors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {uploadErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Files */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Upload className="h-4 w-4 text-gray-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

NewTicket.displayName = 'NewTicket';
