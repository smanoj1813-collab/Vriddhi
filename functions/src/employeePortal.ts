// functions/src/employeePortal.ts
// ─────────────────────────────────────────────────────────────────────────────
// The Internal Employee Portal backend.
//
// Employees are the people a college employs: faculty, HODs, mentors,
// principals and college admins. This module is the single server-side entry
// point for the employee lifecycle — secure provisioning (Auth account +
// custom claims + users/{uid} + role profile + employees directory row, all
// in one audited operation), directory management, day attendance, the
// college question bank, test duplication, CSV exports and the audit trail.
//
// DESIGN RULES
//   * Authorization is claim-first via ./authorization — the client never
//     decides tenancy, and a non-superadmin can never act across colleges.
//   * Every mutation writes an entry to the `logs` collection (the same
//     convention as grantUserRole) so the whole employee lifecycle is
//     auditable from one place.
//   * Pure logic (validation, id schemes, CSV building, duplication maths)
//     lives in exported helpers so it is unit-testable without an emulator —
//     the same convention as classSchedule.ts.
//   * Secrets never leave the function except the one-time password in the
//     provision response, and never enter a log line or audit entry.
// ─────────────────────────────────────────────────────────────────────────────

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {
  generateRandomPassword,
  findAuthUserByEmail,
  isValidEmail,
  normalizeEmail,
  withApiVersion,
  withAuthQuotaRetry,
} from './identityShared'
import {
  AUDIT_READER_ROLES,
  EMPLOYEE_MANAGER_ROLES,
  EMPLOYEE_ROLES,
  buildAuditEntry,
  resolveCaller,
  resolveCollegeScope,
  writeAuditLog,
} from './authorization'

const CALL_OPTS = {
  region: 'asia-south1' as const,
  memory: '256MiB' as const,
  timeoutSeconds: 60,
  minInstances: 0,
  maxInstances: 40,
}

// ═════════════════════════════════════════════════════════════════════════════
// PURE HELPERS — unit-tested in functions/test/employeePortal.test.ts
// ═════════════════════════════════════════════════════════════════════════════

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] }

const clean = (value: unknown, max = 200): string =>
  String(value ?? '').trim().slice(0, max)

const sanitizeKeyPart = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '_')

/** Deterministic directory id: one employee per email per college, so a
 * re-provision updates the same row instead of forking the directory. */
export function employeeDocId(collegeId: string, email: string): string {
  return `emp_${sanitizeKeyPart(collegeId)}__${sanitizeKeyPart(normalizeEmail(email))}`
}

/** Password policy for employee accounts. Firebase Auth's own minimum is 6
 * characters; the portal holds a higher line because these are shared-office
 * credentials read out loud during onboarding. */
export function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = []
  if (password.length < 10) errors.push('Password must be at least 10 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must contain a digit')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain a symbol')
  return errors
}

export const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended'] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export interface EmployeeFields {
  email: string
  name: string
  role: (typeof EMPLOYEE_ROLES)[number]
  department: string
  designation: string
  phone: string
  employmentType: string
  joiningDate: string
  qualification: string
  specialization: string
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Strict calendar check — Date rolls overflow (2026-02-30 → March 2), which
 * would silently create attendance rows for days that never happened. */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function validateEmployeePayload(raw: Record<string, unknown>): ValidationResult<EmployeeFields> {
  const errors: string[] = []
  const email = normalizeEmail(raw.email)
  if (!isValidEmail(email)) errors.push('A valid email is required')

  const name = clean(raw.name, 120)
  if (name.length < 2) errors.push('Full name is required')

  const roleRaw = String(raw.role ?? '').trim().toLowerCase()
  if (!EMPLOYEE_ROLES.includes(roleRaw as (typeof EMPLOYEE_ROLES)[number])) {
    errors.push(`Role must be one of: ${EMPLOYEE_ROLES.join(', ')}`)
  }

  const joiningDate = clean(raw.joiningDate, 10)
  if (joiningDate && !isValidDateKey(joiningDate)) {
    errors.push('joiningDate must be a YYYY-MM-DD calendar date')
  }

  const phone = clean(raw.phone, 20)
  if (phone && !/^[+]?[0-9\s-]{7,20}$/.test(phone)) errors.push('Phone number looks invalid')

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      email,
      name,
      role: roleRaw as (typeof EMPLOYEE_ROLES)[number],
      department: clean(raw.department, 120),
      designation: clean(raw.designation, 120),
      phone,
      employmentType: clean(raw.employmentType, 60) || 'full-time',
      joiningDate,
      qualification: clean(raw.qualification, 200),
      specialization: clean(raw.specialization, 200),
    },
  }
}

/** Only the fields an employee-directory update may touch. Role and email
 * changes go through provisionEmployee (they move claims and Auth). */
export function buildEmployeeUpdate(raw: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    'name', 'department', 'designation', 'phone', 'employmentType',
    'joiningDate', 'qualification', 'specialization',
  ] as const
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    if (raw[key] === undefined) continue
    if (key === 'joiningDate') {
      const v = clean(raw[key], 10)
      if (v && !isValidDateKey(v)) throw new HttpsError('invalid-argument', 'joiningDate must be YYYY-MM-DD')
      out[key] = v
      continue
    }
    out[key] = clean(raw[key], key === 'qualification' || key === 'specialization' ? 200 : 120)
  }
  return out
}

// ── Attendance ──────────────────────────────────────────────────────────────

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half-day', 'leave'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** One row per employee per day, deterministic id — a re-mark updates rather
 * than duplicates (same contract as staffAttendance). */
export function attendanceDocId(collegeId: string, employeeUid: string, dateKey: string): string {
  return `att_${sanitizeKeyPart(collegeId)}__${sanitizeKeyPart(employeeUid)}__${sanitizeKeyPart(dateKey)}`
}

export interface AttendanceFields {
  employeeUid: string
  date: string
  status: AttendanceStatus
  checkIn: string
  checkOut: string
  note: string
}

