// src/modules/student/hooks/useBackToExit.ts
//
// "Back closes the app" for the portal home screen.
//
// Installed as a PWA the portal should behave like every other phone app: on
// the home screen the system back gesture leaves the app instead of replaying
// the portal's own history (dashboard → login → dashboard …). A browser will
// not let a page close a tab it did not open, so this asks first: the first
// press shows "press back again to exit", the second tries to close the
// window and — having swallowed the sentinel entry this hook pushed — falls
// back to leaving the portal entirely, which is what closes the app when the
// portal was the app's first page.

import { useEffect, useState } from 'react'

const EXIT_WINDOW_MS = 2500

/**
 * True on the phone-shaped viewport and in the installed app. A desktop
 * browser tab keeps its normal back-button behaviour: there, "back" leaving
 * the site is what a user expects, and swallowing it would feel broken.
 */
function isPhoneShell(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(max-width: 767px)').matches
  )
}

export function useBackToExit(enabled: boolean): { exitHint: boolean } {
  const [exitHint, setExitHint] = useState(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !isPhoneShell()) return undefined
    const sentinel = { vriddhiPortalHome: true }
    let lastPress = 0
    let hintTimer: number | undefined

    // Only one sentinel at a time: returning to the home screen from a deeper
    // page lands on the sentinel we pushed earlier, so do not stack another.
    const alreadyArmed = Boolean(
      (window.history.state as { vriddhiPortalHome?: boolean } | null)?.vriddhiPortalHome
    )
    if (!alreadyArmed) {
      window.history.pushState(sentinel, '')
    }

    const onPopState = () => {
      const now = Date.now()
      const secondPress = now - lastPress > 0 && now - lastPress <= EXIT_WINDOW_MS
      lastPress = now
      window.clearTimeout(hintTimer)

      if (!secondPress) {
        setExitHint(true)
        hintTimer = window.setTimeout(() => {
          setExitHint(false)
          lastPress = 0
        }, EXIT_WINDOW_MS)
        // Re-arm so the next press is intercepted again rather than
        // navigating the single-page app into its own history.
        window.history.pushState(sentinel, '')
        return
      }

      setExitHint(false)
      try {
        window.close()
      } catch {
        // Blocked for a tab this app did not open — the fallback below is the
        // exit path for that case.
      }
      window.setTimeout(() => {
        if (!window.closed) window.history.back()
      }, 150)
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.clearTimeout(hintTimer)
      setExitHint(false)
    }
  }, [enabled])

  return { exitHint }
}
