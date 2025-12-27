import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Award,
  Loader2,
  Plus,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { useUserCertifications } from '@/entities/certifications';
import {
  usePdcEntries,
  useCreatePdcEntry,
  useUserPdcSummary,
  ACTIVITY_TYPE_LABELS,
  STATUS_LABELS,
} from '@/entities/pdcs';
import type {
  CreatePdcEntryDTO,
  CertificationType,
  PdcActivityType,
} from '@/entities/pdcs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const translations = {
  en: {
    // Header
    title: 'PDC Management',
    subtitle: 'Track and submit Professional Development Credits',
    // Status badges
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    // No certification
    certificationRequired: 'Certification Required',
    certificationRequiredDesc: 'You must be a certified BDA professional (BDA-CP™ or BDA-SCP™) to submit PDCs. Professional Development Credits are only available to active certification holders.',
    certificationRequiredCard: 'The PDC module is available exclusively to certified BDA professionals. Earn your BDA-CP™ or BDA-SCP™ certification to access this feature.',
    learnAboutCertification: 'Learn About Certification',
    // Submit button & dialog
    submitPdc: 'Submit PDC',
    submitPdcEntry: 'Submit PDC Entry',
    submitPdcDesc: 'Submit your professional development activity for credit approval',
    // Form labels
    certificationTypeLabel: 'Certification Type',
    autoDetected: '(Auto-detected from your active certification)',
    activityType: 'Activity Type',
    activityTitleEn: 'Activity Title (English)',
    activityTitleAr: 'Activity Title (Arabic)',
    activityTitlePlaceholder: 'e.g., Data Analytics Workshop',
    activityTitleArPlaceholder: 'عنوان النشاط',
    description: 'Description',
    descriptionPlaceholder: 'Brief description of the activity and what you learned',
    creditsClaimed: 'Credits Claimed',
    activityDate: 'Activity Date',
    programId: 'PDP Program ID',
    programIdPlaceholder: 'e.g., BDA-PDP-2024-001',
    programIdRequired: 'Required: Official PDP Provider program ID (min 3 characters)',
    programIdError: 'Program ID is required and must be at least 3 characters',
    certificateProof: 'Certificate / Proof of Completion',
    selectedFile: 'Selected',
    uploadHint: 'Upload certificate, completion letter, or proof of participation (PDF, JPG, PNG)',
    additionalNotes: 'Additional Notes',
    notesPlaceholder: 'Any additional information for the reviewer',
    cancel: 'Cancel',
    // Progress
    recertificationProgress: 'Recertification Progress',
    pdcsCompleted: (current: number, total: number) => `${current} / ${total} PDCs completed`,
    pdcsRequirement: 'You need 60 approved PDC credits for recertification',
    // Recertification CTA
    readyForRecertification: 'Ready for Recertification!',
    recertificationCongrats: 'Congratulations! You have completed the 60 PDCs required for recertification. Click below to finalize your renewal process.',
    purchaseRecertification: 'Purchase Recertification',
    // Summary cards
    cpCredits: 'CP™ Credits',
    scpCredits: 'SCP™ Credits',
    last3Years: 'Last 3 years',
    approvedCredits: 'Approved Credits',
    pendingCredits: 'Pending Credits',
    totalEntries: 'Total Entries',
    // Table
    myPdcEntries: 'My PDC Entries',
    myPdcEntriesDesc: 'Track your submitted professional development activities',
    activity: 'Activity',
    type: 'Type',
    cert: 'Cert',
    date: 'Date',
    credits: 'Credits',
    status: 'Status',
    submitted: 'Submitted',
    proof: 'Proof',
    claimed: 'Claimed',
    approvedLabel: 'Approved',
    noEntries: 'No PDC entries yet. Submit your first activity above!',
    // Toast
    downloadFailed: 'Failed to download certificate',
    generateUrlFailed: 'Failed to generate download URL',
  },
  ar: {
    // Header
    title: 'إدارة PDC',
    subtitle: 'تتبع وتقديم نقاط التطوير المهني',
    // Status badges
    approved: 'معتمد',
    rejected: 'مرفوض',
    pending: 'قيد الانتظار',
    // No certification
    certificationRequired: 'الشهادة مطلوبة',
    certificationRequiredDesc: 'يجب أن تكون محترفاً معتمداً من BDA (BDA-CP™ أو BDA-SCP™) لتقديم PDCs. نقاط التطوير المهني متاحة فقط لحاملي الشهادات النشطة.',
    certificationRequiredCard: 'وحدة PDC متاحة حصرياً لمحترفي BDA المعتمدين. احصل على شهادة BDA-CP™ أو BDA-SCP™ للوصول إلى هذه الميزة.',
    learnAboutCertification: 'تعرف على الشهادة',
    // Submit button & dialog
    submitPdc: 'تقديم PDC',
    submitPdcEntry: 'تقديم إدخال PDC',
    submitPdcDesc: 'قدم نشاط التطوير المهني الخاص بك للموافقة على النقاط',
    // Form labels
    certificationTypeLabel: 'نوع الشهادة',
    autoDetected: '(تم اكتشافه تلقائياً من شهادتك النشطة)',
    activityType: 'نوع النشاط',
    activityTitleEn: 'عنوان النشاط (بالإنجليزية)',
    activityTitleAr: 'عنوان النشاط (بالعربية)',
    activityTitlePlaceholder: 'مثال: ورشة عمل تحليل البيانات',
    activityTitleArPlaceholder: 'عنوان النشاط',
    description: 'الوصف',
    descriptionPlaceholder: 'وصف موجز للنشاط وما تعلمته',
    creditsClaimed: 'النقاط المطلوبة',
    activityDate: 'تاريخ النشاط',
    programId: 'معرف برنامج PDP',
    programIdPlaceholder: 'مثال: BDA-PDP-2024-001',
    programIdRequired: 'مطلوب: معرف برنامج مزود PDP الرسمي (3 أحرف على الأقل)',
    programIdError: 'معرف البرنامج مطلوب ويجب أن يكون 3 أحرف على الأقل',
    certificateProof: 'الشهادة / إثبات الإتمام',
    selectedFile: 'المحدد',
    uploadHint: 'قم بتحميل الشهادة أو خطاب الإتمام أو إثبات المشاركة (PDF، JPG، PNG)',
    additionalNotes: 'ملاحظات إضافية',
    notesPlaceholder: 'أي معلومات إضافية للمراجع',
    cancel: 'إلغاء',
    // Progress
    recertificationProgress: 'تقدم إعادة الاعتماد',
    pdcsCompleted: (current: number, total: number) => `${current} / ${total} PDCs مكتملة`,
    pdcsRequirement: 'تحتاج إلى 60 نقطة PDC معتمدة لإعادة الاعتماد',
    // Recertification CTA
    readyForRecertification: 'جاهز لإعادة الاعتماد!',
    recertificationCongrats: 'تهانينا! لقد أكملت 60 PDC المطلوبة لإعادة الاعتماد. انقر أدناه لإنهاء عملية التجديد.',
    purchaseRecertification: 'شراء إعادة الاعتماد',
    // Summary cards
    cpCredits: 'نقاط CP™',
    scpCredits: 'نقاط SCP™',
    last3Years: 'آخر 3 سنوات',
    approvedCredits: 'النقاط المعتمدة',
    pendingCredits: 'النقاط المعلقة',
    totalEntries: 'إجمالي الإدخالات',
    // Table
    myPdcEntries: 'إدخالات PDC الخاصة بي',
    myPdcEntriesDesc: 'تتبع أنشطة التطوير المهني المقدمة',
    activity: 'النشاط',
    type: 'النوع',
    cert: 'الشهادة',
    date: 'التاريخ',
    credits: 'النقاط',
    status: 'الحالة',
    submitted: 'تم التقديم',
    proof: 'الإثبات',
    claimed: 'المطلوبة',
    approvedLabel: 'المعتمدة',
    noEntries: 'لا توجد إدخالات PDC بعد. قدم أول نشاط لك أعلاه!',
    // Toast
    downloadFailed: 'فشل في تحميل الشهادة',
    generateUrlFailed: 'فشل في إنشاء رابط التحميل',
  }
};

