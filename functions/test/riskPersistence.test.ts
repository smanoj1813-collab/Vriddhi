import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import admin from 'firebase-admin'
import { makeRiskStore } from './helpers/riskStore'
import { academicFixture } from './helpers/academicFixture'
import { DEFAULT_RISK_SETTINGS } from '../src/riskCore'

const store = makeRiskStore()
const NOW = Date.parse('2026-11-13T13:00:00Z')
const originalNow = Date.now
const descriptors = new Map(['firestore', 'auth', 'messaging'].map(k => [k, Object.getOwnPropertyDescriptor(admin, k)]))
let api: typeof import('../src/riskAlerts')
let service: typeof import('../src/riskService')
before(async () => {
  const original = admin.firestore
  Object.defineProperty(admin, 'firestore', { configurable: true, value: Object.assign(() => store.db, { FieldValue: original.FieldValue, Timestamp: original.Timestamp, FieldPath: original.FieldPath }) })
  Object.defineProperty(admin, 'auth', { configurable: true, value: () => store.auth })
  Object.defineProperty(admin, 'messaging', { configurable: true, value: () => store.messaging })
  api = await import('../src/riskAlerts')
  service = await import('../src/riskService')
})
after(() => { for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(admin, key, descriptor); Date.now = originalNow })
const request = (uid: string | null = 'faculty-uid', data: unknown = {}, token: Record<string, any> = {}): any => ({ auth: uid ? { uid, token } : undefined, data })
function account(uid: string, role: string, collegeId = 'college-a', department?: string) {
  store.accounts.set(uid, { uid, displayName: uid, disabled: false, customClaims: { role, collegeId, ...(department ? { department } : {}) } })
  store.data.set(`users/${uid}`, { uid, role, collegeId, name: uid })
}
function seed() {
  store.reset(); Date.now = () => NOW
  account('faculty-uid', 'faculty'); account('student-uid', 'student'); account('hod-science', 'hod', 'college-a', 'Science')
  account('hod-commerce', 'hod', 'college-a', 'Commerce'); account('principal-a', 'principal'); account('principal-b', 'principal', 'college-b')
  account('hod-unknown', 'hod'); account('attacker', 'student')
  // This client-discoverable hint must never create Principal authority.
  store.data.get('users/attacker')!.role = 'principal'
  store.data.set('faculty/FAC001', { uid: 'faculty-uid', collegeId: 'college-a', department: 'Science', name: 'Teaching member' })
  store.data.set('students/student-1', { userId: 'student-uid', collegeId: 'college-a', name: 'Learner', course: 'BCA', branch: 'BCA', batch: '2026', semester: 3, division: 'A', status: 'active' })
  store.data.set('weeklySchedules/WS1', { collegeId: 'college-a', facultyId: 'FAC001', subject: 'DBMS', dayOfWeek: 'friday', startTime: '09:00', endTime: '10:00', effectiveFrom: '2026-11-13', effectiveTo: '2026-11-13', isActive: true, approvalStatus: 'approved' })
  const pack = { ...academicFixture(), status: 'active' }
  store.data.set('colleges/college-a', { name: 'Fixture college', schemePackId: pack.id, schemePackRevision: 1, schemePackSnapshot: pack })
  for (let i = 0; i < 4; i++) store.data.set(`attendanceRecords/r${i}`, { collegeId: 'college-a', studentId: 'student-1', sessionId: `session-${i}`, batch: '2026', semester: 3, status: i < 2 ? 'present' : 'absent', date: '2026-11-12' })
}
beforeEach(seed)
const entries = (collection: string) => [...store.data.entries()].filter(([p]) => p.startsWith(`${collection}/`)).map(([, data]) => data)
const selfAlert = (category: string) => entries('riskAlerts').find(r => r.category === category && r.recipientUid === 'faculty-uid')!
const resetCooldown = () => { for (const [p, v] of store.data) if (p.startsWith('riskRefreshLocks/')) v.nextAllowedAt = 0 }

