/**
 * Security & Logs Admin Page
 *
 * Comprehensive security monitoring and audit log viewing
 * Features:
 * - Real-time audit log viewer with filtering
 * - Suspicious activity alerts
 * - Security statistics dashboard
 * - User activity tracking
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/shared/config/supabase.config';
import {
  AuditLog,
  AuditEventType,
  SecurityLevel,
  AUDIT_EVENT_LABELS,
  SECURITY_LEVEL_LABELS,
  SECURITY_LEVEL_COLORS,
} from '@/entities/audit/audit.types';
import { getSuspiciousActivities, getUserAuditHistory } from '@/entities/audit/audit.service';
import {
  Shield,
  AlertTriangle,
  Eye,
  Activity,
  Clock,
  User,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Globe,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================================================
// Types
// ============================================================================

interface SecurityStats {
  totalEvents: number;
  suspiciousEvents: number;
  criticalEvents: number;
  loginAttempts: number;
  failedLogins: number;
  activeUsers24h: number;
}

// ============================================================================
// Component
// ============================================================================

export default function SecurityLogs() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'alerts'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [securityLevelFilter, setSecurityLevelFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch all audit logs
  const { data: auditLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      // Using raw supabase call since RPC may not be set up
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('event_timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }
      return data as AuditLog[];
    },
    staleTime: 30000,
  });

  // Fetch suspicious activities
  const { data: suspiciousActivities, isLoading: alertsLoading } = useQuery({
    queryKey: ['suspicious-activities'],
    queryFn: async () => {
      const result = await getSuspiciousActivities(100, 0);
      return result.data || [];
    },
    staleTime: 30000,
  });

  // Calculate security stats
  const securityStats: SecurityStats = {
    totalEvents: auditLogs?.length || 0,
    suspiciousEvents: auditLogs?.filter(log => log.flagged_as_suspicious).length || 0,
    criticalEvents: auditLogs?.filter(log => log.security_level === 'critical').length || 0,
    loginAttempts: auditLogs?.filter(log => log.event_type === 'user_login').length || 0,
    failedLogins: auditLogs?.filter(log =>
      log.event_type === 'user_login' && !log.success
    ).length || 0,
    activeUsers24h: new Set(
      auditLogs
        ?.filter(log => {
          const logDate = new Date(log.event_timestamp);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return logDate > dayAgo;
        })
        .map(log => log.user_id)
        .filter(Boolean)
    ).size,
  };

  // Filter logs
  const filteredLogs = auditLogs?.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.description?.toLowerCase().includes(query) ||
        log.actor_email?.toLowerCase().includes(query) ||
        log.event_type?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (eventTypeFilter !== 'all' && log.event_type !== eventTypeFilter) {
      return false;
    }

    if (securityLevelFilter !== 'all' && log.security_level !== securityLevelFilter) {
      return false;
    }

    return true;
  }) || [];

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(auditLogs?.map(log => log.event_type) || []));

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get event icon
  const getEventIcon = (eventType: AuditEventType) => {
    if (eventType.includes('login') || eventType.includes('logout')) {
      return User;
    }
    if (eventType.includes('exam')) {
      return FileText;
    }
    if (eventType.includes('suspicious') || eventType.includes('violation')) {
      return AlertTriangle;
    }
    if (eventType.includes('certificate')) {
      return CheckCircle;
    }
    if (eventType.includes('admin')) {
      return Shield;
    }
    return Activity;
  };

  // Export logs to CSV
  const exportToCSV = () => {
    if (!filteredLogs.length) return;

    const headers = [
      'Timestamp',
      'Event Type',
      'Description',
      'User Email',
      'Security Level',
      'IP Address',
      'Success',
    ];

    const rows = filteredLogs.map(log => [
      log.event_timestamp,
      log.event_type,
      log.description,
      log.actor_email || 'N/A',
      log.security_level,
      log.ip_address || 'N/A',
      log.success ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderStatCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    color: string,
    subtitle?: string
  ) => (
    <div className={`bg-white rounded-lg border p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-4', 'bg-opacity-10')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderLogRow = (log: AuditLog) => {
    const EventIcon = getEventIcon(log.event_type);
    const levelColor = SECURITY_LEVEL_COLORS[log.security_level] || 'bg-gray-100 text-gray-700';

    return (
      <tr
        key={log.id}
        className={`hover:bg-gray-50 cursor-pointer ${log.flagged_as_suspicious ? 'bg-red-50' : ''}`}
        onClick={() => setSelectedLog(log)}
      >
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          {formatTimestamp(log.event_timestamp)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <EventIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">
              {AUDIT_EVENT_LABELS[log.event_type] || log.event_type}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
          {log.description}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {log.actor_email || '-'}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelColor}`}>
            {SECURITY_LEVEL_LABELS[log.security_level]}
          </span>
        </td>
        <td className="px-4 py-3">
          {log.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </td>
        <td className="px-4 py-3">
          {log.flagged_as_suspicious && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </td>
      </tr>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            {isRTL ? 'الأمان والسجلات' : 'Security & Logs'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isRTL
              ? 'مراقبة نشاط النظام وسجلات التدقيق'
              : 'Monitor system activity and audit logs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLogs()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={!filteredLogs.length}
          >
            <Download className="h-4 w-4 mr-2" />
            {isRTL ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: Activity },
            { id: 'logs', label: isRTL ? 'سجلات التدقيق' : 'Audit Logs', icon: FileText },
            { id: 'alerts', label: isRTL ? 'التنبيهات' : 'Alerts', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'alerts' && suspiciousActivities && suspiciousActivities.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {suspiciousActivities.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderStatCard(
              isRTL ? 'إجمالي الأحداث' : 'Total Events',
              securityStats.totalEvents,
              <Activity className="h-6 w-6 text-blue-600" />,
              'border-l-4 border-blue-500'
            )}
            {renderStatCard(
              isRTL ? 'أنشطة مشبوهة' : 'Suspicious Activities',
              securityStats.suspiciousEvents,
              <AlertTriangle className="h-6 w-6 text-red-600" />,
              'border-l-4 border-red-500'
            )}
            {renderStatCard(
              isRTL ? 'أحداث حرجة' : 'Critical Events',
              securityStats.criticalEvents,
              <AlertCircle className="h-6 w-6 text-orange-600" />,
              'border-l-4 border-orange-500'
            )}
            {renderStatCard(
              isRTL ? 'محاولات تسجيل الدخول' : 'Login Attempts',
              securityStats.loginAttempts,
              <User className="h-6 w-6 text-green-600" />,
              'border-l-4 border-green-500',
              `${securityStats.failedLogins} ${isRTL ? 'فاشلة' : 'failed'}`
            )}
            {renderStatCard(
              isRTL ? 'المستخدمون النشطون (24 ساعة)' : 'Active Users (24h)',
              securityStats.activeUsers24h,
              <Globe className="h-6 w-6 text-purple-600" />,
              'border-l-4 border-purple-500'
            )}
            {renderStatCard(
              isRTL ? 'معدل النجاح' : 'Success Rate',
              auditLogs?.length
                ? Math.round((auditLogs.filter(l => l.success).length / auditLogs.length) * 100)
                : 0,
              <CheckCircle className="h-6 w-6 text-emerald-600" />,
              'border-l-4 border-emerald-500',
              '%'
            )}
          </div>

          {/* Recent Critical Events */}
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {isRTL ? 'الأحداث الحرجة الأخيرة' : 'Recent Critical Events'}
              </h3>
            </div>
            <div className="p-4">
              {auditLogs?.filter(log => log.security_level === 'critical' || log.security_level === 'high').slice(0, 5).length ? (
                <div className="space-y-3">
                  {auditLogs
                    .filter(log => log.security_level === 'critical' || log.security_level === 'high')
                    .slice(0, 5)
                    .map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            log.security_level === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                          }`}>
                            <AlertTriangle className={`h-4 w-4 ${
                              log.security_level === 'critical' ? 'text-red-600' : 'text-orange-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {AUDIT_EVENT_LABELS[log.event_type] || log.event_type}
                            </p>
                            <p className="text-sm text-gray-500">{log.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatTimestamp(log.event_timestamp)}
                          </p>
                          <p className="text-xs text-gray-400">{log.actor_email || 'System'}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  {isRTL ? 'لا توجد أحداث حرجة حديثة' : 'No recent critical events'}
                </p>
              )}
            </div>
          </div>

          {/* Security Level Distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {isRTL ? 'توزيع مستوى الأمان' : 'Security Level Distribution'}
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {(['low', 'normal', 'high', 'critical'] as SecurityLevel[]).map(level => {
                const count = auditLogs?.filter(log => log.security_level === level).length || 0;
                const percentage = auditLogs?.length
                  ? Math.round((count / auditLogs.length) * 100)
                  : 0;

                return (
                  <div key={level} className="text-center">
                    <div className={`text-3xl font-bold ${
                      level === 'critical' ? 'text-red-600' :
                      level === 'high' ? 'text-orange-600' :
                      level === 'normal' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{level}</div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          level === 'critical' ? 'bg-red-500' :
                          level === 'high' ? 'bg-orange-500' :
                          level === 'normal' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isRTL ? 'البحث في السجلات...' : 'Search logs...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isRTL ? 'نوع الحدث' : 'Event Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {AUDIT_EVENT_LABELS[type as AuditEventType] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={securityLevelFilter} onValueChange={setSecurityLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRTL ? 'مستوى الأمان' : 'Security Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'جميع المستويات' : 'All Levels'}</SelectItem>
                {(['low', 'normal', 'high', 'critical'] as SecurityLevel[]).map(level => (
                  <SelectItem key={level} value={level}>
                    {SECURITY_LEVEL_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || eventTypeFilter !== 'all' || securityLevelFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setEventTypeFilter('all');
                  setSecurityLevelFilter('all');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                {isRTL ? 'مسح' : 'Clear'}
              </Button>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'الوقت' : 'Timestamp'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'الحدث' : 'Event'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'الوصف' : 'Description'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'المستخدم' : 'User'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'المستوى' : 'Level'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'النتيجة' : 'Status'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {isRTL ? 'تنبيه' : 'Alert'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">
                          {isRTL ? 'جاري التحميل...' : 'Loading...'}
                        </p>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        {isRTL ? 'لا توجد سجلات' : 'No logs found'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.slice(0, 100).map(log => renderLogRow(log))
                  )}
                </tbody>
              </table>
            </div>
            {filteredLogs.length > 100 && (
              <div className="px-4 py-3 bg-gray-50 border-t text-center text-sm text-gray-500">
                {isRTL
                  ? `يظهر 100 من ${filteredLogs.length} سجل`
                  : `Showing 100 of ${filteredLogs.length} logs`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {isRTL ? 'الأنشطة المشبوهة' : 'Suspicious Activities'}
              </h3>
              <span className="text-sm text-gray-500">
                {suspiciousActivities?.length || 0} {isRTL ? 'تنبيه' : 'alerts'}
              </span>
            </div>

            {alertsLoading ? (
              <div className="p-12 text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : suspiciousActivities && suspiciousActivities.length > 0 ? (
              <div className="divide-y">
                {suspiciousActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLog(activity)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        activity.security_level === 'critical'
                          ? 'bg-red-100'
                          : 'bg-orange-100'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 ${
                          activity.security_level === 'critical'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {AUDIT_EVENT_LABELS[activity.event_type] || activity.event_type}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            SECURITY_LEVEL_COLORS[activity.security_level]
                          }`}>
                            {SECURITY_LEVEL_LABELS[activity.security_level]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.event_timestamp)}
                          </span>
                          {activity.actor_email && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.actor_email}
                            </span>
                          )}
                          {activity.ip_address && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {activity.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <h4 className="mt-4 font-medium text-gray-900">
                  {isRTL ? 'لا توجد أنشطة مشبوهة' : 'No Suspicious Activities'}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {isRTL
                    ? 'جميع الأنشطة طبيعية'
                    : 'All system activities appear normal'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              {isRTL ? 'تفاصيل السجل' : 'Log Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedLog.flagged_as_suspicious
                  ? 'bg-red-50 border border-red-200'
                  : selectedLog.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedLog.flagged_as_suspicious ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : selectedLog.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {selectedLog.flagged_as_suspicious
                      ? (isRTL ? 'نشاط مشبوه' : 'Suspicious Activity')
                      : selectedLog.success
                        ? (isRTL ? 'عملية ناجحة' : 'Successful Operation')
                        : (isRTL ? 'عملية فاشلة' : 'Failed Operation')}
                  </span>
                </div>
              </div>

              {/* Event Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">{isRTL ? 'نوع الحدث' : 'Event Type'}</label>
                  <p className="font-medium">{AUDIT_EVENT_LABELS[selectedLog.event_type] || selectedLog.event_type}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">{isRTL ? 'الوقت' : 'Timestamp'}</label>
                  <p className="font-medium">{formatTimestamp(selectedLog.event_timestamp)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">{isRTL ? 'مستوى الأمان' : 'Security Level'}</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    SECURITY_LEVEL_COLORS[selectedLog.security_level]
                  }`}>
                    {SECURITY_LEVEL_LABELS[selectedLog.security_level]}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">{isRTL ? 'البريد الإلكتروني' : 'User Email'}</label>
                  <p className="font-medium">{selectedLog.actor_email || '-'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 uppercase">{isRTL ? 'الوصف' : 'Description'}</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLog.description}</p>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLog.ip_address && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">{isRTL ? 'عنوان IP' : 'IP Address'}</label>
                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 uppercase">{isRTL ? 'المتصفح' : 'User Agent'}</label>
                    <p className="font-mono text-xs mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>

              {/* Event Details */}
              {selectedLog.event_details && Object.keys(selectedLog.event_details).length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">{isRTL ? 'تفاصيل إضافية' : 'Additional Details'}</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.event_details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.error_message && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">{isRTL ? 'رسالة الخطأ' : 'Error Message'}</label>
                  <p className="mt-1 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
