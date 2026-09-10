// functions/test/classSchedule.test.ts
// ─── Slice 2 S2.1 — pure-helper coverage for session materialisation ───────
//
// No Firestore emulator is available in this sandbox, so these tests cover the
// deterministic core: date-key maths, weekly expansion, the idempotent
// document id, the canonical session payload, and the guards that stop a bad
// request from fanning out across the collection.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MAX_BATCH_OPS,
  MAX_CANCEL_DOCS_PER_TXN,
  MAX_GENERATE_RANGE_DAYS,
  addDays,
  buildSessionDoc,
  chunk,
  coerceDayOfWeek,
  dateKeysInRange,
  daysBetween,
  durationMinutes,
  expandWeeklyRange,
  isValidDateKey,
  isSlotActive,
  matchesFilters,
  minutesOfDay,
  slotDateKey,
  toDateKey,
  todayKey,
  validateGeneratePayload,
  weekdayOf,
  type WeeklySlot,
} from '../src/classSchedule'

describe('date keys', () => {
  it('accepts well-formed calendar dates only', () => {
    assert.equal(isValidDateKey('2026-09-10'), true)
    assert.equal(isValidDateKey('2026-02-28'), true)
    assert.equal(isValidDateKey('2024-02-29'), true) // leap year
    assert.equal(isValidDateKey('2026-02-30'), false) // overflow rolls in Date
    assert.equal(isValidDateKey('2026-13-01'), false)
    assert.equal(isValidDateKey('2026-9-1'), false)
    assert.equal(isValidDateKey('10/09/2026'), false)
    assert.equal(isValidDateKey(''), false)
    assert.equal(isValidDateKey(20260910), false)
  })

  it('round-trips a UTC date key', () => {
    assert.equal(toDateKey(new Date(Date.UTC(2026, 8, 10))), '2026-09-10')
    assert.equal(toDateKey(new Date(Date.UTC(2026, 0, 1))), '2026-01-01')
  })

  it('adds days across month and year boundaries', () => {
    assert.equal(addDays('2026-09-30', 1), '2026-10-01')
    assert.equal(addDays('2026-12-31', 1), '2027-01-01')
    assert.equal(addDays('2026-03-01', -1), '2026-02-28')
    assert.equal(addDays('2026-09-10', 0), '2026-09-10')
  })

  it('names the weekday in UTC terms', () => {
    // 2026-09-10 is a Thursday.
    assert.equal(weekdayOf('2026-09-10'), 'thursday')
    assert.equal(weekdayOf('2026-09-13'), 'sunday')
    assert.equal(weekdayOf('2026-09-14'), 'monday')
  })

  it('produces today as a yyyy-mm-dd key', () => {
    assert.match(todayKey(new Date(Date.UTC(2026, 8, 10, 23, 59))), /^2026-09-10$/)
  })
})

