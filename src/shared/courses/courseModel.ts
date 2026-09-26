// src/shared/courses/courseModel.ts
//
// Pure helpers over a course manifest and a learner's progress. No Vite, no
// React, no storage — so they can be unit-tested with plain Node
// (see courseModel.test.ts) and reused by the validation script.

import type {
  CourseManifest,
  CourseModuleManifest,
  CourseProgress,
  CourseQuizQuestion,
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
  return { completed: {}, quiz: {} }
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
  return {
    ...progress,
    quiz: {
      ...progress.quiz,
      [topicId]: better
        ? { score: result.score, total: result.total, at: now.toISOString(), attempts }
        : { ...prev, attempts },
    },
    updatedAt: now.toISOString(),
  }
}

export function markComplete(progress: CourseProgress, topicId: string, now: Date = new Date()): CourseProgress {
  if (progress.completed[topicId]) return progress
  return {
    ...progress,
    completed: { ...progress.completed, [topicId]: now.toISOString() },
    updatedAt: now.toISOString(),
  }
}

export function markIncomplete(progress: CourseProgress, topicId: string, now: Date = new Date()): CourseProgress {
  if (!progress.completed[topicId]) return progress
  const completed = { ...progress.completed }
  delete completed[topicId]
  return { ...progress, completed, updatedAt: now.toISOString() }
}

export function touchTopic(progress: CourseProgress, topicId: string, now: Date = new Date()): CourseProgress {
  if (progress.lastTopicId === topicId) return progress
  return { ...progress, lastTopicId: topicId, updatedAt: now.toISOString() }
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
  const weights = manifest.assessment?.components?.reduce((n, c) => n + c.weight, 0) ?? 0
  if (weights !== 100) problems.push(`assessment component weights sum to ${weights}, expected 100`)
  const moduleHours = manifest.modules.reduce((n, m) => n + Number(m.hours), 0)
  if (moduleHours > manifest.totalHours) {
    problems.push(`module hours (${moduleHours}) exceed totalHours (${manifest.totalHours})`)
  }
  return problems
}