describe('academic risk: actual authenticated callable handlers', () => {
  it('refuses anonymous reads, settings and device registration', async () => {
    for (const callable of [api.getMyAcademicRiskAlerts, api.refreshMyAcademicRiskAlerts, api.getAcademicRiskConfiguration, api.registerMyAcademicRiskDevice]) await assert.rejects(callable.run(request(null)), { code: 'unauthenticated' })
  })
  it('ignores a forged payload/token role and client-writable users role', async () => {
    await assert.rejects(api.saveAcademicRiskConfiguration.run(request('attacker', { settings: DEFAULT_RISK_SETTINGS, expectedRevision: 0, collegeId: 'college-b' }, { role: 'principal', collegeId: 'college-b' })), { code: 'permission-denied' })
    assert.equal(entries('academicRiskSettings').length, 0)
  })
  it('computes faculty aliases and sends to self, matching HOD and Principal, never every HOD', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request('faculty-uid', { subjectUid: 'student-uid', collegeId: 'college-b', recipientUid: 'attacker' }))
    const recipients = entries('riskAlerts').filter(a => a.category === 'class-register').map(a => a.recipientUid).sort()
    assert.deepEqual(recipients, ['faculty-uid', 'hod-science', 'principal-a'])
    assert.ok(entries('riskAlerts').every(a => a.collegeId === 'college-a' && a.subjectUid === 'faculty-uid'))
    assert.equal(entries('riskPushOutbox').length, 3)
  })
  it('does not leak a colleague’s records to faculty or a different-department HOD', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('hod-commerce'))).alerts.length, 0)
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('attacker'))).alerts.length, 0)
    const principal = await api.getMyAcademicRiskAlerts.run(request('principal-a'))
    assert.ok(principal.alerts.some((a: any) => a.category === 'class-register' && a.path === '/admin/attendance'))
  })
  it('rejects cross-recipient mark-read and does not accept client state changes', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request())
    const a = selfAlert('class-register')
    await assert.rejects(api.markMyAcademicRiskAlertRead.run(request('student-uid', { id: a.id })), { code: 'not-found' })
    await api.markMyAcademicRiskAlertRead.run(request('faculty-uid', { id: a.id, state: 'resolved', recipientUid: 'attacker' }))
    assert.equal(store.data.get(`riskAlerts/${a.id}`)?.read, true)
    assert.equal(store.data.get(`riskAlerts/${a.id}`)?.state, 'active')
  })
  it('deduplicates alerts/outbox across refreshes and preserves acknowledgements', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request())
    const a = selfAlert('class-register'), count = entries('riskAlerts').length
    await api.markMyAcademicRiskAlertRead.run(request('faculty-uid', { id: a.id }))
    resetCooldown(); await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(entries('riskAlerts').length, count); assert.equal(entries('riskPushOutbox').length, 3)
    assert.equal(store.data.get(`riskAlerts/${a.id}`)?.read, true)
  })
  it('rate-limits self-service scans and refuses supervisor-selected subjects', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request())
    await assert.rejects(api.refreshMyAcademicRiskAlerts.run(request()), { code: 'resource-exhausted' })
    await assert.rejects(api.refreshMyAcademicRiskAlerts.run(request('hod-science', { subjectUid: 'faculty-uid' })), { code: 'permission-denied' })
  })
  it('serializes scheduler/manual runs using a subject lease', async () => {
    store.data.set(`riskSubjectLocks/${service.riskHash('college-a', 'faculty-uid')}`, { lease: 'other-run', leaseUntil: NOW + 1000 })
    await assert.rejects(api.refreshMyAcademicRiskAlerts.run(request()), { code: 'resource-exhausted' })
    assert.equal(entries('riskAlerts').length, 0)
  })
  it('an incomplete register read retains earlier alerts as unverified, not resolved', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request()); resetCooldown()
    const id = selfAlert('class-register').id
    store.failedCollections.add('attendance')
    await api.refreshMyAcademicRiskAlerts.run(request())
    const a = store.data.get(`riskAlerts/${id}`)!
    assert.equal(a.state, 'unverified'); assert.equal(a.stale, true)
    assert.match(selfAlert('coverage').message, /could not be read/)
    assert.equal(entries('riskPushOutbox').length, 3)
  })
  it('a fixed class register resolves the same alert for all recipients after complete reads', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request()); resetCooldown()
    store.data.set('classSessions/WS1_2026-11-13', { collegeId: 'college-a', facultyId: 'FAC001', subject: 'DBMS', date: '2026-11-13', startTime: '09:00', endTime: '10:00', status: 'completed', attendanceMarked: true, attendanceCount: 0 })
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.ok(entries('riskAlerts').filter(a => a.category === 'class-register').every(a => a.state === 'resolved'))
  })
  it('pending timetable proposals cannot manufacture missing-register alerts', async () => {
    store.data.get('weeklySchedules/WS1')!.approvalStatus = 'pending_hod'
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(entries('riskAlerts').filter(a => a.category === 'class-register').length, 0)
  })
  it('immediately rechecks current recipient department and subject department on inbox reads', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.ok((await api.getMyAcademicRiskAlerts.run(request('hod-science'))).alerts.length > 0)
    store.accounts.get('hod-science').customClaims.department = 'Commerce'
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('hod-science'))).alerts.length, 0)
    store.accounts.get('hod-science').customClaims.department = 'Science'
    store.data.get('faculty/FAC001')!.department = 'Commerce'
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('hod-science'))).alerts.length, 0)
  })
  it('does not trust department in a self-editable users profile when HOD claim is absent', async () => {
    store.data.get('users/hod-unknown')!.department = 'Science'
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('hod-unknown'))).alerts.length, 0)
  })
  it('a demoted/disabled or college-moved recipient loses access to old alerts', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request())
    store.accounts.get('hod-science').customClaims.role = 'student'
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('hod-science'))).alerts.length, 0)
    store.accounts.get('principal-a').customClaims.collegeId = 'college-b'
    assert.equal((await api.getMyAcademicRiskAlerts.run(request('principal-a'))).alerts.length, 0)
    store.accounts.get('principal-a').disabled = true
    await assert.rejects(api.getMyAcademicRiskAlerts.run(request('principal-a')), { code: 'permission-denied' })
  })
  it('checks only the uniquely linked student and does not escalate student records to faculty supervisors', async () => {
    await api.refreshMyAcademicRiskAlerts.run(request('student-uid', { studentId: 'another-student', collegeId: 'college-b' }))
    const alerts = entries('riskAlerts').filter(a => a.category === 'attendance')
    assert.ok(alerts.length > 0); assert.ok(alerts.every(a => a.subjectUid === 'student-uid' && a.recipientUid === 'student-uid'))
    assert.match(alerts.find(a => a.title.includes('requirement'))!.message, /TEST_POLICY/)
  })
  it('refuses duplicate or wrong-tenant student linkage instead of selecting a profile arbitrarily', async () => {
    store.data.set('students/duplicate', { ...store.data.get('students/student-1'), userId: 'student-uid' })
    await assert.rejects(api.refreshMyAcademicRiskAlerts.run(request('student-uid')), { code: 'failed-precondition' })
    assert.equal(entries('riskAlerts').length, 0)
  })
  it('surfaces scheme configuration gaps rather than a silent BCU/75% fallback', async () => {
    store.data.set('colleges/college-a', { name: 'No assigned policy' })
    await api.refreshMyAcademicRiskAlerts.run(request('student-uid'))
    const alerts = entries('riskAlerts')
    assert.ok(!alerts.some(a => a.title.includes('requirement')))
    assert.match(alerts.find(a => a.category === 'coverage')!.message, /No default university or 75%/)
  })
})
describe('Principal-only settings and explicit staff working schedules', () => {
  it('stores settings in the verified college and audits changes atomically', async () => {
    await api.saveAcademicRiskConfiguration.run(request('principal-a', { settings: { ...DEFAULT_RISK_SETTINGS, registerGraceHours: 4 }, expectedRevision: 0, collegeId: 'college-b' }))
    assert.equal(store.data.get('academicRiskSettings/college-a')!.settings.registerGraceHours, 4)
    assert.equal(store.data.has('academicRiskSettings/college-b'), false)
    assert.equal(entries('riskConfigurationAudit').length, 1)
    await assert.rejects(api.saveAcademicRiskConfiguration.run(request('principal-a', { settings: DEFAULT_RISK_SETTINGS, expectedRevision: 0 })), { code: 'aborted' })
    assert.equal(entries('riskConfigurationAudit').length, 1)
  })
  for (const uid of ['faculty-uid', 'hod-science', 'student-uid']) it(`${uid} cannot read/change college risk configuration`, async () => {
    await assert.rejects(api.getAcademicRiskConfiguration.run(request(uid)), { code: 'permission-denied' })
    await assert.rejects(api.saveAcademicRiskConfiguration.run(request(uid, { settings: DEFAULT_RISK_SETTINGS, expectedRevision: 0 })), { code: 'permission-denied' })
  })
  it('validates thresholds and working schedule days/times/effective dates', async () => {
    await assert.rejects(api.saveAcademicRiskConfiguration.run(request('principal-a', { settings: { ...DEFAULT_RISK_SETTINGS, gradingBacklogDays: -1 }, expectedRevision: 0 })), { code: 'invalid-argument' })
    await assert.rejects(api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid: 'faculty-uid', schedule: { days: [], startTime: '17:00', endTime: '09:00', effectiveFrom: '2026-02-30', excludedDates: [] } })), { code: 'invalid-argument' })
    assert.equal(entries('academicRiskSettings').length, 0); assert.equal(entries('riskStaffSchedules').length, 0)
  })
  it('cannot assign another college’s faculty or a student a working schedule', async () => {
    account('faculty-b', 'faculty', 'college-b')
    for (const facultyUid of ['faculty-b', 'student-uid']) await assert.rejects(api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid, remove: true })), { code: 'permission-denied' })
  })
  it('keeps tenant/UID delimiter combinations in distinct schedule documents', async () => {
    account('principal-team', 'principal', 'college-a__team')
    account('faculty-x', 'faculty', 'college-a__team'); account('team__faculty-x', 'faculty', 'college-a')
    const schedule = { days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', effectiveTo: '', excludedDates: [] }
    await api.saveFacultyRiskWorkSchedule.run(request('principal-team', { facultyUid: 'faculty-x', schedule }))
    await api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid: 'team__faculty-x', schedule: { ...schedule, startTime: '10:00' } }))
    assert.equal(entries('riskStaffSchedules').length, 2)
    assert.equal(store.data.get(`riskStaffSchedules/${service.riskHash('college-a__team', 'faculty-x')}`)!.startTime, '09:00')
    assert.equal(store.data.get(`riskStaffSchedules/${service.riskHash('college-a', 'team__faculty-x')}`)!.startTime, '10:00')
  })
  it('an incorrectly linked schedule is incomplete coverage, never proof an earlier staff risk cleared', async () => {
    const schedule = { days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', effectiveTo: '', excludedDates: [] }
    await api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid: 'faculty-uid', schedule }))
    await api.refreshMyAcademicRiskAlerts.run(request()); assert.equal(selfAlert('staff-attendance').state, 'active')
    store.data.get(`riskStaffSchedules/${service.riskHash('college-a', 'faculty-uid')}`)!.collegeId = 'college-b'
    resetCooldown(); await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(selfAlert('staff-attendance').state, 'unverified')
    assert.match(selfAlert('coverage').message, /invalid faculty\/college linkage/)
  })
  it('adds explicit missing check-in/out alerts and respects leave/exclusions', async () => {
    const schedule = { days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', effectiveTo: '', excludedDates: [] }
    await api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid: 'faculty-uid', schedule }))
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.match(selfAlert('staff-attendance').message, /check-in and check-out/)
    resetCooldown(); store.data.set('staffAttendance/work-record', { collegeId: 'college-a', facultyId: 'faculty-uid', date: '2026-11-13', status: 'leave' })
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(selfAlert('staff-attendance').state, 'resolved')
  })
  it('removing/pausing schedule coverage does not claim earlier staff issues were fixed', async () => {
    const schedule = { days: [5], startTime: '09:00', endTime: '17:00', effectiveFrom: '2026-11-01', effectiveTo: '', excludedDates: [] }
    await api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid: 'faculty-uid', schedule })); await api.refreshMyAcademicRiskAlerts.run(request())
    await api.saveFacultyRiskWorkSchedule.run(request('principal-a', { facultyUid: 'faculty-uid', remove: true })); resetCooldown(); await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(selfAlert('staff-attendance').state, 'unverified')
  })
})
describe('registered-device ownership, FCM privacy and delivery deduplication', () => {
  const token = 'fixture_token_'.repeat(8)
  it('rejects malformed tokens and derives ownership from the current Auth user', async () => {
    await assert.rejects(api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token: 'bad' })), { code: 'invalid-argument' })
    await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token, uid: 'attacker', collegeId: 'college-b' }))
    assert.equal(entries('riskPushDevices')[0].uid, 'faculty-uid'); assert.equal(entries('riskPushDevices')[0].collegeId, 'college-a')
  })
  it('a shared-browser token has exactly one owner, and another owner cannot unregister it', async () => {
    await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token }))
    await api.registerMyAcademicRiskDevice.run(request('student-uid', { token }))
    await api.unregisterMyAcademicRiskDevice.run(request('faculty-uid', { token }))
    assert.equal(entries('riskPushDevices').length, 1); assert.equal(entries('riskPushDevices')[0].uid, 'student-uid')
    await api.unregisterMyAcademicRiskDevice.run(request('student-uid', { token })); assert.equal(entries('riskPushDevices').length, 0)
  })
  it('bounds registered devices per account', async () => {
    for (let i = 0; i < 12; i++) await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token: `${token}${i}` }))
    assert.equal(entries('riskPushDevices').length, 10)
  })
  it('sends a data-only generic inbox reminder, not academic names, marks or attendance details', async () => {
    await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token })); await api.refreshMyAcademicRiskAlerts.run(request())
    const item = [...store.data.entries()].find(([p, v]) => p.startsWith('riskPushOutbox/') && v.recipientUid === 'faculty-uid')!
    await api.deliverAcademicRiskPush(item[0].split('/')[1])
    assert.equal(store.pushes.length, 1)
    const push = store.pushes[0]
    assert.equal(push.notification, undefined); assert.equal(push.webpush.notification, undefined)
    assert.deepEqual(Object.keys(push.data).sort(), ['alertId', 'generation', 'kind', 'path', 'recipientUid'])
    assert.equal(push.data.path, '/faculty/risk-alerts'); assert.equal(push.data.recipientUid, 'faculty-uid')
    assert.equal(push.webpush.headers.TTL, '900')
    await api.deliverAcademicRiskPush(item[0].split('/')[1]); assert.equal(store.pushes.length, 1)
  })
  it('rechecks HOD department at send time, even for already-queued alerts', async () => {
    await api.registerMyAcademicRiskDevice.run(request('hod-science', { token })); await api.refreshMyAcademicRiskAlerts.run(request())
    const item = [...store.data.entries()].find(([p, v]) => p.startsWith('riskPushOutbox/') && v.recipientUid === 'hod-science')!
    store.accounts.get('hod-science').customClaims.department = 'Commerce'
    await api.deliverAcademicRiskPush(item[0].split('/')[1])
    assert.equal(store.pushes.length, 0); assert.equal(store.data.get(item[0])!.status, 'skipped')
  })
  it('does not send a queued risk after the underlying issue was resolved', async () => {
    await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token })); await api.refreshMyAcademicRiskAlerts.run(request())
    const item = [...store.data.entries()].find(([p, v]) => p.startsWith('riskPushOutbox/') && v.recipientUid === 'faculty-uid')!
    store.data.get(`riskAlerts/${item[1].alertId}`)!.state = 'resolved'
    await api.deliverAcademicRiskPush(item[0].split('/')[1]); assert.equal(store.pushes.length, 0)
  })
  for (const expired of ['age', 'attempts']) it(`direct trigger delivery respects the ${expired} retry budget, not only the retry sweep`, async () => {
    await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token })); await api.refreshMyAcademicRiskAlerts.run(request())
    const item = [...store.data.entries()].find(([p, v]) => p.startsWith('riskPushOutbox/') && v.recipientUid === 'faculty-uid')!
    Object.assign(store.data.get(item[0])!, expired === 'age' ? { createdAt: NOW - 25 * 3_600_000 } : { attempts: 8 })
    await api.deliverAcademicRiskPush(item[0].split('/')[1])
    assert.equal(store.pushes.length, 0); assert.equal(store.data.get(item[0])!.status, 'skipped')
    assert.equal(store.data.get(item[0])!.reason, 'delivery-window-expired')
  })
  it('keeps transient failures retryable without creating duplicate outbox generations', async () => {
    await api.registerMyAcademicRiskDevice.run(request('faculty-uid', { token })); await api.refreshMyAcademicRiskAlerts.run(request())
    const item = [...store.data.entries()].find(([p, v]) => p.startsWith('riskPushOutbox/') && v.recipientUid === 'faculty-uid')!
    store.setFailPush(true); await assert.rejects(api.deliverAcademicRiskPush(item[0].split('/')[1]), /transient/)
    assert.equal(store.data.get(item[0])!.status, 'pending'); assert.equal(store.data.get(item[0])!.leaseUntil, 0)
    store.setFailPush(false); await api.deliverAcademicRiskPush(item[0].split('/')[1])
    assert.equal(store.data.get(item[0])!.status, 'sent'); assert.equal(entries('riskPushOutbox').length, 3)
  })
})
describe('safety caps and resumable background checks', () => {
  it('pausing risk checks never loads absent class/work-schedule evidence', async () => {
    store.data.set('academicRiskSettings/college-a', { settings: { ...DEFAULT_RISK_SETTINGS, enabled: false }, revision: 1 })
    store.failedCollections.add('riskStaffSchedules')
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(store.reads.some(p => p === 'classSessions' || p.startsWith('riskStaffSchedules/')), false)
    assert.equal(entries('riskAlerts').filter(a => a.category !== 'coverage').length, 0)
    assert.match(entries('riskAlerts')[0].message, /paused/)
  })
  it('reconciles more than two full write chunks without reusing a committed batch', async () => {
    for (let i = 0; i < 805; i++) store.data.set(`riskAlerts/history-${i}`, { key: `class-register:old-${i}`, category: 'class-register', state: 'active', subjectUid: 'faculty-uid', recipientUid: 'faculty-uid', collegeId: 'college-a', dependencies: ['sessions', 'registers', 'weekly', 'holidays'] })
    await api.refreshMyAcademicRiskAlerts.run(request())
    assert.equal(entries('riskAlerts').filter(a => a.key.startsWith('class-register:old-') && a.state === 'resolved').length, 805)
    assert.equal(entries('riskSubjectLocks').length, 0)
  })
  it('a capped source is explicitly incomplete, not a successful empty list', async () => {
    const ctx = { complete: {} as Record<string, boolean>, coverage: [] as string[] }
    const result = await service.readRiskRows(ctx, 'submissions', { limit: (n: number) => ({ get: async () => ({ size: 3, docs: [1, 2, 3].slice(0, n).map(id => ({ id: String(id), data: () => ({}) })) }) }) } as any, 2)
    assert.equal(result.length, 2); assert.equal(ctx.complete.submissions, false); assert.match(ctx.coverage.join(' '), /safety read limit/)
  })
  it('the scheduled function validates discovered accounts and completes a small cursor cycle', async () => {
    await api.sweepAcademicRiskAlerts.run({} as any)
    assert.equal(store.data.get('riskJobs/academic-sweep')!.cycleComplete, true)
    assert.equal(store.data.get('riskJobs/academic-sweep')!.cursor, '')
    assert.ok(entries('riskAlerts').some(a => a.subjectUid === 'faculty-uid'))
    assert.ok(entries('riskAlerts').some(a => a.subjectUid === 'student-uid'))
  })
})
