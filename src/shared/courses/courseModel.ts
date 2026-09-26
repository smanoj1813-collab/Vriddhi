// src/shared/courses/courseModel.ts
//
// Pure helpers over a course manifest and a learner's progress. No Vite, no
// React, no storage — so they can be unit-tested with plain Node
// (see courseModel.test.ts) and reused by the validation script.

import type {
  CourseManifest,
  CourseModuleManifest,
  CourseProgress,
  CourseQuizResult,
  CourseQuizQuestion,
  CourseTopicManifest,
  CourseTopicRef,
} from './types'

/** Flatten modules → topics into one ordered list with module context. */
export function flattenTopics(manifest: CourseManifest): CourseTopicRef[] {
  const out: CourseTopicRef[] = []
  for (const mod of manifest.modules) {
    for (const topic of mod.topics) {
      out.push({
        ...topic,
        moduleId: mod.id,
        moduleNumber: mod.number,
        moduleTitle: mod.title,
        index: out.length,
      })
    }
  }
  return out
}

export function findTopic(sequence: CourseTopicRef[], topicId: string): CourseTopicRef | undefined {
  return sequence.find((t) => t.id === topicId)
}

export function neighbours(sequence: CourseTopicRef[], topicId: string): { prev?: CourseTopicRef; next?: CourseTopicRef } {
  const idx = sequence.findIndex((t) => t.id === topicId)
  if (idx < 0) return {}
  return {
    prev: idx > 0 ? sequence[idx - 1] : undefined,
    next: idx < sequence.length - 1 ? sequence[idx + 1] : undefined,
  }
}

export function emptyProgress(): CourseProgress {
  return { read: {}, completed: {}, quiz: {}, moduleAssessments: {} }
}

/** A lesson is read when its end marker has been reached (legacy completion counts too). */
export function hasReadTopic(progress: CourseProgress, topicId: string): boolean {
  return !!(progress.read?.[topicId] || progress.completed[topicId])
}

/** A topic's content and, for lessons, its quiz attempt are complete for progression. */
export function hasFinishedTopic(topic: CourseTopicRef | CourseTopicManifest, progress: CourseProgress): boolean {
  return hasReadTopic(progress, topic.id) && (topic.type !== 'lesson' || !!progress.quiz[topic.id])
}

/** Modules are sequential: the previous module's assessment must meet its pass mark. */
export function isModuleUnlocked(manifest: CourseManifest, progress: CourseProgress, moduleIndex: number): boolean {
  if (moduleIndex <= 0) return moduleIndex === 0
  const previous = manifest.modules[moduleIndex - 1]
  if (!previous) return false
  const result = progress.moduleAssessments?.[previous.id]
  const passMark = previous.assessment?.passMark ?? 60
  return !!result && result.total > 0 && (result.score / result.total) * 100 >= passMark
}

/** Topics unlock in order after the prior topic is read and its quiz is submitted. */
export function isTopicUnlocked(manifest: CourseManifest, progress: CourseProgress, topicId: string): boolean {
  const moduleIndex = manifest.modules.findIndex((mod) => mod.topics.some((topic) => topic.id === topicId))
  if (moduleIndex < 0 || !isModuleUnlocked(manifest, progress, moduleIndex)) return false
  const mod = manifest.modules[moduleIndex]
  const topicIndex = mod.topics.findIndex((topic) => topic.id === topicId)
  if (topicIndex < 0) return false
  return mod.topics.slice(0, topicIndex).every((topic) => hasFinishedTopic(topic, progress))
}

/** The end-of-module assessment becomes available after all content and lesson quizzes. */
export function canTakeModuleAssessment(mod: CourseModuleManifest, progress: CourseProgress): boolean {
  return mod.topics.every((topic) => hasFinishedTopic(topic, progress))
}

export function moduleAssessmentPercent(progress: CourseProgress, moduleId: string): number | null {
  const result = progress.moduleAssessments?.[moduleId]
  return result && result.total > 0 ? Math.round((result.score / result.total) * 100) : null
}

export interface CourseCertificateCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

