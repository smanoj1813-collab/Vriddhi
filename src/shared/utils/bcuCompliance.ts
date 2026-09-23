// src/shared/utils/bcuCompliance.ts
// BCU / Karnataka University Compliance Utilities
// Based on BCU SEP 2024 Syllabus & NEP 2020 Model Regulations
//
// ─── G1 refactor ────────────────────────────────────────────────────────────
// All evaluation logic moved to the scheme-pack engine
// (src/shared/utils/schemeEngine.ts + types/schemePack.ts). Every export here
// is a thin wrapper that binds the BCU_SEP_2024 pack, and every function
// returns the same values (and the same prose) it did before G1 — this module
// stays the BCU-specific facade while SchemePacks.tsx / schemePackApi.ts /
// the result importer work with the college's actual university pack.

import {
  calculateSchemeAttendanceMarks,
  calculateSchemeInternalMarks,
  checkSchemePassCriteria,
  getSchemeGradeFromMarks,
  calculateSchemeSGPA,
} from './schemeEngine';
import { BCU_SEP_2024, type UniversitySchemePack } from '../types/schemePack';

const PACK = BCU_SEP_2024;

/**
 * BCU Attendance Marks Calculation
 * Source: BCU BBA Syllabus SEP 2024 - Scheme of Examination
 *
 * 76% to 80% = 02 marks
 * 81% to 85% = 03 marks
 * 86% to 90% = 04 marks
 * 91% to 100% = 05 marks
 * Below 75% = Not eligible for exam
 */
export interface AttendanceMarksResult {
  percentage: number;
  marks: number;
  isEligible: boolean;
  remarks: string;
  color: string;
}

export function calculateBCUAttendanceMarks(percentage: number): AttendanceMarksResult {
  const r = calculateSchemeAttendanceMarks(percentage, PACK);
  const pct = Math.min(100, Math.max(0, percentage));
  if (!r.isEligible) {
    return {
      percentage: pct,
      marks: 0,
      isEligible: false,
      remarks: 'Not eligible - Attendance below 75% (BCU Ordinance)',
      color: 'rose',
    };
  }
  return {
    percentage: pct,
    marks: r.marks,
    isEligible: true,
    remarks: `${r.slabLabel === 'Minimum eligible' ? 'Minimum eligible' : r.slabLabel} attendance - ${r.marks} marks`,
    color: r.color,
  };
}

/**
 * BCU IA (Internal Assessment) Calculation
 * Source: BCU SEP 2024
 *
 * Total IA = 20 marks
 * - 10 marks: Average of best 2 tests (20 marks each, 1 hour duration)
 * - 05 marks: Attendance (as per slab above)
 * - 05 marks: Assignment / Skill development / Record
 *
 * For NEP 2020: C1=20% + C2=20% + Semester End=60%
 */
export interface IAMarksInput {
  test1Marks: number; // Out of 20
  test2Marks: number; // Out of 20
  test3Marks?: number; // Optional 3rd test - best 2 considered
  assignmentMarks: number; // Out of 5
  attendancePercentage: number;
}

export interface IAMarksResult {
  testAverage: number; // Out of 10
  attendanceMarks: number; // Out of 5
  assignmentMarks: number; // Out of 5
  totalIA: number; // Out of 20
  isEligible: boolean;
  breakdown: string;
}

export function calculateBCUIAMarks(input: IAMarksInput): IAMarksResult {
  const tests = [input.test1Marks, input.test2Marks, ...(input.test3Marks !== undefined ? [input.test3Marks] : [])];
  const r = calculateSchemeInternalMarks(
    { testMarks: tests, assignmentMarks: input.assignmentMarks, attendancePercentage: input.attendancePercentage },
    PACK,
  );
  const sorted = [...tests].sort((a, b) => b - a);
  const bestTwo = sorted.slice(0, 2);
  const bestTwoAvg = bestTwo.reduce((a, b) => a + b, 0) / bestTwo.length;
  return {
    testAverage: r.testAverage,
    attendanceMarks: r.attendanceMarks,
    assignmentMarks: r.assignmentMarks,
    totalIA: r.totalIA,
    isEligible: r.isEligible,
    breakdown: `Tests: ${r.testAverage.toFixed(1)}/10 (Best 2 avg: ${bestTwoAvg.toFixed(1)}/20) + Attendance: ${r.attendanceMarks}/5 (${input.attendancePercentage}%) + Assignment: ${r.assignmentMarks}/5 = ${r.totalIA.toFixed(1)}/20`,
  };
}

/**
 * NEP 2020 Continuous Assessment (C1 + C2)
 * Source: BCU Model Regulations 2021
 * C1 = 20% (after 50% syllabus, within 45 working days)
 * C2 = 20% (remaining)
 * Semester End = 60%
 *
 * NOTE: C1/C2 seminar-style decomposition is a BCU-specific structure and
 * stays hardcoded here — packs model the totals, not this sub-structure.
 */
