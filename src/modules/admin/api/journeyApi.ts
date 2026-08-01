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
  if (!id) throw new Error('No college ID found')
  return id
}

function collegeRef(path: string) {
  return collection(db, 'colleges', getCollegeId(), path)
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
  assessmentId: string
  percentage: number
  grade: string
  status: string
  createdAt?: string
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
    query(collegeRef('students'), where('mentor', '==', mentorName), limit(MAX_READS))
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
  for (const batch of batches) {
    const snap = await getDocs(
      query(collegeRef('scores'), where('studentId', 'in', batch), limit(MAX_READS))
    )
    if (!trackRead(snap.size)) continue
    allScores.push(...snap.docs.map(d => ({ id: d.id, ...d.data() }) as ScoreRecord))
  }

  return allScores.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function fetchAttendanceByStudentId(studentId: string): Promise<AttendanceRecord[]> {
  const snap = await getDocs(
    query(collegeRef('attendance'), where('studentId', '==', studentId), limit(MAX_READS))
  )
  if (!trackRead(snap.size)) return []

  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AttendanceRecord)
}

export async function fetchStudentById(studentId: string): Promise<StudentRecord | null> {
  const snap = await getDocs(
    query(collegeRef('students'), where('__name__', '==', studentId), limit(1))
  )
  if (!trackRead(snap.size)) return null

  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as StudentRecord
}

export async function fetchStudentsByCourse(course: string): Promise<StudentRecord[]> {
  const snap = await getDocs(
    query(collegeRef('students'), where('course', '==', course), limit(MAX_READS))
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as StudentRecord)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchAllStudents(): Promise<StudentRecord[]> {
  const snap = await getDocs(query(collegeRef('students'), limit(MAX_READS)))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as StudentRecord)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchScoresByStudentId(studentId: string): Promise<ScoreRecord[]> {
  const snap = await getDocs(
    query(collegeRef('scores'), where('studentId', '==', studentId), limit(50))
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as ScoreRecord)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}
