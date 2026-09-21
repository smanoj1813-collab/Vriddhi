import { useFacultyJourney, useFacultyTimeline } from '@/modules/admin/hooks/useJourney'
import { Loader2, MapPin, Users, Clock, BarChart3, BookOpen, Award, Layers, Target, TrendingUp, CheckCircle, Circle, Calendar, AlertTriangle } from 'lucide-react'
import PWAInstallCard from '@/shared/components/PWAInstallCard'

type MilestoneStatus = 'completed' | 'active' | 'upcoming' | 'warning'

const StatusBadge = ({ status }: { status: MilestoneStatus }) => {
  const styles = {
    completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-green-400 border-green-500/30',
    active: 'bg-amber-100 dark:bg-amber-900/30 text-amber-400 border-amber-500/30',
    upcoming: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
    warning: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels = { completed: 'Completed', active: 'In Progress', upcoming: 'Upcoming', warning: 'At Risk' }
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[status]}`}>{labels[status]}</span>
}

const StatusIcon = ({ status }: { status: MilestoneStatus }) => {
  const styles = {
    completed: 'bg-emerald-100 dark:bg-emerald-900/30 border-green-500 text-green-400',
    active: 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-400',
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

const Timeline = ({ milestones }: { milestones: any[] }) => (
  <div className="relative">
    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
    <div className="space-y-6">
      {milestones.map((m) => (
        <div key={m.id} className="relative flex items-start gap-4 pl-12">
          <StatusIcon status={m.status} />
          <div className="flex-1 p-4 rounded-xl glass-card/50 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e]">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{m.title}</h4>
              <StatusBadge status={m.status} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{m.description}</p>
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
  <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
    <div className="flex items-center gap-3 mb-2">
      <div className={color}>{icon}</div>
      <span className="text-slate-600 dark:text-slate-400 text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
)

export default function FacultyJourneyPage() {
  const { data, loading } = useFacultyJourney()
  const facultyEmail = (() => {
    try { const raw = localStorage.getItem('vriddhi_user'); return raw ? JSON.parse(raw).email || '' : '' } catch { return '' }
  })()
  const facultyName = data?.faculty.name || ''
  const { milestones, loading: timelineLoading } = useFacultyTimeline(facultyEmail, facultyName)

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
  }

  if (!data) {
    return <div className="p-8 text-center border rounded-2xl bg-white dark:bg-[#131b2e]"><p className="text-slate-600 dark:text-slate-400">No faculty data available. Please check your profile settings.</p></div>
  }

  const stats = [
    { label: 'Years of Service', value: data.yearsOfService ?? 0, icon: <Clock className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Students Mentored', value: data.totalStudents ?? 0, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Avg Student Score', value: `${data.avgStudentScore ?? 0}%`, icon: <BarChart3 className="w-5 h-5" />, color: 'text-amber-400' },
    { label: 'Classes This Week', value: data.classesThisWeek ?? 0, icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-400' },
  ]

  const pieData = [
    { label: 'Good', value: data.studentPerformanceDistribution.good, color: 'bg-green-500' },
    { label: 'Average', value: data.studentPerformanceDistribution.average, color: 'bg-amber-500' },
    { label: 'Weak', value: data.studentPerformanceDistribution.weak, color: 'bg-red-500' },
  ]
  const totalStudents = data.studentPerformanceDistribution.good + data.studentPerformanceDistribution.average + data.studentPerformanceDistribution.weak

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faculty Journey</h1>
        <p className="text-sm text-slate-500">Your teaching career timeline — connected to real assessments, papers, student outcomes</p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Users className="w-7 h-7 text-purple-600 dark:text-purple-400" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.faculty.title} {data.faculty.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{data.faculty.department} Department · {data.yearsOfService} years of service</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      <PWAInstallCard variant="banner" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />Career Timeline — Connected to Real Data</h3>
          {timelineLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : milestones.length === 0 ? (
            <p className="text-slate-500 text-center py-10">No faculty activity yet. Create assessments, papers to see timeline.</p>
          ) : (
            <Timeline milestones={milestones} />
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />Student Performance</h3>
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
                    <span className="text-slate-600 dark:text-slate-400">{d.label}: <span className="text-slate-900 dark:text-white">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-400" />Teaching Progress</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-600 dark:text-slate-400">Topics Covered</span><span className="text-xs text-emerald-400">{data.topicsCovered}/{data.topicsCovered + data.topicsPending}</span></div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data.topicsCovered + data.topicsPending) > 0 ? (data.topicsCovered / (data.topicsCovered + data.topicsPending)) * 100 : 0}%` }} /></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-600 dark:text-slate-400">Papers Uploaded</span><span className="text-xs text-blue-600 dark:text-blue-400">{data.papersUploaded}</span></div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(data.papersUploaded * 20, 100)}%` }} /></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-600 dark:text-slate-400">Avg Attendance</span><span className="text-xs text-purple-600 dark:text-purple-400">{data.avgAttendance}%</span></div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${data.avgAttendance}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
