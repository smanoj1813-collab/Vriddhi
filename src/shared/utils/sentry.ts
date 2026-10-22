// Error tracking (Sentry), env-gated like the other platform keys.
//
// "Flow now, keys later": until VITE_SENTRY_DSN is set at build time this
// module is a no-op and the Sentry SDK chunk is never downloaded. Set the
// DSN (see .env.example + docs/OPS_RUNBOOK.md), rebuild, and uncaught
// errors, promise rejections and ErrorBoundary catches start reporting.

type SentryModule = typeof import('@sentry/react')

let mod: SentryModule | null = null
let initStarted = false

export function sentryEnabled(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN
}

export async function initSentry(): Promise<void> {
  if (initStarted) return
  initStarted = true
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return
  try {
    mod = await import('@sentry/react')
    mod.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (import.meta.env.PROD ? 'production' : 'development'),
      release: import.meta.env.VITE_RELEASE || undefined,
      // Errors only — no performance tracing/replay (cost + student privacy).
      tracesSampleRate: 0,
      sendDefaultPii: false,
    })
  } catch (error) {
    // Error tracking must never break the app it watches.
    console.warn('[Sentry] init failed:', error)
  }
}

/** Report a caught error (ErrorBoundary, critical catch blocks). Safe no-op when disabled. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!mod) return
  try {
    mod.captureException(error, context ? { extra: context } : undefined)
  } catch { /* never throw from error reporting */ }
}

/** Attach identity (ids only — no names/emails) so issues group per college/role. */
export function setSentryUser(user: { uid: string; role?: string; collegeId?: string } | null): void {
  if (!mod) return
  try {
    if (!user) {
      mod.setUser(null)
      return
    }
    mod.setUser({ id: user.uid })
    if (user.role) mod.setTag('role', user.role)
    if (user.collegeId) mod.setTag('collegeId', user.collegeId)
  } catch { /* never throw from error reporting */ }
}
