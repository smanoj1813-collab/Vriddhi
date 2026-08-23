// src/shared/utils/assessmentGrading.ts
// ─────────────────────────────────────────────────────────────────────
// Single source of truth for objective auto-grading, shared by the
// student test engine (submit) and the admin/faculty grading tools.
//
// Subjective question types (short_answer, long_answer, matching,
// case_based) are NOT graded here — they are returned as `pending` and
// must be graded manually by faculty (gradeAssessment flips the
// studentAssessments row to `graded` with final marks).
// ─────────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'mcq'
  | 'multi_select'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_answer'
  | 'long_answer'
  | 'numerical'
  | 'assertion_reason'
  | 'case_based'
  | 'matching';

export const SUBJECTIVE_TYPES: QuestionType[] = [
  'short_answer',
  'long_answer',
  'matching',
  'case_based',
];

export function isSubjectiveType(type: string): boolean {
  return SUBJECTIVE_TYPES.includes(type as QuestionType);
}

export interface GradableOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface GradableQuestion {
  id: string;
  type: string;
  marks: number;
  negativeMarks?: number;
  options?: GradableOption[];
  /** string | string[] | number depending on type */
  correctAnswer?: unknown;
  /** numerical tolerance when provided by the paper */
  tolerance?: number;
}

export interface GradableAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  numericalAnswer?: number;
}

export type QuestionGradeStatus = 'correct' | 'incorrect' | 'unattempted' | 'partial' | 'pending';

export interface QuestionGrade {
  questionId: string;
  status: QuestionGradeStatus;
  marksObtained: number | null; // null = pending manual grading
  maxMarks: number;
  isObjective: boolean;
}

/* ─── normalisation helpers ─── */

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Accepts "A|B|C" pipe-separated alternates or an array — any match counts. */
function acceptableTextAnswers(correctAnswer: unknown): string[] {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.map(normalizeText).filter(Boolean);
  }
  const raw = String(correctAnswer ?? '');
  return raw
    .split('|')
    .map(normalizeText)
    .filter(Boolean);
}

function correctOptionId(q: GradableQuestion): string | null {
  const flagged = (q.options || []).find((o) => o.isCorrect);
  if (flagged?.id) return String(flagged.id);
  const ca = q.correctAnswer;
  if (typeof ca === 'string' && ca) return ca;
  if (Array.isArray(ca) && ca.length && typeof ca[0] === 'string') return ca[0];
  return null;
}

