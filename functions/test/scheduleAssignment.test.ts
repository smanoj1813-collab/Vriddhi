// functions/test/scheduleAssignment.test.ts
// ─── Weekly slot → assignment linkage: pure-helper coverage ─────────────────
//
// The admin's weekly form can attach an optional assignment to a slot;
// `generateClassSessions` materialises exactly one draft per configured slot.
// These tests pin the deterministic core: the stable assignment id, the
// config validation (one bad admin edit must not kill a whole-term run), the
// draft document shape, and the session→assignment backlink.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import * as admin from 'firebase-admin'
import {
  buildScheduleAssignmentDoc,
  buildSessionDoc,
  parseSlotAssignmentConfig,
  parseSlotDeadline,
  scheduleAssignmentDocId,
  type WeeklySlot,
} from '../src/classSchedule'

const SLOT: WeeklySlot = {
  id: 'weekly-abc',
  collegeId: 'college-1',
  subject: 'Data Structures',
  subjectCode: 'BCA301',
  facultyId: 'faculty-9',
  facultyName: 'Dr. Rao',
  branch: 'BCA',
  batch: '2026',
  semester: 3,
  division: 'A',
  room: 'LH-201',
  dayOfWeek: 'monday',
  startTime: '09:00',
  endTime: '10:00',
  type: 'lecture',
  isActive: true,
}

describe('scheduleAssignmentDocId', () => {
  it('is deterministic per slot so reruns cannot create a second draft', () => {
    assert.equal(scheduleAssignmentDocId('weekly-abc'), 'sched-assign-weekly-abc')
    assert.equal(scheduleAssignmentDocId('weekly-abc'), scheduleAssignmentDocId('weekly-abc'))
  })

  it('rejects empty or path-shaped ids', () => {
    assert.throws(() => scheduleAssignmentDocId(''), /required/)
    assert.throws(() => scheduleAssignmentDocId('a/b'), /"/)
  })
})

describe('parseSlotDeadline', () => {
  it('treats a bare date as end-of-day in the college timezone (IST)', () => {
    const parsed = parseSlotDeadline('2026-09-21')
    assert.ok(parsed)
    assert.equal(parsed!.getTime(), new Date('2026-09-21T23:59:59+05:30').getTime())
  })

  it('accepts full ISO strings and Timestamps', () => {
    assert.equal(
      parseSlotDeadline('2026-09-21T14:00:00.000Z')?.toISOString(),
      '2026-09-21T14:00:00.000Z'
    )
    const ts = admin.firestore.Timestamp.fromDate(new Date('2026-09-21T05:00:00Z'))
    assert.equal(parseSlotDeadline(ts)?.toISOString(), '2026-09-21T05:00:00.000Z')
  })

  it('returns null for junk instead of throwing', () => {
    assert.equal(parseSlotDeadline(''), null)
    assert.equal(parseSlotDeadline('soon'), null)
    assert.equal(parseSlotDeadline(undefined), null)
  })
})

describe('parseSlotAssignmentConfig', () => {
  it('accepts a valid config written by the admin form', () => {
    const config = parseSlotAssignmentConfig({
      ...SLOT,
      assignment: { title: 'Week 4 worksheet', maxScore: 20, deadline: '2026-09-21' },
    })
    assert.deepEqual(
      { title: config?.title, maxScore: config?.maxScore },
      { title: 'Week 4 worksheet', maxScore: 20 }
    )
    assert.ok(config)
  })

  it('returns null when the slot has no assignment config', () => {
    assert.equal(parseSlotAssignmentConfig(SLOT), null)
    assert.equal(parseSlotAssignmentConfig({ ...SLOT, assignment: null }), null)
  })

  it('rejects configs that would violate the assignment authoring rules', () => {
    assert.equal(parseSlotAssignmentConfig({ ...SLOT, assignment: { maxScore: 20, deadline: '2026-09-21' } }), null)
    assert.equal(
      parseSlotAssignmentConfig({ ...SLOT, assignment: { title: 'ab', maxScore: 20, deadline: '2026-09-21' } }),
      null
    )
    assert.equal(
      parseSlotAssignmentConfig({ ...SLOT, assignment: { title: 'Good title', maxScore: 0, deadline: '2026-09-21' } }),
      null
    )
    assert.equal(
      parseSlotAssignmentConfig({ ...SLOT, assignment: { title: 'Good title', maxScore: 20, deadline: 'never' } }),
      null
    )
  })
})

describe('buildScheduleAssignmentDoc', () => {
  const config = parseSlotAssignmentConfig({
    ...SLOT,
    assignment: { title: 'Week 4 worksheet', maxScore: 20, deadline: '2026-09-21' },
  })!

  it('targets the cohort the class is timetabled for, as a draft', () => {
    const doc = buildScheduleAssignmentDoc(SLOT, config, 'uid-faculty-9')
    assert.equal(doc.status, 'draft')
    assert.equal(doc.targetType, 'cohort')
    assert.deepEqual(doc.cohort, { branch: 'BCA', batch: '2026', division: 'A', semester: 3 })
    assert.equal(doc.scheduleId, 'weekly-abc')
    assert.equal(doc.source, 'weekly-schedule')
    assert.equal(doc.facultyUid, 'uid-faculty-9')
    assert.equal(doc.facultyName, 'Dr. Rao')
    assert.equal(doc.collegeId, 'college-1')
    assert.equal(doc.submissionCount, 0)
  })

  it('stores the deadline as a Firestore Timestamp (end-of-day for date-only)', () => {
    const doc = buildScheduleAssignmentDoc(SLOT, config, 'uid') as { deadline: unknown }
    assert.ok(doc.deadline instanceof admin.firestore.Timestamp)
    assert.equal(doc.deadline.toDate().getTime(), new Date('2026-09-21T23:59:59+05:30').getTime())
  })

  it('drops empty cohort dimensions rather than writing blank filters', () => {
    const sparse = buildScheduleAssignmentDoc(
      { ...SLOT, division: '', semester: 0, subjectCode: '' },
      config,
      'uid'
    )
    assert.deepEqual(sparse.cohort, { branch: 'BCA', batch: '2026' })
  })
})

describe('buildSessionDoc assignment backlink', () => {
  it('carries the assignment id when the slot is configured', () => {
    const doc = buildSessionDoc(SLOT, '2026-09-14', new Date(Date.UTC(2026, 8, 1)), 'sched-assign-weekly-abc')
    assert.equal(doc.assignmentId, 'sched-assign-weekly-abc')
  })

  it('omits the field entirely for unconfigured slots', () => {
    const doc = buildSessionDoc(SLOT, '2026-09-14', new Date(Date.UTC(2026, 8, 1)))
    assert.equal('assignmentId' in doc, false)
  })
})
