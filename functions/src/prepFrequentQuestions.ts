// functions/src/prepFrequentQuestions.ts
//
// Item 3.3 of docs/HANDOFF_OPTIMISATION_2026-09-25.md — "Most repeated
// questions". Zero AI, zero new storage: the 846 questions already in
// `functions/src/data/prepPapers/*` are grouped by near-duplicate text and the
// years each one appeared are counted.
//
// Why this file is pure: the grouping rule decides what a student is told is
// "the question that keeps coming", so it is unit-tested on hand-made cases
// (functions/test/prepFrequentQuestions.test.ts) and the HTTP layer only maps
// its output to JSON.
//
// Design notes:
//   * English and Kannada share one pipeline. The Kannada caveat from the review
//     (§5.4 item 8 / the matra note) is handled by treating combining marks as
//     part of the word: `\p{M}` is kept, and the comparison is on the token SET,
//     so agglutinated endings do not defeat the match the way a stemmer-less
//     prefix compare would.
//   * Near-duplicates are found with Jaccard similarity over token sets plus an
//     ordered-prefix bonus (exam questions are often the same stem with a
//     different tail: "…with examples" / "…with suitable illustration").
//   * Marks must agree when both are present, otherwise "explain X (2 marks)"
//     and "explain X (10 marks)" would merge into one entry with a misleading
//     weight.

export interface FrequentQuestionInput {
  /** Paper id — used for the `papers` list without loading the whole paper. */
  paperId: string
  /** 'January 2024' / 'February/March 2024' as printed. */
  examLabel: string
  examYear: number
  subjectName: string
  program: string
  semester: number
  universityCode: string
  label: string
  text: string
  /** Marks for the question (section default applied by the caller). */
  marks?: number
}

export interface FrequentQuestionGroup {
  /** The most readable representative wording (longest, so truncations lose). */
  question: string
  /** Normalised key — stable across calls, useful for caching/deep links. */
  key: string
  subjectName: string
  program: string
  marks: number | null
  count: number
  /** Distinct exam years, newest first. */
  years: number[]
  /** Distinct exam labels, newest first — what the UI shows as badges. */
  examLabels: string[]
  /** Papers this wording appeared in (capped). */
  paperIds: string[]
  /** Below the merge threshold, kept only as a single-occurrence entry. */
  variants: string[]
}

export interface FrequentQuestionsOptions {
  /** Minimum repeated appearances to be included. Default 2. */
  minCount?: number
  /** Jaccard threshold for "the same question". Default 0.6 (the plan's value). */
  threshold?: number
  /** Max groups returned per subject. Default 25. */
  limit?: number
}

export const DEFAULT_MERGE_THRESHOLD = 0.6
export const DEFAULT_MIN_COUNT = 2
export const DEFAULT_GROUP_LIMIT = 25
/** Words too common to carry meaning in an exam question. */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'from', 'as', 'at',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its', 'this', 'that', 'these', 'those',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'do', 'does', 'did',
  'explain', 'describe', 'discuss', 'state', 'define', 'write', 'short', 'note', 'notes', 'answer',
  'any', 'all', 'each', 'also', 'give', 'mention', 'briefly', 'following', 'question', 'questions',
])

/**
 * Splits text into comparable tokens.
 *
 * `\p{L}\p{M}` keeps Kannada matras attached to their consonant, which is what
 * makes two spellings of the same Kannada word compare equal; digits are dropped
 * because question numbering and year references are not part of the wording.
 */
export function tokenizeQuestion(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

/** Stable grouping key for a question's wording. */
export function questionKey(text: string): string {
  return tokenizeQuestion(text).sort().join(' ')
}

/** Jaccard similarity of two token sets (0 = unrelated, 1 = identical). */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1
  const union = setA.size + setB.size - shared
  return union === 0 ? 0 : shared / union
}

/** How many of the first three tokens match in order (same stem, different tail). */
export function prefixAgreement(a: string[], b: string[]): number {
  const depth = Math.min(3, a.length, b.length)
  let agreed = 0
  for (let index = 0; index < depth; index += 1) {
    if (a[index] !== b[index]) break
    agreed += 1
  }
  return agreed
}

/** Two questions are the same when either rule fires and the marks agree. */
export function isSameQuestion(
  left: { tokens: string[]; marks?: number | null },
  right: { tokens: string[]; marks?: number | null },
  threshold: number = DEFAULT_MERGE_THRESHOLD,
): boolean {
  if (
    left.marks !== undefined && left.marks !== null &&
    right.marks !== undefined && right.marks !== null &&
    left.marks !== right.marks
  ) {
    return false
  }
  const similarity = jaccardSimilarity(left.tokens, right.tokens)
  if (similarity >= threshold) return true

  // Tie-breakers for the tail-only differences a token ratio cannot see
  // ("…with examples" / "…with suitable illustration"). They apply AT OR BELOW
  // the default threshold; asking for a stricter threshold turns them off
  // completely, so the caller always gets what they asked for.
  if (threshold > DEFAULT_MERGE_THRESHOLD) return false
  const agreement = prefixAgreement(left.tokens, right.tokens)
  const shortest = Math.min(left.tokens.length, right.tokens.length)
  if (agreement >= 2 && shortest <= 6 && similarity >= 0.34) return true
  return agreement >= 3 && similarity >= 0.5
}

