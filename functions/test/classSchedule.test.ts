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
  callerOwnsFacultyId,
  mergeIdentityIds,
  needsStaffProfileLookup,
  staffIdentityFromDocs,
  MAX_CANCEL_DOCS_PER_TXN,
  MAX_GENERATE_RANGE_DAYS,
  MAX_LEDGER_FACULTY_IDS,
  resolveLedgerFacultyIds,
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
  slotDateWindow,
  slotAppliesOn,
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

// ═══════════════════════════════════════════════════════════════════════════
// S2.3 — topic attachment and the coverage ledger
// ═══════════════════════════════════════════════════════════════════════════

import {
  MAX_TOPICS_PER_SESSION,
  buildLedgerRow,
  isTopicCovered,
  matchLedgerRow,
  mergeCompletionTopics,
  mergeUnique,
  nextTopicStatus,
  normalizeTopicKey,
  validateCompleteInput,
} from '../src/classSchedule'

describe('normalizeTopicKey', () => {
  it('ignores case, punctuation and spacing', () => {
    assert.equal(normalizeTopicKey('Integration by Parts'), 'integration by parts')
    assert.equal(normalizeTopicKey('  Integration   BY-parts! '), 'integration by parts')
    assert.equal(normalizeTopicKey(''), '')
    assert.equal(normalizeTopicKey(undefined), '')
  })
})

describe('isTopicCovered', () => {
  it('accepts both spellings that exist in the data', () => {
    // FacultyTopic declares 'covered'; the faculty Topics page counts
    // 'completed'. Both mean taught.
    assert.equal(isTopicCovered('covered'), true)
    assert.equal(isTopicCovered('completed'), true)
    assert.equal(isTopicCovered('COVERED'), true)
    assert.equal(isTopicCovered('pending'), false)
    assert.equal(isTopicCovered('in-progress'), false)
    assert.equal(isTopicCovered(''), false)
    assert.equal(isTopicCovered(undefined), false)
  })
})

describe('nextTopicStatus', () => {
  it('moves a pending topic forward', () => {
    assert.equal(nextTopicStatus('pending', 'completed'), 'completed')
    assert.equal(nextTopicStatus('in-progress', 'completed'), 'completed')
  })

  it('never walks a covered topic back — additive writes only', () => {
    assert.equal(nextTopicStatus('covered', 'completed'), 'covered')
    assert.equal(nextTopicStatus('completed', 'completed'), 'completed')
    // Re-completing a session must not un-teach a topic.
    assert.equal(nextTopicStatus('covered', 'pending'), 'covered')
  })
})

describe('mergeUnique', () => {
  it('unions two lists preserving order', () => {
    assert.deepEqual(mergeUnique(['a'], ['b']), ['a', 'b'])
    assert.deepEqual(mergeUnique(['a', 'b'], ['b', 'c']), ['a', 'b', 'c'])
  })

  it('de-duplicates across the two spellings of a topic', () => {
    assert.deepEqual(mergeUnique(['Stacks'], ['stacks']), ['Stacks'])
    assert.deepEqual(mergeUnique(['Integration by Parts'], ['integration by parts!']), [
      'Integration by Parts',
    ])
  })

  it('drops blanks and caps the result', () => {
    assert.deepEqual(mergeUnique(['', '  '], ['x']), ['x'])
    const many = Array.from({ length: 120 }, (_, index) => `t${index}`)
    assert.equal(mergeUnique([], many, MAX_TOPICS_PER_SESSION).length, MAX_TOPICS_PER_SESSION)
  })

  it('tolerates junk input instead of throwing', () => {
    assert.deepEqual(mergeUnique(undefined, null), [])
    assert.deepEqual(mergeUnique('not-a-list', ['a']), ['a'])
  })
})

describe('matchLedgerRow', () => {
  const rows = [
    { id: 'row-1', data: { topicId: 'topic-9', title: 'Stacks', status: 'pending' } as any },
    { id: 'row-2', data: { title: 'Queues', status: 'in-progress' } as any },
  ]

  it('prefers the explicit topicId link', () => {
    const match = matchLedgerRow(rows, { topicId: 'topic-9', title: 'Something else' })
    assert.equal(match?.id, 'row-1')
  })

  it('falls back to the title so pre-S2.3 rows still line up', () => {
    const match = matchLedgerRow(rows, { topicId: 'unlinked', title: 'queues' })
    assert.equal(match?.id, 'row-2')
  })

  it('returns null when there is nothing to update', () => {
    assert.equal(matchLedgerRow(rows, { topicId: 'x', title: 'Trees' }), null)
    assert.equal(matchLedgerRow([], { topicId: 'x', title: 'Trees' }), null)
  })
})

describe('buildLedgerRow', () => {
  const session = {
    branch: 'BCA',
    batch: '2026',
    division: 'A',
    durationMinutes: 60,
    subject: 'Data Structures',
    subjectCode: 'BCA301',
    semester: 3,
    facultyId: 'faculty-9',
    date: '2026-09-14',
  }

  it('carries the session context a ledger row needs', () => {
    const row = buildLedgerRow(
      { topicId: 'topic-9', title: 'Stacks' },
      session,
      'session-1',
      'college-1',
      new Date(Date.UTC(2026, 8, 14))
    )
    assert.equal(row.title, 'Stacks')
    assert.equal(row.status, 'completed')
    assert.equal(row.subject, 'Data Structures')
    assert.equal(row.facultyId, 'faculty-9')
    assert.equal(row.collegeId, 'college-1')
    assert.equal(row.dateCovered, '2026-09-14')
    assert.equal(row.topicId, 'topic-9')
    assert.equal(row.sessionId, 'session-1')
    assert.equal(row.source, 'class-session')
  })

  it('is shaped like the rows the faculty Topics page already renders', () => {
    // src/hooks/useTopics.ts writes description/course/batch/division/duration/
    // resources/notes, and FacultyTopics.tsx reads them.
    const row = buildLedgerRow({ topicId: '', title: 'Queues' }, session, 'session-1', 'college-1')
    ;['description', 'course', 'batch', 'division', 'duration', 'resources', 'notes'].forEach(field => {
      assert.ok(field in row, `missing ${field}`)
    })
    assert.equal(row.course, 'BCA')
    assert.equal(row.duration, 60)
  })
})

