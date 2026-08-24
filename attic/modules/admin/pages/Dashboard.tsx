import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, BookOpen, ClipboardCheck, TrendingUp, Award,
  ArrowUpRight, ArrowDownRight, Calendar, Clock, Info,
  Upload, Database, RefreshCw, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { useDashboardData } from '../../admin/hooks/useDashboardData'

// ─── Tooltip Component ───────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block ml-2">
      <Info
        size={14}
        className="text-vriddhi-muted cursor-help hover:text-vriddhi-accent transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-vriddhi-card border border-vriddhi-border rounded-xl shadow-xl z-50">
          <p className="text-xs text-vriddhi-text leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-vriddhi-card" />
        </div>
      )}
    </div>
  )
}

// ─── Stat Card Component ─────────────────────────────────
function StatCard({
  label, value, change, changeType, icon: Icon, color,
  filterComponent, infoText, loading
}: {
  label: string
  value: string
  change: string
  changeType: 'up' | 'down'
  icon: React.ElementType
  color: string
  filterComponent?: React.ReactNode
  infoText: string
  loading?: boolean
}) {
  const ChangeIcon = changeType === 'up' ? ArrowUpRight : ArrowDownRight
  const changeColor = changeType === 'up' ? 'text-green-400' : 'text-red-400'

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
          <ChangeIcon className="w-4 h-4" />
          {change}
        </div>
      </div>
      <div className="flex items-center mb-1">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
        ) : (
          <p className="text-3xl font-bold text-white">{value}</p>
        )}
        <InfoTooltip text={infoText} />
      </div>
      <p className="text-sm text-vriddhi-muted mb-3">{label}</p>
      {filterComponent && <div className="mt-2">{filterComponent}</div>}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function Dashboard() {
  const {
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
    updateFilters,
    refreshData,
  } = useDashboardData()

  const [showDataSourceModal, setShowDataSourceModal] = useState(false)

  const branches = ['all', 'BCom', 'BA', 'BSc']
  const currentYear = new Date().getFullYear()
  const batches = ['all', ...Array.from({ length: 6 }, (_, i) => (currentYear + 1 - i).toString())]

  const studentFilter = (
    <div className="flex gap-2">
      <select
        value={filters.studentBranch}
        onChange={(e) => updateFilters({ studentBranch: e.target.value })}
        className="w-full text-xs bg-vriddhi-dark border border-vriddhi-border rounded-lg px-2 py-1 text-vriddhi-text focus:outline-none focus:border-vriddhi-accent"
      >
        <option value="all">All Branches</option>
        {branches.filter(b => b !== 'all').map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <select
        value={filters.studentBatch}
        onChange={(e) => updateFilters({ studentBatch: e.target.value })}
        className="w-full text-xs bg-vriddhi-dark border border-vriddhi-border rounded-lg px-2 py-1 text-vriddhi-text focus:outline-none focus:border-vriddhi-accent"
      >
        <option value="all">All Batches</option>
        {batches.filter(b => b !== 'all').map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>
  )

  const attendanceFilter = (
    <div className="flex gap-2">
      <select
        value={filters.attendanceBranch}
        onChange={(e) => updateFilters({ attendanceBranch: e.target.value })}
        className="w-full text-xs bg-vriddhi-dark border border-vriddhi-border rounded-lg px-2 py-1 text-vriddhi-text focus:outline-none focus:border-vriddhi-accent"
      >
        <option value="all">All Branches</option>
        {branches.filter(b => b !== 'all').map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <select
        value={filters.attendanceBatch}
        onChange={(e) => updateFilters({ attendanceBatch: e.target.value })}
        className="w-full text-xs bg-vriddhi-dark border border-vriddhi-border rounded-lg px-2 py-1 text-vriddhi-text focus:outline-none focus:border-vriddhi-accent"
      >
        <option value="all">All Batches</option>
        {batches.filter(b => b !== 'all').map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>
  )

  const getChange = (value: number, baseline: number): { change: string; type: 'up' | 'down' } => {
    const diff = value - baseline
    return {
      change: diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
      type: diff >= 0 ? 'up' : 'down',
    }
  }

  const studentChange = getChange(filteredStudentCount, 10)
  const attendanceChange = getChange(attendanceRate, 85)
  const passRateChange = getChange(passRate, 88)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title mb-1">Dashboard</h1>
          <p className="text-vriddhi-muted">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDataSourceModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 transition-colors"
          >
            <Database size={16} />
            Data Source
          </button>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-sm text-vriddhi-muted">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Students"
          value={filteredStudentCount.toString()}
          change={studentChange.change}
          changeType={studentChange.type}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
          filterComponent={studentFilter}
          infoText="Total number of active students currently enrolled. Filter by Branch (BCom/BA/BSc) and Batch (Year of admission) to see specific segments."
          loading={loading}
        />
        <StatCard
          label="Active Assessments"
          value={activeAssessments.toString()}
          change="+2"
          changeType="up"
          icon={BookOpen}
          color="bg-purple-500/20 text-purple-400"
          infoText="Number of assessments currently active or scheduled for this academic period. Includes CTDs, Mid-terms, and Final exams."
          loading={loading}
        />
        <StatCard
          label="Avg Attendance"
          value={`${attendanceRate}%`}
          change={attendanceChange.change + '%'}
          changeType={attendanceChange.type}
          icon={ClipboardCheck}
          color="bg-green-500/20 text-green-400"
          filterComponent={attendanceFilter}
          infoText="Average daily attendance across all classes. Calculated as: (Total Present / Total Enrolled) x 100. Filter by Branch and Batch for specific insights."
          loading={loading}
        />
        <StatCard
          label="Pass Rate"
          value={`${passRate}%`}
          change={passRateChange.change + '%'}
          changeType={passRateChange.type}
          icon={TrendingUp}
          color="bg-amber-500/20 text-amber-400"
          infoText="Percentage of students who scored above the minimum passing marks (40%) across all assessments. Calculated as: (Students Passed / Total Students) x 100."
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Attendance */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Weekly Attendance</h3>
            <Link to="/attendance" className="text-sm text-vriddhi-accent hover:underline">View All</Link>
          </div>
          <p className="text-xs text-vriddhi-muted mb-4">
            Current week: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            Total students tracked across all branches
          </p>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                    formatter={(value, name) => {
                      const numValue = typeof value === 'number' ? value : 0
                      return [`${numValue} students`, name === 'present' ? 'Present' : 'Absent']
                    }}
                  />
                  <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} name="present" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="absent" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-vriddhi-border">
                {Object.entries(branchTotals).map(([branch, data]) => (
                  <div key={branch} className="text-center">
                    <p className="text-sm font-semibold text-white">{branch}</p>
                    <p className="text-xs text-vriddhi-muted mt-1">
                      {data.totalPresent} present / {data.totalAbsent} absent
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      {data.totalStudents > 0 ? ((data.totalPresent / data.totalStudents) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Performance Trend */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Performance Trend</h3>
            <Link to="/analytics" className="text-sm text-vriddhi-accent hover:underline">View All</Link>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-vriddhi-muted" />
            <p className="text-xs text-vriddhi-muted">
              Measured as: Average score across all subjects & assessments per month.
              Minimum 3 assessments required for calculation.
            </p>
          </div>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => {
                    const numValue = typeof value === 'number' ? value : 0
                    return [`${numValue}%`, 'Avg Score']
                  }}
                />
                <Area type="monotone" dataKey="avg" stroke="#6366f1" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <Clock className="w-5 h-5 text-vriddhi-muted" />
          </div>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { id: 1, action: 'New assessment created', subject: 'CTD 3 - Financial Accounting', time: '2 hours ago', icon: BookOpen },
                { id: 2, action: 'Attendance marked', subject: 'BCom 2nd Year - Morning', time: '4 hours ago', icon: ClipboardCheck },
                { id: 3, action: 'Student added', subject: 'Rahul Sharma - BSc Physics', time: '6 hours ago', icon: Users },
                { id: 4, action: 'Report generated', subject: 'Monthly Performance Analysis', time: '1 day ago', icon: TrendingUp },
                { id: 5, action: 'Question bank updated', subject: '+50 new questions added', time: '1 day ago', icon: BookOpen },
              ].map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-vriddhi-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-vriddhi-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{activity.action}</p>
                      <p className="text-sm text-vriddhi-muted truncate">{activity.subject}</p>
                    </div>
                    <span className="text-xs text-vriddhi-muted whitespace-nowrap">{activity.time}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Top Performers</h3>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-vriddhi-muted" />
            <p className="text-xs text-vriddhi-muted">
              Ranked by highest average score across all assessments.
              Minimum 1 assessment required. Updated weekly.
            </p>
          </div>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {topPerformers.map((student, i) => (
                  <div key={student.regNo} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 
                        i === 1 ? 'bg-slate-400/20 text-slate-400' : 
                        i === 2 ? 'bg-orange-600/20 text-orange-400' : 'bg-vriddhi-border/50 text-vriddhi-muted'}
                    `}>
                      {student.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{student.name}</p>
                      <p className="text-xs text-vriddhi-muted">{student.regNo} - {student.course}</p>
                      <p className="text-xs text-vriddhi-muted mt-0.5">
                        {student.assessmentsTaken}/{student.totalAssessments} assessments
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">{student.avg}%</p>
                      <p className="text-xs text-vriddhi-muted">avg score</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/students" className="block text-center mt-4 text-sm text-vriddhi-accent hover:underline">
                View All Students
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Data Source Modal */}
      {showDataSourceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
              <h2 className="text-xl font-bold text-white">Data Source</h2>
              <button onClick={() => setShowDataSourceModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <span className="text-vriddhi-muted text-xl">&times;</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Database size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Mock Data</p>
                    <p className="text-xs text-vriddhi-muted">Currently active</p>
                  </div>
                </div>
                <p className="text-xs text-vriddhi-muted mt-2">
                  Using sample data for testing. All values are calculated from mock records.
                </p>
              </div>
              
              <div className="p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Upload size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">CSV Upload</p>
                    <p className="text-xs text-vriddhi-muted">Coming soon</p>
                  </div>
                </div>
                <p className="text-xs text-vriddhi-muted mt-2">
                  Upload Excel/CSV files with student and attendance data.
                </p>
              </div>

              <div className="p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Database size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Firebase</p>
                    <p className="text-xs text-vriddhi-muted">Coming soon</p>
                  </div>
                </div>
                <p className="text-xs text-vriddhi-muted mt-2">
                  Connect to Firebase Realtime Database for live data sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}