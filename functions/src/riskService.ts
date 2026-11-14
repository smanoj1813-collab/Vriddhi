import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError } from 'firebase-functions/v2/https'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { normalizeRole } from './identityShared'
import { readCollegeSchemes } from './academic/schemeResolution'
import { selectCollegeScheme, type CollegeSchemeConfiguration } from './academic/collegeSchemes'
import { isScheduleVisibleToStudents } from './academicWorkflowCore'
import { buildSessionDoc, expandWeeklyRange, isSlotActive, slotAppliesOn, slotDateKey, type WeeklySlot } from './classSchedule'
import {
  buildRiskFindings, canReadRiskAlert, DEFAULT_RISK_SETTINGS, DAY_MS, dateKey, istDate, keyText,
  riskRecipients, riskReconciliationState, riskAlertTransition, RISK_LOOKBACK_DAYS, text, textList, validateRiskSettings,
  type RiskEvidence, type RiskFinding, type RiskPerson, type RiskRow, type RiskSettings,
} from './riskCore'

export const riskHash = (...parts: string[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex')
const db = () => admin.firestore()
const validId = (s: string) => !!s && s.length <= 200 && !s.includes('/')
const rowsOf = (snap: FirebaseFirestore.QuerySnapshot): RiskRow[] => snap.docs.map(d => ({ ...d.data(), id: d.id }))
const SOURCE_LABELS: Record<string, string> = {
  assignments: 'Assignment catalogue', tests: 'Assessment catalogue', roster: 'Student roster', holidays: 'Academic calendar',
  attendance: 'Student attendance records', submissions: 'Assignment submissions', attempts: 'Assessment attempts',
  sessions: 'Class sessions', weekly: 'Published weekly timetable', registers: 'Class attendance registers',
  staffRecords: 'Faculty check-in/out records', staffSchedule: 'Assigned staff working schedule',
  topics: 'Faculty topic plan', mappings: 'Curriculum assignments', curricula: 'Approved curriculum', policy: 'Assigned academic policy',
}
export interface RiskReadContext {
  complete: Record<string, boolean>
  coverage: string[]
}
/** A failed OR capped source is unusable as evidence of absence. Never swallow
 * it into a successful [] and never resolve alerts on that result. */
export async function readRiskRows(ctx: RiskReadContext, source: string, query: FirebaseFirestore.Query, cap: number): Promise<RiskRow[]> {
  try {
    const snap = await query.limit(cap + 1).get()
    ctx.complete[source] = ctx.complete[source] !== false && snap.size <= cap
    if (snap.size > cap) ctx.coverage.push(`${SOURCE_LABELS[source] || source} exceeded the safety read limit. Related checks are incomplete, not clear.`)
    return rowsOf(snap).slice(0, cap)
  } catch (error) {
    logger.error('[academicRisk] source unavailable', { source, error: error instanceof Error ? error.message : String(error) })
    ctx.complete[source] = false
    ctx.coverage.push(`${SOURCE_LABELS[source] || source} could not be read. Related checks are incomplete; retry later.`)
    return []
  }
}
export function personFromAuth(record: admin.auth.UserRecord): RiskPerson | null {
  const role = normalizeRole(record.customClaims?.role), collegeId = text(record.customClaims?.collegeId)
  if (record.disabled || !['faculty', 'mentor', 'student', 'hod', 'admin', 'principal'].includes(role) || !validId(collegeId)) return null
  return { uid: record.uid, collegeId, role, name: record.displayName || 'Campus member', aliases: [record.uid],
    departments: [text(record.customClaims?.department)].filter(d => !!d && !['all', 'general'].includes(keyText(d))) }
}
/** Roles/tenancy always come from current Auth claims. Staff aliases and a
 * faculty's teaching department may additionally come from management-owned
 * profiles. HOD authority NEVER falls back to an editable users profile. */
export async function resolveRiskPerson(record: admin.auth.UserRecord): Promise<RiskPerson | null> {
  const person = personFromAuth(record)
  if (!person) return null
  if (['faculty', 'mentor'].includes(person.role)) {
    for (const collection of ['faculty', 'mentors', 'hods']) {
      const [direct, linked, legacy] = await Promise.all([
        db().collection(collection).doc(person.uid).get(),
        db().collection(collection).where('uid', '==', person.uid).limit(3).get(),
        db().collection(collection).where('userId', '==', person.uid).limit(3).get(),
      ])
      const profiles = new Map([...linked.docs, ...legacy.docs, ...(direct.exists ? [direct] : [])].map(doc => [doc.id, doc]))
      if (profiles.size > 3) throw new HttpsError('failed-precondition', 'Faculty identity has multiple conflicting profile links. Ask the college administrator to review it.')
      for (const doc of profiles.values()) {
        const data = doc.data() || {}
        if (data.collegeId !== person.collegeId || (data.uid && data.uid !== person.uid) || (data.userId && data.userId !== person.uid)) continue
        person.aliases.push(doc.id, text(data.facultyId))
        person.departments.push(text(data.department), text(data.branch), ...textList(data.branches))
        person.name = text(data.name) || person.name
      }
    }
    person.aliases = [...new Set(person.aliases.filter(validId))]
    person.departments = [...new Set(person.departments.map(keyText).filter(d => !!d && !['all', 'general'].includes(d)))]
    if (person.aliases.length > 20) throw new HttpsError('failed-precondition', 'Faculty identity has too many aliases to check safely.')
  }
  return person
}
export async function requireRiskPerson(uid?: string): Promise<RiskPerson> {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to view academic alerts')
  const person = await resolveRiskPerson(await admin.auth().getUser(uid))
  if (!person) throw new HttpsError('permission-denied', 'Academic alerts require a verified college academic account')
  return person
}
interface CollegeEvidence extends RiskReadContext {
  settings: RiskSettings
  settingsRevision: number
  assignments: RiskRow[]
  tests: RiskRow[]
  roster: RiskRow[]
  holidays: RiskRow[]
  supervisors: RiskPerson[]
  scheme?: CollegeSchemeConfiguration
}
export async function loadCollegeRiskEvidence(collegeId: string): Promise<CollegeEvidence> {
  const ctx: CollegeEvidence = { complete: {}, coverage: [], settings: { ...DEFAULT_RISK_SETTINGS }, settingsRevision: 0, assignments: [], tests: [], roster: [], holidays: [], supervisors: [] }
  const collegeQuery = (collection: string) => db().collection(collection).where('collegeId', '==', collegeId)
  const settings = await db().collection('academicRiskSettings').doc(collegeId).get()
  if (settings.exists) {
    try { ctx.settings = validateRiskSettings(settings.data()?.settings); ctx.settingsRevision = Number(settings.data()?.revision) || 0 }
    catch { ctx.settings.enabled = false; ctx.coverage.push('Risk settings are invalid. The Principal must review them before checks resume.') }
  }
  if (!ctx.settings.enabled) return ctx
  ;[ctx.assignments, ctx.tests, ctx.roster, ctx.holidays] = await Promise.all([
    readRiskRows(ctx, 'assignments', collegeQuery('assignments'), 1500),
    readRiskRows(ctx, 'tests', collegeQuery('scheduledTests'), 1000),
    readRiskRows(ctx, 'roster', collegeQuery('students'), 5000),
    readRiskRows(ctx, 'holidays', collegeQuery('academicCalendar'), 1000),
  ])
  try {
    ctx.scheme = await readCollegeSchemes(collegeId, {
      college: async id => (await db().collection('colleges').doc(id).get()).data(),
      customPack: async id => (await db().collection('schemePacks').doc(id).get()).data(),
    })
    ctx.complete.policy = ctx.scheme.assignments.length > 0
  } catch (error) {
    ctx.complete.policy = false
    logger.warn('[academicRisk] policy unavailable', { collegeId, error: error instanceof Error ? error.message : String(error) })
  }
  // Users are only discovery hints. Validate every recipient against Auth.
  try {
    const hints = await collegeQuery('users').where('role', 'in', ['hod', 'admin', 'principal']).limit(201).get()
    if (hints.size > 200) ctx.coverage.push('The supervisor directory exceeded its read limit. Some escalation recipients may be missing.')
    for (let i = 0; i < Math.min(hints.size, 200); i += 100) {
      const records = await admin.auth().getUsers(hints.docs.slice(i, i + 100).map(d => ({ uid: d.id })))
      for (const record of records.users) {
        const person = personFromAuth(record)
        if (person && person.collegeId === collegeId && ['hod', 'admin', 'principal'].includes(person.role)) ctx.supervisors.push(person)
      }
    }
  } catch (error) {
    ctx.coverage.push('The verified HOD/Principal directory could not be read. Escalation coverage is incomplete.')
    logger.error('[academicRisk] escalation directory unavailable', { collegeId, error: String(error) })
  }
  return ctx
}
async function readRelated(ctx: RiskReadContext, source: string, collection: string, field: string, ids: string[], cap: number): Promise<RiskRow[]> {
  let out: RiskRow[] = []
  ctx.complete[source] = true
  for (let i = 0; i < ids.length; i += 30) {
    const left = cap - out.length
    if (left <= 0) { ctx.complete[source] = false; ctx.coverage.push(`${SOURCE_LABELS[source]} exceeded the safety read limit.`); break }
    out = out.concat(await readRiskRows(ctx, source, db().collection(collection).where(field, 'in', ids.slice(i, i + 30)), left))
  }
  return [...new Map(out.map(r => [r.id, r])).values()]
}
export async function collectRiskEvidence(person: RiskPerson, college: CollegeEvidence, now: number): Promise<RiskEvidence> {
  const e: RiskEvidence = { person, now, settings: college.settings, complete: { ...college.complete, identity: true }, coverage: [...college.coverage],
    assignments: college.assignments, tests: college.tests, roster: college.roster, holidays: college.holidays,
    sessions: [], attendance: [], submissions: [], attempts: [], topics: [], mappings: [], curricula: [], staffRecords: [] }
  if (!college.settings.enabled) return e
  const from = istDate(now - RISK_LOOKBACK_DAYS * DAY_MS), today = istDate(now)
  if (person.role === 'student') {
    const linked = await db().collection('students').where('userId', '==', person.uid).limit(2).get()
    if (linked.size !== 1 || linked.docs[0].data().collegeId !== person.collegeId) throw new HttpsError('failed-precondition', 'A single student profile in your verified college must be linked before academic checks can run.')
    person.student = { ...linked.docs[0].data(), id: linked.docs[0].id }
    const sid = person.student.id
    ;[e.attendance, e.submissions, e.attempts] = await Promise.all([
      readRiskRows(e, 'attendance', db().collection('attendanceRecords').where('studentId', '==', sid), 5000),
      readRiskRows(e, 'submissions', db().collection('submissions').where('studentId', '==', sid), 2000),
      readRiskRows(e, 'attempts', db().collection('studentAssessments').where('studentId', '==', sid), 2000),
    ])
    for (const [source, rows] of [['attendance', e.attendance], ['submissions', e.submissions], ['attempts', e.attempts]] as const) {
      if (rows.some(r => r.collegeId !== person.collegeId)) { e.complete[source] = false; e.coverage.push(`${SOURCE_LABELS[source]} contain invalid tenant linkage and need administrator review.`) }
    }
    if (college.scheme) {
      try {
        const selected = selectCollegeScheme(college.scheme, { programme: text(person.student.programme || person.student.program || person.student.course || person.student.branch), batch: text(person.student.batch || person.student.academicYear), semester: Number(person.student.semester) || undefined })
        e.attendanceMinimum = { percentage: selected.pack.attendance.minimumPercentage, schemeCode: selected.pack.code }
        e.complete.policy = true
      } catch { e.complete.policy = false }
    }
    return e
  }
  const own = (collection: string) => db().collection(collection).where('collegeId', '==', person.collegeId).where('facultyId', 'in', person.aliases)
  const dated = (collection: string, start = from) => own(collection).where('date', '>=', start).where('date', '<=', today)
  const [sessions, weekly, registers, staffRecords, topics, mappings, schedule] = await Promise.all([
    readRiskRows(e, 'sessions', dated('classSessions'), 1000),
    readRiskRows(e, 'weekly', own('weeklySchedules'), 200),
    readRiskRows(e, 'registers', dated('attendance'), 1000),
    readRiskRows(e, 'staffRecords', dated('staffAttendance', istDate(now - 7 * DAY_MS)), 50),
    readRiskRows(e, 'topics', own('facultyTopics'), 1500),
    readRiskRows(e, 'mappings', own('curriculumFacultyMappings'), 100),
    db().collection('riskStaffSchedules').doc(riskHash(person.collegeId, person.uid)).get(),
  ])
  e.staffRecords = staffRecords; e.topics = topics; e.mappings = mappings
  e.complete.staffSchedule = schedule.exists && schedule.data()?.collegeId === person.collegeId && schedule.data()?.facultyUid === person.uid
  if (e.complete.staffSchedule) e.staffSchedule = { ...schedule.data(), id: schedule.id }
  else if (schedule.exists) e.coverage.push('The working schedule has invalid faculty/college linkage. No check-in/out absence was inferred.')
  const registerIds = new Set(registers.filter(r => r.collegeId === person.collegeId && r.markedAt && Array.isArray(r.records)).map(r => text(r.sessionId)))
  const byId = new Map(sessions.map(r => [r.id, { ...r, registerFound: registerIds.has(r.id) }]))
  for (const row of weekly) {
    if (!isSlotActive(row as WeeklySlot) || !isScheduleVisibleToStudents(row.approvalStatus)) continue
    if ((row.effectiveFrom && !dateKey(row.effectiveFrom)) || (row.effectiveTo && !dateKey(row.effectiveTo))) { e.complete.weekly = false; e.coverage.push('A published slot has invalid effective dates; no missing register was inferred from it.'); continue }
    try {
      for (const date of expandWeeklyRange(from, today, row.dayOfWeek)) {
        if (!slotAppliesOn(row as WeeklySlot, date)) continue
        const id = slotDateKey(row.id, date)
        if (!byId.has(id)) byId.set(id, { ...buildSessionDoc(row as WeeklySlot, date, new Date(now)), id, registerFound: registerIds.has(id) })
      }
    } catch { e.complete.weekly = false; e.coverage.push('A weekly timetable slot has invalid dates or times; missing-register coverage is incomplete.') }
  }
  e.sessions = [...byId.values()]
  const ids = [...new Set(mappings.map(r => text(r.curriculumId)).filter(validId))]
  e.complete.curricula = true
  if (ids.length) {
    try {
      const docs = await db().getAll(...ids.map(id => db().collection('curriculum').doc(id)))
      e.curricula = docs.filter(d => d.exists && d.data()?.collegeId === person.collegeId).map(d => ({ ...d.data(), id: d.id }))
      if (e.curricula.length !== ids.length) { e.complete.curricula = false; e.coverage.push('Some assigned curricula are missing or have invalid college linkage.') }
    } catch { e.complete.curricula = false; e.coverage.push('Approved curricula could not be read; completion checks are incomplete.') }
  }
  const owned = (r: RiskRow) => r.collegeId === person.collegeId && person.aliases.includes(text(r.facultyUid || r.facultyId))
  ;[e.submissions, e.attempts] = await Promise.all([
    readRelated(e, 'submissions', 'submissions', 'assignmentId', e.assignments.filter(owned).map(r => r.id), 5000),
    readRelated(e, 'attempts', 'studentAssessments', 'testId', e.tests.filter(owned).map(r => r.id), 5000),
  ])
  for (const [source, rows] of [['submissions', e.submissions], ['attempts', e.attempts]] as const) if (rows.some(r => r.collegeId !== person.collegeId)) {
    e.complete[source] = false; e.coverage.push(`${SOURCE_LABELS[source]} contain incomplete college linkage; no missing-submission totals were asserted.`)
  }
  return e
}
function alertPathFor(recipient: RiskPerson, subject: RiskPerson, finding: RiskFinding): string {
  if (recipient.uid === subject.uid) return finding.path
  // Supervisor links stay in the admin permission surface, not faculty routes.
  if (finding.category === 'class-register') return '/admin/attendance'
  if (finding.category === 'staff-attendance') return '/admin/faculty-attendance'
  if (finding.category === 'curriculum') return '/admin/curriculum-progress'
  if (finding.category === 'assignment') return '/admin/assignment-analytics'
  if (finding.category === 'assessment') return '/admin/test-reports'
  return '/admin/risk-alerts'
}
async function saveRiskAlert(subject: RiskPerson, recipient: RiskPerson, finding: RiskFinding, now: number) {
  const id = riskHash(subject.collegeId, subject.uid, recipient.uid, finding.key)
  const ref = db().collection('riskAlerts').doc(id)
  await db().runTransaction(async tx => {
    const previous = await tx.get(ref), old = previous.data()
    const { notify, generation, read } = riskAlertTransition(old, finding)
    const next = {
      ...finding, id, collegeId: subject.collegeId, recipientUid: recipient.uid, recipientRole: recipient.role,
      subjectUid: subject.uid, subjectRole: subject.role, subjectName: subject.name, subjectDepartments: subject.departments,
      path: alertPathFor(recipient, subject, finding), state: 'active', stale: false,
      read, ...(read && typeof old?.readAt === 'number' ? { readAt: old.readAt } : {}),
      generation, createdAt: old?.createdAt || now, resolvedAt: null,
    }
    if (old) {
      const { updatedAt: _updatedAt, checkedAt: _checkedAt, ...previousContent } = old
      // A fresh run timestamp is stored once per subject below. Do not bill an
      // alert write (or change inbox order) for an unchanged finding copy.
      if (isDeepStrictEqual(previousContent, next)) return
    }
    tx.set(ref, { ...next, updatedAt: now, checkedAt: now })
    if (notify) tx.create(db().collection('riskPushOutbox').doc(`${id}__${generation}`), { alertId: id, generation, recipientUid: recipient.uid, collegeId: subject.collegeId, status: 'pending', createdAt: now, attempts: 0 })
  })
}
export async function refreshRiskSubject(person: RiskPerson, college: CollegeEvidence, now = Date.now()) {
  const lock = db().collection('riskSubjectLocks').doc(riskHash(person.collegeId, person.uid))
  const lease = riskHash(String(now), String(Math.random()))
  await db().runTransaction(async tx => {
    const old = await tx.get(lock)
    if (Number(old.data()?.leaseUntil) > Date.now()) throw new HttpsError('resource-exhausted', 'Your records are already being checked. Refresh the inbox shortly.')
    tx.set(lock, { lease, leaseUntil: Date.now() + 10 * 60_000 })
  })
  try { return await refreshRiskSubjectWithLease(person, college, now) }
  finally {
    await db().runTransaction(async tx => { const current = await tx.get(lock); if (current.data()?.lease === lease) tx.delete(lock) })
  }
}
async function refreshRiskSubjectWithLease(person: RiskPerson, college: CollegeEvidence, now: number) {
  const evidence = await collectRiskEvidence(person, college, now)
  const result = buildRiskFindings(evidence)
  evidence.complete = result.complete
  const recipients = riskRecipients(person, college.supervisors)
  if (person.role !== 'student' && college.settings.enabled) {
    if (!recipients.some(p => p.role === 'principal')) result.coverage.push('No verified college Principal recipient was found. Principal escalation needs administrator review.')
    if (!recipients.some(p => ['hod', 'admin'].includes(p.role) && p.uid !== person.uid)) result.coverage.push('No verified matching department HOD recipient was found. HOD escalation needs administrator review.')
  }
  const findings: RiskFinding[] = [...result.findings]
  if (result.coverage.length) findings.push({ key: 'coverage:summary', category: 'coverage', severity: 'info', sourceId: 'coverage', title: 'Some academic checks need more data', message: [...new Set(result.coverage)].join('\n'), path: person.role === 'student' ? '/student/risk-alerts' : '/faculty/risk-alerts', dependencies: ['identity'] })
  const nextKeys = new Set(findings.map(f => f.key))
  // Includes previously escalated recipients: scopes are rechecked at READ
  // and PUSH time, so a moved/demoted HOD cannot retain access to old copies.
  const previous = await db().collection('riskAlerts').where('subjectUid', '==', person.uid).where('collegeId', '==', person.collegeId).where('state', 'in', ['active', 'unverified']).limit(3001).get()
  if (previous.size > 3000) throw new HttpsError('resource-exhausted', 'Risk history needs archive maintenance before this account can be checked safely.')
  for (const recipient of recipients) for (const finding of findings) await saveRiskAlert(person, recipient, finding, now)
  let batch = db().batch()
  let pending = 0
  for (const doc of previous.docs) {
    const old = doc.data()
    if (nextKeys.has(old.key)) continue
    const state = riskReconciliationState(old, nextKeys, evidence.complete, evidence.settings.enabled, now)
    if (old.state === state && old.stale === (state === 'unverified')) continue
    batch.update(doc.ref, { state, stale: state === 'unverified', checkedAt: now, updatedAt: now, ...(state === 'resolved' ? { resolvedAt: now } : {}) })
    pending++
    if (pending >= 400) { await batch.commit(); batch = db().batch(); pending = 0 }
  }
  if (pending) await batch.commit()
  await db().collection('riskSubjectRuns').doc(riskHash(person.collegeId, person.uid)).set({ collegeId: person.collegeId, subjectUid: person.uid, checkedAt: now, settingsRevision: college.settingsRevision, complete: evidence.complete, coverage: result.coverage, findingCount: result.findings.length })
  return { checkedAt: now, findings: result.findings.length, coverage: result.coverage }
}
/** Current claims and current subject departments are checked on every inbox
 * read and every push send, not just when the alert was first materialised. */
export async function filterReadableRiskAlerts(person: RiskPerson, alerts: RiskRow[]): Promise<RiskRow[]> {
  const possible = alerts.filter(a => canReadRiskAlert(person, a))
  const subjects = [...new Set(possible.filter(a => a.subjectUid !== person.uid).map(a => text(a.subjectUid)))]
  const current = new Map<string, RiskPerson>()
  for (const uid of subjects) {
    try { const subject = await resolveRiskPerson(await admin.auth().getUser(uid)); if (subject) current.set(uid, subject) }
    catch (error) { logger.warn('[academicRisk] subject scope unavailable', { uid, error: String(error) }) }
  }
  return possible.filter(a => {
    if (a.subjectUid === person.uid) return true
    const subject = current.get(a.subjectUid)
    if (!subject || subject.role === 'student' || subject.collegeId !== person.collegeId) return false
    return canReadRiskAlert(person, { ...a, subjectDepartments: subject.departments })
  })
}
export function validateStaffRiskSchedule(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('A working schedule is required')
  const r = raw as Record<string, any>
  const days = Array.isArray(r.days) ? [...new Set(r.days)] : []
  if (!days.length || days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error('Choose at least one working weekday')
  const time = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!time.test(r.startTime) || !time.test(r.endTime) || r.startTime >= r.endTime) throw new Error('Enter same-day working hours with the end after the start')
  if (!dateKey(r.effectiveFrom) || (r.effectiveTo && (!dateKey(r.effectiveTo) || r.effectiveTo < r.effectiveFrom))) throw new Error('Enter valid effective dates in order')
  if (!Array.isArray(r.excludedDates) || r.excludedDates.length > 100 || r.excludedDates.some(d => !dateKey(d))) throw new Error('Excluded dates must be real yyyy-mm-dd dates (at most 100)')
  return { days: days.sort(), startTime: r.startTime as string, endTime: r.endTime as string, effectiveFrom: r.effectiveFrom as string, effectiveTo: text(r.effectiveTo), excludedDates: [...new Set(r.excludedDates as string[])] }
}
