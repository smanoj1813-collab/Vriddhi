#!/usr/bin/env node
// scripts/validate-question-paper.mjs
// ═══════════════════════════════════════════════════════════════════════
// Validates Vriddhi content question-paper JSON (pre-assessment seeds).
//
// Usage:
//   node scripts/validate-question-paper.mjs
//   node scripts/validate-question-paper.mjs content/pre-assessment/papers/*.json
//   node scripts/validate-question-paper.mjs --dir content/pre-assessment/papers
//
// Exit 0 if every paper is valid; 1 otherwise. Prints one line per file
// plus a totals summary. No npm dependencies — Node 18+ only.
// ═══════════════════════════════════════════════════════════════════════

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DEFAULT_DIR = join(ROOT, 'content/pre-assessment/papers');

export const ALLOWED_PROGRAMS = ['B.A', 'B.Com', 'B.Sc', 'BBA', 'BCA', 'B.Ed', 'M.A', 'M.Com', 'M.Sc', 'MBA', 'MCA'];
export const ALLOWED_TYPES = [
  'mcq',
  'true_false',
  'fill_in_blank',
  'short_answer',
  'long_answer',
  'numerical',
  'case_based',
  'assertion_reason',
  'matching',
];
export const ALLOWED_DIFFICULTY = ['easy', 'medium', 'hard'];
export const ALLOWED_BLOOM = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
export const SCHEMA_VERSION = 1;

