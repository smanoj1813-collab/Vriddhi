// src/modules/admin/api/resultImportApi.ts
// University Result Importer API - BCU, BNU, Davangere, Rani Channamma

import * as XLSX from '@e965/xlsx';
import { collection, getDocs, query, where, limit, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { calculateBCUAttendanceMarks, checkBCUPassCriteria, getGradeFromMarks, calculateSGPA } from '@/shared/utils/bcuCompliance';
import type { ResultImportRow, ResultImportPreview, ParsedResult } from '../types/resultImport';

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college ID found');
  return id;
}

function numeric(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

// Parse Excel/CSV file for result import
export async function parseResultFile(file: File): Promise<ResultImportPreview> {
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
  });

  const requiredHeaders = ['regno', 'subjectcode', 'subjectname'];
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

    const internal = getNum('internal');
    const external = getNum('external');
    let total = getNum('total');
    const credits = getNum('credits') || 4;
    const semester = getNum('semester') || 1;
    const maxMarks = getNum('maxmarks') || 100;

    // Auto-calculate total if not provided but internal+external present
    if (total === undefined && internal !== undefined && external !== undefined) {
      total = internal + external;
    }

    // Validate marks
    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];

    if (internal !== undefined && (internal < 0 || internal > 20)) {
      rowWarnings.push(`Internal ${internal} out of expected 0-20 range`);
    }
    if (external !== undefined && (external < 0 || external > 80)) {
      rowWarnings.push(`External ${external} out of expected 0-80 range (BCU)`);
    }
    if (total !== undefined && (total < 0 || total > maxMarks)) {
      rowErrors.push(`Total ${total} out of 0-${maxMarks} range`);
    }

    // Check pass criteria if we have marks
    if (external !== undefined && total !== undefined) {
      const passCheck = checkBCUPassCriteria({
        universityMarks: external,
        internalMarks: internal || 0,
        maxUniversityMarks: 80,
        maxInternalMarks: 20,
      });
      if (!passCheck.isPass) {
        rowWarnings.push(`Fail per BCU: ${passCheck.remarks}`);
      }
    }

    const grade = get('grade');
    const gradePoint = getNum('gradepoint');
    const resultRaw = get('result').toUpperCase();
    let result: 'P' | 'F' | 'A' | 'W' | 'PASS' | 'FAIL' = 'P';
    if (resultRaw) {
      if (['F', 'FAIL', 'FAILED'].includes(resultRaw)) result = 'F';
      else if (['A', 'ABSENT'].includes(resultRaw)) result = 'A';
      else if (['W', 'WITHHELD'].includes(resultRaw)) result = 'W';
      else result = 'P';
    }

    rows.push({
      rowNumber: i + 1,
      regNo,
      usn: get('usn') || regNo,
      name: get('name') || get('studentname') || 'Unknown',
      email: get('email'),
      course: get('course') || get('program'),
      batch: get('batch') || get('academicyear'),
      semester,
      subjectCode,
      subjectName,
      credits,
      internal,
      external,
      total,
      maxMarks,
      grade,
      gradePoint,
      result,
      sgpa: getNum('sgpa'),
      cgpa: getNum('cgpa'),
      marksCardNo: get('markscardno'),
      isValid: rowErrors.length === 0,
      errors: rowErrors,
      warnings: rowWarnings,
    });

    if (rowErrors.length > 0) {
      errors.push({ rowNumber: i + 1, message: rowErrors.join('; ') });
    }
    if (rowWarnings.length > 0) {
      rowWarnings.forEach(w => warnings.push({ rowNumber: i + 1, message: w }));
    }
  }

  // Summary
  const uniqueStudents = new Set(rows.map(r => r.regNo)).size;
  const totalSubjects = rows.length;
  const passCount = rows.filter(r => r.result === 'P' || r.result === 'PASS').length;
  const failCount = rows.filter(r => r.result === 'F' || r.result === 'FAIL').length;
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

