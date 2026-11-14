import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import admin from 'firebase-admin'
import { DEFAULT_RISK_SETTINGS } from '../src/riskCore'
import { makeRiskStore } from './helpers/riskStore'

const store = makeRiskStore()
const NOW = Date.parse('2026-11-13T13:00:00Z')
let now = NOW
const originalNow = Date.now
const descriptors = new Map(['firestore', 'auth'].map(k => [k, Object.getOwnPropertyDescriptor(admin, k)]))
let api: typeof import('../src/riskAlerts')
before(async () => {
  const original = admin.firestore
  Object.defineProperty(admin, 'firestore', { configurable: true, value: Object.assign(() => store.db, { FieldValue: original.FieldValue, Timestamp: original.Timestamp, FieldPath: original.FieldPath }) })
  Object.defineProperty(admin, 'auth', { configurable: true, value: () => store.auth })
  api = await import('../src/riskAlerts')
})
after(() => { for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(admin, key, descriptor); Date.now = originalNow })
beforeEach(() => {
  store.reset(); now = NOW; Date.now = () => now
  store.data.set('academicRiskSettings/college-a', { settings: { ...DEFAULT_RISK_SETTINGS, enabled: false }, revision: 1 })
})
const job = () => store.data.get('riskJobs/academic-sweep')!
const item = (sequence = 0, period = '2026-11') => store.data.get(`riskSweepRequests/${period}__${sequence}`)!
const start = (scheduledTime = new Date(now).toISOString()) => api.sweepAcademicRiskAlerts.run({ scheduleTime: scheduledTime } as any)
const work = (sequence = 0, period = '2026-11') => api.continueAcademicRiskSweep.run({ params: { requestId: `${period}__${sequence}` } } as any)
function account(uid: string, role = 'student') {
  store.accounts.set(uid, { uid, displayName: uid, disabled: false, customClaims: { role, collegeId: 'college-a' } })
  store.data.set(`users/${uid}`, { uid, role, collegeId: 'college-a' })
}

