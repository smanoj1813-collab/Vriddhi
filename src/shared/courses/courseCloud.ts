// Firestore I/O for college course assignments and learner progress.
// Pure course rules live in courseModel.ts so they remain runnable in Node tests.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '@/Firebase/config'
import { stripUndefined } from '@/shared/utils/firestoreClean'
import { extractStudentCohortFields, normalizeProgramName } from '@/shared/utils/cohortMatching'
import {
  coursePercent,
  emptyProgress,
  hasReadTopic,
  mergeCourseProgress,
  quizAverage,
} from './courseModel'
import type { CourseManifest, CourseProgress, CourseProgressRecord } from './types'

export interface CourseAssignment {
  enabled: boolean
  assignedAt?: string
  assignedBy?: string
  cohort?: { programs?: string[] }
  startsOn?: string
  dueOn?: string
  notes?: string
}

export interface CourseAssignmentSettings {
  assignments: Record<string, CourseAssignment>
  updatedAt?: string
  updatedBy?: string
}

export interface CollegeProgramOption {
  value: string
  label: string
}

export interface CourseProgressSummary {
  started: number
  completed: number
  averageQuiz: number | null
}

const emptyAssignments = (): CourseAssignmentSettings => ({ assignments: {} })

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeCourseAssignments(value: unknown): CourseAssignmentSettings {
  if (!isRecord(value) || !isRecord(value.assignments)) return emptyAssignments()
  const assignments: Record<string, CourseAssignment> = {}
  for (const [courseId, raw] of Object.entries(value.assignments)) {
    if (!isRecord(raw)) continue
    const rawPrograms = raw.cohort?.programs
    const programs = Array.isArray(rawPrograms)
      ? [...new Set(rawPrograms.map((p: unknown) => String(p ?? '').trim()).filter(Boolean))]
      : []
    assignments[courseId] = {
      enabled: raw.enabled === true,
      assignedAt: typeof raw.assignedAt === 'string' ? raw.assignedAt : undefined,
      assignedBy: typeof raw.assignedBy === 'string' ? raw.assignedBy : undefined,
      cohort: programs.length ? { programs } : undefined,
      startsOn: typeof raw.startsOn === 'string' ? raw.startsOn : undefined,
      dueOn: typeof raw.dueOn === 'string' ? raw.dueOn : undefined,
      notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    }
  }
  return {
    assignments,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
    updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : undefined,
  }
}

/** Missing settings and missing assignment records are intentionally hidden. */
export function isCourseAssignedToStudent(
  settings: CourseAssignmentSettings,
  courseId: string,
  student: Record<string, unknown> | null,
): boolean {
  const assignment = settings.assignments[courseId]
  if (!assignment?.enabled) return false
  const programs = assignment.cohort?.programs || []
  if (programs.length === 0) return true
  if (!student) return false
  const fields = extractStudentCohortFields({
    ...student,
    branch: student.branch ?? student.department ?? student.course ?? student.program ?? '',
  })
  const program = normalizeProgramName(fields.branch)
  return !!program && programs.some((item) => normalizeProgramName(item) === program)
}

export async function loadCourseAssignments(collegeId: string): Promise<CourseAssignmentSettings> {
  const snapshot = await getDoc(doc(db, 'colleges', collegeId, 'config', 'courses'))
  return snapshot.exists() ? normalizeCourseAssignments(snapshot.data()) : emptyAssignments()
}

export async function saveCourseAssignments(
  collegeId: string,
  assignments: Record<string, CourseAssignment>,
): Promise<CourseAssignmentSettings> {
  const updatedAt = new Date().toISOString()
  const updatedBy = auth.currentUser?.uid || ''
  const audited: Record<string, CourseAssignment> = {}
  for (const [courseId, assignment] of Object.entries(assignments)) {
    audited[courseId] = {
      ...assignment,
      ...(assignment.enabled ? {
        assignedAt: assignment.assignedAt || updatedAt,
        assignedBy: assignment.assignedBy || updatedBy,
      } : {}),
    }
  }
  const next: CourseAssignmentSettings = { assignments: audited, updatedAt, updatedBy }
  await setDoc(doc(db, 'colleges', collegeId, 'config', 'courses'), stripUndefined(next))
  return next
}

