import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  FONT_SIZE_STORAGE_KEY,
  applyFontSize,
  readAppearancePref,
  setAccent,
  writeAppearancePref,
  type AppearanceFontSize,
} from './accent'

export interface AppearancePreferences {
  accentColor: string
  fontSize: AppearanceFontSize
  compactMode: boolean
  animationsEnabled: boolean
}

export const DEFAULT_APPEARANCE: Readonly<AppearancePreferences> = Object.freeze({
  accentColor: DEFAULT_ACCENT,
  fontSize: 'medium',
  compactMode: false,
  animationsEnabled: true,
})

export const ACCENT_COLORS = [
  { color: '#14b8a6', name: 'Teal' },
  { color: '#6366f1', name: 'Indigo' },
  { color: '#f59e0b', name: 'Amber' },
  { color: '#ef4444', name: 'Red' },
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#84cc16', name: 'Lime' },
] as const

const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
const isFontSize = (value: unknown): value is AppearanceFontSize =>
  value === 'small' || value === 'medium' || value === 'large'

/** Project cloud/legacy data onto cosmetic fields only; never copy identity fields. */
export function normalizeAppearance(value: unknown): AppearancePreferences {
  const data = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {}
  return {
    accentColor: isColor(data.accentColor) ? data.accentColor.toLowerCase() : DEFAULT_APPEARANCE.accentColor,
    fontSize: isFontSize(data.fontSize) ? data.fontSize : DEFAULT_APPEARANCE.fontSize,
    compactMode: typeof data.compactMode === 'boolean' ? data.compactMode : DEFAULT_APPEARANCE.compactMode,
    animationsEnabled: typeof data.animationsEnabled === 'boolean' ? data.animationsEnabled : DEFAULT_APPEARANCE.animationsEnabled,
  }
}

/** Account-scoped device cache, with a read-only fallback for old profile preferences. */
export function readLocalAppearance(uid: string, legacy?: unknown): AppearancePreferences {
  const fallback = normalizeAppearance(legacy)
  const color = readAppearancePref(ACCENT_STORAGE_KEY, uid)
  const font = readAppearancePref(FONT_SIZE_STORAGE_KEY, uid)
  const compact = readAppearancePref('vriddhi_compact_mode', uid)
  const animations = readAppearancePref('vriddhi_animations', uid)
  return {
    accentColor: isColor(color) ? color.toLowerCase() : fallback.accentColor,
    fontSize: isFontSize(font) ? font : fallback.fontSize,
    compactMode: compact === 'true' ? true : compact === 'false' ? false : fallback.compactMode,
    animationsEnabled: animations === 'true' ? true : animations === 'false' ? false : fallback.animationsEnabled,
  }
}

/** Apply/cache only this account's cosmetic preferences, without any network operation. */
export function applyLocalAppearance(uid: string, value: AppearancePreferences): void {
  const preferences = normalizeAppearance(value)
  setAccent(preferences.accentColor, true, uid)
  writeAppearancePref(FONT_SIZE_STORAGE_KEY, uid, preferences.fontSize)
  writeAppearancePref('vriddhi_compact_mode', uid, String(preferences.compactMode))
  writeAppearancePref('vriddhi_animations', uid, String(preferences.animationsEnabled))
  applyFontSize(preferences.fontSize)
}

export function sameAppearance(a: AppearancePreferences | null, b: AppearancePreferences): boolean {
  return a !== null && a.accentColor === b.accentColor && a.fontSize === b.fontSize
    && a.compactMode === b.compactMode && a.animationsEnabled === b.animationsEnabled
}
