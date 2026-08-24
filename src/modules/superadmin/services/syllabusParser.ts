// ═══════════════════════════════════════════════════════════════════════
// services/syllabusParser.ts — Universal Syllabus Parser v2.3
// Handles: Course Matrix tables + Detailed Syllabus sections
// Tuned for: BCU B.Com (Regular) SEP 2024 format
// ═══════════════════════════════════════════════════════════════════════

import type {
  ParsedCourse,
  ParsedModule,
  SyllabusExtract,
  ParseResult,
  ParseConfidence,
  SyllabusFormat,
} from '../types/curriculum';

// ─── Parser Config ──────────────────────────────────────────────────────

export interface ParserConfig {
  courseCodeRegex: RegExp;
  semesterRegex: RegExp;
  unitHeaderRegex: RegExp;
  hoursRegex: RegExp;
  creditRegex: RegExp;
  totalHoursRegex: RegExp;
  marksRegex: RegExp;
  outcomeRegex: RegExp;
  referenceRegex: RegExp;
  electiveRegex: RegExp;
  projectKeywords: string[];
  courseNameCleanRegex: RegExp;
  ignoredModuleNames: string[];
  branchRegex: RegExp;
  moduleHoursRegex: RegExp;
  moduleMarksRegex: RegExp;
}

export const DEFAULT_CONFIG: ParserConfig = {
  courseCodeRegex: /\b([1-6]\.[1-6](?:\([a-z]\))?)\b/,
  semesterRegex: /(?:Semester|Sem)[\s\-]*([IViv0-9]+|1st|2nd|3rd|[4-6]th)/i,
  unitHeaderRegex: /(?:^|\n)[|>\s]*(?:\*\*)?\s*Unit[\s\-]*([0-9IVXivx]+)[:.]?\s*([^\n|*]+?)(?:\*\*)?/gi,
  hoursRegex: /\b(\d{1,3})\s*(?:hrs?|hours?|h)\b/i,
  creditRegex: /(?:Credits?[\s:]*)?(\d(?:\.\d)?)\s*(?:Credits?|CREDITS|credits)/i,
  totalHoursRegex: /(?:Total\s*(?:No\.\s*)?(?:Teaching|Instructional)?\s*(?:Hours?)?[\s:]*)(\d{1,3})/i,
  marksRegex: /(?:(?:IA|Internal)[\s:]*([\d\-]+)[\s+\-]*)?(?:(?:Uni|Exam|External)[\s:]*([\d\-]+)[\s+\-]*)?(?:Total)?[\s:]*([\d\-]+)/i,
  outcomeRegex: /(?:^|\n)\s*(?:[a-e][.)]|CO\d+[.:]|Outcome\s*\d+[.:])\s*([^\n]+)/gi,
  referenceRegex: /(?:Books?\s*(?:for\s*)?(?:Reference|References)|Reference\s*Books?|Bibliography|Suggested\s*Readings)/i,
  electiveRegex: /(?:Elective|Optional|Choice\s*Based)[\s\-]*/i,
  projectKeywords: ['project', 'internship', 'survey', 'dissertation', 'thesis', 'practical', 'lab', 'viva'],
  courseNameCleanRegex: /^\s*\[HOURS\s*\d+\]\s*/i,
  ignoredModuleNames: ['credits', 'hours', 'total', 'grand total', 'scheme', ''],
  branchRegex: /(?:(?:BACHELOR|MASTER)\s+OF\s+(?:COMMERCE|BUSINESS|SCIENCE|ARTS|COMPUTER\s+APPLICATIONS|EDUCATION)|B\.?Com|B\.?BA|B\.?Sc|B\.?A|B\.?C\.?A|B\.?Ed|MBA|M\.?Com|M\.?Sc|M\.?A|MCA)/i,
  moduleHoursRegex: /\b(\d{1,3})\s*(?:hrs?|hours?|h)\b/i,
  moduleMarksRegex: /\b(\d{1,3})\s*(?:marks?|m)\b/i,
};

