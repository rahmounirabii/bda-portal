/**
 * Certification Exams Page
 *
 * Complete workflow:
 * 1. Check if user has valid voucher for the exam type
 * 2. If voucher exists, check if exam is scheduled
 * 3. If scheduled, check if it's exam time (can launch)
 * 4. Allow user to take exam only when all conditions are met
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { CertificationExamService, type CertificationExam } from '@/entities/certification-exam';
import { VoucherService } from '@/entities/quiz/voucher.service';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Award,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  Ticket,
  ArrowRight,
  Lock,
  Play,
  ShoppingCart,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type ExamStatus = 'no_voucher' | 'has_voucher' | 'scheduled' | 'ready' | 'certified';

// DEV MODE: Set to true to bypass exam time window check for testing
// WARNING: Set to false for production!
const DEV_MODE_SKIP_TIME_CHECK = true;

interface ExamWithStatus extends CertificationExam {
  userStatus: ExamStatus;
  voucher?: any;
  booking?: any;
}

export default function TakeCertificationExam() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState<'CP' | 'SCP' | undefined>();

  const t = {
    en: {
      // Header
      title: 'Certification Exams',
      subtitle: 'Take official certification exams to earn your CP™ or SCP™ credential',
      // Info Banner
      howToTake: 'How to Take an Exam',
      step1Title: 'Purchase a voucher',
      step1Desc: 'Buy an exam voucher from our store',
      step2Title: 'Schedule your exam',
      step2Desc: 'Pick a date and time that works for you',
      step3Title: 'Take the exam',
      step3Desc: 'Launch when your scheduled time arrives',
      // Filter Buttons
      allCertifications: 'All Certifications',
      cpCertified: 'CP™ - Certified Professional',
      scpCertified: 'SCP™ - Senior Certified Professional',
      // Section Titles
      availableExams: 'Available Exams',
      yourVouchers: 'Your Vouchers',
      attemptHistory: 'Your Attempt History',
      // Status Badges
      certification: 'Certification',
      certified: 'Certified',
      readyToStart: 'Ready to Start',
      scheduled: 'Scheduled',
      hasVoucher: 'Has Voucher',
      voucherRequired: 'Voucher Required',
      // Exam Info
      questions: 'Questions',
      minutes: 'Minutes',
      pass: 'Pass',
      // Difficulty
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      // Scheduled Info
      scheduledFor: 'Scheduled for:',
      examWindowOpen: 'Your exam window is open!',
      canLaunchNow: 'You can launch the exam now.',
      // Buttons
      alreadyCertified: 'Already Certified',
      purchaseVoucher: 'Purchase Voucher',
      scheduleExam: 'Schedule Exam',
      waitingForTime: 'Waiting for Exam Time',
      launchBefore: 'You can launch 15 minutes before your scheduled time',
      launchExamNow: 'Launch Exam Now',
      // Empty State
      noExamsAvailable: 'No Exams Available',
      noExamsDesc: 'No certification exams are available at the moment. Please check back later or contact support for more information.',
      // Vouchers
      available: 'Available',
      expires: 'Expires',
      // History Table
      exam: 'Exam',
      type: 'Type',
      date: 'Date',
      score: 'Score',
      status: 'Status',
      passed: 'Passed',
      failed: 'Failed',
      inProgress: 'In Progress',
      completed: 'Completed',
      unknownExam: 'Unknown Exam',
    },
    ar: {
      // Header
      title: 'امتحانات الشهادات',
      subtitle: 'أدِّ امتحانات الشهادات الرسمية للحصول على اعتماد CP™ أو SCP™',
      // Info Banner
      howToTake: 'كيفية أداء الامتحان',
      step1Title: 'شراء قسيمة',
      step1Desc: 'اشترِ قسيمة امتحان من متجرنا',
      step2Title: 'جدولة امتحانك',
      step2Desc: 'اختر التاريخ والوقت المناسب لك',
      step3Title: 'أدِّ الامتحان',
      step3Desc: 'ابدأ عند حلول الموعد المحدد',
      // Filter Buttons
      allCertifications: 'جميع الشهادات',
      cpCertified: 'CP™ - محترف معتمد',
      scpCertified: 'SCP™ - محترف معتمد أول',
      // Section Titles
      availableExams: 'الامتحانات المتاحة',
      yourVouchers: 'قسائمك',
      attemptHistory: 'سجل محاولاتك',
      // Status Badges
      certification: 'شهادة',
      certified: 'معتمد',
      readyToStart: 'جاهز للبدء',
      scheduled: 'مجدول',
      hasVoucher: 'لديك قسيمة',
      voucherRequired: 'قسيمة مطلوبة',
      // Exam Info
      questions: 'سؤال',
      minutes: 'دقيقة',
      pass: 'النجاح',
      // Difficulty
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      // Scheduled Info
      scheduledFor: 'مجدول في:',
      examWindowOpen: 'نافذة الامتحان مفتوحة!',
      canLaunchNow: 'يمكنك بدء الامتحان الآن.',
      // Buttons
      alreadyCertified: 'معتمد بالفعل',
      purchaseVoucher: 'شراء قسيمة',
      scheduleExam: 'جدولة الامتحان',
      waitingForTime: 'في انتظار موعد الامتحان',
      launchBefore: 'يمكنك البدء قبل 15 دقيقة من موعدك المحدد',
      launchExamNow: 'ابدأ الامتحان الآن',
      // Empty State
      noExamsAvailable: 'لا توجد امتحانات متاحة',
      noExamsDesc: 'لا توجد امتحانات شهادات متاحة حالياً. يرجى المراجعة لاحقاً أو التواصل مع الدعم لمزيد من المعلومات.',
      // Vouchers
      available: 'متاحة',
      expires: 'تنتهي في',
      // History Table
      exam: 'الامتحان',
      type: 'النوع',
      date: 'التاريخ',
      score: 'الدرجة',
      status: 'الحالة',
      passed: 'ناجح',
      failed: 'راسب',
      inProgress: 'قيد التقدم',
      completed: 'مكتمل',
      unknownExam: 'امتحان غير معروف',
    }
  };

  const texts = t[language];

  // Fetch available exams
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['available-certification-exams', selectedType],
    queryFn: async () => {
      const result = await CertificationExamService.getAvailableCertificationExams(selectedType);
      if (result.error) throw result.error;
      return result.data || [];
    },
  });

  // Fetch user's vouchers (available or assigned = usable vouchers)
  const { data: vouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ['user-vouchers'],
    queryFn: async () => {
      // Fetch both available and assigned vouchers
      const { data, error } = await supabase
        .from('exam_vouchers')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['available', 'assigned'])
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's exam bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-exam-bookings'],
    queryFn: async () => {
      // Fetch from exam_bookings table (scheduled or rescheduled = active bookings)
      const { data, error } = await supabase
        .from('exam_bookings')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['scheduled', 'rescheduled']);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user attempt history
  const { data: history } = useQuery({
    queryKey: ['certification-attempt-history'],
    queryFn: async () => {
      const result = await CertificationExamService.getUserAttemptHistory();
      if (result.error) throw result.error;
      return result.data || [];
    },
  });

  // Combine exam data with user status
  const getExamWithStatus = (exam: any): ExamWithStatus => {
    // Check if already certified
    if (exam.is_certified) {
      return { ...exam, userStatus: 'certified' };
    }

    // PRIORITY 1: Check if user has a booking for this exam FIRST
    const booking = bookings?.find(
      (b: any) => b.quiz_id === exam.id && ['scheduled', 'rescheduled'].includes(b.status)
    );

    // If booking exists, find associated voucher (can be available or assigned)
    if (booking) {
      const voucher = vouchers?.find(
        (v: any) =>
          v.certification_type === exam.certification_type &&
          (v.status === 'available' || v.status === 'assigned') &&
          (!v.quiz_id || v.quiz_id === exam.id)
      );

      // DEV MODE: Skip time check and always allow exam launch
      if (DEV_MODE_SKIP_TIME_CHECK) {
        return { ...exam, userStatus: 'ready', voucher, booking };
      }

    // Check if exam is ready to start (within time window)
    const now = new Date();
    const examStart = new Date(booking.scheduled_start_time);
    const examEnd = new Date(booking.scheduled_end_time);
    const windowStart = new Date(examStart.getTime() - 15 * 60 * 1000); // 15 min before

    if (now >= windowStart && now <= examEnd) {
      return { ...exam, userStatus: 'ready', voucher, booking };
    }

      return { ...exam, userStatus: 'scheduled', voucher, booking };
    }

    // PRIORITY 2: No booking - check if user has an available voucher
    const voucher = vouchers?.find(
      (v: any) =>
        v.certification_type === exam.certification_type &&
        v.status === 'available' &&
        (!v.quiz_id || v.quiz_id === exam.id)
    );

    if (voucher) {
      return { ...exam, userStatus: 'has_voucher', voucher };
    }

    // No voucher and no booking - user needs to purchase
    return { ...exam, userStatus: 'no_voucher' };
  };

  const examsWithStatus: ExamWithStatus[] =
    exams?.map((exam: any) => getExamWithStatus(exam)) || [];

  const isLoading = examsLoading || vouchersLoading || bookingsLoading;

  // Handlers
  const handleBuyVoucher = (certType: string) => {
    // Redirect to store/purchase page
    window.open('https://bda-association.com/shop', '_blank');
  };

  const handleScheduleExam = (exam: ExamWithStatus) => {
    navigate(`/schedule-exam?quiz_id=${exam.id}&voucher_id=${exam.voucher?.id}`);
  };

  const handleLaunchExam = (exam: ExamWithStatus) => {
    navigate(`/exam-launch?booking_id=${exam.booking?.id}&quiz_id=${exam.id}`);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getDifficultyLabel = (level: string) => {
    if (level === 'easy') return texts.easy;
    if (level === 'medium') return texts.medium;
    return texts.hard;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8" />
          {texts.title}
        </h1>
        <p className="mt-2 opacity-90">
          {texts.subtitle}
        </p>
      </div>

      {/* Info Banner */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">{texts.howToTake}</AlertTitle>
        <AlertDescription className="text-blue-800">
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>
              <strong>{texts.step1Title}</strong> - {texts.step1Desc}
            </li>
            <li>
              <strong>{texts.step2Title}</strong> - {texts.step2Desc}
            </li>
            <li>
              <strong>{texts.step3Title}</strong> - {texts.step3Desc}
            </li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Certification Type Selector */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <Button
          onClick={() => setSelectedType(undefined)}
          variant={!selectedType ? 'default' : 'outline'}
          className={!selectedType ? 'bg-blue-600' : ''}
        >
          {texts.allCertifications}
        </Button>
        <Button
          onClick={() => setSelectedType('CP')}
          variant={selectedType === 'CP' ? 'default' : 'outline'}
          className={selectedType === 'CP' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {texts.cpCertified}
        </Button>
        <Button
          onClick={() => setSelectedType('SCP')}
          variant={selectedType === 'SCP' ? 'default' : 'outline'}
          className={selectedType === 'SCP' ? 'bg-purple-600 hover:bg-purple-700' : ''}
        >
          {texts.scpCertified}
        </Button>
      </div>

      {/* Available Exams */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{texts.availableExams}</h2>

        {examsWithStatus && examsWithStatus.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {examsWithStatus.map((exam) => (
              <Card
                key={exam.id}
                className={`relative overflow-hidden transition hover:shadow-lg ${
                  exam.certification_type === 'CP'
                    ? 'border-l-4 border-l-green-500'
                    : 'border-l-4 border-l-purple-500'
                }`}
              >
                <CardHeader className="pb-3">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={
                        exam.certification_type === 'CP'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-purple-100 text-purple-800 border-purple-300'
                      }
                    >
                      {exam.certification_type}™ {texts.certification}
                    </Badge>

                    {/* User Status Badge */}
                    {exam.userStatus === 'certified' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {texts.certified}
                      </Badge>
                    )}
                    {exam.userStatus === 'ready' && (
                      <Badge className="bg-green-100 text-green-800 animate-pulse">
                        <Play className="w-3 h-3 mr-1" />
                        {texts.readyToStart}
                      </Badge>
                    )}
                    {exam.userStatus === 'scheduled' && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Calendar className="w-3 h-3 mr-1" />
                        {texts.scheduled}
                      </Badge>
                    )}
                    {exam.userStatus === 'has_voucher' && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Ticket className="w-3 h-3 mr-1" />
                        {texts.hasVoucher}
                      </Badge>
                    )}
                    {exam.userStatus === 'no_voucher' && (
                      <Badge variant="outline" className="text-gray-500">
                        <Lock className="w-3 h-3 mr-1" />
                        {texts.voucherRequired}
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-xl">
                    {language === 'ar' && exam.title_ar ? exam.title_ar : exam.title}
                  </CardTitle>
                  {exam.description && (
                    <CardDescription>
                      {language === 'ar' && exam.description_ar ? exam.description_ar : exam.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Exam Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FileText size={16} className="text-gray-400" />
                      <span>{exam.question_count || 0} {texts.questions}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-gray-400" />
                      <span>{exam.time_limit_minutes} {texts.minutes}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <TrendingUp size={16} className="text-gray-400" />
                      <span>{texts.pass}: {exam.passing_score_percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Award size={16} className="text-gray-400" />
                      <span>{getDifficultyLabel(exam.difficulty_level)}</span>
                    </div>
                  </div>

                  {/* Scheduled Info */}
                  {exam.booking && exam.userStatus === 'scheduled' && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>{texts.scheduledFor}</strong>{' '}
                        {formatDateTime(exam.booking.scheduled_start_time)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Ready to Start Info */}
                  {exam.booking && exam.userStatus === 'ready' && (
                    <Alert className="bg-green-50 border-green-200">
                      <Play className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>{texts.examWindowOpen}</strong> {texts.canLaunchNow}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    {exam.userStatus === 'certified' && (
                      <Button disabled variant="secondary" className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {texts.alreadyCertified}
                      </Button>
                    )}

                    {exam.userStatus === 'no_voucher' && (
                      <Button
                        onClick={() => handleBuyVoucher(exam.certification_type)}
                        variant="outline"
                        className="w-full"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {texts.purchaseVoucher}
                      </Button>
                    )}

                    {exam.userStatus === 'has_voucher' && (
                      <Button
                        onClick={() => handleScheduleExam(exam)}
                        className={`w-full ${
                          exam.certification_type === 'CP'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {texts.scheduleExam}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}

                    {exam.userStatus === 'scheduled' && (
                      <div className="space-y-2">
                        <Button disabled variant="secondary" className="w-full">
                          <Clock className="w-4 h-4 mr-2" />
                          {texts.waitingForTime}
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          {texts.launchBefore}
                        </p>
                      </div>
                    )}

                    {exam.userStatus === 'ready' && (
                      <Button
                        onClick={() => handleLaunchExam(exam)}
                        className="w-full bg-green-600 hover:bg-green-700 animate-pulse"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {texts.launchExamNow}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-900">{texts.noExamsAvailable}</AlertTitle>
            <AlertDescription className="text-yellow-800">
              {texts.noExamsDesc}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* User's Vouchers Section */}
      {vouchers && vouchers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{texts.yourVouchers}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vouchers.map((voucher: any) => (
              <Card key={voucher.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={
                        voucher.certification_type === 'CP'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }
                    >
                      {voucher.certification_type}™
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        voucher.status === 'available'
                          ? 'text-green-600 border-green-300'
                          : 'text-gray-500'
                      }
                    >
                      {voucher.status === 'available' ? texts.available : voucher.status}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-gray-600 mb-2">{voucher.code}</p>
                  {voucher.expires_at && (
                    <p className="text-xs text-gray-500">
                      {texts.expires}: {new Date(voucher.expires_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attempt History */}
      {history && history.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{texts.attemptHistory}</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {texts.exam}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {texts.type}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {texts.date}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {texts.score}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {texts.status}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {language === 'ar' && attempt.quiz?.title_ar
                            ? attempt.quiz.title_ar
                            : attempt.quiz?.title || texts.unknownExam}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            attempt.quiz?.certification_type === 'CP'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }
                        >
                          {attempt.quiz?.certification_type}™
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(attempt.started_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {attempt.score !== null ? (
                          <span
                            className={`font-semibold ${
                              attempt.passed ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {attempt.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.passed === true && (
                          <Badge className="bg-green-100 text-green-800">{texts.passed}</Badge>
                        )}
                        {attempt.passed === false && (
                          <Badge className="bg-red-100 text-red-800">{texts.failed}</Badge>
                        )}
                        {attempt.passed === null && !attempt.completed_at && (
                          <Badge className="bg-yellow-100 text-yellow-800">{texts.inProgress}</Badge>
                        )}
                        {attempt.passed === null && attempt.completed_at && (
                          <Badge className="bg-gray-100 text-gray-800">{texts.completed}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
