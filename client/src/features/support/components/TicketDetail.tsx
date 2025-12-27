import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useTicket, useCloseTicket } from '@/entities/support';
import { TicketChat } from './TicketChat';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
  formatTicketNumber,
  getTimeElapsed,
} from '@/shared/constants/ticket.constants';
import { ROUTES } from '@/shared/constants/routes';

/**
 * TicketDetail Component
 *
 * Full ticket view with metadata, description, messages, and actions
 */

export interface TicketDetailProps {
  /**
   * Ticket ID to display
   */
  ticketId: string;

  /**
   * Current user ID
   */
  currentUserId: string;

  /**
   * Whether current user is admin
   */
  isAdmin?: boolean;

  /**
   * Callback when ticket is closed
   */
  onTicketClosed?: () => void;

  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TicketDetail = ({
  ticketId,
  currentUserId,
  isAdmin = false,
  onTicketClosed,
  isArabic = false,
  className,
}: TicketDetailProps) => {
  const navigate = useNavigate();
  const { data: ticket, isLoading, isError, error, refetch } = useTicket(ticketId);
  const closeTicket = useCloseTicket();

  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Handle close ticket
  const handleCloseTicket = async () => {
    try {
      await closeTicket.mutateAsync(ticketId);
      setShowCloseConfirmation(false);
      onTicketClosed?.();
      await refetch();
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(ROUTES.SUPPORT.TICKETS);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">
            {isArabic ? 'جاري تحميل التذكرة...' : 'Loading ticket...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">
                {messages.ERROR.TICKET_NOT_FOUND}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error ? error.message : messages.ERROR.NETWORK_ERROR}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleBack}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  {isArabic ? 'العودة إلى القائمة' : 'Back to tickets'}
                </button>
                <button
                  onClick={() => refetch()}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  {isArabic ? 'إعادة المحاولة' : 'Try again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';
  const canReply = !isClosed;
  const canClose = !isClosed && !isResolved && !isAdmin;

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isArabic ? 'العودة إلى التذاكر' : 'Back to tickets'}
          </button>

          {/* Title & Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {formatTicketNumber(ticket.ticket_number)}
                </h1>
                <StatusBadge variant={ticket.status} withDot>
                  {TICKET_STATUS_LABELS[ticket.status]}
                </StatusBadge>
              </div>
              <h2 className="text-xl text-gray-700">{ticket.subject}</h2>
            </div>

            {/* Close Button */}
            {canClose && (
              <button
                onClick={() => setShowCloseConfirmation(true)}
                disabled={closeTicket.isPending}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isArabic ? 'إغلاق التذكرة' : 'Close Ticket'}
              </button>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category */}
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Tag className="h-4 w-4" />
              <span>{isArabic ? 'الفئة' : 'Category'}</span>
            </div>
            <p className="font-medium text-gray-900">
              {TICKET_CATEGORY_LABELS[ticket.category]}
            </p>
          </div>

          {/* Priority */}
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>{isArabic ? 'الأولوية' : 'Priority'}</span>
            </div>
            <StatusBadge variant={ticket.priority} size="sm">
              {TICKET_PRIORITY_LABELS[ticket.priority]}
            </StatusBadge>
          </div>

          {/* Created Date */}
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span>{isArabic ? 'تاريخ الإنشاء' : 'Created'}</span>
            </div>
            <p className="font-medium text-gray-900">
              {getTimeElapsed(ticket.created_at)}
            </p>
          </div>

          {/* Assigned Agent */}
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="h-4 w-4" />
              <span>{isArabic ? 'المسؤول' : 'Assigned to'}</span>
            </div>
            <p className="font-medium text-gray-900">
              {ticket.assigned_agent
                ? `${ticket.assigned_agent.first_name} ${ticket.assigned_agent.last_name}`
                : isArabic
                ? 'غير محدد'
                : 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Description Card */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            {isArabic ? 'الوصف' : 'Description'}
          </h3>
          <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Status Timeline (if resolved or closed) */}
        {(isResolved || isClosed) && (
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">
              {isArabic ? 'الحالة' : 'Status Timeline'}
            </h3>
            <div className="space-y-3">
              {ticket.resolved_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {isArabic ? 'تم الحل' : 'Resolved'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getTimeElapsed(ticket.resolved_at)}
                    </p>
                  </div>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gray-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {isArabic ? 'تم الإغلاق' : 'Closed'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getTimeElapsed(ticket.closed_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Section */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isArabic ? 'الرسائل' : 'Messages'}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({ticket.message_count || ticket.messages.length})
              </span>
            </h3>
          </div>
          <div className="h-[600px]">
            <TicketChat
              ticketId={ticket.id}
              messages={ticket.messages}
              attachments={ticket.attachments}
              currentUserId={currentUserId}
              canReply={canReply}
              showInternalNotes={isAdmin}
              onMessageSent={() => refetch()}
              isArabic={isArabic}
            />
          </div>
        </div>

        {/* Closed/Resolved Notice */}
        {(isClosed || isResolved) && (
          <div
            className={cn('rounded-lg border p-4', {
              'border-green-200 bg-green-50': isResolved,
              'border-gray-200 bg-gray-50': isClosed,
            })}
          >
            <div className="flex items-start gap-3">
              {isResolved ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3
                  className={cn('font-medium', {
                    'text-green-900': isResolved,
                    'text-gray-900': isClosed,
                  })}
                >
                  {isClosed
                    ? isArabic
                      ? 'هذه التذكرة مغلقة'
                      : 'This ticket is closed'
                    : isArabic
                    ? 'تم حل هذه التذكرة'
                    : 'This ticket has been resolved'}
                </h3>
                <p
                  className={cn('mt-1 text-sm', {
                    'text-green-700': isResolved,
                    'text-gray-700': isClosed,
                  })}
                >
                  {isClosed
                    ? messages.INFO.TICKET_RESOLVED_INFO
                    : isArabic
                    ? 'إذا كنت بحاجة إلى مزيد من المساعدة، يرجى إعادة فتح هذه التذكرة.'
                    : 'If you need further assistance, please reopen this ticket.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close Confirmation Dialog */}
      {showCloseConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {messages.WARNING.CLOSE_CONFIRMATION}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {isArabic
                ? 'سيتم وضع علامة على هذه التذكرة كمغلقة. يمكنك إعادة فتحها لاحقًا إذا لزم الأمر.'
                : 'This ticket will be marked as closed. You can reopen it later if needed.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCloseConfirmation(false)}
                disabled={closeTicket.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleCloseTicket}
                disabled={closeTicket.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {closeTicket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isArabic ? 'جاري الإغلاق...' : 'Closing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {isArabic ? 'تأكيد الإغلاق' : 'Confirm Close'}
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

TicketDetail.displayName = 'TicketDetail';
