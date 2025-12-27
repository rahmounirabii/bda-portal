import { useState } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  User,
  GraduationCap,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/contexts/ConfirmDialogContext';
import {
  useAllVouchers,
  useCreateVoucher,
  useCreateVouchersBulk,
  useRevokeVoucher,
  useVoucherStats,
  useBatchExpireVouchers,
  useActiveQuizzes,
  type ExamVoucher,
  type CertificationType,
  type VoucherStatus,
  type CreateExamVoucherDTO,
} from '@/entities/quiz';
import { cn } from '@/shared/utils/cn';
import { UserLookupService } from '@/entities/auth/user-lookup.service';

/**
 * Vouchers Page (Admin)
 * Manage exam vouchers for candidates
 */

const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  CP: 'CP™',
  SCP: 'SCP™',
};

const STATUS_COLORS: Record<VoucherStatus, string> = {
  unused: 'text-green-700 bg-green-100 border-green-300',
  used: 'text-blue-700 bg-blue-100 border-blue-300',
  expired: 'text-gray-700 bg-gray-100 border-gray-300',
  revoked: 'text-red-700 bg-red-100 border-red-300',
};

interface VoucherFormData {
  user_email: string;
  certification_type: CertificationType;
  quiz_id: string;
  validity_months: string;
  admin_notes: string;
}

const emptyFormData: VoucherFormData = {
  user_email: '',
  certification_type: 'CP',
  quiz_id: '',
  validity_months: '6',
  admin_notes: '',
};

