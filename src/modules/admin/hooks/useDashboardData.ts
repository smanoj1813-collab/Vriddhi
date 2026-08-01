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

export interface DashboardFilters {
  studentBranch: string
  studentBatch: string
  attendanceBranch: string
  attendanceBatch: string
}

export function useDashboardData() {
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

      const [studentsData, attendanceData, assessmentsData, scoresData, activitiesData] = await Promise.all([
        fetchStudents(),
        fetchAttendanceRecords(),
        fetchAssessments(),
        fetchScores(),
        fetchActivities(),
      ])

      setStudents(studentsData)
      setAttendanceRecords(attendanceData)
      setAssessments(assessmentsData)
      setScores(scoresData)
      setActivities(activitiesData)
      loadedRef.current = true
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

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