describe('cost-bounded monthly academic review', () => {
  it('deploys monthly IST starter and monthly push recovery, not 15-minute schedulers', () => {
    const starter = (api.sweepAcademicRiskAlerts as any).__endpoint
    const recovery = (api.retryAcademicRiskPush as any).__endpoint
    const worker = (api.continueAcademicRiskSweep as any).__endpoint
    assert.equal(starter.scheduleTrigger.schedule, '0 3 1 * *')
    assert.equal(starter.scheduleTrigger.timeZone, 'Asia/Kolkata')
    assert.equal(recovery.scheduleTrigger.schedule, '0 6 1 * *')
    assert.equal(recovery.scheduleTrigger.timeZone, 'Asia/Kolkata')
    assert.equal(worker.eventTrigger.eventFilterPathPatterns.document, 'riskSweepRequests/{requestId}')
    assert.equal(worker.concurrency, 1)
    assert.equal(worker.maxInstances, 1)
  })
  it('the starter only queues one durable cycle and does not read academic evidence', async () => {
    account('learner')
    await start()
    assert.equal(job().cadence, 'monthly')
    assert.equal(job().period, '2026-11')
    assert.equal(job().status, 'running')
    assert.equal(item().status, 'pending')
    assert.equal(store.writes.length, 2)
    assert.deepEqual(store.reads, ['riskJobs/academic-sweep'])
  })
  it('duplicate scheduler deliveries cannot queue a second in-progress review', async () => {
    await start()
    const count = store.writes.length
    await start(); await start()
    assert.equal(store.writes.length, count)
    assert.equal([...store.data.keys()].filter(p => p.startsWith('riskSweepRequests/')).length, 1)
  })
  it('a complete review cannot restart in the same month', async () => {
    account('learner')
    await start(); await work()
    assert.equal(job().status, 'complete')
    assert.equal(job().cycleComplete, true)
    assert.equal(job().processed, 1)
    const count = store.writes.length, reads = store.reads.length
    now += 15 * 60_000
    await start()
    assert.equal(store.writes.length, count)
    assert.deepEqual(store.reads.slice(reads), ['riskJobs/academic-sweep'])
  })
  it('a new month starts at the first account, not the previous rotation cursor', async () => {
    await start(); await work()
    job().cursor = 'old-cursor'
    now = Date.parse('2026-11-30T22:00:00Z') // December 1, 03:30 IST
    await start()
    assert.equal(job().period, '2026-12')
    assert.equal(job().cursor, '')
    assert.equal(job().sequence, 0)
    assert.equal(job().processed, 0)
    assert.equal(item(0, '2026-12').status, 'pending')
  })
  it('migration discards an old 15-minute sweep cursor and counters', async () => {
    store.data.set('riskJobs/academic-sweep', { cursor: 'last-month-user', processed: 995, leaseUntil: 0, cycleComplete: false })
    await start()
    assert.equal(job().cursor, '')
    assert.equal(job().discovered, 0)
    assert.equal(job().processed, 0)
    assert.equal(item().status, 'pending')
  })
  it('rollout waits for an active legacy worker lease before replacing its checkpoint', async () => {
    store.data.set('riskJobs/academic-sweep', { cursor: 'legacy-user', leaseUntil: now + 9 * 60_000 })
    await assert.rejects(start(), /Previous academic review is still running/)
    assert.equal(store.writes.length, 0)
    now += 10 * 60_000
    await start()
    assert.equal(job().cursor, '')
    assert.equal(job().period, '2026-11')
  })
  it('delayed scheduler events from another month do not resurrect a stale cycle', async () => {
    await start('2026-10-01T00:00:00Z')
    assert.equal(store.writes.length, 0)
    assert.equal(store.reads.length, 0)
  })
  it('rejects an invalid scheduler timestamp before database I/O', async () => {
    await assert.rejects(start('not-a-date'), /valid scheduler timestamp/)
    assert.equal(store.reads.length, 0)
  })
  it('uses the IST month even when the scheduler timestamp is in the prior UTC month', async () => {
    now = Date.parse('2026-11-30T19:00:00Z')
    await start()
    assert.equal(job().period, '2026-12')
  })
  it('only verified Auth student/faculty/mentor accounts are checked', async () => {
    account('learner')
    account('forged-principal', 'principal')
    store.data.get('users/forged-principal')!.role = 'faculty'
    await start(); await work()
    assert.equal(job().discovered, 2)
    assert.equal(job().processed, 1)
    assert.ok([...store.data.entries()].filter(([p]) => p.startsWith('riskSubjectRuns/')).every(([, v]) => v.subjectUid === 'learner'))
  })
  it('finishes the roster beyond 1,000 hints in a continuation this month, including orphan-heavy pages', async () => {
    for (let i = 0; i < 1001; i++) store.data.set(`users/scan-${String(i).padStart(4, '0')}`, { role: 'student', collegeId: 'college-a' })
    account('scan-1000')
    await start(); await work()
    assert.equal(job().discovered, 1000)
    assert.equal(job().processed, 0)
    assert.equal(job().cursor, 'scan-0999')
    assert.equal(job().sequence, 1)
    assert.equal(item(0).status, 'done')
    assert.equal(item(1).status, 'pending')
    await work(1)
    assert.equal(job().cycleComplete, true)
    assert.equal(job().cursor, '')
    assert.equal(job().discovered, 1001)
    assert.equal(job().processed, 1)
    assert.equal(item(1).status, 'done')
    assert.equal(item(2), undefined)
  })
  it('the time budget checkpoints a full page and immediately queues the remainder, not next month', async () => {
    for (let i = 0; i < 26; i++) store.data.set(`users/hint-${String(i).padStart(2, '0')}`, { role: 'student' })
    await start()
    store.setReadObserver(path => { if (path === 'users') now = NOW + 8 * 60_000 })
    await work()
    assert.equal(job().discovered, 25)
    assert.equal(job().cursor, 'hint-24')
    assert.equal(item(1).status, 'pending')
    store.setReadObserver()
    await work(1)
    assert.equal(job().discovered, 26)
    assert.equal(job().cycleComplete, true)
  })
  it('a worker that loses its lease cannot overwrite the replacement checkpoint or enqueue work', async () => {
    store.data.set('users/hint', { role: 'student' })
    await start()
    store.setReadObserver(path => { if (path === 'users') Object.assign(job(), { lease: 'replacement', cursor: 'replacement-cursor' }) })
    await work()
    assert.equal(job().lease, 'replacement')
    assert.equal(job().cursor, 'replacement-cursor')
    assert.equal(item().status, 'pending')
    assert.equal(item(1), undefined)
  })
  it('duplicate completed chunk deliveries are no-op reads with no source scan or writes', async () => {
    account('learner')
    await start(); await work()
    const count = store.writes.length, reads = store.reads.length
    await work()
    assert.equal(store.writes.length, count)
    assert.ok(store.reads.slice(reads).every(p => p.startsWith('riskJobs/') || p.startsWith('riskSweepRequests/')))
  })
  it('malformed, expired and excessive chunk ids cannot start database work', async () => {
    for (const id of ['../foreign', '2026-13__0', '2026-11__00', '2026-11__-1', '2026-11__200', '2026-10__0']) {
      await api.continueAcademicRiskSweep.run({ params: { requestId: id } } as any)
    }
    assert.deepEqual(store.reads, [])
    assert.deepEqual(store.writes, [])
  })
  it('does not trust mismatched request fields or a request not selected by the current job', async () => {
    await start()
    item().sequence = 1
    const count = store.writes.length
    await work()
    assert.equal(store.writes.length, count)
    assert.equal(store.reads.includes('users'), false)
  })
  it('a live lease rejects a delivery for retry instead of silently acknowledging pending work', async () => {
    await start()
    job().lease = 'previous-worker'; job().leaseUntil = now + 1000
    await assert.rejects(work(), /already leased/)
    assert.equal(item().attempts, 0)
    assert.equal(store.reads.includes('users'), false)
    now += 1001
    await work()
    assert.equal(job().cycleComplete, true)
    assert.equal(item().attempts, 1)
  })
  it('an expired lease resumes the last completed-page cursor, not already-checked users', async () => {
    account('a-already-checked'); account('z-still-pending')
    await start()
    Object.assign(job(), { cursor: 'a-already-checked', discovered: 1, processed: 1, lease: 'crashed', leaseUntil: now - 1 })
    await work()
    const subjects = [...store.data.entries()].filter(([p]) => p.startsWith('riskSubjectRuns/')).map(([, v]) => v.subjectUid)
    assert.deepEqual(subjects, ['z-still-pending'])
    assert.equal(job().discovered, 2)
    assert.equal(job().processed, 2)
  })
  it('an infrastructure failure releases the lease and can recover on the create-trigger retry', async () => {
    await start()
    store.failedCollections.add('users')
    await assert.rejects(work(), /Fixture read failure/)
    assert.equal(job().leaseUntil, 0)
    assert.equal(job().status, 'running')
    assert.equal(item().attempts, 1)
    assert.equal(item().status, 'pending')
    store.failedCollections.delete('users')
    await work()
    assert.equal(item().attempts, 2)
    assert.equal(job().status, 'complete')
  })
  it('stops a repeatedly failing chunk instead of creating unlimited retries and scans', async () => {
    await start()
    store.failedCollections.add('users')
    for (let attempt = 1; attempt <= 3; attempt++) {
      await assert.rejects(work(), /Fixture read failure/)
      assert.equal(item().attempts, attempt)
    }
    const sourceReads = store.reads.filter(p => p === 'users').length
    await work()
    assert.equal(job().status, 'failed')
    assert.equal(job().failure, 'chunk-attempt-budget')
    assert.equal(job().cycleComplete, false)
    assert.equal(item().status, 'failed')
    assert.equal(store.reads.filter(p => p === 'users').length, sourceReads)
    const count = store.writes.length
    await work(); await start()
    assert.equal(store.writes.length, count, 'same-month scheduler retries cannot reset the failure budget')
  })
  it('the monthly continuation budget fails visibly rather than silently looping or claiming completion', async () => {
    for (let i = 0; i < 1000; i++) store.data.set(`users/orphan-${String(i).padStart(4, '0')}`, { role: 'student' })
    await start()
    job().sequence = 199
    store.data.set('riskSweepRequests/2026-11__199', { period: '2026-11', sequence: 199, status: 'pending', attempts: 0 })
    await work(199)
    assert.equal(job().status, 'failed')
    assert.equal(job().failure, 'monthly-chunk-budget')
    assert.equal(job().cycleComplete, false)
    assert.equal(item(200), undefined)
  })
})
