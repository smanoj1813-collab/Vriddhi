// src/modules/faculty/api/assignmentApi.ts
// Firestore CRUD for Faculty Assignments

import { db, functions } from '@/Firebase/config'
import { httpsCallable } from 'firebase/functions'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  orderBy,
  limit,
  getDoc,
} from 'firebase/firestore'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssignmentStatus = 'draft' | 'published' | 'ongoing' | 'closed' | 'graded'
export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'missing' | 'graded'

export interface Assignment {
  id: string
  collegeId: string
  facultyUid: string
  facultyName: string
  title: string
  description: string
  topic?: string
  subject: string
  subjectCode?: string
  maxScore: number
  deadline: string // ISO date string
  status: AssignmentStatus
  type: 'assignment' | 'test' | 'project' | 'quiz'
  
  // Target audience
  targetType: 'specific' | 'cohort'
  studentIds?: string[] // For specific students
  cohort?: {
    branch?: string
    batch?: string
    division?: string
    semester?: number
  }
  
  // Files
  attachments?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  
  // Metadata
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface Submission {
  id: string
  assignmentId: string
  collegeId: string
  studentUid: string
  studentName: string
  studentRegNo?: string
  
  // Submission data
  content?: string
  attachments?: Array<{
    name: string
    url?: string
    storagePath?: string
    type?: string
    contentType?: string
    size: number
  }>
  
  // Status
  status: SubmissionStatus
  submittedAt?: string
  
  // Grading
  score?: number
  maxScore: number
  remarks?: string
  gradedAt?: string
  gradedBy?: string
  
  createdAt: string
  updatedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSIGNMENTS_COLLECTION = 'assignments'
const SUBMISSIONS_COLLECTION = 'submissions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCollegeId(): string {
  return localStorage.getItem('vriddhi_college_id') || ''
}

function toISO(val: any): string {
  return val?.toDate?.().toISOString() || val || new Date().toISOString()
}

function docToAssignment(d: any, id: string): Assignment {
  return {
    id,
    collegeId: d.collegeId || '',
    facultyUid: d.facultyUid || '',
    facultyName: d.facultyName || '',
    title: d.title || '',
    description: d.description || '',
    topic: d.topic || '',
    subject: d.subject || '',
    subjectCode: d.subjectCode || '',
    maxScore: d.maxScore || 100,
    deadline: d.deadline || '',
    status: d.status || 'draft',
    type: d.type || 'assignment',
    targetType: d.targetType || 'cohort',
    studentIds: d.studentIds || [],
    cohort: d.cohort || {},
    attachments: d.attachments || [],
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
    publishedAt: d.publishedAt ? toISO(d.publishedAt) : undefined,
  }
}

function docToSubmission(d: any, id: string): Submission {
  return {
    id,
    assignmentId: d.assignmentId || '',
    collegeId: d.collegeId || '',
    studentUid: d.studentUid || '',
    studentName: d.studentName || '',
    studentRegNo: d.studentRegNo || '',
    content: d.content || '',
    attachments: d.attachments || [],
    status: d.status || 'pending',
    submittedAt: d.submittedAt ? toISO(d.submittedAt) : undefined,
    score: d.score,
    maxScore: d.maxScore || 100,
    remarks: d.remarks || '',
    gradedAt: d.gradedAt ? toISO(d.gradedAt) : undefined,
    gradedBy: d.gradedBy || '',
    createdAt: toISO(d.createdAt),
    updatedAt: toISO(d.updatedAt),
  }
}

// ─── Assignments CRUD ─────────────────────────────────────────────────────────

/**
 * Fetch all assignments for a faculty member
 */
export async function fetchFacultyAssignments(
  facultyUid: string,
  collegeId?: string
): Promise<Assignment[]> {
  const cid = collegeId || getCollegeId()
  if (!facultyUid) return []

  try {
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where('collegeId', '==', cid),
      where('facultyUid', '==', facultyUid),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const snap = await getDocs(q)
    
    let assignments = snap.docs.map(d => docToAssignment(d.data(), d.id))
    
    // Filter by collegeId client-side if needed
    if (cid) {
      assignments = assignments.filter(a => a.collegeId === cid)
    }
    
    return assignments
  } catch (err) {
    console.error('[AssignmentApi] fetchFacultyAssignments failed:', err)
    throw err
  }
}

/**
 * Fetch assignments for a student
 */
export async function fetchStudentAssignments(
  studentUid: string,
  _collegeId?: string
): Promise<Assignment[]> {
  if (!studentUid) return []
  const getMyAssignments = httpsCallable<Record<string, never>, { assignments: Assignment[] }>(
    functions,
    'getMyAssignments'
  )
  const response = await getMyAssignments({})
  return response.data.assignments
}

/**
 * Fetch a single assignment by ID
 */
export async function fetchAssignment(assignmentId: string): Promise<Assignment | null> {
  if (!assignmentId) return null
  
  try {
    const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    return docToAssignment(docSnap.data(), docSnap.id)
  } catch (err) {
    console.error('[AssignmentApi] fetchAssignment failed:', err)
    return null
  }
}

/**
 * Create a new assignment
 */
export async function createAssignment(
  data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Assignment> {
  const create = httpsCallable<Record<string, unknown>, { id: string; status: AssignmentStatus }>(
    functions,
    'createFacultyAssignment'
  )
  const response = await create({
    ...data,
    deadline: data.deadline,
  })
  const created = await fetchAssignment(response.data.id)
  if (!created) throw new Error('Assignment was created but could not be reloaded.')
  return created
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(
  assignmentId: string,
  data: Partial<Assignment>
): Promise<void> {
  if (data.status) {
    const transition = httpsCallable<
      { assignmentId: string; status: AssignmentStatus },
      { success: boolean }
    >(functions, 'transitionFacultyAssignment')
    await transition({ assignmentId, status: data.status })
    return
  }
  const existing = await fetchAssignment(assignmentId)
  if (!existing) throw new Error('Assignment not found.')
  const update = httpsCallable<
    { assignmentId: string; assignment: Record<string, unknown> },
    { success: boolean }
  >(functions, 'updateFacultyAssignment')
  const merged = { ...existing, ...data }
  const assignment = {
    title: merged.title,
    description: merged.description,
    topic: merged.topic,
    subject: merged.subject,
    subjectCode: merged.subjectCode,
    maxScore: merged.maxScore,
    deadline: new Date(merged.deadline).toISOString(),
    type: merged.type,
    targetType: merged.targetType,
    cohort: merged.cohort,
    studentIds: merged.studentIds,
  }
  await update({
    assignmentId,
    assignment: Object.fromEntries(Object.entries(assignment).filter(([, value]) => value !== undefined)),
  })
}

/**
 * Publish an assignment
 */
export async function publishAssignment(assignmentId: string): Promise<void> {
  await updateAssignment(assignmentId, {
    status: 'published',
    publishedAt: new Date().toISOString(),
  })
}

/**
 * Delete an assignment (only if draft)
 */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  const remove = httpsCallable<{ assignmentId: string }, { success: boolean }>(
    functions,
    'deleteFacultyAssignmentDraft'
  )
  await remove({ assignmentId })
}

// ─── Submissions CRUD ─────────────────────────────────────────────────────────

/**
 * Fetch submissions for an assignment
 */
export async function fetchAssignmentSubmissions(
  assignmentId: string,
  collegeId?: string
): Promise<Submission[]> {
  const cid = collegeId || getCollegeId()
  if (!assignmentId || !cid) return []

  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('collegeId', '==', cid),
      where('assignmentId', '==', assignmentId),
      orderBy('submittedAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => docToSubmission(d.data(), d.id))
  } catch (err) {
    console.error('[AssignmentApi] fetchAssignmentSubmissions failed:', err)
    throw err
  }
}

/**
 * Fetch a student's submission for an assignment
 */
export async function fetchStudentSubmission(
  assignmentId: string,
  studentUid: string
): Promise<Submission | null> {
  if (!assignmentId || !studentUid) return null

  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('assignmentId', '==', assignmentId),
      where('studentUid', '==', studentUid),
      limit(1)
    )
    const snap = await getDocs(q)
    
    if (snap.empty) return null
    return docToSubmission(snap.docs[0].data(), snap.docs[0].id)
  } catch (err) {
    console.error('[AssignmentApi] fetchStudentSubmission failed:', err)
    return null
  }
}

