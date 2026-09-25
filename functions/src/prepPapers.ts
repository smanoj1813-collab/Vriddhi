// functions/src/prepPapers.ts
//
// Previous-year university question papers for the Prep platform.
//
// A paper is stored as STRUCTURED TEXT (sections → questions → marks), not as
// a PDF: that keeps it searchable, renderable on a phone, linkable to the
// study packs in prep_subjects, and re-usable as practice material later.
//
//   prep_papers/{paperId}
//
// Pure data + pure functions only (no Firebase imports) so the seed
// controller in routes/prep.ts and the node:test integrity suite share one
// source of truth — the same convention as prepShared.ts.

import { PREP_PROGRAM_CATALOG, type CatalogIntegrityReport, type CatalogIssue } from './prepShared'

/** Seed code understood by POST /prep/seed-all (alongside program codes, 'aptitude', 'companies'). */
export const PREP_PAPER_SEED_CODE = 'papers'

// ─── Universities ────────────────────────────────────────────────────────────

export interface PrepPaperUniversity {
  /** Lowercase code stored on every paper. */
  code: string
  name: string
  shortName: string
  city: string
}

/** State universities whose affiliated degree colleges Vriddhi serves. */
export const PREP_PAPER_UNIVERSITIES: PrepPaperUniversity[] = [
  { code: 'bcu', name: 'Bengaluru City University', shortName: 'BCU', city: 'Bengaluru' },
  { code: 'bu', name: 'Bangalore University', shortName: 'BU', city: 'Bengaluru' },
  { code: 'bnu', name: 'Bengaluru North University', shortName: 'BNU', city: 'Kolar' },
  { code: 'kud', name: 'Karnatak University, Dharwad', shortName: 'KUD', city: 'Dharwad' },
  { code: 'mu', name: 'Mangalore University', shortName: 'MU', city: 'Mangalagangothri' },
  { code: 'kuvempu', name: 'Kuvempu University', shortName: 'KU', city: 'Shankaraghatta' },
  { code: 'uom', name: 'University of Mysore', shortName: 'UoM', city: 'Mysuru' },
  { code: 'tu', name: 'Tumkur University', shortName: 'TU', city: 'Tumakuru' },
  { code: 'dvu', name: 'Davangere University', shortName: 'DU', city: 'Davangere' },
  { code: 'rcub', name: 'Rani Channamma University', shortName: 'RCUB', city: 'Belagavi' },
  { code: 'vsku', name: 'Vijayanagara Sri Krishnadevaraya University', shortName: 'VSKU', city: 'Ballari' },
  { code: 'gug', name: 'Gulbarga University', shortName: 'GUG', city: 'Kalaburagi' },
  // Autonomous colleges set their own end-semester papers under the parent
  // university's degree. They are listed separately so a student can tell a
  // college-set paper from a university-set one at a glance.
  { code: 'stagnes-mu', name: 'St Agnes College (Autonomous), Mangaluru — Mangalore University', shortName: 'St Agnes (Auto.)', city: 'Mangaluru' },
]

export const PREP_PAPER_UNIVERSITY_CODES: string[] = PREP_PAPER_UNIVERSITIES.map((u) => u.code)

export function getPrepPaperUniversity(code?: string | null): PrepPaperUniversity | null {
  if (!code) return null
  const norm = String(code).toLowerCase().trim()
  return PREP_PAPER_UNIVERSITIES.find((u) => u.code === norm) || null
}

/**
 * Programs that were renamed. BBM (Bachelor of Business Management) became
 * BBA across Karnataka universities between 2014 and 2019, so BBM papers are
 * filed under the 'bba' catalogue and badged with the old name.
 */
export const PREP_PAPER_LEGACY_PROGRAMS: Record<string, { label: string; filedUnder: string; note: string }> = {
  bbm: {
    label: 'BBM',
    filedUnder: 'bba',
    note: 'BBM was renamed BBA; the syllabus overlaps heavily, so these older papers still make excellent practice.',
  },
}

// ─── Stored shape ────────────────────────────────────────────────────────────

