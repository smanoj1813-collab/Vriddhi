import { useState, useMemo, useRef, useEffect } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { db } from '@/Firebase/config'
import {
  collection, query, where, getDocs, limit
} from 'firebase/firestore'
import {
  Search, User, BookOpen, TrendingUp, Award,
  AlertTriangle, Calendar, FileText, ChevronRight, Download,
  Filter, BarChart3, Users, GraduationCap, Target,
  FileSpreadsheet, Printer, Loader2, Eye
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell
} from 'recharts'

// ─── Types ──────────────────────────────────────────────
interface Student {
  id: string
  name: string
  regNo: string
  course: string
  batch: string
  division: string
  mentor: string
  attendance: number
  avgScore: number
  status: 'active' | 'warning' | 'critical'
  strengths: string[]
  weaknesses: string[]
  assessments: Assessment[]
}

interface Assessment {
  name: string
  score: number
  date: string
  rank: number
  subject: string
}

// ─── Colors ─────────────────────────────────────────────
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

// ─── Helper: Generate CSV ───────────────────────────────
function generateCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h]
      return `"${String(val ?? '').replace(/"/g, '""')}"`
    }).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Helper: Generate PDF (A4 Print) ────────────────────
function printToPDF(title: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const content = document.getElementById('analytics-content')?.innerHTML || ''

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; color: #333; background: #fff; padding: 20px; }
        h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; }
        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        .section { margin-bottom: 24px; page-break-inside: avoid; }
        .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #14b8a6; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; }
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: bold; color: #0f172a; }
        .metric-label { font-size: 12px; color: #64748b; margin-top: 4px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .strength-tag { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 11px; margin: 2px; }
        .weakness-tag { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-size: 11px; margin: 2px; }
        .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .logo { font-size: 20px; font-weight: bold; color: #14b8a6; }
        .date { font-size: 12px; color: #94a3b8; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Vriddhi - Academic Management</div>
        <div class="date">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      <h1>${title}</h1>
      <p class="subtitle">Institute Performance Analytics Report</p>
      ${content}
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        © Vriddhi Academic Management System - Confidential Report
      </div>
    </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 500)
}

// ─── Firestore Hook for Students ──────────
function useCollegeStudents360(
  collegeId: string | undefined,
  userRole: string | undefined,
  userDepartment: string | undefined,
  userId: string | undefined
) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!collegeId) {
      setLoading(false)
      setError('No college ID found. Please check your account settings.')
      return
    }

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        console.log('[360View] Fetching students for collegeId:', collegeId, 'role:', userRole, 'dept:', userDepartment)

        timeoutId = setTimeout(() => {
          if (!cancelled) {
            setLoading(false)
            setError('Request timed out. The database query is taking too long.')
          }
        }, 15000)

        const isAdmin = userRole === 'admin' || userRole === 'hod' || userRole === 'superadmin'

        let q
        if (isAdmin) {
          // Admin/HOD/SuperAdmin: fetch all students in college
          q = query(
            collection(db, 'students'),
            where('collegeId', '==', collegeId)
          )
        } else if (userDepartment) {
          // Faculty: fetch only students in their department
          q = query(
            collection(db, 'students'),
            where('collegeId', '==', collegeId),
            where('department', '==', userDepartment)
          )
        } else {
          // Fallback: fetch by college only, then filter client-side by mentor
          q = query(
            collection(db, 'students'),
            where('collegeId', '==', collegeId),
            limit(200)
          )
        }

        const snap = await getDocs(q)
        clearTimeout(timeoutId)
        if (cancelled) return

        console.log('[360View] Found', snap.size, 'raw students')

        const studentData: Student[] = []

        for (const docSnap of snap.docs) {
          const d = docSnap.data()

          // Skip if faculty and student doesn't belong to this faculty
          if (!isAdmin && userDepartment && d.department !== userDepartment) {
            continue
          }

          let assessments: Assessment[] = []
          try {
            const assessQuery = query(collection(db, 'students', docSnap.id, 'assessments'))
            const assessSnap = await getDocs(assessQuery)
            assessments = assessSnap.docs.map(a => {
              const ad = a.data()
              return {
                name: ad.name || ad.title || '',
                score: ad.score || ad.marks || 0,
                date: ad.date || ad.createdAt || '',
                rank: ad.rank || 0,
                subject: ad.subject || ad.topic || '',
              }
            })
          } catch (e) {
            console.log('[360View] No assessments for student', docSnap.id)
          }

          const strengths: string[] = d.strengths || d.skills || []
          const weaknesses: string[] = d.weaknesses || d.areasToImprove || []

          const attendance = d.attendance || d.attendancePercentage || 0
          const avgScore = d.avgScore || d.cgpa || d.percentage || 0
          let status: Student['status'] = 'active'
          if (attendance < 60 || avgScore < 40) status = 'critical'
          else if (attendance < 75 || avgScore < 60) status = 'warning'

          studentData.push({
            id: docSnap.id,
            name: d.name || '',
            regNo: d.regNo || d.registrationNumber || d.enrollmentNumber || '',
            course: d.course || d.department || '',
            batch: d.batch || d.academicYear || '',
            division: d.division || d.section || '',
            mentor: d.mentor || d.mentorName || '',
            attendance,
            avgScore,
            status,
            strengths,
            weaknesses,
            assessments,
          })
        }

        if (!cancelled) {
          setStudents(studentData)
          setLoading(false)
          console.log('[360View] Loaded', studentData.length, 'students (after filtering)')
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        console.error('360 View fetch error:', err)
        if (!cancelled) {
          setLoading(false)
          if (err.code === 'failed-precondition') {
            setError(
              'Firestore index missing! A composite index is required. ' +
              'Go to Firebase Console > Firestore Database > Indexes and create an index for: ' +
              'Collection: students, Fields: collegeId (Ascending), department (Ascending).'
            )
          } else if (err.code === 'permission-denied') {
            setError('Permission denied. You do not have access to view student data.')
          } else {
            setError(err.message || 'Failed to load student data. Please try again.')
          }
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [collegeId, userRole, userDepartment, userId])

  return { students, loading, error }
}

