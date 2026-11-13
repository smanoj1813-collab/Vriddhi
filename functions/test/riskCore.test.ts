import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildRiskFindings, canReadRiskAlert, dateKey, DEFAULT_RISK_SETTINGS, DAY_MS, istDate,
  riskAlertTransition, riskAssignmentTargets, riskDateMs, riskRecipients, riskReconciliationState,
  riskTestTargets, validateRiskSettings, wallTime, type RiskEvidence, type RiskPerson, type RiskRow,
} from '../src/riskCore'

const NOW = Date.parse('2026-11-13T13:00:00Z') // Friday, 18:30 IST
const student = (extra: Record<string, any> = {}): RiskRow => ({ id: 'student-1', userId: 'student-uid', collegeId: 'college-a', branch: 'BCA', course: 'BCA', batch: '2026', semester: 3, division: 'A', regNo: 'R001', status: 'active', ...extra })
const person = (role = 'faculty', extra: Partial<RiskPerson> = {}): RiskPerson => ({ uid: role === 'student' ? 'student-uid' : 'faculty-uid', role, collegeId: 'college-a', name: 'Test member', aliases: ['faculty-uid', 'FAC001'], departments: ['Science'], ...(role === 'student' ? { student: student() } : {}), ...extra })
const assignment = (extra: Record<string, any> = {}): RiskRow => ({ id: 'a-1', collegeId: 'college-a', facultyUid: 'faculty-uid', title: 'DBMS worksheet', status: 'published', targetType: 'cohort', cohort: { branch: 'BCA', batch: '2026', semester: 3, division: 'A' }, deadline: '2026-11-12', ...extra })
const test = (extra: Record<string, any> = {}): RiskRow => ({ id: 'test-1', collegeId: 'college-a', facultyId: 'faculty-uid', title: 'DBMS test', status: 'published', visibility: 'selected', targetStudents: ['student-1'], startDateTime: '2026-11-12T09:00:00+05:30', endDateTime: '2026-11-12T10:00:00+05:30', ...extra })
const attendance = (statuses: string[] = ['present', 'present', 'present', 'absent']): RiskRow[] => statuses.map((status, i) => ({ id: `ar-${i}`, collegeId: 'college-a', studentId: 'student-1', semester: 3, batch: '2026', date: `2026-11-${String(10 + Math.floor(i / 3)).padStart(2, '0')}`, sessionId: `sess-${i}`, status }))
const session = (extra: Record<string, any> = {}): RiskRow => ({ id: 'class-1', collegeId: 'college-a', facultyId: 'FAC001', subject: 'DBMS', date: '2026-11-13', startTime: '09:00', endTime: '10:00', status: 'scheduled', attendanceCount: 0, ...extra })
function evidence(role = 'faculty'): RiskEvidence {
  return { person: person(role), now: NOW, settings: { ...DEFAULT_RISK_SETTINGS },
    complete: Object.fromEntries(['identity', 'assignments', 'tests', 'roster', 'holidays', 'attendance', 'submissions', 'attempts', 'sessions', 'weekly', 'registers', 'staffRecords', 'staffSchedule', 'topics', 'mappings', 'curricula', 'policy'].map(k => [k, true])),
    coverage: [], sessions: [], attendance: [], assignments: [], submissions: [], tests: [], attempts: [], topics: [], mappings: [], curricula: [], roster: [student()], staffRecords: [], holidays: [], attendanceMinimum: { percentage: 75, schemeCode: 'SYNTHETIC' } }
}
const findings = (e: RiskEvidence, category?: string) => buildRiskFindings(e).findings.filter(f => !category || f.category === category)
function curriculumEvidence(): RiskEvidence {
  const e = evidence()
  e.mappings = [{ id: 'map-1', facultyId: 'FAC001', collegeId: 'college-a', curriculumId: 'cur-1', courseId: 'course-1', courseCode: 'DB1', status: 'active' }]
  e.curricula = [{ id: 'cur-1', collegeId: 'college-a', status: 'active', approvalStatus: 'approved', courses: [{ id: 'course-1', code: 'DB1', name: 'DBMS', modules: [{ topics: ['Joins', 'Indexes'] }] }] }]
  e.topics = ['Joins', 'Indexes'].map((title, i) => ({ id: `topic-${i}`, collegeId: 'college-a', facultyId: 'FAC001', subject: 'DBMS', title, plannedDate: '2026-11-01', status: i ? 'covered' : 'pending' }))
  return e
}

