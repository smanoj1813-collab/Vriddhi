// ═══════════════════════════════════════════════════════════════════════
// src/modules/superadmin/data/questionBankSeed.ts
//
// The curated platform question-bank seed (data/question-bank/*.csv) bundled
// into the app so a superadmin can load it from Superadmin → Question Bank
// without touching a terminal or copy-pasting CSV.
//
// The CSVs are generated + validated by `data/question-bank/generate_seed.py`
// and use the exact column order the app's bulk-import parser expects:
//
//   text,subject,type,difficulty,unit,subtopic,marks,options,correctAnswer,
//   explanation,tags,batch,branch,isPYQ,examYear,examName
//
// `unit` is the topic tier and `subtopic` the third tier of the hierarchy in
// `data/question-bank/structure.py`; they land in topicId and subTopicId.
//
// Everything in this module is pure (no Firestore) so it can be unit tested
// with `npm run test:unit`.
// ═══════════════════════════════════════════════════════════════════════

// Vite's `?raw` suffix inlines the file as a string at build time.
//
// Only the combined CSV is bundled. `BCom_/BA_/BSc_QuestionBank.csv` are exact
// subsets of it (same header, same row order, one branch each), so inlining all
// four would ship ~450 KB of duplicated text in the superadmin chunk; the
// per-programme datasets are filtered out of the combined one instead.
// @ts-ignore — typed by vite/client, but keep the fallback for tsx/node tests
import allCsv from '../../../../data/question-bank/All_QuestionBank.csv?raw';

import type {
  CreatedBy,
  DifficultyLevel,
  QuestionContent,
  QuestionMetadata,
  QuestionOption,
  QuestionType as UniversalQuestionType,
  ReviewStatus,
  Visibility,
} from '../../admin/types/universalQuestionBank';

// ───────────────────────────────────────────────────────────────────────
// Seed catalogue
// ───────────────────────────────────────────────────────────────────────

export const SEED_CSV_HEADERS = [
  'text', 'subject', 'type', 'difficulty', 'unit', 'subtopic', 'marks',
  'options', 'correctAnswer', 'explanation', 'tags', 'batch', 'branch',
  'isPYQ', 'examYear', 'examName',
] as const;

export type SeedFileKey = 'all' | 'bcom' | 'ba' | 'bsc';

export interface SeedFile {
  key: SeedFileKey;
  /** Human label shown in the dataset picker. */
  label: string;
  /** Branch filter this file covers, or null for the combined dataset. */
  branch: string | null;
  /** Number of question rows the generator wrote (used for the UI summary). */
  expectedRows: number;
  csv: string;
}

/**
 * Branch labels in the seed data. `branch` is carried into tags (the universal
 * schema has no branch column) so filters and search still narrow by programme.
 */
export const SEED_BRANCHES = ['B.Com', 'BA', 'B.Sc'] as const;

/** The combined dataset, exactly as `generate_seed.py` wrote it. */
export const SEED_ALL_CSV = String(allCsv ?? '');

/**
 * Filters the combined CSV down to one programme.
 *
 * Rows are matched on the `branch` column *by header position* rather than by a
 * fixed index, so a future column reorder cannot silently produce an empty
 * dataset. The raw-comma split is safe here because the generator forbids commas
 * inside any field — the same rule `parseSeedCsv` relies on.
 */
export function filterSeedCsvByBranch(csvText: string, branch: string): string {
  const lines = String(csvText || '').replace(/\r\n?/g, '\n').trim().split('\n');
  if (lines.length < 2) return String(csvText || '');

  const header = lines[0].split(',');
  const branchIdx = header.findIndex((h) => h.trim().replace(/^"|"$/g, '') === 'branch');
  if (branchIdx < 0) return String(csvText || '');

  const wanted = branch.trim().toLowerCase();
  const kept = lines.slice(1).filter((line) => {
    if (!line.trim()) return false;
    const cell = line.split(',')[branchIdx] || '';
    return cell.trim().replace(/^"|"$/g, '').toLowerCase() === wanted;
  });

  return [lines[0], ...kept].join('\n');
}

