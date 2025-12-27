import { useState } from 'react';
import { useUserAccesses, type Language } from '@/entities/curriculum';

interface LanguageSelectorProps {
  userId: string | undefined;
  onLanguageChange: (language: Language) => void;
  selectedLanguage: Language;
}

/**
 * Language Selector Component
 * Displays tabs for EN/AR when user has access to both languages
 * Auto-selects if user has only one language
 */
export function LanguageSelector({
  userId,
  onLanguageChange,
  selectedLanguage,
}: LanguageSelectorProps) {
  const { data: accessSummary, isLoading } = useUserAccesses(userId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-pulse flex space-x-4">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // No access data
  if (!accessSummary) {
    return null;
  }

  const { has_en, has_ar } = accessSummary;

  // If user has only one language, no need to show tabs
  if (has_en && !has_ar) {
    // Ensure EN is selected
    if (selectedLanguage !== 'EN') {
      onLanguageChange('EN');
    }
    return null;
  }

  if (has_ar && !has_en) {
    // Ensure AR is selected
    if (selectedLanguage !== 'AR') {
      onLanguageChange('AR');
    }
    return null;
  }

  // User has both languages - show tabs
  if (!has_en && !has_ar) {
    return null; // No access at all
  }

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-4" aria-label="Language tabs">
        <button
          onClick={() => onLanguageChange('EN')}
          className={`
            py-4 px-6 text-sm font-medium border-b-2 transition-colors
            ${
              selectedLanguage === 'EN'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
          aria-current={selectedLanguage === 'EN' ? 'page' : undefined}
        >
          English (EN)
        </button>

        <button
          onClick={() => onLanguageChange('AR')}
          className={`
            py-4 px-6 text-sm font-medium border-b-2 transition-colors
            ${
              selectedLanguage === 'AR'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
          aria-current={selectedLanguage === 'AR' ? 'page' : undefined}
        >
          العربية (AR)
        </button>
      </nav>
    </div>
  );
}
