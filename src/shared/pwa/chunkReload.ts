// src/shared/pwa/chunkReload.ts
//
// Item 2.2 of docs/HANDOFF_OPTIMISATION_2026-09-25.md, clause A9.
//
// The app's hashed build files are served `immutable` now, so a browser that
// keeps an old `index.html` can ask for a chunk that the last deploy deleted —
// Vite reports that as a `vite:preloadError` and the app would otherwise show a
// blank screen or a cryptic error.
//
// A hosting header rule matches the REQUEST path, so a deep link such as
// /student/dashboard keeps Firebase's default caching for index.html. That is
// why this guard ships with the header change instead of after it.
//
// Behaviour: reload ONCE per tab session. If the same tab hits a second chunk
// error after a reload, something is genuinely broken (offline, bad deploy) and
// pretending otherwise would loop forever — so the error is surfaced instead.
//
// Kept dependency-free and injectable so `chunkReload.test.ts` can drive it.

export const PRELOAD_ERROR_EVENT = 'vite:preloadError'
export const RELOAD_FLAG_KEY = 'vriddhi.chunkReload.at'
/** Two attempts inside this window are treated as one incident. */
export const RELOAD_WINDOW_MS = 60_000

export interface ChunkReloadStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

export interface ChunkReloadTarget {
  addEventListener(type: string, handler: (event: unknown) => void): void
  removeEventListener(type: string, handler: (event: unknown) => void): void
  location: { reload(): void }
}

export interface ChunkReloadOptions {
  now?: () => number
  onReload?: () => void
  onGiveUp?: (error: unknown) => void
}

/** True when this tab already reloaded for a chunk error recently. */
export function alreadyReloadedForChunk(storage: ChunkReloadStorage, nowMs: number): boolean {
  try {
    const raw = storage.getItem(RELOAD_FLAG_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return nowMs - at < RELOAD_WINDOW_MS
  } catch {
    // Private-mode storage can throw on access — treat it as "no flag" and
    // still allow the single reload.
    return false
  }
}

function rememberReload(storage: ChunkReloadStorage, nowMs: number): void {
  try {
    storage.setItem(RELOAD_FLAG_KEY, String(nowMs))
  } catch {
    /* ignore */
  }
}

/**
 * Installs the guard and returns a cleanup function. Safe to call when the
 * event never fires (every browser except the stale-chunk case).
 */
export function installChunkReloadGuard(
  target: ChunkReloadTarget,
  storage: ChunkReloadStorage,
  options: ChunkReloadOptions = {},
): () => void {
  const now = options.now ?? (() => Date.now())

  const handler = (event: unknown): void => {
    const nowMs = now()
    if (alreadyReloadedForChunk(storage, nowMs)) {
      // Second failure in the same tab: stop reloading, let the app's error
      // boundary / console show what happened.
      if (options.onGiveUp) options.onGiveUp(event)
      else console.error('[chunkReload] build file missing after a reload — not reloading again', event)
      return
    }
    rememberReload(storage, nowMs)
    console.warn('[chunkReload] a build file was missing (stale cached page); reloading once')
    options.onReload?.()
    target.location.reload()
  }

  target.addEventListener(PRELOAD_ERROR_EVENT, handler)
  return () => target.removeEventListener(PRELOAD_ERROR_EVENT, handler)
}
