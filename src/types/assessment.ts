// src/types/assessment.ts — APPEND these to your existing file

export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type QuestionStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface AssessmentQuestion {
  id: string
  subject: string
  topic: string
  type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_in_blank'
  difficulty: QuestionDifficulty
  marks: number
  content: string
  options?: { id: string; text: string; isCorrect?: boolean }[]
  answer?: string
  explanation?: string
  imageUrl?: string
  status: QuestionStatus
  createdBy: string
  createdAt: string
  updatedAt?: string
  tags?: string[]
  bloomLevel?: string
}

export interface PaperSection {
  id: string
  name: string
  instructions?: string
  questions: { questionId: string; order: number; marks: number }[]
  totalMarks: number
}

export interface AssessmentPaper {
  id: string
  title: string
  subject: string
  type: 'quiz' | 'midterm' | 'final' | 'assignment' | 'practice' | 'mock'
  duration: number
  totalMarks: number
  sections: PaperSection[]
  instructions?: string
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt?: string
}

export interface StudentTest {
  id: string
  studentId: string
  paperId: string
  title: string
  subject: string
  scheduledAt: string
  duration: number
  totalMarks: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'missed'
  score?: number
  percentage?: number
  grade?: string
}

export interface StudentTestCard {
  test: StudentTest
  paper: AssessmentPaper
  timeRemaining?: number
  canStart: boolean
}

export interface StudentSubmission {
  id: string
  testId: string
  studentId: string
  answers: {
    questionId: string
    answer: string | string[]
    marksObtained?: number
    timeSpent?: number
  }[]
  submittedAt: string
  totalScore?: number
  percentage?: number
  status: 'submitted' | 'graded' | 'pending'
}

export interface ActiveTest {
  testId: string
  studentId: string
  paperId: string
  questions: {
    questionId: string
    order: number
    content: string
    type: string
    marks: number
    options?: { id: string; text: string }[]
    imageUrl?: string
  }[]
  flaggedQuestions: string[]
  currentQuestionIndex: number
  answers: Record<string, string | string[]>
  startTime: string
  endTime?: string
  timeRemaining: number
  status: 'in_progress' | 'submitted' | 'timed_out'
}

export interface ActiveTestState {
  test: ActiveTest | null
  loading: boolean
  error: string | null
  currentQuestion: number
  flaggedQuestions: string[]
  answers: Record<string, string | string[]>
  timeRemaining: number
}

export interface TestAnalytics {
  testId: string
  totalStudents: number
  submittedCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  questionStats: {
    questionId: string
    correctCount: number
    incorrectCount: number
    averageTime: number
    difficultyIndex: number
  }[]
}

export interface ReviewQueueItem {
  id: string
  type: 'question' | 'paper' | 'submission'
  title: string
  submittedBy: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  data: any
}

export interface TestNotification {
  id: string
  testId: string
  studentId: string
  type: 'reminder' | 'started' | 'ending_soon' | 'submitted' | 'graded'
  message: string
  read: boolean
  createdAt: string
}

export interface CreateQuestionInput {
  subject: string
  topic: string
  type: AssessmentQuestion['type']
  difficulty: QuestionDifficulty
  marks: number
  content: string
  options?: { id: string; text: string; isCorrect?: boolean }[]
  answer?: string
  explanation?: string
  tags?: string[]
  bloomLevel?: string
}

export interface CreatePaperInput {
  title: string
  subject: string
  type: AssessmentPaper['type']
  duration: number
  totalMarks: number
  sections: Omit<PaperSection, 'id'>[]
  instructions?: string
}

export interface ScheduleTestInput {
  paperId: string
  title: string
  subject: string
  batch: string
  scheduledAt: string
  duration: number
  instructions?: string
}

export interface SubmitTestInput {
  testId: string
  studentId: string
  answers: {
    questionId: string
    answer: string | string[]
    timeSpent?: number
  }[]
}

export interface QuestionFilter {
  subject?: string
  topic?: string
  type?: AssessmentQuestion['type']
  difficulty?: QuestionDifficulty
  status?: QuestionStatus
  search?: string
  createdBy?: string
}

export interface TestFilter {
  subject?: string
  type?: AssessmentPaper['type']
  status?: string
  batch?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ScheduledTest {
  id: string
  paperId: string
  title: string
  subject: string
  batch: string
  scheduledAt: string
  duration: number
  status: 'upcoming' | 'ongoing' | 'completed'
  createdBy: string
}