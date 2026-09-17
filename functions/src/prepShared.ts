// functions/src/prepShared.ts
//
// Pure domain types and pure decision helpers for the PrepInsta-style
// Vriddhi Prep-Content platform (UG/PG Commerce & Management).
// Kept strictly free of SDK dependencies for node:test decision-table testing.

export type PrepStream =
  | 'commerce'
  | 'management'
  | 'aptitude'
  | 'economics'
  | 'finance'
  | 'law'
  | 'strategy'
  | 'operations'
  | 'taxation'
  // Science / arts streams added for the B.Sc, BA and MCA catalogs.
  | 'mathematics'
  | 'statistics'
  | 'science'
  | 'computing'
  | 'communication'

export type PrepDifficulty = 'basic' | 'core' | 'advanced'
export type PrepStatus = 'draft' | 'in_review' | 'published'
export type PrepTier = 'free' | 'premium'

export interface PrepFormula {
  id: string
  label: string
  formula: string
  exampleQ: string
  exampleA: string
}

export interface PrepTrick {
  id: string
  title: string
  trick: string
  whenToUse: string
}

export interface PrepHowToSolve {
  id: string
  step: string
  detail: string
  questionType: string
}

export interface PyqTag {
  university: string
  year: number
  marks: 2 | 5 | 10
  semester?: number
}

export interface PrepTopicContent {
  explanationMd: string
  formulas: PrepFormula[]
  tricks: PrepTrick[]
  howToSolve: PrepHowToSolve[]
  moduleNumber?: number
  moduleName?: string
  subtopics?: string[]
  examFrequency?: 'very_high' | 'high' | 'moderate'
  pyqHighlights?: string[]
}

export interface PrepTopic extends PrepTopicContent {
  id: string
  subjectId: string
  title: string
  order: number
  difficulty: PrepDifficulty
  featuredQuestionIds: string[]
  status: PrepStatus
  generatedBy: 'ai-draft' | 'curator'
  contentVersion: number
  reviewedBy?: string | null
  publishedAt?: string | null
  tier: PrepTier
  updatedAt?: string
}

export interface PrepSubject {
  id: string
  name: string
  stream: PrepStream
  programs: string[] // ['bba', 'bcom', 'mba', ...]
  /** UG vs PG. Absent on legacy (BBA) records — inferred as undergraduate. */
  degreeLevel?: PrepDegreeLevel
  /** PG programs run 4 semesters, so they get their own year grouping. */
  yearGroup?: '1st-year' | '2nd-year' | 'final-year' | 'pg-first-year' | 'pg-second-year'
  semester?: number // UG 1 to 6, PG 1 to 4
  universityRegion?: 'karnataka' | 'national'
  syllabusRef?: string
  icon: string
  order: number
  topicCount: number
  status: PrepStatus
  description?: string
  updatedAt?: string
}

export interface UniversalQuestion {
  id: string
  questionText: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: PrepDifficulty
  status: 'approved' | 'pending' | 'rejected'
  prepTags: {
    subjectId: string
    topicIds: string[]
    stream?: string
    program?: string
  }
  pyqTag?: PyqTag
  tags?: string[]
  createdAt?: string
}

const VALID_STATUSES: PrepStatus[] = ['draft', 'in_review', 'published']

/**
 * Validates the state machine transitions for prep content authoring:
 * Draft → In Review → Published. Also allows curators to send back for
 * review or draft revision.
 */
