import React, { createContext, useContext, useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, UI_TRANSLATIONS, translate as translateFn } from '../constants/languages';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
};

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const saved = localStorage.getItem('vriddhi-language');
    return saved || DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem('vriddhi-language', language);
    // Set html lang attribute for accessibility
    document.documentElement.lang = language === 'english' ? 'en' : language.substring(0, 2);
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang.toLowerCase());
  };

  const t = (key: string) => {
    return translateFn(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};
