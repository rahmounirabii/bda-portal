import {
  Inbox,
  Clock,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTicketStats, useAllTickets } from '@/entities/support';
import type { TicketCategory, TicketPriority, TicketStatus } from '@/entities/support';
import { StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_MESSAGES,
  TICKET_MESSAGES_AR,
} from '@/shared/constants/ticket.constants';

/**
 * TicketDashboard Component
 *
 * Admin dashboard showing ticket statistics and metrics
 */

export interface TicketDashboardProps {
  /**
   * Show in Arabic
   */
  isArabic?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TicketDashboard = ({ isArabic = false, className }: TicketDashboardProps) => {
  // Fetch stats
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useTicketStats();

  // Fetch all tickets for detailed breakdown
  const { data: tickets, isLoading: isLoadingTickets } = useAllTickets();

  const messages = isArabic ? TICKET_MESSAGES_AR : TICKET_MESSAGES;

  // Calculate breakdowns
  const breakdown = {
    byStatus: {
      new: tickets?.filter((t) => t.status === 'new').length || 0,
      in_progress: tickets?.filter((t) => t.status === 'in_progress').length || 0,
      waiting_user: tickets?.filter((t) => t.status === 'waiting_user').length || 0,
      resolved: tickets?.filter((t) => t.status === 'resolved').length || 0,
      closed: tickets?.filter((t) => t.status === 'closed').length || 0,
    },
    byCategory: {
      certification: tickets?.filter((t) => t.category === 'certification').length || 0,
      exam: tickets?.filter((t) => t.category === 'exam').length || 0,
      pdc: tickets?.filter((t) => t.category === 'pdc').length || 0,
      account: tickets?.filter((t) => t.category === 'account').length || 0,
      partnership: tickets?.filter((t) => t.category === 'partnership').length || 0,
      technical: tickets?.filter((t) => t.category === 'technical').length || 0,
      other: tickets?.filter((t) => t.category === 'other').length || 0,
    },
    byPriority: {
      low: tickets?.filter((t) => t.priority === 'low').length || 0,
      normal: tickets?.filter((t) => t.priority === 'normal').length || 0,
      high: tickets?.filter((t) => t.priority === 'high').length || 0,
    },
  };

  // Loading state
  if (isLoadingStats || isLoadingTickets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">
            {isArabic ? 'جاري تحميل الإحصائيات...' : 'Loading statistics...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isErrorStats) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">
                {isArabic ? 'خطأ في تحميل الإحصائيات' : 'Error loading statistics'}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {errorStats instanceof Error ? errorStats.message : messages.ERROR.NETWORK_ERROR}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isArabic ? 'لوحة تحكم التذاكر' : 'Ticket Dashboard'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isArabic
            ? 'نظرة عامة على جميع تذاكر الدعم'
            : 'Overview of all support tickets'}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tickets */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'إجمالي التذاكر' : 'Total Tickets'}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Inbox className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'التذاكر المفتوحة' : 'Open Tickets'}
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {stats.new + stats.in_progress + stats.waiting_user}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'التذاكر المحلولة' : 'Resolved Tickets'}
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isArabic ? 'متوسط وقت الاستجابة' : 'Avg Response Time'}
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.avg_response_time_hours}
                <span className="text-lg text-gray-600">h</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
            {isArabic ? 'حسب الحالة' : 'By Status'}
          </h3>
          <div className="space-y-3">
            {(['new', 'in_progress', 'waiting_user', 'resolved', 'closed'] as TicketStatus[]).map(
              (status) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge variant={status} size="sm" withDot>
                      {TICKET_STATUS_LABELS[status]}
                    </StatusBadge>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {breakdown.byStatus[status]}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
            {isArabic ? 'حسب الأولوية' : 'By Priority'}
          </h3>
          <div className="space-y-3">
            {(['high', 'normal', 'low'] as TicketPriority[]).map((priority) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge variant={priority} size="sm">
                    {TICKET_PRIORITY_LABELS[priority]}
                  </StatusBadge>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {breakdown.byPriority[priority]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
          {isArabic ? 'حسب الفئة' : 'By Category'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
            <div key={category} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{breakdown.byCategory[category]}</p>
              <p className="text-xs text-gray-600 mt-1">
                {TICKET_CATEGORY_LABELS[category]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Response & Resolution Time */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
          {isArabic ? 'أوقات الأداء' : 'Performance Times'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avg Response Time */}
          <div className="text-center p-6 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-4xl font-bold text-purple-600">
              {stats.avg_response_time_hours.toFixed(1)}
              <span className="text-2xl text-purple-500">h</span>
            </p>
            <p className="text-sm text-purple-700 mt-2 font-medium">
              {isArabic ? 'متوسط وقت الاستجابة' : 'Avg Response Time'}
            </p>
          </div>

          {/* Avg Resolution Time */}
          <div className="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-4xl font-bold text-blue-600">
              {stats.avg_resolution_time_hours.toFixed(1)}
              <span className="text-2xl text-blue-500">h</span>
            </p>
            <p className="text-sm text-blue-700 mt-2 font-medium">
              {isArabic ? 'متوسط وقت الحل' : 'Avg Resolution Time'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

TicketDashboard.displayName = 'TicketDashboard';
