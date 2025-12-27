import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Clock,
  Send,
  Upload,
  X,
  Download,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Paperclip,
  FileText,
} from 'lucide-react';
import { useTicket, useAddMessage, useCloseTicket, useValidateFile } from '@/entities/support/ticket.hooks';
import type { CreateMessageDTO } from '@/entities/support/ticket.types';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
  FILE_UPLOAD_CONSTRAINTS,
} from '@/entities/support/ticket.types';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

/**
 * TicketDetail Page (Individual User)
 *
 * Displays full ticket details with message thread
 * Allows user to add messages and close ticket
 */

interface MessageFormData {
  message: string;
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const validateFile = useValidateFile();

  const { data: ticket, isLoading, error } = useTicket(id || '', !!id);
  const addMessage = useAddMessage();
  const closeTicket = useCloseTicket();

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>();

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

    if (newErrors.length > 0) {
      setTimeout(() => setUploadErrors([]), 5000);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit message
  const onSubmit = async (data: MessageFormData) => {
    if (!id) return;

    try {
      const dto: CreateMessageDTO = {
        ticket_id: id,
        message: data.message,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await addMessage.mutateAsync(dto);

      toast({
        title: 'Message Sent',
        description: 'Your message has been added to the ticket.',
      });

      reset();
      setAttachments([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Close ticket
  const handleCloseTicket = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to close this ticket?')) return;

    try {
      await closeTicket.mutateAsync(id);
      toast({
        title: 'Ticket Closed',
        description: 'Your ticket has been closed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close ticket.',
        variant: 'destructive',
      });
    }
  };

  // Download attachment
  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const { TicketService } = await import('@/entities/support/ticket.service');
      const result = await TicketService.getFileUrl(filePath);

      if (result.error || !result.data) {
        toast({
          title: 'Error',
          description: 'Failed to get download link.',
          variant: 'destructive',
        });
        return;
      }

      // Open in new tab or trigger download
      window.open(result.data, '_blank');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file.',
        variant: 'destructive',
      });
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
    const colorMap: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      blue: 'default',
      green: 'success',
      yellow: 'warning',
      orange: 'warning',
      red: 'danger',
      gray: 'default',
    };
    const color = TICKET_STATUS_COLORS[status as keyof typeof TICKET_STATUS_COLORS];
    return colorMap[color] || 'default';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-red-800">Failed to load ticket. Please try again.</p>
            <button
              onClick={() => navigate('/support/my-tickets')}
              className="mt-4 text-red-600 hover:text-red-700 underline"
            >
              Back to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canAddMessage = !['closed', 'resolved'].includes(ticket.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/support/my-tickets')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Tickets
          </button>
        </div>

        {/* Ticket Info Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500">#{ticket.ticket_number}</span>
                <StatusBadge variant={getStatusVariant(ticket.status)} size="sm">
                  {TICKET_STATUS_LABELS[ticket.status]}
                </StatusBadge>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
              <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-1">Priority</p>
              <p className="text-sm font-medium text-gray-900">
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(ticket.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(ticket.updated_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Messages</p>
              <p className="text-sm font-medium text-gray-900">{ticket.messages?.length || 0}</p>
            </div>
          </div>

          {/* Attachments Section */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Attachments ({ticket.attachments.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ticket.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024).toFixed(1)} KB
                          {' • '}
                          Uploaded by {attachment.uploader.first_name} {attachment.uploader.last_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(attachment.file_path, attachment.file_name)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canAddMessage && ticket.status === 'resolved' && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Ticket Resolved</p>
                <p className="text-xs text-green-700">
                  If your issue is resolved, you can close this ticket.
                </p>
              </div>
              <button
                onClick={handleCloseTicket}
                className="px-3 py-1.5 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Close Ticket
              </button>
            </div>
          )}
        </div>

        {/* Messages Thread */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </h2>

          {ticket.messages && ticket.messages.length > 0 ? (
            <div className="space-y-6">
              {ticket.messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {message.user.first_name[0]}
                        {message.user.last_name[0]}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.user.first_name} {message.user.last_name}
                      </span>
                      {message.user.role === 'admin' || message.user.role === 'super_admin' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Support Team
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No messages yet</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {canAddMessage && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Message</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Message Input */}
              <div>
                <textarea
                  rows={4}
                  {...register('message', {
                    required: 'Message is required',
                    minLength: { value: 10, message: 'Message must be at least 10 characters' },
                  })}
                  placeholder="Type your message..."
                  className={cn(
                    'w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                    errors.message ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm">
                    <Upload className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Attach Files</span>
                    <input
                      type="file"
                      multiple
                      accept={FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Upload Errors */}
                {uploadErrors.length > 0 && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-red-800">
                        {uploadErrors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
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
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Upload className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
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

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Closed Ticket Notice */}
        {!canAddMessage && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-gray-600">
              This ticket is {ticket.status}. You can no longer add messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

TicketDetail.displayName = 'TicketDetail';
