import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Bell, Send, X, Check, AlertCircle, Info,
  Megaphone, Calendar, Users, Trash2, Eye, Clock,
  Search, Pin, Loader2, GraduationCap, Layers
} from 'lucide-react'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/Firebase/config'
import { useAuth } from '@/modules/auth/context/AuthContext'

// ------------------------------------------------------------------
// Faculty announcements composer.
//
// Writes and reads go through the `notifications` callables, which resolve
// targeting against the students' real batch/branch profiles and keep
// per-recipient read state. The previous version wrote `target`/`batchFilter`
// to `notifications` with no recipient field, so neither student reader could
// find the message, and it estimated delivery with
// `Math.round(studentCount * 0.2)` — the "Sent to N" figure was invented.
// ------------------------------------------------------------------

type Priority = 'high' | 'normal' | 'low' | 'urgent'
type TargetAudience = 'all' | 'cohort'

interface Announcement {
  id: string
  title: string
  message: string
  priority: Priority
  type: string
  audience: TargetAudience
  cohort: { branches: string[]; batches: string[]; division: string; semester: number } | null
  sentByName: string
  createdAt: string | null
  readCount: number
  recipientCount: number
  pinned: boolean
  category: string
}

interface CohortOptions {
  batches: string[]
  branches: string[]
  studentCount: number
}

const priorityConfig: Record<Priority, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  urgent: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <AlertCircle className="w-4 h-4" />, label: 'Urgent' },
  high: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: <AlertCircle className="w-4 h-4" />, label: 'High' },
  normal: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Info className="w-4 h-4" />, label: 'Normal' },
  low: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: <Clock className="w-4 h-4" />, label: 'Low' },
}

const categoryConfig: Record<string, { color: string; label: string }> = {
  general: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'General' },
  exam: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Exam' },
  assignment: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Assignment' },
  schedule: { color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', label: 'Schedule' },
  event: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Event' },
  placement: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Placement' },
}

/**
 * Callable failures carry a readable `message` (the server throws
 * `HttpsError`, which is not part of the client SDK's public types); surface it
 * instead of a generic toast.
 */
function describeError(err: unknown): string {
  const message = (err as { message?: unknown })?.message
  return typeof message === 'string' && message.length > 0
    ? message
    : 'Something went wrong. Please try again.'
}

