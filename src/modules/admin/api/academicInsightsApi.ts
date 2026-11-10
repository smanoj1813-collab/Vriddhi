// src/modules/admin/api/academicInsightsApi.ts
// ─── Client wrapper for the getAcademicInsights callable ───────────────────
//
// The drill-down the principal portal was missing: semester → subject →
// individual student. Aggregation runs server-side (functions/src/
// academicInsights.ts) — this module mirrors its response types and calls it.

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'
import {
  describeSessionError,
  SESSION_WRITER_MESSAGES,
} from '@/shared/utils/sessionErrorMessage'

// ─── Types (mirror functions/src/academicInsights.ts) ──────────────────────

export interface InsightTopics {
  total: number
  covered: number
  pending: number
  pct: number
}

export interface InsightAttendance {
  present: number
  marked: number
  pct: number
}

export interface InsightSessions {
  total: number
  completed: number
  scheduled: number
  cancelled: number
}

export interface InsightPace {
  slotsPerWeek: number
  weeksElapsed: number
  expected: number
  completed: number
  pct: number
}

export interface AssessmentTypeCounts {
  quiz: number
  assignment: number
  exam: number
  other: number
}

export interface AssessmentRollup {
  total: number
  published: number
  submissions: number
  graded: number
  avgPct: number
  byType: AssessmentTypeCounts
}

export interface SubjectInsight {
  curriculumId: string
  courseId: string
  courseCode: string
  courseName: string
  facultyId: string
  facultyName: string
  branch: string
  batch: string
  semester: number
  credits: number
  totalHours: number
  modulesCount: number
  hoursPlanned: number
  hoursDelivered: number
  hoursPct: number
  classesNeeded: number
  topics: InsightTopics
  modules: Array<{
    moduleNo: string
    moduleName: string
    hours: number
    classesNeeded: number
    total: number
    covered: number
    pct: number
  }>
  sessions: InsightSessions
  pace: InsightPace
  attendance: InsightAttendance
  assessments: AssessmentRollup
}

export interface SemesterInsight {
  semester: number
  label: string
  subjectCount: number
  topics: InsightTopics
  hoursPlanned: number
  hoursDelivered: number
  hoursPct: number
  classesNeeded: number
  sessions: InsightSessions
  attendance: InsightAttendance
  assessments: AssessmentRollup
  subjects: SubjectInsight[]
}

export interface AssessmentInsight {
  id: string
  title: string
  type: string
  bucket: 'quiz' | 'assignment' | 'exam' | 'other'
  status: string
  totalMarks: number
  scheduledDate: string
  submissions: number
  graded: number
  avgMarks: number
  avgPct: number
  highest: number
  lowest: number
}

export interface StudentSubmissionRow {
  assessmentId: string
  title: string
  type: string
  bucket: 'quiz' | 'assignment' | 'exam' | 'other'
  marksObtained: number
  totalMarks: number
  pct: number
  status: string
}

export interface StudentInsightRow {
  studentId: string
  name: string
  regNo: string
  semester: number
  branch: string
  batch: string
  attendance: InsightAttendance
  avgPct: number | null
  totals: { obtained: number; max: number; pct: number | null }
  submissions: StudentSubmissionRow[]
}

export interface AttendanceTrendPoint {
  date: string
  startTime: string
  topic: string
  status: string
  present: number
  marked: number
  pct: number
}

export interface SubjectDrill {
  subject: SubjectInsight
  assessmentDetail: AssessmentInsight[]
  attendanceTrend: AttendanceTrendPoint[]
  students: StudentInsightRow[]
}

export interface AcademicInsightsResult {
  collegeId: string
  from: string
  to: string
  generatedAt: string
  semesters: SemesterInsight[]
  totals: {
    subjectCount: number
    topics: InsightTopics
    hoursPlanned: number
    hoursDelivered: number
    hoursPct: number
    classesNeeded: number
    sessions: InsightSessions
    attendance: InsightAttendance
    assessments: AssessmentRollup
  }
  subject?: SubjectDrill
}

export interface AcademicInsightsInput {
  /** Superadmin only — everyone else is pinned to their own college. */
  collegeId?: string
  semester?: string
  branch?: string
  batch?: string
  facultyId?: string
  /** When set the result carries `subject` — the single-subject drill-down. */
  curriculumId?: string
  from?: string
  to?: string
}

/** Overview (no curriculumId) or one-subject drill (with curriculumId). */
export async function getAcademicInsights(
  input: AcademicInsightsInput = {}
): Promise<AcademicInsightsResult> {
  const call = httpsCallable<Record<string, unknown>, AcademicInsightsResult>(
    functions,
    'getAcademicInsights'
  )
  try {
    const response = await call({
      ...(input.collegeId ? { collegeId: input.collegeId } : {}),
      ...(input.semester ? { semester: input.semester } : {}),
      ...(input.branch ? { branch: input.branch } : {}),
      ...(input.batch ? { batch: input.batch } : {}),
      ...(input.facultyId ? { facultyId: input.facultyId } : {}),
      ...(input.curriculumId ? { curriculumId: input.curriculumId } : {}),
      ...(input.from ? { from: input.from } : {}),
      ...(input.to ? { to: input.to } : {}),
    })
    return response.data
  } catch (error) {
    throw new Error(
      describeSessionError(error, 'Academic insights could not be loaded.', SESSION_WRITER_MESSAGES)
    )
  }
}
