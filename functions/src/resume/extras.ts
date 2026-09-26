// functions/src/resume/extras.ts
//
// Item 4.2 of docs/HANDOFF_OPTIMISATION_2026-09-25.md — the Placement Pack
// extensions that produce text: a cover letter, a LinkedIn "About", a set of
// interview questions for a job description, and the readiness summary the
// placement cell reads.
//
// Pure (no Firestore, no Gemini) so every prompt and every sanitiser is
// unit-tested in functions/test/resumeExtras.test.ts. The routes only
// orchestrate: check the college's flags, take a credit, call the 4.1 cache,
// store the result.
//
// The readiness summary is deliberately NOT the browser's ATS report. The
// browser's report is richer and runs on every keystroke; this one is the
// server's own opinion, computed from stored data, because a placement-cell
// dashboard must not trust a number the client sent it.

export type ResumeDocKind = 'coverLetter' | 'linkedinAbout'

/** Longest job description we will send to a model, per request. */
export const MAX_JOB_DESCRIPTION_CHARS = 6000
/** How many interview questions one call may ask for. */
export const MAX_INTERVIEW_QUESTIONS = 15
export const DEFAULT_INTERVIEW_QUESTIONS = 15

/** Just enough of the resume to build a prompt, without importing the model. */
export interface ResumeProfileInput {
  fullName?: string
  headline?: string
  email?: string
  phone?: string
  location?: string
  course?: string
  branch?: string
  graduationYear?: number | string
  summary?: string
  skills: Array<{ name?: string; category?: string } | string>
  experience?: Array<{ company?: string; role?: string; bullets?: string[] }>
  projects?: Array<{ title?: string; bullets?: string[] }>
  education?: Array<{ institution?: string; degree?: string; field?: string; score?: string }>
  achievements?: string[]
}

