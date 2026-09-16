// functions/test/studyMaterials.test.ts
//
// Run with: npm --prefix functions run test:unit
//
// Pins the serve-decision table of the versioned study-material cache and
// the cost-safety decision tables that gate every paid generation. The
// governance contract these tests protect:
//   1. A campus's own pin ALWAYS wins over the global latest — a refresh by
//      another college can never change what our students see mid-study.
//   2. An un-pinned campus follows the global latest and should be pinned to
//      it on that first serve (pin-on-first-serve).
//   3. Pre-versioning documents (legacy top-level studyPack, latestVersion
//      absent) yield no target: the route must migrate them to v0001 first.
//   4. Version numbering is 1-based and strictly increasing.
//   5. One in-flight lease holder per cold key; followers wait (guard 3).
//   6. Per-student and per-campus daily caps bind exactly as designed
//      (staff exempt from the per-account cap, nobody exempt from the
//      campus breaker; limit 0 disables a tier) (guard 4).
//   7. Exam freeze windows behave [start, end) and malformed windows never
//      freeze a campus by accident (guard 5).

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideGenerationLock,
  decideStudyServeTarget,
  evaluateDailyLimits,
  isFrozenNow,
  nextStudyVersion,
  studyVersionDocId,
} from '../src/routes/ai-chat.ts'

describe('nextStudyVersion', () => {
  it('starts numbering at 1 for a brand-new key', () => {
    assert.equal(nextStudyVersion(undefined), 1)
    assert.equal(nextStudyVersion(null), 1)
    assert.equal(nextStudyVersion(0), 1)
  })

  it('increments from the current latest', () => {
    assert.equal(nextStudyVersion(1), 2)
    assert.equal(nextStudyVersion(41), 42)
  })

  it('tolerates numeric strings from documents', () => {
    assert.equal(nextStudyVersion('3'), 4)
  })
})

describe('studyVersionDocId', () => {
  it('zero-pads for lexicographic ordering', () => {
    assert.equal(studyVersionDocId(1), 'v0001')
    assert.equal(studyVersionDocId(42), 'v0042')
    assert.equal(studyVersionDocId(1234), 'v1234')
  })
})

describe('decideStudyServeTarget', () => {
  it('a campus pin wins over the global latest (learning continuity)', () => {
    // College pinned to v1 while another college refreshed and created v3:
    // the pinned campus stays at v1 and no re-pin is requested.
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 3 }, 1),
      { version: 1, pinTo: null },
    )
  })

  it('an un-pinned campus follows the latest and gets pinned to it on that serve', () => {
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 3 }, undefined),
      { version: 3, pinTo: 3 },
    )
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 3 }, null),
      { version: 3, pinTo: 3 },
    )
  })

  it('ignores malformed pin values and falls back to latest', () => {
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 2 }, 'not-a-number'),
      { version: 2, pinTo: 2 },
    )
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 2 }, 0),
      { version: 2, pinTo: 2 },
    )
  })

  it('returns null for pre-versioning documents so the route migrates them first', () => {
    assert.equal(decideStudyServeTarget({}, undefined), null)
    assert.equal(decideStudyServeTarget(null, undefined), null)
    assert.equal(decideStudyServeTarget(undefined, undefined), null)
  })

  it('a pin referencing a pre-versioning sentinel is not served blindly', () => {
    // Pin 0 meant "legacy top-level" in an early draft of the model; legacy
    // packs now migrate to v0001, so pin 0 falls through to the latest.
    assert.deepEqual(
      decideStudyServeTarget({ latestVersion: 5 }, 0),
      { version: 5, pinTo: 5 },
    )
  })
})

// ─── Cost-safety decision tables (route guards 3–5) ──────────────────────
//  3. The in-flight lease makes exactly ONE caller pay for a cold key —
//     everyone else waits and rides the shared result (no stampede).
//  4. The campus circuit breaker binds everyone including staff; the
//     per-account cap binds only students/parents; limit 0 disables a tier.
//  5. Freeze windows are [start, end); malformed windows can never
//     accidentally freeze a campus.

