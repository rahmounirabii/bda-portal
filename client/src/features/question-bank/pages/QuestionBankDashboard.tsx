/**
 * Question Bank Dashboard
 * Shows all question sets organized by competency with user progress
 * Requires language-based access (EN or AR)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  useQuestionSetsWithProgress,
  useQuestionBankStats,
} from '@/entities/question-bank';
import {
  useQuestionBankAccess,
  useUserAccesses,
  useLanguageAccess,
  type Language,
} from '@/entities/curriculum';
import {
  ArrowLeft,
  HelpCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  ChevronRight,
  Brain,
  Target,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuestionSetWithProgress } from '@/entities/question-bank';
import { LanguageSelector } from '@/features/curriculum/components/LanguageSelector';

interface QuestionSetCardProps {
  questionSet: QuestionSetWithProgress;
  onClick: () => void;
}

function QuestionSetCard({ questionSet, onClick }: QuestionSetCardProps) {
  const progress = questionSet.progress;
  const progressPercentage = progress
    ? Math.round(
        (progress.questions_correct / (progress.questions_attempted || 1)) * 100
      )
    : 0;

  const isCompleted = progress?.completed_at !== null;
  const hasAttempted = (progress?.attempts_count || 0) > 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-green-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {questionSet.title}
            </h3>
            {questionSet.title_ar && (
              <p className="text-sm text-gray-500 mt-1" dir="rtl">
                {questionSet.title_ar}
              </p>
            )}
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Passed
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              {questionSet.question_count}
            </p>
            <p className="text-xs text-gray-500">Questions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {progress?.attempts_count || 0}
            </p>
            <p className="text-xs text-gray-500">Attempts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">
              {progress?.best_score_percentage || 0}%
            </p>
            <p className="text-xs text-gray-500">Best Score</p>
          </div>
        </div>

        {/* Progress bar */}
        {hasAttempted && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Last Score</span>
              <span>{progress?.last_score_percentage || 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (progress?.last_score_percentage || 0) >= questionSet.passing_score
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${progress?.last_score_percentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Passing score: {questionSet.passing_score}%
            </p>
          </div>
        )}

        {/* Time limit & difficulty indicators */}
        <div className="flex items-center justify-between text-sm">
          {questionSet.time_limit_minutes && (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{questionSet.time_limit_minutes} min</span>
            </div>
          )}
          {questionSet.is_final_test && (
            <div className="flex items-center gap-1 text-orange-600 font-medium">
              <Target className="w-4 h-4" />
              <span>Final Test</span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
        <span className="text-sm font-medium text-green-600">
          {hasAttempted ? 'Practice Again' : 'Start Practice'}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

export function QuestionBankDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('EN');

  // Get all user accesses to determine available languages
  const { data: accessSummary, isLoading: accessSummaryLoading } = useUserAccesses(
    user?.id
  );

  // Check Question Bank access for selected language
  const {
    data: hasQuestionBankAccess,
    isLoading: accessLoading,
  } = useQuestionBankAccess(user?.id, selectedLanguage);

  // Get language access to determine certification type
  const {
    data: languageAccess,
    isLoading: languageAccessLoading,
  } = useLanguageAccess(user?.id, selectedLanguage);

  // Auto-select available language on first load
  useEffect(() => {
    if (accessSummary && !accessLoading) {
      if (accessSummary.has_en && !accessSummary.has_ar && selectedLanguage !== 'EN') {
        setSelectedLanguage('EN');
      } else if (accessSummary.has_ar && !accessSummary.has_en && selectedLanguage !== 'AR') {
        setSelectedLanguage('AR');
      }
    }
  }, [accessSummary, selectedLanguage, accessLoading]);

  // Determine certification type from language access (or default to CP)
  const certificationType = languageAccess?.certification_type || 'CP';

  // Get question sets with progress
  const {
    data: questionSets,
    isLoading: isLoadingSets,
  } = useQuestionSetsWithProgress(user?.id, certificationType);

  // Get user stats
  const { data: stats } = useQuestionBankStats(user?.id, certificationType);

  // Group question sets by section
  const introSets =
    questionSets?.filter((s) => s.section_type === 'introduction') || [];
  const knowledgeSets =
    questionSets?.filter((s) => s.section_type === 'knowledge') || [];
  const behavioralSets =
    questionSets?.filter((s) => s.section_type === 'behavioral') || [];

  // Loading states
  if (accessSummaryLoading || accessLoading || languageAccessLoading || isLoadingSets) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question bank...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasQuestionBankAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Question Bank Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to purchase the Learning System ({selectedLanguage}) package that
              includes Question Bank access to view this content.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/learning-system')}
                className="w-full"
              >
                Back to Learning System
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = 'https://bda-global.org/shop'}
                className="w-full"
              >
                Visit Shop
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learning-system')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning System
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
              <p className="text-gray-600">
                Practice with MCQs and track your performance
              </p>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <LanguageSelector
          userId={user?.id}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center gap-3 mb-2">
                <HelpCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Questions Attempted
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.questionsAttempted}
              </p>
              <p className="text-xs text-gray-500">
                of {stats.totalQuestions} total
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Correct Answers
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.questionsCorrect}
              </p>
              <p className="text-xs text-gray-500">
                {stats.questionsAttempted > 0
                  ? Math.round(
                      (stats.questionsCorrect / stats.questionsAttempted) * 100
                    )
                  : 0}
                % accuracy
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  Average Score
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(stats.averageScore)}%
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">
                  Sets Completed
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.setsCompleted}
              </p>
              <p className="text-xs text-gray-500">
                of {stats.totalQuestionSets} sets
              </p>
            </div>
          </div>
        )}

        {/* Introduction Section */}
        {introSets.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📖</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Introduction</h2>
                <p className="text-sm text-gray-600">
                  Foundation questions to get started
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {introSets.map((set) => (
                <QuestionSetCard
                  key={set.id}
                  questionSet={set}
                  onClick={() => navigate(`/learning-system/question-bank/${set.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Knowledge-Based Competencies */}
        {knowledgeSets.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Knowledge-Based Competencies
                </h2>
                <p className="text-sm text-gray-600">
                  {knowledgeSets.length} question sets covering technical knowledge
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeSets.map((set) => (
                <QuestionSetCard
                  key={set.id}
                  questionSet={set}
                  onClick={() => navigate(`/learning-system/question-bank/${set.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Behavioral Competencies */}
        {behavioralSets.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💼</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Behavioral Competencies
                </h2>
                <p className="text-sm text-gray-600">
                  {behavioralSets.length} question sets covering soft skills
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {behavioralSets.map((set) => (
                <QuestionSetCard
                  key={set.id}
                  questionSet={set}
                  onClick={() => navigate(`/learning-system/question-bank/${set.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {questionSets?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Question Sets Available
            </h2>
            <p className="text-gray-600 mb-6">
              Question sets will appear here once they are published by the admin.
            </p>
            <Button onClick={() => navigate('/learning-system')}>
              Back to Learning System
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
