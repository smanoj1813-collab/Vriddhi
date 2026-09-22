// src/modules/student/utils/resultOutcome.ts
//
// Turns a graded answer sheet into the numbers the student reads.
//
// The server labels auto-graded answers `correct` / `incorrect`, but a
// descriptive answer a faculty member marked is stored as `manual_graded` with
// only a number of marks. Counting by label alone therefore reported
// "0/8 correct · 0/8 incorrect · 0/8 unattempted" for a paper that clearly
// scored 15/20 — the "performance summary" was all zeros while the score card
// and section marks were right. Marks are the source of truth, so:
//
//   • full marks awarded            → correct
//   • some but not all marks        → partial
//   • attempted, awarded nothing    → incorrect
//   • nothing written               → unattempted
//   • no marks recorded yet         → pending (faculty still marking)
//
// The same helpers re-derive the per-section table, so the section analysis
// can never disagree with the overview above it.

export type QuestionOutcomeStatus = 'correct' | 'partial' | 'incorrect' | 'unattempted' | 'pending_manual'

const MARKS_EPSILON = 0.005

/** The subset of a question result these helpers need (API returns more). */
export interface ResultQuestionLike {
  questionId?: string
  sectionName?: string
  marks: number
  marksObtained?: number | null
  status?: string
  isAttempted?: boolean
  isCorrect?: boolean
  studentAnswer?: string
}

export interface OutcomeCounts {
  correct: number
  partial: number
  incorrect: number
  unattempted: number
  pending: number
  answered: number
  /** Marks carried by the fully-correct answers. */
  correctMarks: number
  /** Marks earned by partial answers. */
  partialMarks: number
  /** Marks lost to negative marking on wrong answers (zero or negative). */
  incorrectMarks: number
  /** Every mark awarded (auto + manual). */
  awardedMarks: number
  totalMarks: number
}

export interface SectionSummary {
  sectionName: string
  total: number
  correct: number
  partial: number
  incorrect: number
  unattempted: number
  pending: number
  score: number
  totalMarks: number
  correctMarks: number
  percentage: number
}