export default function PDCs() {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  const texts = translations[language];
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // US1: Check certification eligibility
  const { data: certificationsResult } = useUserCertifications(user?.id || '', { status: 'active' });
  const activeCertifications = certificationsResult?.data || [];
  const hasActiveCertification = activeCertifications.length > 0;
  const primaryCertification = activeCertifications[0]; // Get first active certification

  // Fetch data
  const { data: entries, isLoading } = usePdcEntries(user?.id ? { user_id: user.id } : {});
  const { data: cpSummary } = useUserPdcSummary(user?.id || '', 'CP');
  const { data: scpSummary } = useUserPdcSummary(user?.id || '', 'SCP');

  // US4: Calculate total approved PDCs for progress
  const totalApprovedPDCs = (cpSummary?.data?.approved_credits || 0) + (scpSummary?.data?.approved_credits || 0);
  const progressPercentage = Math.min((totalApprovedPDCs / 60) * 100, 100);
  const needsRecertification = totalApprovedPDCs >= 60;

  const createMutation = useCreatePdcEntry();

  // US2: Auto-detect certification type from user's active certification
  const autoDetectedCertType: CertificationType = primaryCertification?.certification_type || 'CP';

  const [submitForm, setSubmitForm] = useState<{
    activity_type: PdcActivityType;
    activity_title: string;
    activity_title_ar: string;
    activity_description: string;
    credits_claimed: number;
    activity_date: string;
    program_id: string;
    certificate_file: File | null;
    notes: string;
  }>({
    activity_type: 'training_course',
    activity_title: '',
    activity_title_ar: '',
    activity_description: '',
    credits_claimed: 1,
    activity_date: new Date().toISOString().split('T')[0],
    program_id: '',
    certificate_file: null,
    notes: '',
  });

  const handleSubmit = async () => {
    if (!user?.id) return;

    // US3: Validate program_id is provided
    if (!submitForm.program_id || submitForm.program_id.trim().length < 3) {
      toast.error(texts.programIdError);
      return;
    }

    const dto: CreatePdcEntryDTO = {
      certification_type: autoDetectedCertType, // US2: Auto-detected from user's certification
      activity_type: submitForm.activity_type,
      activity_title: submitForm.activity_title,
      activity_title_ar: submitForm.activity_title_ar || undefined,
      activity_description: submitForm.activity_description || undefined,
      credits_claimed: submitForm.credits_claimed,
      activity_date: submitForm.activity_date,
      program_id: submitForm.program_id, // US3: Now mandatory
      certificate_file: submitForm.certificate_file || undefined,
      notes: submitForm.notes || undefined,
    };

    await createMutation.mutateAsync({ userId: user.id, dto });
    setIsSubmitOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSubmitForm({
      activity_type: 'training_course',
      activity_title: '',
      activity_title_ar: '',
      activity_description: '',
      credits_claimed: 1,
      activity_date: new Date().toISOString().split('T')[0],
      program_id: '',
      certificate_file: null,
      notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {texts.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="default" className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            {texts.rejected}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            {texts.pending}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // US1: Eligibility guard - must have active certification
  if (!hasActiveCertification) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            {texts.title}
          </h1>
          <p className="mt-2 opacity-90">{texts.subtitle}</p>
        </div>

        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900">{texts.certificationRequired}</AlertTitle>
          <AlertDescription className="text-red-800">
            {texts.certificationRequiredDesc}
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{texts.certificationRequired}</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {texts.certificationRequiredCard}
            </p>
            <Button
              size="lg"
              onClick={() => window.open('https://bda-global.org/certification', '_blank')}
            >
              {texts.learnAboutCertification}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">{texts.title}</h1>
              <p className="mt-2 opacity-90">
                {texts.subtitle}
              </p>
            </div>
          </div>
          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" onClick={resetForm} disabled={!hasActiveCertification}>
                <Plus className="h-5 w-5 mr-2" />
                {texts.submitPdc}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{texts.submitPdcEntry}</DialogTitle>
                <DialogDescription>
                  {texts.submitPdcDesc}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* US2: Show auto-detected certification type (read-only) */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{texts.certificationTypeLabel}:</strong> BDA-{autoDetectedCertType}™
                    <span className="ml-2 text-xs">{texts.autoDetected}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{texts.activityType} *</Label>
                    <Select
                      value={submitForm.activity_type}
                      onValueChange={(value) =>
                        setSubmitForm({ ...submitForm, activity_type: value as PdcActivityType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{texts.activityTitleEn} *</Label>
                    <Input
                      value={submitForm.activity_title}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, activity_title: e.target.value })
                      }
                      placeholder={texts.activityTitlePlaceholder}
                    />
                  </div>
                  <div>
                    <Label>{texts.activityTitleAr}</Label>
                    <Input
                      value={submitForm.activity_title_ar}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, activity_title_ar: e.target.value })
                      }
                      placeholder={texts.activityTitleArPlaceholder}
                    />
                  </div>
                </div>

                <div>
                  <Label>{texts.description}</Label>
                  <Textarea
                    value={submitForm.activity_description}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, activity_description: e.target.value })
                    }
                    placeholder={texts.descriptionPlaceholder}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{texts.creditsClaimed} *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={submitForm.credits_claimed}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, credits_claimed: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>

                  <div>
                    <Label>{texts.activityDate} *</Label>
                    <Input
                      type="date"
                      value={submitForm.activity_date}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, activity_date: e.target.value })
                      }
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label>{texts.programId} *</Label>
                    <Input
                      value={submitForm.program_id}
                      onChange={(e) =>
                        setSubmitForm({ ...submitForm, program_id: e.target.value })
                      }
                      placeholder={texts.programIdPlaceholder}
                      required
                      minLength={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {texts.programIdRequired}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>{texts.certificateProof} *</Label>
                  <Input
                    type="file"
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, certificate_file: e.target.files?.[0] || null })
                    }
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {submitForm.certificate_file && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {texts.selectedFile}: {submitForm.certificate_file.name} (
                      {(submitForm.certificate_file.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {texts.uploadHint}
                  </p>
                </div>

                <div>
                  <Label>{texts.additionalNotes}</Label>
                  <Textarea
                    value={submitForm.notes}
                    onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                    placeholder={texts.notesPlaceholder}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>
                  {texts.cancel}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createMutation.isPending ||
                    !submitForm.activity_title ||
                    !submitForm.certificate_file
                  }
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Upload className="h-4 w-4 mr-2" />
                  {texts.submitPdc}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* US4: PDC Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold">{texts.recertificationProgress}</h3>
              <p className="text-sm text-gray-500">
                {texts.pdcsCompleted(totalApprovedPDCs, 60)}
              </p>
            </div>
            <div className="text-2xl font-bold text-royal-600">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-gray-500 mt-2">
            {texts.pdcsRequirement}
          </p>
        </CardContent>
      </Card>

      {/* US5: Recertification CTA */}
      {needsRecertification && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900">{texts.readyForRecertification}</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-green-800">
            <span>
              {texts.recertificationCongrats}
            </span>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 ml-4"
              onClick={() => window.open('https://bda-global.org/en/store/bda-recertification/', '_blank')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {texts.purchaseRecertification}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cpSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                {texts.cpCredits}
              </CardTitle>
              <CardDescription>{texts.last3Years}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{texts.approvedCredits}</span>
                  <span className="text-2xl font-bold text-green-600">
                    {cpSummary.total_approved_credits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{texts.pendingCredits}</span>
                  <span className="text-xl font-semibold text-yellow-600">
                    {cpSummary.pending_credits}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">{texts.totalEntries}</span>
                  <span className="font-medium">{cpSummary.total_entries}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {scpSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-royal-600" />
                {texts.scpCredits}
              </CardTitle>
              <CardDescription>{texts.last3Years}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{texts.approvedCredits}</span>
                  <span className="text-2xl font-bold text-green-600">
                    {scpSummary.total_approved_credits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{texts.pendingCredits}</span>
                  <span className="text-xl font-semibold text-yellow-600">
                    {scpSummary.pending_credits}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">{texts.totalEntries}</span>
                  <span className="font-medium">{scpSummary.total_entries}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.myPdcEntries}</CardTitle>
          <CardDescription>{texts.myPdcEntriesDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{texts.activity}</TableHead>
                  <TableHead>{texts.type}</TableHead>
                  <TableHead>{texts.cert}</TableHead>
                  <TableHead>{texts.date}</TableHead>
                  <TableHead>{texts.credits}</TableHead>
                  <TableHead>{texts.status}</TableHead>
                  <TableHead>{texts.submitted}</TableHead>
                  <TableHead>{texts.proof}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries && entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="font-medium">{entry.activity_title}</div>
                        {entry.activity_title_ar && (
                          <div className="text-sm text-muted-foreground">{entry.activity_title_ar}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ACTIVITY_TYPE_LABELS[entry.activity_type]}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.certification_type}™</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(entry.activity_date)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{texts.claimed}: {entry.credits_claimed}</div>
                          {entry.credits_approved !== null && (
                            <div className="text-green-600 font-medium">
                              {texts.approvedLabel}: {entry.credits_approved}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="text-sm">{formatDate(entry.submission_date)}</TableCell>
                      <TableCell>
                        {entry.certificate_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const { data } = await supabase.storage
                                  .from('resources')
                                  .createSignedUrl(entry.certificate_url!, 3600);

                                if (data?.signedUrl) {
                                  window.open(data.signedUrl, '_blank');
                                } else {
                                  toast.error(texts.generateUrlFailed);
                                }
                              } catch (error) {
                                console.error('Download error:', error);
                                toast.error(texts.downloadFailed);
                              }
                            }}
                            title={texts.proof}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {texts.noEntries}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

PDCs.displayName = 'PDCs';
