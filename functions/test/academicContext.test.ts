import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildFacultyAcademicContext,
  buildPaperAcademicContext,
  buildStudentAcademicContext,
} from '../src/academic/context'
import { academicFeaturesEnabled, DEFAULT_ACADEMIC_FEATURE_FLAGS } from '../src/academic/featureFlags'

describe('phase 1 deterministic student context', () => {
  it('scopes cohort data, excludes submitted work, and computes attendance', () => {
    const context = buildStudentAcademicContext({
      date: '2026-09-21',
      student: { id: 's1', collegeId: 'c1', branch: 'BCA', batch: '2026', semester: 3, section: 'A' },
      classes: [
        { id: 'later', date: '2026-09-21', startTime: '11:00', section: 'A' },
        { id: 'other-section', date: '2026-09-21', startTime: '09:00', section: 'B' },
        { id: 'other-day', date: '2026-09-22', startTime: '08:00', section: 'A' },
      ],
      assignments: [
        { id: 'pending', title: 'Pending', dueDate: '2026-09-23', status: 'assigned' },
        { id: 'submitted', title: 'Done', dueDate: '2026-09-20', submitted: true },
      ],
      tests: [{ id: 'test-1', title: 'Midterm', startDateTime: '2026-09-25T09:00:00Z', status: 'published' }],
      curriculum: [{ id: 'cur-1', courseCode: 'CS301', courseName: 'DBMS', status: 'approved', semester: 3, modules: [] }],
      attendance: [{ date: '2026-09-18', status: 'present' }, { date: '2026-09-19', status: 'absent' }],
    })
    assert.deepEqual(context.classes.map((item) => item.id), ['later'])
    assert.deepEqual(context.pendingAssignments.map((item) => item.id), ['pending'])
    assert.equal(context.attendance.percentage, 50)
    assert.equal(context.curriculum[0].courseCode, 'CS301')
  })
})

describe('phase 1 deterministic faculty and paper context', () => {
  it('filters faculty context to the requested course and future sessions', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', courseId: 'course-1', today: '2026-09-21',
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'CS301', courseName: 'DBMS', modules: [] }],
      sessions: [
        { id: 'future', date: '2026-09-22', courseId: 'course-1' },
        { id: 'past', date: '2026-09-20', courseId: 'course-1' },
        { id: 'other', date: '2026-09-22', courseId: 'course-2' },
      ],
      assignments: [{ id: 'a1', title: 'Quiz', courseId: 'course-1' }],
      assessments: [], completedTopics: ['Normalization', 'Normalization'],
    })
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['future'])
    assert.deepEqual(context.completedTopics, ['Normalization'])
  })

  it('keeps only approved paper candidates and returns distributions', () => {
    const context = buildPaperAcademicContext({
      generatedFor: '2026-09-21', collegeId: 'c1', course: null, blueprint: { totalQuestions: 2 },
      candidates: [
        { id: 'q1', approved: true, difficulty: 'easy', bloomsLevel: 'remember' },
        { id: 'q2', approved: false, difficulty: 'hard', bloomsLevel: 'apply' },
        { id: 'q3', approved: true, difficulty: 'hard', bloomsLevel: 'apply', usedAt: '2026-09-20' },
      ],
    })
    assert.deepEqual(context.candidates.map((item) => item.id), ['q1', 'q3'])
    assert.deepEqual(context.distributions.difficulty, { easy: 1, hard: 1 })
    assert.deepEqual(context.recentlyUsedQuestionIds, ['q3'])
  })
})

describe('academic feature safety defaults', () => {
  it('keeps all Phase 1 and Phase 2 flags disabled by default', () => {
    assert.deepEqual(academicFeaturesEnabled(), DEFAULT_ACADEMIC_FEATURE_FLAGS)
    assert.equal(academicFeaturesEnabled({ academicIntelligenceEnabled: true }).studentDailySummaryEnabled, false)
  })
})
