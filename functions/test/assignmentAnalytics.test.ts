// functions/test/assignmentAnalytics.test.ts
// ─── Assignment completion analytics: pure-computation coverage ─────────────
//
// The report answers "what percentage of each course/module/batch/division
// has actually submitted". The denominator (expected) comes from the student
// roster and the cohort/specific matching — so these tests pin that matching
// and the percentage math, including the resubmission dedupe and the overdue
// alert rule (past deadline AND still missing AND not closed/graded).

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  analyticsAssignmentTargetsStudent,
  buildAssignmentAnalytics,
  computeAssignmentCompletion,
  expectedStudentCount,
  parseAnalyticsAssignment,
  parseAnalyticsSubmission,
  SUBMITTED_STATUSES,
  type AnalyticsAssignment,
  type AnalyticsStudent,
  type AnalyticsSubmission,
} from '../src/assignmentAnalytics'

const NOW = Date.parse('2026-09-15T00:00:00Z')

function student(overrides: Partial<AnalyticsStudent> = {}): AnalyticsStudent {
  return {
    id: 'stu-1',
    collegeId: 'college-1',
    branch: 'BCA',
    batch: '2026',
    division: 'A',
    semester: 3,
    ...overrides,
  }
}

function assignment(overrides: Partial<AnalyticsAssignment> = {}): AnalyticsAssignment {
  return {
    id: 'a-1',
    title: 'Week 4 worksheet',
    status: 'published',
    subject: 'Data Structures',
    subjectCode: 'BCA301',
    deadline: new Date('2026-09-21T23:59:59+05:30'),
    courseName: 'Data Structures',
    moduleId: 'mod-1',
    moduleTitle: 'Trees & Heaps',
    targetType: 'cohort',
    cohort: { branch: 'BCA', batch: '2026', division: 'A', semester: 3 },
    studentIds: [],
    ...overrides,
  }
}

function submission(overrides: Partial<AnalyticsSubmission> = {}): AnalyticsSubmission {
  return {
    id: 's-1',
    assignmentId: 'a-1',
    studentId: 'stu-1',
    status: 'submitted',
    submittedAt: Date.parse('2026-09-14T10:00:00Z'),
    ...overrides,
  }
}

describe('cohort / specific targeting (denominator)', () => {
  it('matches on every selected dimension, case-insensitively', () => {
    assert.equal(analyticsAssignmentTargetsStudent(assignment(), student()), true)
    assert.equal(
      analyticsAssignmentTargetsStudent(
        assignment({ cohort: { branch: 'bca ', batch: '2026', division: 'a', semester: 0 } }),
        student()
      ),
      true
    )
  })

  it('excludes students outside any one selected dimension', () => {
    const base = assignment()
    assert.equal(analyticsAssignmentTargetsStudent(base, student({ branch: 'MCA' })), false)
    assert.equal(analyticsAssignmentTargetsStudent(base, student({ batch: '2025' })), false)
    assert.equal(analyticsAssignmentTargetsStudent(base, student({ division: 'B' })), false)
    assert.equal(analyticsAssignmentTargetsStudent(base, student({ semester: 5 })), false)
  })

  it('an empty cohort targets nobody (never the whole college)', () => {
    assert.equal(
      analyticsAssignmentTargetsStudent(
        assignment({ cohort: { branch: '', batch: '', division: '', semester: 0 } }),
        student()
      ),
      false
    )
  })

  it('specific targeting uses the student id list', () => {
    const specific = assignment({ targetType: 'specific', studentIds: ['stu-9'] })
    assert.equal(analyticsAssignmentTargetsStudent(specific, student()), false)
    assert.equal(analyticsAssignmentTargetsStudent(specific, student({ id: 'stu-9' })), true)
  })

  it('expectedStudentCount is the roster slice the assignment reached', () => {
    const roster = [
      student(),
      student({ id: 'stu-2', division: 'B' }),
      student({ id: 'stu-3', branch: 'MCA' }),
    ]
    assert.equal(expectedStudentCount(assignment(), roster), 1)
    // batch-only cohort matches all three (stu-3 is also batch 2026)
    assert.equal(expectedStudentCount(assignment({ cohort: { branch: '', batch: '2026', division: '', semester: 0 } }), roster), 3)
  })
})

