// src/shared/utils/questionFileParser.ts
// Parses uploaded question files (CSV / TSV / JSON) into editable draft questions.

import type { QuestionType, DifficultyLevel } from '@/modules/admin/types/questionBank';

export interface DraftQuestion {
  /** Local row id (not the Firestore id). */
  rowId: string;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  subject: string;
  topic: string;
  unit: string;
  marks: number;
  options: string[];
  correctAnswer: string;
  explanation: string;
  tags: string[];
  batch: string;
  branch: string;
  isPYQ: boolean;
  examYear: string;
  examName: string;
}

let rowCounter = 0;
export function newRowId(): string {
  rowCounter += 1;
  return `row_${Date.now().toString(36)}_${rowCounter}`;
}

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'case_based', label: 'Case Based' },
];

export const DIFFICULTY_OPTIONS: DifficultyLevel[] = ['easy', 'medium', 'hard'];

export function emptyDraftQuestion(defaults: Partial<DraftQuestion> = {}): DraftQuestion {
  return {
    rowId: newRowId(),
    text: '',
    type: 'short_answer',
    difficulty: 'medium',
    subject: '',
    topic: '',
    unit: '',
    marks: 2,
    options: [],
    correctAnswer: '',
    explanation: '',
    tags: [],
    batch: '',
    branch: '',
    isPYQ: false,
    examYear: '',
    examName: '',
    ...defaults,
  };
}

/** RFC-4180-ish splitter: handles quoted fields containing commas and "" escapes. */
export function splitDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

/** Splits raw text into rows while respecting newlines inside quoted fields. */
function splitRows(text: string): string[] {
  const rows: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (cur.trim()) rows.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) rows.push(cur);
  return rows;
}

const HEADER_ALIASES: Record<string, keyof DraftQuestion> = {
  question: 'text',
  'question text': 'text',
  questiontext: 'text',
  text: 'text',
  type: 'type',
  'question type': 'type',
  difficulty: 'difficulty',
  level: 'difficulty',
  subject: 'subject',
  course: 'subject',
  topic: 'topic',
  chapter: 'topic',
  unit: 'unit',
  module: 'unit',
  marks: 'marks',
  mark: 'marks',
  options: 'options',
  choices: 'options',
  answer: 'correctAnswer',
  correctanswer: 'correctAnswer',
  'correct answer': 'correctAnswer',
  explanation: 'explanation',
  solution: 'explanation',
  tags: 'tags',
  batch: 'batch',
  branch: 'branch',
  program: 'branch',
  ispyq: 'isPYQ',
  pyq: 'isPYQ',
  examyear: 'examYear',
  'exam year': 'examYear',
  examname: 'examName',
  'exam name': 'examName',
};

function normalizeType(raw: string): QuestionType {
  const v = (raw || '').toLowerCase().replace(/[\s-]+/g, '_');
  const map: Record<string, QuestionType> = {
    mcq: 'mcq',
    multiple_choice: 'mcq',
    objective: 'mcq',
    true_false: 'true_false',
    truefalse: 'true_false',
    tf: 'true_false',
    fill_in_blank: 'fill_in_blank',
    fill_in_the_blank: 'fill_in_blank',
    fib: 'fill_in_blank',
    short: 'short_answer',
    short_answer: 'short_answer',
    long: 'long_answer',
    long_answer: 'long_answer',
    essay: 'long_answer',
    numerical: 'numerical',
    problem: 'numerical',
    case_based: 'case_based',
    case_study: 'case_based',
  };
  return map[v] || 'short_answer';
}

function normalizeDifficulty(raw: string): DifficultyLevel {
  const v = (raw || '').toLowerCase();
  if (v.startsWith('e') || v === '1') return 'easy';
  if (v.startsWith('h') || v === '3') return 'hard';
  return 'medium';
}

function splitList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/\||;|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ParseResult {
  questions: DraftQuestion[];
  warnings: string[];
}

