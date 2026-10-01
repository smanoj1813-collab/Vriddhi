import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  Loader2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react'
import {
  CODING_LAB_PROGRAMS,
  CODING_LANGUAGES,
  type CodingLanguage,
  type CodingLabProgram,
} from '../codingLabCatalog'
import { runStudentCode, type RunStudentCodeResult } from '../services/codeRunnerApi'
import { useStudentData } from '../hooks/useStudentData'
import { isBcaStudent } from '../codingLabAccess'

const INPUT_CLASS = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

function languageLabel(language: CodingLanguage): string {
  return CODING_LANGUAGES.find((item) => item.id === language)?.label || language.toUpperCase()
}

function statusTone(statusId: number): string {
  if (statusId === 3) return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
  if (statusId === 6) return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
  if (statusId === 5) return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
}

function resultOutput(result: RunStudentCodeResult): string {
  const chunks = [
    result.stdout,
    result.stderr ? `Standard error:\n${result.stderr}` : '',
    result.compileOutput ? `Compiler output:\n${result.compileOutput}` : '',
  ].filter(Boolean)
  return chunks.join('\n\n') || result.message || 'The program completed without printed output.'
}

export default function StudentCodingLab() {
  const { profile, loading: profileLoading, codingLabEnabled } = useStudentData()
  const [selectedId, setSelectedId] = useState(CODING_LAB_PROGRAMS[0]?.id || '')
  const [languageFilter, setLanguageFilter] = useState<'all' | CodingLanguage>('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sourceCode, setSourceCode] = useState(CODING_LAB_PROGRAMS[0]?.sourceCode || '')
  const [stdin, setStdin] = useState(CODING_LAB_PROGRAMS[0]?.stdin || '')
  const [running, setRunning] = useState(false)
  const [copyState, setCopyState] = useState('')
  const [result, setResult] = useState<RunStudentCodeResult | null>(null)
  const [runError, setRunError] = useState('')
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null)

  const selectedProgram = useMemo(
    () => CODING_LAB_PROGRAMS.find((program) => program.id === selectedId) || CODING_LAB_PROGRAMS[0],
    [selectedId],
  )
  const subjects = useMemo(
    () => [...new Set(CODING_LAB_PROGRAMS.map((program) => program.subject))],
    [],
  )
  const visiblePrograms = useMemo(() => {
    const query = search.trim().toLowerCase()
    return CODING_LAB_PROGRAMS.filter((program) => {
      if (languageFilter !== 'all' && program.language !== languageFilter) return false
      if (subjectFilter !== 'all' && program.subject !== subjectFilter) return false
      if (!query) return true
      return [program.title, program.subject, program.topic, program.objective, program.language]
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [languageFilter, subjectFilter, search])

  const selectProgram = (program: CodingLabProgram) => {
    setSelectedId(program.id)
    setSourceCode(program.sourceCode)
    setStdin(program.stdin)
    setResult(null)
    setRunError('')
  }

  useEffect(() => {
    if (visiblePrograms.length && !visiblePrograms.some((program) => program.id === selectedId)) {
      const fallback = visiblePrograms[0]
      setSelectedId(fallback.id)
      setSourceCode(fallback.sourceCode)
      setStdin(fallback.stdin)
      setResult(null)
      setRunError('')
    }
  }, [visiblePrograms, selectedId])

  const handleRun = async () => {
    if (!selectedProgram || !sourceCode.trim() || running) return
    setRunning(true)
    setRunError('')
    setResult(null)
    try {
      const output = await runStudentCode({
        language: selectedProgram.language,
        sourceCode,
        stdin,
      })
      setResult(output)
      setDailyRemaining(output.dailyRemaining)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not run this program.'
      setRunError(message)
    } finally {
      setRunning(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sourceCode)
      setCopyState('Copied')
      window.setTimeout(() => setCopyState(''), 1600)
    } catch {
      setCopyState('Copy unavailable')
      window.setTimeout(() => setCopyState(''), 2000)
    }
  }

  const sampleMatches = !!(
    result && result.statusId === 3 && stdin === selectedProgram?.stdin
    && result.stdout.trim() === selectedProgram?.expectedOutput.trim()
  )

  if (profileLoading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" /> Checking your student programme…
      </div>
    )
  }

  if (!isBcaStudent(profile)) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-900/60 dark:bg-[#131b2e]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">Coding Lab is for BCA students</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          This programme does not have access to the coding lab. If your student profile is linked to BCA, ask your college administrator to correct your programme details.
        </p>
        <Link to="/student/learning" className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">
          Back to Learning
        </Link>
      </section>
    )
  }

  if (!codingLabEnabled) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-900/60 dark:bg-[#131b2e]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">Coding Lab is not enabled for your college</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Your BCA profile is recognised, but this college has not been assigned Coding Lab access yet. Contact your college administrator for more information.
        </p>
        <Link to="/student/learning" className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">
          Back to Learning
        </Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-5">
      <header className="overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-100">
              <Code2 className="h-3.5 w-3.5" /> BCA programming practice
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Coding Lab</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200">
              Learn by reading a worked example, changing the code and running it. Start with C, then explore C++, Java and Python.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">{CODING_LAB_PROGRAMS.length} worked programs</span>
            <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">4 languages</span>
            {dailyRemaining !== null && <span className="rounded-xl border border-teal-300/20 bg-teal-300/10 px-3 py-2">{dailyRemaining} runs left today</span>}
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Program library</h2>
            <span className="text-[11px] font-semibold text-slate-500">{visiblePrograms.length} shown</span>
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search programs or topics"
              className={`${INPUT_CLASS} w-full pl-9`}
              aria-label="Search programming examples"
            />
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <select
              value={languageFilter}
              onChange={(event) => setLanguageFilter(event.target.value as 'all' | CodingLanguage)}
              className={`${INPUT_CLASS} w-full`}
              aria-label="Filter by language"
            >
              <option value="all">All languages</option>
              {CODING_LANGUAGES.map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}
            </select>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className={`${INPUT_CLASS} w-full`}
              aria-label="Filter by subject"
            >
              <option value="all">All subjects</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </div>
          <div className="mt-4 max-h-[38vh] space-y-1 overflow-y-auto pr-1 xl:max-h-[calc(100vh-410px)]">
            {visiblePrograms.map((program) => {
              const active = program.id === selectedId
              return (
                <button
                  type="button"
                  key={program.id}
                  onClick={() => selectProgram(program)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${active
                    ? 'border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900/70'}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold ${active ? 'text-teal-800 dark:text-teal-200' : 'text-slate-800 dark:text-slate-200'}`}>{program.title}</span>
                    {active && <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-300" />}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{languageLabel(program.language)}</span>
                    <span>·</span>
                    <span>{program.topic}</span>
                  </span>
                </button>
              )
            })}
            {visiblePrograms.length === 0 && <p className="px-2 py-6 text-center text-xs text-slate-500">No programs match those filters.</p>}
          </div>
        </aside>

        {selectedProgram ? (
          <section className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">{languageLabel(selectedProgram.language)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedProgram.level}</span>
                    <span className="text-[11px] font-medium text-slate-500">{selectedProgram.subject} · {selectedProgram.topic}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{selectedProgram.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{selectedProgram.objective}</p>
                </div>
                <a
                  href="https://ce.judge0.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 self-start text-[11px] font-semibold text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
                >
                  Runner details <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2.5 sm:px-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <TerminalSquare className="h-4 w-4 text-teal-400" />
                  <span>Editor</span>
                  <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{languageLabel(selectedProgram.language)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => void handleCopy()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800" aria-label="Copy source code">
                    <Copy className="h-3.5 w-3.5" /> {copyState || 'Copy'}
                  </button>
                  <button type="button" onClick={() => selectProgram(selectedProgram)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRun()}
                    disabled={running || !sourceCode.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-[11px] font-extrabold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    {running ? 'Running…' : 'Run code'}
                  </button>
                </div>
              </div>
              <textarea
                spellCheck={false}
                value={sourceCode}
                onChange={(event) => setSourceCode(event.target.value)}
                aria-label={`${languageLabel(selectedProgram.language)} source code editor`}
                className="min-h-[360px] w-full resize-y bg-[#0b1220] px-4 py-4 font-mono text-[12px] leading-6 text-slate-100 outline-none selection:bg-teal-500/30 sm:min-h-[430px] sm:text-[13px]"
              />
              <div className="border-t border-slate-800 bg-slate-900/70 p-3 sm:p-4">
                <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-300">
                  <BookOpen className="h-3.5 w-3.5 text-teal-400" /> Standard input
                  <span className="font-normal normal-case tracking-normal text-slate-500">(stdin)</span>
                </label>
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  aria-label="Program input"
                  placeholder="Enter one input value per line"
                  className="min-h-[74px] w-full resize-y rounded-xl border border-slate-700 bg-[#0b1220] px-3 py-2 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]">
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Expected sample output</h3>
                <pre className="min-h-16 whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-xs leading-5 text-teal-200">{selectedProgram.expectedOutput || '(no printed output)'}</pre>
              </div>
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Run result</h3>
                  {result && (
                    <span className="flex flex-wrap items-center justify-end gap-1.5 text-[10px] font-semibold text-slate-500">
                      {result.time && <span>{result.time}s</span>}
                      {result.memory !== null && <span>{result.memory} KB</span>}
                    </span>
                  )}
                </div>
                {runError ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{runError}</span>
                  </div>
                ) : result ? (
                  <>
                    <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${statusTone(result.statusId)}`}>
                      <span className="inline-flex items-center gap-1.5">
                        {result.statusId === 3 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {result.status}
                      </span>
                      {sampleMatches && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Matches sample</span>}
                    </div>
                    <pre className="min-h-16 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">{resultOutput(result)}</pre>
                    {result.dailyRemaining >= 0 && <p className="mt-2 text-[10px] text-slate-500">{result.dailyRemaining} code runs left today.</p>}
                  </>
                ) : (
                  <div className="flex min-h-20 items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <Play className="h-4 w-4 text-teal-600" /> Edit the sample and choose <strong>Run code</strong> to see your output here.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-[11px] leading-relaxed text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-100">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Runs use a time-limited sandbox. Your code and standard input are sent to the compiler service configured by Vriddhi for execution; they are not saved in your account. Do not paste passwords, API keys or personal data into the editor.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-[#131b2e] dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-100">Study note</p>
              <p className="mt-1">Try to predict the output first. Then change the input or one line of code and explain why the result changed. Use your university lab manual for required formats and marking criteria.</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
