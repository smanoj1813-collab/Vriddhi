// functions/src/resume/model.ts
//
// Resume Builder add-on — the pure data model shared by the Express router,
// the HTML templates and the unit tests. Nothing in here touches Firestore,
// Storage or Chrome, which is what keeps the credit maths and the input
// sanitiser testable under plain `node --test`.
//
// Where things live (see docs/RESUME_BUILDER_ADDON_COSTING_2026-09-25.md for
// the commercial reasoning):
//   resumes/{uid}                          one document per student: the
//                                          editable data + the credit ledger
//   resumeDownloads/{downloadId}           one row per generated PDF (the
//                                          "version"), points at the Storage
//                                          object for free re-downloads
//   colleges/{collegeId}/config/resumeBuilder
//                                          per-college add-on switch, the
//                                          downloads-per-template cap, the
//                                          template allow-list and AI assist
//
// The client keeps a mirror of the *types* in src/shared/types/resume.ts —
// keep the two in step when a field is added.

// ─── Templates ──────────────────────────────────────────────────────────────

export type ResumeTemplateId = 'classic' | 'modern' | 'compact' | 'fresher' | 'executive'

export type ResumeFontFamily = 'sans' | 'serif' | 'mixed'

export interface ResumeTemplateMeta {
  id: ResumeTemplateId
  name: string
  tagline: string
  bestFor: string
  /** `sans` = Inter, `serif` = Source Serif 4, `mixed` = serif headings on a sans body. */
  family: ResumeFontFamily
  /** Accent used for headings; every template stays black-on-white for the body. */
  accent: string
  /** Print margin (mm) passed to Chrome — the preview mirrors it. */
  marginMm: number
  /** Body font size (pt). */
  bodyPt: number
  /** Section order applied when the student has not reordered anything. */
  defaultSectionOrder: ResumeSectionId[]
}

export const RESUME_TEMPLATES: readonly ResumeTemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Centred serif header, ruled section titles — the format every recruiter has seen.',
    bestFor: 'Banking, accounts, audit, government and campus placements',
    family: 'serif',
    accent: '#111827',
    marginMm: 15,
    bodyPt: 10.5,
    defaultSectionOrder: ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages'],
  },
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Left-aligned sans-serif with a teal accent — clean, current, still single-column.',
    bestFor: 'IT services, start-ups, analytics and product roles',
    family: 'sans',
    accent: '#0f766e',
    marginMm: 14,
    bodyPt: 10.5,
    defaultSectionOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages'],
  },
  {
    id: 'compact',
    name: 'Compact',
    tagline: 'Tighter type and margins so two pages of material fit on one.',
    bestFor: 'Students with several internships, projects or certifications',
    family: 'sans',
    accent: '#1e3a8a',
    marginMm: 11,
    bodyPt: 9.5,
    defaultSectionOrder: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'achievements', 'languages'],
  },
  {
    id: 'fresher',
    name: 'Fresher',
    tagline: 'Education and academic projects first; shaded section bands guide the eye.',
    bestFor: 'First job, no full-time experience yet, campus drives',
    family: 'sans',
    accent: '#334155',
    marginMm: 14,
    bodyPt: 10.5,
    defaultSectionOrder: ['summary', 'education', 'projects', 'skills', 'experience', 'certifications', 'achievements', 'languages'],
  },
  {
    id: 'executive',
    name: 'Executive',
    tagline: 'Large serif name, generous white space, profile statement up front.',
    bestFor: 'MBA / M.Com, management trainee and client-facing roles',
    family: 'mixed',
    accent: '#7c2d12',
    marginMm: 16,
    bodyPt: 10.5,
    defaultSectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'languages'],
  },
]

export const RESUME_TEMPLATE_IDS: readonly ResumeTemplateId[] = RESUME_TEMPLATES.map((t) => t.id)

