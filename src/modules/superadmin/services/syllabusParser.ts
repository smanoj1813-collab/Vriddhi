// ═══════════════════════════════════════════════════════════════════════
// SYLLABUS PARSER SERVICE — mammoth.js DOCX + heuristic extraction
// IMPROVED: Better Indian University syllabus support
// ═══════════════════════════════════════════════════════════════════════

import mammoth from 'mammoth';
import type {
  ParseResult,
  SyllabusExtract,
  ParsedCourse,
  ParsedModule,
  ParseConfidence,
  SyllabusFormat,
} from '../types/curriculum';

// ── COURSE PATTERNS ──────────────────────────────────────────────────
const COURSE_CODE_PATTERN = /\b([A-Z]{2,8}(?:\s+)?\d(?:\.?\d)*)\b/gi;
const COURSE_CODE_EXPLICIT = /(?:Course\s*Code|COURSE\s*CODE|Paper\s*Code|Subject\s*Code)[:;\s]+([A-Z0-9\s.]+)/i;
const COURSE_NAME_EXPLICIT = /(?:Name\s*of\s*the\s*Course|COURSE\s*NAME|Paper\s*Name|Title)[:;\s]+(.+?)(?:\n|\*\*|$)/i;
const CREDIT_PATTERN = /(?:Credits?|CREDITS?|Credit)[:;\s]*(\d+(?:\.\d+)?)/i;
const HOURS_PATTERN = /(?:Total\s*)?(?:Hours?|HOURS?|Teaching\s*Hours?|Contact\s*Hours?)[:;\s]*(\d+)/i;
const MARKS_PATTERN = /(?:Total\s*)?(?:Marks?|MARKS?|Max\s*Marks?|Maximum\s*Marks?)[:;\s]*(\d+)/i;
const SEMESTER_PATTERN = /(?:Semester|SEMESTER|Sem)[\s.:]*(\d+)/i;
const BRANCH_PATTERN = /(?:Branch|BRANCH|Department|DEPT|Programme|Program)[:.]?\s*([A-Za-z\s]{2,20})/i;
const SCHEME_PATTERN = /(?:Scheme|SCHEME|Regulation|Batch)[:.]?\s*(\d{4})/i;

// ── MODULE PATTERNS ──────────────────────────────────────────────────
// Module 1: Name or Module 1 - Name or 1. Name
const MODULE_HEADER_PATTERN = /(?:Module\s*No\.?|MODULE|Module|Unit|UNIT)\s*[.:]?\s*(\d+)[:.\s\-—]+(.+)/i;
const MODULE_ALT_PATTERN = /^(\d+)[.:)\s]+([A-Z][A-Za-z\s&]+)$/;

// Hours: many formats
const HOURS_LINE_PATTERN = /(?:Hours?|Hrs?|Periods?|Teaching)[:;\s]*(\d+)/i;
const HOURS_PAREN_PATTERN = /\((\d+)\s*(?:hours?|hrs?)\)/i;
const HOURS_BRACKET_PATTERN = /\[(\d+)\s*(?:hours?|hrs?)\]/i;
const HOURS_AFTER_NAME = /[:\-—]\s*(\d+)\s*(?:hours?|hrs?)/i;

// Marks: many formats
const MARKS_LINE_PATTERN = /(?:Marks?|Max\s*Marks?)[:;\s]*(\d+)/i;
const MARKS_PAREN_PATTERN = /\((\d+)\s*(?:marks?)\)/i;
const MARKS_BRACKET_PATTERN = /\[(\d+)\s*(?:marks?)\]/i;

// Table cell hours/marks: | 14 | 100 | patterns
const TABLE_CELL_NUMBER = /\|\s*\*\*(\d+)\*\*\s*\|/g;
const TABLE_ROW_HOURS_MARKS = /\|\s*(?:hours?|hrs?|marks?)\s*\|\s*(\d+)\s*\|/i;

// Topics
const TOPIC_BULLET = /^[-•\*\+\.]\s*(.+)/;
const TOPIC_NUMBERED = /^\d+[.)]\s*(.+)/;

