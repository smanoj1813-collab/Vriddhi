import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  getLanguageDefinition,
  isAppLanguage,
  normalizeLanguage,
  translate,
  type AppLanguage,
  type LanguageDefinition,
  type TranslationKey,
} from '../i18n';

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

// Indic webfonts are only needed by the locale that renders them, but they
// used to ride along in ONE render-blocking Google Fonts request for all six
// languages on every first paint (~5 extra families of unicode-range CSS).
// The static link in index.html now carries only Inter + Noto Sans; the
// active language's family is injected here on demand (once), and the PWA's
// fonts.googleapis/gstatic runtime caches make repeat loads instant.
const INDIC_FONT_URLS: Partial<Record<AppLanguage, string>> = {
  hi: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap',
  kn: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap',
  ta: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap',
  te: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap',
  ml: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap',
};

function ensureLanguageFont(language: AppLanguage) {
  const url = INDIC_FONT_URLS[language];
  if (!url || typeof document === 'undefined') return;
  const id = `vriddhi-font-${language}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

function applyDocumentLanguage(language: AppLanguage) {
  const def = LANGUAGES[language];
  const root = document.documentElement;
  root.lang = def.bcp47;
  root.setAttribute('data-language', def.code);
  root.style.setProperty('--vriddhi-font-family', def.fontFamily);
  ensureLanguageFont(language);
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