export function certificateEligibility(manifest: CourseManifest, progress: CourseProgress): {
  eligible: boolean
  checks: CourseCertificateCheck[]
} {
  const policy = manifest.certificateEligibility
  const topics = manifest.modules.flatMap((mod) => mod.topics)
  const lessonTopics = topics.filter((topic) => topic.type === 'lesson')
  const readCount = topics.filter((topic) => hasReadTopic(progress, topic.id)).length
  const quizzesDone = lessonTopics.filter((topic) => !!progress.quiz[topic.id]).length
  const avg = quizAverage(progress)
  const minQuizAverage = policy?.minimumQuizAverage ?? manifest.assessment.passMark
  const requiredModuleMark = policy?.moduleAssessmentPassMark ?? 60
  const requiredModules = manifest.modules.filter((mod) => !!mod.assessment)
  const passedModules = requiredModules.filter((mod) => {
    const result = progress.moduleAssessments?.[mod.id]
    const passMark = mod.assessment?.passMark ?? requiredModuleMark
    return !!result && result.total > 0 && (result.score / result.total) * 100 >= passMark
  })

  const checks: CourseCertificateCheck[] = []
  if (policy?.requireAllTopicsRead !== false) {
    checks.push({
      id: 'content',
      label: 'Read every lesson and project brief',
      passed: readCount === topics.length,
      detail: `${readCount} of ${topics.length} topics read`,
    })
  }
  if (policy?.requireAllLessonQuizzes !== false) {
    checks.push({
      id: 'lesson-quizzes',
      label: 'Submit every lesson quiz',
      passed: quizzesDone === lessonTopics.length,
      detail: `${quizzesDone} of ${lessonTopics.length} quizzes attempted`,
    })
  }
  checks.push({
    id: 'quiz-average',
    label: `Lesson quiz average at least ${minQuizAverage}%`,
    passed: avg !== null && avg >= minQuizAverage,
    detail: avg === null ? 'No quiz attempts yet' : `Current average ${avg}%`,
  })
  if (requiredModules.length > 0) {
    checks.push({
      id: 'module-assessments',
      label: `Pass every module assessment (minimum ${requiredModuleMark}%)`,
      passed: passedModules.length === requiredModules.length,
      detail: `${passedModules.length} of ${requiredModules.length} modules passed`,
    })
  }
  return { eligible: checks.every((check) => check.passed), checks }
}

/** Whole-number percentage of topics marked complete (0–100). */
export function coursePercent(manifest: CourseManifest, progress: CourseProgress): number {
  const total = manifest.modules.reduce((n, m) => n + m.topics.length, 0)
  if (total === 0) return 0
  const done = manifest.modules.reduce(
    (n, m) => n + m.topics.filter((t) => !!progress.completed[t.id]).length,
    0,
  )
  return Math.round((done / total) * 100)
}

export function modulePercent(mod: CourseModuleManifest, progress: CourseProgress): number {
  if (mod.topics.length === 0) return 0
  const done = mod.topics.filter((t) => !!progress.completed[t.id]).length
  return Math.round((done / mod.topics.length) * 100)
}

export function moduleCounts(mod: CourseModuleManifest, progress: CourseProgress): { done: number; total: number } {
  return {
    done: mod.topics.filter((t) => !!progress.completed[t.id]).length,
    total: mod.topics.length,
  }
}

/**
 * The topic a learner should open next: the last one they visited if it is
 * not yet complete, otherwise the first incomplete topic in sequence, otherwise
 * the first topic (course finished — let them re-read from the start).
 */
export function resumeTopic(sequence: CourseTopicRef[], progress: CourseProgress): CourseTopicRef | undefined {
  if (sequence.length === 0) return undefined
  if (progress.lastTopicId && !progress.completed[progress.lastTopicId]) {
    const last = findTopic(sequence, progress.lastTopicId)
    if (last) return last
  }
  return sequence.find((t) => !progress.completed[t.id]) || sequence[0]
}

/** Minutes of content already completed vs. total, for the "time" chip. */
export function minutesSummary(manifest: CourseManifest, progress: CourseProgress): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const mod of manifest.modules) {
    for (const topic of mod.topics) {
      total += topic.minutes
      if (progress.completed[topic.id]) done += topic.minutes
    }
  }
  return { done, total }
}

/** Average best-quiz percentage across topics that have a quiz result. */
export function quizAverage(progress: CourseProgress): number | null {
  const results = Object.values(progress.quiz).filter((r) => r.total > 0)
  if (results.length === 0) return null
  const pct = results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / results.length
  return Math.round(pct)
}

function mergeTimestampMaps(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const merged = { ...a }
  for (const [id, stamp] of Object.entries(b)) {
    if (!merged[id] || (stamp && stamp < merged[id])) merged[id] = stamp
  }
  return merged
}

function mergeBestResults(
  left: Record<string, CourseQuizResult>,
  right: Record<string, CourseQuizResult>,
): Record<string, CourseQuizResult> {
  const out: Record<string, CourseQuizResult> = { ...left }
  for (const [id, candidate] of Object.entries(right)) {
    const current = out[id]
    if (!current) {
      out[id] = candidate
      continue
    }
    const currentRatio = current.total > 0 ? current.score / current.total : 0
    const candidateRatio = candidate.total > 0 ? candidate.score / candidate.total : 0
    const best = candidateRatio > currentRatio || (candidateRatio === currentRatio && candidate.at > current.at)
      ? candidate
      : current
    out[id] = { ...best, attempts: Math.max(current.attempts || 0, candidate.attempts || 0) }
  }
  return out
}

