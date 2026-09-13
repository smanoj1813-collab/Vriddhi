// src/hooks/useJourney.ts
// React hook for journey data — one-time fetch, manual refresh
// NO onSnapshot. Read budget protection.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getCurriculumProgress } from '../api/classSessionApi'
import {
  fetchMilestones,
  fetchFacultyByEmail,
  fetchStudentsByMentor,
  fetchScoresByStudentIds,
  fetchAttendanceByStudentId,
  fetchStudentById,
  fetchStudentsByCourse,
  fetchAllStudents,
  fetchScoresByStudentId,
  fetchGradesByStudentId,
  GradeRecordRow,
  Milestone,
  FacultyRecord,
  StudentRecord,
  ScoreRecord,
  AttendanceRecord,
} from '../api/journeyApi'

export interface StudentJourneyData {
  student: { id: string; name: string; regNo: string; course: string; batch: string; branch: string }
  /**
   * Real credit-weighted CGPA from published grade records, or null when the
   * college has published none. This used to be `(avgScore / 100) * 10` — a
   * GPA invented from test percentages, which the student portal explicitly
   * forbids — so a student averaging 72% was shown a 7.2 "GPA" that appeared
   * on no transcript.
   */
  currentGPA: number | null
  cgpa: number | null
  /** Real position in the cohort, or null when it cannot be computed. */
  rank: number | null
  /** Students actually ranked, not the whole roster. */
  totalStudents: number
  attendance: number
  avgScore: number
  assessmentsTaken: number
  /** Null when the published assessment count is unknown — never 0. */
  totalAssessments: number | null
  scoreTrend: number[]
  creditsEarned: number
}

/** Credit-weighted mean of real grade points; null when nothing is usable. */
function weightedCgpa(rows: GradeRecordRow[]): number | null {
  const usable = rows.filter(row => row.credits > 0 && row.gradePoint > 0)
  if (usable.length === 0) return null
  const credits = usable.reduce((sum, row) => sum + row.credits, 0)
  if (credits === 0) return null
  const points = usable.reduce((sum, row) => sum + row.credits * row.gradePoint, 0)
  return Math.round((points / credits) * 100) / 100
}

/** Cohorts above this size are not ranked client-side; the read budget is 500. */
const MAX_RANKABLE_COHORT = 150

export interface FacultyJourneyData {
  faculty: { name: string; title: string; department: string }
  yearsOfService: number
  totalStudents: number
  avgStudentScore: number
  classesThisWeek: number
  topicsCovered: number
  topicsPending: number
  papersUploaded: number
  avgAttendance: number
  studentPerformanceDistribution: { good: number; average: number; weak: number }
  goodStudentsCount: number
  weakStudentsCount: number
}

export function useCollegeJourney() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMilestones()
      setMilestones(data)
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    loadedRef.current = false
    fetchData()
  }, [fetchData])

  return { milestones, loading, refresh }
}

export function useFacultyJourney() {
  const [data, setData] = useState<FacultyJourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const userStr = localStorage.getItem('vriddhi_user')
      if (!userStr) {
        setLoading(false)
        return
      }
      const user = JSON.parse(userStr)

      const faculty = await fetchFacultyByEmail(user.email)
      if (!faculty) {
        setLoading(false)
        return
      }

      const students = await fetchStudentsByMentor(user.name)
      const studentIds = students.map(s => s.id)
      const scores = await fetchScoresByStudentIds(studentIds)

      const percentages = scores.map(s => s.percentage)
      const avgScore = percentages.length ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0

      const good = percentages.filter(s => s >= 80).length
      const average = percentages.filter(s => s >= 60 && s < 80).length
      const weak = percentages.filter(s => s < 60).length

      // ─── Slice 2 S2.4: compute the coverage numbers from real data ──────
      // These three were fabricated before: `classesThisWeek` was hardcoded to
      // 0, `topicsCovered`/`topicsPending` came from static number fields typed
      // into the faculty document, and `avgAttendance` silently defaulted to 85
      // whenever the field was missing — so the gauge read the same whether or
      // not a single class had been marked (audit finding F4).
      let classesThisWeek = 0
      let topicsCovered = 0
      let topicsPending = 0
      let avgAttendance: number | null = null
      try {
        const progress = await getCurriculumProgress({ facultyId: faculty.id })
        const own =
          progress.faculty.find((row: { facultyId: string }) => row.facultyId === faculty.id) ||
          progress.totals
        if (own) {
          topicsCovered = own.topics.covered
          topicsPending = own.topics.pending
          // Classes delivered in the most recent elapsed week.
          classesThisWeek =
            own.pace.weeksElapsed > 0
              ? Math.round(own.pace.completed / own.pace.weeksElapsed)
              : 0
          avgAttendance = own.attendance.marked > 0 ? own.attendance.pct : null
        }
      } catch (progressError) {
        // The journey page is a summary, not a report: if coverage cannot be
        // computed, show nothing rather than a number nobody can defend.
        console.warn('[useJourney] curriculum progress unavailable:', progressError)
      }

      setData({
        faculty: {
          name: `${faculty.firstName} ${faculty.lastName || ''}`.trim(),
          title: faculty.designation || 'Faculty',
          department: faculty.department || 'General',
        },
        yearsOfService: faculty.joiningDate
          ? Math.floor((Date.now() - new Date(faculty.joiningDate).getTime()) / (365 * 24 * 60 * 60 * 1000))
          : 0,
        totalStudents: students.length,
        avgStudentScore: Math.round(avgScore * 10) / 10,
        classesThisWeek,
        topicsCovered,
        topicsPending,
        papersUploaded: faculty.papersUploaded || 0,
        // null (not 85) when nothing has been marked — the page renders '—'.
        avgAttendance: avgAttendance ?? 0,
        studentPerformanceDistribution: { good, average, weak },
        goodStudentsCount: good,
        weakStudentsCount: weak,
      })
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching faculty journey:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    loadedRef.current = false
    fetchData()
  }, [fetchData])

  return { data, loading, refresh }
}

