/**
 * Learning System Dashboard
 * Main entry point showing 3 sections:
 * 1. Training Kits (Main Curriculum)
 * 2. Question Bank (Practice Questions)
 * 3. Flashcards (Quick Revision)
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCurriculumAccess } from '@/entities/curriculum';
import { useQuestionBankStats } from '@/entities/question-bank';
import { useFlashcardStats } from '@/entities/flashcards';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BookOpen,
  HelpCircle,
  Layers,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SectionCardProps {
  title: string;
  titleAr?: string;
  description: string;
  icon: React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
  }[];
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  color: 'blue' | 'green' | 'purple';
  isNew?: boolean;
  newLabel?: string;
}

function SectionCard({
  title,
  titleAr,
  description,
  icon,
  stats,
  primaryAction,
  color,
  isNew,
  newLabel = 'NEW',
}: SectionCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      icon: 'bg-blue-600 text-white',
      button: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      icon: 'bg-green-600 text-white',
      button: 'bg-green-600 hover:bg-green-700',
      text: 'text-green-600',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      icon: 'bg-purple-600 text-white',
      button: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`relative rounded-xl border-2 ${colors.border} ${colors.bg} p-6 transition-all hover:shadow-lg`}
    >
      {isNew && (
        <div className="absolute -top-3 -right-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          <Sparkles className="w-3 h-3" />
          {newLabel}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colors.icon} shadow-lg`}>{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {titleAr && (
            <p className="text-sm text-gray-500" dir="rtl">
              {titleAr}
            </p>
          )}
          <p className="text-gray-600 mt-2 text-sm">{description}</p>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className={`text-2xl font-bold ${colors.text}`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={primaryAction.onClick}
        className={`mt-6 w-full flex items-center justify-center gap-2 ${colors.button} text-white font-semibold py-3 px-4 rounded-lg transition-colors`}
      >
        {primaryAction.label}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function LearningSystemDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: {
      // Loading & Access
      loading: 'Loading your learning system...',
      accessRequired: 'Access Required',
      accessRequiredDesc: 'You need to purchase a certification program to access the Learning System. This includes Training Kits, Question Bank, and Flashcards.',
      purchaseNow: 'Purchase Now',
      // Header
      title: 'Learning System',
      subtitle: 'BDA Body of Competency Knowledge (BoCK) - Complete Learning Suite',
      // Access Banner
      accessValidUntil: 'Access valid until',
      daysRemaining: 'days remaining',
      considerRenewing: '- Consider renewing soon',
      // Quick Stats
      trainingProgress: 'Training Progress',
      questionsPracticed: 'Questions Practiced',
      cardsMastered: 'Cards Mastered',
      studyTime: 'Study Time',
      // Section Cards
      trainingKits: 'Training Kits',
      trainingKitsAr: 'حقائب تدريبية',
      trainingKitsDesc: 'Complete curriculum content organized by competencies. Read comprehensive material with text and images to build your knowledge foundation.',
      questionBank: 'Question Bank',
      questionBankAr: 'بنك الأسئلة',
      questionBankDesc: 'Practice with hundreds of multiple-choice questions. Get instant feedback and track your performance across all competencies.',
      flashcards: 'Flashcards',
      flashcardsAr: 'بطاقات المراجعة',
      flashcardsDesc: 'Quick revision cards with spaced repetition. Master key concepts through active recall and efficient memorization techniques.',
      // Stats Labels
      modules: 'Modules',
      lessons: 'Lessons',
      completed: 'Completed',
      totalQuestions: 'Total Questions',
      attempted: 'Attempted',
      avgScore: 'Avg Score',
      totalCards: 'Total Cards',
      dueToday: 'Due Today',
      mastered: 'Mastered',
      // Button Labels
      startLearning: 'Start Learning',
      practiceNow: 'Practice Now',
      studyFlashcards: 'Study Flashcards',
      // Learning Path
      recommendedPath: 'Recommended Learning Path',
      readContentFirst: 'Read the content first',
      memorizeKeyConcepts: 'Memorize key concepts',
      testYourKnowledge: 'Test your knowledge',
      new: 'NEW',
    },
    ar: {
      // Loading & Access
      loading: 'جارٍ تحميل نظام التعلم...',
      accessRequired: 'مطلوب صلاحية الوصول',
      accessRequiredDesc: 'تحتاج إلى شراء برنامج شهادة للوصول إلى نظام التعلم. يتضمن ذلك حقائب التدريب وبنك الأسئلة وبطاقات المراجعة.',
      purchaseNow: 'اشترِ الآن',
      // Header
      title: 'نظام التعلم',
      subtitle: 'هيكل معارف كفاءات BDA (BoCK) - مجموعة التعلم الكاملة',
      // Access Banner
      accessValidUntil: 'الوصول صالح حتى',
      daysRemaining: 'يوم متبقي',
      considerRenewing: '- يُنصح بالتجديد قريباً',
      // Quick Stats
      trainingProgress: 'تقدم التدريب',
      questionsPracticed: 'الأسئلة المُمارسة',
      cardsMastered: 'البطاقات المُتقنة',
      studyTime: 'وقت الدراسة',
      // Section Cards
      trainingKits: 'حقائب التدريب',
      trainingKitsAr: 'Training Kits',
      trainingKitsDesc: 'محتوى المنهج الكامل منظم حسب الكفاءات. اقرأ المواد الشاملة مع النصوص والصور لبناء أساس معرفتك.',
      questionBank: 'بنك الأسئلة',
      questionBankAr: 'Question Bank',
      questionBankDesc: 'تدرب مع مئات أسئلة الاختيار المتعدد. احصل على ملاحظات فورية وتتبع أدائك عبر جميع الكفاءات.',
      flashcards: 'بطاقات المراجعة',
      flashcardsAr: 'Flashcards',
      flashcardsDesc: 'بطاقات مراجعة سريعة مع التكرار المتباعد. أتقن المفاهيم الأساسية من خلال الاستذكار النشط وتقنيات الحفظ الفعالة.',
      // Stats Labels
      modules: 'الوحدات',
      lessons: 'الدروس',
      completed: 'مكتمل',
      totalQuestions: 'إجمالي الأسئلة',
      attempted: 'تمت المحاولة',
      avgScore: 'متوسط الدرجة',
      totalCards: 'إجمالي البطاقات',
      dueToday: 'مستحقة اليوم',
      mastered: 'متقنة',
      // Button Labels
      startLearning: 'ابدأ التعلم',
      practiceNow: 'تدرب الآن',
      studyFlashcards: 'ادرس البطاقات',
      // Learning Path
      recommendedPath: 'مسار التعلم المُوصى به',
      readContentFirst: 'اقرأ المحتوى أولاً',
      memorizeKeyConcepts: 'احفظ المفاهيم الأساسية',
      testYourKnowledge: 'اختبر معرفتك',
      new: 'جديد',
    }
  };

  const texts = t[language];

  // Check curriculum access
  const {
    data: accessData,
    isLoading: isLoadingAccess,
  } = useCurriculumAccess(user?.id, user?.email, 'CP');

  // Get question bank stats
  const { data: questionBankStats } = useQuestionBankStats(user?.id, 'CP');

  // Get flashcard stats
  const { data: flashcardStats } = useFlashcardStats(user?.id, 'CP');

  const hasAccess = accessData?.hasAccess;
  const access = accessData?.access;

  // Loading state
  if (isLoadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{texts.loading}</p>
        </div>
      </div>
    );
  }

  // No access state
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {texts.accessRequired}
          </h2>
          <p className="text-gray-600 mb-6">
            {texts.accessRequiredDesc}
          </p>
          <button
            onClick={() => window.open('https://bda-global.org/en/store/bda-learning-system/', '_blank')}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {texts.purchaseNow}
          </button>
        </div>
      </div>
    );
  }

  const expiryDate = access ? new Date(access.expires_at) : null;
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const isExpiringSoon = daysUntilExpiry <= 30;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {texts.title}
          </h1>
          <p className="text-gray-600">
            {texts.subtitle}
          </p>
        </div>

        {/* Access Banner */}
        {access && expiryDate && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isExpiringSoon
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar
                  className={`w-5 h-5 ${
                    isExpiringSoon ? 'text-yellow-600' : 'text-blue-600'
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {texts.accessValidUntil} {format(expiryDate, 'MMMM d, yyyy', { locale: language === 'ar' ? ar : undefined })}
                  </p>
                  <p
                    className={`text-sm ${
                      isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                    }`}
                  >
                    {daysUntilExpiry} {texts.daysRemaining}
                    {isExpiringSoon && ` ${texts.considerRenewing}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {texts.trainingProgress}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">0%</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {texts.questionsPracticed}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {questionBankStats?.questionsAttempted || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {texts.cardsMastered}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {flashcardStats?.cardsMastered || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">
                {texts.studyTime}
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {Math.floor((flashcardStats?.totalStudyTimeMinutes || 0) / 60)}h
            </p>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Kits Section */}
          <SectionCard
            title={texts.trainingKits}
            titleAr={texts.trainingKitsAr}
            description={texts.trainingKitsDesc}
            icon={<BookOpen className="w-6 h-6" />}
            color="blue"
            stats={[
              { label: texts.modules, value: 14 },
              { label: texts.lessons, value: 42 },
              { label: texts.completed, value: '0%' },
            ]}
            primaryAction={{
              label: texts.startLearning,
              onClick: () => navigate('/learning-system/training-kits'),
            }}
          />

          {/* Question Bank Section */}
          <SectionCard
            title={texts.questionBank}
            titleAr={texts.questionBankAr}
            description={texts.questionBankDesc}
            icon={<HelpCircle className="w-6 h-6" />}
            color="green"
            isNew
            newLabel={texts.new}
            stats={[
              { label: texts.totalQuestions, value: questionBankStats?.totalQuestions || 0 },
              { label: texts.attempted, value: questionBankStats?.questionsAttempted || 0 },
              { label: texts.avgScore, value: `${Math.round(questionBankStats?.averageScore || 0)}%` },
            ]}
            primaryAction={{
              label: texts.practiceNow,
              onClick: () => navigate('/learning-system/question-bank'),
            }}
          />

          {/* Flashcards Section */}
          <SectionCard
            title={texts.flashcards}
            titleAr={texts.flashcardsAr}
            description={texts.flashcardsDesc}
            icon={<Layers className="w-6 h-6" />}
            color="purple"
            isNew
            newLabel={texts.new}
            stats={[
              { label: texts.totalCards, value: flashcardStats?.totalCards || 0 },
              { label: texts.dueToday, value: flashcardStats?.cardsDueToday || 0 },
              { label: texts.mastered, value: flashcardStats?.cardsMastered || 0 },
            ]}
            primaryAction={{
              label: texts.studyFlashcards,
              onClick: () => navigate('/learning-system/flashcards'),
            }}
          />
        </div>

        {/* Learning Path Guide */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {texts.recommendedPath}
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">{texts.trainingKits}</p>
                <p className="text-sm text-gray-500">{texts.readContentFirst}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">{texts.flashcards}</p>
                <p className="text-sm text-gray-500">{texts.memorizeKeyConcepts}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">{texts.questionBank}</p>
                <p className="text-sm text-gray-500">{texts.testYourKnowledge}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
