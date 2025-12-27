/**
 * Reports & Analytics Admin Page
 *
 * Admin dashboard for viewing system-wide analytics and reports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/shared/config/supabase.config';
import {
  BarChart3,
  Users,
  Award,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileCheck,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Building2,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// Stats Hook
// ============================================================================

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCertifications: number;
  activeCertifications: number;
  totalExamAttempts: number;
  passRate: number;
  upcomingExams: number;
  completedToday: number;
  totalECPs: number;
  totalPDPs: number;
  pendingVerifications: number;
  totalPDCs: number;
}

function useDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Helper to safely get count with fallback
      const safeCount = async (query: Promise<any>): Promise<number> => {
        try {
          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        } catch {
          return 0;
        }
      };

      // Get user counts
      const totalUsers = await safeCount(
        supabase.from('users').select('*', { count: 'exact', head: true })
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = await safeCount(
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_login_at', thirtyDaysAgo.toISOString())
      );

      // Get certification counts
      const totalCertifications = await safeCount(
        supabase.from('user_certifications').select('*', { count: 'exact', head: true })
      );

      const activeCertifications = await safeCount(
        supabase
          .from('user_certifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
      );

      // Get exam attempts
      let totalExamAttempts = 0;
      let passedAttempts = 0;
      let passRate = 0;

      try {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('passed')
          .eq('exam_type', 'certification');

        totalExamAttempts = attempts?.length || 0;
        passedAttempts = attempts?.filter((a: any) => a.passed).length || 0;
        passRate = totalExamAttempts > 0 ? Math.round((passedAttempts / totalExamAttempts) * 100) : 0;
      } catch {
        // Ignore errors
      }

      // Get upcoming exams
      const upcomingExams = await safeCount(
        (supabase as any)
          .from('exam_bookings')
          .select('*', { count: 'exact', head: true })
          .in('status', ['scheduled', 'rescheduled'])
          .gte('scheduled_start_time', now.toISOString())
      );

      // Get completed today
      const completedToday = await safeCount(
        supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .gte('completed_at', todayStart.toISOString())
          .not('completed_at', 'is', null)
      );

      // Get partner counts
      const totalECPs = await safeCount(
        (supabase as any)
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'ecp')
      );

      const totalPDPs = await safeCount(
        (supabase as any)
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'pdp')
      );

      // Get pending verifications
      const pendingVerifications = await safeCount(
        (supabase as any)
          .from('identity_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      );

      // PDC credits - Table doesn't exist yet, return 0
      const totalPDCs = 0;

      return {
        totalUsers,
        activeUsers,
        totalCertifications,
        activeCertifications,
        totalExamAttempts,
        passRate,
        upcomingExams,
        completedToday,
        totalECPs,
        totalPDPs,
        pendingVerifications,
        totalPDCs,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// ============================================================================
// PDF Export Function
// ============================================================================

function exportToPDF(stats: DashboardStats | undefined, isRTL: boolean) {
  if (!stats) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(isRTL ? 'تقرير التحليلات' : 'Analytics Report', margin, 20);

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`${isRTL ? 'التاريخ' : 'Date'}: ${dateStr}`, margin, 28);

  let yPos = 40;

  // Users Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isRTL ? 'المستخدمون' : 'Users', margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [[isRTL ? 'المقياس' : 'Metric', isRTL ? 'القيمة' : 'Value']],
    body: [
      [isRTL ? 'إجمالي المستخدمين' : 'Total Users', stats.totalUsers.toLocaleString()],
      [
        isRTL ? 'المستخدمون النشطون (30 يوم)' : 'Active Users (30 days)',
        `${stats.activeUsers.toLocaleString()} (${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%)`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Certifications Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isRTL ? 'الشهادات' : 'Certifications', margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [[isRTL ? 'المقياس' : 'Metric', isRTL ? 'القيمة' : 'Value']],
    body: [
      [isRTL ? 'إجمالي الشهادات' : 'Total Certifications', stats.totalCertifications.toLocaleString()],
      [isRTL ? 'الشهادات النشطة' : 'Active Certifications', stats.activeCertifications.toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Exams Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isRTL ? 'الامتحانات' : 'Exams', margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [[isRTL ? 'المقياس' : 'Metric', isRTL ? 'القيمة' : 'Value']],
    body: [
      [isRTL ? 'إجمالي المحاولات' : 'Total Attempts', stats.totalExamAttempts.toLocaleString()],
      [isRTL ? 'معدل النجاح' : 'Pass Rate', `${stats.passRate}%`],
      [isRTL ? 'الامتحانات القادمة' : 'Upcoming Exams', stats.upcomingExams.toLocaleString()],
      [isRTL ? 'مكتمل اليوم' : 'Completed Today', stats.completedToday.toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Partners Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isRTL ? 'الشركاء' : 'Partners', margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [[isRTL ? 'المقياس' : 'Metric', isRTL ? 'القيمة' : 'Value']],
    body: [
      [isRTL ? 'شركاء ECP' : 'ECP Partners', stats.totalECPs.toLocaleString()],
      [isRTL ? 'شركاء PDP' : 'PDP Partners', stats.totalPDPs.toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Operations Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isRTL ? 'العمليات' : 'Operations', margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [[isRTL ? 'المقياس' : 'Metric', isRTL ? 'القيمة' : 'Value']],
    body: [
      [isRTL ? 'التحققات المعلقة' : 'Pending Verifications', stats.pendingVerifications.toLocaleString()],
      [isRTL ? 'إجمالي نقاط التطوير' : 'Total PDC Credits', stats.totalPDCs.toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [107, 114, 128] },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      isRTL ? 'تقرير تم إنشاؤه بواسطة نظام BDA' : 'Report generated by BDA System',
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `${isRTL ? 'صفحة' : 'Page'} ${i} ${isRTL ? 'من' : 'of'} ${pageCount}`,
      pageWidth - margin - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save
  doc.save(`BDA-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============================================================================
// Main Component
// ============================================================================

export default function ReportsAnalytics() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: stats, isLoading } = useDashboardStats();

  // Translations
  const t = {
    title: isRTL ? 'التقارير والتحليلات' : 'Reports & Analytics',
    subtitle: isRTL ? 'نظرة عامة على أداء النظام' : 'System-wide performance overview',
    users: isRTL ? 'المستخدمون' : 'Users',
    totalUsers: isRTL ? 'إجمالي المستخدمين' : 'Total Users',
    activeUsers: isRTL ? 'المستخدمون النشطون' : 'Active Users (30 days)',
    certifications: isRTL ? 'الشهادات' : 'Certifications',
    totalCerts: isRTL ? 'إجمالي الشهادات' : 'Total Certifications',
    activeCerts: isRTL ? 'الشهادات النشطة' : 'Active Certifications',
    exams: isRTL ? 'الامتحانات' : 'Exams',
    totalAttempts: isRTL ? 'إجمالي المحاولات' : 'Total Attempts',
    passRate: isRTL ? 'معدل النجاح' : 'Pass Rate',
    upcomingExams: isRTL ? 'الامتحانات القادمة' : 'Upcoming Exams',
    completedToday: isRTL ? 'مكتمل اليوم' : 'Completed Today',
    partners: isRTL ? 'الشركاء' : 'Partners',
    ecpPartners: isRTL ? 'شركاء ECP' : 'ECP Partners',
    pdpPartners: isRTL ? 'شركاء PDP' : 'PDP Partners',
    operations: isRTL ? 'العمليات' : 'Operations',
    pendingVerifications: isRTL ? 'التحققات المعلقة' : 'Pending Verifications',
    totalPDCs: isRTL ? 'إجمالي نقاط التطوير' : 'Total PDC Credits',
    exportReport: isRTL ? 'تصدير التقرير' : 'Export Report',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              {t.title}
            </h1>
            <p className="mt-2 opacity-90">{t.subtitle}</p>
          </div>
          <button
            onClick={() => exportToPDF(stats, isRTL)}
            disabled={!stats || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {t.exportReport}
          </button>
        </div>
      </div>

      {/* Users Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          {t.users}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.totalUsers}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.activeUsers}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    {stats && stats.totalUsers > 0
                      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                      : 0}% {isRTL ? 'نشط' : 'active'}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Certifications Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-600" />
          {t.certifications}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.totalCerts}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalCertifications.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.activeCerts}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.activeCertifications.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exams Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-indigo-600" />
          {t.exams}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.totalAttempts}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalExamAttempts.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FileCheck className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.passRate}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.passRate}%</p>
                </div>
                <div className={`p-3 rounded-lg ${(stats?.passRate || 0) >= 70 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {(stats?.passRate || 0) >= 70 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.upcomingExams}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.upcomingExams.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.completedToday}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.completedToday.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Partners Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-orange-600" />
          {t.partners}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.ecpPartners}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalECPs.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isRTL ? 'شركاء معتمدين للتدريب' : 'Certified Training Partners'}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.pdpPartners}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalPDPs.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isRTL ? 'مقدمي التطوير المهني' : 'Development Providers'}
                  </p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operations Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          {t.operations}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.pendingVerifications}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.pendingVerifications.toLocaleString()}</p>
                  {(stats?.pendingVerifications || 0) > 0 && (
                    <p className="text-sm text-yellow-600 mt-1">
                      {isRTL ? 'بحاجة للمراجعة' : 'Needs attention'}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${(stats?.pendingVerifications || 0) > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  {(stats?.pendingVerifications || 0) > 0 ? (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.totalPDCs}</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalPDCs.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isRTL ? 'نقاط معتمدة' : 'Approved credits'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
