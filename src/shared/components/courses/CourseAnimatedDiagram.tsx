import { useEffect, useId, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { CourseDiagram } from '@/shared/courses/illustrationTypes'
import CourseDiagramView from './CourseDiagram'
import './courseVisuals.css'

function useReducedCourseMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    if (media.addEventListener) media.addEventListener('change', update)
    else media.addListener?.(update)
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', update)
      else media.removeListener?.(update)
    }
  }, [])
  return reduced
}

/** A finite, opt-in focus sequence. All diagram text stays visible, even while paused. */
export default function CourseAnimatedDiagram({ diagram, title }: { diagram: CourseDiagram; title: string }) {
  const [index, setIndex] = useState(0)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const reduced = useReducedCourseMotion()
  const host = useRef<HTMLDivElement>(null)
  const id = useId()
  const items = diagram.items

  useEffect(() => {
    if (reduced) setPlaying(false)
  }, [reduced])

  useEffect(() => {
    if (!playing || reduced) return
    const timer = window.setTimeout(() => {
      if (index >= items.length - 1) setPlaying(false)
      else setIndex((current) => current + 1)
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [playing, reduced, index, items.length])

  useEffect(() => {
    if (!playing) return
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver((entries) => {
      if (entries.some((entry) => !entry.isIntersecting)) setPlaying(false)
    })
    if (host.current) observer?.observe(host.current)
    return () => { document.removeEventListener('visibilitychange', pauseWhenHidden); observer?.disconnect() }
  }, [playing])

  const focus = (next: number) => { setPlaying(false); setStarted(true); setIndex(next) }
  const play = () => {
    if (playing) { setPlaying(false); return }
    if (reduced) return
    if (index === items.length - 1) setIndex(0)
    setStarted(true)
    setPlaying(true)
  }
  const atEnd = started && index === items.length - 1
  const controlClass = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
  return (
    <div ref={host} className="course-animated-diagram" data-playing={playing || undefined}>
      <CourseDiagramView diagram={diagram} activeItem={started ? index : undefined} />
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900/70" role="group" aria-label={`${title}: diagram walkthrough`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-200">See the idea unfold</p>
          <button type="button" onClick={play} disabled={reduced} aria-pressed={playing} aria-describedby={`${id}-motion-note`} className={controlClass}>
            {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : atEnd ? <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            {playing ? 'Pause animation' : atEnd ? 'Replay animation' : 'Play animation'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Previous diagram step" className={controlClass} disabled={index === 0} onClick={() => focus(index - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <ol className="flex flex-1 flex-wrap gap-1.5" aria-label="Diagram focus steps">
            {items.map((item, itemIndex) => <li key={item.label}><button type="button" onClick={() => focus(itemIndex)} aria-label={`${itemIndex + 1}. Focus on ${item.label}`} aria-pressed={started && index === itemIndex} className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${started && index === itemIndex ? 'border-teal-700 bg-teal-800 text-white dark:border-teal-400 dark:bg-teal-300 dark:text-slate-950' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'}`}>{itemIndex + 1}</button></li>)}
          </ol>
          <button type="button" aria-label="Next diagram step" className={controlClass} disabled={index === items.length - 1} onClick={() => focus(index + 1)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <p className="mt-3 min-h-16 text-xs leading-6 text-slate-700 dark:text-slate-200" aria-live="polite" aria-atomic="true" data-walkthrough-status>
          {started ? <><span className="font-extrabold text-slate-950 dark:text-white">Focus {index + 1} of {items.length} · {items[index].label}. </span>{items[index].detail}</> : 'Play once to follow the highlighted ideas, or choose any numbered focus point. Nothing is hidden and you can pause at any time.'}
        </p>
        <p id={`${id}-motion-note`} className="mt-2 text-[10px] leading-5 text-slate-600 dark:text-slate-400">{reduced ? 'Reduced motion is on: use the numbered steps or Previous / Next. No timed animation runs.' : 'One pass, no looping. Pauses when hidden or off screen. Numbering follows this diagram’s reading order, not necessarily a sequence in time.'} This practice does not mark the lesson or quiz complete.</p>
      </div>
    </div>
  )
}
