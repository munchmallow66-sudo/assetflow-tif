'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['th'] | string, replacements?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang === 'th' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'th' ? 'en' : 'th';
    setLanguage(nextLang);
  };

  const t = (
    key: keyof typeof translations['th'] | string,
    replacements?: Record<string, string | number>
  ): string => {
    const dict = translations[language] || translations['th'];
    // @ts-ignore
    let val = dict[key];
    
    if (val === undefined || val === null) {
      // Fallback to TH dict if missing in active language
      // @ts-ignore
      val = translations['th'][key];
    }
    
    if (val === undefined || val === null) {
      // Return the key itself as a fallback
      return String(key);
    }

    let text = String(val);
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
