// functions/test/timetableConflicts.test.ts
// Unit tests for timetable clash detection

// Import from the shared utils
// Note: In the functions environment, we need to use a different path
// This test file is for reference - actual tests would run in the frontend

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type ClassType = 'lecture' | 'lab' | 'tutorial' | 'seminar' | 'workshop' | 'practical';

interface ScheduleEntry {
  id: string;
  collegeId: string;
  subject: string;
  subjectCode?: string;
  facultyId: string;
  facultyName?: string;
  branch: string;
  batch: string;
  semester?: number;
  division: string;
  section?: string;
  room: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  type: ClassType;
  isActive?: boolean;
}

interface Clash {
  kind: 'faculty' | 'cohort' | 'room';
  entryId: string;
  entryDetails: string;
  existingId: string;
  existingDetails: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  message: string;
}

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`;
}

function findClashes(entry: Omit<ScheduleEntry, 'id' | 'isActive'>, existingEntries: ScheduleEntry[], ignoreEntryId?: string): Clash[] {
  const clashes: Clash[] = [];

  for (const existing of existingEntries) {
    if (!existing.isActive && existing.isActive !== undefined) continue;
    if (ignoreEntryId && existing.id === ignoreEntryId) continue;
    if (existing.dayOfWeek !== entry.dayOfWeek) continue;
    if (!timesOverlap(entry.startTime, entry.endTime, existing.startTime, existing.endTime)) continue;

    if (existing.facultyId && existing.facultyId === entry.facultyId) {
      clashes.push({
        kind: 'faculty',
        entryId: '',
        entryDetails: `${entry.subject} (${entry.type})`,
        existingId: existing.id,
        existingDetails: `${existing.subject} (${existing.type})`,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        message: `Faculty clash`,
      });
    }

    const existingCohort = `${existing.branch}|${existing.batch}|${existing.division}`.toLowerCase();
    const newCohort = `${entry.branch}|${entry.batch}|${entry.division}`.toLowerCase();
    if (existingCohort && existingCohort === newCohort && existingCohort !== '||') {
      clashes.push({
        kind: 'cohort',
        entryId: '',
        entryDetails: `${entry.subject} (${entry.type})`,
        existingId: existing.id,
        existingDetails: `${existing.subject} (${existing.type})`,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        message: `Cohort clash`,
      });
    }

    if (existing.room && existing.room === entry.room && entry.room !== '') {
      clashes.push({
        kind: 'room',
        entryId: '',
        entryDetails: `${entry.subject} in room ${entry.room}`,
        existingId: existing.id,
        existingDetails: `${existing.subject} in room ${existing.room}`,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        message: `Room clash`,
      });
    }
  }

  return clashes;
}

function makeEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'test-1',
    collegeId: 'college-1',
    subject: 'Math',
    subjectCode: 'MATH101',
    facultyId: 'faculty-1',
    facultyName: 'Dr. Smith',
    branch: 'CSE',
    batch: '2024',
    semester: 1,
    division: 'A',
    section: 'A1',
    room: 'Room 101',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'lecture',
    isActive: true,
    ...overrides,
  };
}

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'test-1',
    collegeId: 'college-1',
    subject: 'Math',
    subjectCode: 'MATH101',
    facultyId: 'faculty-1',
    facultyName: 'Dr. Smith',
    branch: 'CSE',
    batch: '2024',
    semester: 1,
    division: 'A',
    section: 'A1',
    room: 'Room 101',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'lecture',
    isActive: true,
    ...overrides,
  }
}

// ─── Time Utilities ────────────────────────────────────────────────────────────

describe('Time Utilities', () => {
  describe('parseTimeToMinutes', () => {
    it('parses midnight correctly', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0)
    })

    it('parses midday correctly', () => {
      expect(parseTimeToMinutes('12:00')).toBe(720)
    })

    it('parses end of day correctly', () => {
      expect(parseTimeToMinutes('23:59')).toBe(1439)
    })

    it('handles minutes correctly', () => {
      expect(parseTimeToMinutes('09:30')).toBe(570)
      expect(parseTimeToMinutes('14:45')).toBe(885)
    })
  })

  describe('formatMinutesToTime', () => {
    it('formats midnight correctly', () => {
      expect(formatMinutesToTime(0)).toBe('00:00')
    })

    it('formats midday correctly', () => {
      expect(formatMinutesToTime(720)).toBe('12:00')
    })

    it('formats end of day correctly', () => {
      expect(formatMinutesToTime(1439)).toBe('23:59')
    })

    it('pads single digits', () => {
      expect(formatMinutesToTime(65)).toBe('01:05')
      expect(formatMinutesToTime(600)).toBe('10:00')
    })
  })

  describe('formatTimeRange', () => {
    it('formats time range correctly', () => {
      expect(formatTimeRange('09:00', '10:00')).toBe('09:00–10:00')
    })
  })
})

// ─── Time Overlap ──────────────────────────────────────────────────────────────

describe('timesOverlap', () => {
  it('detects overlapping time ranges', () => {
    expect(timesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true)
    expect(timesOverlap('09:00', '10:00', '09:00', '10:00')).toBe(true)
    expect(timesOverlap('09:00', '10:00', '09:15', '09:45')).toBe(true)
  })

  it('detects non-overlapping time ranges', () => {
    // Adjacent slots are NOT clashes
    expect(timesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
    expect(timesOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false)
    expect(timesOverlap('10:00', '11:00', '09:00', '10:00')).toBe(false)
  })

  it('handles contained ranges', () => {
    expect(timesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true)
  })

  it('handles one ending during another', () => {
    expect(timesOverlap('09:00', '10:30', '10:00', '11:00')).toBe(true)
    expect(timesOverlap('10:00', '11:00', '09:00', '10:30')).toBe(true)
  })
})

// ─── Clash Detection ──────────────────────────────────────────────────────────

describe('findClashes', () => {
  it('detects faculty clash on same day and time', () => {
    const existing = makeEntry({ id: 'existing-1', facultyId: 'faculty-1', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', facultyId: 'faculty-1', startTime: '09:30', endTime: '10:30' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.length).toBeGreaterThan(0)
    expect(clashes.some(c => c.kind === 'faculty')).toBe(true)
  })

  it('does not detect faculty clash on different days', () => {
    const existing = makeEntry({ id: 'existing-1', facultyId: 'faculty-1', dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', facultyId: 'faculty-1', dayOfWeek: 'tuesday', startTime: '09:00', endTime: '10:00' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.filter(c => c.kind === 'faculty')).toHaveLength(0)
  })

  it('does not detect faculty clash on adjacent times', () => {
    const existing = makeEntry({ id: 'existing-1', facultyId: 'faculty-1', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', facultyId: 'faculty-1', startTime: '10:00', endTime: '11:00' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.filter(c => c.kind === 'faculty')).toHaveLength(0)
  })

  it('detects cohort clash (same branch/batch/division)', () => {
    const existing = makeEntry({ id: 'existing-1', branch: 'CSE', batch: '2024', division: 'A', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', branch: 'CSE', batch: '2024', division: 'A', startTime: '09:30', endTime: '10:30' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.some(c => c.kind === 'cohort')).toBe(true)
  })

  it('does not detect cohort clash for different cohorts', () => {
    const existing = makeEntry({ id: 'existing-1', branch: 'CSE', batch: '2024', division: 'A', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', branch: 'CSE', batch: '2024', division: 'B', startTime: '09:00', endTime: '10:00' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.filter(c => c.kind === 'cohort')).toHaveLength(0)
  })

  it('detects room clash', () => {
    const existing = makeEntry({ id: 'existing-1', room: 'Room 101', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', room: 'Room 101', startTime: '09:30', endTime: '10:30' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.some(c => c.kind === 'room')).toBe(true)
  })

  it('does not detect room clash for different rooms', () => {
    const existing = makeEntry({ id: 'existing-1', room: 'Room 101', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'new-1', room: 'Room 102', startTime: '09:00', endTime: '10:00' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.filter(c => c.kind === 'room')).toHaveLength(0)
  })

  it('skips inactive entries', () => {
    const existing = makeEntry({ id: 'existing-1', facultyId: 'faculty-1', isActive: false })
    const newEntry = makeEntry({ id: 'new-1', facultyId: 'faculty-1' })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.filter(c => c.kind === 'faculty')).toHaveLength(0)
  })

  it('skips entry being updated when ignoreEntryId is provided', () => {
    const existing = makeEntry({ id: 'existing-1', facultyId: 'faculty-1', startTime: '09:00', endTime: '10:00' })
    const newEntry = makeEntry({ id: 'existing-1', facultyId: 'faculty-1', startTime: '09:30', endTime: '10:30' })

    const clashes = findClashes(newEntry, [existing], 'existing-1')

    expect(clashes.filter(c => c.kind === 'faculty')).toHaveLength(0)
  })

  it('detects multiple clash types for same entry', () => {
    const existing = makeEntry({
      id: 'existing-1',
      facultyId: 'faculty-1',
      room: 'Room 101',
      branch: 'CSE',
      batch: '2024',
      division: 'A',
      startTime: '09:00',
      endTime: '10:00',
    })
    const newEntry = makeEntry({
      id: 'new-1',
      facultyId: 'faculty-1',
      room: 'Room 101',
      branch: 'CSE',
      batch: '2024',
      division: 'A',
      startTime: '09:30',
      endTime: '10:30',
    })

    const clashes = findClashes(newEntry, [existing])

    expect(clashes.length).toBeGreaterThanOrEqual(3)
    expect(clashes.some(c => c.kind === 'faculty')).toBe(true)
    expect(clashes.some(c => c.kind === 'cohort')).toBe(true)
    expect(clashes.some(c => c.kind === 'room')).toBe(true)
  })
})

// ─── Batch Clash Detection ────────────────────────────────────────────────────

describe('findBatchClashes', () => {
  it('detects internal clashes in a batch', () => {
    const entries = [
      makeEntry({ id: '1', facultyId: 'faculty-1', startTime: '09:00', endTime: '10:00' }),
      makeEntry({ id: '2', facultyId: 'faculty-1', startTime: '09:30', endTime: '10:30' }),
    ]

    const clashMap = findBatchClashes(entries)

    expect(clashMap.size).toBe(2)
  })

  it('returns empty map when no internal clashes', () => {
    const entries = [
      makeEntry({ id: '1', facultyId: 'faculty-1', startTime: '09:00', endTime: '10:00' }),
      makeEntry({ id: '2', facultyId: 'faculty-1', startTime: '10:00', endTime: '11:00' }),
    ]

    const clashMap = findBatchClashes(entries)

    expect(clashMap.size).toBe(0)
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('validateScheduleEntry', () => {
  it('returns valid for complete entry', () => {
    const entry = makeEntry()
    const result = validateScheduleEntry(entry)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns errors for missing required fields', () => {
    const entry = makeEntry({ facultyId: '', branch: '', batch: '' })
    const result = validateScheduleEntry(entry)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Faculty is required')
    expect(result.errors).toContain('Branch is required')
    expect(result.errors).toContain('Batch is required')
  })

  it('returns error when end time is before start time', () => {
    const entry = makeEntry({ startTime: '10:00', endTime: '09:00' })
    const result = validateScheduleEntry(entry)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('End time must be after start time')
  })

  it('returns warning for missing room', () => {
    const entry = makeEntry({ room: '' })
    const result = validateScheduleEntry(entry)

    expect(result.warnings).toContain('Room is not specified')
  })
})

// ─── Cohort Comparison ────────────────────────────────────────────────────────

describe('isSameCohort', () => {
  it('returns true for same cohort', () => {
    const a = makeEntry({ branch: 'CSE', batch: '2024', division: 'A' })
    const b = makeEntry({ branch: 'CSE', batch: '2024', division: 'A' })

    expect(isSameCohort(a, b)).toBe(true)
  })

  it('is case insensitive', () => {
    const a = makeEntry({ branch: 'CSE', batch: '2024', division: 'A' })
    const b = makeEntry({ branch: 'cse', batch: '2024', division: 'a' })

    expect(isSameCohort(a, b)).toBe(true)
  })

  it('returns false for different cohorts', () => {
    const a = makeEntry({ branch: 'CSE', batch: '2024', division: 'A' })
    const b = makeEntry({ branch: 'CSE', batch: '2024', division: 'B' })

    expect(isSameCohort(a, b)).toBe(false)
  })
})

// ─── Formatting ───────────────────────────────────────────────────────────────

describe('formatScheduleEntry', () => {
  it('formats schedule entry correctly', () => {
    const entry = makeEntry({ dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00', subject: 'Math' })
    const formatted = formatScheduleEntry(entry)

    expect(formatted).toContain('Monday')
    expect(formatted).toContain('09:00')
    expect(formatted).toContain('10:00')
    expect(formatted).toContain('Math')
  })
})

// ─── Grouping ─────────────────────────────────────────────────────────────────

describe('groupByDay', () => {
  it('groups entries by day of week', () => {
    const entries = [
      makeEntry({ id: '1', dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' }),
      makeEntry({ id: '2', dayOfWeek: 'monday', startTime: '10:00', endTime: '11:00' }),
      makeEntry({ id: '3', dayOfWeek: 'tuesday', startTime: '09:00', endTime: '10:00' }),
    ]

    const grouped = groupByDay(entries)

    expect(grouped.get('monday')).toHaveLength(2)
    expect(grouped.get('tuesday')).toHaveLength(1)
    expect(grouped.get('wednesday')).toHaveLength(0)
  })

  it('sorts entries by start time within each day', () => {
    const entries = [
      makeEntry({ id: '1', dayOfWeek: 'monday', startTime: '11:00', endTime: '12:00' }),
      makeEntry({ id: '2', dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00' }),
      makeEntry({ id: '3', dayOfWeek: 'monday', startTime: '10:00', endTime: '11:00' }),
    ]

    const grouped = groupByDay(entries)
    const monday = grouped.get('monday')!

    expect(monday[0].startTime).toBe('09:00')
    expect(monday[1].startTime).toBe('10:00')
    expect(monday[2].startTime).toBe('11:00')
  })
})
