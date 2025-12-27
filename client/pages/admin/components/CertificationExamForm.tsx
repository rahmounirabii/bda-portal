import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CertificationExamService, type CertificationExam, type CertificationExamType } from '@/entities/certification-exam';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CertificationExamFormProps {
  exam?: CertificationExam | null;
  onClose: () => void;
}

export default function CertificationExamForm({ exam, onClose }: CertificationExamFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isEditing = !!exam;

  const t = {
    en: {
      // Header
      editExam: 'Edit Certification Exam',
      createExam: 'Create New Certification Exam',
      // Form Labels
      certificationType: 'Certification Type',
      certifiedProfessional: 'Certified Professional',
      seniorCertifiedProfessional: 'Senior Certified Professional',
      titleEnglish: 'Title (English)',
      titleArabic: 'Title (Arabic)',
      descEnglish: 'Description (English)',
      descArabic: 'Description (Arabic)',
      difficultyLevel: 'Difficulty Level',
      timeLimit: 'Time Limit (minutes)',
      passingScore: 'Passing Score (%)',
      // Placeholders
      titlePlaceholder: 'e.g., Business Data Analytics Professional Certification',
      titleArPlaceholder: 'العنوان بالعربية',
      descPlaceholder: 'Describe the certification exam, its objectives, and what candidates will be assessed on...',
      descArPlaceholder: 'الوصف بالعربية...',
      // Difficulty Options
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      // Info Box
      importantNotes: 'Important Notes:',
      inactiveNote: 'The exam will be created in inactive state by default',
      addQuestionsNote: 'You need to add questions before activating the exam',
      activateNote: 'Once activated, candidates can take the exam',
      cpCertNote: 'CP™ certification will be issued upon passing',
      scpCertNote: 'SCP™ certification will be issued upon passing',
      // Buttons
      cancel: 'Cancel',
      createExamBtn: 'Create Exam',
      updateExam: 'Update Exam',
      creating: 'Creating...',
      updating: 'Updating...',
      // Validation & Toast
      success: 'Success',
      examCreated: 'Certification exam created successfully.',
      examUpdated: 'Certification exam updated successfully.',
      error: 'Error',
      createFailed: 'Failed to create certification exam.',
      updateFailed: 'Failed to update certification exam.',
      validationError: 'Validation Error',
      titleRequired: 'Title is required.',
      timeLimitRange: 'Time limit must be between 30 and 300 minutes.',
      passingScoreRange: 'Passing score must be between 50% and 100%.',
      minMax: 'Min: {min}, Max: {max}',
    },
    ar: {
      // Header
      editExam: 'تعديل امتحان الشهادة',
      createExam: 'إنشاء امتحان شهادة جديد',
      // Form Labels
      certificationType: 'نوع الشهادة',
      certifiedProfessional: 'محترف معتمد',
      seniorCertifiedProfessional: 'محترف معتمد أول',
      titleEnglish: 'العنوان (بالإنجليزية)',
      titleArabic: 'العنوان (بالعربية)',
      descEnglish: 'الوصف (بالإنجليزية)',
      descArabic: 'الوصف (بالعربية)',
      difficultyLevel: 'مستوى الصعوبة',
      timeLimit: 'الحد الزمني (بالدقائق)',
      passingScore: 'درجة النجاح (%)',
      // Placeholders
      titlePlaceholder: 'مثال: شهادة محترف تحليلات بيانات الأعمال',
      titleArPlaceholder: 'العنوان بالعربية',
      descPlaceholder: 'وصف امتحان الشهادة وأهدافه وما سيتم تقييم المرشحين عليه...',
      descArPlaceholder: 'الوصف بالعربية...',
      // Difficulty Options
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      // Info Box
      importantNotes: 'ملاحظات مهمة:',
      inactiveNote: 'سيتم إنشاء الامتحان في حالة غير نشطة افتراضياً',
      addQuestionsNote: 'تحتاج إلى إضافة أسئلة قبل تفعيل الامتحان',
      activateNote: 'بمجرد التفعيل، يمكن للمرشحين أداء الامتحان',
      cpCertNote: 'سيتم إصدار شهادة CP™ عند النجاح',
      scpCertNote: 'سيتم إصدار شهادة SCP™ عند النجاح',
      // Buttons
      cancel: 'إلغاء',
      createExamBtn: 'إنشاء الامتحان',
      updateExam: 'تحديث الامتحان',
      creating: 'جارٍ الإنشاء...',
      updating: 'جارٍ التحديث...',
      // Validation & Toast
      success: 'نجاح',
      examCreated: 'تم إنشاء امتحان الشهادة بنجاح.',
      examUpdated: 'تم تحديث امتحان الشهادة بنجاح.',
      error: 'خطأ',
      createFailed: 'فشل في إنشاء امتحان الشهادة.',
      updateFailed: 'فشل في تحديث امتحان الشهادة.',
      validationError: 'خطأ في التحقق',
      titleRequired: 'العنوان مطلوب.',
      timeLimitRange: 'يجب أن يكون الحد الزمني بين 30 و 300 دقيقة.',
      passingScoreRange: 'يجب أن تكون درجة النجاح بين 50% و 100%.',
      minMax: 'الحد الأدنى: {min}، الحد الأقصى: {max}',
    }
  };

  const texts = t[language];

  // Form state
  const [title, setTitle] = useState(exam?.title || '');
  const [titleAr, setTitleAr] = useState(exam?.title_ar || '');
  const [description, setDescription] = useState(exam?.description || '');
  const [descriptionAr, setDescriptionAr] = useState(exam?.description_ar || '');
  const [certificationType, setCertificationType] = useState<CertificationExamType>(
    exam?.certification_type || 'CP'
  );
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard'>(
    exam?.difficulty_level || 'medium'
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(exam?.time_limit_minutes || 120);
  const [passingScorePercentage, setPassingScorePercentage] = useState(
    exam?.passing_score_percentage || 70
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => CertificationExamService.createCertificationExam(data),
    onSuccess: () => {
      toast({
        title: texts.success,
        description: texts.examCreated,
      });
      queryClient.invalidateQueries({ queryKey: ['certification-exams'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: texts.error,
        description: error?.message || texts.createFailed,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      CertificationExamService.updateCertificationExam(id, data),
    onSuccess: () => {
      toast({
        title: texts.success,
        description: texts.examUpdated,
      });
      queryClient.invalidateQueries({ queryKey: ['certification-exams'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: texts.error,
        description: error?.message || texts.updateFailed,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast({
        title: texts.validationError,
        description: texts.titleRequired,
        variant: 'destructive',
      });
      return;
    }

    if (timeLimitMinutes < 30 || timeLimitMinutes > 300) {
      toast({
        title: texts.validationError,
        description: texts.timeLimitRange,
        variant: 'destructive',
      });
      return;
    }

    if (passingScorePercentage < 50 || passingScorePercentage > 100) {
      toast({
        title: texts.validationError,
        description: texts.passingScoreRange,
        variant: 'destructive',
      });
      return;
    }

    const formData = {
      title: title.trim(),
      title_ar: titleAr.trim() || undefined,
      description: description.trim() || undefined,
      description_ar: descriptionAr.trim() || undefined,
      certification_type: certificationType,
      difficulty_level: difficultyLevel,
      time_limit_minutes: timeLimitMinutes,
      passing_score_percentage: passingScorePercentage,
    };

    if (isEditing && exam) {
      updateMutation.mutate({ id: exam.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? texts.editExam : texts.createExam}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Certification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.certificationType} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCertificationType('CP')}
                className={`p-4 rounded-lg border-2 transition ${
                  certificationType === 'CP'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="font-bold text-lg">CP™</div>
                <div className="text-sm mt-1">{texts.certifiedProfessional}</div>
              </button>
              <button
                type="button"
                onClick={() => setCertificationType('SCP')}
                className={`p-4 rounded-lg border-2 transition ${
                  certificationType === 'SCP'
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="font-bold text-lg">SCP™</div>
                <div className="text-sm mt-1">{texts.seniorCertifiedProfessional}</div>
              </button>
            </div>
          </div>

          {/* Title (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.titleEnglish} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={texts.titlePlaceholder}
              required
            />
          </div>

          {/* Title (Arabic) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.titleArabic}
            </label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder={texts.titleArPlaceholder}
              dir="rtl"
            />
          </div>

          {/* Description (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.descEnglish}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={texts.descPlaceholder}
            />
          </div>

          {/* Description (Arabic) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.descArabic}
            </label>
            <textarea
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder={texts.descArPlaceholder}
              dir="rtl"
            />
          </div>

          {/* Grid: Difficulty, Time Limit, Passing Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts.difficultyLevel} <span className="text-red-500">*</span>
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="easy">{texts.easy}</option>
                <option value="medium">{texts.medium}</option>
                <option value="hard">{texts.hard}</option>
              </select>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts.timeLimit} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                min="30"
                max="300"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'الحد الأدنى: 30، الحد الأقصى: 300' : 'Min: 30, Max: 300'}</p>
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts.passingScore} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={passingScorePercentage}
                onChange={(e) => setPassingScorePercentage(parseInt(e.target.value) || 0)}
                min="50"
                max="100"
                step="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'الحد الأدنى: 50%، الحد الأقصى: 100%' : 'Min: 50%, Max: 100%'}</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">{texts.importantNotes}</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {texts.inactiveNote}</li>
              <li>• {texts.addQuestionsNote}</li>
              <li>• {texts.activateNote}</li>
              <li>• {certificationType === 'CP' ? texts.cpCertNote : texts.scpCertNote}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {texts.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                certificationType === 'CP'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSubmitting
                ? isEditing
                  ? texts.updating
                  : texts.creating
                : isEditing
                  ? texts.updateExam
                  : texts.createExamBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
