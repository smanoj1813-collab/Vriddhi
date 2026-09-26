// src/shared/courses/courseProgress.ts
//
// Learner progress for bundled courses.
//
// v1 keeps progress on the device (localStorage, keyed by uid + courseId) so
// the course works offline and without any new Firestore collection or rule.
// The storage functions are isolated here so a later sync to Firestore
// (e.g. `courseProgress/{uid}_{courseId}`) is a one-file change: keep the
// same CourseProgress shape and swap read/write.

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CourseProgress, CourseQuizQuestion } from './types'
import {
  emptyProgress,
  markComplete,
  markIncomplete,
  recordQuizAttempt,
  scoreQuiz,
  touchTopic,
} from './courseModel'

const PREFIX = 'vriddhi.course.progress'

export function progressStorageKey(uid: string | undefined, courseId: string): string {
  return `${PREFIX}.${uid || 'guest'}.${courseId}`
}

export function readProgress(key: string): CourseProgress {
  if (typeof localStorage === 'undefined') return emptyProgress()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyProgress()
    return {
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      quiz: parsed.quiz && typeof parsed.quiz === 'object' ? parsed.quiz : {},
      lastTopicId: typeof parsed.lastTopicId === 'string' ? parsed.lastTopicId : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
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

export interface UseCourseProgress {
  progress: CourseProgress
  complete: (topicId: string) => void
  uncomplete: (topicId: string) => void
  visit: (topicId: string) => void
  submitQuiz: (topicId: string, questions: CourseQuizQuestion[], answers: Record<string, number>) => { score: number; total: number }
  reset: () => void
}

export function useCourseProgress(uid: string | undefined, courseId: string): UseCourseProgress {
  const key = useMemo(() => progressStorageKey(uid, courseId), [uid, courseId])
  const [progress, setProgress] = useState<CourseProgress>(() => readProgress(key))

  // Switching user or course re-reads that pair's record.
  useEffect(() => {
    setProgress(readProgress(key))
  }, [key])

  const update = useCallback(
    (fn: (p: CourseProgress) => CourseProgress) => {
      setProgress((prev) => {
        const next = fn(prev)
        if (next !== prev) writeProgress(key, next)
        return next
      })
    },
    [key],
  )

  const complete = useCallback((topicId: string) => update((p) => markComplete(p, topicId)), [update])
  const uncomplete = useCallback((topicId: string) => update((p) => markIncomplete(p, topicId)), [update])
  const visit = useCallback((topicId: string) => update((p) => touchTopic(p, topicId)), [update])
  const submitQuiz = useCallback(
    (topicId: string, questions: CourseQuizQuestion[], answers: Record<string, number>) => {
      const result = scoreQuiz(questions, answers)
      update((p) => recordQuizAttempt(p, topicId, result))
      return result
    },
    [update],
  )
  const reset = useCallback(() => update(() => emptyProgress()), [update])

  return { progress, complete, uncomplete, visit, submitQuiz, reset }
}
