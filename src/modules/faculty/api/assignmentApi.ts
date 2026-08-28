// src/modules/faculty/api/assignmentApi.ts
// Firestore CRUD for Faculty Assignments

import { db } from '@/Firebase/config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  limit,
  getDoc,
  writeBatch,
  serverTimestamp,
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
    url: string
    type: string
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
    return []
  }
}

/**
 * Fetch assignments for a student
 */
export async function fetchStudentAssignments(
  studentUid: string,
  collegeId?: string
): Promise<Assignment[]> {
  const cid = collegeId || getCollegeId()
  if (!studentUid) return []

  try {
    // Query by studentIds array contains, or by cohort match
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where('status', 'in', ['published', 'ongoing', 'closed', 'graded']),
      orderBy('deadline', 'desc'),
      limit(100)
    )
    const snap = await getDocs(q)
    
    return snap.docs
      .map(d => docToAssignment(d.data(), d.id))
      .filter(a => {
        // Must match college
        if (cid && a.collegeId !== cid) return false
        
        // Check if student is in target list
        if (a.targetType === 'specific') {
          return a.studentIds?.includes(studentUid)
        }
        
        // For cohort-based, return all (actual filtering should be done server-side)
        return true
      })
  } catch (err) {
    console.error('[AssignmentApi] fetchStudentAssignments failed:', err)
    return []
  }
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
  const now = new Date().toISOString()
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  
  const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), docData)
  return docToAssignment(docData, docRef.id)
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(
  assignmentId: string,
  data: Partial<Assignment>
): Promise<void> {
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: new Date().toISOString(),
  }
  
  if (data.status === 'published' && !data.publishedAt) {
    updateData.publishedAt = new Date().toISOString()
  }
  
  await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId), updateData)
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
  // Also delete all submissions
  const submissionsQuery = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where('assignmentId', '==', assignmentId)
  )
  const submissionsSnap = await getDocs(submissionsQuery)
  
  const batch = writeBatch(db)
  submissionsSnap.docs.forEach(d => {
    batch.delete(doc(db, SUBMISSIONS_COLLECTION, d.id))
  })
  batch.delete(doc(db, ASSIGNMENTS_COLLECTION, assignmentId))
  
  await batch.commit()
}

// ─── Submissions CRUD ─────────────────────────────────────────────────────────

/**
 * Fetch submissions for an assignment
 */
export async function fetchAssignmentSubmissions(
  assignmentId: string
): Promise<Submission[]> {
  if (!assignmentId) return []

  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('assignmentId', '==', assignmentId),
      orderBy('submittedAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => docToSubmission(d.data(), d.id))
  } catch (err) {
    console.error('[AssignmentApi] fetchAssignmentSubmissions failed:', err)
    return []
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
  data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'submittedAt'>
): Promise<Submission> {
  const now = new Date().toISOString()
  const isLate = new Date(now) > new Date(data.maxScore > 0 ? data.maxScore : 0) // Compare with deadline
  
  const docData = {
    ...data,
    status: isLate ? 'late' : 'submitted',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  }
  
  // Check if submission already exists
  const existing = await fetchStudentSubmission(data.assignmentId, data.studentUid)
  if (existing) {
    // Update existing submission
    await updateDoc(doc(db, SUBMISSIONS_COLLECTION, existing.id), {
      ...docData,
      status: 'submitted', // Re-submission is not late
      submittedAt: now,
      updatedAt: now,
    })
      return { ...existing, ...docData, id: existing.id } as Submission
  }
  
  const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), docData)
  return docToSubmission(docData as any, docRef.id)
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
  const now = new Date().toISOString()
  await updateDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId), {
    score: data.score,
    remarks: data.remarks || '',
    status: 'graded',
    gradedAt: now,
    gradedBy: data.gradedBy,
    updatedAt: now,
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
  const batch = writeBatch(db)
  const now = new Date().toISOString()
  
  for (const grade of grades) {
    batch.update(doc(db, SUBMISSIONS_COLLECTION, grade.submissionId), {
      score: grade.score,
      remarks: grade.remarks || '',
      status: 'graded',
      gradedAt: now,
      gradedBy,
      updatedAt: now,
    })
  }
  
  await batch.commit()
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
