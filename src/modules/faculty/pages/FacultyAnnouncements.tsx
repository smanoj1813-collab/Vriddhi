import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Bell, Send, X, Check, AlertCircle, Info,
  Megaphone, Calendar, Users, Trash2, Eye, Clock,
  Search, Pin
} from 'lucide-react'
// TODO: Fetch from Firebase
const facultyStudents: any[] = []
const classSessions: any[] = []
const currentFaculty = { name: 'Faculty', department: 'CSE' }

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
}

// TODO: Fetch from Firebase
const mockAnnouncements: Announcement[] = []

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

const batchOptions = ['All Batches', ...Array.from(new Set(classSessions.map(c => c.className)))]

export default function FacultyAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements)
  const [showCompose, setShowCompose] = useState(false)
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

  const handleSend = () => {
    if (!composeTitle.trim() || !composeMessage.trim()) return

    const targetCount = composeTarget === 'all' ? 125 :
      composeTarget === 'weak' ? facultyStudents.filter(s => s.status === 'weak').length :
      composeTarget === 'good' ? facultyStudents.filter(s => s.status === 'good').length :
      facultyStudents.filter(s => s.batch === composeBatch).length || 42

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: composeTitle,
      message: composeMessage,
      priority: composePriority,
      target: composeTarget,
      batchFilter: composeTarget === 'batch' ? composeBatch : undefined,
      sentBy: currentFaculty.name,
      sentAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      readCount: 0,
      totalCount: targetCount,
      pinned: false,
      category: composeCategory,
    }

    setAnnouncements(prev => [newAnnouncement, ...prev])
    setShowCompose(false)
    setComposeTitle('')
    setComposeMessage('')
    setComposePriority('normal')
    setComposeTarget('all')
    setComposeBatch('All Batches')
    setComposeCategory('general')
  }

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const handlePin = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a))
  }

  const filtered = announcements.filter(a => {
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

  const stats = [
    { label: 'Total Sent', value: announcements.length, color: 'text-teal-400' },
    { label: 'High Priority', value: announcements.filter(a => a.priority === 'high').length, color: 'text-rose-400' },
    { label: 'Pinned', value: announcements.filter(a => a.pinned).length, color: 'text-amber-400' },
    { label: 'Avg Read Rate', value: `${Math.round(announcements.reduce((acc, a) => acc + (a.readCount / a.totalCount) * 100, 0) / (announcements.length || 1))}%`, color: 'text-blue-400' },
  ]

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
            <p className="text-slate-600 dark:text-slate-400 text-sm">Send and manage notices to students</p>
          </div>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all text-sm"
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
            const readRate = Math.round((item.readCount / item.totalCount) * 100)

            return (
              <div key={item.id} className={`bg-white dark:bg-slate-800/50 border rounded-2xl p-5 transition-all shadow-sm ${item.pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${pConfig.bg}`}>
                    {pConfig.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                      {item.pinned && <Pin className="w-4 h-4 text-amber-400" />}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cConfig.color}`}>
                        {cConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${pConfig.bg} ${pConfig.color}`}>
                        {pConfig.label}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm mb-3 leading-relaxed">{item.message}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.target === 'all' ? 'All Students' : item.target === 'weak' ? 'Weak Performers' : item.target === 'good' ? 'Good Performers' : item.batchFilter}
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
                    {batchOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="text-slate-800 dark:text-slate-300 font-medium">Recipients:</span>{' '}
                  {composeTarget === 'all' ? '125 students' :
                   composeTarget === 'weak' ? `${facultyStudents.filter(s => s.status === 'weak').length} students` :
                   composeTarget === 'good' ? `${facultyStudents.filter(s => s.status === 'good').length} students` :
                   `${facultyStudents.filter(s => s.batch === composeBatch).length || 42} students`}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!composeTitle.trim() || !composeMessage.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}