export function validateAttendancePayload(
  raw: Record<string, unknown>,
  todayKey: string
): ValidationResult<AttendanceFields> {
  const errors: string[] = []
  const employeeUid = clean(raw.employeeUid, 120)
  if (employeeUid.length < 4) errors.push('employeeUid is required')

  const date = clean(raw.date, 10)
  if (!isValidDateKey(date)) errors.push('date must be a YYYY-MM-DD calendar date')
  else if (date > todayKey) errors.push('Attendance cannot be marked for a future date')

  const status = String(raw.status ?? '').trim().toLowerCase() as AttendanceStatus
  if (!ATTENDANCE_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`)
  }

  const checkIn = clean(raw.checkIn, 5)
  const checkOut = clean(raw.checkOut, 5)
  if (checkIn && !TIME_RE.test(checkIn)) errors.push('checkIn must be HH:MM (24-hour)')
  if (checkOut && !TIME_RE.test(checkOut)) errors.push('checkOut must be HH:MM (24-hour)')
  if (checkIn && checkOut && TIME_RE.test(checkIn) && TIME_RE.test(checkOut) && checkOut <= checkIn) {
    errors.push('checkOut must be after checkIn')
  }

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: { employeeUid, date, status, checkIn, checkOut, note: clean(raw.note, 500) },
  }
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  halfDay: number
  leave: number
  /** Attendance rate excluding approved leave, as a 0–100 percentage. */
  attendanceRate: number
}

export function summarizeAttendance(rows: ReadonlyArray<{ status?: unknown }>): AttendanceSummary {
  const summary: AttendanceSummary = {
    total: rows.length, present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, attendanceRate: 0,
  }
  for (const row of rows) {
    const status = String(row.status ?? '')
    if (status === 'present') summary.present += 1
    else if (status === 'absent') summary.absent += 1
    else if (status === 'late') summary.late += 1
    else if (status === 'half-day') summary.halfDay += 1
    else if (status === 'leave') summary.leave += 1
  }
  const countable = summary.total - summary.leave
  const weighted = summary.present + summary.late + summary.halfDay * 0.5
  summary.attendanceRate = countable > 0 ? Math.round((weighted / countable) * 1000) / 10 : 0
  return summary
}

/** Attendance may only be recorded for days at or before today (IST), the
 * timezone every college in the product runs in. */
export function istTodayKey(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + (5.5 * 60 + now.getTimezoneOffset()) * 60_000)
  return ist.toISOString().slice(0, 10)
}

// ── CSV ─────────────────────────────────────────────────────────────────────

export function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) lines.push(row.map(csvEscape).join(','))
  return `${lines.join('\r\n')}\r\n`
}

export const EMPLOYEE_CSV_HEADERS = [
  'Employee ID', 'Name', 'Email', 'Role', 'Department', 'Designation',
  'Employment Type', 'Joining Date', 'Phone', 'Qualification', 'Status',
] as const

export function employeeToCsvRow(emp: Record<string, unknown>): Array<string | number | null> {
  const cell = (key: string): string => String(emp[key] ?? '')
  return [
    cell('id'), cell('name'), cell('email'), cell('role'),
    cell('department'), cell('designation'), cell('employmentType'),
    cell('joiningDate'), cell('phone'), cell('qualification'), cell('status'),
  ]
}

export const ATTENDANCE_CSV_HEADERS = [
  'Date', 'Employee', 'Email', 'Department', 'Status', 'Check In', 'Check Out', 'Note', 'Recorded By',
] as const

export function attendanceToCsvRow(row: Record<string, unknown>): Array<string | number | null> {
  const cell = (key: string): string => String(row[key] ?? '')
  return [
    cell('date'), cell('employeeName'), cell('employeeEmail'), cell('department'),
    cell('status'), cell('checkIn'), cell('checkOut'), cell('note'), cell('source'),
  ]
}

// ── Question bank ───────────────────────────────────────────────────────────

export const SUPPORTED_QUESTION_TYPES = [
  'mcq', 'multi_select', 'true_false', 'fill_in_blank',
  'short_answer', 'long_answer', 'numerical', 'assertion_reason',
] as const
export const OPTIONED_QUESTION_TYPES = ['mcq', 'multi_select', 'true_false', 'assertion_reason'] as const
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export interface QuestionFields {
  text: string
  type: (typeof SUPPORTED_QUESTION_TYPES)[number]
  difficulty: (typeof DIFFICULTIES)[number]
  subject: string
  chapter: string
  marks: number
  options: Array<{ id: string; text: string; isCorrect: boolean }>
  correctAnswer: string
  explanation: string
  tags: string[]
  batch: string
  branch: string
  status: 'active' | 'draft'
  language: string
}

export function validateQuestionPayload(raw: Record<string, unknown>): ValidationResult<QuestionFields> {
  const errors: string[] = []
  const text = clean(raw.text ?? raw.questionText, 5000)
  if (text.length < 5) errors.push('Question text is required (min 5 characters)')

  const type = String(raw.type ?? 'mcq').trim().toLowerCase() as (typeof SUPPORTED_QUESTION_TYPES)[number]
  if (!SUPPORTED_QUESTION_TYPES.includes(type)) {
    errors.push(`type must be one of: ${SUPPORTED_QUESTION_TYPES.join(', ')}`)
  }

  const difficulty = String(raw.difficulty ?? 'medium').trim().toLowerCase() as (typeof DIFFICULTIES)[number]
  if (!DIFFICULTIES.includes(difficulty)) errors.push('difficulty must be easy, medium or hard')

  const subject = clean(raw.subject, 120)
  if (!subject) errors.push('subject is required')

  const marks = Number(raw.marks ?? 1)
  if (!Number.isFinite(marks) || marks <= 0 || marks > 100) errors.push('marks must be between 0 and 100')

  const rawOptions = Array.isArray(raw.options) ? raw.options : []
  const options = rawOptions.slice(0, 10).map((option, index) => {
    const o = (option || {}) as Record<string, unknown>
    return {
      id: clean(o.id, 40) || `opt-${index + 1}`,
      text: clean(o.text ?? o.label, 1000),
      isCorrect: Boolean(o.isCorrect),
    }
  }).filter((option) => option.text)

  if (OPTIONED_QUESTION_TYPES.includes(type as (typeof OPTIONED_QUESTION_TYPES)[number])) {
    if (options.length < 2) errors.push('This question type needs at least 2 options')
    if (!options.some((option) => option.isCorrect)) errors.push('Mark at least one option as correct')
    if (type === 'mcq' && options.filter((option) => option.isCorrect).length !== 1) {
      errors.push('A single-choice MCQ must have exactly one correct option')
    }
  }

  const correctAnswer = clean(raw.correctAnswer, 2000)
  if (!OPTIONED_QUESTION_TYPES.includes(type as (typeof OPTIONED_QUESTION_TYPES)[number]) && !correctAnswer) {
    errors.push('correctAnswer is required for this question type')
  }

  const status = String(raw.status ?? 'active').trim().toLowerCase()
  if (!['active', 'draft'].includes(status)) errors.push("status must be 'active' or 'draft'")

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      text,
      type,
      difficulty,
      subject,
      chapter: clean(raw.chapter ?? raw.topic, 200),
      marks,
      options,
      correctAnswer: OPTIONED_QUESTION_TYPES.includes(type as (typeof OPTIONED_QUESTION_TYPES)[number])
        ? options.filter((option) => option.isCorrect).map((option) => option.id).join(',')
        : correctAnswer,
      explanation: clean(raw.explanation, 5000),
      tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 20).map((tag) => clean(tag, 60)).filter(Boolean) : [],
      batch: clean(raw.batch, 40),
      branch: clean(raw.branch, 60),
      status: status as 'active' | 'draft',
      language: clean(raw.language, 10) || 'en',
    },
  }
}

/** Server-side doc builder so `collegeId` / `createdBy` can never be forged
 * from the payload. Mirrors the fields the admin QuestionBankManager reads. */
export function buildQuestionDoc(
  fields: QuestionFields,
  ctx: { collegeId: string; createdBy: string; createdByName: string }
): Record<string, unknown> {
  return {
    ...fields,
    // Compatibility aliases the older UI paths read.
    content: fields.text,
    questionText: fields.text,
    questionType: fields.type,
    collegeId: ctx.collegeId,
    createdBy: ctx.createdBy,
    createdByName: ctx.createdByName,
  }
}

// ── Test duplication ────────────────────────────────────────────────────────

export const MAX_QUESTIONS = 400

/** Fields of a scheduledTests doc that must NOT survive a duplication: the
 * live-test counters, lifecycle timestamps and status belong to the original
 * run. Everything else (paper link, settings, marking scheme) is copied. */
const RUNTIME_TEST_FIELDS = [
  'totalRegistered', 'totalStarted', 'totalSubmitted',
  'status', 'publishedAt', 'createdAt', 'updatedAt', 'cancelledAt', 'cancellationReason',
] as const

export interface DuplicateWindow {
  startMs: number
  endMs: number
  durationMinutes: number
}

/** Validate the new schedule window for a duplicated test. Pure so the
 * frontend can pre-check with the same maths. */
export function validateDuplicateWindow(
  input: { startDateTime?: unknown; endDateTime?: unknown; durationMinutes?: unknown },
  nowMs: number
): ValidationResult<DuplicateWindow> {
  const errors: string[] = []
  const startMs = Date.parse(String(input.startDateTime ?? ''))
  const endMs = Date.parse(String(input.endDateTime ?? ''))
  if (!Number.isFinite(startMs)) errors.push('startDateTime is required and must be a valid date')
  if (!Number.isFinite(endMs)) errors.push('endDateTime is required and must be a valid date')
  const duration = Number(input.durationMinutes)
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
    errors.push('durationMinutes must be an integer between 1 and 480')
  }
  if (errors.length) return { ok: false, errors }
  if (startMs <= nowMs) errors.push('The duplicated test must start in the future')
  if (endMs <= startMs) errors.push('endDateTime must be after startDateTime')
  if (duration * 60_000 > endMs - startMs) errors.push('Duration must fit inside the test window')
  if (errors.length) return { ok: false, errors }
  return { ok: true, value: { startMs, endMs, durationMinutes: duration } }
}

/** Build the duplicated test document from the source. Pure: the caller adds
 * serverTimestamp fields after this returns. */
export function buildDuplicateTestDoc(
  source: Record<string, unknown>,
  window: DuplicateWindow,
  opts: { title?: string; facultyId: string; facultyName: string }
): Record<string, unknown> {
  const doc: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if ((RUNTIME_TEST_FIELDS as readonly string[]).includes(key)) continue
    doc[key] = value
  }
  const sourceTitle = String(source.title ?? 'Test')
  doc.title = clean(opts.title, 200) || `${sourceTitle} (Copy)`
  doc.startDateTime = new Date(window.startMs)
  doc.scheduledAt = new Date(window.startMs)
  doc.endDateTime = new Date(window.endMs)
  doc.duration = window.durationMinutes
  doc.durationMinutes = window.durationMinutes
  doc.status = 'scheduled'
  doc.totalRegistered = 0
  doc.totalStarted = 0
  doc.totalSubmitted = 0
  doc.facultyId = opts.facultyId
  doc.facultyName = opts.facultyName
  doc.sourceTestId = String(source.id ?? '')
  doc.duplicatedFrom = String(source.id ?? '')
  return doc
}

/** Stable question id for the copy — same scheme as scheduleAssessmentTest. */
export function questionDocId(order: number): string {
  return `q-${String(order).padStart(4, '0')}`
}

// ── Audit filters ───────────────────────────────────────────────────────────

export interface AuditFilters {
  action: string
  actorUid: string
  targetEmail: string
  from: string
  to: string
  limit: number
}

export function parseAuditFilters(raw: Record<string, unknown>): AuditFilters {
  const limit = Math.max(1, Math.min(200, Number(raw.limit) || 50))
  const from = clean(raw.from, 10)
  const to = clean(raw.to, 10)
  return {
    action: clean(raw.action, 80),
    actorUid: clean(raw.actorUid, 120),
    targetEmail: normalizeEmail(raw.targetEmail),
    from: isValidDateKey(from) ? from : '',
    to: isValidDateKey(to) ? to : '',
    limit,
  }
}

/** Mask an email for log lines: keep first char + domain. */
export function maskEmail(email: string): string {
  const [local, domain] = normalizeEmail(email).split('@')
  if (!domain) return '***'
  return `${local.slice(0, 1)}***@${domain}`
}

// ── Directory backfill ──────────────────────────────────────────────────────

/**
 * Map a role-profile document (faculty/hods/mentors/admins) onto a new
 * `employees` directory row. Returns null when the profile cannot back an
 * employee row — no uid means attendance can never be attributed, and no
 * email means no deterministic id.
 */
export function buildBackfillRow(
  profile: Record<string, unknown>,
  collegeId: string
): Record<string, unknown> | null {
  const uid = clean(profile.uid, 120)
  const email = normalizeEmail(profile.email)
  if (!uid || !isValidEmail(email)) return null
  const role = String(profile.role ?? 'faculty').trim().toLowerCase()
  return {
    id: employeeDocId(collegeId, email),
    uid,
    email,
    name: clean(profile.name ?? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`, 120),
    role: EMPLOYEE_ROLES.includes(role as (typeof EMPLOYEE_ROLES)[number]) ? role : 'faculty',
    collegeId,
    collegeName: clean(profile.collegeName, 200),
    collegeCode: clean(profile.collegeCode, 60),
    department: clean(profile.department, 120),
    designation: clean(profile.designation, 120),
    phone: clean(profile.phone, 20),
    employmentType: clean(profile.employmentType, 60) || 'full-time',
    joiningDate: isValidDateKey(profile.joiningDate) ? String(profile.joiningDate) : '',
    qualification: clean(profile.qualification, 200),
    specialization: clean(profile.specialization, 200),
    status: clean(profile.status, 20) === 'inactive' ? 'inactive' : 'active',
    backfilled: true,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CALLABLES
// ═════════════════════════════════════════════════════════════════════════════

const ROLE_PROFILE_COLLECTION: Record<string, string> = {
  faculty: 'faculty',
  hod: 'hods',
  mentor: 'mentors',
  admin: 'admins',
  principal: 'admins',
}

/** Provision (or repair) one employee end to end. This is the employee
 * counterpart of grantUserRole with HR fields and a directory row, and the
 * ONLY supported way to create employee accounts: it creates or reclaims the
 * Auth account, issues role/collegeId claims, writes users/{uid}, the role
 * profile and the employees directory row, then verifies the account before
 * reporting success. */
export const provisionEmployee = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })
  if (!collegeId) throw new HttpsError('failed-precondition', 'College context could not be resolved')

  const validation = validateEmployeePayload(input)
  if (!validation.ok) throw new HttpsError('invalid-argument', validation.errors.join('; '))
  const emp = validation.value

  // Only a superadmin may create other superadmin-adjacent platform roles;
  // within a college, only an admin/superadmin may create principals/admins.
  if (['admin', 'principal'].includes(emp.role) && !['superadmin', 'admin'].includes(caller.role)) {
    throw new HttpsError('permission-denied', 'Only a college admin or superadmin may provision admin/principal employees')
  }

  const db = admin.firestore()
  const collegeDoc = await db.doc(`colleges/${collegeId}`).get()
  if (!collegeDoc.exists) throw new HttpsError('not-found', `College "${collegeId}" does not exist`)
  const college = collegeDoc.data() as Record<string, unknown>

  // Reuse an existing Auth account for this email when it is not already
  // bound to another college — the orphan-reclaim contract from staffAuth.
  const password = clean(input.password, 200) || generateRandomPassword()
  if (input.password) {
    const policyErrors = validatePasswordPolicy(String(input.password))
    if (policyErrors.length) throw new HttpsError('invalid-argument', policyErrors.join('; '))
  }

  const existing = await findAuthUserByEmail(emp.email)
  let uid: string
  let created = false
  if (existing) {
    const existingClaims = (await admin.auth().getUser(existing.uid)).customClaims || {}
    const boundCollege = String(existingClaims.collegeId || '')
    if (boundCollege && boundCollege !== collegeId) {
      throw new HttpsError(
        'already-exists',
        `${maskEmail(emp.email)} already has an account at another college. Contact a superadmin.`
      )
    }
    await withAuthQuotaRetry('provisionEmployee.update', () => admin.auth().updateUser(existing.uid, {
      password,
      displayName: emp.name,
      emailVerified: false,
    }))
    uid = existing.uid
  } else {
    const userRecord = await withAuthQuotaRetry('provisionEmployee.create', () => admin.auth().createUser({
      email: emp.email,
      password,
      displayName: emp.name,
    }))
    uid = userRecord.uid
    created = true
  }

  await withAuthQuotaRetry('provisionEmployee.claims', () => admin.auth().setCustomUserClaims(uid, {
    role: emp.role,
    collegeId,
    mustChangePassword: true,
  }))
  // Force the next request to mint a token carrying the new claims.
  await admin.auth().revokeRefreshTokens(uid)

  const now = admin.firestore.FieldValue.serverTimestamp()
  const empId = employeeDocId(collegeId, emp.email)
  const batch = db.batch()

  batch.set(db.doc(`users/${uid}`), {
    uid, email: emp.email, name: emp.name, role: emp.role, collegeId,
    status: 'active', mustChangePassword: true,
    updatedAt: now, ...(created ? { createdAt: now } : {}),
    managedBy: caller.uid,
  }, { merge: true })

  const profileCollection = ROLE_PROFILE_COLLECTION[emp.role]
  if (profileCollection) {
    batch.set(db.doc(`${profileCollection}/${uid}`), {
      uid, email: emp.email, name: emp.name, role: emp.role, collegeId,
      collegeName: college.name ?? '', collegeCode: college.code ?? '',
      department: emp.department, designation: emp.designation,
      status: 'active', updatedAt: now,
      ...(created ? { createdAt: now } : {}),
    }, { merge: true })
  }

  batch.set(db.doc(`employees/${empId}`), {
    id: empId,
    uid,
    email: emp.email,
    name: emp.name,
    role: emp.role,
    collegeId,
    collegeName: college.name ?? '',
    collegeCode: college.code ?? '',
    department: emp.department,
    designation: emp.designation,
    phone: emp.phone,
    employmentType: emp.employmentType,
    joiningDate: emp.joiningDate,
    qualification: emp.qualification,
    specialization: emp.specialization,
    status: 'active',
    mustChangePassword: true,
    createdBy: caller.uid,
    updatedAt: now,
    ...(created ? { createdAt: now } : {}),
  }, { merge: true })

  batch.create(db.collection('logs').doc(), buildAuditEntry({
    action: created ? 'employee.provision' : 'employee.reprovision',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId, targetUid: uid, targetEmail: emp.email, targetId: empId, targetType: 'employee',
    details: { role: emp.role, department: emp.department, created },
  }, now))

  await batch.commit()
  logger.info('[employeePortal] employee provisioned', {
    empId, role: emp.role, collegeId, actorUid: caller.uid, created, email: maskEmail(emp.email),
  })

  return withApiVersion({
    success: true,
    uid,
    employeeId: empId,
    email: emp.email,
    role: emp.role,
    created,
    temporaryPassword: password,
    reauthenticateRequired: true,
  })
})

