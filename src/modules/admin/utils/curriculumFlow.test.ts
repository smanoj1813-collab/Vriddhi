// src/modules/admin/utils/curriculumFlow.test.ts
// ─── Pure coverage for the curriculum → schedule → reschedule flow ──────────
//
// No emulator, no React: the ladder maths, the join key and the reschedule
// preview are the parts that decide what an admin sees, so they are the parts
// that are pinned here.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FLOW_SEMESTERS,
  buildSemesterFlow,
  courseSlots,
  flowProgress,
  formatSlot,
  nextDateForDay,
  previewSlotMove,
  scheduledClassKey,
  semesterStatusLabel,
  sortSlots,
  weekdayOf,
} from './curriculumFlow'
import type { CurriculumDoc, CurriculumFacultyMapping, ParsedCourse } from '@/shared/types/curriculum'
import type { WeeklyClassSchedule } from '../types/schedule'

function course(overrides: Partial<ParsedCourse> = {}): ParsedCourse {
  return {
    id: 'c1',
    code: 'BC101',
    name: 'Financial Accounting',
    credits: 4,
    totalHours: 60,
    totalMarks: 100,
    semester: 1,
    branch: 'B.Com',
    modules: [],
    confidence: 'high',
    ...overrides,
  }
}

function curriculum(overrides: Partial<CurriculumDoc> = {}): CurriculumDoc {
  return {
    id: 'cur1',
    collegeId: 'college1',
    collegeName: 'Test College',
    syllabusExtractId: 'x',
    title: 'B.Com 2026',
    scheme: 'NEP',
    branch: 'B.Com',
    semester: 1,
    courses: [course()],
    totalCourses: 1,
    totalModules: 0,
    totalHours: 0,
    totalMarks: 0,
    status: 'active',
    createdBy: 'u',
    createdAt: '2026-09-01T00:00:00.000Z',
    assignedBy: 'u',
    assignedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

function mapping(overrides: Partial<CurriculumFacultyMapping> = {}): CurriculumFacultyMapping {
  return {
    id: 'm1',
    curriculumId: 'cur1',
    collegeId: 'college1',
    courseId: 'c1',
    courseCode: 'BC101',
    courseName: 'Financial Accounting',
    facultyId: 'f1',
    facultyName: 'Asha Rao',
    facultyEmail: null,
    branch: 'B.Com',
    semester: 1,
    batch: '2026-2029',
    division: null,
    section: null,
    totalHours: 60,
    credits: 4,
    modulesCount: 0,
    assignedAt: '2026-09-01T00:00:00.000Z',
    assignedBy: 'admin',
    status: 'active',
    ...overrides,
  }
}

function slot(overrides: Partial<WeeklyClassSchedule> = {}): WeeklyClassSchedule {
  return {
    id: 'slot1',
    collegeId: 'college1',
    subject: 'Financial Accounting',
    subjectCode: 'BC101',
    facultyId: 'f1',
    facultyName: 'Asha Rao',
    facultyInitials: 'AR',
    branch: 'B.Com',
    batch: '2026-2029',
    semester: 1,
    division: '',
    section: '',
    room: 'R12',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'lecture',
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('scheduledClassKey', () => {
  it('normalises code and branch casing and whitespace', () => {
    assert.equal(
      scheduledClassKey(' bc101 ', 'b.com', 1),
      scheduledClassKey('BC101', 'B.Com', 1),
    )
  })

  it('keeps semesters apart', () => {
    assert.notEqual(scheduledClassKey('BC101', 'B.Com', 1), scheduledClassKey('BC101', 'B.Com', 3))
  })
})

describe('courseSlots', () => {
  it('matches a course to its timetable rows by code + branch + semester', () => {
    const rows = courseSlots({
      course: course(),
      curriculum: curriculum(),
      slots: [slot(), slot({ id: 'slot2', subjectCode: 'BC102' })],
    })
    assert.deepEqual(rows.map((row) => row.id), ['slot1'])
  })

  it('drops retired slots so a cancelled class does not read as scheduled', () => {
    const rows = courseSlots({
      course: course(),
      curriculum: curriculum(),
      slots: [slot({ isActive: false })],
    })
    assert.equal(rows.length, 0)
  })

  it('narrows to one batch only when the caller asks', () => {
    const slots = [slot(), slot({ id: 'slot2', batch: '2025-2028' })]
    assert.equal(courseSlots({ course: course(), curriculum: curriculum(), slots, batch: '2026-2029' }).length, 1)
    assert.equal(courseSlots({ course: course(), curriculum: curriculum(), slots }).length, 2)
  })

  it('keeps a slot whose batch is not filled in', () => {
    const rows = courseSlots({
      course: course(),
      curriculum: curriculum(),
      slots: [slot({ batch: '' })],
      batch: '2026-2029',
    })
    assert.equal(rows.length, 1)
  })
})

describe('buildSemesterFlow', () => {
  const curricula = [
    curriculum({
      id: 'cur1',
      semester: 1,
      courses: [
        course({ id: 'c1', code: 'BC101', semester: 1, name: 'Financial Accounting' }),
        course({ id: 'c2', code: 'BC102', semester: 1, name: 'Business Law' }),
      ],
    }),
    curriculum({
      id: 'cur2',
      semester: 3,
      courses: [course({ id: 'c3', code: 'BC301', semester: 3, name: 'Cost Accounting', semesterOverride: undefined }) as ParsedCourse],
    }),
  ]

  it('always shows semesters 1 to 6, empty ones included', () => {
    const rows = buildSemesterFlow({ curricula: [], mappings: [], slots: [] })
    assert.deepEqual(rows.map((row) => row.semester), [...FLOW_SEMESTERS])
    assert.equal(rows.every((row) => row.status === 'empty'), true)
  })

  it('reads a course into the semester the course names, not the header', () => {
    const rows = buildSemesterFlow({
      curricula: [curriculum({ semester: 1, courses: [course({ id: 'c9', semester: 5, name: 'Elective' })] })],
      mappings: [],
      slots: [],
    })
    assert.equal(rows.find((row) => row.semester === 1)?.courseCount, 0)
    assert.equal(rows.find((row) => row.semester === 5)?.courseCount, 1)
  })

  it('reports unassigned and unscheduled subjects separately', () => {
    const rows = buildSemesterFlow({
      curricula,
      mappings: [mapping({ courseId: 'c1' })],
      slots: [slot()],
      branch: 'B.Com',
      batch: '2026-2029',
    })
    const sem1 = rows.find((row) => row.semester === 1)!
    assert.equal(sem1.courseCount, 2)
    assert.equal(sem1.assignedCount, 1)
    assert.equal(sem1.scheduledCount, 1)
    assert.equal(sem1.unassignedCount, 1)
    assert.equal(sem1.unscheduledCount, 1)
    assert.equal(sem1.status, 'partial')
    assert.equal(sem1.weeklyClasses, 1)
  })

  it('marks a semester ready only when every subject is assigned and scheduled', () => {
    const rows = buildSemesterFlow({
      curricula: [curriculum({ courses: [course({ id: 'c1' }), course({ id: 'c2', code: 'BC102' })] })],
      mappings: [mapping({ courseId: 'c1' }), mapping({ id: 'm2', courseId: 'c2', courseCode: 'BC102' })],
      slots: [slot(), slot({ id: 'slot2', subjectCode: 'BC102' })],
    })
    assert.equal(rows.find((row) => row.semester === 1)?.status, 'ready')
  })

  it('ignores mappings that were removed', () => {
    const rows = buildSemesterFlow({
      curricula: [curriculum({ courses: [course({ id: 'c1' })] })],
      mappings: [mapping({ status: 'removed' })],
      slots: [],
    })
    assert.equal(rows.find((row) => row.semester === 1)?.assignedCount, 0)
  })

  it('does not list the same course twice when two curricula overlap', () => {
    const rows = buildSemesterFlow({
      curricula: [curriculum({ id: 'cur1' }), curriculum({ id: 'cur2' })],
      mappings: [],
      slots: [],
    })
    assert.equal(rows.find((row) => row.semester === 1)?.courseCount, 1)
  })

  it('filters by branch without losing the other semesters of that branch', () => {
    const rows = buildSemesterFlow({
      curricula: [
        curriculum({ branch: 'B.Com' }),
        curriculum({
          id: 'curB',
          branch: 'BBA',
          semester: 2,
          courses: [course({ id: 'cB', code: 'BBA201', semester: 2, branch: 'BBA', name: 'Marketing' })],
        }),
      ],
      mappings: [],
      slots: [],
      branch: 'BBA',
    })
    assert.equal(rows.find((row) => row.semester === 1)?.courseCount, 0)
    assert.equal(rows.find((row) => row.semester === 2)?.courseCount, 1)
  })

  it('shows a subject as unassigned when its only mapping is for another batch', () => {
    const rows = buildSemesterFlow({
      curricula: [curriculum({ courses: [course({ id: 'c1' })] })],
      mappings: [mapping({ batch: '2025-2028' })],
      slots: [],
      batch: '2026-2029',
    })
    assert.equal(rows.find((row) => row.semester === 1)?.unassignedCount, 1)
  })
})

describe('semesterStatusLabel', () => {
  it('reads like a sentence, not like a dashboard', () => {
    assert.equal(
      semesterStatusLabel({
        semester: 1,
        courses: [],
        courseCount: 0,
        assignedCount: 0,
        scheduledCount: 0,
        unassignedCount: 0,
        unscheduledCount: 0,
        weeklyClasses: 0,
        status: 'empty',
      }),
      'No curriculum',
    )
    assert.equal(
      semesterStatusLabel({
        semester: 1,
        courses: [],
        courseCount: 2,
        assignedCount: 1,
        scheduledCount: 1,
        unassignedCount: 1,
        unscheduledCount: 1,
        weeklyClasses: 1,
        status: 'partial',
      }),
      '2 subjects · 1 unassigned · 1 not scheduled',
    )
  })
})

describe('flowProgress', () => {
  it('measures the whole 1–6 ladder', () => {
    const rows = buildSemesterFlow({
      curricula: [
        curriculum({ courses: [course({ id: 'c1' }), course({ id: 'c2', code: 'BC102' })] }),
      ],
      mappings: [mapping({ courseId: 'c1' })],
      slots: [slot()],
    })
    const progress = flowProgress(rows)
    assert.equal(progress.courses, 2)
    assert.equal(progress.assigned, 1)
    assert.equal(progress.scheduled, 1)
    assert.equal(progress.pct, 50)
  })
})

describe('weekday / date helpers', () => {
  it('treats Monday as the start of a Monday-first week list', () => {
    assert.equal(weekdayOf('2026-10-05'), 'monday')
    assert.equal(weekdayOf('2026-10-11'), 'sunday')
  })

  it('never moves a class backwards in time', () => {
    // Friday → Monday lands on the following Monday.
    assert.equal(nextDateForDay('2026-10-09', 'monday'), '2026-10-12')
    assert.equal(nextDateForDay('2026-10-05', 'wednesday'), '2026-10-07')
    assert.equal(nextDateForDay('2026-10-05', 'monday'), '2026-10-12')
    assert.equal(nextDateForDay('2026-10-05', 'noday'), null)
  })
})

describe('previewSlotMove', () => {
  const sessions = [
    { id: 's1', date: '2026-10-05', status: 'scheduled' },
    { id: 's2', date: '2026-10-12', status: 'scheduled' },
    { id: 's3', date: '2026-10-19', status: 'completed' },
  ]

  it('shows where each upcoming class lands', () => {
    const rows = previewSlotMove({ sessions, newDay: 'wednesday', from: '2026-10-01' })
    assert.deepEqual(rows, [
      { date: '2026-10-05', newDate: '2026-10-07', action: 'move' },
      { date: '2026-10-12', newDate: '2026-10-14', action: 'move' },
    ])
  })

  it('leaves delivered classes out of the preview entirely', () => {
    const rows = previewSlotMove({ sessions, newDay: 'wednesday', from: '2026-10-01' })
    assert.equal(rows.some((row) => row.date === '2026-10-19'), false)
  })

  it('keeps a class that is already on the new day', () => {
    const rows = previewSlotMove({
      sessions: [{ id: 's1', date: '2026-10-07', status: 'scheduled' }],
      newDay: 'wednesday',
      from: '2026-10-01',
    })
    assert.deepEqual(rows, [{ date: '2026-10-07', newDate: '2026-10-07', action: 'keep' }])
  })

  it('flags a destination another class already holds as a merge', () => {
    const rows = previewSlotMove({
      sessions: [
        { id: 's1', date: '2026-10-05', status: 'scheduled' },
        { id: 's2', date: '2026-10-07', status: 'scheduled' },
      ],
      newDay: 'wednesday',
      from: '2026-10-01',
    })
    assert.deepEqual(rows, [
      { date: '2026-10-05', newDate: '2026-10-07', action: 'merge' },
      { date: '2026-10-07', newDate: '2026-10-07', action: 'keep' },
    ])
  })
})

describe('presentation helpers', () => {
  it('summarises a slot in one line', () => {
    assert.equal(formatSlot(slot()), 'Mon 09:00–10:00 · R12')
    assert.equal(formatSlot(slot({ room: '' })), 'Mon 09:00–10:00')
  })

  it('orders the week Monday first', () => {
    const sorted = sortSlots([
      slot({ id: 'a', dayOfWeek: 'friday', startTime: '11:00' }),
      slot({ id: 'b', dayOfWeek: 'monday', startTime: '14:00' }),
      slot({ id: 'c', dayOfWeek: 'monday', startTime: '09:00' }),
    ])
    assert.deepEqual(sorted.map((row) => row.id), ['c', 'b', 'a'])
  })
})
