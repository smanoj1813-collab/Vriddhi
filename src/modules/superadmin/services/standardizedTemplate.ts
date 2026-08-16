// ═══════════════════════════════════════════════════════════════════════
// services/standardizedTemplate.ts
// Excel Template Generator + Parser for Standardized Curriculum Upload
// Replaces fragile DOCX parsing with structured data entry
// ═══════════════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import type { SyllabusExtract, ParsedCourse, ParsedModule, CourseType, SyllabusFormat } from '../types/curriculum';

export interface TemplateValidationError {
  sheet: string;
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedTemplateResult {
  success: boolean;
  extract: SyllabusExtract | null;
  errors: TemplateValidationError[];
  warnings: TemplateValidationError[];
  programInfo: Record<string, string>;
}

// ─── Template Generator ───────────────────────────────────────────────

export function generateCurriculumTemplate(): Blob {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Instructions
  const instructions = [
    ['VRIDDHI — STANDARDIZED CURRICULUM TEMPLATE'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. Do NOT rename any sheet tabs. Do NOT add/delete columns.'],
    ['2. Fill "Program Info" first.'],
    ['3. Add ALL courses in "Course Matrix" (one row per course).'],
    ['4. Add module breakdown in "Modules" (one row per module).'],
    ['5. Add outcomes in "Outcomes" (one per row).'],
    ['6. Add references in "References" (one per row).'],
    ['7. Add skill activities in "Skills" (one per row).'],
    [''],
    ['RULES:'],
    ['• Course Code must be UNIQUE and match exactly across all sheets'],
    ['• Semester: number only (3, 4, 5...)'],
    ['• Credits/Hours/Marks: numbers only'],
    ['• Topics: separate multiple topics with | (pipe)'],
    ['• Leave optional cells blank — do not write "NA" or "-"'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), 'Instructions');

  // Sheet 2: Program Info
  const programInfo = [
    ['Field', 'Value'],
    ['University Name', 'University of Mysore'],
    ['Program Name', 'Bachelor of Business Administration'],
    ['Scheme / Regulation', 'SEP 2025-2026'],
    ['Branch / Stream', 'BBA'],
    ['Total Semesters', '6'],
    ['Academic Year', '2025-2026'],
    ['Total Program Credits', ''],
    ['Total Program Marks', ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(programInfo), 'Program Info');

  // Sheet 3: Course Matrix
  const courseMatrix = [
    ['Semester', 'Course Code', 'Course Name', 'Short Name', 'Credits', 'Hours/Week', 'Total Hours', 'Total Marks', 'Internal Marks', 'External Marks', 'Course Type', 'Branch', 'Scheme'],
    [3, 'BBA 3.1', 'Cost Accounting', 'Cost Acct', 5, 5, 68, 100, 20, 80, 'Major', 'BBA', 'SEP 2025'],
    [3, 'BBA 3.2', 'Business Statistics II', 'Bus Stats II', 5, 5, 68, 100, 20, 80, 'Major', 'BBA', 'SEP 2025'],
    [3, 'BBA 3.3', 'Business Environment', 'Bus Env', 5, 5, 68, 100, 20, 80, 'Major', 'BBA', 'SEP 2025'],
    [3, 'BBA 3.4', 'Entrepreneurship and Startup Ecosystem', 'Entrepreneurship', 3, 3, 45, 100, 20, 80, 'Elective', 'BBA', 'SEP 2025'],
    [3, 'BBA 3.5', 'Banking and Financial Services', 'Banking', 3, 3, 45, 100, 20, 80, 'Elective', 'BBA', 'SEP 2025'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(courseMatrix), 'Course Matrix');

  // Sheet 4: Modules
  const modules = [
    ['Course Code', 'Module No', 'Module Name', 'Hours', 'Topics (separate by |)'],
    ['BBA 3.1', 1, 'Introduction to Cost Accounting', 14, 'Meaning|Objectives|Elements of Cost|Cost Sheet|Cost Control'],
    ['BBA 3.1', 2, 'Materials Cost', 12, 'Procurement|Storage|FIFO|LIFO|Weighted Average|EOQ|ABC Analysis'],
    ['BBA 3.1', 3, 'Employee Cost', 11, 'Time Rate|Halsey|Rowan|Piece Rate|Taylor|Turnover'],
    ['BBA 3.1', 4, 'Overheads', 13, 'Classification|Allocation|Apportionment|Absorption|Machine Hour Rate'],
    ['BBA 3.1', 5, 'Contract, Process and Service Costing', 8, 'Process Costing|Normal Loss|Abnormal Loss|Contract Costing'],
    ['BBA 3.1', 6, 'Reconciliation of Cost and Financial Accounts', 10, 'Reasons for Differences|Reconciliation Statement'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(modules), 'Modules');

  // Sheet 5: Outcomes
  const outcomes = [
    ['Course Code', 'Outcome No', 'Outcome Text'],
    ['BBA 3.1', 1, 'Demonstrate understanding of elements of cost and prepare a cost sheet'],
    ['BBA 3.1', 2, 'Prepare material related documents and understand store management'],
    ['BBA 3.1', 3, 'Calculate employee costs using various remuneration systems'],
    ['BBA 3.1', 4, 'Classify, allocate and apportion overheads and calculate absorption rates'],
    ['BBA 3.1', 5, 'Understand and reconcile cost and financial accounts'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(outcomes), 'Outcomes');

  // Sheet 6: References
  const references = [
    ['Course Code', 'Reference No', 'Reference Text'],
    ['BBA 3.1', 1, 'Jain and Narang, Cost Accounting, Kalyani Publication House'],
    ['BBA 3.1', 2, 'M.N Arora, Cost Accounting, HPH'],
    ['BBA 3.1', 3, 'N.K. Prasad, Cost Accounting, Books Syndicate Pvt. Ltd.'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(references), 'References');

  // Sheet 7: Skills
  const skills = [
    ['Course Code', 'Activity No', 'Activity Text'],
    ['BBA 3.1', 1, 'Prepare a Cost Sheet with imaginary figures'],
    ['BBA 3.1', 2, 'List documents required in Inventory Management'],
    ['BBA 3.1', 3, 'Demonstrate valuation of inventory using FIFO/LIFO'],
    ['BBA 3.1', 4, 'Calculate wages under Halsey / Rowan Plans'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(skills), 'Skills');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ─── Template Parser ──────────────────────────────────────────────────

export async function parseCurriculumTemplate(file: File, userId: string, userName: string): Promise<ParsedTemplateResult> {
  const errors: TemplateValidationError[] = [];
  const warnings: TemplateValidationError[] = [];

  let data: ArrayBuffer;
  try {
    data = await file.arrayBuffer();
  } catch {
    return { success: false, extract: null, errors: [{ sheet: 'File', row: 0, field: 'File', message: 'Failed to read file', severity: 'error' }], warnings: [], programInfo: {} };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: 'array', cellDates: true });
  } catch {
    return { success: false, extract: null, errors: [{ sheet: 'File', row: 0, field: 'File', message: 'Invalid Excel file', severity: 'error' }], warnings: [], programInfo: {} };
  }

  const requiredSheets = ['Program Info', 'Course Matrix', 'Modules'];
  for (const sheetName of requiredSheets) {
    if (!workbook.Sheets[sheetName]) {
      errors.push({ sheet: 'File', row: 0, field: 'Sheets', message: `Missing required sheet: "${sheetName}"`, severity: 'error' });
    }
  }
  if (errors.some(e => e.severity === 'error')) {
    return { success: false, extract: null, errors, warnings, programInfo: {} };
  }

  // ── Parse Program Info ──
  const programSheet = workbook.Sheets['Program Info'];
  const programRaw = XLSX.utils.sheet_to_json<string[]>(programSheet, { header: 1, defval: '' });
  const programInfo: Record<string, string> = {};
  for (let i = 1; i < programRaw.length; i++) {
    const [key, val] = programRaw[i];
    if (key) programInfo[String(key).trim()] = String(val || '').trim();
  }

  // ── Parse Course Matrix ──
  const matrixSheet = workbook.Sheets['Course Matrix'];
  const matrixRaw = XLSX.utils.sheet_to_json(matrixSheet, { header: 1, defval: '' }) as (string | number)[][];
  const coursesMap = new Map<string, ParsedCourse>();

  for (let i = 1; i < matrixRaw.length; i++) {
    const row = matrixRaw[i];
    const courseCode = String(row[1] || '').trim();
    if (!courseCode) continue;

    if (coursesMap.has(courseCode)) {
      errors.push({ sheet: 'Course Matrix', row: i + 1, field: 'Course Code', message: `Duplicate course code: ${courseCode}`, severity: 'error' });
      continue;
    }

    const semester = Number(row[0]);
    if (!semester || isNaN(semester)) {
      errors.push({ sheet: 'Course Matrix', row: i + 1, field: 'Semester', message: `Invalid semester for ${courseCode}`, severity: 'error' });
    }

    const credits = Number(row[4]) || 0;
    const totalHours = Number(row[6]) || 0;
    const totalMarks = Number(row[7]) || 0;

    const course: ParsedCourse = {
      id: `course-${courseCode.replace(/\s+/g, '-').toLowerCase()}`,
      code: courseCode,
      name: String(row[2] || '').trim(),
      shortName: row[3] ? String(row[3]).trim() : null,
      credits,
      totalHours,
      totalMarks,
      internalMarks: row[8] !== '' ? Number(row[8]) : undefined,
externalMarks: row[9] !== '' ? Number(row[9]) : undefined,
      semester: semester || 0,
      branch: String(row[11] || programInfo['Branch / Stream'] || 'General').trim(),
      scheme: String(row[12] || programInfo['Scheme / Regulation'] || '').trim(),
      courseType: mapCourseType(String(row[10] || '')),
      modules: [],
      outcomes: [],
      references: [],
      skillActivities: [],
      confidence: 'high',
      isEdited: false,
      extractedAt: new Date().toISOString(),
    };

    coursesMap.set(courseCode, course);
  }

  if (coursesMap.size === 0) {
    errors.push({ sheet: 'Course Matrix', row: 0, field: 'Courses', message: 'No valid courses found', severity: 'error' });
  }

  // ── Parse Modules ──
  const modulesSheet = workbook.Sheets['Modules'];
  const modulesRaw = XLSX.utils.sheet_to_json(modulesSheet, { header: 1, defval: '' }) as (string | number)[][];
  for (let i = 1; i < modulesRaw.length; i++) {
    const row = modulesRaw[i];
    const courseCode = String(row[0] || '').trim();
    if (!courseCode) continue;

    const course = coursesMap.get(courseCode);
    if (!course) {
      errors.push({ sheet: 'Modules', row: i + 1, field: 'Course Code', message: `Course "${courseCode}" not found in Course Matrix`, severity: 'error' });
      continue;
    }

    const modNo = Number(row[1]);
    if (!modNo || isNaN(modNo)) {
      errors.push({ sheet: 'Modules', row: i + 1, field: 'Module No', message: `Invalid module number for ${courseCode}`, severity: 'error' });
      continue;
    }

    const topicsRaw = String(row[4] || '');
    const topics = topicsRaw
      .split('|')
      .map(t => t.trim())
      .filter(Boolean);

    const mod: ParsedModule = {
      id: `mod-${course.code.replace(/\s+/g, '-')}-${modNo}`,
      moduleNo: modNo,
      moduleName: String(row[2] || '').trim(),
      title: String(row[2] || '').trim(),
      name: String(row[2] || '').trim(),
      hours: Number(row[3]) || 0,
      marks: 0,
      type: 'theory',
      topics,
      description: null,
      learningOutcomes: null,
      confidence: 'high',
      isEdited: false,
      subject: course.name,
      course: course.code,
      semester: course.semester,
    };

    course.modules.push(mod);
  }

  // ── Parse Outcomes ──
  parseLinkedSheet(workbook, 'Outcomes', coursesMap, errors, (course, row) => {
    const text = String(row[2] || '').trim();
    if (text) course.outcomes!.push(text);
  });

  // ── Parse References ──
  parseLinkedSheet(workbook, 'References', coursesMap, errors, (course, row) => {
    const text = String(row[2] || '').trim();
    if (text) course.references!.push(text);
  });

  // ── Parse Skills ──
  parseLinkedSheet(workbook, 'Skills', coursesMap, errors, (course, row) => {
    const text = String(row[2] || '').trim();
    if (text) course.skillActivities!.push(text);
  });

  // ── Post-Validation ──
  const courses = Array.from(coursesMap.values());
  courses.forEach(course => {
    const modHours = course.modules.reduce((s, m) => s + m.hours, 0);
    if (course.modules.length === 0) {
      warnings.push({ sheet: 'Modules', row: 0, field: course.code, message: `${course.code}: No modules found`, severity: 'warning' });
    } else if (modHours !== course.totalHours) {
      warnings.push({ sheet: 'Modules', row: 0, field: course.code, message: `${course.code}: Module hours (${modHours}) ≠ Course hours (${course.totalHours})`, severity: 'warning' });
    }
    if (!course.outcomes?.length) {
      warnings.push({ sheet: 'Outcomes', row: 0, field: course.code, message: `${course.code}: No outcomes found`, severity: 'warning' });
    }
  });

  const totalModules = courses.reduce((s, c) => s + c.modules.length, 0);
  const totalHours = courses.reduce((s, c) => s + c.totalHours, 0);
  const totalMarks = courses.reduce((s, c) => s + c.totalMarks, 0);

  const confidenceScore = errors.length === 0 ? 95 : errors.length < 3 ? 80 : 60;

  const extract: SyllabusExtract = {
    id: '',
    fileName: file.name,
    fileUrl: null,
    fileSize: file.size,
    format: 'xlsx' as SyllabusFormat,
    extractedBy: userId,
    extractedByName: userName,
    extractedAt: new Date().toISOString(),
    status: 'review',
    collegeId: null,
    collegeName: null,
    courses,
    totalCourses: courses.length,
    totalModules,
    totalHours,
    totalMarks,
    averageConfidence: errors.length === 0 ? 'high' : 'medium',
    confidenceScore,
    reviewNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    assignedAt: null,
    assignedBy: null,
  };

  return {
    success: !errors.some(e => e.severity === 'error'),
    extract,
    errors,
    warnings,
    programInfo,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function parseLinkedSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  coursesMap: Map<string, ParsedCourse>,
  errors: TemplateValidationError[],
  handler: (course: ParsedCourse, row: (string | number)[]) => void,
) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as (string | number)[][];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const courseCode = String(row[0] || '').trim();
    if (!courseCode) continue;
    const course = coursesMap.get(courseCode);
    if (!course) {
      errors.push({ sheet: sheetName, row: i + 1, field: 'Course Code', message: `Unknown course: ${courseCode}`, severity: 'error' });
      continue;
    }
    handler(course, row);
  }
}

function mapCourseType(type: string): CourseType {
  const t = type.toLowerCase();
  if (t.includes('major') || t.includes('core')) return 'core';
  if (t.includes('elect')) return 'elective';
  if (t.includes('lang')) return 'language';
  if (t.includes('proj')) return 'project';
  if (t.includes('intern')) return 'internship';
  if (t.includes('pract')) return 'practical';
  if (t.includes('skill') || t.includes('value')) return 'value_added';
  return 'core';
}

// ─── Download Helper ──────────────────────────────────────────────────

export function downloadTemplate() {
  const blob = generateCurriculumTemplate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Vriddhi_Curriculum_Template.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}