// Learner progress with an offline-first localStorage cache and Firestore sync.
// Guests/public preview remain device-local; authenticated students sync to
// colleges/{collegeId}/courseProgress/{uid}__{courseId}.

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CourseManifest, CourseProgress, CourseQuizQuestion } from './types'
import {
  emptyProgress,
  markComplete,
  mergeCourseProgress,
  recordModuleAssessmentAttempt,
  recordQuizAttempt,
  scoreQuiz,
  touchTopic,
} from './courseModel'
import { loadCourseProgress, saveCourseProgress } from './courseCloud'

const PREFIX = 'vriddhi.course.progress'

export function progressStorageKey(uid: string | undefined, courseId: string): string {
  return `${PREFIX}.${uid || 'guest'}.${courseId}`
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function hasProgressData(progress: CourseProgress): boolean {
  return !!(
    progress.lastTopicId || progress.startedAt || progress.updatedAt || progress.completedAt
    || Object.keys(progress.read || {}).length
    || Object.keys(progress.completed || {}).length
    || Object.keys(progress.quiz || {}).length
    || Object.keys(progress.moduleAssessments || {}).length
  )
}

export function readProgress(key: string): CourseProgress {
  if (typeof localStorage === 'undefined') return emptyProgress()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw)
    if (!isRecord(parsed)) return emptyProgress()
    const completed = isRecord(parsed.completed) ? parsed.completed : {}
    return {
      // Older progress used only `completed`; treat it as read for migration.
      read: isRecord(parsed.read) ? { ...completed, ...parsed.read } : completed,
      completed,
      quiz: isRecord(parsed.quiz) ? parsed.quiz : {},
      moduleAssessments: isRecord(parsed.moduleAssessments) ? parsed.moduleAssessments : {},
      lastTopicId: typeof parsed.lastTopicId === 'string' ? parsed.lastTopicId : undefined,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
      completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : undefined,
    }
  } catch {
    return emptyProgress()
  }
}

export function writeProgress(key: string, progress: CourseProgress): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(progress))
  } catch {
    // Quota / private mode — progress simply does not persist this session.
  }
}

export interface CourseProgressOptions {
  collegeId?: string
  manifest?: CourseManifest
}

export interface UseCourseProgress {
  progress: CourseProgress
  /** True while the first Firestore snapshot/migration is being merged. */
  loading: boolean
  complete: (topicId: string) => void
  visit: (topicId: string) => void
  submitQuiz: (topicId: string, questions: CourseQuizQuestion[], answers: Record<string, number>) => { score: number; total: number }
  submitModuleAssessment: (moduleId: string, questions: CourseQuizQuestion[], answers: Record<string, number>) => { score: number; total: number }
}

export function useCourseProgress(
  uid: string | undefined,
  courseId: string,
  options: CourseProgressOptions = {},
): UseCourseProgress {
  const { collegeId, manifest } = options
  const key = useMemo(() => progressStorageKey(uid, courseId), [uid, courseId])
  const cloudEnabled = !!uid && !!collegeId
  const [snapshot, setSnapshot] = useState<{ key: string; progress: CourseProgress }>(() => ({
    key,
    progress: readProgress(key),
  }))
  const [loading, setLoading] = useState(cloudEnabled)
  const [cloudReady, setCloudReady] = useState(false)
  const progress = snapshot.key === key ? snapshot.progress : readProgress(key)

  // User/course changes start with that pair's local cache, then merge cloud
  // state into it. Existing device progress is uploaded by the sync effect below.
  useEffect(() => {
    let active = true
    const local = readProgress(key)
    setSnapshot({ key, progress: local })
    setLoading(cloudEnabled)
    setCloudReady(false)

    if (!cloudEnabled || !uid || !collegeId) {
      setLoading(false)
      return () => { active = false }
    }

    void loadCourseProgress(collegeId, uid, courseId)
      .then((remote) => {
        if (!active) return
        const latestLocal = readProgress(key)
        const merged = mergeCourseProgress(remote || emptyProgress(), latestLocal)
        writeProgress(key, merged)
        setSnapshot({ key, progress: merged })
        setLoading(false)
        setCloudReady(true)
      })
      .catch((err) => {
        if (!active) return
        console.warn('[courseProgress] Firestore read failed; using local cache:', err)
        setLoading(false)
        setCloudReady(true)
      })

    return () => { active = false }
  }, [key, uid, collegeId, courseId, cloudEnabled, manifest])

  // Local cache is always updated, including when Firestore is unavailable.
  useEffect(() => {
    if (snapshot.key !== key) return
    writeProgress(key, snapshot.progress)
  }, [key, snapshot])

  // Every subsequent progress event is saved transactionally. The cloud merge
  // is union-based, so stale devices cannot erase another device's work.
  useEffect(() => {
    if (!cloudEnabled || !cloudReady || !uid || !collegeId || snapshot.key !== key || !hasProgressData(snapshot.progress)) return
    let active = true
    void saveCourseProgress(collegeId, uid, courseId, manifest, snapshot.progress)
      .then((cloudMerged) => {
        if (!active) return
        setSnapshot((current) => {
          if (current.key !== key) return current
          const union = mergeCourseProgress(current.progress, cloudMerged)
          if (JSON.stringify(union) === JSON.stringify(current.progress)) return current
          return { key, progress: union }
        })
      })
      .catch((err) => {
        // localStorage is the offline cache; retry on the next state change.
        console.warn('[courseProgress] Firestore write failed; progress remains in local cache:', err)
      })
    return () => { active = false }
  }, [cloudEnabled, cloudReady, uid, collegeId, courseId, key, manifest, snapshot])

  const update = useCallback((fn: (current: CourseProgress) => CourseProgress) => {
    setSnapshot((current) => {
      const base = current.key === key ? current.progress : readProgress(key)
      const next = fn(base)
      return next === base ? current : { key, progress: next }
    })
  }, [key])

  const complete = useCallback((topicId: string) => update((p) => markComplete(p, topicId)), [update])
  const visit = useCallback((topicId: string) => update((p) => touchTopic(p, topicId)), [update])
  const submitQuiz = useCallback(
    (topicId: string, questions: CourseQuizQuestion[], answers: Record<string, number>) => {
      const result = scoreQuiz(questions, answers)
      update((p) => recordQuizAttempt(p, topicId, result))
      return result
    },
    [update],
  )
  const submitModuleAssessment = useCallback(
    (moduleId: string, questions: CourseQuizQuestion[], answers: Record<string, number>) => {
      const result = scoreQuiz(questions, answers)
      update((p) => recordModuleAssessmentAttempt(p, moduleId, result))
      return result
    },
    [update],
  )

  return { progress, loading, complete, visit, submitQuiz, submitModuleAssessment }
}
