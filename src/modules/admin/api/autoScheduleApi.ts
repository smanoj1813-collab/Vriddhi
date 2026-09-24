// src/modules/admin/api/autoScheduleApi.ts
// Client wrapper for the G4 slot auto-scheduler (Auto-Scheduler v2 contract).
// Preview (dryRun) is the default — the dialog renders the plan; only an
// explicit Apply writes weeklySchedules docs server-side.
//
// v2 additions: dateRange (slot applicability window), strategy/randomSeed/
// roomStrategy (P3 placement patterns), courseOverrides (P2 per-course
// steering), demand rows + calendar view in the plan (P2/P4).

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';
import type { DayOfWeek } from '../types/schedule';
import type { CalendarEventType } from '@/shared/types/calendarEvent';

export type PlacementStrategy = 'uniform' | 'spread' | 'random';
export type RoomStrategy = 'leastLoaded' | 'random';

export interface AutoScheduleGridInput {
  days?: DayOfWeek[];
  periodsPerDay?: number;
  startTime?: string;
  periodMinutes?: number;
  breakAfterPeriod?: number;
  breakMinutes?: number;
  labSpan?: number;
}

export interface CourseOverrideInput {
  mappingId: string;
  /** Overrides the hoursPerWeek derivation. 0 (or include:false) excludes. */
  weeklyPeriods?: number | null;
  include?: boolean;
}

export interface AutoScheduleRequest {
  curriculumId: string;
  batch: string;
  division?: string;
  section?: string;
  grid: AutoScheduleGridInput;
  rooms: string[];
  semesterWeeks?: number;
  maxPeriodsPerDayPerFaculty?: number;
  dryRun?: boolean;
  /** P1 — one applicability window per apply run (written to every doc). */
  dateRange?: { from: string; to?: string };
  /** P3 — default 'uniform' (pre-v2 behaviour). */
  strategy?: PlacementStrategy;
  /** P3 — deterministic seed: same seed + inputs = same grid. */
  randomSeed?: string;
  /** P3 — default 'leastLoaded'. */
  roomStrategy?: RoomStrategy;
  /** P2 — per-course include / weekly-period steering. */
  courseOverrides?: CourseOverrideInput[];
}

export interface AutoSchedulePlacement {
  mappingId: string;
  courseId: string;
  subject: string;
  subjectCode: string;
  facultyId: string;
  facultyName: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
  room: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  type: 'lecture' | 'lab';
  periodIndex: number;
  span: number;
  flags: string[];
}

export interface AutoScheduleDemandRow {
  mappingId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  periodsRequested: number;
  included: boolean;
  source: 'derived' | 'override' | 'excluded' | 'zero-hours';
  reason?: string;
}

export interface AutoScheduleCalendarView {
  events: {
    id: string;
    title: string;
    type: CalendarEventType;
    startDate: string;
    endDate: string;
    suspendsClasses: boolean;
  }[];
  blockedWeekdays: { day: DayOfWeek; titles: string[] }[];
  blockedDates: {
    date: string;
    title: string;
    type: CalendarEventType;
    suspendsClasses: boolean;
  }[];
  teachingDays?: number;
  blockedDays?: number;
  blockedBreakdown: Record<string, number>;
}

export interface AutoSchedulePlan {
  grid: {
    days: DayOfWeek[];
    periodsPerDay: number;
    startTime: string;
    periodMinutes: number;
    breakAfterPeriod: number;
    breakMinutes: number;
    labSpan: number;
  };
  rooms: string[];
  placements: AutoSchedulePlacement[];
  unplaced: {
    courseId: string;
    subject: string;
    periodsRequested: number;
    periodsPlaced: number;
    reason: string;
  }[];
  facultyLoad: {
    facultyId: string;
    facultyName: string;
    existingWeekly: number;
    placedWeekly: number;
    totalWeekly: number;
    capacity: number;
    overloaded: boolean;
  }[];
  dailyCoverage: {
    day: DayOfWeek;
    periods: number;
    hours: number;
    utilization: number;
    subjects: string[];
  }[];
  /** P2 — the preview's demand list (drives the override table). */
  demand: AutoScheduleDemandRow[];
  /** P4 — calendar view (blocked weekdays + teachingDays vs blockedDays). */
  calendar?: AutoScheduleCalendarView;
  /** P3 — echo of the effective seed when a seeded RNG shaped this plan. */
  randomSeed?: string;
  summary: {
    courses: number;
    placements: number;
    periodsRequested: number;
    periodsPlaced: number;
    unplacedCourses: number;
    overloadedFaculty: number;
    coursesIncluded?: number;
    teachingDays?: number;
    blockedDays?: number;
    blockedBreakdown?: Record<string, number>;
  };
}

export interface AutoScheduleResponse {
  dryRun: boolean;
  plan: AutoSchedulePlan;
  created?: number;
  /** Non-fatal operator hints (e.g. a dateRange wider than one generate run). */
  warnings?: string[];
  /** Effective RNG seed when strategy/room pick is random. */
  randomSeed?: string;
}

export async function autoGenerateWeeklySchedule(
  input: AutoScheduleRequest,
): Promise<AutoScheduleResponse> {
  const fn = httpsCallable<AutoScheduleRequest, AutoScheduleResponse>(functions, 'autoGenerateWeeklySchedule');
  const res = await fn(input);
  return res.data;
}
