// ─────────────────────────────────────────────────────────────────────────────
// Auto curriculum ↔ faculty mapping
//
// WHY THIS EXISTS
// Mapping every course of an assigned curriculum to a faculty member is today
// a manual, one-by-one exercise for the principal/HOD (the Mappings dialog on
// the Admin → Curriculum page writes one curriculumFacultyMappings row at a
// time). For a 15-course semester with 12 faculty that is hours of pointing
// and clicking.
//
// THE ALGORITHM (deterministic, explainable, preview-before-write)
//   1. LOAD      — every faculty's current weekly teaching load is computed
//                  from the college's ACTIVE mappings (all curricula, all
//                  batches). totalHours is converted to periods/week with a
//                  configurable semester length (default 15 weeks).
//   2. SCORE     — each (faculty, course) pair gets 0–100 points:
//                        subject fit     50   token overlap of the course name
//                                           against the faculty's listed UG/PG
//                                           subjects + specialization
//                        branch fit      15   faculty.branches / department
//                                           vs the curriculum branch
//                        experience      10   years of service, capped at 10
//                        balance         25   headroom: less loaded faculty
//                                           score higher (load smoothing)
//   3. ASSIGN    — courses are processed most-constrained-first (fewest
//                  eligible candidates first, then heavier courses), each
//                  going to the highest-scoring faculty who is not already
//                  mapped to that course in this batch and who stays within
//                  the weekly capacity (default 24 periods/week — UGC regular
//                  faculty). If nobody fits, the best faculty is still
//                  proposed but flagged `overload-risk` so the HOD can see
//                  the compromise instead of a silent unassigned course.
//   4. REVIEW    — `autoMapCurriculum` only RETURNS proposals (scores,
//                  per-point reasons, flags). `applyAutoMapping` writes the
//                  HOD-approved subset as ordinary active mappings
//                  (stamped autoMapped + autoMapScore for audit).
//
// Both callables reuse resolveSchedulingStaff (superadmin/admin/principal/hod,
// college from the auth claim — the client never names its own tenant).
// The pure core (runAutoMapping + helpers) is unit tested with zero
// Firestore.
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { resolveSchedulingStaff } from './classSchedule'

// ═════════════════════════════════════════════════════════════════════════════
// Pure core
// ═════════════════════════════════════════════════════════════════════════════

export const AUTO_MAP_WEIGHTS = {
  subject: 50,
  branch: 15,
  experience: 10,
  balance: 25,
} as const

/** UGC regular-faculty teaching load, periods per week. */
export const DEFAULT_CAPACITY_WEEKLY_HOURS = 24
/** Assumed instructional weeks per semester when converting course hours. */
export const DEFAULT_SEMESTER_WEEKS = 15

export interface AutoMapFaculty {
  uid: string
  profileId: string
  name: string
  email: string
  department: string
  branches: string[]
  specialization: string
  subjectsUG: string[]
  subjectsPG: string[]
  experienceYears: number
}

export interface AutoMapCourse {
  id: string
  code: string
  name: string
  credits: number
  totalHours: number | null
  semester: number
  branch: string
  modulesCount: number
}

/** An ACTIVE curriculumFacultyMappings row, flattened for the pure core. */
export interface AutoMapExistingMapping {
  curriculumId: string
  courseId: string
  courseCode: string
  courseName: string
  facultyId: string
  facultyEmail?: string | null
  branch: string
  semester: number
  batch: string
  division?: string | null
  section?: string | null
  totalHours: number
}

export interface AutoMapOptions {
  curriculumId: string
  branch: string
  batch: string
  division?: string | null
  section?: string | null
  /** Faculty weekly capacity in periods/week. Default DEFAULT_CAPACITY_WEEKLY_HOURS. */
  capacity?: number
  /** Weeks per semester for the totalHours → weekly conversion. Default 15. */
  semesterWeeks?: number
  courses: AutoMapCourse[]
  faculty: AutoMapFaculty[]
  /** Every active mapping in the college (drives load + dedupe). */
  existing: AutoMapExistingMapping[]
}