interface WorkingGroup {
  key: string
  tokens: string[]
  marks: number | null
  subjectName: string
  program: string
  members: FrequentQuestionInput[]
}

/**
 * Groups one subject's questions. Input order is preserved for stable output
 * (groups are ordered by count, then by the first appearance).
 */
export function groupFrequentQuestions(
  questions: FrequentQuestionInput[],
  options: FrequentQuestionsOptions = {},
): FrequentQuestionGroup[] {
  const threshold = options.threshold ?? DEFAULT_MERGE_THRESHOLD
  const minCount = options.minCount ?? DEFAULT_MIN_COUNT
  const limit = options.limit ?? DEFAULT_GROUP_LIMIT

  const groups: WorkingGroup[] = []

  for (const question of questions) {
    const tokens = tokenizeQuestion(question.text)
    if (tokens.length === 0) continue
    const marks = question.marks ?? null
    const match = groups.find(
      (group) =>
        group.subjectName === question.subjectName &&
        isSameQuestion({ tokens: group.tokens, marks: group.marks }, { tokens, marks }, threshold),
    )
    if (match) match.members.push(question)
    else
      groups.push({
        key: questionKey(question.text),
        tokens,
        marks,
        subjectName: question.subjectName,
        program: question.program,
        members: [question],
      })
  }

  return groups
    .filter((group) => group.members.length >= minCount)
    .map((group) => {
      const first = group.members[0]
      const years = Array.from(new Set(group.members.map((member) => member.examYear))).sort((a, b) => b - a)
      // Ordered by year, not alphabetically: "September 2022" must not sort
      // above "February/March 2024" just because 'S' > 'F'.
      const byRecency = [...group.members].sort(
        (a, b) => b.examYear - a.examYear || b.examLabel.localeCompare(a.examLabel),
      )
      const examLabels = Array.from(new Set(byRecency.map((member) => member.examLabel)))
      // Longest wording wins: a truncated variant should never become the title.
      const representative = [...group.members].sort((a, b) => b.text.length - a.text.length)[0]
      const distinct = Array.from(new Set(group.members.map((member) => member.text.trim())))
      return {
        question: representative.text.trim(),
        key: group.key,
        subjectName: first.subjectName,
        program: first.program,
        marks: group.marks,
        count: group.members.length,
        years,
        examLabels,
        paperIds: group.members.map((member) => member.paperId).slice(0, 12),
        // Keep the alternative wordings so the UI can show "asked as …".
        variants: distinct.filter((text) => text !== representative.text.trim()).slice(0, 5),
      }
    })
    .sort((a, b) => b.count - a.count || b.years[0] - a.years[0] || a.question.localeCompare(b.question))
    .slice(0, limit)
}

/** Every question in a paper, with the section default marks applied. */
export function flattenPaperQuestions(
  paper: {
    id: string
    examLabel: string
    examYear: number
    subjectName: string
    program: string
    semester: number
    universityCode: string
    sections: Array<{
      marksEach: number
      questions: Array<{ label: string; text: string; marks?: number; parts?: string[] }>
    }>
  },
): FrequentQuestionInput[] {
  const out: FrequentQuestionInput[] = []
  for (const section of paper.sections || []) {
    for (const question of section.questions || []) {
      // A multi-part question is compared on its stem plus its parts, so
      // "…(a) define (b) illustrate" does not look like a different question.
      const text = [question.text, ...(question.parts || [])].filter(Boolean).join(' ')
      out.push({
        paperId: paper.id,
        examLabel: paper.examLabel,
        examYear: paper.examYear,
        subjectName: paper.subjectName,
        program: paper.program,
        semester: paper.semester,
        universityCode: paper.universityCode,
        label: question.label,
        text,
        marks: question.marks ?? section.marksEach,
      })
    }
  }
  return out
}

/** Groups a whole visible corpus, then keeps only the requested subject. */
export function frequentQuestionsForSubject(
  papers: Array<Parameters<typeof flattenPaperQuestions>[0]>,
  subjectName: string,
  options: FrequentQuestionsOptions = {},
): FrequentQuestionGroup[] {
  const wanted = String(subjectName || '').trim().toLowerCase()
  const questions = papers
    .flatMap((paper) => flattenPaperQuestions(paper))
    .filter((question) => !wanted || question.subjectName.toLowerCase() === wanted)
  return groupFrequentQuestions(questions, options)
}

/** Subject names that actually have repeats — powers the subject picker. */
export function subjectsWithRepeats(
  papers: Array<Parameters<typeof flattenPaperQuestions>[0]>,
  options: FrequentQuestionsOptions = {},
): Array<{ subjectName: string; repeated: number }> {
  const questions = papers.flatMap((paper) => flattenPaperQuestions(paper))
  const bySubject = new Map<string, FrequentQuestionInput[]>()
  for (const question of questions) {
    bySubject.set(question.subjectName, [...(bySubject.get(question.subjectName) || []), question])
  }
  return Array.from(bySubject.entries())
    .map(([subjectName, list]) => ({
      subjectName,
      repeated: groupFrequentQuestions(list, { ...options, limit: Number.MAX_SAFE_INTEGER }).length,
    }))
    .filter((entry) => entry.repeated > 0)
    .sort((a, b) => b.repeated - a.repeated || a.subjectName.localeCompare(b.subjectName))
}
