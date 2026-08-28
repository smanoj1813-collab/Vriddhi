// src/shared/constants/languages.ts
// Supported languages for AI question generation and UI localization
// Includes all major Indian regional languages + English

export interface LanguageOption {
  code: string; // ISO 639-1 code
  value: string; // Value used in backend (lowercase)
  label: string; // English label
  nativeLabel: string; // Native script label
  flag?: string; // Emoji flag or icon
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', value: 'english', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', value: 'hindi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', value: 'kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta', value: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', value: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', value: 'malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', value: 'marathi', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', value: 'bengali', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', value: 'gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', value: 'punjabi', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', value: 'urdu', label: 'Urdu', nativeLabel: 'اردو', flag: '🇮🇳' },
  { code: 'or', value: 'odia', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', value: 'assamese', label: 'Assamese', nativeLabel: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'sa', value: 'sanskrit', label: 'Sanskrit', nativeLabel: 'संस्कृतम्', flag: '🇮🇳' },
];

// Quick lookup maps
export const LANGUAGE_MAP = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(l => [l.value, l])
);

export const LANGUAGE_CODE_MAP = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(l => [l.code, l])
);

// Default language
export const DEFAULT_LANGUAGE = 'english';

// For AI prompt — get language instruction
export function getLanguageInstruction(languageValue: string): string {
  const lang = LANGUAGE_MAP[languageValue.toLowerCase()] || LANGUAGE_MAP['english'];
  if (!lang || lang.value === 'english') {
    return 'Generate questions in English language.';
  }
  return `Generate questions in ${lang.label} language (${lang.nativeLabel}). 
The question text, options, and explanations should all be in ${lang.label}.
If technical terms don't have direct translation, keep them in English with ${lang.label} explanation.
Ensure proper ${lang.label} grammar and academic style.`;
}

// For UI — simple translations for common labels
// This is a minimal i18n, can be expanded with i18next later
export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  english: {
    dashboard: 'Dashboard',
    questionBank: 'Question Bank',
    aiGenerator: 'AI Question Generator',
    papers: 'Papers',
    generate: 'Generate Questions',
    save: 'Save to Bank',
    subject: 'Subject',
    topic: 'Topic',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  },
  hindi: {
    dashboard: 'डैशबोर्ड',
    questionBank: 'प्रश्न बैंक',
    aiGenerator: 'AI प्रश्न जनरेटर',
    papers: 'प्रश्न पत्र',
    generate: 'प्रश्न उत्पन्न करें',
    save: 'बैंक में सहेजें',
    subject: 'विषय',
    topic: 'विषय',
    difficulty: 'कठिनाई',
    easy: 'आसान',
    medium: 'मध्यम',
    hard: 'कठिन',
  },
  kannada: {
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    questionBank: 'ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್',
    aiGenerator: 'AI ಪ್ರಶ್ನೆ ಜನರೇಟರ್',
    papers: 'ಪ್ರಶ್ನೆ ಪತ್ರಿಕೆಗಳು',
    generate: 'ಪ್ರಶ್ನೆಗಳನ್ನು ರಚಿಸಿ',
    save: 'ಬ್ಯಾಂಕ್‌ಗೆ ಉಳಿಸಿ',
    subject: 'ವಿಷಯ',
    topic: 'ವಿಷಯ',
    difficulty: 'ಕಠಿಣತೆ',
    easy: 'ಸುಲಭ',
    medium: 'ಮಧ್ಯಮ',
    hard: 'ಕಠಿಣ',
  },
  tamil: {
    dashboard: 'டாஷ்போர்டு',
    questionBank: 'கேள்வி வங்கி',
    aiGenerator: 'AI கேள்வி ஜெனரேட்டர்',
    papers: 'வினாத்தாள்கள்',
    generate: 'கேள்விகளை உருவாக்கு',
    save: 'வங்கியில் சேமி',
    subject: 'பாடம்',
    topic: 'தலைப்பு',
    difficulty: 'கடினத்தன்மை',
    easy: 'எளிது',
    medium: 'நடுத்தரம்',
    hard: 'கடினம்',
  },
  telugu: {
    dashboard: 'డాష్‌బోర్డ్',
    questionBank: 'ప్రశ్న బ్యాంక్',
    aiGenerator: 'AI ప్రశ్న జనరేటర్',
    papers: 'ప్రశ్న పత్రాలు',
    generate: 'ప్రశ్నలను రూపొందించండి',
    save: 'బ్యాంకుకు సేవ్ చేయండి',
    subject: 'విషయం',
    topic: 'అంశం',
    difficulty: 'కఠినత',
    easy: 'సులభం',
    medium: 'మధ్యస్థం',
    hard: 'కఠినం',
  },
  malayalam: {
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    questionBank: 'ചോദ്യ ബാങ്ക്',
    aiGenerator: 'AI ചോദ്യ ജനറേറ്റർ',
    papers: 'ചോദ്യ പേപ്പറുകൾ',
    generate: 'ചോദ്യങ്ങൾ സൃഷ്ടിക്കുക',
    save: 'ബാങ്കിലേക്ക് സംരക്ഷിക്കുക',
    subject: 'വിഷയം',
    topic: 'വിഷയം',
    difficulty: 'ബുദ്ധിമുട്ട്',
    easy: 'എളുപ്പം',
    medium: 'ഇടത്തരം',
    hard: 'കഠിനം',
  },
};

export function translate(key: string, languageValue: string = 'english'): string {
  const lang = languageValue.toLowerCase();
  return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['english'][key] || key;
}