/** College employee directory. HODs may read it (they manage their
 * department's people) but only managers may mutate it. */
export const listEmployees = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, [...EMPLOYEE_MANAGER_ROLES, 'hod'])
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })
  const db = admin.firestore()

  let query: admin.firestore.Query = db.collection('employees').where('collegeId', '==', collegeId)
  const status = clean(input.status, 20)
  if (status && EMPLOYEE_STATUSES.includes(status as EmployeeStatus)) {
    query = query.where('status', '==', status)
  }
  const search = normalizeEmail(input.search)
  const snapshot = await query.orderBy('name').limit(1000).get()

  const employees = snapshot.docs
    .map((docSnap): Record<string, unknown> => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((emp) => {
      if (!search) return true
      const haystack = `${String(emp.name || '').toLowerCase()} ${String(emp.email || '')}`
      return haystack.includes(search)
    })
  return { employees, total: employees.length }
})

/** Update HR fields of an existing employee (no role/email/claim changes). */
export const updateEmployee = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const employeeId = clean(input.employeeId, 200)
  if (!employeeId || employeeId.includes('/')) throw new HttpsError('invalid-argument', 'A valid employeeId is required')

  const db = admin.firestore()
  const ref = db.doc(`employees/${employeeId}`)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Employee not found')
  const existing = snap.data() as Record<string, unknown>
  resolveCollegeScope(caller, existing.collegeId, { required: true })

  const updates = buildEmployeeUpdate(input)
  if (Object.keys(updates).length === 0) throw new HttpsError('invalid-argument', 'Nothing to update')

  const now = admin.firestore.FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.set(ref, { ...updates, updatedAt: now }, { merge: true })
  // Mirror the display fields onto users/{uid} and the role profile so every
  // list in the product shows the corrected name/department.
  if (updates.name !== undefined && existing.uid) {
    batch.set(db.doc(`users/${String(existing.uid)}`), { name: updates.name, updatedAt: now }, { merge: true })
  }
  batch.create(db.collection('logs').doc(), buildAuditEntry({
    action: 'employee.update',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId: String(existing.collegeId ?? ''), targetUid: String(existing.uid ?? ''),
    targetEmail: String(existing.email ?? ''), targetId: employeeId, targetType: 'employee',
    details: { fields: Object.keys(updates) },
  }, now))
  await batch.commit()

  return { success: true, updatedFields: Object.keys(updates) }
})