function computeConfidence(fieldsFound: number, totalFields: number): ParseConfidence {
  const ratio = fieldsFound / totalFields;
  if (ratio >= 0.8) return 'high';
  if (ratio >= 0.5) return 'medium';
  return 'low';
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
}

function splitIntoLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function cleanCourseName(name: string): string {
  return name
    .replace(/^\d+\.?\s*/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\*\*/g, '')
    .replace(/\|/g, '')
    .replace(/^[->\s]+/, '')
    .trim();
}

function cleanModuleName(name: string): string {
  return name
    .replace(/\*\*/g, '')
    .replace(/\|/g, '')
    .replace(/\(\d+\s*(?:hours?|hrs?|marks?)\)/gi, '')
    .replace(/\[\d+\s*(?:hours?|hrs?|marks?)\]/gi, '')
    .trim();
}

function extractCourseCode(text: string): string | undefined {
  const explicit = text.match(COURSE_CODE_EXPLICIT);
  if (explicit) return explicit[1].trim();
  const match = text.match(COURSE_CODE_PATTERN);
  return match ? match[0].trim() : undefined;
}

function extractCourseName(text: string): string | undefined {
  const explicit = text.match(COURSE_NAME_EXPLICIT);
  if (explicit) return cleanCourseName(explicit[1]);
  return undefined;
}

function extractNumber(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  return match ? parseInt(match[1], 10) : undefined;
}

function tryExtractHours(line: string): number | undefined {
  const m1 = line.match(HOURS_LINE_PATTERN);
  if (m1) return parseInt(m1[1], 10);
  const m2 = line.match(HOURS_PAREN_PATTERN);
  if (m2) return parseInt(m2[1], 10);
  const m3 = line.match(HOURS_BRACKET_PATTERN);
  if (m3) return parseInt(m3[1], 10);
  const m4 = line.match(HOURS_AFTER_NAME);
  if (m4) return parseInt(m4[1], 10);
  return undefined;
}

function tryExtractMarks(line: string): number | undefined {
  const m1 = line.match(MARKS_LINE_PATTERN);
  if (m1) return parseInt(m1[1], 10);
  const m2 = line.match(MARKS_PAREN_PATTERN);
  if (m2) return parseInt(m2[1], 10);
  const m3 = line.match(MARKS_BRACKET_PATTERN);
  if (m3) return parseInt(m3[1], 10);
  return undefined;
}

function parseSummaryTable(text: string): Array<{ code: string; name: string; credits: number }> {
  const courses: Array<{ code: string; name: string; credits: number }> = [];
  const lines = splitIntoLines(text);
  for (const line of lines) {
    const cells = line.split('|').map(c => c.replace(/\*\*/g, '').trim()).filter(c => c.length > 0);
    if (cells.length >= 3) {
      const code = cells[0];
      const name = cells[1];
      const credits = parseInt(cells[2], 10);
      if (/^[A-Z0-9.]+$/i.test(code) && name.length > 3 && !isNaN(credits)) {
        courses.push({ code, name: cleanCourseName(name), credits });
      }
    }
  }
  return courses;
}

