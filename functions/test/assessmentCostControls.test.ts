import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import admin from 'firebase-admin'
import { makeCostStore } from './helpers/costStore'

const store = makeCostStore()
const originalFirestore = admin.firestore
const descriptor = Object.getOwnPropertyDescriptor(admin, 'firestore')!
let api: typeof import('../src/studentAssessments')
let attendance: typeof import('../src/attendanceSummary')
let journey: typeof import('../src/studentJourney')
before(async () => {
  const original = originalFirestore
  Object.defineProperty(admin, 'firestore', { configurable: true, value: Object.assign(() => store.db, {
    FieldValue: original.FieldValue, Timestamp: original.Timestamp, FieldPath: original.FieldPath,
  }) })
  api = await import('../src/studentAssessments')
  attendance = await import('../src/attendanceSummary')
  journey = await import('../src/studentJourney')
})
after(() => { if (descriptor) Object.defineProperty(admin, 'firestore', descriptor); else delete (admin as any).firestore })
beforeEach(() => {
  store.reset()
  store.seed('users/staff', { role: 'faculty', collegeId: 'college-a', name: 'Faculty' })
})
function testRow(extra: Record<string, unknown> = {}) {
  return { title: 'Live test', collegeId: 'college-a', facultyId: 'staff', status: 'ongoing',
    startDateTime: new Date(Date.now() - 60_000), endDateTime: new Date(Date.now() + 60_000),
    totalRegistered: 1, totalStarted: 1, totalSubmitted: 1, totalGraded: 1, ...extra }
}
function attempts(count = 1) {
  store.seed('scheduledTests/test-a', testRow({ totalRegistered: count, totalStarted: count, totalSubmitted: count, totalGraded: count }))
  for (let i = 0; i < count; i++) store.seed(`studentAssessments/a-${i}`, { testId: 'test-a', studentId: `s-${i}`, collegeId: 'college-a', status: 'graded',
    updatedAt: new Date(Date.now() + i), totalMarks: 10, marksObtained: 8, percentage: 80, timeSpent: 10 })
}
const report = (extra: Record<string, unknown> = {}, collegeId = 'college-a') => api.getAssessmentTestReport.run({
  auth: { uid: 'staff', token: { role: 'faculty', collegeId } }, data: { testId: 'test-a', ...extra },
} as any) as Promise<any>

