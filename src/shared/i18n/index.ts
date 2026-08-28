export {
  LANGUAGES,
  SUPPORTED_LANGUAGES,
  SOUTH_INDIAN_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  getLanguageDefinition,
  isAppLanguage,
} from './languages';
export type { AppLanguage, LanguageDefinition } from './languages';

export { dictionaries, translate, interpolate, en } from './translations';
export type { TranslationKey } from './translations';
