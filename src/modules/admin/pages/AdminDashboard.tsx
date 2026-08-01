import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { db } from '@/Firebase/config'
import {
  collection, query, where, getDocs, orderBy, limit, Timestamp
} from 'firebase/firestore'
import {
  Shield, Users, Building2, Settings, FileText, Activity, CheckCircle, XCircle,
  Clock, Search, Filter, Plus, ChevronDown, ChevronRight, BarChart3, Bell,
  Lock, Eye, Trash2, Edit3, Download, Upload, RefreshCw, AlertTriangle,
  UserCheck, GraduationCap, BookOpen, Calendar, TrendingUp, MoreHorizontal,
  DollarSign, School
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'hod' | 'faculty' | 'mentor' | 'student'
  department: string
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  avatar?: string
}

interface Department {
  id: string
  name: string
  code: string
  hod: string
  facultyCount: number
  studentCount: number
  avgAttendance: number
  avgScore: number
  budget: number
  courses: number
}

interface AuditLog {
  id: string
  user: string
  action: string
  target: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

interface ApprovalItem {
  id: string
  type: 'user' | 'schedule' | 'assessment' | 'material' | 'budget'
  title: string
  requester: string
  department: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  amount?: number
}

interface BudgetDataItem {
  department: string
  allocated: number
  spent: number
  remaining: number
}

interface RoleDistributionItem {
  name: string
  value: number
}

interface ScoreTrendItem {
  month: string
  BA: number
  BCom: number
  BSc: number
  BBA: number
}

interface AttendanceDataItem {
  name: string
  attendance: number
  target: number
}

interface DashboardData {
  totalUsers: number
  totalStudents: number
  totalFaculty: number
  totalMentors: number
  totalHODs: number
  avgAttendance: number
  departments: Department[]
  users: User[]
  auditLogs: AuditLog[]
  approvals: ApprovalItem[]
  loading: boolean
}

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444']

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, trend, trendUp, color = 'teal' }: {
  icon: React.ElementType
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  color?: 'teal' | 'sky' | 'amber' | 'violet' | 'rose' | 'emerald'
}) {
  const colorMap = {
    teal: 'bg-teal-500/10 text-teal-400',
    sky: 'bg-sky-500/10 text-sky-400',
    amber: 'bg-amber-500/10 text-amber-400',
    violet: 'bg-violet-500/10 text-violet-400',
    rose: 'bg-rose-500/10 text-rose-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  }
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
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
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

// ─── Firestore Data Hook ──────────────────────────────────────────────────────

function useCollegeDashboardData(collegeId: string | undefined) {
  const [data, setData] = useState<DashboardData>({
    totalUsers: 0, totalStudents: 0, totalFaculty: 0, totalMentors: 0, totalHODs: 0,
    avgAttendance: 0, departments: [], users: [], auditLogs: [], approvals: [], loading: true
  })

  useEffect(() => {
    if (!collegeId) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    async function fetchData() {
      try {
        // Fetch students for this college
        const studentsQuery = query(
          collection(db, 'students'),
          where('collegeId', '==', collegeId)
        )
        const studentsSnap = await getDocs(studentsQuery)
        const students = studentsSnap.docs.map(d => d.data())
        const totalStudents = students.length

        // Fetch faculty for this college
        const facultyQuery = query(
          collection(db, 'faculty'),
          where('collegeId', '==', collegeId)
        )
        const facultySnap = await getDocs(facultyQuery)
        const faculty = facultySnap.docs.map(d => d.data())
        const totalFaculty = faculty.length

        // Fetch admins for this college
        const adminsQuery = query(
          collection(db, 'admins'),
          where('collegeId', '==', collegeId)
        )
        const adminsSnap = await getDocs(adminsQuery)
        const admins = adminsSnap.docs.map(d => d.data())
        const totalAdmins = admins.length
        const totalHODs = admins.filter(a => a.role === 'hod').length
        const totalMentors = admins.filter(a => a.role === 'mentor').length

        // Build department data from faculty departments
        const deptMap: Record<string, { name: string; code: string; faculty: number; students: number }> = {}
        faculty.forEach(f => {
          const dept = f.department || 'General'
          if (!deptMap[dept]) deptMap[dept] = { name: dept, code: dept, faculty: 0, students: 0 }
          deptMap[dept].faculty++
        })
        students.forEach(s => {
          const dept = s.department || 'General'
          if (!deptMap[dept]) deptMap[dept] = { name: dept, code: dept, faculty: 0, students: 0 }
          deptMap[dept].students++
        })

        const departments: Department[] = Object.entries(deptMap).map(([code, info], idx) => ({
          id: String(idx + 1),
          name: info.name,
          code,
          hod: faculty.find(f => f.department === code && f.isHOD)?.firstName || 'TBD',
          facultyCount: info.faculty,
          studentCount: info.students,
          avgAttendance: 0, // TODO: Calculate from attendance collection
          avgScore: 0, // TODO: Calculate from assessments
          budget: 0,
          courses: 0,
        }))

        // Build users list
        const users: User[] = [
          ...admins.map((a, i) => ({
            id: `admin-${i}`,
            name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            email: a.email,
            role: a.role as User['role'],
            department: a.department || 'All',
            status: (a.status || 'active') as User['status'],
            lastActive: 'Recently',
          })),
          ...faculty.map((f, i) => ({
            id: `faculty-${i}`,
            name: `${f.firstName || ''} ${f.lastName || ''}`.trim(),
            email: f.email,
            role: 'faculty' as User['role'],
            department: f.department || 'General',
            status: (f.status || 'active') as User['status'],
            lastActive: 'Recently',
          })),
        ]

        setData({
          totalUsers: totalStudents + totalFaculty + totalAdmins,
          totalStudents,
          totalFaculty,
          totalMentors,
          totalHODs,
          avgAttendance: 0, // TODO
          departments,
          users,
          auditLogs: [], // TODO: Add auditLogs collection
          approvals: [], // TODO: Add approvals collection
          loading: false,
        })
      } catch (err) {
        console.error('Dashboard data fetch error:', err)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchData()
  }, [collegeId])

  return data
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function UserManagement({ users, collegeId }: { users: User[]; collegeId?: string }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    const matchDept = deptFilter === 'all' || u.department === deptFilter
    return matchSearch && matchRole && matchStatus && matchDept
  })

  const roleIcons = {
    admin: Shield, hod: Building2, faculty: GraduationCap, mentor: UserCheck, student: BookOpen
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="User Management"
        icon={Users}
        action={
          <button className="btn-primary">
            <Plus size={16} />
            Add User
          </button>
        }
      />

      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-10" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field">
          <option value="all">All Roles</option>
          <option value="admin">Principal</option>
          <option value="hod">HOD</option>
          <option value="faculty">Faculty</option>
          <option value="mentor">Mentor</option>
          <option value="student">Student</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
        <button className="btn-secondary"><Filter size={16} />More Filters</button>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
              <th className="table-header">User</th>
              <th className="table-header">Role</th>
              <th className="table-header">Department</th>
              <th className="table-header">Status</th>
              <th className="table-header">Last Active</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const RoleIcon = roleIcons[user.role]
              return (
                <tr key={user.id} className="hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <RoleIcon size={14} className="text-slate-500" />
                      <span className="capitalize text-slate-600 dark:text-slate-300">{user.role === 'admin' ? 'Principal' : user.role}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600 dark:text-slate-300">{user.department}</td>
                  <td className="table-cell">
                    <Badge variant={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'danger'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="table-cell text-slate-500 dark:text-slate-400 text-xs">{user.lastActive}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Eye size={14} /></button>
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Edit3 size={14} /></button>
                      <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500">No users found</div>
        )}
      </div>
    </div>
  )
}

function DepartmentOverview({ departments }: { departments: Department[] }) {
  // Mock budget/attendance data for charts (can be replaced later)
  const budgetData = departments.map(d => ({
    department: d.code,
    allocated: 2500000,
    spent: Math.round(2500000 * 0.7),
    remaining: Math.round(2500000 * 0.3),
  }))

  const attendanceData = departments.map(d => ({
    name: d.code,
    attendance: d.avgAttendance || 85,
    target: 90,
  }))

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Department Overview" icon={Building2} action={<button className="btn-secondary"><Download size={16} />Export Report</button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {departments.map(dept => (
          <div key={dept.id} className="glass-card-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Code: {dept.code} | HOD: {dept.hod}</p>
              </div>
              <Badge variant="info">{dept.code}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dept.facultyCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Faculty</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dept.studentCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Students</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dept.courses}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Courses</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {departments.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="code" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
              <Bar dataKey="studentCount" fill="#14b8a6" name="Students" radius={[4, 4, 0, 0]} />
              <Bar dataKey="facultyCount" fill="#0ea5e9" name="Faculty" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ApprovalWorkflows() {
  return (
    <div className="animate-fade-in">
      <SectionHeader title="Approval Workflows" icon={CheckCircle} />
      <div className="text-center py-12 text-slate-500">
        <CheckCircle size={32} className="mx-auto mb-3 opacity-50" />
        <p>No pending approvals</p>
      </div>
    </div>
  )
}

function ReportsAnalytics({ totalStudents, totalFaculty }: { totalStudents: number; totalFaculty: number }) {
  const roleDistribution: RoleDistributionItem[] = [
    { name: 'Students', value: totalStudents || 1 },
    { name: 'Faculty', value: totalFaculty || 1 },
    { name: 'Admin', value: 1 },
  ]

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Reports & Analytics" icon={BarChart3} action={<button className="btn-primary"><Download size={16} />Generate Report</button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {roleDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function AuditLogs() {
  return (
    <div className="animate-fade-in">
      <SectionHeader title="Audit Logs" icon={Clock} />
      <div className="text-center py-12 text-slate-500">
        <Clock size={32} className="mx-auto mb-3 opacity-50" />
        <p>No audit logs yet</p>
      </div>
    </div>
  )
}

function SystemSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true, autoBackup: true, darkMode: true, maintenanceMode: false,
    twoFactorAuth: true, sessionTimeout: '30', feeReminder: true, attendanceAlert: true, autoGradePublish: false,
  })
  const toggle = (key: keyof typeof settings) => setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="animate-fade-in">
      <SectionHeader title="System Settings" icon={Settings} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Bell size={18} className="text-teal-400" />Notifications</h3>
          <div className="space-y-5">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email alerts for important events' },
              { key: 'feeReminder', label: 'Fee Reminders', desc: 'Auto-remind students about pending fees' },
              { key: 'attendanceAlert', label: 'Attendance Alerts', desc: 'Alert mentors when attendance drops below 75%' },
              { key: 'autoBackup', label: 'Auto Backup', desc: 'Automatically backup data every 24 hours' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
                <button onClick={() => toggle(item.key as keyof typeof settings)} className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-teal-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Principal Dashboard ─────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // FIX: Use collegeId from auth user to fetch real data
  const collegeId = user?.collegeId
  const dashboardData = useCollegeDashboardData(collegeId)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (dashboardData.loading) {
    return (
      <div className="min-h-full p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="animate-fade-in space-y-6">
            {/* Welcome Banner */}
            <div className="glass-card p-6 bg-teal-500/5 border border-teal-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back, {user?.name?.split(' ')[0] || 'Principal'}</h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    College-wide administration and oversight · {dashboardData.departments.length} Departments · {dashboardData.totalStudents} Students
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                  <School size={28} />
                </div>
              </div>
            </div>

            {/* Stats Row — REAL DATA FROM FIRESTORE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={dashboardData.totalUsers.toLocaleString()} color="teal" />
              <StatCard icon={GraduationCap} label="Faculty" value={dashboardData.totalFaculty.toLocaleString()} color="sky" />
              <StatCard icon={BookOpen} label="Students" value={dashboardData.totalStudents.toLocaleString()} color="amber" />
              <StatCard icon={Activity} label="Departments" value={dashboardData.departments.length.toString()} color="rose" />
            </div>

            {/* Quick Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Departments</h3>
                  <Badge variant="info">{dashboardData.departments.length}</Badge>
                </div>
                <div className="space-y-3">
                  {dashboardData.departments.slice(0, 4).map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{dept.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dept.studentCount} students · {dept.facultyCount} faculty</p>
                      </div>
                    </div>
                  ))}
                </div>
                {dashboardData.departments.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No departments yet</p>
                )}
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Users</h3>
                  <Badge variant="info">{dashboardData.users.length}</Badge>
                </div>
                <div className="space-y-3">
                  {dashboardData.users.slice(0, 4).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                      <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xs">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.role} · {u.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {dashboardData.users.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No users yet</p>
                )}
              </div>
            </div>

            {/* Department Performance Chart */}
            {dashboardData.departments.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Department Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.departments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} />
                    <Bar dataKey="studentCount" fill="#14b8a6" name="Students" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="facultyCount" fill="#0ea5e9" name="Faculty" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )
      case 'users': return <UserManagement users={dashboardData.users} collegeId={collegeId} />
      case 'departments': return <DepartmentOverview departments={dashboardData.departments} />
      case 'approvals': return <ApprovalWorkflows />
      case 'reports': return <ReportsAnalytics totalStudents={dashboardData.totalStudents} totalFaculty={dashboardData.totalFaculty} />
      case 'audit': return <AuditLogs />
      case 'settings': return <SystemSettings />
      default: return null
    }
  }

  return (
    <div className="min-h-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Principal Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeTab === 'overview' && 'College-wide overview and key metrics'}
              {activeTab === 'users' && 'Manage all users, roles and permissions'}
              {activeTab === 'departments' && 'Department performance and analytics'}
              {activeTab === 'approvals' && 'Review and approve pending requests'}
              {activeTab === 'reports' && 'Generate and download reports'}
              {activeTab === 'audit' && 'System activity and security logs'}
              {activeTab === 'settings' && 'Configure system preferences'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
                ${active ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {renderContent()}
    </div>
  )
}