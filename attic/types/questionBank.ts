// ═══════════════════════════════════════════════════════════════════════
// Question Bank Types
// ═══════════════════════════════════════════════════════════════════════

export type QuestionType =
  | 'mcq'
  | 'multiple_select'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_answer'
  | 'long_answer'
  | 'numerical'
  | 'matching'
  | 'assertion_reason';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  collegeId: string;
  subject: string;
  subjectCode?: string;
  unit?: string;
  topic?: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  negativeMarks?: number;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  explanation?: string;
  tags?: string[];
  batch?: string;
  branch?: string;
  examYear?: string;
  examName?: string;
  isPYQ: boolean;
  isUniversal: boolean;
  status: 'draft' | 'approved' | 'rejected' | 'pending_review';
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  linkedPaperIds: string[];
  imageUrl?: string;
  source?: string;
  bloomLevel?: string;
}

export interface QuestionFilters {
  subject?: string;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  status?: string;
  batch?: string;
  branch?: string;
  examYear?: string;
  examName?: string;
  isPYQ?: boolean;
  search?: string;
  tags?: string[];
  createdBy?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
  questions: Question[];
}