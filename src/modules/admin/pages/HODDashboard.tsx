import React, { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  Shield, Users, Building2, CheckCircle, XCircle, FileText,
  Search, Filter, BarChart3, Bell, Eye, Edit3, Download,
  GraduationCap, BookOpen, TrendingUp, AlertTriangle,
  Clock, Calendar, Activity, ChevronRight, ChevronDown,
  MoreHorizontal, Mail, Phone
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  id: string
  name: string
  regNo: string
  email: string
  batch: string
  year: string
  attendance: number
  avgScore: number
  status: 'active' | 'inactive' | 'probation'
  mentor: string
}

interface Faculty {
  id: string
  name: string
  email: string
  designation: string
  subjects: string[]
  studentCount: number
  phone?: string
}

interface ApprovalItem {
  id: string
  type: 'schedule' | 'assessment' | 'material' | 'leave' | 'paper'
  title: string
  requester: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  description?: string
}

interface SubjectStats {
  name: string
  avgScore: number
  attendance: number
  students: number
  faculty: string
}

// ─── Mock Data — FILTERED BY DEPARTMENT (BA) ───────────────────────────────
// In production, these come from API with ?department=BA filter

const HOD_DEPT = 'BA'

const MOCK_STUDENTS: Student[] = []; // TODO: Fetch from API

const MOCK_FACULTY: Faculty[] = []; // TODO: Fetch from API

const MOCK_APPROVALS: ApprovalItem[] = []; // TODO: Fetch from API

const BATCH_PERFORMANCE: { batch: string; avgScore: number; attendance: number; students: number }[] = []; // TODO: Fetch from API

const SUBJECT_STATS: SubjectStats[] = []; // TODO: Fetch from API

const SCORE_TREND: { month: string; [key: string]: string | number }[] = []; // TODO: Fetch from API

const BUDGET_DATA: { department: string; allocated: number; spent: number; remaining: number }[] = []; // TODO: Fetch from API

const ATTENDANCE_DATA: { name: string; attendance: number; target: number }[] = []; // TODO: Fetch from API

const ROLE_DISTRIBUTION: { name: string; value: number; color: string }[] = []; // TODO: Fetch from API

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']
const STATUS_COLORS = { active: '#14b8a6', probation: '#f59e0b', inactive: '#ef4444' }

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

// ─── Tab Content Components ───────────────────────────────────────────────────

