// functions/src/prepModelAnswers.ts
//
// Items 3.4 and 3.5 of docs/HANDOFF_OPTIMISATION_2026-09-25.md.
//
// "Model answer" and "quick-revision MCQ set" content is generated ONCE per
// question (not once per student), reviewed by a human, and only then shown.
// That ordering is the whole safety story: a student never sees unreviewed AI
// text, and the "AI-generated, reviewed" label on the paper view is true by
// construction.
//
// This file is pure: prompt building, parsing, sanitising and document ids are
// unit-tested (functions/test/prepModelAnswers.test.ts) so the route only
// orchestrates. Both kinds share the same reviewer flow, so they share one
// module — a second copy of the sanitiser is a second place to get it wrong.

export type PrepAnswerStatus = 'draft' | 'published' | 'rejected'

/** Firestore collection for generated model answers. */
export const PREP_PAPER_ANSWERS_COLLECTION = 'prep_paper_answers'
/** Firestore collection for generated quick-revision MCQ sets. */
export const PREP_MCQ_SETS_COLLECTION = 'prep_mcq_sets'

/** How many questions one generate call may cover (plan: ≤ 25). */
export const ANSWER_GENERATE_BATCH_LIMIT = 25

export interface PaperQuestionRef {
  /** Stable per-question id: `${sectionId}__${label}`, safe in a doc path. */
  qid: string
  sectionId: string
  sectionTitle: string
  label: string
  text: string
  parts: string[]
  marks: number
}

/**
 * Document id for one answer. `paperId` first so `collectionGroup`-free queries
 * can be ordered by paper, and every part sanitised so a label like '1 (a/b)'
 * cannot create a nested path.
 */
export function answerDocId(paperId: string, qid: string): string {
  return `${safeIdPart(paperId)}__${safeIdPart(qid)}`
}

/** Firestore-legal, stable id fragment: no '/', no control characters, ≤ 100 chars. */
export function safeIdPart(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[/\u0000-\u001f\u007f]/g, '-')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 100)
}

/** Every answerable question on a paper, in printed order. */
export function collectPaperQuestions(paper: {
  sections?: Array<{
    id?: string
    title?: string
    marksEach?: number
    questions?: Array<{ label?: string; text?: string; marks?: number; parts?: string[] }>
  }>
}): PaperQuestionRef[] {
  const out: PaperQuestionRef[] = []
  for (const section of paper.sections || []) {
    for (const question of section.questions || []) {
      const label = String(question.label || '').trim()
      const text = String(question.text || '').trim()
      if (!label || !text) continue
      out.push({
        qid: `${safeIdPart(section.id || 's')}__${safeIdPart(label)}`,
        sectionId: String(section.id || ''),
        sectionTitle: String(section.title || ''),
        label,
        text,
        parts: (question.parts || []).map((part) => String(part)),
        marks: Number(question.marks) > 0 ? Number(question.marks) : Number(section.marksEach) || 0,
      })
    }
  }
  return out
}

/**
 * The answer-length rule from the plan: headings + bullets, sized by marks.
 * Returned as data so the prompt and the UI can agree on what "short" means.
 */
export function answerLengthGuidance(marks: number): { words: string; bullets: string } {
  if (marks <= 2) return { words: '40–60 words', bullets: '2–3 bullet points' }
  if (marks <= 5) return { words: '120–180 words', bullets: '4–6 bullet points' }
  if (marks <= 10) return { words: '250–350 words', bullets: '6–8 bullet points and one example' }
  return { words: '400–550 words', bullets: '8–12 bullet points, two examples and a conclusion' }
}

export interface ModelAnswerPromptInput {
  question: string
  parts?: string[]
  marks: number
  subjectName: string
  programLabel?: string
  universityName?: string
  examYear?: number
}

/**
 * Prompt for one model answer. Written for a Karnataka undergraduate paper —
 * the marker expects headings, definition, points, and an example at 10 marks.
 */
export function buildModelAnswerPrompt(input: ModelAnswerPromptInput): string {
  const guidance = answerLengthGuidance(input.marks)
  const contextBits = [
    input.programLabel ? `Programme: ${input.programLabel}` : '',
    input.universityName ? `University: ${input.universityName}` : '',
    input.examYear ? `Paper year: ${input.examYear}` : '',
  ].filter(Boolean)

  return `You are a senior examiner for a Karnataka state university undergraduate examination writing the MODEL ANSWER that a topper would write.

Subject: ${input.subjectName}
${contextBits.join('\n')}
Question (${input.marks} marks): ${input.question}${input.parts?.length ? `\nSub-parts:\n${input.parts.map((part) => `- ${part}`).join('\n')}` : ''}

Rules:
- Answer in plain English with short headings and bullet points. Marks are earned by points, not by prose.
- Length: ${guidance.words} (${guidance.bullets}). Never pad with filler.
- Start with a one-line definition or statement of the concept, in the examiner's own words.
- Where the question asks for a computation, show the formula, then the working, then the answer on its own line.
- Give one Indian example (company, Act, or scheme) when the subject allows it.
- Do NOT repeat the question, do NOT add a preamble like "Sure", and do NOT use markdown code fences.

Respond with only the answer text.`
}