export function validatePublishTransition(
  currentStatus?: string | null,
  nextStatus?: string | null
): { allowed: boolean; reason?: string } {
  if (!nextStatus || !VALID_STATUSES.includes(nextStatus as PrepStatus)) {
    return {
      allowed: false,
      reason: `Target status "${nextStatus}" is not a valid status (must be one of: ${VALID_STATUSES.join(', ')})`,
    }
  }

  // New document creation defaults to draft or in_review
  if (!currentStatus) {
    return { allowed: true }
  }

  if (!VALID_STATUSES.includes(currentStatus as PrepStatus)) {
    return {
      allowed: false,
      reason: `Current status "${currentStatus}" is invalid.`,
    }
  }

  // Idempotent
  if (currentStatus === nextStatus) {
    return { allowed: true }
  }

  // Draft can go to in_review or published (superadmin direct publish)
  if (currentStatus === 'draft') {
    return { allowed: true }
  }

  // In review can go to published or back to draft for rewrite
  if (currentStatus === 'in_review') {
    return { allowed: true }
  }

  // Published can be un-published back to in_review or draft for major updates
  if (currentStatus === 'published') {
    return { allowed: true }
  }

  return { allowed: false, reason: `Transition from ${currentStatus} to ${nextStatus} is not permitted.` }
}

/**
 * Parses and validates structured AI or curator output into the 4 mandatory sections:
 * 1. explanationMd (Markdown content)
 * 2. formulas (Formula cards with example Q&A)
 * 3. tricks (Shortcuts, mnemonics & exam tricks)
 * 4. howToSolve (Step-by-step problem-solving framework)
 */
export function parsePrepDraft(raw: unknown): {
  valid: boolean
  data?: PrepTopicContent
  errors: string[]
} {
  const errors: string[] = []

  let parsed: any = raw
  if (typeof raw === 'string') {
    let cleaned = raw.trim()
    // Strip markdown code fences if LLM wrapped JSON in ```json ... ```
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch (e) {
      return {
        valid: false,
        errors: [`Invalid JSON output from generator: ${(e as Error).message}`],
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Generator output must be a JSON object.'] }
  }

  // 1. explanationMd
  const rawExplanation = parsed.explanationMd ?? parsed.explanation ?? parsed.contentMd
  let explanationMd = ''
  if (typeof rawExplanation === 'string' && rawExplanation.trim().length >= 30) {
    explanationMd = rawExplanation.trim()
  } else {
    errors.push('explanationMd must be a non-empty Markdown string (at least 30 characters).')
  }

  // 2. formulas
  const rawFormulas = Array.isArray(parsed.formulas) ? parsed.formulas : []
  const formulas: PrepFormula[] = rawFormulas.map((f: any, idx: number) => ({
    id: String(f?.id || `formula-${idx + 1}`),
    label: String(f?.label || f?.title || `Formula ${idx + 1}`).trim(),
    formula: String(f?.formula || f?.equation || '').trim(),
    exampleQ: String(f?.exampleQ || f?.exampleQuestion || f?.example || '').trim(),
    exampleA: String(f?.exampleA || f?.exampleAnswer || f?.solution || '').trim(),
  }))

  // 3. tricks
  const rawTricks = Array.isArray(parsed.tricks) ? parsed.tricks : []
  const tricks: PrepTrick[] = rawTricks.map((t: any, idx: number) => ({
    id: String(t?.id || `trick-${idx + 1}`),
    title: String(t?.title || t?.label || `Shortcut / Exam Tip ${idx + 1}`).trim(),
    trick: String(t?.trick || t?.description || t?.tip || '').trim(),
    whenToUse: String(t?.whenToUse || t?.context || 'Examination problem solving').trim(),
  }))

  // 4. howToSolve
  const rawHowToSolve = Array.isArray(parsed.howToSolve) ? parsed.howToSolve : []
  const howToSolve: PrepHowToSolve[] = rawHowToSolve.map((h: any, idx: number) => ({
    id: String(h?.id || `step-${idx + 1}`),
    step: String(h?.step || h?.title || `Step ${idx + 1}`).trim(),
    detail: String(h?.detail || h?.explanation || h?.description || '').trim(),
    questionType: String(h?.questionType || h?.category || 'Standard Examination Problem').trim(),
  }))

  // Optional module & subtopics metadata
  const moduleNumber = Number(parsed.moduleNumber) || undefined
  const moduleName = typeof parsed.moduleName === 'string' && parsed.moduleName.trim() ? parsed.moduleName.trim() : undefined
  const rawSubtopics = Array.isArray(parsed.subtopics) ? parsed.subtopics : []
  const subtopics = rawSubtopics
    .map((s: any) => (typeof s === 'string' ? s.trim() : String(s || '').trim()))
    .filter(Boolean)

  const examFrequency = ['very_high', 'high', 'moderate'].includes(parsed.examFrequency)
    ? parsed.examFrequency
    : undefined
  const rawPyq = Array.isArray(parsed.pyqHighlights) ? parsed.pyqHighlights : []
  const pyqHighlights = rawPyq
    .map((p: any) => (typeof p === 'string' ? p.trim() : String(p || '').trim()))
    .filter(Boolean)

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    data: {
      explanationMd,
      formulas,
      tricks,
      howToSolve,
      ...(moduleNumber ? { moduleNumber } : {}),
      ...(moduleName ? { moduleName } : {}),
      ...(subtopics.length > 0 ? { subtopics } : {}),
      ...(examFrequency ? { examFrequency } : {}),
      ...(pyqHighlights.length > 0 ? { pyqHighlights } : {}),
    },
    errors: [],
  }
}

/**
 * Samples practice questions without replacement up to `count` (clamped between 1 and 30).
 * If pool size <= requested count, returns a randomly shuffled copy of the whole pool.
 * If pool is empty, returns empty array without throwing.
 */
export function samplePracticeQuestions<T>(
  questions: T[],
  requestedCount: number,
  rng: () => number = Math.random
): T[] {
  if (!Array.isArray(questions) || questions.length === 0) {
    return []
  }

  const desired = Number.isFinite(requestedCount) && requestedCount > 0
    ? Math.min(Math.max(1, Math.floor(requestedCount)), 30)
    : 10

  const targetCount = Math.min(desired, questions.length)

  // Fisher-Yates partial shuffle
  const copy = [...questions]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }

  return copy.slice(0, targetCount)
}

