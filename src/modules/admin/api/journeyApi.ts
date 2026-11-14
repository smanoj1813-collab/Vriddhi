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
import { db } from '@/Firebase/data'
import { fetchFacultyProfile, type FacultyProfile } from '@/shared/api/facultyProfileApi'
import { isFacultyMentee } from '@/modules/faculty/utils/facultyJourney'

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

export type FacultyRecord = FacultyProfile

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

export async function fetchFacultyByEmail(email: string, collegeId = getCollegeId()): Promise<FacultyRecord | null> {
  return fetchFacultyProfile({ collegeId, email })
}

export async function fetchStudentsByMentor(
  mentor: string | readonly string[],
  collegeId = getCollegeId(),
): Promise<StudentRecord[]> {
  const aliases = typeof mentor === 'string' ? [mentor] : mentor
  if (!aliases.some(value => value.trim())) return []
  // There is no normalized mentor field in older imports. Read only this
  // college's bounded roster, then match uid/profile/email/name spellings.
  const snap = await getDocs(query(
    scopedRef('students'),
    where('collegeId', '==', collegeId),
    limit(MAX_READS + 1),
  ))
  // This section has a per-request cap; it must not consume the legacy
  // student-tab counter and poison that tab after a faculty refresh.
  // Never turn a capped roster into an apparently complete mentor count.
  if (snap.size > MAX_READS) throw new Error('The roster is too large for the Journey summary. Use Student Analysis for the full roster.')
  return snap.docs
    .filter(d => d.data().collegeId === collegeId && isFacultyMentee(d.data(), aliases))
    .map(d => ({ ...d.data(), id: d.id }) as StudentRecord)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export async function fetchScoresByStudentIds(studentIds: string[], collegeId = getCollegeId()): Promise<ScoreRecord[]> {
  if (studentIds.length === 0) return []
  const ids = [...new Set(studentIds)]
  const allScores: ScoreRecord[] = []
  for (let i = 0; i < ids.length; i += 10) {
    const snap = await getDocs(query(
      scopedRef('studentAssessments'),
      // Rules authorize candidate documents, not the client-side filter below.
      where('collegeId', '==', collegeId),
      where('studentId', 'in', ids.slice(i, i + 10)),
      where('status', '==', 'graded'),
      limit(MAX_READS - allScores.length + 1),
    ))
    allScores.push(...snap.docs.map(d => ({ ...d.data(), id: d.id }) as ScoreRecord))
    if (allScores.length > MAX_READS) throw new Error('There are too many results for the Journey summary. Use Student Analysis for detailed results.')
  }
  // These faculty summary reads use per-request caps: repeated Retry/Refresh
  // must not exhaust a module-global counter and silently turn real data to [].
  return allScores
    .filter(r => r.collegeId === collegeId && r.status === 'graded')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
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