export const SEED_FILES: SeedFile[] = [
  {
    key: 'all',
    label: 'All programmes (B.Com + BA + B.Sc)',
    branch: null,
    expectedRows: 759,
    csv: SEED_ALL_CSV,
  },
  {
    key: 'bcom',
    label: 'B.Com — 4 subjects × 16 topics × 48 sub-topics',
    branch: 'B.Com',
    expectedRows: 262,
    csv: filterSeedCsvByBranch(SEED_ALL_CSV, 'B.Com'),
  },
  {
    key: 'ba',
    label: 'BA — 4 subjects × 16 topics × 48 sub-topics',
    branch: 'BA',
    expectedRows: 238,
    csv: filterSeedCsvByBranch(SEED_ALL_CSV, 'BA'),
  },
  {
    key: 'bsc',
    label: 'B.Sc — 4 subjects × 16 topics × 48 sub-topics',
    branch: 'B.Sc',
    expectedRows: 259,
    csv: filterSeedCsvByBranch(SEED_ALL_CSV, 'B.Sc'),
  },
];

export function getSeedFile(key: SeedFileKey): SeedFile {
  return SEED_FILES.find((f) => f.key === key) || SEED_FILES[0];
}

// ───────────────────────────────────────────────────────────────────────
// CSV parsing
// ───────────────────────────────────────────────────────────────────────

