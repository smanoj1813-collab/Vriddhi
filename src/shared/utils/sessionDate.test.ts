// src/shared/utils/sessionDate.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the client half of the S2.2 session-identity contract shared with
// functions/src/classSchedule.ts. The two implementations are separate copies
// (the functions tsconfig cannot import from src), so both are tested against
// the same cases to keep them from drifting.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isValidDateKey,
  normalizeSessionDate,
  parseSlotDateKey,
  slotDateKey,
} from './sessionDate'

describe('isValidDateKey', () => {
  it('accepts real calendar dates only', () => {
    assert.equal(isValidDateKey('2026-09-10'), true)
    assert.equal(isValidDateKey('2024-02-29'), true)
    assert.equal(isValidDateKey('2026-02-30'), false)
    assert.equal(isValidDateKey('2026-9-1'), false)
    assert.equal(isValidDateKey(''), false)
    assert.equal(isValidDateKey(null), false)
  })
})

describe('normalizeSessionDate', () => {
  it('passes a canonical date key straight through', () => {
    assert.equal(normalizeSessionDate('2026-09-10'), '2026-09-10')
  })

  it('takes the date part of an ISO datetime', () => {
    // scheduleApi.createSchedule wrote these before S2.2.
    assert.equal(normalizeSessionDate('2026-09-10T09:00:00.000Z'), '2026-09-10')
    assert.equal(normalizeSessionDate('2026-09-10T00:00:00Z'), '2026-09-10')
  })

  it('reads a Firestore Timestamp', () => {
    const timestamp = { toDate: () => new Date(Date.UTC(2026, 8, 10, 4, 30)) }
    assert.equal(normalizeSessionDate(timestamp), '2026-09-10')
  })

  it('reads a raw Timestamp JSON shape', () => {
    const seconds = Math.floor(Date.UTC(2026, 8, 10, 12, 0) / 1000)
    assert.equal(normalizeSessionDate({ seconds }), '2026-09-10')
    assert.equal(normalizeSessionDate({ _seconds: seconds }), '2026-09-10')
  })

  it('reads a JS Date', () => {
    assert.equal(normalizeSessionDate(new Date(Date.UTC(2026, 8, 10))), '2026-09-10')
  })

  it('returns empty rather than guessing', () => {
    assert.equal(normalizeSessionDate(''), '')
    assert.equal(normalizeSessionDate(null), '')
    assert.equal(normalizeSessionDate(undefined), '')
    assert.equal(normalizeSessionDate('tomorrow'), '')
    assert.equal(normalizeSessionDate('10/09/2026'), '')
    assert.equal(normalizeSessionDate(new Date('nonsense')), '')
  })
})

describe('slotDateKey', () => {
  it('matches the server contract', () => {
    assert.equal(slotDateKey('weekly-abc', '2026-09-14'), 'weekly-abc_2026-09-14')
  })

  it('rejects an id that could escape its collection path', () => {
    assert.throws(() => slotDateKey('a/b', '2026-09-14'), /may not contain/)
    assert.throws(() => slotDateKey('', '2026-09-14'), /required/)
    assert.throws(() => slotDateKey('weekly-abc', '14-09-2026'), /yyyy-mm-dd/)
  })
})

describe('parseSlotDateKey', () => {
  it('round-trips a materialised session id', () => {
    assert.deepEqual(parseSlotDateKey('weekly-abc_2026-09-14'), {
      weeklyScheduleId: 'weekly-abc',
      date: '2026-09-14',
    })
  })

  it('returns null for ad-hoc ids, which have no recurring parent', () => {
    // The ad-hoc form carries a hash and no date suffix.
    assert.equal(parseSlotDateKey('adhoc_f1_2026-09-14_0900_math_deadbeef'), null)
    assert.equal(parseSlotDateKey(''), null)
  })
})
