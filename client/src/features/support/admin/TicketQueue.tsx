import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  UserPlus,
  Loader2,
  AlertCircle,
  X,
  Inbox,
} from 'lucide-react';
import {
  useAllTickets,
  useUpdateTicketStatus,
  useAssignTicket,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
  type TicketFilters,
} from '@/entities/support';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  formatTicketNumber,
  getTimeElapsed,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
} from '@/shared/constants/ticket.constants';
import { ROUTES } from '@/shared/constants/routes';

/**
 * TicketQueue Component
 *
 * Admin queue for managing and processing support tickets
 */

export interface TicketQueueProps {
  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TicketQueue = ({ isArabic = false, className }: TicketQueueProps) => {
  const navigate = useNavigate();

  // Filters
  const [filters, setFilters] = useState<TicketFilters>({
    status: undefined,
    category: undefined,
    priority: undefined,
    search: undefined,
  });

  // Local search
  const [searchTerm, setSearchTerm] = useState('');

  // Selected tickets
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

  // Fetch tickets
  const { data: tickets, isLoading, isError, error, refetch } = useAllTickets(filters);
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Client-side search
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    if (!searchTerm.trim()) return tickets;

    const term = searchTerm.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.ticket_number.toLowerCase().includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term)
    );
  }, [tickets, searchTerm]);

  // Handle view ticket
  const handleViewTicket = (ticketId: string) => {
    navigate(ROUTES.ADMIN.SUPPORT_TICKET_DETAIL.replace(':id', ticketId));
  };

  // Handle status change
  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await updateStatus.mutateAsync({
        id: ticketId,
        dto: { status: newStatus },
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle select/deselect
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedTicketIds.size === filteredTickets.length) {
      setSelectedTicketIds(new Set());
    } else {
      setSelectedTicketIds(new Set(filteredTickets.map((t) => t.id)));
    }
  };

  // Handle filter change
  const handleStatusFilter = (status: TicketStatus | undefined) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleCategoryFilter = (category: TicketCategory | undefined) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handlePriorityFilter = (priority: TicketPriority | undefined) => {
    setFilters((prev) => ({ ...prev, priority }));
  };

  const clearFilters = () => {
    setFilters({
      status: undefined,
      category: undefined,
      priority: undefined,
      search: undefined,
    });
    setSearchTerm('');
  };

  const hasActiveFilters = Boolean(
    filters.status || filters.category || filters.priority || searchTerm
  );

  const isAllSelected =
    filteredTickets.length > 0 && selectedTicketIds.size === filteredTickets.length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isArabic ? 'قائمة انتظار التذاكر' : 'Ticket Queue'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isArabic
            ? 'إدارة ومعالجة تذاكر الدعم'
            : 'Manage and process support tickets'}
        </p>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isArabic
                ? 'ابحث عن التذاكر...'
                : 'Search tickets by number, subject, or description...'
            }
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white py-2.5 text-gray-900',
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

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) =>
              handleStatusFilter((e.target.value as TicketStatus) || undefined)
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{isArabic ? 'كل الحالات' : 'All Statuses'}</option>
            {(['new', 'in_progress', 'waiting_user', 'resolved', 'closed'] as TicketStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {TICKET_STATUS_LABELS[status]}
                </option>
              )
            )}
          </select>

          {/* Category Filter */}
          <select
            value={filters.category || ''}
            onChange={(e) =>
              handleCategoryFilter((e.target.value as TicketCategory) || undefined)
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{isArabic ? 'كل الفئات' : 'All Categories'}</option>
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

          {/* Priority Filter */}
          <select
            value={filters.priority || ''}
            onChange={(e) =>
              handlePriorityFilter((e.target.value as TicketPriority) || undefined)
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{isArabic ? 'كل الأولويات' : 'All Priorities'}</option>
            {(['high', 'normal', 'low'] as TicketPriority[]).map((priority) => (
              <option key={priority} value={priority}>
                {TICKET_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <X className="h-3 w-3" />
              {isArabic ? 'مسح الفلاتر' : 'Clear filters'}
            </button>
          )}
        </div>

        {/* Results count */}
        {!isLoading && filteredTickets && (
          <p className="text-sm text-gray-600">
            {isArabic
              ? `${filteredTickets.length} تذكرة`
              : `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {isArabic ? 'جاري تحميل التذاكر...' : 'Loading tickets...'}
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
                {isArabic ? 'خطأ في تحميل التذاكر' : 'Error loading tickets'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error ? error.message : messages.ERROR.NETWORK_ERROR}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                {isArabic ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredTickets && filteredTickets.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters
              ? isArabic
                ? 'لم يتم العثور على تذاكر'
                : 'No tickets found'
              : isArabic
              ? 'لا توجد تذاكر'
              : 'No tickets yet'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {hasActiveFilters
              ? isArabic
                ? 'حاول تعديل معايير البحث أو الفلتر'
                : 'Try adjusting your search or filter criteria'
              : isArabic
              ? 'سيظهر جميع التذاكر هنا'
              : 'All tickets will appear here'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {isArabic ? 'مسح البحث والفلاتر' : 'Clear search and filters'}
            </button>
          )}
        </div>
      )}

      {/* Tickets Table */}
      {!isLoading && !isError && filteredTickets && filteredTickets.length > 0 && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {/* Checkbox */}
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {/* Ticket # */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'الرقم' : 'Ticket #'}
                  </th>
                  {/* Subject */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'الموضوع' : 'Subject'}
                  </th>
                  {/* Category */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'الفئة' : 'Category'}
                  </th>
                  {/* Priority */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'الأولوية' : 'Priority'}
                  </th>
                  {/* Status */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'الحالة' : 'Status'}
                  </th>
                  {/* Assigned */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'المسؤول' : 'Assigned'}
                  </th>
                  {/* Created */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {isArabic ? 'تاريخ الإنشاء' : 'Created'}
                  </th>
                  {/* Actions */}
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    {isArabic ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => {
                  const isSelected = selectedTicketIds.has(ticket.id);
                  return (
                    <tr
                      key={ticket.id}
                      className={cn('hover:bg-gray-50 transition-colors', {
                        'bg-blue-50': isSelected,
                      })}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectTicket(ticket.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Ticket # */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {formatTicketNumber(ticket.ticket_number)}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {ticket.subject}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <StatusBadge variant="default" size="sm">
                          {TICKET_CATEGORY_LABELS[ticket.category]}
                        </StatusBadge>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <StatusBadge variant={ticket.priority} size="sm">
                          {TICKET_PRIORITY_LABELS[ticket.priority]}
                        </StatusBadge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            handleStatusChange(ticket.id, e.target.value as TicketStatus)
                          }
                          disabled={updateStatus.isPending}
                          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {(
                            [
                              'new',
                              'in_progress',
                              'waiting_user',
                              'resolved',
                              'closed',
                            ] as TicketStatus[]
                          ).map((status) => (
                            <option key={status} value={status}>
                              {TICKET_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Assigned */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {ticket.assigned_agent
                            ? `${ticket.assigned_agent.first_name} ${ticket.assigned_agent.last_name}`
                            : isArabic
                            ? 'غير محدد'
                            : 'Unassigned'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {getTimeElapsed(ticket.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewTicket(ticket.id)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                            title={isArabic ? 'عرض' : 'View'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

TicketQueue.displayName = 'TicketQueue';
