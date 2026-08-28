import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import { useLanguage } from '../contexts/LanguageProvider';

export default function LanguageSettingsBlock() {
  const { language, setLanguage, t, definition } = useLanguage();

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
        {t('settings.languageTitle')}
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('settings.languageDesc')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all
                ${active
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
            >
              <span>
                <span className={`block text-sm font-semibold ${active ? 'text-teal-700 dark:text-teal-300' : 'text-slate-800 dark:text-slate-100'}`}>
                  {lang.nativeName}
                </span>
                <span className="block text-xs text-slate-500">{lang.englishName}</span>
              </span>
              {active && <span className="text-xs font-bold text-teal-600">{t('common.yes')}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        {t('settings.southIndianNote')} · {definition.nativeName}
      </p>
    </div>
  );
}
