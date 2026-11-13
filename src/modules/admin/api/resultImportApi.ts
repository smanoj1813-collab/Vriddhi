// src/modules/admin/api/resultImportApi.ts
// Karnataka college result import: explicit scheme, approved courses, audited drafts.

import * as XLSX from '@e965/xlsx';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/data';
import { getCollegeSchemeConfiguration } from './schemePackApi';
import { evaluateImportRow } from '../utils/resultImportEngine';
import { selectCollegeScheme } from '../../../../functions/src/academic/collegeSchemes';
export { groupResultsByStudent } from '../utils/resultImportEngine';

import type { ResultImportRow, ResultImportPreview, ParsedResult } from '../types/resultImport';

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college ID found');
  return id;
}

function toString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

// Parse Excel/CSV file for result import
export async function parseResultFile(file: File): Promise<ResultImportPreview> {
  const configuration = await getCollegeSchemeConfiguration(getCollegeId());
  const { pack } = selectCollegeScheme(configuration);
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  if (jsonData.length < 2) {
    throw new Error('File is empty or has no data rows. Need header + at least 1 data row.');
  }

  const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase().replace(/\s+/g, ''));
  const rows: ResultImportRow[] = [];
  const errors: Array<{ rowNumber: number; message: string }> = [];
  const warnings: Array<{ rowNumber: number; message: string }> = [];

  // Map header indices
  const headerMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerMap[h] = idx;
    // Aliases
    if (h === 'usn' || h === 'registrationno' || h === 'registrationnumber') headerMap['regno'] = idx;
    if (h === 'studentname' || h === 'name') headerMap['name'] = idx;
    if (h === 'subjectcode' || h === 'code' || h === 'coursecode') headerMap['subjectcode'] = idx;
    if (h === 'subjectname' || h === 'subject' || h === 'coursename') headerMap['subjectname'] = idx;
    if (h === 'internalmarks' || h === 'ia' || h === 'internal') headerMap['internal'] = idx;
    if (h === 'externalmarks' || h === 'external' || h === 'university' || h === 'ue') headerMap['external'] = idx;
    if (h === 'totalmarks' || h === 'total' || h === 'marks') headerMap['total'] = idx;
    if (h === 'program' || h === 'programme') headerMap['course'] = idx;
  });

  const requiredHeaders = ['regno', 'semester', 'subjectcode', 'course'];
  const missingHeaders = requiredHeaders.filter(h => headerMap[h] === undefined);
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}. Expected: regNo, name, semester, subjectCode, subjectName, internal, external, total, credits, grade etc.`);
  }

  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i] as any[];
    if (!rowData || rowData.length === 0 || rowData.every(cell => cell == null || String(cell).trim() === '')) {
      continue; // Skip empty rows
    }

    const get = (key: string): string => {
      const idx = headerMap[key];
      if (idx === undefined) return '';
      return toString(rowData[idx]);
    };

    const getNum = (key: string): number | undefined => {
      const val = get(key);
      if (!val) return undefined;
      const num = Number(val);
      return Number.isFinite(num) ? num : undefined;
    };

    const regNo = get('regno') || get('usn');
    const subjectCode = get('subjectcode');
    const subjectName = get('subjectname');

    if (!regNo || !subjectCode) {
      errors.push({ rowNumber: i + 1, message: `Missing regNo or subjectCode at row ${i + 1}` });
      continue;
    }

    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];
    for (const field of ['internal', 'external', 'total', 'credits', 'semester', 'maxmarks', 'gradepoint']) {
      if (get(field) && getNum(field) === undefined) rowErrors.push(`${field} is not a finite number`);
    }
    const row: ResultImportRow = {
      rowNumber: i + 1, regNo, usn: get('usn') || regNo, name: get('name') || 'Unknown', email: get('email'),
      course: get('course'), batch: get('batch') || get('academicyear'), semester: getNum('semester') ?? NaN,
      subjectCode, subjectName, credits: getNum('credits'), internal: getNum('internal'), external: getNum('external'),
      total: getNum('total'), maxMarks: getNum('maxmarks'), grade: get('grade') || undefined, gradePoint: getNum('gradepoint'),
      result: (get('result').toUpperCase() || undefined) as ResultImportRow['result'], marksCardNo: get('markscardno'),
    };
    try {
      const rowPack = selectCollegeScheme(configuration, { programme: row.course, batch: row.batch, semester: row.semester }).pack;
      const evaluated = evaluateImportRow(row, rowPack);
      Object.assign(row, { credits: evaluated.credits, internal: evaluated.internal, external: evaluated.external, total: evaluated.total, maxMarks: evaluated.maxMarks, grade: evaluated.grade, gradePoint: evaluated.gradePoint, result: evaluated.result, subjectName: evaluated.subject });
      if (!evaluated.isPass) rowWarnings.push(evaluated.remarks);
    } catch (err) { rowErrors.push(err instanceof Error ? err.message : 'Invalid academic result'); }
    row.isValid = rowErrors.length === 0;
    row.errors = rowErrors; row.warnings = rowWarnings;
    rows.push(row);

    if (rowErrors.length > 0) {
      errors.push({ rowNumber: i + 1, message: rowErrors.join('; ') });
    }
    if (rowWarnings.length > 0) {
      rowWarnings.forEach(w => warnings.push({ rowNumber: i + 1, message: w }));
    }
  }

  const identities = new Map<string, ResultImportRow>();
  for (const row of rows) {
    const key = `${row.regNo.trim().toUpperCase()}|${row.semester}|${row.subjectCode.trim().toUpperCase()}`;
    const previous = identities.get(key);
    if (previous) {
      const message = `Duplicate student/semester/course (also row ${previous.rowNumber})`;
      row.isValid = false; previous.isValid = false;
      row.errors?.push(message); errors.push({ rowNumber: row.rowNumber, message });
    } else identities.set(key, row);
  }
  // Summary
  const uniqueStudents = new Set(rows.map(r => r.regNo)).size;
  const totalSubjects = rows.length;
  const passCount = rows.filter(r => r.isValid && (r.result === 'P' || r.result === 'PASS')).length;
  const failCount = rows.filter(r => r.isValid && ['F', 'FAIL', 'A'].includes(r.result || '')).length;
  const totalMarks = rows.reduce((sum, r) => sum + (r.total || 0), 0);
  const averageMarks = rows.length > 0 ? totalMarks / rows.length : 0;

  const gradeDistribution: Record<string, number> = {};
  rows.forEach(r => {
    if (r.grade) {
      gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
    }
  });

  return {
    rows,
    schemePack: pack, // PRIMARY display only — each row is routed independently
    schemeConfiguration: configuration,
    summary: {
      totalStudents: uniqueStudents,
      totalSubjects,
      uniqueStudents,
      averageMarks,
      passCount,
      failCount,
      passPercentage: totalSubjects > 0 ? (passCount / totalSubjects) * 100 : 0,
      gradeDistribution,
    },
    errors,
    warnings,
  };
}

// Official imports now use the SAME server-validated draft/publish workflow as
// manual grade entry. Never publish nested shadow transcripts or overwrite CGPA.
export async function importResults(
  parsedResults: ParsedResult[],
  academicYear: string,
  examType: 'regular' | 'supplementary' | 'revaluation' = 'regular',
): Promise<{ imported: number; updated: number; failed: number; errors: Array<{ regNo: string; message: string }> }> {
  const collegeId = getCollegeId();
  const configuration = await getCollegeSchemeConfiguration(collegeId); // fresh snapshots, never a fallback
  if (parsedResults.some(r => { const policy = selectCollegeScheme(configuration, { programme: r.course, batch: r.batch, semester: r.semester }); return r.schemePackId !== policy.schemePackId || r.schemePackRevision !== policy.revision || r.schemeConfigurationRevision !== configuration.revision; })) throw new Error('College scheme changed since preview. Parse the file again before saving.');
  const save = httpsCallable<Record<string, unknown>, { saved: number; created?: number; updated?: number }>(functions, 'saveDraftGradeRecords');
  let imported = 0; let updated = 0; let failed = 0;
  const errors: Array<{ regNo: string; message: string }> = [];
  for (const result of parsedResults) {
    try {
      let students: Awaited<ReturnType<typeof getDocs>> | undefined;
      for (const [field, value] of [['regNo', result.regNo], ['usn', result.usn], ['registrationNumber', result.regNo]]) {
        if (!value) continue;
        const snap = await getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId), where(field!, '==', value), limit(2)));
        if (snap.size > 1) throw new Error('Multiple student profiles match this registration number. Resolve the duplicate first.');
        if (!snap.empty) { students = snap; break; }
      }
      if (!students || students.empty) throw new Error(`Student not found for ${result.regNo}`);
      if (result.subjects.length > 200) throw new Error('At most 200 courses per student/semester can be saved at once');
      const response = await save({ collegeId, schemePackId: result.schemePackId, schemePackRevision: result.schemePackRevision, schemeConfigurationRevision: configuration.revision,
        importMetadata: { academicYear, examType },
        records: result.subjects.map(subject => ({ studentId: students!.docs[0].id, semester: result.semester, code: subject.subjectCode, subject: subject.subjectName,
          credits: subject.credits, internal: subject.internal, external: subject.external, total: subject.total, grade: subject.grade, gradePoint: subject.gradePoint, result: subject.result })),
      });
      imported += response.data.created ?? response.data.saved;
      updated += response.data.updated ?? 0;
    } catch (err) { failed++; errors.push({ regNo: result.regNo, message: err instanceof Error ? err.message : 'Draft could not be saved' }); }
  }
  return { imported, updated, failed, errors };
}

export function downloadResultTemplate() {
  // Placeholders, not fictional BCU regulations, credits, grade points or SGPA.
  // Optional derived columns stay blank; the assigned approved course supplies them.
  const headers = ['regNo', 'name', 'semester', 'subjectCode', 'subjectName', 'credits', 'internal', 'external', 'total', 'grade', 'gradePoint', 'result', 'course', 'batch'];
  const sampleRows = [
    ['REPLACE_WITH_REG_NO', 'Student name', '1', 'APPROVED_COURSE_CODE', '', '', '', '', '', '', '', '', 'EXACT_PROGRAMME', 'ADMISSION_BATCH'],
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'college_result_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
