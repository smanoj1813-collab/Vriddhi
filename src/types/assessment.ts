export type QuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "fill_in_blanks"
  | "match_the_following";

export interface PaperQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  topic?: string;
  subject?: string;
  imageUrl?: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  marksObtained?: number;
}

export interface TestResultSummary {
  totalQuestions: number;
  attempted: number;
  correct: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  status: "pass" | "fail" | "pending";
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