describe('dateKeysInRange', () => {
  it('is inclusive of both bounds and ascending', () => {
    const keys = dateKeysInRange('2026-09-07', '2026-09-10')
    assert.deepEqual(keys, ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10'])
  })

  it('returns a single day when from equals to', () => {
    assert.deepEqual(dateKeysInRange('2026-09-10', '2026-09-10'), ['2026-09-10'])
  })

  it('rejects a reversed range', () => {
    assert.throws(() => dateKeysInRange('2026-09-10', '2026-09-07'), /on or before/)
  })

  it('rejects a span longer than one term', () => {
    assert.throws(
      () => dateKeysInRange('2026-01-01', '2026-12-31'),
      new RegExp(`maximum is ${MAX_GENERATE_RANGE_DAYS}`)
    )
    // The boundary itself is allowed.
    assert.equal(dateKeysInRange('2026-01-01', '2026-04-02').length, MAX_GENERATE_RANGE_DAYS)
  })

  it('rejects malformed bounds before doing any maths', () => {
    assert.throws(() => dateKeysInRange('tomorrow', '2026-09-10'), /yyyy-mm-dd/)
  })
})

describe('daysBetween', () => {
  it('counts inclusively-sized gaps', () => {
    assert.equal(daysBetween('2026-09-10', '2026-09-10'), 0)
    assert.equal(daysBetween('2026-09-01', '2026-09-30'), 29)
    assert.equal(daysBetween('2026-09-30', '2026-09-01'), -29)
  })
})

describe('coerceDayOfWeek', () => {
  it('normalises the spellings stored in weeklySchedules', () => {
    assert.equal(coerceDayOfWeek('monday'), 'monday')
    assert.equal(coerceDayOfWeek('Monday'), 'monday')
    assert.equal(coerceDayOfWeek('MON'), 'monday')
    assert.equal(coerceDayOfWeek('  friday  '), 'friday')
  })

  it('accepts the numeric weekday (0=Sunday)', () => {
    assert.equal(coerceDayOfWeek(0), 'sunday')
    assert.equal(coerceDayOfWeek(1), 'monday')
    assert.equal(coerceDayOfWeek(6), 'saturday')
  })

  it('returns null for junk rather than throwing', () => {
    assert.equal(coerceDayOfWeek('funday'), null)
    assert.equal(coerceDayOfWeek(''), null)
    assert.equal(coerceDayOfWeek(9), null)
    assert.equal(coerceDayOfWeek(undefined), null)
  })
})

describe('expandWeeklyRange', () => {
  it('picks only the slot’s weekday, in order', () => {
    // September 2026: Mondays are the 7th, 14th, 21st, 28th.
    assert.deepEqual(expandWeeklyRange('2026-09-01', '2026-09-30', 'monday'), [
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
    ])
  })

  it('handles a Sunday slot', () => {
    assert.deepEqual(expandWeeklyRange('2026-09-01', '2026-09-30', 'sunday'), [
      '2026-09-06',
      '2026-09-13',
      '2026-09-20',
      '2026-09-27',
    ])
  })

  it('returns nothing for a day that never falls in the range', () => {
    assert.deepEqual(expandWeeklyRange('2026-09-07', '2026-09-07', 'tuesday'), [])
  })

  it('tolerates a malformed dayOfWeek from legacy rows', () => {
    assert.deepEqual(expandWeeklyRange('2026-09-01', '2026-09-30', 'junk'), [])
    assert.deepEqual(expandWeeklyRange('2026-09-01', '2026-09-30', null), [])
  })

  it('is stable across a DST-style boundary because all maths is UTC', () => {
    const keys = expandWeeklyRange('2026-03-01', '2026-04-30', 'monday')
    assert.ok(keys.length >= 8)
    keys.forEach((key) => assert.equal(weekdayOf(key), 'monday'))
  })

  it('throws on bad bounds (programmer error, not data error)', () => {
    assert.throws(() => expandWeeklyRange('2026-09-31', '2026-10-01', 'monday'), /yyyy-mm-dd/)
  })
})

describe('slotDateKey', () => {
  it('is deterministic — the idempotency contract', () => {
    assert.equal(slotDateKey('slot-1', '2026-09-10'), 'slot-1_2026-09-10')
    // Same inputs, same id, forever: a re-run targets the same document.
    assert.equal(slotDateKey('slot-1', '2026-09-10'), slotDateKey('slot-1', '2026-09-10'))
  })

  it('separates slots and dates', () => {
    assert.notEqual(slotDateKey('slot-1', '2026-09-10'), slotDateKey('slot-2', '2026-09-10'))
    assert.notEqual(slotDateKey('slot-1', '2026-09-10'), slotDateKey('slot-1', '2026-09-17'))
  })

  it('rejects an id that could escape its collection path', () => {
    assert.throws(() => slotDateKey('a/b', '2026-09-10'), /may not contain/)
    assert.throws(() => slotDateKey('', '2026-09-10'), /required/)
    assert.throws(() => slotDateKey('slot-1', '10-09-2026'), /yyyy-mm-dd/)
  })
})

describe('time helpers', () => {
  it('parses HH:mm into minutes', () => {
    assert.equal(minutesOfDay('09:00'), 540)
    assert.equal(minutesOfDay('00:00'), 0)
    assert.equal(minutesOfDay('23:59'), 1439)
    assert.equal(minutesOfDay('9:05'), 545)
    assert.equal(minutesOfDay('25:00'), null)
    assert.equal(minutesOfDay('09:60'), null)
    assert.equal(minutesOfDay('nine'), null)
  })

  it('computes contact minutes and rejects inverted ranges', () => {
    assert.equal(durationMinutes('09:00', '10:00'), 60)
    assert.equal(durationMinutes('14:30', '16:00'), 90)
    assert.equal(durationMinutes('10:00', '09:00'), null)
    assert.equal(durationMinutes('09:00', '09:00'), null)
    assert.equal(durationMinutes('', ''), null)
  })
})

const SLOT: WeeklySlot = {
  id: 'weekly-abc',
  collegeId: 'college-1',
  subject: 'Data Structures',
  subjectCode: 'BCA301',
  facultyId: 'faculty-9',
  facultyName: 'Asha Rao',
  facultyInitials: 'AR',
  branch: 'BCA',
  batch: '2026',
  semester: 3,
  division: 'A',
  section: '1',
  room: 'LH-201',
  dayOfWeek: 'monday',
  startTime: '09:00',
  endTime: '10:00',
  type: 'lecture',
  isActive: true,
}

describe('buildSessionDoc', () => {
  const doc = buildSessionDoc(SLOT, '2026-09-14', new Date(Date.UTC(2026, 8, 1)))

  it('carries the plan→actual link back to the weekly slot', () => {
    assert.equal(doc.weeklyScheduleId, 'weekly-abc')
    assert.equal(doc.collegeId, 'college-1')
  })

  it('normalises the date, day and duration', () => {
    assert.equal(doc.date, '2026-09-14')
    assert.equal(doc.dayOfWeek, 'monday')
    assert.equal(doc.startTime, '09:00')
    assert.equal(doc.endTime, '10:00')
    assert.equal(doc.durationMinutes, 60)
  })

  it('starts scheduled and unmarked', () => {
    assert.equal(doc.status, 'scheduled')
    assert.deepEqual(doc.topicIds, [])
    assert.deepEqual(doc.topicsCovered, [])
    assert.equal(doc.attendanceCount, 0)
    assert.equal(doc.presentCount, 0)
    assert.equal(doc.source, 'weekly-schedule')
  })

  it('keeps the legacy fields the existing readers depend on', () => {
    // scheduleApi.docToSchedule and the topicsCovered||topicsPlanned fallback
    // at scheduleApi.ts:84 must keep finding what they look for.
    assert.equal(doc.subject, 'Data Structures')
    assert.equal(doc.subjectCode, 'BCA301')
    assert.equal(doc.facultyId, 'faculty-9')
    assert.equal(doc.branch, 'BCA')
    assert.equal(doc.batch, '2026')
    assert.equal(doc.semester, 3)
    assert.equal(doc.room, 'LH-201')
    assert.equal(doc.type, 'lecture')
    assert.equal(typeof doc.createdAt, 'string')
    assert.equal(doc.createdAt, doc.updatedAt)
  })

  it('survives a sparse legacy slot without emitting undefined', () => {
    const sparse = buildSessionDoc({ id: 'slot-x', dayOfWeek: 'friday' }, '2026-09-11')
    assert.equal(sparse.subject, '')
    assert.equal(sparse.facultyId, '')
    assert.equal(sparse.semester, 0)
    assert.equal(sparse.type, 'lecture')
    assert.equal(sparse.dayOfWeek, 'friday')
    assert.equal(sparse.durationMinutes, 60) // falls back when times are absent
  })

  it('rejects a non-date', () => {
    assert.throws(() => buildSessionDoc(SLOT, '14-09-2026'), /yyyy-mm-dd/)
  })
})

describe('slot selection', () => {
  const filters = {
    collegeId: 'college-1',
    from: '2026-09-01',
    to: '2026-09-30',
    weeklyScheduleId: '',
    facultyId: '',
    branch: '',
    batch: '',
  }

  it('treats a missing isActive as active (rows predate the field)', () => {
    assert.equal(isSlotActive({ ...SLOT, isActive: undefined } as WeeklySlot), true)
    assert.equal(isSlotActive({ ...SLOT, isActive: true }), true)
    assert.equal(isSlotActive({ ...SLOT, isActive: false }), false)
  })

  it('matches on every supported filter, case-insensitively for text', () => {
    assert.equal(matchesFilters(SLOT, filters), true)
    assert.equal(matchesFilters(SLOT, { ...filters, weeklyScheduleId: 'weekly-abc' }), true)
    assert.equal(matchesFilters(SLOT, { ...filters, weeklyScheduleId: 'other' }), false)
    assert.equal(matchesFilters(SLOT, { ...filters, facultyId: 'faculty-9' }), true)
    assert.equal(matchesFilters(SLOT, { ...filters, facultyId: 'faculty-8' }), false)
    assert.equal(matchesFilters(SLOT, { ...filters, branch: 'bca' }), true)
    assert.equal(matchesFilters(SLOT, { ...filters, branch: 'BSc' }), false)
    assert.equal(matchesFilters(SLOT, { ...filters, batch: '2026' }), true)
    assert.equal(matchesFilters(SLOT, { ...filters, batch: '2025' }), false)
  })
})

describe('validateGeneratePayload', () => {
  it('accepts a normal term request', () => {
    const payload = validateGeneratePayload({ from: '2026-09-01', to: '2026-11-30' }, 'admin', 'college-1')
    assert.equal(payload.collegeId, 'college-1')
    assert.equal(payload.from, '2026-09-01')
    assert.equal(payload.to, '2026-11-30')
    assert.equal(payload.facultyId, '')
  })

  it('pins non-superadmins to the auth claim even if they ask for another college', () => {
    const payload = validateGeneratePayload(
      { from: '2026-09-01', to: '2026-09-30', collegeId: 'someone-elses-college' },
      'admin',
      'college-1'
    )
    assert.equal(payload.collegeId, 'college-1')
  })

  it('lets a superadmin target a college explicitly', () => {
    const payload = validateGeneratePayload(
      { from: '2026-09-01', to: '2026-09-30', collegeId: 'college-2' },
      'superadmin',
      ''
    )
    assert.equal(payload.collegeId, 'college-2')
  })

  it('refuses to invent a tenant for a claim-less admin', () => {
    assert.throws(
      () => validateGeneratePayload({ from: '2026-09-01', to: '2026-09-30' }, 'admin', ''),
      /No college/
    )
  })

  it('rejects bad dates, reversed ranges and over-long spans', () => {
    assert.throws(() => validateGeneratePayload({ from: 'x', to: '2026-09-30' }, 'admin', 'c'), /yyyy-mm-dd/)
    assert.throws(() => validateGeneratePayload({ from: '2026-09-30', to: '2026-09-01' }, 'admin', 'c'), /on or before/)
    assert.throws(
      () => validateGeneratePayload({ from: '2026-01-01', to: '2026-12-31' }, 'admin', 'c'),
      /longer than/
    )
  })

  it('trims and bounds the optional filters', () => {
    const payload = validateGeneratePayload(
      { from: '2026-09-01', to: '2026-09-30', branch: '  BCA  ', batch: '2026', facultyId: '  f1 ' },
      'admin',
      'c'
    )
    assert.equal(payload.branch, 'BCA')
    assert.equal(payload.facultyId, 'f1')
    assert.throws(
      () => validateGeneratePayload({ from: '2026-09-01', to: '2026-09-30', branch: 'x'.repeat(500) }, 'admin', 'c'),
      /branch is invalid/
    )
  })
})

describe('chunk', () => {
  it('splits work into Firestore-safe groups', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
    assert.deepEqual(chunk([], 10), [])
    assert.deepEqual(chunk([1, 2, 3], 10), [[1, 2, 3]])
    assert.throws(() => chunk([1], 0), /positive integer/)
  })

  it('cancels in groups small enough for a transaction to carry reads + writes', () => {
    // A transaction is charged for reads as well as writes, so the per-chunk
    // document count has to be far below the 500-op ceiling.
    assert.ok(MAX_CANCEL_DOCS_PER_TXN * 2 + 2 <= 500)
    assert.ok(MAX_BATCH_OPS <= 500)
  })
})