describe('risk configuration and IST dates', () => {
  it('has a strict configurable contract with no academic attendance minimum override', () => {
    assert.deepEqual(validateRiskSettings({ ...DEFAULT_RISK_SETTINGS }), DEFAULT_RISK_SETTINGS)
    assert.throws(() => validateRiskSettings({ ...DEFAULT_RISK_SETTINGS, attendanceMinimum: 20 }), /Unknown/)
    assert.throws(() => validateRiskSettings({ ...DEFAULT_RISK_SETTINGS, constructor: 1 }), /Unknown/)
  })
  for (const [key, value] of [['enabled', 1], ['registerGraceHours', -1], ['curriculumLagPercent', 101], ['gradingBacklogDays', 0], ['staffGraceMinutes', 1.5], ['deadlineWarningHours', NaN], ['attendanceWarningBuffer', '5']]) {
    it(`refuses invalid ${key}=${String(value)}`, () => assert.throws(() => validateRiskSettings({ ...DEFAULT_RISK_SETTINGS, [String(key)]: value })))
  }
  it('treats date-only deadlines as end-of-day IST, not UTC midnight', () => assert.equal(riskDateMs('2026-11-13'), Date.parse('2026-11-13T18:29:59.999Z')))
  it('rejects rolled-over and ambiguous dates', () => { assert.equal(dateKey('2026-02-30'), ''); assert.ok(Number.isNaN(riskDateMs('2026-02-30'))); assert.ok(Number.isNaN(riskDateMs('2026-11-13T12:00:00'))); assert.ok(Number.isNaN(wallTime('2026-11-13', '25:00'))) })
  it('rejects impossible timezone-qualified instants instead of rolling the deadline forward', () => {
    for (const instant of ['2026-02-30T09:00:00Z', '2026-11-13T24:00:00Z', '2026-11-13T09:60:00+05:30']) assert.ok(Number.isNaN(riskDateMs(instant)), instant)
    assert.equal(riskDateMs('2026-11-13T09:00+05:30'), Date.parse('2026-11-13T03:30:00Z'))
  })
  it('crosses the IST date boundary correctly', () => assert.equal(istDate(Date.parse('2026-11-13T19:00:00Z')), '2026-11-14'))
  it('accepts Firebase timestamp and Date evidence without timezone loss', () => { assert.equal(riskDateMs({ seconds: NOW / 1000 }), NOW); assert.equal(riskDateMs({ toDate: () => new Date(NOW) }), NOW); assert.equal(riskDateMs(new Date(NOW)), NOW) })
})
describe('explicit student targeting', () => {
  it('matches all assignment cohort dimensions', () => { assert.ok(riskAssignmentTargets(assignment(), student())); assert.ok(!riskAssignmentTargets(assignment(), student({ division: 'B' }))) })
  it('never broadcasts an empty assignment cohort', () => assert.ok(!riskAssignmentTargets(assignment({ cohort: {} }), student())))
  it('accepts explicit student ids and linked auth uids', () => { assert.ok(riskAssignmentTargets(assignment({ targetType: 'specific', studentIds: ['student-1'] }), student())); assert.ok(riskAssignmentTargets(assignment({ targetType: 'specific', studentUids: ['student-uid'] }), student())) })
  it('does not use another tenant’s matching student id', () => { assert.ok(!riskAssignmentTargets(assignment({ collegeId: 'college-b' }), student())); assert.ok(!riskTestTargets(test({ collegeId: 'college-b', visibility: 'college' }), student())) })
  it('matches college/public tests only within the college', () => assert.ok(riskTestTargets(test({ visibility: 'college' }), student())))
  it('matches explicit regNo and normalized section targets', () => { assert.ok(riskTestTargets(test({ targetStudents: ['R001'] }), student())); assert.ok(riskTestTargets(test({ targetStudents: [], targetSections: [{ sectionName: 'Section A', branch: 'BCA', semester: 3 }] }), student())); assert.ok(!riskTestTargets(test({ targetStudents: [], targetSections: [{ section: 'A', branch: 'MCA' }] }), student())) })
  it('has no implicit unscoped test broadcast', () => assert.ok(!riskTestTargets(test({ targetStudents: [] }), student())))
})
describe('student attendance and confirmed missed classes', () => {
  it('uses the assigned minimum, not a hard-coded 75%', () => { const e = evidence('student'); e.attendance = attendance(); e.attendanceMinimum = { percentage: 80, schemeCode: 'PACK80' }; const a = findings(e, 'attendance').find(f => !f.sourceId.startsWith('missed:')); assert.equal(a?.severity, 'critical'); assert.match(a!.message, /PACK80 requires 80%/) })
  it('warns within the buffer without declaring ineligibility', () => { const e = evidence('student'); e.attendance = attendance(); const a = findings(e, 'attendance').find(f => !f.sourceId.startsWith('missed:')); assert.equal(a?.severity, 'warning'); assert.match(a!.message, /not a final/) })
  it('does not warn at or above the exact upper buffer boundary', () => { const e = evidence('student'); e.attendance = attendance(['present', 'present', 'present', 'present', 'absent']); assert.equal(findings(e, 'attendance').filter(f => !f.sourceId.startsWith('missed:')).length, 0) })
  it('has no policy fallback when assigned scheme data is unavailable', () => { const e = evidence('student'); e.attendance = attendance(); delete e.attendanceMinimum; assert.equal(findings(e).filter(f => f.title.includes('requirement')).length, 0); assert.match(buildRiskFindings(e).coverage.join(' '), /No default university or 75%/) })
  it('never mixes another semester/batch into the denominator', () => { const e = evidence('student'); e.attendance = [...attendance(['present']), ...attendance(['absent']).map(r => ({ ...r, id: 'old', sessionId: 'old', semester: 2, batch: '2025' }))]; assert.equal(findings(e).filter(f => f.category === 'attendance').length, 0) })
  it('does not pretend missing metadata is zero attendance', () => { const e = evidence('student'); e.attendance = attendance().map(r => ({ ...r, semester: 0 })); assert.equal(findings(e).length, 0); assert.equal(buildRiskFindings(e).complete.attendance, false) })
  it('unknown statuses and conflicting duplicate classes are coverage gaps', () => { const e = evidence('student'); e.attendance = [...attendance(), { ...attendance()[0], id: 'dup', status: 'absent' }]; assert.equal(findings(e).length, 0); assert.equal(buildRiskFindings(e).complete.attendance, false) })
  it('deduplicates identical per-class rows', () => { const e = evidence('student'); e.attendance = [...attendance(), { ...attendance()[0], id: 'dup' }]; assert.match(findings(e).find(f => f.title.includes('requirement'))!.message, /4 recorded classes/) })
  it('counts present, late and on-duty consistently with the portal', () => { const e = evidence('student'); e.attendance = attendance(['present', 'late', 'onDuty', 'absent']); assert.match(findings(e).find(f => f.title.includes('requirement'))!.message, /75.0%/) })
  it('only calls a missed class from an explicit absent record, never an unmarked schedule', () => { const e = evidence('student'); e.sessions = [session()]; assert.equal(findings(e).length, 0); e.attendance = attendance(['leave', 'medicalLeave', 'present', 'absent']); assert.match(findings(e).find(f => f.sourceId.startsWith('missed:'))!.message, /^1 class/) })
  it('expires a rolling missed-class notice as archived, not resolved', () => { const e = evidence('student'); e.attendance = attendance(); const a = findings(e).find(f => f.sourceId.startsWith('missed:'))!; assert.equal(riskReconciliationState(a, new Set(), e.complete, true, NOW + 20 * DAY_MS), 'archived') })
  it('never infers risk from an incomplete raw attendance read', () => { const e = evidence('student'); e.attendance = attendance(); e.complete.attendance = false; assert.equal(findings(e, 'attendance').length, 0) })
  it('inactive students are not treated as absent or missing submissions', () => { const e = evidence('student'); e.person.student = student({ status: 'alumni' }); e.assignments = [assignment()]; assert.equal(findings(e).length, 0) })
})
describe('student assignments and assessments', () => {
  it('reports a proven missed deadline with no completed submission', () => { const e = evidence('student'); e.assignments = [assignment()]; assert.equal(findings(e, 'assignment')[0]?.severity, 'critical') })
  it('warns before actual deadlines within the configured hours', () => { const e = evidence('student'); e.assignments = [assignment({ deadline: '2026-11-14' })]; assert.match(findings(e, 'assignment')[0]!.title, /due soon/); e.settings.deadlineWarningHours = 1; assert.equal(findings(e, 'assignment').length, 0) })
  for (const status of ['submitted', 'late', 'graded']) it(`does not flag a ${status} assignment`, () => { const e = evidence('student'); e.assignments = [assignment()]; e.submissions = [{ id: 'sub-1', assignmentId: 'a-1', collegeId: 'college-a', studentId: 'student-1', status }]; assert.equal(findings(e, 'assignment').length, 0) })
  it('a new upload draft cannot erase a completed submission', () => { const e = evidence('student'); e.assignments = [assignment()]; e.submissions = ['submitted', 'uploading'].map((status, i) => ({ id: `s-${i}`, assignmentId: 'a-1', collegeId: 'college-a', studentId: 'student-1', status, submittedAt: new Date(NOW + i).toISOString() })); assert.equal(findings(e, 'assignment').length, 0) })
  it('draft/cancelled or non-targeted assignments do not create student risk', () => { const e = evidence('student'); e.assignments = [assignment({ status: 'draft' }), assignment({ id: 'a-2', status: 'cancelled' }), assignment({ id: 'a-3', cohort: { branch: 'MCA' } })]; assert.equal(findings(e, 'assignment').length, 0) })
  it('missing assignment evidence is a warning about coverage, not no submission', () => { const e = evidence('student'); e.assignments = [assignment()]; e.complete.submissions = false; assert.equal(findings(e, 'assignment').length, 0) })
  it('malformed deadlines do not resolve an earlier known alert', () => { const e = evidence('student'); e.assignments = [assignment({ deadline: 'not a date' })]; assert.equal(findings(e, 'assignment').length, 0); assert.equal(riskReconciliationState({ key: 'assignment:a-1', dependencies: ['assignments', 'submissions'] }, new Set(), buildRiskFindings(e).complete, true, NOW), 'unverified') })
  it('labels a closed test without an attempt as missed', () => { const e = evidence('student'); e.tests = [test()]; assert.match(findings(e, 'assessment')[0]!.title, /window missed/) })
  it('does not call an expired in-progress attempt an absent student', () => { const e = evidence('student'); e.tests = [test()]; e.attempts = [{ id: 'attempt-1', collegeId: 'college-a', studentId: 'student-1', testId: 'test-1', status: 'in_progress' }]; assert.match(findings(e, 'assessment')[0]!.title, /needs review/) })
  for (const status of ['submitted', 'graded']) it(`does not flag a ${status} test attempt`, () => { const e = evidence('student'); e.tests = [test()]; e.attempts = [{ id: 'attempt', collegeId: 'college-a', studentId: 'student-1', testId: 'test-1', status }]; assert.equal(findings(e, 'assessment').length, 0) })
  it('unknown or truncated attempt states cannot produce missed-test conclusions', () => { const e = evidence('student'); e.tests = [test()]; e.complete.attempts = false; assert.equal(findings(e, 'assessment').length, 0); e.complete.attempts = true; e.attempts = [{ id: 'attempt', collegeId: 'college-a', studentId: 'student-1', testId: 'test-1', status: 'legacy_unknown' }]; assert.equal(findings(e, 'assessment').length, 0); assert.equal(buildRiskFindings(e).complete.attempts, false) })
  it('does not use cancelled tests or an invalid test window', () => { const e = evidence('student'); e.tests = [test({ status: 'cancelled' })]; assert.equal(findings(e, 'assessment').length, 0); e.tests = [test({ endDateTime: '' })]; assert.equal(findings(e, 'assessment').length, 0); assert.match(buildRiskFindings(e).coverage.join(' '), /incomplete testing window/) })
})
describe('faculty registers and self-attendance', () => {
  it('uses real elapsed classes plus a grace buffer, not the default count', () => { const e = evidence(); e.sessions = [session()]; assert.equal(findings(e, 'class-register').length, 1); e.settings.registerGraceHours = 24; assert.equal(findings(e, 'class-register').length, 0) })
  it('accepts a confirmed marked flag even for a zero-student register', () => { const e = evidence(); e.sessions = [session({ attendanceMarked: true, attendanceCount: 0 })]; assert.equal(findings(e, 'class-register').length, 0) })
  it('accepts an authoritative register when the session summary is legacy', () => { const e = evidence(); e.sessions = [session({ registerFound: true })]; assert.equal(findings(e, 'class-register').length, 0) })
  it('skips cancelled, rescheduled, future and other-faculty classes', () => { const e = evidence(); e.sessions = [session({ status: 'cancelled' }), session({ id: 'c-2', status: 'rescheduled' }), session({ id: 'c-3', date: '2026-11-14' }), session({ id: 'c-4', facultyId: 'someone-else' })]; assert.equal(findings(e, 'class-register').length, 0) })
  it('does not infer a missed register when session/register enumeration is incomplete', () => { for (const source of ['sessions', 'registers', 'weekly', 'holidays']) { const e = evidence(); e.sessions = [session()]; e.complete[source] = false; assert.equal(findings(e, 'class-register').length, 0, source) } })
  it('skips class-suspending dates but not ordinary calendar events', () => { const e = evidence(); e.sessions = [session()]; e.holidays = [{ id: 'h', collegeId: 'college-a', startDate: '2026-11-13', endDate: '2026-11-13', suspendsClasses: true }]; assert.equal(findings(e, 'class-register').length, 0); e.holidays[0].suspendsClasses = false; assert.equal(findings(e, 'class-register').length, 1) })
  it('requires an explicit working schedule and never guesses Monday–Saturday', () => { const e = evidence(); assert.equal(findings(e, 'staff-attendance').length, 0); assert.match(buildRiskFindings(e).coverage.join(' '), /No working days were assumed/) })
  it('reports both missing check-in and check-out only on assigned working days', () => { const e = evidence(); e.staffSchedule = { id: 'work', days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', excludedDates: [] }; const a = findings(e, 'staff-attendance'); assert.equal(a.length, 1); assert.match(a[0].message, /check-in and check-out/); e.staffSchedule.days = [0]; assert.equal(findings(e, 'staff-attendance').length, 1) })
  it('a future schedule or excluded date creates no current attendance risk', () => { const e = evidence(); e.staffSchedule = { id: 'work', days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-14', excludedDates: [] }; assert.equal(findings(e, 'staff-attendance').length, 0); e.staffSchedule.effectiveFrom = '2026-11-01'; e.staffSchedule.excludedDates = ['2026-11-13']; assert.equal(findings(e, 'staff-attendance').length, 0) })
  for (const status of ['leave', 'medical', 'onduty', 'wfh']) it(`excludes recorded ${status} from check-in/out missing alerts`, () => { const e = evidence(); e.staffSchedule = { id: 'work', days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', excludedDates: [] }; e.staffRecords = [{ id: 'rec', collegeId: 'college-a', facultyId: 'FAC001', date: '2026-11-13', status }]; assert.equal(findings(e, 'staff-attendance').length, 0) })
  it('excludes public/college staff holidays, but not exams or student study holidays', () => {
    const e = evidence(); e.staffSchedule = { id: 'work', days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', excludedDates: [] }
    for (const type of ['public-holiday', 'college-holiday', 'study-holiday', 'exam']) {
      e.holidays = [{ id: 'calendar', collegeId: 'college-a', type, startDate: '2026-11-13', endDate: '2026-11-13', suspendsClasses: true }]
      assert.equal(findings(e, 'staff-attendance').length, ['public-holiday', 'college-holiday'].includes(type) ? 0 : 1, type)
    }
  })
  it('malformed legacy work schedules cannot manufacture either absences or resolutions', () => {
    const e = evidence(); const valid = { id: 'work', days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', excludedDates: [] }
    for (const invalid of [{ days: [9] }, { effectiveTo: '2026-10-01' }, { excludedDates: ['bad-date'] }, { endTime: '08:00' }]) {
      e.staffSchedule = { ...valid, ...invalid }
      const result = buildRiskFindings(e)
      assert.equal(result.findings.filter(f => f.category === 'staff-attendance').length, 0)
      assert.equal(result.complete.staffSchedule, false)
      assert.equal(riskReconciliationState({ key: 'staff-attendance:2026-11-13', dependencies: ['staffSchedule'] }, new Set(), result.complete, true, NOW), 'unverified')
    }
  })
  it('requires a complete self-attendance read before inferring missing check-in', () => { const e = evidence(); e.staffSchedule = { id: 'work', days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', excludedDates: [] }; e.complete.staffRecords = false; assert.equal(findings(e, 'staff-attendance').length, 0) })
})
describe('faculty curriculum, assignment and assessment follow-up', () => {
  it('compares dated assigned approved curriculum topics to actual ledger completion', () => { const e = curriculumEvidence(); const a = findings(e, 'curriculum'); assert.equal(a.length, 1); assert.match(a[0].message, /1 of 2 dated topics/) })
  it('uses configurable lag days and percent, without a static completion guess', () => { const e = curriculumEvidence(); e.settings.curriculumLagDays = 30; assert.equal(findings(e, 'curriculum').length, 0); e.settings.curriculumLagDays = 7; e.settings.curriculumLagPercent = 50; assert.equal(findings(e, 'curriculum').length, 0) })
  it('undated or unassigned plans are coverage gaps, not a 0% risk', () => { const e = curriculumEvidence(); e.topics.forEach(t => { delete t.plannedDate }); assert.equal(findings(e, 'curriculum').length, 0); assert.match(buildRiskFindings(e).coverage.join(' '), /No dated topics/); const e2 = curriculumEvidence(); e2.mappings = []; assert.equal(findings(e2, 'curriculum').length, 0) })
  it('will not use another faculty or unapproved curriculum', () => { const e = curriculumEvidence(); e.curricula[0].approvalStatus = 'pending_principal'; assert.equal(findings(e, 'curriculum').length, 0); const e2 = curriculumEvidence(); e2.topics.forEach(t => t.facultyId = 'other'); assert.equal(findings(e2, 'curriculum').length, 0) })
  it('an extra pending duplicate cannot undo a covered curriculum topic', () => { const e = curriculumEvidence(); e.topics[0].status = 'covered'; e.topics.push({ ...e.topics[0], id: 'dup', status: 'pending' }); assert.equal(findings(e, 'curriculum').length, 0) })
  it('a draft past its deadline alerts the teacher, not students', () => { const e = evidence(); e.assignments = [assignment({ status: 'draft' })]; assert.match(findings(e, 'assignment')[0]!.title, /Draft/); const e2 = evidence('student'); e2.assignments = e.assignments; assert.equal(findings(e2, 'assignment').length, 0) })
  it('flags grading backlog from the later of deadline and actual submission', () => { const e = evidence(); e.assignments = [assignment({ deadline: '2026-11-01' })]; e.submissions = [{ id: 'sub', assignmentId: 'a-1', collegeId: 'college-a', studentId: 'student-1', status: 'submitted', submittedAt: '2026-11-02T10:00:00Z' }]; assert.ok(findings(e, 'assignment').some(f => f.title === 'Assignment grading backlog')); e.submissions[0].submittedAt = '2026-11-12T10:00:00Z'; assert.ok(!findings(e, 'assignment').some(f => f.title === 'Assignment grading backlog')) })
  it('deduplicates resubmissions when counting grading backlog', () => { const e = evidence(); e.assignments = [assignment({ deadline: '2026-11-01' })]; e.submissions = ['submitted', 'graded'].map((status, i) => ({ id: `sub-${i}`, assignmentId: 'a-1', collegeId: 'college-a', studentId: 'student-1', status, submittedAt: `2026-11-0${2 + i}T10:00:00Z` })); assert.ok(!findings(e, 'assignment').some(f => f.title.includes('grading'))) })
  it('counts missing submissions only against a complete explicit active roster', () => { const e = evidence(); e.assignments = [assignment()]; e.roster.push(student({ id: 'alumni', status: 'alumni' }), student({ id: 'outsider', collegeId: 'college-b' })); assert.match(findings(e, 'assignment').find(f => f.title.includes('follow-up'))!.message, /1 of 1/); e.complete.roster = false; assert.ok(!findings(e, 'assignment').some(f => f.title.includes('follow-up'))) })
  it('flags assessment grading but never includes already graded attempts', () => { const e = evidence(); e.tests = [test({ endDateTime: '2026-11-01T10:00:00Z' })]; e.attempts = [{ id: 'attempt', collegeId: 'college-a', studentId: 'student-1', testId: 'test-1', status: 'submitted', submittedAt: '2026-11-02T10:00:00Z' }]; assert.ok(findings(e, 'assessment').some(f => f.title.includes('grading'))); e.attempts[0].status = 'graded'; assert.ok(!findings(e, 'assessment').some(f => f.title.includes('grading'))) })
})
describe('scoped escalation, read authorization, deduplication and resolution', () => {
  const supervisors = [person('hod', { uid: 'science-hod' }), person('admin', { uid: 'science-admin' }), person('hod', { uid: 'commerce-hod', departments: ['Commerce'] }), person('hod', { uid: 'unknown-hod', departments: [] }), person('principal', { uid: 'principal-a' }), person('principal', { uid: 'principal-b', collegeId: 'college-b' })]
  it('escalates faculty findings to self AND matching HOD AND college Principal', () => assert.deepEqual(riskRecipients(person(), supervisors).map(p => p.uid).sort(), ['faculty-uid', 'science-hod', 'science-admin', 'principal-a'].sort()))
  it('does not broadcast missing department metadata to every HOD', () => assert.deepEqual(riskRecipients(person('faculty', { departments: [] }), supervisors).map(p => p.uid), ['faculty-uid', 'principal-a']))
  it('does not send student risks to faculty supervisors by accident', () => assert.deepEqual(riskRecipients(person('student'), supervisors).map(p => p.uid), ['student-uid']))
  it('deduplicates self/supervisor recipient aliases', () => assert.equal(riskRecipients(person('hod'), [person('hod')]).length, 1))
  const alert = { recipientUid: 'science-hod', recipientRole: 'hod', subjectUid: 'faculty-uid', subjectRole: 'faculty', subjectDepartments: ['Science'], collegeId: 'college-a' }
  it('requires recipient ownership, current role and tenant', () => { assert.ok(canReadRiskAlert(supervisors[0], alert)); assert.ok(!canReadRiskAlert(person('hod', { uid: 'another' }), alert)); assert.ok(!canReadRiskAlert(person('faculty', { uid: 'science-hod' }), alert)); assert.ok(!canReadRiskAlert(person('hod', { uid: 'science-hod', collegeId: 'college-b' }), alert)) })
  it('a department change or unknown claim removes HOD access to old copies', () => { assert.ok(!canReadRiskAlert(person('hod', { uid: 'science-hod', departments: ['Commerce'] }), alert)); assert.ok(!canReadRiskAlert(person('hod', { uid: 'science-hod', departments: [] }), alert)) })
  it('supervisors cannot read student alerts even if a bad copy names them', () => assert.ok(!canReadRiskAlert(person('principal', { uid: 'principal-a' }), { ...alert, recipientUid: 'principal-a', recipientRole: 'principal', subjectRole: 'student' })))
  it('pushes only for first opening, reopening or increased severity', () => {
    const f = { category: 'assignment' as const, severity: 'warning' as const }
    assert.deepEqual(riskAlertTransition(undefined, f), { notify: true, generation: 1, read: false })
    const old = { state: 'active', generation: 1, read: true, severity: 'warning' }
    assert.deepEqual(riskAlertTransition(old, f), { notify: false, generation: 1, read: true })
    assert.equal(riskAlertTransition({ ...old, state: 'unverified' }, f).notify, false)
    assert.equal(riskAlertTransition({ ...old, state: 'resolved' }, f).generation, 2)
    assert.equal(riskAlertTransition(old, { ...f, severity: 'critical' }).notify, true)
    assert.equal(riskAlertTransition(undefined, { ...f, category: 'coverage' }).notify, false)
  })
  it('incomplete rechecks and paused checks retain alerts as unverified', () => { const old = { key: 'assignment:a-1', dependencies: ['assignments', 'submissions'] }; assert.equal(riskReconciliationState(old, new Set(), { assignments: true, submissions: false }, true, NOW), 'unverified'); assert.equal(riskReconciliationState(old, new Set(), { assignments: true, submissions: true }, false, NOW), 'unverified') })
  it('only a complete absence of the finding resolves it', () => { const old = { key: 'assignment:a-1', dependencies: ['assignments', 'submissions'] }; assert.equal(riskReconciliationState(old, new Set(), { assignments: true, submissions: true }, true, NOW), 'resolved'); assert.equal(riskReconciliationState(old, new Set([old.key]), {}, true, NOW), 'active') })
  it('time-bounded old observations are archived, never presented as fixed', () => assert.equal(riskReconciliationState({ key: 'class-register:c', evidenceDate: '2026-09-01', dependencies: ['sessions'] }, new Set(), { sessions: true }, true, NOW), 'archived'))
  it('paused checks do not create any risks or assume data is complete', () => { const e = evidence('student'); e.settings.enabled = false; e.assignments = [assignment()]; const r = buildRiskFindings(e); assert.equal(r.findings.length, 0); assert.match(r.coverage.join(' '), /paused/) })
})
