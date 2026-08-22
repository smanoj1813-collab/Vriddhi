import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle,
  Eye, Upload, Clock, ChevronRight, Download, Send,
  FileUp, BookOpen, Calendar
} from 'lucide-react'
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/Firebase/config'
import { useAuth } from '../../auth/context/AuthContext'
import { getPapers } from '../../admin/services/paperAPI'
import { getPaperQuestions } from '../../admin/api/paperApi'
import { downloadPaperPDF } from '../../../shared/utils/pdfDownloader'
import type { Paper as BankPaper } from '../../admin/types/questionBank'
interface PaperQuestion {
  number: number
  topic: string
  type: string
  marks: number
}
interface TestPaper {
  id: string
  title: string
  subject: string
  className: string
  division: string
  totalMarks: number
  duration: number
  fileName: string
  verificationStatus: string
  questions: PaperQuestion[]
  createdBy: string
  createdAt: string
  submittedAt: string
  aiGenerated: boolean
  approvalRemarks?: string
}
interface PaperVerificationRequest {
  id: string
  paperId: string
  paperTitle: string
  subject: string
  className: string
  verifiedBy: string
  status: string
  requestedChanges?: { topic: string; questionNumbers: string; remarks: string }
  submittedAt: string
}
interface VerificationModalProps {
  paper: TestPaper
  onClose: () => void
  onVerify: (paperId: string) => void
  onRequestModify: (paperId: string, data: { topic: string; questionNumbers: string; remarks: string }) => void
}

