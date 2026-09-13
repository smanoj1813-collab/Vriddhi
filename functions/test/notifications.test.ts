import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  announcementTargetsStudent,
  serialize,
  type NotificationStudent,
} from '../src/notifications'

// The announcement panel was broken because the composer addressed a cohort
// while both readers looked for a per-student field that was never written.
// These cases pin the targeting decision so a message addressed to a batch and
// branch actually reaches the students in it — and nobody else's.

function student(overrides: Partial<NotificationStudent> = {}): NotificationStudent {
  return {
    uid: 'uid-1',
    studentId: 'student-1',
    collegeId: 'college-a',
    branch: 'CSE',
    batch: '2026',
    division: 'A',
    semester: 5,
    ...overrides,
  }
}

describe('announcement targeting', () => {
  it('delivers a college-wide broadcast to every student in that college', () => {
    assert.equal(
      announcementTargetsStudent({ collegeId: 'college-a', audience: 'all' }, student()),
      true
    )
  })

  it('never delivers across tenants, even for a broadcast', () => {
    assert.equal(
      announcementTargetsStudent({ collegeId: 'college-b', audience: 'all' }, student()),
      false
    )
  })

  it('delivers to a student inside the selected batch and branch', () => {
    assert.equal(
      announcementTargetsStudent(
        {
          collegeId: 'college-a',
          audience: 'cohort',
          cohort: { branches: ['CSE'], batches: ['2026'], division: '', semester: 0 },
        },
        student()
      ),
      true
    )
  })

  it('excludes a student in the same batch but a different branch', () => {
    assert.equal(
      announcementTargetsStudent(
        {
          collegeId: 'college-a',
          audience: 'cohort',
          cohort: { branches: ['CSE'], batches: ['2026'], division: '', semester: 0 },
        },
        student({ branch: 'ECE' })
      ),
      false
    )
  })

  it('excludes a student in the same branch but a different batch', () => {
    assert.equal(
      announcementTargetsStudent(
        {
          collegeId: 'college-a',
          audience: 'cohort',
          cohort: { branches: ['CSE'], batches: ['2027'], division: '', semester: 0 },
        },
        student()
      ),
      false
    )
  })

  it('treats an empty cohort as addressing nobody, not everybody', () => {
    assert.equal(
      announcementTargetsStudent(
        { collegeId: 'college-a', audience: 'cohort', cohort: { branches: [], batches: [], division: '', semester: 0 } },
        student()
      ),
      false
    )
  })

  it('matches a single dimension alone, so a branch-only send reaches every batch', () => {
    const cohortOnlyBranch = {
      collegeId: 'college-a',
      audience: 'cohort',
      cohort: { branches: ['CSE'], batches: [], division: '', semester: 0 },
    }
    assert.equal(announcementTargetsStudent(cohortOnlyBranch, student({ batch: '2025' })), true)
    assert.equal(announcementTargetsStudent(cohortOnlyBranch, student({ batch: '2029' })), true)
  })

  it('satisfies a dimension when any of its values matches', () => {
    assert.equal(
      announcementTargetsStudent(
        {
          collegeId: 'college-a',
          audience: 'cohort',
          cohort: { branches: ['CSE', 'ISE'], batches: ['2025', '2026'], division: '', semester: 0 },
        },
        student({ branch: 'ISE', batch: '2025' })
      ),
      true
    )
  })

  it('matches program names across importer formatting (B.B.A = BBA = " bba ")', () => {
    const announcement = {
      collegeId: 'college-a',
      audience: 'cohort',
      cohort: { branches: ['B.B.A'], batches: [], division: '', semester: 0 },
    }
    assert.equal(announcementTargetsStudent(announcement, student({ branch: 'BBA' })), true)
    assert.equal(announcementTargetsStudent(announcement, student({ branch: ' bba ' })), true)
    assert.equal(announcementTargetsStudent(announcement, student({ branch: 'BCA' })), false)
  })

  it('matches batches across number and string storage', () => {
    assert.equal(
      announcementTargetsStudent(
        { collegeId: 'college-a', audience: 'cohort', cohort: { branches: [], batches: [2026], division: '', semester: 0 } },
        student({ batch: '2026' })
      ),
      true
    )
  })

  it('matches divisions written as "A", "div A" and "Div. A"', () => {
    const announcement = {
      collegeId: 'college-a',
      audience: 'cohort',
      cohort: { branches: [], batches: [], division: 'Div. A', semester: 0 },
    }
    assert.equal(announcementTargetsStudent(announcement, student({ division: 'A' })), true)
    assert.equal(announcementTargetsStudent(announcement, student({ division: 'div a' })), true)
    assert.equal(announcementTargetsStudent(announcement, student({ division: 'B' })), false)
  })

  it('delivers an explicitly targeted message only to the named students', () => {
    const announcement = {
      collegeId: 'college-a',
      audience: 'specific',
      studentIds: ['student-9'],
      studentUids: [],
    }
    assert.equal(announcementTargetsStudent(announcement, student()), false)
    assert.equal(announcementTargetsStudent(announcement, student({ studentId: 'student-9' })), true)
  })

  it('refuses an unknown audience rather than defaulting to delivery', () => {
    assert.equal(
      announcementTargetsStudent({ collegeId: 'college-a', audience: 'everyone-important' }, student()),
      false
    )
  })
})

