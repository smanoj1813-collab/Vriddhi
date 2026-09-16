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

export interface PrepTopicContent {
  explanationMd: string
  formulas: PrepFormula[]
  tricks: PrepTrick[]
  howToSolve: PrepHowToSolve[]
  moduleNumber?: number
  moduleName?: string
  subtopics?: string[]
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
  yearGroup?: '1st-year' | '2nd-year' | 'final-year'
  semester?: number // 1 to 6
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
