import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  getLanguageDefinition,
  isAppLanguage,
  normalizeLanguage,
  type AppLanguage,
  type LanguageDefinition,
} from '../i18n/languages';
import { translate, type TranslationKey } from '../i18n/translations';

interface LanguageContextValue {
  language: AppLanguage;
  definition: LanguageDefinition;
  setLanguage: (language: AppLanguage | string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  definition: LANGUAGES[DEFAULT_LANGUAGE],
  setLanguage: () => {},
  t: (key) => key,
});

function readStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isAppLanguage(stored)) return stored;
    if (stored) return normalizeLanguage(stored);
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}

function applyDocumentLanguage(language: AppLanguage) {
  const def = LANGUAGES[language];
  const root = document.documentElement;
  root.lang = def.bcp47;
  root.setAttribute('data-language', def.code);
  root.style.setProperty('--vriddhi-font-family', def.fontFamily);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    return readStoredLanguage();
  });

  useEffect(() => {
    applyDocumentLanguage(language);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage | string) => {
    setLanguageState(normalizeLanguage(next));
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      definition: getLanguageDefinition(language),
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export const useTranslation = () => {
  const { t, language, setLanguage, definition } = useLanguage();
  return { t, language, setLanguage, definition };
};
