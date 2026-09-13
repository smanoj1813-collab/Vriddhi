// src/api/journeyApi.ts
// Firestore API for journey data — ZERO composite indexes
// Rules: where only, sort client-side, no onSnapshot, read budget 500

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore'
import { db } from '@/Firebase/config'

const MAX_READS = 500

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id)
    throw new Error(
      'This sign-in carries no college to scope queries to. Sign out and back in so the ' +
        'token is refreshed; if it persists, an administrator must link this profile to a ' +
        'college (Access Control → Identity repair).'
    )
  return id
}

function collegeRef(path: string) {
  return collection(db, 'colleges', getCollegeId(), path)
}

/**
 * Top-level, college-scoped collections.
 *
 * The journey page originally read `colleges/{id}/scores` and
 * `colleges/{id}/attendance`. Nothing in the codebase writes either: scores
 * are produced by the test flow into the top-level `studentAssessments`
 * collection, and attendance lives in the top-level `attendanceRecords`
 * collection. Reading the subcollections returned zero rows, so every student
 * was shown a 0 average, a 0 GPA and 0% attendance.
 */
function scopedRef(path: string) {
  return collection(db, path)
}

// ─── Types ──────────────────────────────────────────────

export interface Milestone {
  id: string
  title: string
  date: string
  status: 'completed' | 'active' | 'upcoming' | 'warning'
  description: string
  metric?: string
}

export interface FacultyRecord {
  id: string
  firstName: string
  lastName?: string
  designation?: string
  department?: string
  email: string
  joiningDate?: string
  topicsCovered?: number
  topicsPending?: number
  papersUploaded?: number
  avgAttendance?: number
}

export interface StudentRecord {
  id: string
  name: string
  regNo: string
  course: string
  batch: string
  branch?: string
  mentor?: string
  status: string
}

export interface ScoreRecord {
  id: string
  studentId: string
  assessmentId?: string
  testId?: string
  collegeId?: string
  percentage: number
  grade: string
  status: string
  title?: string
  subject?: string
  submittedAt?: string
  createdAt?: string
}

export interface GradeRecordRow {
  id: string
  studentId: string
  collegeId?: string
  code: string
  subject: string
  semester: number
  credits: number
  gradePoint: number
  grade: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  status: 'present' | 'absent' | 'late'
  date: string
  markedBy: string
  course: string
}

// ─── Read Budget Tracker ────────────────────────────────

let sessionReadCount = 0

function trackRead(count: number): boolean {
  sessionReadCount += count
  if (sessionReadCount > MAX_READS) {
    console.warn(`Read budget exceeded: ${sessionReadCount}/${MAX_READS}`)
    return false
  }
  return true
}

export function getReadCount(): number {
  return sessionReadCount
}

export function resetReadCount(): void {
  sessionReadCount = 0
}

// ─── Fetchers (NO orderBy + where combo) ──────────────

export async function fetchMilestones(): Promise<Milestone[]> {
  const snap = await getDocs(query(collegeRef('milestones'), limit(20)))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Milestone)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 10)
}

export async function fetchFacultyByEmail(email: string): Promise<FacultyRecord | null> {
  const snap = await getDocs(
    query(collegeRef('faculty'), where('email', '==', email), limit(1))
  )
  if (!trackRead(snap.size)) return null

  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as FacultyRecord
}

export async function fetchStudentsByMentor(mentorName: string): Promise<StudentRecord[]> {
  const snap = await getDocs(
    query(
      scopedRef('students'),
      where('collegeId', '==', getCollegeId()),
      where('mentor', '==', mentorName),
      limit(MAX_READS)
    )
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as StudentRecord)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchScoresByStudentIds(studentIds: string[]): Promise<ScoreRecord[]> {
  if (studentIds.length === 0) return []
  // Firestore 'in' limit is 10, so batch if needed
  const batches = []
  for (let i = 0; i < studentIds.length; i += 10) {
    const batch = studentIds.slice(i, i + 10)
    batches.push(batch)
  }

  const allScores: ScoreRecord[] = []
  const collegeId = getCollegeId()
  for (const batch of batches) {
    const snap = await getDocs(
      query(scopedRef('studentAssessments'), where('studentId', 'in', batch), limit(MAX_READS))
    )
    if (!trackRead(snap.size)) continue
    allScores.push(
      ...snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as ScoreRecord)
        // Only graded attempts carry a defensible percentage, and only rows
        // belonging to this college may contribute to a journey.
        .filter(r => r.collegeId === collegeId && r.status === 'graded')
    )
  }

  return allScores.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function fetchAttendanceByStudentId(studentId: string): Promise<AttendanceRecord[]> {
  const snap = await getDocs(
    query(
      scopedRef('attendanceRecords'),
      where('collegeId', '==', getCollegeId()),
      where('studentId', '==', studentId),
      limit(MAX_READS)
    )
  )
  if (!trackRead(snap.size)) return []

  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AttendanceRecord)
}

export async function fetchStudentById(studentId: string): Promise<StudentRecord | null> {
  const snap = await getDocs(
    query(
      scopedRef('students'),
      where('collegeId', '==', getCollegeId()),
      where('__name__', '==', studentId),
      limit(1)
    )
  )
  if (!trackRead(snap.size)) return null

  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as StudentRecord
}

export async function fetchStudentsByCourse(course: string): Promise<StudentRecord[]> {
  const snap = await getDocs(
    query(
      scopedRef('students'),
      where('collegeId', '==', getCollegeId()),
      where('course', '==', course),
      limit(MAX_READS)
    )
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as StudentRecord)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchAllStudents(): Promise<StudentRecord[]> {
  const snap = await getDocs(
    query(scopedRef('students'), where('collegeId', '==', getCollegeId()), limit(MAX_READS))
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as StudentRecord)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchScoresByStudentId(studentId: string): Promise<ScoreRecord[]> {
  const snap = await getDocs(
    query(scopedRef('studentAssessments'), where('studentId', '==', studentId), limit(200))
  )
  if (!trackRead(snap.size)) return []

  const collegeId = getCollegeId()
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as ScoreRecord)
    .filter(r => r.collegeId === collegeId && r.status === 'graded')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

/**
 * Published transcript grades for one student.
 *
 * The journey must never present a GPA derived from test percentages — the
 * student portal states that rule explicitly in fetchGrades(). Real credit
 * weights and grade points live here, so a GPA shown anywhere is the real one.
 */
export async function fetchGradesByStudentId(studentId: string): Promise<GradeRecordRow[]> {
  const snap = await getDocs(
    query(
      scopedRef('gradeRecords'),
      where('collegeId', '==', getCollegeId()),
      where('studentId', '==', studentId),
      where('status', '==', 'published'),
      limit(300)
    )
  )
  if (!trackRead(snap.size)) return []

  return snap.docs.map(d => {
    const row = d.data()
    return {
      id: d.id,
      studentId: String(row.studentId || ''),
      collegeId: String(row.collegeId || ''),
      code: String(row.code || ''),
      subject: String(row.subject || row.courseName || ''),
      semester: Number(row.semester) || 0,
      credits: Number(row.credits) || 0,
      gradePoint: Number(row.gradePoint) || 0,
      grade: String(row.grade || ''),
    } as GradeRecordRow
  })
}