// ─── BCU-specific override ──────────────────────────────────────────────
export const BCU_CONFIG: ParserConfig = {
  ...DEFAULT_CONFIG,
  courseCodeRegex: /\b([1-6]\.[1-6](?:\([a-z]\))?)\b/,
  semesterRegex: /(?:Semester|Sem)[\s.:]*([IViv0-9]+)/i,
};

// ─── Helpers ────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractNumber(text: string, regex: RegExp, defaultValue: number = 0): number {
  const match = text.match(regex);
  if (!match) return defaultValue;
  const num = parseFloat(match[1]);
  return isNaN(num) ? defaultValue : num;
}

function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
  let val = 0;
  for (let i = 0; i < roman.length; i++) {
    const curr = map[roman[i].toUpperCase()] || 0;
    const next = map[roman[i + 1]?.toUpperCase()] || 0;
    val += curr < next ? -curr : curr;
  }
  return val;
}

function parseSemesterNumber(text: string): number {
  const match = text.match(/([IViv]+|[0-9]+|1st|2nd|3rd|[4-6]th)/i);
  if (!match) return 0;
  const val = match[1].toUpperCase();
  if (val === 'I' || val === '1' || val === '1ST') return 1;
  if (val === 'II' || val === '2' || val === '2ND') return 2;
  if (val === 'III' || val === '3' || val === '3RD') return 3;
  if (val === 'IV' || val === '4' || val === '4TH') return 4;
  if (val === 'V' || val === '5' || val === '5TH') return 5;
  if (val === 'VI' || val === '6' || val === '6TH') return 6;
  return romanToInt(val) || parseInt(val) || 0;
}

// Section headers that mark the end of a unit's topic area
const UNIT_BOUNDARY_PATTERNS = [
  /Skill\s*Development\s*Activities?/i,
  /Books?\s*(?:for\s*)?(?:Reference|References)/i,
  /Reference\s*Books?/i,
  /Bibliography/i,
  /Suggested\s*Readings/i,
  /Course\s*Outcomes?/i,
  /Pedagogy/i,
];

function findNextBoundary(text: string, startPos: number): number {
  let nearest = text.length;
  for (const pattern of UNIT_BOUNDARY_PATTERNS) {
    const match = text.slice(startPos).match(pattern);
    if (match && match.index !== undefined) {
      nearest = Math.min(nearest, startPos + match.index);
    }
  }
  return nearest;
}

// ─── Outcome Extractor (handles wrapped lines) ──────────────────────────

function extractOutcomes(text: string): string[] {
  const outcomes: string[] = [];

  // Find the Course Outcomes section
  const sectionMatch = text.match(/Course\s*Outcomes?[:.]?/i);
  if (!sectionMatch || sectionMatch.index === undefined) return outcomes;

  const start = sectionMatch.index + sectionMatch[0].length;
  const end = findNextBoundary(text, start);
  const sectionText = text.slice(start, end);

  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let currentOutcome = '';

  for (const line of lines) {
    // Check if line starts with a bullet like a., b., c. or CO1:, etc.
    const isNewOutcome = /^[a-e][.)]\s+/i.test(line) || /^CO\d+[.:]\s+/i.test(line);

    if (isNewOutcome) {
      if (currentOutcome) outcomes.push(currentOutcome.trim());
      currentOutcome = line.replace(/^[a-e][.)]\s+/i, '').replace(/^CO\d+[.:]\s+/i, '');
    } else if (currentOutcome) {
      // Continuation line (wrapped text)
      currentOutcome += ' ' + line;
    }
  }
  if (currentOutcome) outcomes.push(currentOutcome.trim());

  return outcomes.filter(o => o.length > 10);
}

// ─── Course Matrix Parser ───────────────────────────────────────────────

interface MatrixCourse {
  code: string;
  name: string;
  hoursPerWeek: number;
  examDuration: number;
  iaMarks: number;
  examMarks: number;
  totalMarks: number;
  credits: number;
  semester: number;
  isElective: boolean;
  isProject: boolean;
  isLanguage: boolean;
}