export interface PrepPaperQuestion {
  /** Display label as printed on the paper: '1', '7', '1(a)', '10(b)'. */
  label: string
  text: string
  /** Marks for this question when they differ from the section default. */
  marks?: number
  /** Sub-parts or an "OR" alternative, rendered beneath the stem. */
  parts?: string[]
}

export interface PrepPaperSection {
  /** 'A', 'B', 'C', 'D' (or 'I', 'II' on older schemes). */
  id: string
  title: string
  /** Verbatim rubric, e.g. "Answer any FIVE of the following. Each question carries 2 marks." */
  instruction: string
  /** How many questions must be attempted; 0 = every question is compulsory. */
  answerCount: number
  marksEach: number
  /** answerCount (or all questions) × marksEach. */
  totalMarks: number
  questions: PrepPaperQuestion[]
}

export interface PrepPaperSource {
  title: string
  url: string
  publisher: string
  /** ISO date the text was taken from the source. */
  retrievedOn: string
  note?: string
}

export interface PrepPaper {
  id: string
  /** Prep program the paper is filed under ('bba', 'bcom', 'bsc', 'ba', …). */
  program: string
  /** 'BBA', 'B.Com', 'BBM' … — the name printed on the paper. */
  programLabel: string
  /** Set when the paper predates a rename (e.g. 'bbm'). */
  legacyProgram?: string | null
  degreeLevel: 'undergraduate' | 'postgraduate'
  universityCode: string
  universityName: string
  /** 'NEP 2021-22 onwards (F+R)', 'CBCS 2014-15', 'SEP 2024-25' … */
  scheme: string
  semester: number
  subjectName: string
  subjectArea?: string | null
  /** University paper code printed on the paper, e.g. 'DCBB103'. */
  paperCode?: string | null
  /** Syllabus paper number, e.g. '1.3'. */
  paperNumber?: string | null
  examMonth: string
  examYear: number
  /** 'February/March 2024' — derived, kept for cheap display and sorting. */
  examLabel: string
  durationMinutes: number
  maxMarks: number
  instructions: string[]
  sections: PrepPaperSection[]
  /** Total number of questions across sections — derived. */
  questionCount: number
  /** Study pack in prep_subjects that covers this paper, when one exists. */
  prepSubjectId?: string | null
  tags: string[]
  source: PrepPaperSource
  language: 'en'
  status: 'draft' | 'published'
  tier: 'free' | 'premium'
  contentVersion: number
  updatedAt?: string
}

/** List view: everything except the question text. */
export type PrepPaperSummary = Omit<PrepPaper, 'sections' | 'instructions'> & { sectionCount: number }

// ─── Compact authoring shape used by the seed bundles ────────────────────────

export type PrepPaperSeedQuestion = string | { label?: string; text: string; marks?: number; parts?: string[] }

export interface PrepPaperSeedSection {
  id: string
  /** Heading as printed ('Part A', 'Section I'); defaults to 'Section <id>'. */
  title?: string
  instruction: string
  /** Questions to attempt; 0 = all compulsory. */
  answer: number
  marksEach: number
  questions: PrepPaperSeedQuestion[]
  /**
   * Section A style: one question number with lettered parts (1(a)…1(g)).
   * Otherwise every entry gets the next running number (2, 3, 4 …).
   */
  subLabels?: boolean
  /** Restart running numbering at this value (rare; older schemes). */
  numberFrom?: number
}

