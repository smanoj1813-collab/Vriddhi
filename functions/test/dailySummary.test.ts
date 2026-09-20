import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildStudentAcademicContext } from '../src/academic/context'
import { buildStudentDailySummary } from '../src/academic/dailySummary'

describe('phase 2 deterministic daily summary', () => {
  it('separates overdue work, sorts upcoming tests and raises attendance alert', () => {
    const context = buildStudentAcademicContext({
      date: '2026-09-21',
      student: { id: 's1', collegeId: 'c1', semester: 3 },
      classes: [{ id: 'class-1', date: '2026-09-21', startTime: '09:00', subject: 'DBMS' }],
      assignments: [
        { id: 'future', title: 'Future', dueDate: '2026-09-25', status: 'assigned' },
        { id: 'overdue', title: 'Overdue', dueDate: '2026-09-20', status: 'assigned' },
        { id: 'submitted', title: 'Submitted', dueDate: '2026-09-19', status: 'submitted' },
      ],
      tests: [
        { id: 'later', title: 'Later', startDateTime: '2026-09-23T09:00:00Z', status: 'published' },
        { id: 'soon', title: 'Soon', startDateTime: '2026-09-21T12:00:00Z', status: 'published' },
      ],
      curriculum: [],
      attendance: [{ date: '2026-09-19', status: 'present' }, { date: '2026-09-20', status: 'absent' }],
    })
    const summary = buildStudentDailySummary(context, {
      date: '2026-09-21', attendanceThreshold: 75, generatedAt: '2026-09-21T06:00:00Z',
    })
    assert.deepEqual(summary.classes.map((item) => item.id), ['class-1'])
    assert.deepEqual(summary.pendingAssignments.map((item) => item.id), ['overdue', 'future'])
    assert.deepEqual(summary.overdueAssignments.map((item) => item.id), ['overdue'])
    assert.deepEqual(summary.upcomingTests.map((item) => item.id), ['soon', 'later'])
    assert.equal(summary.attendanceAlert.status, 'warning')
    assert.equal(summary.generatedAt, '2026-09-21T06:00:00Z')
  })

  it('uses the server date and keeps all flags/configuration outside the builder', () => {
    const context = buildStudentAcademicContext({
      date: '2026-09-21', student: { id: 's1', collegeId: 'c1' }, classes: [],
      assignments: [{ id: 'a', title: 'Assignment', dueDate: '2026-09-21T23:59:00Z', status: 'assigned' }],
      tests: [], curriculum: [], attendance: [],
    })
    const summary = buildStudentDailySummary(context, { date: '2026-09-21' })
    assert.equal(summary.overdueAssignments.length, 0)
    assert.equal(summary.attendanceAlert.status, 'ok')
    assert.equal(summary.sourceVersion, 1)
  })
})
