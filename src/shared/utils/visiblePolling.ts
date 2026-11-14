/** Visibility-aware, non-overlapping polling. No initial request: the caller
 * owns its initial load. Returning to the tab revalidates once immediately. */
export interface PollVisibility {
  readonly hidden: boolean
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export function startVisiblePolling(
  task: () => void | Promise<unknown>,
  intervalMs: number,
  visibility: PollVisibility = document,
  timers = { setInterval, clearInterval },
): () => void {
  let timer: ReturnType<typeof setInterval> | undefined
  let stopped = false
  let pending = false
  const run = async () => {
    if (stopped || visibility.hidden || pending) return
    pending = true
    try { await task() } catch { /* Caller owns error display; never leak an unhandled timer rejection. */ }
    finally { pending = false }
  }
  const pause = () => {
    if (timer !== undefined) timers.clearInterval(timer)
    timer = undefined
  }
  const resume = () => {
    if (!stopped && !visibility.hidden && timer === undefined) {
      timer = timers.setInterval(() => { void run() }, intervalMs)
    }
  }
  const changed = () => {
    if (visibility.hidden) pause()
    else { void run(); resume() }
  }
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return () => {}
  resume()
  visibility.addEventListener('visibilitychange', changed)
  return () => {
    stopped = true
    pause()
    visibility.removeEventListener('visibilitychange', changed)
  }
}