export interface SeedRow {
  /** 1-based line number in the CSV (header is line 1) — used in error output. */
  line: number;
  text: string;
  subject: string;
  type: string;
  difficulty: string;
  /** CSV `unit` column — maps to the universal bank's topicId. */
  unit: string;
  /** CSV `subtopic` column — maps to the universal bank's subTopicId. */
  subtopic: string;
  marks: number;
  /** Raw `A|B|C|D` option string from the CSV. */
  optionsRaw: string;
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

export interface ValidatedSeedRow {
  row: SeedRow;
  valid: boolean;
  errors: string[];
}

/**
 * Parses the seed CSV.
 *
 * Deliberately mirrors `BulkImportModal.parseCSV` (and therefore the rules the
 * generator enforces): each line is split on a **raw comma**, so no field may
 * contain a comma or a double quote. Quoted-CSV support is intentionally absent
 * so that a file which parses here also parses in the college bulk-import path —
 * two parsers that disagree would silently produce different banks.
 */
export function parseSeedCsv(csvText: string): SeedRow[] {
  const lines = String(csvText || '').replace(/\r\n?/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  const strip = (v: string) => (v || '').trim().replace(/^"|"$/g, '');
  const headers = lines[0].split(',').map(strip);
  const rows: SeedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(strip);
    const get = (field: string) => {
      const idx = headers.indexOf(field);
      return idx >= 0 ? values[idx] || '' : '';
    };

    const optionsRaw = get('options');
    const tagsRaw = get('tags');

    rows.push({
      line: i + 1,
      text: get('text'),
      subject: get('subject'),
      type: get('type') || 'mcq',
      difficulty: get('difficulty') || 'medium',
      unit: get('unit'),
      subtopic: get('subtopic'),
      // The legacy bulk importer defaults a missing/blank marks cell to 10; the
      // seed is a 1–2 mark bank, so default to 1 and never invent 10-mark rows.
      marks: Number.parseInt(get('marks'), 10) || 1,
      optionsRaw,
      options: optionsRaw ? optionsRaw.split('|').map((o) => o.trim()).filter(Boolean) : [],
      correctAnswer: get('correctAnswer'),
      explanation: get('explanation'),
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
      batch: get('batch'),
      branch: get('branch'),
      isPYQ: get('isPYQ').toLowerCase() === 'true',
      examYear: get('examYear'),
      examName: get('examName'),
    });
  }

  return rows;
}

// ───────────────────────────────────────────────────────────────────────
// Type / difficulty mapping (legacy CSV vocabulary → universal vocabulary)
// ───────────────────────────────────────────────────────────────────────

/**
 * The universal bank has no `short`/`long` aliases (those are legacy
 * CollegeQuestion types), so they are folded into their long-form equivalents.
 * Unknown types fall back to `mcq` only when options exist, otherwise
 * `short_answer` — guessing `mcq` for a question with no options would create
 * an unanswerable row.
 */
export function toUniversalQuestionType(
  raw: string,
  hasOptions = false
): UniversalQuestionType {
  const t = String(raw || '').trim().toLowerCase();
  const map: Record<string, UniversalQuestionType> = {
    mcq: 'mcq',
    multiple_choice: 'mcq',
    true_false: 'true_false',
    truefalse: 'true_false',
    short_answer: 'short_answer',
    short: 'short_answer',
    long_answer: 'long_answer',
    long: 'long_answer',
    fill_in_blank: 'fill_in_blank',
    match: 'matching',
    matching: 'matching',
    numerical: 'numerical',
    case_based: 'case_based',
    assertion_reason: 'assertion_reason',
  };
  if (map[t]) return map[t];
  return hasOptions ? 'mcq' : 'short_answer';
}

export function toUniversalDifficulty(raw: string): DifficultyLevel {
  const d = String(raw || '').trim().toLowerCase();
  if (d === 'easy' || d === 'medium' || d === 'hard') return d;
  return 'medium';
}

// ───────────────────────────────────────────────────────────────────────
// Validation
// ───────────────────────────────────────────────────────────────────────

/** Same rule set `generate_seed.py` enforces before it writes the CSVs. */
export function validateSeedRow(row: SeedRow): string[] {
  const errors: string[] = [];
  const type = toUniversalQuestionType(row.type, row.options.length > 0);

  if (!row.text.trim()) errors.push('Question text is required');
  if (!row.subject.trim()) errors.push('Subject is required');
  if (!row.unit.trim()) errors.push('Topic (CSV "unit" column) is required');
  if (!Number.isFinite(row.marks) || row.marks <= 0) errors.push('Marks must be a positive number');

  // The raw-comma split means a stray comma/quote shifts every later column.
  if (row.text.includes('"')) errors.push('Double quotes are not supported — remove them from the question text');
  if (row.optionsRaw.includes('"')) errors.push('Double quotes are not supported inside options');

  if (type === 'mcq') {
    if (row.options.length < 2) errors.push(`MCQ needs at least 2 options (found ${row.options.length})`);
    if (row.options.length > 4) errors.push(`MCQ supports at most 4 options (found ${row.options.length})`);
    if (!/^[A-Da-d]$/.test(row.correctAnswer.trim())) {
      errors.push('MCQ correctAnswer must be a single letter A–D');
    } else {
      const letter = row.correctAnswer.trim().toUpperCase();
      const idx = 'ABCD'.indexOf(letter);
      if (idx >= row.options.length) {
        errors.push(`MCQ correctAnswer "${letter}" points past the last option`);
      }
      const chosen = (row.options[idx] || '').trim();
      if (!chosen) errors.push(`MCQ correct option "${letter}" is empty`);
    }
    if (row.options.some((o) => !o.trim())) errors.push('MCQ has an empty option');
  }

  if (type === 'true_false') {
    // Auto-grading compares the stored key literally, so a free-text key
    // ("Is the same on the original cost") can never be marked correct.
    const key = row.correctAnswer.trim().toLowerCase();
    if (key !== 'true' && key !== 'false') {
      errors.push('true_false correctAnswer must be exactly "True" or "False"');
    }
  }

  if (type === 'short_answer' || type === 'long_answer') {
    if (!row.correctAnswer.trim()) errors.push(`${type} needs the expected answer in correctAnswer`);
  }

  if (type === 'numerical') {
    if (!row.correctAnswer.trim()) {
      errors.push('numerical needs the expected value in correctAnswer');
    } else if (!Number.isFinite(Number(row.correctAnswer.trim()))) {
      errors.push(`numerical correctAnswer must be a number (got "${row.correctAnswer.trim()}")`);
    }
  }

  if (row.isPYQ) {
    if (!row.examYear.trim()) errors.push('examYear is required when isPYQ is true');
    if (!row.examName.trim()) errors.push('examName is required when isPYQ is true');
  }

  return errors;
}

export function validateSeedRows(rows: SeedRow[]): ValidatedSeedRow[] {
  return rows.map((row) => {
    const errors = validateSeedRow(row);
    return { row, valid: errors.length === 0, errors };
  });
}

// ───────────────────────────────────────────────────────────────────────
// Dedupe fingerprints
// ───────────────────────────────────────────────────────────────────────

export function normalizeQuestionText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
}

/**
 * Identity of a question for idempotent seeding: same wording + subject + topic
 * + programme ⇒ same question. Re-running the seeder skips anything already in
 * the pool instead of stacking duplicates (the college bulk importer cannot do
 * this, which is why its README warns "import each file once").
 */
export function buildSeedFingerprint(input: {
  text: string;
  subject: string;
  topic: string;
  branch?: string | null;
}): string {
  return [
    normalizeQuestionText(input.text),
    String(input.subject || '').trim().toLowerCase(),
    String(input.topic || '').trim().toLowerCase(),
    String(input.branch || '').trim().toLowerCase(),
  ].join('|');
}

