import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, Users, ChevronLeft, X, Check, AlertCircle,
  Search, BookOpen, Loader2
} from 'lucide-react'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  limit
} from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { useAuth } from '@/modules/auth/context/AuthContext'

interface ScheduleItem {
  id: string
  subject: string
  topic: string
  date: string
  time: string
  duration: string
  room: string
  batch: string
  students: number
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed'
  originalDate?: string
  originalTime?: string
  reason?: string
  collegeId?: string
}

export default function FacultyReschedule() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''

  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<ScheduleItem | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newRoom, setNewRoom] = useState('')
  const [reason, setReason] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'rescheduled' | 'cancelled'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchScheduleData = useCallback(async () => {
    if (!collegeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // 1. Fetch classSessions
      const sessionQuery = query(
        collection(db, 'classSessions'),
        where('collegeId', '==', collegeId),
        limit(100)
      )
      const sessionSnap = await getDocs(sessionQuery).catch(() => null)
      const loaded: ScheduleItem[] = []

      if (sessionSnap && !sessionSnap.empty) {
        sessionSnap.docs.forEach(d => {
          const data = d.data()
          loaded.push({
            id: d.id,
            subject: data.subject || 'Subject',
            topic: data.topic || data.topicsPlanned?.[0] || 'General Session',
            date: data.date || new Date().toISOString().split('T')[0],
            time: data.startTime || data.time || '10:00',
            duration: data.duration || '1 hr',
            room: data.room || 'Room 101',
            batch: data.batch || data.className || '2026',
            students: Number(data.studentsCount || data.students) || 30,
            status: data.status || 'scheduled',
            originalDate: data.originalDate,
            originalTime: data.originalTime,
            reason: data.reason,
            collegeId: data.collegeId,
          })
        })
      }

      // 2. If no classSessions yet, fetch weeklySchedules to synthesize current sessions
      if (loaded.length === 0) {
        const weeklyQuery = query(
          collection(db, 'weeklySchedules'),
          where('collegeId', '==', collegeId),
          limit(50)
        )
        const weeklySnap = await getDocs(weeklyQuery).catch(() => null)
        if (weeklySnap) {
          const today = new Date()
          const todayStr = today.toISOString().split('T')[0]
          weeklySnap.docs.forEach((d, idx) => {
            const data = d.data()
            loaded.push({
              id: `sched_${d.id}`,
              subject: data.subject || 'Subject',
              topic: `${data.subject || 'Class'} (${data.branch || ''})`,
              date: todayStr,
              time: data.startTime || '10:00',
              duration: '1 hr',
              room: data.room || 'Room 101',
              batch: data.batch || '2026',
              students: 35,
              status: 'scheduled',
              collegeId: data.collegeId,
            })
          })
        }
      }

      setSchedules(loaded)
    } catch (err) {
      console.error('[FacultyReschedule] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [collegeId])

  useEffect(() => {
    fetchScheduleData()
  }, [fetchScheduleData])

  const handleReschedule = (item: ScheduleItem) => {
    setSelected(item)
    setNewDate(item.date)
    setNewTime(item.time)
    setNewRoom(item.room)
    setReason('')
    setShowModal(true)
  }

  const confirmReschedule = async () => {
    if (!selected || !newDate || !newTime || !collegeId) return
    setSubmitting(true)

    try {
      if (selected.id.startsWith('sched_')) {
        // Create new classSession record in Firestore
        const docRef = await addDoc(collection(db, 'classSessions'), {
          collegeId,
          subject: selected.subject,
          topic: selected.topic,
          date: newDate,
          startTime: newTime,
          room: newRoom || selected.room,
          batch: selected.batch,
          originalDate: selected.date,
          originalTime: selected.time,
          status: 'rescheduled',
          reason: reason || 'Schedule adjustment',
          createdBy: user?.uid || '',
          createdByName: user?.name || 'Faculty',
          createdAt: serverTimestamp(),
        })

        setSchedules(prev => prev.map(s =>
          s.id === selected.id
            ? {
                ...s,
                id: docRef.id,
                originalDate: s.date,
                originalTime: s.time,
                date: newDate,
                time: newTime,
                room: newRoom || s.room,
                status: 'rescheduled',
                reason,
              }
            : s
        ))
      } else {
        // Update existing classSession doc
        await updateDoc(doc(db, 'classSessions', selected.id), {
          date: newDate,
          startTime: newTime,
          room: newRoom || selected.room,
          originalDate: selected.originalDate || selected.date,
          originalTime: selected.originalTime || selected.time,
          status: 'rescheduled',
          reason: reason || 'Schedule adjustment',
          updatedAt: serverTimestamp(),
        })

        setSchedules(prev => prev.map(s =>
          s.id === selected.id
            ? {
                ...s,
                originalDate: s.originalDate || s.date,
                originalTime: s.originalTime || s.time,
                date: newDate,
                time: newTime,
                room: newRoom || s.room,
                status: 'rescheduled',
                reason,
              }
            : s
        ))
      }

      setShowModal(false)
      setSelected(null)
    } catch (err) {
      console.error('[FacultyReschedule] reschedule error:', err)
      // Fallback local update
      setSchedules(prev => prev.map(s =>
        s.id === selected.id
          ? { ...s, originalDate: s.date, originalTime: s.time, date: newDate, time: newTime, room: newRoom || s.room, status: 'rescheduled', reason }
          : s
      ))
      setShowModal(false)
      setSelected(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      if (!id.startsWith('sched_')) {
        await updateDoc(doc(db, 'classSessions', id), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        })
      }
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s))
    } catch (err) {
      console.error('[FacultyReschedule] cancel error:', err)
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s))
    }
  }

  const filtered = useMemo(() => {
    return schedules.filter(s => {
      const matchesSearch = s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.subject.toLowerCase().includes(searchQuery.toLowerCase())
      if (activeTab === 'upcoming') return s.status === 'scheduled' && matchesSearch
      if (activeTab === 'rescheduled') return s.status === 'rescheduled' && matchesSearch
      return s.status === 'cancelled' && matchesSearch
    })
  }, [schedules, searchQuery, activeTab])

  const statusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
      case 'rescheduled': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'completed': return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default: return 'bg-slate-500/10 text-slate-400'
    }
  }

  const stats = useMemo(() => [
    { label: 'Total Classes', value: schedules.length, color: 'text-teal-400' },
    { label: 'Scheduled', value: schedules.filter(s => s.status === 'scheduled').length, color: 'text-blue-400' },
    { label: 'Rescheduled', value: schedules.filter(s => s.status === 'rescheduled').length, color: 'text-amber-400' },
    { label: 'Cancelled', value: schedules.filter(s => s.status === 'cancelled').length, color: 'text-rose-400' },
  ], [schedules])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/faculty" className="p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all shadow-sm">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reschedule Classes</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Manage class timing adjustments • {user?.name || 'Faculty'}</p>
        </div>
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

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic, subject, or batch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['upcoming', 'rescheduled', 'cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                  : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading schedule sessions...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No {activeTab} classes found</p>
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.topic}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">{item.batch}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {item.subject}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-teal-400" />
                        {item.date}
                        {item.originalDate && <span className="text-slate-400 line-through ml-1">({item.originalDate})</span>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-400" />
                        {item.time}
                        {item.originalTime && <span className="text-slate-400 line-through ml-1">({item.originalTime})</span>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        {item.room}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        {item.students} students
                      </span>
                    </div>

                    {item.reason && (
                      <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 w-fit">
                        <AlertCircle className="w-4 h-4" />
                        <span>Rescheduled: {item.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {item.status !== 'cancelled' && item.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => handleReschedule(item)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-all shadow-sm"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 text-sm font-medium hover:bg-rose-500/20 transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reschedule Class</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Topic:</span> {selected.topic}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1"><span className="text-slate-500 dark:text-slate-400">Current:</span> {selected.date} at {selected.time}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">New Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Room / Lab</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={e => setNewRoom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Reason</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm resize-none"
                  placeholder="e.g. Special laboratory demonstration session"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                disabled={submitting || !newDate || !newTime}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Confirming...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
