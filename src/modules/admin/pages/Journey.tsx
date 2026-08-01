// src/pages/Journey.tsx
// Journey page with College, Faculty, and Student tabs
// Uses useJourney hooks — NO direct Firestore calls. NO onSnapshot.

import React, { useState, useMemo, useEffect } from 'react'
import {
  GraduationCap, Users, Building2, Award, Calendar, CheckCircle, Circle,
  TrendingUp, AlertTriangle, Target, ArrowRight, BookOpen, Star,
  MapPin, Zap, BarChart3, Clock, Trophy, Lightbulb,
  TrendingDown, Minus, User, Layers, Activity, Loader2
} from 'lucide-react'
import { useDashboardData } from '../../admin/hooks/useDashboardData'
import { useCollegeJourney, useFacultyJourney, useStudentJourney } from '../hooks/useJourney'

// ─── Helper Components ──────────────────────────────────

type MilestoneStatus = 'completed' | 'active' | 'upcoming' | 'warning'

const StatusBadge = ({ status }: { status: MilestoneStatus }) => {
  const styles = {
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    upcoming: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    warning: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels = { completed: 'Completed', active: 'In Progress', upcoming: 'Upcoming', warning: 'At Risk' }
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[status]}`}>{labels[status]}</span>
}

const StatusIcon = ({ status }: { status: MilestoneStatus }) => {
  const styles = {
    completed: 'bg-green-500/20 border-green-500 text-green-400',
    active: 'bg-amber-500/20 border-amber-500 text-amber-400',
    upcoming: 'bg-slate-700 border-slate-600 text-slate-400',
    warning: 'bg-red-500/20 border-red-500 text-red-400',
  }
  return (
    <div className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center border-2 ${styles[status]}`}>
      {status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
       status === 'active' ? <TrendingUp className="w-4 h-4" /> :
       status === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
       <Circle className="w-4 h-4" />}
    </div>
  )
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />
  return <Minus className="w-4 h-4 text-slate-400" />
}

interface Suggestion {
  type: 'strength' | 'warning' | 'opportunity'
  title: string
  description: string
  action?: string
}

