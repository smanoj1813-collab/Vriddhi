import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import {
  ArrowLeft, Plus, Search, BookOpen, Calendar, Clock, CheckCircle,
  AlertTriangle, Edit3, Trash2, Eye, ChevronDown, ChevronUp,
  FileText, Layers, GraduationCap, RefreshCw, Loader2
} from 'lucide-react'
import { useTopics } from '../../../hooks/useTopics'
import type { TopicStatus, StatusFilter, Topic, TopicStats, ReadStats } from '../../../hooks/useTopics'

interface StatusConfigItem {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}

const statusConfig: Record<StatusFilter, StatusConfigItem> = {
  all: {
    label: 'All',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/10 dark:bg-slate-700/10',
    border: 'border-slate-300 dark:border-slate-700/20',
    icon: BookOpen
  },
  planned: {
    label: 'Planned',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Calendar
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: Clock
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: CheckCircle
  },
  delayed: {
    label: 'Delayed',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: AlertTriangle
  },
  pending: {
    label: 'Pending',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Calendar
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: AlertTriangle
  }
}

type TopicFormData = Omit<Topic, 'id'>;

export default function FacultyTopics() {
  const { user } = useAuth()
  const facultyId = user?.id || user?.uid || ''

  const {
    topics, stats, loading, error, readStats,
    search, setSearch,
    statusFilter, setStatusFilter,
    refresh,
    addTopic, editTopic, removeTopic,
  } = useTopics(facultyId || undefined)

  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    description: '',
    course: 'BCom',
    batch: '2024-2025',
    division: 'A',
    plannedDate: '',
    duration: 120,
    status: 'planned',
    resources: [],
    notes: '',
    subject: '',
  })

  const [resourceInput, setResourceInput] = useState('')

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course: 'BCom',
      batch: '2024-2025',
      division: 'A',
      plannedDate: '',
      duration: 120,
      status: 'planned',
      resources: [],
      notes: '',
      subject: '',
    })
    setResourceInput('')
    setFormError(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return
    setFormData({
      title: topic.title,
      description: topic.description,
      course: topic.course,
      batch: topic.batch,
      division: topic.division,
      plannedDate: topic.plannedDate,
      duration: topic.duration,
      status: topic.status,
      resources: [...topic.resources],
      notes: topic.notes,
      subject: topic.subject,
    })
    setResourceInput('')
    setEditingTopic(topicId)
    setShowEditModal(true)
  }

  const handleAddResource = () => {
    if (!resourceInput.trim()) return
    setFormData(prev => ({ ...prev, resources: [...prev.resources, resourceInput.trim()] }))
    setResourceInput('')
  }

  const handleRemoveResource = (idx: number) => {
    setFormData(prev => ({ ...prev, resources: prev.resources.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setFormError('Topic title is required')
      return
    }
    if (!formData.plannedDate) {
      setFormError('Planned date is required')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await addTopic(formData)
      setShowAddModal(false)
      resetForm()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create topic')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingTopic) return
    if (!formData.title.trim()) {
      setFormError('Topic title is required')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await editTopic(editingTopic, formData)
      setShowEditModal(false)
      setEditingTopic(null)
      resetForm()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update topic')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return
    try {
      await removeTopic(showDeleteConfirm)
      setShowDeleteConfirm(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const getStatusCount = (status: StatusFilter, statsData: TopicStats): number => {
    if (status === 'all') return statsData.total
    if (status === 'in-progress') return statsData.inProgress
    return statsData[status as keyof TopicStats] as number
  }

  const safeReadStats: ReadStats = readStats || { used: 0, remaining: 999 }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/faculty"
          className="p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Topics</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage syllabus topics and lesson plans</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            safeReadStats.remaining < 50 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            safeReadStats.remaining < 200 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            Reads: {safeReadStats.used}/{safeReadStats.used + safeReadStats.remaining}
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Topics</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-400 mb-1">Planned</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.planned}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <p className="text-xs text-rose-400 mb-1">Delayed</p>
          <p className="text-2xl font-bold text-rose-400">{stats.delayed}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'planned', 'in-progress', 'completed', 'delayed'] as StatusFilter[]).map(status => {
            const config = statusConfig[status]
            const count = getStatusCount(status, stats)
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  statusFilter === status
                    ? `${config.bg} ${config.color} border ${config.border}`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {config.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && topics.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading topics...</span>
        </div>
      )}

      {/* Topics List */}
      <div className="space-y-3">
        {topics.map((topic) => {
          const config = statusConfig[topic.status as StatusFilter] || statusConfig.pending
          const isExpanded = expandedTopic === topic.id

          return (
            <div
              key={topic.id}
              className={`rounded-xl bg-white dark:bg-slate-800/50 border shadow-sm transition-all ${
                topic.status === 'delayed' ? 'border-rose-500/20' :
                topic.status === 'completed' ? 'border-emerald-500/20' :
                topic.status === 'in-progress' ? 'border-amber-500/20' :
                'border-slate-200 dark:border-slate-700/50'
              }`}
            >
              {/* Topic Header */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                  <BookOpen className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{topic.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{topic.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Course</p>
                    <p className="text-slate-900 dark:text-white font-medium">{topic.course}</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Batch</p>
                    <p className="text-slate-900 dark:text-white font-medium">{topic.batch}</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Planned</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {topic.plannedDate ? new Date(topic.plannedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                    <p className="text-slate-900 dark:text-white font-medium">{topic.duration}m</p>
                  </div>
                </div>
                <button className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Description
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{topic.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Subject</p>
                          <p className="text-slate-700 dark:text-slate-300">{topic.subject}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Division</p>
                          <p className="text-slate-700 dark:text-slate-300">{topic.division}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Planned Date</p>
                          <p className="text-slate-700 dark:text-slate-300">
                            {topic.plannedDate
                              ? new Date(topic.plannedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                              : 'Not set'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Duration</p>
                          <p className="text-slate-700 dark:text-slate-300">{topic.duration} minutes</p>
                        </div>
                      </div>

                      {topic.notes && (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Notes
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{topic.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Resources
                        </h4>
                        {topic.resources.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {topic.resources.map((resource, i) => (
                              <span
                                key={i}
                                className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20"
                              >
                                {resource}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No resources added</p>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Progress</span>
                          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              topic.status === 'completed' ? 'bg-emerald-500 w-full' :
                              topic.status === 'in-progress' ? 'bg-amber-500 w-2/3' :
                              topic.status === 'delayed' ? 'bg-rose-500 w-1/3' :
                              'bg-blue-500 w-0'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(topic.id); }}
                          className="flex-1 px-3 py-2 rounded-lg text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-100 dark:bg-teal-900/30 transition-all flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedTopic(null); }}
                          className="flex-1 px-3 py-2 rounded-lg text-xs bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Collapse
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(topic.id); }}
                          className="px-3 py-2 rounded-lg text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {!loading && topics.length === 0 && (
          <div className="p-12 text-center rounded-xl bg-white/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 border-dashed">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No topics found</p>
            <button
              onClick={openAddModal}
              className="mt-3 text-sm text-teal-400 hover:text-teal-300"
            >
              Add your first topic
            </button>
          </div>
        )}
      </div>

      {/* Add Topic Modal */}
      {showAddModal && (
        <TopicFormModal
          title="Add New Topic"
          formData={formData}
          setFormData={setFormData}
          resourceInput={resourceInput}
          setResourceInput={setResourceInput}
          formError={formError}
          saving={saving}
          onAddResource={handleAddResource}
          onRemoveResource={handleRemoveResource}
          onSubmit={handleSubmit}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          submitLabel="Add Topic"
        />
      )}

      {/* Edit Topic Modal */}
      {showEditModal && (
        <TopicFormModal
          title="Edit Topic"
          formData={formData}
          setFormData={setFormData}
          resourceInput={resourceInput}
          setResourceInput={setResourceInput}
          formError={formError}
          saving={saving}
          onAddResource={handleAddResource}
          onRemoveResource={handleRemoveResource}
          onSubmit={handleUpdate}
          onClose={() => { setShowEditModal(false); setEditingTopic(null); resetForm(); }}
          submitLabel="Update Topic"
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Delete Topic?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 font-medium text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable Form Modal Component ───────────────────────

interface TopicFormModalProps {
  title: string
  formData: TopicFormData
  setFormData: React.Dispatch<React.SetStateAction<TopicFormData>>
  resourceInput: string
  setResourceInput: (v: string) => void
  formError: string | null
  saving: boolean
  onAddResource: () => void
  onRemoveResource: (idx: number) => void
  onSubmit: () => void
  onClose: () => void
  submitLabel: string
}

function TopicFormModal({
  title, formData, setFormData, resourceInput, setResourceInput,
  formError, saving, onAddResource, onRemoveResource, onSubmit, onClose, submitLabel
}: TopicFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
            <span className="text-slate-600 dark:text-slate-400">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Topic Title *</label>
            <input
              type="text"
              placeholder="e.g., Binary Search Trees"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the topic..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Course</label>
              <select
                value={formData.course}
                onChange={e => setFormData(prev => ({ ...prev, course: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option>BCom</option>
                <option>BA</option>
                <option>BSc</option>
                <option>BCA</option>
                <option>BBA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Batch</label>
              <select
                value={formData.batch}
                onChange={e => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option>2023-2024</option>
                <option>2024-2025</option>
                <option>2025-2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Division</label>
              <select
                value={formData.division}
                onChange={e => setFormData(prev => ({ ...prev, division: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Planned Date *</label>
              <input
                type="date"
                value={formData.plannedDate}
                onChange={e => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Duration (min)</label>
              <input
                type="number"
                min={15}
                max={300}
                value={formData.duration}
                onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as TopicStatus }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>

          {/* Resources */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Resources</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g., Lecture Slides"
                value={resourceInput}
                onChange={e => setResourceInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddResource(); } }}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                onClick={onAddResource}
                className="px-3 py-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all text-sm"
              >
                Add
              </button>
            </div>
            {formData.resources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.resources.map((r, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {r}
                    <button onClick={() => onRemoveResource(i)} className="hover:text-teal-200">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Faculty notes..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}