function parseModules(text: string): ParsedModule[] {
  const modules: ParsedModule[] = [];
  const lines = splitIntoLines(text);
  let current: Partial<ParsedModule> | null = null;
  let topics: string[] = [];
  let inTopicsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try module header patterns
    const headerMatch = line.match(MODULE_HEADER_PATTERN);
    const altMatch = !headerMatch ? line.match(MODULE_ALT_PATTERN) : null;

    if (headerMatch || altMatch) {
      // Save previous module
      if (current && current.moduleNo !== undefined) {
        modules.push({
          id: `mod-${Date.now()}-${modules.length}`,
          moduleNo: current.moduleNo,
          moduleName: cleanModuleName(current.moduleName || `Module ${current.moduleNo}`),
          title: cleanModuleName(current.title || current.moduleName || `Module ${current.moduleNo}`),
          description: current.description,
          hours: current.hours || 0,
          marks: current.marks || 0,
          type: 'theory',
          topics: topics.length > 0 ? topics : [],
          learningOutcomes: current.learningOutcomes,
          confidence: current.confidence || 'low',
        });
      }

      const match = headerMatch || altMatch!;
      current = {
        moduleNo: parseInt(match[1], 10),
        moduleName: cleanModuleName(match[2]),
        title: cleanModuleName(match[2]),
      };
      topics = [];
      inTopicsSection = false;

      // Try to extract hours/marks from the header line itself
      const h = tryExtractHours(line);
      if (h !== undefined && h <= 100) current.hours = h;
      const m = tryExtractMarks(line);
      if (m !== undefined && m <= 200) current.marks = m;

      continue;
    }

    if (!current) continue;

    // Check for hours on this line
    const hoursVal = tryExtractHours(line);
    if (hoursVal !== undefined && hoursVal <= 100) {
      current.hours = hoursVal;
      continue;
    }

    // Check for marks on this line
    const marksVal = tryExtractMarks(line);
    if (marksVal !== undefined && marksVal <= 200) {
      current.marks = marksVal;
      continue;
    }

    // Check for "Topics:" or "Contents:" header
    if (/^(Topics?|Contents?|Syllabus|Unit\s*Details)[:\s]/i.test(line)) {
      inTopicsSection = true;
      continue;
    }

    // Skip structural lines
    if (/^[+|=|\-\s]+$/.test(line) || line.length === 0) continue;
    if (/^(Hours?|Marks?|Credits?|Course\s*Code|Name\s*of|Total\s*Hours|Total\s*Marks)/i.test(line)) continue;

    // Collect topics
    const bulletMatch = line.match(TOPIC_BULLET);
    if (bulletMatch) {
      const clean = bulletMatch[1].replace(/\*\*/g, '').trim();
      if (clean.length > 3) topics.push(clean);
      continue;
    }

    const numberedMatch = line.match(TOPIC_NUMBERED);
    if (numberedMatch) {
      const clean = numberedMatch[1].replace(/\*\*/g, '').trim();
      if (clean.length > 3) topics.push(clean);
      continue;
    }

    // Fallback: any line that's not too short and not a header
    if (line.length > 10 && line.length < 300 && !line.match(/^(Module|Unit|Course)\s*\d/i)) {
      const clean = line.replace(/\*\*/g, '').replace(/\|/g, '').trim();
      if (clean.length > 10 && inTopicsSection) topics.push(clean);
    }
  }

  if (current && current.moduleNo !== undefined) {
    modules.push({
      id: `mod-${Date.now()}-${modules.length}`,
      moduleNo: current.moduleNo,
      moduleName: cleanModuleName(current.moduleName || `Module ${current.moduleNo}`),
      title: cleanModuleName(current.title || current.moduleName || `Module ${current.moduleNo}`),
      description: current.description,
      hours: current.hours || 0,
      marks: current.marks || 0,
      type: 'theory',
      topics: topics.length > 0 ? topics : [],
      learningOutcomes: current.learningOutcomes,
      confidence: current.confidence || 'low',
    });
  }

  return modules.map(m => {
    const found = [
      m.moduleName && m.moduleName !== `Module ${m.moduleNo}`,
      m.hours > 0,
      m.topics.length > 0,
    ].filter(Boolean).length;
    return { ...m, confidence: computeConfidence(found, 3) };
  });
}

