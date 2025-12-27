import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, Inbox, X } from 'lucide-react';
import { useMyTickets } from '@/entities/support';
import { TicketCard, TicketCardSkeleton } from './TicketCard';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import type { TicketStatus, TicketCategory, TicketPriority, TicketFilters } from '@/entities/support';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
  TICKET_SORT_OPTIONS,
} from '@/shared/constants/ticket.constants';
import { ROUTES } from '@/shared/constants/routes';

/**
 * TicketList Component
 *
 * Displays a filterable, searchable list of user's support tickets
 * Handles loading, error, and empty states
 */

export interface TicketListProps {
  /**
   * Whether to show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Compact grid mode
   */
  compact?: boolean;
}

export const TicketList = ({
  isArabic = false,
  className,
  compact = false,
}: TicketListProps) => {
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<TicketFilters>({
    status: undefined,
    category: undefined,
    priority: undefined,
    search: undefined,
  });

  // Sort state
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'priority' | 'status'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Local search
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tickets with filters
  const { data: tickets, isLoading, isError, error } = useMyTickets(filters, {
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Client-side search filter
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

  // Handle ticket click
  const handleTicketClick = (ticketId: string) => {
    navigate(ROUTES.SUPPORT.TICKET_DETAIL.replace(':id', ticketId));
  };

  // Handle filter toggles
  const toggleStatusFilter = (status: TicketStatus) => {
    setFilters((prev) => {
      const currentStatuses = Array.isArray(prev.status) ? prev.status : prev.status ? [prev.status] : [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];

      return {
        ...prev,
        status: newStatuses.length > 0 ? newStatuses : undefined,
      };
    });
  };

  const toggleCategoryFilter = (category: TicketCategory) => {
    setFilters((prev) => {
      const currentCategories = Array.isArray(prev.category) ? prev.category : prev.category ? [prev.category] : [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];

      return {
        ...prev,
        category: newCategories.length > 0 ? newCategories : undefined,
      };
    });
  };

  const togglePriorityFilter = (priority: TicketPriority) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority === priority ? undefined : priority,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: undefined,
      category: undefined,
      priority: undefined,
      search: undefined,
    });
    setSearchTerm('');
  };

  // Check if filters are active
  const hasActiveFilters = Boolean(
    filters.status || filters.category || filters.priority || searchTerm
  );

  // Get active filter count
  const activeFilterCount = [
    Array.isArray(filters.status) ? filters.status.length : filters.status ? 1 : 0,
    Array.isArray(filters.category) ? filters.category.length : filters.category ? 1 : 0,
    filters.priority ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Search */}
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
                ? 'ابحث عن التذاكر...'
                : 'Search tickets by number, subject, or description...'
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

        {/* Filters Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            <span>{isArabic ? 'تصفية' : 'Filter'}:</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {TICKET_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {isArabic ? option.labelAr : option.label}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 transition-colors"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

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

        {/* Status Filters */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {isArabic ? 'الحالة' : 'Status'}
          </span>
          <div className="flex flex-wrap gap-2">
            {(['new', 'in_progress', 'waiting_user', 'resolved', 'closed'] as TicketStatus[]).map((status) => {
              const isActive = Array.isArray(filters.status) && filters.status.includes(status);
              return (
                <StatusBadge
                  key={status}
                  variant={isActive ? status : 'default'}
                  onClick={() => toggleStatusFilter(status)}
                  className={cn('cursor-pointer transition-all', {
                    'ring-2 ring-blue-500 ring-offset-2': isActive,
                  })}
                  role="button"
                  tabIndex={0}
                >
                  {TICKET_STATUS_LABELS[status]}
                </StatusBadge>
              );
            })}
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {isArabic ? 'الفئة' : 'Category'}
          </span>
          <div className="flex flex-wrap gap-2">
            {(['certification', 'exam', 'pdc', 'account', 'partnership', 'technical', 'other'] as TicketCategory[]).map((category) => {
              const isActive = Array.isArray(filters.category) && filters.category.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategoryFilter(category)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all border',
                    {
                      'bg-blue-600 text-white border-blue-600': isActive,
                      'bg-white text-gray-700 border-gray-300 hover:border-blue-500': !isActive,
                    }
                  )}
                >
                  {TICKET_CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filters */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {isArabic ? 'الأولوية' : 'Priority'}
          </span>
          <div className="flex gap-2">
            {(['low', 'normal', 'high'] as TicketPriority[]).map((priority) => {
              const isActive = filters.priority === priority;
              return (
                <StatusBadge
                  key={priority}
                  variant={isActive ? priority : 'default'}
                  onClick={() => togglePriorityFilter(priority)}
                  className={cn('cursor-pointer transition-all', {
                    'ring-2 ring-blue-500 ring-offset-2': isActive,
                  })}
                  role="button"
                  tabIndex={0}
                >
                  {TICKET_PRIORITY_LABELS[priority]}
                </StatusBadge>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && filteredTickets && (
          <p className="text-sm text-gray-600">
            {isArabic
              ? `${filteredTickets.length} تذكرة${filteredTickets.length !== 1 ? '' : ''}`
              : `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className={cn('grid gap-4', {
            'grid-cols-1 lg:grid-cols-2': !compact,
            'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3': compact,
          })}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <TicketCardSkeleton key={i} compact={compact} />
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
                {isArabic ? 'خطأ في تحميل التذاكر' : 'Error loading tickets'}
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
              : messages.INFO.NO_TICKETS}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {isArabic ? 'مسح البحث والفلاتر' : 'Clear search and filters'}
            </button>
          ) : (
            <button
              onClick={() => navigate(ROUTES.SUPPORT.CREATE_TICKET)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {isArabic ? 'إنشاء تذكرة جديدة' : 'Create your first ticket'}
            </button>
          )}
        </div>
      )}

      {/* Ticket Grid */}
      {!isLoading && !isError && filteredTickets && filteredTickets.length > 0 && (
        <div
          className={cn('grid gap-4', {
            'grid-cols-1 lg:grid-cols-2': !compact,
            'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3': compact,
          })}
        >
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onTicketClick={handleTicketClick}
              isArabic={isArabic}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

TicketList.displayName = 'TicketList';