function VerificationModal({ paper, onClose, onVerify, onRequestModify }: VerificationModalProps) {
  const [mode, setMode] = useState<'view' | 'verify' | 'modify'>('view')
  const [topic, setTopic] = useState('')
  const [questionNumbers, setQuestionNumbers] = useState('')
  const [remarks, setRemarks] = useState('')

  const handleSubmit = () => {
    if (mode === 'verify') {
      onVerify(paper.id)
    } else {
      onRequestModify(paper.id, { topic, questionNumbers, remarks })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-white">{paper.title}</h2>
            <p className="text-sm text-slate-400">{paper.subject} • {paper.className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Paper Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Total Marks</p>
              <p className="text-lg font-bold text-white">{paper.totalMarks}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Duration</p>
              <p className="text-lg font-bold text-white">{paper.duration} min</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Questions</p>
              <p className="text-lg font-bold text-white">{paper.questions.length}</p>
            </div>
          </div>

          {/* Questions Table */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              Question Breakdown
            </h3>
            <div className="rounded-xl border border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Q.No</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Topic</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-slate-400 uppercase">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paper.questions.map((q: PaperQuestion) => (
                    <tr key={q.number} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 text-sm text-white font-medium">{q.number}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300">{q.topic}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          q.type === 'mcq' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          q.type === 'short' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-violet-500/10 text-violet-400 border-violet-500/20'
                        }`}>
                          {q.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-400 text-right">{q.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PDF Preview Placeholder */}
          <div className="p-8 rounded-xl bg-slate-800/30 border border-slate-700/50 border-dashed text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-2">PDF Preview</p>
            <p className="text-xs text-slate-600">{paper.fileName}</p>
            <button className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>

          {/* Action Buttons */}
          {mode === 'view' && paper.verificationStatus === 'pending-verification' && (
            <div className="flex gap-3">
              <button
                onClick={() => setMode('verify')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Verify Paper
              </button>
              <button
                onClick={() => setMode('modify')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-medium"
              >
                <AlertTriangle className="w-4 h-4" />
                Request Modification
              </button>
            </div>
          )}

          {/* Verify Form */}
          {mode === 'verify' && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-sm text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                You are about to verify this paper. It will be marked as approved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('view')}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-medium"
                >
                  Confirm Verification
                </button>
              </div>
            </div>
          )}

          {/* Modify Form */}
          {mode === 'modify' && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Request changes to the paper
              </p>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Topic to Modify</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select topic...</option>
                  {paper.questions.map((q: PaperQuestion) => (
                    <option key={q.number} value={q.topic}>{q.topic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Question Number(s)</label>
                <input
                  type="text"
                  placeholder="e.g., 2, 4, 5"
                  value={questionNumbers}
                  onChange={(e) => setQuestionNumbers(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Remarks / Suggested Changes</label>
                <textarea
                  rows={3}
                  placeholder="Describe the changes needed..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('view')}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!topic || !questionNumbers || !remarks}
                  className="px-4 py-2 rounded-lg text-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5 inline mr-1.5" />
                  Submit Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT =====

export default function FacultyPapers() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || ''
  const [papers, setPapers] = useState<TestPaper[]>([])
  const [verificationRequests, setVerificationRequests] = useState<PaperVerificationRequest[]>([])
  const [selectedPaper, setSelectedPaper] = useState<TestPaper | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'requests'>('all')
  const [uploadMode, setUploadMode] = useState<'question' | 'answer'>('question')
  const [showToast, setShowToast] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!collegeId) return
    setLoading(true)
    try {
      const result = await getPapers(collegeId)
      const mapped: TestPaper[] = []
      for (const p of result) {
        const questions = await getPaperQuestions(p.id)
        const paper: TestPaper = {
          id: p.id,
          title: p.title || '',
          subject: p.subject || '',
          className: p.batch || p.branch || '',
          division: '',
          totalMarks: p.totalMarks || 0,
          duration: p.duration || 0,
          fileName: `${(p.title || 'paper').replace(/\s+/g, '_')}.pdf`,
          verificationStatus: (p as any).verificationStatus || (p.status === 'published' ? 'approved-by-hod' : p.status || 'draft'),
          questions: (p.sections || []).flatMap((s: any) => (s.questions || []).map((q: any, i: number) => ({
            number: i + 1,
            topic: q.topic || q.chapter || '',
            type: q.type || 'long',
            marks: q.marks || s.marksPerQuestion || 1,
          }))),
          createdBy: p.createdByName || p.createdBy || '',
          createdAt: p.createdAt || '',
          submittedAt: p.updatedAt || '',
          aiGenerated: (p as any).isAIGenerated === true || (p as any).source === 'ai',
          approvalRemarks: (p as any).approvalRemarks,
        }
        mapped.push(paper)
      }
      setPapers(mapped)
      setVerificationRequests(
        mapped
          .filter((p) => p.verificationStatus === 'modification-requested' || p.verificationStatus === 'approved-by-hod')
          .map((p) => ({
            id: `vr-${p.id}`,
            paperId: p.id,
            paperTitle: p.title,
            subject: p.subject,
            className: p.className,
            verifiedBy: user?.name || (p as any).verifiedBy || 'HOD',
            status: p.verificationStatus === 'approved-by-hod' ? 'verified' : 'modification-requested',
            requestedChanges: p.verificationStatus === 'modification-requested'
              ? { topic: p.approvalRemarks || '', questionNumbers: '', remarks: p.approvalRemarks || '' }
              : undefined,
            submittedAt: p.submittedAt,
          }))
      )
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to load papers')
      setTimeout(() => setShowToast(''), 3000)
    } finally {
      setLoading(false)
    }
  }, [collegeId, user?.name])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleVerify = async (paperId: string) => {
    try {
      await updateDoc(doc(db, 'papers', paperId), {
        verificationStatus: 'approved-by-hod',
        status: 'published',
        verifiedBy: user?.name || 'HOD',
        verifiedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      })
      setPapers(prev => prev.map(p =>
        p.id === paperId ? { ...p, verificationStatus: 'approved-by-hod' } : p
      ))
      const paper = papers.find(p => p.id === paperId)
      if (paper) {
        const request: PaperVerificationRequest = {
          id: `vr-${Date.now()}`,
          paperId,
          paperTitle: paper.title,
          subject: paper.subject,
          className: paper.className,
          verifiedBy: user?.name || 'HOD',
          status: 'verified',
          submittedAt: new Date().toISOString(),
        }
        setVerificationRequests(prev => [request, ...prev])
      }
      setShowToast('Paper verified and published')
      setTimeout(() => setShowToast(''), 3000)
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to verify paper')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleRequestModify = async (paperId: string, data: { topic: string; questionNumbers: string; remarks: string }) => {
    try {
      await updateDoc(doc(db, 'papers', paperId), {
        verificationStatus: 'modification-requested',
        approvalRemarks: data.remarks,
        requestedChanges: data,
        reviewedBy: user?.name || 'HOD',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setPapers(prev => prev.map(p =>
        p.id === paperId ? { ...p, verificationStatus: 'modification-requested', approvalRemarks: data.remarks } : p
      ))
      const paper = papers.find(p => p.id === paperId)
      if (paper) {
        const request: PaperVerificationRequest = {
          id: `vr-${Date.now()}`,
          paperId,
          paperTitle: paper.title,
          subject: paper.subject,
          className: paper.className,
          verifiedBy: user?.name || 'HOD',
          status: 'modification-requested',
          requestedChanges: data,
          submittedAt: new Date().toISOString(),
        }
        setVerificationRequests(prev => [request, ...prev])
      }
      setShowToast('Modification request sent')
      setTimeout(() => setShowToast(''), 3000)
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to submit request')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleUploadFile = async (file: File) => {
    if (!collegeId || !file) return
    try {
      const path = `papers/${collegeId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      const docRef = await addDoc(collection(db, 'papers'), {
        title: file.name.replace(/\.[^.]+$/, ''),
        subject: user?.department || 'General',
        batch: '',
        branch: '',
        totalMarks: 0,
        duration: 0,
        sections: [],
        questionIds: [],
        linkedQuestionIds: [],
        status: 'draft',
        verificationStatus: 'pending-verification',
        fileUrl: url,
        fileName: file.name,
        filePath: path,
        fileType: 'upload',
        collegeId,
        createdBy: user?.id || user?.uid || '',
        createdByName: user?.name || 'Unknown',
        totalQuestions: 0,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setShowToast(`Uploaded: ${file.name}`)
      setTimeout(() => setShowToast(''), 3000)
      if (docRef) await loadData()
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Upload failed')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const filteredPapers = papers.filter(p => {
    if (activeTab === 'pending') return p.verificationStatus === 'pending-verification'
    if (activeTab === 'verified') return p.verificationStatus === 'verified' || p.verificationStatus === 'approved-by-hod'
    return true
  })

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    'pending-verification': { label: 'Pending Verification', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'verified': { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'modification-requested': { label: 'Changes Requested', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    'draft': { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    'submitted-for-approval': { label: 'Submitted for Approval', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'approved-by-hod': { label: 'Approved by HOD', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'rejected-by-hod': { label: 'Rejected by HOD', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/faculty"
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Papers</h1>
          <p className="text-slate-400">Manage test papers and answer keys</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Papers' },
          { id: 'pending', label: 'Pending Verification' },
          { id: 'verified', label: 'Verified' },
          { id: 'requests', label: 'My Requests' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && papers.filter(p => p.verificationStatus === 'pending-verification').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                {papers.filter(p => p.verificationStatus === 'pending-verification').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab !== 'requests' ? (
        <div className="space-y-4">
          {filteredPapers.map(paper => {
            const status = statusConfig[paper.verificationStatus]
            return (
              <div
                key={paper.id}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10">
                      <FileText className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{paper.title}</h3>
                      <p className="text-sm text-slate-400">{paper.subject} • {paper.className}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> {paper.questions.length} questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> {paper.totalMarks} marks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {paper.duration} min
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {paper.verificationStatus === 'pending-verification' && (
                    <button
                      onClick={() => setSelectedPaper(paper)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Review & Verify
                    </button>
                  )}
                  {paper.verificationStatus === 'verified' && (
                    <span className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Verified by you
                    </span>
                  )}
                  {paper.verificationStatus === 'modification-requested' && (
                    <span className="flex items-center gap-2 text-sm text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      Changes requested
                    </span>
                  )}
                  <button
                    onClick={() => downloadPaperPDF(paper.id, paper.title || 'paper')}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-400 transition-colors ml-auto"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            )
          })}

          {filteredPapers.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-slate-800/30 border border-slate-700/50 border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No papers found</p>
            </div>
          )}
        </div>
      ) : (
        /* My Requests Tab */
        <div className="space-y-4">
          {verificationRequests.length > 0 ? (
            verificationRequests.map(req => (
              <div
                key={req.id}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{req.paperTitle}</h3>
                    <p className="text-sm text-slate-400">{req.subject} • {req.className}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    req.status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {req.status === 'verified' ? 'Verified' : 'Modification Requested'}
                  </span>
                </div>
                {req.requestedChanges && (
                  <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 space-y-1.5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Requested Changes</p>
                    <p className="text-sm text-slate-300"><span className="text-slate-500">Topic:</span> {req.requestedChanges.topic}</p>
                    <p className="text-sm text-slate-300"><span className="text-slate-500">Questions:</span> {req.requestedChanges.questionNumbers}</p>
                    <p className="text-sm text-slate-300"><span className="text-slate-500">Remarks:</span> {req.requestedChanges.remarks}</p>
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Submitted: {new Date(req.submittedAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-800/30 border border-slate-700/50 border-dashed">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No verification requests yet</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Section */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-teal-400" />
          Upload Papers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Question Paper Upload */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 border-dashed hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <FileUp className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Question Paper</h3>
                <p className="text-xs text-slate-400">Upload test question paper</p>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadFile(file)
              }}
              className="block w-full text-xs text-slate-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-teal-500/20 file:text-teal-400 hover:file:bg-teal-500/30 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">Supported: PDF, DOC, DOCX, JPG, PNG</p>
          </div>
          {/* Answer Key Upload */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 border-dashed hover:border-violet-500/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FileUp className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Answer Key</h3>
                <p className="text-xs text-slate-400">Upload answer key or solution</p>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadFile(file)
              }}
              className="block w-full text-xs text-slate-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-violet-500/20 file:text-violet-400 hover:file:bg-violet-500/30 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">Supported: PDF, DOC, DOCX, JPG, PNG</p>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {selectedPaper && (
        <VerificationModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onVerify={handleVerify}
          onRequestModify={handleRequestModify}
        />
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 z-50">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{showToast}</span>
        </div>
      )}
    </div>
  )
}