// src/api/dashboardApi.ts
// Firestore API for dashboard data — ZERO composite indexes

import {
  collection, doc, getDocs, getDoc,
  query, where, limit,
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

function collegeDocRef(path: string) {
  return doc(db, 'colleges', getCollegeId(), path)
}

// ─── Types ──────────────────────────────────────────────

export interface Student {
  id: string
  name: string
  regNo: string
  course: 'BCom' | 'BA' | 'BSc'
  batch: string
  branch: string
  status: 'active' | 'inactive'
  createdAt: string
  mentor?: string
  division?: string
  email?: string
  phone?: string
  avatar?: string
  uid?: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  course: string
  batch: string
  date: string
  status: 'present' | 'absent' | 'late'
  markedBy: string
  markedById?: string
  subject?: string
  period?: string
}

export interface Assessment {
  id: string
  name: string
  course: string
  batch: string
  subject: string
  date: string
  totalMarks: number
  status: 'upcoming' | 'active' | 'completed'
  type?: string
  semester?: string
}

export interface AssessmentScore {
  id: string
  studentId: string
  assessmentId: string
  marksObtained: number
  percentage: number
  grade: string
  status: 'pass' | 'fail'
  subject?: string
}

export interface Activity {
  id: string
  action: string
  subject: string
  time: string
  timestamp: number
  icon?: string
  userId?: string
  userName?: string
}

export interface DashboardStats {
  totalStudents: number
  totalAssessments: number
  totalScores: number
  avgAttendance: number
  passRate: number
  activeAssessments: number
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

export async function fetchStudents(filters?: { course?: string; batch?: string }): Promise<Student[]> {
  const constraints: any[] = [where('status', '==', 'active'), limit(MAX_READS)]

  if (filters?.course && filters.course !== 'all') {
    constraints.push(where('course', '==', filters.course))
  }
  if (filters?.batch && filters.batch !== 'all') {
    constraints.push(where('batch', '==', filters.batch))
  }

  const snap = await getDocs(query(collegeRef('students'), ...constraints))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Student)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchAttendanceRecords(
  filters?: { course?: string; batch?: string },
  days: number = 7
): Promise<AttendanceRecord[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]

  const snap = await getDocs(
    query(collegeRef('attendance'), where('date', '>=', cutoffStr), limit(MAX_READS))
  )
  if (!trackRead(snap.size)) return []

  let records = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AttendanceRecord)

  if (filters?.course && filters.course !== 'all') {
    records = records.filter(r => r.course === filters.course)
  }
  if (filters?.batch && filters.batch !== 'all') {
    records = records.filter(r => r.batch === filters.batch)
  }

  return records.sort((a, b) => b.date.localeCompare(a.date))
}

export async function fetchAssessments(): Promise<Assessment[]> {
  const snap = await getDocs(query(collegeRef('assessments'), limit(MAX_READS)))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Assessment)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 100)
}

export async function fetchScores(): Promise<AssessmentScore[]> {
  const snap = await getDocs(query(collegeRef('scores'), limit(MAX_READS)))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as AssessmentScore)
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 2000)
}

export async function fetchActivities(): Promise<Activity[]> {
  const snap = await getDocs(query(collegeRef('activities'), limit(20)))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Activity)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchAggregatedStats(): Promise<DashboardStats | null> {
  try {
    const statsDoc = await getDoc(collegeDocRef('stats/aggregated'))
    if (statsDoc.exists()) {
      trackRead(1)
      return statsDoc.data() as DashboardStats
    }
  } catch (e) {
    console.warn('No aggregated stats found, falling back to computed')
  }
  return null
}

// ─── Computed Helpers (Client-side only) ────────────────

export function getStudentCount(students: Student[], filters?: { course?: string; batch?: string }): number {
  let filtered = students.filter(s => s.status === 'active')
  if (filters?.course && filters.course !== 'all') {
    filtered = filtered.filter(s => s.course === filters.course)
  }
  if (filters?.batch && filters.batch !== 'all') {
    filtered = filtered.filter(s => s.batch === filters.batch)
  }
  return filtered.length
}

export function getAttendanceRate(records: AttendanceRecord[], filters?: { course?: string; batch?: string }): number {
  let filtered = records
  if (filters?.course && filters.course !== 'all') {
    filtered = filtered.filter(r => r.course === filters.course)
  }
  if (filters?.batch && filters.batch !== 'all') {
    filtered = filtered.filter(r => r.batch === filters.batch)
  }

  if (filtered.length === 0) return 0
  const present = filtered.filter(r => r.status === 'present').length
  return Math.round((present / filtered.length) * 1000) / 10
}

export function getWeeklyAttendanceByDay(records: AttendanceRecord[]): { day: string; present: number; absent: number; total: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayMap: Record<string, string> = {}

  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1]
    dayMap[d.toISOString().split('T')[0]] = dayName
  }

  return days.map(day => {
    const dayRecords = records.filter(r => dayMap[r.date] === day)
    const present = dayRecords.filter(r => r.status === 'present').length
    const absent = dayRecords.filter(r => r.status === 'absent').length
    return { day, present, absent, total: present + absent }
  })
}

export function getBranchAttendanceTotals(records: AttendanceRecord[]): Record<string, { totalPresent: number; totalAbsent: number; totalStudents: number }> {
  const totals: Record<string, { totalPresent: number; totalAbsent: number; totalStudents: number }> = {}

  records.forEach(record => {
    if (!totals[record.course]) {
      totals[record.course] = { totalPresent: 0, totalAbsent: 0, totalStudents: 0 }
    }
    if (record.status === 'present') {
      totals[record.course].totalPresent++
    } else {
      totals[record.course].totalAbsent++
    }
    totals[record.course].totalStudents++
  })

  return totals
}

export function getPerformanceTrend(scores: AssessmentScore[], assessments: Assessment[]): { month: string; avg: number }[] {
  const monthlyScores: Record<string, number[]> = {}

  scores.forEach(score => {
    const assessment = assessments.find(a => a.id === score.assessmentId)
    if (assessment) {
      const month = new Date(assessment.date).toLocaleString('en-US', { month: 'short' })
      if (!monthlyScores[month]) monthlyScores[month] = []
      monthlyScores[month].push(score.percentage)
    }
  })

  return Object.entries(monthlyScores).map(([month, scores]) => ({
    month,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }))
}

export function getTopPerformers(
  students: Student[],
  scores: AssessmentScore[],
  assessments: Assessment[],
  limitCount: number = 5
) {
  const studentAvgs = students.map(student => {
    const studentScores = scores.filter(s => s.studentId === student.id)
    const avg = studentScores.length > 0
      ? Math.round(studentScores.reduce((a, b) => a + b.percentage, 0) / studentScores.length * 10) / 10
      : 0

    return {
      name: student.name,
      regNo: student.regNo,
      course: student.course,
      avg,
      assessmentsTaken: studentScores.length,
      totalAssessments: assessments.filter(a =>
        a.course === student.course && a.batch === student.batch
      ).length
    }
  })

  return studentAvgs
    .filter(s => s.assessmentsTaken >= 1)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, limitCount)
    .map((s, i) => ({ ...s, rank: i + 1 }))
}

export function getActiveAssessmentsCount(assessments: Assessment[]): number {
  return assessments.filter(a => a.status === 'active' || a.status === 'upcoming').length
}

export function getPassRate(scores: AssessmentScore[]): number {
  if (scores.length === 0) return 0
  const passed = scores.filter(s => s.status === 'pass').length
  return Math.round((passed / scores.length) * 1000) / 10
}
