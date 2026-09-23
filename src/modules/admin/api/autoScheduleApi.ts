// src/modules/admin/api/autoScheduleApi.ts
// Client wrapper for the G4 slot auto-scheduler. Preview (dryRun) is the
// default — the dialog renders the plan; only an explicit Apply writes
// weeklySchedules docs server-side.

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';
import type { DayOfWeek } from '../types/schedule';

export interface AutoScheduleGridInput {
  days?: DayOfWeek[];
  periodsPerDay?: number;
  startTime?: string;
  periodMinutes?: number;
  breakAfterPeriod?: number;
  breakMinutes?: number;
  labSpan?: number;
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
  summary: {
    courses: number;
    placements: number;
    periodsRequested: number;
    periodsPlaced: number;
    unplacedCourses: number;
    overloadedFaculty: number;
  };
}

export interface AutoScheduleResponse {
  dryRun: boolean;
  plan: AutoSchedulePlan;
  created?: number;
}

export async function autoGenerateWeeklySchedule(
  input: AutoScheduleRequest,
): Promise<AutoScheduleResponse> {
  const fn = httpsCallable<AutoScheduleRequest, AutoScheduleResponse>(functions, 'autoGenerateWeeklySchedule');
  const res = await fn(input);
  return res.data;
}