// Group rows by student for SGPA calculation
export function groupResultsByStudent(rows: ResultImportRow[]): ParsedResult[] {
  const byStudent = new Map<string, ResultImportRow[]>();

  rows.forEach(row => {
    if (!byStudent.has(row.regNo)) {
      byStudent.set(row.regNo, []);
    }
    byStudent.get(row.regNo)!.push(row);
  });

  const results: ParsedResult[] = [];

  byStudent.forEach((studentRows, regNo) => {
    const first = studentRows[0];
    
    const subjects = studentRows.map(r => {
      const internal = r.internal || 0;
      const external = r.external || 0;
      const total = r.total || (internal + external);
      const maxMarks = r.maxMarks || 100;

      // Auto grade if not provided
      let grade = r.grade;
      let gradePoint = r.gradePoint;
      let isPass = r.result === 'P' || r.result === 'PASS';

      if (!grade || gradePoint === undefined) {
        const gradeInfo = getGradeFromMarks(total, maxMarks);
        grade = grade || gradeInfo.grade;
        gradePoint = gradePoint ?? gradeInfo.gradePoint;
        isPass = gradeInfo.grade !== 'F';
      }

      // Check BCU pass
      const passCheck = checkBCUPassCriteria({
        universityMarks: external,
        internalMarks: internal,
      });
      if (!passCheck.isPass) isPass = false;

      return {
        subjectCode: r.subjectCode,
        subjectName: r.subjectName,
        credits: r.credits || 4,
        internal,
        external,
        total,
        maxMarks,
        grade: grade || 'F',
        gradePoint: gradePoint || 0,
        result: isPass ? 'P' as const : 'F' as const,
        isPass,
      };
    });

    const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
    const maxTotalMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;
    
    const sgpa = calculateSGPA(subjects.map(s => ({ credits: s.credits, gradePoint: s.gradePoint })));
    const creditsEarned = subjects.filter(s => s.isPass).reduce((sum, s) => sum + s.credits, 0);
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    
    const failedSubjects = subjects.filter(s => !s.isPass).length;
    let result: 'PASS' | 'FAIL' | 'ATKT' = 'PASS';
    if (failedSubjects > 0) {
      result = failedSubjects <= 2 ? 'ATKT' : 'FAIL'; // ATKT if 1-2 subjects failed (BCU)
    }

    results.push({
      studentId: undefined, // Will be resolved
      studentName: first.name,
      regNo,
      usn: first.usn,
      semester: first.semester,
      course: first.course,
      batch: first.batch,
      subjects,
      totalMarks,
      maxTotalMarks,
      percentage,
      sgpa,
      result,
      creditsEarned,
      totalCredits,
    });
  });

  return results;
}