export function fingerprintSeedRow(row: SeedRow): string {
  return buildSeedFingerprint({
    text: row.text,
    subject: row.subject,
    topic: row.unit,
    branch: row.branch,
  });
}

/**
 * Fingerprint of a document already in `questionBank_meta`.
 *
 * Tolerant of both shapes it can hold: universal rows store the wording in
 * `previewText`/`questionText` and the programme in `tags`; migrated legacy rows
 * may still carry `text`/`subject`/`unit`/`branch` directly.
 */
export function fingerprintMetaDoc(meta: Record<string, any>): string {
  const text = String(
    meta?.questionText || meta?.previewText || meta?.text || meta?.content || ''
  );
  const tags: string[] = Array.isArray(meta?.tags) ? meta.tags.map((t: any) => String(t)) : [];
  const branch =
    meta?.branch ||
    tags.find((t) => SEED_BRANCHES.some((b) => b.toLowerCase() === t.toLowerCase())) ||
    '';
  return buildSeedFingerprint({
    text,
    subject: meta?.subjectId || meta?.subject || '',
    topic: meta?.topicId || meta?.topic || meta?.unit || '',
    branch,
  });
}

// ───────────────────────────────────────────────────────────────────────
// Row → universal bank document
// ───────────────────────────────────────────────────────────────────────

export interface SeedAuthor {
  userId: string;
  userName: string;
}

export interface SeedPayloadOptions {
  visibility?: Visibility;
  status?: ReviewStatus;
  /** 'platform' = Vriddhi-curated and free for every college; 'college' = private. */
  source?: string;
  /** Reorder MCQ options so the answer key is not skewed towards A/B. */
  shuffleOptions?: boolean;
  author: SeedAuthor;
}

export interface SeedPayload {
  fingerprint: string;
  meta: Omit<QuestionMetadata, 'id' | 'createdAt' | 'updatedAt'>;
  content: Partial<QuestionContent> & { questionText: string };
}

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Deterministic PRNG (mulberry32) + Fisher–Yates.
 *
 * The shuffle is seeded from the question's fingerprint, so re-seeding the same
 * CSV produces byte-identical documents — idempotency survives the reordering,
 * and a diff of the pool before/after a no-op run stays empty.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface SeedOptionsResult {
  options: QuestionOption[];
  correctAnswer: string;
  shuffled: boolean;
}

/**
 * Builds the universal-pool option list.
 *
 * MCQ options come from the pipe-separated CSV column and are keyed A–D (the
 * convention every consumer expects: `aiQuestionApi.normalizeOptions`,
 * `QuestionSubmissionForm`, and the preview dialog which highlights the option
 * whose `isCorrect` is true). True/false rows get an explicit True/False pair so
 * they are answerable and auto-gradable from the universal pool too.
 */
export function buildSeedOptions(
  row: SeedRow,
  type: UniversalQuestionType,
  fingerprint: string,
  shuffle: boolean
): SeedOptionsResult {
  if (type === 'true_false') {
    const isTrue = row.correctAnswer.trim().toLowerCase() === 'true';
    return {
      options: [
        { id: 'A', text: 'True', isCorrect: isTrue },
        { id: 'B', text: 'False', isCorrect: !isTrue },
      ],
      correctAnswer: isTrue ? 'A' : 'B',
      shuffled: false,
    };
  }

  if (type !== 'mcq' || row.options.length === 0) {
    // Free-text / numerical / matching rows carry the expected answer verbatim.
    return { options: [], correctAnswer: row.correctAnswer.trim(), shuffled: false };
  }

  const keyIndex = Math.max(0, LETTERS.indexOf(row.correctAnswer.trim().toUpperCase()));
  const correctText = row.options[keyIndex] ?? '';

  let ordered = row.options.map((text) => text.trim());
  let shuffled = false;
  if (shuffle && ordered.length > 1) {
    // Seed on fingerprint + correct text (not on position) so the permutation
    // stays stable even if the source CSV reorders its options later.
    const permuted = seededShuffle(
      ordered.map((text, i) => ({ text, i })),
      `${fingerprint}::${correctText}`
    );
    const changed = permuted.some((entry, pos) => entry.i !== pos);
    if (changed) {
      ordered = permuted.map((entry) => entry.text);
      shuffled = true;
    }
  }

  const correctIndex = ordered.indexOf(correctText);
  const options: QuestionOption[] = ordered.map((text, i) => ({
    id: LETTERS[i] ?? String(i + 1),
    text,
    isCorrect: i === correctIndex,
  }));

  return {
    options,
    correctAnswer: correctIndex >= 0 ? LETTERS[correctIndex] ?? '' : '',
    shuffled,
  };
}

