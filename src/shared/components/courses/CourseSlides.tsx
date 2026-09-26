import { useState, type KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react'
import type { CourseSlide } from '@/shared/courses/types'

interface CourseSlidesProps {
  slides: CourseSlide[]
  moduleTitle: string
  topicTitle: string
}

export default function CourseSlides({ slides, moduleTitle, topicTitle }: CourseSlidesProps) {
  const [index, setIndex] = useState(0)
  if (!slides.length) return null

  const slide = slides[index]
  const previous = () => setIndex((current) => Math.max(0, current - 1))
  const next = () => setIndex((current) => Math.min(slides.length - 1, current + 1))

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      previous()
    } else if (event.key === 'ArrowRight' && index < slides.length - 1) {
      event.preventDefault()
      next()
    } else if (event.key === 'Home') {
      event.preventDefault()
      setIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setIndex(slides.length - 1)
    }
  }

  const visualItems = slide.visual?.items ?? []
  const isFlow = slide.visual?.kind === 'flow'
  const isCompare = slide.visual?.kind === 'compare'

  return (
    <div
      className="space-y-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      role="region"
      aria-roledescription="slide viewer"
      aria-label={`Slide walkthrough for ${topicTitle}`}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <section className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-white via-teal-50/70 to-cyan-50 p-5 shadow-sm outline-none dark:border-teal-900/70 dark:from-slate-900 dark:via-teal-950/40 dark:to-slate-900 sm:min-h-[430px] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800 dark:text-teal-300">
              {moduleTitle} · visual walkthrough
            </p>
            <span className="rounded-full border border-teal-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-teal-900 dark:border-teal-800 dark:bg-slate-900/80 dark:text-teal-200" aria-live="polite">
              Slide {index + 1} of {slides.length}
            </span>
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {topicTitle}
          </p>
          <h2 className="mt-2 max-w-3xl text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {slide.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-700 dark:text-slate-200 sm:text-lg">
            {slide.summary}
          </p>

          {visualItems.length > 0 ? (
            <div
              className={`mt-7 ${isFlow ? 'flex flex-col gap-2 sm:flex-row sm:items-stretch' : `grid gap-3 ${isCompare ? 'sm:grid-cols-2' : visualItems.length >= 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : visualItems.length === 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2'}`}`}
              role="list"
              aria-label="Key ideas"
            >
              {visualItems.map((item, itemIndex) => (
                <div key={`${slide.id}-${item.title}`} className={isFlow ? 'flex min-w-0 flex-1 items-center gap-2' : ''} role="listitem">
                  <div className="h-full min-w-0 flex-1 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-xs font-extrabold text-teal-800 dark:bg-teal-900/70 dark:text-teal-200">
                      {isFlow ? itemIndex + 1 : <Lightbulb className="h-4 w-4" aria-hidden="true" />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                  {isFlow && itemIndex < visualItems.length - 1 ? (
                    <ArrowRight className="mx-auto h-4 w-4 shrink-0 rotate-90 text-teal-600 dark:text-teal-300 sm:rotate-0" aria-hidden="true" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className={`mt-6 grid gap-3 ${slide.example ? 'md:grid-cols-2' : ''}`}>
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">In simple words</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{slide.explanation}</p>
            </div>
            {slide.example ? (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Everyday example</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{slide.example}</p>
              </div>
            ) : null}
          </div>

          <aside className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100" aria-label="Key takeaway">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p><span className="font-bold">Remember: </span>{slide.takeaway}</p>
          </aside>
        </div>
      </section>

      <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Slide navigation">
        <button
          type="button"
          onClick={previous}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Previous slide
        </button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose a slide">
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`Go to slide ${itemIndex + 1}: ${item.title}`}
              aria-current={itemIndex === index ? 'step' : undefined}
              className={`h-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${itemIndex === index ? 'w-7 bg-teal-600' : 'w-2.5 bg-slate-300 hover:bg-teal-400 dark:bg-slate-600 dark:hover:bg-teal-500'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          disabled={index === slides.length - 1}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next slide <ArrowRight className="h-4 w-4" />
        </button>
      </nav>
      <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        Slides are a visual companion. Read the lesson as well; the quiz unlocks after you reach the lesson&apos;s end.
      </p>
    </div>
  )
}