describe('computeAssignmentCompletion', () => {
  const roster = [student(), student({ id: 'stu-2' })]

  it('counts unique students: a late resubmission does not double-count', () => {
    const subs = [
      submission({ id: 's-1', studentId: 'stu-1', status: 'submitted' }),
      // stu-1 resubmits late (later submittedAt wins the dedupe)
      submission({ id: 's-2', studentId: 'stu-1', status: 'late', submittedAt: NOW }),
      submission({ id: 's-3', studentId: 'stu-2', status: 'graded' }),
    ]
    const result = computeAssignmentCompletion(assignment(), subs, 2, NOW)
    assert.equal(result.submitted, 2)
    assert.equal(result.graded, 1)
    assert.equal(result.late, 1)
    assert.equal(result.missing, 0)
    assert.equal(result.completionPct, 100)
  })

  it('tracks late and graded separately', () => {
    const subs = [
      submission({ id: 's-1', studentId: 'stu-1', status: 'late' }),
      submission({ id: 's-2', studentId: 'stu-2', status: 'graded' }),
    ]
    const result = computeAssignmentCompletion(assignment(), subs, 2, NOW)
    assert.equal(result.late, 1)
    assert.equal(result.graded, 1)
    assert.equal(result.submitted, 2)
  })

  it('only submitted/late/graded statuses count as submitted', () => {
    assert.deepEqual(SUBMITTED_STATUSES, ['submitted', 'late', 'graded'])
    const result = computeAssignmentCompletion(
      assignment(),
      [submission({ status: 'pending' }), submission({ status: 'missing' })],
      2,
      NOW
    )
    assert.equal(result.submitted, 0)
    assert.equal(result.missing, 2)
  })

  it('flags overdue only when the deadline has passed, work is open and someone is missing', () => {
    const past = new Date('2026-09-10T23:59:59+05:30')
    const open = computeAssignmentCompletion(
      assignment({ deadline: past }),
      [submission({ studentId: 'stu-1' })],
      2,
      NOW
    )
    assert.equal(open.overdue, true)
    assert.equal(open.deadlinePassed, true)
    assert.ok(open.overdueDays >= 4)

    const closed = computeAssignmentCompletion(
      assignment({ deadline: past, status: 'closed' }),
      [submission({ studentId: 'stu-1' })],
      2,
      NOW
    )
    assert.equal(closed.overdue, false)

    const future = computeAssignmentCompletion(assignment(), [], 2, NOW)
    assert.equal(future.overdue, false)
    assert.equal(future.deadlinePassed, false)
  })

  it('an empty expected roster yields 0% without dividing by zero', () => {
    const result = computeAssignmentCompletion(assignment(), [], 0, NOW)
    assert.equal(result.completionPct, 0)
    assert.equal(result.missing, 0)
  })
})

describe('buildAssignmentAnalytics', () => {
  const roster = [
    student(), // BCA 2026 A
    student({ id: 'stu-2', division: 'B' }), // BCA 2026 B
    student({ id: 'stu-3', branch: 'MCA', batch: '2026' }), // MCA 2026
  ]
  const assignments = [
    assignment({ id: 'a-1', title: 'DS worksheet' }), // BCA 2026 A
    assignment({
      id: 'a-2',
      title: 'MCA report',
      courseName: 'DBMS',
      moduleTitle: '',
      cohort: { branch: 'MCA', batch: '2026', division: '', semester: 0 },
      deadline: new Date('2026-09-12T23:59:59+05:30'),
    }),
  ]
  // Only a-1 has a submission; a-2's one in-scope student (stu-3) has not
  // submitted, so a-2 is the overdue alert.
  const submissions = [
    submission({ id: 's-1', assignmentId: 'a-1', studentId: 'stu-1', status: 'submitted' }),
  ]

  const summary = buildAssignmentAnalytics(assignments, submissions, roster, NOW)

  it('aggregates the overall completion', () => {
    assert.equal(summary.overall.assignments, 2)
    assert.equal(summary.overall.expected, 2) // 1 (a-1 → stu-1) + 1 (a-2 → stu-3)
    assert.equal(summary.overall.submitted, 1)
    assert.equal(summary.overall.pct, 50)
    assert.equal(summary.overall.missing, 1)
    assert.equal(summary.overall.ungraded, 1)
  })

  it('groups by course using the linked course (subject fallback)', () => {
    const keys = summary.groups.byCourse.map((g) => g.key)
    assert.equal(keys.length, 2)
    assert.ok(keys.includes('Data Structures'))
    assert.ok(keys.includes('DBMS'))
  })

  it('groups by module and skips unlinked assignments', () => {
    assert.deepEqual(summary.groups.byModule.map((g) => g.key), ['Trees & Heaps'])
  })

  it('groups by batch and division from the declared cohort', () => {
    assert.deepEqual(summary.groups.byBatch.map((g) => g.key), ['2026'])
    const byDivision = summary.groups.byDivision.map((g) => g.key)
    assert.ok(byDivision.includes('A'))
    assert.ok(!byDivision.includes('B')) // only a-1 (division A) is division-scoped
  })

  it('raises an overdue alert for the past-deadline MCA report', () => {
    assert.equal(summary.overall.overdue, 1)
    assert.equal(summary.overdueAlerts[0].assignmentId, 'a-2')
    assert.ok(summary.overdueAlerts[0].overdueDays >= 2)
  })

  it('sorts rows by soonest deadline', () => {
    assert.deepEqual(summary.rows.map((r) => r.assignmentId), ['a-2', 'a-1'])
  })
})

describe('document parsing', () => {
  it('parses a legacy-ish assignment document', () => {
    const parsed = parseAnalyticsAssignment('a-1', {
      title: 'Worksheet',
      status: 'ongoing',
      subject: 'DBMS',
      deadline: '2026-10-01',
      courseName: 'Database Systems',
      moduleId: 'm1',
      moduleTitle: 'Normalisation',
      cohort: { branch: 'BCA', batch: '2026', section: 'A' },
      studentIds: ['x', 'y'],
    })
    assert.equal(parsed.status, 'ongoing')
    assert.equal(parsed.cohort.division, 'A') // section fallback
    assert.equal(parsed.targetType, 'cohort')
    assert.ok(parsed.deadline instanceof Date)
  })

  it('parses a submission with a missing submittedAt', () => {
    const parsed = parseAnalyticsSubmission('s-1', { assignmentId: 'a-1', studentId: 'stu-1', status: 'late' })
    assert.equal(parsed.status, 'late')
    assert.equal(parsed.submittedAt, null)
  })
})
