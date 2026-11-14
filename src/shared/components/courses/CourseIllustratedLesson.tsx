import { useMemo, useState } from 'react'
import { ArrowDownRight, Eye, Lightbulb, Sparkles } from 'lucide-react'
import type { CourseIllustration, CourseTopicIllustrations } from '@/shared/courses/illustrationTypes'
import CourseMarkdown from './CourseMarkdown'
import CourseDiagram from './CourseDiagram'
import CourseAnimatedDiagram from './CourseAnimatedDiagram'

const kindLabels = {
  flow: 'Step-by-step', cycle: 'Feedback loop', hub: 'System map', compare: 'Side by side',
  bars: 'Worked chart', funnel: 'Funnel model', matrix: 'Decision matrix',
  schedule: 'Schedule model', board: 'Work board', raci: 'Responsibility table',
  prompt: 'Prompt-building lab', workforce: 'Workforce metrics lab',
}

function Illustration({ illustration, index, topicId }: { illustration: CourseIllustration; index: number; topicId: string }) {
  const id = `visual-${topicId}-${illustration.id}`
  return (
    <figure id={id} aria-labelledby={`${id}-title`} className="course-illustration my-7 scroll-mt-24 overflow-hidden rounded-2xl border border-teal-200/80 bg-white shadow-sm dark:border-teal-900 dark:bg-slate-950/40">
      <figcaption className="border-b border-slate-100 bg-gradient-to-r from-teal-50/70 to-white px-4 py-4 dark:border-slate-800 dark:from-teal-950/30 dark:to-slate-900/30 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-teal-800 dark:text-teal-300"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Visual {String(index + 1).padStart(2, '0')}</span>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{kindLabels[illustration.diagram.kind]}</span>
        </div>
        <h4 id={`${id}-title`} className="mt-2 text-base font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-lg">{illustration.title}</h4>
        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{illustration.explanation}</p>
      </figcaption>
      <div className="p-4 sm:p-5">
        {illustration.walkthrough ? <CourseAnimatedDiagram diagram={illustration.diagram} title={illustration.title} /> : <CourseDiagram diagram={illustration.diagram} />}
        <aside className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60" aria-label="What to notice">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <p className="text-xs leading-6 text-slate-700 dark:text-slate-200"><span className="font-extrabold text-slate-900 dark:text-white">What to notice. </span>{illustration.takeaway}</p>
        </aside>
        {illustration.checkpoint ? (
          <details className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-3.5 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
            <summary className="cursor-pointer text-xs font-bold leading-5 text-indigo-800 focus-visible:outline-indigo-600 dark:text-indigo-200">Quick check: {illustration.checkpoint.question}</summary>
            <p className="mt-2 border-t border-indigo-100 pt-2 text-xs leading-6 text-slate-700 dark:border-indigo-900 dark:text-slate-200">{illustration.checkpoint.answer}</p>
          </details>
        ) : null}
        <p className="mt-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">{illustration.caption}</p>
      </div>
    </figure>
  )
}

interface CourseIllustratedLessonProps {
  source: string
  companion: CourseTopicIllustrations
  topicId: string
}

/** The visual layer is inserted AFTER original sections, never in place of them. */
export default function CourseIllustratedLesson({ source, companion, topicId }: CourseIllustratedLessonProps) {
  const [show, setShow] = useState(true)
  const afterSections = useMemo(() => show ? new Map(companion.sections.map((section, index) => [
    section.section,
    <Illustration key={section.id} illustration={section} index={index} topicId={topicId} />,
  ])) : undefined, [show, companion, topicId])

  return (
    <>
      <section className="course-visual-intro relative mb-6 overflow-hidden rounded-2xl bg-slate-950 p-5 text-white sm:p-6" aria-label="Illustrated learning companion">
        <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-teal-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-300"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Illustrated edition</p>
            <button type="button" role="switch" aria-checked={show} aria-label="Show lesson illustrations" onClick={() => setShow((current) => !current)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
              <span aria-hidden="true" className={`flex h-4 w-7 items-center rounded-full p-0.5 ${show ? 'justify-end bg-teal-400' : 'justify-start bg-slate-600'}`}><span className="h-3 w-3 rounded-full bg-white" /></span>
              Illustrations {show ? 'on' : 'off'}
            </button>
          </div>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">Read the idea. See how it works.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{companion.introduction}</p>
          <p className="mt-3 text-[11px] leading-5 text-teal-200">{companion.sections.length} visual explanations{companion.sections.some((section) => section.walkthrough) ? ' · learner-controlled animations' : ''} · original reading preserved · no change to quizzes or completion</p>
          {show ? (
            <details className="mt-4 border-t border-white/10 pt-3">
              <summary className="cursor-pointer text-xs font-semibold text-white focus-visible:outline-teal-300">Jump to a visual explanation</summary>
              <nav aria-label="Visual explanations in this topic" className="mt-3 grid gap-2 sm:grid-cols-2">
                {companion.sections.map((section, index) => <a key={section.id} href={`#visual-${topicId}-${section.id}`} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs leading-5 text-slate-200 hover:border-teal-400/50 hover:text-teal-200 focus-visible:outline-teal-300"><span className="font-bold text-teal-300">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1">{section.title}</span><ArrowDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a>)}
              </nav>
            </details>
          ) : <p className="mt-3 text-xs text-slate-400">Text-only view. Switch illustrations on at any time.</p>}
        </div>
      </section>
      <CourseMarkdown source={source} skipTitle afterSections={afterSections} />
    </>
  )
}
