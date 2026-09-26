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
}

export interface CourseQuizBank {
  moduleId: string
  questions: Record<string, CourseQuizQuestion[]>
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
  /** topicId → ISO timestamp when marked complete. */
  completed: Record<string, string>
  /** topicId → best quiz result. */
  quiz: Record<string, CourseQuizResult>
  /** The topic the learner opened most recently. */
  lastTopicId?: string
  updatedAt?: string
}