describe('real assessment handler cost and compatibility guards', () => {
  it('unchanged 500-student reports use three document reads, not another 500-row scan', async () => {
    attempts(500)
    const initial = await report()
    assert.equal(initial.students.length, 500)
    const reads = store.reads.length, queries = store.queries.length
    const next = await report({ knownRevision: initial.reportRevision, loadedAt: Date.now() })
    assert.equal(next.unchanged, true)
    assert.equal(store.reads.length - reads, 3) // staff + test + latest attempt
    assert.equal(store.queries.slice(queries).some(query => query.selected), false)
    assert.equal(store.writes.length, 0)
  })
  it('attempt-only autosaves invalidate the report even if test counters did not change', async () => {
    attempts()
    const initial = await report()
    store.seed('studentAssessments/a-0', { ...store.data.get('studentAssessments/a-0'), updatedAt: new Date(Date.now() + 1000), timeSpent: 45 })
    const next = await report({ knownRevision: initial.reportRevision, loadedAt: Date.now() })
    assert.equal(next.students[0].timeSpent, 45)
    assert.notEqual(next.reportRevision, initial.reportRevision)
  })
  it('mixed or missing legacy update metadata keeps reports on the original full-read path', async () => {
    for (const legacyStamp of [undefined, '2026-11-12T09:00:00Z']) {
      attempts();
      const row = store.data.get('studentAssessments/a-0');
      if (legacyStamp === undefined) delete row.updatedAt; else row.updatedAt = legacyStamp;
      const first = await report(); assert.equal(first.reportRevision, '');
      const next = await report({ knownRevision: first.reportRevision, loadedAt: Date.now() });
      assert.equal(next.students.length, 1); assert.notEqual(next.unchanged, true);
    }
  })
  it('deleting the latest attempt invalidates its report revision', async () => {
    attempts(2); const first = await report();
    store.data.delete('studentAssessments/a-1');
    const next = await report({ knownRevision: first.reportRevision, loadedAt: Date.now() });
    assert.equal(next.students.length, 1); assert.notEqual(next.reportRevision, first.reportRevision);
  })
  it('the five-minute full-refresh bound catches out-of-band edits that omit updatedAt', async () => {
    attempts(2); const first = await report();
    store.seed('studentAssessments/a-0', { ...store.data.get('studentAssessments/a-0'), timeSpent: 90 });
    assert.equal((await report({ knownRevision: first.reportRevision, loadedAt: Date.now() })).unchanged, true);
    const backstop = await report({ knownRevision: first.reportRevision, loadedAt: Date.now() - 300_000 });
    assert.equal(backstop.students.find((row: any) => row.studentId === 's-0').timeSpent, 90);
  })
  it('explicit and legacy requests always get a full report', async () => {
    attempts(); const initial = await report()
    assert.ok(initial.students)
    assert.ok((await report()).students)
    assert.ok((await report({ knownRevision: initial.reportRevision, loadedAt: Date.now() - 5 * 60_000 })).students)
  })
  it('an index still being built falls back to the full compatible response', async () => {
    attempts(); store.failures.set('studentAssessments:ordered', 9)
    const result = await report({ knownRevision: 'cached', loadedAt: Date.now() })
    assert.equal(result.students.length, 1); assert.equal(result.reportRevision, '')
  })
  it('never reuses data before checking current authentication and tenant scope', async () => {
    attempts()
    await assert.rejects(api.getAssessmentTestReport.run({ data: { testId: 'test-a' } } as any), { code: 'unauthenticated' })
    await assert.rejects(report({ knownRevision: 'cached', loadedAt: Date.now() }, 'college-b'), { code: 'permission-denied' })
    assert.equal(store.queries.length, 0)
  })
  it('concurrent legacy counter repairs count once instead of double-incrementing', async () => {
    attempts(3)
    const row = store.data.get('scheduledTests/test-a'); delete row.totalSubmitted; delete row.totalGraded
    await Promise.all([report(), report()])
    assert.equal(store.data.get('scheduledTests/test-a').totalSubmitted, 3)
    assert.equal(store.data.get('scheduledTests/test-a').totalGraded, 3)
    assert.equal(store.writes.filter(path => path === 'scheduledTests/test-a').length, 1)
  })
  it('future tests do not get downloaded by the indexed five-minute cleanup', async () => {
    for (let i = 0; i < 100; i++) store.seed(`scheduledTests/future-${i}`, testRow({ status: 'published' }))
    await api.autoSubmitExpiredStudentTests.run({} as any)
    assert.equal(store.reads.filter(path => path.startsWith('scheduledTests/')).length, 0)
    assert.equal(store.writes.length, 0)
    assert.equal(store.queries.filter(query => query.path === 'scheduledTests').length, 4)
  })
  it('completes due Timestamp and legacy ISO tests but leaves future tests open', async () => {
    store.seed('scheduledTests/date', testRow({ endDateTime: new Date(Date.now() - 1000) }))
    store.seed('scheduledTests/iso', testRow({ endDateTime: new Date(Date.now() - 1000).toISOString() }))
    store.seed('scheduledTests/future', testRow())
    store.seed('scheduledTests/offset', testRow({ endDateTime: new Date(Date.now() + 5.5 * 3_600_000 - 1000).toISOString().replace('Z', '+05:30') }))
    store.seed('scheduledTests/future-string', testRow({ endDateTime: new Date(Date.now() + 3_600_000).toISOString() }))
    await api.autoSubmitExpiredStudentTests.run({} as any)
    assert.equal(store.data.get('scheduledTests/date').status, 'completed')
    assert.equal(store.data.get('scheduledTests/iso').status, 'completed')
    assert.equal(store.data.get('scheduledTests/offset').status, 'completed')
    assert.equal(store.data.get('scheduledTests/future-string').status, 'ongoing')
    assert.equal(store.data.get('scheduledTests/future').status, 'ongoing')
  })
  it('cleanup remains operational while the new due-time index is missing', async () => {
    store.seed('scheduledTests/ended', testRow({ endDateTime: new Date(Date.now() - 1000) }))
    store.failures.set('scheduledTests:ordered', 9)
    await api.autoSubmitExpiredStudentTests.run({} as any)
    assert.equal(store.data.get('scheduledTests/ended').status, 'completed')
  })
  it('multiple expired attempts share one question load and still finalize transactionally', async () => {
    store.seed('scheduledTests/test-a', testRow({ totalSubmitted: 0, totalGraded: 0 }))
    store.seed('scheduledTests/test-a/assessmentQuestions/q-1', { id: 'q-1', text: 'Two plus two?', type: 'mcq', marks: 1, options: [{ id: 'a', text: '4' }], correctAnswer: 'a' })
    for (let i = 0; i < 3; i++) store.seed(`studentAssessments/expired-${i}`, {
      testId: 'test-a', studentId: `s-${i}`, collegeId: 'college-a', status: 'in_progress', answers: [],
      startedAt: new Date(Date.now() - 120_000), endsAt: new Date(Date.now() - 1000), autoSubmitAt: new Date(Date.now() - 1000),
    })
    await api.autoSubmitExpiredStudentTests.run({} as any)
    assert.equal(store.reads.filter(path => path === 'scheduledTests/test-a/assessmentQuestions/q-1').length, 1)
    for (let i = 0; i < 3; i++) assert.equal(store.data.get(`studentAssessments/expired-${i}`).status, 'graded')
    assert.equal(store.data.get('scheduledTests/test-a').totalSubmitted, 3)
    assert.equal(store.data.get('scheduledTests/test-a').totalGraded, 3)
  })
  it('a cancellation after question loading is still honored by the final transaction', async () => {
    store.seed('scheduledTests/test-a', testRow({ totalSubmitted: 0, totalGraded: 0 }))
    store.seed('scheduledTests/test-a/assessmentQuestions/q-1', { id: 'q-1', text: 'Question', type: 'mcq', marks: 1, options: [{ id: 'a', text: 'A' }], correctAnswer: 'a' })
    store.seed('studentAssessments/expired', { testId: 'test-a', status: 'in_progress', answers: [], endsAt: new Date(Date.now() - 1000), autoSubmitAt: new Date(Date.now() - 1000) })
    let testReads = 0
    store.observeReads(path => {
      if (path === 'scheduledTests/test-a' && ++testReads === 2) store.seed(path, testRow({ status: 'cancelled', totalSubmitted: 0, totalGraded: 0 }))
    })
    await api.autoSubmitExpiredStudentTests.run({} as any)
    assert.equal(store.data.get('studentAssessments/expired').status, 'in_progress')
    assert.equal(store.data.get('scheduledTests/test-a').totalSubmitted, 0)
  })
  it('Journey coalesces only shared college evidence, while personal grades stay fresh and isolated', async () => {
    for (const [uid, collegeId] of [['learner-a', 'college-a'], ['learner-b', 'college-a'], ['learner-c', 'college-b']]) {
      store.seed(`users/${uid}`, { role: 'student', collegeId })
      store.seed(`students/${uid}`, { userId: uid, collegeId, branch: 'Science', batch: '2026', name: uid })
      store.seed(`gradeRecords/${uid}`, { studentId: uid, collegeId, status: 'published', code: 'M1', credits: 4, gradePoint: 8, semester: 1, grade: 'A', result: 'pass', isPass: true })
    }
    const run = (uid: string, collegeId: string, fresh = false) => journey.getMyAcademicJourney.run({ auth: { uid, token: { role: 'student', collegeId } }, data: { fresh } } as any) as Promise<any>
    const first = await run('learner-a', 'college-a', true)
    const queries = store.queries.length
    const second = await run('learner-b', 'college-a')
    assert.equal(first.grades.cgpa, 8); assert.equal(second.grades.cgpa, 8)
    assert.equal(second.grades.subjects[0].id, 'learner-b')
    assert.equal(store.queries.slice(queries).filter(query => query.path === 'gradeRecords' && !query.filters.some(([field]) => field === 'studentId')).length, 0)
    assert.equal(store.queries.slice(queries).filter(query => query.path === 'students' && query.filters.some(([field]) => field === 'collegeId')).length, 0)
    store.seed('gradeRecords/learner-b', { ...store.data.get('gradeRecords/learner-b'), gradePoint: 9 })
    assert.equal((await run('learner-b', 'college-a')).grades.cgpa, 9)
    const other = await run('learner-c', 'college-b', true)
    assert.equal(other.standing.cohortSize, 1)
    assert.ok(other.grades.subjects.every((row: any) => row.id === 'learner-c'))
    const beforeFresh = store.queries.length
    const refreshed = await run('learner-b', 'college-a', true)
    assert.equal(refreshed.standing.rank, 1)
    assert.equal(store.queries.slice(beforeFresh).filter(query => query.path === 'gradeRecords' && !query.filters.some(([field]) => field === 'studentId')).length, 1)
  })
  it('audit-only attendance updates skip all summary reads and writes', async () => {
    const row = { studentId: 's-1', collegeId: 'college-a', status: 'present', date: '2026-11-13', subject: 'Math' }
    await attendance.onAttendanceRecordWrite.run({ id: 'event', params: { recordId: 'r-1' }, data: {
      before: { exists: true, data: () => row }, after: { exists: true, data: () => ({ ...row, updatedAt: 'later', studentName: 'Corrected display name' }) },
    } } as any)
    assert.equal(store.reads.length, 0); assert.equal(store.writes.length, 0)
  })
  it('nightly reconciliation rotates past the first 200 students and wraps safely', async () => {
    for (let i = 0; i < 201; i++) store.seed(`attendanceSummaries/s-${String(i).padStart(3, '0')}`, { total: 0, version: 1 })
    await attendance.reconcileAttendanceSummaries.run({} as any)
    assert.equal(store.data.get('platform/attendanceReconcileCursor').cursor, 's-199')
    const queries = store.queries.length
    await attendance.reconcileAttendanceSummaries.run({} as any)
    assert.equal(store.data.get('platform/attendanceReconcileCursor').cursor, '')
    assert.equal(store.queries.slice(queries).filter(query => query.path === 'attendanceRecords').length, 1)
  })
})
