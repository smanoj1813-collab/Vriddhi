import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canReuseAssessmentReport, loadEndedTestPages, memoizeRunLoad } from '../src/assessmentMaintenance'
import { createReadThroughCache } from '../src/readThroughCache'
import { shouldWritePlatformStats, STATS_HEARTBEAT_MS } from '../src/platformStatsGuard'
import { riskReviewPeriod, riskReviewPolicy } from '../src/riskCadence'
import { attendanceSummaryAffected } from '../src/attendanceSummary'

describe('cost guards without lost freshness', () => {
  it('coalesces per-test loads, keeping tests separate', async () => {
    let calls = 0; const load = memoizeRunLoad(async id => { calls++; return { id } })
    const [a, b, c] = await Promise.all([load('a'), load('a'), load('b')])
    assert.equal(calls, 2); assert.equal(a, b); assert.notEqual(a, c)
  })
  it('does not poison a test question cache after a failed read', async () => {
    let calls = 0; const load = memoizeRunLoad(async () => { if (++calls === 1) throw new Error('offline'); return 7 })
    await assert.rejects(load('a')); assert.equal(await load('a'), 7)
  })
  it('only reuses matching, finite and recent report revisions', () => {
    const now = 100_000_000
    assert.equal(canReuseAssessmentReport({ knownRevision: 'a', loadedAt: now - 1000 }, 'a', now), true)
    for (const request of [{}, { knownRevision: 'b', loadedAt: now }, { knownRevision: 'a', loadedAt: now + 1 }, { knownRevision: 'a', loadedAt: now - 300_000 }, { knownRevision: 'a', loadedAt: 'invalid' }]) {
      assert.equal(canReuseAssessmentReport(request, 'a', now), false)
    }
    assert.equal(canReuseAssessmentReport({ knownRevision: '', loadedAt: now }, '', now), false)
  })
  it('query rollout fallback is bounded to each status and genuine outages surface', async () => {
    let fallbacks = 0
    const result = await loadEndedTestPages(async () => { throw Object.assign(new Error('index'), { code: 9 }) }, async status => { fallbacks++; return [status] }, () => {})
    assert.deepEqual(result, ['published', 'ongoing']); assert.equal(fallbacks, 2)
    await assert.rejects(loadEndedTestPages(async () => { throw Object.assign(new Error('network'), { code: 14 }) }, async () => assert.fail('must not hide outages'), () => {}))
  })
  it('keeps unchanged stats fresh with a heartbeat, but writes meaningful changes immediately', () => {
    const now = Date.now(), previous = { total: 5, top: [{ id: 'a', count: 2 }], updatedAt: new Date(now - 1000).toISOString() }
    assert.equal(shouldWritePlatformStats(previous, { ...previous, updatedAt: new Date(now).toISOString() }, now), false)
    assert.equal(shouldWritePlatformStats(previous, { ...previous, total: 6 }, now), true)
    assert.equal(shouldWritePlatformStats(previous, { ...previous, top: [{ count: 2, id: 'a' }] }, now), false)
    assert.equal(shouldWritePlatformStats(previous, previous, now + STATS_HEARTBEAT_MS), true)
    assert.equal(shouldWritePlatformStats(undefined, previous, now), true)
    assert.equal(shouldWritePlatformStats({ ...previous, updatedAt: 'broken' }, previous, now), true)
    assert.ok(STATS_HEARTBEAT_MS < 60 * 60_000)
  })
  it('ignores only attendance fields absent from every summary projection', () => {
    const before = { studentId: 's', collegeId: 'c', subject: 'Math', status: 'present', date: '2026-11-13', markedAt: 'morning', note: '' }
    assert.equal(attendanceSummaryAffected(before, { ...before, updatedAt: 'later', studentName: 'Corrected name' } as any), false)
    for (const change of [{ note: 'Excused' }, { date: '2026-11-14' }, { status: 'absent' }, { markedAt: 'afternoon' }, { collegeId: 'other' }, { studentId: 'other' }, { subjectCode: 'new-code' }]) assert.equal(attendanceSummaryAffected(before, { ...before, ...change }), true)
    assert.equal(attendanceSummaryAffected(null, before), true); assert.equal(attendanceSummaryAffected(before, null), true)
  })
})

describe('bounded tenant read-through cache', () => {
  it('shares a simultaneous load but never shares tenants or expired values', async () => {
    let now = 0, calls = 0
    const cache = createReadThroughCache(90, 2, () => now)
    const load = async () => ++calls
    assert.deepEqual(await Promise.all([cache.get('a', load), cache.get('a', load)]), [1, 1])
    assert.equal(await cache.get('b', load), 2)
    assert.equal(await cache.get('a', load), 1)
    now = 91; assert.equal(await cache.get('a', load), 3)
  })
  it('honors manual fresh reads, retries failures and bounds retained colleges', async () => {
    const cache = createReadThroughCache(90, 1, () => 0); let calls = 0
    const load = async () => ++calls
    assert.equal(await cache.get('a', load), 1)
    assert.equal(await cache.get('a', load, true), 2)
    assert.equal(await cache.get('b', load), 3)
    assert.equal(await cache.get('a', load), 4)
    await assert.rejects(cache.get('bad', async () => { throw new Error('offline') }))
    assert.equal(await cache.get('bad', load), 5)
  })
  it('never serves stale evidence after refresh failure', async () => {
    let now = 0; const cache = createReadThroughCache(90, 1, () => now)
    await cache.get('a', async () => 'old'); now = 91
    await assert.rejects(cache.get('a', async () => { throw new Error('outage') }))
    assert.equal(await cache.get('a', async () => 'new'), 'new')
  })
})

describe('operator-managed review cadence', () => {
  it('defaults to daily reviews for the 48-hour warning window, not a monthly restriction', () => {
    assert.deepEqual(riskReviewPolicy(''), { cadence: 'daily', schedule: '0 3 * * *' })
    assert.equal(riskReviewPolicy('weekly').schedule, '0 3 * * 1')
    assert.equal(riskReviewPolicy('daily').schedule, '0 3 * * *')
    assert.equal(riskReviewPolicy('monthly').schedule, '0 3 1 * *')
    assert.throws(() => riskReviewPolicy('every minute'), /must be/)
  })
  it('anchors weekly periods to Monday IST across UTC/year boundaries', () => {
    assert.equal(riskReviewPeriod(Date.parse('2026-11-15T18:29:59Z'), 'weekly'), '2026-11-09')
    assert.equal(riskReviewPeriod(Date.parse('2026-11-15T18:30:00Z'), 'weekly'), '2026-11-16')
    assert.equal(riskReviewPeriod(Date.parse('2026-01-01T01:00:00Z'), 'weekly'), '2025-12-29')
    assert.equal(riskReviewPeriod(Date.parse('2026-11-30T19:00:00Z'), 'monthly'), '2026-12-01')
    assert.equal(riskReviewPeriod(Date.parse('2026-11-30T19:00:00Z'), 'daily'), '2026-12-01')
  })
})
