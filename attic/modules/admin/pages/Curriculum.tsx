// src/pages/Curriculum.tsx
// Curriculum & Topics management — uses useCurriculum hook
// NO direct Firestore calls. NO onSnapshot.

import { useState, useRef, useCallback } from 'react'
import {
  Upload, Plus, BookOpen, X, CheckCircle, Trash2, Edit2,
  FileSpreadsheet, ChevronDown, ChevronRight, Search, Loader2
} from 'lucide-react'
import { useCurriculum } from '../../superadmin/hooks/useCurriculum'
import type { Curriculum, Topic } from '../../superadmin/hooks/useCurriculum'

export default function Curriculum() {
  const { loading, curriculum, topics, refreshData, uploadCurriculum, addTopic, editTopic, deleteTopic, restoreTopicById } = useCurriculum()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [searchTopic, setSearchTopic] = useState('')
  const [editingTopic, setEditingTopic] = useState<{ id: string; name: string; subject: string; course: string; semester: number } | null>(null)

  // Upload form
  const [uploadCourse, setUploadCourse] = useState('BCom')
  const [uploadSemester, setUploadSemester] = useState('1')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add topic form
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicSubject, setNewTopicSubject] = useState('')
  const [newTopicCourse, setNewTopicCourse] = useState('BCom')
  const [newTopicSemester, setNewTopicSemester] = useState('1')

  const courses = ['BCom', 'BA', 'BSc']
  const semesters = ['1', '2', '3', '4', '5', '6']

  const handleUploadCurriculum = useCallback(async () => {
    if (!uploadFile) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').slice(1)
      const subjects: string[] = []

      lines.forEach(line => {
        const cols = line.split(',')
        if (cols[0]?.trim()) subjects.push(cols[0].trim())
      })

      try {
        await uploadCurriculum(uploadCourse, parseInt(uploadSemester), subjects)
        setUploadFile(null)
        setShowUploadModal(false)
        alert(`Curriculum uploaded for ${uploadCourse} Semester ${uploadSemester} with ${subjects.length} subjects`)
      } catch (error) {
        console.error('Error uploading curriculum:', error)
        alert('Failed to upload curriculum. Please try again.')
      }
    }
    reader.readAsText(uploadFile)
  }, [uploadFile, uploadCourse, uploadSemester, uploadCurriculum])

  const handleAddTopic = useCallback(async () => {
    if (!newTopicName || !newTopicSubject) {
      alert('Please enter topic name and subject')
      return
    }
    try {
      await addTopic({
        name: newTopicName,
        subject: newTopicSubject,
        course: newTopicCourse,
        semester: parseInt(newTopicSemester),
        status: 'active',
        questionCount: 0,
      })
      setNewTopicName('')
      setNewTopicSubject('')
      setShowAddTopic(false)
    } catch (error) {
      console.error('Error adding topic:', error)
      alert('Failed to add topic. Please try again.')
    }
  }, [newTopicName, newTopicSubject, newTopicCourse, newTopicSemester, addTopic])

  const handleUpdateTopic = useCallback(async () => {
    if (!editingTopic || !newTopicName || !newTopicSubject) return
    try {
      await editTopic(editingTopic.id, {
        name: newTopicName,
        subject: newTopicSubject,
        course: newTopicCourse,
        semester: parseInt(newTopicSemester),
      })
      setEditingTopic(null)
      setNewTopicName('')
      setNewTopicSubject('')
      setShowAddTopic(false)
    } catch (error) {
      console.error('Error updating topic:', error)
      alert('Failed to update topic. Please try again.')
    }
  }, [editingTopic, newTopicName, newTopicSubject, newTopicCourse, newTopicSemester, editTopic])

  const handleDeleteTopic = useCallback(async (id: string) => {
    if (!confirm('Archive this topic? It will be hidden from faculty but existing questions remain.')) return
    try {
      await deleteTopic(id)
    } catch (error) {
      console.error('Error archiving topic:', error)
      alert('Failed to archive topic. Please try again.')
    }
  }, [deleteTopic])

  const handleRestoreTopic = useCallback(async (id: string) => {
    try {
      await restoreTopicById(id)
    } catch (error) {
      console.error('Error restoring topic:', error)
      alert('Failed to restore topic. Please try again.')
    }
  }, [restoreTopicById])

  const startEditTopic = useCallback((topic: Topic) => {
    setEditingTopic(topic)
    setNewTopicName(topic.name)
    setNewTopicSubject(topic.subject)
    setNewTopicCourse(topic.course)
    setNewTopicSemester(topic.semester.toString())
    setShowAddTopic(true)
  }, [])

  const filteredTopics = topics.filter((t: Topic) => {
    if (searchTopic && !t.name.toLowerCase().includes(searchTopic.toLowerCase()) && !t.subject.toLowerCase().includes(searchTopic.toLowerCase())) return false
    return true
  })

  const activeTopics = filteredTopics.filter((t: Topic) => t.status === 'active')
  const archivedTopics = filteredTopics.filter((t: Topic) => t.status === 'archived')

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title mb-1">Curriculum & Topics</h1>
          <p className="text-vriddhi-muted">Manage subjects and topics for question bank</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 transition-colors"
          >
            <Upload size={16} />
            Upload Curriculum
          </button>
          <button
            onClick={() => {
              setEditingTopic(null)
              setNewTopicName('')
              setNewTopicSubject('')
              setShowAddTopic(true)
            }}
            className="btn-primary"
          >
            <Plus size={18} />
            Add Topic
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-vriddhi-accent" />
        </div>
      ) : (
        <>
          {/* Curriculum Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {curriculum.map((c: Curriculum) => (
              <div
                key={c.id}
                className="glass-card p-5 cursor-pointer hover:border-vriddhi-accent/50 transition-colors"
                onClick={() => setExpandedCourse(expandedCourse === c.course ? null : c.course)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{c.course}</h3>
                    <p className="text-sm text-vriddhi-muted">Semester {c.semester}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-vriddhi-accent">{c.subjects.length}</p>
                    <p className="text-xs text-vriddhi-muted">Subjects</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-vriddhi-muted">
                  {expandedCourse === c.course ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {expandedCourse === c.course ? 'Hide subjects' : 'View subjects'}
                </div>
                {expandedCourse === c.course && (
                  <div className="mt-3 pt-3 border-t border-vriddhi-border space-y-1">
                    {c.subjects.map((s: string) => (
                      <div key={s} className="flex items-center gap-2 text-sm text-vriddhi-text">
                        <BookOpen size={14} className="text-vriddhi-accent" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {curriculum.length === 0 && (
              <div className="glass-card p-5 text-center text-vriddhi-muted col-span-3">
                <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                <p>No curriculum uploaded yet. Upload a CSV to get started.</p>
              </div>
            )}
          </div>

          {/* Topics Section */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h3 className="text-lg font-semibold text-white">Topics ({activeTopics.length} active)</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vriddhi-border">
                    <th className="table-header">Topic</th>
                    <th className="table-header">Subject</th>
                    <th className="table-header">Course</th>
                    <th className="table-header">Sem</th>
                    <th className="table-header">Questions</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTopics.map((topic: Topic) => (
                    <tr key={topic.id} className="hover:bg-white/5 transition-colors">
                      <td className="table-cell font-medium text-white">{topic.name}</td>
                      <td className="table-cell text-vriddhi-muted">{topic.subject}</td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded text-xs">{topic.course}</span>
                      </td>
                      <td className="table-cell">{topic.semester}</td>
                      <td className="table-cell">{topic.questionCount}</td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditTopic(topic)} className="p-2 hover:bg-white/10 rounded-lg text-amber-400"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteTopic(topic.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {archivedTopics.length > 0 && (
              <div className="mt-6 pt-6 border-t border-vriddhi-border">
                <h4 className="text-sm font-medium text-vriddhi-muted mb-3">Archived Topics ({archivedTopics.length})</h4>
                <div className="space-y-2">
                  {archivedTopics.map((topic: Topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-3 rounded-lg bg-vriddhi-dark/30 opacity-60">
                      <span className="text-sm text-vriddhi-muted">{topic.name} — {topic.subject}</span>
                      <button onClick={() => handleRestoreTopic(topic.id)} className="text-xs text-vriddhi-accent hover:underline">Restore</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTopics.length === 0 && !loading && (
              <div className="text-center py-12 text-vriddhi-muted">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>No topics found. Upload curriculum or add topics manually.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Curriculum Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
              <h2 className="text-xl font-bold text-white">Upload Curriculum</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} className="text-vriddhi-muted" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-vriddhi-muted mb-2">Course</label>
                  <select value={uploadCourse} onChange={(e) => setUploadCourse(e.target.value)} className="input-field">
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-vriddhi-muted mb-2">Semester</label>
                  <select value={uploadSemester} onChange={(e) => setUploadSemester(e.target.value)} className="input-field">
                    {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="border-2 border-dashed border-vriddhi-border rounded-xl p-8 text-center hover:border-vriddhi-accent transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet size={48} className="mx-auto mb-4 text-vriddhi-muted" />
                <p className="text-sm text-white mb-2">{uploadFile ? uploadFile.name : 'Click to upload CSV'}</p>
                <p className="text-xs text-vriddhi-muted">Format: Subject, Topic1, Topic2, ...</p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowUploadModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleUploadCurriculum} disabled={!uploadFile} className="btn-primary disabled:opacity-50"><Upload size={18} />Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
              <h2 className="text-xl font-bold text-white">{editingTopic ? 'Edit Topic' : 'Add New Topic'}</h2>
              <button onClick={() => { setShowAddTopic(false); setEditingTopic(null); }} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} className="text-vriddhi-muted" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-vriddhi-muted mb-2">Topic Name *</label>
                <input type="text" placeholder="e.g. Journal Entries" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-vriddhi-muted mb-2">Subject *</label>
                <input type="text" placeholder="e.g. Financial Accounting" value={newTopicSubject} onChange={(e) => setNewTopicSubject(e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-vriddhi-muted mb-2">Course</label>
                  <select value={newTopicCourse} onChange={(e) => setNewTopicCourse(e.target.value)} className="input-field">
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-vriddhi-muted mb-2">Semester</label>
                  <select value={newTopicSemester} onChange={(e) => setNewTopicSemester(e.target.value)} className="input-field">
                    {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => { setShowAddTopic(false); setEditingTopic(null); }} className="btn-secondary">Cancel</button>
                <button onClick={editingTopic ? handleUpdateTopic : handleAddTopic} className="btn-primary"><CheckCircle size={18} />{editingTopic ? 'Update Topic' : 'Add Topic'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
