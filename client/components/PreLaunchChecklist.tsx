/**
 * Pre-Launch Checklist Component
 *
 * Displays a checklist of requirements before starting an exam
 * Requirements: task.md Step 6.3 - Exam Launch Workflow
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  FileCheck,
  Monitor,
  Camera,
  Calendar,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ChecklistItem {
  id: string;
  label: string;
  labelAr?: string;
  description?: string;
  descriptionAr?: string;
  status: 'pending' | 'checking' | 'passed' | 'failed' | 'skipped';
  required: boolean;
  icon: React.ReactNode;
}

export interface PreLaunchChecklistProps {
  bookingId?: string;
  quizId: string;
  userId: string;
  identityVerified?: boolean;
  honorCodeAccepted?: boolean;
  techCheckPassed?: boolean;
  photoVerified?: boolean;
  bookingConfirmed?: boolean;
  onAllChecksPassed?: () => void;
  onCheckIdentity?: () => void;
  onCheckHonorCode?: () => void;
  onCheckTech?: () => void;
  onCheckPhoto?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function PreLaunchChecklist({
  bookingId,
  quizId,
  userId,
  identityVerified = false,
  honorCodeAccepted = false,
  techCheckPassed = false,
  photoVerified = false,
  bookingConfirmed = true,
  onAllChecksPassed,
  onCheckIdentity,
  onCheckHonorCode,
  onCheckTech,
  onCheckPhoto,
}: PreLaunchChecklistProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Translations
  const t = {
    title: isRTL ? 'قائمة التحقق قبل الامتحان' : 'Pre-Exam Checklist',
    subtitle: isRTL
      ? 'يرجى إكمال جميع المتطلبات قبل بدء الامتحان'
      : 'Please complete all requirements before starting the exam',
    allPassed: isRTL ? 'جميع المتطلبات مكتملة!' : 'All requirements complete!',
    canProceed: isRTL ? 'يمكنك الآن بدء الامتحان' : 'You can now start the exam',
    someRequired: isRTL ? 'بعض المتطلبات غير مكتملة' : 'Some requirements are incomplete',
    completeFirst: isRTL ? 'يرجى إكمال المتطلبات المميزة أدناه' : 'Please complete the highlighted requirements below',
    complete: isRTL ? 'إكمال' : 'Complete',
    passed: isRTL ? 'مكتمل' : 'Passed',
    pending: isRTL ? 'معلق' : 'Pending',
    required: isRTL ? 'مطلوب' : 'Required',
    optional: isRTL ? 'اختياري' : 'Optional',
  };

  // Initialize checklist items
  useEffect(() => {
    const items: ChecklistItem[] = [
      {
        id: 'identity',
        label: 'Identity Verified',
        labelAr: 'التحقق من الهوية',
        description: 'Your identity has been verified',
        descriptionAr: 'تم التحقق من هويتك',
        status: identityVerified ? 'passed' : 'pending',
        required: true,
        icon: <Shield className="h-5 w-5" />,
      },
      {
        id: 'honor_code',
        label: 'Honor Code Accepted',
        labelAr: 'قبول ميثاق الشرف',
        description: 'You have accepted the honor code',
        descriptionAr: 'لقد وافقت على ميثاق الشرف',
        status: honorCodeAccepted ? 'passed' : 'pending',
        required: true,
        icon: <FileCheck className="h-5 w-5" />,
      },
      {
        id: 'tech_check',
        label: 'System Check Passed',
        labelAr: 'فحص النظام',
        description: 'Your system meets the requirements',
        descriptionAr: 'نظامك يلبي المتطلبات',
        status: techCheckPassed ? 'passed' : 'pending',
        required: true,
        icon: <Monitor className="h-5 w-5" />,
      },
      {
        id: 'photo',
        label: 'Photo Verification',
        labelAr: 'التحقق بالصورة',
        description: 'Upload a current photo for verification',
        descriptionAr: 'رفع صورة حالية للتحقق',
        status: photoVerified ? 'passed' : 'pending',
        required: false,
        icon: <Camera className="h-5 w-5" />,
      },
      {
        id: 'booking',
        label: 'Booking Confirmed',
        labelAr: 'تأكيد الحجز',
        description: 'Your exam booking is confirmed',
        descriptionAr: 'تم تأكيد حجز الامتحان',
        status: bookingConfirmed ? 'passed' : 'pending',
        required: true,
        icon: <Calendar className="h-5 w-5" />,
      },
    ];

    setChecklist(items);
  }, [identityVerified, honorCodeAccepted, techCheckPassed, photoVerified, bookingConfirmed]);

  // Calculate progress
  const requiredItems = checklist.filter(item => item.required);
  const passedRequired = requiredItems.filter(item => item.status === 'passed').length;
  const allRequiredPassed = passedRequired === requiredItems.length;
  const progressPercent = requiredItems.length > 0
    ? Math.round((passedRequired / requiredItems.length) * 100)
    : 0;

  // Call onAllChecksPassed when all required items pass
  useEffect(() => {
    if (allRequiredPassed && onAllChecksPassed) {
      onAllChecksPassed();
    }
  }, [allRequiredPassed, onAllChecksPassed]);

  const handleItemClick = (itemId: string) => {
    switch (itemId) {
      case 'identity':
        onCheckIdentity?.();
        break;
      case 'honor_code':
        onCheckHonorCode?.();
        break;
      case 'tech_check':
        onCheckTech?.();
        break;
      case 'photo':
        onCheckPhoto?.();
        break;
    }
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ChecklistItem['status'], required: boolean) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
      case 'skipped':
        return 'bg-gray-50 border-gray-200';
      default:
        return required ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {passedRequired} / {requiredItems.length} {isRTL ? 'متطلبات مكتملة' : 'requirements complete'}
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${getStatusColor(
                item.status,
                item.required
              )}`}
            >
              {/* Icon */}
              <div className={`p-2 rounded-full ${
                item.status === 'passed' ? 'bg-green-100' :
                item.status === 'failed' ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                {item.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {isRTL ? item.labelAr || item.label : item.label}
                  </span>
                  {item.required ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {t.required}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {t.optional}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isRTL ? item.descriptionAr || item.description : item.description}
                </p>
              </div>

              {/* Status / Action */}
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                {item.status === 'pending' && item.id !== 'booking' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleItemClick(item.id)}
                    className="ml-2"
                  >
                    {t.complete}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Alert */}
        {allRequiredPassed ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{t.allPassed}</AlertTitle>
            <AlertDescription className="text-green-700">
              {t.canProceed}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">{t.someRequired}</AlertTitle>
            <AlertDescription className="text-yellow-700">
              {t.completeFirst}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
