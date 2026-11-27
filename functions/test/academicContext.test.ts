import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildFacultyAcademicContext,
  buildPaperAcademicContext,
  buildStudentAcademicContext,
  facultyCoursesFromCurriculum,
} from '../src/academic/context'
import { academicFeaturesEnabled, DEFAULT_ACADEMIC_FEATURE_FLAGS } from '../src/academic/featureFlags'
import { assignmentTargetsStudent } from '../src/academic/contextCallables'

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

  it('does not keep an ended assessment in the student upcoming list when stored status is stale', () => {
    const context = buildStudentAcademicContext({
      date: '2026-09-21', now: '2026-09-21T12:00:00Z',
      student: { id: 's1', collegeId: 'c1' },
      classes: [], assignments: [], curriculum: [], attendance: [],
      tests: [
        { id: 'ended', title: 'Ended', startDateTime: '2026-09-20T09:00:00Z', endDateTime: '2026-09-20T10:00:00Z', status: 'ongoing' },
        { id: 'open', title: 'Open', startDateTime: '2026-09-21T11:00:00Z', endDateTime: '2026-09-21T13:00:00Z', status: 'ongoing' },
      ],
    })
    assert.deepEqual(context.upcomingTests.map((item) => item.id), ['open'])
  })
})

describe('phase 1 deterministic faculty and paper context', () => {
  it('resolves assigned courses from nested curriculum plans with their modules', () => {
    const plans = [{
      id: 'curriculum-1', collegeId: 'c1', status: 'active', branch: 'BCA', semester: 3,
      // The production curriculum schema stores courses inside the plan doc.
      courses: [{
        id: 'course-1', code: 'CS301', name: 'Database Management Systems',
        modules: [
          { id: 'm1', moduleName: 'Relational model', topics: ['Keys'] },
          { id: 'm2', title: 'SQL', topics: ['Joins'] },
        ],
      }],
    }]
    const courses = facultyCoursesFromCurriculum(plans, [{
      curriculumId: 'curriculum-1', courseId: 'course-1', courseCode: 'CS301',
      courseName: 'Database Management Systems', status: 'active', modulesCount: 2,
    }])
    assert.equal(courses.length, 1)
    assert.equal(courses[0].courseCode, 'CS301')
    assert.equal(courses[0].courseName, 'Database Management Systems')
    assert.equal(courses[0].modules.length, 2)
    assert.equal(courses[0].modules[0].name, 'Relational model')
  })

  it('uses mapping metadata instead of a blank plan wrapper when a legacy curriculum doc is missing', () => {
    const courses = facultyCoursesFromCurriculum([], [{
      curriculumId: 'old-plan', courseId: 'course-9', courseCode: 'ACC101',
      courseName: 'Financial Accounting', modulesCount: 4, status: 'active',
    }])
    assert.equal(courses[0].courseCode, 'ACC101')
    assert.equal(courses[0].courseName, 'Financial Accounting')
    assert.equal(courses[0].modules.length, 4)
  })

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

  it('keeps an assigned faculty view scoped to assigned course ids or codes', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-09-21', scopeToCourses: true,
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'CS301', courseName: 'DBMS', modules: [] }],
      sessions: [
        { id: 'mine-by-id', date: '2026-09-22', courseId: 'course-1' },
        { id: 'mine-by-code', date: '2026-09-23', courseCode: 'CS301' },
        { id: 'other', date: '2026-09-22', courseId: 'course-2', courseCode: 'CS302' },
      ],
      assignments: [
        { id: 'a1', title: 'Mine', courseCode: 'CS301' },
        { id: 'a2', title: 'Other', courseCode: 'CS302' },
      ],
      assessments: [], completedTopics: [],
    })
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['mine-by-id', 'mine-by-code'])
    assert.deepEqual(context.assignmentHistory.map((item) => item.id), ['a1'])
  })

  // ── "No classes scheduled today" while the timetable showed classes ──────
  // The student dashboard and the timetable disagreed because the context
  // builder compared cohort fields strictly while the timetable used the shared
  // canonical matcher. Every case below is a pairing that occurs in real data
  // and that strict comparison silently dropped.

  const studentFor = (over: Record<string, unknown> = {}) => ({
    id: 's1', collegeId: 'c1', branch: 'BBA', batch: '2027', semester: 3, section: 'A', ...over,
  })
  const classesFor = (over: Record<string, unknown>) => ([{
    id: 'cls-1', collegeId: 'c1', date: '2026-11-27', startTime: '10:00', subject: 'Cost Accounting', ...over,
  }])
  const classCount = (studentOver: Record<string, unknown>, classOver: Record<string, unknown>) =>
    buildStudentAcademicContext({
      date: '2026-11-27',
      student: studentFor(studentOver),
      classes: classesFor(classOver) as never,
      assignments: [], tests: [], curriculum: [], attendance: [],
    }).classes.length

  it('keeps a class whose batch is an academic-year range ending in the student year', () => {
    assert.equal(classCount({ batch: '2027' }, { batch: '2026-2027' }), 1)
  })

  it('keeps a class whose batch and semester differ only in type', () => {
    assert.equal(classCount({ batch: '2026', semester: 3 }, { batch: '2026', semester: 3 }), 1)
    assert.equal(classCount({ batch: '2026', semester: '3' }, { batch: '2026', semester: 3 }), 1)
  })

  it('keeps a class whose section carries the "Section" prefix', () => {
    assert.equal(classCount({ section: 'A' }, { section: 'Section A' }), 1)
  })

  it('keeps a class scheduled for a division set that includes the student', () => {
    assert.equal(classCount({ section: 'A' }, { section: 'A,B,C,D' }), 1)
  })

  it('still excludes a class for a different branch or section', () => {
    assert.equal(classCount({ branch: 'BBA' }, { branch: 'BCA' }), 0)
    assert.equal(classCount({ section: 'A' }, { section: 'E' }), 0)
  })

  // ── The "Upcoming sessions: 0" regression ────────────────────────────────
  // A faculty member with classes scheduled saw an empty planner. The cause was
  // not their data: sessions carry subject / subjectCode (written from a weekly
  // schedule slot) and never a curriculum courseId, so the course filter — which
  // only understood courseId / courseCode — discarded every single session.
  // These three cases pin the fix from both directions.

  it('keeps a session whose subjectCode matches an assigned course code', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-11-26', scopeToCourses: true,
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'BBA 3.1', courseName: 'Cost Accounting', modules: [] }],
      sessions: [
        { id: 'scheduled', date: '2026-11-27', subject: 'Cost Accounting', subjectCode: 'BBA 3.1', facultyId: 'f1' },
      ],
      assignments: [], assessments: [], completedTopics: [],
    })
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['scheduled'])
  })

  it('keeps a session it cannot attribute to any course rather than hiding a real class', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-11-26', scopeToCourses: true,
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'BBA 3.1', courseName: 'Cost Accounting', modules: [] }],
      sessions: [
        // No courseId, no courseCode, no subject at all: legacy/partial row.
        { id: 'unknown-link', date: '2026-11-27', facultyId: 'f1' },
        // A subject name that does not correspond to any curriculum code.
        { id: 'free-text', date: '2026-11-28', subject: 'Guest Lecture', subjectCode: 'GL-01' },
      ],
      assignments: [], assessments: [], completedTopics: [],
    })
    // Both are shown: an unattributable class is still a class this teacher has.
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['unknown-link', 'free-text'])
  })

  it('still hides a session explicitly attributed to a different course', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-11-26', scopeToCourses: true,
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'BBA 3.1', courseName: 'Cost Accounting', modules: [] }],
      sessions: [
        { id: 'mine', date: '2026-11-27', subjectCode: 'BBA 3.1' },
        { id: 'theirs', date: '2026-11-27', courseCode: 'BBA 4.1' },
      ],
      assignments: [], assessments: [], completedTopics: [],
    })
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['mine'])
  })

  it('an explicit courseId filter stays strict even for an unattributable session', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-11-26', courseId: 'course-1',
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'BBA 3.1', courseName: 'Cost Accounting', modules: [] }],
      sessions: [
        { id: 'matches', date: '2026-11-27', subjectCode: 'BBA 3.1' },
        // The caller asked for one course; a session with no link cannot be
        // claimed as belonging to it.
        { id: 'unrelated', date: '2026-11-27', subject: 'Guest Lecture', subjectCode: 'GL-01' },
      ],
      assignments: [], assessments: [], completedTopics: [],
    })
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['matches'])
  })

  it('matches a subject stored as "CODE - Name" against the bare code', () => {
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-11-26', courseId: 'course-1',
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'CS301', courseName: 'DBMS', modules: [] }],
      sessions: [{ id: 'dashed', date: '2026-11-27', subject: 'CS301 - Databases' }],
      assignments: [], assessments: [], completedTopics: [],
    })
    assert.deepEqual(context.upcomingSessions.map((item) => item.id), ['dashed'])
  })

  it('reads the whole term, not just the first 200 session ids', () => {
    // The query is what caused this, but the builder must also be able to hold
    // more than the old cap: 340 sessions with the last 40 still upcoming.
    const day = (n: number) => {
      const d = new Date(Date.UTC(2026, 7, 1) + n * 86_400_000)
      return d.toISOString().slice(0, 10)
    }
    const sessions = Array.from({ length: 340 }, (_, i) => ({
      id: `adhoc_f1_${day(i)}_0900_class`,
      date: day(i),
      subjectCode: 'BBA 3.1',
    }))
    const context = buildFacultyAcademicContext({
      facultyId: 'f1', collegeId: 'c1', today: '2026-11-26', scopeToCourses: true,
      courses: [{ id: 'course-1', collegeId: 'c1', courseCode: 'BBA 3.1', courseName: 'Cost Accounting', modules: [] }],
      sessions, assignments: [], assessments: [], completedTopics: [],
    })
    assert.ok(context.upcomingSessions.length > 0, 'a later term must still have upcoming sessions')
    assert.ok(
      context.upcomingSessions.every((item) => item.date >= '2026-11-26'),
      'no past session may leak into the upcoming list'
    )
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

// ─── Assignment targeting and curriculum semester ────────────────────────────
//
// The class list was fixed to delegate to sessionMatchesCohort, but the SAME
// callable still compared assignment and curriculum cohort fields with raw
// string equality. A student whose timetable showed three classes therefore
// still saw "Assignments 0" — the zeros on the dashboard came from here.
//
// These cases pin the three ways that comparison silently dropped a real
// assignment, and the prefix-normalisation bug found alongside it.

describe('assignmentTargetsStudent — cohort matching', () => {
  const student = {
    id: 'stu-1',
    uid: 'uid-1',
    collegeId: 'vriddhi',
    branch: 'BBA',
    batch: '2027',
    semester: 3,
    section: 'A',
  }
  const base = { title: 'Banking and Financial Services', status: 'published' }

  it('matches a plain assignment with no cohort restriction', () => {
    assert.equal(assignmentTargetsStudent({ ...base }, student), true)
  })

  it('matches an assignment whose batch is an academic-year range', () => {
    // "2026-2027" and "2027" are the same class; strict equality dropped it.
    assert.equal(assignmentTargetsStudent({ ...base, batch: '2026-2027' }, student), true)
    assert.equal(assignmentTargetsStudent({ ...base, batch: '2026-27' }, student), true)
  })

  it('matches a numeric batch and a string semester', () => {
    assert.equal(assignmentTargetsStudent({ ...base, batch: 2027 }, student), true)
    assert.equal(assignmentTargetsStudent({ ...base, semester: '3' }, student), true)
  })

  it('matches a section written with its prefix', () => {
    assert.equal(assignmentTargetsStudent({ ...base, section: 'Section A' }, student), true)
    assert.equal(assignmentTargetsStudent({ ...base, section: 'A' }, student), true)
  })

  it('matches when the student’s letter is in `division` rather than `section`', () => {
    const divisionOnly = { ...student, section: undefined, division: 'A' }
    assert.equal(assignmentTargetsStudent({ ...base, section: 'A' }, divisionOnly), true)
    assert.equal(assignmentTargetsStudent({ ...base, section: 'Section A' }, divisionOnly), true)
  })

  it('matches an assignment covering several sections', () => {
    assert.equal(assignmentTargetsStudent({ ...base, section: 'A,B,C,D' }, student), true)
  })

  it('still rejects a genuinely different cohort', () => {
    assert.equal(assignmentTargetsStudent({ ...base, branch: 'BCA' }, student), false)
    assert.equal(assignmentTargetsStudent({ ...base, batch: '2026' }, student), false, 'different intake')
    assert.equal(assignmentTargetsStudent({ ...base, semester: 4 }, student), false)
    assert.equal(assignmentTargetsStudent({ ...base, section: 'E' }, student), false)
  })

  it('honours targetStudents', () => {
    assert.equal(assignmentTargetsStudent({ ...base, targetStudents: ['stu-1'] }, student), true)
    assert.equal(assignmentTargetsStudent({ ...base, targetStudents: ['uid-1'] }, student), true)
    assert.equal(assignmentTargetsStudent({ ...base, targetStudents: ['someone-else'] }, student), false)
  })

  it('honours targetSections, matching section/division/name/id shapes', () => {
    for (const target of [
      { section: 'A' },
      { division: 'A' },
      { sectionName: 'Section A' },
      { sectionId: 'a' },
    ]) {
      assert.equal(assignmentTargetsStudent({ ...base, targetSections: [target] }, student), true, JSON.stringify(target))
    }
  })

  it('rejects targetSections that name a different cohort', () => {
    assert.equal(assignmentTargetsStudent({ ...base, targetSections: [{ section: 'E' }] }, student), false)
    assert.equal(
      assignmentTargetsStudent({ ...base, targetSections: [{ section: 'A', batch: '2026' }] }, student),
      false,
      'same section, different intake',
    )
    assert.equal(
      assignmentTargetsStudent({ ...base, targetSections: [{ section: 'A', branch: 'BCA' }] }, student),
      false,
      'same section, different programme',
    )
  })

  it('admits when ANY target section matches', () => {
    assert.equal(
      assignmentTargetsStudent({ ...base, targetSections: [{ section: 'E' }, { section: 'A' }] }, student),
      true,
    )
  })
})

describe('student curriculum filtering — semester', () => {
  const student = { id: 'stu-1', collegeId: 'vriddhi', branch: 'BBA', batch: '2027', semester: 3, section: 'A' }
  const course = (semester: unknown) => ({
    id: `c-${String(semester)}`,
    collegeId: 'vriddhi',
    status: 'active',
    courseCode: 'BBA 3.2',
    courseName: 'Banking',
    semester,
    modules: [],
  })
  const build = (semesters: unknown[]) =>
    buildStudentAcademicContext({
      student: { ...student },
      date: '2026-11-27',
      classes: [],
      assignments: [],
      tests: [],
      curriculum: semesters.map(course) as never,
      attendance: [],
      now: '2026-11-27T10:00:00.000Z',
    })

  it('keeps a curriculum row whose semester is a STRING', () => {
    // The number-vs-string split: student.semester is the number 3.
    const result = build(['3'])
    assert.equal(result.curriculum.length, 1, 'a string semester must not drop the subject')
  })

  it('keeps a numeric semester', () => {
    assert.equal(build([3]).curriculum.length, 1)
  })

  it('keeps a row with NO semester (no constraint)', () => {
    assert.equal(build([undefined]).curriculum.length, 1)
    assert.equal(build(['']).curriculum.length, 1)
  })

  it('drops a row for a different semester', () => {
    assert.equal(build([4]).curriculum.length, 0)
    assert.equal(build(['5']).curriculum.length, 0)
  })

  it('keeps rows across mixed spellings and drops only the mismatches', () => {
    const result = build(['3', 3, 4, '3'])
    assert.equal(result.curriculum.length, 3)
  })
})
