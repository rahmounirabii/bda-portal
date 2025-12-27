import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  useCurriculumDashboard,
  useUserAccesses,
  useLanguageAccess,
  type Language,
} from '@/entities/curriculum';
import { CurriculumDashboard } from '../components/CurriculumDashboard';
import { AccessDenied } from '../components/AccessDenied';
import { CurriculumLoading } from '../components/CurriculumLoading';
import { LanguageSelector } from '../components/LanguageSelector';

/**
 * My Curriculum Page
 * Entry point for curriculum learning system
 * - Checks language-based access (EN/AR)
 * - Shows language selector if user has multiple languages
 * - Shows 14 BoCK modules (7 knowledge + 7 behavioral)
 * - Sequential unlocking with quiz gates
 */
export function MyCurriculum() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('EN');

  // Get all user accesses to determine available languages
  const { data: accessSummary, isLoading: accessSummaryLoading } = useUserAccesses(
    user?.id
  );

  // Check access for selected language
  const {
    data: languageAccess,
    isLoading: languageAccessLoading,
  } = useLanguageAccess(user?.id, selectedLanguage);

  // Auto-select available language on first load
  useEffect(() => {
    if (accessSummary && !languageAccessLoading) {
      // If current selection has no access, switch to available language
      if (accessSummary.has_en && !accessSummary.has_ar && selectedLanguage !== 'EN') {
        setSelectedLanguage('EN');
      } else if (accessSummary.has_ar && !accessSummary.has_en && selectedLanguage !== 'AR') {
        setSelectedLanguage('AR');
      }
    }
  }, [accessSummary, selectedLanguage, languageAccessLoading]);

  // Determine certification type from language access (or default to CP)
  const certificationType = languageAccess?.certification_type || 'CP';

  // Main hook: loads modules and progress for certification type
  const {
    isLoading: dashboardLoading,
    isError,
    error,
    hasAccess,
    accessReason,
    access,
    knowledgeModules,
    behavioralModules,
    overallProgress,
    nextModule,
    refetch,
  } = useCurriculumDashboard(
    user?.id,
    user?.email,
    certificationType
  );

  const isLoading = accessSummaryLoading || languageAccessLoading || dashboardLoading;

  // Loading state
  if (isLoading) {
    return <CurriculumLoading />;
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Curriculum
          </h2>
          <p className="text-red-600 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No access state - check language-based access
  const hasLanguageAccess = languageAccess?.has_access || false;

  if (!hasLanguageAccess && !accessSummaryLoading) {
    // Check if user has access in another language
    const hasAnyAccess = accessSummary?.has_en || accessSummary?.has_ar;

    if (hasAnyAccess) {
      // User has access but not to currently selected language
      // Auto-switch will handle this via useEffect
      return <CurriculumLoading />;
    }

    // User has no access at all
    return (
      <AccessDenied
        reason={languageAccess?.reason || 'no_active_access'}
        onRetry={() => refetch()}
      />
    );
  }

  // Main curriculum interface with language selector
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <LanguageSelector
          userId={user?.id}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
      </div>

      <CurriculumDashboard
        access={access!}
        knowledgeModules={knowledgeModules}
        behavioralModules={behavioralModules}
        overallProgress={overallProgress}
        nextModule={nextModule}
      />
    </div>
  );
}