describe('validateCompleteInput', () => {
  it('accepts topics, titles and notes', () => {
    const parsed = validateCompleteInput({
      sessionId: 'session-1',
      topicIds: ['t1', 't2'],
      topicTitles: ['Ad-hoc topic'],
      notes: 'Covered quickly',
    })
    assert.equal(parsed.sessionId, 'session-1')
    assert.deepEqual(parsed.topicIds, ['t1', 't2'])
    assert.deepEqual(parsed.topicTitles, ['Ad-hoc topic'])
    assert.equal(parsed.notes, 'Covered quickly')
  })

  it('accepts a completion with no topics at all', () => {
    const parsed = validateCompleteInput({ sessionId: 'session-1' })
    assert.deepEqual(parsed.topicIds, [])
    assert.deepEqual(parsed.topicTitles, [])
  })

  it('rejects a missing or unsafe session id', () => {
    assert.throws(() => validateCompleteInput({}), /sessionId is required/)
    assert.throws(() => validateCompleteInput({ sessionId: 'a/b' }), /sessionId is required/)
  })

  it('rejects lists that would blow the transaction budget', () => {
    assert.throws(
      () => validateCompleteInput({ sessionId: 's', topicIds: new Array(60).fill('t') }),
      /At most 50/
    )
    assert.throws(
      () => validateCompleteInput({ sessionId: 's', topicIds: 'not-a-list' }),
      /topicIds must be a list/
    )
  })
})

describe('validateCompleteInput — topic pairs', () => {
  it('parses topics pairs and drops empty entries', () => {
    const parsed = validateCompleteInput({
      sessionId: 's',
      topics: [
        { topicId: ' cur__mod__a ', title: '  Linear equations ' },
        { topicId: '', title: '' },
        { topicId: 'only-id', title: undefined },
      ],
    })
    assert.deepEqual(parsed.topics, [
      { topicId: 'cur__mod__a', title: 'Linear equations' },
      { topicId: 'only-id', title: '' },
    ])
  })

  it('rejects a non-list topics payload and over-budget lists', () => {
    assert.throws(
      () => validateCompleteInput({ sessionId: 's', topics: 'nope' }),
      /topics must be a list/
    )
    assert.throws(
      () =>
        validateCompleteInput({
          sessionId: 's',
          topics: new Array(60).fill({ topicId: 't' }),
        }),
      /At most 50/
    )
  })

  it('defaults to an empty topics list', () => {
    assert.deepEqual(validateCompleteInput({ sessionId: 's' }).topics, [])
  })
})

describe('mergeCompletionTopics', () => {
  it('keeps pair titles the bank cannot resolve (composite curriculum ids)', () => {
    const merged = mergeCompletionTopics(
      [{ topicId: 'cur-1__m2__integration-by-parts', title: 'Integration by Parts' }],
      [],
      []
    )
    assert.deepEqual(merged, [
      { topicId: 'cur-1__m2__integration-by-parts', title: 'Integration by Parts' },
    ])
  })

  it('de-duplicates on the normalised title, pairs win', () => {
    const merged = mergeCompletionTopics(
      [{ topicId: 'bank-9', title: 'Integration  by Parts' }],
      [{ topicId: 'bank-9', title: 'Integration by parts' }],
      ['integration by parts']
    )
    assert.equal(merged.length, 1)
    assert.equal(merged[0].topicId, 'bank-9')
  })

  it('drops entries whose title resolves to nothing', () => {
    const merged = mergeCompletionTopics(
      [{ topicId: 'unknown-composite', title: '' }],
      [],
      ['   ']
    )
    assert.deepEqual(merged, [])
  })

  it('appends legacy titles without ids after resolved ones', () => {
    const merged = mergeCompletionTopics(
      [],
      [{ topicId: 'bank-1', title: 'Matrices' }],
      ['Typed fallback']
    )
    assert.deepEqual(merged.map((t) => t.title), ['Matrices', 'Typed fallback'])
    assert.equal(merged[1].topicId, '')
  })
})

