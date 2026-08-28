import { SUPPORTED_LANGUAGES } from '../i18n';
import { useLanguage } from '../contexts/LanguageProvider';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function LanguageSwitcher({
  compact = false,
  className = '',
  showLabel = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      {showLabel && !compact && (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
          {t('common.language')}
        </span>
      )}
      <select
        aria-label={t('common.language')}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`rounded-xl border text-sm font-medium transition-colors
          bg-white dark:bg-slate-900
          border-slate-200 dark:border-slate-700
          text-slate-800 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
          ${className.includes('w-full') ? 'w-full' : ''}
          ${compact ? 'px-2 py-1 text-xs max-w-[11rem]' : 'px-3 py-2 min-w-[11rem]'}`}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} · {lang.englishName}
          </option>
        ))}
      </select>
    </label>
  );
}
