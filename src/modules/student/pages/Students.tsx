import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { db } from '../../../Firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import {
  Users, Search, Filter, Download, Eye, Edit3, Trash2, ChevronDown, ChevronUp,
  GraduationCap, Mail, Phone, MapPin, Calendar, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, MoreHorizontal, FileText, BarChart3
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface Student {
  id: string
  name: string
  regNo: string
  email: string
  phone?: string
  department: string
  batch: string
  year: string
  section: string
  attendance: number
  avgScore: number
  status: 'active' | 'inactive' | 'probation'
  mentor: string
  address?: string
  dob?: string
  guardianName?: string
  guardianPhone?: string
  feesPaid: boolean
  lastActive: string
}

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6']

// ═══════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════

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

function StatCard({ icon: Icon, label, value, color = 'teal' }: {
  icon: React.ElementType
  label: string
  value: string | number
  color?: 'teal' | 'sky' | 'amber' | 'rose' | 'violet'
}) {
  const colorMap = {
    teal: 'bg-teal-500/10 text-teal-400',
    sky: 'bg-sky-500/10 text-sky-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    violet: 'bg-violet-500/10 text-violet-400',
  }
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Firestore Hook for Students
// ═══════════════════════════════════════════════════════════════════════

function useCollegeStudents(collegeId: string | undefined) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!collegeId) {
      setLoading(false)
      return
    }

    async function fetchStudents() {
      try {
        const q = query(
          collection(db, 'students'),
          where('collegeId', '==', collegeId)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(doc => {
          const d = doc.data()
          return {
            id: doc.id,
            name: d.name || '',
            regNo: d.regNo || d.registrationNumber || '',
            email: d.email || '',
            phone: d.phone || '',
            department: d.department || d.division || 'General',
            batch: d.batch || '',
            year: d.year || d.batch || '',
            section: d.section || d.division || '',
            attendance: d.attendance || 0,
            avgScore: d.avgScore || d.cgpa || 0,
            status: (d.status || 'active') as Student['status'],
            mentor: d.mentor || '',
            address: d.address || '',
            dob: d.dob || '',
            guardianName: d.guardianName || '',
            guardianPhone: d.guardianPhone || '',
            feesPaid: d.feesPaid || false,
            lastActive: d.lastActive || 'Recently',
          }
        })
        setStudents(data)
      } catch (err) {
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [collegeId])

  return { students, loading }
}

// ═══════════════════════════════════════════════════════════════════════
// Main Students Component
// ═══════════════════════════════════════════════════════════════════════

export default function Students() {
  const { user } = useAuth()
  const collegeId = user?.collegeId
  const { students: allStudents, loading } = useCollegeStudents(collegeId)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list')

  const isAdmin = user?.role === 'admin'
  const isHOD = user?.role === 'hod'
  const isMentor = user?.role === 'mentor'
  const userDept = user?.department

  const filteredStudents = useMemo(() => {
    let data = [...allStudents]

    if (isHOD && userDept) {
      data = data.filter(s => s.department === userDept)
    }

    if (isMentor) {
      data = data.filter(s => s.mentor === user?.name)
    }

    if (isAdmin && departmentFilter !== 'all') {
      data = data.filter(s => s.department === departmentFilter)
    }

    return data.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                         s.regNo.toLowerCase().includes(search.toLowerCase()) ||
                         s.email.toLowerCase().includes(search.toLowerCase())
      const matchBatch = batchFilter === 'all' || s.batch === batchFilter
      const matchYear = yearFilter === 'all' || s.year === yearFilter
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchBatch && matchYear && matchStatus
    })
  }, [allStudents, search, departmentFilter, batchFilter, yearFilter, statusFilter, isAdmin, isHOD, isMentor, userDept, user?.name])

  const departmentDistribution = useMemo(() => {
    const deptCounts: Record<string, number> = {}
    filteredStudents.forEach(s => {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1
    })
    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }))
  }, [filteredStudents])

  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = { active: 0, probation: 0, inactive: 0 }
    filteredStudents.forEach(s => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [filteredStudents])

  const availableDepartments = isAdmin
    ? [...new Set(allStudents.map(s => s.department))]
    : isHOD && userDept ? [userDept] : [...new Set(allStudents.map(s => s.department))]

  const availableBatches = [...new Set(filteredStudents.map(s => s.batch))]
  const availableYears = [...new Set(filteredStudents.map(s => s.year))]

  const totalStudents = filteredStudents.length
  const activeStudents = filteredStudents.filter(s => s.status === 'active').length
  const probationStudents = filteredStudents.filter(s => s.status === 'probation').length
  const inactiveStudents = filteredStudents.filter(s => s.status === 'inactive').length
  const avgAttendance = totalStudents > 0 ? Math.round(filteredStudents.reduce((acc, s) => acc + (s.attendance || 0), 0) / totalStudents) : 0
  const avgScore = totalStudents > 0 ? (filteredStudents.reduce((acc, s) => acc + (s.avgScore || 0), 0) / totalStudents).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="min-h-full p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    )
  }

  return (
    <div className="min-h-full p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isAdmin ? 'All Students' : isHOD ? `${userDept} Students` : 'My Students'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isAdmin ? 'College-wide student management' :
                 isHOD ? `Managing ${totalStudents} students in ${userDept} department` :
                 `Managing your mentees`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>List View</button>
            <button onClick={() => setViewMode('analytics')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'analytics' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Analytics</button>
            <button className="btn-secondary"><Download size={16} />Export</button>
            {isAdmin && <button className="btn-primary"><Users size={16} />Add Student</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Users} label="Total" value={totalStudents} color="teal" />
        <StatCard icon={CheckCircle} label="Active" value={activeStudents} color="sky" />
        <StatCard icon={AlertTriangle} label="Probation" value={probationStudents} color="amber" />
        <StatCard icon={XCircle} label="Inactive" value={inactiveStudents} color="rose" />
        <StatCard icon={TrendingUp} label="Avg Score" value={avgScore} color="violet" />
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search by name, reg no, or email..." value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-10" />
            </div>
            {isAdmin && (
              <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="input-field">
                <option value="all">All Departments</option>
                {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="input-field">
              <option value="all">All Batches</option>
              {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field">
              <option value="all">All Years</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="probation">Probation</option>
            </select>
            <button onClick={() => { setSearch(''); setDepartmentFilter('all'); setBatchFilter('all'); setYearFilter('all'); setStatusFilter('all') }} className="btn-secondary text-sm"><Filter size={14} />Clear</button>
          </div>

          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                  <th className="table-header">Student</th>
                  {isAdmin && <th className="table-header">Department</th>}
                  <th className="table-header">Reg No</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Attendance</th>
                  <th className="table-header">Avg Score</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Mentor</th>
                  <th className="table-header">Fees</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
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
                      {isAdmin && <td className="table-cell text-slate-600 dark:text-slate-300">{student.department}</td>}
                      <td className="table-cell text-slate-600 dark:text-slate-300 font-mono text-sm">{student.regNo}</td>
                      <td className="table-cell text-slate-600 dark:text-slate-300">{student.batch}</td>
                      <td className="table-cell text-slate-600 dark:text-slate-300">{student.year}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(student.attendance || 0, 100)}%`, backgroundColor: (student.attendance || 0) >= 90 ? '#14b8a6' : (student.attendance || 0) >= 75 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-300">{student.attendance || 0}%</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`font-semibold ${(student.avgScore || 0) >= 80 ? 'text-teal-400' : (student.avgScore || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {student.avgScore || 0}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Badge variant={student.status === 'active' ? 'success' : student.status === 'probation' ? 'warning' : 'danger'}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="table-cell text-slate-500 dark:text-slate-400 text-sm">{student.mentor}</td>
                      <td className="table-cell">
                        <Badge variant={student.feesPaid ? 'success' : 'danger'}>
                          {student.feesPaid ? 'Paid' : 'Due'}
                        </Badge>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => e.stopPropagation()}><Eye size={14} /></button>
                          <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={e => e.stopPropagation()}><Edit3 size={14} /></button>
                          {isAdmin && <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-colors" onClick={e => e.stopPropagation()}><Trash2 size={14} /></button>}
                          <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            {expandedStudent === student.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedStudent === student.id && (
                      <tr>
                        <td colSpan={isAdmin ? 11 : 10} className="p-0">
                          <div className="bg-slate-100/50 dark:bg-slate-900/50 p-5 mx-4 mb-3 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-teal-400 mb-2">Contact Info</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Mail size={14} className="text-slate-500" />{student.email}</div>
                                {student.phone && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Phone size={14} className="text-slate-500" />{student.phone}</div>}
                                {student.address && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin size={14} className="text-slate-500" />{student.address}</div>}
                                {student.dob && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Calendar size={14} className="text-slate-500" />DOB: {student.dob}</div>}
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-teal-400 mb-2">Guardian Info</h4>
                                {student.guardianName && <div className="text-sm text-slate-600 dark:text-slate-300"><span className="text-slate-500">Name:</span> {student.guardianName}</div>}
                                {student.guardianPhone && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Phone size={14} className="text-slate-500" />{student.guardianPhone}</div>}
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-teal-400 mb-2">Academic Summary</h4>
                                <div className="text-sm text-slate-600 dark:text-slate-300"><span className="text-slate-500">Department:</span> {student.department}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-300"><span className="text-slate-500">Batch:</span> {student.batch} · {student.year}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-300"><span className="text-slate-500">Mentor:</span> {student.mentor}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-300"><span className="text-slate-500">Last Active:</span> {student.lastActive}</div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex gap-2">
                              <button className="btn-secondary text-xs"><FileText size={14} />View Full Profile</button>
                              <button className="btn-secondary text-xs"><BarChart3 size={14} />Academic Report</button>
                              <button className="btn-secondary text-xs"><TrendingUp size={14} />Attendance Report</button>
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

          {filteredStudents.length === 0 && (
            <div className="glass-card p-8 text-center mt-6">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No students found matching your filters.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isAdmin && departmentDistribution.length > 1 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Department Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={departmentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {departmentDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    <Cell fill="#14b8a6" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
