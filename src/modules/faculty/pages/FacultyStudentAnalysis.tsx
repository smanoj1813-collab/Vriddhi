import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Users, TrendingUp, TrendingDown, AlertTriangle, Award,
  Calendar, CheckCircle, Clock, Target, BarChart3, Search, Filter,
  ChevronDown, ChevronUp, Eye, BookOpen, GraduationCap, Activity, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { useAuth } from '@/modules/auth/context/AuthContext'

function normalizeMentorReference(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')
}

function isAssignedToFaculty(data: Record<string, unknown>, aliases: Set<string>): boolean {
  return [data.mentorId, data.mentorFacultyId, data.mentor, data.mentorName]
    .map(normalizeMentorReference)
    .some((value) => value && aliases.has(value))
}

interface AssessmentScore {
  assessment: string
  score: number
}

interface AttendanceRecord {
  date: string
  status: string
  subject?: string
}

interface FacultyStudent {
  id: string
  name: string
  rollNo: string
  regNo: string
  batch: string
  division: string
  mentor: string
  email: string
  phone: string
  avatar?: string
  /** null = no attendance data recorded yet (shown as "—", never a fake number). */
  attendancePercentage: number | null
  /** null = no graded assessments yet. */
  avgScore: number | null
  status: 'good' | 'average' | 'weak' | null
  assessmentScores: AssessmentScore[]
  attendanceHistory: AttendanceRecord[]
  /** Derived from the REAL numbers above — labelled observations, not canned text. */
  observations: string[]
}

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  all: { color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-500/10 dark:bg-slate-700/10', border: 'border-slate-300 dark:border-slate-700/20', label: 'All' },
  good: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Good' },
  average: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Average' },
  weak: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Weak' },
}