function parseSingleCourse(text: string, id: string): ParsedCourse | null {
  const code = extractCourseCode(text);
  const explicitName = extractCourseName(text);

  if (!code && text.length < 80) return null;

  let name = explicitName || '';
  if (!name) {
    const lines = splitIntoLines(text);
    for (const line of lines) {
      const cleaned = cleanCourseName(line);
      if (cleaned.length > 5 && cleaned.length < 150 &&
          !line.match(/^(Code|Credits?|Hours?|Marks?|Semester|Course\s*Code|Name\s*of|Total)/i) &&
          !line.match(/^\*\*Name\s*of\s*the/i)) {
        name = cleaned; break;
      }
    }
  }
  if (!name && !code) return null;

  const credits = extractNumber(text, CREDIT_PATTERN) || 0;
  const totalHours = extractNumber(text, HOURS_PATTERN) || 0;
  const totalMarks = extractNumber(text, MARKS_PATTERN) || 0;
  const semester = extractNumber(text, SEMESTER_PATTERN) || 0;
  const branchMatch = text.match(BRANCH_PATTERN);
  const branch = branchMatch ? branchMatch[1].trim() : '';
  const schemeMatch = text.match(SCHEME_PATTERN);
  const scheme = schemeMatch ? schemeMatch[1] : '';
  const modules = parseModules(text);

  // If no explicit hours found but modules have hours, sum them
  const computedHours = modules.reduce((sum, m) => sum + (m.hours || 0), 0);
  const finalHours = totalHours > 0 ? totalHours : computedHours;

  const computedMarks = modules.reduce((sum, m) => sum + (m.marks || 0), 0);
  const finalMarks = totalMarks > 0 ? totalMarks : computedMarks;

  const fieldsFound = [
    !!code,
    !!name,
    credits > 0,
    finalHours > 0,
    finalMarks > 0 || modules.length > 0,
    modules.length > 0,
  ].filter(Boolean).length;
  const confidence = computeConfidence(fieldsFound, 6);

  return {
    id, code: code || `COURSE-${id}`, name: name || 'Untitled Course',
    credits, totalHours: finalHours, totalMarks: finalMarks, semester, branch, scheme,
    modules, confidence,
  };
}

function parseCourses(text: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];

  // First, try explicit course sections
  const explicitBlocks = text.split(/(?=Name\s*of\s*the\s*Course|COURSE\s*CODE|Course\s*Code)/gi);
  if (explicitBlocks.length > 1) {
    for (let i = 1; i < explicitBlocks.length; i++) {
      const blockText = explicitBlocks[i];
      const course = parseSingleCourse(blockText, `course-${i - 1}`);
      if (course) courses.push(course);
    }
    if (courses.length > 0) return courses;
  }

  // Fallback: paragraph-based splitting
  const paragraphs = splitIntoParagraphs(text);
  const boundaries: number[] = [];
  paragraphs.forEach((p, i) => {
    if (COURSE_CODE_EXPLICIT.test(p) || /^(Course|Subject|Paper)\s*\d+/i.test(p) ||
        /Name\s*of\s*the\s*Course/i.test(p) || /^[A-Z]{2,8}\s*\d[\d.]*$/m.test(p)) {
      boundaries.push(i);
    }
  });

  if (boundaries.length === 0) {
    const single = parseSingleCourse(text, 'course-0');
    if (single) courses.push(single);
    return courses;
  }

  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1] !== undefined ? boundaries[i + 1] : paragraphs.length;
    const blockText = paragraphs.slice(start, end).join('\n');
    const course = parseSingleCourse(blockText, `course-${i}`);
    if (course) courses.push(course);
  }

  return courses;
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parsePdf(file: File): Promise<string> {
  return await file.text();
}

async function parseTxt(file: File): Promise<string> {
  return await file.text();
}

function buildParseResult(
  success: boolean,
  file: File,
  format: SyllabusFormat,
  extractedBy: string,
  extractedByName: string | undefined,
  courses: ParsedCourse[],
  errors: string[],
  warnings: string[],
  rawText: string
): ParseResult {
  const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
  const totalHours = courses.reduce((sum, c) => sum + c.totalHours, 0);
  const totalMarks = courses.reduce((sum, c) => sum + c.totalMarks, 0);

  const confidenceScores = courses.map(c => c.confidence === 'high' ? 85 : c.confidence === 'medium' ? 60 : 30);
  const avgScore = confidenceScores.length > 0 ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) : 0;
  const overallConfidence: ParseConfidence = avgScore >= 70 ? 'high' : avgScore >= 40 ? 'medium' : 'low';

  const extract: SyllabusExtract = {
    id: `extract-${Date.now()}`,
    fileName: file.name,
    fileSize: file.size,
    format,
    extractedBy,
    extractedByName,
    extractedAt: new Date().toISOString(),
    status: 'review',
    courses,
    totalCourses: courses.length,
    totalModules,
    totalHours,
    totalMarks,
    averageConfidence: overallConfidence,
    confidenceScore: avgScore,
  };

  return {
    success,
    extract,
    courses,
    errors,
    warnings,
    rawText,
    confidenceScore: avgScore,
    totalCourses: courses.length,
    totalModules,
    totalHours,
    totalMarks,
  };
}

