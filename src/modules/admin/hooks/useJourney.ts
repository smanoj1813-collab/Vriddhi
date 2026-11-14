// src/hooks/useJourney.ts
// React hook for journey data — one-time fetch, manual refresh
// NO onSnapshot. Read budget protection.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getCurriculumProgress } from '../api/classSessionApi'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { fetchFacultyProfile, facultyIdentityFor, type FacultyTimelineIdentity } from '@/shared/api/facultyProfileApi'
import { summarizeMenteePerformance, yearsOfService } from '@/modules/faculty/utils/facultyJourney'
import {
  fetchMilestones,
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
  StudentRecord,
  ScoreRecord,
  AttendanceRecord,
} from '../api/journeyApi'
import {
  fetchCollegeMilestonesFromRealData,
  fetchFacultyTimelineFromRealData,
  fetchStudentTimelineFromRealData,
} from '../api/journeyMilestonesApi'

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
  timelineIdentity: FacultyTimelineIdentity
  profileMissing: boolean
  warnings: string[]
  // Unavailable records remain null, not invented zeroes or percentages.
  yearsOfService: number | null
  totalStudents: number | null
  avgStudentScore: number | null
  avgClassesPerWeek: number | null
  topicsCovered: number | null
  topicsPending: number | null
  papersUploaded: number | null
  avgAttendance: number | null
  studentPerformanceDistribution: { good: number; average: number; weak: number } | null
  goodStudentsCount: number | null
  weakStudentsCount: number | null
  scoredStudentsCount: number | null
  ungradedStudentsCount: number | null
}

export function useCollegeJourney() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Try real-data milestones first (exam sessions, fees, challans, notifications, UUCMS sync)
      const realData = await fetchCollegeMilestonesFromRealData()
      if (realData.length > 0) {
        setMilestones(realData)
      } else {
        // Fallback to legacy subcollection milestones
        const data = await fetchMilestones()
        setMilestones(data)
      }
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching milestones:', error)
      // Final fallback to legacy
      try {
        const data = await fetchMilestones()
        setMilestones(data)
      } catch {}
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

// Reload when the resolved faculty identity changes; never keep the previous
// account's timeline or mistake a failed query for an empty activity history.
export function useFacultyTimeline(identity: FacultyTimelineIdentity | null | undefined) {
  const key = identity ? JSON.stringify(identity) : ''
  const request = useRef(0)
  const [state, setState] = useState<{ key: string; milestones: Milestone[]; loading: boolean; error: string | null; limited: boolean }>({ key: '', milestones: [], loading: false, error: null, limited: false })
  const current = state.key === key ? state : { milestones: [], loading: !!identity, error: null, limited: false }
  const fetchData = useCallback(async () => {
    const run = ++request.current
    if (!key) {
      setState({ key, milestones: [], loading: false, error: null, limited: false })
      return
    }
    setState({ key, milestones: [], loading: true, error: null, limited: false })
    try {
      const result = await fetchFacultyTimelineFromRealData(JSON.parse(key) as FacultyTimelineIdentity)
      if (run === request.current) setState({ key, ...result, loading: false, error: null })
    } catch (error) {
      console.error('[useFacultyTimeline] failed', error)
      if (run === request.current) setState({ key, milestones: [], loading: false, limited: false, error: 'Your activity timeline could not be loaded. Retry to check your recorded assessments and papers.' })
    }
  }, [key])

  useEffect(() => {
    void fetchData()
    return () => { request.current++ }
  }, [fetchData])
  return { ...current, refresh: fetchData }
}

