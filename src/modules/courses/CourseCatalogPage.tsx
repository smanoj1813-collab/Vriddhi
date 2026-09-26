// src/modules/courses/CourseCatalogPage.tsx
//
// "Courses" — every bundled course pack with the learner's progress. Rendered
// inside the student portal (/student/courses) and as the public preview
// (/courses). Progress is per user on the device (courseProgress.ts).

import { Link } from 'react-router-dom'
import { Award, BookOpen, Clock, GraduationCap, Layers, PlayCircle } from 'lucide-react'
import { listCourses } from '@/shared/courses/courseCatalog'
import { coursePercent, formatMinutes, minutesSummary, resumeTopic } from '@/shared/courses/courseModel'
import { progressStorageKey, readProgress } from '@/shared/courses/courseProgress'
import { Card, Chip, EmptyState, ProgressBar } from './courseUi'

interface CourseCatalogPageProps {
  basePath: string
  uid?: string
  /** Public preview shows a discreet banner explaining what it is. */
  publicPreview?: boolean
}

export default function CourseCatalogPage({ basePath, uid, publicPreview }: CourseCatalogPageProps) {
  const courses = listCourses()

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Learning</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Courses</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Self-paced certificate programmes built by Vriddhi. Read, do the lab, take the quiz, mark complete.
          </p>
        </div>
        {publicPreview ? (
          <Chip tone="amber">Public preview · progress is saved on this device only</Chip>
        ) : null}
      </header>

      {courses.length === 0 ? (
        <EmptyState title="No courses yet" body="Course packs live in content/courses/ and are bundled at build time." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {courses.map(({ manifest, sequence }) => {
            const progress = readProgress(progressStorageKey(uid, manifest.id))
            const percent = coursePercent(manifest, progress)
            const minutes = minutesSummary(manifest, progress)
            const resume = resumeTopic(sequence, progress)
            const topicCount = sequence.length
            const lessonCount = sequence.filter((t) => t.type === 'lesson').length
            const started = percent > 0 || !!progress.lastTopicId
            return (
              <Card key={manifest.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow-md">
                    <GraduationCap className="h-7 w-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="teal">{manifest.code}</Chip>
                      <Chip>{manifest.level}</Chip>
                    </div>
                    <h2 className="mt-1.5 text-lg font-extrabold leading-tight text-slate-900 dark:text-white">{manifest.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{manifest.tagline}</p>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/60">
                    <dt className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><Layers className="h-3 w-3" /> Modules</dt>
                    <dd className="text-base font-extrabold text-slate-900 dark:text-white">{manifest.modules.length}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/60">
                    <dt className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><BookOpen className="h-3 w-3" /> Lessons</dt>
                    <dd className="text-base font-extrabold text-slate-900 dark:text-white">{lessonCount}<span className="text-xs font-semibold text-slate-400"> +{topicCount - lessonCount} projects</span></dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/60">
                    <dt className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><Clock className="h-3 w-3" /> Hours</dt>
                    <dd className="text-base font-extrabold text-slate-900 dark:text-white">{manifest.totalHours}</dd>
                  </div>
                </dl>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Course progress</span>
                    <span className="font-bold text-teal-700 dark:text-teal-300">{percent}%</span>
                  </div>
                  <ProgressBar percent={percent} />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatMinutes(minutes.done)} of {formatMinutes(minutes.total)} of content completed
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link
                    to={`${basePath}/${manifest.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Syllabus & overview
                  </Link>
                  {resume ? (
                    <Link
                      to={`${basePath}/${manifest.id}/learn/${resume.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {started ? `Continue · ${resume.number}` : 'Start course'}
                    </Link>
                  ) : null}
                  {manifest.certificateTitle ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Award className="h-3.5 w-3.5 text-amber-500" /> {manifest.certificateTitle}
                    </span>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