export type AutoMapFlag = 'overload-risk' | 'no-subject-match'

export interface AutoMapScoreBreakdown {
  subject: number
  branch: number
  experience: number
  balance: number
}

export interface AutoMapProposal {
  courseId: string
  courseCode: string
  courseName: string
  credits: number
  totalHours: number
  hoursPerWeek: number
  faculty: { uid: string; profileId: string; name: string; email: string } | null
  score: number
  breakdown: AutoMapScoreBreakdown
  reasons: string[]
  flags: AutoMapFlag[]
  status: 'proposed' | 'unassigned'
}

export interface AutoMapFacultyLoad {
  uid: string
  name: string
  currentWeeklyHours: number
  proposedWeeklyHours: number
  totalWeeklyHours: number
  capacity: number
}

export interface AutoMapResult {
  curriculumId: string
  branch: string
  batch: string
  division: string
  section: string
  capacity: number
  semesterWeeks: number
  generatedAt: string
  proposals: AutoMapProposal[]
  summary: {
    totalCourses: number
    proposed: number
    unassigned: number
    overloadFlags: number
    facultyInvolved: number
  }
  facultyLoad: AutoMapFacultyLoad[]
}

// ─── Text normalisation ──────────────────────────────────────────────────────

const STOP_WORDS = new Set(['of', 'the', 'and', 'for', 'in', 'on', 'a', 'an', 'to', 'with'])

/** "Financial Accounting I", "Economics III" — part markers, not content. */
const ROMAN_NUMERALS = /^(?:i{1,3}|iv|v|vi{1,3}|ix|x)$/i

const SYNONYMS: Record<string, string> = {
  math: 'mathematics',
  maths: 'mathematics',
  comp: 'computer',
  mgmt: 'management',
  fin: 'finance',
  com: 'commerce',
  sc: 'science',
}

