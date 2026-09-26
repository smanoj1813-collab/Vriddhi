// src/shared/components/courses/CourseQuiz.tsx
//
// End-of-lesson quiz: pick one option per question, submit, see the score and
// every explanation. Unlimited attempts; the caller decides what to persist
// (the progress hook keeps the best score and the attempt count).

import { useMemo, useState } from 'react'
import { CheckCircle2, CircleX, RotateCcw, Trophy } from 'lucide-react'
import type { CourseQuizQuestion, CourseQuizResult } from '@/shared/courses/types'

interface CourseQuizProps {
  questions: CourseQuizQuestion[]
  best?: CourseQuizResult
  onSubmit: (answers: Record<string, number>) => { score: number; total: number }
}

export default function CourseQuiz({ questions, best, onSubmit }: CourseQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)

  const unanswered = useMemo(() => questions.filter((q) => answers[q.id] === undefined).length, [questions, answers])

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        This item has no quiz — it is assessed through the project rubric instead.
      </div>
    )
  }

  const submit = () => {
    if (unanswered > 0) return
    setResult(onSubmit(answers))
  }

  const retry = () => {
    setAnswers({})
    setResult(null)
  }

  const pct = result ? Math.round((result.score / result.total) * 100) : 0

  return (
    <div className="space-y-5">
      {best ? (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <Trophy className="h-4 w-4 text-amber-500" />
          Best so far: {best.score}/{best.total} · {best.attempts} attempt{best.attempts === 1 ? '' : 's'}
        </div>
      ) : null}

      {result ? (
        <div
          className={`rounded-2xl border p-4 ${
            pct >= 80
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
              : pct >= 50
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'
          }`}
        >
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">
            {result.score} / {result.total} correct ({pct}%)
          </p>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
            {pct >= 80
              ? 'Solid. Read the explanations for anything you guessed, then mark the lesson complete.'
              : pct >= 50
                ? 'Good start. Re-read the sections behind the questions you missed and try again.'
                : 'Worth another pass through the lesson before retrying — the explanations below point to the right sections.'}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      ) : null}

      <ol className="space-y-5">
        {questions.map((q, qIdx) => {
          const chosen = answers[q.id]
          const isCorrect = result ? chosen === q.answerIndex : null
          return (
            <li key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {qIdx + 1}
                </span>
                {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oIdx) => {
                  const selected = chosen === oIdx
                  const showCorrect = result && oIdx === q.answerIndex
                  const showWrong = result && selected && oIdx !== q.answerIndex
                  return (
                    <label
                      key={oIdx}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                        showCorrect
                          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
                          : showWrong
                            ? 'border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40'
                            : selected
                              ? 'border-teal-400 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/40'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
                      } ${result ? 'cursor-default' : ''}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={oIdx}
                        checked={selected}
                        disabled={!!result}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                        className="mt-1 h-4 w-4 accent-teal-600"
                      />
                      <span className="flex-1 text-slate-700 dark:text-slate-200">{opt}</span>
                      {showCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : null}
                      {showWrong ? <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : null}
                    </label>
                  )
                })}
              </div>
              {result && q.explanation ? (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
                  }`}
                >
                  <span className="font-semibold">Why: </span>
                  {q.explanation}
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>

      {!result ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {unanswered === 0 ? 'All answered.' : `${unanswered} question${unanswered === 1 ? '' : 's'} left`}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={unanswered > 0}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check answers
          </button>
        </div>
      ) : null}
    </div>
  )
}