/** Parses CSV / TSV text into draft questions. */
export function parseDelimitedQuestions(raw: string, defaults: Partial<DraftQuestion> = {}): ParseResult {
  const warnings: string[] = [];
  const rows = splitRows(raw);
  if (rows.length === 0) return { questions: [], warnings: ['File is empty'] };

  const delimiter = rows[0].includes('\t') ? '\t' : ',';
  const headerCells = splitDelimitedLine(rows[0], delimiter).map((h) =>
    h.toLowerCase().replace(/^"|"$/g, '').trim()
  );
  const mapped = headerCells.map((h) => HEADER_ALIASES[h]);
  const hasHeader = mapped.some((m) => m === 'text');

  const questions: DraftQuestion[] = [];

  if (!hasHeader) {
    warnings.push(
      'No recognised header row found — each non-empty line was imported as a question. Edit the details below before saving.'
    );
    rows.forEach((line) => {
      const cleaned = line.replace(/^"|"$/g, '').trim();
      if (!cleaned) return;
      questions.push(emptyDraftQuestion({ ...defaults, text: cleaned }));
    });
    return { questions, warnings };
  }

  for (let i = 1; i < rows.length; i++) {
    const cells = splitDelimitedLine(rows[i], delimiter);
    if (cells.every((c) => !c)) continue;
    const q = emptyDraftQuestion(defaults);
    cells.forEach((value, idx) => {
      const key = mapped[idx];
      if (!key) return;
      const clean = value.replace(/^"|"$/g, '').trim();
      switch (key) {
        case 'marks':
          q.marks = Number(clean) || 1;
          break;
        case 'type':
          q.type = normalizeType(clean);
          break;
        case 'difficulty':
          q.difficulty = normalizeDifficulty(clean);
          break;
        case 'options':
          q.options = splitList(clean);
          break;
        case 'tags':
          q.tags = splitList(clean);
          break;
        case 'isPYQ':
          q.isPYQ = ['true', 'yes', '1', 'y'].includes(clean.toLowerCase());
          break;
        default:
          (q as any)[key] = clean;
      }
    });
    if (!q.text) continue;
    questions.push(q);
  }

  if (questions.length === 0) warnings.push('No question rows could be read from this file.');
  return { questions, warnings };
}

/** Parses a JSON array (or {questions: []}) into draft questions. */
export function parseJsonQuestions(raw: string, defaults: Partial<DraftQuestion> = {}): ParseResult {
  const warnings: string[] = [];
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return { questions: [], warnings: ['Invalid JSON file.'] };
  }
  const list = Array.isArray(data) ? data : data?.questions || data?.data || [];
  if (!Array.isArray(list)) return { questions: [], warnings: ['JSON must be an array of questions.'] };

  const questions = list
    .map((item: any) =>
      emptyDraftQuestion({
        ...defaults,
        text: item.text || item.question || item.questionText || '',
        type: normalizeType(item.type || item.questionType || ''),
        difficulty: normalizeDifficulty(item.difficulty || item.level || ''),
        subject: item.subject || defaults.subject || '',
        topic: item.topic || item.chapter || '',
        unit: String(item.unit ?? item.module ?? ''),
        marks: Number(item.marks) || 1,
        options: Array.isArray(item.options)
          ? item.options.map((o: any) => (typeof o === 'string' ? o : o?.text || ''))
          : splitList(item.options || ''),
        correctAnswer: Array.isArray(item.correctAnswer)
          ? item.correctAnswer.join(', ')
          : item.correctAnswer || item.answer || '',
        explanation: item.explanation || item.solution || '',
        tags: Array.isArray(item.tags) ? item.tags : splitList(item.tags || ''),
        batch: item.batch || defaults.batch || '',
        branch: item.branch || item.program || defaults.branch || '',
        isPYQ: Boolean(item.isPYQ),
        examYear: item.examYear || '',
        examName: item.examName || '',
      })
    )
    .filter((q: DraftQuestion) => q.text);

  if (questions.length === 0) warnings.push('No questions found in the JSON file.');
  return { questions, warnings };
}

/** Entry point: picks the right parser from the file name / content. */
export function parseQuestionFile(
  fileName: string,
  content: string,
  defaults: Partial<DraftQuestion> = {}
): ParseResult {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json') || content.trim().startsWith('[') || content.trim().startsWith('{')) {
    return parseJsonQuestions(content, defaults);
  }
  return parseDelimitedQuestions(content, defaults);
}

/** Row-level validation used by the review table. */
export function validateDraftQuestion(q: DraftQuestion): string[] {
  const errors: string[] = [];
  if (!q.text?.trim()) errors.push('Question text is required');
  if (!q.subject?.trim()) errors.push('Subject is required');
  if (!q.marks || q.marks <= 0) errors.push('Marks must be greater than 0');
  if (q.type === 'mcq') {
    if (q.options.filter((o) => o.trim()).length < 2) errors.push('MCQ needs at least 2 options');
    if (!q.correctAnswer?.trim()) errors.push('MCQ needs a correct answer');
  }
  return errors;
}

export const SAMPLE_QUESTION_CSV = `text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName
"State the accounting equation.","Financial Accounting","short_answer","easy","1",2,"","Assets = Liabilities + Capital","Basic identity","accounting","2024-25","B.Com",false,,
"Which of these is a current asset?","Financial Accounting","mcq","easy","1",1,"Building|Inventory|Goodwill|Land","Inventory","Inventory is converted within a year","assets","2024-25","B.Com",false,,
"Explain the functions of management with examples.","Business Management","long_answer","medium","2",10,"","","POSDCORB","management","2024-25","BBA",true,"2024","Semester End"`;
