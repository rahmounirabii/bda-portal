import { useState } from 'react';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAllTickets, useAssignTicket } from '@/entities/support';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  formatTicketNumber,
  getTimeElapsed,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
} from '@/shared/constants/ticket.constants';

/**
 * TicketAssignment Component
 *
 * Assign tickets to support agents
 */

export interface TicketAssignmentProps {
  /**
   * Ticket ID to assign (if used as modal for single ticket)
   */
  ticketId?: string;

  /**
   * Callback when assignment is successful
   */
  onSuccess?: () => void;

  /**
   * Callback when cancelled
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
}

// Mock agents list - in real app, this would come from an API
const MOCK_AGENTS = [
  { id: '1', name: 'Ahmed Ali', email: 'ahmed@example.com', activeTickets: 5 },
  { id: '2', name: 'Sara Mohammed', email: 'sara@example.com', activeTickets: 3 },
  { id: '3', name: 'Omar Hassan', email: 'omar@example.com', activeTickets: 7 },
  { id: '4', name: 'Fatima Ahmed', email: 'fatima@example.com', activeTickets: 2 },
  { id: '5', name: 'Khaled Ibrahim', email: 'khaled@example.com', activeTickets: 4 },
];

export const TicketAssignment = ({
  ticketId,
  onSuccess,
  onCancel,
  isArabic = false,
  className,
}: TicketAssignmentProps) => {
  // If ticketId provided, single assignment mode
  // Otherwise, show unassigned tickets list

  const isSingleMode = Boolean(ticketId);

  // Fetch unassigned tickets (if not single mode)
  const { data: tickets, isLoading } = useAllTickets(
    isSingleMode ? undefined : { assigned_to: null },
    { limit: 20 }
  );

  const assignTicket = useAssignTicket();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(ticketId || null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Handle assignment
  const handleAssign = async () => {
    if (!selectedTicketId || !selectedAgentId) return;

    try {
      await assignTicket.mutateAsync({
        id: selectedTicketId,
        dto: { assigned_to: selectedAgentId },
      });

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setSelectedTicketId(null);
        setSelectedAgentId(null);
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const unassignedTickets = tickets || [];
  const selectedTicket = unassignedTickets.find((t) => t.id === selectedTicketId);
  const selectedAgent = MOCK_AGENTS.find((a) => a.id === selectedAgentId);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success Message */}
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">
                {isArabic ? 'تم التعيين بنجاح' : 'Ticket assigned successfully'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {assignTicket.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">
                {isArabic ? 'فشل التعيين' : 'Failed to assign ticket'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {assignTicket.error instanceof Error
                  ? assignTicket.error.message
                  : messages.ERROR.NETWORK_ERROR}
              </p>
            </div>
            <button
              onClick={() => assignTicket.reset()}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List (if not single mode) */}
        {!isSingleMode && (
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3">
              {isArabic ? 'التذاكر غير المعينة' : 'Unassigned Tickets'}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({unassignedTickets.length})
              </span>
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : unassignedTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد تذاكر غير معينة' : 'No unassigned tickets'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-all',
                      {
                        'border-blue-500 bg-blue-50': selectedTicketId === ticket.id,
                        'border-gray-200 hover:border-gray-300 bg-white':
                          selectedTicketId !== ticket.id,
                      }
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-medium text-gray-900">
                        {formatTicketNumber(ticket.ticket_number)}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusBadge variant={ticket.priority} size="sm">
                          {TICKET_PRIORITY_LABELS[ticket.priority]}
                        </StatusBadge>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      <span>{TICKET_CATEGORY_LABELS[ticket.category]}</span>
                      <span>•</span>
                      <span>{getTimeElapsed(ticket.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Ticket Info (if single mode) */}
        {isSingleMode && selectedTicket && (
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3">
              {isArabic ? 'التذكرة' : 'Ticket'}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">
                  {isArabic ? 'الرقم' : 'Number'}:
                </span>
                <p className="font-mono font-medium text-gray-900">
                  {formatTicketNumber(selectedTicket.ticket_number)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">
                  {isArabic ? 'الموضوع' : 'Subject'}:
                </span>
                <p className="font-medium text-gray-900">{selectedTicket.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant="default" size="sm">
                  {TICKET_CATEGORY_LABELS[selectedTicket.category]}
                </StatusBadge>
                <StatusBadge variant={selectedTicket.priority} size="sm">
                  {TICKET_PRIORITY_LABELS[selectedTicket.priority]}
                </StatusBadge>
              </div>
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3">
            {isArabic ? 'اختر وكيلاً' : 'Select Agent'}
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {MOCK_AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                disabled={!selectedTicketId}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-all',
                  {
                    'border-blue-500 bg-blue-50': selectedAgentId === agent.id,
                    'border-gray-200 hover:border-gray-300 bg-white':
                      selectedAgentId !== agent.id,
                    'opacity-50 cursor-not-allowed': !selectedTicketId,
                  }
                )}
              >
                <p className="font-medium text-gray-900">{agent.name}</p>
                <p className="text-sm text-gray-600">{agent.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {isArabic ? 'التذاكر النشطة' : 'Active tickets'}:
                  </span>
                  <span className="inline-flex h-5 px-2 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                    {agent.activeTickets}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Summary & Action */}
      {selectedTicketId && selectedAgentId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">
                {isArabic ? 'ملخص التعيين' : 'Assignment Summary'}
              </h4>
              <p className="text-sm text-blue-800">
                {isArabic ? 'التذكرة' : 'Ticket'}:{' '}
                <span className="font-medium">
                  {selectedTicket
                    ? formatTicketNumber(selectedTicket.ticket_number)
                    : selectedTicketId}
                </span>
              </p>
              <p className="text-sm text-blue-800">
                {isArabic ? 'الوكيل' : 'Agent'}:{' '}
                <span className="font-medium">{selectedAgent?.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  disabled={assignTicket.isPending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              )}
              <button
                onClick={handleAssign}
                disabled={assignTicket.isPending}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {assignTicket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isArabic ? 'جاري التعيين...' : 'Assigning...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {isArabic ? 'تعيين' : 'Assign Ticket'}
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

TicketAssignment.displayName = 'TicketAssignment';