const SuggestionCard = ({ suggestion }: { suggestion: Suggestion }) => {
  const styles = {
    strength: 'border-green-500/30 bg-green-500/5',
    warning: 'border-red-500/30 bg-red-500/5',
    opportunity: 'border-amber-500/30 bg-amber-500/5',
  }
  const icons = {
    strength: <Zap className="w-5 h-5 text-green-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-red-400" />,
    opportunity: <Target className="w-5 h-5 text-amber-400" />,
  }
  const labels = { strength: 'Strength', warning: 'Warning', opportunity: 'Opportunity' }

  return (
    <div className={`p-4 rounded-xl border ${styles[suggestion.type]} flex items-start gap-3`}>
      <div className="mt-0.5">{icons[suggestion.type]}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            suggestion.type === 'strength' ? 'text-green-400' :
            suggestion.type === 'warning' ? 'text-red-400' : 'text-amber-400'
          }`}>{labels[suggestion.type]}</span>
        </div>
        <h4 className="font-semibold text-white text-sm mb-1">{suggestion.title}</h4>
        <p className="text-sm text-slate-400 mb-2">{suggestion.description}</p>
        {suggestion.action && (
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg w-fit">
            <ArrowRight className="w-3 h-3" /><span>{suggestion.action}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface Milestone {
  id: string
  title: string
  date: string
  status: MilestoneStatus
  description: string
  metric?: string
}

const Timeline = ({ milestones }: { milestones: Milestone[] }) => (
  <div className="relative">
    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
    <div className="space-y-6">
      {milestones.map((m) => (
        <div key={m.id} className="relative flex items-start gap-4 pl-12">
          <StatusIcon status={m.status} />
          <div className="flex-1 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-white">{m.title}</h4>
              <StatusBadge status={m.status} />
            </div>
            <p className="text-sm text-slate-400 mb-1">{m.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.date}</span>
              {m.metric && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{m.metric}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <div className="glass-card p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className={color}>{icon}</div>
      <span className="text-slate-400 text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
)

// ─── College Journey ────────────────────────────────────

const CollegeJourney = () => {
  const { filteredStudentCount, attendanceRate, activeAssessments, passRate, topPerformers, weeklyAttendance, students, loading } = useDashboardData()
  const { milestones, loading: milestonesLoading } = useCollegeJourney()

  const stats = [
    { label: 'Active Students', value: filteredStudentCount, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'Active Assessments', value: activeAssessments, icon: <BookOpen className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Pass Rate', value: `${passRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-400' },
  ]

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxAttendance = Math.max(...weeklyAttendance.map(d => d.total), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-400" />Institutional Timeline</h3>
          {milestonesLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : milestones.length === 0 ? (
            <p className="text-slate-500 text-center py-10">No milestones recorded yet</p>
          ) : (
            <Timeline milestones={milestones} />
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" />Current Standing</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500 mb-1">Total Students</p><p className="text-white font-medium">{students.length}</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500 mb-1">Top Performer</p><p className="text-white font-medium">{topPerformers[0]?.name || 'N/A'}</p><p className="text-xs text-blue-400">{topPerformers[0]?.avg || 0}% avg</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500 mb-1">Programs Offered</p><p className="text-white font-medium">{Array.from(new Set(students.map(s => s.course))).join(', ') || 'N/A'}</p></div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 mb-1">Weekly Attendance</p>
                <div className="flex items-end gap-1 h-16 mt-2">
                  {weeklyAttendance.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-700 rounded-t overflow-hidden relative" style={{ height: `${(d.present / maxAttendance) * 100}%` }}>
                        <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{ height: `${d.total > 0 ? (d.present / d.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" />Key Achievements</h3>
            <div className="space-y-3">
              {milestones.filter(m => m.status === 'completed').slice(0, 4).map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="font-medium text-white text-sm">{m.title}</p>
                    <p className="text-xs text-slate-400">{m.description}</p>
                    <span className="text-xs text-slate-500 mt-0.5">{m.date}</span>
                  </div>
                </div>
              ))}
              {milestones.filter(m => m.status === 'completed').length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No achievements recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Faculty Journey ────────────────────────────────────

const FacultyJourney = () => {
  const { data, loading } = useFacultyJourney()

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
  }

  if (!data) {
    return <div className="glass-card p-8 text-center"><p className="text-slate-400">No faculty data available. Please check your profile settings.</p></div>
  }

  const stats = [
    { label: 'Years of Service', value: data.yearsOfService ?? 0, icon: <Clock className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Students Mentored', value: data.totalStudents ?? 0, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Avg Student Score', value: `${data.avgStudentScore ?? 0}%`, icon: <BarChart3 className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Classes This Week', value: data.classesThisWeek ?? 0, icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-400' },
  ]

  const predictions = [
    { label: 'Expected Promotion', value: 'Professor by 2027', trend: 'up' as const, confidence: 85 },
    { label: 'Research Output', value: '12 papers by 2026', trend: 'up' as const, confidence: 78 },
    { label: 'Student Performance', value: 'Avg 85% next year', trend: 'up' as const, confidence: 72 },
    { label: 'Department Growth', value: '3 new faculty hires', trend: 'up' as const, confidence: 65 },
  ]

  const pieData = [
    { label: 'Good', value: data.studentPerformanceDistribution.good, color: 'bg-green-500' },
    { label: 'Average', value: data.studentPerformanceDistribution.average, color: 'bg-amber-500' },
    { label: 'Weak', value: data.studentPerformanceDistribution.weak, color: 'bg-red-500' },
  ]
  const totalStudents = data.studentPerformanceDistribution.good + data.studentPerformanceDistribution.average + data.studentPerformanceDistribution.weak

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center"><User className="w-7 h-7 text-purple-400" /></div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.faculty.title} {data.faculty.name}</h2>
            <p className="text-slate-400 text-sm">{data.faculty.department} Department · {data.yearsOfService} years of service</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-400" />Career Timeline</h3>
          <p className="text-slate-500 text-center py-10">Faculty timeline data coming soon</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" />Student Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden flex">
                  {pieData.map((d, i) => (
                    <div key={i} className={`${d.color} h-full`} style={{ width: `${totalStudents > 0 ? (d.value / totalStudents) * 100 : 0}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-xs">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${d.color}`} />
                    <span className="text-slate-400">{d.label}: <span className="text-white">{d.value}</span></span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-2 rounded-lg bg-green-500/10 text-center"><p className="text-lg font-bold text-green-400">{data.goodStudentsCount}</p><p className="text-[10px] text-slate-400">Good</p></div>
                <div className="p-2 rounded-lg bg-amber-500/10 text-center"><p className="text-lg font-bold text-amber-400">{data.studentPerformanceDistribution.average}</p><p className="text-[10px] text-slate-400">Average</p></div>
                <div className="p-2 rounded-lg bg-red-500/10 text-center"><p className="text-lg font-bold text-red-400">{data.weakStudentsCount}</p><p className="text-[10px] text-slate-400">Weak</p></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-400" />Career Forecast</h3>
            <div className="space-y-3">
              {predictions.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-400">{p.label}</span><TrendIcon trend={p.trend} /></div>
                  <p className="text-white font-medium text-sm">{p.value}</p>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${p.confidence}%` }} /></div>
                  <p className="text-xs text-slate-500 mt-1">{p.confidence}% confidence</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-400" />Teaching Progress</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-400">Topics Covered</span><span className="text-xs text-emerald-400">{data.topicsCovered}/{data.topicsCovered + data.topicsPending}</span></div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data.topicsCovered + data.topicsPending) > 0 ? (data.topicsCovered / (data.topicsCovered + data.topicsPending)) * 100 : 0}%` }} /></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-400">Papers Uploaded</span><span className="text-xs text-blue-400">{data.papersUploaded}</span></div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(data.papersUploaded * 20, 100)}%` }} /></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-400">Avg Attendance</span><span className="text-xs text-purple-400">{data.avgAttendance}%</span></div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${data.avgAttendance}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Student Journey ────────────────────────────────────

const StudentJourney = () => {
  const { students, loading: studentsLoading } = useDashboardData()
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const { data: studentData, allStudents, loading } = useStudentJourney(selectedStudentId)

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id)
    }
  }, [students, selectedStudentId])

  if (studentsLoading || loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
  }

  if (!studentData) {
    return <div className="glass-card p-8 text-center"><p className="text-slate-400">No student data available. Please check the data source.</p></div>
  }

  const stats = [
    { label: 'Current GPA', value: studentData.currentGPA, icon: <Star className="w-5 h-5" />, color: 'text-amber-400', suffix: '/10' },
    { label: 'Class Rank', value: `#${studentData.rank}`, icon: <Trophy className="w-5 h-5" />, color: 'text-purple-400', suffix: `/${studentData.totalStudents}` },
    { label: 'Attendance', value: `${studentData.attendance}%`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-400', suffix: '' },
    { label: 'Avg Score', value: `${studentData.avgScore}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400', suffix: '' },
  ]

  const getEndGoal = () => {
    if (studentData.currentGPA >= 8.5) return { standing: 'Top Performer - Top 5%', outcome: 'First Class with Distinction', path: 'Honors → Internship → Placement', color: 'green' }
    if (studentData.currentGPA >= 7) return { standing: 'Strong Performer - Top 25%', outcome: 'First Class', path: 'Good Internship → Placement', color: 'blue' }
    if (studentData.currentGPA >= 6) return { standing: 'Average Performer - Middle 50%', outcome: 'Second Class', path: 'Regular Placement → Higher Studies', color: 'amber' }
    if (studentData.currentGPA >= 4) return { standing: 'Below Average - Needs Improvement', outcome: 'Pass Class', path: 'Remedial → Pass → Rebuild', color: 'orange' }
    return { standing: 'At Risk - Critical Intervention', outcome: 'Backlog / Repeat Year', path: 'Remedial → Counseling → Recovery', color: 'red' }
  }

  const endGoal = getEndGoal()

  const suggestions: Suggestion[] = useMemo(() => {
    const result: Suggestion[] = []
    if (studentData.avgScore >= 80) {
      result.push({ type: 'strength', title: 'Excellent Academic Performance', description: `Maintaining ${studentData.avgScore}% average across assessments.`, action: 'Apply for merit scholarships' })
    }
    if (studentData.attendance < 75) {
      result.push({ type: 'warning', title: 'Low Attendance Alert', description: `Current attendance is ${studentData.attendance}%, below the 75% threshold.`, action: 'Meet your mentor immediately' })
    }
    if (studentData.assessmentsTaken < studentData.totalAssessments * 0.5) {
      result.push({ type: 'opportunity', title: 'Complete Pending Assessments', description: `Only ${studentData.assessmentsTaken} of ${studentData.totalAssessments} assessments completed.`, action: 'Schedule remaining exams' })
    }
    if (result.length === 0) {
      result.push({ type: 'strength', title: 'On Track', description: 'You are maintaining good academic standing.', action: 'Keep up the good work' })
    }
    return result
  }, [studentData])

  const predictions = [
    { label: 'Projected GPA', value: `${Math.min(10, studentData.currentGPA * 1.05).toFixed(1)} by end of semester`, trend: 'up' as const, confidence: 78 },
    { label: 'Placement Readiness', value: studentData.currentGPA >= 7 ? 'High' : 'Moderate', trend: studentData.currentGPA >= 7 ? 'up' as const : 'stable' as const, confidence: 82 },
    { label: 'Scholarship Eligibility', value: studentData.currentGPA >= 8 ? 'Eligible' : 'Not Eligible', trend: studentData.currentGPA >= 8 ? 'up' as const : 'down' as const, confidence: 90 },
  ]

  const achievements = [
    { title: 'Consistent Performer', description: 'Maintained above average scores', date: '2024' },
    ...(studentData.avgScore >= 90 ? [{ title: "Dean's List", description: 'Top 10% of the class', date: '2024' }] : []),
    ...(studentData.attendance >= 95 ? [{ title: 'Perfect Attendance', description: '100% attendance record', date: '2024' }] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{studentData.student.name}</h2>
            <p className="text-slate-400 text-sm">Reg No: {studentData.student.regNo} · {studentData.student.course} · Batch {studentData.student.batch}</p>
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.regNo})</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2"><div className={stat.color}>{stat.icon}</div><span className="text-slate-400 text-sm">{stat.label}</span></div>
            <p className="text-2xl font-bold text-white">{stat.value}<span className="text-sm text-slate-500 ml-1">{stat.suffix}</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400" />Academic Timeline</h3>
          <p className="text-slate-500 text-center py-10">Student timeline data coming soon</p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-400" />Current Status</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500 mb-1">Program</p><p className="text-white font-medium">{studentData.student.course} - Batch {studentData.student.batch}</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500 mb-1">Branch</p><p className="text-white font-medium">{studentData.student.branch}</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500 mb-1">CGPA</p><p className="text-2xl font-bold text-amber-400">{studentData.cgpa}</p></div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-1">Assessments</p>
                <p className="text-white font-medium">{studentData.assessmentsTaken} / {studentData.totalAssessments} completed</p>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${studentData.totalAssessments > 0 ? (studentData.assessmentsTaken / studentData.totalAssessments) * 100 : 0}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-400" />Future Predictions</h3>
            <div className="space-y-3">
              {predictions.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-400">{p.label}</span><TrendIcon trend={p.trend} /></div>
                  <p className="text-white font-medium text-sm">{p.value}</p>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${p.confidence}%` }} /></div>
                  <p className="text-xs text-slate-500 mt-1">{p.confidence}% confidence</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" />Achievements</h3>
            <div className="space-y-3">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="font-medium text-white text-sm">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.description}</p>
                    <span className="text-xs text-slate-500 mt-0.5">{a.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {studentData.scoreTrend.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" />Performance Trend</h3>
          <div className="flex items-end gap-2 h-32">
            {studentData.scoreTrend.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-700 rounded-t overflow-hidden relative" style={{ height: '100%' }}>
                  <div className={`absolute bottom-0 w-full rounded-t ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ height: `${score}%` }} />
                </div>
                <span className="text-[10px] text-slate-500">T{i + 1}</span>
                <span className="text-[10px] text-slate-400">{score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400" />AI-Powered Insights & Path Forward</h3>
        <p className="text-sm text-slate-400 mb-6">Based on assessment scores, attendance, and overall metrics — here's where you stand and where you can reach.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} />)}
        </div>
        <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/50">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-400" />Your End Goal & Path</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Current Standing</p>
              <p className="text-white font-medium">{endGoal.standing}</p>
              <div className="mt-2 flex items-center gap-2"><div className={`w-2 h-2 rounded-full bg-${endGoal.color}-400`} /><span className={`text-xs text-${endGoal.color}-400`}>GPA: {studentData.currentGPA} | Rank: #{studentData.rank}/{studentData.totalStudents}</span></div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Projected Outcome</p>
              <p className="text-white font-medium">{endGoal.outcome}</p>
              <div className="mt-2 flex items-center gap-2"><TrendingUp className={`w-4 h-4 text-${endGoal.color}-400`} /><span className={`text-xs text-${endGoal.color}-400`}>{studentData.currentGPA >= 7 ? 'On track for honors' : 'Recovery possible with effort'}</span></div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Next Path</p>
              <p className="text-white font-medium">{endGoal.path}</p>
              <div className="mt-2 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-400" /><span className="text-xs text-blue-400">{studentData.currentGPA >= 8 ? 'Apply for summer internships' : studentData.currentGPA >= 6 ? 'Focus on weak subjects' : 'Meet mentor immediately'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Journey Page ──────────────────────────────────

export default function Journey() {
  const [activeTab, setActiveTab] = useState<'college' | 'faculty' | 'student'>('student')

  const tabs = [
    { id: 'college' as const, label: 'College Journey', icon: <Building2 className="w-4 h-4" /> },
    { id: 'faculty' as const, label: 'Faculty Journey', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'student' as const, label: 'Student Journey', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Journey</h1>
        <p className="text-slate-400">Track progress, predict outcomes, and plan the path ahead</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'college' && <CollegeJourney />}
      {activeTab === 'faculty' && <FacultyJourney />}
      {activeTab === 'student' && <StudentJourney />}
    </div>
  )
}