/**
 * Builds the academic AI system prompt for generating comprehensive BBA/Commerce
 * Prep topic content.
 */
export function buildPrepAiPrompt(opts: {
  subjectName: string
  topicTitle: string
  stream?: string
  difficulty?: string
  program?: string
  moduleName?: string
  semester?: number
  universityRegion?: 'karnataka' | 'national'
}): string {
  const {
    subjectName,
    topicTitle,
    stream = 'management',
    difficulty = 'core',
    program = 'bba',
    moduleName,
    semester,
    universityRegion = 'karnataka',
  } = opts

  const regionContext =
    universityRegion === 'karnataka'
      ? 'Karnataka State Higher Education Council (KSHEC NEP 2020 CBCS model, Bangalore University BU/BCU/BNU, Mysore University UOM, VTU, Mangalore University)'
      : 'UGC National Curriculum Framework (NEP 2020)'

  return `You are an expert university professor and lead curriculum author for undergraduate & postgraduate commerce and management (${program.toUpperCase()} under ${regionContext}).

Generate a complete, high-yield, structured Study Guide for:
Subject: "${subjectName}" ${semester ? `(Semester ${semester})` : ''}
${moduleName ? `Module: "${moduleName}"` : ''}
Topic: "${topicTitle}"
Academic Stream: "${stream}"
Difficulty Level: "${difficulty}"

You MUST output ONLY a valid JSON object matching this schema with NO markdown code fences and NO conversational filler:
{
  "subtopics": [
    "Granular subtopic 1 covering fundamental definition and scope",
    "Granular subtopic 2 covering core analytical framework or mechanism",
    "Granular subtopic 3 covering practical corporate application",
    "Granular subtopic 4 covering examination pitfalls and model answers"
  ],
  "explanationMd": "# Comprehensive Markdown Explanation\\n\\n### Core Concept & Intuition\\nExplain the concept clearly with high academic rigour, accompanied by an intuitive modern business case analogy (e.g. Tata, Reliance, Infosys, Zomato, Apple).\\n\\n### Key Principles & Frameworks\\nBreak down the essential principles, rules, or components systematically using bullet points, comparison tables, or clear headings.\\n\\n### Real-World Business Application\\nHow corporate leaders, accountants, financial analysts, or operations managers apply this in practice in India.\\n\\n### Examination Focus & Model Structure\\nKey points university examiners award full marks for in 5-mark and 10-mark questions.",
  "formulas": [
    {
      "id": "formula-1",
      "label": "Formula / Governing Equation / Journal Entry Rule",
      "formula": "Standard mathematical equation or accounting rule (e.g. P/V Ratio = (Contribution / Sales) * 100)",
      "exampleQ": "A clear, realistic numerical or practical question",
      "exampleA": "Step-by-step solution showing working and final answer"
    }
  ],
  "tricks": [
    {
      "id": "trick-1",
      "title": "Mnemonic or Quick-Recall Shortcut",
      "trick": "The exact mnemonic, shortcut method, or mental model to recall or compute this quickly without errors",
      "whenToUse": "When to apply this in exams or case study analysis"
    }
  ],
  "howToSolve": [
    {
      "id": "step-1",
      "step": "Step 1: Identify Given Data & Key Constraints",
      "detail": "Detailed explanation of what to extract first from the question scenario",
      "questionType": "Numerical calculation / 10-Mark Analytical Question"
    },
    {
      "id": "step-2",
      "step": "Step 2: Apply Governing Rule or Formula",
      "detail": "How to execute the computation or structure the analytical argument",
      "questionType": "Numerical calculation / 10-Mark Analytical Question"
    },
    {
      "id": "step-3",
      "step": "Step 3: Verification & Concluding Interpretation",
      "detail": "Final check and required managerial interpretation",
      "questionType": "Numerical calculation / 10-Mark Analytical Question"
    }
  ]
}

Note: For theoretical subjects (like Business Law or Principles of Management), in "formulas" you can provide legal maxims, journal entry rules, or core analytical equations.`
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-program catalog layer (UG + PG, Karnataka NEP 2020 / CBCS)
//
// Everything below is pure data + pure functions so the seeding controller and
// the node:test integrity suite share one source of truth.
// ─────────────────────────────────────────────────────────────────────────────

export type PrepDegreeLevel = 'undergraduate' | 'postgraduate'

export interface PrepProgramInfo {
  /** Lowercase canonical program code used in PrepSubject.programs / seed APIs. */
  code: string
  /** Human label shown in the Prep App program selector. */
  label: string
  degreeLevel: PrepDegreeLevel
  /** Full degree name, used for the AI authoring prompt context. */
  fullName: string
}

/**
 * Canonical program catalog for the Vriddhi Prep platform.
 * UG: BBA, B.Com, BCA, B.Sc, BA  |  PG: MBA, M.Com, MCA
 */
export const PREP_PROGRAM_CATALOG: PrepProgramInfo[] = [
  { code: 'bba', label: 'BBA', degreeLevel: 'undergraduate', fullName: 'Bachelor of Business Administration' },
  { code: 'bcom', label: 'B.Com', degreeLevel: 'undergraduate', fullName: 'Bachelor of Commerce' },
  { code: 'bca', label: 'BCA', degreeLevel: 'undergraduate', fullName: 'Bachelor of Computer Applications' },
  { code: 'bsc', label: 'B.Sc', degreeLevel: 'undergraduate', fullName: 'Bachelor of Science' },
  { code: 'ba', label: 'BA', degreeLevel: 'undergraduate', fullName: 'Bachelor of Arts' },
  { code: 'mba', label: 'MBA', degreeLevel: 'postgraduate', fullName: 'Master of Business Administration' },
  { code: 'mcom', label: 'M.Com', degreeLevel: 'postgraduate', fullName: 'Master of Commerce' },
  { code: 'mca', label: 'MCA', degreeLevel: 'postgraduate', fullName: 'Master of Computer Applications' },
]

/** Lowercase program codes, e.g. ['bba', 'bcom', ...]. */
export const PREP_PROGRAM_CODES: string[] = PREP_PROGRAM_CATALOG.map((p) => p.code)

export function getPrepProgramInfo(code?: string | null): PrepProgramInfo | null {
  if (!code) return null
  const norm = code.toLowerCase().trim()
  return PREP_PROGRAM_CATALOG.find((p) => p.code === norm) || null
}

export function getPrepProgramsForLevel(level?: PrepDegreeLevel | string | null): PrepProgramInfo[] {
  if (!level || level === 'all') return [...PREP_PROGRAM_CATALOG]
  const norm = String(level).toLowerCase().trim()
  return PREP_PROGRAM_CATALOG.filter((p) => p.degreeLevel === norm)
}

export function resolveProgramDegreeLevel(code?: string | null): PrepDegreeLevel | null {
  return getPrepProgramInfo(code)?.degreeLevel ?? null
}


/**
 * Normalises a subject's effective degree level. Subjects authored before the
 * multi-program layer (BBA) omit the field and are treated as undergraduate.
 */
export function effectiveDegreeLevel(subject?: {
  degreeLevel?: PrepDegreeLevel | string | null
  programs?: string[] | null
} | null): PrepDegreeLevel {
  if (!subject) return 'undergraduate'
  if (subject.degreeLevel === 'postgraduate' || subject.degreeLevel === 'undergraduate') {
    return subject.degreeLevel
  }
  // Infer from the program catalog when the field is absent.
  const inferred = (subject.programs || [])
    .map((p) => resolveProgramDegreeLevel(p))
    .find((lvl): lvl is PrepDegreeLevel => lvl === 'postgraduate')
  return inferred ?? 'undergraduate'
}

/**
 * Splits an array into chunks no larger than `size`. Used to keep every
 * Firestore batch under the 500-writes-per-commit hard limit.
 */
export function chunkArray<T>(items: T[], size: number): T[][] {
  if (!Array.isArray(items) || items.length === 0) return []
  const width = Number.isFinite(size) && size > 0 ? Math.floor(size) : 1
  const out: T[][] = []
  for (let i = 0; i < items.length; i += width) {
    out.push(items.slice(i, i + width))
  }
  return out
}

/**
 * Resolves which programs a `/prep/seed-all` request should seed.
 * Accepts: nothing (=> all), 'all', a CSV string, or an array of codes.
 * Unknown codes are reported as errors rather than silently dropped.
 */
export function resolveSeedPrograms(
  input?: unknown
): { programs: string[]; all: boolean; errors: string[] } {
  const errors: string[] = []

  if (input === undefined || input === null || input === '') {
    return { programs: [...PREP_PROGRAM_CODES], all: true, errors }
  }

  let rawList: unknown[] = []
  if (Array.isArray(input)) {
    rawList = input
  } else if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed || trimmed.toLowerCase() === 'all') {
      return { programs: [...PREP_PROGRAM_CODES], all: true, errors }
    }
    rawList = trimmed.split(',')
  } else {
    return {
      programs: [],
      all: false,
      errors: ['programs must be a program code, a comma-separated list, or an array of codes.'],
    }
  }

  const resolved: string[] = []
  for (const entry of rawList) {
    const code = String(entry ?? '').toLowerCase().trim()
    if (!code) continue
    if (code === 'all') {
      return { programs: [...PREP_PROGRAM_CODES], all: true, errors }
    }
    if (!PREP_PROGRAM_CODES.includes(code)) {
      errors.push(`Unknown program "${String(entry)}". Valid codes: ${PREP_PROGRAM_CODES.join(', ')}.`)
      continue
    }
    if (!resolved.includes(code)) resolved.push(code)
  }

  if (errors.length > 0 && resolved.length === 0) {
    return { programs: [], all: false, errors }
  }
  return { programs: resolved, all: false, errors }
}

