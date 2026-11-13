/** Academic early-warning decisions. No Firebase/browser I/O: all evidence and
 * completeness markers are supplied by the server. Missing evidence is NEVER
 * equivalent to a zero, absence, non-submission or completed check. */
export type RiskRow = { id: string; [key: string]: any }
export type RiskCategory = 'attendance' | 'class-register' | 'staff-attendance' | 'curriculum' | 'assignment' | 'assessment' | 'coverage'
export type RiskSeverity = 'info' | 'warning' | 'critical'
export interface RiskSettings {
  enabled: boolean
  attendanceWarningBuffer: number
  deadlineWarningHours: number
  registerGraceHours: number
  staffGraceMinutes: number
  curriculumLagDays: number
  curriculumLagPercent: number
  gradingBacklogDays: number
}
export const DEFAULT_RISK_SETTINGS: Readonly<RiskSettings> = Object.freeze({
  enabled: true, attendanceWarningBuffer: 5, deadlineWarningHours: 48,
  registerGraceHours: 2, staffGraceMinutes: 30, curriculumLagDays: 7,
  curriculumLagPercent: 10, gradingBacklogDays: 7,
})
export const RISK_SETTING_RANGES = {
  attendanceWarningBuffer: [0, 25], deadlineWarningHours: [1, 168],
  registerGraceHours: [0, 48], staffGraceMinutes: [0, 240],
  curriculumLagDays: [0, 60], curriculumLagPercent: [0, 100], gradingBacklogDays: [1, 60],
} as const
export function validateRiskSettings(raw: unknown): RiskSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Risk settings are required')
  const value = raw as Record<string, unknown>
  if (Object.keys(value).some(k => k !== 'enabled' && !Object.prototype.hasOwnProperty.call(RISK_SETTING_RANGES, k))) throw new Error('Unknown risk setting')
  if (typeof value.enabled !== 'boolean') throw new Error('Choose whether risk checks are enabled')
  const result = { enabled: value.enabled } as RiskSettings
  for (const [key, [min, max]] of Object.entries(RISK_SETTING_RANGES)) {
    const number = value[key]
    if (typeof number !== 'number' || !Number.isFinite(number) || !Number.isInteger(number) || number < min || number > max) throw new Error(`${key} must be a whole number between ${min} and ${max}`)
    ;(result as unknown as Record<string, unknown>)[key] = number
  }
  return result
}
export interface RiskPerson {
  uid: string
  collegeId: string
  role: string
  name: string
  aliases: string[]
  /** Only verified claims or management-owned staff profiles, never users.department. */
  departments: string[]
  student?: RiskRow
}
export interface RiskFinding {
  key: string
  category: RiskCategory
  severity: RiskSeverity
  title: string
  message: string
  sourceId: string
  path: string
  dependencies: string[]
  evidenceDate?: string
  expiresAt?: number
}
export interface RiskEvidence {
  person: RiskPerson
  now: number
  settings: RiskSettings
  /** False includes failed reads, truncation and invalid source configuration. */
  complete: Record<string, boolean>
  coverage: string[]
  sessions: RiskRow[]
  attendance: RiskRow[]
  assignments: RiskRow[]
  submissions: RiskRow[]
  tests: RiskRow[]
  attempts: RiskRow[]
  topics: RiskRow[]
  mappings: RiskRow[]
  curricula: RiskRow[]
  roster: RiskRow[]
  staffRecords: RiskRow[]
  staffSchedule?: RiskRow
  holidays: RiskRow[]
  attendanceMinimum?: { percentage: number; schemeCode: string }
}
export const DAY_MS = 86_400_000
export const RISK_LOOKBACK_DAYS = 30
export const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
export const keyText = (value: unknown): string => text(value).toLowerCase().replace(/\s+/g, ' ')
export const textList = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : []
export function dateKey(value: unknown): string {
  const s = text(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return ''
  const ms = Date.parse(`${s}T00:00:00Z`)
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === s ? s : ''
}
export function riskDateMs(value: unknown, dateOnlyEnd = true): number {
  if (!value) return NaN
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && typeof (value as any).toDate === 'function') return (value as any).toDate().getTime()
  if (typeof value === 'object' && typeof (value as any).seconds === 'number') return (value as any).seconds * 1000
  if (typeof value !== 'string') return NaN
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return dateKey(value) ? Date.parse(`${value}T${dateOnlyEnd ? '23:59:59.999' : '00:00:00'}+05:30`) : NaN
  // Reject ambiguous wall clocks and JS Date's rollover of impossible ISO
  // dates (for example February 30 or 24:00 on the following day).
  const instant = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/
  return dateKey(value.slice(0, 10)) && instant.test(value) ? Date.parse(value) : NaN
}
export const istDate = (now: number): string => new Date(now + 330 * 60_000).toISOString().slice(0, 10)
export function wallTime(date: unknown, time: unknown): number {
  return dateKey(date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(text(time)) ? Date.parse(`${date}T${time}:00+05:30`) : NaN
}
export function isActiveStudent(row: RiskRow): boolean {
  return !['inactive', 'alumni', 'graduated', 'transferred', 'withdrawn', 'deleted', 'suspended'].includes(keyText(row.status))
}
function studentValues(student: RiskRow, uid = '') {
  return { id: student.id, uid: uid || text(student.userId), regNo: text(student.regNo || student.registrationNumber),
    branch: text(student.branch || student.department), batch: text(student.batch || student.academicYear),
    division: text(student.division || student.section), section: text(student.section || student.division), semester: Number(student.semester) || 0 }
}
/** Same explicit audience semantics as studentPortal; an empty cohort isn't a broadcast. */
export function riskAssignmentTargets(assignment: RiskRow, student: RiskRow, uid = ''): boolean {
  if (assignment.collegeId !== student.collegeId) return false
  const s = studentValues(student, uid)
  if (assignment.targetType === 'specific') return textList(assignment.studentIds).includes(s.id) || (!!s.uid && textList(assignment.studentUids).includes(s.uid))
  const cohort = assignment.cohort
  if (!cohort || typeof cohort !== 'object') return false
  if (![cohort.branch, cohort.batch, cohort.division].some(v => text(v)) && !(Number(cohort.semester) > 0)) return false
  return (!cohort.branch || String(cohort.branch) === s.branch) && (!cohort.batch || String(cohort.batch) === s.batch)
    && (!cohort.division || String(cohort.division) === s.division) && (!cohort.semester || Number(cohort.semester) === s.semester)
}
/** Mirror the production scheduledTests visibility/audience, including regNo targets. */
export function riskTestTargets(test: RiskRow, student: RiskRow, uid = ''): boolean {
  if (test.collegeId !== student.collegeId) return false
  const s = studentValues(student, uid)
  if (test.visibility === 'public' || test.visibility === 'college') return true
  const targets = textList(test.targetStudents)
  if ([s.id, s.uid, s.regNo].some(id => !!id && targets.includes(id))) return true
  const normalizeSection = (v: unknown) => keyText(v).replace(/^section\s+/, '')
  if (Array.isArray(test.targetSections) && test.targetSections.some((t: any) => {
    if (!t || typeof t !== 'object') return false
    const section = normalizeSection(t.section || t.division || t.sectionName || t.sectionId)
    return !!section && [s.section, s.division].map(normalizeSection).includes(section)
      && (!t.branch || String(t.branch) === s.branch) && (!t.batch || String(t.batch) === s.batch) && (!t.semester || Number(t.semester) === s.semester)
  })) return true
  const fields = ['branch', 'batch', 'division', 'section'] as const
  if (!fields.some(k => text(test[k])) && !(Number(test.semester) > 0)) return false
  return fields.every(k => !test[k] || String(test[k]) === s[k]) && (!test.semester || Number(test.semester) === s.semester)
}
/** Payload identity is never used to select escalation recipients. */
export function riskRecipients(subject: RiskPerson, candidates: RiskPerson[]): RiskPerson[] {
  const selected = [subject]
  if (subject.role === 'student') return selected
  const depts = subject.departments.map(keyText).filter(v => v && v !== 'all' && v !== 'general')
  for (const person of candidates) {
    if (person.collegeId !== subject.collegeId) continue
    if (person.role === 'principal' || (['hod', 'admin'].includes(person.role) && depts.length > 0
      && person.departments.some(d => depts.includes(keyText(d))))) selected.push(person)
  }
  return [...new Map(selected.map(p => [p.uid, p])).values()]
}
export function canReadRiskAlert(person: RiskPerson, alert: Record<string, any>): boolean {
  if (alert.recipientUid !== person.uid || alert.collegeId !== person.collegeId || alert.recipientRole !== person.role) return false
  if (alert.subjectUid === person.uid) return true
  if (alert.subjectRole === 'student') return false
  if (person.role === 'principal') return true
  return ['hod', 'admin'].includes(person.role) && textList(alert.subjectDepartments).some(d => person.departments.map(keyText).includes(keyText(d)) && !['', 'all', 'general'].includes(keyText(d)))
}
function bestRows(rows: RiskRow[], parent: string, studentId?: string): Map<string, RiskRow> {
  const out = new Map<string, RiskRow>()
  for (const row of rows) {
    if (studentId && row.studentId !== studentId) continue
    const id = text(row[parent])
    if (!id) continue
    const prev = out.get(id)
    const stamp = (r: RiskRow) => riskDateMs(r.submittedAt || r.updatedAt || r.startedAt)
    if (!prev || (Number.isFinite(stamp(row)) && (!Number.isFinite(stamp(prev)) || stamp(row) >= stamp(prev)))) out.set(id, row)
  }
  return out
}
export function buildRiskFindings(e: RiskEvidence): { findings: RiskFinding[]; coverage: string[]; complete: Record<string, boolean> } {
  const findings: RiskFinding[] = []
  const evaluated = { ...e.complete }
  const coverage = new Set(e.coverage)
  const { person: p, settings: s, now } = e
  const same = (r: RiskRow) => r.collegeId === p.collegeId
  const owned = (r: RiskRow) => same(r) && p.aliases.includes(text(r.facultyUid || r.facultyId))
  const complete = (...sources: string[]) => sources.every(source => evaluated[source] === true)
  const warn = (message: string) => coverage.add(message)
  const defer = (source: string, message: string) => { evaluated[source] = false; warn(message) }
  const add = (category: RiskCategory, sourceId: string, severity: RiskSeverity, title: string, message: string, path: string, dependencies: string[], evidenceDate?: string) => {
    findings.push({ key: `${category}:${sourceId}`, category, sourceId, severity, title, message, path, dependencies, ...(evidenceDate ? { evidenceDate } : {}) })
  }
  if (!s.enabled) return { findings, complete: evaluated, coverage: ['Academic risk checks are paused by the college Principal. Existing alerts are not automatically marked resolved.'] }
  if (p.role === 'student') {
    const student = p.student
    if (!student || !isActiveStudent(student)) return { findings, complete: evaluated, coverage: ['An active, uniquely linked student profile is required.'] }
    const cohort = studentValues(student, p.uid)
    const allAttendance = e.attendance.filter(r => same(r) && r.studentId === student.id)
    // The lifetime summary spans semesters. Never apply a current-semester
    // scheme to that mixed denominator; use the canonical per-class records.
    const ambiguous = allAttendance.some(r => !Number(r.semester) || !r.batch)
    const records = allAttendance.filter(r => Number(r.semester) === cohort.semester && String(r.batch) === cohort.batch)
    const bySession = new Map<string, RiskRow>()
    let invalid = false
    for (const r of records) {
      const id = text(r.classSessionId || r.sessionId)
      const status = keyText(r.status).replace(/[-_ ]/g, '')
      if (!id || !dateKey(r.date) || riskDateMs(r.date, false) > now || !['present', 'late', 'onduty', 'absent', 'leave', 'medicalleave', 'medical'].includes(status)) { invalid = true; continue }
      const prev = bySession.get(id)
      if (prev && keyText(prev.status) !== keyText(r.status)) invalid = true
      bySession.set(id, r)
    }
    const current = [...bySession.values()]
    if (!cohort.semester || !cohort.batch || ambiguous || invalid) defer('attendance', 'Attendance percentage needs complete semester/batch metadata and consistent class records; no eligibility conclusion was made.')
    if (!e.attendanceMinimum) defer('policy', 'Attendance policy could not be resolved from the assigned scheme. No default university or 75% threshold was applied.')
    if (!current.length) defer('attendance', 'No confirmed attendance records are available for this student’s current semester and batch.')
    if (complete('attendance', 'policy') && e.attendanceMinimum && current.length && cohort.semester && cohort.batch && !ambiguous && !invalid) {
      const present = current.filter(r => ['present', 'late', 'onduty'].includes(keyText(r.status).replace(/[-_ ]/g, ''))).length
      const percentage = present / current.length * 100
      const required = e.attendanceMinimum.percentage
      if (percentage < Math.min(100, required + s.attendanceWarningBuffer)) add('attendance', `${student.id}:${cohort.batch}:${cohort.semester}`, percentage < required ? 'critical' : 'warning',
        percentage < required ? 'Attendance below the assigned requirement' : 'Attendance is close to the requirement',
        `${percentage.toFixed(1)}% across ${current.length} recorded classes this semester; ${e.attendanceMinimum.schemeCode} requires ${required}%. This is an early warning, not a final exam-eligibility decision.`,
        '/student/attendance', ['attendance', 'policy'])
    }
    const missed = current.filter(r => keyText(r.status) === 'absent' && riskDateMs(r.date, false) <= now && riskDateMs(r.date) >= now - 14 * DAY_MS)
    if (missed.length) add('attendance', `missed:${student.id}`, 'warning', 'Recorded missed classes',
      `${missed.length} class${missed.length === 1 ? '' : 'es'} marked absent in the last 14 days. Check your attendance record and contact your faculty if a correction is needed.`,
      '/student/attendance', ['attendance'], missed.map(r => r.date).sort().slice(-1)[0])
    if (missed.length) findings[findings.length - 1].expiresAt = Math.max(...missed.map(r => riskDateMs(r.date))) + 14 * DAY_MS
    const submissions = bestRows(e.submissions.filter(r => same(r) && ['submitted', 'late', 'graded'].includes(r.status)), 'assignmentId', student.id)
    for (const a of e.assignments.filter(r => same(r) && ['published', 'ongoing', 'closed', 'graded'].includes(r.status) && riskAssignmentTargets(r, student, p.uid))) {
      if (submissions.has(a.id)) continue
      const due = riskDateMs(a.deadline || a.dueDate)
      if (!Number.isFinite(due)) { defer('assignments', 'An assigned assignment has no valid deadline; deadline checks for it were skipped.'); continue }
      if (!complete('submissions')) continue
      if (now > due) add('assignment', a.id, 'critical', 'Assignment submission missing', `${text(a.title) || 'Assignment'} passed its deadline on ${istDate(due)} with no completed submission recorded.`, '/student/assignments', ['assignments', 'submissions'])
      else if (due - now <= s.deadlineWarningHours * 3_600_000) add('assignment', a.id, 'warning', 'Assignment due soon', `${text(a.title) || 'Assignment'} is due ${new Date(due).toISOString()}. Submit from Assignments before the deadline.`, '/student/assignments', ['assignments', 'submissions'])
    }
    const attempts = bestRows(e.attempts.filter(same), 'testId', student.id)
    for (const t of e.tests.filter(r => same(r) && ['published', 'ongoing', 'completed'].includes(r.status) && riskTestTargets(r, student, p.uid))) {
      const attempt = attempts.get(t.id)
      if (attempt && ['submitted', 'graded'].includes(attempt.status)) continue
      const start = riskDateMs(t.startDateTime || t.scheduledAt, false), end = riskDateMs(t.endDateTime)
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) { defer('tests', 'A targeted assessment has an incomplete testing window; missed-test checks for it were skipped.'); continue }
      if (!complete('attempts')) continue
      if (attempt && !['not_started', 'in_progress'].includes(attempt.status)) { defer('attempts', 'An assessment attempt has an unknown state; it was not labelled missed.'); continue }
      if (now > end) add('assessment', t.id, 'critical', attempt?.status === 'in_progress' ? 'Assessment attempt needs review' : 'Assessment window missed',
        attempt?.status === 'in_progress' ? `${text(t.title) || 'Assessment'} ended but the attempt is still in progress. Contact your faculty to confirm final submission.`
          : `${text(t.title) || 'Assessment'} ended on ${istDate(end)} with no attempt recorded. Contact your faculty for the next step.`, '/student/assessments', ['tests', 'attempts'])
      else if (start - now <= s.deadlineWarningHours * 3_600_000) add('assessment', t.id, 'warning', now >= start ? 'Assessment is available now' : 'Assessment coming up',
        `${text(t.title) || 'Assessment'}: ${new Date(start).toISOString()} to ${new Date(end).toISOString()}. ${attempt?.status === 'in_progress' ? 'Resume your active attempt.' : 'Read the instructions and complete your attempt in this window.'}`,
        '/student/assessments', ['tests', 'attempts'])
    }
  } else {
    const isHoliday = (date: string) => e.holidays.some(h => same(h) && h.suspendsClasses !== false && dateKey(h.startDate) && dateKey(h.endDate) && date >= h.startDate && date <= h.endDate)
    const isStaffHoliday = (date: string) => e.holidays.some(h => same(h) && ['public-holiday', 'college-holiday'].includes(h.type) && h.suspendsClasses !== false && dateKey(h.startDate) && dateKey(h.endDate) && date >= h.startDate && date <= h.endDate)
    if (e.holidays.some(h => h.suspendsClasses !== false && (!dateKey(h.startDate) || !dateKey(h.endDate) || h.startDate > h.endDate))) defer('holidays', 'Some class-suspending calendar events have invalid dates. Attendance absence checks are incomplete.')
    if (complete('sessions', 'registers', 'weekly', 'holidays')) for (const session of e.sessions.filter(owned)) {
      if (['cancelled', 'canceled', 'rescheduled'].includes(keyText(session.status)) || isHoliday(session.date)) continue
      if (!['scheduled', 'completed', 'ongoing', 'active', 'attendance_marked'].includes(keyText(session.status))) { defer('sessions', 'A class has an unknown lifecycle state; no missing register was inferred for it.'); continue }
      const end = wallTime(session.date, session.endTime)
      if (!Number.isFinite(end)) { defer('sessions', 'Some class sessions have no valid date/end time; unmarked-register checks for them were skipped.'); continue }
      if (end + s.registerGraceHours * 3_600_000 >= now) continue
      // A zero attendanceCount is also the untouched default of every generated
      // session. Conversely, a confirmed marked flag works even for an empty class.
      const marked = session.attendanceMarked === true || session.registerFound === true
      if (!marked) add('class-register', session.id, 'warning', 'Class attendance register is unmarked',
        `${text(session.subject) || 'Class'} on ${session.date}, ${text(session.startTime)}–${text(session.endTime)} has no marked register after the ${s.registerGraceHours}-hour buffer.`,
        '/faculty/attendance', ['sessions', 'registers', 'weekly', 'holidays'], session.date)
    }
    if (!e.sessions.length) warn('No class occurrences were found in the last 30 days. A published timetable is needed to check missing registers.')
    const schedule = e.staffSchedule
    if (!schedule) defer('staffSchedule', 'Faculty check-in/out monitoring is not configured: the Principal must assign a working schedule. No working days were assumed.')
    else if (complete('staffRecords', 'staffSchedule', 'holidays')) {
      const startDate = dateKey(schedule.effectiveFrom), endDate = dateKey(schedule.effectiveTo)
      const scheduleStart = wallTime('2000-01-01', schedule.startTime), scheduleEnd = wallTime('2000-01-01', schedule.endTime)
      const validSchedule = startDate && (!schedule.effectiveTo || (endDate && endDate >= startDate))
        && Array.isArray(schedule.days) && schedule.days.length > 0 && schedule.days.every((d: unknown) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6)
        && Array.isArray(schedule.excludedDates) && schedule.excludedDates.every((d: unknown) => !!dateKey(d))
        && Number.isFinite(scheduleStart) && Number.isFinite(scheduleEnd) && scheduleEnd > scheduleStart
      if (!validSchedule) defer('staffSchedule', 'The working schedule needs valid effective dates, exclusions, same-day hours and explicit working weekdays.')
      for (let days = 0; validSchedule && days < 7; days++) {
        const day = istDate(now - days * DAY_MS)
        const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
        if (!startDate || day < startDate || (endDate && day > endDate) || !Array.isArray(schedule.days) || !schedule.days.includes(weekday) || textList(schedule.excludedDates).includes(day) || isStaffHoliday(day)) continue
        const rows = e.staffRecords.filter(r => same(r) && p.aliases.includes(text(r.facultyId)) && r.date === day)
        if (rows.length > 1 && new Set(rows.map(r => `${r.status}|${r.checkIn}|${r.checkOut}`)).size > 1) { defer('staffRecords', 'Conflicting staff attendance records need review; no missing check-in/out was inferred for those dates.'); continue }
        const record = rows[0]
        if (record && ['leave', 'medical', 'onduty', 'wfh'].includes(keyText(record.status))) continue
        const start = wallTime(day, schedule.startTime), end = wallTime(day, schedule.endTime)
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) { defer('staffSchedule', 'The faculty working schedule has invalid times; check-in/out checks were skipped.'); break }
        const checkIn = record && wallTime(day, record.checkIn), checkOut = record && wallTime(day, record.checkOut)
        const missingIn = now > start + s.staffGraceMinutes * 60_000 && !Number.isFinite(checkIn)
        const missingOut = now > end + s.staffGraceMinutes * 60_000 && !Number.isFinite(checkOut)
        if (missingIn || missingOut) add('staff-attendance', day, 'warning', 'Faculty attendance needs attention',
          `${day}: ${missingIn && missingOut ? 'check-in and check-out are' : missingIn ? 'check-in is' : 'check-out is'} missing against your assigned ${schedule.startTime}–${schedule.endTime} working schedule (${s.staffGraceMinutes}-minute buffer).`,
          '/faculty/my-attendance', ['staffRecords', 'staffSchedule', 'holidays'], day)
        if (missingIn || missingOut) findings[findings.length - 1].expiresAt = riskDateMs(day) + 7 * DAY_MS
      }
    }
    if (complete('topics', 'mappings', 'curricula')) {
      const activeMappings = e.mappings.filter(r => owned(r) && r.status !== 'inactive' && r.status !== 'archived')
      const approved = new Map(e.curricula.filter(r => same(r) && r.status === 'active' && (!r.approvalStatus || r.approvalStatus === 'approved')).map(r => [r.id, r]))
      let dated = 0
      for (const mapping of activeMappings) {
        const curriculum = approved.get(text(mapping.curriculumId))
        const courses: any[] = Array.isArray(curriculum?.courses) ? curriculum.courses : []
        const course = courses.find(c => (mapping.courseId && c.id === mapping.courseId) || (mapping.courseCode && c.code === mapping.courseCode))
        if (!course) { defer('curricula', 'An assigned course has no readable approved curriculum; no completion percentage was invented.'); continue }
        const planned = new Set<string>((Array.isArray(course.modules) ? course.modules : []).flatMap((m: any) => textList(m.topics).map(keyText)))
        const ledger = e.topics.filter(t => owned(t) && (t.curriculumId ? t.curriculumId === curriculum!.id : true)
          && (t.courseId ? t.courseId === course.id : keyText(t.subject) === keyText(course.name)) && planned.has(keyText(t.title)))
        const unique = new Map<string, RiskRow>()
        for (const topic of ledger) {
          const k = keyText(topic.title), prev = unique.get(k)
          // A duplicate pending row cannot undo a confirmed covered topic.
          if (!prev || ['covered', 'completed'].includes(topic.status)) unique.set(k, topic)
        }
        if ([...unique.values()].some(t => !Number.isFinite(riskDateMs(t.plannedDate)))) warn('Some curriculum topics have no valid planned date. Lag checks cover dated topics only.')
        const due = [...unique.values()].filter(t => Number.isFinite(riskDateMs(t.plannedDate)) && riskDateMs(t.plannedDate) + s.curriculumLagDays * DAY_MS < now)
        dated += [...unique.values()].filter(t => Number.isFinite(riskDateMs(t.plannedDate))).length
        const pending = due.filter(t => !['covered', 'completed'].includes(t.status))
        if (unique.size < planned.size) warn('Some approved curriculum topics have no dated faculty plan. Curriculum lag alerts cover dated topics only, not the entire syllabus.')
        if (pending.length && pending.length / due.length * 100 > s.curriculumLagPercent) add('curriculum', mapping.id, 'warning', 'Curriculum plan is behind schedule',
          `${text(course.name) || 'Course'}: ${pending.length} of ${due.length} dated topics remain uncovered beyond the ${s.curriculumLagDays}-day tolerance (${s.curriculumLagPercent}% lag buffer). Review the dated topic plan and update actual delivery.`,
          '/faculty/topics', ['topics', 'mappings', 'curricula'])
      }
      if (!dated) defer('topics', 'No dated topics matched an active approved curriculum assignment. Curriculum timing cannot be assessed yet.')
    }
    for (const a of e.assignments.filter(owned)) {
      if (['cancelled', 'archived', 'deleted'].includes(a.status)) continue
      const due = riskDateMs(a.deadline || a.dueDate)
      if (!Number.isFinite(due)) { defer('assignments', 'An owned assignment has no valid deadline.'); continue }
      if (a.status === 'draft' && due < now) add('assignment', `draft:${a.id}`, 'warning', 'Draft assignment deadline has passed', `${text(a.title) || 'Assignment'} is still a draft after its deadline. Review or archive it; students were not treated as missing submissions.`, '/faculty/assignments', ['assignments'])
      const submitted = e.submissions.filter(r => same(r) && r.assignmentId === a.id && ['submitted', 'late', 'graded'].includes(r.status))
      const latest = bestRows(submitted.map(r => ({ ...r, personKey: text(r.studentId) })), 'personKey')
      const ungraded = [...latest.values()].filter(r => r.status !== 'graded' && Number.isFinite(riskDateMs(r.submittedAt)) && now > Math.max(due, riskDateMs(r.submittedAt)) + s.gradingBacklogDays * DAY_MS)
      if (ungraded.length) add('assignment', `grading:${a.id}`, 'warning', 'Assignment grading backlog', `${text(a.title) || 'Assignment'} has ${ungraded.length} recorded submission${ungraded.length === 1 ? '' : 's'} still awaiting grades more than ${s.gradingBacklogDays} days after the later of deadline and submission.`, '/faculty/assignments', ['assignments', 'submissions'])
      if (due < now && ['published', 'ongoing', 'closed'].includes(a.status) && complete('submissions', 'roster')) {
        const expected = e.roster.filter(r => same(r) && isActiveStudent(r) && riskAssignmentTargets(a, r))
        const missing = expected.filter(r => !latest.has(r.id)).length
        if (missing) add('assignment', `missing:${a.id}`, 'warning', 'Assignment follow-up needed', `${text(a.title) || 'Assignment'}: ${missing} of ${expected.length} targeted active students have no completed submission after the deadline. Follow up or review extensions.`, '/faculty/assignments', ['assignments', 'submissions', 'roster'])
      }
    }
    for (const t of e.tests.filter(r => owned(r) && ['published', 'ongoing', 'completed'].includes(r.status))) {
      const end = riskDateMs(t.endDateTime)
      if (!Number.isFinite(end)) { defer('tests', 'An owned assessment has no valid closing time.'); continue }
      const attempts = e.attempts.filter(r => same(r) && r.testId === t.id)
      const latest = bestRows(attempts.map(r => ({ ...r, personKey: text(r.studentId) })), 'personKey')
      const backlog = [...latest.values()].filter(r => r.status === 'submitted' && now > Math.max(end, riskDateMs(r.submittedAt) || end) + s.gradingBacklogDays * DAY_MS)
      if (backlog.length) add('assessment', `grading:${t.id}`, 'warning', 'Assessment grading backlog', `${text(t.title) || 'Assessment'} has ${backlog.length} submitted attempt${backlog.length === 1 ? '' : 's'} awaiting grades beyond the ${s.gradingBacklogDays}-day deadline.`, '/faculty/assessments', ['tests', 'attempts'])
      if (end < now && complete('attempts', 'roster')) {
        const expected = e.roster.filter(r => same(r) && isActiveStudent(r) && riskTestTargets(t, r))
        const missing = expected.filter(r => !latest.has(r.id) || latest.get(r.id)?.status === 'not_started').length
        if (missing) add('assessment', `missing:${t.id}`, 'warning', 'Assessment participation needs follow-up', `${text(t.title) || 'Assessment'} closed with ${missing} of ${expected.length} targeted active students having no recorded attempt.`, '/faculty/assessments', ['tests', 'attempts', 'roster'])
      }
    }
    if (!p.departments.some(d => !['all', 'general', ''].includes(keyText(d)))) warn('The faculty department is not verified. Principal escalation is available, but alerts will not be broadcast to unrelated HODs.')
  }
  // Even positive-evidence findings are withheld when their enumeration itself
  // failed. Consumers retain earlier findings as stale, never "resolved".
  return { findings: findings.filter(f => f.dependencies.every(d => evaluated[d] === true)), coverage: [...coverage], complete: evaluated }
}
/** Removing an item from a partial scan must not manufacture a resolution. */
export function riskReconciliationState(old: Record<string, any>, nextKeys: Set<string>, complete: Record<string, boolean>, enabled: boolean, now: number): 'active' | 'resolved' | 'unverified' | 'archived' {
  if (nextKeys.has(String(old.key))) return 'active'
  if (typeof old.expiresAt === 'number' && now > old.expiresAt) return 'archived'
  if (dateKey(old.evidenceDate) && dateKey(old.evidenceDate) < istDate(now - RISK_LOOKBACK_DAYS * DAY_MS)) return 'archived'
  if (!enabled || !Array.isArray(old.dependencies) || !old.dependencies.every((d: string) => complete[d] === true)) return 'unverified'
  return 'resolved'
}

/** One push per opening/reopening or severity escalation, not every sweep,
 * count change, read acknowledgement or incomplete recheck. */
export function riskAlertTransition(old: Record<string, any> | undefined, finding: Pick<RiskFinding, 'category' | 'severity'>) {
  const reopened = !old || old.state === 'resolved' || old.state === 'archived'
  const escalated = !!old && old.severity !== 'critical' && finding.severity === 'critical'
  const notify = finding.category !== 'coverage' && (reopened || escalated)
  return { notify, generation: (Number(old?.generation) || 0) + Number(notify), read: reopened || escalated ? false : old?.read === true }
}
