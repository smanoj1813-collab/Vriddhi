import { useState } from 'react'
import { CheckCircle2, LockKeyhole, ShieldAlert, Trophy } from 'lucide-react'
import type { CourseModuleManifest, CourseProgress, CourseQuizQuestion } from '@/shared/courses/types'
import { canTakeModuleAssessment, moduleAssessmentPercent } from '@/shared/courses/courseModel'
import CourseQuiz from './CourseQuiz'

interface CourseModuleAssessmentProps {
  module: CourseModuleManifest
  questions: CourseQuizQuestion[]
  progress: CourseProgress
  moduleUnlocked: boolean
  onSubmit: (answers: Record<string, number>) => { score: number; total: number }
}

export default function CourseModuleAssessment({
  module,
  questions,
  progress,
  moduleUnlocked,
  onSubmit,
}: CourseModuleAssessmentProps) {
  const [open, setOpen] = useState(false)
  const result = progress.moduleAssessments?.[module.id]
  const passMark = module.assessment?.passMark ?? 60
  const percent = moduleAssessmentPercent(progress, module.id)
  const ready = canTakeModuleAssessment(module, progress)

  return (
    <section className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/20 sm:p-5" aria-label={`Module ${module.number} mini assessment`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            <Trophy className="h-4 w-4" /> Hard mini assessment
          </p>
          <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{module.assessment?.title || `Module ${module.number} assessment`}</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            {questions.length} scenario questions · pass with at least {passMark}% to unlock the next module.
          </p>
          {result ? (
            <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${percent !== null && percent >= passMark ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {percent !== null && percent >= passMark ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              Best score {result.score}/{result.total} ({percent}%) · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
        {!moduleUnlocked ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><LockKeyhole className="h-3.5 w-3.5" /> Previous module not passed</span>
        ) : !ready ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> Finish every topic and lesson quiz first</span>
        ) : (
          <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            {open ? 'Hide assessment' : result && percent !== null && percent >= passMark ? 'Retake assessment' : 'Start assessment'}
          </button>
        )}
      </div>
      {!moduleUnlocked ? (
        <p className="mt-3 text-[11px] text-slate-500">Pass the previous module’s mini assessment with {passMark}% or higher to access this assessment.</p>
      ) : !ready ? (
        <p className="mt-3 text-[11px] text-slate-500">Read all lesson and project content in this module, then submit each lesson quiz to open the mini assessment.</p>
      ) : null}
      {open && moduleUnlocked && ready ? (
        <div className="mt-4 border-t border-indigo-200 pt-4 dark:border-indigo-900">
          <CourseQuiz
            questions={questions}
            best={result}
            passMark={passMark}
            assessmentLabel="Module assessment"
            onSubmit={onSubmit}
          />
        </div>
      ) : null}
    </section>
  )
}
