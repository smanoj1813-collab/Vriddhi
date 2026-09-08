import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Bell, Send, X, Check, AlertCircle, Info,
  Megaphone, Calendar, Users, Trash2, Eye, Clock,
  Search, Pin, Loader2
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { useAuth } from '@/modules/auth/context/AuthContext'

type Priority = 'high' | 'normal' | 'low'
type TargetAudience = 'all' | 'batch' | 'weak' | 'good'

interface Announcement {
  id: string
  title: string
  message: string
  priority: Priority
  target: TargetAudience
  batchFilter?: string
  sentBy: string
  sentAt: string
  readCount: number
  totalCount: number
  pinned: boolean
  category: 'general' | 'exam' | 'assignment' | 'schedule' | 'urgent'
  collegeId?: string
}

const priorityConfig: Record<Priority, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  high: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: <AlertCircle className="w-4 h-4" />, label: 'High' },
  normal: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Info className="w-4 h-4" />, label: 'Normal' },
  low: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: <Clock className="w-4 h-4" />, label: 'Low' },
}

const categoryConfig: Record<string, { color: string; label: string }> = {
  general: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'General' },
  exam: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Exam' },
  assignment: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Assignment' },
  schedule: { color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', label: 'Schedule' },
  urgent: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Urgent' },
}