/** Trims and caps a free-text field before it reaches a prompt. */
export function clampText(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function skillNames(profile: ResumeProfileInput): string[] {
  return (profile.skills || [])
    .map((skill) => (typeof skill === 'string' ? skill : skill?.name || ''))
    .map((name) => clampText(name, 60))
    .filter(Boolean)
}

/** The one-line summary of the candidate used by all three prompts. */
export function profileDigest(profile: ResumeProfileInput): string {
  const bits: string[] = []
  if (profile.headline) bits.push(`Headline: ${clampText(profile.headline, 160)}`)
  if (profile.course || profile.branch) {
    bits.push(`Course: ${[profile.course, profile.branch].filter(Boolean).map((v) => clampText(v, 80)).join(' ')}`)
  }
  if (profile.graduationYear) bits.push(`Graduating: ${clampText(profile.graduationYear, 12)}`)
  if (profile.location) bits.push(`Location: ${clampText(profile.location, 80)}`)
  const skills = skillNames(profile).slice(0, 20)
  if (skills.length) bits.push(`Skills: ${skills.join(', ')}`)
  const roles = (profile.experience || [])
    .slice(0, 4)
    .map((job) => [clampText(job.role, 80), clampText(job.company, 80)].filter(Boolean).join(' at '))
    .filter(Boolean)
  if (roles.length) bits.push(`Experience: ${roles.join('; ')}`)
  const projects = (profile.projects || []).slice(0, 3).map((project) => clampText(project.title, 100)).filter(Boolean)
  if (projects.length) bits.push(`Projects: ${projects.join('; ')}`)
  if (profile.summary) bits.push(`Existing summary: ${clampText(profile.summary, 600)}`)
  return bits.join('\n')
}

/** Bullet evidence a cover letter may quote — kept short and factual. */
export function achievementLines(profile: ResumeProfileInput, limit = 8): string[] {
  const fromExperience = (profile.experience || []).flatMap((job) => job.bullets || [])
  const fromProjects = (profile.projects || []).flatMap((project) => project.bullets || [])
  return [...fromExperience, ...fromProjects, ...(profile.achievements || [])]
    .map((line) => clampText(line, 240))
    .filter((line) => line.length > 12)
    .slice(0, limit)
}

// ─── Prompts ────────────────────────────────────────────────────────────────

export function buildCoverLetterPrompt(input: {
  profile: ResumeProfileInput
  jobTitle: string
  company?: string
  jobDescription?: string
  tone?: string
}): string {
  const digest = profileDigest(input.profile)
  const evidence = achievementLines(input.profile, 6)
  return `You are writing a one-page cover letter for a final-year Indian undergraduate applying through campus placement.

Candidate:
${digest || 'A final-year undergraduate with no listed experience yet.'}
${evidence.length ? `\nEvidence from the resume (use these facts, do not invent new ones):\n${evidence.map((line) => `- ${line}`).join('\n')}` : ''}

Role: ${clampText(input.jobTitle, 120)}${input.company ? `\nat ${clampText(input.company, 120)}` : ''}${input.tone ? `\nTone: ${clampText(input.tone, 40)}` : ''}${
    input.jobDescription ? `\n\nJob description (the letter must answer what it asks for):\n${clampText(input.jobDescription, MAX_JOB_DESCRIPTION_CHARS)}` : ''
  }

Rules:
- 250–350 words. Four short paragraphs: why this role, what the candidate has actually done, what they know of the company/role, and a close.
- Plain professional English. No "I am writing to express my keen interest" opener, no flattery, no clichés like "dynamic organisation".
- Never invent experience, employers, marks or certifications. If the resume lacks something the job asks for, leave it out.
- Address it to "The Hiring Team" unless a name was given. Do not invent a name.
- No markdown, no bullet lists, no placeholders like [Your Name] — end with the candidate's name only if it is known.

Respond with only the letter text.`
}

export function buildLinkedinAboutPrompt(input: { profile: ResumeProfileInput; goal?: string }): string {
  const digest = profileDigest(input.profile)
  return `Write a LinkedIn "About" section for a final-year Indian undergraduate.

${digest || 'A final-year undergraduate building their first professional profile.'}${input.goal ? `\nGoal: ${clampText(input.goal, 160)}` : ''}

Rules:
- 120–180 words, first person, plain English — no buzzword salad ("passionate", "dynamic", "go-getter").
- Say what they study, what they can do today, one concrete piece of evidence from the facts above, and what they are looking for next.
- Short paragraphs, at most one line of hyphenated highlights, no emoji, no hashtags.
- Invent nothing: if a fact is not above, do not mention it.

Respond with only the About text.`
}

export function buildInterviewQuestionsPrompt(input: {
  profile: ResumeProfileInput
  jobTitle: string
  company?: string
  jobDescription?: string
  count?: number
}): string {
  const count = Math.min(MAX_INTERVIEW_QUESTIONS, Math.max(1, input.count ?? DEFAULT_INTERVIEW_QUESTIONS))
  const digest = profileDigest(input.profile)
  return `You are preparing a campus-placement candidate for an interview.

Role: ${clampText(input.jobTitle, 120)}${input.company ? `\nat ${clampText(input.company, 120)}` : ''}

Candidate profile:
${digest || 'A final-year undergraduate.'}${input.jobDescription ? `\n\nJob description:\n${clampText(input.jobDescription, MAX_JOB_DESCRIPTION_CHARS)}` : ''}

Produce exactly ${count} interview questions as a JSON array, no markdown fences, no commentary:
[
  { "question": "...", "why": "what the interviewer is checking", "answerHint": "2–3 sentences of what a strong answer contains" }
]

Rules:
- Mix: 3–4 on their own projects/internships (so the candidate is asked about what they claimed), 4–6 technical for the role, 3–4 behavioural, 2 on the company/industry.
- Questions must be answerable from the profile or the job description above. No trivia.
- Keep each "why" under 20 words and each "answerHint" under 60 words.`
}

// ─── Sanitisers ─────────────────────────────────────────────────────────────

export interface SanitisedDoc {
  text: string
  ok: boolean
  issues: string[]
  wordCount: number
}

const DOC_BOUNDS: Record<ResumeDocKind, { min: number; max: number }> = {
  coverLetter: { min: 150, max: 420 },
  linkedinAbout: { min: 90, max: 260 },
}

/** Strips fences/preamble/placeholders and enforces the length the prompt asked for. */
export function sanitiseResumeDoc(raw: unknown, kind: ResumeDocKind): SanitisedDoc {
  const issues: string[] = []
  let text = String(raw ?? '').trim()
  if (!text) return { text: '', ok: false, issues: ['empty output'], wordCount: 0 }

  // Models fence the letter even when told not to, and often after a sentence
  // of preamble. Take the fenced block wherever it is: that IS the answer.
  const fenced = text.match(/```(?:markdown|md|text)?\s*([\s\S]*?)\s*```/i)
  if (fenced) {
    text = fenced[1].trim()
    issues.push('stripped a markdown code fence')
  }
  const beforePreamble = text
  text = text
    .replace(/^(sure|certainly|of course|here(?:'s| is)[^\n]*)\n+/i, '')
    .replace(/^(as an ai language model)[^\n]*\n+/i, '')
    .trim()
  if (text !== beforePreamble) issues.push('removed a preamble line')
  const beforeSignoff = text
  text = text.replace(/\n+(let me know if|hope this helps|feel free to)[\s\S]*$/i, '').trim()
  if (text !== beforeSignoff) issues.push('removed a trailing chat line')

  // Left-over template placeholders are worse than a short letter: they are
  // what a recruiter actually notices.
  if (/\[(your |the )?[a-z ]{2,30}\]/i.test(text)) {
    issues.push('contained an unfilled placeholder')
    text = text.replace(/\[(your |the )?[a-z ]{2,30}\]/gi, '').replace(/\s{2,}/g, ' ').trim()
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length
  const bounds = DOC_BOUNDS[kind]
  if (wordCount < bounds.min) issues.push(`shorter than asked (${wordCount} words)`)
  if (wordCount > bounds.max) issues.push(`longer than asked (${wordCount} words)`)
  if (wordCount < 40) return { text: '', ok: false, issues: [...issues, 'no usable text'], wordCount }

  return { text, ok: true, issues, wordCount }
}

export interface InterviewQuestion {
  question: string
  why: string
  answerHint: string
}

/** Parses the question list, dropping unusable entries instead of failing all. */
export function sanitiseInterviewQuestions(raw: unknown): { items: InterviewQuestion[]; ok: boolean; issues: string[] } {
  const issues: string[] = []
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
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
  if (list.length === 0) return { items: [], ok: false, issues: ['no questions in output'] }

  const items: InterviewQuestion[] = []
  const seen = new Set<string>()
  for (const entry of list as Array<Record<string, unknown>>) {
    const question = clampText(entry?.question, 300)
    if (question.length < 10) {
      issues.push('dropped a question that was too short')
      continue
    }
    const fingerprint = question.toLowerCase().replace(/[^a-z0-9 ]/g, '')
    if (seen.has(fingerprint)) {
      issues.push('dropped a duplicate question')
      continue
    }
    seen.add(fingerprint)
    items.push({
      question,
      why: clampText(entry?.why, 160),
      answerHint: clampText(entry?.answerHint, 500),
    })
  }
  return { items, ok: items.length > 0, issues }
}

// ─── Readiness summary (what the placement cell reads) ──────────────────────

export interface ReadinessInput extends ResumeProfileInput {
  resumeUpdatedAt?: string | null
  downloads?: number
}

export interface Readiness {
  /** 0–100, weighted share of the signals below. */
  score: number
  band: 'Ready' | 'Nearly there' | 'Needs work' | 'Barely started'
  /** Signal → what the candidate is missing. Powers the placement-cell table. */
  missing: string[]
}

/**
 * A compact, server-side readiness score.
 *
 * It answers one question on the placement-cell dashboard: "which students need
 * chasing?" — so it weights the things a recruiter filters on (contactability, a
 * filled education history, some evidence of work, skills) and it is computed
 * from stored data rather than from a number the browser sent us.
 */
export function readinessFor(profile: ReadinessInput): Readiness {
  const checks: Array<{ label: string; weight: number; ok: boolean; missing: string }> = [
    { label: 'contact', weight: 20, ok: Boolean(clampText(profile.fullName, 80) && (clampText(profile.email, 120) || clampText(profile.phone, 20))), missing: 'name or contact details' },
    { label: 'headline', weight: 8, ok: clampText(profile.headline, 160).length >= 8, missing: 'a headline' },
    { label: 'summary', weight: 10, ok: clampText(profile.summary, 900).split(/\s+/).filter(Boolean).length >= 25, missing: 'a summary of at least 25 words' },
    { label: 'education', weight: 14, ok: (profile.education || []).some((row) => clampText(row.institution, 120).length > 2), missing: 'an education entry' },
    { label: 'skills', weight: 14, ok: skillNames(profile).length >= 5, missing: 'at least five skills' },
    { label: 'experience or projects', weight: 16, ok: (profile.experience || []).length > 0 || (profile.projects || []).length > 0, missing: 'an internship, job or project' },
    { label: 'quantified evidence', weight: 10, ok: achievementLines(profile, 12).some((line) => /\d/.test(line)), missing: 'at least one bullet with a number in it' },
    { label: 'fresh', weight: 8, ok: Boolean(profile.resumeUpdatedAt), missing: 'a saved resume' },
  ]
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
  const earned = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0)
  const score = Math.round((earned / totalWeight) * 100)
  const band: Readiness['band'] = score >= 85 ? 'Ready' : score >= 65 ? 'Nearly there' : score >= 40 ? 'Needs work' : 'Barely started'
  return { score, band, missing: checks.filter((check) => !check.ok).map((check) => check.missing) }
}

/** CSV cell escaping for the placement-cell export. */
export function csvCell(value: unknown): string {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
