import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import admin from 'firebase-admin'
import { DEFAULT_RISK_SETTINGS } from '../src/riskCore'
import { createHash } from 'node:crypto'
import { makeRiskStore } from './helpers/riskStore'

const store = makeRiskStore()
const NOW = Date.parse('2026-11-13T13:00:00Z')
let now = NOW
const originalNow = Date.now
const descriptors = new Map(['firestore', 'auth'].map(k => [k, Object.getOwnPropertyDescriptor(admin, k)]))
let api: typeof import('../src/riskAlerts')
let sweep: typeof import('../src/riskSweep')
before(async () => {
  const original = admin.firestore
  Object.defineProperty(admin, 'firestore', { configurable: true, value: Object.assign(() => store.db, { FieldValue: original.FieldValue, Timestamp: original.Timestamp, FieldPath: original.FieldPath }) })
  Object.defineProperty(admin, 'auth', { configurable: true, value: () => store.auth })
  api = await import('../src/riskAlerts')
  sweep = await import('../src/riskSweep')
})
after(() => { for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(admin, key, descriptor); Date.now = originalNow })
beforeEach(() => {
  store.reset(); now = NOW; Date.now = () => now
  store.data.set('academicRiskSettings/college-a', { settings: { ...DEFAULT_RISK_SETTINGS, enabled: false }, revision: 1 })
})
const hash = (...parts: string[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex')
const collegeKey = () => hash('college-a')
const keyFor = (value: string) => hash(value)
function reviewKey(mode: 'self' | 'college', uid?: string) {
  return hash(collegeKey(), mode, mode === 'self' ? uid || '' : '', '2026-11-13')
}
const job = (key = collegeKey()) => store.data.get(`riskJobs/manual_${key}`)!
const requestId = (review: string, sequence = 0, key = collegeKey()) => `manual_${key}_${review}__${sequence}`
const request = (review: string, sequence = 0, key = collegeKey()) => store.data.get(`riskSweepRequests/${requestId(review, sequence, key)}`)
const start = (uid = 'faculty-uid') => api.requestAcademicRiskReview.run({ auth: { uid, token: {} }, data: {} } as any) as Promise<any>
const work = (review: string, sequence = 0, key = collegeKey()) =>
  api.continueAcademicRiskSweep.run({ params: { requestId: requestId(review, sequence, key) } } as any)
function account(uid: string, role = 'student', collegeId = 'college-a', extra: Record<string, unknown> = {}) {
  store.accounts.set(uid, { uid, displayName: uid, disabled: false, customClaims: { role, collegeId, ...extra } })
  store.data.set(`users/${uid}`, { uid, role, collegeId })
}

describe('manual academic risk reviews', () => {
  it('the retired scheduler no longer queues reviews and push recovery stays independent', async () => {
    const starter = (api.sweepAcademicRiskAlerts as any).__endpoint
    const recovery = (api.retryAcademicRiskPush as any).__endpoint
    const worker = (api.continueAcademicRiskSweep as any).__endpoint
    assert.equal(starter.scheduleTrigger.schedule, '0 3 * * *')
    assert.equal(recovery.scheduleTrigger.schedule, '0 6 * * *')
    assert.equal(recovery.scheduleTrigger.timeZone, 'Asia/Kolkata')
    assert.equal(worker.eventTrigger.eventFilterPathPatterns.document, 'riskSweepRequests/{requestId}')
    assert.equal(worker.concurrency, 1)
    assert.equal(worker.maxInstances, 1)
    account('learner')
    await api.sweepAcademicRiskAlerts.run({} as any)
    assert.deepEqual(store.reads, [])
    assert.deepEqual(store.writes, [])
  })
  it('a Faculty request queues one self-only review and reads no roster', async () => {
    account('faculty-uid', 'faculty')
    assert.deepEqual(await start(), { accepted: true })
    const job = store.data.get(`riskJobs/manual_${collegeKey()}`)!
    assert.equal(job.mode, 'self')
    assert.equal(job.collegeId, 'college-a')
    assert.equal(job.requesterUid, 'faculty-uid')
    assert.equal(job.status, 'running')
    assert.equal(request(reviewKey('self', 'faculty-uid')).status, 'pending')
    assert.equal(store.reads.includes('users'), false)
  })
  it('a Principal request queues one college-wide review', async () => {
    account('principal-a', 'principal')
    assert.deepEqual(await start('principal-a'), { accepted: true })
    const job = store.data.get(`riskJobs/manual_${collegeKey()}`)!
    assert.equal(job.mode, 'college')
    assert.equal(job.requesterUid, 'principal-a')
    assert.equal(request(reviewKey('college')).status, 'pending')
  })
  it('students, HODs and unverified accounts cannot queue a review', async () => {
    account('learner', 'student'); account('hod', 'hod'); account('disabled', 'faculty'); store.accounts.get('disabled').disabled = true
    for (const uid of ['learner', 'hod', 'disabled', 'missing']) await assert.rejects(start(uid), { code: 'permission-denied' })
    await assert.rejects(api.requestAcademicRiskReview.run({ data: {} } as any), { code: 'unauthenticated' })
    assert.equal([...store.data.keys()].filter(p => p.startsWith('riskJobs/')).length, 0)
    assert.equal([...store.data.keys()].filter(p => p.startsWith('riskSweepRequests/')).length, 0)
  })
  it('duplicate clicks in the same IST day return already-requested without scanning again', async () => {
    account('faculty-uid', 'faculty')
    await start()
    const writes = store.writes.length, reads = store.reads.length
    assert.deepEqual(await start(), { accepted: false, reason: 'already-requested' })
    assert.equal(store.writes.length, writes)
    assert.equal(store.reads.length, reads + 3)
    now = Date.parse('2026-11-13T18:29:00Z') // still the same IST day
    assert.deepEqual(await start(), { accepted: false, reason: 'already-requested' })
  })
  it('a new IST day queues a fresh review while the completed one keeps its record', async () => {
    account('faculty-uid', 'faculty')
    await start(); await work(reviewKey('self', 'faculty-uid'))
    const first = { ...job() }
    now = Date.parse('2026-11-13T18:31:00Z') // next IST day
    assert.deepEqual(await start(), { accepted: true })
    assert.equal(job().status, 'running')
    assert.equal(job().processed, 0)
    assert.notEqual(job().review, first.review)
    assert.equal(store.data.get(`riskSweepRequests/${requestId(first.review)}`).status, 'done')
  })
  it('different scopes in one college do not consume each other’s daily slot', async () => {
    account('faculty-uid', 'faculty'); account('principal-a', 'principal')
    assert.deepEqual(await start('faculty-uid'), { accepted: true })
    await assert.rejects(start('principal-a'), { code: 'resource-exhausted' })
    assert.equal(job().status, 'running')
    assert.equal(request(reviewKey('college')), undefined)
  })
  it('a live college review rejects another request instead of over-scanning', async () => {
    account('faculty-uid', 'faculty'); account('principal-a', 'principal')
    assert.deepEqual(await start('principal-a'), { accepted: true })
    await assert.rejects(start('faculty-uid'), { code: 'resource-exhausted' })
    assert.equal([...store.data.keys()].filter(p => p.startsWith('riskSweepRequests/')).length, 1)
  })
  it('a completed review still cannot restart later the same day', async () => {
    account('faculty-uid', 'faculty')
    await start(); await work(reviewKey('self', 'faculty-uid'))
    assert.equal(job().status, 'complete')
    now += 60 * 60_000
    assert.deepEqual(await start(), { accepted: false, reason: 'already-requested' })
  })
  it('an expired running review can be replaced after the safety window', async () => {
    account('faculty-uid', 'faculty')
    await start()
    job().startedAt = now - 25 * 60 * 60_000
    job().status = 'running'
    now += 24 * 60 * 60_000
    assert.deepEqual(await start(), { accepted: true })
  })
  it('a live legacy scheduled review must finish before a manual review starts', async () => {
    account('faculty-uid', 'faculty')
    store.data.set('riskJobs/academic-sweep', { cadence: 'daily', period: '2026-11-13', sequence: 0, status: 'running', leaseUntil: now + 60_000 })
    await assert.rejects(start(), { code: 'failed-precondition' })
    store.data.set('riskJobs/academic-sweep', { cadence: 'daily', period: '2026-11-13', sequence: 0, status: 'running', leaseUntil: now - 1 })
    assert.deepEqual(await start(), { accepted: true }, 'a drained rollout job must not disable manual reviews')
  })
  it('the self review checks only the requesting verified faculty member', async () => {
    account('faculty-uid', 'faculty'); account('colleague', 'faculty'); account('learner', 'student')
    await start()
    await work(reviewKey('self', 'faculty-uid'))
    const subjects = [...store.data.entries()].filter(([p]) => p.startsWith('riskSubjectRuns/')).map(([, v]) => v.subjectUid)
    assert.deepEqual(subjects, ['faculty-uid'])
    assert.equal(job().processed, 1)
    assert.equal(job().cycleComplete, true)
    assert.equal(job().status, 'complete')
    assert.equal(request(reviewKey('self', 'faculty-uid')).status, 'done')
  })
  it('the college review scans only student/faculty/mentor accounts in that college', async () => {
    account('principal-a', 'principal'); account('learner', 'student'); account('teacher', 'mentor')
    account('other-college', 'student', 'college-b'); account('outsider', 'hod'); store.data.get('users/outsider')!.role = 'student'
    await start('principal-a')
    await work(reviewKey('college'))
    assert.equal(job().processed, 2)
    assert.equal(store.reads.includes('riskSubjectLocks'), false)
    const subjects = [...store.data.entries()].filter(([p]) => p.startsWith('riskSubjectRuns/')).map(([, v]) => v.subjectUid).sort()
    assert.deepEqual(subjects, ['learner', 'teacher'])
  })
  it('a request for another college’s job id does nothing', async () => {
    account('principal-a', 'principal')
    await start('principal-a')
    const foreign = keyFor('college-b')
    await api.continueAcademicRiskSweep.run({ params: { requestId: requestId(reviewKey('college'), 0, foreign) } } as any)
    assert.equal(store.reads.includes('users'), false)
  })
  it('a forged, foreign or over-budget review id cannot start a scan', async () => {
    account('principal-a', 'principal'); account('learner', 'student')
    await start('principal-a')
    const key = requestId(reviewKey('college'))
    for (const id of [key.replace(/^manual_(\w)/, 'manual_x'), `${key}0`, 'manual_short_x__0', `manual_${collegeKey()}_${reviewKey('college')}__200`, key.replace('manual_', 'scheduled_')]) {
      await api.continueAcademicRiskSweep.run({ params: { requestId: id } } as any)
    }
    assert.equal(store.reads.includes('users'), false)
    assert.equal(request(reviewKey('college')).status, 'pending')
  })
  it('a review whose requester lost staff authority fails without scanning the college', async () => {
    account('principal-a', 'principal')
    await start('principal-a')
    store.accounts.get('principal-a').customClaims.role = 'student'
    await work(reviewKey('college'))
    assert.equal(store.reads.includes('users'), false)
    assert.equal(job().status, 'failed')
    assert.equal(job().failure, 'requester-unauthorized')
    assert.equal(request(reviewKey('college')).status, 'failed')
  })
  it('a review older than the safety window fails instead of scanning silently', async () => {
    account('faculty-uid', 'faculty')
    await start()
    job().startedAt = now - 25 * 60 * 60_000
    await work(reviewKey('self', 'faculty-uid'))
    assert.equal(job().status, 'failed')
    assert.equal(job().failure, 'review-expired')
    assert.equal(request(reviewKey('self', 'faculty-uid')).status, 'failed')
  })
  it('an expired worker cannot publish or checkpoint a subject, and the retry reuses the cursor', async () => {
    account('principal-a', 'principal'); account('a-learner', 'student'); account('z-learner', 'student')
    await start('principal-a')
    store.setReadObserver(path => { if (path === 'riskAlerts') now = NOW + 9 * 60_000 })
    await assert.rejects(work(reviewKey('college')), /expired before its page checkpoint/)
    assert.equal(job().cursor, '')
    assert.equal(job().leaseUntil, 0)
    assert.ok(store.writes.every(w => !/^risk(Alerts|SubjectRuns|PushOutbox)\//.test(w.path)))
    store.setReadObserver()
    await work(reviewKey('college'))
    assert.equal(job().cycleComplete, true)
    assert.equal(job().processed, 2)
  })
  it('publishes a freshness record without per-account lock documents', async () => {
    account('faculty-uid', 'faculty')
    await start(); await work(reviewKey('self', 'faculty-uid'))
    assert.equal(job().processed, 1)
    assert.equal(store.writes.filter(w => w.path.startsWith('riskSubjectRuns/')).length, 1)
    assert.equal(store.writes.some(w => w.path.startsWith('riskSubjectLocks/')), false)
    assert.equal(store.reads.some(p => p.startsWith('riskSubjectLocks/')), false)
  })
  it('a live lease rejects a delivery for retry, then the retry succeeds', async () => {
    account('principal-a', 'principal')
    await start('principal-a')
    job().lease = 'previous-worker'; job().leaseUntil = now + 1000
    await assert.rejects(work(reviewKey('college')), /already leased/)
    assert.equal(request(reviewKey('college')).attempts, 0)
    assert.equal(store.reads.includes('users'), false)
    now += 1001
    await work(reviewKey('college'))
    assert.equal(job().cycleComplete, true)
    assert.equal(request(reviewKey('college')).attempts, 1)
  })
  it('duplicate completed deliveries are no-op reads with no source scan or writes', async () => {
    account('faculty-uid', 'faculty')
    await start(); await work(reviewKey('self', 'faculty-uid'))
    const writes = store.writes.length, reads = store.reads.length
    await work(reviewKey('self', 'faculty-uid'))
    assert.equal(store.writes.length, writes)
    assert.ok(store.reads.slice(reads).every(p => p.startsWith('riskJobs/') || p.startsWith('riskSweepRequests/')))
  })
  it('an infrastructure failure releases the lease and can recover on the retry', async () => {
    account('principal-a', 'principal'); account('learner', 'student')
    await start('principal-a')
    store.failedCollections.add('users')
    await assert.rejects(work(reviewKey('college')), /Fixture read failure/)
    assert.equal(job().leaseUntil, 0)
    assert.equal(job().status, 'running')
    assert.equal(request(reviewKey('college')).attempts, 1)
    store.failedCollections.delete('users')
    await work(reviewKey('college'))
    assert.equal(request(reviewKey('college')).attempts, 2)
    assert.equal(job().status, 'complete')
  })
  it('stops a repeatedly failing review instead of creating unlimited scans', async () => {
    account('principal-a', 'principal')
    await start('principal-a')
    store.failedCollections.add('users')
    for (let attempt = 1; attempt <= 3; attempt++) {
      await assert.rejects(work(reviewKey('college')), /Fixture read failure/)
      assert.equal(request(reviewKey('college')).attempts, attempt)
    }
    const sourceReads = store.reads.filter(p => p === 'users').length
    await work(reviewKey('college'))
    assert.equal(job().status, 'failed')
    assert.equal(job().failure, 'chunk-attempt-budget')
    assert.equal(request(reviewKey('college')).status, 'failed')
    assert.equal(store.reads.filter(p => p === 'users').length, sourceReads)
  })
  it('a college review pages through more than one screen of the roster in one chunk', async () => {
    account('principal-a', 'principal')
    for (let i = 0; i < 60; i++) account(`scan-${String(i).padStart(2, '0')}`)
    await start('principal-a')
    await work(reviewKey('college'))
    assert.equal(job().discovered, 60)
    assert.equal(job().processed, 60)
    assert.equal(job().cycleComplete, true)
    assert.equal(job().status, 'complete')
    assert.equal(request(reviewKey('college'), 0).status, 'done')
    assert.equal(request(reviewKey('college'), 1), undefined)
  })
  it('finishes a roster beyond the per-chunk discovery budget in a continuation this cycle', async () => {
    account('principal-a', 'principal')
    for (let i = 0; i < 1001; i++) account(`bulk-${String(i).padStart(4, '0')}`)
    await start('principal-a')
    await work(reviewKey('college'))
    assert.equal(job().discovered, 1000)
    assert.equal(job().cursor, 'bulk-0999')
    assert.equal(job().sequence, 1)
    assert.equal(request(reviewKey('college'), 0).status, 'done')
    assert.equal(request(reviewKey('college'), 1).status, 'pending')
    await work(reviewKey('college'), 1)
    assert.equal(job().discovered, 1001)
    assert.equal(job().processed, 1001)
    assert.equal(job().cycleComplete, true)
    assert.equal(request(reviewKey('college'), 2), undefined)
  })
  it('the time budget checkpoints a full page and queues the remainder immediately', async () => {
    account('principal-a', 'principal')
    for (let i = 0; i < 26; i++) { store.data.set(`users/hint-${String(i).padStart(2, '0')}`, { role: 'student' }); account(`hint-${String(i).padStart(2, '0')}`) }
    await start('principal-a')
    store.setReadObserver(path => { if (path === 'users') now = NOW + 8 * 60_000 })
    await work(reviewKey('college'))
    assert.equal(job().discovered, 25)
    assert.equal(job().cursor, 'hint-24')
    assert.equal(request(reviewKey('college'), 1).status, 'pending')
    store.setReadObserver()
    await work(reviewKey('college'), 1)
    assert.equal(job().discovered, 26)
    assert.equal(job().cycleComplete, true)
  })
  it('a worker that lost its lease cannot overwrite the replacement checkpoint or enqueue work', async () => {
    account('principal-a', 'principal'); account('learner', 'student')
    await start('principal-a')
    store.setReadObserver(path => { if (path === 'users') Object.assign(job(), { lease: 'replacement', cursor: 'replacement-cursor' }) })
    await work(reviewKey('college'))
    assert.equal(job().lease, 'replacement')
    assert.equal(job().cursor, 'replacement-cursor')
    assert.equal(request(reviewKey('college')).status, 'pending')
    assert.equal(request(reviewKey('college'), 1), undefined)
  })
  it('drains an already-created legacy scheduled request during the rollout', async () => {
    account('learner')
    store.data.set('riskJobs/academic-sweep', { cadence: 'daily', period: '2026-11-13', sequence: 0, status: 'running', cursor: '', leaseUntil: 0 })
    store.data.set('riskSweepRequests/daily_2026-11-13__0', { cadence: 'daily', period: '2026-11-13', sequence: 0, status: 'pending', attempts: 0 })
    await api.continueAcademicRiskSweep.run({ params: { requestId: 'daily_2026-11-13__0' } } as any)
    assert.equal(store.data.get('riskJobs/academic-sweep')!.cycleComplete, true)
    assert.equal(store.data.get('riskJobs/academic-sweep')!.processed, 1)
  })
  it('drains an already-created legacy monthly request with the legacy id shape', async () => {
    account('learner')
    store.data.set('riskJobs/academic-sweep', { cadence: 'monthly', period: '2026-11', sequence: 0, status: 'running', cursor: '', leaseUntil: 0 })
    store.data.set('riskSweepRequests/2026-11__0', { period: '2026-11', sequence: 0, status: 'pending', attempts: 0 })
    await api.continueAcademicRiskSweep.run({ params: { requestId: '2026-11__0' } } as any)
    assert.equal(store.data.get('riskJobs/academic-sweep')!.cycleComplete, true)
    assert.equal(store.data.get('riskJobs/academic-sweep')!.processed, 1)
  })
  it('does not start new scheduled work for a stale period or an unqueued job', async () => {
    await api.continueAcademicRiskSweep.run({ params: { requestId: 'daily_2026-11-01__0' } } as any)
    await api.continueAcademicRiskSweep.run({ params: { requestId: 'daily_2026-11-13__0' } } as any)
    await api.continueAcademicRiskSweep.run({ params: { requestId: '2026-10__0' } } as any)
    assert.deepEqual(store.writes, [])
    assert.equal(store.reads.includes('users'), false)
    assert.equal([...store.data.keys()].filter(p => p.startsWith('riskJobs/')).length, 0)
  })
  it('malformed and excessive request ids cannot start database work', async () => {
    for (const id of ['../foreign', '2026-13__0', '2026-11__00', '2026-11__-1', '2026-11__200', 'daily_2026-13__0', 'monthly_2026-11-31__0', 'weekly_2026-11-09__200']) {
      await api.continueAcademicRiskSweep.run({ params: { requestId: id } } as any)
    }
    assert.deepEqual(store.reads, [])
    assert.deepEqual(store.writes, [])
  })
  it('the review continuation budget fails visibly instead of looping forever', async () => {
    account('principal-a', 'principal')
    for (let i = 0; i < 1000; i++) { store.data.set(`users/orphan-${String(i).padStart(4, '0')}`, { role: 'student' }); account(`orphan-${String(i).padStart(4, '0')}`, 'student') }
    await start('principal-a')
    job().sequence = 199
    Object.assign(request(reviewKey('college')), { sequence: 199 })
    store.data.set(`riskSweepRequests/${requestId(reviewKey('college'), 199)}`, { ...request(reviewKey('college')), sequence: 199 })
    store.data.delete(`riskSweepRequests/${requestId(reviewKey('college'))}`)
    await work(reviewKey('college'), 199)
    assert.equal(job().status, 'failed')
    assert.equal(job().failure, 'review-chunk-budget')
    assert.equal(job().cycleComplete, false)
    assert.equal(request(reviewKey('college'), 200), undefined)
  })
  it('the inbox reports the manual review scope and current review status', async () => {
    account('faculty-uid', 'faculty'); account('principal-a', 'principal'); account('learner', 'student')
    const facultyInbox = await api.getMyAcademicRiskAlerts.run({ auth: { uid: 'faculty-uid', token: {} }, data: {} } as any) as any
    assert.equal(facultyInbox.canRefresh, false)
    assert.equal(facultyInbox.manualReviewScope, 'self')
    assert.equal(facultyInbox.manualReview, null)
    const learnerInbox = await api.getMyAcademicRiskAlerts.run({ auth: { uid: 'learner', token: {} }, data: {} } as any) as any
    assert.equal(learnerInbox.manualReviewScope, null)
    await start('faculty-uid')
    const running = await api.getMyAcademicRiskAlerts.run({ auth: { uid: 'faculty-uid', token: {} }, data: {} } as any) as any
    assert.deepEqual(running.manualReview, { status: 'running', processed: 0, errors: 0 })
    const principalInbox = await api.getMyAcademicRiskAlerts.run({ auth: { uid: 'principal-a', token: {} }, data: {} } as any) as any
    assert.equal(principalInbox.manualReviewScope, 'college')
    assert.equal(principalInbox.manualReview, null, 'a faculty self review is not visible as the college review')
    await work(reviewKey('self', 'faculty-uid'))
    assert.deepEqual(((await api.getMyAcademicRiskAlerts.run({ auth: { uid: 'faculty-uid', token: {} }, data: {} } as any)) as any).manualReview,
      { status: 'complete', processed: 1, errors: 0 })
  })
  it('a stuck review is reported as failed instead of running forever', async () => {
    account('faculty-uid', 'faculty')
    await start()
    job().startedAt = now - 25 * 60 * 60_000
    const inbox = await api.getMyAcademicRiskAlerts.run({ auth: { uid: 'faculty-uid', token: {} }, data: {} } as any) as any
    assert.equal(inbox.manualReview.status, 'failed')
  })
  it('the manual review callable validates the requester before any database write', async () => {
    await assert.rejects(api.requestAcademicRiskReview.run({ data: {} } as any), { code: 'unauthenticated' })
    assert.deepEqual(store.writes, [])
    assert.deepEqual(store.reads, [])
  })
})
