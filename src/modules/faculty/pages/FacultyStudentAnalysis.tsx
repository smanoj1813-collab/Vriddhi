import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Users, TrendingUp, TrendingDown, AlertTriangle, Award,
  Calendar, CheckCircle, Clock, Target, BarChart3, Search, Filter,
  ChevronDown, ChevronUp, Eye, BookOpen, GraduationCap, Activity
} from 'lucide-react'
// TODO: Fetch from Firebase
interface AssessmentScore {
  assessment: string
  score: number
}
interface AttendanceRecord {
  date: string
  status: string
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
  avatar: string
  attendancePercentage: number
  avgScore: number
  status: 'good' | 'average' | 'weak'
  assessmentScores: AssessmentScore[]
  attendanceHistory: AttendanceRecord[]
  strengths: string[]
  weaknesses: string[]
}
const facultyStudents: FacultyStudent[] = []
const facultyTopics: any[] = []
const currentFaculty = { name: 'Faculty', department: 'General', subject: 'General' }

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

export default function FacultyStudentAnalysis() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'average' | 'weak'>('all')
  const [selectedStudent, setSelectedStudent] = useState<FacultyStudent | null>(null)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const filteredStudents = useMemo(() => {
    return facultyStudents.filter((s: FacultyStudent) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.regNo.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === 'all' || s.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [searchQuery, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = facultyStudents.length
    const good = facultyStudents.filter((s: FacultyStudent) => s.status === 'good').length
    const average = facultyStudents.filter((s: FacultyStudent) => s.status === 'average').length
    const weak = facultyStudents.filter((s: FacultyStudent) => s.status === 'weak').length
    const avgAttendance = Math.round(facultyStudents.reduce((sum: number, s: FacultyStudent) => sum + s.attendancePercentage, 0) / total)
    const avgScore = Math.round(facultyStudents.reduce((sum: number, s: FacultyStudent) => sum + s.avgScore, 0) / total)
    return { total, good, average, weak, avgAttendance, avgScore }
  }, [])

  // Chart data
  const attendanceDistribution = [
    { name: 'Excellent (90%+)', value: facultyStudents.filter((s: FacultyStudent) => s.attendancePercentage >= 90).length, color: '#22c55e' },
    { name: 'Good (75-89%)', value: facultyStudents.filter((s: FacultyStudent) => s.attendancePercentage >= 75 && s.attendancePercentage < 90).length, color: '#6366f1' },
    { name: 'Poor (<75%)', value: facultyStudents.filter((s: FacultyStudent) => s.attendancePercentage < 75).length, color: '#ef4444' },
  ]

  const scoreDistribution = [
    { name: 'A (80-100%)', value: facultyStudents.filter((s: FacultyStudent) => s.avgScore >= 80).length, color: '#22c55e' },
    { name: 'B (60-79%)', value: facultyStudents.filter((s: FacultyStudent) => s.avgScore >= 60 && s.avgScore < 80).length, color: '#6366f1' },
    { name: 'C (<60%)', value: facultyStudents.filter((s: FacultyStudent) => s.avgScore < 60).length, color: '#ef4444' },
  ]

  const assessmentTrend = facultyStudents[0]?.assessmentScores.map((a: AssessmentScore, i: number) => ({
    name: a.assessment,
    classAvg: Math.round(facultyStudents.reduce((sum: number, s: FacultyStudent) => sum + (s.assessmentScores[i]?.score || 0), 0) / facultyStudents.length),
    highest: Math.max(...facultyStudents.map((s: FacultyStudent) => s.assessmentScores[i]?.score || 0)),
    lowest: Math.min(...facultyStudents.map((s: FacultyStudent) => s.assessmentScores[i]?.score || 0)),
  })) || []

  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    all: { color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-500/10 dark:bg-slate-700/10', border: 'border-slate-300 dark:border-slate-700/20', label: 'All' },
    good: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Good' },
    average: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Average' },
    weak: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Weak' },
  }

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
          <p className="text-slate-600 dark:text-slate-400">{currentFaculty.subject} • Assigned students performance overview</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-1">Good</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.good}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-400 mb-1">Average</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.average}</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-xs text-rose-400 mb-1">Weak</p>
          <p className="text-2xl font-bold text-rose-400">{stats.weak}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-400 mb-1">Avg Attendance</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgAttendance}%</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p className="text-xs text-purple-400 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgScore}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Attendance Distribution */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
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
                <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
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
                <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Trend */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Assessment Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assessmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
              <Bar dataKey="classAvg" fill="#6366f1" radius={[4, 4, 0, 0]} name="Class Avg" />
              <Bar dataKey="highest" fill="#22c55e" radius={[4, 4, 0, 0]} name="Highest" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'good', 'average', 'weak'] as const).map(status => {
            const config = statusConfig[status]
            const count = status === 'all' ? facultyStudents.length : facultyStudents.filter((s: FacultyStudent) => s.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filterStatus === status
                    ? `${config.bg} ${config.color} border ${config.border}`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {config.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filteredStudents.map((student: FacultyStudent) => {
          const config = statusConfig[student.status]
          const isExpanded = expandedStudent === student.id

          return (
            <div
              key={student.id}
              className={`rounded-xl bg-white dark:bg-slate-800/50 border shadow-sm transition-all ${
                student.status === 'weak' ? 'border-rose-500/20' :
                student.status === 'good' ? 'border-emerald-500/20' :
                'border-slate-200 dark:border-slate-700/50'
              }`}
            >
              {/* Student Row Header */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {student.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{student.rollNo} • {student.division} • {student.mentor}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className={`font-semibold ${student.attendancePercentage >= 85 ? 'text-emerald-400' : student.attendancePercentage >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {student.attendancePercentage}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${student.avgScore >= 80 ? 'text-emerald-400' : student.avgScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {student.avgScore}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-900 dark:text-white font-semibold">{student.assessmentScores.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Assessments</p>
                  </div>
                </div>
                <button className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Info & Assessments */}
                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Email</p>
                          <p className="text-slate-700 dark:text-slate-300">{student.email}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Phone</p>
                          <p className="text-slate-700 dark:text-slate-300">{student.phone}</p>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-2 gap-3">
                        {student.strengths && student.strengths.length > 0 && (
                          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                              <Award className="w-3 h-3" /> Strengths
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {student.strengths.map((s: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {student.weaknesses && student.weaknesses.length > 0 && (
                          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                            <p className="text-xs text-rose-400 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Weaknesses
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {student.weaknesses.map((w: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assessment Scores */}
                      <div>
                        <h4 className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Assessment Scores
                        </h4>
                        <div className="space-y-2">
                          {student.assessmentScores.map((score: AssessmentScore, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                              <span className="text-xs text-slate-600 dark:text-slate-400 w-20">{score.assessment}</span>
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${score.score >= 80 ? 'bg-emerald-500' : score.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${score.score}%` }}
                                />
                              </div>
                              <span className={`text-xs font-semibold w-12 text-right ${score.score >= 80 ? 'text-emerald-400' : score.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {score.score}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Attendance & Charts */}
                    <div className="space-y-4">
                      {/* Attendance History */}
                      <div>
                        <h4 className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Recent Attendance
                        </h4>
                        <div className="grid grid-cols-6 gap-1">
                          {student.attendanceHistory.slice(-6).map((record: AttendanceRecord, i: number) => (
                            <div key={i} className="text-center">
                              <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-xs ${
                                record.status === 'present' ? 'bg-emerald-500/20 text-emerald-400' :
                                record.status === 'absent' ? 'bg-rose-500/20 text-rose-400' :
                                record.status === 'late' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-400'
                              }`}>
                                {record.status === 'present' ? 'P' : record.status === 'absent' ? 'A' : record.status === 'late' ? 'L' : 'OD'}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">{record.date.slice(-2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mini Chart */}
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Score Trend</p>
                        <ResponsiveContainer width="100%" height={120}>
                          <AreaChart data={student.assessmentScores.map((s: AssessmentScore) => ({ name: s.assessment, score: s.score }))}>
                            <defs>
                              <linearGradient id={`grad-${student.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#475569" fontSize={9} />
                            <YAxis stroke="#475569" fontSize={9} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
                            <Area type="monotone" dataKey="score" stroke="#6366f1" fill={`url(#grad-${student.id})`} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          to={`/faculty/attendance`}
                          className="flex-1 px-3 py-2 rounded-lg text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-100 dark:bg-teal-900/30 transition-all text-center"
                        >
                          Mark Attendance
                        </Link>
                        <button className="flex-1 px-3 py-2 rounded-lg text-xs bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                          View Full Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center rounded-xl bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 border-dashed">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No students found</p>
          </div>
        )}
      </div>
    </div>
  )
}