export interface NEPAssessmentInput {
  c1Test?: number; // 10%
  c1Seminar?: number; // 10%
  c1Assignment?: number; // 10% - but total C1 is 20%, so 10+10 pattern
  c2Test?: number;
  c2Seminar?: number;
  c2Assignment?: number;
}

export interface NEPAssessmentResult {
  c1Total: number; // Out of 20
  c2Total: number; // Out of 20
  internalTotal: number; // Out of 40
  isEligible: boolean;
}

export function calculateNEPInternal(input: NEPAssessmentInput): NEPAssessmentResult {
  const c1 = (input.c1Test || 0) + (input.c1Seminar || 0);
  const c2 = (input.c2Test || 0) + (input.c2Assignment || 0);

  // Cap at 20 each
  const c1Total = Math.min(20, c1);
  const c2Total = Math.min(20, c2);

  return {
    c1Total,
    c2Total,
    internalTotal: c1Total + c2Total,
    isEligible: true, // NEP has no attendance blocking for IA, but 75% for semester end
  };
}

/**
 * BCU Pass Criteria
 * Source: BCU Syllabus
 * - Minimum 35% in university examination (28/80)
 * - Minimum 40% in aggregate (university + IA) in each subject
 * - No minimum for IA alone
 */
export interface PassCriteriaInput {
  universityMarks: number; // Out of 80
  internalMarks: number; // Out of 20
  maxUniversityMarks?: number; // Default 80
  maxInternalMarks?: number; // Default 20
}

export interface PassCriteriaResult {
  universityPercentage: number;
  aggregatePercentage: number;
  totalMarks: number;
  maxTotal: number;
  isPassInUniversity: boolean;
  isPassInAggregate: boolean;
  isPass: boolean;
  remarks: string;
}

export function checkBCUPassCriteria(input: PassCriteriaInput): PassCriteriaResult {
  const maxUni = input.maxUniversityMarks || 80;
  const maxInt = input.maxInternalMarks || 20;
  const r = checkSchemePassCriteria(
    {
      semesterEndMarks: input.universityMarks,
      internalMarks: input.internalMarks,
      maxSemesterEndMarks: maxUni,
      maxInternalMarks: maxInt,
    },
    PACK,
  );
  const uniPerc = r.semesterEndPercentage;
  const aggPerc = r.aggregatePercentage;

  let remarks = '';
  if (!r.isPassInSemesterEnd && !r.isPassInAggregate) {
    remarks = `Fail - Need 35% in university exam (28/80) and 40% aggregate. Got ${uniPerc.toFixed(1)}% in university, ${aggPerc.toFixed(1)}% aggregate`;
  } else if (!r.isPassInSemesterEnd) {
    remarks = `Fail - Need 35% in university exam (28/80). Got ${uniPerc.toFixed(1)}% (${input.universityMarks}/${maxUni})`;
  } else if (!r.isPassInAggregate) {
    remarks = `Fail - Need 40% aggregate. Got ${aggPerc.toFixed(1)}% (${r.totalMarks}/${r.maxTotal})`;
  } else {
    remarks = `Pass - ${uniPerc.toFixed(1)}% in university, ${aggPerc.toFixed(1)}% aggregate`;
  }

  return {
    universityPercentage: uniPerc,
    aggregatePercentage: aggPerc,
    totalMarks: r.totalMarks,
    maxTotal: r.maxTotal,
    isPassInUniversity: r.isPassInSemesterEnd,
    isPassInAggregate: r.isPassInAggregate,
    isPass: r.isPass,
    remarks,
  };
}

/**
 * SGPA / CGPA Calculation per NEP
 */
export interface SubjectGrade {
  credits: number;
  gradePoint: number; // O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0
}

export function calculateSGPA(subjects: SubjectGrade[]): number {
  return calculateSchemeSGPA(subjects);
}

export function getGradeFromMarks(marks: number, maxMarks: number = 100): { grade: string; gradePoint: number; description: string } {
  return getSchemeGradeFromMarks(marks, maxMarks, PACK);
}

// Attendance eligibility for exam - core BCU rule
export function isEligibleForExam(attendancePercentage: number): boolean {
  return attendancePercentage >= PACK.attendance.minimumPercentage;
}

export function getAttendanceEligibilityMessage(percentage: number): string {
  const min = PACK.attendance.minimumPercentage;
  if (percentage < min) {
    return `Not eligible for university exam - Attendance ${percentage.toFixed(1)}% is below ${min}% minimum (BCU Ordinance)`;
  }
  if (percentage < 80) {
    const r = calculateSchemeAttendanceMarks(percentage, PACK);
    // 75–75.99 falls between the eligibility floor and the first slab — the
    // historical message always cited the lowest slab's marks.
    return `Eligible but low attendance - ${percentage.toFixed(1)}% - ${r.marks || 2} marks in IA`;
  }
  return `Eligible - ${percentage.toFixed(1)}% attendance`;
}

/** Re-exported so pack-aware callers can share one import site. */
export type { UniversitySchemePack };