/** Activate / suspend / deactivate. Deactivation disables the Auth account —
 * the employee is signed out everywhere on their next token refresh. */
export const setEmployeeStatus = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const employeeId = clean(input.employeeId, 200)
  const status = String(input.status ?? '').trim().toLowerCase()
  if (!employeeId || employeeId.includes('/')) throw new HttpsError('invalid-argument', 'A valid employeeId is required')
  if (!EMPLOYEE_STATUSES.includes(status as EmployeeStatus)) {
    throw new HttpsError('invalid-argument', `status must be one of: ${EMPLOYEE_STATUSES.join(', ')}`)
  }

  const db = admin.firestore()
  const ref = db.doc(`employees/${employeeId}`)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Employee not found')
  const existing = snap.data() as Record<string, unknown>
  resolveCollegeScope(caller, existing.collegeId, { required: true })
  const uid = String(existing.uid ?? '')
  if (!uid) throw new HttpsError('failed-precondition', 'Employee has no linked account')
  if (uid === caller.uid && status !== 'active') {
    throw new HttpsError('failed-precondition', 'You cannot deactivate your own account')
  }

  await withAuthQuotaRetry('setEmployeeStatus.update', () => admin.auth().updateUser(uid, { disabled: status === 'inactive' }))
  if (status !== 'active') await admin.auth().revokeRefreshTokens(uid)

  const now = admin.firestore.FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.set(ref, { status, updatedAt: now }, { merge: true })
  batch.set(db.doc(`users/${uid}`), { status: status === 'active' ? 'active' : status, updatedAt: now }, { merge: true })
  const profileCollection = ROLE_PROFILE_COLLECTION[String(existing.role ?? '')]
  if (profileCollection) {
    batch.set(db.doc(`${profileCollection}/${uid}`), { status: status === 'active' ? 'active' : status, updatedAt: now }, { merge: true })
  }
  batch.create(db.collection('logs').doc(), buildAuditEntry({
    action: 'employee.status',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId: String(existing.collegeId ?? ''), targetUid: uid,
    targetEmail: String(existing.email ?? ''), targetId: employeeId, targetType: 'employee',
    details: { status, previousStatus: String(existing.status ?? '') },
  }, now))
  await batch.commit()

  return { success: true, status }
})

