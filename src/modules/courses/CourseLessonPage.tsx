// src/modules/courses/CourseLessonPage.tsx
//
// The lesson player: module outline on the left (a drawer on phones), the
// lesson body or its quiz on the right, previous / next and "mark complete".
// Lesson Markdown is fetched lazily from the bundle (courseCatalog.loadLesson).

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  FlaskConical,
  ListChecks,
  Loader2,
  Menu,
  X,
} from 'lucide-react'
import CourseMarkdown from '@/shared/components/courses/CourseMarkdown'
import CourseQuiz from '@/shared/components/courses/CourseQuiz'
import { getCourse, loadLesson } from '@/shared/courses/courseCatalog'
import { coursePercent, findTopic, formatMinutes, modulePercent, neighbours } from '@/shared/courses/courseModel'
import { useCourseProgress } from '@/shared/courses/courseProgress'
import { Breadcrumb, Chip, EmptyState, ProgressBar } from './courseUi'

interface CourseLessonPageProps {
  basePath: string
  uid?: string
}

type Tab = 'lesson' | 'quiz'

export default function CourseLessonPage({ basePath, uid }: CourseLessonPageProps) {
  const { courseId = '', topicId = '' } = useParams()
  const navigate = useNavigate()
  const course = getCourse(courseId)
  const { progress, complete, uncomplete, visit, submitQuiz } = useCourseProgress(uid, courseId)

  const topic = useMemo(() => (course ? findTopic(course.sequence, topicId) : undefined), [course, topicId])
  const { prev, next } = useMemo(() => (course ? neighbours(course.sequence, topicId) : {}), [course, topicId])
  const questions = course?.quizzes[topicId] || []

  const [tab, setTab] = useState<Tab>('lesson')
  const [body, setBody] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [outlineOpen, setOutlineOpen] = useState(false)

  // Load the Markdown for this topic; reset the tab and scroll on change.
  useEffect(() => {
    if (!course || !topic) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setTab('lesson')
    setOutlineOpen(false)
    loadLesson(course.manifest.id, topic.lesson)
      .then((text) => {
        if (!cancelled) setBody(text)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load this lesson.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      /* non-browser environment */
    }
    return () => {
      cancelled = true
    }
  }, [course, topic])

  // Remember where the learner is, so "Continue" lands here.
  useEffect(() => {
    if (topic) visit(topic.id)
  }, [topic, visit])

  if (!course || !topic) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Lesson not found"
          body="This link does not match a lesson in the bundled course."
          action={<Link to={basePath} className="text-sm font-semibold text-teal-700 underline">Back to courses</Link>}
        />
      </div>
    )
  }

  const { manifest } = course
  const done = !!progress.completed[topic.id]
  const best = progress.quiz[topic.id]
  const percent = coursePercent(manifest, progress)
  const courseHome = `${basePath}/${manifest.id}`
  const isProject = topic.type === 'project'

  const toggleComplete = () => {
    if (done) uncomplete(topic.id)
    else complete(topic.id)
  }

  const completeAndNext = () => {
    complete(topic.id)
    if (next) navigate(`${courseHome}/learn/${next.id}`)
    else navigate(courseHome)
  }

  const outline = (
    <nav aria-label="Course outline" className="space-y-4">
      <div>
        <Link to={courseHome} className="block text-sm font-extrabold text-slate-900 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">
          {manifest.shortTitle}
        </Link>
        <div className="mt-1.5 flex items-center gap-2">
          <ProgressBar percent={percent} />
          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">{percent}%</span>
        </div>
      </div>
      {manifest.modules.map((mod) => {
        const pct = modulePercent(mod, progress)
        const isCurrent = mod.id === topic.moduleId
        return (
          <details key={mod.id} open={isCurrent} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] ${pct === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                {pct === 100 ? '✓' : mod.number}
              </span>
              <span className="min-w-0 flex-1 truncate">{mod.title}</span>
            </summary>
            <ul className="mt-1 space-y-0.5 pl-1">
              {mod.topics.map((t) => {
                const active = t.id === topic.id
                const tDone = !!progress.completed[t.id]
                return (
                  <li key={t.id}>
                    <Link
                      to={`${courseHome}/learn/${t.id}`}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
                        active
                          ? 'bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/50 dark:text-teal-200'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tDone ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : t.type === 'project' ? (
                        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="mr-1 text-[10px] font-bold text-slate-400">{t.number}</span>
                        {t.title}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </details>
        )
      })}
    </nav>
  )

  return (
    <div className="mx-auto max-w-6xl pb-24 lg:pb-10">
      {/* Phone: outline drawer */}
      {outlineOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close outline" className="absolute inset-0 bg-slate-900/50" onClick={() => setOutlineOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Outline</p>
              <button type="button" onClick={() => setOutlineOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {outline}
          </div>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        {/* Desktop outline */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
            {outline}
          </div>
        </aside>

        {/* Lesson */}
        <article className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <Breadcrumb items={[{ label: 'Courses', to: basePath }, { label: manifest.shortTitle, to: courseHome }, { label: `Module ${topic.moduleNumber}` }]} />
            <button
              type="button"
              onClick={() => setOutlineOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200 lg:hidden"
            >
              <Menu className="h-4 w-4" /> Outline
            </button>
          </div>

          <header className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={isProject ? 'violet' : 'teal'}>{isProject ? 'Project block' : 'Lesson'} {topic.number}</Chip>
              <Chip><Clock className="mr-1 h-3 w-3" /> {formatMinutes(topic.minutes)}</Chip>
              <Chip>{topic.moduleTitle}</Chip>
              {done ? <Chip tone="emerald"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Chip> : null}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{topic.title}</h1>
            {topic.summary ? <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{topic.summary}</p> : null}
          </header>

          {/* Tabs */}
          <div className="mt-5 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70" role="tablist">
            <TabButton active={tab === 'lesson'} onClick={() => setTab('lesson')} icon={<BookOpen className="h-4 w-4" />}>
              {isProject ? 'Brief' : 'Lesson'}
            </TabButton>
            <TabButton active={tab === 'quiz'} onClick={() => setTab('quiz')} icon={<ListChecks className="h-4 w-4" />}>
              Quiz{questions.length ? ` · ${questions.length}` : ''}
              {best ? <span className="ml-1 rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white">{best.score}/{best.total}</span> : null}
            </TabButton>
          </div>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-7" role="tabpanel">
            {tab === 'lesson' ? (
              loading ? (
                <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <EmptyState title="Could not load this lesson" body={error} />
              ) : (
                <CourseMarkdown source={body} skipTitle />
              )
            ) : (
              <CourseQuiz questions={questions} best={best} onSubmit={(answers) => submitQuiz(topic.id, questions, answers)} />
            )}
          </section>

          {/* Footer navigation */}
          <footer className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {prev ? (
                <Link to={`${courseHome}/learn/${prev.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">{prev.number}</span> Previous
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={toggleComplete}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                  done
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                {done ? 'Completed · undo' : 'Mark complete'}
              </button>
              <button
                type="button"
                onClick={completeAndNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                {next ? (
                  <>
                    {done ? 'Next' : 'Complete & next'} · {next.number} <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>Finish course <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-white text-teal-800 shadow-sm dark:bg-slate-900 dark:text-teal-200' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