/** Read the known academic programmes for the assignment panel's optional filter. */
export async function listCollegePrograms(collegeId: string): Promise<CollegeProgramOption[]> {
  const snapshot = await getDocs(query(collection(db, 'colleges', collegeId, 'students'), limit(500)))
  const byNormalized = new Map<string, string>()
  snapshot.docs.forEach((studentDoc) => {
    const data = studentDoc.data() as Record<string, unknown>
    const fields = extractStudentCohortFields({
      ...data,
      branch: data.branch ?? data.department ?? data.course ?? data.program ?? '',
    })
    const label = fields.branch.trim()
    const normalized = normalizeProgramName(label)
    if (normalized && label && !byNormalized.has(normalized)) byNormalized.set(normalized, label)
  })
  return [...byNormalized.values()]
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({ value: label, label }))
}

function cleanProgress(data: Record<string, any>): CourseProgress {
  const completed = isRecord(data.completed) ? data.completed : {}
  const read = isRecord(data.read) ? data.read : completed
  return {
    read,
    completed,
    quiz: isRecord(data.quiz) ? data.quiz : {},
    moduleAssessments: isRecord(data.moduleAssessments) ? data.moduleAssessments : {},
    lastTopicId: typeof data.lastTopicId === 'string' ? data.lastTopicId : undefined,
    startedAt: typeof data.startedAt === 'string' ? data.startedAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    completedAt: typeof data.completedAt === 'string' ? data.completedAt : undefined,
  }
}

export function courseProgressDocumentId(uid: string, courseId: string): string {
  return `${uid}__${courseId}`
}

export async function loadCourseProgress(
  collegeId: string,
  uid: string,
  courseId: string,
): Promise<CourseProgress | null> {
  const snapshot = await getDoc(doc(db, 'colleges', collegeId, 'courseProgress', courseProgressDocumentId(uid, courseId)))
  return snapshot.exists() ? cleanProgress(snapshot.data()) : null
}

/**
 * Transactional merge keeps work from another signed-in device when this
 * device syncs later. localStorage remains the immediate/offline cache.
 */
export async function saveCourseProgress(
  collegeId: string,
  uid: string,
  courseId: string,
  manifest: CourseManifest | undefined,
  progress: CourseProgress,
): Promise<CourseProgress> {
  const ref = doc(db, 'colleges', collegeId, 'courseProgress', courseProgressDocumentId(uid, courseId))
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    const remote = snapshot.exists() ? cleanProgress(snapshot.data()) : emptyProgress()
    const merged = mergeCourseProgress(remote, progress)
    const now = new Date().toISOString()
    const topicRefs = manifest?.modules.flatMap((module) => module.topics) || []
    const completedCount = topicRefs.length
      ? topicRefs.filter((topic) => hasReadTopic(merged, topic.id)).length
      : Object.keys(merged.completed).length
    const percent = topicRefs.length ? coursePercent(manifest!, merged) : 0
    const allRead = topicRefs.length > 0 && completedCount === topicRefs.length
    const record: CourseProgressRecord = {
      ...merged,
      uid,
      collegeId,
      courseId,
      courseVersion: manifest?.version || 'unknown',
      percent,
      completedCount,
      quizAverage: quizAverage(merged),
      updatedAt: merged.updatedAt || now,
      ...(allRead ? { completedAt: merged.completedAt || now } : {}),
    }
    transaction.set(ref, stripUndefined(record))
    return { ...merged, ...(allRead ? { completedAt: record.completedAt } : {}) }
  })
}

/** College staff reporting; the collection path is the tenant boundary. */
export async function getCourseProgressSummary(
  collegeId: string,
  courseId: string,
): Promise<CourseProgressSummary> {
  const snapshot = await getDocs(query(
    collection(db, 'colleges', collegeId, 'courseProgress'),
    where('courseId', '==', courseId),
  ))
  if (snapshot.empty) return { started: 0, completed: 0, averageQuiz: null }
  let completed = 0
  let quizTotal = 0
  let quizCount = 0
  snapshot.docs.forEach((row) => {
    const data = row.data()
    if (Number(data.percent) >= 100 || data.completedAt) completed += 1
    if (Number.isFinite(Number(data.quizAverage))) {
      quizTotal += Number(data.quizAverage)
      quizCount += 1
    }
  })
  return {
    started: snapshot.size,
    completed,
    averageQuiz: quizCount ? Math.round(quizTotal / quizCount) : null,
  }
}