/** CSV export of the employee directory (same filter surface as list). */
export const exportEmployeesCsv = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })

  let query: admin.firestore.Query = admin.firestore().collection('employees').where('collegeId', '==', collegeId)
  const status = clean(input.status, 20)
  if (status && EMPLOYEE_STATUSES.includes(status as EmployeeStatus)) {
    query = query.where('status', '==', status)
  }
  const snapshot = await query.orderBy('name').limit(2000).get()
  const rows = snapshot.docs
    .map((docSnap): Record<string, unknown> => ({ id: docSnap.id, ...docSnap.data() }))
    .map((emp) => employeeToCsvRow(emp))
  return { csv: buildCsv([...EMPLOYEE_CSV_HEADERS], rows), count: rows.length }
})

/** Record one employee-day of attendance. Employees mark their own day
 * (source 'self'); managers may record or correct any employee in their
 * college (source 'manager'). Deterministic doc id — re-marks update. */
export const markEmployeeAttendance = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, [...EMPLOYEE_ROLES, 'superadmin'])
  const input = (request.data || {}) as Record<string, unknown>
  const isManager = EMPLOYEE_MANAGER_ROLES.includes(caller.role as (typeof EMPLOYEE_MANAGER_ROLES)[number])

  const rawEmployeeUid = clean(input.employeeUid, 120)
  const employeeUid = rawEmployeeUid || caller.uid
  if (employeeUid !== caller.uid && !isManager) {
    throw new HttpsError('permission-denied', 'Only managers may record attendance for other employees')
  }

  const validation = validateAttendancePayload({ ...input, employeeUid }, istTodayKey())
  if (!validation.ok) throw new HttpsError('invalid-argument', validation.errors.join('; '))
  const entry = validation.value

  const db = admin.firestore()
  // Resolve the employee row to stamp identity + tenancy server-side.
  const empSnap = await db.collection('employees').where('uid', '==', employeeUid).limit(1).get()
  const empDoc = empSnap.docs[0]
  if (!empDoc) throw new HttpsError('not-found', 'Employee record not found — ask an admin to provision the account')
  const emp = empDoc.data() as Record<string, unknown>
  const collegeId = String(emp.collegeId ?? '')
  resolveCollegeScope(caller, collegeId, { required: true })

  const docId = attendanceDocId(collegeId, employeeUid, entry.date)
  const now = admin.firestore.FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.set(db.doc(`employeeAttendance/${docId}`), {
    id: docId,
    collegeId,
    employeeId: empDoc.id,
    employeeUid,
    employeeName: String(emp.name ?? ''),
    employeeEmail: String(emp.email ?? ''),
    department: String(emp.department ?? ''),
    date: entry.date,
    status: entry.status,
    checkIn: entry.checkIn,
    checkOut: entry.checkOut,
    note: entry.note,
    source: employeeUid === caller.uid ? 'self' : 'manager',
    markedBy: caller.uid,
    updatedAt: now,
  }, { merge: true })
  if (employeeUid !== caller.uid) {
    batch.create(db.collection('logs').doc(), buildAuditEntry({
      action: 'employeeAttendance.managerMark',
      actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
      collegeId, targetUid: employeeUid, targetEmail: String(emp.email ?? ''),
      targetId: docId, targetType: 'employeeAttendance',
      details: { date: entry.date, status: entry.status },
    }, now))
  }
  await batch.commit()
  return { success: true, id: docId }
})