function correctOptionIds(q: GradableQuestion): string[] {
  const flagged = (q.options || []).filter((o) => o.isCorrect).map((o) => String(o.id));
  if (flagged.length) return flagged;
  const ca = q.correctAnswer;
  if (Array.isArray(ca)) return ca.map(String).filter(Boolean);
  if (typeof ca === 'string' && ca.includes(',')) {
    return ca.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return typeof ca === 'string' && ca ? [ca] : [];
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/* ─── attempt detection (mirrors UI answered logic) ─── */

export function isAnswerAttempted(q: GradableQuestion, a?: GradableAnswer): boolean {
  if (!a) return false;
  switch (q.type) {
    case 'multi_select':
      return !!(a.selectedOptionIds && a.selectedOptionIds.length);
    case 'numerical':
      return a.numericalAnswer !== undefined && a.numericalAnswer !== null;
    case 'short_answer':
    case 'long_answer':
    case 'fill_in_blank':
    case 'matching':
    case 'case_based':
      return !!(a.textAnswer && a.textAnswer.trim().length > 0);
    case 'mcq':
    case 'true_false':
    case 'assertion_reason':
    default:
      return !!a.selectedOptionId;
  }
}

/* ─── per-question grading ─── */

export function gradeQuestion(q: GradableQuestion, a?: GradableAnswer): QuestionGrade {
  const maxMarks = Number(q.marks) || 0;
  const base: QuestionGrade = { questionId: q.id, status: 'unattempted', marksObtained: 0, maxMarks, isObjective: true };

  if (isSubjectiveType(q.type)) {
    const attempted = isAnswerAttempted(q, a);
    return {
      questionId: q.id,
      status: attempted ? 'pending' : 'unattempted',
      marksObtained: null,
      maxMarks,
      isObjective: false,
    };
  }

  const attempted = isAnswerAttempted(q, a);
  const negative = typeof q.negativeMarks === 'number' && q.negativeMarks > 0 ? q.negativeMarks : 0;

  if (!attempted) return base;

  let isCorrect = false;
  let isPartial = false;

  switch (q.type) {
    case 'mcq':
    case 'true_false':
    case 'assertion_reason': {
      const correct = correctOptionId(q);
      isCorrect = !!correct && String(a?.selectedOptionId) === correct;
      break;
    }
    case 'multi_select': {
      const correctSet = new Set(correctOptionIds(q));
      const studentSet = new Set((a?.selectedOptionIds || []).map(String));
      if (correctSet.size === 0) {
        // cannot auto-grade without a key
        return { ...base, status: 'pending', marksObtained: null };
      }
      isCorrect =
        correctSet.size === studentSet.size &&
        [...studentSet].every((id) => correctSet.has(id));
      break;
    }
    case 'numerical': {
      const correct = toNumber(q.correctAnswer);
      const given = a?.numericalAnswer !== undefined ? toNumber(a.numericalAnswer) : null;
      const tolerance = typeof q.tolerance === 'number' && q.tolerance >= 0 ? q.tolerance : 0.005;
      isCorrect = correct !== null && given !== null && Math.abs(given - correct) <= tolerance;
      break;
    }
    case 'fill_in_blank': {
      const acceptable = acceptableTextAnswers(q.correctAnswer);
      isCorrect = acceptable.length > 0 && acceptable.includes(normalizeText(a?.textAnswer));
      break;
    }
    default:
      // Unknown objective type without a grading strategy → manual
      return { ...base, status: 'pending', marksObtained: null };
  }

  if (isCorrect) return { ...base, status: 'correct', marksObtained: maxMarks };
  if (isPartial) return { ...base, status: 'partial', marksObtained: Math.round((maxMarks / 2) * 100) / 100 };
  return { ...base, status: 'incorrect', marksObtained: negative ? -negative : 0 };
}

/* ─── whole-paper grading ─── */

export interface GradedSection {
  /** objective marks earned automatically (may be negative with negative marking) */
  autoScore: number;
  /** total objective marks available */
  autoMax: number;
  /** total subjective marks awaiting faculty */
  manualMax: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  pendingCount: number;
  perQuestion: QuestionGrade[];
  /** true when at least one attempted question needs faculty grading */
  needsManualGrading: boolean;
}

export function gradePaper(
  questions: GradableQuestion[],
  answers: GradableAnswer[]
): GradedSection {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  const perQuestion = questions.map((q) => gradeQuestion(q, byId.get(q.id)));

  let autoScore = 0;
  let autoMax = 0;
  let manualMax = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let pendingCount = 0;

  for (const g of perQuestion) {
    if (!g.isObjective) {
      manualMax += g.maxMarks;
      if (g.status === 'pending') pendingCount++;
      else unattemptedCount++;
      continue;
    }
    autoMax += g.maxMarks;
    if (g.status === 'correct') correctCount++;
    else if (g.status === 'incorrect') incorrectCount++;
    else unattemptedCount++;
    autoScore += g.marksObtained ?? 0;
  }

  autoScore = Math.round(autoScore * 100) / 100;

  return {
    autoScore,
    autoMax,
    manualMax,
    correctCount,
    incorrectCount,
    unattemptedCount,
    pendingCount,
    perQuestion,
    needsManualGrading: pendingCount > 0,
  };
}

/** Derive grade letter + point from a percentage (10-point scale). */
export function deriveGradeFromPercentage(percentage: number): { grade: string; gradePoint: number } {
  if (percentage >= 90) return { grade: 'O', gradePoint: 10 };
  if (percentage >= 80) return { grade: 'A', gradePoint: 9 };
  if (percentage >= 70) return { grade: 'B', gradePoint: 8 };
  if (percentage >= 60) return { grade: 'C', gradePoint: 7 };
  if (percentage >= 50) return { grade: 'D', gradePoint: 6 };
  if (percentage >= 40) return { grade: 'E', gradePoint: 5 };
  return { grade: 'F', gradePoint: 0 };
}
