// src/shared/api/academicContext.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Covers the frontend contract of the Phase 1 deterministic academic
// context callables: the `{ enabled: false }` feature gate, response
// mapping/coercion, the paper-candidate safety whitelist, and the
// unauthenticated/permission/failed-precondition error mapping.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  describeAcademicContextError,
  isFacultyAssignmentPending,
  isFacultyAssessmentUpcoming,
  normaliseDateKey,
  normaliseFacultyAcademicContextResponse,
  normalisePaperAcademicContextResponse,
  normaliseStudentAcademicContextResponse,
  sortTestsByStart,
  todayDateKey,
} from './academicContext'

describe('academic context feature gate', () => {
  it('maps a disabled backend response to enabled:false with no context', () => {
    const student = normaliseStudentAcademicContextResponse({ enabled: false })
    const faculty = normaliseFacultyAcademicContextResponse({ enabled: false })
    const paper = normalisePaperAcademicContextResponse({ enabled: false })
    for (const response of [student, faculty, paper]) {
      assert.equal(response.enabled, false)
      assert.equal('context' in response, false)
    }
  })

  it('treats a missing or malformed gate as disabled rather than crashing', () => {
    assert.equal(normaliseStudentAcademicContextResponse(null).enabled, false)
    assert.equal(normaliseStudentAcademicContextResponse(undefined).enabled, false)
    assert.equal(normaliseStudentAcademicContextResponse({}).enabled, false)
    assert.equal(normaliseStudentAcademicContextResponse('nope').enabled, false)
    assert.equal(normaliseFacultyAcademicContextResponse({ enabled: 'true' }).enabled, false)
  })
})

describe('student academic context mapping', () => {
  it('maps enabled responses into typed deterministic views', () => {
    const response = normaliseStudentAcademicContextResponse({
      enabled: true,
      context: {
        kind: 'student',
        generatedFor: '2026-09-21',
        collegeId: 'c1',
        student: { id: 's1', collegeId: 'c1', name: 'Test Student', branch: 'BCA', batch: '2026', semester: 3, section: 'A' },
        classes: [
          { id: 'cls-1', date: '2026-09-21', startTime: '09:00', subject: 'DBMS', facultyName: 'Dr Rao', room: '101', topicsCovered: ['Joins', 'Indexes'] },
        ],
        pendingAssignments: [
          { id: 'a1', title: 'ER Diagram', dueDate: '2026-09-23T00:00:00.000Z', status: 'published' },
        ],
        upcomingTests: [
          { id: 't1', title: 'Midterm', startDateTime: '2026-09-25T09:00:00.000Z', status: 'published' },
        ],
        curriculum: [
          { id: 'cur-1', courseCode: 'CS301', courseName: 'DBMS', status: 'approved', semester: 3, modules: [{}, {}] },
        ],
        attendance: {
          records: [{ date: '2026-09-18T00:00:00.000Z', status: 'present' }, { date: '2026-09-19', status: 'absent' }],
          present: 1,
          absent: 1,
          percentage: 50,
        },
      },
    })

    assert.equal(response.enabled, true)
    if (!response.enabled) return
    const context = response.context
    assert.equal(context.kind, 'student')
    assert.equal(context.student.name, 'Test Student')
    assert.equal(context.classes[0].subject, 'DBMS')
    assert.deepEqual(context.classes[0].topics, ['Joins', 'Indexes'])
    assert.equal(context.pendingAssignments[0].title, 'ER Diagram')
    assert.equal(context.upcomingTests[0].startDateTime, '2026-09-25T09:00:00.000Z')
    assert.equal(context.curriculum[0].moduleCount, 2)
    assert.equal(context.attendance.percentage, 50)
    assert.equal(context.attendance.records[0].date, '2026-09-18')
  })

  it('keeps empty lists as empty lists and attendance percentage null', () => {
    const response = normaliseStudentAcademicContextResponse({
      enabled: true,
      context: {
        kind: 'student', generatedFor: '2026-09-21', collegeId: 'c1', student: { id: 's1', collegeId: 'c1' },
        classes: [], pendingAssignments: [], upcomingTests: [], curriculum: [],
        attendance: { records: [], present: 0, absent: 0, percentage: null },
      },
    })
    assert.ok(response.enabled)
    if (!response.enabled) return
    assert.deepEqual(response.context.classes, [])
    assert.equal(response.context.attendance.percentage, null)
    assert.equal(response.context.attendance.present, 0)
  })

  it('sorts tests soonest-first without mutating the source array', () => {
    const tests = [
      { id: 'late', title: 'Late', startDateTime: '2026-10-01T09:00:00Z' },
      { id: 'soon', title: 'Soon', startDateTime: '2026-09-22T09:00:00Z' },
      { id: 'unscheduled', title: 'TBD', startDateTime: '' },
    ]
    const sorted = sortTestsByStart(tests)
    assert.deepEqual(sorted.map((t) => t.id), ['soon', 'late', 'unscheduled'])
    assert.equal(tests[0].id, 'late')
  })
})