// ── Writer → reader field contract ───────────────────────────────────────────
//
// This is the regression that broke the panel: the composer wrote `target` and
// `batchFilter`, one reader queried `where studentId == <me>`, and the other
// queried a different collection entirely. Nothing arrived, and no type error
// was raised because every field was optional. The document below is exactly
// what `sendAnnouncement` creates; these cases assert the reader understands it.

/** The literal document shape `sendAnnouncement` writes for a cohort send. */
const writtenCohortAnnouncement = {
  collegeId: 'college-a',
  title: 'Internal Assessment 2 schedule released',
  message: 'Check the portal for your slot.',
  type: 'warning',
  category: 'exam',
  priority: 'high',
  audience: 'cohort',
  cohort: { branches: ['CSE'], batches: ['2026'], division: '', semester: 0 },
  pinned: false,
  sentBy: 'Bala Kumar',
  sentByName: 'Bala Kumar',
  createdBy: 'faculty-1',
  recipientCount: 42,
  readCount: 0,
  createdAt: new Date('2026-09-10T09:30:00.000Z'),
}

describe('announcement writer/reader contract', () => {
  it('routes a written cohort announcement to the students it names', () => {
    assert.equal(announcementTargetsStudent(writtenCohortAnnouncement, student()), true)
    assert.equal(
      announcementTargetsStudent(writtenCohortAnnouncement, student({ branch: 'MECH' })),
      false
    )
  })

  it('exposes every field the student panel renders', () => {
    const view = serialize('ann-1', writtenCohortAnnouncement, false)
    assert.equal(view.id, 'ann-1')
    assert.equal(view.title, 'Internal Assessment 2 schedule released')
    assert.equal(view.message, 'Check the portal for your slot.')
    assert.equal(view.type, 'warning')
    assert.equal(view.priority, 'high')
    assert.equal(view.category, 'exam')
    assert.equal(view.recipientCount, 42)
    assert.equal(view.read, false)
    // The panel sorts and displays by this; it must not be null for a written doc.
    assert.equal(view.createdAt, '2026-09-10T09:30:00.000Z')
    assert.equal(view.sentByName, 'Bala Kumar')
  })

  it('reports the cohort in the shape the faculty list displays', () => {
    const view = serialize('ann-1', writtenCohortAnnouncement, false)
    assert.deepEqual(view.cohort, {
      branches: ['CSE'],
      batches: ['2026'],
      division: '',
      semester: 0,
    })
    assert.equal(view.audience, 'cohort')
  })

  it('carries per-recipient read state instead of a shared flag', () => {
    assert.equal(serialize('ann-1', writtenCohortAnnouncement, false).read, false)
    assert.equal(serialize('ann-1', writtenCohortAnnouncement, true).read, true)
    // The document itself holds no `read` field any more — that shared flag is
    // what let one student clear the badge for the whole college.
    assert.ok(!('read' in writtenCohortAnnouncement))
  })

  it('falls back to a safe type and audience for legacy rows', () => {
    const legacy = serialize('legacy', { collegeId: 'college-a', title: 'Old', message: 'Row' }, false)
    assert.equal(legacy.type, 'info')
    assert.equal(legacy.audience, 'cohort')
    assert.equal(legacy.cohort, null)
    assert.equal(legacy.priority, 'normal')
    assert.equal(legacy.createdAt, null)
  })
})
