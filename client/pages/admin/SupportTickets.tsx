import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, MessageSquare, User, AlertCircle, Paperclip } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllTickets, useTicketStats } from '@/entities/support/ticket.hooks';
import type { TicketStatus, TicketCategory, TicketPriority } from '@/entities/support/ticket.types';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
} from '@/entities/support/ticket.types';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * SupportTickets Page (Admin)
 *
 * Displays all support tickets with advanced filtering
 * Allows admins to view and manage all tickets
 */

export default function SupportTickets() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  const t = {
    en: {
      title: 'Support Tickets',
      description: 'Manage and respond to user support requests',
      total: 'Total',
      new: 'New',
      inProgress: 'In Progress',
      waitingUser: 'Waiting User',
      resolved: 'Resolved',
      searchPlaceholder: 'Search tickets...',
      allStatuses: 'All Statuses',
      allCategories: 'All Categories',
      allPriorities: 'All Priorities',
      loading: 'Loading tickets...',
      error: 'Error loading tickets. Please try again.',
      noTickets: 'No tickets found matching your filters',
      priority: 'Priority',
      updated: 'Updated',
      messages: 'messages',
      attachments: 'attachments',
      assigned: 'Assigned',
      showing: 'Showing',
      ticket: 'ticket',
      tickets: 'tickets',
      // Status labels
      statusNew: 'New',
      statusInProgress: 'In Progress',
      statusWaitingUser: 'Waiting for User',
      statusResolved: 'Resolved',
      statusClosed: 'Closed',
      // Category labels
      categoryGeneral: 'General Inquiry',
      categoryCertification: 'Certification',
      categoryMembership: 'Membership',
      categoryTechnical: 'Technical Issue',
      categoryBilling: 'Billing',
      categoryOther: 'Other',
      // Priority labels
      priorityLow: 'Low',
      priorityNormal: 'Normal',
      priorityHigh: 'High',
    },
    ar: {
      title: 'تذاكر الدعم',
      description: 'إدارة والرد على طلبات دعم المستخدمين',
      total: 'الإجمالي',
      new: 'جديد',
      inProgress: 'قيد التنفيذ',
      waitingUser: 'بانتظار المستخدم',
      resolved: 'تم الحل',
      searchPlaceholder: 'البحث في التذاكر...',
      allStatuses: 'جميع الحالات',
      allCategories: 'جميع الفئات',
      allPriorities: 'جميع الأولويات',
      loading: 'جارٍ تحميل التذاكر...',
      error: 'خطأ في تحميل التذاكر. يرجى المحاولة مرة أخرى.',
      noTickets: 'لم يتم العثور على تذاكر تطابق فلاترك',
      priority: 'الأولوية',
      updated: 'تم التحديث',
      messages: 'رسائل',
      attachments: 'مرفقات',
      assigned: 'مخصص لـ',
      showing: 'عرض',
      ticket: 'تذكرة',
      tickets: 'تذاكر',
      // Status labels
      statusNew: 'جديد',
      statusInProgress: 'قيد التنفيذ',
      statusWaitingUser: 'بانتظار المستخدم',
      statusResolved: 'تم الحل',
      statusClosed: 'مغلق',
      // Category labels
      categoryGeneral: 'استفسار عام',
      categoryCertification: 'الشهادات',
      categoryMembership: 'العضوية',
      categoryTechnical: 'مشكلة تقنية',
      categoryBilling: 'الفواتير',
      categoryOther: 'أخرى',
      // Priority labels
      priorityLow: 'منخفضة',
      priorityNormal: 'عادية',
      priorityHigh: 'عالية',
    }
  };

  const texts = t[language];

  // Translated status labels
  const statusLabels: Record<TicketStatus, string> = {
    new: texts.statusNew,
    in_progress: texts.statusInProgress,
    waiting_user: texts.statusWaitingUser,
    resolved: texts.statusResolved,
    closed: texts.statusClosed,
  };

  // Translated category labels
  const categoryLabels: Record<TicketCategory, string> = {
    general: texts.categoryGeneral,
    certification: texts.categoryCertification,
    membership: texts.categoryMembership,
    technical: texts.categoryTechnical,
    billing: texts.categoryBilling,
    other: texts.categoryOther,
  };

  // Translated priority labels
  const priorityLabels: Record<TicketPriority, string> = {
    low: texts.priorityLow,
    normal: texts.priorityNormal,
    high: texts.priorityHigh,
  };

  const { data: stats } = useTicketStats();
  const { data, isLoading, error } = useAllTickets(
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
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

  // Get priority color
  const getPriorityColor = (priority: TicketPriority): string => {
    const colors: Record<TicketPriority, string> = {
      low: 'text-gray-600',
      normal: 'text-blue-600',
      high: 'text-red-600',
    };
    return colors[priority];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageSquare className="h-8 w-8" />
                {texts.title}
              </h1>
              <p className="mt-2 opacity-90">{texts.description}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">{texts.total}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-blue-600 mb-1">{texts.new}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-yellow-600 mb-1">{texts.inProgress}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-orange-600 mb-1">{texts.waitingUser}</p>
              <p className="text-2xl font-bold text-orange-600">{stats.waiting_user}</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-green-600 mb-1">{texts.resolved}</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {(Object.keys(statusLabels) as TicketStatus[]).map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
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
                {(Object.keys(categoryLabels) as TicketCategory[]).map((value) => (
                  <option key={value} value={value}>
                    {categoryLabels[value]}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">{texts.allPriorities}</option>
                {(Object.keys(priorityLabels) as TicketPriority[]).map((value) => (
                  <option key={value} value={value}>
                    {priorityLabels[value]}
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
              <p className="text-red-800">{texts.error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
              <p className="text-gray-600">{texts.noTickets}</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/admin/support/${ticket.id}`)}
                className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Priority Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <AlertCircle
                      className={cn('h-5 w-5', getPriorityColor(ticket.priority))}
                    />
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        #{ticket.ticket_number}
                      </span>
                      <StatusBadge variant={getStatusVariant(ticket.status)} size="sm">
                        {statusLabels[ticket.status]}
                      </StatusBadge>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {categoryLabels[ticket.category]}
                      </span>
                      <span className={cn('text-xs font-medium', getPriorityColor(ticket.priority))}>
                        {priorityLabels[ticket.priority]} {texts.priority}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {ticket.user.first_name} {ticket.user.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {texts.updated} {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: language === 'ar' ? ar : undefined })}
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
                      {ticket.assigned_agent && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <User className="h-4 w-4" />
                          <span>
                            {texts.assigned}: {ticket.assigned_agent.first_name}{' '}
                            {ticket.assigned_agent.last_name}
                          </span>
                        </div>
                      )}
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
            {texts.showing} {tickets.length} {tickets.length !== 1 ? texts.tickets : texts.ticket}
          </div>
        )}
      </div>
    </div>
  );
}

SupportTickets.displayName = 'SupportTickets';