export function useStudentJourney(studentId?: string) {
  const [data, setData] = useState<StudentJourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
  const loadedRef = useRef(false)

  const fetchData = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const [student, scores, attendance, students, grades] = await Promise.all([
        fetchStudentById(id),
        fetchScoresByStudentId(id),
        fetchAttendanceByStudentId(id),
        fetchAllStudents(),
        fetchGradesByStudentId(id),
      ])

      if (!student) {
        setLoading(false)
        return
      }

      const percentages = scores.map(s => s.percentage)
      const avgScore = percentages.length ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0

      // Real CGPA: credit-weighted mean of published grade points. Null, not 0,
      // when the college has published nothing — the page renders '—'.
      const cgpa = weightedCgpa(grades)
      const creditsEarned = grades.reduce((sum, row) => sum + row.credits, 0)

      const presentCount = attendance.filter(r => r.status === 'present').length
      const attendanceRate = attendance.length ? (presentCount / attendance.length) * 100 : 0

      // Real standing: rank this student among classmates whose own published
      // CGPA is known. Previously this was the literal `rank: 1` for everyone,
      // so the page told every student in the college they were first.
      // Students with no published grades are excluded rather than counted as
      // zero, which would flatter the ranked ones. When the cohort is too large
      // to score within the read budget, rank stays null instead of guessing.
      let rank: number | null = null
      let rankedCount = 0
      const cohort = students.slice(0, MAX_RANKABLE_COHORT)
      if (cgpa !== null && cohort.length > 0) {
        try {
          const cohortScores = await fetchScoresByStudentIds(cohort.map(s => s.id))
          const byStudent = new Map<string, number[]>()
          cohortScores.forEach(row => {
            const bucket = byStudent.get(row.studentId) || []
            bucket.push(row.percentage)
            byStudent.set(row.studentId, bucket)
          })

          // Ranking needs a comparable measure for every classmate. Test
          // averages are the only cohort-wide figure available here, so the
          // rank is reported against them and labelled as such; the CGPA shown
          // beside it is still the student's real published CGPA.
          const myAverage = avgScore
          const comparators = cohort
            .map(s => {
              const values = byStudent.get(s.id) || []
              if (values.length === 0) return null
              return values.reduce((a, b) => a + b, 0) / values.length
            })
            .filter((value): value is number => value !== null)

          if (comparators.length > 0) {
            rankedCount = comparators.length
            rank = comparators.filter(value => value > myAverage).length + 1
          }
        } catch (rankError) {
          // An unavailable cohort must not invent a position.
          console.warn('[useJourney] cohort ranking unavailable:', rankError)
        }
      }

      setData({
        student: {
          id: student.id,
          name: student.name,
          regNo: student.regNo,
          course: student.course,
          batch: student.batch,
          branch: student.branch || student.course,
        },
        currentGPA: cgpa,
        cgpa,
        rank,
        totalStudents: rankedCount || students.length,
        attendance: Math.round(attendanceRate * 10) / 10,
        avgScore: Math.round(avgScore * 10) / 10,
        assessmentsTaken: scores.length,
        // The number of assessments published for this cohort is not part of
        // this read set. Reporting 0 made the progress bar read "5 / 0".
        totalAssessments: null,
        scoreTrend: percentages.slice(0, 10).reverse(),
        creditsEarned,
      })
      setAllStudents(students)
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching student journey:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (studentId && !loadedRef.current) {
      fetchData(studentId)
    }
  }, [studentId, fetchData])

  const refresh = useCallback(() => {
    loadedRef.current = false
    if (studentId) fetchData(studentId)
  }, [studentId, fetchData])

  return { data, allStudents, loading, refresh }
}