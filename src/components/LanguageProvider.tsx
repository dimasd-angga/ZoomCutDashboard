
'use client';

import * as React from 'react';
import en from '@/locales/en.json';
import he from '@/locales/he.json';

type Language = 'en' | 'he';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  direction: 'ltr' | 'rtl';
  t: (key: keyof Translations, options?: { [key: string]: string | number }) => string;
}

const translations = { en, he };

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>('he');

  const direction = React.useMemo(() => (language === 'he' ? 'rtl' : 'ltr'), [language]);

  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const t = (key: keyof Translations, options?: { [key: string]: string | number }) => {
    let text = translations[language][key] || translations['en'][key] || key;
    if (options) {
        Object.keys(options).forEach(k => {
            text = text.replace(`{{${k}}}`, String(options[k]));
        });
    }
    return text;
  };

  const value = {
    language,
    setLanguage,
    direction,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
