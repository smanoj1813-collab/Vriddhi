// src/modules/courses/CourseOverviewPage.tsx
//
// One course: hero + outcomes, the module → topic syllabus with completion
// state, the assessment scheme, the toolkit and prerequisites.

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  FlaskConical,
  Layers,
  Loader2,
  LockKeyhole,
  PlayCircle,
  Target,
  Wrench,
} from 'lucide-react'
import { getCourse } from '@/shared/courses/courseCatalog'
import { certificateEligibility, coursePercent, formatMinutes, hasReadTopic, isModuleUnlocked, isTopicUnlocked, moduleAssessmentPercent, moduleCounts, modulePercent, quizAverage, resumeTopic } from '@/shared/courses/courseModel'
import { useCourseProgress } from '@/shared/courses/courseProgress'
import { downloadCourseCertificate } from '@/shared/courses/courseCertificate'
import CourseModuleAssessment from '@/shared/components/courses/CourseModuleAssessment'
import type { CourseModuleManifest } from '@/shared/courses/types'
import { Breadcrumb, Card, Chip, EmptyState, ProgressBar, SectionTitle } from './courseUi'

interface CourseOverviewPageProps {
  basePath: string
  uid?: string
  collegeId?: string
  learnerName?: string
}

export default function CourseOverviewPage({ basePath, uid, collegeId, learnerName }: CourseOverviewPageProps) {
  const { courseId = '' } = useParams()
  const course = getCourse(courseId)
  const { progress, loading: progressLoading, submitModuleAssessment } = useCourseProgress(uid, courseId, { collegeId, manifest: course?.manifest })
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [certificateBusy, setCertificateBusy] = useState(false)
  const [certificateError, setCertificateError] = useState('')

  const resume = useMemo(() => (course ? resumeTopic(course.sequence, progress) : undefined), [course, progress])

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Course not found"
          body={`No bundled course has the id "${courseId}".`}
          action={<Link to={basePath} className="text-sm font-semibold text-teal-700 underline">Back to courses</Link>}
        />
      </div>
    )
  }

  const { manifest } = course
  const percent = coursePercent(manifest, progress)
  const avg = quizAverage(progress)
  const totalTopics = course.sequence.length
  const doneTopics = course.sequence.filter((topic) => hasReadTopic(progress, topic.id)).length
  const firstIncompleteModuleIndex = manifest.modules.findIndex((mod, index) => {
    if (!isModuleUnlocked(manifest, progress, index)) return false
    if (modulePercent(mod, progress) < 100) return true
    const result = progress.moduleAssessments?.[mod.id]
    const passMark = mod.assessment?.passMark ?? 60
    return !!mod.assessment && (!result || result.total === 0 || (result.score / result.total) * 100 < passMark)
  })
  const certificate = certificateEligibility(manifest, progress)

  const isOpen = (mod: CourseModuleManifest) => open[mod.id] ?? (manifest.modules.indexOf(mod) === (firstIncompleteModuleIndex >= 0 ? firstIncompleteModuleIndex : 0))

  const handleDownloadCertificate = async () => {
    if (!course || !uid || !certificate.eligible || progressLoading) return
    setCertificateBusy(true)
    setCertificateError('')
    try {
      await downloadCourseCertificate({ manifest, learnerName: learnerName || 'Learner', uid })
    } catch (err) {
      setCertificateError(err instanceof Error ? err.message : 'The certificate could not be generated.')
    } finally {
      setCertificateBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Breadcrumb items={[{ label: 'Courses', to: basePath }, { label: manifest.shortTitle }]} />

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">{manifest.code}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">{manifest.level}</span>
          {manifest.credits ? <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">{manifest.credits} credits</span> : null}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{manifest.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-teal-50/90 sm:text-base">{manifest.tagline}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Clock className="h-4 w-4" />} label="Duration" value={`${manifest.totalHours} h · ${manifest.durationWeeks ?? '—'} wk`} />
          <Stat icon={<Layers className="h-4 w-4" />} label="Modules" value={String(manifest.modules.length)} />
          <Stat icon={<BookOpen className="h-4 w-4" />} label="Lessons & projects" value={String(totalTopics)} />
          <Stat icon={<Award className="h-4 w-4" />} label="Pass mark" value={`${manifest.assessment.passMark}%`} />
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Your progress · {doneTopics}/{totalTopics} complete{avg !== null ? ` · quiz average ${avg}%` : ''}</span>
            <span>{percent}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          {resume ? (
            <Link
              to={`${basePath}/${manifest.id}/learn/${resume.id}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow-sm hover:bg-teal-50"
            >
              <PlayCircle className="h-4 w-4" />
              {percent === 0 && !progress.lastTopicId ? 'Start with' : percent === 100 ? 'Revisit' : 'Continue with'} {resume.number} · {resume.title}
            </Link>
          ) : null}
        </div>
      </section>

      {/* Outcomes + audience */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle kicker="What you will be able to do">Programme outcomes</SectionTitle>
          <ul className="mt-3 space-y-2">
            {manifest.outcomes.map((o, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle kicker="Who it is for">Audience & prerequisites</SectionTitle>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{manifest.audience}</p>
          <ul className="mt-3 space-y-1.5">
            {manifest.prerequisites.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {manifest.weeklyCommitment ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <span className="font-semibold">Weekly commitment: </span>{manifest.weeklyCommitment}
            </p>
          ) : null}
        </Card>
      </div>

      {/* Syllabus */}
      <section className="space-y-3">
        <SectionTitle kicker="Syllabus">{manifest.modules.length} modules · {totalTopics} lessons and projects</SectionTitle>
        {manifest.modules.map((mod, moduleIndex) => {
          const counts = moduleCounts(mod, progress)
          const pct = modulePercent(mod, progress)
          const moduleUnlocked = isModuleUnlocked(manifest, progress, moduleIndex)
          const assessmentPct = moduleAssessmentPercent(progress, mod.id)
          const expanded = isOpen(mod)
          const modMinutes = mod.topics.reduce((n, t) => n + t.minutes, 0)
          return (
            <Card key={mod.id} className="p-0">
              <button
                type="button"
                onClick={() => setOpen((prev) => ({ ...prev, [mod.id]: !expanded }))}
                className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
                aria-expanded={expanded}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                  pct === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                }`}>
                  {pct === 100 ? <CheckCircle2 className="h-5 w-5" /> : mod.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">Module {mod.number}: {mod.title}</span>
                    {mod.weeks ? <Chip>{mod.weeks}</Chip> : null}
                    {!moduleUnlocked ? <Chip tone="amber"><LockKeyhole className="mr-1 h-3 w-3" /> Locked · pass previous assessment</Chip> : null}
                    {mod.assessment && assessmentPct !== null ? <Chip tone={assessmentPct >= (mod.assessment.passMark ?? 60) ? 'emerald' : 'amber'}>Assessment {assessmentPct}%</Chip> : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">{mod.summary}</span>
                  <span className="mt-2 flex items-center gap-3">
                    <ProgressBar percent={pct} className="max-w-xs" tone={pct === 100 ? 'emerald' : 'teal'} />
                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">
                      {counts.done}/{counts.total} · {formatMinutes(modMinutes)}
                    </span>
                  </span>
                </span>
                {expanded ? <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-400" /> : <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />}
              </button>

              {expanded ? (
                <div className="border-t border-slate-100 px-4 pb-4 dark:border-slate-800 sm:px-5">
                  {mod.outcomes?.length ? (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Module outcomes</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600 dark:text-slate-300">
                        {mod.outcomes.map((o, idx) => <li key={idx}>{o}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  <ol className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {mod.topics.map((topic) => {
                      const done = hasReadTopic(progress, topic.id)
                      const quiz = progress.quiz[topic.id]
                      const isProject = topic.type === 'project'
                      const topicUnlocked = isTopicUnlocked(manifest, progress, topic.id)
                      const row = (
                        <div className={`-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 ${topicUnlocked ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40' : 'opacity-60'}`}>
                          {!topicUnlocked ? (
                            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                          ) : done ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                          ) : isProject ? (
                            <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                          ) : (
                            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2">
                              <span className="text-xs font-bold text-slate-400">{topic.number}</span>
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{topic.title}</span>
                              {isProject ? <Chip tone="violet">Project</Chip> : null}
                              {!topicUnlocked ? <Chip tone="amber">Locked</Chip> : null}
                            </span>
                            {topic.summary ? <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{topic.summary}</span> : null}
                            {!topicUnlocked ? <span className="mt-0.5 block text-[10px] text-slate-400">Read the previous topic and submit its quiz to unlock.</span> : null}
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1 text-[11px] font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatMinutes(topic.minutes)}</span>
                            {quiz ? <span className="text-teal-700 dark:text-teal-300">Quiz {quiz.score}/{quiz.total}</span> : null}
                          </span>
                        </div>
                      )
                      return (
                        <li key={topic.id}>
                          {topicUnlocked ? <Link to={`${basePath}/${manifest.id}/learn/${topic.id}`}>{row}</Link> : <div aria-disabled="true">{row}</div>}
                        </li>
                      )
                    })}
                  </ol>
                  {mod.assessment ? (
                    <CourseModuleAssessment
                      module={mod}
                      questions={course.moduleAssessments[mod.id] || []}
                      progress={progress}
                      moduleUnlocked={moduleUnlocked}
                      onSubmit={(answers) => submitModuleAssessment(mod.id, course.moduleAssessments[mod.id] || [], answers)}
                    />
                  ) : null}
                </div>
              ) : null}
            </Card>
          )
        })}
      </section>

      {/* Assessment + toolkit */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle kicker="How you are assessed">Assessment scheme</SectionTitle>
          <ul className="mt-3 space-y-2.5">
            {manifest.assessment.components.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-extrabold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">{c.weight}%</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{c.description}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {[...manifest.assessment.grades].sort((a, b) => b.min - a.min).map((g) => (
              <Chip key={g.band} tone={g.min >= 80 ? 'emerald' : g.min >= 65 ? 'teal' : g.min >= 50 ? 'amber' : 'slate'}>
                {g.band} {g.min > 0 ? `≥ ${g.min}%` : ''}
              </Chip>
            ))}
          </div>
          {manifest.assessment.conditions?.length ? (
            <ul className="mt-3 space-y-1">
              {manifest.assessment.conditions.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {c}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card>
          <SectionTitle kicker="What you will use">Toolkit (free tiers)</SectionTitle>
          <ul className="mt-3 space-y-2">
            {(manifest.toolkit || []).map((group) => (
              <li key={group.category} className="text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                  <Wrench className="h-3.5 w-3.5 text-slate-400" /> {group.category}
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">{group.tools.join(' · ')}</span>
                {group.note ? <span className="block text-[11px] italic text-slate-500">{group.note}</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <SectionTitle kicker="Certificate">Download eligibility</SectionTitle>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Complete every platform check below. Passing each module assessment with 60% or more also unlocks the next module.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleDownloadCertificate()}
            disabled={!uid || !collegeId || !certificate.eligible || certificateBusy || progressLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {certificateBusy || progressLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            {certificateBusy ? 'Preparing certificate…' : progressLoading ? 'Syncing progress…' : 'Download certificate'}
          </button>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {certificate.checks.map((check) => (
            <li key={check.id} className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${check.passed ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'}`}>
              {check.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
              <span className="min-w-0"><span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{check.label}</span><span className="block text-[11px] text-slate-500">{check.detail}</span></span>
            </li>
          ))}
        </ul>
        {!uid || !collegeId ? <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Sign in through an assigned college account to download the certificate.</p> : null}
        {certificateError ? <p role="alert" className="mt-3 text-xs text-rose-700 dark:text-rose-300">{certificateError}</p> : null}
        <p className="mt-3 text-[10px] leading-relaxed text-slate-400">This download verifies course-platform completion (all content, quizzes and module assessments). College credit, attendance, project grading and academic-integrity clearance may be governed by additional college rules.</p>
      </Card>

      <p className="text-center text-[11px] text-slate-400">
        {manifest.title} · v{manifest.version}{manifest.lastReviewed ? ` · content reviewed ${manifest.lastReviewed}` : ''}
      </p>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-100/80">{icon} {label}</p>
      <p className="text-sm font-extrabold">{value}</p>
    </div>
  )
}