/** App language codes used across the bank: en | hi | kn | ta | te | ml. */
export function detectSeedLanguage(text: string): string {
  const t = String(text || '');
  if (/[\u0900-\u097F]/.test(t)) return 'hi';
  if (/[\u0C80-\u0CFF]/.test(t)) return 'kn';
  if (/[\u0B80-\u0BFF]/.test(t)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(t)) return 'te';
  if (/[\u0D00-\u0D7F]/.test(t)) return 'ml';
  return 'en';
}

export function buildSeedTags(row: SeedRow, source: string): string[] {
  const tags = [
    ...row.tags,
    row.branch,
    row.batch ? `batch-${row.batch}` : '',
    // Ownership tags mirror QuestionSubmissionForm so platform seed content is
    // recognisable (and filterable) as Vriddhi-curated free material.
    source === 'platform' ? 'vriddhi-curated' : '',
    source === 'platform' ? 'free' : '',
    row.isPYQ ? 'pyq' : '',
    'seed-import',
  ];
  return [...new Set(tags.map((t) => String(t || '').trim()).filter(Boolean))];
}

/**
 * Maps one validated CSV row onto the two documents the universal pool stores
 * (`questionBank_meta` + `questionBank_content`), using exactly the field shapes
 * `questionStorageApi.createQuestion` produces for a superadmin submission:
 * status `approved`, visibility `public`, source `platform`.
 */
export function buildSeedPayload(
  row: SeedRow,
  opts: SeedPayloadOptions
): SeedPayload {
  const visibility: Visibility = opts.visibility || 'public';
  const status: ReviewStatus = opts.status || 'approved';
  const source = opts.source || 'platform';
  const questionType = toUniversalQuestionType(row.type, row.options.length > 0);
  const fingerprint = fingerprintSeedRow(row);
  const tags = buildSeedTags(row, source);
  const subjectId = row.subject.trim() || 'General';
  const topicId = row.unit.trim() || 'General';
  // Third tier of the hierarchy. Blank when a CSV predates the `subtopic`
  // column, which the universal schema treats as "no sub-topic".
  const subTopicId = row.subtopic.trim();
  const marks = Number.isFinite(row.marks) && row.marks > 0 ? row.marks : 1;
  const language = detectSeedLanguage(row.text);

  const { options, correctAnswer } = buildSeedOptions(
    row,
    questionType,
    fingerprint,
    opts.shuffleOptions !== false
  );

  const createdBy: CreatedBy = {
    userId: opts.author?.userId || '',
    userName: opts.author?.userName || 'Vriddhi',
    // A null collegeId is what marks a row as platform-wide rather than
    // college-owned — `isVisibleToCollege()` resolves those as public content.
    collegeId: null,
    collegeName: source === 'platform' ? 'Vriddhi' : '',
    role: 'superadmin',
  };

  const questionText = row.text.trim();

  const meta = {
    subjectId,
    topicId,
    subTopicId,
    difficulty: toUniversalDifficulty(row.difficulty),
    questionType,
    marks,
    language,
    tags,
    status,
    visibility,
    sharedWith: [] as string[],
    source,
    storagePath: '',
    hasImage: false,
    qualityRating: 0,
    usageCount: 0,
    createdBy,
    // Denormalised fields the list view reads without touching content docs.
    // (createQuestion derives these itself; they are repeated here so callers
    // can preview/inspect the payload before it is written.)
    subjectName: subjectId,
    topicName: topicId,
    subTopicName: subTopicId,
    bloomLevel: bloomLevelFor(questionType, toUniversalDifficulty(row.difficulty)),
    // Seed provenance — not part of the core schema but harmless extra fields
    // that make a seeded row traceable back to the CSV it came from.
    seedSource: 'question-bank-seed',
    seedBatch: row.batch || '',
    seedBranch: row.branch || '',
    seedIsPYQ: row.isPYQ,
    seedExamYear: row.examYear || '',
    seedExamName: row.examName || '',
  } as unknown as Omit<QuestionMetadata, 'id' | 'createdAt' | 'updatedAt'>;

  const content = {
    questionText,
    options,
    correctAnswer,
    explanation: row.explanation || '',
    hint: '',
    subjectId,
    topicId,
    subTopicId,
    difficulty: toUniversalDifficulty(row.difficulty),
    questionType,
    marks,
    language,
    tags,
    images: [],
    hasImage: false,
    // Legacy-shape aliases so the college-side readers (paperApi.getPaperQuestions,
    // questionStorageApi.downloadQuestion fallbacks) also resolve these rows.
    text: questionText,
    type: questionType,
    subject: subjectId,
    topic: topicId,
    unit: topicId,
    subTopic: subTopicId,
    branch: row.branch || '',
    batch: row.batch || '',
    explanationText: row.explanation || '',
  } as unknown as Partial<QuestionContent> & { questionText: string };

  return { fingerprint, meta, content };
}

