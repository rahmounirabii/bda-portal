import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, User, Shield, FileText, Download, Loader2 } from 'lucide-react';
import { useAddMessage } from '@/entities/support';
import { FileUploader, type UploadedFile } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import type { MessageWithUser, AttachmentWithUser } from '@/entities/support';
import {
  TICKET_TEXT_LIMITS,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
  getTimeElapsed,
  formatFileSize,
} from '@/shared/constants/ticket.constants';

/**
 * TicketChat Component
 *
 * Displays ticket message thread with reply functionality
 */

export interface TicketChatProps {
  /**
   * Ticket ID
   */
  ticketId: string;

  /**
   * Messages to display
   */
  messages: MessageWithUser[];

  /**
   * Attachments to display
   */
  attachments?: AttachmentWithUser[];

  /**
   * Current user ID (to differentiate own messages)
   */
  currentUserId: string;

  /**
   * Whether user can reply
   */
  canReply?: boolean;

  /**
   * Whether to show internal notes (admin only)
   */
  showInternalNotes?: boolean;

  /**
   * Callback when message is sent
   */
  onMessageSent?: () => void;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TicketChat = ({
  ticketId,
  messages,
  attachments = [],
  currentUserId,
  canReply = true,
  showInternalNotes = false,
  onMessageSent,
  isArabic = false,
  className,
}: TicketChatProps) => {
  const [messageText, setMessageText] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const addMessage = useAddMessage();

  const messagesToShow = messages.filter(
    (msg) => !msg.is_internal_note || showInternalNotes
  );

  const messagesMessages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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

  // Handle message send
  const handleSendMessage = async () => {
    if (!messageText.trim() && files.length === 0) return;

    try {
      await addMessage.mutateAsync({
        ticket_id: ticketId,
        message: messageText.trim(),
        attachments: files.map((f) => f.file),
      });

      // Reset form
      setMessageText('');
      setFiles([]);
      setShowFileUpload(false);
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group attachments by message
  const getMessageAttachments = (messageId: string) => {
    return attachments.filter((att) => att.message_id === messageId);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesToShow.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{isArabic ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
          </div>
        ) : (
          messagesToShow.map((message) => {
            const isOwnMessage = message.user_id === currentUserId;
            const messageAttachments = getMessageAttachments(message.id);

            return (
              <div
                key={message.id}
                className={cn('flex gap-3', {
                  'flex-row-reverse': isOwnMessage && !isArabic,
                  'flex-row': !isOwnMessage || isArabic,
                })}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-medium',
                    {
                      'bg-blue-600': isOwnMessage,
                      'bg-gray-600': !isOwnMessage && !message.is_internal_note,
                      'bg-purple-600': message.is_internal_note,
                    }
                  )}
                >
                  {message.is_internal_note ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={cn('flex-1 max-w-[70%] space-y-1', {
                    'items-end': isOwnMessage,
                  })}
                >
                  {/* Sender Name & Time */}
                  <div
                    className={cn('flex items-center gap-2 text-xs text-gray-600', {
                      'flex-row-reverse': isOwnMessage && !isArabic,
                    })}
                  >
                    <span className="font-medium">
                      {message.user.first_name} {message.user.last_name}
                      {message.user.role && message.user.role !== 'individual' && (
                        <span className="ml-1 text-gray-500">({message.user.role})</span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{getTimeElapsed(message.created_at)}</span>
                    {message.is_internal_note && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 font-medium">
                          {isArabic ? 'ملاحظة داخلية' : 'Internal Note'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn('rounded-lg p-3 break-words', {
                      'bg-blue-600 text-white': isOwnMessage && !message.is_internal_note,
                      'bg-gray-100 text-gray-900': !isOwnMessage && !message.is_internal_note,
                      'bg-purple-100 text-purple-900 border-2 border-purple-300': message.is_internal_note,
                    })}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>

                  {/* Attachments */}
                  {messageAttachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {messageAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              // TODO: Implement download
                              window.open(attachment.file_path, '_blank');
                            }}
                            className="shrink-0 rounded p-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            title={isArabic ? 'تحميل' : 'Download'}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Form */}
      {canReply && (
        <div className="border-t bg-white p-4 space-y-3">
          {/* File Upload (conditional) */}
          {showFileUpload && (
            <FileUploader
              onFilesSelected={handleFilesSelected}
              onFileRemove={handleFileRemove}
              files={files}
              maxFiles={3}
              multiple
              compact
            />
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className={cn(
                'shrink-0 rounded-lg p-2 transition-colors',
                {
                  'bg-blue-100 text-blue-600': showFileUpload,
                  'bg-gray-100 text-gray-600 hover:bg-gray-200': !showFileUpload,
                }
              )}
              title={isArabic ? 'إرفاق ملفات' : 'Attach files'}
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isArabic
                    ? 'اكتب رسالتك هنا... (Shift+Enter للسطر الجديد)'
                    : 'Type your message... (Shift+Enter for new line)'
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                rows={2}
                maxLength={TICKET_TEXT_LIMITS.MAX_MESSAGE_LENGTH}
                dir={isArabic ? 'rtl' : 'ltr'}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {messageText.length} / {TICKET_TEXT_LIMITS.MAX_MESSAGE_LENGTH}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && files.length === 0) || addMessage.isPending}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {addMessage.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isArabic ? 'إرسال' : 'Send'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {addMessage.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-700">
              {addMessage.error instanceof Error
                ? addMessage.error.message
                : messagesMessages.ERROR.NETWORK_ERROR}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

TicketChat.displayName = 'TicketChat';
