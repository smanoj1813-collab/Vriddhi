import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

interface ScheduleEntry {
  id: string
  collegeId: string
  facultyId: string
  branch: string
  batch: string
  division: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive?: boolean
}

type ClashKind = 'faculty' | 'cohort' | 'room'

function minutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return minutes(startA) < minutes(endB) && minutes(startB) < minutes(endA)
}

function cohortKey(entry: ScheduleEntry): string {
  return `${entry.branch}|${entry.batch}|${entry.division}`.toLowerCase()
}

function findClashes(
  candidate: ScheduleEntry,
  existingEntries: ScheduleEntry[],
  ignoreEntryId?: string
): ClashKind[] {
  const clashes: ClashKind[] = []

  for (const existing of existingEntries) {
    if (existing.collegeId !== candidate.collegeId) continue
    if (existing.isActive === false || existing.id === ignoreEntryId) continue
    if (existing.dayOfWeek !== candidate.dayOfWeek) continue
    if (!timesOverlap(candidate.startTime, candidate.endTime, existing.startTime, existing.endTime)) {
      continue
    }
    if (existing.facultyId === candidate.facultyId) clashes.push('faculty')
    if (cohortKey(existing) === cohortKey(candidate)) clashes.push('cohort')
    if (candidate.room && existing.room === candidate.room) clashes.push('room')
  }

  return clashes
}

function entry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'candidate',
    collegeId: 'college-a',
    facultyId: 'faculty-a',
    branch: 'CSE',
    batch: '2026',
    division: 'A',
    room: '101',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    isActive: true,
    ...overrides,
  }
}

describe('timetable conflict utilities', () => {
  it('converts times to minutes', () => {
    assert.equal(minutes('00:00'), 0)
    assert.equal(minutes('09:30'), 570)
    assert.equal(minutes('23:59'), 1439)
  })

  it('treats adjacent slots as non-overlapping', () => {
    assert.equal(timesOverlap('09:00', '10:00', '10:00', '11:00'), false)
  })

  it('detects partial and contained overlaps', () => {
    assert.equal(timesOverlap('09:00', '10:00', '09:30', '10:30'), true)
    assert.equal(timesOverlap('09:00', '12:00', '10:00', '11:00'), true)
  })

  it('detects faculty, cohort, and room clashes', () => {
    const clashes = findClashes(entry(), [entry({ id: 'existing', startTime: '09:30' })])
    assert.deepEqual(clashes.sort(), ['cohort', 'faculty', 'room'])
  })

  it('does not compare schedules across colleges', () => {
    assert.deepEqual(findClashes(entry(), [entry({ id: 'other', collegeId: 'college-b' })]), [])
  })

  it('does not compare schedules on different days', () => {
    assert.deepEqual(findClashes(entry(), [entry({ id: 'other', dayOfWeek: 'tuesday' })]), [])
  })

  it('skips inactive entries', () => {
    assert.deepEqual(findClashes(entry(), [entry({ id: 'other', isActive: false })]), [])
  })

  it('skips the entry being updated', () => {
    const existing = entry({ id: 'same' })
    assert.deepEqual(findClashes(entry({ id: 'same' }), [existing], 'same'), [])
  })

  it('matches cohort values case-insensitively', () => {
    const clashes = findClashes(
      entry({ facultyId: 'new-faculty', room: 'new-room' }),
      [entry({ id: 'other', facultyId: 'other-faculty', branch: 'cse', division: 'a', room: 'other-room' })]
    )
    assert.deepEqual(clashes, ['cohort'])
  })

  it('does not report unrelated overlapping entries', () => {
    const clashes = findClashes(
      entry({ facultyId: 'new-faculty', division: 'A', room: 'new-room' }),
      [entry({ id: 'other', facultyId: 'other-faculty', division: 'B', room: 'other-room' })]
    )
    assert.deepEqual(clashes, [])
  })
})
