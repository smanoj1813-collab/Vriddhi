import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Plus, X, Check, Search, Calendar,
  Clock, Users, FileText, Trash2, CheckCircle2,
  BarChart3, Send, BookOpen, Target
} from 'lucide-react'
// TODO: Fetch from Firebase
const facultyStudents: any[] = []
const facultyTopics: any[] = []
const currentFaculty = { name: 'Faculty', department: 'General', subject: 'General' }

type AssignmentStatus = 'draft' | 'published' | 'ongoing' | 'closed' | 'graded'
type SubmissionStatus = 'submitted' | 'late' | 'missing' | 'graded'

interface Submission {
  studentId: string
  studentName: string
  rollNo: string
  status: SubmissionStatus
  submittedAt?: string
  score?: number
  maxScore: number
  remarks?: string
}

interface Assignment {
  id: string
  title: string
  description: string
  topic: string
  subject: string
  maxScore: number
  deadline: string
  status: AssignmentStatus
  createdAt: string
  batch: string
  submissions: Submission[]
  attachmentUrl?: string
}

// TODO: Fetch from Firebase
const mockAssignments: Assignment[] = []

const statusConfig: Record<AssignmentStatus, { color: string; label: string; icon: React.ReactNode }> = {
  draft: { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', label: 'Draft', icon: <FileText className="w-4 h-4" /> },
  published: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500/20', label: 'Published', icon: <Send className="w-4 h-4" /> },
  ongoing: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-500/20', label: 'Ongoing', icon: <Clock className="w-4 h-4" /> },
  closed: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Closed', icon: <X className="w-4 h-4" /> },
  graded: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Graded', icon: <CheckCircle2 className="w-4 h-4" /> },
}

const subStatusConfig: Record<SubmissionStatus, { color: string; label: string }> = {
  submitted: { color: 'text-blue-400', label: 'Submitted' },
  late: { color: 'text-amber-400', label: 'Late' },
  missing: { color: 'text-rose-400', label: 'Missing' },
  graded: { color: 'text-emerald-400', label: 'Graded' },
}

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<Assignment | null>(null)
  const [showGradeModal, setShowGradeModal] = useState<Submission | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'submissions' | 'grading'>('all')

  // Create form state
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createTopic, setCreateTopic] = useState('')
  const [createMaxScore, setCreateMaxScore] = useState(20)
  const [createDeadline, setCreateDeadline] = useState('')
  const [createBatch, setCreateBatch] = useState('All Batches')

  // Grade form state
  const [gradeScore, setGradeScore] = useState('')
  const [gradeRemarks, setGradeRemarks] = useState('')

  const handleCreate = () => {
    if (!createTitle.trim() || !createDeadline) return
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      title: createTitle,
      description: createDescription,
      topic: createTopic || 'General',
      subject: currentFaculty.subject,
      maxScore: createMaxScore,
      deadline: createDeadline,
      status: 'published',
      createdAt: new Date().toISOString().split('T')[0],
      batch: createBatch,
      submissions: [],
    }
    setAssignments(prev => [newAssignment, ...prev])
    setShowCreate(false)
    resetCreateForm()
  }

  const resetCreateForm = () => {
    setCreateTitle('')
    setCreateDescription('')
    setCreateTopic('')
    setCreateMaxScore(20)
    setCreateDeadline('')
    setCreateBatch('All Batches')
  }

  const handleGrade = (submission: Submission) => {
    setShowGradeModal(submission)
    setGradeScore(submission.score?.toString() || '')
    setGradeRemarks(submission.remarks || '')
  }

  const confirmGrade = () => {
    if (!showGradeModal || !gradeScore) return
    const score = parseInt(gradeScore)
    setAssignments(prev => prev.map(a => {
      if (a.id === showDetail?.id) {
        return {
          ...a,
          submissions: a.submissions.map(s =>
            s.studentId === showGradeModal.studentId
              ? { ...s, score, remarks: gradeRemarks, status: 'graded' as const }
              : s
          ),
        }
      }
      return a
    }))
    setShowGradeModal(null)
    setGradeScore('')
    setGradeRemarks('')
  }

  const handleDelete = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id))
    if (showDetail?.id === id) setShowDetail(null)
  }

  const handleStatusChange = (id: string, status: AssignmentStatus) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.topic.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = [
    { label: 'Total', value: assignments.length, color: 'text-teal-400' },
    { label: 'Ongoing', value: assignments.filter(a => a.status === 'ongoing').length, color: 'text-amber-400' },
    { label: 'Graded', value: assignments.filter(a => a.status === 'graded' || a.status === 'closed').length, color: 'text-emerald-400' },
    { label: 'Pending Grading', value: assignments.reduce((acc, a) => acc + a.submissions.filter(s => s.status === 'submitted').length, 0), color: 'text-blue-400' },
  ]

  const batchOptions = ['All Batches', 'CTD 1', 'CTD 2', 'CTD 3']

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              Assignments
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Create, track, and grade student assignments</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-slate-900 dark:text-white font-medium hover:bg-teal-600 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
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
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as AssignmentStatus | 'all')}
          className="bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="ongoing">Ongoing</option>
          <option value="closed">Closed</option>
          <option value="graded">Graded</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No assignments found</p>
          </div>
        ) : (
          filtered.map(item => {
            const sConfig = statusConfig[item.status]
            const submissionRate = item.submissions.length > 0
              ? Math.round((item.submissions.filter(s => s.status !== 'missing').length / item.submissions.length) * 100)
              : 0
            const avgScore = item.submissions.filter(s => s.score !== undefined).length > 0
              ? (item.submissions.filter(s => s.score !== undefined).reduce((acc, s) => acc + (s.score || 0), 0) / item.submissions.filter(s => s.score !== undefined).length).toFixed(1)
              : '-'

            return (
              <div key={item.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${sConfig.color}`}>
                        {sConfig.icon}
                        {sConfig.label}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {item.topic}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Due: {item.deadline}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {item.batch}</span>
                      <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Max: {item.maxScore} pts</span>
                    </div>

                    {item.submissions.length > 0 && (
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Submissions:</span>
                          <div className="w-24 bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${submissionRate}%` }} />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300">{submissionRate}%</span>
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">Avg Score: <span className="text-slate-200">{avgScore}</span></span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowDetail(item)}
                      className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 text-sm font-medium hover:bg-teal-100 dark:bg-teal-900/30 transition-all"
                    >
                      View Submissions
                    </button>
                    {item.status === 'published' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'ongoing')}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20 text-sm font-medium hover:bg-amber-100 dark:bg-amber-900/30 transition-all"
                      >
                        Start
                      </button>
                    )}
                    {item.status === 'ongoing' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'closed')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-medium hover:bg-rose-500/20 transition-all"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                New Assignment
              </h2>
              <button onClick={() => { setShowCreate(false); resetCreateForm() }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  placeholder="e.g., Assignment 4: Ratio Analysis"
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the assignment requirements..."
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Topic</label>
                  <select
                    value={createTopic}
                    onChange={e => setCreateTopic(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  >
                    <option value="">Select topic...</option>
                    {facultyTopics.map(t => (
                      <option key={t.id} value={t.title}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Max Score</label>
                  <input
                    type="number"
                    value={createMaxScore}
                    onChange={e => setCreateMaxScore(parseInt(e.target.value) || 0)}
                    min={1}
                    max={100}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Deadline</label>
                  <input
                    type="date"
                    value={createDeadline}
                    onChange={e => setCreateDeadline(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Batch</label>
                  <select
                    value={createBatch}
                    onChange={e => setCreateBatch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                  >
                    {batchOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreate(false); resetCreateForm() }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createTitle.trim() || !createDeadline}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-slate-900 dark:text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Publish Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Submissions Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{showDetail.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{showDetail.topic} • Due: {showDetail.deadline} • Max: {showDetail.maxScore} pts</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-700 dark:text-slate-300 text-sm mb-6 bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">{showDetail.description}</p>

            {/* Submission Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Submitted', value: showDetail.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length, color: 'text-blue-400' },
                { label: 'Graded', value: showDetail.submissions.filter(s => s.status === 'graded').length, color: 'text-emerald-400' },
                { label: 'Missing', value: showDetail.submissions.filter(s => s.status === 'missing').length, color: 'text-rose-400' },
                { label: 'Avg Score', value: showDetail.submissions.filter(s => s.score !== undefined).length > 0 ? (showDetail.submissions.filter(s => s.score !== undefined).reduce((acc, s) => acc + (s.score || 0), 0) / showDetail.submissions.filter(s => s.score !== undefined).length).toFixed(1) : '-', color: 'text-amber-400' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-700/50">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Submissions Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Student Submissions</h3>
              {showDetail.submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No submissions yet</div>
              ) : (
                showDetail.submissions.map(sub => {
                  const ssConfig = subStatusConfig[sub.status]
                  return (
                    <div key={sub.studentId} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700/50">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                        {sub.studentName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{sub.studentName}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{sub.rollNo}</p>
                      </div>
                      {sub.submittedAt && (
                        <span className="text-xs text-slate-500 shrink-0">{sub.submittedAt}</span>
                      )}
                      <span className={`text-xs font-medium shrink-0 ${ssConfig.color}`}>{ssConfig.label}</span>
                      {sub.score !== undefined && (
                        <span className="text-sm font-semibold text-slate-900 dark:text-white shrink-0">{sub.score}/{sub.maxScore}</span>
                      )}
                      {sub.status === 'submitted' && (
                        <button
                          onClick={() => handleGrade(sub)}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-medium hover:bg-teal-100 dark:bg-teal-900/30 transition-all shrink-0"
                        >
                          Grade
                        </button>
                      )}
                      {sub.status === 'graded' && sub.remarks && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[120px] shrink-0" title={sub.remarks}>{sub.remarks}</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Grade Submission</h2>
              <button onClick={() => setShowGradeModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Student:</span> {showGradeModal.studentName}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Roll No:</span> {showGradeModal.rollNo}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Max Score:</span> {showGradeModal.maxScore}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Score</label>
                <input
                  type="number"
                  value={gradeScore}
                  onChange={e => setGradeScore(e.target.value)}
                  min={0}
                  max={showGradeModal.maxScore}
                  placeholder={`0 - ${showGradeModal.maxScore}`}
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">Remarks</label>
                <textarea
                  value={gradeRemarks}
                  onChange={e => setGradeRemarks(e.target.value)}
                  rows={2}
                  placeholder="Optional feedback..."
                  className="w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGradeModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmGrade}
                disabled={!gradeScore || parseInt(gradeScore) < 0 || parseInt(gradeScore) > showGradeModal.maxScore}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-slate-900 dark:text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}