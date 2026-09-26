// src/shared/courses/courseCatalog.ts
//
// Bundles the course packs under `content/courses/<id>/` into the app.
//
//   • course.json manifests and per-module quiz.json banks are imported eagerly
//     (they are small and the catalog page needs them all).
//   • Lesson Markdown is imported lazily with Vite's `?raw` query, one file per
//     chunk, so opening a lesson downloads only that lesson.
//
// Nothing here talks to Firestore: the packs are static content shipped with
// the build (same approach as the curated question-bank seed CSVs). Learner
// progress lives in courseProgress.ts.

import type { CourseManifest, CourseQuizBank, CourseQuizQuestion, CourseTopicRef } from './types'
import { flattenTopics, validateManifest } from './courseModel'

const PACK_ROOT_RE = /content\/courses\/([^/]+)\/(.*)$/

const manifestModules = import.meta.glob('../../../content/courses/*/course.json', {
  eager: true,
  import: 'default',
}) as Record<string, CourseManifest>

const quizModules = import.meta.glob('../../../content/courses/*/modules/*/quiz.json', {
  eager: true,
  import: 'default',
}) as Record<string, CourseQuizBank>

const lessonLoaders = import.meta.glob('../../../content/courses/*/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

/** `../../../content/courses/<id>/<rel>` → { courseId, rel } */
function splitPackPath(key: string): { courseId: string; rel: string } | null {
  const m = key.match(PACK_ROOT_RE)
  if (!m) return null
  return { courseId: m[1], rel: m[2] }
}

export interface CourseCatalogEntry {
  manifest: CourseManifest
  sequence: CourseTopicRef[]
  /** topicId → quiz questions (empty array when a topic has no quiz). */
  quizzes: Record<string, CourseQuizQuestion[]>
  /** Structural problems found in the manifest — surfaced in dev, never thrown. */
  problems: string[]
}

let catalogCache: Record<string, CourseCatalogEntry> | null = null

function buildCatalog(): Record<string, CourseCatalogEntry> {
  const out: Record<string, CourseCatalogEntry> = {}
  for (const [key, manifest] of Object.entries(manifestModules)) {
    const split = splitPackPath(key)
    if (!split) continue
    const problems = validateManifest(manifest)
    if (problems.length && import.meta.env.DEV) {
      console.warn(`[courseCatalog] "${split.courseId}" manifest problems:\n - ${problems.join('\n - ')}`)
    }
    out[split.courseId] = {
      manifest,
      sequence: flattenTopics(manifest),
      quizzes: {},
      problems,
    }
  }
  for (const [key, bank] of Object.entries(quizModules)) {
    const split = splitPackPath(key)
    if (!split || !out[split.courseId]) continue
    for (const [topicId, questions] of Object.entries(bank.questions || {})) {
      out[split.courseId].quizzes[topicId] = questions
    }
  }
  return out
}

/** Every bundled course, in manifest order (by code then title). */
export function listCourses(): CourseCatalogEntry[] {
  if (!catalogCache) catalogCache = buildCatalog()
  return Object.values(catalogCache).sort((a, b) =>
    `${a.manifest.code} ${a.manifest.title}`.localeCompare(`${b.manifest.code} ${b.manifest.title}`),
  )
}

export function getCourse(courseId: string): CourseCatalogEntry | undefined {
  if (!catalogCache) catalogCache = buildCatalog()
  return catalogCache[courseId]
}

const lessonCache = new Map<string, Promise<string>>()

/** Load a lesson body (Markdown) for a topic. Cached per session. */
export function loadLesson(courseId: string, lessonPath: string): Promise<string> {
  const cacheKey = `${courseId}/${lessonPath}`
  const hit = lessonCache.get(cacheKey)
  if (hit) return hit
  const entry = Object.entries(lessonLoaders).find(([key]) => {
    const split = splitPackPath(key)
    return split?.courseId === courseId && split.rel === lessonPath
  })
  const promise = entry
    ? entry[1]()
    : Promise.reject(new Error(`Lesson not found in bundle: ${cacheKey}`))
  lessonCache.set(cacheKey, promise)
  promise.catch(() => lessonCache.delete(cacheKey))
  return promise
}

/** Paths of every bundled lesson for a course — used by the dev-time checks. */
export function bundledLessonPaths(courseId: string): string[] {
  return Object.keys(lessonLoaders)
    .map(splitPackPath)
    .filter((s): s is { courseId: string; rel: string } => !!s && s.courseId === courseId)
    .map((s) => s.rel)
}