describe('decideGenerationLock', () => {
  const LEASE = 2 * 60 * 1000
  const NOW = Date.parse('2026-09-16T10:00:00Z')

  it('claims when there is no lock at all', () => {
    assert.deepEqual(decideGenerationLock(null, NOW, LEASE), { action: 'claim' })
    assert.deepEqual(decideGenerationLock({}, NOW, LEASE), { action: 'claim' })
    assert.deepEqual(decideGenerationLock(undefined, NOW, LEASE), { action: 'claim' })
  })

  it('waits when a fresh lease is held (one payer per cold key)', () => {
    const summary = { generating: { startedAt: '2026-09-16T09:59:30Z', byUid: 'u1' } }
    const d = decideGenerationLock(summary, NOW, LEASE)
    assert.equal(d.action, 'wait')
    if (d.action === 'wait') assert.ok(d.retryAfterMs > 0 && d.retryAfterMs <= LEASE)
  })

  it('takes over a stale lease (crashed generator must not wedge a key)', () => {
    const summary = { generating: { startedAt: '2026-09-16T09:50:00Z', byUid: 'u1' } }
    assert.deepEqual(decideGenerationLock(summary, NOW, LEASE), { action: 'claim' })
  })

  it('takes over a malformed lease (defensive: never trust stored data)', () => {
    assert.deepEqual(decideGenerationLock({ generating: { startedAt: 'garbage' } }, NOW, LEASE), { action: 'claim' })
    assert.deepEqual(decideGenerationLock({ generating: 'yes' }, NOW, LEASE), { action: 'claim' })
    assert.deepEqual(decideGenerationLock({ generating: {} }, NOW, LEASE), { action: 'claim' })
  })
})

describe('evaluateDailyLimits', () => {
  const base = {
    studentGenerationsToday: 0,
    collegeGenerationsToday: 0,
    studentDailyLimit: 5,
    collegeDailyLimit: 400,
  }

  it('allows a student under both caps', () => {
    assert.deepEqual(evaluateDailyLimits({ ...base, isStaff: false, studentGenerationsToday: 4 }), { allowed: true })
  })

  it('rejects a student at their per-account cap even when the campus has budget', () => {
    assert.deepEqual(
      evaluateDailyLimits({ ...base, isStaff: false, studentGenerationsToday: 5 }),
      { allowed: false, scope: 'student' },
    )
  })

  it('staff bypass the per-account cap but never the campus breaker', () => {
    assert.deepEqual(evaluateDailyLimits({ ...base, isStaff: true, studentGenerationsToday: 999 }), { allowed: true })
    assert.deepEqual(
      evaluateDailyLimits({ ...base, isStaff: true, collegeGenerationsToday: 400 }),
      { allowed: false, scope: 'college' },
    )
  })

  it('the campus breaker binds students too', () => {
    assert.deepEqual(
      evaluateDailyLimits({ ...base, isStaff: false, collegeGenerationsToday: 401 }),
      { allowed: false, scope: 'college' },
    )
  })

  it('limit 0 disables that tier (documented escape hatch)', () => {
    assert.deepEqual(
      evaluateDailyLimits({ ...base, isStaff: false, studentDailyLimit: 0, studentGenerationsToday: 9999 }),
      { allowed: true },
    )
    assert.deepEqual(
      evaluateDailyLimits({ ...base, isStaff: true, collegeDailyLimit: 0, collegeGenerationsToday: 9999 }),
      { allowed: true },
    )
  })
})

describe('isFrozenNow', () => {
  const NOW = Date.parse('2026-09-16T10:00:00Z')

  it('is not frozen without windows', () => {
    assert.deepEqual(isFrozenNow(undefined, NOW), { frozen: false })
    assert.deepEqual(isFrozenNow([], NOW), { frozen: false })
    assert.deepEqual(isFrozenNow('not-an-array', NOW), { frozen: false })
  })

  it('is frozen strictly inside a window [start, end)', () => {
    const windows = [{ start: '2026-09-16T08:00:00Z', end: '2026-09-16T12:00:00Z', reason: 'Internal tests' }]
    const state = isFrozenNow(windows, NOW)
    assert.equal(state.frozen, true)
    assert.equal(state.until, '2026-09-16T12:00:00.000Z')
    assert.equal(state.reason, 'Internal tests')
  })

  it('boundary: start inclusive, end exclusive', () => {
    const windows = [{ start: '2026-09-16T08:00:00Z', end: '2026-09-16T12:00:00Z' }]
    assert.equal(isFrozenNow(windows, Date.parse('2026-09-16T08:00:00Z')).frozen, true)
    assert.equal(isFrozenNow(windows, Date.parse('2026-09-16T12:00:00Z')).frozen, false)
    assert.equal(isFrozenNow(windows, Date.parse('2026-09-16T07:59:59Z')).frozen, false)
  })

  it('malformed windows are skipped, not freezing anyone by accident', () => {
    assert.equal(isFrozenNow([{ start: 'x', end: 'y' }], NOW).frozen, false)
    assert.equal(isFrozenNow([{ start: '2026-09-16T12:00:00Z', end: '2026-09-16T08:00:00Z' }], NOW).frozen, false)
    assert.equal(isFrozenNow([{}], NOW).frozen, false)
  })

  it('a later valid window applies even alongside junk entries', () => {
    const windows = [
      { start: 'x', end: 'y' },
      { start: '2026-09-16T09:00:00Z', end: '2026-09-16T11:00:00Z' },
    ]
    assert.equal(isFrozenNow(windows, NOW).frozen, true)
  })
})