/** Attendance rows for a college over a date window (max 62 days), with a
 * summary. Optional employeeUid filter narrows to one person. */
export const listEmployeeAttendance = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, [...EMPLOYEE_MANAGER_ROLES, 'hod', ...EMPLOYEE_ROLES])
  const input = (request.data || {}) as Record<string, unknown>
  const employeeUid = clean(input.employeeUid, 120)
  const selfOnly = employeeUid !== caller.uid
  if (selfOnly && !EMPLOYEE_MANAGER_ROLES.includes(caller.role as (typeof EMPLOYEE_MANAGER_ROLES)[number]) && caller.role !== 'hod') {
    throw new HttpsError('permission-denied', 'Only managers may view college-wide attendance')
  }

  const from = clean(input.from, 10)
  const to = clean(input.to, 10)
  if (!isValidDateKey(from) || !isValidDateKey(to) || to < from) {
    throw new HttpsError('invalid-argument', 'from/to must be YYYY-MM-DD dates with to >= from')
  }
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1
  if (spanDays > 62) throw new HttpsError('invalid-argument', 'Date window cannot exceed 62 days')

  const db = admin.firestore()
  let query: admin.firestore.Query
  if (selfOnly) {
    const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })
    query = db.collection('employeeAttendance')
      .where('collegeId', '==', collegeId)
      .where('date', '>=', from)
      .where('date', '<=', to)
    if (employeeUid) query = query.where('employeeUid', '==', employeeUid)
  } else {
    // Own rows: the uid filter alone keeps this within the caller's data;
    // collegeId is added so the composite index is the same shape.
    const collegeId = resolveCollegeScope(caller, undefined) || resolveCollegeScope(caller, input.collegeId)
    query = db.collection('employeeAttendance')
      .where('collegeId', '==', collegeId)
      .where('employeeUid', '==', caller.uid)
      .where('date', '>=', from)
      .where('date', '<=', to)
  }

  const snapshot = await query.orderBy('date').limit(2000).get()
  const rows = snapshot.docs.map((docSnap): Record<string, unknown> => ({ id: docSnap.id, ...docSnap.data() }))
  return { rows, summary: summarizeAttendance(rows) }
})