describe('plannedTopicsFromCurriculum', () => {
  const curriculumDocs = [
    {
      id: 'cur-1',
      data: {
        courses: [
          {
            id: 'course-a',
            code: 'BC101',
            name: 'Financial Accounting',
            modules: [
              { moduleNo: 'I', moduleName: 'Fundamentals', topics: [' Debits ', 'Credits', ''] },
              { moduleNo: 'II', title: 'Ledgers', topics: ['Debits'] },
            ],
          },
          { id: 'course-b', code: 'BC102', name: 'Costing', modules: [] },
        ],
      },
    },
  ] as Array<{ id: string; data: Record<string, unknown> }>

  it('matches the mapped course by id first, then code, then name', () => {
    const byId = plannedTopicsFromCurriculum([{ curriculumId: 'cur-1', courseId: 'course-a' }], curriculumDocs)
    const byCode = plannedTopicsFromCurriculum([{ curriculumId: 'cur-1', courseCode: 'BC101' }], curriculumDocs)
    const byName = plannedTopicsFromCurriculum([{ curriculumId: 'cur-1', courseName: 'Financial Accounting' }], curriculumDocs)
    assert.deepEqual(byId.map((r) => r.title), ['Debits', 'Credits'])
    assert.deepEqual(byCode, byId)
    assert.deepEqual(byName, byId)
  })

  it('de-duplicates titles and skips unknown curriculum ids / empty courses', () => {
    const rows = plannedTopicsFromCurriculum(
      [
        { curriculumId: 'cur-1', courseId: 'course-a' },
        { curriculumId: 'cur-1', courseId: 'course-a' },
        { curriculumId: 'missing', courseId: 'x' },
        { curriculumId: 'cur-1', courseId: 'course-b' },
      ],
      curriculumDocs
    )
    assert.deepEqual(rows.map((r) => r.title), ['Debits', 'Credits'])
    assert.equal(rows[0].moduleName, 'Fundamentals')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// S2.4 — computing coverage instead of typing it in
// ═══════════════════════════════════════════════════════════════════════════

import {
  classesNeededForHours,
  earlierDateKey,
  expectedSessions,
  hoursFromMinutes,
  laterDateKey,
  mergeTopicCoverage,
  moduleRollup,
  pacePercent,
  percent,
  plannedTopicsFromCurriculum,
  sumProgress,
  validateProgressInput,
  weeksBetween,
  type FacultyProgress,
  type ProgressTopicRow,
} from '../src/classSchedule'

describe('percent', () => {
  it('rounds to one decimal', () => {
    assert.equal(percent(1, 3), 33.3)
    assert.equal(percent(1, 2), 50)
    assert.equal(percent(3, 3), 100)
  })

  it('answers 0 when nothing is planned rather than NaN', () => {
    // useJourney defaults avgAttendance to 85 when there is no data; a gauge
    // must not invent a number, so this returns 0 instead.
    assert.equal(percent(5, 0), 0)
    assert.equal(percent(0, 0), 0)
    assert.equal(percent(Number.NaN, 10), 0)
    assert.equal(percent(5, Number.NaN), 0)
  })
})

describe('hoursFromMinutes', () => {
  it('converts contact minutes to hours', () => {
    assert.equal(hoursFromMinutes(60), 1)
    assert.equal(hoursFromMinutes(90), 1.5)
    assert.equal(hoursFromMinutes(45), 0.8)
    assert.equal(hoursFromMinutes(0), 0)
    assert.equal(hoursFromMinutes(-30), 0)
  })
})

describe('classesNeededForHours', () => {
  it('converts planned syllabus hours into 50-minute periods, rounding up', () => {
    // 8 × 60 = 480 minutes at 50 per class = 9.6 → 10 diary slots.
    assert.equal(classesNeededForHours(8), 10)
    assert.equal(classesNeededForHours(4), 5) // 240/50 = 4.8 → 5
    assert.equal(classesNeededForHours(25 / 6), 5) // exactly 5 classes
    assert.equal(classesNeededForHours(1), 2) // 60/50 = 1.2 → 2
  })

  it('respects a non-default period length', () => {
    assert.equal(classesNeededForHours(1, 60), 1)
    assert.equal(classesNeededForHours(8, 55), 9) // 480/55 = 8.7 → 9
  })

  it('is 0 for nothing planned', () => {
    assert.equal(classesNeededForHours(0), 0)
    assert.equal(classesNeededForHours(-3), 0)
    assert.equal(classesNeededForHours(Number.NaN), 0)
    assert.equal(classesNeededForHours(8, 0), 0)
  })
})

describe('weeksBetween', () => {
  it('counts whole teaching weeks across an inclusive range', () => {
    assert.equal(weeksBetween('2026-09-07', '2026-09-13'), 1)
    assert.equal(weeksBetween('2026-09-07', '2026-09-14'), 2)
    assert.equal(weeksBetween('2026-09-07', '2026-09-07'), 1) // one day is still a week of teaching
    // 30 (Sep) + 31 (Oct) + 30 (Nov) = 91 inclusive days = exactly 13 weeks.
    assert.equal(weeksBetween('2026-09-01', '2026-11-30'), 13)
  })

  it('is 0 for an empty or reversed range', () => {
    assert.equal(weeksBetween('2026-09-14', '2026-09-07'), 0)
  })
})

describe('expectedSessions / pacePercent', () => {
  it('derives the denominator from the college’s own timetable', () => {
    // 5 slots a week over 4 elapsed weeks ⇒ 20 classes the plan promised.
    assert.equal(expectedSessions(5, 4), 20)
    assert.equal(pacePercent(15, 20), 75)
    assert.equal(pacePercent(20, 20), 100)
    assert.equal(pacePercent(24, 20), 120) // ahead of plan is allowed to show
  })

  it('is 0 when there is no timetable or no elapsed time', () => {
    assert.equal(expectedSessions(0, 4), 0)
    assert.equal(expectedSessions(5, 0), 0)
    assert.equal(pacePercent(3, 0), 0)
  })
})

describe('moduleRollup', () => {
  it('groups by module and computes coverage per module', () => {
    const rows: ProgressTopicRow[] = [
      { title: 'Stacks', moduleNo: '1', moduleName: 'Linear', covered: true },
      { title: 'Queues', moduleNo: '1', moduleName: 'Linear', covered: false },
      { title: 'Trees', moduleNo: '2', moduleName: 'Non-linear', covered: true },
    ]
    assert.deepEqual(moduleRollup(rows), [
      { moduleNo: '1', moduleName: 'Linear', hours: 0, classesNeeded: 0, total: 2, covered: 1, pct: 50 },
      { moduleNo: '2', moduleName: 'Non-linear', hours: 0, classesNeeded: 0, total: 2 - 1, covered: 1, pct: 100 },
    ])
  })

  it('carries module hours into the class-count estimate (50-min periods)', () => {
    const rows: ProgressTopicRow[] = [
      // The hours figure repeats per topic of the module — the rollup keeps one.
      { title: 'Stacks', moduleNo: '1', moduleName: 'Linear', covered: true, hours: 8 },
      { title: 'Queues', moduleNo: '1', moduleName: 'Linear', covered: false, hours: 8 },
    ]
    const [moduleOne] = moduleRollup(rows)
    assert.equal(moduleOne.hours, 8)
    assert.equal(moduleOne.classesNeeded, 10) // 8h × 60 / 50 = 9.6 → 10 classes
  })

  it('keeps unnumbered rows in one bucket so totals still add up', () => {
    const rows: ProgressTopicRow[] = [
      { title: 'Intro', moduleNo: '', moduleName: '', covered: false },
      { title: 'Exam prep', moduleNo: '', moduleName: '', covered: false },
    ]
    const rolled = moduleRollup(rows)
    assert.equal(rolled.length, 1)
    assert.equal(rolled[0].moduleName, 'Unassigned')
    assert.equal(rolled[0].total, 2)
  })

  it('handles an empty ledger', () => {
    assert.deepEqual(moduleRollup([]), [])
  })
})

describe('mergeTopicCoverage', () => {
  const ledger: ProgressTopicRow[] = [
    { title: 'Stacks', moduleNo: '1', moduleName: 'Linear', covered: false },
    { title: 'Queues', moduleNo: '1', moduleName: 'Linear', covered: true },
  ]

  it('covers a ledger row that a completed session claims by title', () => {
    const merged = mergeTopicCoverage(ledger, new Set(['stacks']))
    const stacks = merged.find((row) => row.title === 'Stacks')
    assert.equal(stacks?.covered, true)
  })

  it('leaves a covered row covered (additive only)', () => {
    const merged = mergeTopicCoverage(ledger, new Set())
    const queues = merged.find((row) => row.title === 'Queues')
    assert.equal(queues?.covered, true)
  })

  it('de-duplicates the same topic coming from both stores', () => {
    const merged = mergeTopicCoverage(
      [
        { title: 'Stacks', moduleNo: '1', moduleName: 'Linear', covered: false },
        { title: 'stacks ', moduleNo: '', moduleName: '', covered: false },
      ],
      new Set()
    )
    assert.equal(merged.length, 1)
  })

  it('backfills module metadata from whichever row has it', () => {
    const merged = mergeTopicCoverage(
      [
        { title: 'Trees', moduleNo: '', moduleName: '', covered: false },
        { title: 'Trees', moduleNo: '2', moduleName: 'Non-linear', covered: false },
      ],
      new Set()
    )
    assert.equal(merged.length, 1)
    assert.equal(merged[0].moduleNo, '2')
    assert.equal(merged[0].moduleName, 'Non-linear')
  })
})

describe('earlierDateKey / laterDateKey', () => {
  it('clamps the term window', () => {
    assert.equal(earlierDateKey('2026-09-14', '2026-11-30'), '2026-09-14')
    assert.equal(laterDateKey('2026-09-14', '2026-11-30'), '2026-11-30')
  })

  it('ignores missing or malformed keys', () => {
    assert.equal(earlierDateKey('', '2026-11-30'), '2026-11-30')
    assert.equal(laterDateKey('2026-09-14', 'nonsense'), '2026-09-14')
  })
})

describe('sumProgress', () => {
  const faculty = (overrides: Partial<FacultyProgress>): FacultyProgress => ({
    facultyId: 'f1',
    facultyName: 'A',
    courses: [{ curriculumId: 'c1', courseName: 'DS', courseCode: 'BCA301', branch: 'BCA', batch: '2026', semester: 3, totalHours: 40, credits: 4, modulesCount: 5 }],
    hoursPlanned: 40,
    hoursDelivered: 10,
    hoursPct: 25,
    classesNeeded: 48,
    topics: { total: 20, covered: 5, pending: 15, pct: 25 },
    modules: [{ moduleNo: '1', moduleName: 'Linear', hours: 8, classesNeeded: 10, total: 4, covered: 2, pct: 50 }],
    sessions: { total: 30, completed: 10, scheduled: 18, cancelled: 2 },
    pace: { slotsPerWeek: 5, weeksElapsed: 6, expected: 30, completed: 10, pct: 33.3 },
    attendance: { present: 80, marked: 100, pct: 80 },
    ...overrides,
  })

  it('recomputes every percentage from the summed parts', () => {
    const totals = sumProgress([faculty({}), faculty({ facultyId: 'f2', hoursDelivered: 30 })])
    assert.equal(totals.hoursPlanned, 80)
    assert.equal(totals.hoursDelivered, 40)
    assert.equal(totals.hoursPct, 50)
    assert.equal(totals.topics.covered, 10)
    assert.equal(totals.topics.total, 40)
    assert.equal(totals.topics.pct, 25)
    assert.equal(totals.attendance.pct, 80)
  })

  it('takes the longest elapsed window, not the sum', () => {
    const totals = sumProgress([
      faculty({ pace: { slotsPerWeek: 5, weeksElapsed: 4, expected: 20, completed: 10, pct: 50 } }),
      faculty({ pace: { slotsPerWeek: 3, weeksElapsed: 9, expected: 27, completed: 27, pct: 100 } }),
    ])
    assert.equal(totals.pace.weeksElapsed, 9)
    assert.equal(totals.pace.slotsPerWeek, 8)
    assert.equal(totals.pace.expected, 47)
    assert.equal(totals.pace.completed, 37)
  })

  it('returns an empty-but-valid shape for no faculty', () => {
    const totals = sumProgress([])
    assert.equal(totals.hoursPlanned, 0)
    assert.equal(totals.hoursPct, 0)
    assert.equal(totals.topics.pct, 0)
  })
})

describe('validateProgressInput', () => {
  it('pins non-superadmins to the auth claim', () => {
    const parsed = validateProgressInput({ collegeId: 'other' }, 'admin', 'college-1')
    assert.equal(parsed.collegeId, 'college-1')
  })

  it('lets a superadmin target a college', () => {
    assert.equal(validateProgressInput({ collegeId: 'college-2' }, 'superadmin', '').collegeId, 'college-2')
  })

  it('accepts an empty filter set — the whole college', () => {
    const parsed = validateProgressInput({}, 'admin', 'college-1')
    assert.equal(parsed.facultyId, '')
    assert.equal(parsed.batch, '')
    assert.equal(parsed.from, '')
  })

  it('validates the optional date range', () => {
    assert.equal(validateProgressInput({ from: '2026-09-01', to: '2026-11-30' }, 'admin', 'c').to, '2026-11-30')
    assert.throws(() => validateProgressInput({ from: 'yesterday' }, 'admin', 'c'), /yyyy-mm-dd/)
    assert.throws(
      () => validateProgressInput({ from: '2026-11-30', to: '2026-09-01' }, 'admin', 'c'),
      /on or before/
    )
  })

  it('refuses to run for a claim-less account', () => {
    assert.throws(() => validateProgressInput({}, 'admin', ''), /No college/)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// S2.5 — server-side conflict enforcement
// ═══════════════════════════════════════════════════════════════════════════

import { toConflictCandidate } from '../src/classSchedule'

describe('toConflictCandidate', () => {
  it('reads a whole Firestore document defensively', () => {
    const candidate = toConflictCandidate({
      id: 'weekly-1_2026-09-14',
      collegeId: 'college-1',
      date: '2026-09-14',
      facultyId: 'faculty-9',
      room: 'LH-201',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Data Structures',
    })
    assert.equal(candidate.id, 'weekly-1_2026-09-14')
    assert.equal(candidate.date, '2026-09-14')
    assert.equal(candidate.facultyId, 'faculty-9')
    assert.equal(candidate.room, 'LH-201')
    assert.equal(candidate.status, 'scheduled')
    assert.equal(candidate.subject, 'Data Structures')
  })

  it('does not throw on a sparse or legacy row', () => {
    // A row with no room or times must still be comparable rather than
    // crashing the whole generate run.
    const candidate = toConflictCandidate({ id: 'legacy-1', collegeId: 'college-1' })
    assert.equal(candidate.date, '')
    assert.equal(candidate.room, '')
    assert.equal(candidate.facultyId, '')
    assert.equal(candidate.startTime, '')
  })
})

describe('generate payload conflict switches', () => {
  const base = { from: '2026-09-01', to: '2026-09-30' }

  it('detects conflicts by default — silence is the failure mode', () => {
    const payload = validateGeneratePayload(base, 'admin', 'college-1')
    assert.equal(payload.detectConflicts, true)
    assert.equal(payload.skipConflicting, false)
  })

  it('lets an admin opt into skipping the clashing slots', () => {
    const payload = validateGeneratePayload(
      { ...base, skipConflicting: true },
      'admin',
      'college-1'
    )
    assert.equal(payload.skipConflicting, true)
    assert.equal(payload.detectConflicts, true)
  })

  it('lets an admin turn detection off entirely', () => {
    const payload = validateGeneratePayload(
      { ...base, detectConflicts: false },
      'admin',
      'college-1'
    )
    assert.equal(payload.detectConflicts, false)
  })

  it('ignores a truthy-but-not-true skipConflicting', () => {
    // Guards against a string "false" arriving from a form control.
    assert.equal(
      validateGeneratePayload({ ...base, skipConflicting: 'false' }, 'admin', 'college-1')
        .skipConflicting,
      false
    )
  })
})

// ─── P1 (Auto-Scheduler v2): slot validity window ────────────────────────────

describe('slot validity window (P1)', () => {
  it('legacy slots (no window fields) are always active — byte-identical back-compat', () => {
    assert.deepEqual(slotDateWindow(SLOT), { from: null, to: null })
    for (const date of ['2020-01-01', '2026-09-22', '2099-12-31']) {
      assert.equal(slotAppliesOn(SLOT, date), true)
    }
    // malformed window fields degrade to "no window" rather than dropping the slot
    assert.equal(slotAppliesOn({ ...SLOT, effectiveFrom: 'someday', effectiveTo: '31/12/2026' }, '2026-10-05'), true)
  })

  it('honours effectiveFrom / effectiveTo inclusively', () => {
    const windowed = { ...SLOT, effectiveFrom: '2026-09-22', effectiveTo: '2026-12-20' }
    assert.deepEqual(slotDateWindow(windowed), { from: '2026-09-22', to: '2026-12-20' })
    assert.equal(slotAppliesOn(windowed, '2026-09-21'), false)
    assert.equal(slotAppliesOn(windowed, '2026-09-22'), true) // inclusive start
    assert.equal(slotAppliesOn(windowed, '2026-10-05'), true)
    assert.equal(slotAppliesOn(windowed, '2026-12-20'), true) // inclusive end
    assert.equal(slotAppliesOn(windowed, '2026-12-21'), false)
  })

  it('supports open-ended windows (from-only and to-only)', () => {
    const fromOnly = { ...SLOT, effectiveFrom: '2026-09-22' }
    assert.equal(slotAppliesOn(fromOnly, '2026-09-21'), false)
    assert.equal(slotAppliesOn(fromOnly, '2099-01-01'), true)
    const toOnly = { ...SLOT, effectiveTo: '2026-12-20' }
    assert.equal(slotAppliesOn(toOnly, '2020-01-01'), true)
    assert.equal(slotAppliesOn(toOnly, '2026-12-21'), false)
  })
})

// ─── Identity: one teacher, several ids ─────────────────────────────────────
//
// Regression cover for "Mark topics covered" answering "Only college
// administrators can…". The callable compares the caller with the class they
// are teaching, and those two are frequently NOT the same string: the timetable,
// the curriculum mappings and every session generated from them key a teacher
// by their faculty PROFILE id, while ownership and the auth claim are the
// Firebase Auth UID. The raw `===` refused a teacher their own class, and the
// client rendered the refusal as an admin-only message.

describe('staff identity (role + college resolution)', () => {
  it('normalises the role instead of string-comparing it', () => {
    // A claim minted as "Teacher" describes a faculty member, and used to fail
    // every role check in this module.
    assert.equal(
      staffIdentityFromDocs({ uid: 'u1', token: { role: 'Teacher', collegeId: 'c1' } }).role,
      'faculty'
    )
    assert.equal(
      staffIdentityFromDocs({ uid: 'u1', token: { role: 'Head of Department', collegeId: 'c1' } }).role,
      'hod'
    )
    assert.equal(
      staffIdentityFromDocs({ uid: 'u1', token: { role: ' HOD ', collegeId: 'c1' } }).role,
      'hod'
    )
    // A role nobody recognises stays empty rather than becoming a privilege.
    assert.equal(staffIdentityFromDocs({ uid: 'u1', token: { role: 'wizard' } }).role, '')
  })

  it('reads every college id spelling the client tolerates', () => {
    // The client maps faculty profiles via `collegeId || collegeID`
    // (src/modules/auth/context/auth.ts) — the server used to read only one.
    assert.equal(
      staffIdentityFromDocs({ uid: 'u1', token: {}, user: { collegeID: 'c9' } }).collegeId,
      'c9'
    )
    assert.equal(
      staffIdentityFromDocs({ uid: 'u1', token: {}, user: { college_id: 'c8' } }).collegeId,
      'c8'
    )
    assert.equal(
      staffIdentityFromDocs({ uid: 'u1', token: { collegeId: 'c1' }, user: { collegeId: 'c2' } })
        .collegeId,
      'c1'
    )
  })

  it('falls back to a legacy staff profile when the users document says nothing', () => {
    const profile = {
      role: 'faculty',
      collegeId: 'c1',
      name: 'Asha Rao',
      email: 'asha@college.edu',
      ids: ['u1', 'facultyProfile1'],
    }
    const resolved = staffIdentityFromDocs({ uid: 'u1', token: {}, user: null, profile })
    assert.equal(resolved.role, 'faculty')
    assert.equal(resolved.collegeId, 'c1')
    assert.equal(resolved.name, 'Asha Rao')
  })

  it('builds a name out of first/last when the document has none', () => {
    assert.equal(
      staffIdentityFromDocs({
        uid: 'u1',
        token: { role: 'faculty', collegeId: 'c1' },
        user: { firstName: 'Asha', lastName: 'Rao' },
      }).name,
      'Asha Rao'
    )
  })

  it('decides when the profile collections still have to be consulted', () => {
    // No users document at all: an account provisioned before that convention.
    assert.equal(needsStaffProfileLookup({ token: { role: 'faculty', collegeId: 'c1' }, userExists: false }), true)
    // A document that carries neither a role nor a college.
    assert.equal(needsStaffProfileLookup({ token: {}, userExists: true }), true)
    // Role present, college missing — a cross-tenant token.
    assert.equal(needsStaffProfileLookup({ token: { role: 'faculty' }, userExists: true }), true)
    // A superadmin has no college, and that is not a broken account.
    assert.equal(needsStaffProfileLookup({ token: { role: 'superadmin' }, userExists: true }), false)
    // Fully specified, including the aliased spellings.
    assert.equal(needsStaffProfileLookup({ token: { role: 'Teacher', collegeId: 'c1' }, userExists: true }), false)
  })
})

describe('faculty identity aliases (the class the teacher is actually teaching)', () => {
  it('folds the id spellings into one de-duplicated list, uid first', () => {
    assert.deepEqual(
      mergeIdentityIds('u1', ['u1', 'profile1', 'FAC-01', ''], 'profile1', undefined),
      ['u1', 'profile1', 'FAC-01']
    )
  })

  it('recognises a session keyed on the profile id as the caller\'s own', () => {
    const caller = { uid: 'u1', ids: ['u1', 'facultyProfile1'] }
    // The regression: a session generated from the timetable carries the
    // profile id, and the old `session.facultyId === uid` check refused it.
    assert.equal(callerOwnsFacultyId(caller, 'facultyProfile1'), true)
    assert.equal(callerOwnsFacultyId(caller, 'u1'), true)
    assert.equal(callerOwnsFacultyId(caller, 'someoneElse'), false)
    assert.equal(callerOwnsFacultyId(caller, ''), false)
    assert.equal(callerOwnsFacultyId(caller, undefined), false)
  })

  it('never grants ownership on a caller with no known ids', () => {
    assert.equal(callerOwnsFacultyId({ uid: 'u1', ids: [] }, 'profile1'), false)
  })
})

describe('ledger faculty ids (one topic, one row)', () => {
  it('reads the teacher\'s ledger under every id they are filed under', () => {
    // The regression behind "marking topics covered created a second row
    // instead of flipping the planned one": the session carries the profile
    // id, the planner row the teacher sees on their Topics page is keyed by
    // their auth uid.
    const staff = { uid: 'u1', ids: ['u1', 'facultyProfile1', 'FAC-01'] }
    assert.deepEqual(resolveLedgerFacultyIds({ facultyId: 'facultyProfile1' }, staff), [
      'u1',
      'facultyProfile1',
      'FAC-01',
    ])
  })

  it('never mixes a scheduling role\'s own ids into somebody else\'s class', () => {
    const admin = { uid: 'admin1', ids: ['admin1'] }
    assert.deepEqual(resolveLedgerFacultyIds({ facultyId: 'facultyProfile1' }, admin), ['facultyProfile1'])
  })

  it('falls back to the caller when the session names no teacher', () => {
    assert.deepEqual(resolveLedgerFacultyIds({}, { uid: 'u1', ids: ['u1'] }), ['u1'])
    assert.deepEqual(resolveLedgerFacultyIds({}, { uid: '', ids: [] }), [])
  })

  it('is bounded', () => {
    const many = { uid: 'u1', ids: ['u1', ...Array.from({ length: 20 }, (_, i) => `alias${i}`)] }
    assert.equal(resolveLedgerFacultyIds({ facultyId: 'alias0' }, many).length <= MAX_LEDGER_FACULTY_IDS, true)
  })
})

// ─── S2.6: rescheduling keeps the plan and the actual in step ───────────────
//
// The planner is pure: it classifies each session as moved / merged /
// blocked / skipped without Firestore or a clock, which is what lets the
// admin's "reschedule" dialog preview the same outcome the callable writes.

import {
  isMovableSession,
  isSessionAffectedByHoliday,
  nextDateForDay,
  planReschedule,
  MAX_RESCHEDULE_SESSIONS,
  type PlannedSession,
  type WeeklySlot,
} from '../src/classSchedule'

function slot(overrides: Partial<WeeklySlot> = {}): WeeklySlot {
  return {
    id: 'slot1',
    collegeId: 'c1',
    subject: 'Financial Accounting',
    subjectCode: 'BCOM101',
    facultyId: 'f1',
    branch: 'B.Com',
    batch: '2026-2029',
    semester: 1,
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    room: 'R1',
    ...overrides,
  }
}

function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return { id: 'slot1_2026-10-05', date: '2026-10-05', status: 'scheduled', ...overrides }
}

describe('nextDateForDay', () => {
  it('lands on the next occurrence strictly after the given date', () => {
    // 2026-10-05 is a Monday.
    assert.equal(nextDateForDay('2026-10-05', 'wednesday'), '2026-10-07')
    assert.equal(nextDateForDay('2026-10-05', 'monday'), '2026-10-12')
  })

  it('never moves a class into the past', () => {
    // Friday 2026-10-09 → Monday must be the following Monday, not the one
    // that already passed in the same calendar week.
    assert.equal(nextDateForDay('2026-10-09', 'monday'), '2026-10-12')
    assert.equal(nextDateForDay('2026-10-09', 'friday'), '2026-10-16')
  })

  it('accepts the day spellings the rest of the module accepts', () => {
    assert.equal(nextDateForDay('2026-10-05', 'Wed'), '2026-10-07')
    assert.equal(nextDateForDay('2026-10-05', 3), '2026-10-07')
    assert.equal(nextDateForDay('2026-10-05', 'notaday'), null)
    assert.equal(nextDateForDay('junk', 'tuesday'), null)
  })
})

describe('isMovableSession', () => {
  const from = '2026-10-01'

  it('moves only future, unmarked, still-scheduled classes', () => {
    assert.equal(isMovableSession(session(), from), true)
  })

  it('refuses delivered history', () => {
    assert.equal(isMovableSession(session({ attendanceMarked: true }), from), false)
    assert.equal(isMovableSession(session({ attendanceCount: 12 }), from), false)
    assert.equal(isMovableSession(session({ presentCount: 1 }), from), false)
    assert.equal(isMovableSession(session({ topicsCovered: ['Depreciation'] }), from), false)
    assert.equal(isMovableSession(session({ status: 'completed' }), from), false)
    assert.equal(isMovableSession(session({ status: 'cancelled' }), from), false)
    assert.equal(isMovableSession(session({ date: '2026-09-28' }), from), false)
  })
})

describe('isSessionAffectedByHoliday', () => {
  const from = '2026-10-01'
  const holiday = { startDate: '2026-10-02', endDate: '2026-10-02' }

  it('selects only unmarked future sessions on the holiday date', () => {
    assert.equal(isSessionAffectedByHoliday(session({ date: '2026-10-02' }), holiday, from), true)
    assert.equal(isSessionAffectedByHoliday(session({ date: '2026-10-03' }), holiday, from), false)
    assert.equal(isSessionAffectedByHoliday(session({ date: '2026-10-02', attendanceMarked: true }), holiday, from), false)
    assert.equal(isSessionAffectedByHoliday(session({ date: '2026-10-02', status: 'completed' }), holiday, from), false)
  })
})

describe('planReschedule — the whole slot', () => {
  it('moves every future class to the new weekday, 1–7 days ahead', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [session(), session({ id: 'slot1_2026-10-12', date: '2026-10-12' })],
      changes: { dayOfWeek: 'wednesday' },
      scope: 'slot',
      from: '2026-09-30',
    })
    assert.deepEqual(
      plan.moves.map((move) => [move.fromDate, move.toDate, move.toId]),
      [
        ['2026-10-05', '2026-10-07', 'slot1_2026-10-07'],
        ['2026-10-12', '2026-10-14', 'slot1_2026-10-14'],
      ]
    )
    assert.equal(plan.moves.every((move) => move.inPlace === false), true)
    assert.equal(plan.moves[0].patch.dayOfWeek, 'wednesday')
    assert.equal(plan.moves[0].patch.date, '2026-10-07')
  })

  it('patches time and room in place when the day does not change', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [session()],
      changes: { startTime: '11:00', endTime: '12:00', room: 'Lab 2' },
      scope: 'slot',
      from: '2026-09-30',
    })
    assert.equal(plan.moves.length, 1)
    assert.equal(plan.moves[0].inPlace, true)
    assert.equal(plan.moves[0].toId, 'slot1_2026-10-05')
    assert.deepEqual(plan.moves[0].patch, {
      startTime: '11:00',
      endTime: '12:00',
      room: 'Lab 2',
      // The combined slot string every reader falls back to is kept in step.
      timeSlot: '11:00-12:00',
    })
  })

  it('leaves marked and past classes exactly where they are', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [
        session({ id: 'slot1_2026-09-28', date: '2026-09-28' }),
        session({ id: 'slot1_2026-10-05', date: '2026-10-05', attendanceMarked: true }),
        session({ id: 'slot1_2026-09-21', date: '2026-09-21', status: 'completed' }),
      ],
      changes: { dayOfWeek: 'friday' },
      scope: 'slot',
      from: '2026-10-01',
    })
    assert.equal(plan.moves.length, 0)
    assert.deepEqual(plan.skippedPast.map((row) => row.id), ['slot1_2026-09-28'])
    assert.deepEqual(plan.skippedMarked.map((row) => row.id), ['slot1_2026-10-05'])
    assert.deepEqual(plan.skippedStatus.map((row) => row.id), ['slot1_2026-09-21'])
  })

  it('merges instead of doubling a class that already sits at the destination', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [
        session(),
        // Already generated for the new Wednesday by an earlier run.
        session({ id: 'slot1_2026-10-07', date: '2026-10-07' }),
      ],
      changes: { dayOfWeek: 'wednesday' },
      scope: 'slot',
      from: '2026-09-30',
    })
    assert.equal(plan.moves.length, 0)
    assert.deepEqual(plan.merged.map((row) => row.toDate), ['2026-10-07'])
    // The Wednesday occurrence is already on the new day — it must not be
    // pushed a week forward to make room for the class merging into it.
    assert.deepEqual(plan.unchanged.map((row) => row.id), ['slot1_2026-10-07'])
  })

  it('claims each destination once when two occurrences would collide', () => {
    const plan = planReschedule({
      slot: slot(),
      // Defensive: a slot should not have two sessions inside one week, but a
      // legacy duplicate must not make one move overwrite the other.
      sessions: [
        session({ id: 'slot1_2026-10-05', date: '2026-10-05' }),
        session({ id: 'slot1_2026-10-06', date: '2026-10-06' }),
      ],
      changes: { dayOfWeek: 'wednesday' },
      scope: 'slot',
      from: '2026-09-30',
    })
    assert.equal(plan.moves.length, 1)
    assert.equal(plan.merged.length, 1)
    assert.equal(new Set(plan.moves.map((move) => move.toDate)).size, plan.moves.length)
  })

  it('does nothing when the slot has no sessions yet', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [],
      changes: { dayOfWeek: 'tuesday' },
      scope: 'slot',
      from: '2026-09-30',
    })
    assert.deepEqual(plan, {
      moves: [],
      merged: [],
      blocked: [],
      unchanged: [],
      skippedMarked: [],
      skippedPast: [],
      skippedStatus: [],
    })
  })
})

