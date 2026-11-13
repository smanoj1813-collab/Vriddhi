import type { UniversitySchemePack } from '@/shared/types/schemePack';
import type { ParsedResult, ResultImportRow } from '../types/resultImport';
import { deriveOfficialGrade } from '../../../../functions/src/academic/gradePolicy';
import { summarizeCredits } from '../../../../functions/src/academic/creditEngine';
import { selectCollegeScheme, type CollegeSchemeConfiguration } from '../../../../functions/src/academic/collegeSchemes';
import { academicKey } from '../../../../functions/src/academic/schemeValidation';

export function evaluateImportRow(row: ResultImportRow, pack: UniversitySchemePack) {
  if (!row.regNo.trim()) throw new Error('Registration number is required');
  const derived = deriveOfficialGrade({ ...row, code: row.subjectCode }, pack, { programme: row.course, batch: row.batch, semester: row.semester });
  if (row.maxMarks !== undefined && row.maxMarks !== derived.maxMarks) throw new Error(`Maximum marks must match the approved assessment profile (${derived.maxMarks}); marks will not be ratio-scaled.`);
  return derived;
}
/** Semesters never mix, duplicate courses never silently double the credits. */
export function groupResultsByStudent(rows: ResultImportRow[], policy: UniversitySchemePack | CollegeSchemeConfiguration): ParsedResult[] {
  const groups = new Map<string, ResultImportRow[]>();
  for (const row of rows) {
    if (row.isValid === false) continue;
    const key = `${row.regNo.trim().toUpperCase()}|${row.semester}`;
    const group = groups.get(key) ?? [];
    if (group.some(r => r.subjectCode.trim().toUpperCase() === row.subjectCode.trim().toUpperCase())) throw new Error(`Duplicate course ${row.subjectCode} for ${row.regNo}, semester ${row.semester}`);
    if (group.length && (academicKey(group[0].course) !== academicKey(row.course) || academicKey(group[0].batch) !== academicKey(row.batch))) throw new Error(`Inconsistent programme/batch for ${row.regNo}, semester ${row.semester}`);
    group.push(row); groups.set(key, group);
  }
  return [...groups.values()].map(studentRows => {
    const first = studentRows[0];
    const pack = 'assignments' in policy ? selectCollegeScheme(policy, { programme: first.course, batch: first.batch, semester: first.semester }).pack : policy;
    const subjects = studentRows.map(r => {
      const derived = evaluateImportRow(r, pack);
      return { ...derived, subjectCode: derived.code, subjectName: derived.subject };
    });
    const totalMarks = subjects.reduce((s, r) => s + r.total, 0);
    const maxTotalMarks = subjects.reduce((s, r) => s + r.maxMarks, 0);
    const credits = summarizeCredits(subjects, false);
    return { studentName: first.name, regNo: first.regNo, usn: first.usn, semester: first.semester, course: first.course, batch: first.batch,
      ...('assignments' in policy ? { schemeConfigurationRevision: policy.revision } : {}),
      schemePackId: pack.id, schemePackRevision: pack.revision ?? 1, subjects, totalMarks, maxTotalMarks, percentage: maxTotalMarks > 0 ? totalMarks / maxTotalMarks * 100 : 0,
      sgpa: credits.gpa, result: subjects.every(s => s.isPass) ? 'PASS' as const : 'FAIL' as const, creditsEarned: credits.earnedCredits, totalCredits: credits.attemptedCredits };
  });
}