export async function parseSyllabus(
  file: File, format: SyllabusFormat, extractedBy: string, extractedByName?: string
): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    let rawText = '';
    switch (format) {
      case 'docx': rawText = await parseDocx(file); break;
      case 'pdf': rawText = await parsePdf(file); warnings.push('PDF parsing is basic; complex layouts may not extract perfectly.'); break;
      case 'txt': rawText = await parseTxt(file); break;
      default:
        errors.push(`Unsupported format: ${format}`);
        return { success: false, courses: [], errors, warnings, confidenceScore: 0, totalCourses: 0, totalModules: 0, totalHours: 0, totalMarks: 0 };
    }

    if (!rawText || rawText.trim().length < 50) {
      errors.push('Extracted text is too short or empty. Please check the file.');
      return { success: false, courses: [], errors, warnings, confidenceScore: 0, totalCourses: 0, totalModules: 0, totalHours: 0, totalMarks: 0 };
    }

    const normalizedText = normalizeText(rawText);
    const courses = parseCourses(normalizedText);

    if (courses.length === 0) {
      const summaryCourses = parseSummaryTable(normalizedText);
      if (summaryCourses.length > 0) {
        for (let i = 0; i < summaryCourses.length; i++) {
          const sc = summaryCourses[i];
          courses.push({
            id: `course-${i}`,
            code: sc.code,
            name: sc.name,
            credits: sc.credits,
            totalHours: 0,
            totalMarks: 100,
            semester: 0,
            branch: '',
            scheme: '',
            modules: [],
            confidence: 'low',
          });
        }
        warnings.push('Only summary table data extracted. Detailed module breakdown requires manual review.');
      }
    }

    if (courses.length === 0) {
      warnings.push('No courses could be extracted. The document format may be unstructured.');
    }

    const lowConfidenceCourses = courses.filter(c => c.confidence === 'low');
    if (lowConfidenceCourses.length > 0) {
      warnings.push(`${lowConfidenceCourses.length} course(s) have low extraction confidence and need manual review.`);
    }

    return buildParseResult(true, file, format, extractedBy, extractedByName, courses, errors, warnings, normalizedText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown parsing error';
    errors.push(msg);
    return { success: false, courses: [], errors, warnings, confidenceScore: 0, totalCourses: 0, totalModules: 0, totalHours: 0, totalMarks: 0 };
  }
}

export function reparseFromText(rawText: string, fileName: string, fileSize: number, format: SyllabusFormat, extractedBy: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  try {
    const normalizedText = normalizeText(rawText);
    const courses = parseCourses(normalizedText);

    if (courses.length === 0) {
      const summaryCourses = parseSummaryTable(normalizedText);
      if (summaryCourses.length > 0) {
        for (let i = 0; i < summaryCourses.length; i++) {
          const sc = summaryCourses[i];
          courses.push({
            id: `course-${i}`,
            code: sc.code,
            name: sc.name,
            credits: sc.credits,
            totalHours: 0,
            totalMarks: 100,
            semester: 0,
            branch: '',
            scheme: '',
            modules: [],
            confidence: 'low',
          });
        }
        warnings.push('Only summary table data extracted. Detailed module breakdown requires manual review.');
      }
    }

    return buildParseResult(true, new File([], fileName), format, extractedBy, undefined, courses, errors, warnings, normalizedText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown reparsing error';
    errors.push(msg);
    return { success: false, courses: [], errors, warnings, confidenceScore: 0, totalCourses: 0, totalModules: 0, totalHours: 0, totalMarks: 0 };
  }
}

export function detectFormat(fileName: string): SyllabusFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'docx') return 'docx';
  if (ext === 'pdf') return 'pdf';
  return 'txt';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024;
  const allowedExts = ['.docx', '.pdf', '.txt'];
  if (file.size > maxSize) return { valid: false, error: 'File size exceeds 10MB limit.' };
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!allowedExts.includes(ext)) return { valid: false, error: 'Only .docx, .pdf, and .txt files are supported.' };
  return { valid: true };
}