/** Lower-case, punctuation-free, single-spaced form of any value. */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularize(token: string): string {
  if (token.length > 3 && token.endsWith('ies')) return token.slice(0, -3) + 'y'
  if (token.length > 3 && token.endsWith('es') && !token.endsWith('ss')) return token.slice(0, -2)
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

/**
 * Meaningful tokens of a name/branch: stopwords dropped, plurals folded,
 * common abbreviations expanded (com→commerce, sc→science, math→mathematics).
 * Both sides of every comparison run through this, so only consistency
 * matters — not dictionary quality.
 */
export function significantTokens(value: unknown): string[] {
  const seen = new Set<string>()
  for (const raw of normalizeText(value).split(' ')) {
    // Single letters ("i", "b", "x") and roman part-markers are noise in
    // course/subject names — dropping them keeps both sides comparable.
    if (!raw || raw.length === 1 || STOP_WORDS.has(raw) || ROMAN_NUMERALS.test(raw)) continue
    const folded = SYNONYMS[singularize(raw)] ?? singularize(raw)
    if (folded) seen.add(folded)
  }
  return [...seen]
}

const round1 = (n: number): number => Math.round(n * 10) / 10

/**
 * How much of the course name a single candidate subject string explains,
 * 0..1. Full coverage → 1; one side containing the other → at least 0.8.
 */
export function subjectFitRatio(courseName: string, candidate: string): number {
  const target = significantTokens(courseName)
  if (target.length === 0) return 0
  const candTokens = significantTokens(candidate)
  if (candTokens.length === 0) return 0
  const targetSet = new Set(target)
  const hits = candTokens.filter((t) => targetSet.has(t)).length
  let ratio = hits / target.length
  const course = normalizeText(courseName)
  const cand = normalizeText(candidate)
  if (cand.length >= 3 && (course.includes(cand) || cand.includes(course))) {
    ratio = Math.max(ratio, 0.8)
  }
  return ratio
}

/** Course total hours → periods per week (≥1). Falls back to credits×4. */
export function hoursPerWeek(
  course: Pick<AutoMapCourse, 'totalHours' | 'credits'>,
  semesterWeeks: number,
): number {
  const weeks = Math.max(1, Math.floor(semesterWeeks))
  if (course.totalHours && course.totalHours > 0) {
    return Math.max(1, Math.round(course.totalHours / weeks))
  }
  return Math.max(1, Math.round((course.credits || 0) * 4))
}

function branchFitPoints(branch: string, faculty: AutoMapFaculty): number {
  const bTokens = significantTokens(branch)
  if (bTokens.length === 0) return 0
  for (const fb of faculty.branches) {
    if (normalizeText(fb) === normalizeText(branch)) return AUTO_MAP_WEIGHTS.branch
    const fTokens = significantTokens(fb)
    if (bTokens.some((t) => fTokens.includes(t))) return 8
  }
  const dTokens = significantTokens(faculty.department)
  if (dTokens.length > 0) {
    if (normalizeText(faculty.department) === normalizeText(branch)) return 10
    if (bTokens.some((t) => dTokens.includes(t))) return 5
  }
  return 0
}

export interface FacultyScore {
  faculty: AutoMapFaculty
  score: number
  breakdown: AutoMapScoreBreakdown
  reasons: string[]
}

/** Score one faculty for one course at one current load level. */
export function scoreFacultyForCourse(
  faculty: AutoMapFaculty,
  course: AutoMapCourse,
  branch: string,
  currentWeekly: number,
  capacity: number,
): FacultyScore {
  const candidates = [
    ...faculty.subjectsUG,
    ...faculty.subjectsPG,
    faculty.specialization,
  ].filter((s) => typeof s === 'string' && s.trim().length > 0)

  let bestRatio = 0
  let bestSubject = ''
  for (const s of candidates) {
    const r = subjectFitRatio(course.name, s)
    if (r > bestRatio) {
      bestRatio = r
      bestSubject = s
    }
  }

  const subject = round1(bestRatio * AUTO_MAP_WEIGHTS.subject)
  const branchPts = branchFitPoints(branch, faculty)
  const experience = Math.min(AUTO_MAP_WEIGHTS.experience, Math.max(0, faculty.experienceYears))
  const headroom = capacity > 0 ? Math.min(1, Math.max(0, 1 - currentWeekly / capacity)) : 1
  const balance = round1(AUTO_MAP_WEIGHTS.balance * headroom)
  const score = round1(subject + branchPts + experience + balance)

  const reasons: string[] = []
  reasons.push(
    bestSubject
      ? `Subject match: ${bestSubject} (${subject}/${AUTO_MAP_WEIGHTS.subject})`
      : `No listed subject matches "${course.name}" (0/${AUTO_MAP_WEIGHTS.subject})`,
  )
  reasons.push(
    branchPts === AUTO_MAP_WEIGHTS.branch
      ? `Teaches this branch (${branchPts}/${AUTO_MAP_WEIGHTS.branch})`
      : branchPts > 0
        ? `Branch/department related (${branchPts}/${AUTO_MAP_WEIGHTS.branch})`
        : `No branch fit (0/${AUTO_MAP_WEIGHTS.branch})`,
  )
  reasons.push(`Experience: ${faculty.experienceYears} yrs (${experience}/${AUTO_MAP_WEIGHTS.experience})`)
  reasons.push(
    `Load: ${round1(currentWeekly)}/${capacity} weekly hrs before this course (${balance}/${AUTO_MAP_WEIGHTS.balance})`,
  )

  return { faculty, score, breakdown: { subject, branch: branchPts, experience, balance }, reasons }
}

// ─── Mapping identity & dedupe keys ─────────────────────────────────────────

function mappingKey(
  courseCode: string,
  branch: string,
  semester: number,
  batch: string,
  division: string,
  section: string,
): string {
  return [courseCode, branch, semester, batch, division, section]
    .map((v) => String(v ?? '').trim().toLowerCase())
    .join('|')
}

/**
 * Greedy, most-constrained-first assignment. Fully deterministic: ties break
 * on score → name → email, so the same input always produces the same plan.
 */
export function runAutoMapping(options: AutoMapOptions): AutoMapResult {
  const capacity =
    options.capacity && options.capacity > 0 ? options.capacity : DEFAULT_CAPACITY_WEEKLY_HOURS
  const semesterWeeks =
    options.semesterWeeks && options.semesterWeeks > 0 ? options.semesterWeeks : DEFAULT_SEMESTER_WEEKS
  const batch = (options.batch || '').trim().toLowerCase()
  const division = (options.division ?? '').trim().toLowerCase()
  const section = (options.section ?? '').trim().toLowerCase()

  // uid lookup across every identity a mapping may carry (uid, profile id, email).
  const identity = new Map<string, string>()
  for (const f of options.faculty) {
    if (!f.uid) continue
    identity.set(f.uid.trim().toLowerCase(), f.uid)
    if (f.profileId) identity.set(f.profileId.trim().toLowerCase(), f.uid)
    if (f.email) identity.set(f.email.trim().toLowerCase(), f.uid)
  }

  const resolveUid = (m: { facultyId: string; facultyEmail?: string | null }): string | undefined => {
    const byId = identity.get(String(m.facultyId || '').trim().toLowerCase())
    if (byId) return byId
    const email = String(m.facultyEmail ?? '').trim().toLowerCase()
    return email ? identity.get(email) : undefined
  }

  // Current weekly load from every active mapping in the college.
  const load = new Map<string, number>()
  for (const m of options.existing) {
    const uid = resolveUid(m)
    if (!uid) continue
    load.set(
      uid,
      (load.get(uid) ?? 0) + hoursPerWeek({ totalHours: m.totalHours, credits: 0 }, semesterWeeks),
    )
  }
  const initialLoad = new Map(load)

  // Who already teaches which course in this exact batch/division/section.
  const taken = new Map<string, Set<string>>()
  for (const m of options.existing) {
    const uid = resolveUid(m)
    if (!uid) continue
    if ((m.batch || '').trim().toLowerCase() !== batch) continue
    if (String(m.division ?? '').trim().toLowerCase() !== division) continue
    if (String(m.section ?? '').trim().toLowerCase() !== section) continue
    const key = mappingKey(m.courseCode, m.branch, m.semester, batch, division, section)
    const set = taken.get(key) ?? new Set<string>()
    set.add(uid)
    taken.set(key, set)
  }

  const courseKey = (c: AutoMapCourse): string =>
    mappingKey(c.code, c.branch || options.branch, c.semester, batch, division, section)

  const candidatesFor = (c: AutoMapCourse): AutoMapFaculty[] => {
    const blocked = taken.get(courseKey(c)) ?? new Set<string>()
    return options.faculty.filter((f) => !blocked.has(f.uid))
  }

  // Most-constrained-first: fewest candidates, then heavier courses, then a
  // stable (semester, code, name) tiebreak.
  const ordered = [...options.courses].sort((a, b) => {
    const ca = candidatesFor(a).length
    const cb = candidatesFor(b).length
    if (ca !== cb) return ca - cb
    const ha = hoursPerWeek(a, semesterWeeks)
    const hb = hoursPerWeek(b, semesterWeeks)
    if (ha !== hb) return hb - ha
    if (a.semester !== b.semester) return a.semester - b.semester
    if (a.code !== b.code) return a.code.localeCompare(b.code)
    return a.name.localeCompare(b.name)
  })

  const byCourse = new Map<string, AutoMapProposal>()
  for (const course of ordered) {
    const hpp = hoursPerWeek(course, semesterWeeks)
    const base = {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      totalHours: course.totalHours ?? 0,
      hoursPerWeek: hpp,
    }

    const candidates = candidatesFor(course)
    if (candidates.length === 0) {
      byCourse.set(course.id, {
        ...base,
        faculty: null,
        score: 0,
        breakdown: { subject: 0, branch: 0, experience: 0, balance: 0 },
        reasons:
          options.faculty.length === 0
            ? ['No active faculty found in the college']
            : ['Every faculty is already mapped to this course in this batch'],
        flags: [],
        status: 'unassigned',
      })
      continue
    }

    const scored = candidates.map((f) =>
      scoreFacultyForCourse(f, course, options.branch, load.get(f.uid) ?? 0, capacity),
    )
    const fits = scored.filter((s) => (load.get(s.faculty.uid) ?? 0) + hpp <= capacity)
    const pool = fits.length > 0 ? fits : scored
    pool.sort(
      (a, b) =>
        b.score - a.score ||
        a.faculty.name.localeCompare(b.faculty.name) ||
        a.faculty.email.localeCompare(b.faculty.email),
    )
    const best = pool[0]
    const flags: AutoMapFlag[] = []
    if ((load.get(best.faculty.uid) ?? 0) + hpp > capacity) flags.push('overload-risk')
    if (best.breakdown.subject < 15) flags.push('no-subject-match')
    load.set(best.faculty.uid, (load.get(best.faculty.uid) ?? 0) + hpp)

    byCourse.set(course.id, {
      ...base,
      faculty: {
        uid: best.faculty.uid,
        profileId: best.faculty.profileId,
        name: best.faculty.name,
        email: best.faculty.email,
      },
      score: best.score,
      breakdown: best.breakdown,
      reasons: best.reasons,
      flags,
      status: 'proposed',
    })
  }

  // Restore the input course order for a stable, readable preview.
  const proposals: AutoMapProposal[] = []
  for (const c of options.courses) {
    const p = byCourse.get(c.id)
    if (p) proposals.push(p)
  }

  const unassigned = proposals.filter((p) => p.status === 'unassigned')
  const facultyLoad: AutoMapFacultyLoad[] = options.faculty
    .map((f) => {
      const current = round1(initialLoad.get(f.uid) ?? 0)
      const total = round1(load.get(f.uid) ?? 0)
      return {
        uid: f.uid,
        name: f.name,
        currentWeeklyHours: current,
        proposedWeeklyHours: round1(Math.max(0, total - current)),
        totalWeeklyHours: total,
        capacity,
      }
    })
    .filter((f) => f.currentWeeklyHours > 0 || f.proposedWeeklyHours > 0)
    .sort((a, b) => b.totalWeeklyHours - a.totalWeeklyHours || a.name.localeCompare(b.name))

  return {
    curriculumId: options.curriculumId,
    branch: options.branch,
    batch: options.batch,
    division: options.division ?? '',
    section: options.section ?? '',
    capacity,
    semesterWeeks,
    generatedAt: new Date().toISOString(),
    proposals,
    summary: {
      totalCourses: options.courses.length,
      proposed: proposals.length - unassigned.length,
      unassigned: unassigned.length,
      overloadFlags: proposals.filter((p) => p && p.flags.includes('overload-risk')).length,
      facultyInvolved: new Set(
        proposals.filter((p) => p && p.faculty).map((p) => p.faculty!.uid),
      ).size,
    },
    facultyLoad,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Payload validation (pure — throws HttpsError)
// ═════════════════════════════════════════════════════════════════════════════

export interface AutoMapPayload {
  curriculumId: string
  batch: string
  division: string
  section: string
  capacity: number
  semesterWeeks: number
  collegeId: string
  /** apply only: restrict writes to these course ids (empty = all proposed). */
  courseIds: string[]
}

function optBoundedString(value: unknown, field: string, maximum: number): string {
  if (value === undefined || value === null || value === '') return ''
  const trimmed = String(value).trim()
  if (trimmed.length > maximum) throw new HttpsError('invalid-argument', `${field} is invalid`)
  return trimmed
}

function optBoundedNumber(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new HttpsError('invalid-argument', `${field} must be a number between ${min} and ${max}`)
  }
  return n
}

export function validateAutoMapPayload(
  data: unknown,
  role: string,
  claimCollegeId: string,
): AutoMapPayload {
  const raw = (data || {}) as Record<string, unknown>
  const curriculumId = String(raw.curriculumId ?? '').trim()
  if (!curriculumId || curriculumId.length > 100) {
    throw new HttpsError('invalid-argument', 'curriculumId is required')
  }
  const batch = String(raw.batch ?? '').trim()
  if (!batch || batch.length > 50) {
    throw new HttpsError('invalid-argument', 'batch is required (e.g. 2026)')
  }
  // Superadmin targets a college explicitly; everyone else is pinned to the
  // claim — same contract as the schedule callables.
  const collegeId = role === 'superadmin' ? String(raw.collegeId ?? '').trim() : claimCollegeId
  if (!collegeId) {
    throw new HttpsError('invalid-argument', 'No college is associated with this account')
  }
  const courseIds = Array.isArray(raw.courseIds)
    ? raw.courseIds.map((v) => String(v).trim()).filter(Boolean).slice(0, 200)
    : []
  return {
    curriculumId,
    batch,
    division: optBoundedString(raw.division, 'division', 50),
    section: optBoundedString(raw.section, 'section', 50),
    capacity: optBoundedNumber(raw.capacity, 'capacity', DEFAULT_CAPACITY_WEEKLY_HOURS, 1, 60),
    semesterWeeks: optBoundedNumber(raw.semesterWeeks, 'semesterWeeks', DEFAULT_SEMESTER_WEEKS, 4, 30),
    collegeId,
    courseIds,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Data assembly (Firestore → pure-core inputs)
// ═════════════════════════════════════════════════════════════════════════════

const MAX_FACULTY_READ = 500
const MAX_MAPPINGS_READ = 1000

function normalizeSubjectList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim()
      if (entry && typeof entry === 'object') {
        const o = entry as Record<string, unknown>
        return String(o.name ?? o.subjectName ?? o.code ?? '').trim()
      }
      return ''
    })
    .filter(Boolean)
}

function toAutoMapFaculty(snap: admin.firestore.QueryDocumentSnapshot): AutoMapFaculty | null {
  const d = snap.data() as Record<string, unknown>
  if (String(d.status ?? 'active') === 'inactive') return null
  const uid = String(d.uid ?? '').trim()
  if (!uid) return null
  const name =
    String(d.name ?? '').trim() ||
    `${String(d.firstName ?? '').trim()} ${String(d.lastName ?? '').trim()}`.trim() ||
    snap.id
  return {
    uid,
    profileId: snap.id,
    name,
    email: String(d.email ?? '').trim(),
    department: String(d.department ?? '').trim(),
    branches: Array.isArray(d.branches)
      ? d.branches.map((b) => String(b).trim()).filter(Boolean)
      : String(d.department ?? '').trim()
        ? [String(d.department).trim()]
        : [],
    specialization: String(d.specialization ?? '').trim(),
    subjectsUG: normalizeSubjectList(d.subjectsUG),
    subjectsPG: normalizeSubjectList(d.subjectsPG),
    experienceYears: Number(d.experienceYears ?? 0) || 0,
  }
}

function toExistingMapping(snap: admin.firestore.QueryDocumentSnapshot): AutoMapExistingMapping {
  const d = snap.data() as Record<string, unknown>
  return {
    curriculumId: String(d.curriculumId ?? ''),
    courseId: String(d.courseId ?? ''),
    courseCode: String(d.courseCode ?? ''),
    courseName: String(d.courseName ?? ''),
    facultyId: String(d.facultyId ?? ''),
    facultyEmail: typeof d.facultyEmail === 'string' ? d.facultyEmail : null,
    branch: String(d.branch ?? ''),
    semester: Number(d.semester ?? 0),
    batch: String(d.batch ?? ''),
    division: d.division == null ? null : String(d.division),
    section: d.section == null ? null : String(d.section),
    totalHours: Number(d.totalHours ?? 0) || 0,
  }
}

function toAutoMapCourses(curriculum: Record<string, unknown>): {
  branch: string
  courses: AutoMapCourse[]
} {
  const branch = String(curriculum.branch ?? '').trim()
  const coursesRaw = Array.isArray(curriculum.courses) ? curriculum.courses : []
  const courses: AutoMapCourse[] = coursesRaw.map((c, i) => {
    const o = (c || {}) as Record<string, unknown>
    return {
      id: String(o.id ?? o.code ?? `course-${i}`),
      code: String(o.code ?? ''),
      name: String(o.name ?? o.shortName ?? `Course ${i + 1}`),
      credits: Number(o.credits ?? 0) || 0,
      totalHours: o.totalHours == null ? null : Number(o.totalHours) || null,
      semester: Number(o.semester ?? curriculum.semester ?? 0) || 0,
      branch: String(o.branch ?? branch),
      modulesCount: Array.isArray(o.modules) ? o.modules.length : 0,
    }
  })
  return { branch, courses }
}

/** Shared read path for preview + apply: one curriculum doc, one roster, one mapping scan. */
async function loadCollegeContext(
  db: admin.firestore.Firestore,
  payload: AutoMapPayload,
): Promise<{
  curriculum: Record<string, unknown>
  faculty: AutoMapFaculty[]
  existing: AutoMapExistingMapping[]
}> {
  const curSnap = await db.collection('curriculum').doc(payload.curriculumId).get()
  if (!curSnap.exists) {
    throw new HttpsError('not-found', 'Curriculum not found')
  }
  const curriculum = curSnap.data() as Record<string, unknown>
  if (String(curriculum.collegeId ?? '') !== payload.collegeId) {
    throw new HttpsError('permission-denied', 'This curriculum belongs to another college')
  }
  if (String(curriculum.status ?? 'active') === 'archived') {
    throw new HttpsError('failed-precondition', 'This curriculum is archived')
  }

  const [facultySnap, mappingsSnap] = await Promise.all([
    db.collection('faculty').where('collegeId', '==', payload.collegeId).limit(MAX_FACULTY_READ).get(),
    db
      .collection('curriculumFacultyMappings')
      .where('collegeId', '==', payload.collegeId)
      .limit(MAX_MAPPINGS_READ)
      .get(),
  ])

  const faculty = facultySnap.docs
    .map(toAutoMapFaculty)
    .filter((f): f is AutoMapFaculty => f !== null)

  // Only live rows feed the pure core — removed/inactive mappings must not
  // count toward load and must not block re-assignment.
  const existing = mappingsSnap.docs
    .filter((d) => {
      const status = String(d.data().status ?? 'active')
      return status !== 'removed' && status !== 'inactive'
    })
    .map(toExistingMapping)

  return { curriculum, faculty, existing }
}

// ═════════════════════════════════════════════════════════════════════════════
// Callables
// ═════════════════════════════════════════════════════════════════════════════

const AUTO_MAP_REGION = { region: 'asia-south1' as const }

/**
 * PREVIEW — computes and returns the mapping plan without writing anything.
 * The admin UI shows scores + reasons; nothing lands in Firestore.
 */
export const autoMapCurriculum = onCall(AUTO_MAP_REGION, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const staff = await resolveSchedulingStaff(uid, request.auth?.token || {})
  const payload = validateAutoMapPayload(request.data, staff.role, staff.collegeId)

  const db = admin.firestore()
  const { curriculum, faculty, existing } = await loadCollegeContext(db, payload)
  const { branch, courses } = toAutoMapCourses(curriculum)

  return runAutoMapping({
    curriculumId: payload.curriculumId,
    branch,
    batch: payload.batch,
    division: payload.division || null,
    section: payload.section || null,
    capacity: payload.capacity,
    semesterWeeks: payload.semesterWeeks,
    courses,
    faculty,
    existing,
  })
})

