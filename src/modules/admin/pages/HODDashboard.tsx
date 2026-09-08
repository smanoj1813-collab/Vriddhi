import React, { useState, useMemo } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  Shield, Users, Building2, CheckCircle, FileText,
  Search, BarChart3, Eye, Download,
  GraduationCap, BookOpen, TrendingUp,
  Clock, Activity, ChevronDown, Mail, WifiOff
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { useDashboardData } from '../../admin/hooks/useDashboardData'

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

// Honest placeholder for views that do not yet have a data source wired up.
// It replaces the previous empty `MOCK_*` arrays so a figure of "0" can no
// longer be mistaken for a real measurement.
function NotConnected({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-card p-10 text-center">
      <WifiOff size={32} className="text-slate-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{description}</p>
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

// ─── Tab Content Components ───────────────────────────────────────────────────

function DepartmentOverview({ data }: { data: ReturnType<typeof useDashboardData> }) {
  const { user } = useAuth()
  const dept = user?.department || HOD_DEPT
  const {
    students, attendanceRecords, assessments, scores,
    attendanceRate, passRate, activeAssessments,
    weeklyAttendance, performanceTrend, branchTotals, topPerformers,
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

      {/* Bottom Row: Attendance by course + top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Attendance by Course</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="course" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="present" fill="#14b8a6" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="#f59e0b" name="Absent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Performers</h3>
            <Badge variant="info">by avg %</Badge>
          </div>
          <div className="space-y-3">
            {topPerformers.map((p) => (
              <div key={p.regNo} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                <div className="h-9 w-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                  {p.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.regNo} · {p.course} · {p.assessmentsTaken}/{p.totalAssessments} assessments</p>
                </div>
                <span className="text-sm font-semibold text-teal-400">{p.avg}%</span>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No scored assessments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentManagement({ data }: { data: ReturnType<typeof useDashboardData> }) {
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const { students, attendanceRecords, scores } = data

  const attendanceByStudent = useMemo(() => {
    const map: Record<string, { present: number; total: number }> = {}
    attendanceRecords.forEach(r => {
      if (!map[r.studentId]) map[r.studentId] = { present: 0, total: 0 }
      map[r.studentId].total++
      if (r.status === 'present') map[r.studentId].present++
    })
    return map
  }, [attendanceRecords])

  const avgScoreByStudent = useMemo(() => {
    const map: Record<string, { sum: number; n: number }> = {}
    scores.forEach(s => {
      if (!map[s.studentId]) map[s.studentId] = { sum: 0, n: 0 }
      map[s.studentId].sum += s.percentage
      map[s.studentId].n++
    })
    return map
  }, [scores])

  const rows = useMemo(() => students.map(s => {
    const att = attendanceByStudent[s.id]
    const score = avgScoreByStudent[s.id]
    return {
      ...s,
      attendance: att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null,
      avgScore: score && score.n > 0 ? Math.round((score.sum / score.n) * 10) / 10 : null,
    }
  }), [students, attendanceByStudent, avgScoreByStudent])

  const filtered = rows.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.regNo.toLowerCase().includes(search.toLowerCase())
    const matchCourse = courseFilter === 'all' || s.course === courseFilter
    const matchBatch = batchFilter === 'all' || s.batch === batchFilter
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchCourse && matchBatch && matchStatus
  })

  const courses = [...new Set(students.map(s => s.course))]
  const batches = [...new Set(students.map(s => s.batch))]

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Department Students"
        icon={Users}
        action={
          <button className="btn-secondary">
            <Download size={16} />
            Export
          </button>
        }
      />

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or reg no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} className="input-field">
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="input-field">
          <option value="all">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
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
                    {student.attendance === null ? '—' : `${student.attendance}%`}
                  </td>
                  <td className="table-cell text-slate-600 dark:text-slate-300 font-semibold">
                    {student.avgScore === null ? '—' : `${student.avgScore}%`}
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

function FacultyOverview() {
  return (
    <div className="animate-fade-in">
      <SectionHeader title="Department Faculty" icon={GraduationCap} />
      <NotConnected
        title="Faculty overview is not connected yet"
        description="This view has no data source wired up. Department faculty records are managed from the Admin → Faculty screen; once a per-college faculty feed is available this tab will populate."
      />
    </div>
  )
}

function SubjectAnalytics() {
  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader title="Subject-wise Analytics" icon={BarChart3} />
      <NotConnected
        title="Subject analytics are not connected yet"
        description="Subject-level averages need a subject dimension on assessment scores. Until that is recorded, use the Overview tab's performance and attendance charts for the department."
      />
    </div>
  )
}

function ApprovalsTab() {
  return (
    <div className="animate-fade-in">
      <SectionHeader title="Approval Requests" icon={CheckCircle} />
      <NotConnected
        title="Approvals are not connected yet"
        description="Approval workflows (schedule changes, paper releases, leave) have no request collection wired to this tab. Approve and reject actions currently live in their own screens."
      />
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
      case 'subjects': return <SubjectAnalytics />
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
