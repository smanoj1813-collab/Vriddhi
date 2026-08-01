// types/assessment.ts
// ============================================
// COMPREHENSIVE ASSESSMENT TYPES — Fixed for Vriddhi
// ============================================

import type { Timestamp } from 'firebase/firestore';

// ─── Enums ─────────────────────────────────

export type PaperType = 
  | 'quiz' 
  | 'mid_term' 
  | 'end_term' 
  | 'assignment' 
  | 'practice' 
  | 'mock';

export type QuestionType = 
  | 'mcq_single' 
  | 'mcq_multiple' 
  | 'true_false' 
  | 'fill_in_blank' 
  | 'short_answer' 
  | 'long_answer' 
  | 'match_following' 
  | 'assertion_reason';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type TestVisibility = 'all_students' | 'specific_sections' | 'specific_students';

// Aliases for backward compatibility
export type PaperStatus = QuestionStatus;
export type TestStatus = 'scheduled' | 'published' | 'ongoing' | 'completed' | 'cancelled';

// ─── Review Queue ──────────────────────────

export interface ReviewQueueItem {
  id: string;
  itemId?: string;
  type: 'question' | 'paper' | 'test_schedule';
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedByName: string;
  submittedByRole: string;
  submittedAt: Timestamp | Date | string | { toDate(): Date };
  questionId?: string;
  paperId?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp | Date | string;
}

// ─── Questions ───────────────────────────────

export interface AssessmentQuestion {
  id: string;
  questionText?: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks?: number;
  options?: Array<{ id: string; text: string; isCorrect?: boolean; matchWith?: string }>;
  correctAnswer?: string | string[];
  modelAnswer?: string;
  status: QuestionStatus;
  topic?: string;
  tags?: string[];
  createdBy?: string;
  createdByName?: string;
  createdByRole?: string;
  subjectId?: string;
  collegeId?: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
  usageCount?: number;
  linkedPaperIds?: string[];
  imageUrl?: string;
}

export interface CreateQuestionInput {
  questionText: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks?: number;
  options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
  correctAnswer?: string | string[];
  modelAnswer?: string;
  subjectId?: string;
  topic?: string;
  tags?: string[];
  status?: QuestionStatus;
  chapter?: string;
  unit?: string;
  bloomLevel?: string;
  explanation?: string;
  source?: string;
}

// ─── Papers ──────────────────────────────────

export interface PaperQuestion {
  questionId: string;
  questionText?: string;
  questionType?: QuestionType;
  difficulty?: QuestionDifficulty;
  marks: number;
  negativeMarks?: number;
  options?: Array<{ id: string; text: string; matchWith?: string }>;
  order?: number;
  sectionId?: string;
  imageUrl?: string;
}

export interface PaperSection {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  questions: PaperQuestion[];
  totalMarks: number;
  questionType?: QuestionType;
  numQuestions?: number;
  marksPerQuestion?: number;
}

export interface CreatePaperInput {
  title: string;
  description?: string;
  paperType: PaperType;
  subjectId: string;
  courseId?: string;
  semester?: number;
  sections: PaperSection[];
  durationMinutes: number;
  instructions?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultImmediately?: boolean;
  allowNavigation?: boolean;
  allowMultipleAttempts?: boolean;
  maxAttempts?: number;
  passingMarks?: number;
  hasNegativeMarking?: boolean;
  totalMarks?: number;
  totalQuestions?: number;
  createdBy?: string;
  createdByName?: string;
  status?: string;
}

