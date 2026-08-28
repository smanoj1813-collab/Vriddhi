// Canonical language catalog for Vriddhi UI + AI question generation.
// Codes are BCP-47 language tags (without region) used as the app locale.

export type AppLanguage = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml';

export interface LanguageDefinition {
  code: AppLanguage;
  /** Internal / API aliases accepted from older payloads. */
  aliases: string[];
  englishName: string;
  nativeName: string;
  /** Native script name shown in AI prompts (e.g. "Kannada script (ಕನ್ನಡ)"). */
  scriptName: string;
  /** Full prompt instruction for generating academic questions. */
  promptName: string;
  bcp47: string;
  fontFamily: string;
}

export const LANGUAGE_STORAGE_KEY = 'vriddhi_language';

export const LANGUAGES: Record<AppLanguage, LanguageDefinition> = {
  en: {
    code: 'en',
    aliases: ['en', 'eng', 'english'],
    englishName: 'English',
    nativeName: 'English',
    scriptName: 'Latin script',
    promptName: 'English',
    bcp47: 'en-IN',
    fontFamily: 'Inter, "Noto Sans", system-ui, sans-serif',
  },
  hi: {
    code: 'hi',
    aliases: ['hi', 'hin', 'hindi', 'हिन्दी', 'हिंदी'],
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    scriptName: 'Devanagari script (देवनागरी)',
    promptName: 'Hindi (हिन्दी)',
    bcp47: 'hi-IN',
    fontFamily: '"Noto Sans Devanagari", "Noto Sans", Inter, system-ui, sans-serif',
  },
  kn: {
    code: 'kn',
    aliases: ['kn', 'kan', 'kannada', 'ಕನ್ನಡ'],
    englishName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    scriptName: 'Kannada script (ಕನ್ನಡ ಲಿಪಿ)',
    promptName: 'Kannada (ಕನ್ನಡ)',
    bcp47: 'kn-IN',
    fontFamily: '"Noto Sans Kannada", "Noto Sans", Inter, system-ui, sans-serif',
  },
  ta: {
    code: 'ta',
    aliases: ['ta', 'tam', 'tamil', 'தமிழ்'],
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    scriptName: 'Tamil script (தமிழ் எழுத்து)',
    promptName: 'Tamil (தமிழ்)',
    bcp47: 'ta-IN',
    fontFamily: '"Noto Sans Tamil", "Noto Sans", Inter, system-ui, sans-serif',
  },
  te: {
    code: 'te',
    aliases: ['te', 'tel', 'telugu', 'తెలుగు'],
    englishName: 'Telugu',
    nativeName: 'తెలుగు',
    scriptName: 'Telugu script (తెలుగు లిపి)',
    promptName: 'Telugu (తెలుగు)',
    bcp47: 'te-IN',
    fontFamily: '"Noto Sans Telugu", "Noto Sans", Inter, system-ui, sans-serif',
  },
  ml: {
    code: 'ml',
    aliases: ['ml', 'mal', 'malayalam', 'മലയാളം'],
    englishName: 'Malayalam',
    nativeName: 'മലയാളം',
    scriptName: 'Malayalam script (മലയാളം ലിപി)',
    promptName: 'Malayalam (മലയാളം)',
    bcp47: 'ml-IN',
    fontFamily: '"Noto Sans Malayalam", "Noto Sans", Inter, system-ui, sans-serif',
  },
};

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  LANGUAGES.en,
  LANGUAGES.hi,
  LANGUAGES.kn,
  LANGUAGES.ta,
  LANGUAGES.te,
  LANGUAGES.ml,
];

export const SOUTH_INDIAN_LANGUAGES: AppLanguage[] = ['kn', 'ta', 'te', 'ml'];

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

/** Normalize free-form language values from the UI, Firestore, or AI payloads. */
export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (!value) return DEFAULT_LANGUAGE;
  const key = value.trim().toLowerCase();
  return ALIAS_MAP[key] ?? DEFAULT_LANGUAGE;
}

export function getLanguageDefinition(value: string | null | undefined): LanguageDefinition {
  return LANGUAGES[normalizeLanguage(value)];
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && value in LANGUAGES;
}