export default function FacultyStudentAnalysis() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''

  const [students, setStudents] = useState<FacultyStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'average' | 'weak'>('all')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const fetchStudentData = useCallback(async () => {
    if (!collegeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      // Faculty profiles are keyed by a stable code such as FAC001, while the
      // signed-in identity and newer imports use the Auth uid. Load the caller's
      // profile and accept every historical alias when selecting assignments.
      const facultyUid = user?.uid || user?.id || ''
      const [studentSnap, facultySnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId))),
        facultyUid
          ? getDocs(query(collection(db, 'faculty'), where('uid', '==', facultyUid), limit(2)))
          : Promise.resolve(null),
      ])
      const facultyProfile = facultySnap?.docs[0]
      const facultyData = facultyProfile?.data() || {}
      const facultyName = String(
        facultyData.name ||
        `${facultyData.firstName || ''} ${facultyData.lastName || ''}`.trim() ||
        user?.name || ''
      )
      const mentorAliases = new Set(
        [
          facultyUid,
          facultyProfile?.id,
          facultyData.facultyId,
          facultyData.id,
          facultyData.email,
          facultyName,
          user?.email,
          user?.name,
        ].map(normalizeMentorReference).filter(Boolean)
      )
      const assignedStudentDocs = studentSnap.docs.filter((student) =>
        isAssignedToFaculty(student.data(), mentorAliases)
      )

      // ─── Real attendance: per-student rows written with every save ────────
      // attendanceSummary rows are per SESSION (they carry no studentId), so
      // the only honest per-student source is attendanceRecords. Present,
      // late and on-duty all count as attended — the same rule the student
      // attendance page applies.
      const recordsSnap = await getDocs(
        query(collection(db, 'attendanceRecords'), where('collegeId', '==', collegeId), limit(1000))
      ).catch(() => null)
      interface StudentAttendanceRoll {
        total: number
        attended: number
        history: AttendanceRecord[]
      }
      const attendanceMap = new Map<string, StudentAttendanceRoll>()
      if (recordsSnap) {
        const rows = recordsSnap.docs
          .map((d) => {
            const data = d.data()
            return {
              studentId: String(data.studentId || ''),
              date: String(data.date || ''),
              status: String(data.status || ''),
              subject: data.subject ? String(data.subject) : undefined,
            }
          })
          .filter((r) => r.studentId && r.date)
          .sort((a, b) => b.date.localeCompare(a.date))
        rows.forEach((row) => {
          const roll = attendanceMap.get(row.studentId) || { total: 0, attended: 0, history: [] }
          roll.total += 1
          // status values: present | absent | late | onDuty | leave | medicalLeave
          if (['present', 'late', 'onduty'].includes(row.status.toLowerCase())) roll.attended += 1
          if (roll.history.length < 8) {
            roll.history.push({ date: row.date, status: row.status, subject: row.subject })
          }
          attendanceMap.set(row.studentId, roll)
        })
      }

      // ─── Real scores: graded test attempts (faculty may read these) ───────
      // gradeRecords are registrar-written and NOT readable by faculty per the
      // security rules, which is why the old fallback invented a 76%. The
      // attempts in studentAssessments carry the collegeId and percentage.
      const attemptsSnap = await getDocs(
        query(collection(db, 'studentAssessments'), where('collegeId', '==', collegeId), limit(500))
      ).catch(() => null)
      const testsSnap = await getDocs(
        query(collection(db, 'scheduledTests'), where('collegeId', '==', collegeId), limit(200))
      ).catch(() => null)
      const testTitles = new Map<string, string>()
      testsSnap?.docs.forEach((d) => {
        const title = String(d.data().title || '').trim()
        if (title) testTitles.set(d.id, title)
      })

      interface AttemptRow {
        studentId: string
        label: string
        score: number
        at: number
      }
      const attemptsByStudent = new Map<string, AttemptRow[]>()
      attemptsSnap?.docs.forEach((d) => {
        const data = d.data()
        const studentId = String(data.studentId || '')
        const percentage = Number(data.percentage)
        if (!studentId || !Number.isFinite(percentage)) return
        if (!['submitted', 'graded'].includes(String(data.status || ''))) return
        const testId = String(data.testId || data.assessmentId || '')
        const submittedAt = data.submittedAt?.toDate?.().getTime() || 0
        const row: AttemptRow = {
          studentId,
          label: testTitles.get(testId) || (testId ? `Test ${testId.slice(0, 6)}` : 'Assessment'),
          score: Math.round(percentage),
          at: submittedAt,
        }
        const list = attemptsByStudent.get(studentId) || []
        list.push(row)
        attemptsByStudent.set(studentId, list)
      })

      const loadedStudents: FacultyStudent[] = assignedStudentDocs.map(docSnap => {
        const d = docSnap.data()
        const sid = docSnap.id
        const regNo = d.regNo || d.rollNo || sid

        const roll = attendanceMap.get(sid) || attendanceMap.get(regNo)
        const docAttendance = Number(d.attendancePercentage ?? d.attendance)
        const attendancePercentage = roll && roll.total > 0
          ? Math.round((roll.attended / roll.total) * 100)
          : Number.isFinite(docAttendance) && docAttendance > 0
            ? Math.round(docAttendance)
            : null

        const attempts = (attemptsByStudent.get(sid) || attemptsByStudent.get(regNo) || [])
          .sort((a, b) => b.at - a.at)
        const docAvg = Number(d.avgScore ?? d.averageScore)
        const avgScore = attempts.length > 0
          ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
          : Number.isFinite(docAvg) && docAvg > 0
            ? Math.round(docAvg)
            : null

        const status: 'good' | 'average' | 'weak' | null =
          attendancePercentage === null && avgScore === null
            ? null
            : (attendancePercentage ?? 100) >= 85 && (avgScore ?? 100) >= 75
              ? 'good'
              : (attendancePercentage ?? 100) < 75 || (avgScore ?? 100) < 50
                ? 'weak'
                : 'average'

        // Observations are computed from the real numbers — no canned copy.
        const observations: string[] = []
        if (attendancePercentage !== null && attendancePercentage < 75) observations.push('Attendance below 75%')
        if (attendancePercentage !== null && attendancePercentage >= 90) observations.push('Excellent attendance')
        if (attempts.length === 0 && attendancePercentage !== null) observations.push('No graded assessments yet')
        if (avgScore !== null && avgScore >= 75) observations.push('Strong assessment scores')
        if (avgScore !== null && avgScore < 50) observations.push('Needs assessment support')
        if (observations.length === 0) observations.push('Limited data recorded')

        return {
          id: sid,
          name: d.name || 'Student',
          rollNo: d.rollNo || regNo,
          regNo,
          batch: d.batch || '',
          division: d.division || d.section || '',
          mentor: d.mentor || d.mentorName || facultyName || user?.name || '',
          email: d.email || '',
          phone: d.phone || d.parentPhone || '',
          avatar: d.avatar,
          attendancePercentage,
          avgScore,
          status,
          assessmentScores: attempts.slice(0, 5).map((a) => ({ assessment: a.label, score: a.score })),
          attendanceHistory: roll?.history ?? [],
          observations,
        }
      })

      setStudents(loadedStudents)
    } catch (err) {
      console.error('[FacultyStudentAnalysis] fetch error:', err)
      setStudents([])
      setLoadError(
        err instanceof Error
          ? `Could not load assigned students: ${err.message}`
          : 'Could not load assigned students.'
      )
    } finally {
      setLoading(false)
    }
  }, [collegeId, user?.uid, user?.id, user?.email, user?.name])

  useEffect(() => {
    fetchStudentData()
  }, [fetchStudentData])

  const filteredStudents = useMemo(() => {
    return students.filter((s: FacultyStudent) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.regNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === 'all' || s.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [students, searchQuery, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = students.length
    const good = students.filter(s => s.status === 'good').length
    const average = students.filter(s => s.status === 'average').length
    const weak = students.filter(s => s.status === 'weak').length
    const attendanceValues = students
      .map(s => s.attendancePercentage)
      .filter((v): v is number => v !== null)
    const scoreValues = students
      .map(s => s.avgScore)
      .filter((v): v is number => v !== null)
    const avgAttendance = attendanceValues.length === 0
      ? null
      : Math.round(attendanceValues.reduce((sum, v) => sum + v, 0) / attendanceValues.length)
    const avgScore = scoreValues.length === 0
      ? null
      : Math.round(scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length)
    return { total, good, average, weak, avgAttendance, avgScore }
  }, [students])

  // Chart data — students with no data are excluded rather than bucketed as 0.
  const attendanceDistribution = useMemo(() => [
    { name: 'Excellent (90%+)', value: students.filter(s => (s.attendancePercentage ?? -1) >= 90).length, color: '#22c55e' },
    { name: 'Good (75-89%)', value: students.filter(s => s.attendancePercentage !== null && s.attendancePercentage >= 75 && s.attendancePercentage < 90).length, color: '#6366f1' },
    { name: 'Poor (<75%)', value: students.filter(s => s.attendancePercentage !== null && s.attendancePercentage < 75).length, color: '#ef4444' },
  ], [students])

  const scoreDistribution = useMemo(() => [
    { name: 'A (80-100%)', value: students.filter(s => (s.avgScore ?? -1) >= 80).length, color: '#22c55e' },
    { name: 'B (60-79%)', value: students.filter(s => s.avgScore !== null && s.avgScore >= 60 && s.avgScore < 80).length, color: '#6366f1' },
    { name: 'C (<60%)', value: students.filter(s => s.avgScore !== null && s.avgScore < 60).length, color: '#ef4444' },
  ], [students])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/faculty"
          className="p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:border-teal-500/30 text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Analysis</h1>
          <p className="text-slate-600 dark:text-slate-400">Assigned students academic and attendance performance overview</p>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
          <button type="button" onClick={() => void fetchStudentData()} className="ml-auto font-medium underline">
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-500 mb-1">Good</p>
          <p className="text-2xl font-bold text-emerald-500">{stats.good}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-500 mb-1">Average</p>
          <p className="text-2xl font-bold text-amber-500">{stats.average}</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-xs text-rose-500 mb-1">Weak</p>
          <p className="text-2xl font-bold text-rose-500">{stats.weak}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-500 mb-1">Avg Attendance</p>
          <p className="text-2xl font-bold text-blue-500">{stats.avgAttendance !== null ? `${stats.avgAttendance}%` : '—'}</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-xs text-purple-500 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-purple-500">{stats.avgScore !== null ? `${stats.avgScore}%` : '—'}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading student analysis records...</p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Attendance Distribution */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                Attendance Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={attendanceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {attendanceDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-500" />
                Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={scoreDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {scoreDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name or reg no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'good', 'average', 'weak'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    filterStatus === status
                      ? `${statusConfig[status].bg} ${statusConfig[status].color} ${statusConfig[status].border}`
                      : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            {filteredStudents.map(student => {
              const isExpanded = expandedStudent === student.id
              return (
                <div
                  key={student.id}
                  className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                >
                  <div
                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-500 font-bold flex items-center justify-center text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{student.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">{student.regNo} • Div {student.division}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className={`font-semibold ${student.attendancePercentage !== null && student.attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {student.attendancePercentage !== null ? `${student.attendancePercentage}%` : '—'}
                        </p>
                        <p className="text-[10px] text-slate-400">Attendance</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${student.avgScore !== null ? (student.avgScore >= 75 ? 'text-emerald-500' : student.avgScore >= 60 ? 'text-amber-500' : 'text-rose-500') : 'text-slate-400'}`}>
                          {student.avgScore !== null ? `${student.avgScore}%` : '—'}
                        </p>
                        <p className="text-[10px] text-slate-400">Avg Score</p>
                      </div>
                      {student.status && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[student.status].bg} ${statusConfig[student.status].color} ${statusConfig[student.status].border}`}>
                          {statusConfig[student.status].label}
                        </span>
                      )}
                      <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700/50 pt-4 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="text-slate-500"><span className="font-medium text-slate-700 dark:text-slate-300">Email:</span> {student.email || '—'}</p>
                          <p className="text-slate-500"><span className="font-medium text-slate-700 dark:text-slate-300">Mentor:</span> {student.mentor || '—'}</p>
                          {student.batch && (
                            <p className="text-slate-500"><span className="font-medium text-slate-700 dark:text-slate-300">Batch:</span> {student.batch}{student.division ? ` • Div ${student.division}` : ''}</p>
                          )}
                          <p className="font-medium text-slate-700 dark:text-slate-300 pt-1">Observations</p>
                          <div className="flex gap-1 flex-wrap">
                            {student.observations.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[11px]">{s}</span>
                            ))}
                          </div>
                          {student.attendanceHistory.length > 0 && (
                            <>
                              <p className="font-medium text-slate-700 dark:text-slate-300 pt-1">Recent attendance</p>
                              <div className="flex gap-1 flex-wrap">
                                {student.attendanceHistory.map((record, i) => (
                                  <span
                                    key={`${record.date}-${i}`}
                                    title={`${record.date}${record.subject ? ` • ${record.subject}` : ''}`}
                                    className={`px-2 py-0.5 rounded-md text-[11px] border ${
                                      ['present', 'late', 'onduty'].includes(record.status.toLowerCase())
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    }`}
                                  >
                                    {record.date.slice(5)} {['present', 'late', 'onduty'].includes(record.status.toLowerCase()) ? '✓' : '✗'}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Recent Assessment Performance</p>
                          <div className="space-y-1.5">
                            {student.assessmentScores.length === 0 ? (
                              <p className="text-slate-500">No graded assessments recorded yet.</p>
                            ) : (
                              student.assessmentScores.map((score, i) => (
                                <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-700/30">
                                  <span className="text-slate-600 dark:text-slate-400">{score.assessment}</span>
                                  <span className="font-bold text-teal-500">{score.score}%</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filteredStudents.length === 0 && (
              <div className="p-12 text-center bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-2xl">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">
                  {students.length === 0
                    ? 'No students are assigned to your faculty profile yet.'
                    : 'No students found matching filters.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
