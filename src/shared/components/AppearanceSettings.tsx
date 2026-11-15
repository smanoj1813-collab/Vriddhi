import { useEffect, useId, useRef, useState } from 'react'
import { Check, Loader2, Monitor, Moon, RefreshCw, Save, Sun } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useThemeMode } from '../contexts/ThemeProvider'
import { useTranslation } from '../contexts/LanguageProvider'
import { loadAppearancePreferences, saveAppearancePreferences } from '../services/appearancePreferences'
import { setAccent } from '../theme/accent'
import {
  ACCENT_COLORS,
  applyLocalAppearance,
  readLocalAppearance,
  sameAppearance,
  type AppearancePreferences,
} from '../theme/appearance'
import LanguageSettingsBlock from './LanguageSettingsBlock'

interface AppearanceSettingsProps {
  /** Old profile values are read-only fallbacks until the first private save. */
  legacyAppearance?: unknown
  showCompactMode?: boolean
  showAnimations?: boolean
}

function AppearanceToggle({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${checked ? 'bg-teal-700' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

// A keyed child prevents a late load/save for account A from changing account
// B's state or preview when a shared-browser session changes without a reload.
export default function AppearanceSettings(props: AppearanceSettingsProps) {
  const { user } = useAuth()
  return user?.uid ? <AccountAppearanceSettings key={user.uid} uid={user.uid} {...props} /> : null
}

function AccountAppearanceSettings({ uid, legacyAppearance, showCompactMode = false, showAnimations = false }:
  AppearanceSettingsProps & { uid: string }) {
  const { mode, resolvedMode, setMode } = useThemeMode()
  const { t } = useTranslation()
  const id = useId()
  const [preferences, setPreferences] = useState(() => readLocalAppearance(uid, legacyAppearance))
  const [cloudPreferences, setCloudPreferences] = useState<AppearancePreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<'saved' | 'sync-error' | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // One point read when this pane is opened (or explicitly retried), never a
  // listener or background poll. Swatches do not write to Firestore.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    loadAppearancePreferences(uid).then(remote => {
      if (cancelled) return
      const next = remote ?? readLocalAppearance(uid, legacyAppearance)
      setCloudPreferences(remote)
      setPreferences(next)
      applyLocalAppearance(uid, next)
    }).catch(() => {
      if (!cancelled) setLoadFailed(true)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [uid, legacyAppearance, reload])

  const change = <K extends keyof AppearancePreferences>(key: K, value: AppearancePreferences[K]) => {
    setPreferences(previous => ({ ...previous, [key]: value }))
    setMessage(null)
    if (key === 'accentColor') setAccent(value as string, true, uid)
  }

  const save = async () => {
    if (loading || saving) return
    const next = { ...preferences }
    setSaving(true)
    setMessage(null)
    // Keep the device usable offline, but do not claim cloud success when a
    // write is rejected. Only the explicit Save action syncs account data.
    applyLocalAppearance(uid, next)
    try {
      if (!sameAppearance(cloudPreferences, next)) await saveAppearancePreferences(uid, next)
      if (!mounted.current) return
      setCloudPreferences(next)
      setLoadFailed(false)
      setMessage('saved')
    } catch {
      if (mounted.current) setMessage('sync-error')
    } finally {
      if (mounted.current) setSaving(false)
    }
  }

  return (
    <section className="min-w-0 space-y-6" aria-labelledby={`${id}-heading`}>
      <div>
        <h2 id={`${id}-heading`} className="text-base font-bold text-slate-900 dark:text-white">{t('settings.appearance')}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('settings.appearanceDesc')}</p>
      </div>
      <LanguageSettingsBlock />

      {loading && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">{t('common.loadingSettings')}</p>}
      {loadFailed && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p>{t('settings.appearanceLoadError')}</p>
          <button type="button" onClick={() => setReload(value => value + 1)} className="mt-2 inline-flex items-center gap-2 font-semibold underline underline-offset-4">
            <RefreshCw size={14} aria-hidden="true" />{t('common.retry')}
          </button>
        </div>
      )}

      <fieldset disabled={loading || saving} className="min-w-0 space-y-6 disabled:opacity-60">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('settings.themeMode')}</legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { value: 'light' as const, label: t('settings.light'), icon: Sun },
              { value: 'dark' as const, label: t('settings.dark'), icon: Moon },
              { value: 'system' as const, label: t('common.system'), icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${mode === value ? 'border-teal-700 bg-teal-50 text-teal-800 dark:border-teal-400 dark:bg-teal-950/30 dark:text-teal-200' : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
              >
                <Icon size={20} aria-hidden="true" />{label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('common.currentlyIn', { mode: t(resolvedMode === 'dark' ? 'settings.dark' : 'settings.light') })}</p>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('settings.accentColor')}</legend>
          <div className="flex flex-wrap gap-3 p-1">
            {ACCENT_COLORS.map(({ color, name }) => (
              <button
                key={color}
                type="button"
                aria-label={`${t('settings.accentColor')}: ${name}`}
                aria-pressed={preferences.accentColor === color}
                title={name}
                onClick={() => change('accentColor', color)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-800 dark:focus-visible:outline-white ${preferences.accentColor === color ? 'ring-2 ring-slate-800 ring-offset-2 dark:ring-white dark:ring-offset-slate-900' : ''}`}
                style={{ backgroundColor: color }}
              >
                {preferences.accentColor === color && <Check size={22} className="rounded-full bg-slate-900/70 p-0.5 text-white" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${id}-font`} className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('settings.fontSize')}</label>
          <select id={`${id}-font`} value={preferences.fontSize} onChange={event => change('fontSize', event.target.value as AppearancePreferences['fontSize'])} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="small">{t('settings.fontSmall')} (14px)</option>
            <option value="medium">{t('settings.fontMedium')} (16px)</option>
            <option value="large">{t('settings.fontLarge')} (18px)</option>
          </select>
        </div>

        {showCompactMode && <AppearanceToggle label={t('settings.compactMode')} description={t('settings.compactDesc')} checked={preferences.compactMode} onChange={value => change('compactMode', value)} />}
        {showAnimations && <AppearanceToggle label={t('settings.animations')} description={t('settings.animationsDesc')} checked={preferences.animationsEnabled} onChange={value => change('animationsEnabled', value)} />}
      </fieldset>

      {message && (
        <p role={message === 'saved' ? 'status' : 'alert'} className={`rounded-xl border p-3 text-sm ${message === 'saved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200'}`}>
          {t(message === 'saved' ? 'settings.appearanceSaved' : 'settings.appearanceSyncError')}
        </p>
      )}
      <button type="button" onClick={() => void save()} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-900 disabled:opacity-60">
        {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
        {t('common.savePreferences')}
      </button>
    </section>
  )
}