/**
 * Submit an assignment (student)
 */
export async function submitAssignment(
  _data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'submittedAt'>
): Promise<Submission> {
  throw new Error('Student submissions must use the verified upload-session workflow.')
}

/**
 * Grade a submission (faculty)
 */
export async function gradeSubmission(
  submissionId: string,
  data: {
    score: number
    remarks?: string
    gradedBy: string
  }
): Promise<void> {
  const grade = httpsCallable<
    { submissionId: string; score: number; remarks: string },
    { success: boolean }
  >(functions, 'gradeAssignmentSubmission')
  await grade({
    submissionId,
    score: data.score,
    remarks: data.remarks || '',
  })
}

/**
 * Batch grade multiple submissions
 */
export async function batchGradeSubmissions(
  grades: Array<{
    submissionId: string
    score: number
    remarks?: string
  }>,
  gradedBy: string
): Promise<void> {
  await Promise.all(
    grades.map((grade) =>
      gradeSubmission(grade.submissionId, {
        score: grade.score,
        remarks: grade.remarks,
        gradedBy,
      })
    )
  )
}

// ─── Stats & Helpers ──────────────────────────────────────────────────────────

export interface AssignmentStats {
  total: number
  draft: number
  published: number
  ongoing: number
  closed: number
  graded: number
  totalSubmissions: number
  gradedSubmissions: number
}

export async function getAssignmentStats(
  facultyUid: string,
  collegeId?: string
): Promise<AssignmentStats> {
  const assignments = await fetchFacultyAssignments(facultyUid, collegeId)
  
  const stats: AssignmentStats = {
    total: assignments.length,
    draft: 0,
    published: 0,
    ongoing: 0,
    closed: 0,
    graded: 0,
    totalSubmissions: 0,
    gradedSubmissions: 0,
  }
  
  for (const a of assignments) {
    stats[a.status]++
    
    // Fetch submission count
    const submissions = await fetchAssignmentSubmissions(a.id)
    stats.totalSubmissions += submissions.length
    stats.gradedSubmissions += submissions.filter(s => s.status === 'graded').length
  }
  
  return stats
}

/**
 * Check if a student has submitted an assignment
 */
export async function hasSubmitted(
  assignmentId: string,
  studentUid: string
): Promise<boolean> {
  const submission = await fetchStudentSubmission(assignmentId, studentUid)
  return submission !== null
}

export async function getSubmissionFileDownload(
  submissionId: string,
  storagePath: string
): Promise<{ url: string; expiresAt: string; name: string; contentType: string }> {
  const getDownload = httpsCallable<
    { submissionId: string; storagePath: string },
    { url: string; expiresAt: string; name: string; contentType: string }
  >(functions, 'getAssignmentSubmissionDownload')
  return (await getDownload({ submissionId, storagePath })).data
}
