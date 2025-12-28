import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Calendar, CheckCircle, XCircle, RefreshCw, UserCog, Users, Clock } from 'lucide-react';
import { CurriculumAccessService } from '@/entities/curriculum';
import type { CertificationType } from '@/entities/curriculum';
import { StatCard } from '../components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/**
 * Access Management Page (Admin)
 * Manage user curriculum access grants, expirations, and manual overrides
 */
export function AccessManagement() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [filterCertType, setFilterCertType] = useState<'all' | CertificationType>('all');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantFormData, setGrantFormData] = useState({
    emails: '',
    certificationType: 'CP' as CertificationType,
    examLanguage: 'en' as 'en' | 'ar',
    durationMonths: 12,
  });

  const t = {
    en: {
      title: 'Curriculum Access Management',
      description: 'Manage user access to curriculum modules',
      grantAccess: 'Grant Access',
      totalAccessGrants: 'Total Access Grants',
      active: 'Active',
      expired: 'Expired',
      expiringSoon: 'Expiring Soon (30d)',
      searchUsers: 'Search Users',
      searchPlaceholder: 'Email or name...',
      accessStatus: 'Access Status',
      allStatus: 'All Status',
      activeOnly: 'Active Only',
      expiredOnly: 'Expired Only',
      certificationType: 'Certification Type',
      allTypes: 'All Types',
      user: 'User',
      certType: 'Cert Type',
      purchased: 'Purchased',
      expires: 'Expires',
      status: 'Status',
      actions: 'Actions',
      inactive: 'Inactive',
      deactivate: 'Deactivate',
      activate: 'Activate',
      extendYear: '+1 Year',
      daysLeft: 'days left',
      loading: 'Loading access records...',
      noRecords: 'No access records found',
      noRecordsDescription: 'Access is automatically granted when users purchase certifications',
      grantAccessTitle: 'Grant Curriculum Access',
      grantAccessDescription: 'Grant access to the curriculum for one or more users by email address.',
      userEmails: 'User Email(s)',
      emailPlaceholder: 'Enter email addresses (comma or newline separated)\nexample@domain.com, user2@domain.com',
      emailHelp: 'Enter one or more email addresses, separated by commas or newlines',
      durationMonths: 'Duration (months)',
      examLanguage: 'Exam Language',
      languageEnglish: 'English',
      languageArabic: 'Arabic',
      language: 'Language',
      cancel: 'Cancel',
      granting: 'Granting...',
      cpFull: 'CP (Certified Professional)',
      scpFull: 'SCP (Senior Certified Professional)',
      accessGrantedSuccess: 'Access granted to {count} user(s) for {months} months',
      accessGrantedPartial: 'Access granted to {count} of {total} users. Failed: {failed}',
      accessGrantedError: 'Failed to grant access',
      enterValidEmail: 'Please enter at least one valid email address',
      noUsersFound: 'No users found with the provided email addresses',
    },
    ar: {
      title: 'إدارة الوصول للمنهج',
      description: 'إدارة وصول المستخدمين إلى وحدات المنهج',
      grantAccess: 'منح الوصول',
      totalAccessGrants: 'إجمالي منح الوصول',
      active: 'نشط',
      expired: 'منتهي',
      expiringSoon: 'ينتهي قريباً (30 يوم)',
      searchUsers: 'البحث عن المستخدمين',
      searchPlaceholder: 'البريد الإلكتروني أو الاسم...',
      accessStatus: 'حالة الوصول',
      allStatus: 'جميع الحالات',
      activeOnly: 'النشط فقط',
      expiredOnly: 'المنتهي فقط',
      certificationType: 'نوع الشهادة',
      allTypes: 'جميع الأنواع',
      user: 'المستخدم',
      certType: 'نوع الشهادة',
      purchased: 'تاريخ الشراء',
      expires: 'تاريخ الانتهاء',
      status: 'الحالة',
      actions: 'الإجراءات',
      inactive: 'غير نشط',
      deactivate: 'إلغاء التفعيل',
      activate: 'تفعيل',
      extendYear: '+سنة',
      daysLeft: 'يوم متبقي',
      loading: 'جارٍ تحميل سجلات الوصول...',
      noRecords: 'لم يتم العثور على سجلات وصول',
      noRecordsDescription: 'يتم منح الوصول تلقائياً عند شراء المستخدمين للشهادات',
      grantAccessTitle: 'منح الوصول للمنهج',
      grantAccessDescription: 'منح الوصول للمنهج لمستخدم واحد أو أكثر عبر عنوان البريد الإلكتروني.',
      userEmails: 'البريد الإلكتروني للمستخدم(ين)',
      emailPlaceholder: 'أدخل عناوين البريد الإلكتروني (مفصولة بفواصل أو أسطر جديدة)\nexample@domain.com, user2@domain.com',
      emailHelp: 'أدخل عنوان بريد إلكتروني واحد أو أكثر، مفصولة بفواصل أو أسطر جديدة',
      durationMonths: 'المدة (بالأشهر)',
      examLanguage: 'لغة الامتحان',
      languageEnglish: 'الإنجليزية',
      languageArabic: 'العربية',
      language: 'اللغة',
      cancel: 'إلغاء',
      granting: 'جارٍ المنح...',
      cpFull: 'CP (محترف معتمد)',
      scpFull: 'SCP (محترف معتمد أول)',
      accessGrantedSuccess: 'تم منح الوصول لـ {count} مستخدم(ين) لمدة {months} شهر',
      accessGrantedPartial: 'تم منح الوصول لـ {count} من {total} مستخدمين. فشل: {failed}',
      accessGrantedError: 'فشل في منح الوصول',
      enterValidEmail: 'يرجى إدخال عنوان بريد إلكتروني صالح واحد على الأقل',
      noUsersFound: 'لم يتم العثور على مستخدمين بعناوين البريد الإلكتروني المقدمة',
    }
  };

  const texts = t[language];

  // Fetch all access records
  const { data: accessRecords, isLoading, refetch } = useQuery({
    queryKey: ['curriculum-access', 'all', filterStatus, filterCertType],
    queryFn: async () => {
      // This would be a new service method to fetch all access records for admin
      const { supabase } = await import('@/lib/supabase');

      let query = supabase
        .from('user_curriculum_access')
        .select(`
          *,
          users:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus === 'active') {
        query = query.eq('is_active', true).gt('expires_at', new Date().toISOString());
      } else if (filterStatus === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }

      if (filterCertType !== 'all') {
        query = query.eq('certification_type', filterCertType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Toggle access active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, certType, examLanguage, isActive }: {
      userId: string;
      certType: CertificationType;
      examLanguage: 'en' | 'ar';
      isActive: boolean;
    }) => {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('user_curriculum_access')
        .update({ is_active: !isActive })
        .eq('user_id', userId)
        .eq('certification_type', certType)
        .eq('exam_language', examLanguage);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-access'] });
    },
  });

  // Extend access expiration
  const extendAccessMutation = useMutation({
    mutationFn: async ({ userId, certType, examLanguage, months }: {
      userId: string;
      certType: CertificationType;
      examLanguage: 'en' | 'ar';
      months: number;
    }) => {
      const { supabase } = await import('@/lib/supabase');

      // Get current access record
      const { data: access } = await supabase
        .from('user_curriculum_access')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('certification_type', certType)
        .eq('exam_language', examLanguage)
        .single();

      if (!access) throw new Error('Access record not found');

      // Calculate new expiration (from current expiry or now, whichever is later)
      const currentExpiry = new Date(access.expires_at);
      const now = new Date();
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      // Update expiration
      const { error } = await supabase
        .from('user_curriculum_access')
        .update({
          expires_at: newExpiry.toISOString(),
          is_active: true,
        })
        .eq('user_id', userId)
        .eq('certification_type', certType)
        .eq('exam_language', examLanguage);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-access'] });
    },
  });

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: async () => {
      const { supabase } = await import('@/lib/supabase');

      // Parse emails (comma or newline separated)
      const emailList = grantFormData.emails
        .split(/[,\n]/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes('@'));

      if (emailList.length === 0) {
        throw new Error(texts.enterValidEmail);
      }

      // Grant access to each email using the admin RPC function
      const results = await Promise.all(
        emailList.map(async (email) => {
          const { data, error } = await supabase.rpc('admin_grant_curriculum_access', {
            p_user_email: email,
            p_certification_type: grantFormData.certificationType.toLowerCase(),
            p_exam_language: grantFormData.examLanguage,
            p_duration_months: grantFormData.durationMonths,
          });

          if (error) {
            console.error(`Error granting access to ${email}:`, error);
            return { email, success: false, error: error.message };
          }

          // The RPC returns a JSONB object with success status
          if (data && typeof data === 'object' && 'success' in data) {
            return { email, success: data.success, error: data.error || null };
          }

          return { email, success: true, error: null };
        })
      );

      const successCount = results.filter((r) => r.success).length;
      const failedEmails = results.filter((r) => !r.success).map((r) => r.email);

      if (successCount === 0) {
        throw new Error(texts.noUsersFound);
      }

      return {
        grantedCount: successCount,
        totalEmails: emailList.length,
        failedEmails,
      };
    },
    onSuccess: (result) => {
      if (result.failedEmails && result.failedEmails.length > 0) {
        // Partial success
        toast.warning(
          texts.accessGrantedPartial
            .replace('{count}', String(result.grantedCount))
            .replace('{total}', String(result.totalEmails))
            .replace('{failed}', result.failedEmails.join(', '))
        );
      } else {
        // Full success
        toast.success(
          texts.accessGrantedSuccess
            .replace('{count}', String(result.grantedCount))
            .replace('{months}', String(grantFormData.durationMonths))
        );
      }
      queryClient.invalidateQueries({ queryKey: ['curriculum-access'] });
      setShowGrantModal(false);
      setGrantFormData({
        emails: '',
        certificationType: 'CP',
        examLanguage: 'en',
        durationMonths: 12,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || texts.accessGrantedError);
    },
  });

  // Filtered records based on search
  const filteredRecords = accessRecords?.filter((record) => {
    if (!searchTerm) return true;
    const user = record.users as any;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    return (
      user?.email?.toLowerCase().includes(searchLower) ||
      fullName.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCog className="h-8 w-8" />
              {texts.title}
            </h1>
            <p className="mt-2 opacity-90">
              {texts.description}
            </p>
          </div>
          <button
            onClick={() => setShowGrantModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            <UserPlus className="w-5 h-5" />
            {texts.grantAccess}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={texts.totalAccessGrants}
          value={accessRecords?.length || 0}
          icon={Users}
          color="gray"
        />
        <StatCard
          label={texts.active}
          value={accessRecords?.filter(
            (r) => r.is_active && !isExpired(r.expires_at)
          ).length || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label={texts.expired}
          value={accessRecords?.filter((r) => isExpired(r.expires_at)).length || 0}
          icon={XCircle}
          color="red"
        />
        <StatCard
          label={texts.expiringSoon}
          value={accessRecords?.filter((r) => {
            const days = getDaysUntilExpiry(r.expires_at);
            return days > 0 && days <= 30;
          }).length || 0}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.searchUsers}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={texts.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.accessStatus}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{texts.allStatus}</option>
              <option value="active">{texts.activeOnly}</option>
              <option value="expired">{texts.expiredOnly}</option>
            </select>
          </div>

          {/* Certification Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.certificationType}
            </label>
            <select
              value={filterCertType}
              onChange={(e) => setFilterCertType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{texts.allTypes}</option>
              <option value="cp">CP</option>
              <option value="scp">SCP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Access Records Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{texts.loading}</p>
          </div>
        ) : filteredRecords && filteredRecords.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.user}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.certType}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.language}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.purchased}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.expires}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.status}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {texts.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const user = record.users as any;
                const expired = isExpired(record.expires_at);
                const daysLeft = getDaysUntilExpiry(record.expires_at);
                const expiringSoon = daysLeft > 0 && daysLeft <= 30;

                return (
                  <tr key={`${record.user_id}-${record.certification_type}-${record.exam_language || 'en'}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.first_name || user?.last_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {record.certification_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                        record.exam_language === 'ar'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {record.exam_language === 'ar' ? 'AR' : 'EN'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {formatDate(record.purchased_at)}
                      </div>
                      {record.woocommerce_order_id && (
                        <div className="text-xs text-gray-500">
                          Order #{record.woocommerce_order_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-orange-600' : 'text-gray-700'}`}>
                        {formatDate(record.expires_at)}
                      </div>
                      {!expired && (
                        <div className="text-xs text-gray-500">
                          {daysLeft} {texts.daysLeft}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.is_active && !expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          {texts.active}
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          <XCircle className="w-3 h-3" />
                          {texts.expired}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          <XCircle className="w-3 h-3" />
                          {texts.inactive}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              userId: record.user_id,
                              certType: record.certification_type,
                              examLanguage: record.exam_language || 'en',
                              isActive: record.is_active,
                            })
                          }
                          className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                          title={record.is_active ? texts.deactivate : texts.activate}
                        >
                          {record.is_active ? texts.deactivate : texts.activate}
                        </button>
                        <button
                          onClick={() =>
                            extendAccessMutation.mutate({
                              userId: record.user_id,
                              certType: record.certification_type,
                              examLanguage: record.exam_language || 'en',
                              months: 12,
                            })
                          }
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1"
                          title={texts.extendYear}
                        >
                          <RefreshCw className="w-3 h-3" />
                          {texts.extendYear}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">{texts.noRecords}</p>
            <p className="text-sm text-gray-500">
              {texts.noRecordsDescription}
            </p>
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{texts.grantAccessTitle}</DialogTitle>
            <DialogDescription>
              {texts.grantAccessDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>{texts.userEmails} *</Label>
              <Textarea
                value={grantFormData.emails}
                onChange={(e) =>
                  setGrantFormData({ ...grantFormData, emails: e.target.value })
                }
                placeholder={texts.emailPlaceholder}
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {texts.emailHelp}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{texts.certificationType} *</Label>
                <Select
                  value={grantFormData.certificationType}
                  onValueChange={(value) =>
                    setGrantFormData({
                      ...grantFormData,
                      certificationType: value as CertificationType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CP">{texts.cpFull}</SelectItem>
                    <SelectItem value="SCP">{texts.scpFull}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{texts.examLanguage} *</Label>
                <Select
                  value={grantFormData.examLanguage}
                  onValueChange={(value) =>
                    setGrantFormData({
                      ...grantFormData,
                      examLanguage: value as 'en' | 'ar',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{texts.languageEnglish}</SelectItem>
                    <SelectItem value="ar">{texts.languageArabic}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{texts.durationMonths} *</Label>
                <Input
                  type="number"
                  value={grantFormData.durationMonths}
                  onChange={(e) =>
                    setGrantFormData({
                      ...grantFormData,
                      durationMonths: parseInt(e.target.value) || 12,
                    })
                  }
                  min={1}
                  max={60}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGrantModal(false)}
              disabled={grantAccessMutation.isPending}
            >
              {texts.cancel}
            </Button>
            <Button
              onClick={() => grantAccessMutation.mutate()}
              disabled={grantAccessMutation.isPending || !grantFormData.emails.trim()}
            >
              {grantAccessMutation.isPending ? texts.granting : texts.grantAccess}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
