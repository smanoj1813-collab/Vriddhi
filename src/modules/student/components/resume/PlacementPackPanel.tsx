// src/modules/student/components/resume/PlacementPackPanel.tsx
//
// Item 4.2 of docs/HANDOFF_OPTIMISATION_2026-09-25.md — the three things a
// student needs the week a company visits, in one place: a cover letter for the
// posting, a LinkedIn "About" they can paste, and the questions they will
// actually be asked (built from their own resume plus the job description).
//
// Design notes:
//   * Nothing here writes to the resume. Generated text is shown in a textarea
//     the student copies or edits — a model must never silently rewrite a
//     document a recruiter will read.
//   * Every call spends one AI credit, so the remaining count is shown before
//     the buttons and refreshed after each generation. The server refuses with
//     `ai_exhausted` when the allowance is gone, and that message is shown
//     verbatim rather than being turned into "something went wrong".
//   * The job description is the input that makes the output specific; the
//     panel says so instead of hiding it behind an optional field.

import { useState } from 'react'
import { Briefcase, Copy, FileText, HelpCircle, Loader2, Sparkles, UserRound } from 'lucide-react'
import {
  generateCoverLetter,
  generateInterviewQuestions,
  generateLinkedinAbout,
  type InterviewQuestion,
} from '@/shared/services/resumeService'
import { useNotification } from '@/shared/providers/NotificationProvider'

type Tab = 'coverLetter' | 'about' | 'interview'

interface Props {
  /** Pre-filled from the resume's target job description (the ATS panel owns it). */
  jobDescription?: string
  /** The role from the resume headline, when there is one — saves typing. */
  defaultJobTitle?: string
  collegeId?: string
  /** Called with the refreshed allowance so the page's AI counter stays true. */
  onCreditsChanged?: (remaining: number) => void
}

export default function PlacementPackPanel({ jobDescription = '', defaultJobTitle = '', collegeId, onCreditsChanged }: Props) {
  const { showSuccess, showError, showWarning } = useNotification()
  const [tab, setTab] = useState<Tab>('coverLetter')
  const [jobTitle, setJobTitle] = useState(defaultJobTitle)
  const [company, setCompany] = useState('')
  const [jd, setJd] = useState(jobDescription)
  const [tone, setTone] = useState('professional')
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [letter, setLetter] = useState('')
  const [about, setAbout] = useState('')
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [source, setSource] = useState<'cache' | 'model' | null>(null)

  const run = async (kind: Tab) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (kind === 'coverLetter') {
        if (jobTitle.trim().length < 3) throw new Error('Give the role you are applying for.')
        const result = await generateCoverLetter({ jobTitle, company, jobDescription: jd, tone }, collegeId)
        setLetter(result.coverLetter)
        setRemaining(result.aiRemaining)
        setSource(result.source)
        onCreditsChanged?.(result.aiRemaining)
        showSuccess(result.source === 'cache' ? 'Cover letter ready (reused from an earlier draft)' : 'Cover letter ready')
      } else if (kind === 'about') {
        const result = await generateLinkedinAbout({ goal }, collegeId)
        setAbout(result.about)
        setRemaining(result.aiRemaining)
        setSource(result.source)
        onCreditsChanged?.(result.aiRemaining)
        showSuccess('LinkedIn About ready')
      } else {
        if (jobTitle.trim().length < 3) throw new Error('Give the role you are interviewing for.')
        const result = await generateInterviewQuestions({ jobTitle, company, jobDescription: jd, count: 15 }, collegeId)
        setQuestions(result.questions)
        setRemaining(result.aiRemaining)
        setSource(result.source)
        onCreditsChanged?.(result.aiRemaining)
        showSuccess(`${result.count} questions ready to rehearse`)
      }
    } catch (err) {
      // The server's own sentence for an exhausted allowance or a disabled
      // feature is the useful one; keep it.
      const message = err instanceof Error ? err.message : 'That did not work. Please try again.'
      setError(message)
      showError(message)
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Copied')
    } catch {
      showWarning('Copy failed — select the text and copy manually.')
    }
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof FileText }> = [
    { id: 'coverLetter', label: 'Cover letter', icon: FileText },
    { id: 'about', label: 'LinkedIn About', icon: UserRound },
    { id: 'interview', label: 'Interview prep', icon: HelpCircle },
  ]

  return (
    <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5" data-testid="placement-pack">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600" /> Placement Pack
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Built from your resume — nothing is added to it automatically, so you decide what a recruiter reads.
          </p>
        </div>
        {remaining !== null ? (
          <span className="text-[11px] font-semibold text-slate-500" data-testid="placement-ai-remaining">
            {remaining} AI suggestion{remaining === 1 ? '' : 's'} left
          </span>
        ) : null}
      </div>

      <div className="flex gap-1.5 mt-3 flex-wrap">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            aria-pressed={tab === entry.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              tab === entry.id
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <entry.icon size={14} /> {entry.label}
          </button>
        ))}
      </div>

      {/* Role + company are shared by the cover letter and the interview prep. */}
      {tab !== 'about' ? (
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Role you are applying for
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Article Assistant"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-normal"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Company (optional)
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Rao & Associates"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-normal"
            />
          </label>
        </div>
      ) : (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3">
          What are you looking for next? (optional)
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. an audit articleship in Bengaluru"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-normal"
          />
        </label>
      )}

      {tab !== 'about' ? (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3">
          Job description (paste it — this is what makes the output specific)
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={4}
            placeholder="Paste the posting here. The more of it, the better the letter and the questions."
            className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-normal"
          />
        </label>
      ) : null}

      {tab === 'coverLetter' ? (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3">
          Tone
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="mt-1 w-full md:w-56 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-normal"
          >
            <option value="professional">Professional</option>
            <option value="warm">Warm</option>
            <option value="direct">Direct</option>
          </select>
        </label>
      ) : null}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(tab)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {busy ? 'Working…' : tab === 'coverLetter' ? 'Write my cover letter' : tab === 'about' ? 'Write my About' : 'Prepare my questions'}
        </button>
        {source === 'cache' ? (
          <span className="text-[11px] text-slate-400">reused from an earlier identical request — no new AI spend</span>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 mt-3" data-testid="placement-error">{error}</p>
      ) : null}

      {tab === 'coverLetter' && letter ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">Cover letter</p>
            <button type="button" onClick={() => void copy(letter)} className="flex items-center gap-1 text-xs font-bold text-teal-700">
              <Copy size={12} /> Copy
            </button>
          </div>
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={12}
            data-testid="cover-letter-output"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Read it before you send it: you are responsible for every claim in it.
          </p>
        </div>
      ) : null}

      {tab === 'about' && about ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">LinkedIn About</p>
            <button type="button" onClick={() => void copy(about)} className="flex items-center gap-1 text-xs font-bold text-teal-700">
              <Copy size={12} /> Copy
            </button>
          </div>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={8}
            data-testid="linkedin-about-output"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs leading-relaxed"
          />
        </div>
      ) : null}

      {tab === 'interview' && questions.length > 0 ? (
        <ol className="mt-4 space-y-3" data-testid="interview-questions">
          {questions.map((item, index) => (
            <li key={index} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <p className="text-sm font-semibold">
                <Briefcase size={13} className="inline mr-1 text-teal-600" />
                {item.question}
              </p>
              {item.why ? <p className="text-[11px] text-slate-500 mt-1">They are checking: {item.why}</p> : null}
              {item.answerHint ? <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{item.answerHint}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