/**
 * Filters a catalog's subjects down to the ones actually belonging to the
 * requested programs, plus the topics/questions that hang off them. Used by
 * the seed controller so `?programs=mcom` never touches the BBA catalog.
 */
export function filterCatalogByPrograms<T extends { programs?: string[] | null }>(
  subjects: T[],
  programs: string[]
): T[] {
  if (!Array.isArray(subjects)) return []
  if (!Array.isArray(programs) || programs.length === 0) return [...subjects]
  const wanted = programs.map((p) => p.toLowerCase().trim())
  return subjects.filter((s) =>
    (s.programs || []).some((p) => wanted.includes(String(p).toLowerCase().trim()))
  )
}

export interface PrepCatalogBundle {
  programCode: string
  subjects: PrepSubject[]
  topics: Record<string, PrepTopic[]>
  questions: UniversalQuestion[]
}

export interface CatalogIssue {
  level: 'error' | 'warning'
  code: string
  message: string
}

export interface CatalogIntegrityReport {
  programCode: string
  subjectCount: number
  topicCount: number
  questionCount: number
  issues: CatalogIssue[]
  errorCount: number
  warningCount: number
  valid: boolean
}

/**
 * Verifies referential integrity of a seeded curriculum bundle:
 *  - unique subject / topic / question ids
 *  - subject.topicCount matches the number of topics actually authored
 *  - every topic.subjectId matches the record it is filed under
 *  - every topic carries the 4 mandatory PrepInsta sections
 *  - every featuredQuestionId points at a real question
 *  - every question's prepTags.subjectId / topicIds resolve inside the bundle
 *  - MCQ options are well-formed and correctIndex is in range
 */