const MCQ_TYPES = new Set(['mcq', 'assertion_reason']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function push(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function optionLabel(opt, idx) {
  if (opt && typeof opt.id === 'string' && opt.id.trim()) return opt.id.trim();
  return String.fromCharCode(65 + idx);
}

function sectionMarks(section) {
  const questions = Array.isArray(section?.questions) ? section.questions : [];
  const attemptCount = Number(section?.attempt?.count);
  if (Number.isInteger(attemptCount) && attemptCount > 0 && attemptCount < questions.length) {
    const per = questions.map((q) => Number(q?.marks) || 0);
    const same = per.length > 0 && per.every((m) => m === per[0]);
    if (same) return attemptCount * per[0];
    // Conservative: cheapest `attemptCount` questions would under-count a
    // diagnostic; require equal marks when using attempt-N-of-M.
    return NaN;
  }
  return questions.reduce((sum, q) => sum + (Number(q?.marks) || 0), 0);
}

/**
 * Validate a parsed paper object.
 * @param {unknown} paper
 * @param {string} [label]
 * @returns {{ ok: boolean, errors: string[], warnings: string[], stats: object }}
 */
export function validatePaper(paper, label = 'paper') {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(paper)) {
    return {
      ok: false,
      errors: [`${label}: root must be a JSON object`],
      warnings,
      stats: { questions: 0, marks: 0, sections: 0 },
    };
  }

  const reqStr = [
    'id',
    'title',
    'subject',
    'examType',
    'program',
    'branch',
    'scheme',
    'language',
  ];
  for (const key of reqStr) {
    if (typeof paper[key] !== 'string' || !paper[key].trim()) {
      push(errors, key, 'required non-empty string');
    }
  }

  if (paper.schemaVersion !== SCHEMA_VERSION) {
    push(errors, 'schemaVersion', `must be ${SCHEMA_VERSION}`);
  }
  if (paper.program && !ALLOWED_PROGRAMS.includes(paper.program)) {
    push(errors, 'program', `must be one of ${ALLOWED_PROGRAMS.join(', ')}`);
  }
  if (paper.branch && paper.program && paper.branch !== paper.program) {
    warnings.push(`branch (${paper.branch}) differs from program (${paper.program})`);
  }

  const semester = Number(paper.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 6) {
    push(errors, 'semester', 'must be an integer 1–6');
  }
  const duration = Number(paper.duration);
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) {
    push(errors, 'duration', 'must be an integer 15–240 (minutes)');
  }
  const totalMarks = Number(paper.totalMarks);
  if (!Number.isInteger(totalMarks) || totalMarks <= 0) {
    push(errors, 'totalMarks', 'must be a positive integer');
  }
  if (paper.negativeMarking !== false && paper.negativeMarking !== true) {
    push(errors, 'negativeMarking', 'must be a boolean');
  }
  if (paper.passingPercentage != null) {
    const pp = Number(paper.passingPercentage);
    if (!Number.isFinite(pp) || pp < 0 || pp > 100) {
      push(errors, 'passingPercentage', 'must be 0–100');
    }
  }
  if (!Array.isArray(paper.instructions) || paper.instructions.length === 0) {
    push(errors, 'instructions', 'must be a non-empty array of strings');
  } else {
    paper.instructions.forEach((line, i) => {
      if (typeof line !== 'string' || !line.trim()) push(errors, `instructions[${i}]`, 'must be a non-empty string');
    });
  }
  if (paper.sources != null) {
    if (!Array.isArray(paper.sources) || paper.sources.some((s) => typeof s !== 'string' || !s.trim())) {
      push(errors, 'sources', 'if present, must be an array of non-empty strings');
    }
  }

  if (!Array.isArray(paper.sections) || paper.sections.length === 0) {
    push(errors, 'sections', 'must be a non-empty array');
    return { ok: false, errors, warnings, stats: { questions: 0, marks: 0, sections: 0 } };
  }

  const paperIds = new Set();
  const questionIds = new Set();
  let questionCount = 0;
  let computedMarks = 0;

  if (typeof paper.id === 'string' && paper.id.trim()) paperIds.add(paper.id.trim());

  paper.sections.forEach((section, sIdx) => {
    const sPath = `sections[${sIdx}]`;
    if (!isPlainObject(section)) {
      push(errors, sPath, 'must be an object');
      return;
    }
    for (const key of ['id', 'name']) {
      if (typeof section[key] !== 'string' || !section[key].trim()) {
        push(errors, `${sPath}.${key}`, 'required non-empty string');
      }
    }
    if (section.id && paperIds.has(section.id)) {
      push(errors, `${sPath}.id`, `duplicate id "${section.id}"`);
    } else if (section.id) {
      paperIds.add(section.id);
    }
    if (section.questionType && !ALLOWED_TYPES.includes(section.questionType) && section.questionType !== 'mixed') {
      push(errors, `${sPath}.questionType`, `unknown type "${section.questionType}"`);
    }
    if (section.compulsory != null && typeof section.compulsory !== 'boolean') {
      push(errors, `${sPath}.compulsory`, 'must be a boolean');
    }
    if (!Array.isArray(section.questions) || section.questions.length === 0) {
      push(errors, `${sPath}.questions`, 'must be a non-empty array');
      return;
    }

    const attemptCount = section.attempt ? Number(section.attempt.count) : null;
    if (section.attempt) {
      if (!Number.isInteger(attemptCount) || attemptCount < 1) {
        push(errors, `${sPath}.attempt.count`, 'must be a positive integer');
      } else if (attemptCount >= section.questions.length) {
        push(errors, `${sPath}.attempt.count`, 'must be less than the number of questions in the section');
      }
    }

    section.questions.forEach((q, qIdx) => {
      const qPath = `${sPath}.questions[${qIdx}]`;
      questionCount += 1;
      if (!isPlainObject(q)) {
        push(errors, qPath, 'must be an object');
        return;
      }
      if (typeof q.id !== 'string' || !q.id.trim()) push(errors, `${qPath}.id`, 'required non-empty string');
      else if (questionIds.has(q.id)) push(errors, `${qPath}.id`, `duplicate question id "${q.id}"`);
      else questionIds.add(q.id);

      if (typeof q.text !== 'string' || q.text.trim().length < 8) {
        push(errors, `${qPath}.text`, 'required string of at least 8 characters');
      }
      if (!ALLOWED_TYPES.includes(q.type)) {
        push(errors, `${qPath}.type`, `must be one of ${ALLOWED_TYPES.join(', ')}`);
      }
      if (!ALLOWED_DIFFICULTY.includes(q.difficulty)) {
        push(errors, `${qPath}.difficulty`, `must be ${ALLOWED_DIFFICULTY.join('|')}`);
      }
      const marks = Number(q.marks);
      if (!Number.isFinite(marks) || marks <= 0) {
        push(errors, `${qPath}.marks`, 'must be a positive number');
      }
      if (q.bloomLevel && !ALLOWED_BLOOM.includes(q.bloomLevel)) {
        push(errors, `${qPath}.bloomLevel`, `must be one of ${ALLOWED_BLOOM.join(', ')}`);
      }
      if (q.topic != null && (typeof q.topic !== 'string' || !q.topic.trim())) {
        push(errors, `${qPath}.topic`, 'if present, must be a non-empty string');
      }

      if (MCQ_TYPES.has(q.type) || q.type === 'true_false') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          push(errors, `${qPath}.options`, 'MCQ / true-false needs at least 2 options');
        } else {
          if (q.type === 'true_false' && q.options.length !== 2) {
            push(errors, `${qPath}.options`, 'true_false must have exactly 2 options');
          }
          if (q.type === 'mcq' && q.options.length < 4) {
            push(errors, `${qPath}.options`, 'mcq needs at least 4 options');
          }
          let correct = 0;
          const labels = new Set();
          q.options.forEach((opt, oIdx) => {
            if (!isPlainObject(opt) || typeof opt.text !== 'string' || !opt.text.trim()) {
              push(errors, `${qPath}.options[${oIdx}]`, 'must be { id?, text, isCorrect }');
              return;
            }
            if (typeof opt.isCorrect !== 'boolean') {
              push(errors, `${qPath}.options[${oIdx}].isCorrect`, 'must be a boolean');
            }
            if (opt.isCorrect) correct += 1;
            const lab = optionLabel(opt, oIdx);
            if (labels.has(lab)) push(errors, `${qPath}.options[${oIdx}].id`, `duplicate option id "${lab}"`);
            labels.add(lab);
          });
          if (correct !== 1) {
            push(errors, `${qPath}.options`, `exactly one option must have isCorrect: true (found ${correct})`);
          }
          const correctOpt = (q.options || []).find((o) => o && o.isCorrect);
          const expected = correctOpt ? optionLabel(correctOpt, (q.options || []).indexOf(correctOpt)) : '';
          if (typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) {
            push(errors, `${qPath}.correctAnswer`, 'required (option id of the correct choice)');
          } else if (expected && q.correctAnswer.trim() !== expected) {
            push(errors, `${qPath}.correctAnswer`, `must match the correct option id "${expected}"`);
          }
        }
      } else if (q.options && q.options.length) {
        warnings.push(`${qPath}: options present on non-MCQ type "${q.type}"`);
      }

      if ((q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'numerical') && !q.modelAnswer && !q.correctAnswer) {
        warnings.push(`${qPath}: no modelAnswer/correctAnswer — faculty key will be empty`);
      }
      if (q.type === 'numerical' && q.tolerance != null) {
        const t = Number(q.tolerance);
        if (!Number.isFinite(t) || t < 0) push(errors, `${qPath}.tolerance`, 'must be a non-negative number');
      }
    });

    const marks = sectionMarks(section);
    if (!Number.isFinite(marks)) {
      push(errors, `${sPath}.attempt`, 'questions in an attempt-N-of-M section must share the same marks');
    } else {
      computedMarks += marks;
    }

    if (section.numQuestions != null && Number(section.numQuestions) !== section.questions.length) {
      warnings.push(`${sPath}.numQuestions (${section.numQuestions}) ≠ questions.length (${section.questions.length})`);
    }
  });

  if (Number.isInteger(totalMarks) && computedMarks !== totalMarks) {
    push(errors, 'totalMarks', `declared ${totalMarks} but sections sum to ${computedMarks}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      questions: questionCount,
      marks: computedMarks,
      sections: paper.sections.length,
      id: paper.id || label,
      title: paper.title || '',
      program: paper.program || '',
    },
  };
}

export function loadPaperFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return {
      paper: null,
      result: {
        ok: false,
        errors: [`${basename(filePath)}: invalid JSON (${err instanceof Error ? err.message : err})`],
        warnings: [],
        stats: { questions: 0, marks: 0, sections: 0 },
      },
    };
  }
  return { paper: data, result: validatePaper(data, basename(filePath)) };
}

export function listPaperFiles(dir = DEFAULT_DIR) {
  const abs = resolve(dir);
  let names;
  try {
    names = readdirSync(abs);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith('.json') && !n.startsWith('.'))
    .map((n) => join(abs, n))
    .sort();
}

function expandArg(arg) {
  const abs = isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
  try {
    const st = statSync(abs);
    if (st.isDirectory()) return listPaperFiles(abs);
    if (st.isFile() && extname(abs) === '.json') return [abs];
  } catch {
    return [];
  }
  return [];
}

function parseArgs(argv) {
  const files = [];
  let dir = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir' && argv[i + 1]) {
      dir = argv[++i];
    } else if (a === '--help' || a === '-h') {
      return { help: true, files: [] };
    } else if (a.startsWith('-')) {
      return { help: false, files: [], error: `Unknown flag: ${a}` };
    } else {
      files.push(...expandArg(a));
    }
  }
  if (dir) files.push(...listPaperFiles(resolve(process.cwd(), dir)));
  return { help: false, files };
}

export function formatReport(filePath, result) {
  const name = basename(filePath);
  if (result.ok) {
    const w = result.warnings.length ? `  (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})` : '';
    return `OK  ${name}  —  ${result.stats.program} · ${result.stats.sections} sections · ${result.stats.questions} questions · ${result.stats.marks} marks${w}`;
  }
  const lines = [`FAIL  ${name}  —  ${result.errors.length} error(s)`];
  result.errors.forEach((e) => lines.push(`      - ${e}`));
  return lines.join('\n');
}

function printHelp() {
  console.log(`Validate Vriddhi content question papers.

Usage:
  node scripts/validate-question-paper.mjs
  node scripts/validate-question-paper.mjs --dir content/pre-assessment/papers
  node scripts/validate-question-paper.mjs path/to/paper.json

Default directory: content/pre-assessment/papers/
`);
}

export async function runValidation(paths) {
  const files = paths.length ? paths : listPaperFiles(DEFAULT_DIR);
  if (files.length === 0) {
    return { ok: false, files: [], reports: ['No paper JSON files found.'] };
  }
  let ok = true;
  const reports = [];
  const results = [];
  for (const file of files) {
    const { result } = loadPaperFile(file);
    results.push({ file, result });
    reports.push(formatReport(file, result));
    result.warnings.forEach((w) => reports.push(`      warn: ${w}`));
    if (!result.ok) ok = false;
  }
  return { ok, files, reports, results };
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirect) {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    printHelp();
    process.exit(0);
  }
  if (parsed.error) {
    console.error(parsed.error);
    printHelp();
    process.exit(1);
  }
  const { ok, files, reports } = await runValidation(parsed.files);
  reports.forEach((line) => console.log(line));
  console.log(`\n${ok ? 'Validated' : 'FAILED'} ${files.length} paper(s).`);
  process.exit(ok ? 0 : 1);
}
