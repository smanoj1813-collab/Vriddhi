// ═══════════════════════════════════════════════════════════════════════
// viewportMode — is the app being laid out for a phone, or is a phone being
// tricked into a desktop layout?
//
// An installed PWA inherits the browser's "Desktop site" toggle, and Chrome
// keeps it switched on per-profile. The page then renders at a 980px layout
// viewport: `@media (max-width: 767px)` never matches, the mobile header and
// bottom bar are skipped, and everything looks like a shrunken desktop site —
// which is exactly what "the PWA is still in desktop mode" means in practice.
// No meta tag can undo that (the browser ignores `viewport` in desktop mode),
// so the app detects the mismatch and tells the student how to switch back.
// ═══════════════════════════════════════════════════════════════════════

export interface ViewportProbe {
  /** window.innerWidth — the CSS layout width the page is being laid out in. */
  layoutWidth: number
  /** Smaller physical screen dimension in CSS px (phone width in portrait). */
  deviceWidth: number
  /** True when a finger, not a mouse, is the primary input. */
  coarsePointer: boolean
  /** True when the UA looks like a phone/tabled browser. */
  mobileUserAgent: boolean
  /** True when running from the installed app icon. */
  standalone: boolean
}

/** Below this the layout is the phone layout by design, never a mismatch. */
const PHONE_LAYOUT_WIDTH = 768
/**
 * How much wider than the device the layout has to be before we call it
 * desktop mode. Chrome's desktop emulation pins the layout viewport to 980px,
 * so on a 360–430px phone the ratio is 2.3–2.7; a genuinely wide phone in
 * landscape lands near 1.0–1.3 because `screen.width` follows the orientation.
 */
const DESKTOP_RATIO = 1.6

const MOBILE_UA = /android|iphone|ipod|ipad|mobile|iemobile|blackberry|opera mini/i

export function isMobileUserAgent(userAgent: string): boolean {
  return MOBILE_UA.test(userAgent || '')
}

/** True when a phone is rendering the desktop layout (see header comment). */
export function isDesktopLayoutOnPhone(probe: ViewportProbe): boolean {
  const isHandheld = probe.coarsePointer || probe.mobileUserAgent
  if (!isHandheld) return false
  if (probe.layoutWidth < PHONE_LAYOUT_WIDTH) return false
  if (probe.deviceWidth <= 0) return false
  return probe.layoutWidth >= probe.deviceWidth * DESKTOP_RATIO
}

function readProbe(): ViewportProbe {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { layoutWidth: 0, deviceWidth: 0, coarsePointer: false, mobileUserAgent: false, standalone: false }
  }
  const screen = window.screen
  const deviceWidth = screen ? Math.min(screen.width || 0, screen.height || 0) : 0
  return {
    layoutWidth: window.innerWidth || document.documentElement?.clientWidth || 0,
    deviceWidth: deviceWidth || window.innerWidth || 0,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches === true,
    mobileUserAgent: isMobileUserAgent(navigator.userAgent),
    standalone:
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  }
}

/** One-shot read for non-React callers (error reporting, telemetry). */
export function detectDesktopLayoutOnPhone(): boolean {
  return isDesktopLayoutOnPhone(readProbe())
}

/**
 * Subscribes to the resize + media-query changes that flip this state: the
 * desktop toggle, an orientation rotation, and a split-screen resize.
 */
export function subscribeToViewportMode(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const queries = ['(pointer: coarse)', '(display-mode: standalone)']
    .map((raw) => window.matchMedia?.(raw))
    .filter((mql): mql is MediaQueryList => !!mql)

  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = window.requestAnimationFrame(() => {
      frame = 0
      onChange()
    })
  }

  window.addEventListener('resize', schedule, { passive: true })
  window.visualViewport?.addEventListener('resize', schedule, { passive: true })
  window.addEventListener('orientationchange', schedule, { passive: true })
  for (const mql of queries) {
    if (mql.addEventListener) mql.addEventListener('change', schedule)
    else mql.addListener(schedule as unknown as (this: MediaQueryList, e: MediaQueryListEvent) => void)
  }

  return () => {
    if (frame) window.cancelAnimationFrame(frame)
    window.removeEventListener('resize', schedule)
    window.visualViewport?.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
    for (const mql of queries) {
      if (mql.removeEventListener) mql.removeEventListener('change', schedule)
      else mql.removeListener(schedule as unknown as (this: MediaQueryList, e: MediaQueryListEvent) => void)
    }
  }
}
