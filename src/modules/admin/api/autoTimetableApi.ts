// src/modules/admin/api/autoTimetableApi.ts
// ─── Client wrappers for the auto-scheduling callable ───────────────────────

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'
import type { DayOfWeek, ClassType } from '../types/schedule'

export interface BreakSlot { start: string; end: string; label: string }
export interface SlotConfig {
  workingDays: DayOfWeek[]
  dayStart: string
  dayEnd: string
  periodMinutes: number
  breaks: BreakSlot[]
}
export interface SubjectDemand {
  subject: string
  subjectCode: string
  facultyId: string
  facultyName?: string
  periodsPerWeek: number
  type: ClassType
  preferredRoom?: string
}
export interface CohortDemand {
  branch: string
  batch: string
  semester: number
  division: string
  section?: string
  subjects: SubjectDemand[]
}

export interface AutoGenerateInput {
  cohorts: CohortDemand[]
  slotConfig?: Partial<SlotConfig>
  rooms?: string[]
  maxPeriodsPerDayPerFaculty?: number
  equalDistribution?: boolean
  dryRun?: boolean
  replace?: boolean
}

export interface AutoGenerateResult {
  dryRun: boolean
  collegeId: string
  created?: number
  wouldCreate?: number
  slots: Array<{
    branch: string; batch: string; semester: number; division: string; section: string
    dayOfWeek: DayOfWeek; startTime: string; endTime: string
    subject: string; subjectCode: string; facultyId: string; facultyName: string
    room: string; type: ClassType
  }>
  stats: {
    workingDays: number; slotsPerDay: number; totalSlotsPerWeek: number
    cohorts: Array<{ cohortKey: string; needed: number; placed: number; unmet: number; perDay: Record<string,number> }>
    facultyVariance: number; breaksRespected: boolean
  }
  warnings: string[]
  clashes: Array<{message:string;kind:string}>
  unmet: Array<{cohortKey:string;subject:string;needed:number;placed:number}>
}

const MESSAGES: Record<string,string> = {
  'functions/unauthenticated': 'Your session has expired. Sign in again.',
  'functions/permission-denied': 'Only admins / principals / HODs can auto-generate timetables.',
  'functions/invalid-argument': 'Some timetable inputs are invalid — check breaks and cohort details.',
}

function toMessage(err: unknown, fallback: string): string {
  const code = String((err as any)?.code || '')
  return MESSAGES[code] || (err instanceof Error ? err.message : fallback)
}

export async function autoGenerateTimetable(input: AutoGenerateInput): Promise<AutoGenerateResult> {
  const call = httpsCallable<Record<string,unknown>, AutoGenerateResult>(functions, 'autoGenerateTimetable')
  try {
    const res = await call({
      cohorts: input.cohorts,
      ...(input.slotConfig ? { slotConfig: input.slotConfig } : {}),
      ...(input.rooms ? { rooms: input.rooms } : {}),
      ...(input.maxPeriodsPerDayPerFaculty !== undefined ? { maxPeriodsPerDayPerFaculty: input.maxPeriodsPerDayPerFaculty } : {}),
      ...(input.equalDistribution !== undefined ? { equalDistribution: input.equalDistribution } : {}),
      ...(input.dryRun ? { dryRun: true } : {}),
      ...(input.replace ? { replace: true } : {}),
    } as any)
    return res.data
  } catch (err) {
    throw new Error(toMessage(err, 'Timetable generation failed.'))
  }
}
