// src/shared/utils/bcuCompliance.ts
// BCU / Karnataka University Compliance Utilities
// Based on BCU SEP 2024 Syllabus & NEP 2020 Model Regulations

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
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;

  if (percentage < 75) {
    return {
      percentage,
      marks: 0,
      isEligible: false,
      remarks: 'Not eligible - Attendance below 75% (BCU Ordinance)',
      color: 'rose',
    };
  }
  if (percentage >= 91) {
    return {
      percentage,
      marks: 5,
      isEligible: true,
      remarks: 'Excellent attendance - 5 marks',
      color: 'emerald',
    };
  }
  if (percentage >= 86) {
    return {
      percentage,
      marks: 4,
      isEligible: true,
      remarks: 'Good attendance - 4 marks',
      color: 'teal',
    };
  }
  if (percentage >= 81) {
    return {
      percentage,
      marks: 3,
      isEligible: true,
      remarks: 'Satisfactory - 3 marks',
      color: 'blue',
    };
  }
  // 76-80%
  return {
    percentage,
    marks: 2,
    isEligible: true,
    remarks: 'Minimum eligible - 2 marks',
    color: 'amber',
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
  const { test1Marks, test2Marks, test3Marks, assignmentMarks, attendancePercentage } = input;

  // Best 2 tests average -> out of 10
  const tests = [test1Marks, test2Marks, ...(test3Marks !== undefined ? [test3Marks] : [])];
  const sorted = [...tests].sort((a, b) => b - a);
  const bestTwo = sorted.slice(0, 2);
  const bestTwoAvg = bestTwo.reduce((a, b) => a + b, 0) / bestTwo.length;
  const testAverage = (bestTwoAvg / 20) * 10; // Convert 20 -> 10

  // Attendance marks
  const attendanceResult = calculateBCUAttendanceMarks(attendancePercentage);
  const attMarks = attendanceResult.isEligible ? attendanceResult.marks : 0;

  // Assignment marks - capped at 5
  const assignMarks = Math.min(5, Math.max(0, assignmentMarks));

  const totalIA = testAverage + attMarks + assignMarks;

  return {
    testAverage: Math.round(testAverage * 100) / 100,
    attendanceMarks: attMarks,
    assignmentMarks: assignMarks,
    totalIA: Math.round(totalIA * 100) / 100,
    isEligible: attendanceResult.isEligible,
    breakdown: `Tests: ${testAverage.toFixed(1)}/10 (Best 2 avg: ${bestTwoAvg.toFixed(1)}/20) + Attendance: ${attMarks}/5 (${attendancePercentage}%) + Assignment: ${assignMarks}/5 = ${totalIA.toFixed(1)}/20`,
  };
}

/**
 * NEP 2020 Continuous Assessment (C1 + C2)
 * Source: BCU Model Regulations 2021
 * C1 = 20% (after 50% syllabus, within 45 working days)
 * C2 = 20% (remaining)
 * Semester End = 60%
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
  const maxTotal = maxUni + maxInt;
  const total = input.universityMarks + input.internalMarks;

  const uniPerc = (input.universityMarks / maxUni) * 100;
  const aggPerc = (total / maxTotal) * 100;

  const isPassInUniversity = uniPerc >= 35; // 28/80
  const isPassInAggregate = aggPerc >= 40;

  const isPass = isPassInUniversity && isPassInAggregate;

  let remarks = '';
  if (!isPassInUniversity && !isPassInAggregate) {
    remarks = `Fail - Need 35% in university exam (28/80) and 40% aggregate. Got ${uniPerc.toFixed(1)}% in university, ${aggPerc.toFixed(1)}% aggregate`;
  } else if (!isPassInUniversity) {
    remarks = `Fail - Need 35% in university exam (28/80). Got ${uniPerc.toFixed(1)}% (${input.universityMarks}/${maxUni})`;
  } else if (!isPassInAggregate) {
    remarks = `Fail - Need 40% aggregate. Got ${aggPerc.toFixed(1)}% (${total}/${maxTotal})`;
  } else {
    remarks = `Pass - ${uniPerc.toFixed(1)}% in university, ${aggPerc.toFixed(1)}% aggregate`;
  }

  return {
    universityPercentage: Math.round(uniPerc * 100) / 100,
    aggregatePercentage: Math.round(aggPerc * 100) / 100,
    totalMarks: total,
    maxTotal,
    isPassInUniversity,
    isPassInAggregate,
    isPass,
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
  if (subjects.length === 0) return 0;
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalPoints = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

export function getGradeFromMarks(marks: number, maxMarks: number = 100): { grade: string; gradePoint: number; description: string } {
  const perc = (marks / maxMarks) * 100;
  if (perc >= 90) return { grade: 'O', gradePoint: 10, description: 'Outstanding' };
  if (perc >= 80) return { grade: 'A+', gradePoint: 9, description: 'Excellent' };
  if (perc >= 70) return { grade: 'A', gradePoint: 8, description: 'Very Good' };
  if (perc >= 60) return { grade: 'B+', gradePoint: 7, description: 'Good' };
  if (perc >= 50) return { grade: 'B', gradePoint: 6, description: 'Above Average' };
  if (perc >= 40) return { grade: 'C', gradePoint: 5, description: 'Average' };
  if (perc >= 35) return { grade: 'P', gradePoint: 4, description: 'Pass' };
  return { grade: 'F', gradePoint: 0, description: 'Fail' };
}

// Attendance eligibility for exam - core BCU rule
export function isEligibleForExam(attendancePercentage: number): boolean {
  return attendancePercentage >= 75;
}

export function getAttendanceEligibilityMessage(percentage: number): string {
  if (percentage < 75) {
    return `Not eligible for university exam - Attendance ${percentage.toFixed(1)}% is below 75% minimum (BCU Ordinance)`;
  }
  if (percentage < 80) {
    return `Eligible but low attendance - ${percentage.toFixed(1)}% - 2 marks in IA`;
  }
  return `Eligible - ${percentage.toFixed(1)}% attendance`;
}