export function validatePrepCatalog(bundle: PrepCatalogBundle): CatalogIntegrityReport {
  const issues: CatalogIssue[] = []
  const err = (code: string, message: string) => issues.push({ level: 'error', code, message })
  const warn = (code: string, message: string) => issues.push({ level: 'warning', code, message })

  const subjects = Array.isArray(bundle?.subjects) ? bundle.subjects : []
  const topicsBySubject = bundle?.topics && typeof bundle.topics === 'object' ? bundle.topics : {}
  const questions = Array.isArray(bundle?.questions) ? bundle.questions : []

  // ── Subjects ──
  const subjectIds = new Set<string>()
  for (const subject of subjects) {
    if (!subject?.id) {
      err('SUBJECT_MISSING_ID', 'A subject is missing its id.')
      continue
    }
    if (subjectIds.has(subject.id)) {
      err('DUPLICATE_SUBJECT_ID', `Duplicate subject id "${subject.id}".`)
    }
    subjectIds.add(subject.id)

    if (!subject.name?.trim()) {
      err('SUBJECT_MISSING_NAME', `Subject "${subject.id}" has no name.`)
    }
    if (!Array.isArray(subject.programs) || subject.programs.length === 0) {
      err('SUBJECT_NO_PROGRAMS', `Subject "${subject.id}" declares no programs.`)
    }
    if (typeof subject.order !== 'number') {
      err('SUBJECT_BAD_ORDER', `Subject "${subject.id}" has a non-numeric order.`)
    }

    const authored = topicsBySubject[subject.id]
    if (!Array.isArray(authored) || authored.length === 0) {
      err('SUBJECT_NO_TOPICS', `Subject "${subject.id}" has no topics authored.`)
      continue
    }
    if (subject.topicCount !== authored.length) {
      err(
        'TOPIC_COUNT_MISMATCH',
        `Subject "${subject.id}" declares topicCount ${subject.topicCount} but ${authored.length} topics are authored.`
      )
    }
  }

  // Orphan topic buckets (keyed under a subject id that was never declared).
  for (const key of Object.keys(topicsBySubject)) {
    if (!subjectIds.has(key)) {
      err('ORPHAN_TOPIC_BUCKET', `Topics are filed under unknown subject id "${key}".`)
    }
  }

  // ── Topics ──
  const topicIds = new Set<string>()
  let topicCount = 0
  for (const [subjectId, list] of Object.entries(topicsBySubject)) {
    for (const topic of list || []) {
      topicCount++
      if (!topic?.id) {
        err('TOPIC_MISSING_ID', `A topic under subject "${subjectId}" is missing its id.`)
        continue
      }
      if (topicIds.has(topic.id)) {
        err('DUPLICATE_TOPIC_ID', `Duplicate topic id "${topic.id}".`)
      }
      topicIds.add(topic.id)

      if (topic.subjectId !== subjectId) {
        err(
          'TOPIC_SUBJECT_MISMATCH',
          `Topic "${topic.id}" declares subjectId "${topic.subjectId}" but is filed under "${subjectId}".`
        )
      }
      if (!topic.title?.trim()) {
        err('TOPIC_MISSING_TITLE', `Topic "${topic.id}" has no title.`)
      }
      if (typeof topic.explanationMd !== 'string' || topic.explanationMd.trim().length < 30) {
        err('TOPIC_SHORT_EXPLANATION', `Topic "${topic.id}" explanationMd is missing or under 30 characters.`)
      }
      if (!Array.isArray(topic.formulas) || topic.formulas.length === 0) {
        err('TOPIC_NO_FORMULAS', `Topic "${topic.id}" has no formulas section.`)
      }
      if (!Array.isArray(topic.tricks) || topic.tricks.length === 0) {
        err('TOPIC_NO_TRICKS', `Topic "${topic.id}" has no tricks section.`)
      }
      if (!Array.isArray(topic.howToSolve) || topic.howToSolve.length === 0) {
        err('TOPIC_NO_HOW_TO_SOLVE', `Topic "${topic.id}" has no howToSolve section.`)
      }
      if (!Array.isArray(topic.featuredQuestionIds) || topic.featuredQuestionIds.length === 0) {
        warn('TOPIC_NO_FEATURED_QUESTIONS', `Topic "${topic.id}" features no practice questions.`)
      }
    }
  }

  // ── Questions ──
  const questionIds = new Set<string>()
  for (const q of questions) {
    if (!q?.id) {
      err('QUESTION_MISSING_ID', 'A question is missing its id.')
      continue
    }
    if (questionIds.has(q.id)) {
      err('DUPLICATE_QUESTION_ID', `Duplicate question id "${q.id}".`)
    }
    questionIds.add(q.id)

    if (!q.questionText?.trim()) {
      err('QUESTION_NO_TEXT', `Question "${q.id}" has no questionText.`)
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      err('QUESTION_BAD_OPTIONS', `Question "${q.id}" needs at least 2 options.`)
    } else if (
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    ) {
      err(
        'QUESTION_BAD_CORRECT_INDEX',
        `Question "${q.id}" correctIndex ${q.correctIndex} is out of range for ${q.options.length} options.`
      )
    }
    if (!q.explanation?.trim()) {
      err('QUESTION_NO_EXPLANATION', `Question "${q.id}" has no explanation.`)
    }

    const tags = q.prepTags || ({} as UniversalQuestion['prepTags'])
    if (tags.subjectId && !subjectIds.has(tags.subjectId)) {
      err(
        'QUESTION_UNKNOWN_SUBJECT',
        `Question "${q.id}" is tagged with unknown subjectId "${tags.subjectId}".`
      )
    }
    for (const topicId of tags.topicIds || []) {
      if (!topicIds.has(topicId)) {
        err('QUESTION_UNKNOWN_TOPIC', `Question "${q.id}" is tagged with unknown topicId "${topicId}".`)
      }
    }
  }

  // ── Featured question references ──
  for (const [, list] of Object.entries(topicsBySubject)) {
    for (const topic of list || []) {
      for (const qid of topic?.featuredQuestionIds || []) {
        if (!questionIds.has(qid)) {
          err(
            'FEATURED_QUESTION_MISSING',
            `Topic "${topic.id}" features unknown question id "${qid}".`
          )
        }
      }
    }
  }

  const errorCount = issues.filter((i) => i.level === 'error').length
  return {
    programCode: bundle?.programCode || 'unknown',
    subjectCount: subjects.length,
    topicCount,
    questionCount: questions.length,
    issues,
    errorCount,
    warningCount: issues.length - errorCount,
    valid: errorCount === 0,
  }
}