/** CSV export of attendance rows (managers only). */
export const exportEmployeeAttendanceCsv = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })
  const from = clean(input.from, 10)
  const to = clean(input.to, 10)
  if (!isValidDateKey(from) || !isValidDateKey(to) || to < from) {
    throw new HttpsError('invalid-argument', 'from/to must be YYYY-MM-DD dates with to >= from')
  }
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1
  if (spanDays > 62) throw new HttpsError('invalid-argument', 'Date window cannot exceed 62 days')

  let query: admin.firestore.Query = admin.firestore().collection('employeeAttendance')
    .where('collegeId', '==', collegeId)
    .where('date', '>=', from)
    .where('date', '<=', to)
  const employeeUid = clean(input.employeeUid, 120)
  if (employeeUid) query = query.where('employeeUid', '==', employeeUid)

  const snapshot = await query.orderBy('date').limit(5000).get()
  const rows = snapshot.docs.map((docSnap) => ({ ...docSnap.data() })).map((row) => attendanceToCsvRow(row))
  return { csv: buildCsv([...ATTENDANCE_CSV_HEADERS], rows), count: rows.length }
})

/** Create or update a question in the college bank. Faculty may edit their
 * own drafts; managers may edit anything in the college. */
export const upsertQuestionBankItem = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, [...EMPLOYEE_MANAGER_ROLES, 'hod', 'faculty', 'mentor'])
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })
  if (!collegeId) throw new HttpsError('failed-precondition', 'College context could not be resolved')

  const validation = validateQuestionPayload(input)
  if (!validation.ok) throw new HttpsError('invalid-argument', validation.errors.join('; '))

  const db = admin.firestore()
  const questionId = clean(input.questionId, 200)
  const now = admin.firestore.FieldValue.serverTimestamp()
  let id = questionId

  if (questionId && questionId.includes('/')) throw new HttpsError('invalid-argument', 'Invalid questionId')
  if (questionId) {
    const snap = await db.doc(`questions/${questionId}`).get()
    if (!snap.exists) throw new HttpsError('not-found', 'Question not found')
    const existing = snap.data() as Record<string, unknown>
    resolveCollegeScope(caller, existing.collegeId, { required: true })
    const isManager = EMPLOYEE_MANAGER_ROLES.includes(caller.role as (typeof EMPLOYEE_MANAGER_ROLES)[number]) || caller.role === 'hod'
    if (!isManager && String(existing.createdBy ?? '') !== caller.uid) {
      throw new HttpsError('permission-denied', 'You can only edit questions you created')
    }
    await db.doc(`questions/${questionId}`).set(
      { ...buildQuestionDoc(validation.value, { collegeId, createdBy: String(existing.createdBy ?? caller.uid), createdByName: String(existing.createdByName ?? caller.name) }), updatedAt: now },
      { merge: true }
    )
  } else {
    const ref = db.collection('questions').doc()
    id = ref.id
    await ref.set({
      ...buildQuestionDoc(validation.value, { collegeId, createdBy: caller.uid, createdByName: caller.name }),
      createdAt: now,
      updatedAt: now,
    })
  }

  await writeAuditLog({
    action: questionId ? 'questionBank.update' : 'questionBank.create',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId, targetId: id, targetType: 'question',
    details: { subject: validation.value.subject, type: validation.value.type },
  })
  return { success: true, questionId: id }
})

/** Delete a question. Managers only — deletion also removes it from future
 * paper generation, so it is never a faculty self-service action. */
export const deleteQuestionBankItem = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const questionId = clean(input.questionId, 200)
  if (!questionId || questionId.includes('/')) throw new HttpsError('invalid-argument', 'A valid questionId is required')

  const db = admin.firestore()
  const snap = await db.doc(`questions/${questionId}`).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Question not found')
  const existing = snap.data() as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, existing.collegeId, { required: true })

  await db.doc(`questions/${questionId}`).delete()
  await writeAuditLog({
    action: 'questionBank.delete',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId: collegeId ?? '', targetId: questionId, targetType: 'question',
    details: { subject: String(existing.subject ?? '') },
  })
  return { success: true }
})

/** Deep-copy a scheduled test (document + frozen question snapshot) into a
 * new scheduled test with a fresh window — "run the same paper next month".
 * The copy starts life as `scheduled`, counters zeroed, publish flow intact. */
export const duplicateAssessmentTest = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, [...EMPLOYEE_MANAGER_ROLES, 'hod', 'faculty'])
  const input = (request.data || {}) as Record<string, unknown>
  const testId = clean(input.testId, 200)
  if (!testId || testId.includes('/')) throw new HttpsError('invalid-argument', 'A valid testId is required')

  const db = admin.firestore()
  const sourceRef = db.collection('scheduledTests').doc(testId)
  const sourceSnap = await sourceRef.get()
  if (!sourceSnap.exists) throw new HttpsError('not-found', 'Test not found')
  const source: Record<string, unknown> = { id: sourceSnap.id, ...sourceSnap.data() }
  const collegeId = resolveCollegeScope(caller, source.collegeId, { required: true })
  if (caller.role === 'faculty' && String(source.facultyId ?? '') !== caller.uid) {
    throw new HttpsError('permission-denied', 'Faculty may duplicate only their own tests')
  }

  const windowValidation = validateDuplicateWindow(input, Date.now())
  if (!windowValidation.ok) throw new HttpsError('invalid-argument', windowValidation.errors.join('; '))

  // Load the frozen question snapshot (paginate past the single-page cap).
  const questions: Array<Record<string, unknown>> = []
  let cursor: admin.firestore.QueryDocumentSnapshot | undefined
  for (;;) {
    let page: admin.firestore.Query = sourceRef.collection('assessmentQuestions').orderBy('order').limit(200)
    if (cursor) page = page.startAfter(cursor)
    const snap = await page.get()
    for (const docSnap of snap.docs) questions.push(docSnap.data() as Record<string, unknown>)
    if (snap.size < 200) break
    cursor = snap.docs[snap.docs.length - 1]
    if (questions.length > MAX_QUESTIONS) {
      throw new HttpsError('failed-precondition', `Source test exceeds the ${MAX_QUESTIONS}-question duplication limit`)
    }
  }
  if (questions.length < 1) throw new HttpsError('failed-precondition', 'Source test has no frozen question snapshot')

  const targetRef = db.collection('scheduledTests').doc()
  const batch = db.batch()
  batch.create(targetRef, {
    ...buildDuplicateTestDoc(source, windowValidation.value, {
      title: clean(input.title, 200),
      facultyId: caller.uid,
      facultyName: caller.name,
    }),
    collegeId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  questions.forEach((question, index) => {
    const questionRef = targetRef.collection('assessmentQuestions').doc(questionDocId(index + 1))
    batch.create(questionRef, { ...question, id: questionRef.id, order: index + 1 })
  })
  batch.create(db.collection('logs').doc(), buildAuditEntry({
    action: 'assessmentTest.duplicate',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId, targetId: targetRef.id, targetType: 'scheduledTest',
    details: { sourceTestId: testId, questionCount: questions.length },
  }, admin.firestore.FieldValue.serverTimestamp()))
  await batch.commit()

  logger.info('[employeePortal] test duplicated', {
    sourceTestId: testId, newTestId: targetRef.id, collegeId, questionCount: questions.length,
  })
  return { success: true, testId: targetRef.id, questionCount: questions.length, status: 'scheduled' }
})