export interface PrepPaperSeed {
  id: string
  program: string
  legacyProgram?: string
  university: string
  scheme: string
  semester: number
  subject: string
  subjectArea?: string
  paperCode?: string
  paperNumber?: string
  examMonth: string
  examYear: number
  durationMinutes: number
  maxMarks: number
  instructions?: string[]
  sections: PrepPaperSeedSection[]
  prepSubjectId?: string
  tags?: string[]
  source: PrepPaperSource
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export function semesterLabel(semester: number): string {
  const n = Number(semester) || 0
  return ROMAN[n] ? `${ROMAN[n]} Semester` : `Semester ${n}`
}

function letter(index: number): string {
  return String.fromCharCode(97 + (index % 26))
}

/** Expands the compact authoring record into the stored document. */
export function expandPrepPaperSeed(seed: PrepPaperSeed): PrepPaper {
  const legacy = seed.legacyProgram ? PREP_PAPER_LEGACY_PROGRAMS[seed.legacyProgram.toLowerCase()] : null
  const program = (legacy?.filedUnder || seed.program || '').toLowerCase().trim()
  const catalogEntry = PREP_PROGRAM_CATALOG.find((p) => p.code === program)
  const uni = getPrepPaperUniversity(seed.university)

  let running = 1
  const sections: PrepPaperSection[] = (seed.sections || []).map((s) => {
    if (s.numberFrom && s.numberFrom > 0) running = s.numberFrom
    const questions: PrepPaperQuestion[] = []
    if (s.subLabels) {
      const stem = running
      ;(s.questions || []).forEach((q, i) => {
        const obj = typeof q === 'string' ? { text: q } : q
        questions.push({
          label: obj.label || `${stem}(${letter(i)})`,
          text: obj.text,
          ...(obj.marks !== undefined ? { marks: obj.marks } : {}),
          ...(obj.parts && obj.parts.length > 0 ? { parts: obj.parts } : {}),
        })
      })
      running = stem + 1
    } else {
      ;(s.questions || []).forEach((q) => {
        const obj = typeof q === 'string' ? { text: q } : q
        questions.push({
          label: obj.label || String(running),
          text: obj.text,
          ...(obj.marks !== undefined ? { marks: obj.marks } : {}),
          ...(obj.parts && obj.parts.length > 0 ? { parts: obj.parts } : {}),
        })
        if (!obj.label) running += 1
      })
    }
    const answerCount = Math.max(0, Math.floor(Number(s.answer) || 0))
    const marksEach = Number(s.marksEach) || 0
    const attempted = answerCount > 0 ? answerCount : questions.length
    return {
      id: String(s.id).trim(),
      title:
        (s.title && s.title.trim()) ||
        (/^[A-Za-z]$/.test(String(s.id).trim()) ? `Section ${String(s.id).trim().toUpperCase()}` : `Section ${String(s.id).trim()}`),
      instruction: s.instruction,
      answerCount,
      marksEach,
      totalMarks: attempted * marksEach,
      questions,
    }
  })

  const questionCount = sections.reduce((n, s) => n + s.questions.length, 0)
  const tags = Array.from(
    new Set(
      [
        ...(seed.tags || []),
        program,
        seed.university.toLowerCase(),
        `sem-${seed.semester}`,
        String(seed.examYear),
        ...(seed.legacyProgram ? [seed.legacyProgram.toLowerCase()] : []),
      ].map((t) => String(t).toLowerCase().trim()).filter(Boolean)
    )
  )

  return {
    id: seed.id,
    program,
    programLabel: legacy?.label || catalogEntry?.label || program.toUpperCase(),
    legacyProgram: seed.legacyProgram ? seed.legacyProgram.toLowerCase() : null,
    degreeLevel: catalogEntry?.degreeLevel || 'undergraduate',
    universityCode: seed.university.toLowerCase().trim(),
    universityName: uni?.name || seed.university,
    scheme: seed.scheme,
    semester: Number(seed.semester),
    subjectName: seed.subject,
    subjectArea: seed.subjectArea || null,
    paperCode: seed.paperCode || null,
    paperNumber: seed.paperNumber || null,
    examMonth: seed.examMonth,
    examYear: Number(seed.examYear),
    examLabel: `${seed.examMonth} ${seed.examYear}`,
    durationMinutes: Number(seed.durationMinutes),
    maxMarks: Number(seed.maxMarks),
    instructions: seed.instructions || [],
    sections,
    questionCount,
    prepSubjectId: seed.prepSubjectId || null,
    tags,
    source: seed.source,
    language: 'en',
    status: 'published',
    tier: 'free',
    contentVersion: 1,
  }
}

export function expandPrepPaperSeeds(seeds: PrepPaperSeed[]): PrepPaper[] {
  return (seeds || []).map(expandPrepPaperSeed)
}

/** Strips the heavy fields for list responses. */
export function toPrepPaperSummary(paper: PrepPaper): PrepPaperSummary {
  const { sections, instructions, ...rest } = paper
  void instructions
  return { ...rest, sectionCount: Array.isArray(sections) ? sections.length : 0 }
}

/** Newest exam first inside program → semester → subject. */
export function sortPrepPapers<T extends Pick<PrepPaper, 'program' | 'semester' | 'examYear' | 'subjectName' | 'examMonth'>>(papers: T[]): T[] {
  const order = PREP_PROGRAM_CATALOG.map((p) => p.code)
  return [...papers].sort((a, b) => {
    const pa = order.indexOf(a.program)
    const pb = order.indexOf(b.program)
    if (pa !== pb) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    if (a.semester !== b.semester) return a.semester - b.semester
    const sa = String(a.subjectName).localeCompare(String(b.subjectName))
    if (sa !== 0) return sa
    if (a.examYear !== b.examYear) return b.examYear - a.examYear
    return String(a.examMonth).localeCompare(String(b.examMonth))
  })
}

export interface PrepPaperFilters {
  program?: string
  semester?: number | string
  university?: string
  year?: number | string
  subjectId?: string
  scheme?: string
  /** Free-text match on subject name / paper code / tags. */
  q?: string
}

export function filterPrepPapers<T extends Pick<PrepPaper, 'program' | 'semester' | 'universityCode' | 'examYear' | 'prepSubjectId' | 'scheme' | 'subjectName' | 'paperCode' | 'tags' | 'legacyProgram'>>(
  papers: T[],
  filters: PrepPaperFilters
): T[] {
  let out = [...papers]
  const program = String(filters.program || '').toLowerCase().trim()
  if (program) {
    const legacy = PREP_PAPER_LEGACY_PROGRAMS[program]
    out = out.filter((p) => (legacy ? p.legacyProgram === program : p.program === program))
  }
  const sem = Number(filters.semester)
  if (filters.semester !== undefined && filters.semester !== '' && Number.isFinite(sem)) {
    out = out.filter((p) => Number(p.semester) === sem)
  }
  const uni = String(filters.university || '').toLowerCase().trim()
  if (uni) out = out.filter((p) => p.universityCode === uni)
  const year = Number(filters.year)
  if (filters.year !== undefined && filters.year !== '' && Number.isFinite(year)) {
    out = out.filter((p) => Number(p.examYear) === year)
  }
  const subjectId = String(filters.subjectId || '').trim()
  if (subjectId) out = out.filter((p) => p.prepSubjectId === subjectId)
  const scheme = String(filters.scheme || '').toLowerCase().trim()
  if (scheme) out = out.filter((p) => String(p.scheme).toLowerCase().includes(scheme))
  const q = String(filters.q || '').toLowerCase().trim()
  if (q) {
    out = out.filter(
      (p) =>
        String(p.subjectName).toLowerCase().includes(q) ||
        String(p.paperCode || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => String(t).toLowerCase().includes(q))
    )
  }
  return out
}

/** Facets for the library filters — computed over the papers the caller may see. */
export function prepPaperFacets(papers: Array<Pick<PrepPaper, 'universityCode' | 'universityName' | 'examYear' | 'semester' | 'program' | 'legacyProgram'>>): {
  universities: Array<{ code: string; name: string; count: number }>
  years: number[]
  semesters: number[]
  programs: Array<{ code: string; count: number }>
} {
  const uni = new Map<string, { code: string; name: string; count: number }>()
  const years = new Set<number>()
  const sems = new Set<number>()
  const programs = new Map<string, number>()
  for (const p of papers) {
    const u = uni.get(p.universityCode) || { code: p.universityCode, name: p.universityName, count: 0 }
    u.count += 1
    uni.set(p.universityCode, u)
    years.add(Number(p.examYear))
    sems.add(Number(p.semester))
    programs.set(p.program, (programs.get(p.program) || 0) + 1)
    if (p.legacyProgram) programs.set(p.legacyProgram, (programs.get(p.legacyProgram) || 0) + 1)
  }
  return {
    universities: Array.from(uni.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    years: Array.from(years).sort((a, b) => b - a),
    semesters: Array.from(sems).sort((a, b) => a - b),
    programs: Array.from(programs.entries()).map(([code, count]) => ({ code, count })),
  }
}

// ─── Integrity validation ────────────────────────────────────────────────────

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Verifies a bundle of papers before it is written:
 *  - unique, URL-safe ids; known program and university codes
 *  - sensible semester / year / duration / max-marks values
 *  - every section has a rubric, ≥1 question, marksEach > 0, answerCount ≤ questions
 *  - section totals add up to the paper's maximum marks
 *  - every question has a label and real text; labels unique inside a paper
 *  - a public source (title, http(s) URL, publisher, ISO retrieval date)
 *  - prepSubjectId (when given) resolves against the known study packs
 */
export function validatePrepPapers(
  papers: PrepPaper[],
  opts: { knownSubjectIds?: Iterable<string> | Set<string>; now?: Date } = {}
): CatalogIntegrityReport {
  const issues: CatalogIssue[] = []
  const err = (code: string, message: string) => issues.push({ level: 'error', code, message })
  const warn = (code: string, message: string) => issues.push({ level: 'warning', code, message })
  const known = opts.knownSubjectIds instanceof Set ? opts.knownSubjectIds : new Set(opts.knownSubjectIds || [])
  const maxYear = (opts.now || new Date()).getFullYear() + 1
  const programCodes = PREP_PROGRAM_CATALOG.map((p) => p.code)
  const ids = new Set<string>()
  let questionCount = 0

  for (const p of Array.isArray(papers) ? papers : []) {
    const tag = p?.id || p?.subjectName || '?'
    if (!p?.id || !ID_RE.test(p.id)) {
      err('PAPER_BAD_ID', `Paper "${tag}" needs a lowercase URL-safe id.`)
      continue
    }
    if (ids.has(p.id)) err('DUPLICATE_PAPER_ID', `Duplicate paper id "${p.id}".`)
    ids.add(p.id)

    if (!programCodes.includes(p.program)) err('PAPER_BAD_PROGRAM', `Paper "${p.id}" program "${p.program}" is not in the prep catalogue.`)
    if (p.legacyProgram && !PREP_PAPER_LEGACY_PROGRAMS[p.legacyProgram]) {
      err('PAPER_BAD_LEGACY_PROGRAM', `Paper "${p.id}" legacy program "${p.legacyProgram}" is unknown.`)
    }
    if (!PREP_PAPER_UNIVERSITY_CODES.includes(p.universityCode)) {
      err('PAPER_BAD_UNIVERSITY', `Paper "${p.id}" university "${p.universityCode}" is not in the university list.`)
    }
    if (!p.scheme || !String(p.scheme).trim()) err('PAPER_NO_SCHEME', `Paper "${p.id}" has no scheme label.`)
    if (!Number.isInteger(p.semester) || p.semester < 1 || p.semester > 10) {
      err('PAPER_BAD_SEMESTER', `Paper "${p.id}" semester must be 1–10.`)
    }
    if (!p.subjectName || String(p.subjectName).trim().length < 3) err('PAPER_NO_SUBJECT', `Paper "${p.id}" needs a subject name.`)
    if (!Number.isInteger(p.examYear) || p.examYear < 2005 || p.examYear > maxYear) {
      err('PAPER_BAD_YEAR', `Paper "${p.id}" exam year ${p.examYear} is outside 2005–${maxYear}.`)
    }
    if (!p.examMonth || !String(p.examMonth).trim()) err('PAPER_NO_MONTH', `Paper "${p.id}" needs the exam month printed on the paper.`)
    if (!(Number(p.durationMinutes) >= 60 && Number(p.durationMinutes) <= 240)) {
      err('PAPER_BAD_DURATION', `Paper "${p.id}" duration ${p.durationMinutes} min is implausible.`)
    }
    if (!(Number(p.maxMarks) > 0)) err('PAPER_BAD_MAX_MARKS', `Paper "${p.id}" maximum marks must be positive.`)

    const sections = Array.isArray(p.sections) ? p.sections : []
    if (sections.length === 0) err('PAPER_NO_SECTIONS', `Paper "${p.id}" has no sections.`)
    const labels = new Set<string>()
    const sectionIds = new Set<string>()
    let total = 0
    let count = 0
    for (const s of sections) {
      const sid = String(s?.id || '').trim()
      if (!sid) err('SECTION_NO_ID', `Paper "${p.id}" has a section without an id.`)
      if (sectionIds.has(sid)) err('DUPLICATE_SECTION_ID', `Paper "${p.id}" repeats section "${sid}".`)
      sectionIds.add(sid)
      if (!s?.instruction || String(s.instruction).trim().length < 10) {
        err('SECTION_NO_RUBRIC', `Paper "${p.id}" section ${sid} needs its answering instruction.`)
      }
      const qs = Array.isArray(s?.questions) ? s.questions : []
      if (qs.length === 0) err('SECTION_EMPTY', `Paper "${p.id}" section ${sid} has no questions.`)
      if (!(Number(s?.marksEach) > 0)) err('SECTION_BAD_MARKS', `Paper "${p.id}" section ${sid} marksEach must be positive.`)
      if (Number(s?.answerCount) > qs.length) {
        err('SECTION_ANSWER_COUNT', `Paper "${p.id}" section ${sid} asks for ${s.answerCount} answers but lists ${qs.length} questions.`)
      }
      const attempted = Number(s?.answerCount) > 0 ? Number(s.answerCount) : qs.length
      const expectedTotal = attempted * Number(s?.marksEach || 0)
      if (Number(s?.totalMarks) !== expectedTotal) {
        err('SECTION_TOTAL_MISMATCH', `Paper "${p.id}" section ${sid} totalMarks ${s?.totalMarks} ≠ ${attempted} × ${s?.marksEach}.`)
      }
      total += Number(s?.totalMarks) || 0
      for (const q of qs) {
        count += 1
        const label = String(q?.label || '').trim()
        if (!label) err('QUESTION_NO_LABEL', `Paper "${p.id}" section ${sid} has a question without a label.`)
        if (labels.has(label)) warn('QUESTION_DUPLICATE_LABEL', `Paper "${p.id}" repeats question label "${label}".`)
        labels.add(label)
        if (!q?.text || String(q.text).trim().length < 8) {
          err('QUESTION_THIN_TEXT', `Paper "${p.id}" question ${label || '?'} text is missing or under 8 characters.`)
        }
        if (q?.marks !== undefined && !(Number(q.marks) > 0)) {
          err('QUESTION_BAD_MARKS', `Paper "${p.id}" question ${label} has non-positive marks.`)
        }
      }
    }
    if (sections.length > 0 && total !== Number(p.maxMarks)) {
      err('PAPER_MARKS_MISMATCH', `Paper "${p.id}" sections add up to ${total} marks but maxMarks is ${p.maxMarks}.`)
    }
    if (Number(p.questionCount) !== count) {
      err('PAPER_QUESTION_COUNT', `Paper "${p.id}" questionCount ${p.questionCount} ≠ ${count} questions listed.`)
    }
    if (count > 0 && count < 8) warn('PAPER_FEW_QUESTIONS', `Paper "${p.id}" lists only ${count} questions — check the transcription is complete.`)
    questionCount += count

    const src = p.source
    if (!src || !src.title || !src.publisher) err('PAPER_NO_SOURCE', `Paper "${p.id}" must cite the public source it was transcribed from.`)
    if (!src || !/^https?:\/\/\S+$/i.test(String(src.url || ''))) err('PAPER_BAD_SOURCE_URL', `Paper "${p.id}" source URL must be http(s).`)
    if (!src || !src.retrievedOn || Number.isNaN(Date.parse(src.retrievedOn))) {
      err('PAPER_BAD_RETRIEVED_DATE', `Paper "${p.id}" source.retrievedOn must be an ISO date.`)
    }
    if (p.prepSubjectId && known.size > 0 && !known.has(p.prepSubjectId)) {
      warn('PAPER_UNKNOWN_SUBJECT', `Paper "${p.id}" links study pack "${p.prepSubjectId}" which is not in the seeded catalogue.`)
    }
    if (p.status !== 'published' && p.status !== 'draft') err('PAPER_BAD_STATUS', `Paper "${p.id}" status must be draft or published.`)
  }

  const errorCount = issues.filter((i) => i.level === 'error').length
  const warningCount = issues.length - errorCount
  return {
    programCode: PREP_PAPER_SEED_CODE,
    subjectCount: ids.size,
    topicCount: 0,
    questionCount,
    issues,
    errorCount,
    warningCount,
    valid: errorCount === 0,
  }
}

/**
 * Accepts either a stored PrepPaper or a compact PrepPaperSeed from the
 * studio's JSON editor and returns a normalised, validated document.
 */
export function normalisePrepPaperInput(raw: unknown): { paper: PrepPaper | null; report: CatalogIntegrityReport } {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const isSeed = !Array.isArray(obj.sections) || obj.sections.some((s: any) => s && !('questions' in s && 'totalMarks' in s))
  let paper: PrepPaper
  if (isSeed) {
    paper = expandPrepPaperSeed({
      id: String(obj.id || ''),
      program: String(obj.program || ''),
      legacyProgram: obj.legacyProgram ? String(obj.legacyProgram) : undefined,
      university: String(obj.university || obj.universityCode || ''),
      scheme: String(obj.scheme || ''),
      semester: Number(obj.semester),
      subject: String(obj.subject || obj.subjectName || ''),
      subjectArea: obj.subjectArea ? String(obj.subjectArea) : undefined,
      paperCode: obj.paperCode ? String(obj.paperCode) : undefined,
      paperNumber: obj.paperNumber ? String(obj.paperNumber) : undefined,
      examMonth: String(obj.examMonth || ''),
      examYear: Number(obj.examYear),
      durationMinutes: Number(obj.durationMinutes),
      maxMarks: Number(obj.maxMarks),
      instructions: Array.isArray(obj.instructions) ? obj.instructions.map(String) : undefined,
      sections: Array.isArray(obj.sections) ? obj.sections : [],
      prepSubjectId: obj.prepSubjectId ? String(obj.prepSubjectId) : undefined,
      tags: Array.isArray(obj.tags) ? obj.tags.map(String) : undefined,
      source: {
        title: String(obj.source?.title || ''),
        url: String(obj.source?.url || ''),
        publisher: String(obj.source?.publisher || ''),
        retrievedOn: String(obj.source?.retrievedOn || ''),
        ...(obj.source?.note ? { note: String(obj.source.note) } : {}),
      },
    })
    if (obj.status === 'draft') paper.status = 'draft'
  } else {
    const uni = getPrepPaperUniversity(obj.universityCode)
    paper = {
      ...(obj as PrepPaper),
      id: String(obj.id || ''),
      program: String(obj.program || '').toLowerCase(),
      universityCode: String(obj.universityCode || '').toLowerCase(),
      universityName: uni?.name || String(obj.universityName || obj.universityCode || ''),
      examLabel: `${obj.examMonth} ${obj.examYear}`,
      questionCount: (obj.sections as PrepPaperSection[]).reduce((n, s) => n + (Array.isArray(s.questions) ? s.questions.length : 0), 0),
      tags: Array.isArray(obj.tags) ? obj.tags.map((t: unknown) => String(t).toLowerCase()) : [],
      language: 'en',
      status: obj.status === 'draft' ? 'draft' : 'published',
      tier: obj.tier === 'premium' ? 'premium' : 'free',
      contentVersion: Number(obj.contentVersion) || 1,
    }
  }
  const report = validatePrepPapers([paper])
  return { paper: report.valid ? paper : null, report }
}
