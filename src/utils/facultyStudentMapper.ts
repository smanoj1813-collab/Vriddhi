// src/utils/facultyStudentMapper.ts
// ============================================================
// Mapper: StudentIndex → FacultyStudent (for faculty dashboard compat)
// ============================================================

import type { StudentIndex } from '../types/students';
import type { FacultyStudent } from '../modules/faculty/types/attendance';

function computeStatus(attendance: number, score: number): 'good' | 'average' | 'weak' {
  if (attendance >= 85 && score >= 80) return 'good';
  if (attendance < 75 || score < 60) return 'weak';
  return 'average';
}

/** Convert StudentIndex to FacultyStudent shape */
export function toFacultyStudent(s: StudentIndex): FacultyStudent {
  // StudentIndex has no attendancePercentage, avgScore, or semester yet
  // They will be populated from attendance/assessment collections later
  const attendance = 0;
  const score = 0;

  return {
    id: s.id,
    name: s.name,
    usn: s.registrationNumber,       // ← ADDED: usn = regNo
    regNo: s.registrationNumber,
    rollNo: s.registrationNumber,
    branch: s.department,
    batch: String(s.batch),
    division: s.division,            // ← ADDED
    semester: 0,                    // ← ADDED: default until curriculum data is wired
    attendancePercentage: attendance,
    avgScore: score,
    status: computeStatus(attendance, score),
  };
}

/** Batch convert */
export function toFacultyStudents(students: StudentIndex[]): FacultyStudent[] {
  return students.map(toFacultyStudent);
}

/** Build display label for faculty view */
export function getFacultyStudentLabel(s: FacultyStudent): string {
  return `${s.name} (${s.regNo}) — ${s.branch} ${s.batch}`;
}