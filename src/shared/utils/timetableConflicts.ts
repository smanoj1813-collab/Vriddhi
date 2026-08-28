// src/shared/utils/timetableConflicts.ts
// Timetable Clash Detection Engine
// Detects faculty, cohort (branch/batch/division), and room overlaps

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ClassType = 'lecture' | 'lab' | 'tutorial' | 'seminar' | 'workshop' | 'practical'

export interface TimeSlot {
  startTime: string // HH:mm format, e.g., "09:00"
  endTime: string   // HH:mm format, e.g., "10:00"
}

export interface ScheduleEntry {
  id: string
  collegeId: string
  subject: string
  subjectCode?: string
  facultyId: string
  facultyName?: string
  branch: string
  batch: string
  semester?: number
  division: string
  section?: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  type: ClassType
  isActive?: boolean
}

export type ClashKind = 'faculty' | 'cohort' | 'room'

export interface Clash {
  kind: ClashKind
  entryId: string
  entryDetails: string
  existingId: string
  existingDetails: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  message: string
}

// ─── Time Utilities ───────────────────────────────────────────────────────────

/**
 * Parse "HH:mm" to total minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Format minutes since midnight back to "HH:mm"
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Check if two time ranges overlap.
 * Adjacent slots (endTime === otherStartTime) are NOT clashes.
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTimeToMinutes(start1)
  const e1 = parseTimeToMinutes(end1)
  const s2 = parseTimeToMinutes(start2)
  const e2 = parseTimeToMinutes(end2)

  // Overlap exists if one starts before the other ends
  return s1 < e2 && s2 < e1
}

/**
 * Format a time range for display
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`
}

// ─── Clash Detection Core ─────────────────────────────────────────────────────

/**
 * Find all clashes for a new/updated schedule entry against existing entries.
 *
 * Clash rules:
 * 1. Faculty clash: same facultyId, same day, overlapping time
 * 2. Cohort clash: same branch + batch + division (cohort), same day, overlapping time
 * 3. Room clash: same room, same day, overlapping time
 */
export function findClashes(
  entry: Omit<ScheduleEntry, 'id' | 'isActive'>,
  existingEntries: ScheduleEntry[],
  ignoreEntryId?: string // Skip this ID (for updates)
): Clash[] {
  const clashes: Clash[] = []

  for (const existing of existingEntries) {
    // Skip inactive entries or the entry being updated
    if (!existing.isActive && existing.isActive !== undefined) continue
    if (ignoreEntryId && existing.id === ignoreEntryId) continue

    // Must be same day
    if (existing.dayOfWeek !== entry.dayOfWeek) continue

    // Must overlap in time
    if (!timesOverlap(entry.startTime, entry.endTime, existing.startTime, existing.endTime)) {
      continue
    }

    // 1. Faculty clash
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
        message: `Faculty "${entry.facultyName || entry.facultyId}" already has "${existing.subject}" at ${formatTimeRange(existing.startTime, existing.endTime)}`,
      })
    }

    // 2. Cohort clash (same branch + batch + division)
    const existingCohort = `${existing.branch}|${existing.batch}|${existing.division}`.toLowerCase()
    const newCohort = `${entry.branch}|${entry.batch}|${entry.division}`.toLowerCase()
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
        message: `${entry.branch} ${entry.batch} ${entry.division} already has "${existing.subject}" at ${formatTimeRange(existing.startTime, existing.endTime)}`,
      })
    }

    // 3. Room clash
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
        message: `Room ${entry.room} is already occupied by "${existing.subject}" at ${formatTimeRange(existing.startTime, existing.endTime)}`,
      })
    }
  }

  return clashes
}

/**
 * Validate a batch of schedule entries for internal clashes.
 * Returns map of entry index → list of clashes.
 */
export function findBatchClashes(
  entries: Array<Omit<ScheduleEntry, 'id' | 'isActive'>>
): Map<number, Clash[]> {
  const clashMap = new Map<number, Clash[]>()

  for (let i = 0; i < entries.length; i++) {
    const clashes = findClashes(entries[i], entries.map((e, idx) => ({
      ...e,
      id: String(idx),
      isActive: true,
    })), String(i))
    if (clashes.length > 0) {
      clashMap.set(i, clashes)
    }
  }

  return clashMap
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate a single schedule entry
 */
export function validateScheduleEntry(entry: Partial<ScheduleEntry>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!entry.facultyId?.trim()) {
    errors.push('Faculty is required')
  }

  if (!entry.branch?.trim()) {
    errors.push('Branch is required')
  }

  if (!entry.batch?.trim()) {
    errors.push('Batch is required')
  }

  if (!entry.division?.trim()) {
    errors.push('Division is required')
  }

  if (!entry.room?.trim()) {
    warnings.push('Room is not specified')
  }

  if (!entry.subject?.trim()) {
    errors.push('Subject is required')
  }

  if (!entry.dayOfWeek) {
    errors.push('Day of week is required')
  }

  if (!entry.startTime || !entry.endTime) {
    errors.push('Start and end times are required')
  } else {
    const startMins = parseTimeToMinutes(entry.startTime)
    const endMins = parseTimeToMinutes(entry.endTime)

    if (endMins <= startMins) {
      errors.push('End time must be after start time')
    }

    if (startMins < 0 || endMins > 24 * 60) {
      errors.push('Time must be between 00:00 and 24:00')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check if two entries are the same cohort (branch + batch + division)
 */
export function isSameCohort(a: ScheduleEntry, b: ScheduleEntry): boolean {
  return (
    a.branch.toLowerCase() === b.branch.toLowerCase() &&
    a.batch.toLowerCase() === b.batch.toLowerCase() &&
    a.division.toLowerCase() === b.division.toLowerCase()
  )
}

/**
 * Format a schedule entry for display
 */
export function formatScheduleEntry(entry: ScheduleEntry): string {
  const parts = [
    entry.subject,
    entry.type !== 'lecture' ? `(${entry.type})` : '',
    entry.facultyName || entry.facultyId,
    entry.room ? `@${entry.room}` : '',
  ].filter(Boolean)
  return `${entry.dayOfWeek.charAt(0).toUpperCase() + entry.dayOfWeek.slice(1)} ${formatTimeRange(entry.startTime, entry.endTime)}: ${parts.join(' ')}`
}

// ─── Weekly Schedule Helpers ──────────────────────────────────────────────────

export const DAY_ORDER: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

/**
 * Group schedule entries by day of week
 */
export function groupByDay(entries: ScheduleEntry[]): Map<DayOfWeek, ScheduleEntry[]> {
  const grouped = new Map<DayOfWeek, ScheduleEntry[]>()
  for (const day of DAY_ORDER) {
    grouped.set(day, [])
  }
  for (const entry of entries) {
    const list = grouped.get(entry.dayOfWeek) || []
    list.push(entry)
    grouped.set(entry.dayOfWeek, list)
  }
  // Sort each day's entries by start time
  for (const [day, list] of grouped) {
    grouped.set(day, list.sort((a, b) => a.startTime.localeCompare(b.startTime)))
  }
  return grouped
}
