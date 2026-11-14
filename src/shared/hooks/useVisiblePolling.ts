import { useEffect, useRef } from 'react'
import { startVisiblePolling } from '@/shared/utils/visiblePolling'

/** Keeps the interval stable across renders while always invoking the latest
 * callback. A request from an earlier interval cannot overlap a newer one. */
export function useVisiblePolling(task: () => void | Promise<unknown>, intervalMs: number | null) {
  const current = useRef(task)
  const busy = useRef(false)
  current.current = task
  useEffect(() => {
    if (intervalMs === null) return
    return startVisiblePolling(async () => {
      if (busy.current) return
      busy.current = true
      try { await current.current() } finally { busy.current = false }
    }, intervalMs)
  }, [intervalMs])
}
