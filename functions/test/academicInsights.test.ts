// functions/test/academicInsights.test.ts
// ─── Pure-helper coverage for the academic insights drill-down ─────────────
//
// No Firestore emulator here — the tested core is the deterministic part:
// the three-writer subject join, the assessment type buckets, submission
// stats, the semester grouping/rollups and the per-student join that turns
// attendance + submissions into ranked rows.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assessmentBelongsToSubject,
  assessmentTypeBucket,
  buildStudentRows,
  groupIntoSemesters,
  matchesSubject,
  rollupSubjects,
  sessionBelongsToSubject,
  submissionStats,
  type StudentSubmissionRow,
  type SubjectInsight,
} from '../src/academicInsights'

function subject(overrides: Partial<SubjectInsight> = {}): SubjectInsight {
  return {
    curriculumId: 'CUR1',
    courseId: 'C1',
    courseCode: 'BBA301',
    courseName: 'Financial Accounting',
    facultyId: 'FAC001',
    facultyName: 'Asha Kumar',
    branch: 'BBA',
    batch: 'A',
    semester: 3,
    credits: 4,
    totalHours: 60,
    modulesCount: 5,
    hoursPlanned: 60,
    hoursDelivered: 30,
    hoursPct: 50,
    classesNeeded: 72,
    topics: { total: 10, covered: 5, pending: 5, pct: 50 },
    modules: [],
    sessions: { total: 20, completed: 12, scheduled: 6, cancelled: 2 },
    pace: { slotsPerWeek: 4, weeksElapsed: 6, expected: 24, completed: 12, pct: 50 },
    attendance: { present: 300, marked: 400, pct: 75 },
    assessments: {
      total: 3,
      published: 2,
      submissions: 90,
      graded: 80,
      avgPct: 66.7,
      byType: { quiz: 1, assignment: 1, exam: 1, other: 0 },
    },
    ...overrides,
  }
}

describe('assessmentTypeBucket', () => {
  it('maps the known types onto the four surfaces', () => {
    assert.equal(assessmentTypeBucket('quiz'), 'quiz')
    assert.equal(assessmentTypeBucket('Quiz 2'), 'quiz')
    assert.equal(assessmentTypeBucket('assignment'), 'assignment')
    assert.equal(assessmentTypeBucket('Lab Assignment'), 'assignment')
    assert.equal(assessmentTypeBucket('mid_term'), 'exam')
    assert.equal(assessmentTypeBucket('end_term'), 'exam')
    assert.equal(assessmentTypeBucket('IA'), 'exam')
    assert.equal(assessmentTypeBucket('mock test'), 'exam')
    assert.equal(assessmentTypeBucket('practice'), 'other')
    assert.equal(assessmentTypeBucket(''), 'other')
    assert.equal(assessmentTypeBucket(undefined), 'other')
  })

  it('does not bucket a "remedial" type as IA', () => {
    assert.equal(assessmentTypeBucket('remedial'), 'other')
  })
})

describe('matchesSubject', () => {
  it('matches on course code when both sides carry one', () => {
    assert.equal(
      matchesSubject({ subject: 'Anything', subjectCode: 'BBA301' }, { courseName: 'Financial Accounting', courseCode: 'BBA301' }),
      true
    )
  })

  it('matches equal names regardless of case and punctuation', () => {
    assert.equal(
      matchesSubject({ subject: 'Financial  Accounting!' }, { courseName: 'financial accounting', courseCode: '' }),
      true
    )
  })

  it('tolerates a longer name on either side', () => {
    assert.equal(
      matchesSubject({ subject: 'Financial Accounting' }, { courseName: 'Financial Accounting (Hons)', courseCode: '' }),
      true
    )
    assert.equal(
      matchesSubject({ subject: 'Financial Accounting (Hons)' }, { courseName: 'Financial Accounting', courseCode: '' }),
      true
    )
  })

  it('rejects unrelated subjects and empty candidates', () => {
    assert.equal(
      matchesSubject({ subject: 'Marketing Management' }, { courseName: 'Financial Accounting', courseCode: 'BBA301' }),
      false
    )
    assert.equal(matchesSubject({ subject: '' }, { courseName: 'Financial Accounting', courseCode: 'BBA301' }), false)
    assert.equal(matchesSubject({}, { courseName: 'Financial Accounting', courseCode: 'BBA301' }), false)
  })
})

describe('sessionBelongsToSubject', () => {
  const target = {
    facultyId: 'FAC001',
    courseName: 'Financial Accounting',
    courseCode: 'BBA301',
    batch: 'A',
    branch: 'BBA',
  }

  it('accepts a matching session', () => {
    assert.equal(
      sessionBelongsToSubject(
        { subject: 'Financial Accounting', facultyId: 'FAC001', batch: 'A', branch: 'BBA' },
        target
      ),
      true
    )
  })

  it('rejects a different teacher, batch or branch', () => {
    assert.equal(
      sessionBelongsToSubject({ subject: 'Financial Accounting', facultyId: 'FAC002' }, target),
      false
    )
    assert.equal(
      sessionBelongsToSubject({ subject: 'Financial Accounting', facultyId: 'FAC001', batch: 'B' }, target),
      false
    )
    assert.equal(
      sessionBelongsToSubject({ subject: 'Financial Accounting', facultyId: 'FAC001', batch: 'A', branch: 'MBA' }, target),
      false
    )
  })

  it('lets blank session fields through (legacy rows)', () => {
    assert.equal(sessionBelongsToSubject({ subject: 'BBA301' }, target), true)
    assert.equal(sessionBelongsToSubject({ subject: 'Financial Accounting' }, target), true)
  })
})

