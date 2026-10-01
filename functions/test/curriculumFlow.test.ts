// functions/test/curriculumFlow.test.ts
// ─── The one flow: curriculum → faculty mapping → timetable → student ────────
//
// Every hop between these layers is a cohort comparison, and each hop used to
// be written differently:
//
//   auto-scheduler demand   batch as a TOKEN LIST, division as a literal string
//   clash detection         branch|batch|division as a literal string
//   student curriculum page batch KEYED (range ≡ end year), division as a SET
//
// The same real-world cohort — mappings written "2026-2027 / A,B,C,D" by Auto
// Map, students stored "2027 / A" by bulk import — therefore matched at the
// student end and matched nowhere else: the auto-scheduler found no demand and
// refused to run, and the import's cohort-clash warning could not see the
// class it was double-booking. This suite walks ONE cohort through the whole
// chain with the shipped pure functions, so a future edit to any single hop
// that re-opens the gap fails here.
//
// The fixtures are the live demo shapes: BBA, batch 2027 (mapped 2026-2027),
// semester 3, divisions A–D written as one list.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { batchListMatches, mappingServesCohort } from '../src/autoSchedule'
import { buildSessionDoc, type WeeklySlot } from '../src/classSchedule'
import { classifyTopics, ledgerRowBatchMatches, sessionMatchesCohort } from '../src/studentCurriculum'
import { findClashes, type ScheduleEntry } from '../src/utils/timetableConflicts'

/** An active `curriculumFacultyMappings` row exactly as applyAutoMapping writes it. */
const MAPPING = {
  id: 'map-1',
  curriculumId: 'cur-bba-sem3',
  courseId: 'course-fa',
  courseCode: 'BBA301',
  courseName: 'Financial Accounting',
  facultyId: 'uid-asha',
  facultyName: 'Asha Rao',
  branch: 'BBA',
  semester: 3,
  batch: '2026-2027',
  division: 'A,B,C,D',
  section: null,
  status: 'active',
}

/** The student record as bulk import writes it. */
const STUDENT_A = { branch: 'BBA', batch: '2027', semester: 3, division: 'A', section: '' }

function slot(overrides: Partial<WeeklySlot> = {}): WeeklySlot {
  return {
    id: 'slot-1',
    collegeId: 'college-a',
    subject: 'Financial Accounting',
    subjectCode: 'BBA301',
    facultyId: 'uid-asha',
    facultyName: 'Asha Rao',
    branch: 'BBA',
    batch: '2027',
    semester: 3,
    division: 'A',
    section: '',
    room: 'R12',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '09:50',
    type: 'lecture',
    isActive: true,
    ...overrides,
  }
}

describe('curriculum flow — hop 1: the mapping reaches the auto-scheduler', () => {
  it('a mapping written for 2026-2027 / A,B,C,D is demand for a run of 2027 / A', () => {
    // Before the fix this was false (batch token "2026-2027" ≠ "2027", division
    // "a,b,c,d" ≠ "a"), so the run threw "No active faculty mappings … run
    // Auto Map first" over demand that existed.
    assert.equal(mappingServesCohort(MAPPING, { batch: '2027', division: 'A', section: '' }), true)
    assert.equal(mappingServesCohort(MAPPING, { batch: '2026-2027', division: 'D', section: '' }), true)
  })

  it('does not schedule the mapping for a division it does not cover', () => {
    assert.equal(mappingServesCohort(MAPPING, { batch: '2027', division: 'E', section: '' }), false)
    assert.equal(mappingServesCohort(MAPPING, { batch: '2026', division: 'A', section: '' }), false)
  })
})

describe('curriculum flow — hop 2: the timetable row carries the cohort', () => {
  it('the written slot keeps the run cohort, and the session copies it', () => {
    // The auto-scheduler writes weeklySchedules with the payload's cohort
    // (division A), then generateClassSessions expands each date through
    // buildSessionDoc — the cohort fields are copied verbatim.
    const session = buildSessionDoc(slot(), '2026-10-05', new Date('2026-10-01T00:00:00Z'))
    assert.equal(session.branch, 'BBA')
    assert.equal(session.batch, '2027')
    assert.equal(session.semester, 3)
    assert.equal(session.division, 'A')
    assert.equal(session.subject, 'Financial Accounting')
    assert.equal(session.subjectCode, 'BBA301')
    assert.equal(session.status, 'scheduled')
    assert.equal(session.source, 'weekly-schedule')
  })
})