/** Merge device cache and cloud progress without losing completed work or best scores. */
export function mergeCourseProgress(a: CourseProgress, b: CourseProgress): CourseProgress {
  const aRead = { ...(a.read || {}), ...a.completed }
  const bRead = { ...(b.read || {}), ...b.completed }
  const updated = [a.updatedAt, b.updatedAt].filter((stamp): stamp is string => !!stamp).sort()
  const completed = [a.completedAt, b.completedAt].filter((stamp): stamp is string => !!stamp).sort()
  const updatedAt = updated[updated.length - 1]
  const mostRecent = (b.updatedAt || '') >= (a.updatedAt || '') ? b : a
  return {
    read: mergeTimestampMaps(aRead, bRead),
    completed: mergeTimestampMaps(a.completed || {}, b.completed || {}),
    quiz: mergeBestResults(a.quiz || {}, b.quiz || {}),
    moduleAssessments: mergeBestResults(a.moduleAssessments || {}, b.moduleAssessments || {}),
    lastTopicId: mostRecent.lastTopicId || a.lastTopicId || b.lastTopicId,
    startedAt: [a.startedAt, b.startedAt].filter(Boolean).sort()[0],
    updatedAt,
    completedAt: completed[completed.length - 1],
  }
}

/** Score a set of answers (questionId → chosen option index). */
export function scoreQuiz(questions: CourseQuizQuestion[], answers: Record<string, number>): { score: number; total: number } {
  let score = 0
  for (const q of questions) {
    if (answers[q.id] === q.answerIndex) score += 1
  }
  return { score, total: questions.length }
}

/** Record a quiz attempt, keeping the best score and counting attempts. */
export function recordQuizAttempt(
  progress: CourseProgress,
  topicId: string,
  result: { score: number; total: number },
  now: Date = new Date(),
): CourseProgress {
  const prev = progress.quiz[topicId]
  const attempts = (prev?.attempts || 0) + 1
  const better = !prev || result.total === 0 || result.score / result.total >= prev.score / prev.total
  const timestamp = now.toISOString()
  return {
    ...progress,
    startedAt: progress.startedAt || timestamp,
    quiz: {
      ...progress.quiz,
      [topicId]: better
        ? { score: result.score, total: result.total, at: timestamp, attempts }
        : { ...prev, attempts },
    },
    updatedAt: timestamp,
  }
}

export function recordModuleAssessmentAttempt(
  progress: CourseProgress,
  moduleId: string,
  result: { score: number; total: number },
  now: Date = new Date(),
): CourseProgress {
  const previous = progress.moduleAssessments?.[moduleId]
  const attempts = (previous?.attempts || 0) + 1
  const better = !previous || result.total === 0 || result.score / result.total >= previous.score / previous.total
  const timestamp = now.toISOString()
  return {
    ...progress,
    startedAt: progress.startedAt || timestamp,
    moduleAssessments: {
      ...(progress.moduleAssessments || {}),
      [moduleId]: better
        ? { score: result.score, total: result.total, at: timestamp, attempts }
        : { ...previous, attempts },
    },
    updatedAt: timestamp,
  }
}

export function markComplete(progress: CourseProgress, topicId: string, now: Date = new Date()): CourseProgress {
  const timestamp = progress.completed[topicId] || now.toISOString()
  const alreadyRead = !!progress.read?.[topicId]
  if (progress.completed[topicId] && alreadyRead) return progress
  return {
    ...progress,
    read: { ...(progress.read || {}), [topicId]: progress.read?.[topicId] || timestamp },
    completed: { ...progress.completed, [topicId]: timestamp },
    startedAt: progress.startedAt || timestamp,
    updatedAt: now.toISOString(),
  }
}

export function markIncomplete(progress: CourseProgress, topicId: string, now: Date = new Date()): CourseProgress {
  if (!progress.completed[topicId] && !progress.read?.[topicId]) return progress
  const completed = { ...progress.completed }
  const read = { ...(progress.read || {}) }
  delete completed[topicId]
  delete read[topicId]
  return { ...progress, completed, read, updatedAt: now.toISOString(), completedAt: undefined }
}

export function touchTopic(progress: CourseProgress, topicId: string, now: Date = new Date()): CourseProgress {
  if (progress.lastTopicId === topicId && progress.startedAt) return progress
  const timestamp = now.toISOString()
  return { ...progress, lastTopicId: topicId, startedAt: progress.startedAt || timestamp, updatedAt: timestamp }
}

