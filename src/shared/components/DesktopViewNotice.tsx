import { useEffect, useState } from 'react'
import { MonitorSmartphone, X } from 'lucide-react'
import { detectDesktopLayoutOnPhone, subscribeToViewportMode } from '../utils/viewportMode'

// Shown only when a phone is rendering the desktop layout — almost always
// because the browser's "Desktop site" toggle is stuck on and the installed
// PWA inherited it. Without this hint the student just sees a tiny desktop
// site and concludes the app was never made for mobile.
const DISMISS_KEY = 'vriddhi.desktopViewNotice.dismissedAt'
const DISMISS_REMINDER_MS = 1000 * 60 * 60 * 24 * 14 // nag again in two weeks

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < DISMISS_REMINDER_MS
  } catch {
    return false
  }
}

export default function DesktopViewNotice() {
  const [desktopLayout, setDesktopLayout] = useState(false)
  const [hidden, setHidden] = useState(() => recentlyDismissed())

  useEffect(() => {
    const sync = () => setDesktopLayout(detectDesktopLayoutOnPhone())
    sync()
    return subscribeToViewportMode(sync)
  }, [])

  if (!desktopLayout || hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Private mode / storage full — the notice just returns next session.
    }
  }

  return (
    <div
      role="status"
      className="fixed left-3 right-3 z-[1500] mx-auto max-w-md rounded-2xl border border-amber-300/60 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur"
      style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
          <MonitorSmartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">Desktop view is switched on</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Your browser is forcing the desktop layout, so Vriddhi looks like a shrunken website.
            Turn it off: open the browser menu (⋮) and untick <span className="font-semibold text-white">“Desktop site”</span>.
            On iPhone, tap <span className="font-semibold text-white">AA</span> in the address bar and choose
            <span className="font-semibold text-white"> Request Mobile Website</span>.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-teal-400"
          >
            Got it — show mobile view
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