export function isResumeTemplateId(value: unknown): value is ResumeTemplateId {
  return typeof value === 'string' && (RESUME_TEMPLATE_IDS as readonly string[]).includes(value)
}

export function getResumeTemplate(id: ResumeTemplateId): ResumeTemplateMeta {
  const found = RESUME_TEMPLATES.find((t) => t.id === id)
  if (!found) throw new Error(`Unknown resume template: ${id}`)
  return found
}

// ─── Resume data ────────────────────────────────────────────────────────────

export type ResumeSectionId =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'achievements'
  | 'languages'

export const RESUME_SECTION_IDS: readonly ResumeSectionId[] = [
  'summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'achievements', 'languages',
]

export interface ResumeContact {
  fullName: string
  /** One line under the name, e.g. "B.Com (Final year) · Aspiring Financial Analyst". */
  headline: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
}

export interface ResumeEducation {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  startYear: string
  endYear: string
  /** "CGPA 8.4/10", "78%", "First Class" — free text, rendered verbatim. */
  score: string
  highlights: string[]
}

export interface ResumeExperience {
  id: string
  organisation: string
  role: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface ResumeProject {
  id: string
  name: string
  role: string
  link: string
  startDate: string
  endDate: string
  techStack: string[]
  bullets: string[]
}

export interface ResumeSkillGroup {
  id: string
  name: string
  skills: string[]
}

export interface ResumeCertification {
  id: string
  name: string
  issuer: string
  year: string
  credentialId: string
}

export interface ResumeData {
  contact: ResumeContact
  summary: string
  education: ResumeEducation[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  skills: ResumeSkillGroup[]
  certifications: ResumeCertification[]
  achievements: string[]
  languages: string[]
  /** Order of the movable sections; missing ids are appended in template order. */
  sectionOrder: ResumeSectionId[]
  /** Optional job description the ATS checker scores keywords against. Never printed. */
  targetJobDescription: string
}

export const RESUME_LIMITS = {
  line: 160,
  headline: 200,
  summary: 1200,
  bullet: 320,
  bulletsPerEntry: 8,
  education: 8,
  experience: 12,
  projects: 12,
  skillGroups: 8,
  skillsPerGroup: 30,
  certifications: 15,
  achievements: 15,
  languages: 10,
  techStack: 15,
  jobDescription: 6000,
} as const

export function emptyResumeData(): ResumeData {
  return {
    contact: { fullName: '', headline: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: [],
    sectionOrder: [...RESUME_SECTION_IDS],
    targetJobDescription: '',
  }
}

// ─── Sanitiser ──────────────────────────────────────────────────────────────
//
// Everything a student types crosses this boundary before it is stored or
// rendered. It coerces, trims, strips control characters and caps lengths and
// array sizes; HTML escaping is the template's job (see templates.ts) so the
// stored data stays plain text.

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

function cleanLine(value: unknown, max: number): string {
  if (typeof value !== 'string') {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    return ''
  }
  return value.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}

function cleanStringList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const line = cleanLine(item, maxLen)
    if (line) out.push(line)
    if (out.length >= maxItems) break
  }
  return out
}

function cleanId(value: unknown, fallback: string): string {
  const line = cleanLine(value, 40)
  return /^[A-Za-z0-9_-]{1,40}$/.test(line) ? line : fallback
}

function cleanUrl(value: unknown, max: number): string {
  const line = cleanLine(value, max)
  if (!line) return ''
  // Only ever store something a browser can open; anything else is kept as text
  // but with the scheme stripped so a template never emits `javascript:`.
  if (/^https?:\/\//i.test(line)) return line
  if (/^[a-z][a-z0-9+.-]*:/i.test(line)) return line.replace(/^[a-z][a-z0-9+.-]*:\/*/i, '')
  return line
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function sanitizeResumeData(input: unknown): ResumeData {
  const raw = asRecord(input)
  const contactRaw = asRecord(raw.contact)
  const L = RESUME_LIMITS

  const contact: ResumeContact = {
    fullName: cleanLine(contactRaw.fullName, L.line),
    headline: cleanLine(contactRaw.headline, L.headline),
    email: cleanLine(contactRaw.email, L.line).toLowerCase(),
    phone: cleanLine(contactRaw.phone, 40),
    location: cleanLine(contactRaw.location, L.line),
    linkedin: cleanUrl(contactRaw.linkedin, L.line),
    github: cleanUrl(contactRaw.github, L.line),
    website: cleanUrl(contactRaw.website, L.line),
  }

  const education: ResumeEducation[] = asArray(raw.education).slice(0, L.education).map((item, i) => {
    const e = asRecord(item)
    return {
      id: cleanId(e.id, `edu-${i + 1}`),
      institution: cleanLine(e.institution, L.line),
      degree: cleanLine(e.degree, L.line),
      field: cleanLine(e.field, L.line),
      location: cleanLine(e.location, L.line),
      startYear: cleanLine(e.startYear, 20),
      endYear: cleanLine(e.endYear, 20),
      score: cleanLine(e.score, 60),
      highlights: cleanStringList(e.highlights, L.bulletsPerEntry, L.bullet),
    }
  })

  const experience: ResumeExperience[] = asArray(raw.experience).slice(0, L.experience).map((item, i) => {
    const x = asRecord(item)
    return {
      id: cleanId(x.id, `exp-${i + 1}`),
      organisation: cleanLine(x.organisation, L.line),
      role: cleanLine(x.role, L.line),
      location: cleanLine(x.location, L.line),
      startDate: cleanLine(x.startDate, 30),
      endDate: cleanLine(x.endDate, 30),
      current: x.current === true,
      bullets: cleanStringList(x.bullets, L.bulletsPerEntry, L.bullet),
    }
  })

  const projects: ResumeProject[] = asArray(raw.projects).slice(0, L.projects).map((item, i) => {
    const p = asRecord(item)
    return {
      id: cleanId(p.id, `prj-${i + 1}`),
      name: cleanLine(p.name, L.line),
      role: cleanLine(p.role, L.line),
      link: cleanUrl(p.link, L.line),
      startDate: cleanLine(p.startDate, 30),
      endDate: cleanLine(p.endDate, 30),
      techStack: cleanStringList(p.techStack, L.techStack, 40),
      bullets: cleanStringList(p.bullets, L.bulletsPerEntry, L.bullet),
    }
  })

  const skills: ResumeSkillGroup[] = asArray(raw.skills).slice(0, L.skillGroups).map((item, i) => {
    const s = asRecord(item)
    return {
      id: cleanId(s.id, `skl-${i + 1}`),
      name: cleanLine(s.name, 60),
      skills: cleanStringList(s.skills, L.skillsPerGroup, 50),
    }
  })

  const certifications: ResumeCertification[] = asArray(raw.certifications).slice(0, L.certifications).map((item, i) => {
    const c = asRecord(item)
    return {
      id: cleanId(c.id, `crt-${i + 1}`),
      name: cleanLine(c.name, L.line),
      issuer: cleanLine(c.issuer, L.line),
      year: cleanLine(c.year, 20),
      credentialId: cleanLine(c.credentialId, 80),
    }
  })

  const seen = new Set<ResumeSectionId>()
  const sectionOrder: ResumeSectionId[] = []
  for (const id of asArray(raw.sectionOrder)) {
    if (typeof id === 'string' && (RESUME_SECTION_IDS as readonly string[]).includes(id) && !seen.has(id as ResumeSectionId)) {
      seen.add(id as ResumeSectionId)
      sectionOrder.push(id as ResumeSectionId)
    }
  }
  for (const id of RESUME_SECTION_IDS) if (!seen.has(id)) sectionOrder.push(id)

  return {
    contact,
    summary: cleanText(raw.summary, L.summary),
    education,
    experience,
    projects,
    skills,
    certifications,
    achievements: cleanStringList(raw.achievements, L.achievements, L.bullet),
    languages: cleanStringList(raw.languages, L.languages, 60),
    sectionOrder,
    targetJobDescription: cleanText(raw.targetJobDescription, L.jobDescription),
  }
}

/** Rough word count of everything that prints — used for the page estimate and the ATS length check. */
export function countResumeWords(data: ResumeData): number {
  const parts: string[] = [
    data.contact.fullName, data.contact.headline, data.summary,
    ...data.education.flatMap((e) => [e.institution, e.degree, e.field, e.score, ...e.highlights]),
    ...data.experience.flatMap((x) => [x.organisation, x.role, ...x.bullets]),
    ...data.projects.flatMap((p) => [p.name, p.role, p.techStack.join(' '), ...p.bullets]),
    ...data.skills.flatMap((s) => [s.name, s.skills.join(' ')]),
    ...data.certifications.flatMap((c) => [c.name, c.issuer]),
    ...data.achievements,
    ...data.languages,
  ]
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

// ─── College settings ───────────────────────────────────────────────────────

export interface ResumeSettings {
  /** Master switch — the add-on is sold per college and is OFF until a superadmin turns it on. */
  enabled: boolean
  /** PDF credits per template per academic year. Product default 3 (see costing §5). */
  downloadsPerTemplate: number
  /** Templates hidden from this college's students. */
  disabledTemplates: ResumeTemplateId[]
  /** AI rewrite suggestions (Gemini). Off by default; capped per student per year. */
  aiAssist: boolean
  aiCallsPerStudent: number
}

export const DEFAULT_DOWNLOADS_PER_TEMPLATE = 3
export const MAX_DOWNLOADS_PER_TEMPLATE = 10
export const DEFAULT_AI_CALLS_PER_STUDENT = 20
export const MAX_AI_CALLS_PER_STUDENT = 100

export function defaultResumeSettings(): ResumeSettings {
  return {
    enabled: false,
    downloadsPerTemplate: DEFAULT_DOWNLOADS_PER_TEMPLATE,
    disabledTemplates: [],
    aiAssist: false,
    aiCallsPerStudent: DEFAULT_AI_CALLS_PER_STUDENT,
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Accepts whatever is in Firestore (or a PUT body) and returns a complete, bounded settings object. */
export function normaliseResumeSettings(raw: unknown, base: ResumeSettings = defaultResumeSettings()): ResumeSettings {
  const r = asRecord(raw)
  const disabled = asArray(r.disabledTemplates).filter(isResumeTemplateId)
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : base.enabled,
    downloadsPerTemplate: clampInt(r.downloadsPerTemplate, 1, MAX_DOWNLOADS_PER_TEMPLATE, base.downloadsPerTemplate),
    disabledTemplates: Array.isArray(r.disabledTemplates) ? Array.from(new Set(disabled)) : base.disabledTemplates,
    aiAssist: typeof r.aiAssist === 'boolean' ? r.aiAssist : base.aiAssist,
    aiCallsPerStudent: clampInt(r.aiCallsPerStudent, 0, MAX_AI_CALLS_PER_STUDENT, base.aiCallsPerStudent),
  }
}

export function isTemplateEnabled(settings: ResumeSettings, templateId: ResumeTemplateId): boolean {
  return !settings.disabledTemplates.includes(templateId)
}

// ─── Credits ────────────────────────────────────────────────────────────────
//
// A "credit" is one server-side PDF render of one template. Credits reset each
// academic year (June → May, matching Karnataka's odd-semester start) and can
// be reset by a superadmin. Re-downloading an already generated PDF never
// costs a credit — that is what resumeDownloads + Storage are for.

export interface CreditState {
  cycle: string
  used: Partial<Record<ResumeTemplateId, number>>
  aiUsed: number
}

/** "2026-27" for any date from 1 June 2026 to 31 May 2027. */
export function creditCycleKey(now: Date = new Date()): string {
  const year = now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`
}

export function emptyCreditState(cycle: string): CreditState {
  return { cycle, used: {}, aiUsed: 0 }
}

/** Reads a stored credit block defensively; an old cycle is treated as brand new. */
export function normaliseCreditState(raw: unknown, cycle: string): CreditState {
  const r = asRecord(raw)
  if (r.cycle !== cycle) return emptyCreditState(cycle)
  const usedRaw = asRecord(r.used)
  const used: Partial<Record<ResumeTemplateId, number>> = {}
  for (const id of RESUME_TEMPLATE_IDS) {
    const n = usedRaw[id]
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) used[id] = Math.floor(n)
  }
  const aiUsed = typeof r.aiUsed === 'number' && Number.isFinite(r.aiUsed) && r.aiUsed > 0 ? Math.floor(r.aiUsed) : 0
  return { cycle, used, aiUsed }
}

export interface TemplateCreditSummary {
  templateId: ResumeTemplateId
  used: number
  allowed: number
  remaining: number
  enabled: boolean
}

export function summariseCredits(state: CreditState, settings: ResumeSettings): TemplateCreditSummary[] {
  return RESUME_TEMPLATE_IDS.map((templateId) => {
    const used = state.used[templateId] ?? 0
    const allowed = settings.downloadsPerTemplate
    return {
      templateId,
      used,
      allowed,
      remaining: Math.max(0, allowed - used),
      enabled: isTemplateEnabled(settings, templateId),
    }
  })
}

export type ReserveCreditResult =
  | { ok: true; state: CreditState; version: number; remaining: number }
  | { ok: false; reason: 'exhausted'; used: number; allowed: number }

/**
 * The one function the render transaction relies on. Pure: given the stored
 * state it returns the state to write back (or the refusal). Callers run it
 * inside `db.runTransaction` so two concurrent clicks cannot both pass.
 */
export function reserveCredit(
  stored: unknown,
  templateId: ResumeTemplateId,
  allowed: number,
  cycle: string,
): ReserveCreditResult {
  const state = normaliseCreditState(stored, cycle)
  const used = state.used[templateId] ?? 0
  if (used >= allowed) return { ok: false, reason: 'exhausted', used, allowed }
  const version = used + 1
  return {
    ok: true,
    version,
    remaining: allowed - version,
    state: { ...state, used: { ...state.used, [templateId]: version } },
  }
}

/** Gives a credit back after a failed render (never below zero, never across cycles). */
export function releaseCredit(stored: unknown, templateId: ResumeTemplateId, cycle: string): CreditState {
  const state = normaliseCreditState(stored, cycle)
  const used = state.used[templateId] ?? 0
  const next = { ...state.used }
  if (used <= 1) delete next[templateId]
  else next[templateId] = used - 1
  return { ...state, used: next }
}

export type ReserveAiResult =
  | { ok: true; state: CreditState; remaining: number }
  | { ok: false; reason: 'exhausted'; used: number; allowed: number }

export function reserveAiCall(stored: unknown, allowed: number, cycle: string): ReserveAiResult {
  const state = normaliseCreditState(stored, cycle)
  if (state.aiUsed >= allowed) return { ok: false, reason: 'exhausted', used: state.aiUsed, allowed }
  const next = { ...state, aiUsed: state.aiUsed + 1 }
  return { ok: true, state: next, remaining: allowed - next.aiUsed }
}

export function releaseAiCall(stored: unknown, cycle: string): CreditState {
  const state = normaliseCreditState(stored, cycle)
  return { ...state, aiUsed: Math.max(0, state.aiUsed - 1) }
}

// ─── File naming ────────────────────────────────────────────────────────────

export function resumeFileName(data: ResumeData, templateId: ResumeTemplateId, version: number): string {
  const base = (data.contact.fullName || 'Resume')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40) || 'Resume'
  return `${base}_Resume_${getResumeTemplate(templateId).name}_v${version}.pdf`
}