describe('faculty academic context mapping', () => {
  const facultyPayload = {
    enabled: true,
    context: {
      kind: 'faculty',
      generatedFor: '2026-09-21',
      collegeId: 'c1',
      facultyId: 'f1',
      courses: [
        { id: 'course-1', courseCode: 'CS301', courseName: 'DBMS', modules: [{}] },
        { id: 'course-2', courseCode: 'CS302', courseName: 'OS', modules: [] },
      ],
      completedTopics: ['Normalization'],
      upcomingSessions: [
        { id: 'ses-1', date: '2026-09-22', courseId: 'course-1', courseCode: 'CS301', topicNames: ['Joins'] },
      ],
      assignmentHistory: [
        { id: 'as-1', courseId: 'course-1', courseCode: 'CS301', title: 'Worksheet', dueDate: '2026-09-25', status: 'published' },
        { id: 'as-2', courseId: 'course-1', courseCode: 'CS301', title: 'Old worksheet', status: 'graded' },
      ],
      assessmentHistory: [
        { id: 'as-3', courseId: 'course-1', courseCode: 'CS301', title: 'Quiz 1', scheduledAt: '2026-09-24T09:00:00Z', status: 'published' },
        { id: 'as-4', courseId: 'course-2', courseCode: 'CS302', title: 'Old quiz', scheduledAt: '2026-09-01T09:00:00Z', status: 'completed' },
      ],
    },
  }

  it('maps courses, sessions, assignments and assessments', () => {
    const response = normaliseFacultyAcademicContextResponse(facultyPayload)
    assert.ok(response.enabled)
    if (!response.enabled) return
    const context = response.context
    assert.equal(context.kind, 'faculty')
    assert.equal(context.courses.length, 2)
    assert.equal(context.courses[0].courseCode, 'CS301')
    assert.equal(context.upcomingSessions[0].topicNames?.[0], 'Joins')
    assert.equal(context.assignmentHistory.length, 2)
    assert.equal(context.assessmentHistory.length, 2)
    assert.deepEqual(context.completedTopics, ['Normalization'])
  })

  it('classifies pending assignments and upcoming assessments deterministically', () => {
    const response = normaliseFacultyAcademicContextResponse(facultyPayload)
    if (!response.enabled) return
    const context = response.context
    const pending = context.assignmentHistory.filter(isFacultyAssignmentPending)
    assert.deepEqual(pending.map((a) => a.id), ['as-1'])

    const upcoming = context.assessmentHistory.filter((a) => isFacultyAssessmentUpcoming(a, '2026-09-21'))
    assert.deepEqual(upcoming.map((a) => a.id), ['as-3'])
  })

  it('keeps published assessments without a date in the upcoming view', () => {
    assert.equal(isFacultyAssessmentUpcoming({ id: 'x', title: 'TBD', status: 'published' }, '2026-09-21'), true)
    assert.equal(isFacultyAssessmentUpcoming({ id: 'x', title: 'Old', scheduledAt: '2026-09-20', status: 'ongoing' }, '2026-09-21'), false)
    assert.equal(isFacultyAssessmentUpcoming({ id: 'x', title: 'Cancelled', status: 'cancelled' }, '2026-09-21'), false)
  })
})