// ─── Components ─────────────────────────────────────────

function DownloadMenu({ onCSV, onPDF }: { onCSV: () => void; onPDF: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-vriddhi-card border border-vriddhi-border rounded-lg text-sm text-vriddhi-text hover:bg-vriddhi-border/50 transition-colors"
      >
        <Download size={14} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-vriddhi-card border border-vriddhi-border rounded-xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => { onCSV(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-vriddhi-text hover:bg-white/5 transition-colors"
          >
            <FileSpreadsheet size={16} className="text-green-400" />
            Download Excel (CSV)
          </button>
          <button
            onClick={() => { onPDF(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-vriddhi-text hover:bg-white/5 transition-colors"
          >
            <Printer size={16} className="text-red-400" />
            Print PDF (A4)
          </button>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, subtext, color = 'text-slate-900 dark:text-white' }: { label: string; value: string; subtext?: string; color?: string }) {
  return (
    <div className="stat-card text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-vriddhi-muted mt-1">{label}</p>
      {subtext && <p className="text-xs text-vriddhi-muted mt-1">{subtext}</p>}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function View360() {
  const { user } = useAuth()
  const collegeId = user?.collegeId
  const userRole = user?.role
  const userDepartment = user?.department
  const userId = user?.id

  const { students: allStudents, loading, error } = useCollegeStudents360(collegeId, userRole, userDepartment, userId)

  const [searchRegNo, setSearchRegNo] = useState('')
  const [activeTab, setActiveTab] = useState('institute')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [filterCourse, setFilterCourse] = useState('all')
  const [filterBatch, setFilterBatch] = useState('all')
  const [filterDivision, setFilterDivision] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const isFaculty = userRole === 'faculty'
  const isAdmin = userRole === 'admin' || userRole === 'hod' || userRole === 'superadmin'

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (filterCourse !== 'all' && s.course !== filterCourse) return false
      if (filterBatch !== 'all' && s.batch !== filterBatch) return false
      if (filterDivision !== 'all' && s.division !== filterDivision) return false
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (searchRegNo && !s.regNo.toLowerCase().includes(searchRegNo.toLowerCase()) && !s.name.toLowerCase().includes(searchRegNo.toLowerCase())) return false
      return true
    })
  }, [allStudents, filterCourse, filterBatch, filterDivision, filterStatus, searchRegNo])

  const analytics = useMemo(() => {
    const students = filteredStudents
    const total = students.length
    if (total === 0) return null

    const courseStats: Record<string, { count: number; avgScore: number; avgAttendance: number; strengths: Record<string, number> }> = {}
    const batchStats: Record<string, { count: number; avgScore: number; avgAttendance: number }> = {}

    students.forEach(s => {
      if (!courseStats[s.course]) courseStats[s.course] = { count: 0, avgScore: 0, avgAttendance: 0, strengths: {} }
      courseStats[s.course].count++
      courseStats[s.course].avgScore += s.avgScore
      courseStats[s.course].avgAttendance += s.attendance
      s.strengths.forEach(st => {
        courseStats[s.course].strengths[st] = (courseStats[s.course].strengths[st] || 0) + 1
      })

      if (!batchStats[s.batch]) batchStats[s.batch] = { count: 0, avgScore: 0, avgAttendance: 0 }
      batchStats[s.batch].count++
      batchStats[s.batch].avgScore += s.avgScore
      batchStats[s.batch].avgAttendance += s.attendance
    })

    Object.keys(courseStats).forEach(c => {
      courseStats[c].avgScore = Math.round(courseStats[c].avgScore / courseStats[c].count * 10) / 10
      courseStats[c].avgAttendance = Math.round(courseStats[c].avgAttendance / courseStats[c].count * 10) / 10
    })
    Object.keys(batchStats).forEach(b => {
      batchStats[b].avgScore = Math.round(batchStats[b].avgScore / batchStats[b].count * 10) / 10
      batchStats[b].avgAttendance = Math.round(batchStats[b].avgAttendance / batchStats[b].count * 10) / 10
    })

    const courseStrengths: Record<string, string[]> = {}
    Object.entries(courseStats).forEach(([course, stats]) => {
      courseStrengths[course] = Object.entries(stats.strengths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name)
    })

    const statusDist = [
      { name: 'Active', value: students.filter(s => s.status === 'active').length, color: '#22c55e' },
      { name: 'Warning', value: students.filter(s => s.status === 'warning').length, color: '#f59e0b' },
      { name: 'Critical', value: students.filter(s => s.status === 'critical').length, color: '#ef4444' },
    ].filter(s => s.value > 0)

    const scoreDist = [
      { range: '90-100', count: students.filter(s => s.avgScore >= 90).length },
      { range: '80-89', count: students.filter(s => s.avgScore >= 80 && s.avgScore < 90).length },
      { range: '70-79', count: students.filter(s => s.avgScore >= 70 && s.avgScore < 80).length },
      { range: '60-69', count: students.filter(s => s.avgScore >= 60 && s.avgScore < 70).length },
      { range: 'Below 60', count: students.filter(s => s.avgScore < 60).length },
    ]

    const batchTrend = Object.entries(batchStats).map(([batch, stats]) => ({
      batch,
      score: stats.avgScore,
      attendance: stats.avgAttendance,
    })).sort((a, b) => b.batch.localeCompare(a.batch))

    const topPerformers = [...students].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5)
    const atRiskStudents = students.filter(s => s.status === 'warning' || s.status === 'critical').sort((a, b) => a.avgScore - b.avgScore)

    return {
      total,
      courseStats,
      batchStats,
      courseStrengths,
      statusDist,
      scoreDist,
      batchTrend,
      topPerformers,
      atRiskStudents,
      overallAvg: Math.round(students.reduce((a, b) => a + b.avgScore, 0) / total * 10) / 10,
      overallAttendance: Math.round(students.reduce((a, b) => a + b.attendance, 0) / total * 10) / 10,
      passRate: Math.round(students.filter(s => s.avgScore >= 40).length / total * 1000) / 10,
    }
  }, [filteredStudents])

  const exportInstituteCSV = () => {
    if (!analytics) return
    const data = Object.entries(analytics.courseStats).map(([course, stats]) => ({
      Course: course,
      'Total Students': stats.count,
      'Average Score': stats.avgScore + '%',
      'Average Attendance': stats.avgAttendance + '%',
      'Top Strengths': analytics.courseStrengths[course]?.join(', ') || '',
    }))
    generateCSV(data, `institute-analytics-${filterCourse}-${filterBatch}`)
  }

  const exportStudentsCSV = () => {
    const data = filteredStudents.map(s => ({
      Name: s.name,
      'Reg No': s.regNo,
      Course: s.course,
      Batch: s.batch,
      Division: s.division,
      Mentor: s.mentor,
      Attendance: s.attendance + '%',
      'Avg Score': s.avgScore + '%',
      Status: s.status,
      Strengths: s.strengths.join(', '),
      Weaknesses: s.weaknesses.join(', '),
    }))
    generateCSV(data, `students-list-${filterCourse}-${filterBatch}`)
  }

  const tabs = [
    { id: 'institute', label: 'Institute Overview', icon: BarChart3 },
    { id: 'students', label: 'Student Details', icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-full p-6 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400" />
        <p className="text-sm text-vriddhi-muted">Loading student data...</p>
        <p className="text-xs text-vriddhi-muted">College ID: {collegeId || 'Not found'}</p>
        {isFaculty && <p className="text-xs text-vriddhi-muted">Department: {userDepartment || 'Not assigned'}</p>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-full p-6 flex flex-col items-center justify-center gap-4">
        <AlertTriangle size={48} className="text-red-400" />
        <h2 className="text-xl font-bold text-white">Failed to Load Data</h2>
        <p className="text-sm text-vriddhi-muted text-center max-w-md">{error}</p>
        {collegeId && <p className="text-xs text-vriddhi-muted">College ID: {collegeId}</p>}
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-vriddhi-accent text-white rounded-lg text-sm hover:bg-vriddhi-accent/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (selectedStudent) {
    return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} allStudents={filteredStudents} />
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title mb-1">
            {isFaculty ? `${userDepartment || 'Department'} 360° View` : '360° Student View'}
          </h1>
          <p className="text-vriddhi-muted">
            {isFaculty 
              ? `Viewing students assigned to your department (${allStudents.length} students)` 
              : 'Comprehensive institute analytics and student profiles'}
          </p>
        </div>
        <DownloadMenu
          onCSV={activeTab === 'institute' ? exportInstituteCSV : exportStudentsCSV}
          onPDF={() => printToPDF(activeTab === 'institute' ? 'Institute Analytics Report' : 'Student Details Report')}
        />
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-vriddhi-accent" />
          <span className="text-sm font-medium text-white">Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vriddhi-muted" />
            <input
              type="text"
              placeholder="Search reg no or name..."
              value={searchRegNo}
              onChange={(e) => setSearchRegNo(e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="input-field text-sm">
            <option value="all">All Courses</option>
            {[...new Set(allStudents.map(s => s.course))].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="input-field text-sm">
            <option value="all">All Batches</option>
            {[...new Set(allStudents.map(s => s.batch))].filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} className="input-field text-sm">
            <option value="all">All Divisions</option>
            {[...new Set(allStudents.map(s => s.division))].filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        {(filterCourse !== 'all' || filterBatch !== 'all' || filterDivision !== 'all' || filterStatus !== 'all' || searchRegNo) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-vriddhi-border">
            <span className="text-xs text-vriddhi-muted">Active filters:</span>
            {filterCourse !== 'all' && <span className="px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded text-xs">{filterCourse}</span>}
            {filterBatch !== 'all' && <span className="px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded text-xs">Batch {filterBatch}</span>}
            {filterDivision !== 'all' && <span className="px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded text-xs">Div {filterDivision}</span>}
            {filterStatus !== 'all' && <span className="px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded text-xs capitalize">{filterStatus}</span>}
            {searchRegNo && <span className="px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded text-xs">Search: {searchRegNo}</span>}
            <button 
              onClick={() => { setFilterCourse('all'); setFilterBatch('all'); setFilterDivision('all'); setFilterStatus('all'); setSearchRegNo('') }}
              className="text-xs text-red-400 hover:text-red-300 ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                ${activeTab === tab.id ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card text-vriddhi-muted hover:text-white hover:bg-vriddhi-border/50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'institute' && analytics && (
        <div id="analytics-content" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Total Students" value={analytics.total.toString()} />
            <MetricCard label="Overall Average" value={analytics.overallAvg + '%'} color="text-vriddhi-accent" />
            <MetricCard label="Avg Attendance" value={analytics.overallAttendance + '%'} color="text-green-400" />
            <MetricCard label="Pass Rate" value={analytics.passRate + '%'} color="text-amber-400" />
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <GraduationCap size={20} className="text-vriddhi-accent" />
                Course-wise Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vriddhi-border">
                    <th className="table-header">Course</th>
                    <th className="table-header">Students</th>
                    <th className="table-header">Avg Score</th>
                    <th className="table-header">Avg Attendance</th>
                    <th className="table-header">Top Strengths</th>
                    <th className="table-header">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.courseStats).map(([course, stats]) => (
                    <tr key={course} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell font-semibold text-white">{course}</td>
                      <td className="table-cell">{stats.count}</td>
                      <td className="table-cell">
                        <span className={`font-semibold ${stats.avgScore >= 80 ? 'text-green-400' : stats.avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {stats.avgScore}%
                        </span>
                      </td>
                      <td className="table-cell">{stats.avgAttendance}%</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {analytics.courseStrengths[course]?.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">{s}</span>
                          )) || '-'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="w-24 h-2 bg-vriddhi-dark rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${stats.avgScore >= 80 ? 'bg-green-500' : stats.avgScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(stats.avgScore, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-vriddhi-accent" />
                Batch-wise Performance Trend
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.batchTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="batch" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Score" />
                  <Bar dataKey="attendance" fill="#22c55e" radius={[4, 4, 0, 0]} name="Attendance" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={20} className="text-vriddhi-accent" />
                Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={analytics.scoreDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analytics.scoreDist.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {analytics.scoreDist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-vriddhi-muted">{item.range}: {item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Student Status Distribution</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analytics.statusDist.map((status) => (
                <div key={status.name} className="p-4 rounded-xl bg-vriddhi-dark/50 text-center">
                  <p className="text-3xl font-bold" style={{ color: status.color }}>{status.value}</p>
                  <p className="text-sm text-vriddhi-muted mt-1">{status.name}</p>
                  <p className="text-xs text-vriddhi-muted mt-1">
                    {analytics.total > 0 ? ((status.value / analytics.total) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {analytics.atRiskStudents.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Students Needing Attention ({analytics.atRiskStudents.length})
              </h3>
              <div className="space-y-3">
                {analytics.atRiskStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{student.name}</p>
                      <p className="text-xs text-vriddhi-muted">{student.regNo} · {student.course} · Batch {student.batch}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-400">{student.avgScore}%</p>
                      <p className="text-xs text-vriddhi-muted">{student.attendance}% attendance</p>
                    </div>
                    <ChevronRight size={16} className="text-vriddhi-muted" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div id="analytics-content" className="space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vriddhi-border">
                    <th className="table-header">STUDENT</th>
                    <th className="table-header">REG NO</th>
                    <th className="table-header">COURSE/BATCH</th>
                    <th className="table-header">DIVISION</th>
                    <th className="table-header">MENTOR</th>
                    <th className="table-header">ATTENDANCE</th>
                    <th className="table-header">AVG SCORE</th>
                    <th className="table-header">STATUS</th>
                    <th className="table-header">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-vriddhi-accent/20 flex items-center justify-center text-vriddhi-accent font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-sm">{student.regNo}</td>
                      <td className="table-cell">
                        <span className="text-vriddhi-accent">{student.course}</span>
                        <span className="text-vriddhi-muted text-xs block">Batch {student.batch}</span>
                      </td>
                      <td className="table-cell">{student.division}</td>
                      <td className="table-cell text-sm">{student.mentor}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-vriddhi-dark rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${student.attendance >= 90 ? 'bg-green-500' : student.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs">{student.attendance}%</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`font-semibold ${student.avgScore >= 80 ? 'text-green-400' : student.avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {student.avgScore}%
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                          ${student.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                            student.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                            'bg-red-500/20 text-red-400'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 bg-vriddhi-accent/20 text-vriddhi-accent rounded-lg text-xs font-medium hover:bg-vriddhi-accent/30 transition-colors"
                        >
                          View 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-vriddhi-muted">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>No students found matching your criteria</p>
              </div>
            )}
          </div>

          {analytics && analytics.topPerformers.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award size={20} className="text-amber-400" />
                Top Performers
              </h3>
              <div className="space-y-3">
                {analytics.topPerformers.map((student, i) => (
                  <div 
                    key={student.id} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 
                        i === 1 ? 'bg-slate-400/20 text-slate-400' : 
                        i === 2 ? 'bg-orange-600/20 text-orange-400' : 'bg-vriddhi-border/50 text-vriddhi-muted'}
                    `}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{student.name}</p>
                      <p className="text-xs text-vriddhi-muted">{student.regNo} · {student.course}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">{student.avgScore}%</p>
                    </div>
                    <ChevronRight size={16} className="text-vriddhi-muted" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'institute' && !analytics && (
        <div className="text-center py-20 text-vriddhi-muted">
          <Filter size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No data available</p>
          <p className="text-sm mt-2">
            {allStudents.length === 0 
              ? `No students found${isFaculty ? ' for your department' : ''}. Please check your Firestore data.` 
              : "Try adjusting your filter criteria"}
          </p>
          {allStudents.length === 0 && (
            <div className="mt-4 p-4 bg-vriddhi-card rounded-xl text-left max-w-lg mx-auto space-y-1">
              <p className="text-xs text-vriddhi-muted font-semibold">Debug Info:</p>
              <p className="text-xs text-vriddhi-muted">College ID: {collegeId || 'Not found'}</p>
              <p className="text-xs text-vriddhi-muted">User Role: {userRole || 'Unknown'}</p>
              <p className="text-xs text-vriddhi-muted">Department: {userDepartment || 'Not set'}</p>
              <p className="text-xs text-vriddhi-muted">Total Students in DB: {allStudents.length}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Student Detail View ─────────────────────────────────
function StudentDetailView({ student, onBack, allStudents }: { student: Student; onBack: () => void; allStudents: Student[] }) {
  const [activeDetailTab, setActiveDetailTab] = useState('overview')

  const detailTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'academics', label: 'Academics', icon: BookOpen },
    { id: 'insights', label: 'AI Insights', icon: TrendingUp },
  ]

  const radarData = [
    { subject: 'Academics', A: student.avgScore, fullMark: 100 },
    { subject: 'Attendance', A: student.attendance, fullMark: 100 },
    { subject: 'Participation', A: Math.min(student.avgScore + 5, 100), fullMark: 100 },
    { subject: 'Consistency', A: student.attendance > 90 ? 95 : student.attendance > 75 ? 80 : 60, fullMark: 100 },
    { subject: 'Growth', A: student.avgScore > 85 ? 90 : 70, fullMark: 100 },
    { subject: 'Engagement', A: student.status === 'active' ? 92 : 65, fullMark: 100 },
  ]

  const courseStudents = allStudents.filter(s => s.course === student.course).sort((a, b) => b.avgScore - a.avgScore)
  const classRank = courseStudents.findIndex(s => s.id === student.id) + 1

  return (
    <div className="page-container">
      <button onClick={onBack} className="flex items-center gap-2 text-vriddhi-muted hover:text-white transition-colors mb-6">
        <ChevronRight size={16} className="rotate-180" />
        Back to {student.course} Students
      </button>

      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-vriddhi-accent/20 flex items-center justify-center text-4xl font-bold text-vriddhi-accent border-2 border-vriddhi-accent/30">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white">{student.name}</h2>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-vriddhi-muted">
              <span className="flex items-center gap-1.5"><User size={16} /> {student.regNo}</span>
              <span className="flex items-center gap-1.5"><BookOpen size={16} /> {student.course} · Div {student.division}</span>
              <span className="flex items-center gap-1.5"><Calendar size={16} /> Batch {student.batch}</span>
              <span className="flex items-center gap-1.5"><Award size={16} /> {student.mentor}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center p-5 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-3xl font-bold text-green-400">{student.attendance}%</p>
              <p className="text-xs text-green-400/70 mt-1">Attendance</p>
            </div>
            <div className="text-center p-5 rounded-xl bg-vriddhi-accent/10 border border-vriddhi-accent/20">
              <p className="text-3xl font-bold text-vriddhi-accent">{student.avgScore}%</p>
              <p className="text-xs text-vriddhi-accent/70 mt-1">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {detailTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDetailTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                ${activeDetailTab === tab.id ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card text-vriddhi-muted hover:text-white hover:bg-vriddhi-border/50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeDetailTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                <PolarRadiusAxis stroke="#334155" fontSize={10} />
                <Radar name={student.name} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award size={20} className="text-green-400" />
                What They're Good At
              </h3>
              {student.strengths.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {student.strengths.map((strength, i) => (
                    <span key={i} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-medium border border-green-500/30">{strength}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-vriddhi-muted">No strengths recorded yet</p>}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-400" />
                Areas to Improve
              </h3>
              {student.weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {student.weaknesses.map((weakness, i) => (
                    <span key={i} className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium border border-amber-500/30">{weakness}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-vriddhi-muted">No areas of concern identified</p>}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-vriddhi-dark/50">
                  <p className="text-xs text-vriddhi-muted mb-1">Total Assessments</p>
                  <p className="text-2xl font-bold text-white">{student.assessments.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-vriddhi-dark/50">
                  <p className="text-xs text-vriddhi-muted mb-1">Class Rank</p>
                  <p className="text-2xl font-bold text-vriddhi-accent">#{classRank}</p>
                </div>
                <div className="p-4 rounded-xl bg-vriddhi-dark/50">
                  <p className="text-xs text-vriddhi-muted mb-1">Highest Score</p>
                  <p className="text-2xl font-bold text-green-400">{Math.max(...student.assessments.map(a => a.score), 0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-vriddhi-dark/50">
                  <p className="text-xs text-vriddhi-muted mb-1">Lowest Score</p>
                  <p className="text-2xl font-bold text-amber-400">{Math.min(...student.assessments.map(a => a.score), 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeDetailTab === 'academics' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assessment History</h3>
            {student.assessments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-vriddhi-border">
                      <th className="table-header">Assessment</th>
                      <th className="table-header">Subject</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Score</th>
                      <th className="table-header">Rank</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.assessments.map((assessment, i) => (
                      <tr key={i} className="hover:bg-vriddhi-dark/30 transition-colors">
                        <td className="table-cell font-medium">{assessment.name}</td>
                        <td className="table-cell text-vriddhi-muted">{assessment.subject}</td>
                        <td className="table-cell text-vriddhi-muted">{assessment.date}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-vriddhi-dark rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${assessment.score >= 90 ? 'bg-green-500' : assessment.score >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${assessment.score}%` }} />
                            </div>
                            <span className="font-semibold">{assessment.score}%</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${assessment.rank <= 3 ? 'bg-vriddhi-accent/20 text-vriddhi-accent' : 'bg-vriddhi-muted/20 text-vriddhi-muted'}`}>
                            #{assessment.rank}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${assessment.score >= 85 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {assessment.score >= 85 ? 'Excellent' : 'Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-vriddhi-muted text-center py-8">No assessment records found</p>
            )}
          </div>
        </div>
      )}

      {activeDetailTab === 'insights' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-vriddhi-accent" />
              AI-Powered Insights for {student.name}
            </h3>
            <div className="space-y-4">
              {student.avgScore >= 90 && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-green-300">Exceptional Performer</p>
                    <p className="text-sm text-vriddhi-muted mt-1">Scoring {student.avgScore}% average, {student.name} is among the top performers in {student.course}. Consider for peer mentoring roles.</p>
                  </div>
                </div>
              )}
              {student.attendance < 80 && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-red-300">Attendance Concern</p>
                    <p className="text-sm text-vriddhi-muted mt-1">At {student.attendance}%, attendance is below recommended threshold. Schedule a mentorship check-in with {student.mentor}.</p>
                  </div>
                </div>
              )}
              {student.strengths.length > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-vriddhi-accent/5 border border-vriddhi-accent/20">
                  <div className="w-10 h-10 rounded-xl bg-vriddhi-accent/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-vriddhi-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-vriddhi-accent">Core Strengths</p>
                    <p className="text-sm text-vriddhi-muted mt-1">Strong aptitude in: {student.strengths.join(', ')}. Recommend advanced coursework or projects in these areas.</p>
                  </div>
                </div>
              )}
              {student.weaknesses.length > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-300">Development Areas</p>
                    <p className="text-sm text-vriddhi-muted mt-1">Needs support in: {student.weaknesses.join(', ')}. Consider remedial classes or peer tutoring.</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-blue-300">Recommendation</p>
                  <p className="text-sm text-vriddhi-muted mt-1">
                    {student.avgScore >= 85 ? 'Eligible for honors program and internship opportunities.' : student.avgScore >= 70 ? 'On track. Focus on consistent practice and revision.' : 'Needs structured study plan and regular check-ins.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-vriddhi-dark/50 hover:bg-vriddhi-border/30 transition-colors text-left">
                <FileText className="w-5 h-5 text-vriddhi-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Generate Progress Report</p>
                  <p className="text-xs text-vriddhi-muted">Create a detailed PDF report for this student</p>
                </div>
                <ChevronRight size={16} className="text-vriddhi-muted" />
              </button>
              <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-vriddhi-dark/50 hover:bg-vriddhi-border/30 transition-colors text-left">
                <Calendar className="w-5 h-5 text-vriddhi-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Schedule Mentorship Session</p>
                  <p className="text-xs text-vriddhi-muted">Book a one-on-one with {student.mentor}</p>
                </div>
                <ChevronRight size={16} className="text-vriddhi-muted" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}