export interface ResultPerformance extends OutcomeCounts {
  totalQuestions: number
  /** True when the numbers were re-derived from the question list. */
  derivedFromQuestions: boolean
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function wasAnswered(question: ResultQuestionLike): boolean {
  if (typeof question.isAttempted === 'boolean') return question.isAttempted
  return Boolean(question.studentAnswer && String(question.studentAnswer).trim())
}

/** One question's outcome, from whichever fields the server filled in. */
export function resolveQuestionOutcomeStatus(question: ResultQuestionLike): QuestionOutcomeStatus {
  const marks = Math.max(0, Number(question.marks) || 0)
  const awarded = finiteOrNull(question.marksObtained)
  const rawStatus = String(question.status || '')
  const attempted = wasAnswered(question)

  if (!attempted) return 'unattempted'
  if (rawStatus === 'pending_manual' || rawStatus === 'pending') return 'pending_manual'
  if (awarded === null) {
    // An ungraded attempt (or a legacy row with no breakdown): the honest
    // answer is "waiting", never "wrong".
    return rawStatus === 'correct' ? 'correct' : 'pending_manual'
  }
  if (awarded >= marks - MARKS_EPSILON) return 'correct'
  if (awarded > 0) return 'partial'
  if (rawStatus === 'correct') return 'correct'
  return 'incorrect'
}

/** Count every question into one of the five buckets, with the marks each carried. */
export function summarizeQuestionOutcomes(questions: ResultQuestionLike[]): OutcomeCounts {
  const counts: OutcomeCounts = {
    correct: 0,
    partial: 0,
    incorrect: 0,
    unattempted: 0,
    pending: 0,
    answered: 0,
    correctMarks: 0,
    partialMarks: 0,
    incorrectMarks: 0,
    awardedMarks: 0,
    totalMarks: 0,
  }

  for (const question of questions) {
    const marks = Math.max(0, Number(question.marks) || 0)
    const awarded = finiteOrNull(question.marksObtained)
    const status = resolveQuestionOutcomeStatus(question)
    counts.totalMarks += marks
    if (status !== 'unattempted') counts.answered += 1
    if (awarded !== null) counts.awardedMarks += awarded

    switch (status) {
      case 'correct':
        counts.correct += 1
        counts.correctMarks += marks
        break
      case 'partial':
        counts.partial += 1
        counts.partialMarks += awarded ?? 0
        break
      case 'incorrect':
        counts.incorrect += 1
        counts.incorrectMarks += awarded ?? 0
        break
      case 'unattempted':
        counts.unattempted += 1
        break
      default:
        counts.pending += 1
        break
    }
  }

  return counts
}

const round2 = (value: number) => Math.round(value * 100) / 100

/** Per-section rollup of the same question list, in first-seen order. */
export function summarizeSections(questions: ResultQuestionLike[]): SectionSummary[] {
  const sections = new Map<string, SectionSummary>()
  for (const question of questions) {
    const sectionName = question.sectionName || 'General'
    const section = sections.get(sectionName) || {
      sectionName,
      total: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
      unattempted: 0,
      pending: 0,
      score: 0,
      totalMarks: 0,
      correctMarks: 0,
      percentage: 0,
    }
    const marks = Math.max(0, Number(question.marks) || 0)
    const awarded = finiteOrNull(question.marksObtained)
    const status = resolveQuestionOutcomeStatus(question)
    section.total += 1
    section.totalMarks += marks
    if (awarded !== null) section.score += awarded
    if (status === 'correct') {
      section.correct += 1
      section.correctMarks += marks
    } else if (status === 'partial') section.partial += 1
    else if (status === 'incorrect') section.incorrect += 1
    else if (status === 'unattempted') section.unattempted += 1
    else section.pending += 1
    sections.set(sectionName, section)
  }

  return [...sections.values()].map((section) => ({
    ...section,
    score: round2(section.score),
    totalMarks: round2(section.totalMarks),
    correctMarks: round2(section.correctMarks),
    percentage: section.totalMarks > 0 ? Math.round((section.score / section.totalMarks) * 100) : 0,
  }))
}

interface ResultLike {
  questionResults?: ResultQuestionLike[]
  correctCount?: number
  partialCount?: number
  incorrectCount?: number
  unattemptedCount?: number
  pendingCount?: number
  answeredCount?: number
  correctMarks?: number
  awardedMarks?: number
  totalQuestions?: number
  totalMarks?: number
  sectionScores?: Array<{
    sectionName: string
    total?: number
    correct?: number
    partial?: number
    incorrect?: number
    unattempted?: number
    score?: number
    totalMarks?: number
    correctMarks?: number
    percentage?: number
  }>
}

const numberOf = (value: unknown): number => (Number.isFinite(Number(value)) ? Number(value) : 0)

/**
 * The performance summary the result page renders. Derived from the questions
 * whenever they are present (that is what makes "5/5 correct · 5/5 marks" and
 * the section table agree); the server totals are only used when a response
 * carries no per-question detail at all.
 */
export function resolveResultPerformance(result: ResultLike): ResultPerformance {
  const questions = Array.isArray(result.questionResults) ? result.questionResults : []
  if (questions.length > 0) {
    const counts = summarizeQuestionOutcomes(questions)
    return {
      ...counts,
      totalQuestions: questions.length,
      derivedFromQuestions: true,
    }
  }

  const correct = numberOf(result.correctCount)
  const partial = numberOf(result.partialCount)
  const incorrect = numberOf(result.incorrectCount)
  const unattempted = numberOf(result.unattemptedCount)
  const pending = numberOf(result.pendingCount)
  return {
    correct,
    partial,
    incorrect,
    unattempted,
    pending,
    answered: numberOf(result.answeredCount) || correct + partial + incorrect,
    correctMarks: numberOf(result.correctMarks),
    partialMarks: Math.max(0, numberOf(result.awardedMarks) - numberOf(result.correctMarks)),
    incorrectMarks: Math.min(0, numberOf(result.awardedMarks) - numberOf(result.correctMarks)),
    awardedMarks: numberOf(result.awardedMarks),
    totalMarks: numberOf(result.totalMarks),
    totalQuestions: numberOf(result.totalQuestions) || correct + partial + incorrect + unattempted + pending,
    derivedFromQuestions: false,
  }
}

/** Section table rows, derived from the questions when they are available. */
export function resolveSectionSummaries(result: ResultLike): SectionSummary[] {
  const questions = Array.isArray(result.questionResults) ? result.questionResults : []
  if (questions.length > 0) return summarizeSections(questions)

  return (result.sectionScores || []).map((section) => {
    const score = numberOf(section.score)
    const totalMarks = numberOf(section.totalMarks)
    return {
      sectionName: section.sectionName,
      total: numberOf(section.total),
      correct: numberOf(section.correct),
      partial: numberOf(section.partial),
      incorrect: numberOf(section.incorrect),
      unattempted: numberOf(section.unattempted),
      pending: 0,
      score,
      totalMarks,
      correctMarks: numberOf(section.correctMarks),
      percentage: numberOf(section.percentage) || (totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0),
    }
  })
}

/** Human label for a question's outcome, shared by the review palette. */
export function outcomeLabel(status: QuestionOutcomeStatus): string {
  switch (status) {
    case 'correct':
      return 'Correct'
    case 'partial':
      return 'Partially correct'
    case 'incorrect':
      return 'Incorrect'
    case 'pending_manual':
      return 'Awaiting review'
    default:
      return 'Unattempted'
  }
}

export function outcomeColor(status: QuestionOutcomeStatus): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'correct':
      return 'success'
    case 'partial':
    case 'pending_manual':
      return 'warning'
    case 'incorrect':
      return 'error'
    default:
      return 'default'
  }
}
