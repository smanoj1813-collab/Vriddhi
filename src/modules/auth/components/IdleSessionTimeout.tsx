// src/modules/auth/components/IdleSessionTimeout.tsx
// ─── Auto sign-out after minutes of inactivity ─────────────────────────────
//
// The app used to keep a signed-in session alive forever on an open tab — on a
// shared staff-room or lab machine the next person simply inherited the
// previous user's dashboard. This watcher closes the session after
// resolveIdleMinutes() without user input (default 20, override via
// localStorage — see shared/utils/idleTimeout.ts).
//
// Deliberate behaviours:
//   * ONE minute before expiry a modal warns with a live countdown. Moving the
//     mouse does NOT extend past that point — only the explicit "Stay signed
//     in" click does, so an unattended machine cannot be kept alive by noise.
//   * Active online-test routes (…/test/:id/take) are exempt: a student
//     spending 25 minutes reading one question is normal and losing their
//     answers would be catastrophic. The exam's own timer owns that session.
//   * On expiry the session is signed out through the normal logout() path and
//     the login page shows "signed out due to inactivity" (sessionStorage
//     flag) instead of dumping the user on a blank login form.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Timer } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  IDLE_SIGNOUT_FLAG,
  IDLE_STORAGE_KEY,
  formatCountdown,
  isIdlePausedPath,
  resolveIdleMinutes,
  warningSecondsFor,
} from '@/shared/utils/idleTimeout'

/** Activity events that count as "the user is still there". */
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'] as const

/** Ignore activity-chatter faster than this; only meaningful resets matter. */
const ACTIVITY_THROTTLE_MS = 5_000

const IdleSessionTimeout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const idleMinutes = useMemo(
    () => resolveIdleMinutes(localStorage.getItem(IDLE_STORAGE_KEY)),
    []
  )
  const idleMs = idleMinutes * 60_000
  const warningMs = warningSecondsFor(idleMinutes) * 1000

  const [warningOpen, setWarningOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(idleMs / 1000))

  const deadlineRef = useRef(0)
  const lastBumpRef = useRef(0)
  const warningOpenRef = useRef(false)

  useEffect(() => {
    warningOpenRef.current = warningOpen
  }, [warningOpen])

  // Suspend while a student is inside an active test (or signed out at all).
  const paused = !user || isIdlePausedPath(location.pathname)

  const resetDeadline = useCallback(() => {
    deadlineRef.current = Date.now() + idleMs
  }, [idleMs])

  /**
   * Ambient activity: restarts the clock ONLY before the warning shows. Once
   * warned, the user must confirm they are there via the dialog button.
   */
  const bump = useCallback(() => {
    if (paused || warningOpenRef.current) return
    const now = Date.now()
    if (now - lastBumpRef.current < ACTIVITY_THROTTLE_MS) return
    lastBumpRef.current = now
    resetDeadline()
  }, [paused, resetDeadline])

  const signOutNow = useCallback(async () => {
    sessionStorage.setItem(IDLE_SIGNOUT_FLAG, '1')
    setWarningOpen(false)
    try {
      await logout()
    } finally {
      navigate(location.pathname.startsWith('/student') ? '/student/login' : '/login', {
        replace: true,
      })
    }
  }, [logout, navigate, location.pathname])

  const staySignedIn = useCallback(() => {
    lastBumpRef.current = Date.now()
    resetDeadline()
    setWarningOpen(false)
  }, [resetDeadline])

  // Arm / disarm the clock with sign-in state and route.
  useEffect(() => {
    if (paused) {
      setWarningOpen(false)
      return
    }
    resetDeadline()
    setRemainingSeconds(Math.ceil(idleMs / 1000))

    const interval = window.setInterval(() => {
      const remainingMs = deadlineRef.current - Date.now()
      setRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)))
      if (remainingMs <= 0) {
        void signOutNow()
      } else if (remainingMs <= warningMs && !warningOpenRef.current) {
        setWarningOpen(true)
      }
    }, 1000)

    return () => {
      window.clearInterval(interval)
      setWarningOpen(false)
    }
  }, [paused, idleMs, warningMs, resetDeadline, signOutNow])

  // Ambient listeners (throttled).
  useEffect(() => {
    if (paused) return
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, bump, { passive: true })
    )
    return () =>
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, bump))
  }, [paused, bump])

  if (!warningOpen || paused) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-timeout-title"
    >
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
          <Timer className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 id="idle-timeout-title" className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Are you still there?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          You have been inactive for a while. For your security you will be signed out in{' '}
          <span className="font-mono font-semibold text-slate-900 dark:text-white">
            {formatCountdown(remainingSeconds)}
          </span>{' '}
          unless you stay signed in.
        </p>
        <div className="flex gap-3">
          <button onClick={staySignedIn} className="btn-primary flex-1">
            Stay signed in
          </button>
          <button
            onClick={() => void signOutNow()}
            className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign out now
          </button>
        </div>
      </div>
    </div>
  )
}

export default IdleSessionTimeout
