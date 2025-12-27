import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Building2,
  FileCheck,
  DollarSign,
  TrendingUp,
  Shield,
  AlertTriangle,
  BarChart3,
  Calendar,
  Settings,
  ArrowRight,
  Activity,
  Award,
  CheckSquare
} from "lucide-react";
import { usePdcStats } from "@/entities/pdcs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const { t } = useLanguage();

  // Fetch PDC statistics
  const { data: pdcStats, isLoading: pdcLoading } = usePdcStats();

  // Fetch user statistics
  const { data: userStats, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, is_active, created_at');

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        newThisMonth: users.filter(u => new Date(u.created_at) >= startOfMonth).length
      };
    }
  });

  // Fetch partner statistics
  const { data: partnerStats, isLoading: partnersLoading } = useQuery({
    queryKey: ['admin-partner-stats'],
    queryFn: async () => {
      const { data: partners, error } = await supabase
        .from('partners')
        .select('id, partner_type, is_active, created_at');

      if (error) {
        console.warn('Partners table not available:', error);
        return { total: 0, ecp: 0, pdp: 0, active: 0, activeEcp: 0, activePdp: 0, newThisMonth: 0 };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: partners.length,
        ecp: partners.filter(p => p.partner_type === 'ecp').length,
        pdp: partners.filter(p => p.partner_type === 'pdp').length,
        active: partners.filter(p => p.is_active).length,
        activeEcp: partners.filter(p => p.partner_type === 'ecp' && p.is_active).length,
        activePdp: partners.filter(p => p.partner_type === 'pdp' && p.is_active).length,
        newThisMonth: partners.filter(p => new Date(p.created_at) >= startOfMonth).length
      };
    },
    retry: false
  });

  const metrics = [
    {
      title: t('adminDashboard.totalUsers'),
      value: usersLoading ? "..." : userStats?.total.toLocaleString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      subtitle: usersLoading ? t('adminDashboard.loading') : `+${userStats?.newThisMonth || 0} ${t('adminDashboard.thisMonth')}`
    },
    {
      title: t('adminDashboard.activePartners'),
      value: partnersLoading ? "..." : partnerStats?.active.toString() || "0",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      subtitle: partnersLoading ? t('adminDashboard.loading') : `ECP: ${partnerStats?.activeEcp || 0}, PDP: ${partnerStats?.activePdp || 0}`
    },
    {
      title: t('adminDashboard.pendingPdcReviews'),
      value: pdcLoading ? "..." : pdcStats?.pending_entries.toString() || "0",
      icon: FileCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      subtitle: t('adminDashboard.requiresAttention')
    },
    {
      title: t('adminDashboard.totalPdcCredits'),
      value: pdcLoading ? "..." : pdcStats?.total_credits_approved.toLocaleString() || "0",
      icon: Award,
      color: "text-royal-600",
      bgColor: "bg-purple-100",
      subtitle: pdcLoading ? t('adminDashboard.loading') : `${pdcStats?.approved_entries || 0} ${t('adminDashboard.approved')}`
    },
  ];

  const pendingActions = [
    {
      title: t('adminDashboard.pdcReviews'),
      count: pdcLoading ? 0 : pdcStats?.pending_entries || 0,
      priority: "high",
      type: "pdc"
    },
    {
      title: t('adminDashboard.newUsersThisMonth'),
      count: usersLoading ? 0 : userStats?.newThisMonth || 0,
      priority: "medium",
      type: "users"
    },
    {
      title: t('adminDashboard.newPartners'),
      count: partnersLoading ? 0 : partnerStats?.newThisMonth || 0,
      priority: "medium",
      type: "partners"
    },
    {
      title: t('adminDashboard.rejectedPdcs'),
      count: pdcLoading ? 0 : pdcStats?.rejected_entries || 0,
      priority: "low",
      type: "pdc"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">{t('adminDashboard.title')}</h1>
        <p className="mt-2 opacity-90">
          {t('adminDashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-xs text-gray-500">{metric.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('adminDashboard.pdcStatistics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {pdcLoading ? "..." : pdcStats?.total_entries || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.totalPdcEntries')}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {pdcLoading ? "..." : pdcStats?.pending_entries || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.pendingReview')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {pdcLoading ? "..." : pdcStats?.approved_entries || 0}
                </p>
                <p className="text-sm text-gray-600">{t('common.approved')}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {pdcLoading ? "..." : pdcStats?.rejected_entries || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.rejected')}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('adminDashboard.creditsClaimed')}</p>
                  <p className="text-2xl font-bold">
                    {pdcLoading ? "..." : pdcStats?.total_credits_claimed.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('adminDashboard.creditsApproved')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pdcLoading ? "..." : pdcStats?.total_credits_approved.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-600 mb-2">{t('adminDashboard.byCertificationType')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-royal-600">
                    {pdcLoading ? "..." : pdcStats?.by_certification_type.CP || 0}
                  </p>
                  <p className="text-xs text-gray-600">{t('adminDashboard.cpEntries')}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-lg font-bold text-royal-600">
                    {pdcLoading ? "..." : pdcStats?.by_certification_type.SCP || 0}
                  </p>
                  <p className="text-xs text-gray-600">{t('adminDashboard.scpEntries')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('adminDashboard.quickInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-2xl font-bold mt-1">{action.count}</p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${
                    action.priority === 'high' ? 'bg-red-500' :
                    action.priority === 'medium' ? 'bg-orange-500' :
                    'bg-gray-400'
                  }`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {t('adminDashboard.userOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {usersLoading ? "..." : userStats?.total.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.totalUsers')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {usersLoading ? "..." : userStats?.active.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.activeUsers')}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {usersLoading ? "..." : userStats?.newThisMonth || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.newThisMonth')}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-royal-600">
                  {usersLoading || !userStats ? "..." :
                    Math.round((userStats.active / userStats.total) * 100) + "%"
                  }
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.activeRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              {t('adminDashboard.partnerOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {partnersLoading ? "..." : partnerStats?.total || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.totalPartners')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {partnersLoading ? "..." : partnerStats?.active || 0}
                </p>
                <p className="text-sm text-gray-600">{t('common.active')}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {partnersLoading ? "..." : partnerStats?.ecp || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.ecpPartners')}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-royal-600">
                  {partnersLoading ? "..." : partnerStats?.pdp || 0}
                </p>
                <p className="text-sm text-gray-600">{t('adminDashboard.pdpPartners')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}