/** Paginated audit trail for a college (superadmins may read every college).
 * Reads the same `logs` collection grantUserRole writes, so platform-level
 * identity operations and employee-portal operations share one trail. */
export const listAuditLogs = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, AUDIT_READER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId)
  if (caller.role !== 'superadmin' && !collegeId) {
    throw new HttpsError('failed-precondition', 'Your account is not attached to a college')
  }
  const filters = parseAuditFilters(input)

  let query: admin.firestore.Query = admin.firestore().collection('logs')
  if (collegeId) query = query.where('collegeId', '==', collegeId)
  if (filters.action) query = query.where('action', '==', filters.action)
  if (filters.actorUid) query = query.where('actorUid', '==', filters.actorUid)
  if (filters.from) query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(`${filters.from}T00:00:00+05:30`)))
  if (filters.to) query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(new Date(`${filters.to}T23:59:59+05:30`)))

  const snapshot = await query.orderBy('createdAt', 'desc').limit(filters.limit + 1).get()
  const docs = snapshot.docs.slice(0, filters.limit)
  const entries = docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>
    const createdAt = data.createdAt as admin.firestore.Timestamp | undefined
    return {
      id: docSnap.id,
      action: String(data.action ?? ''),
      actorUid: String(data.actorUid ?? ''),
      actorName: String(data.actorName ?? ''),
      actorRole: String(data.actorRole ?? ''),
      collegeId: data.collegeId ?? null,
      targetUid: data.targetUid ?? null,
      targetEmail: data.targetEmail ?? null,
      targetId: data.targetId ?? null,
      targetType: data.targetType ?? null,
      details: (data.details ?? null) as Record<string, unknown> | null,
      createdAt: createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate().toISOString() : null,
    }
  }).filter((entry) => !filters.targetEmail || String(entry.targetEmail ?? '').includes(filters.targetEmail))

  return {
    entries,
    hasMore: snapshot.docs.length > filters.limit,
    nextCursor: snapshot.docs.length > filters.limit ? docs[docs.length - 1].id : null,
  }
})

/**
 * One-time (idempotent) backfill of the employee directory from the existing
 * role-profile collections. Colleges that were running before the Employee
 * Portal have faculty/hods/mentors/admins profiles but no `employees` rows —
 * without them the attendance roster is empty and managers cannot record a
 * day. Existing directory rows are NEVER touched (they may carry HR edits or
 * portal-issued credentials); only missing rows are created, so a re-run is a
 * no-op.
 */
export const backfillEmployeeDirectory = onCall(CALL_OPTS, async (request) => {
  const caller = await resolveCaller(request, EMPLOYEE_MANAGER_ROLES)
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollegeScope(caller, input.collegeId, { required: true })
  if (!collegeId) throw new HttpsError('failed-precondition', 'College context could not be resolved')

  const db = admin.firestore()
  const scanned: Array<{ id: string; data: Record<string, unknown> }> = []
  for (const profileCollection of ['faculty', 'hods', 'mentors', 'admins']) {
    const snap = await db.collection(profileCollection).where('collegeId', '==', collegeId).limit(1000).get()
    for (const docSnap of snap.docs) {
      scanned.push({ id: docSnap.id, data: docSnap.data() as Record<string, unknown> })
    }
  }

  // Existing directory rows win; two profiles sharing one email collapse to
  // the deterministic id, so dedupe candidates by id.
  const existing = await db.collection('employees').where('collegeId', '==', collegeId).limit(2000).get()
  const existingIds = new Set(existing.docs.map((docSnap) => docSnap.id))

  const candidates = new Map<string, Record<string, unknown>>()
  let unusable = 0
  for (const profile of scanned) {
    const row = buildBackfillRow(profile.data, collegeId)
    if (!row) { unusable += 1; continue }
    const id = String(row.id)
    if (existingIds.has(id) || candidates.has(id)) continue
    candidates.set(id, row)
  }

  const now = admin.firestore.FieldValue.serverTimestamp()
  const ids = [...candidates.keys()]
  for (let i = 0; i < ids.length; i += 400) {
    const batch = db.batch()
    for (const id of ids.slice(i, i + 400)) {
      batch.set(db.doc(`employees/${id}`), { ...candidates.get(id), createdAt: now, updatedAt: now }, { merge: true })
    }
    await batch.commit()
  }

  await writeAuditLog({
    action: 'employee.backfill',
    actorUid: caller.uid, actorRole: caller.role, actorName: caller.name,
    collegeId, targetType: 'employee',
    details: { created: ids.length, skippedExisting: existingIds.size, unusableProfiles: unusable, scanned: scanned.length },
  })
  logger.info('[employeePortal] directory backfilled', {
    collegeId, created: ids.length, skippedExisting: existingIds.size, unusableProfiles: unusable,
  })

  return { success: true, created: ids.length, skippedExisting: existingIds.size, unusableProfiles: unusable }
})
