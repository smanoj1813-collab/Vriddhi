// src/modules/student/utils/attendanceDigest.ts
//
// Pure mapping from the `attendanceSummaries/{studentId}` document (item 3.1,
// maintained by functions/src/attendanceSummary.ts) onto the shape the student
// screens already render. Deliberately free of Firebase imports so it can be
// unit-tested without a project — the numbers it produces decide a student's
// attendance percentage.

export interface AttendanceSummaryRow {
  id: string;
  date: string;
  subject: string;
  subjectCode?: string;
  status: string;
  checkInTime?: string;
  notes?: string;
  markedAt?: string;
}

export interface AttendanceViewData {
  percentage: number;
  requiredPercentage: number;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  monthlyBreakdown: { month: string; total: number; present: number; absent: number; percentage: number }[];
  records: AttendanceSummaryRow[];
}

export interface AttendanceSummaryDocLike {
  total?: number;
  present?: number;
  absent?: number;
  late?: number;
  leave?: number;
  onDuty?: number;
  medicalLeave?: number;
  byMonth?: Record<string, { total?: number; present?: number; absent?: number }>;
  recent?: AttendanceSummaryRow[];
  updatedAt?: string;
}

/** Maps the summary document onto the shape the student screens already render. */
export function attendanceFromSummary(doc: AttendanceSummaryDocLike): AttendanceViewData {
  const total = Number(doc.total) || 0;
  const present = Number(doc.present) || 0;
  const onDuty = Number(doc.onDuty) || 0;
  const late = Number(doc.late) || 0;
  const monthlyBreakdown = Object.entries(doc.byMonth || {})
    .map(([month, bucket]) => {
      const monthTotal = Number(bucket?.total) || 0;
      const monthPresent = Number(bucket?.present) || 0;
      return {
        month,
        total: monthTotal,
        present: monthPresent,
        absent: Number(bucket?.absent) || 0,
        percentage: monthTotal ? Math.round((monthPresent / monthTotal) * 100) : 0,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    // attended = present + onDuty + late, exactly as the raw path computes it.
    percentage: total ? Math.round(((present + onDuty + late) / total) * 100) : 0,
    requiredPercentage: 75,
    totalClasses: total,
    present: present + onDuty,
    absent: Number(doc.absent) || 0,
    late,
    excused: (Number(doc.leave) || 0) + (Number(doc.medicalLeave) || 0),
    monthlyBreakdown,
    records: Array.isArray(doc.recent) ? (doc.recent as AttendanceSummaryRow[]) : [],
  };
}

