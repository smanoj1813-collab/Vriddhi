// src/hooks/useDashboardData.ts
// React hook for dashboard data — one-time fetch, manual refresh
// Re-exports types from dashboardApi for convenience

export type { Student, AttendanceRecord, Assessment, AssessmentScore, Activity, DashboardStats } from '../api/dashboardApi'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  fetchStudents,
  fetchAttendanceRecords,
  fetchAssessments,
  fetchScores,
  fetchActivities,
  fetchAggregatedStats,
  fetchDashboardCounts,
  getStudentCount,
  getAttendanceRate,
  getWeeklyAttendanceByDay,
  getBranchAttendanceTotals,
  getPerformanceTrend,
  getTopPerformers,
  getActiveAssessmentsCount,
  getPassRate,
  Student,
  AttendanceRecord,
  Assessment,
  AssessmentScore,
  Activity,
  DashboardStats,
} from '../api/dashboardApi'
import { docInDepartment } from '@/shared/utils/departmentScope'

export interface DashboardFilters {
  studentBranch: string
  studentBatch: string
  attendanceBranch: string
  attendanceBatch: string
}

export interface DashboardDataOptions {
  /**
   * When set (HOD/admin portal), students — and the attendance/scores that
   * belong to them — are filtered to this department. Principal and other
   * college-wide viewers simply omit the option.
   */
  department?: string | null
}

export function useDashboardData(options?: DashboardDataOptions) {
  const department = options?.department ?? null
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DashboardFilters>({
    studentBranch: 'all',
    studentBatch: 'all',
    attendanceBranch: 'all',
    attendanceBatch: 'all',
  })

  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [scores, setScores] = useState<AssessmentScore[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const loadedRef = useRef(false)

  // ─── FETCH ALL DATA ──────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const aggregatedStats = await fetchAggregatedStats()
      if (aggregatedStats) {
        setStats(aggregatedStats)
      }

      // Item 3.2: raw counts from aggregation queries (one read each) instead of
      // deriving them from at most 500 downloaded rows.
      const counts = await fetchDashboardCounts()

      const [studentsData, attendanceData, assessmentsData, scoresData, activitiesData] = await Promise.all([
        fetchStudents(),
        fetchAttendanceRecords(),
        fetchAssessments(),
        fetchScores(),
        fetchActivities(),
      ])

      // Department scope (HOD/admin): keep the viewer's students, then keep
      // only the attendance/scores that belong to them. Tolerant of untagged
      // legacy rows — see shared/utils/departmentScope.
      const scope = (department || '').trim()
      let studentsOut = studentsData
      let attendanceOut = attendanceData
      let scoresOut = scoresData
      if (scope) {
        studentsOut = studentsData.filter((s) => docInDepartment(s, scope))
        const scopedIds = new Set(studentsOut.map((s) => s.id))
        attendanceOut = attendanceData.filter((r) => scopedIds.has(r.studentId))
        scoresOut = scoresData.filter((s) => scopedIds.has(s.studentId))
      }

      setStudents(studentsOut)
      setAttendanceRecords(attendanceOut)
      setAssessments(assessmentsData)
      setScores(scoresOut)
      setActivities(activitiesData)
      // Item 3.2: aggregated totals win over the row-derived ones (which were
      // capped at 500 rows). Kept out of `stats` when the aggregation failed.
      if (Object.keys(counts).length > 0) {
        setStats((prev) => {
          const base: DashboardStats = prev ?? {
            totalStudents: 0,
            totalAssessments: 0,
            totalScores: 0,
            avgAttendance: 0,
            passRate: 0,
            activeAssessments: 0,
          }
          return { ...base, ...counts }
        })
      }
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [department])

  useEffect(() => {
    if (!loadedRef.current) {
      fetchAllData()
    }
  }, [fetchAllData])

  // ─── FILTERED COMPUTED DATA ──────────────────────────
  const filteredStudentCount = useMemo(() =>
    getStudentCount(students, { course: filters.studentBranch, batch: filters.studentBatch }),
    [students, filters.studentBranch, filters.studentBatch]
  )

  const attendanceRate = useMemo(() =>
    getAttendanceRate(attendanceRecords, { course: filters.attendanceBranch, batch: filters.attendanceBatch }),
    [attendanceRecords, filters.attendanceBranch, filters.attendanceBatch]
  )

  const weeklyAttendance = useMemo(() =>
    getWeeklyAttendanceByDay(attendanceRecords),
    [attendanceRecords]
  )

  const branchTotals = useMemo(() =>
    getBranchAttendanceTotals(attendanceRecords),
    [attendanceRecords]
  )

  const performanceTrend = useMemo(() =>
    getPerformanceTrend(scores, assessments),
    [scores, assessments]
  )

  const topPerformers = useMemo(() =>
    getTopPerformers(students, scores, assessments, 5),
    [students, scores, assessments]
  )

  const activeAssessments = useMemo(() =>
    getActiveAssessmentsCount(assessments),
    [assessments]
  )

  const passRate = useMemo(() =>
    getPassRate(scores),
    [scores]
  )

  // ─── ACTIONS ─────────────────────────────────────────
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const refreshData = useCallback(() => {
    loadedRef.current = false
    fetchAllData()
  }, [fetchAllData])

  return {
    loading,
    filters,
    filteredStudentCount,
    attendanceRate,
    weeklyAttendance,
    branchTotals,
    performanceTrend,
    topPerformers,
    activeAssessments,
    passRate,
    students,
    attendanceRecords,
    assessments,
    scores,
    activities,
    stats,
    updateFilters,
    refreshData,
  }
}