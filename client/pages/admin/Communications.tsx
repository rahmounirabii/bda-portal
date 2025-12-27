/**
 * Communications Admin Page
 *
 * Admin dashboard for managing email queue and notifications
 * Requirements: Admin Panel - Communications Management
 */

import { useState } from 'react';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Trash2,
  Bell,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailService } from '@/entities/email';
import type { EmailStatus, EmailTemplateName } from '@/entities/email/email.types';

// ============================================================================
// Types
// ============================================================================

type TabType = 'overview' | 'queue' | 'templates';

// ============================================================================
// Hooks
// ============================================================================

function useEmailQueue(filters?: { status?: EmailStatus; template_name?: EmailTemplateName; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'email-queue', filters],
    queryFn: async () => {
      const result = await EmailService.getEmailQueue(filters);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

function useEmailStatistics() {
  return useQuery({
    queryKey: ['admin', 'email-statistics'],
    queryFn: async () => {
      const result = await EmailService.getEmailStatistics();
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================================
// Component
// ============================================================================

export default function Communications() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const [templateFilter, setTemplateFilter] = useState<EmailTemplateName | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // Data
  const { data: emails, isLoading: emailsLoading, refetch: refetchEmails } = useEmailQueue({
    status: statusFilter === 'all' ? undefined : statusFilter,
    template_name: templateFilter === 'all' ? undefined : templateFilter,
    limit: 100,
  });
  const { data: stats, isLoading: statsLoading } = useEmailStatistics();

  // Filter emails by search
  const filteredEmails = emails?.filter(email => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      email.recipient_email?.toLowerCase().includes(search) ||
      email.recipient_name?.toLowerCase().includes(search) ||
      email.subject?.toLowerCase().includes(search)
    );
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: EmailStatus }) => {
    const styles: Record<EmailStatus, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      sent: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      retrying: { bg: 'bg-orange-100', text: 'text-orange-800', icon: RotateCcw },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Template badge component
  const TemplateBadge = ({ template }: { template: string }) => {
    const templates: Record<string, { label: string; color: string }> = {
      booking_confirmation: { label: 'Booking Confirmation', color: 'bg-blue-100 text-blue-800' },
      exam_reminder_48h: { label: '48h Reminder', color: 'bg-purple-100 text-purple-800' },
      exam_reminder_24h: { label: '24h Reminder', color: 'bg-indigo-100 text-indigo-800' },
    };

    const config = templates[template] || { label: template, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{isRTL ? 'قيد الانتظار' : 'Pending'}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isRTL ? 'رسائل في انتظار الإرسال' : 'Emails waiting to be sent'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{isRTL ? 'تم الإرسال' : 'Sent'}</p>
              <p className="text-2xl font-bold text-green-600">{stats?.sent || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isRTL ? 'رسائل تم إرسالها بنجاح' : 'Successfully delivered emails'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{isRTL ? 'فشل' : 'Failed'}</p>
              <p className="text-2xl font-bold text-red-600">{stats?.failed || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isRTL ? 'رسائل فشلت في الإرسال' : 'Emails that failed to send'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{isRTL ? 'إعادة المحاولة' : 'Retrying'}</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.retrying || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isRTL ? 'رسائل قيد إعادة المحاولة' : 'Emails being retried'}
          </p>
        </div>
      </div>

      {/* Success Rate Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isRTL ? 'معدل النجاح' : 'Delivery Success Rate'}
          </h3>
          {stats && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#22c55e"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${((stats.sent / ((stats.sent + stats.failed) || 1)) * 440)} 440`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {((stats.sent + stats.failed) > 0
                          ? Math.round((stats.sent / (stats.sent + stats.failed)) * 100)
                          : 100
                        )}%
                      </p>
                      <p className="text-xs text-gray-500">{isRTL ? 'معدل النجاح' : 'Success Rate'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600">{isRTL ? 'نجح' : 'Delivered'}: {stats.sent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-600">{isRTL ? 'فشل' : 'Failed'}: {stats.failed}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isRTL ? 'القوالب الأكثر استخداماً' : 'Most Used Templates'}
          </h3>
          <div className="space-y-4">
            {[
              { template: 'booking_confirmation', label: isRTL ? 'تأكيد الحجز' : 'Booking Confirmation', color: 'bg-blue-500' },
              { template: 'exam_reminder_48h', label: isRTL ? 'تذكير 48 ساعة' : '48h Reminder', color: 'bg-purple-500' },
              { template: 'exam_reminder_24h', label: isRTL ? 'تذكير 24 ساعة' : '24h Reminder', color: 'bg-indigo-500' },
            ].map((item, index) => {
              const count = emails?.filter(e => e.template_name === item.template).length || 0;
              const total = emails?.length || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={item.template} className="flex items-center gap-4">
                  <div className="w-40 text-sm text-gray-600">{item.label}</div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm font-medium text-gray-900 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Emails */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isRTL ? 'أحدث الرسائل' : 'Recent Emails'}
          </h3>
          <button
            onClick={() => setActiveTab('queue')}
            className="text-sm text-royal-600 hover:text-royal-700"
          >
            {isRTL ? 'عرض الكل' : 'View All'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  {isRTL ? 'المستلم' : 'Recipient'}
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  {isRTL ? 'القالب' : 'Template'}
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  {isRTL ? 'الحالة' : 'Status'}
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                  {isRTL ? 'التاريخ' : 'Date'}
                </th>
              </tr>
            </thead>
            <tbody>
              {emails?.slice(0, 5).map((email) => (
                <tr key={email.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{email.recipient_name || '-'}</p>
                      <p className="text-xs text-gray-500">{email.recipient_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <TemplateBadge template={email.template_name} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={email.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(email.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!emails || emails.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    {isRTL ? 'لا توجد رسائل' : 'No emails found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Queue Tab
  const renderQueue = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث بالبريد الإلكتروني...' : 'Search by email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-royal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EmailStatus | 'all')}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-500"
            >
              <option value="all">{isRTL ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="pending">{isRTL ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="sent">{isRTL ? 'تم الإرسال' : 'Sent'}</option>
              <option value="failed">{isRTL ? 'فشل' : 'Failed'}</option>
              <option value="retrying">{isRTL ? 'إعادة المحاولة' : 'Retrying'}</option>
            </select>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value as EmailTemplateName | 'all')}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-500"
            >
              <option value="all">{isRTL ? 'كل القوالب' : 'All Templates'}</option>
              <option value="booking_confirmation">{isRTL ? 'تأكيد الحجز' : 'Booking Confirmation'}</option>
              <option value="exam_reminder_48h">{isRTL ? 'تذكير 48 ساعة' : '48h Reminder'}</option>
              <option value="exam_reminder_24h">{isRTL ? 'تذكير 24 ساعة' : '24h Reminder'}</option>
            </select>
            <button
              onClick={() => refetchEmails()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title={isRTL ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Queue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {emailsLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-royal-600 mx-auto mb-2" />
            <p className="text-gray-500">{isRTL ? 'جاري التحميل...' : 'Loading emails...'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'المستلم' : 'Recipient'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'الموضوع' : 'Subject'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'القالب' : 'Template'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'المحاولات' : 'Attempts'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'مجدول' : 'Scheduled'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    {isRTL ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails?.map((email) => (
                  <tr key={email.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {email.recipient_name || '-'}
                          </p>
                          <p className="text-xs text-gray-500">{email.recipient_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate">{email.subject || '-'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <TemplateBadge template={email.template_name} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {email.attempts} / {email.max_attempts}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(email.scheduled_for).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="p-2 text-gray-600 hover:text-royal-600 hover:bg-royal-50 rounded-lg"
                        title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!filteredEmails || filteredEmails.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{isRTL ? 'لا توجد رسائل' : 'No emails found'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Details Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isRTL ? 'تفاصيل البريد الإلكتروني' : 'Email Details'}
                </h3>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Recipient Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{isRTL ? 'المستلم' : 'Recipient'}</p>
                  <p className="font-medium text-gray-900">{selectedEmail.recipient_name || '-'}</p>
                  <p className="text-sm text-gray-600">{selectedEmail.recipient_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isRTL ? 'الحالة' : 'Status'}</p>
                  <StatusBadge status={selectedEmail.status} />
                </div>
              </div>

              {/* Email Info */}
              <div>
                <p className="text-sm text-gray-500 mb-1">{isRTL ? 'الموضوع' : 'Subject'}</p>
                <p className="text-gray-900">{selectedEmail.subject || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{isRTL ? 'القالب' : 'Template'}</p>
                  <TemplateBadge template={selectedEmail.template_name} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isRTL ? 'الأولوية' : 'Priority'}</p>
                  <p className="font-medium text-gray-900">{selectedEmail.priority}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{isRTL ? 'المحاولات' : 'Attempts'}</p>
                  <p className="font-medium text-gray-900">
                    {selectedEmail.attempts} / {selectedEmail.max_attempts}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{isRTL ? 'مجدول في' : 'Scheduled For'}</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedEmail.scheduled_for).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Template Data */}
              {selectedEmail.template_data && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">{isRTL ? 'بيانات القالب' : 'Template Data'}</p>
                  <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedEmail.template_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedEmail.error_message && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">{isRTL ? 'رسالة الخطأ' : 'Error Message'}</span>
                  </div>
                  <p className="text-sm text-red-600">{selectedEmail.error_message}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{isRTL ? 'تاريخ الإنشاء' : 'Created'}</p>
                  <p className="text-gray-900">{new Date(selectedEmail.created_at).toLocaleString()}</p>
                </div>
                {selectedEmail.sent_at && (
                  <div>
                    <p className="text-gray-500">{isRTL ? 'تاريخ الإرسال' : 'Sent'}</p>
                    <p className="text-gray-900">{new Date(selectedEmail.sent_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedEmail.last_attempt_at && (
                  <div>
                    <p className="text-gray-500">{isRTL ? 'آخر محاولة' : 'Last Attempt'}</p>
                    <p className="text-gray-900">{new Date(selectedEmail.last_attempt_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isRTL ? 'الاتصالات' : 'Communications'}
        </h1>
        <p className="text-gray-600">
          {isRTL
            ? 'إدارة البريد الإلكتروني والإشعارات'
            : 'Manage email queue and notifications'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: TrendingUp },
            { id: 'queue', label: isRTL ? 'قائمة الانتظار' : 'Email Queue', icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-royal-600 text-royal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'queue' && renderQueue()}
    </div>
  );
}