function DepartmentOverview() {
  const { user } = useAuth()
  const dept = user?.department || HOD_DEPT
  const totalStudents = MOCK_STUDENTS.length
  const activeStudents = MOCK_STUDENTS.filter(s => s.status === 'active').length
  const probationStudents = MOCK_STUDENTS.filter(s => s.status === 'probation').length
  const avgAttendance = Math.round(MOCK_STUDENTS.reduce((acc, s) => acc + s.attendance, 0) / totalStudents)
  const avgScore = (MOCK_STUDENTS.reduce((acc, s) => acc + s.avgScore, 0) / totalStudents).toFixed(1)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card p-6 bg-teal-500/5 border border-teal-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back, {user?.name?.split(' ')[0] || 'HOD'}</h2>
            <p className="text-slate-500 dark:text-slate-400">Department of {dept} · {MOCK_FACULTY.length} Faculty · {totalStudents} Students · {MOCK_APPROVALS.filter(a => a.status === 'pending').length} Pending Approvals</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <Building2 size={28} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={String(totalStudents)} trend="+5 this month" trendUp={true} color="teal" />
        <StatCard icon={GraduationCap} label="Faculty" value={String(MOCK_FACULTY.length)} trend="Active" trendUp={true} color="sky" />
        <StatCard icon={Activity} label="Avg Attendance" value={`${avgAttendance}%`} trend="+1.2% vs last month" trendUp={true} color="amber" />
        <StatCard icon={BookOpen} label="Avg Score" value={String(avgScore)} trend="+0.8 vs last month" trendUp={true} color="violet" />
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
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{probationStudents}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">On Probation</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{MOCK_APPROVALS.filter(a => a.status === 'pending').length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pending Approvals</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Batch Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={BATCH_PERFORMANCE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="batch" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="avgScore" fill="#14b8a6" name="Avg Score" radius={[4, 4, 0, 0]} />
              <Bar dataKey="attendance" fill="#0ea5e9" name="Attendance %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Score Trends by Batch</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={SCORE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="BA-A 2nd" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="BA-B 2nd" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="BA-A 3rd" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="BA-B 3rd" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Attendance Trend + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Department Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ATTENDANCE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[80, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="attendance" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="target" stroke="#334155" fill="#334155" fillOpacity={0.1} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Approvals</h3>
            <Badge variant="warning">{MOCK_APPROVALS.filter(a => a.status === 'pending').length} pending</Badge>
          </div>
          <div className="space-y-3">
            {MOCK_APPROVALS.filter(a => a.status === 'pending').map(item => {
              const typeIcons = { schedule: Calendar, assessment: FileText, material: BookOpen, leave: Clock, paper: FileText }
              const TypeIcon = typeIcons[item.type] || FileText
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                    <TypeIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.requester} · {item.requestedAt}</p>
                    {item.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors" title="Approve">
                      <CheckCircle size={14} />
                    </button>
                    <button className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors" title="Reject">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <button className="mt-4 text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
            View all approvals <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StudentManagement() {
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const filtered = MOCK_STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.regNo.toLowerCase().includes(search.toLowerCase())
    const matchBatch = batchFilter === 'all' || s.batch === batchFilter
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchYear = yearFilter === 'all' || s.year === yearFilter
    return matchSearch && matchBatch && matchStatus && matchYear
  })

  const batches = [...new Set(MOCK_STUDENTS.map(s => s.batch))]
  const years = [...new Set(MOCK_STUDENTS.map(s => s.year))]

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Department Students"
        icon={Users}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary">
              <Download size={16} />
              Export
            </button>
            <button className="btn-primary">
              <Users size={16} />
              Add Student
            </button>
          </div>
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
        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="input-field">
          <option value="all">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field">
          <option value="all">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="probation">Probation</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
              <th className="table-header">Student</th>
              <th className="table-header">Reg No</th>
              <th className="table-header">Batch</th>
              <th className="table-header">Year</th>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600 dark:text-slate-300 font-mono text-sm">{student.regNo}</td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">{student.batch}</td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">{student.year}</td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">{student.attendance}%</td>                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${student.attendance}%` }} />
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300">{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600 dark:text-slate-300 font-semibold">{student.avgScore}</td>
                  <td className="table-cell">
                    <Badge variant={student.status === 'active' ? 'success' : student.status === 'probation' ? 'warning' : 'danger'}>
                      {student.status}
                    </Badge>
                  </td>
                  <td className="table-cell text-slate-500 dark:text-slate-400 text-sm">{student.mentor}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => { e.stopPropagation(); }}>
                        <Eye size={14} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => { e.stopPropagation(); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => { e.stopPropagation(); }}>
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
                              <Mail size={12} /> {student.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mentor</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{student.mentor}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Performance</p>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${student.avgScore}%`, backgroundColor: STATUS_COLORS[student.status] }} />
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-300">{student.avgScore}%</span>
                            </div>
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
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null)

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Department Faculty"
        icon={GraduationCap}
        action={
          <button className="btn-primary">
            <GraduationCap size={16} />
            Add Faculty
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {MOCK_FACULTY.map(fac => (
          <div key={fac.id} className="glass-card-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-lg">
                  {fac.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{fac.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{fac.designation}</p>
                </div>
              </div>
              <Badge variant="info">{fac.studentCount} students</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <BookOpen size={14} className="text-slate-500" />
                <span>{fac.subjects.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={14} className="text-slate-500" />
                <span>{fac.email}</span>
              </div>
              {fac.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Phone size={14} className="text-slate-500" />
                  <span>{fac.phone}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary text-xs flex-1">
                <Eye size={14} />
                View Profile
              </button>
              <button className="btn-secondary text-xs flex-1">
                <BarChart3 size={14} />
                Analytics
              </button>
              <button className="btn-secondary text-xs flex-1">
                <Edit3 size={14} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SubjectAnalytics() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader title="Subject-wise Analytics" icon={BarChart3} />

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBJECT_STATS.map((sub, i) => (
          <div
            key={sub.name}
            className={`glass-card-hover p-5 cursor-pointer transition-all ${selectedSubject === sub.name ? 'ring-2 ring-teal-500/50' : ''}`}
            onClick={() => setSelectedSubject(selectedSubject === sub.name ? null : sub.name)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white">{sub.name}</h4>
              <Badge variant="info">{sub.students} students</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Avg Score</span>
                  <span className="text-sm font-semibold text-teal-400">{sub.avgScore}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${sub.avgScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Attendance</span>
                  <span className="text-sm font-semibold text-sky-400">{sub.attendance}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${sub.attendance}%` }} />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Faculty: {sub.faculty}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Subject Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SUBJECT_STATS} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="avgScore" fill="#14b8a6" name="Avg Score" radius={[0, 4, 4, 0]} />
            <Bar dataKey="attendance" fill="#0ea5e9" name="Attendance %" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ApprovalsTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const filtered = filter === 'all' ? MOCK_APPROVALS : MOCK_APPROVALS.filter(a => a.status === filter)

  const typeIcons = { schedule: Calendar, assessment: FileText, material: BookOpen, leave: Clock, paper: FileText }
  const typeLabels = { schedule: 'Schedule', assessment: 'Assessment', material: 'Material', leave: 'Leave', paper: 'Paper' }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Approval Requests"
        icon={CheckCircle}
        action={
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? f === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      f === 'approved' ? 'bg-teal-500/20 text-teal-400' :
                      f === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-slate-700 text-slate-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && <span className="ml-1">({MOCK_APPROVALS.filter(a => a.status === 'pending').length})</span>}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-4">
        {filtered.map(item => {
          const TypeIcon = typeIcons[item.type] || FileText
          return (
            <div key={item.id} className="glass-card-hover p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  item.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                  item.status === 'approved' ? 'bg-teal-500/10 text-teal-400' :
                  'bg-rose-500/10 text-rose-400'
                }`}>
                  <TypeIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">{item.title}</h4>
                    <Badge variant={
                      item.status === 'approved' ? 'success' :
                      item.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{item.requester}</span> · {item.requestedAt} · {typeLabels[item.type]}
                  </p>
                  {item.description && <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
                </div>
                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors text-sm font-medium">
                      Approve
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-sm font-medium">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main HOD Dashboard ───────────────────────────────────────────────────────

export default function HODDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const dept = user?.department || HOD_DEPT

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'faculty', label: 'Faculty', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, badge: MOCK_APPROVALS.filter(a => a.status === 'pending').length },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <DepartmentOverview />
      case 'students': return <StudentManagement />
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
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  )
}