function parseCourseMatrix(text: string, config: ParserConfig): MatrixCourse[] {
  const courses: MatrixCourse[] = [];
  const lines = text.split('\n');
  let currentSemester = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const semMatch = line.match(config.semesterRegex);
    if (semMatch) {
      currentSemester = parseSemesterNumber(semMatch[1]);
      continue;
    }

    if (line.startsWith('+')) continue;
    if (/Courses|Paper Code|Total/i.test(line) && !/[1-6]\.[1-6]/.test(line)) continue;

    const codeMatch = line.match(/\|\s*([1-6]\.[1-6](?:\([a-z]\))?)\s*\|/);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      const nameParts: string[] = [];
      let credits = 0, iaMarks = 0, examMarks = 0, totalMarks = 0, hoursPerWeek = 0;

      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        const l = lines[j].replace(/\*\*/g, '');

        const cells = l.match(/\|\s*([^|]{3,60}?)\s*(?=\|)/g);
        if (cells) {
          for (const cell of cells) {
            const clean = cell.replace(/^\|\s*/, '').trim();
            if (!clean) continue;
            if (/^\d+(\.\d+)?$/.test(clean)) continue;
            if (/^(?:Part|DSC|CC|SEC|Language|Courses|Paper|Code|IA|Uni|Exam|Total)/i.test(clean)) continue;
            if (clean.length > 3 && !nameParts.includes(clean)) nameParts.push(clean);
          }
        }

        const creditMatch = l.match(/\|\s*(\d)\s*\|/);
        if (creditMatch && !credits) credits = parseInt(creditMatch[1]) || 0;

        const marksMatch = l.match(/\|\s*(\d{1,3})\s*\|\s*(\d{1,3})\s*\|\s*(\d{1,3})\s*\|/);
        if (marksMatch) {
          iaMarks = parseInt(marksMatch[1]) || 0;
          examMarks = parseInt(marksMatch[2]) || 0;
          totalMarks = parseInt(marksMatch[3]) || 0;
        }

        const hrsMatch = l.match(/\|\s*(\d)\s*\|\s*3\s*\|/);
        if (hrsMatch && !hoursPerWeek) hoursPerWeek = parseInt(hrsMatch[1]) || 0;
      }

      const name = nameParts.join(' ').replace(/\s+/g, ' ').trim();
      if (!name || name.length < 3) continue;

      const lowerName = name.toLowerCase();
      const isProject = config.projectKeywords.some(k => lowerName.includes(k));
      const isElective = config.electiveRegex.test(line) || lowerName.includes('elective');
      const isLanguage = /language|kannada|sanskrit|urdu|tamil|telugu|malayalam|hindi|marathi|english/i.test(name);

      courses.push({
        code,
        name,
        hoursPerWeek: hoursPerWeek || 4,
        examDuration: 3,
        iaMarks: iaMarks || 20,
        examMarks: examMarks || 80,
        totalMarks: totalMarks || (iaMarks + examMarks) || 100,
        credits: credits || 4,
        semester: currentSemester,
        isElective,
        isProject,
        isLanguage,
      });
    }
  }

  return courses;
}

// ─── Detailed Syllabus Parser ───────────────────────────────────────────

interface SyllabusSection {
  code: string;
  name: string;
  credits: number;
  hoursPerWeek: number;
  totalHours: number;
  outcomes: string[];
  units: { number: number; title: string; hours: number; topics: string[] }[];
  references: string[];
  skillActivities: string[];
  branch: string;
  semester: number;
}