describe('curriculum flow — hop 3: the student sees it', () => {
  const session = buildSessionDoc(slot(), '2026-10-05', new Date('2026-10-01T00:00:00Z'))

  it('division A of batch 2027 is in the class', () => {
    assert.equal(sessionMatchesCohort(session, STUDENT_A), true)
  })

  it('the other divisions of the same batch are in it too when the slot covers the list', () => {
    // A whole-batch slot (division list) reaches every letter.
    const wholeBatch = buildSessionDoc(slot({ division: 'A,B,C,D' }), '2026-10-05')
    assert.equal(sessionMatchesCohort(wholeBatch, STUDENT_A), true)
    assert.equal(sessionMatchesCohort(wholeBatch, { ...STUDENT_A, division: 'D' }), true)
  })

  it('a different division, semester or batch is not', () => {
    assert.equal(sessionMatchesCohort(session, { ...STUDENT_A, division: 'B' }), false)
    assert.equal(sessionMatchesCohort(session, { ...STUDENT_A, semester: 4 }), false)
    assert.equal(sessionMatchesCohort(session, { ...STUDENT_A, batch: '2026' }), false)
  })

  it('the faculty ledger for the same class is read by the student even when its batch is a range', () => {
    assert.equal(ledgerRowBatchMatches('2026-2027', '2027'), true)
    assert.equal(ledgerRowBatchMatches('2026', '2027'), false)
    assert.equal(ledgerRowBatchMatches('', '2027'), true) // unlabelled row = wildcard
  })

  it('a topic covered by a completed session flips to completed', () => {
    const modules = [{ moduleNo: '1', moduleName: 'Module 1', hours: 10, topics: ['Introduction', 'Ledger posting'] }]
    // With nothing covered yet the module being taught is module 1, so its
    // pending topics read as "current" — that is the term-start state.
    const before = classifyTopics(modules, { covered: new Map(), planned: new Map(), today: '2026-10-05', horizon: '2026-10-12' })
    assert.equal(before[0].topics[0].state, 'current')

    const after = classifyTopics(modules, {
      covered: new Map([['introduction', '2026-10-05']]),
      planned: new Map(),
      today: '2026-10-05',
      horizon: '2026-10-12',
    })
    assert.equal(after[0].topics[0].state, 'completed')
    assert.equal(after[0].topics[0].coveredOn, '2026-10-05')
  })
})

describe('curriculum flow — hop 4: clash detection sees the same cohort', () => {
  function entry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
    return {
      id: 'candidate',
      collegeId: 'college-a',
      facultyId: 'uid-ravi',
      branch: 'BBA',
      batch: '2027',
      division: 'A',
      room: 'R13',
      dayOfWeek: 'monday',
      startTime: '09:30',
      endTime: '10:20',
      isActive: true,
      ...overrides,
    }
  }

  it('a new division-A slot clashes with the existing whole-batch slot', () => {
    // The import/auto-scheduler must not double-book the cohort just because
    // one row was written "2026-2027 / A,B,C,D" and the other "2027 / A".
    const clashes = findClashes(
      entry(),
      [entry({ id: 'existing', facultyId: 'uid-asha', division: 'A,B,C,D', batch: '2026-2027', room: 'R12' })],
    )
    assert.deepEqual(clashes, ['cohort'])
  })

  it('parallel divisions of the same batch are not a cohort clash', () => {
    const clashes = findClashes(entry(), [entry({ id: 'existing', facultyId: 'uid-asha', division: 'B', room: 'R12' })])
    assert.deepEqual(clashes, [])
  })

  it('the range-vs-bare-batch spelling is the same class for demand and for clashes', () => {
    assert.equal(batchListMatches('2027', '2026-2027'), true)
    assert.deepEqual(
      findClashes(entry(), [entry({ id: 'existing', facultyId: 'uid-asha', batch: '2026-2027', room: 'R12', division: 'A' })]),
      ['cohort'],
    )
  })
})
