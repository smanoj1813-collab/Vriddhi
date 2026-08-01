import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Upload, FileText, Video, Link2, X, Check,
  File, Trash2, Download, Eye, FolderOpen, Search, FileUp,
  BookOpen, Users, RefreshCw, Loader2, AlertTriangle, ExternalLink
} from 'lucide-react'
import { useMaterials } from '../../../hooks/useMaterials'
import type { MaterialType } from '../../../api/materialApi'

const typeIcons: Record<MaterialType, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-rose-400" />,
  video: <Video className="w-5 h-5 text-purple-400" />,
  link: <Link2 className="w-5 h-5 text-blue-400" />,
  doc: <File className="w-5 h-5 text-blue-400" />,
  ppt: <File className="w-5 h-5 text-orange-400" />,
}

const typeColors: Record<MaterialType, string> = {
  pdf: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  video: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  link: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  doc: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ppt: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const typeLabelColors: Record<MaterialType, string> = {
  pdf: 'text-rose-400',
  video: 'text-purple-400',
  link: 'text-blue-400',
  doc: 'text-blue-400',
  ppt: 'text-orange-400',
}

const BATCH_OPTIONS = ['All Batches', 'CTD 1', 'CTD 2', 'CTD 3', '2023-2024', '2024-2025', '2025-2026']
const TOPIC_OPTIONS = [
  'General', 'Binary Search Trees', 'Tree Traversal', 'Graphs', 'Sorting',
  'Dynamic Programming', 'Arrays', 'Linked Lists', 'Stacks', 'Queues',
  'Hash Tables', 'AVL Trees', 'Greedy Algorithms', 'Backtracking'
]

export default function FacultyUploadMaterial() {
  const {
    materials, stats, loading, error, readStats,
    search, setSearch,
    filterType, setFilterType,
    refresh,
    addMaterial, removeMaterial, trackView, trackDownload,
  } = useMaterials()

  const [showModal, setShowModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadTopic, setUploadTopic] = useState('General')
  const [uploadType, setUploadType] = useState<MaterialType>('pdf')
  const [uploadBatch, setUploadBatch] = useState('All Batches')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadSubject, setUploadSubject] = useState('Data Structures')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
      setUploadTitle(files[0].name.replace(/\.[^/.]+$/, ''))
      const ext = files[0].name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') setUploadType('pdf')
      else if (['doc', 'docx'].includes(ext || '')) setUploadType('doc')
      else if (['ppt', 'pptx'].includes(ext || '')) setUploadType('ppt')
      else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) setUploadType('video')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const confirmUpload = async () => {
    if (!uploadTitle.trim()) {
      setModalError('Title is required')
      return
    }
    if (uploadType !== 'link' && !selectedFile) {
      setModalError('Please select a file')
      return
    }
    if (uploadType === 'link' && !uploadUrl.trim()) {
      setModalError('URL is required for link type')
      return
    }

    setUploading(true)
    setModalError(null)
    try {
      await addMaterial({
        title: uploadTitle.trim(),
        type: uploadType,
        topic: uploadTopic,
        subject: uploadSubject,
        batch: uploadBatch,
        size: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
        url: uploadType === 'link' ? uploadUrl.trim() : undefined,
      })
      resetModal()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    try {
      await removeMaterial(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleView = async (id: string, url?: string) => {
    await trackView(id)
    if (url) window.open(url, '_blank')
  }

  const handleDownload = async (id: string) => {
    await trackDownload(id)
  }

  const resetModal = () => {
    setShowModal(false)
    setUploadTitle('')
    setUploadTopic('General')
    setUploadUrl('')
    setUploadSubject('Data Structures')
    setSelectedFile(null)
    setUploadType('pdf')
    setUploadBatch('All Batches')
    setModalError(null)
  }

  const statCards = [
    { label: 'Total', value: stats.total, icon: <FolderOpen className="w-5 h-5 text-teal-400" /> },
    { label: 'PDFs', value: stats.pdf, icon: <FileText className="w-5 h-5 text-rose-400" /> },
    { label: 'Videos', value: stats.video, icon: <Video className="w-5 h-5 text-purple-400" /> },
    { label: 'Links', value: stats.link, icon: <Link2 className="w-5 h-5 text-blue-400" /> },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload Material</h1>
            <p className="text-slate-400 text-sm">Manage course materials and resources</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Read Budget */}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            readStats.remaining < 50 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            readStats.remaining < 200 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            Reads: {readStats.used}/{readStats.used + readStats.remaining}
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all text-sm"
          >
            <FileUp className="w-4 h-4" />
            Upload New
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-700/30">{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pdf', 'video', 'link', 'doc', 'ppt'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filterType === type
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              {type === 'all' ? 'All' : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && materials.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading materials...</span>
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-3">
        {materials.length === 0 && !loading ? (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No materials found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-teal-400 hover:text-teal-300"
            >
              Upload your first material
            </button>
          </div>
        ) : (
          materials.map(material => (
            <div key={material.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-700/30 shrink-0">
                  {typeIcons[material.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{material.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[material.type]}`}>
                      {material.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {material.topic}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {material.batch}</span>
                    <span>•</span>
                    <span>{material.uploadDate}</span>
                    {material.size && <><span>•</span><span>{material.size}</span></>}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {material.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {material.downloads}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {material.type === 'link' && material.url ? (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleView(material.id, material.url)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="Open Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleDownload(material.id)}
                      className="p-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upload Material</h2>
              <button onClick={resetModal} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {modalError}
              </div>
            )}

            {/* Type Selector */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {(['pdf', 'video', 'link', 'doc', 'ppt'] as MaterialType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setUploadType(type)}
                  className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    uploadType === type
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                  }`}
                >
                  {typeIcons[type]}
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* File Drop Zone */}
              {uploadType !== 'link' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={
                      uploadType === 'pdf' ? '.pdf' :
                      uploadType === 'video' ? 'video/*' :
                      uploadType === 'doc' ? '.doc,.docx' :
                      '.ppt,.pptx'
                    }
                  />
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-medium">
                    {selectedFile ? selectedFile.name : 'Drop file here or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {uploadType === 'pdf' && 'PDF files up to 10MB'}
                    {uploadType === 'video' && 'Video files up to 100MB'}
                    {uploadType === 'doc' && 'Word documents up to 10MB'}
                    {uploadType === 'ppt' && 'PowerPoint files up to 10MB'}
                  </p>
                </div>
              )}

              {/* URL Input */}
              {uploadType === 'link' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">URL *</label>
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Enter material title..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={uploadSubject}
                  onChange={e => setUploadSubject(e.target.value)}
                  placeholder="e.g., Data Structures"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Topic</label>
                  <select
                    value={uploadTopic}
                    onChange={e => setUploadTopic(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  >
                    {TOPIC_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Batch</label>
                  <select
                    value={uploadBatch}
                    onChange={e => setUploadBatch(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500/50 text-sm"
                  >
                    {BATCH_OPTIONS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