function parseDetailedSyllabus(text: string, config: ParserConfig): SyllabusSection[] {
  const sections: SyllabusSection[] = [];

  const codePattern = /Course\s*Code[:.]?\s*([1-6]\.[1-6](?:\([a-z]\))?)/gi;
  const matches = Array.from(text.matchAll(codePattern));

  if (matches.length === 0) {
    const namePattern = /Name\s*of\s*the\s*Course[:.]?\s*([^\n|]+)/gi;
    const nameMatches = Array.from(text.matchAll(namePattern));
    for (let i = 0; i < nameMatches.length; i++) {
      const start = nameMatches[i].index || 0;
      const end = nameMatches[i + 1]?.index || text.length;
      const blockText = text.slice(start, end);
      const codeM = blockText.match(config.courseCodeRegex);
      const code = codeM ? codeM[1] : `C${i + 1}`;
      const section = parseSingleSyllabusSection(blockText, code, nameMatches[i][1], config);
      if (section) sections.push(section);
    }
    return sections;
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index || 0;
    const end = matches[i + 1]?.index || text.length;
    const blockText = text.slice(start, end);
    const code = matches[i][1].trim();
    const section = parseSingleSyllabusSection(blockText, code, '', config);
    if (section) sections.push(section);
  }

  return sections;
}

function parseSingleSyllabusSection(
  text: string,
  code: string,
  fallbackName: string,
  config: ParserConfig
): SyllabusSection | null {
  // Extract course name
  const nameMatch = text.match(/Name\s*of\s*the\s*Course[:.]?\s*([^\n|]+)/i);
  let name = (nameMatch ? nameMatch[1] : fallbackName)
    .replace(/Name\s*of\s*the\s*Course[:.]?/gi, '')
    .replace(/BACHELOR\s*OF\s*COMMERCE\s*\(REGULAR\)/gi, '')
    .replace(/\(REGULAR\)/gi, '')
    .replace(config.courseNameCleanRegex, '')
    .trim();

  if (!name) {
    const boldMatch = text.match(/\*\*([^*]{5,80})\*\*/);
    if (boldMatch) name = boldMatch[1].trim();
  }

  if (!name || name.length < 3) return null;

  const branchMatch = text.match(config.branchRegex);
  const branch = branchMatch ? branchMatch[0].trim() : 'B.Com';

  const semMatch = text.match(config.semesterRegex);
  const semester = semMatch ? parseSemesterNumber(semMatch[1]) : 0;

  const credits = extractNumber(text, config.creditRegex, 4);
  const totalHours = extractNumber(text, config.totalHoursRegex, 56);

  // Use the robust outcome extractor
  const outcomes = extractOutcomes(text);

  // Units
  const units: { number: number; title: string; hours: number; topics: string[] }[] = [];

  // FIXED: Use greedy + instead of lazy +? so the title isn't truncated to 1 char
  const unitPattern = /(?:^|\n)[|>\s]*(?:\*\*)?\s*Unit[\s\-]*([0-9IVXivx]+)[:.]?\s*([^\n|*]+)(?:\*\*)?/gi;
  const unitMatches = Array.from(text.matchAll(unitPattern));

  for (let idx = 0; idx < unitMatches.length; idx++) {
    const m = unitMatches[idx];
    const unitNum = parseInt(m[1]) || romanToInt(m[1]) || 0;
    const unitTitle = m[2]
      .replace(/(?:Hours?|HOURS?)[\s:]*/i, '')
      .replace(/^[:\|\s>]+/, '')
      .trim();

    const unitStart = m.index || 0;
    const nextUnit = unitMatches[idx + 1];

    // FIXED: Stop unit text at next unit OR at section boundaries (skill dev, references)
    let unitEnd: number;
    if (nextUnit) {
      unitEnd = nextUnit.index || text.length;
    } else {
      unitEnd = findNextBoundary(text, unitStart + 1);
    }

    const unitText = text.slice(unitStart, unitEnd);

    // Hours
    let hours = 0;
    const boldNumMatch = unitText.match(/\*\*(\d{1,3})\*\*/);
    if (boldNumMatch) hours = parseInt(boldNumMatch[1]);
    if (hours === 0) hours = extractNumber(unitText, config.moduleHoursRegex, 0);
    if (hours === 0) hours = Math.round(totalHours / (unitMatches.length || 1));

    // Topics
    const topics: string[] = [];
    const lines = unitText.split('\n').slice(1);
    let currentTopic = '';
    let inTopic = false;

    for (const rawLine of lines) {
      const line = rawLine
        .replace(/^[|>\s*•\-\d.)]+/, '')
        .replace(/\*\*/g, '')
        .trim();
      if (!line || line.length < 5) continue;

      // FIXED: Stop accumulating when we hit a section boundary
      if (/^(?:Skill\s*Development|Books\s*(?:for\s*)?(?:Reference|References)|Reference\s*Books?|Bibliography|Suggested\s*Readings)/i.test(line)) {
        break;
      }

      // Skip other structural lines
      if (/^(?:Unit|UNIT|Outcome|SYLLABUS|Course\s*Outcomes|CREDITS|HOURS|NO\.OF|Pedagogy)/i.test(line)) continue;

      if (currentTopic) {
        currentTopic += ' ' + line;
      } else {
        currentTopic = line;
      }
      inTopic = true;
    }
    if (currentTopic) topics.push(currentTopic);

    if (topics.length === 0) {
      const fallback = unitText
        .replace(unitPattern, '')
        .replace(/^[|>\s*\-]+/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      if (fallback.length > 20) topics.push(fallback.substring(0, 500));
    }

    units.push({
      number: unitNum,
      title: unitTitle || `Unit ${unitNum}`,
      hours,
      topics: topics.length > 0 ? topics : [`Topics for ${unitTitle || 'Unit ' + unitNum}`],
    });
  }

  // References
  const references: string[] = [];
  const refMatch = text.match(config.referenceRegex);
  if (refMatch) {
    const refText = text.slice(refMatch.index || 0);
    const refLines = refText.split('\n').slice(1);
    for (const rawLine of refLines) {
      const line = rawLine.replace(/^[|>\s*•\-\d.)]+/, '').replace(/\*\*/g, '').trim();
      if (!line || line.length < 10) continue;
      if (/^(?:Unit|UNIT|Skill|Outcome|SYLLABUS)/i.test(line)) break;
      references.push(line);
    }
  }

  // Skill activities
  const skillActivities: string[] = [];
  const skillMatch = text.match(/(?:Skill\s*Development\s*Activities?|Practical\s*Exercises?)/i);
  if (skillMatch) {
    const skillText = text.slice(skillMatch.index || 0);
    const skillLines = skillText.split('\n').slice(1);
    for (const rawLine of skillLines) {
      const line = rawLine.replace(/^[|>\s*•\-\d.)]+/, '').replace(/\*\*/g, '').trim();
      if (!line || line.length < 10) continue;
      if (/^(?:Unit|UNIT|Books|Reference|Outcome)/i.test(line)) break;
      skillActivities.push(line);
    }
  }

  return {
    code,
    name,
    credits,
    hoursPerWeek: Math.round(totalHours / 14) || 4,
    totalHours,
    outcomes,
    units,
    references,
    skillActivities,
    branch,
    semester,
  };
}

