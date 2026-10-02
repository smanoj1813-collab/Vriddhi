export const CODE_RUNNER_DAILY_LIMIT = 30
export const CODE_RUNNER_PER_MINUTE_LIMIT = 6
export const CODE_RUNNER_MAX_SOURCE_CHARS = 16000
export const CODE_RUNNER_MAX_STDIN_CHARS = 4000
export const CODE_RUNNER_MAX_OUTPUT_CHARS = 12000

export type CodeRunnerLanguage = 'c' | 'cpp' | 'java' | 'python'

/** Accept common BCA labels while rejecting unrelated CS degrees. */
export function isBcaProgram(value: unknown): boolean {
  const raw = String(value ?? '').toLowerCase()
  const normalized = raw
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const compact = raw.replace(/[^a-z0-9]/g, '')
  return compact === 'bca'
    || normalized === 'bachelor of computer applications'
    || normalized === 'bachelor of computer application'
    || /(^| )bca( |$)/.test(normalized)
}

const SUPPORTED_LANGUAGES = new Set<CodeRunnerLanguage>(['c', 'cpp', 'java', 'python'])

export interface CodeRunRequest {
  language: CodeRunnerLanguage
  sourceCode: string
  stdin: string
}

export class CodeRunInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CodeRunInputError'
  }
}

/** Strict allowlist: the browser cannot choose compiler flags or runtime limits. */
export function parseCodeRunRequest(raw: unknown): CodeRunRequest {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new CodeRunInputError('A code-run request is required.')
  }
  const value = raw as Record<string, unknown>
  const language = typeof value.language === 'string' ? value.language.trim().toLowerCase() : ''
  if (!SUPPORTED_LANGUAGES.has(language as CodeRunnerLanguage)) {
    throw new CodeRunInputError('Choose C, C++, Java or Python 3.')
  }
  if (typeof value.sourceCode !== 'string' || !value.sourceCode.trim()) {
    throw new CodeRunInputError('Enter some source code before running it.')
  }
  if (value.sourceCode.length > CODE_RUNNER_MAX_SOURCE_CHARS) {
    throw new CodeRunInputError(`Source code must be at most ${CODE_RUNNER_MAX_SOURCE_CHARS.toLocaleString()} characters.`)
  }
  if (typeof value.stdin !== 'undefined' && typeof value.stdin !== 'string') {
    throw new CodeRunInputError('Program input must be plain text.')
  }
  const stdin = typeof value.stdin === 'string' ? value.stdin : ''
  if (stdin.length > CODE_RUNNER_MAX_STDIN_CHARS) {
    throw new CodeRunInputError(`Program input must be at most ${CODE_RUNNER_MAX_STDIN_CHARS.toLocaleString()} characters.`)
  }
  return {
    language: language as CodeRunnerLanguage,
    sourceCode: value.sourceCode,
    stdin,
  }
}

export interface Judge0Language {
  id?: number | string
  name?: string
}

/**
 * Judge0 language IDs vary by installation and version. Resolve the installed
 * compiler by its display name rather than embedding a fragile numeric ID.
 */
export function findJudge0LanguageId(
  language: CodeRunnerLanguage,
  languages: readonly Judge0Language[],
): number | null {
  const patterns: Record<CodeRunnerLanguage, RegExp> = {
    c: /^c\s*(?:\(|$)/i,
    cpp: /^c\+\+(?:\s|$|\()/i,
    java: /^java\b/i,
    python: /^python\b/i,
  }
  const match = languages.find((candidate) => {
    const name = String(candidate.name || '').trim()
    return patterns[language].test(name)
  })
  const id = Number(match?.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

export interface RunnerQuotaDocument {
  dayKey?: unknown
  dailyRuns?: unknown
  minuteKey?: unknown
  minuteRuns?: unknown
}

export interface RunnerQuotaDecision {
  allowed: boolean
  reason?: 'daily' | 'minute'
  dayKey: string
  minuteKey: string
  dailyRuns: number
  minuteRuns: number
  dailyRemaining: number
}

function storedCount(value: unknown): number {
  const count = Math.floor(Number(value))
  return Number.isFinite(count) && count > 0 ? count : 0
}

/** Pure fixed-window quota decision for a single student. */
export function decideCodeRunnerQuota(
  stored: RunnerQuotaDocument | null | undefined,
  nowMs: number,
  dailyLimit = CODE_RUNNER_DAILY_LIMIT,
  perMinuteLimit = CODE_RUNNER_PER_MINUTE_LIMIT,
): RunnerQuotaDecision {
  const date = new Date(nowMs)
  const dayKey = date.toISOString().slice(0, 10)
  const minuteKey = date.toISOString().slice(0, 16)
  const currentDaily = stored?.dayKey === dayKey ? storedCount(stored.dailyRuns) : 0
  const currentMinute = stored?.minuteKey === minuteKey ? storedCount(stored.minuteRuns) : 0

  if (currentDaily >= dailyLimit) {
    return {
      allowed: false,
      reason: 'daily',
      dayKey,
      minuteKey,
      dailyRuns: currentDaily,
      minuteRuns: currentMinute,
      dailyRemaining: 0,
    }
  }
  if (currentMinute >= perMinuteLimit) {
    return {
      allowed: false,
      reason: 'minute',
      dayKey,
      minuteKey,
      dailyRuns: currentDaily,
      minuteRuns: currentMinute,
      dailyRemaining: Math.max(0, dailyLimit - currentDaily),
    }
  }

  const dailyRuns = currentDaily + 1
  return {
    allowed: true,
    dayKey,
    minuteKey,
    dailyRuns,
    minuteRuns: currentMinute + 1,
    dailyRemaining: Math.max(0, dailyLimit - dailyRuns),
  }
}

/** Bound any untrusted text returned by the remote runner before it leaves the function. */
export function limitRunnerOutput(value: unknown, maxChars = CODE_RUNNER_MAX_OUTPUT_CHARS): string {
  const text = typeof value === 'string' ? value : ''
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n… output truncated …`
}
