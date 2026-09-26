// src/shared/courses/types.ts
//
// Types for the bundled course packs under `content/courses/<id>/`.
//
// A course pack is a `course.json` manifest plus Markdown lessons and per-module
// `quiz.json` banks. The manifest is the single source of truth for structure
// (modules → topics), hours and the assessment scheme; the app never invents
// ordering or weights of its own. See content/courses/README.md for the schema.

export type CourseTopicType = 'lesson' | 'project'

export interface CourseTopicManifest {
  id: string
  /** Display number — "1.1", "PB1", "CAP". */
  number: string
  type: CourseTopicType
  title: string
  minutes: number
  /** Path of the Markdown file, relative to the pack root. */
  lesson: string
  summary?: string
}

export interface CourseModuleManifest {
  id: string
  number: number
  slug: string
  title: string
  summary: string
  weeks?: string
  hours: number
  outcomes: string[]
  topics: CourseTopicManifest[]
  /** Optional end-of-module gate. The bank lives in that module's quiz.json. */
  assessment?: {
    title: string
    passMark: number
    questionCount: number
  }
}

export interface CourseCertificateEligibilityManifest {
  /** Minimum average across the lesson quizzes. */
  minimumQuizAverage: number
  /** Required score for every module assessment (also unlocks the next module). */
  moduleAssessmentPassMark: number
  /** Every topic, including project briefs, must be read to its end. */
  requireAllTopicsRead: boolean
  /** Every lesson quiz must have at least one submitted attempt. */
  requireAllLessonQuizzes: boolean
}

export interface CourseAssessmentComponent {
  id: string
  name: string
  weight: number
  description: string
}

export interface CourseGradeBand {
  band: string
  min: number
}

export interface CourseToolkitGroup {
  category: string
  tools: string[]
  note?: string
}

export interface CourseManifest {
  schemaVersion: number
  id: string
  code: string
  title: string
  shortTitle: string
  tagline: string
  version: string
  lastReviewed?: string
  owner?: string
  audience: string
  level: string
  language?: string
  totalHours: number
  credits?: number
  durationWeeks?: number
  weeklyCommitment?: string
  certificateTitle?: string
  prerequisites: string[]
  outcomes: string[]
  assessment: {
    passMark: number
    conditions?: string[]
    components: CourseAssessmentComponent[]
    grades: CourseGradeBand[]
  }
  /** Quiz-bank size per lesson; defaults to five for existing course packs. */
  lessonQuizQuestionCount?: number
  certificateEligibility?: CourseCertificateEligibilityManifest
  toolkit?: CourseToolkitGroup[]
  modules: CourseModuleManifest[]
  finalAssessment?: { title: string; minutes: number; blueprint?: string }
  documents?: Record<string, string>
}

export interface CourseQuizQuestion {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation?: string
  difficulty?: 'core' | 'advanced'
}

export interface CourseModuleAssessmentBank {
  title: string
  questions: CourseQuizQuestion[]
}

export interface CourseQuizBank {
  moduleId: string
  questions: Record<string, CourseQuizQuestion[]>
  /** Scenario-based, higher-difficulty assessment taken after a module. */
  moduleAssessment?: CourseModuleAssessmentBank
}

/** A topic resolved against its module, with the flat position in the course. */
export interface CourseTopicRef extends CourseTopicManifest {
  moduleId: string
  moduleNumber: number
  moduleTitle: string
  /** 0-based index in the flattened course sequence. */
  index: number
}

/** Fully loaded course: manifest + lesson bodies + quiz banks. */
export interface LoadedCourse {
  manifest: CourseManifest
  /** topicId → Markdown source. */
  lessons: Record<string, string>
  /** topicId → quiz questions (may be empty for project topics). */
  quizzes: Record<string, CourseQuizQuestion[]>
  /** Flattened, ordered topics. */
  sequence: CourseTopicRef[]
}

// ─── Learner progress (stored per user + course) ────────────────────────────

export interface CourseQuizResult {
  score: number
  total: number
  /** ISO timestamp of the attempt. */
  at: string
  /** Attempts so far, including this one. */
  attempts: number
}

export interface CourseProgress {
  /** topicId → ISO timestamp when the learner reached the end of the content. */
  read?: Record<string, string>
  /** topicId → ISO timestamp when marked complete (kept for existing progress). */
  completed: Record<string, string>
  /** topicId → best lesson-quiz result. */
  quiz: Record<string, CourseQuizResult>
  /** moduleId → best end-of-module assessment result. */
  moduleAssessments?: Record<string, CourseQuizResult>
  /** The topic the learner opened most recently. */
  lastTopicId?: string
  startedAt?: string
  updatedAt?: string
  completedAt?: string
}

/** Denormalised tenant-scoped document stored at colleges/{cid}/courseProgress. */
export interface CourseProgressRecord extends CourseProgress {
  uid: string
  collegeId: string
  courseId: string
  courseVersion: string
  percent: number
  completedCount: number
  quizAverage: number | null
}
