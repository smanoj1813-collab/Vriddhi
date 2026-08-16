// src/modules/student/types/assessment.ts
// Complete assessment types for student test-taking

export type TestStatus = 'upcoming' | 'available' | 'ongoing' | 'completed' | 'graded' | 'missed';
export type StudentTestStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'absent';

export interface StudentTestCard {
  id: string;
  assessmentId: string;
  title: string;
  subject: string;
  courseCode?: string;
  courseName?: string;
  totalMarks: number;
  duration: number; // minutes
  startDateTime: string;
  endDateTime: string;
  status: TestStatus;
  studentStatus: StudentTestStatus;
  canStart: boolean;
  instructions: string[];
  totalQuestions: number;
  marksObtained?: number;
  percentage?: number;
  grade?: string;
  timeSpent?: number;
  submittedAt?: string;
  paperId: string;
  collegeId: string;
  branch: string;
  batch: string;
  semester: number;
  division?: string;
  section?: string;
}

export interface PaperQuestion {
  id: string;
  questionId: string;
  order: number;
  marks: number;
  text: string;
  type: 'mcq' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'long_answer' | 'numerical' | 'assertion_reason' | 'case_based' | 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: { id: string; text: string }[];
  hasImage?: boolean;
  imageUrl?: string;
  sectionId?: string;
  sectionName?: string;
  negativeMarks?: number;
  // Compatibility aliases used by pages
  questionText?: string;
  questionType?: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  numericalAnswer?: number;
  isFlagged: boolean;
  timeSpent: number; // seconds
  visitedAt: string;
  answeredAt?: string;
  // Compatibility alias for match-following questions
  matchedPairs?: Array<{ left: string; right: string }>;
}

export interface ActiveTest {
  studentAssessmentId: string;
  assessmentId: string;
  paperId: string;
  title: string;
  subject: string;
  totalMarks: number;
  duration: number;
  startedAt: string;
  endsAt: string;
  questions: PaperQuestion[];
  flaggedQuestions: string[];
  instructions: string[];
  negativeMarking: boolean;
  collegeId: string;
  // Compatibility alias used by instructions page
  totalQuestions?: number;
}

export interface TestResultSummary {
  studentAssessmentId: string;
  assessmentId: string;
  title: string;
  subject: string;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  timeSpent: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  sectionWise: {
    sectionId: string;
    sectionName: string;
    totalMarks: number;
    marksObtained: number;
    questionsCount: number;
    answeredCount: number;
  }[];
  questionResults: {
    questionId: string;
    order: number;
    marks: number;
    marksObtained: number;
    status: 'correct' | 'incorrect' | 'unattempted' | 'partial';
    yourAnswer: string;
    correctAnswer: string;
    explanation?: string;
  }[];
  rank?: number;
  totalStudents?: number;
  facultyFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
  // Dashboard compatibility aliases
  testId?: string;
  score?: number;
  completedAt?: string;
}

export interface TestResultDetail {
  studentAssessmentId: string;
  assessmentId: string;
  title: string;
  subject: string;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  timeSpent: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  sectionScores: {
    sectionName: string;
    total: number;
    correct: number;
    incorrect: number;
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    accuracy: number;
  }[];
  questionResults: {
    questionId: string;
    questionText: string;
    questionType?: string;
    marks: number;
    options?: string[];
    correctAnswer?: string;
    studentAnswer?: string;
    isCorrect: boolean;
    isAttempted: boolean;
    explanation?: string;
  }[];
  leaderboard: {
    studentId: string;
    studentName: string;
    avatar?: string;
    rank: number;
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    isPassed: boolean;
    isCurrentUser?: boolean;
  }[];
  rank?: number;
  totalStudents?: number;
  facultyFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
  passingPercentage: number;
  percentile: number;
  completedAt: string;
  flaggedCount: number;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  subject: string;
  chapter?: string;
  topic?: string;
  marks: number;
  negativeMarks?: number;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  tags: string[];
  bloomLevel?: string;
  status: string;
  collegeId: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  linkedPaperIds: string[];
  isPYQ?: boolean;
}

export interface AssessmentPaper {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;
  examType: string;
  totalMarks: number;
  totalQuestions: number;
  duration: number;
  sections: {
    id: string;
    name: string;
    title: string;
    description?: string;
    marksPerQuestion: number;
    numQuestions: number;
    compulsory: boolean;
    questionType: string;
    difficulty: string;
    questions?: PaperQuestion[];
  }[];
  instructions: string[];
  status: 'draft' | 'published' | 'archived';
  collegeId: string;
  createdBy: string;
  createdByName: string;
  linkedQuestionIds: string[];
  batch: string;
  branch: string;
  semester?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperInput {
  title: string;
  subject: string;
  examType: string;
  totalMarks: number;
  duration: number;
  sections: {
    name: string;
    description?: string;
    marksPerQuestion: number;
    numQuestions: number;
    compulsory: boolean;
    questionType: string;
    difficulty: string;
    difficultyMix?: { easy: number; medium: number; hard: number };
  }[];
  instructions: string[];
  batch: string;
  branch: string;
  semester?: number;
  collegeId: string;
  createdBy: string;
  createdByName: string;
}

export interface ScheduledTest {
  id: string;
  assessmentId?: string;
  paperId: string;
  paperTitle: string;
  subject: string;
  collegeId: string;
  facultyId: string;
  facultyName: string;
  branch: string;
  batch: string;
  semester: number;
  division?: string;
  section?: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  instructions: string[];
  status: 'scheduled' | 'published' | 'active' | 'completed' | 'cancelled';
  totalRegistered: number;
  totalStarted: number;
  totalSubmitted: number;
  negativeMarking: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleTestInput {
  paperId: string;
  paperTitle: string;
  subject: string;
  collegeId: string;
  facultyId: string;
  facultyName: string;
  branch: string;
  batch: string;
  semester: number;
  division?: string;
  section?: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  instructions: string[];
  negativeMarking: boolean;
}

export interface ProctorEvent {
  id: string;
  studentAssessmentId: string;
  eventType: 'tab_switch' | 'window_blur' | 'copy_paste' | 'right_click' | 'fullscreen_exit' | 'multiple_faces' | 'no_face' | 'suspicious_activity' | 'auto_submit';
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface TestAnalytics {
  assessmentId: string;
  totalStudents: number;
  startedCount: number;
  submittedCount: number;
  absentCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
  gradeDistribution: Record<string, number>;
  sectionWiseAverage: Record<string, number>;
  questionWiseStats: {
    questionId: string;
    correctPercentage: number;
    averageTime: number;
  }[];
}