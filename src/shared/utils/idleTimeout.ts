// src/shared/utils/idleTimeout.ts
//
// Configuration maths for the auto-logout-on-inactivity feature. Pure so the
// clamping rules (and the "pause during an active test" exemption) are
// unit-testable without the DOM or Firebase.
//
// Policy:
//   * A signed-in session ends after DEFAULT_IDLE_MINUTES without user input.
//   * One minute before expiry the UI warns and requires an explicit
//     "Stay signed in" click (movement alone does not extend past the warning,
//     so an unattended jiggly mouse cannot keep a session alive forever).
//   * Operators can tune the window per deployment via localStorage
//     (IDLE_STORAGE_KEY), clamped to 1–480 minutes so a typo cannot disable it.
//   * Students taking an online test are NEVER auto-logged-out mid-exam —
//     reading one question for 20 minutes without touching the mouse is
//     normal, and losing their answers would be catastrophic. The timer is
//     paused on the active-test routes instead.

export const DEFAULT_IDLE_MINUTES = 20
export const MIN_IDLE_MINUTES = 1
export const MAX_IDLE_MINUTES = 480
/** How long the "you will be signed out" countdown runs before expiry. */
export const IDLE_WARNING_SECONDS = 60
/** Per-deployment override: localStorage[IDLE_STORAGE_KEY] = minutes. */
export const IDLE_STORAGE_KEY = 'vriddhi_idle_timeout_min'
/** sessionStorage flag set on idle sign-out so the login page can explain why. */
export const IDLE_SIGNOUT_FLAG = 'vriddhi_idle_signout'

/**
 * Parse a stored idle-minute override. Anything unusable falls back to the
 * default; valid values are clamped to [1, 480] minutes.
 */
export function resolveIdleMinutes(
  stored: string | null | undefined,
  fallback = DEFAULT_IDLE_MINUTES
): number {
  const parsed = Number(String(stored ?? '').trim())
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(MAX_IDLE_MINUTES, Math.max(MIN_IDLE_MINUTES, Math.floor(parsed)))
}

/** The warning must fit inside the idle window, never exceed it. */
export function warningSecondsFor(idleMinutes: number): number {
  const totalSeconds = idleMinutes * 60
  return Math.min(IDLE_WARNING_SECONDS, Math.max(1, Math.floor(totalSeconds / 2)))
}

/**
 * True while a student is inside an active test (…/assessments/:id/take or
 * …/test/:id/take). Idle auto-logout is suspended there — the test's own
 * timer and autosave own the session.
 */
export function isIdlePausedPath(pathname: string): boolean {
  return /\/(?:assessments|test)\/[^/]+\/take\/?$/.test(pathname.split('?')[0] || '')
}

/** m:ss countdown text for the warning dialog. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = String(safe % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
