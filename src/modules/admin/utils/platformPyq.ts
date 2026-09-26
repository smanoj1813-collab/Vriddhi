import type { Question, QuestionType, DifficultyLevel } from '../types/questionBank';

/**
 * platformPyq — pure helpers that map platform-pool question metadata
 * (`questionBank_meta` / `questionBank_content`, written by the paper import
 * pipeline and the seeder) into the college-side `Question` shape so the
 * "PYQ Questions" tabs can list them alongside the college's own rows.
 *
 * Platform rows are read-only in college banks: `isPlatform: true` makes the
 * tables hide Edit/Delete/Link actions (they would target the wrong store).
 */

export interface PlatformPyqMeta {
  id: string;
  status?: string;
  subjectId?: string;
  topicId?: string;
  subTopicId?: string;
  difficulty?: string;
  questionType?: string;
  marks?: number;
  tags?: string[];
  previewText?: string;
  isPYQ?: boolean;
  examYear?: string | number;
  examName?: string;
  subjectName?: string;
  topicName?: string;
  branch?: string;
  createdBy?: { userName?: string; userId?: string; collegeId?: string | null };
  createdAt?: string;
  updatedAt?: string;
}

const QUESTION_TYPE_ALIASES: Record<string, QuestionType> = {
  mcq: 'mcq',
  true_false: 'true_false',
  fill_in_blank: 'fill_in_blank',
  fill_blank: 'fill_in_blank',
  short_answer: 'short_answer',
  long_answer: 'long_answer',
  short: 'short',
  long: 'long',
  numerical: 'numerical',
  matching: 'matching',
  match: 'matching',
  assertion_reason: 'assertion_reason',
  assertion: 'assertion_reason',
  case_based: 'case_based',
};

export function platformPyqExamYear(meta: Pick<PlatformPyqMeta, 'examYear' | 'tags'>): string {
  const direct = String(meta.examYear ?? '').trim();
  if (direct) return direct;
  const tag = (meta.tags ?? []).find((t) => /^exam-\d{4}$/.test(t));
  return tag ? tag.slice('exam-'.length) : '';
}

export function platformPyqExamName(meta: Pick<PlatformPyqMeta, 'examName' | 'tags'>): string {
  const direct = String(meta.examName ?? '').trim();
  if (direct) return direct;
  const monthTag = (meta.tags ?? []).find((t) => t.startsWith('exam-month-'));
  if (monthTag) {
    const month = monthTag
      .slice('exam-month-'.length)
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return `${month} Examination`;
  }
  return 'Previous Year Examination';
}

export function isPlatformPyqMeta(meta: PlatformPyqMeta, status = 'approved'): boolean {
  if (meta.status !== status) return false;
  return meta.isPYQ === true || (meta.tags ?? []).includes('pyq');
}

export function mapPlatformMetaToQuestion(meta: PlatformPyqMeta, questionText?: string): Question {
  const type = QUESTION_TYPE_ALIASES[String(meta.questionType ?? '').toLowerCase()] ?? 'mcq';
  const difficulty = (['easy', 'medium', 'hard'].includes(meta.difficulty ?? '')
    ? meta.difficulty
    : 'medium') as DifficultyLevel;
  return {
    id: meta.id,
    text: (questionText ?? meta.previewText ?? '').trim(),
    type,
    difficulty,
    subject: meta.subjectName || meta.subjectId || 'General',
    topic: meta.topicName || meta.topicId,
    subTopic: meta.subTopicId,
    marks: Number(meta.marks) > 0 ? Number(meta.marks) : 1,
    tags: meta.tags ?? [],
    branch: meta.branch,
    // The college-side status vocabulary is active/inactive/draft.
    status: 'active',
    isPYQ: true,
    examYear: platformPyqExamYear(meta),
    examName: platformPyqExamName(meta),
    // Marker for the tables: read-only, platform-pool provenance.
    isPlatform: true,
    createdBy: 'platform',
    createdByName: meta.createdBy?.userName || 'Vriddhi Platform',
    // Platform content is college-agnostic (createdBy.collegeId === null).
    collegeId: '',
    createdAt: meta.createdAt ?? '',
    updatedAt: meta.updatedAt,
  };
}