describe('submissionStats', () => {
  it('summarises graded rows and ignores the ungraded ones', () => {
    const stats = submissionStats([
      { obtained: 80, total: 100, graded: true },
      { obtained: 60, total: 100, graded: true },
      { obtained: 0, total: 100, graded: false },
    ])
    assert.equal(stats.submissions, 3)
    assert.equal(stats.graded, 2)
    assert.equal(stats.avgMarks, 70)
    assert.equal(stats.avgPct, 70)
    assert.equal(stats.highest, 80)
    assert.equal(stats.lowest, 60)
  })

  it('returns zeroes when nothing is graded', () => {
    const stats = submissionStats([{ obtained: 0, total: 100, graded: false }])
    assert.deepEqual(stats, { submissions: 1, graded: 0, avgMarks: 0, avgPct: 0, highest: 0, lowest: 0 })
  })
})

describe('groupIntoSemesters / rollupSubjects', () => {
  it('groups ascending with an Unassigned bucket and correct rollups', () => {
    const semesters = groupIntoSemesters([
      subject(),
      subject({
        curriculumId: 'CUR2',
        courseId: 'C2',
        courseCode: 'BBA302',
        courseName: 'Marketing Management',
        semester: 1,
        topics: { total: 4, covered: 4, pending: 0, pct: 100 },
        attendance: { present: 50, marked: 50, pct: 100 },
        assessments: {
          total: 1,
          published: 1,
          submissions: 10,
          graded: 10,
          avgPct: 80,
          byType: { quiz: 0, assignment: 1, exam: 0, other: 0 },
        },
      }),
      subject({ curriculumId: 'CUR3', semester: 0 }),
      subject({ curriculumId: 'CUR4', courseCode: 'BBA303', courseName: 'Business Law' }),
    ])
    assert.equal(semesters.length, 3)
    assert.equal(semesters[0].semester, 0)
    assert.equal(semesters[0].label, 'Unassigned semester')
    assert.equal(semesters[1].semester, 1)
    assert.equal(semesters[2].semester, 3)
    assert.equal(semesters[2].label, 'Semester 3')

    // Semester 1 carries its single subject's numbers.
    assert.equal(semesters[1].topics.pct, 100)
    assert.equal(semesters[1].attendance.pct, 100)

    // Semester 3: the two identical subjects summed.
    const sem3 = semesters[2]
    assert.equal(sem3.subjectCount, 2)
    assert.equal(sem3.topics.total, 20)
    assert.equal(sem3.topics.covered, 10)
    assert.equal(sem3.sessions.completed, 24)
    assert.equal(sem3.attendance.marked, 800)
  })

  it('weights avgPct by graded submissions across subjects', () => {
    const rollup = rollupSubjects([
      subject({ assessments: { total: 1, published: 1, submissions: 10, graded: 10, avgPct: 50, byType: { quiz: 1, assignment: 0, exam: 0, other: 0 } } }),
      subject({ assessments: { total: 1, published: 1, submissions: 30, graded: 30, avgPct: 90, byType: { quiz: 0, assignment: 0, exam: 1, other: 0 } } }),
    ])
    // (50*10 + 90*30) / 40 = 80
    assert.equal(rollup.assessments.avgPct, 80)
    assert.equal(rollup.assessments.graded, 40)
    assert.equal(rollup.assessments.byType.quiz, 1)
    assert.equal(rollup.assessments.byType.exam, 1)
  })
})

describe('buildStudentRows', () => {
  const sub = (over: Partial<StudentSubmissionRow> = {}): StudentSubmissionRow => ({
    assessmentId: 'A1',
    title: 'Quiz 1',
    type: 'quiz',
    bucket: 'quiz',
    marksObtained: 8,
    totalMarks: 10,
    pct: 80,
    status: 'graded',
    ...over,
  })

  it('joins attendance and submissions into ranked rows', () => {
    const rows = buildStudentRows(
      [
        { id: 'S1', name: 'Anil', regNo: 'BBA01', semester: 3, branch: 'BBA', batch: 'A' },
        { id: 'S2', name: 'Bina', regNo: 'BBA02', semester: 3, branch: 'BBA', batch: 'A' },
        { id: 'S3', name: 'Chetan', regNo: 'BBA03', semester: 3, branch: 'BBA', batch: 'A' },
      ],
      new Map([
        ['S1', { present: 9, marked: 10 }],
        ['S2', { present: 5, marked: 10 }],
      ]),
      new Map([
        [
          'S1',
          [
            sub(),
            sub({ assessmentId: 'A2', title: 'Mid Term', type: 'mid_term', bucket: 'exam', marksObtained: 70, totalMarks: 100, pct: 70 }),
          ],
        ],
        ['S2', [sub({ marksObtained: 4, totalMarks: 10, pct: 40 })]],
      ])
    )

    // Ranked: S1 (avg 75) before S2 (avg 40) before ungraded S3.
    assert.deepEqual(
      rows.map((row) => row.studentId),
      ['S1', 'S2', 'S3']
    )

    const s1 = rows[0]
    assert.equal(s1.attendance.pct, 90)
    assert.equal(s1.avgPct, 75)
    assert.equal(s1.totals.obtained, 78)
    assert.equal(s1.totals.max, 110)
    assert.equal(s1.submissions.length, 2)
    // Submissions sorted by title: 'Mid Term' before 'Quiz 1'.
    assert.equal(s1.submissions[0].title, 'Mid Term')

    const s3 = rows[2]
    assert.equal(s3.avgPct, null)
    assert.equal(s3.totals.pct, null)
    assert.equal(s3.attendance.marked, 0)
  })
})