/** Prompt for a quick-revision MCQ set drawn from a paper's questions. */
export function buildMcqSetPrompt(input: {
  subjectName: string
  programLabel?: string
  questions: string[]
  perTopic?: number
}): string {
  const count = input.perTopic ?? 5
  return `You are setting quick-revision multiple-choice questions for a Karnataka university undergraduate exam.

Subject: ${input.subjectName}${input.programLabel ? `\nProgramme: ${input.programLabel}` : ''}
Source questions from past papers (these define the topics to test):
${input.questions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

Produce exactly ${count} MCQs covering these topics, and respond with ONLY a JSON array (no markdown fences, no commentary):
[
  {
    "question": "the question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 1,
    "explanation": "one or two sentences saying why this option is right and the common mistake"
  }
]

Rules:
- Exactly four options per question, with exactly one correct answer.
- Distractors must be plausible and drawn from the same subject area, never silly.
- No "All of the above" or "None of the above".
- Vary the position of the correct answer across the set.`
}

export interface SanitisedAnswer {
  answerMd: string
  ok: boolean
  /** Why the text was rejected or trimmed — surfaced to the reviewer. */
  issues: string[]
}

/**
 * Cleans model output before it is stored.
 *
 * Rejects empty/refusal text outright, strips code fences and preamble, and
 * trims a trailing "let me know if…" that would otherwise be published to
 * students. A too-short answer for its marks is kept but flagged, so the
 * reviewer sees it rather than the student.
 */
export function sanitiseModelAnswer(raw: unknown, marks = 5): SanitisedAnswer {
  const issues: string[] = []
  let text = String(raw ?? '').trim()

  if (!text) return { answerMd: '', ok: false, issues: ['empty output'] }

  // Code fences (models add them despite instructions).
  const fenced = text.match(/^```(?:markdown|md|text)?\s*([\s\S]*?)\s*```$/i)
  if (fenced) {
    text = fenced[1].trim()
    issues.push('stripped a markdown code fence')
  }

  // Conversational preamble / refusal openers.
  const openers = [
    /^(sure|certainly|of course|here(?:'s| is) (?:a|the) (?:model )?answer)[^\n]*\n+/i,
    /^(as an ai language model)[^\n]*\n+/i,
    /^(i (?:cannot|can't|am unable to))[^\n]*$/i,
  ]
  for (const opener of openers) {
    const before = text
    text = text.replace(opener, '').trim()
    if (text !== before) issues.push('removed a preamble/refusal line')
  }

  // A refusal that remains is not an answer.
  if (/^(i (?:cannot|can't|am unable to)\b)/i.test(text) || text.length < 20) {
    return { answerMd: '', ok: false, issues: [...issues, 'no usable answer text'] }
  }

  // Trailing chat filler.
  const trimmed = text.replace(/\n+(let me know if|hope this helps|feel free to ask)[\s\S]*$/i, '').trim()
  if (trimmed !== text) {
    text = trimmed
    issues.push('removed a trailing chat line')
  }

  // Length sanity against the marks the answer must earn.
  const words = text.split(/\s+/).filter(Boolean).length
  // Deliberately lower than the prompt's guidance: this flag exists to catch a
  // stub or a one-liner, not to argue with a concise answer. A 5-mark answer of
  // five short bullets is legitimate.
  const minimum = marks <= 2 ? 20 : marks <= 5 ? 60 : 150
  if (words < minimum) issues.push(`shorter than expected for ${marks} marks (${words} words)`)

  return { answerMd: text, ok: true, issues }
}

export interface SanitisedMcq {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface SanitisedMcqSet {
  items: SanitisedMcq[]
  ok: boolean
  issues: string[]
}

/**
 * Parses an MCQ set, dropping unusable items rather than failing the whole set
 * (a set of 4 good questions is worth more than a retry).
 */
export function sanitiseMcqSet(raw: unknown): SanitisedMcqSet {
  const issues: string[] = []
  const text = typeof raw === 'string' ? raw : ''
  let parsed: unknown = raw

  if (typeof text === 'string' && text.trim()) {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return { items: [], ok: false, issues: ['output was not valid JSON'] }
    }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown[] })?.items)
      ? (parsed as { items: unknown[] }).items
      : []
  if (list.length === 0) return { items: [], ok: false, issues: ['no items in output'] }

  const items: SanitisedMcq[] = []
  const seen = new Set<string>()
  for (const entry of list as Array<Record<string, unknown>>) {
    const question = String(entry?.question ?? '').trim()
    const options = Array.isArray(entry?.options) ? entry.options.map((o) => String(o).trim()) : []
    const correctIndex = Number(entry?.correctIndex)
    const explanation = String(entry?.explanation ?? '').trim()

    if (!question || options.length !== 4 || options.some((option) => !option)) {
      issues.push('dropped an item without four option texts')
      continue
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      issues.push('dropped an item whose correct answer is not one of the four options')
      continue
    }
    if (/all of the above|none of the above/i.test(options.join(' '))) {
      issues.push('dropped an item using "all/none of the above"')
      continue
    }
    const fingerprint = question.toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(fingerprint)) {
      issues.push('dropped a duplicate question')
      continue
    }
    seen.add(fingerprint)
    items.push({ question, options, correctIndex, explanation })
  }

  return { items, ok: items.length > 0, issues }
}

/** The doc id for one MCQ set: one set per (paper, question) pair. */
export function mcqSetDocId(paperId: string, qid: string): string {
  return `${safeIdPart(paperId)}__${safeIdPart(qid)}`
}

/** Public-facing label. Must stay true: the content IS reviewed before publication. */
export const MODEL_ANSWER_LABEL = 'Model answer · AI-generated, reviewed'

/** Where a generated answer sits in the review flow. */
export function isPublishable(status: unknown): boolean {
  return status === 'draft'
}