function formatSent(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FacultyAnnouncements() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cohorts, setCohorts] = useState<CohortOptions>({ batches: [], branches: [], studentCount: 0 })
  const [showCompose, setShowCompose] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deliveryNotice, setDeliveryNotice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')

  // Compose form state
  const [composeTitle, setComposeTitle] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [composePriority, setComposePriority] = useState<Priority>('normal')
  const [composeTarget, setComposeTarget] = useState<TargetAudience>('cohort')
  const [composeBatches, setComposeBatches] = useState<string[]>([])
  const [composeBranches, setComposeBranches] = useState<string[]>([])
  const [composeCategory, setComposeCategory] = useState<string>('general')

  const fetchAnnouncements = useCallback(async () => {
    if (!collegeId) {
      setLoading(false)
      setLoadError('No college is linked to this sign-in.')
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const list = httpsCallable<{ collegeId: string }, { announcements: Announcement[] }>(
        functions,
        'listCollegeAnnouncements'
      )
      const result = await list({ collegeId })
      setAnnouncements(result.data.announcements)
    } catch (err) {
      setLoadError(describeError(err))
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }, [collegeId])

  /** Distinct batches and branches, read from the real roster. */
  const fetchCohortData = useCallback(async () => {
    if (!collegeId) return
    try {
      const snap = await getDocs(
        query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(1000))
      )
      const batches = new Set<string>()
      const branches = new Set<string>()
      snap.docs.forEach((docSnap) => {
        const row = docSnap.data()
        const batch = String(row.batch || row.academicYear || '').trim()
        const branch = String(row.branch || row.department || '').trim()
        if (batch) batches.add(batch)
        if (branch) branches.add(branch)
      })
      setCohorts({
        batches: [...batches].sort(),
        branches: [...branches].sort(),
        studentCount: snap.size,
      })
    } catch (err) {
      // Honest failure beats a fabricated year list: a guessed batch menu lets
      // faculty address a cohort that does not exist.
      console.error('[FacultyAnnouncements] cohort fetch error:', err)
      setCohorts({ batches: [], branches: [], studentCount: 0 })
    }
  }, [collegeId])

  useEffect(() => {
    void fetchAnnouncements()
    void fetchCohortData()
  }, [fetchAnnouncements, fetchCohortData])

  const toggleValue = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value])
  }

  const cohortSelected = composeBatches.length > 0 || composeBranches.length > 0

  const resetCompose = () => {
    setComposeTitle('')
    setComposeMessage('')
    setComposePriority('normal')
    setComposeTarget('cohort')
    setComposeBatches([])
    setComposeBranches([])
    setComposeCategory('general')
    setFormError('')
  }

  const handleSend = async () => {
    if (!composeTitle.trim() || !composeMessage.trim() || !collegeId) return
    if (composeTarget === 'cohort' && !cohortSelected) {
      setFormError('Choose at least one batch or branch.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const send = httpsCallable<
        Record<string, unknown>,
        { id: string; recipientCount: number }
      >(functions, 'sendAnnouncement')

      const result = await send({
        collegeId,
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        priority: composePriority,
        category: composeCategory,
        type: composeCategory === 'exam' ? 'warning' : composeCategory === 'event' ? 'event' : 'info',
        audience: composeTarget,
        ...(composeTarget === 'cohort'
          ? { cohort: { batches: composeBatches, branches: composeBranches } }
          : {}),
      })

      // The server returns the real recipient count it computed from the
      // roster, so the composer reports a number that is actually true.
      await fetchAnnouncements()
      setShowCompose(false)
      resetCompose()
      setDeliveryNotice(`Delivered to ${result.data.recipientCount} student${result.data.recipientCount === 1 ? '' : 's'}.`)
    } catch (err) {
      setFormError(describeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const remove = httpsCallable<{ announcementId: string }, { deleted: boolean }>(
        functions,
        'deleteAnnouncement'
      )
      await remove({ announcementId: id })
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setFormError(describeError(err))
    }
  }

  const handlePin = async (id: string) => {
    const item = announcements.find((a) => a.id === id)
    if (!item) return
    try {
      const pin = httpsCallable<{ announcementId: string; pinned: boolean }, { pinned: boolean }>(
        functions,
        'setAnnouncementPinned'
      )
      const result = await pin({ announcementId: id, pinned: !item.pinned })
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, pinned: result.data.pinned } : a))
      )
    } catch (err) {
      setFormError(describeError(err))
    }
  }

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      const haystack = `${a.title} ${a.message}`.toLowerCase()
      const matchesSearch = haystack.includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === 'all' || a.category === filterCategory
      const matchesPriority = filterPriority === 'all' || a.priority === filterPriority
      return matchesSearch && matchesCategory && matchesPriority
    })
  }, [announcements, searchQuery, filterCategory, filterPriority])

  const stats = useMemo(() => {
    const totalSent = announcements.length
    const highPriority = announcements.filter((a) => a.priority === 'high' || a.priority === 'urgent').length
    const pinned = announcements.filter((a) => a.pinned).length
    // Real read rate: recipients who opened it over recipients addressed.
    const addressed = announcements.reduce((acc, a) => acc + (a.recipientCount || 0), 0)
    const opened = announcements.reduce((acc, a) => acc + (a.readCount || 0), 0)
    const avgReadRate = addressed > 0 ? Math.round((opened / addressed) * 100) : 0

    return [
      { label: 'Total Sent', value: totalSent, color: 'text-teal-400' },
      { label: 'High Priority', value: highPriority, color: 'text-rose-400' },
      { label: 'Pinned', value: pinned, color: 'text-amber-400' },
      { label: 'Read Rate', value: `${avgReadRate}%`, color: 'text-blue-400' },
    ]
  }, [announcements])

  const audienceLabel = (a: Announcement): string => {
    if (a.audience === 'all') return 'All students'
    if (!a.cohort) return 'Targeted'
    const parts: string[] = []
    if (a.cohort.batches.length > 0) parts.push(a.cohort.batches.join(', '))
    if (a.cohort.branches.length > 0) parts.push(a.cohort.branches.join(', '))
    return parts.length > 0 ? parts.join(' · ') : 'Targeted'
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-teal-400" />
              Announcements
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Send and manage live notices to students</p>
          </div>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all text-sm shadow-sm"
        >
          <Send className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {deliveryNotice && (
        <div className="mb-6 flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <span className="flex items-center gap-2"><Check className="w-4 h-4" />{deliveryNotice}</span>
          <button onClick={() => setDeliveryNotice('')} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loadError && (
        <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
        >
          <option value="all">All categories</option>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
        >
          <option value="all">All priorities</option>
          {Object.entries(priorityConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-900 dark:text-white font-semibold text-sm">No announcements yet</p>
          <p className="text-xs text-slate-500 mt-1">Compose one to reach students by batch and branch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const priority = priorityConfig[a.priority] || priorityConfig.normal
            const category = categoryConfig[a.category] || categoryConfig.general
            const readRate = a.recipientCount > 0 ? Math.round((a.readCount / a.recipientCount) * 100) : 0
            return (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:border-teal-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {a.pinned && <Pin className="w-3.5 h-3.5 text-amber-400" />}
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{a.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color}`}>
                        {priority.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${category.color}`}>
                        {category.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-2">
                      {a.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2.5 flex-wrap text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{audienceLabel(a)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.recipientCount} recipients</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.readCount} read ({readRate}%)</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatSent(a.createdAt)}</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{a.sentByName || 'Faculty'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => void handlePin(a.id)}
                      title={a.pinned ? 'Unpin' : 'Pin'}
                      className="p-2 rounded-lg hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => void handleDelete(a.id)}
                      title="Delete"
                      className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Announcement</h2>
              <button onClick={() => setShowCompose(false)} disabled={submitting} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                <input
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  maxLength={160}
                  placeholder="e.g. Internal Assessment 2 schedule released"
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Message</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  placeholder="Write the notice students will see..."
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                  <select
                    value={composeCategory}
                    onChange={(e) => setComposeCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 text-sm"
                  >
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={composePriority}
                    onChange={(e) => setComposePriority(e.target.value as Priority)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 text-sm"
                  >
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setComposeTarget('cohort')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      composeTarget === 'cohort'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Batch &amp; Branch
                  </button>
                  <button
                    onClick={() => setComposeTarget('all')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      composeTarget === 'all'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    Whole college
                  </button>
                </div>
              </div>

              {composeTarget === 'cohort' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">
                      Batches <span className="text-slate-400">(select any)</span>
                    </label>
                    {cohorts.batches.length === 0 ? (
                      <p className="text-xs text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        No batches found on student records for this college. Add batch values to student
                        profiles before targeting a cohort.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cohorts.batches.map((batch) => (
                          <button
                            key={batch}
                            onClick={() => toggleValue(composeBatches, batch, setComposeBatches)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              composeBatches.includes(batch)
                                ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {batch}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">
                      Branches <span className="text-slate-400">(select any)</span>
                    </label>
                    {cohorts.branches.length === 0 ? (
                      <p className="text-xs text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        No branches found on student records for this college.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cohorts.branches.map((branch) => (
                          <button
                            key={branch}
                            onClick={() => toggleValue(composeBranches, branch, setComposeBranches)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              composeBranches.includes(branch)
                                ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {branch}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="text-slate-800 dark:text-slate-300 font-medium">Delivery:</span>{' '}
                  {composeTarget === 'all'
                    ? `Every student in the college (${cohorts.studentCount} on record). Leadership roles only.`
                    : cohortSelected
                      ? [
                          composeBatches.length > 0 ? composeBatches.join(', ') : 'all batches',
                          composeBranches.length > 0 ? composeBranches.join(', ') : 'all branches',
                        ].join(' · ')
                      : 'Choose a batch or branch to address a cohort.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  The exact recipient count is computed from student records when you send.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCompose(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSend()}
                disabled={submitting || !composeTitle.trim() || !composeMessage.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Sending...' : 'Send Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