// Real student timeline from fees, challans, hall tickets, grades, assessments
export function useStudentTimeline(studentId: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchStudentTimelineFromRealData(studentId)
      setMilestones(data)
      loadedRef.current = true
    } catch (e) {
      console.error('[useStudentTimeline] failed', e)
    } finally {
      setLoading(false)
    }
  }, [studentId])

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
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid || user?.id || ''
  const collegeId = user?.collegeId || ''
  const email = user?.email || ''
  const name = user?.name || user?.displayName || ''
  const department = user?.department || ''
  const key = JSON.stringify([uid, collegeId, email, name, department])
  const request = useRef(0)
  const [state, setState] = useState<{ key: string; data: FacultyJourneyData | null; loading: boolean; error: string | null }>({ key: '', data: null, loading: true, error: null })
  const current = !authLoading && state.key === key ? state : { data: null, loading: true, error: null }

  const fetchData = useCallback(async () => {
    const run = ++request.current
    setState({ key, data: null, loading: true, error: null })
    if (authLoading) return
    try {
      if (!uid) throw new Error('Sign in again to load your faculty journey.')
      if (!collegeId) throw new Error('Your sign-in is not linked to a college. Ask your college administrator to repair your college access, then sign in again.')
      const profile = await fetchFacultyProfile({ collegeId, uid, email })
      if (run !== request.current) return
      const identity = facultyIdentityFor({ uid, collegeId, email, name }, profile)
      const warnings: string[] = []
      const [menteeResult, progressResult] = await Promise.allSettled([
        fetchStudentsByMentor([...identity.ids, ...identity.emails, ...identity.names], collegeId),
        getCurriculumProgress({ facultyId: profile?.id || uid }),
      ])
      if (run !== request.current) return

      let totalStudents: number | null = null
      let outcomes: Pick<FacultyJourneyData, 'avgStudentScore' | 'studentPerformanceDistribution' | 'goodStudentsCount' | 'weakStudentsCount' | 'scoredStudentsCount' | 'ungradedStudentsCount'> = {
        avgStudentScore: null, studentPerformanceDistribution: null, goodStudentsCount: null,
        weakStudentsCount: null, scoredStudentsCount: null, ungradedStudentsCount: null,
      }
      if (menteeResult.status === 'fulfilled') {
        totalStudents = menteeResult.value.length
        try {
          const ids = menteeResult.value.map(student => student.id)
          const scores = await fetchScoresByStudentIds(ids, collegeId)
          outcomes = summarizeMenteePerformance(ids, scores)
        } catch (error) {
          console.warn('[useFacultyJourney] mentee scores unavailable:', error)
          warnings.push('Mentee scores are unavailable. Refresh to try again; no performance conclusion is shown for missing results.')
        }
      } else {
        console.warn('[useFacultyJourney] mentees unavailable:', menteeResult.reason)
        warnings.push(menteeResult.reason instanceof Error && menteeResult.reason.message.includes('too large')
          ? menteeResult.reason.message : 'The mentee roster could not be loaded. Refresh to try again.')
      }

      let topicsCovered: number | null = null
      let topicsPending: number | null = null
      let avgAttendance: number | null = null
      let avgClassesPerWeek: number | null = null
      if (progressResult.status === 'fulfilled') {
        // Never fall back to college-wide totals. Self-service progress accepts
        // uid/profile aliases, while administrative readers receive our filter.
        const own = progressResult.value.faculty.filter(row => identity.ids.includes(row.facultyId))
        topicsCovered = own.reduce((sum, row) => sum + row.topics.covered, 0)
        topicsPending = own.reduce((sum, row) => sum + row.topics.pending, 0)
        const marked = own.reduce((sum, row) => sum + row.attendance.marked, 0)
        const present = own.reduce((sum, row) => sum + row.attendance.present, 0)
        avgAttendance = marked > 0 ? Math.round(present / marked * 1000) / 10 : null
        // The callable returns a term average, NOT a count for this week.
        // Self-service alias rows share the same sessions, so do not sum them.
        const weeks = Math.max(0, ...own.map(row => row.pace.weeksElapsed))
        const completed = Math.max(0, ...own.map(row => row.pace.completed))
        avgClassesPerWeek = weeks > 0 ? Math.round(completed / weeks * 10) / 10 : null
      } else {
        console.warn('[useFacultyJourney] teaching progress unavailable:', progressResult.reason)
        warnings.push('Teaching progress is unavailable. Refresh to try again; coverage and attendance have not been assumed.')
      }

      const data: FacultyJourneyData = {
        faculty: {
          name: profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || name || email || 'Faculty member',
          title: profile?.designation || 'Faculty',
          department: profile?.department || department || '',
        },
        timelineIdentity: identity,
        profileMissing: !profile,
        warnings,
        yearsOfService: yearsOfService(profile?.joiningDate),
        totalStudents,
        ...outcomes,
        avgClassesPerWeek,
        topicsCovered,
        topicsPending,
        papersUploaded: profile?.papersUploaded ?? null,
        avgAttendance,
      }
      if (run === request.current) setState({ key, data, loading: false, error: null })
    } catch (error) {
      console.error('[useFacultyJourney] failed:', error)
      const message = error instanceof Error && (!uid || !collegeId || error.message.includes('More than one faculty profile'))
        ? error.message : 'Your faculty profile could not be loaded. Retry, or sign out and back in if your college access was recently changed.'
      if (run === request.current) setState({ key, data: null, loading: false, error: message })
    }
  }, [key, uid, collegeId, email, name, department, authLoading])

  useEffect(() => {
    void fetchData()
    return () => { request.current++ }
  }, [fetchData])
  return { ...current, refresh: fetchData }
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