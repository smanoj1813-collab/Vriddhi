// src/shared/hooks/useTextScale.ts
//
// Reader text size for the whole portal.
//
// Staff and students both asked for a "make it smaller / bigger" control: on a
// phone the same 15" laptop layout is rendered on a 5" screen, so long score
// lines and section names overflow the card they sit in. The portal is built
// from rem-based type (Tailwind text-* classes and MUI typography/dimensions),
// so scaling the root font size scales every block *and* its text together —
// nothing re-flows out of alignment — while px-sized rules (borders, fixed
// bars) keep their exact size.
//
// The value is a module-level store rather than React context because the
// control appears in more than one place (result page header, "More" sheet)
// and both must move together.

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'vriddhi-text-scale'

/** Root font size steps, as a multiplier of the browser default (16px). */
export const TEXT_SCALE_STEPS = [0.85, 1, 1.15, 1.3] as const
export const TEXT_SCALE_LABELS = ['Smaller', 'Normal', 'Larger', 'Largest'] as const
export const DEFAULT_TEXT_SCALE_INDEX = 1

type Listener = (index: number) => void

const listeners = new Set<Listener>()

function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return DEFAULT_TEXT_SCALE_INDEX
  return Math.min(TEXT_SCALE_STEPS.length - 1, Math.max(0, Math.round(index)))
}

function readStoredIndex(): number {
  if (typeof window === 'undefined') return DEFAULT_TEXT_SCALE_INDEX
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === null) return DEFAULT_TEXT_SCALE_INDEX
  const seen = Number(stored)
  // Out-of-range values (older builds, hand-edited storage) fall back instead
  // of rendering an unreadable page.
  if (!Number.isFinite(seen) || !TEXT_SCALE_STEPS[seen]) return DEFAULT_TEXT_SCALE_INDEX
  return clampIndex(seen)
}

function applyScale(index: number): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (index === DEFAULT_TEXT_SCALE_INDEX) {
    // Removing the override hands the size back to the browser, so a student
    // who prefers a bigger default in their OS settings keeps it.
    root.style.removeProperty('font-size')
    return
  }
  root.style.fontSize = `${Math.round(16 * TEXT_SCALE_STEPS[index] * 100) / 100}px`
}

let currentIndex = readStoredIndex()
applyScale(currentIndex)

export function getTextScaleIndex(): number {
  return currentIndex
}

export function setTextScaleIndex(next: number): number {
  const index = clampIndex(next)
  currentIndex = index
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(index))
  }
  applyScale(index)
  listeners.forEach((listener) => listener(index))
  return index
}

export interface TextScaleState {
  index: number
  label: string
  step: number
  canIncrease: boolean
  canDecrease: boolean
  increase: () => void
  decrease: () => void
  reset: () => void
}

/** Subscribe to the reader text size, with the actions the controls need. */
export function useTextScale(): TextScaleState {
  const [index, setIndex] = useState(currentIndex)

  useEffect(() => {
    const listener: Listener = (next) => setIndex(next)
    listeners.add(listener)
    // Another tab may have changed the size while this one was idle.
    setIndex(getTextScaleIndex())
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const set = useCallback((next: number) => {
    setTextScaleIndex(next)
  }, [])

  return {
    index,
    label: TEXT_SCALE_LABELS[index],
    step: TEXT_SCALE_STEPS[index],
    canIncrease: index < TEXT_SCALE_STEPS.length - 1,
    canDecrease: index > 0,
    increase: useCallback(() => set(getTextScaleIndex() + 1), [set]),
    decrease: useCallback(() => set(getTextScaleIndex() - 1), [set]),
    reset: useCallback(() => set(DEFAULT_TEXT_SCALE_INDEX), [set]),
  }
}