export default function Vouchers() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { language } = useLanguage();

  const t = {
    en: {
      title: 'Exam Vouchers',
      description: 'Manage certification exam vouchers for candidates',
      totalVouchers: 'Total Vouchers',
      unused: 'Unused',
      used: 'Used',
      expired: 'Expired',
      revoked: 'Revoked',
      search: 'Search',
      searchPlaceholder: 'Search by voucher code or notes...',
      certificationType: 'Certification Type',
      allTypes: 'All Types',
      status: 'Status',
      allStatus: 'All Status',
      available: 'Available',
      assigned: 'Assigned',
      cancelled: 'Cancelled',
      expireOldVouchers: 'Expire Old Vouchers',
      expiring: 'Expiring...',
      bulkIssue: 'Bulk Issue',
      createVoucher: 'Create Voucher',
      loading: 'Loading vouchers...',
      noVouchers: 'No vouchers found',
      noVouchersDescription: 'Create a voucher to get started',
      createFirstVoucher: 'Create First Voucher',
      user: 'User',
      unknown: 'Unknown',
      quiz: 'Quiz',
      anyQuiz: 'Any quiz',
      expires: 'Expires',
      created: 'Created',
      adminNotes: 'Admin Notes',
      usedLabel: 'Used',
      usedOn: 'Used on',
      attemptRecorded: 'Attempt recorded',
      revoke: 'Revoke',
      createDialogTitle: 'Create Exam Voucher',
      createDialogDescription: 'Manually create a voucher for a candidate',
      userEmail: 'User Email',
      userEmailPlaceholder: 'user@example.com',
      userEmailHelp: 'The email address of the user receiving this voucher',
      cpLabel: 'CP™ - Certified Professional',
      scpLabel: 'SCP™ - Senior Certified Professional',
      linkedQuiz: 'Linked Quiz (Optional)',
      linkedQuizPlaceholder: 'Any quiz of this type',
      linkedQuizHelp: 'Leave empty to allow any quiz of the selected certification type',
      validityMonths: 'Validity (Months)',
      validityHelp: 'How many months until this voucher expires',
      adminNotesLabel: 'Admin Notes (Optional)',
      adminNotesPlaceholder: 'Any additional notes about this voucher...',
      cancel: 'Cancel',
      bulkModalTitle: 'Bulk Issue Vouchers',
      bulkModalDescription: 'Issue exam vouchers to multiple users at once',
      emailAddresses: 'Email Addresses',
      emailPlaceholder: 'Enter email addresses (comma or newline separated)\ne.g.,\nuser1@example.com, user2@example.com\nuser3@example.com',
      emailHelp: 'Users must have existing accounts in the portal. Separate emails with commas or newlines.',
      cpLabelFull: 'Certified Professional (CP)',
      scpLabelFull: 'Senior Certified Professional (SCP)',
      expiresAt: 'Expires At',
      adminNotesOptional: 'Admin Notes (Optional)',
      adminNotesModalPlaceholder: 'Add internal notes about this batch of vouchers...',
      creatingVouchers: 'Creating Vouchers...',
      issueVouchers: 'Issue Vouchers',
      validationError: 'Validation Error',
      userEmailRequired: 'User email is required',
      validityMustBeValid: 'Validity months must be a valid number',
      userNotFound: 'User Account Not Found',
      userNotFoundDescription: '{email} must create a BDA Portal account first before vouchers can be generated. Ask them to sign up at the portal.',
      success: 'Success',
      voucherCreatedFor: 'Voucher created successfully for {name} ({email})',
      error: 'Error',
      failedToCreate: 'Failed to create voucher',
      revokeTitle: 'Revoke Voucher',
      revokeDescription: 'Are you sure you want to revoke voucher "{code}"? This action cannot be undone.',
      revokeConfirm: 'Revoke',
      voucherRevoked: 'Voucher revoked successfully',
      failedToRevoke: 'Failed to revoke voucher',
      enterEmail: 'Please enter at least one email address',
      selectExpiration: 'Please select an expiration date',
      vouchersCreated: '{count} voucher(s) created successfully',
      failedEmails: '{count} failed: {emails}',
      failed: 'Failed',
      expireTitle: 'Expire Old Vouchers',
      expireDescription: 'This will mark all unused vouchers past their expiration date as "expired". Continue?',
      expireConfirm: 'Expire',
      vouchersExpired: '{count} voucher(s) marked as expired',
      failedToExpire: 'Failed to expire vouchers',
      statusUnused: 'Unused',
      statusUsed: 'Used',
      statusExpired: 'Expired',
      statusRevoked: 'Revoked',
    },
    ar: {
      title: 'قسائم الامتحان',
      description: 'إدارة قسائم امتحان الشهادات للمرشحين',
      totalVouchers: 'إجمالي القسائم',
      unused: 'غير مستخدمة',
      used: 'مستخدمة',
      expired: 'منتهية الصلاحية',
      revoked: 'ملغاة',
      search: 'بحث',
      searchPlaceholder: 'البحث برمز القسيمة أو الملاحظات...',
      certificationType: 'نوع الشهادة',
      allTypes: 'جميع الأنواع',
      status: 'الحالة',
      allStatus: 'جميع الحالات',
      available: 'متاحة',
      assigned: 'مخصصة',
      cancelled: 'ملغاة',
      expireOldVouchers: 'إنهاء صلاحية القسائم القديمة',
      expiring: 'جارٍ الإنهاء...',
      bulkIssue: 'إصدار جماعي',
      createVoucher: 'إنشاء قسيمة',
      loading: 'جارٍ تحميل القسائم...',
      noVouchers: 'لم يتم العثور على قسائم',
      noVouchersDescription: 'أنشئ قسيمة للبدء',
      createFirstVoucher: 'إنشاء أول قسيمة',
      user: 'المستخدم',
      unknown: 'غير معروف',
      quiz: 'الاختبار',
      anyQuiz: 'أي اختبار',
      expires: 'تنتهي',
      created: 'تم الإنشاء',
      adminNotes: 'ملاحظات المسؤول',
      usedLabel: 'مستخدمة',
      usedOn: 'استخدمت في',
      attemptRecorded: 'تم تسجيل المحاولة',
      revoke: 'إلغاء',
      createDialogTitle: 'إنشاء قسيمة امتحان',
      createDialogDescription: 'إنشاء قسيمة يدوياً لمرشح',
      userEmail: 'البريد الإلكتروني للمستخدم',
      userEmailPlaceholder: 'user@example.com',
      userEmailHelp: 'عنوان البريد الإلكتروني للمستخدم الذي سيستلم هذه القسيمة',
      cpLabel: 'CP™ - محترف معتمد',
      scpLabel: 'SCP™ - محترف معتمد أول',
      linkedQuiz: 'الاختبار المرتبط (اختياري)',
      linkedQuizPlaceholder: 'أي اختبار من هذا النوع',
      linkedQuizHelp: 'اتركه فارغاً للسماح بأي اختبار من نوع الشهادة المحدد',
      validityMonths: 'الصلاحية (بالأشهر)',
      validityHelp: 'عدد الأشهر حتى انتهاء صلاحية هذه القسيمة',
      adminNotesLabel: 'ملاحظات المسؤول (اختياري)',
      adminNotesPlaceholder: 'أي ملاحظات إضافية حول هذه القسيمة...',
      cancel: 'إلغاء',
      bulkModalTitle: 'إصدار قسائم جماعي',
      bulkModalDescription: 'إصدار قسائم الامتحان لعدة مستخدمين دفعة واحدة',
      emailAddresses: 'عناوين البريد الإلكتروني',
      emailPlaceholder: 'أدخل عناوين البريد الإلكتروني (مفصولة بفواصل أو أسطر جديدة)\nمثال:\nuser1@example.com, user2@example.com\nuser3@example.com',
      emailHelp: 'يجب أن يكون للمستخدمين حسابات موجودة في البوابة. افصل البريد الإلكتروني بفواصل أو أسطر جديدة.',
      cpLabelFull: 'محترف معتمد (CP)',
      scpLabelFull: 'محترف معتمد أول (SCP)',
      expiresAt: 'تاريخ الانتهاء',
      adminNotesOptional: 'ملاحظات المسؤول (اختياري)',
      adminNotesModalPlaceholder: 'أضف ملاحظات داخلية حول هذه الدفعة من القسائم...',
      creatingVouchers: 'جارٍ إنشاء القسائم...',
      issueVouchers: 'إصدار القسائم',
      validationError: 'خطأ في التحقق',
      userEmailRequired: 'البريد الإلكتروني للمستخدم مطلوب',
      validityMustBeValid: 'يجب أن تكون أشهر الصلاحية رقماً صحيحاً',
      userNotFound: 'لم يتم العثور على حساب المستخدم',
      userNotFoundDescription: 'يجب على {email} إنشاء حساب في بوابة BDA أولاً قبل إنشاء القسائم. اطلب منهم التسجيل في البوابة.',
      success: 'نجاح',
      voucherCreatedFor: 'تم إنشاء القسيمة بنجاح لـ {name} ({email})',
      error: 'خطأ',
      failedToCreate: 'فشل في إنشاء القسيمة',
      revokeTitle: 'إلغاء القسيمة',
      revokeDescription: 'هل أنت متأكد من رغبتك في إلغاء القسيمة "{code}"؟ لا يمكن التراجع عن هذا الإجراء.',
      revokeConfirm: 'إلغاء',
      voucherRevoked: 'تم إلغاء القسيمة بنجاح',
      failedToRevoke: 'فشل في إلغاء القسيمة',
      enterEmail: 'يرجى إدخال عنوان بريد إلكتروني واحد على الأقل',
      selectExpiration: 'يرجى تحديد تاريخ انتهاء الصلاحية',
      vouchersCreated: 'تم إنشاء {count} قسيمة/قسائم بنجاح',
      failedEmails: 'فشل {count}: {emails}',
      failed: 'فشل',
      expireTitle: 'إنهاء صلاحية القسائم القديمة',
      expireDescription: 'سيتم تعليم جميع القسائم غير المستخدمة التي تجاوزت تاريخ انتهاء صلاحيتها بأنها "منتهية الصلاحية". متابعة؟',
      expireConfirm: 'إنهاء الصلاحية',
      vouchersExpired: 'تم تعليم {count} قسيمة/قسائم بأنها منتهية الصلاحية',
      failedToExpire: 'فشل في إنهاء صلاحية القسائم',
      statusUnused: 'غير مستخدمة',
      statusUsed: 'مستخدمة',
      statusExpired: 'منتهية الصلاحية',
      statusRevoked: 'ملغاة',
    }
  };

  const texts = t[language];

  // Dynamic status labels
  const STATUS_LABELS: Record<VoucherStatus, string> = {
    unused: texts.statusUnused,
    used: texts.statusUsed,
    expired: texts.statusExpired,
    revoked: texts.statusRevoked,
  };

  // Filters
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | 'all'>('all');
  const [certificationFilter, setCertificationFilter] = useState<CertificationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<VoucherFormData>(emptyFormData);

  // Bulk issuance modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkCertType, setBulkCertType] = useState<CertificationType>('CP');
  const [bulkExpiresAt, setBulkExpiresAt] = useState('');
  const [bulkAdminNotes, setBulkAdminNotes] = useState('');

  // Build filters
  const filters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    certification_type: certificationFilter !== 'all' ? certificationFilter : undefined,
    search: searchQuery || undefined,
  };

  // Fetch data
  const { data: vouchers, isLoading } = useAllVouchers(filters);
  const { data: stats } = useVoucherStats();
  const { data: quizzes } = useActiveQuizzes();

  // Mutations
  const createMutation = useCreateVoucher();
  const createVouchersBulkMutation = useCreateVouchersBulk();
  const revokeMutation = useRevokeVoucher();
  const batchExpireMutation = useBatchExpireVouchers();

  // Handlers
  const handleOpenCreate = () => {
    setFormData(emptyFormData);
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.user_email) {
      toast({
        title: texts.validationError,
        description: texts.userEmailRequired,
        variant: 'destructive',
      });
      return;
    }

    const validityMonths = parseInt(formData.validity_months);
    if (isNaN(validityMonths) || validityMonths <= 0) {
      toast({
        title: texts.validationError,
        description: texts.validityMustBeValid,
        variant: 'destructive',
      });
      return;
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);

    try {
      // Resolve user email to user_id
      const userLookup = await UserLookupService.findUserByEmailForVoucher(
        formData.user_email
      );

      if (!userLookup) {
        toast({
          title: texts.userNotFound,
          description: texts.userNotFoundDescription.replace('{email}', formData.user_email),
          variant: 'destructive',
        });
        return;
      }

      const dto: CreateExamVoucherDTO = {
        user_id: userLookup.user_id,
        certification_type: formData.certification_type,
        quiz_id: formData.quiz_id || undefined,
        expires_at: expiresAt.toISOString(),
        admin_notes: formData.admin_notes || undefined,
      };

      await createMutation.mutateAsync(dto);
      toast({
        title: texts.success,
        description: texts.voucherCreatedFor
          .replace('{name}', `${userLookup.first_name} ${userLookup.last_name}`)
          .replace('{email}', userLookup.email),
      });

      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: texts.error,
        description: error.message || texts.failedToCreate,
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async (voucher: ExamVoucher) => {
    const confirmed = await confirm({
      title: texts.revokeTitle,
      description: texts.revokeDescription.replace('{code}', voucher.code),
      confirmText: texts.revokeConfirm,
      cancelText: texts.cancel,
    });

    if (!confirmed) return;

    try {
      await revokeMutation.mutateAsync(voucher.id);
      toast({
        title: texts.success,
        description: texts.voucherRevoked,
      });
    } catch (error: any) {
      toast({
        title: texts.error,
        description: error.message || texts.failedToRevoke,
        variant: 'destructive',
      });
    }
  };

  const handleBulkIssuance = async () => {
    if (!bulkEmails.trim()) {
      toast({
        title: texts.error,
        description: texts.enterEmail,
        variant: 'destructive',
      });
      return;
    }

    if (!bulkExpiresAt) {
      toast({
        title: texts.error,
        description: texts.selectExpiration,
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createVouchersBulkMutation.mutateAsync({
        emails: bulkEmails,
        certification_type: bulkCertType,
        expires_at: bulkExpiresAt,
        admin_notes: bulkAdminNotes || null,
        quiz_id: null,
        certification_product_id: null,
      });

      // Show success/failure summary
      const successMsg = texts.vouchersCreated.replace('{count}', String(result.created));
      const failMsg = result.failed.length > 0
        ? texts.failedEmails
            .replace('{count}', String(result.failed.length))
            .replace('{emails}', result.failed.map((f) => f.email).join(', '))
        : '';

      toast({
        title: result.created > 0 ? texts.success : texts.failed,
        description: failMsg ? `${successMsg}. ${failMsg}` : successMsg,
        variant: result.created > 0 ? 'default' : 'destructive',
      });

      // Reset form and close modal if any succeeded
      if (result.created > 0) {
        setBulkEmails('');
        setBulkCertType('CP');
        setBulkExpiresAt('');
        setBulkAdminNotes('');
        setShowBulkModal(false);
      }
    } catch (error: any) {
      console.error('Error creating bulk vouchers:', error);
      toast({
        title: texts.error,
        description: error.message || texts.failedToCreate,
        variant: 'destructive',
      });
    }
  };

  const handleBatchExpire = async () => {
    const confirmed = await confirm({
      title: texts.expireTitle,
      description: texts.expireDescription,
      confirmText: texts.expireConfirm,
      cancelText: texts.cancel,
    });

    if (!confirmed) return;

    try {
      const result = await batchExpireMutation.mutateAsync();
      toast({
        title: texts.success,
        description: texts.vouchersExpired.replace('{count}', String(result.updated_count)),
      });
    } catch (error: any) {
      toast({
        title: texts.error,
        description: error.message || texts.failedToExpire,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Ticket className="h-8 w-8" />
          {texts.title}
        </h1>
        <p className="mt-2 opacity-90">{texts.description}</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">{texts.totalVouchers}</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {texts.unused}
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.unused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                {texts.used}
              </div>
              <div className="text-2xl font-bold text-blue-700">{stats.used}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-600" />
                {texts.expired}
              </div>
              <div className="text-2xl font-bold text-gray-700">{stats.expired}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Ban className="h-4 w-4 text-red-600" />
                {texts.revoked}
              </div>
              <div className="text-2xl font-bold text-red-700">{stats.revoked}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search">{texts.search}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={texts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="w-full md:w-48">
              <Label>{texts.certificationType}</Label>
              <Select
                value={certificationFilter}
                onValueChange={(value) => setCertificationFilter(value as CertificationType | 'all')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allTypes}</SelectItem>
                  <SelectItem value="CP">CP™</SelectItem>
                  <SelectItem value="SCP">SCP™</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Label>{texts.status}</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as VoucherStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allStatus}</SelectItem>
                  <SelectItem value="available">{texts.available}</SelectItem>
                  <SelectItem value="assigned">{texts.assigned}</SelectItem>
                  <SelectItem value="used">{texts.used}</SelectItem>
                  <SelectItem value="expired">{texts.expired}</SelectItem>
                  <SelectItem value="cancelled">{texts.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBatchExpire}
                disabled={batchExpireMutation.isPending}
              >
                <Clock className="h-4 w-4 mr-2" />
                {batchExpireMutation.isPending ? texts.expiring : texts.expireOldVouchers}
              </Button>
              <Button onClick={() => setShowBulkModal(true)} variant="outline">
                <Users className="h-4 w-4 mr-2" />
                {texts.bulkIssue}
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {texts.createVoucher}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">{texts.loading}</p>
        </div>
      ) : !vouchers || vouchers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{texts.noVouchers}</p>
            <p className="text-sm text-gray-500 mb-4">{texts.noVouchersDescription}</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {texts.createFirstVoucher}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-indigo-100">
                        <Ticket className="h-6 w-6 text-royal-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 font-mono">
                            {voucher.code}
                          </h3>
                          <Badge variant="outline" className={cn('border', STATUS_COLORS[voucher.status])}>
                            {STATUS_LABELS[voucher.status]}
                          </Badge>
                          <Badge variant="outline">
                            {CERTIFICATION_LABELS[voucher.certification_type]}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {texts.user}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {voucher.user?.email || texts.unknown}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {texts.quiz}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {voucher.quiz?.title || texts.anyQuiz}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {texts.expires}
                        </div>
                        <div
                          className={cn(
                            'text-sm font-semibold',
                            isExpired(voucher.expires_at) ? 'text-red-700' : 'text-gray-900'
                          )}
                        >
                          {formatDate(voucher.expires_at)}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">{texts.created}</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(voucher.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {voucher.admin_notes && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-blue-600 font-semibold mb-1">{texts.adminNotes}</div>
                        <div className="text-sm text-blue-900">{voucher.admin_notes}</div>
                      </div>
                    )}

                    {/* Usage Info */}
                    {voucher.status === 'used' && voucher.used_at && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-xs text-green-600 font-semibold mb-1">{texts.usedLabel}</div>
                        <div className="text-sm text-green-900">
                          {texts.usedOn} {formatDate(voucher.used_at)}
                          {voucher.attempt && ` • ${texts.attemptRecorded}`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {voucher.status === 'available' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(voucher)}
                      disabled={revokeMutation.isPending}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      {texts.revoke}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Voucher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{texts.createDialogTitle}</DialogTitle>
            <DialogDescription>
              {texts.createDialogDescription}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Email */}
            <div>
              <Label htmlFor="user-email">
                {texts.userEmail} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user-email"
                type="email"
                placeholder={texts.userEmailPlaceholder}
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {texts.userEmailHelp}
              </p>
            </div>

            {/* Certification Type */}
            <div>
              <Label htmlFor="cert-type">
                {texts.certificationType} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.certification_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, certification_type: value as CertificationType })
                }
              >
                <SelectTrigger id="cert-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CP">{texts.cpLabel}</SelectItem>
                  <SelectItem value="SCP">{texts.scpLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quiz Link */}
            <div>
              <Label htmlFor="quiz-id">{texts.linkedQuiz}</Label>
              <Select
                value={formData.quiz_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, quiz_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="quiz-id">
                  <SelectValue placeholder={texts.linkedQuizPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{texts.anyQuiz}</SelectItem>
                  {quizzes
                    ?.filter((q) => q.certification_type === formData.certification_type)
                    .map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {texts.linkedQuizHelp}
              </p>
            </div>

            {/* Validity */}
            <div>
              <Label htmlFor="validity-months">
                {texts.validityMonths} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="validity-months"
                type="number"
                min="1"
                value={formData.validity_months}
                onChange={(e) => setFormData({ ...formData, validity_months: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {texts.validityHelp}
              </p>
            </div>

            {/* Admin Notes */}
            <div>
              <Label htmlFor="admin-notes">{texts.adminNotesLabel}</Label>
              <Textarea
                id="admin-notes"
                placeholder={texts.adminNotesPlaceholder}
                value={formData.admin_notes}
                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {texts.createVoucher}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Issue Vouchers Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{texts.bulkModalTitle}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {texts.bulkModalDescription}
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <Label htmlFor="bulk-emails">
                    {texts.emailAddresses} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="bulk-emails"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    placeholder={texts.emailPlaceholder}
                    rows={6}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {texts.emailHelp}
                  </p>
                </div>

                {/* Certification Type */}
                <div>
                  <Label htmlFor="bulk-cert-type">
                    {texts.certificationType} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={bulkCertType} onValueChange={(v) => setBulkCertType(v as CertificationType)}>
                    <SelectTrigger id="bulk-cert-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CP">{texts.cpLabelFull}</SelectItem>
                      <SelectItem value="SCP">{texts.scpLabelFull}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiration Date */}
                <div>
                  <Label htmlFor="bulk-expires">
                    {texts.expiresAt} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    id="bulk-expires"
                    value={bulkExpiresAt}
                    onChange={(e) => setBulkExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="bulk-notes">{texts.adminNotesOptional}</Label>
                  <Textarea
                    id="bulk-notes"
                    value={bulkAdminNotes}
                    onChange={(e) => setBulkAdminNotes(e.target.value)}
                    placeholder={texts.adminNotesModalPlaceholder}
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
                <Button
                  onClick={() => setShowBulkModal(false)}
                  variant="outline"
                  disabled={createVouchersBulkMutation.isPending}
                >
                  {texts.cancel}
                </Button>
                <Button
                  onClick={handleBulkIssuance}
                  disabled={createVouchersBulkMutation.isPending || !bulkEmails.trim() || !bulkExpiresAt}
                >
                  {createVouchersBulkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {texts.creatingVouchers}
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      {texts.issueVouchers}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

Vouchers.displayName = 'Vouchers';