/** Grade band for an overall percentage, per the manifest's bands (highest min first). */
export function gradeBand(manifest: CourseManifest, percent: number): string {
  const bands = [...manifest.assessment.grades].sort((a, b) => b.min - a.min)
  return bands.find((b) => percent >= b.min)?.band || bands[bands.length - 1]?.band || '—'
}

/** "1h 30m" / "45m" formatting for minutes. */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (h === 0) return `${rest}m`
  if (rest === 0) return `${h}h`
  return `${h}h ${rest}m`
}

/**
 * Structural checks a manifest must pass. Returns a list of problems (empty =
 * valid). Used by scripts/validate-course-pack.mjs and the unit tests.
 */
export function validateManifest(manifest: CourseManifest): string[] {
  const problems: string[] = []
  if (!manifest.id) problems.push('manifest.id is required')
  if (!manifest.title) problems.push('manifest.title is required')
  if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
    problems.push('manifest.modules must be a non-empty array')
    return problems
  }
  const ids = new Set<string>()
  const moduleNumbers = new Set<number>()
  manifest.modules.forEach((mod, mi) => {
    if (!mod.id) problems.push(`modules[${mi}] missing id`)
    if (ids.has(mod.id)) problems.push(`duplicate id "${mod.id}"`)
    ids.add(mod.id)
    if (moduleNumbers.has(mod.number)) problems.push(`duplicate module number ${mod.number}`)
    moduleNumbers.add(mod.number)
    if (mod.assessment) {
      if (!(Number(mod.assessment.passMark) > 0 && Number(mod.assessment.passMark) <= 100)) {
        problems.push(`module "${mod.id}" assessment.passMark must be between 1 and 100`)
      }
      if (!(Number.isInteger(mod.assessment.questionCount) && mod.assessment.questionCount > 0)) {
        problems.push(`module "${mod.id}" assessment.questionCount must be a positive integer`)
      }
      if (!mod.assessment.title) problems.push(`module "${mod.id}" assessment.title is required`)
    }
    if (!Array.isArray(mod.topics) || mod.topics.length === 0) {
      problems.push(`module "${mod.id}" has no topics`)
      return
    }
    const topicMinutes = mod.topics.reduce((n, t) => n + (Number(t.minutes) || 0), 0)
    const declared = Math.round(Number(mod.hours) * 60)
    if (Math.abs(topicMinutes - declared) > 30) {
      problems.push(`module "${mod.id}" declares ${mod.hours}h but topics sum to ${topicMinutes} min`)
    }
    mod.topics.forEach((t, ti) => {
      if (!t.id) problems.push(`module "${mod.id}" topics[${ti}] missing id`)
      if (ids.has(t.id)) problems.push(`duplicate id "${t.id}"`)
      ids.add(t.id)
      if (!t.lesson || !t.lesson.endsWith('.md')) problems.push(`topic "${t.id}" needs a .md lesson path`)
      if (!t.title) problems.push(`topic "${t.id}" missing title`)
      if (!(t.type === 'lesson' || t.type === 'project')) problems.push(`topic "${t.id}" has unknown type "${t.type}"`)
      if (!(Number(t.minutes) > 0)) problems.push(`topic "${t.id}" needs minutes > 0`)
    })
  })
  if (manifest.lessonQuizQuestionCount !== undefined
    && !(Number.isInteger(manifest.lessonQuizQuestionCount) && manifest.lessonQuizQuestionCount > 0)) {
    problems.push('lessonQuizQuestionCount must be a positive integer')
  }
  if (manifest.certificateEligibility) {
    const { minimumQuizAverage, moduleAssessmentPassMark } = manifest.certificateEligibility
    if (!(minimumQuizAverage >= 0 && minimumQuizAverage <= 100)) {
      problems.push('certificateEligibility.minimumQuizAverage must be between 0 and 100')
    }
    if (!(moduleAssessmentPassMark >= 0 && moduleAssessmentPassMark <= 100)) {
      problems.push('certificateEligibility.moduleAssessmentPassMark must be between 0 and 100')
    }
  }
  const weights = manifest.assessment?.components?.reduce((n, c) => n + c.weight, 0) ?? 0
  if (weights !== 100) problems.push(`assessment component weights sum to ${weights}, expected 100`)
  const moduleHours = manifest.modules.reduce((n, m) => n + Number(m.hours), 0)
  if (moduleHours > manifest.totalHours) {
    problems.push(`module hours (${moduleHours}) exceed totalHours (${manifest.totalHours})`)
  }
  return problems
}
