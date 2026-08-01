export type QuestionType =
  | "mcq"
  | "mcq_single"
  | "mcq_multiple"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_in_blank"
  | "fill_in_blanks"
  | "match_following"
  | "match_the_following";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface MatchedPair {
  left: string;
  right: string;
}

export interface PaperQuestion {
  id: string;
  /** Alias for `id` — used by test-taking UI */
  questionId?: string;
  question: string;
  /** Alias for `question` — used by test-taking UI */
  questionText?: string;
  type: QuestionType;
  /** Alias for `type` — used by test-taking UI */
  questionType?: QuestionType;
  options?: string[] | QuestionOption[];
  correctAnswer?: string | string[];
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  topic?: string;
  subject?: string;
  imageUrl?: string;
}

export interface StudentAnswer {
  questionId: string;
  /** Legacy flat answer field */
  answer?: string | string[];
  /** MCQ single / multiple */
  selectedOptionIds?: string[];
  /** Fill-in-blank, short/long answer, true/false */
  textAnswer?: string;
  /** Match-the-following */
  matchedPairs?: MatchedPair[];
  isCorrect?: boolean;
  marksObtained?: number;
}

export interface QuestionScore {
  questionId: string;
  questionText?: string;
  isCorrect: boolean;
  yourAnswer?: string | string[];
  correctAnswer?: string | string[];
  marks: number;
  obtainedMarks?: number;
  timeSpent?: number;
}

export interface SectionScore {
  sectionName: string;
  totalMarks: number;
  obtainedMarks: number;
}

export interface TestResultSummary {
  totalQuestions: number;
  attempted: number;
  correct: number;
  totalMarks: number;
  obtainedMarks: number;
  /** Alias for obtainedMarks */
  marksObtained?: number;
  percentage: number;
  status: "pass" | "fail" | "pending";
  /** Extended fields used by result views */
  title?: string;
  subject?: string;
  passed?: boolean;
  grade?: string;
  gradePoint?: number;
  timeSpent?: number;
  facultyFeedback?: string;
  rank?: number;
  totalParticipants?: number;
  classAverage?: number;
  classHighest?: number;
  averageTimePerQuestion?: number;
  questionScores?: QuestionScore[];
  sectionScores?: SectionScore[];
}

export type TestStatus = "draft" | "scheduled" | "active" | "completed" | "graded";

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  classId: string;
  questions: PaperQuestion[];
  totalMarks: number;
  duration: number; // minutes
  status: TestStatus;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentTest {
  id: string;
  assessmentId: string;
  studentId: string;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  answers: StudentAnswer[];
  result?: TestResultSummary;
  startedAt?: Date;
  submittedAt?: Date;
}

export interface ActiveTest {
  id: string;
  assessment: Assessment;
  timeRemaining: number;
  currentQuestionIndex: number;
  /** Runtime state */
  status?: "in_progress" | "completed" | "not_started";
  flaggedQuestions?: string[];
  paperTitle?: string;
  questions?: PaperQuestion[];
  allowNavigation?: boolean;
  currentQuestion?: PaperQuestion;
  answers?: Record<string, StudentAnswer>;
  isSubmitting?: boolean;
}

export interface ScheduledTest {
  id: string;
  title: string;
  subject: string;
  scheduledAt: Date;
  duration: number;
  status: TestStatus;
}

export interface TestResultView {
  id: string;
  studentTestId: string;
  assessmentTitle: string;
  subject: string;
  summary: TestResultSummary;
  answers: StudentAnswer[];
  gradedAt?: Date;
  gradedBy?: string;
}

// Paper & Test metadata types
export type PaperStatus = 'draft' | 'published' | 'archived';
export type PaperType = 'internal' | 'external' | 'quiz' | 'midterm' | 'final';
export type TestVisibility = 'public' | 'private' | 'college_only';

/** Used by TestInstructionsPage */
export interface StudentTestCard {
  id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questions?: PaperQuestion[];
  instructions?: string[];
  scheduledAt?: Date;
  status?: TestStatus;
}