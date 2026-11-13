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

import type { CourseManifest, CourseQuizBank, CourseQuizQuestion, CourseSlide, CourseSlideBank, CourseTopicRef } from './types'
import { flattenTopics, validateManifest } from './courseModel'
import type { CourseIllustrationBank, CourseTopicIllustrations } from './illustrationTypes'
import { validateIllustrationBank } from './courseIllustrations'

const PACK_ROOT_RE = /content\/courses\/([^/]+)\/(.*)$/

const manifestModules = import.meta.glob('../../../content/courses/*/course.json', {
  eager: true,
  import: 'default',
}) as Record<string, CourseManifest>

const quizModules = import.meta.glob('../../../content/courses/*/modules/*/quiz.json', {
  eager: true,
  import: 'default',
}) as Record<string, CourseQuizBank>

const slideModules = import.meta.glob('../../../content/courses/*/modules/*/slides.json', {
  eager: true,
  import: 'default',
}) as Record<string, CourseSlideBank>

// Only tiny asset URLs enter the catalog; teaching data is fetched on demand.
// Fetching JSON rather than dynamically importing it permits a real retry after
// a network failure (browsers cache failed ES-module imports for the document).
const illustrationUrls = import.meta.glob('../../../content/courses/*/modules/*/illustrations.json', {
  query: '?url',
  eager: true,
  import: 'default',
}) as Record<string, string>

// SSR has no browser origin to fetch from. This branch is eliminated from the
// browser build and lets the renderer consume the same original JSON files.
const illustrationSsrLoaders = import.meta.env.SSR
  ? import.meta.glob('../../../content/courses/*/modules/*/illustrations.json', { import: 'default' }) as Record<string, () => Promise<CourseIllustrationBank>>
  : {}

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
  /** topicId → lesson quiz questions (empty array when a topic has no quiz). */
  quizzes: Record<string, CourseQuizQuestion[]>
  /** moduleId → end-of-module assessment questions. */
  moduleAssessments: Record<string, CourseQuizQuestion[]>
  /** topicId → in-app slide walkthrough (optional per module). */
  slides: Record<string, CourseSlide[]>
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
      moduleAssessments: {},
      slides: {},
      problems,
    }
  }
  for (const [key, bank] of Object.entries(quizModules)) {
    const split = splitPackPath(key)
    if (!split || !out[split.courseId]) continue
    for (const [topicId, questions] of Object.entries(bank.questions || {})) {
      out[split.courseId].quizzes[topicId] = questions
    }
    if (bank.moduleAssessment?.questions?.length) {
      out[split.courseId].moduleAssessments[bank.moduleId] = bank.moduleAssessment.questions
    }
  }
  for (const [key, bank] of Object.entries(slideModules)) {
    const split = splitPackPath(key)
    if (!split || !out[split.courseId]) continue
    const module = out[split.courseId].manifest.modules.find((item) => item.id === bank.moduleId)
    if (!module) continue
    const moduleTopicIds = new Set(module.topics.map((topic) => topic.id))
    for (const [topicId, slides] of Object.entries(bank.topics || {})) {
      if (moduleTopicIds.has(topicId) && Array.isArray(slides)) {
        out[split.courseId].slides[topicId] = slides
      }
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

const illustrationCache = new Map<string, Promise<CourseIllustrationBank>>()

/** Load only the current module's optional visual companion. Failed loads can be retried. */
export async function loadTopicIllustrations(courseId: string, moduleId: string, topicId: string): Promise<CourseTopicIllustrations | null> {
  const course = getCourse(courseId)
  if (!course?.manifest.illustrations) return null
  const module = course.manifest.modules.find((item) => item.id === moduleId)
  if (!module || !module.topics.some((topic) => topic.id === topicId)) throw new Error('Visual topic not found in this module.')
  const cacheKey = `${courseId}/${moduleId}`
  let promise = illustrationCache.get(cacheKey)
  if (!promise) {
    const rel = `modules/${module.slug}/illustrations.json`
    const entry = Object.entries(illustrationUrls).find(([key]) => {
      const split = splitPackPath(key)
      return split?.courseId === courseId && split.rel === rel
    })
    promise = entry ? (async () => {
      let bank: CourseIllustrationBank
      if (import.meta.env.SSR) {
        bank = await illustrationSsrLoaders[entry[0]]()
      } else {
        const response = await fetch(entry[1])
        if (!response.ok) throw new Error(`Visual companion download failed (${response.status}).`)
        bank = await response.json()
      }
      const problems = validateIllustrationBank(bank, module)
      if (problems.length) throw new Error(`Invalid visual companion: ${problems.join('; ')}`)
      return bank
    })() : Promise.reject(new Error('Visual companion is not included in this build.'))
    illustrationCache.set(cacheKey, promise)
    promise.catch(() => illustrationCache.delete(cacheKey))
  }
  const bank = await promise
  if (!bank.topics[topicId]) throw new Error('Visual companion is missing for this topic.')
  return bank.topics[topicId]
}

/** Paths of every bundled lesson for a course — used by the dev-time checks. */
export function bundledLessonPaths(courseId: string): string[] {
  return Object.keys(lessonLoaders)
    .map(splitPackPath)
    .filter((s): s is { courseId: string; rel: string } => !!s && s.courseId === courseId)
    .map((s) => s.rel)
}