export interface AssessmentPaper {
  id: string;
  title: string;
  description?: string;
  paperType: PaperType;
  subjectId?: string;
  courseId?: string;
  semester?: number;
  sections?: PaperSection[];
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  instructions?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultImmediately?: boolean;
  allowNavigation?: boolean;
  allowMultipleAttempts?: boolean;
  maxAttempts?: number;
  passingMarks?: number;
  hasNegativeMarking?: boolean;
  status: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

// ─── Scheduled Tests ─────────────────────────

export interface ScheduleTestInput {
  title: string;
  description?: string;
  paperId: string;
  startDateTime: Date | string | Timestamp | { toDate(): Date };
  endDateTime: Date | string | Timestamp | { toDate(): Date };
  durationMinutes: number;
  visibility: TestVisibility;
  targetSections?: Array<{ sectionId: string; sectionName: string }>;
  targetStudents?: string[];
  accessCode?: string;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  enableProctoring?: boolean;
  resultPublishDate?: Date | string | Timestamp | { toDate(): Date } | null;
  requireFaceVerification?: boolean;
  collegeId?: string;
  facultyId?: string;
  subjectId?: string;
  subjectName?: string;
}

export interface ScheduledTest {
  id: string;
  title: string;
  description?: string;
  paperId: string;
  paperType: string;
  subjectId?: string;
  subjectName?: string;
  status: 'scheduled' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  startDateTime: Timestamp | Date | string | { toDate(): Date };
  endDateTime: Timestamp | Date | string | { toDate(): Date };
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  visibility: TestVisibility;
  targetSections?: Array<{ sectionId: string; sectionName: string }>;
  targetStudents?: string[];
  accessCode?: string;
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  enableProctoring?: boolean;
  resultPublishDate?: Timestamp | Date | string | { toDate(): Date } | null;
  requireFaceVerification?: boolean;
  totalRegistered: number;
  totalStarted: number;
  totalSubmitted: number;
  collegeId?: string;
  facultyId?: string;
  createdAt?: Timestamp | Date | string;
}

// ─── Student Test Cards ──────────────────────

export interface StudentTestCard {
  id: string;
  assessmentId?: string;
  title: string;
  subject?: string;
  subjectName?: string;
  paperType?: string;
  type?: string;
  startDateTime?: Timestamp | Date | string | { toDate(): Date };
  endDateTime?: Timestamp | Date | string | { toDate(): Date };
  startTime?: string;
  endTime?: string;
  scheduledDate?: Timestamp | Date | string;
  duration?: number;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  passingMarks?: number;
  status: string;
  hasResult?: boolean;
  score?: number;
  percentage?: number;
  branch?: string;
  accessCode?: string;
}

// ─── Active Test ─────────────────────────────

export interface ActiveTestState {
  testId: string;
  studentId: string;
  status: 'in_progress' | 'submitted' | 'completed';
  currentQuestionIndex: number;
  answers: Record<string, Partial<StudentAnswer>>;
  timeRemaining: number;
  startedAt: string;
  flaggedQuestions: string[];
  questions: PaperQuestion[];
  allowNavigation: boolean;
  submittedAt?: string;
  paperTitle?: string;
  instructions?: string;
  durationMinutes?: number;
  totalMarks?: number;
  enableProctoring?: boolean;
}

export interface StudentAnswer {
  questionId: string;
  answer?: string | string[] | unknown;
  selectedOptionIds?: string[];
  textAnswer?: string;
  matchedPairs?: Array<{ left: string; right: string }>;
  marksObtained?: number;
  maxMarks?: number;
  isCorrect?: boolean;
  feedback?: string;
  questionText?: string;
  timeSpent?: number;
  timeSpentSeconds?: number;
}

// ─── Test Results ────────────────────────────

export interface TestResultSummary {
  assessmentId: string;
  studentAssessmentId: string;
  title: string;
  testTitle: string;
  subject: string;
  totalMarks: number;
  totalScore?: number;
  maxScore?: number;
  marksObtained: number;
  percentage?: number;
  passed?: boolean;
  grade?: string;
  gradePoint?: number;
  timeSpent: number;
  submittedAt: string;
  facultyFeedback?: string;
  rank: number;
  totalParticipants: number;
  sectionRank: number;
  totalInSection: number;
  classAverage?: number;
  classHighest: number;
  averageTimePerQuestion?: number;
  questionScores: Array<{
    questionId: string;
    questionText: string;
    marksObtained: number;
    yourScore?: number;
    maxMarks: number;
    maxScore?: number;
    correctAnswer?: string;
    yourAnswer?: string;
    timeSpent?: number;
    questionType?: string;
    isCorrect?: boolean;
    feedback?: string;
  }>;
  sectionScores: Array<{
    sectionId: string;
    sectionTitle: string;
    score: number;
    maxScore: number;
  }> | unknown[];
}

// ─── Test Notifications ──────────────────────

export interface TestNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  assessmentId?: string;
  studentId?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Legacy Assessment Types ─────────────────

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  type?: string;
  status: string;
  collegeId?: string;
  subjectId?: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  semester?: number;
  totalMarks?: number;
  passingMarks?: number;
  durationMinutes?: number;
  instructions?: string;
  questionIds?: string[];
  sections?: AssessmentSection[];
  totalStudents?: number;
  createdBy?: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
  startDate?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
  scheduledDate?: Timestamp | Date | string;
  startTime?: string;
  endTime?: string;
  shuffleQuestions?: boolean;
  showResultImmediately?: boolean;
  allowNavigation?: boolean;
  mode?: string;
  branch?: string;
  batch?: string;
  division?: string;
  section?: string;
  curriculumId?: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  questionType?: string;
  numQuestions?: number;
  marksPerQuestion?: number;
  difficulty?: string;
  topicFilter?: string | null;
  unitFilter?: string | null;
  questionIds?: string[];
}

