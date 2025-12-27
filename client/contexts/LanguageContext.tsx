import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type TranslationKey } from "../locales/translations";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load saved language from localStorage or default to English
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bda-portal-language');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
    }
    return 'en';
  });

  const isRTL = language === "ar";

  const t = (key: TranslationKey | string): string => {
    return (
      translations[language][key as keyof (typeof translations)["en"]] || key
    );
  };

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;

    // Save language preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('bda-portal-language', language);
    }
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
