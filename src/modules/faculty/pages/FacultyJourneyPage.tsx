import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useFacultyJourney, useFacultyTimeline } from '@/modules/admin/hooks/useJourney'
import type { Milestone } from '@/modules/admin/api/journeyApi'
import { Loader2, MapPin, Users, Clock, BarChart3, BookOpen, Layers, Target, CheckCircle, Calendar, AlertTriangle, RefreshCw } from 'lucide-react'
import PWAInstallCard from '@/shared/components/PWAInstallCard'

const card = 'rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800'
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50'
const link = 'font-medium text-teal-700 dark:text-teal-300 underline underline-offset-4'
const percent = (value: number | null) => value === null ? '—' : `${value}%`

function Timeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 dark:border-slate-700 ml-4 pl-6">
      {milestones.map(m => (
        <li key={m.id} className="relative">
          <CheckCircle aria-hidden="true" className="absolute -left-10 top-4 h-7 w-7 rounded-full bg-white dark:bg-[#131b2e] text-emerald-600 dark:text-emerald-400" />
          <div className={`${card} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm break-words">{m.title}</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Recorded</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{m.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Calendar aria-hidden="true" className="w-3 h-3" />{m.date || 'Date not recorded'}</span>
              {m.metric && <span className="rounded bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-blue-700 dark:text-blue-300">{m.metric}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function StatCard({ label, value, hint, icon, color }: { label: string; value: string | number; hint: string; icon: ReactNode; color: string }) {
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden="true" className={color}>{icon}</span>
        <h3 className="text-slate-600 dark:text-slate-400 text-sm">{label}</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  )
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const bounded = Math.max(0, Math.min(100, value))
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={bounded} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${bounded}%` }} /></div>
}

/** The admin Journey tab uses the same data/error semantics as the faculty route. */
export default function FacultyJourneyPage({ embedded = false }: { embedded?: boolean }) {
  const { data, loading, error, refresh } = useFacultyJourney()
  const { milestones, loading: timelineLoading, error: timelineError, limited, refresh: refreshTimeline } = useFacultyTimeline(data?.timelineIdentity)
  const Heading = embedded ? 'h2' : 'h1'
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Heading className="text-2xl font-bold text-slate-900 dark:text-white">Faculty Journey</Heading>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your teaching record, mentee outcomes and recorded activity.</p>
      </div>
      <button type="button" className={button} disabled={loading} onClick={() => void refresh()}>
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh journey
      </button>
    </div>
  )

  if (loading) return <div className="space-y-6 max-w-6xl mx-auto">{header}<div role="status" className="flex items-center justify-center gap-3 py-20 text-slate-500"><Loader2 aria-hidden="true" className="w-7 h-7 animate-spin" />Loading your journey…</div></div>
  if (error || !data) return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {header}
      <div role="alert" className={`${card} p-6 space-y-3`}>
        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-600" />Unable to load your journey</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || 'No sign-in details are available. Sign in again to load your journey.'}</p>
        <div className="flex flex-wrap items-center gap-4"><button type="button" className={button} onClick={() => void refresh()}>Retry journey</button><Link className={link} to="/faculty/settings">Profile settings</Link></div>
      </div>
    </div>
  )

  const stats = [
    { label: 'Years of Service', value: data.yearsOfService ?? '—', hint: data.yearsOfService === null ? 'Joining date not recorded' : 'Completed years since joining', icon: <Clock className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Students Mentored', value: data.totalStudents ?? '—', hint: data.totalStudents === null ? 'Roster unavailable' : 'Assigned to your faculty profile', icon: <Users className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Avg Student Score', value: percent(data.avgStudentScore), hint: data.scoredStudentsCount ? `Mean score across ${data.scoredStudentsCount} graded mentees` : 'No graded mentee results available', icon: <BarChart3 className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Avg Classes / Week', value: data.avgClassesPerWeek ?? '—', hint: 'Delivered classes over the recorded teaching period', icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400' },
  ]
  const distribution = data.studentPerformanceDistribution
  const bands = distribution ? [
    { label: 'Good', value: distribution.good, color: 'bg-emerald-500' },
    { label: 'Average', value: distribution.average, color: 'bg-amber-500' },
    { label: 'Weak', value: distribution.weak, color: 'bg-red-500' },
  ] : []
  const scored = data.scoredStudentsCount || 0
  const totalTopics = data.topicsCovered === null || data.topicsPending === null ? null : data.topicsCovered + data.topicsPending
  const coverage = totalTopics && data.topicsCovered !== null ? data.topicsCovered / totalTopics * 100 : 0
  const facts = [
    { label: 'Syllabus coverage', value: totalTopics === null ? 'Unavailable' : totalTopics > 0 ? `${data.topicsCovered} of ${totalTopics} topics` : 'No topics mapped', detail: 'Based on your assigned curriculum and completed classes.' },
    { label: 'Mentee outcomes', value: data.avgStudentScore === null ? 'No graded summary available' : `${data.avgStudentScore}% average`, detail: data.scoredStudentsCount === null ? 'Results could not be loaded.' : `${data.scoredStudentsCount} graded · ${data.ungradedStudentsCount} without graded results.` },
    { label: 'Class attendance', value: data.avgAttendance === null ? 'Not available' : percent(data.avgAttendance), detail: data.avgAttendance === null ? 'No marked attendance is available for these classes.' : 'Computed from marked attendance, not a default percentage.' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {header}
      {data.profileMissing && (
        <div role="status" className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
          Your sign-in is active, but no faculty profile is linked in this college. Ask your college administrator to link your profile. Activity matched to your sign-in is shown below; unrecorded profile details stay blank.
        </div>
      )}
      {data.warnings.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
          <p className="font-semibold mb-1">Some records are unavailable</p><ul className="list-disc pl-5 space-y-1">{data.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
        </div>
      )}
      <section aria-label="Faculty profile" className={`${card} p-5 flex items-center gap-4`}>
        <div aria-hidden="true" className="w-12 h-12 flex-shrink-0 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Users className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white break-words">{data.faculty.name}</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{data.faculty.title}{data.faculty.department ? ` · ${data.faculty.department}` : ''}</p>
        </div>
      </section>
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-4">{stats.map(stat => <StatCard key={stat.label} {...stat} />)}</div>
      {!embedded && <PWAInstallCard variant="banner" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section aria-label="Career timeline" className={`lg:col-span-2 ${card} p-5 sm:p-6 min-w-0`}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><MapPin aria-hidden="true" className="w-5 h-5 text-purple-600 dark:text-purple-400" />Career Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Connected to your recorded assessments and generated papers.</p>
          {timelineLoading ? (
            <div role="status" className="flex items-center justify-center gap-2 py-10 text-slate-500"><Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" />Loading activity…</div>
          ) : timelineError ? (
            <div role="alert" className="space-y-3 py-4"><p className="text-sm text-slate-600 dark:text-slate-400">{timelineError}</p><button type="button" className={button} onClick={() => void refreshTimeline()}>Retry timeline</button></div>
          ) : milestones.length === 0 ? (
            <div className="py-8 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">No assessments or generated papers are recorded for you yet. Your activity will appear here as you use these tools.</p>
              <div className="flex flex-wrap gap-4 text-sm"><Link className={link} to="/faculty/assessments">Open assessments</Link><Link className={link} to="/faculty/paper-generator">Create a paper</Link></div>
            </div>
          ) : <Timeline milestones={milestones} />}
          {limited && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">This is a limited activity summary, not your complete history. Open Assessments or Generated Papers for the full records.</p>}
        </section>

        <div className="space-y-6 min-w-0">
          <section aria-label="Student performance" className={`${card} p-5`}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Users aria-hidden="true" className="w-5 h-5 text-purple-600 dark:text-purple-400" />Student Performance</h3>
            {scored > 0 ? (
              <div className="space-y-3">
                <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">{bands.map(band => <div key={band.label} className={band.color} style={{ width: `${band.value / scored * 100}%` }} />)}</div>
                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs">{bands.map(band => <li key={band.label} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span aria-hidden="true" className={`w-2 h-2 rounded-full ${band.color}`} />{band.label}: <span className="font-semibold text-slate-900 dark:text-white">{band.value}</span></li>)}</ul>
                <p className="text-xs text-slate-500 dark:text-slate-400">Each mentee is counted once by mean graded score: good ≥80%, average 60–79%, weak &lt;60%.</p>
              </div>
            ) : <p className="text-sm text-slate-500 dark:text-slate-400">{distribution === null ? 'Student performance is unavailable. Refresh to try again.' : data.totalStudents === 0 ? 'No students are assigned to you as mentees yet.' : 'No graded results for your mentees yet.'}</p>}
            {data.ungradedStudentsCount !== null && data.ungradedStudentsCount > 0 && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{data.ungradedStudentsCount} mentee{data.ungradedStudentsCount === 1 ? '' : 's'} without graded results; not classified as weak.</p>}
          </section>

          <section aria-label="Teaching progress" className={`${card} p-5`}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Layers aria-hidden="true" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />Teaching Progress</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-600 dark:text-slate-400">Topics Covered</dt>
                <dd className="mt-1">
                  <span className="font-semibold text-slate-900 dark:text-white">{totalTopics === null ? '—' : totalTopics === 0 ? 'No topics mapped yet' : `${data.topicsCovered}/${totalTopics}`}</span>
                  {totalTopics !== null && totalTopics > 0 && <div className="mt-2"><ProgressBar label="Syllabus coverage" value={coverage} color="bg-emerald-500" /></div>}
                </dd>
              </div>
              <div><dt className="text-slate-600 dark:text-slate-400">Recorded Paper Uploads</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{data.papersUploaded ?? 'Not recorded'}</dd></div>
              <div>
                <dt className="text-slate-600 dark:text-slate-400">Avg Attendance</dt>
                <dd className="mt-1">
                  <span className="font-semibold text-slate-900 dark:text-white">{percent(data.avgAttendance)}</span>
                  {data.avgAttendance !== null ? <div className="mt-2"><ProgressBar label="Class attendance" value={data.avgAttendance} color="bg-purple-500" /></div> : <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No marked attendance available.</p>}
                </dd>
              </div>
            </dl>
            <Link className={`${link} inline-block mt-4 text-sm`} to="/faculty/curriculum">Open My Curriculum</Link>
          </section>

          <section aria-label="Teaching record" className={`${card} p-5`}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Target aria-hidden="true" className="w-5 h-5 text-amber-600 dark:text-amber-400" />Teaching Record</h3>
            <dl className="space-y-4">{facts.map(fact => <div key={fact.label}><dt className="text-xs text-slate-500 dark:text-slate-400">{fact.label}</dt><dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{fact.value}</dd><dd className="mt-1 text-xs text-slate-500 dark:text-slate-400">{fact.detail}</dd></div>)}</dl>
          </section>
        </div>
      </div>
    </div>
  )
}