export interface StudentAssessment {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName?: string;
  status: string;
  marksObtained?: number;
  totalMarks?: number;
  percentage?: number;
  grade?: string | null;
  gradePoint?: number;
  timeSpent?: number;
  submittedAt?: string;
  startedAt?: string;
  facultyFeedback?: string;
  answers: StudentAnswer[];
  branch?: string;
  sectionId?: string;
  sectionName?: string;
  regNo?: string;
  createdAt?: Timestamp | Date | string;
}

// Alias for backward compatibility
export type StudentSubmission = StudentAssessment;

export interface CreateAssessmentInput {
  title: string;
  description?: string;
  type?: string;
  status?: string;
  collegeId?: string;
  subjectId?: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  semester?: number;
  totalMarks?: number;
  passingMarks?: number;
  durationMinutes?: number;
  instructions?: string;
  questionIds?: string[];
  sections?: AssessmentSection[];
  shuffleQuestions?: boolean;
  showResultImmediately?: boolean;
  allowNavigation?: boolean;
  startDate?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
  scheduledDate?: Timestamp | Date | string;
  startTime?: string;
  endTime?: string;
  mode?: string;
  branch?: string;
  batch?: string;
  division?: string;
  section?: string;
  curriculumId?: string;
}

export interface UpdateAssessmentInput extends Partial<CreateAssessmentInput> {}

export interface AssessmentFilterOptions {
  collegeId?: string;
  subjectId?: string;
  courseId?: string;
  status?: string;
  type?: string;
  facultyId?: string;
  searchQuery?: string;
  search?: string;
  startDate?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
  scheduledDateFrom?: Timestamp | Date | string;
  scheduledDateTo?: Timestamp | Date | string;
  curriculumId?: string;
  branch?: string;
  semester?: number;
  batch?: string;
  division?: string;
  section?: string;
  mode?: string;
}

// Aliases for backward compatibility
export type QuestionFilter = AssessmentFilterOptions;
export type TestFilter = AssessmentFilterOptions;

export interface AssessmentStats {
  totalAssessments: number;
  activeAssessments: number;
  completedAssessments: number;
  averageScore?: number;
  passRate?: number;
  totalStudents?: number;
  totalSubmissions?: number;
  // Extended stats used by assessmentsApi
  draftCount?: number;
  publishedCount?: number;
  activeCount?: number;
  completedCount?: number;
  archivedCount?: number;
  upcomingCount?: number;
  ongoingCount?: number;
  totalGraded?: number;
  byType?: Record<string, number>;
  byStatus?: Record<string, number>;
  byBranch?: Record<string, number>;
  bySemester?: Record<string, number>;
  byBatch?: Record<string, number>;
}

export interface AIGenerationConfig {
  subject: string;
  topics: string[];
  modules: string[];
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  // ═══ NEW: Curriculum Context ═══
  curriculumId?: string;
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  moduleId?: string;
  moduleName?: string;
  moduleNo?: number;
  unit?: string;
  chapter?: string;
  learningOutcomes?: string[];
  bloomLevel?: string;
  branch?: string;
  batch?: string;
  semester?: number;
  language?: string;
  provider?: 'gemini' | 'openai' | 'deepseek';
  marks?: number;
}

export interface BulkGradeInput {
  studentAssessmentId: string;
  marksObtained: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  feedback?: string;
}

export interface TestAnalytics {
  assessmentId: string;
  title: string;
  totalStudents: number;
  submittedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
  gradeDistribution: Record<string, number>;
  questionStats: Array<{
    questionId: string;
    questionText: string;
    correctCount: number;
    wrongCount: number;
    skipCount: number;
  }>;
}

export interface SubmitTestInput {
  answers: StudentAnswer[];
  timeSpent: number;
}

export type AssessmentType = PaperType;