export default function FacultyAnnouncements() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<string[]>([])
  const [studentCount, setStudentCount] = useState<number>(0)
  const [showCompose, setShowCompose] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')

  // Compose form state
  const [composeTitle, setComposeTitle] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [composePriority, setComposePriority] = useState<Priority>('normal')
  const [composeTarget, setComposeTarget] = useState<TargetAudience>('all')
  const [composeBatch, setComposeBatch] = useState('All Batches')
  const [composeCategory, setComposeCategory] = useState<Announcement['category']>('general')

  const fetchAnnouncements = useCallback(async () => {
    if (!collegeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const q = query(
        collection(db, 'notifications'),
        where('collegeId', '==', collegeId),
        limit(100)
      )
      const snap = await getDocs(q)
      const items: Announcement[] = snap.docs.map(docSnap => {
        const d = docSnap.data()
        return {
          id: docSnap.id,
          title: d.title || 'Announcement',
          message: d.message || '',
          priority: d.priority || 'normal',
          target: d.target || 'all',
          batchFilter: d.batchFilter,
          sentBy: d.sentBy || d.createdByName || 'Faculty',
          sentAt: d.sentAt || (d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()),
          readCount: d.readCount || 0,
          totalCount: d.totalCount || 1,
          pinned: Boolean(d.pinned),
          category: d.category || 'general',
          collegeId: d.collegeId,
        }
      })
      setAnnouncements(items)
    } catch (err) {
      console.error('[FacultyAnnouncements] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [collegeId])

  const fetchCohortData = useCallback(async () => {
    if (!collegeId) return
    try {
      const q = query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(200))
      const snap = await getDocs(q)
      setStudentCount(snap.size)
      const uniqueBatches = Array.from(new Set(snap.docs.map(d => d.data().batch).filter(Boolean))) as string[]
      setBatches(uniqueBatches.length > 0 ? uniqueBatches : ['2026', '2027', '2028'])
    } catch (err) {
      console.error('[FacultyAnnouncements] cohort fetch error:', err)
      setBatches(['2026', '2027', '2028'])
    }
  }, [collegeId])

  useEffect(() => {
    fetchAnnouncements()
    fetchCohortData()
  }, [fetchAnnouncements, fetchCohortData])

  const handleSend = async () => {
    if (!composeTitle.trim() || !composeMessage.trim() || !collegeId) return

    setSubmitting(true)
    try {
      const targetCount = composeTarget === 'all' ? Math.max(studentCount, 1) :
        composeTarget === 'batch' ? Math.max(Math.round(studentCount / Math.max(batches.length, 1)), 1) :
        Math.max(Math.round(studentCount * 0.2), 1)

      const payload = {
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        priority: composePriority,
        target: composeTarget,
        batchFilter: composeTarget === 'batch' ? composeBatch : null,
        sentBy: user?.name || 'Faculty',
        createdBy: user?.uid || user?.id || '',
        collegeId,
        sentAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        readCount: 0,
        totalCount: targetCount,
        pinned: false,
        read: false,
        category: composeCategory,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'notifications'), payload)
      const newAnnouncement: Announcement = {
        id: docRef.id,
        ...payload,
        batchFilter: payload.batchFilter || undefined,
      }

      setAnnouncements(prev => [newAnnouncement, ...prev])
      setShowCompose(false)
      setComposeTitle('')
      setComposeMessage('')
      setComposePriority('normal')
      setComposeTarget('all')
      setComposeBatch('All Batches')
      setComposeCategory('general')
    } catch (err) {
      console.error('[FacultyAnnouncements] send error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id))
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('[FacultyAnnouncements] delete error:', err)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    }
  }

  const handlePin = async (id: string) => {
    const item = announcements.find(a => a.id === id)
    if (!item) return
    const nextPinned = !item.pinned
    try {
      await updateDoc(doc(db, 'notifications', id), { pinned: nextPinned })
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: nextPinned } : a))
    } catch (err) {
      console.error('[FacultyAnnouncements] pin error:', err)
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: nextPinned } : a))
    }
  }

  const filtered = useMemo(() => {
    return announcements.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.message.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === 'all' || a.category === filterCategory
      const matchesPriority = filterPriority === 'all' || a.priority === filterPriority
      return matchesSearch && matchesCategory && matchesPriority
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })
  }, [announcements, searchQuery, filterCategory, filterPriority])

  const stats = useMemo(() => {
    const totalSent = announcements.length
    const highPriority = announcements.filter(a => a.priority === 'high').length
    const pinned = announcements.filter(a => a.pinned).length
    const avgReadRate = totalSent === 0
      ? 0
      : Math.round(announcements.reduce((acc, a) => acc + (a.totalCount > 0 ? (a.readCount / a.totalCount) * 100 : 0), 0) / totalSent)

    return [
      { label: 'Total Sent', value: totalSent, color: 'text-teal-400' },
      { label: 'High Priority', value: highPriority, color: 'text-rose-400' },
      { label: 'Pinned', value: pinned, color: 'text-amber-400' },
      { label: 'Avg Read Rate', value: `${avgReadRate}%`, color: 'text-blue-400' },
    ]
  }, [announcements])

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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="exam">Exam</option>
          <option value="assignment">Assignment</option>
          <option value="schedule">Schedule</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
          className="bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading announcements...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-2xl p-12 text-center">
              <Bell className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No announcements found</p>
            </div>
          ) : (
            filtered.map(item => {
              const pConfig = priorityConfig[item.priority]
              const cConfig = categoryConfig[item.category]
              const readRate = item.totalCount > 0 ? Math.round((item.readCount / item.totalCount) * 100) : 0

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-800/50 border rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm ${
                    item.pinned ? 'border-amber-500/30 dark:border-amber-500/20 bg-amber-500/[0.02]' : 'border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {item.pinned && (
                          <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${pConfig.bg} ${pConfig.color}`}>
                          {pConfig.icon} {pConfig.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cConfig.color}`}>
                          {cConfig.label}
                        </span>
                        {item.batchFilter && (
                          <span className="text-xs bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            Batch: {item.batchFilter}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">{item.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 whitespace-pre-wrap">{item.message}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          By {item.sentBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.sentAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {item.readCount}/{item.totalCount} read ({readRate}%)
                        </span>
                        <div className="flex-1" />
                        <div className="w-24 bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${readRate >= 80 ? 'bg-emerald-500' : readRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${readRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => handlePin(item.id)}
                        className={`p-2 rounded-lg transition-all ${item.pinned ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500'}`}
                        title={item.pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-400" />
                New Announcement
              </h2>
              <button onClick={() => setShowCompose(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={e => setComposeTitle(e.target.value)}
                  placeholder="Enter announcement title..."
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Message</label>
                <textarea
                  value={composeMessage}
                  onChange={e => setComposeMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your announcement..."
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                  <select
                    value={composeCategory}
                    onChange={e => setComposeCategory(e.target.value as Announcement['category'])}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  >
                    <option value="general">General</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="schedule">Schedule</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={composePriority}
                    onChange={e => setComposePriority(e.target.value as Priority)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'all', label: 'All Students', icon: Users },
                    { value: 'batch', label: 'Specific Batch', icon: Users },
                    { value: 'weak', label: 'Weak Performers', icon: AlertCircle },
                    { value: 'good', label: 'Good Performers', icon: Check },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setComposeTarget(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                        composeTarget === opt.value
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {composeTarget === 'batch' && (
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Select Batch</label>
                  <select
                    value={composeBatch}
                    onChange={e => setComposeBatch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  >
                    <option value="All Batches">All Batches</option>
                    {batches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="text-slate-800 dark:text-slate-300 font-medium">Recipients:</span>{' '}
                  {composeTarget === 'all' ? `${studentCount || 'All'} students` :
                   composeTarget === 'batch' ? `${composeBatch} cohort` :
                   `${composeTarget} students`}
                </p>
              </div>
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
                onClick={handleSend}
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