// ─── Post-Processing ────────────────────────────────────────────────────

function postProcessExtract(extract: SyllabusExtract, config: ParserConfig): SyllabusExtract {
  const cleanedCourses = extract.courses.map(course => {
    let cleanName = course.name.replace(config.courseNameCleanRegex, '').trim();
    if (!cleanName) cleanName = course.name;

    const cleanModules = course.modules
      .filter(m => {
        const n = (m.moduleName ?? m.title ?? m.name ?? '').toLowerCase().trim();
        return !config.ignoredModuleNames.includes(n);
      })
      .map(m => {
        const desc = `${m.moduleName ?? ''} ${m.title ?? ''} ${m.name ?? ''} ${m.description ?? ''}`;
        const hrs = m.hours || extractNumber(desc, config.moduleHoursRegex, 0);
        const mrk = m.marks || extractNumber(desc, config.moduleMarksRegex, 0);
        return { ...m, hours: hrs, marks: mrk };
      });

    const totalHours = cleanModules.reduce((s, m) => s + (m.hours || 0), 0);
    const totalMarks = cleanModules.reduce((s, m) => s + (m.marks || 0), 0);

    return {
      ...course,
      name: cleanName,
      totalHours: totalHours || course.totalHours,
      totalMarks: totalMarks || course.totalMarks,
      modules: cleanModules,
    };
  });

  const totalModules = cleanedCourses.reduce((s, c) => s + c.modules.length, 0);
  const totalHours = cleanedCourses.reduce((s, c) => s + c.totalHours, 0);
  const totalMarks = cleanedCourses.reduce((s, c) => s + c.totalMarks, 0);

  return {
    ...extract,
    courses: cleanedCourses,
    totalModules,
    totalHours,
    totalMarks,
  };
}

