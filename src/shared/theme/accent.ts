// Accent colour runtime. Tailwind's `teal-*` palette (used across the app as
// the brand colour) reads CSS variables set here, so changing the accent in
// Settings re-colours the whole UI instantly without a rebuild.

export const DEFAULT_ACCENT = '#14b8a6'
export const ACCENT_STORAGE_KEY = 'vriddhi_accent_color'
export const ACCENT_EVENT = 'vriddhi:accent-change'

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const mix = (a: RGB, b: RGB, t: number): RGB =>
  [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB

const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]

/** Shade scale anchored on the chosen colour as 500 (mirrors Tailwind's teal ramp). */
export function accentScale(hex: string): Record<number, RGB> {
  const base = hexToRgb(hex) || (hexToRgb(DEFAULT_ACCENT) as RGB)
  return {
    50: mix(base, WHITE, 0.94),
    100: mix(base, WHITE, 0.82),
    200: mix(base, WHITE, 0.64),
    300: mix(base, WHITE, 0.42),
    400: mix(base, WHITE, 0.2),
    500: base,
    600: mix(base, BLACK, 0.18),
    700: mix(base, BLACK, 0.34),
    800: mix(base, BLACK, 0.48),
    900: mix(base, BLACK, 0.58),
    950: mix(base, BLACK, 0.72),
  }
}

export const rgbToHex = (c: RGB) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`

export function getStoredAccent(): string {
  try {
    const v = localStorage.getItem(ACCENT_STORAGE_KEY)
    return v && hexToRgb(v) ? v : DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}

/** Write the CSS variables consumed by tailwind.config.js. */
export function applyAccentVars(hex: string): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Object.entries(accentScale(hex)).forEach(([shade, rgb]) => {
    root.style.setProperty(`--accent-${shade}`, rgb.join(' '))
  })
}

/**
 * Change the accent app-wide. `persist=false` gives a live preview (Settings
 * swatch click) without committing it; the theme provider listens for the
 * event so MUI components follow too.
 */
export function setAccent(hex: string, persist = true): void {
  if (!hexToRgb(hex)) return
  if (persist) {
    try { localStorage.setItem(ACCENT_STORAGE_KEY, hex) } catch { /* ignore */ }
  }
  applyAccentVars(hex)
  window.dispatchEvent(new CustomEvent(ACCENT_EVENT, { detail: hex }))
}

/** Font-size preference was only applied on Save; apply it at boot as well. */
export function applyStoredFontSize(): void {
  try {
    const v = localStorage.getItem('vriddhi_font_size')
    const px = v === 'small' ? '14px' : v === 'large' ? '18px' : v === 'medium' ? '16px' : ''
    if (px) document.documentElement.style.fontSize = px
  } catch { /* ignore */ }
}
