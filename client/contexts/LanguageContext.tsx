import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.firstName": "First Name",
    "auth.lastName": "Last Name",
    "auth.loginWithGoogle": "Login with Google",
    "auth.forgotPassword": "Forgot Password?",
    "auth.registerAs": "Register As",
    "auth.registerAsIndividual": "Register as Individual",
    "auth.registerAsProvider": "Register as Provider",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.myBooks": "My Books",
    "nav.examApplications": "Exam Applications",
    "nav.mockExams": "Mock Exams",
    "nav.myCertifications": "My Certifications",
    "nav.myRecognitions": "My Recognitions",
    "nav.idus": "IDUs",
    "nav.awardApplications": "Award Applications",
    "nav.authorizedProviders": "Authorized Providers",
    "nav.resources": "Resources",
    "nav.helpCenter": "Help Center",
    "nav.returnToWebsite": "Return to Website",
    "nav.signOut": "Sign Out",

    // Dashboard
    "dashboard.purchaseNewBook": "Purchase New Book",
    "dashboard.registerBook": "Register Book",
    "dashboard.certifications": "Certifications",
    "dashboard.books": "Books",
    "dashboard.awards": "Awards",

    // Mock Exams
    "mockExams.title": "Mock Exams",
    "mockExams.english": "English",
    "mockExams.arabic": "Arabic",
    "mockExams.startExam": "Start Exam",
    "mockExams.examReady": "Exam Ready!",
    "mockExams.instructions": "Instructions",
    "mockExams.duration": "Duration",
    "mockExams.agree": "I understand and agree to the terms and conditions",
    "mockExams.continueLater": "Continue Later",
    "mockExams.finishTest": "Finish Test",
    "mockExams.nextQuestion": "Next Question",
    "mockExams.notes": "Notes",
  },
  ar: {
    // Auth
    "auth.login": "تسجيل الدخول",
    "auth.register": "تسجيل",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.confirmPassword": "تأكيد كلمة المرور",
    "auth.firstName": "الاسم الأول",
    "auth.lastName": "اسم العائلة",
    "auth.loginWithGoogle": "تسجيل الدخول بواسطة جوجل",
    "auth.forgotPassword": "نسيت كلمة المرور؟",
    "auth.registerAs": "التسجيل كـ",
    "auth.registerAsIndividual": "تسجيل كفرد",
    "auth.registerAsProvider": "تسجيل كمزود",

    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.myBooks": "كتبي",
    "nav.examApplications": "طلبات الامتحان",
    "nav.mockExams": "الاختبارات التجريبية",
    "nav.myCertifications": "شهاداتي",
    "nav.myRecognitions": "اعترافاتي",
    "nav.idus": "IDUs",
    "nav.awardApplications": "طلبات الجوائز",
    "nav.authorizedProviders": "المزودون المعتمدون",
    "nav.resources": "الموارد",
    "nav.helpCenter": "مركز المساعدة",
    "nav.returnToWebsite": "العودة للموقع",
    "nav.signOut": "تسجيل الخروج",

    // Dashboard
    "dashboard.purchaseNewBook": "شراء كتاب جديد",
    "dashboard.registerBook": "تسجيل كتاب",
    "dashboard.certifications": "الشهادات",
    "dashboard.books": "الكتب",
    "dashboard.awards": "الجوائز",

    // Mock Exams
    "mockExams.title": "الاختبارات التجريبية",
    "mockExams.english": "إنجليزي",
    "mockExams.arabic": "عربي",
    "mockExams.startExam": "بدء الامتحان",
    "mockExams.examReady": "الامتحان جاهز!",
    "mockExams.instructions": "التعليمات",
    "mockExams.duration": "المدة",
    "mockExams.agree": "أفهم وأوافق على الشروط والأحكام",
    "mockExams.continueLater": "المتابعة لاحقاً",
    "mockExams.finishTest": "إنهاء الاختبار",
    "mockExams.nextQuestion": "السؤال التالي",
    "mockExams.notes": "ملاحظات",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");
  const isRTL = language === "ar";

  const t = (key: string): string => {
    return (
      translations[language][key as keyof (typeof translations)["en"]] || key
    );
  };

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
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
