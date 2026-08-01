// src/hooks/useJourney.ts
// React hook for journey data — one-time fetch, manual refresh
// NO onSnapshot. Read budget protection.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  Milestone,
  FacultyRecord,
  StudentRecord,
  ScoreRecord,
  AttendanceRecord,
} from '../api/journeyApi'

export interface StudentJourneyData {
  student: { id: string; name: string; regNo: string; course: string; batch: string; branch: string }
  currentGPA: number
  cgpa: number
  rank: number
  totalStudents: number
  attendance: number
  avgScore: number
  assessmentsTaken: number
  totalAssessments: number
  scoreTrend: number[]
}

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
        classesThisWeek: 0,
        topicsCovered: faculty.topicsCovered || 0,
        topicsPending: faculty.topicsPending || 0,
        papersUploaded: faculty.papersUploaded || 0,
        avgAttendance: faculty.avgAttendance || 85,
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
      const [student, scores, attendance, students] = await Promise.all([
        fetchStudentById(id),
        fetchScoresByStudentId(id),
        fetchAttendanceByStudentId(id),
        fetchAllStudents(),
      ])

      if (!student) {
        setLoading(false)
        return
      }

      const percentages = scores.map(s => s.percentage)
      const avgScore = percentages.length ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0
      const gpa = Math.min(10, (avgScore / 100) * 10)

      const presentCount = attendance.filter(r => r.status === 'present').length
      const attendanceRate = attendance.length ? (presentCount / attendance.length) * 100 : 0

      setData({
        student: {
          id: student.id,
          name: student.name,
          regNo: student.regNo,
          course: student.course,
          batch: student.batch,
          branch: student.branch || student.course,
        },
        currentGPA: Math.round(gpa * 10) / 10,
        cgpa: Math.round(gpa * 10) / 10,
        rank: 1,
        totalStudents: students.length,
        attendance: Math.round(attendanceRate * 10) / 10,
        avgScore: Math.round(avgScore * 10) / 10,
        assessmentsTaken: scores.length,
        totalAssessments: 0,
        scoreTrend: percentages.slice(0, 10).reverse(),
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