// ─── Main Parser ──────────────────────────────────────────────────────────

export function parseSyllabusDocument(
  rawText: string,
  fileName: string,
  fileSize: number = 0,
  format: SyllabusFormat = 'docx',
  config: ParserConfig = DEFAULT_CONFIG
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const cleanRaw = cleanText(rawText);

    const matrixCourses = parseCourseMatrix(cleanRaw, config);
    if (matrixCourses.length === 0) {
      warnings.push('Could not parse course matrix. Falling back to detailed syllabus parsing only.');
    }

    const detailedSections = parseDetailedSyllabus(cleanRaw, config);
    if (detailedSections.length === 0) {
      warnings.push('Could not parse detailed syllabus sections.');
    }

    const courses: ParsedCourse[] = [];
    const usedCodes = new Set<string>();

    // First pass: match matrix + detailed
    for (const mc of matrixCourses) {
      const detail = detailedSections.find(d => d.code === mc.code);
      usedCodes.add(mc.code);

      const modules: ParsedModule[] = [];
      let moduleNo = 1;

      if (detail && detail.units.length > 0) {
        for (const unit of detail.units) {
          modules.push({
            id: `${mc.code}_u${unit.number}`,
            moduleNo: moduleNo++,
            moduleName: unit.title,
            title: unit.title,
            name: unit.title,
            description: unit.topics.join('\n'),
            hours: unit.hours,
            marks: Math.round(mc.totalMarks / (detail.units.length || 1)),
            type: 'theory',
            topics: unit.topics,
            learningOutcomes: detail.outcomes,
            confidence: unit.topics.length > 2 ? 'high' : unit.topics.length > 0 ? 'medium' : 'low',
            isEdited: false,
            subject: mc.name,
            course: mc.name,
            semester: mc.semester,
          });
        }
      } else {
        warnings.push(`No detailed syllabus found for ${mc.code}: ${mc.name}`);
        const defaultUnits = 5;
        const hoursPerUnit = Math.round((mc.hoursPerWeek * 14) / defaultUnits);
        for (let u = 1; u <= defaultUnits; u++) {
          modules.push({
            id: `${mc.code}_u${u}`,
            moduleNo: moduleNo++,
            moduleName: `Unit ${u}`,
            title: `Unit ${u}`,
            name: `Unit ${u}`,
            description: `Unit ${u} of ${mc.name}`,
            hours: hoursPerUnit,
            marks: Math.round(mc.totalMarks / defaultUnits),
            type: 'theory',
            topics: [`Unit ${u} topics for ${mc.name}`],
            learningOutcomes: [],
            confidence: 'low',
            isEdited: false,
            subject: mc.name,
            course: mc.name,
            semester: mc.semester,
          });
        }
      }

      courses.push({
        id: mc.code,
        code: mc.code,
        name: mc.name,
        shortName: mc.name.length > 40 ? mc.name.substring(0, 37) + '...' : mc.name,
        credits: mc.credits,
        totalHours: mc.hoursPerWeek * 14,
        totalMarks: mc.totalMarks,
        internalMarks: mc.iaMarks,
        externalMarks: mc.examMarks,
        semester: mc.semester,
        branch: detail?.branch || 'B.Com',
        scheme: 'CBCS',
        modules,
        // FIXED: Add outcomes at course level so the UI tab can display them
        outcomes: detail?.outcomes || [],
        references: detail?.references || [],
        confidence: modules.some(m => m.confidence === 'high') ? 'high' :
                    modules.some(m => m.confidence === 'medium') ? 'medium' : 'low',
        isEdited: false,
      });
    }

    // Second pass: detailed sections not in matrix
    for (const detail of detailedSections) {
      if (usedCodes.has(detail.code)) continue;
      usedCodes.add(detail.code);

      const modules: ParsedModule[] = [];
      let moduleNo = 1;
      for (const unit of detail.units) {
        modules.push({
          id: `${detail.code}_u${unit.number}`,
          moduleNo: moduleNo++,
          moduleName: unit.title,
          title: unit.title,
          name: unit.title,
          description: unit.topics.join('\n'),
          hours: unit.hours,
          marks: Math.round(100 / (detail.units.length || 1)),
          type: 'theory',
          topics: unit.topics,
          learningOutcomes: detail.outcomes,
          confidence: unit.topics.length > 2 ? 'high' : unit.topics.length > 0 ? 'medium' : 'low',
          isEdited: false,
          subject: detail.name,
          course: detail.name,
          semester: detail.semester,
        });
      }

      courses.push({
        id: detail.code,
        code: detail.code,
        name: detail.name,
        shortName: detail.name.length > 40 ? detail.name.substring(0, 37) + '...' : detail.name,
        credits: detail.credits,
        totalHours: detail.totalHours,
        totalMarks: 100,
        internalMarks: 20,
        externalMarks: 80,
        semester: detail.semester,
        branch: detail.branch,
        scheme: '',
        modules,
        // FIXED: Add outcomes at course level
        outcomes: detail.outcomes || [],
        references: detail.references || [],
        confidence: modules.some(m => m.confidence === 'high') ? 'high' :
                    modules.some(m => m.confidence === 'medium') ? 'medium' : 'low',
        isEdited: false,
      });
    }

    const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
    const highConfModules = courses.reduce(
      (sum, c) => sum + c.modules.filter(m => m.confidence === 'high').length, 0
    );
    const mediumConfModules = courses.reduce(
      (sum, c) => sum + c.modules.filter(m => m.confidence === 'medium').length, 0
    );

    const confidenceScore = totalModules > 0
      ? Math.round(((highConfModules * 1.0 + mediumConfModules * 0.6) / totalModules) * 100)
      : 0;

    let averageConfidence: ParseConfidence = 'low';
    if (confidenceScore >= 70) averageConfidence = 'high';
    else if (confidenceScore >= 40) averageConfidence = 'medium';

    const totalHours = courses.reduce((sum, c) => sum + c.totalHours, 0);
    const totalMarks = courses.reduce((sum, c) => sum + c.totalMarks, 0);

    let extract: SyllabusExtract = {
      id: `extract_${Date.now()}`,
      fileName,
      fileSize,
      format,
      extractedBy: 'system',
      extractedByName: 'Syllabus Parser v2.3',
      extractedAt: new Date().toISOString(),
      status: 'review',
      courses,
      totalCourses: courses.length,
      totalModules,
      totalHours,
      totalMarks,
      averageConfidence,
      confidenceScore,
    };

    extract = postProcessExtract(extract, config);

    return {
      success: courses.length > 0,
      extract,
      courses,
      errors,
      warnings,
      rawText: rawText.substring(0, 2000),
      confidenceScore,
      totalCourses: courses.length,
      totalModules: extract.totalModules,
      totalHours: extract.totalHours,
      totalMarks: extract.totalMarks,
    };

  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Unknown parsing error');
    return {
      success: false,
      courses: [],
      errors,
      warnings,
      rawText: rawText.substring(0, 1000),
      confidenceScore: 0,
      totalCourses: 0,
      totalModules: 0,
      totalHours: 0,
      totalMarks: 0,
    };
  }
}

// ─── Exports ────────────────────────────────────────────────────────────
export { parseCourseMatrix, parseDetailedSyllabus, parseSingleSyllabusSection, postProcessExtract };
export default parseSyllabusDocument;