/**
 * APPLY — recomputes the plan on fresh data and writes the approved subset
 * (courseIds empty = every proposed course) as ordinary active mappings,
 * stamped autoMapped so audits can tell the machine's work from the HOD's.
 */
export const applyAutoMapping = onCall(
  { ...AUTO_MAP_REGION, memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveSchedulingStaff(uid, request.auth?.token || {})
    const payload = validateAutoMapPayload(request.data, staff.role, staff.collegeId)

    const db = admin.firestore()
    const { curriculum, faculty, existing } = await loadCollegeContext(db, payload)
    const { branch, courses } = toAutoMapCourses(curriculum)

    const result = runAutoMapping({
      curriculumId: payload.curriculumId,
      branch,
      batch: payload.batch,
      division: payload.division || null,
      section: payload.section || null,
      capacity: payload.capacity,
      semesterWeeks: payload.semesterWeeks,
      courses,
      faculty,
      existing,
    })

    const wanted = new Set(payload.courseIds)
    const courseById = new Map(courses.map((c) => [c.id, c]))
    const toWrite: AutoMapProposal[] = []
    const skipped: { courseId: string; courseName: string; reason: string }[] = []

    for (const proposal of result.proposals) {
      if (!proposal) continue
      if (wanted.size > 0 && !wanted.has(proposal.courseId)) continue
      const course = courseById.get(proposal.courseId)
      if (!course) {
        skipped.push({ courseId: proposal.courseId, courseName: proposal.courseName, reason: 'Course no longer exists in the curriculum' })
        continue
      }
      if (proposal.status === 'unassigned' || !proposal.faculty) {
        skipped.push({ courseId: proposal.courseId, courseName: proposal.courseName, reason: 'No faculty proposed' })
        continue
      }
      toWrite.push(proposal)
    }

    if (toWrite.length > 400) {
      throw new HttpsError('failed-precondition', 'Too many mappings to apply at once (max 400)')
    }

    if (toWrite.length === 0) {
      return { created: 0, createdCourseNames: [], skipped, result }
    }

    const now = Timestamp.now()
    const batch = db.batch()
    const createdCourseNames: string[] = []
    for (const proposal of toWrite) {
      const course = courseById.get(proposal.courseId)!
      const facultyDoc = faculty.find((f) => f.uid === proposal.faculty!.uid)
      batch.set(db.collection('curriculumFacultyMappings').doc(), {
        curriculumId: payload.curriculumId,
        collegeId: payload.collegeId,
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        facultyId: proposal.faculty!.uid,
        facultyName: facultyDoc?.name ?? proposal.faculty!.name,
        facultyEmail: facultyDoc?.email ?? proposal.faculty!.email ?? null,
        branch: course.branch || branch,
        semester: course.semester,
        batch: payload.batch,
        division: payload.division || null,
        section: payload.section || null,
        totalHours: course.totalHours ?? 0,
        credits: course.credits,
        modulesCount: course.modulesCount,
        assignedAt: now,
        assignedBy: staff.name || staff.uid,
        status: 'active',
        // Provenance: which run produced this row and why it was confident.
        autoMapped: true,
        autoMapScore: proposal.score,
      })
      createdCourseNames.push(course.name)
    }
    await batch.commit()

    return {
      created: toWrite.length,
      createdCourseNames,
      skipped,
      result,
    }
  },
)