/** Rough Bloom tagging so the bank's bloom filter is not empty for seeded rows. */
export function bloomLevelFor(
  type: UniversalQuestionType,
  difficulty: DifficultyLevel
): string {
  if (type === 'long_answer' || type === 'case_based') return 'create';
  if (type === 'short_answer') return 'understand';
  if (type === 'assertion_reason' || type === 'matching') return 'analyze';
  if (type === 'numerical') return 'apply';
  return difficulty === 'hard' ? 'analyze' : difficulty === 'medium' ? 'apply' : 'remember';
}

// ───────────────────────────────────────────────────────────────────────
// Dataset resolution
// ───────────────────────────────────────────────────────────────────────

export interface SeedFacetCount {
  name: string;
  count: number;
}

export interface ResolvedSeed {
  file: SeedFile;
  /** Rows that passed validation, after the branch filter. */
  rows: SeedRow[];
  /** Rows rejected by validation (surfaced in the UI, never written). */
  invalid: ValidatedSeedRow[];
  /** Rows dropped by the branch filter. */
  filteredOut: number;
  branches: SeedFacetCount[];
  subjects: SeedFacetCount[];
  types: SeedFacetCount[];
  difficulties: SeedFacetCount[];
  /** Distinct topic (`unit`) values in the resolved set. */
  topicCount: number;
  /** Distinct sub-topic values — 0 only for a CSV that predates the column. */
  subTopicCount: number;
  /** Rows with no sub-topic (legacy-shaped CSV), surfaced in the preview. */
  rowsWithoutSubTopic: number;
  totalMarks: number;
}

export function resolveSeedRows(
  fileKey: SeedFileKey,
  branchFilter: string[] = []
): ResolvedSeed {
  const file = getSeedFile(fileKey);
  const parsed = parseSeedCsv(file.csv);
  const validated = validateSeedRows(parsed);

  const invalid = validated.filter((v) => !v.valid);
  const wanted = new Set((branchFilter || []).map((b) => b.trim().toLowerCase()).filter(Boolean));

  const validRows = validated
    .filter((v) => v.valid)
    .map((v) => v.row)
    .filter((row) => wanted.size === 0 || wanted.has(String(row.branch || '').trim().toLowerCase()));

  const distinct = (keyOf: (row: SeedRow) => string): number =>
    new Set(validRows.map(keyOf).filter(Boolean)).size;

  const countBy = (keyOf: (row: SeedRow) => string): SeedFacetCount[] => {
    const map = new Map<string, number>();
    validRows.forEach((row) => {
      const k = keyOf(row) || '—';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  };

  return {
    file,
    rows: validRows,
    invalid,
    filteredOut: validated.filter((v) => v.valid).length - validRows.length,
    branches: countBy((row) => row.branch),
    subjects: countBy((row) => row.subject),
    types: countBy((row) => toUniversalQuestionType(row.type, row.options.length > 0)),
    difficulties: countBy((row) => toUniversalDifficulty(row.difficulty)),
    topicCount: distinct((row) => `${row.subject}\u0000${row.unit}`),
    subTopicCount: distinct((row) => `${row.subject}\u0000${row.unit}\u0000${row.subtopic}`),
    rowsWithoutSubTopic: validRows.filter((row) => !row.subtopic.trim()).length,
    totalMarks: validRows.reduce((sum, row) => sum + (Number.isFinite(row.marks) ? row.marks : 0), 0),
  };
}
