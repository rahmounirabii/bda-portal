import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Clock, MessageSquare, Ticket, Paperclip } from 'lucide-react';
import { useMyTickets } from '@/entities/support/ticket.hooks';
import type { TicketStatus, TicketCategory } from '@/entities/support/ticket.types';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_COLORS,
} from '@/entities/support/ticket.types';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * MyTickets Page
 *
 * Displays list of user's support tickets with filters and search
 */

// ============================================================================
// Translations
// ============================================================================

const translations = {
  en: {
    // Header
    title: 'My Support Tickets',
    subtitle: 'View and manage your support requests',
    newTicket: 'New Ticket',
    // Filters
    searchPlaceholder: 'Search tickets...',
    allStatuses: 'All Statuses',
    allCategories: 'All Categories',
    // Loading/Error/Empty
    loading: 'Loading tickets...',
    errorLoading: 'Error loading tickets. Please try again.',
    noTicketsFound: 'No tickets found',
    tryAdjustingFilters: 'Try adjusting your filters',
    noTicketsYet: "You haven't created any support tickets yet",
    createFirstTicket: 'Create Your First Ticket',
    // Ticket card
    updated: 'Updated',
    messages: 'messages',
    attachments: 'attachments',
    // Results count
    showingTickets: (count: number) => `Showing ${count} ticket${count !== 1 ? 's' : ''}`,
    // Status labels
    statusLabels: {
      open: 'Open',
      in_progress: 'In Progress',
      pending_user: 'Pending User',
      resolved: 'Resolved',
      closed: 'Closed',
    } as Record<TicketStatus, string>,
    // Category labels
    categoryLabels: {
      certification: 'Certification',
      membership: 'Membership',
      pdc: 'PDC',
      technical: 'Technical',
      billing: 'Billing',
      other: 'Other',
    } as Record<TicketCategory, string>,
  },
  ar: {
    // Header
    title: 'تذاكر الدعم الخاصة بي',
    subtitle: 'عرض وإدارة طلبات الدعم الخاصة بك',
    newTicket: 'تذكرة جديدة',
    // Filters
    searchPlaceholder: 'البحث في التذاكر...',
    allStatuses: 'جميع الحالات',
    allCategories: 'جميع الفئات',
    // Loading/Error/Empty
    loading: 'جارٍ تحميل التذاكر...',
    errorLoading: 'خطأ في تحميل التذاكر. يرجى المحاولة مرة أخرى.',
    noTicketsFound: 'لم يتم العثور على تذاكر',
    tryAdjustingFilters: 'حاول تعديل الفلاتر',
    noTicketsYet: 'لم تقم بإنشاء أي تذاكر دعم بعد',
    createFirstTicket: 'إنشاء أول تذكرة',
    // Ticket card
    updated: 'تم التحديث',
    messages: 'رسائل',
    attachments: 'مرفقات',
    // Results count
    showingTickets: (count: number) => `عرض ${count} تذكرة`,
    // Status labels
    statusLabels: {
      open: 'مفتوحة',
      in_progress: 'قيد التنفيذ',
      pending_user: 'في انتظار المستخدم',
      resolved: 'تم الحل',
      closed: 'مغلقة',
    } as Record<TicketStatus, string>,
    // Category labels
    categoryLabels: {
      certification: 'الشهادات',
      membership: 'العضوية',
      pdc: 'PDC',
      technical: 'تقني',
      billing: 'الفواتير',
      other: 'أخرى',
    } as Record<TicketCategory, string>,
  }
};

export default function MyTickets() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const texts = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');

  const { data, isLoading, error } = useMyTickets(
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchQuery || undefined,
    },
    { sort_by: 'updated_at', sort_order: 'desc' }
  );

  const tickets = data || [];

  // Get status badge variant
  const getStatusVariant = (status: TicketStatus): 'default' | 'success' | 'warning' | 'danger' => {
    const colorMap: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
      blue: 'default',
      green: 'success',
      yellow: 'warning',
      orange: 'warning',
      red: 'danger',
      gray: 'default',
    };
    const color = TICKET_STATUS_COLORS[status];
    return colorMap[color] || 'default';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Ticket className="h-8 w-8" />
                {texts.title}
              </h1>
              <p className="mt-2 opacity-90">{texts.subtitle}</p>
            </div>
            <button
              onClick={() => navigate('/support/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white font-medium text-royal-700 hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {texts.newTicket}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={texts.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">{texts.allStatuses}</option>
                {(Object.keys(texts.statusLabels) as TicketStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {texts.statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">{texts.allCategories}</option>
                {(Object.keys(texts.categoryLabels) as TicketCategory[]).map((category) => (
                  <option key={category} value={category}>
                    {texts.categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
              <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">{texts.loading}</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-red-800">{texts.errorLoading}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{texts.noTicketsFound}</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? texts.tryAdjustingFilters
                  : texts.noTicketsYet}
              </p>
              <button
                onClick={() => navigate('/support/new')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {texts.createFirstTicket}
              </button>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Ticket Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        #{ticket.ticket_number}
                      </span>
                      <StatusBadge variant={getStatusVariant(ticket.status)} size="sm">
                        {texts.statusLabels[ticket.status]}
                      </StatusBadge>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {ticket.subject}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {texts.updated} {formatDistanceToNow(new Date(ticket.updated_at), {
                            addSuffix: true,
                            locale: language === 'ar' ? ar : undefined
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{ticket.message_count || 0} {texts.messages}</span>
                      </div>
                      {ticket.attachment_count !== undefined && ticket.attachment_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-4 w-4" />
                          <span>{ticket.attachment_count} {texts.attachments}</span>
                        </div>
                      )}
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {texts.categoryLabels[ticket.category]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        {!isLoading && tickets.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {texts.showingTickets(tickets.length)}
          </div>
        )}
      </div>
    </div>
  );
}

MyTickets.displayName = 'MyTickets';