describe('paper academic context mapping', () => {
  it('maps only safe candidate metadata — never question text or answer keys', () => {
    const response = normalisePaperAcademicContextResponse({
      enabled: true,
      context: {
        kind: 'paper',
        generatedFor: '2026-09-21',
        collegeId: 'c1',
        course: { id: 'course-1', courseCode: 'CS301', courseName: 'DBMS', modules: [] },
        candidates: [
          {
            id: 'q1', courseCode: 'CS301', difficulty: 'easy', bloomsLevel: 'remember',
            // The backend spreads the full question document; these restricted
            // fields must be dropped by the normaliser.
            questionText: 'SECRET QUESTION', correctAnswer: 'SECRET ANSWER', options: ['a', 'b'],
            approved: true,
          },
          { id: 'q2', approved: false, difficulty: 'hard' },
        ],
        blueprint: { totalQuestions: 5, totalMarks: 50, sections: [{ name: 'Section A', count: 3, marks: 6 }] },
        recentlyUsedQuestionIds: ['q9'],
        distributions: { difficulty: { easy: 1, hard: 1 }, blooms: { remember: 1 } },
      },
    })

    assert.ok(response.enabled)
    if (!response.enabled) return
    const context = response.context
    assert.equal(context.kind, 'paper')
    assert.equal(context.course?.courseCode, 'CS301')
    assert.equal(context.candidates.length, 2)
    assert.deepEqual(Object.keys(context.candidates[0]).sort(), [
      'approved', 'bloomsLevel', 'courseCode', 'difficulty', 'id',
    ])
    assert.equal(JSON.stringify(context.candidates[0]).includes('SECRET'), false)
    assert.equal(context.blueprint?.totalQuestions, 5)
    assert.deepEqual(context.distributions.difficulty, { easy: 1, hard: 1 })
  })
})

describe('academic context error mapping', () => {
  it('maps unauthenticated, permission and precondition codes to clean messages', () => {
    const cases: Array<[string, string]> = [
      ['functions/unauthenticated', 'session has expired'],
      ['functions/permission-denied', 'does not have access'],
      ['functions/failed-precondition', 'not linked to a valid college/student identity'],
      ['functions/unavailable', 'temporarily unavailable'],
    ]
    for (const [code, fragment] of cases) {
      const error = Object.assign(new Error('server message'), { code })
      assert.match(describeAcademicContextError(error), new RegExp(fragment, 'i'))
    }
  })

  it('uses student-friendly overrides on the student surface', () => {
    const error = Object.assign(new Error('Faculty access is required'), { code: 'functions/permission-denied' })
    assert.match(describeAcademicContextError(error, 'fallback', 'student'), /linked student account/i)
    assert.match(describeAcademicContextError(error, 'fallback', 'faculty'), /does not have access/i)
  })

  it('falls back to the error message, then the provided fallback', () => {
    assert.equal(describeAcademicContextError(new Error('boom')), 'boom')
    assert.equal(describeAcademicContextError('mystery', 'fallback text'), 'fallback text')
  })
})

describe('request date handling', () => {
  it('produces a yyyy-mm-dd local date key', () => {
    assert.match(todayDateKey(new Date(2026, 8, 21)), /^2026-09-21$/)
    assert.match(todayDateKey(new Date(2026, 0, 5)), /^2026-01-05$/)
  })

  it('accepts only well-formed yyyy-mm-dd request dates', () => {
    assert.equal(normaliseDateKey('2026-09-21'), '2026-09-21')
    assert.equal(normaliseDateKey(' 2026-09-21 '), '2026-09-21')
    assert.equal(normaliseDateKey('21-09-2026'), undefined)
    assert.equal(normaliseDateKey(''), undefined)
    assert.equal(normaliseDateKey(undefined), undefined)
  })
})
