// Canonical language catalog for AI question generation (Cloud Functions).
// Keep in sync with src/shared/i18n/languages.ts on the frontend.

export type AppLanguage = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml';

export interface LanguageDefinition {
  code: AppLanguage;
  aliases: string[];
  englishName: string;
  nativeName: string;
  scriptName: string;
  promptName: string;
}

export const LANGUAGES: Record<AppLanguage, LanguageDefinition> = {
  en: {
    code: 'en',
    aliases: ['en', 'eng', 'english'],
    englishName: 'English',
    nativeName: 'English',
    scriptName: 'Latin script',
    promptName: 'English',
  },
  hi: {
    code: 'hi',
    aliases: ['hi', 'hin', 'hindi'],
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    scriptName: 'Devanagari script (देवनागरी)',
    promptName: 'Hindi (हिन्दी)',
  },
  kn: {
    code: 'kn',
    aliases: ['kn', 'kan', 'kannada'],
    englishName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    scriptName: 'Kannada script (ಕನ್ನಡ ಲಿಪಿ)',
    promptName: 'Kannada (ಕನ್ನಡ)',
  },
  ta: {
    code: 'ta',
    aliases: ['ta', 'tam', 'tamil'],
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    scriptName: 'Tamil script (தமிழ் எழுத்து)',
    promptName: 'Tamil (தமிழ்)',
  },
  te: {
    code: 'te',
    aliases: ['te', 'tel', 'telugu'],
    englishName: 'Telugu',
    nativeName: 'తెలుగు',
    scriptName: 'Telugu script (తెలుగు లిపి)',
    promptName: 'Telugu (తెలుగు)',
  },
  ml: {
    code: 'ml',
    aliases: ['ml', 'mal', 'malayalam'],
    englishName: 'Malayalam',
    nativeName: 'മലയാളം',
    scriptName: 'Malayalam script (മലയാളം ലിപി)',
    promptName: 'Malayalam (മലയാളം)',
  },
};

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

const ALIAS_MAP: Record<string, AppLanguage> = Object.values(LANGUAGES).reduce(
  (acc, lang) => {
    for (const alias of lang.aliases) {
      acc[alias.toLowerCase()] = lang.code;
    }
    return acc;
  },
  {} as Record<string, AppLanguage>
);

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (!value) return DEFAULT_LANGUAGE;
  const key = value.trim().toLowerCase();
  return ALIAS_MAP[key] ?? DEFAULT_LANGUAGE;
}

export function getLanguageDefinition(value: string | null | undefined): LanguageDefinition {
  return LANGUAGES[normalizeLanguage(value)];
}

export function buildLanguagePromptBlock(value: string | null | undefined): string {
  const lang = getLanguageDefinition(value);
  if (lang.code === 'en') {
    return `## LANGUAGE
Write every student-facing field in English.
JSON keys must remain in English. Keep option labels as A, B, C, D.`;
  }

  return `## LANGUAGE (STRICT)
Generate ALL student-facing content in ${lang.promptName} using the ${lang.scriptName}.
This includes: question text, options, expected answers, explanations, hints, and case-study passages.
Do NOT transliterate into Latin/English letters. Do NOT mix English sentences into the question body.
Subject-specific proper nouns, formulas, SI units, chemical symbols, and numeric values may stay in their standard form.
JSON keys must remain in English. Keep option labels as A, B, C, D (Latin letters).
correctAnswer for MCQ must still be "A", "B", "C", or "D".
true_false answers must be the ${lang.promptName} words for True/False if the question type is true_false, otherwise keep "True"/"False" only when the schema requires English enum values — prefer native script for displayed option text.`;
}