// Import results to Firestore
export async function importResults(
  parsedResults: ParsedResult[],
  academicYear: string,
  examType: 'regular' | 'supplementary' | 'revaluation' = 'regular',
  scheme: string = 'SEP 2024'
): Promise<{
  imported: number;
  updated: number;
  failed: number;
  errors: Array<{ regNo: string; message: string }>;
}> {
  const collegeId = getCollegeId();
  let imported = 0;
  let updated = 0;
  let failed = 0;
  const errors: Array<{ regNo: string; message: string }> = [];

  // Batch processing - Firestore batch max 500 operations
  const batches: Array<ReturnType<typeof writeBatch>> = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  for (const result of parsedResults) {
    try {
      // Find student by regNo
      const studentQuery = query(
        collection(db, 'students'),
        where('collegeId', '==', collegeId),
        where('regNo', '==', result.regNo),
        limit(1)
      );
      let studentSnap = await getDocs(studentQuery);
      
      // Try USN if regNo not found
      if (studentSnap.docs.length === 0 && result.usn) {
        const usnQuery = query(
          collection(db, 'students'),
          where('collegeId', '==', collegeId),
          where('usn', '==', result.usn),
          limit(1)
        );
        studentSnap = await getDocs(usnQuery);
      }

      // Try registrationNumber
      if (studentSnap.docs.length === 0) {
        const regQuery = query(
          collection(db, 'students'),
          where('collegeId', '==', collegeId),
          where('registrationNumber', '==', result.regNo),
          limit(1)
        );
        studentSnap = await getDocs(regQuery);
      }

      if (studentSnap.docs.length === 0) {
        errors.push({ regNo: result.regNo, message: `Student not found in Vriddhi for ${result.regNo} (${result.studentName})` });
        failed++;
        continue;
      }

      const studentId = studentSnap.docs[0].id;
      const studentData = studentSnap.docs[0].data();

      // For each subject, create/update grade record
      for (const subject of result.subjects) {
        if (operationCount >= 400) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }

        // Check if grade record exists
        const gradeQuery = query(
          collection(db, 'colleges', collegeId, 'gradeRecords'),
          where('studentId', '==', studentId),
          where('code', '==', subject.subjectCode),
          where('semester', '==', result.semester),
          limit(1)
        );
        const gradeSnap = await getDocs(gradeQuery);

        const gradeData = {
          collegeId,
          studentId,
          studentName: result.studentName || studentData.name || 'Unknown',
          studentRegNo: result.regNo,
          semester: result.semester,
          subject: subject.subjectName,
          code: subject.subjectCode,
          credits: subject.credits,
          internal: subject.internal,
          external: subject.external,
          total: subject.total,
          grade: subject.grade,
          gradePoint: subject.gradePoint,
          status: 'published' as const,
          result: subject.result,
          isPass: subject.isPass,
          academicYear,
          examType,
          scheme,
          percentage: (subject.total / subject.maxMarks) * 100,
          sgpa: result.sgpa,
          resultStatus: result.result,
          creditsEarned: result.creditsEarned,
          totalCredits: result.totalCredits,
          importedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (gradeSnap.docs.length > 0) {
          currentBatch.update(gradeSnap.docs[0].ref, {
            ...gradeData,
            updatedAt: serverTimestamp(),
          });
          updated++;
        } else {
          const newRef = doc(collection(db, 'colleges', collegeId, 'gradeRecords'));
          currentBatch.set(newRef, {
            ...gradeData,
            createdAt: serverTimestamp(),
          });
          imported++;
        }
        operationCount++;

        // Also create university result entry
        if (operationCount >= 400) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }

        const resultRef = doc(collection(db, 'colleges', collegeId, 'universityResults'));
        currentBatch.set(resultRef, {
          collegeId,
          studentId,
          studentName: result.studentName,
          regNo: result.regNo,
          usn: result.usn || result.regNo,
          course: result.course || studentData.course || '',
          semester: result.semester,
          academicYear,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          credits: subject.credits,
          internalMarks: subject.internal,
          externalMarks: subject.external,
          totalMarks: subject.total,
          maxMarks: subject.maxMarks,
          grade: subject.grade,
          gradePoint: subject.gradePoint,
          result: subject.result,
          percentage: result.percentage,
          sgpa: result.sgpa,
          resultStatus: result.result,
          examType,
          scheme,
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        operationCount++;
      }

      // Update student's overall SGPA/CGPA
      if (operationCount >= 400) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }

      currentBatch.update(studentSnap.docs[0].ref, {
        sgpa: result.sgpa,
        cgpa: result.sgpa, // Simplified - would need all sems for CGPA
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        resultStatus: result.result,
        lastResultSyncAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      operationCount++;

    } catch (err) {
      errors.push({ regNo: result.regNo, message: err instanceof Error ? err.message : 'Unknown error' });
      failed++;
    }
  }

  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  for (const batch of batches) {
    await batch.commit();
  }

  return { imported, updated, failed, errors };
}

export function downloadResultTemplate() {
  const headers = ['regNo', 'name', 'semester', 'subjectCode', 'subjectName', 'credits', 'internal', 'external', 'total', 'grade', 'gradePoint', 'result', 'course', 'batch', 'sgpa'];
  const sampleRows = [
    ['BCU2024BCA001', 'Ramesh Kumar', '3', 'BCA301', 'Data Structures', '4', '18', '65', '83', 'A+', '9', 'P', 'BCA', '2024-25', '8.5'],
    ['BCU2024BCA001', 'Ramesh Kumar', '3', 'BCA302', 'DBMS', '4', '16', '58', '74', 'A', '8', 'P', 'BCA', '2024-25', '8.5'],
    ['BCU2024BCA002', 'Priya S', '3', 'BCA301', 'Data Structures', '4', '15', '35', '50', 'B', '6', 'P', 'BCA', '2024-25', '6.5'],
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bcu_result_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
