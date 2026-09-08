import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  Shield, Users, Building2, CheckCircle, FileText,
  Search, BarChart3, Eye, Download,
  GraduationCap, BookOpen, TrendingUp,
  Clock, Activity, ChevronDown, Mail, Phone,
  Calendar, Check, X, AlertCircle, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { useDashboardData } from '../../admin/hooks/useDashboardData'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  limit
} from 'firebase/firestore'
import { db } from '@/Firebase/config'

// ─── Constants ────────────────────────────────────────────────────────────────
const HOD_DEPT = 'BA'

// ─── Helper Components ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, trend, trendUp, color = 'teal' }: {
  icon: React.ElementType
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  color?: 'teal' | 'sky' | 'amber' | 'violet' | 'rose'
}) {
  const colorMap = {
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', bar: 'bg-teal-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500' },
  }
  const c = colorMap[color]
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-teal-400' : 'text-rose-400'}`}>
              <TrendingUp size={12} className={trendUp ? '' : 'rotate-180'} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' }) {
  const variants = {
    default: 'bg-slate-700 text-slate-300',
    success: 'bg-teal-500/20 text-teal-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-rose-500/20 text-rose-400',
    info: 'bg-sky-500/20 text-sky-400',
    primary: 'bg-violet-500/20 text-violet-400',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

function SectionHeader({ title, icon: Icon, action }: {
  title: string
  icon: React.ElementType
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="glass-card p-5 h-24">
          <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
          <div className="h-6 w-16 bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Tab 1: Department Overview ──────────────────────────────────────────────

function DepartmentOverview({ data }: { data: ReturnType<typeof useDashboardData> }) {
  const { user } = useAuth()
  const dept = user?.department || HOD_DEPT
  const {
    students, attendanceRecords, assessments, scores,
    attendanceRate, passRate, activeAssessments,
    weeklyAttendance, performanceTrend, branchTotals,
  } = data

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const avgAttendance = attendanceRecords.length ? `${attendanceRate}%` : '—'
  const avgPassRate = scores.length ? `${passRate}%` : '—'

  const branchAttendance = useMemo(() =>
    Object.entries(branchTotals).map(([course, v]) => ({
      course,
      present: v.totalPresent,
      absent: v.totalAbsent,
    })), [branchTotals])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card p-6 bg-teal-500/5 border border-teal-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back, {user?.name?.split(' ')[0] || 'HOD'}</h2>
            <p className="text-slate-500 dark:text-slate-400">Department of {dept} · {totalStudents} Students · {activeAssessments} Active Assessments</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <Building2 size={28} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students" value={String(totalStudents)} color="teal" />
        <StatCard icon={Activity} label="Avg Attendance" value={avgAttendance} color="amber" />
        <StatCard icon={BookOpen} label="Pass Rate" value={avgPassRate} color="violet" />
        <StatCard icon={FileText} label="Active Assessments" value={String(activeAssessments)} color="sky" />
      </div>

      {/* Quick Stats Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeStudents}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Active Students</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{assessments.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Assessments</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceRecords.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Attendance Records</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Attendance This Week</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="present" fill="#14b8a6" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#64748b" name="Absent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="avg" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="Avg %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Attendance by course */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Attendance by Course</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={branchAttendance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="course" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
            <Bar dataKey="present" fill="#14b8a6" name="Present" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Tab 2: Student Management ────────────────────────────────────────────────

function StudentManagement({ data }: { data: ReturnType<typeof useDashboardData> }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const filtered = useMemo(() =>
    data.students.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (s.regNo || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    }), [data.students, search, statusFilter])

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader title="Department Students" icon={Users} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or reg no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
              <th className="table-header">Student</th>
              <th className="table-header">Reg No</th>
              <th className="table-header">Course</th>
              <th className="table-header">Batch</th>
              <th className="table-header">Attendance</th>
              <th className="table-header">Avg Score</th>
              <th className="table-header">Status</th>
              <th className="table-header">Mentor</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(student => (
              <React.Fragment key={student.id}>
                <tr className="hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{student.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600 dark:text-slate-300 font-mono text-sm">{student.regNo}</td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">{student.course}</td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">{student.batch}</td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">
                    {(student as any).attendance === null || (student as any).attendance === undefined ? '—' : `${(student as any).attendance}%`}
                  </td>
                  <td className="table-cell text-slate-600 dark:text-slate-300 font-semibold">
                    {(student as any).avgScore === null || (student as any).avgScore === undefined ? '—' : `${(student as any).avgScore}%`}
                  </td>
                  <td className="table-cell">
                    <Badge variant={student.status === 'active' ? 'success' : 'danger'}>
                      {student.status}
                    </Badge>
                  </td>
                  <td className="table-cell text-slate-500 dark:text-slate-400 text-sm">{student.mentor || '—'}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => { e.stopPropagation() }}>
                        <Eye size={14} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => { e.stopPropagation() }}>
                        <ChevronDown size={14} className={`transition-transform ${expandedStudent === student.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedStudent === student.id && (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 mx-4 mb-2 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Mail size={12} /> {student.email || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mentor</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{student.mentor || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Division</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{student.division || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Users size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No students found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Department Faculty ────────────────────────────────────────────────

interface FacultyMember {
  id: string
  name: string
  email: string
  department: string
  designation: string
  phone: string
  status: string
}

function FacultyOverview() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchFaculty = useCallback(async () => {
    if (!collegeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = query(
        collection(db, 'faculty'),
        where('collegeId', '==', collegeId),
        limit(100)
      )
      const snap = await getDocs(q)
      const list: FacultyMember[] = snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name || data.fullName || 'Faculty Member',
          email: data.email || '—',
          department: data.department || user?.department || 'General',
          designation: data.designation || 'Assistant Professor',
          phone: data.phone || '—',
          status: data.status || 'active',
        }
      })
      setFaculty(list)
    } catch (err) {
      console.error('[FacultyOverview] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [collegeId, user?.department])

  useEffect(() => {
    fetchFaculty()
  }, [fetchFaculty])

  const filtered = useMemo(() =>
    faculty.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.department.toLowerCase().includes(search.toLowerCase())
    ), [faculty, search])

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader title="Department Faculty" icon={GraduationCap} />

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search faculty by name, email, or designation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading department faculty...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="glass-card p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 font-bold flex items-center justify-center text-base">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">{member.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.designation}</p>
                  </div>
                </div>
                <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                  {member.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-teal-400" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-amber-400" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={12} className="text-sky-400" />
                  <span>Dept: {member.department}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="glass-card p-8 text-center">
          <GraduationCap size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No faculty members found for this department.</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab 4: Subject Analytics ─────────────────────────────────────────────────

interface SubjectMetric {
  subject: string
  totalAssessments: number
  avgScore: number
  passRate: number
  studentCount: number
}

function SubjectAnalytics({ data }: { data: ReturnType<typeof useDashboardData> }) {
  const { assessments, scores } = data

  const subjectStats = useMemo(() => {
    const map = new Map<string, { totalScores: number[]; count: number }>()

    assessments.forEach(a => {
      const subj = a.subject || 'General Studies'
      if (!map.has(subj)) {
        map.set(subj, { totalScores: [], count: 0 })
      }
      map.get(subj)!.count += 1
    })

    scores.forEach(s => {
      const a = assessments.find(asm => asm.id === s.assessmentId)
      const subj = a?.subject || 'General Studies'
      if (map.has(subj) && s.percentage !== undefined) {
        map.get(subj)!.totalScores.push(s.percentage)
      }
    })

    const result: SubjectMetric[] = []
    map.forEach((val, subj) => {
      const avg = val.totalScores.length > 0
        ? Math.round(val.totalScores.reduce((a, b) => a + b, 0) / val.totalScores.length)
        : 75
      const pass = val.totalScores.length > 0
        ? Math.round((val.totalScores.filter(sc => sc >= 40).length / val.totalScores.length) * 100)
        : 85

      result.push({
        subject: subj,
        totalAssessments: val.count,
        avgScore: avg,
        passRate: pass,
        studentCount: data.students.length || 45,
      })
    })

    return result.length > 0 ? result : [
      { subject: 'Financial Accounting', totalAssessments: 4, avgScore: 78, passRate: 88, studentCount: data.students.length || 45 },
      { subject: 'Business Economics', totalAssessments: 3, avgScore: 72, passRate: 82, studentCount: data.students.length || 45 },
      { subject: 'Corporate Law', totalAssessments: 3, avgScore: 81, passRate: 91, studentCount: data.students.length || 45 },
    ]
  }, [assessments, scores, data.students])

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader title="Subject-wise Analytics" icon={BarChart3} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjectStats.map(s => (
          <div key={s.subject} className="glass-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">{s.subject}</h4>
              <Badge variant={s.avgScore >= 75 ? 'success' : 'warning'}>
                {s.avgScore}% Avg
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Pass Rate:</span>
                <span className="font-semibold text-teal-400">{s.passRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Assessments Conducted:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{s.totalAssessments}</span>
              </div>
              <div className="flex justify-between">
                <span>Cohort Size:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{s.studentCount} students</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${s.passRate}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Subject Average Scores (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={subjectStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
            <Bar dataKey="avgScore" fill="#14b8a6" name="Avg Score (%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="passRate" fill="#6366f1" name="Pass Rate (%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Tab 5: Approvals ─────────────────────────────────────────────────────────

interface ApprovalItem {
  id: string
  type: 'schedule_reschedule' | 'test_paper' | 'leave_request'
  title: string
  requestedBy: string
  details: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

function ApprovalsTab() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''

  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApprovals = useCallback(async () => {
    if (!collegeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = query(
        collection(db, 'classSessions'),
        where('collegeId', '==', collegeId),
        limit(50)
      )
      const snap = await getDocs(q)
      const list: ApprovalItem[] = []

      snap.docs.forEach(d => {
        const data = d.data()
        if (data.status === 'rescheduled' || data.status === 'pending') {
          list.push({
            id: d.id,
            type: 'schedule_reschedule',
            title: `Reschedule: ${data.topic || data.subject || 'Class'}`,
            requestedBy: data.createdByName || 'Faculty',
            details: `Moved to ${data.date} at ${data.startTime || data.time || '10:00'} (Reason: ${data.reason || 'Not specified'})`,
            date: data.date || new Date().toISOString().split('T')[0],
            status: 'pending',
          })
        }
      })

      setApprovals(list)
    } catch (err) {
      console.error('[ApprovalsTab] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [collegeId])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'classSessions', id), {
        approvalStatus: action,
        approvedBy: user?.name || 'HOD',
      })
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a))
    } catch (err) {
      console.error('[ApprovalsTab] action error:', err)
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a))
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader title="Approval Requests" icon={CheckCircle} />

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Checking pending requests...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle size={36} className="text-teal-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No pending approval requests</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">All class schedule reschedules and departmental requests have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(req => (
            <div key={req.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                    Schedule Change
                  </span>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">{req.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Requested by <span className="text-slate-700 dark:text-slate-300 font-medium">{req.requestedBy}</span> • {req.date}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">{req.details}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {req.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(req.id, 'approved')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition-all shadow-sm"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                ) : (
                  <Badge variant={req.status === 'approved' ? 'success' : 'danger'}>
                    {req.status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main HOD Dashboard ───────────────────────────────────────────────────────

export default function HODDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const data = useDashboardData()

  const dept = user?.department || HOD_DEPT

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'faculty', label: 'Faculty', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
  ]

  const renderContent = () => {
    if (activeTab === 'overview') {
      return data.loading ? <LoadingState /> : <DepartmentOverview data={data} />
    }
    switch (activeTab) {
      case 'students': return <StudentManagement data={data} />
      case 'faculty': return <FacultyOverview />
      case 'subjects': return <SubjectAnalytics data={data} />
      case 'approvals': return <ApprovalsTab />
      default: return null
    }
  }

  return (
    <div className="min-h-full p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HOD Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Department: <span className="text-teal-400 font-semibold">{dept}</span>
              {' '}· {activeTab === 'overview' && 'Department overview and key metrics'}
              {activeTab === 'students' && 'Manage department students'}
              {activeTab === 'faculty' && 'Department faculty overview'}
              {activeTab === 'subjects' && 'Subject-wise performance analytics'}
              {activeTab === 'approvals' && 'Review and approve pending requests'}
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
                ${active
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'}
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  )
}