describe('planReschedule — one class', () => {
  it('keeps the document id and rewrites the date, so generate cannot resurrect it', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [session(), session({ id: 'slot1_2026-10-12', date: '2026-10-12' })],
      changes: { date: '2026-10-08', startTime: '14:00', endTime: '15:00' },
      scope: 'session',
      sessionId: 'slot1_2026-10-05',
      from: '2026-09-30',
    })
    assert.equal(plan.moves.length, 1)
    assert.equal(plan.moves[0].inPlace, true)
    assert.equal(plan.moves[0].toId, 'slot1_2026-10-05')
    assert.equal(plan.moves[0].toDate, '2026-10-08')
    assert.equal(plan.moves[0].patch.date, '2026-10-08')
    assert.equal(plan.moves[0].patch.timeSlot, '14:00-15:00')
  })

  it('blocks a date another class for the same slot already occupies', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [session(), session({ id: 'slot1_2026-10-12', date: '2026-10-12' })],
      changes: { date: '2026-10-12' },
      scope: 'session',
      sessionId: 'slot1_2026-10-05',
      from: '2026-09-30',
    })
    assert.equal(plan.moves.length, 0)
    assert.deepEqual(plan.blocked.map((row) => row.id), ['slot1_2026-10-05'])
  })

  it('ignores every other session of the slot', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [session(), session({ id: 'slot1_2026-10-12', date: '2026-10-12' })],
      changes: { date: '2026-10-08' },
      scope: 'session',
      sessionId: 'slot1_2026-10-12',
      from: '2026-09-30',
    })
    assert.deepEqual(plan.moves.map((move) => move.fromId), ['slot1_2026-10-12'])
  })

  it('reports a missing session rather than inventing one', () => {
    const plan = planReschedule({
      slot: slot(),
      sessions: [session()],
      changes: { date: '2026-10-08' },
      scope: 'session',
      sessionId: 'slot1_2099-01-01',
      from: '2026-09-30',
    })
    assert.equal(plan.moves.length, 0)
    assert.equal(plan.blocked.length, 0)
  })
})

describe('reschedule bounds', () => {
  it('keeps the per-run session ceiling', () => {
    // One document a week for a term is ~13; the ceiling exists for a
    // pathological slot that somehow accumulated thousands of rows.
    assert.equal(MAX_RESCHEDULE_SESSIONS > 0 && MAX_RESCHEDULE_SESSIONS <= 2000, true)
  })
})