describe('materialisation idempotency (end-to-end on the pure core)', () => {
  it('produces one document id per slot-day and the same set on a re-run', () => {
    const slot: WeeklySlot = { ...SLOT, id: 'weekly-1', dayOfWeek: 'monday' }
    const runOnce = () =>
      expandWeeklyRange('2026-09-01', '2026-09-30', slot.dayOfWeek).map((date) =>
        slotDateKey(slot.id, date)
      )

    const first = runOnce()
    const second = runOnce()
    assert.deepEqual(first, [
      'weekly-1_2026-09-07',
      'weekly-1_2026-09-14',
      'weekly-1_2026-09-21',
      'weekly-1_2026-09-28',
    ])
    // Re-running adds zero new documents: every id is already present.
    assert.deepEqual(second.filter((id) => !first.includes(id)), [])
    assert.equal(new Set([...first, ...second]).size, first.length)
  })

  it('keeps two slots on the same day distinct', () => {
    const ids = ['weekly-1', 'weekly-2'].flatMap((id) =>
      expandWeeklyRange('2026-09-07', '2026-09-07', 'monday').map((date) => slotDateKey(id, date))
    )
    assert.equal(new Set(ids).size, 2)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// S2.2 — one session identity, one writer
// ═══════════════════════════════════════════════════════════════════════════

import {
  adhocSessionId,
  buildAdhocSessionDoc,
  ensureSessionId,
  normalizeSessionDate,
  shortHash,
  slugify,
  subjectKey,
  validateEnsureInput,
} from '../src/classSchedule'

describe('normalizeSessionDate', () => {
  it('passes a canonical date key straight through', () => {
    assert.equal(normalizeSessionDate('2026-09-10'), '2026-09-10')
  })

  it('reduces an ISO datetime to its date', () => {
    // scheduleApi.createSchedule wrote these before S2.2.
    assert.equal(normalizeSessionDate('2026-09-10T09:00:00.000Z'), '2026-09-10')
    assert.equal(normalizeSessionDate('2026-09-10T00:00:00Z'), '2026-09-10')
  })

  it('reduces a Firestore Timestamp to its date', () => {
    // attendanceApi.createClassSession wrote these.
    const timestamp = { toDate: () => new Date(Date.UTC(2026, 8, 10, 4, 30)) }
    assert.equal(normalizeSessionDate(timestamp), '2026-09-10')
  })

  it('reduces a raw Timestamp JSON shape', () => {
    const seconds = Math.floor(Date.UTC(2026, 8, 10, 12, 0) / 1000)
    assert.equal(normalizeSessionDate({ seconds }), '2026-09-10')
    assert.equal(normalizeSessionDate({ _seconds: seconds }), '2026-09-10')
  })

  it('reduces a JS Date', () => {
    assert.equal(normalizeSessionDate(new Date(Date.UTC(2026, 8, 10))), '2026-09-10')
  })

  it('returns empty rather than inventing a date', () => {
    assert.equal(normalizeSessionDate(''), '')
    assert.equal(normalizeSessionDate(null), '')
    assert.equal(normalizeSessionDate(undefined), '')
    assert.equal(normalizeSessionDate('tomorrow'), '')
    assert.equal(normalizeSessionDate('10/09/2026'), '')
    assert.equal(normalizeSessionDate(new Date('nonsense')), '')
  })
})

describe('slugify / shortHash', () => {
  it('makes free text safe for a document id', () => {
    assert.equal(slugify('Data Structures'), 'data-structures')
    assert.equal(slugify('BCA/301'), 'bca-301')
    assert.equal(slugify('  R&D (Lab) '), 'r-d-lab')
    assert.equal(slugify(''), '')
    assert.equal(slugify('x'.repeat(80), 10).length, 10)
  })

  it('hashes deterministically and separates similar inputs', () => {
    assert.equal(shortHash('a'), shortHash('a'))
    assert.match(shortHash('a'), /^[0-9a-f]{8}$/)
    assert.notEqual(shortHash('a'), shortHash('b'))
    // Not a prefix/rotation hash: small changes change everything.
    assert.notEqual(shortHash('BCA301'), shortHash('BCA302'))
  })
})

describe('adhocSessionId', () => {
  const base = {
    facultyId: 'faculty-9',
    date: '2026-09-14',
    startTime: '09:00',
    subject: 'Data Structures',
    subjectCode: 'BCA301',
    branch: 'BCA',
    batch: '2026',
    division: 'A',
  }

  it('is deterministic — the get-or-create contract', () => {
    assert.equal(adhocSessionId(base), adhocSessionId(base))
  })

  it('separates two different classes on the same day', () => {
    assert.notEqual(adhocSessionId(base), adhocSessionId({ ...base, startTime: '11:00' }))
    assert.notEqual(adhocSessionId(base), adhocSessionId({ ...base, subjectCode: 'BCA302' }))
    assert.notEqual(adhocSessionId(base), adhocSessionId({ ...base, division: 'B' }))
    assert.notEqual(adhocSessionId(base), adhocSessionId({ ...base, facultyId: 'faculty-8' }))
  })

  it('produces a Firestore-safe id', () => {
    const id = adhocSessionId(base)
    assert.match(id, /^adhoc_[a-z0-9-]+_\d{4}-\d{2}-\d{2}_[a-z0-9-]+_[a-z0-9-]+_[0-9a-f]{8}$/)
    assert.ok(!id.includes('/'))
    assert.ok(!id.includes('..'))
  })

  it('still works with only the minimum a session needs', () => {
    const id = adhocSessionId({ facultyId: 'f1', date: '2026-09-14' })
    assert.match(id, /^adhoc_f1_2026-09-14_na_class_[0-9a-f]{8}$/)
  })

  it('refuses to build an id without an owner or a valid date', () => {
    assert.throws(() => adhocSessionId({ facultyId: '', date: '2026-09-14' }), /facultyId is required/)
    assert.throws(() => adhocSessionId({ facultyId: 'f1', date: '14-09-2026' }), /yyyy-mm-dd/)
  })
})

describe('ensureSessionId', () => {
  it('prefers the recurring slot when there is one', () => {
    assert.equal(
      ensureSessionId({ weeklyScheduleId: 'weekly-1', facultyId: 'f1', date: '2026-09-14' }),
      'weekly-1_2026-09-14'
    )
  })

  it('falls back to the ad-hoc hash when there is not', () => {
    assert.match(
      ensureSessionId({ facultyId: 'f1', date: '2026-09-14', startTime: '09:00' }),
      /^adhoc_f1_2026-09-14_/
    )
  })

  it('agrees with slotDateKey for recurring slots', () => {
    assert.equal(
      ensureSessionId({ weeklyScheduleId: 'weekly-9', date: '2026-10-05' }),
      slotDateKey('weekly-9', '2026-10-05')
    )
  })
})

describe('subjectKey', () => {
  it('prefers the code and falls back to the name', () => {
    assert.equal(subjectKey('Data Structures', 'BCA301'), 'bca301')
    assert.equal(subjectKey('Data Structures', ''), 'data-structures')
    assert.equal(subjectKey('', ''), '')
  })
})

describe('buildAdhocSessionDoc', () => {
  const input = {
    collegeId: '',
    date: '2026-09-14',
    weeklyScheduleId: '',
    facultyId: 'faculty-9',
    facultyName: 'Asha Rao',
    subject: 'Data Structures',
    subjectCode: 'BCA301',
    branch: 'BCA',
    batch: '2026',
    semester: 3,
    division: 'A',
    section: '1',
    room: 'LH-201',
    startTime: '09:00',
    endTime: '10:00',
    type: 'lecture',
    topic: 'Stacks',
  }

  it('matches the canonical shape a materialised session gets', () => {
    const doc = buildAdhocSessionDoc(input, 'college-1', 'uid-1', new Date(Date.UTC(2026, 8, 1)))
    assert.equal(doc.date, '2026-09-14')
    assert.equal(doc.dayOfWeek, 'monday')
    assert.equal(doc.status, 'scheduled')
    assert.equal(doc.durationMinutes, 60)
    assert.deepEqual(doc.topicIds, [])
    assert.equal(doc.attendanceCount, 0)
    assert.equal(doc.presentCount, 0)
    assert.equal(doc.collegeId, 'college-1')
    assert.equal(doc.createdBy, 'uid-1')
  })

  it('records that it has no recurring parent', () => {
    const doc = buildAdhocSessionDoc(input, 'college-1', 'uid-1')
    assert.equal(doc.source, 'adhoc')
    assert.equal('weeklyScheduleId' in doc, false)
    assert.equal(doc.subjectKey, 'bca301')
  })

  it('keeps the free-text topic the legacy readers look for', () => {
    // scheduleApi.ts:84 falls back to topicsCovered || topicsPlanned.
    const withTopic = buildAdhocSessionDoc(input, 'college-1', 'uid-1')
    assert.deepEqual(withTopic.topicsCovered, ['Stacks'])
    const withoutTopic = buildAdhocSessionDoc({ ...input, topic: '' }, 'college-1', 'uid-1')
    assert.deepEqual(withoutTopic.topicsCovered, [])
  })
})

describe('validateEnsureInput', () => {
  it('accepts a minimal request', () => {
    const parsed = validateEnsureInput({ date: '2026-09-14', facultyId: 'f1' })
    assert.equal(parsed.date, '2026-09-14')
    assert.equal(parsed.facultyId, 'f1')
    assert.equal(parsed.type, 'lecture')
    assert.equal(parsed.semester, 0)
  })

  it('normalises an ISO datetime date', () => {
    assert.equal(validateEnsureInput({ date: '2026-09-14T09:00:00.000Z' }).date, '2026-09-14')
  })

  it('rejects a request with no usable date', () => {
    assert.throws(() => validateEnsureInput({ date: 'tomorrow' }), /date is required/)
    assert.throws(() => validateEnsureInput({}), /date is required/)
  })

  it('bounds free-text fields instead of storing whatever it is given', () => {
    assert.equal(validateEnsureInput({ date: '2026-09-14', subject: '  Stacks  ' }).subject, 'Stacks')
    assert.throws(
      () => validateEnsureInput({ date: '2026-09-14', subject: 'x'.repeat(500) }),
      /subject is invalid/
    )
  })
})
