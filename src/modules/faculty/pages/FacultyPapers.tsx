import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle,
  Eye, Upload, Clock, ChevronRight, Download, Send,
  FileUp, BookOpen, Calendar, Printer, Globe, Database, Trash2
} from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'
import { useAuth } from '../../auth/context/AuthContext'
import { getPapers } from '../../admin/services/paperAPI'
import { getPaperQuestions } from '../../admin/api/paperApi'
import { downloadPaperPDF } from '../../../shared/utils/pdfDownloader'
import type { Paper as BankPaper } from '../../admin/types/questionBank'
import PaperUploadEditor, { type EditablePaper } from '@/shared/components/question-paper/PaperUploadEditor'
import { paperBadges } from '@/shared/utils/paperReadiness'
import { getBatchBranchConfig } from '../../admin/api/questionBankApi'
interface PaperQuestion {
  number: number
  topic: string
  type: string
  marks: number
  text?: string
  options?: unknown[]
}
interface TestPaperSection {
  id?: string
  name?: string
  title?: string
  questions?: PaperQuestion[]
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
  sections: TestPaperSection[]
  questionIds: string[]
  linkedQuestionIds: string[]
  createdBy: string
  createdByUid: string
  createdAt: string
  submittedAt: string
  aiGenerated: boolean
  approvalRemarks?: string
  branch?: string
  batch?: string
  semester?: string
  examType?: string
  date?: string
  instructions?: string
  fileUrl?: string
  filePath?: string
  answerKeyUrl?: string
  answerKeyName?: string
  answerKeyPath?: string
  requiresApproval?: boolean
  printReady?: boolean
  onlineReady?: boolean
  bankReady?: boolean
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
  onDownload: (paperId: string) => void
}

function VerificationModal({ paper, onClose, onVerify, onRequestModify, onDownload }: VerificationModalProps) {
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
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{paper.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{paper.subject} • {paper.className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Paper Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl glass-card/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Marks</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{paper.totalMarks}</p>
            </div>
            <div className="p-3 rounded-xl glass-card/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Duration</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{paper.duration} min</p>
            </div>
            <div className="p-3 rounded-xl glass-card/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Questions</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{paper.questions.length}</p>
            </div>
          </div>

          {/* Questions Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Question Breakdown
            </h3>
            <div className="rounded-xl border border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Q.No</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Topic</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Type</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paper.questions.map((q: PaperQuestion) => (
                    <tr key={q.number} className="hover:bg-slate-100 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 text-sm text-slate-900 dark:text-white font-medium">{q.number}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">{q.topic}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          q.type === 'mcq' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-500/20' :
                          q.type === 'short' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-500/20' :
                          'bg-violet-500/10 text-violet-400 border-violet-500/20'
                        }`}>
                          {q.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 text-right">{q.marks}</td>
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
            {paper.filePath ? (
              <button
                onClick={() => onDownload(paper.id)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300"
              >
                <Download className="w-4 h-4" /> Download original file
              </button>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No original file attached; review the structured questions above.</p>
            )}
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-100 dark:bg-amber-900/30 transition-all font-medium"
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
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
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
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Topic to Modify</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-card/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select topic...</option>
                  {paper.questions.map((q: PaperQuestion) => (
                    <option key={q.number} value={q.topic}>{q.topic}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Question Number(s)</label>
                <input
                  type="text"
                  placeholder="e.g., 2, 4, 5"
                  value={questionNumbers}
                  onChange={(e) => setQuestionNumbers(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-card/50 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Remarks / Suggested Changes</label>
                <textarea
                  rows={3}
                  placeholder="Describe the changes needed..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-card/50 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('view')}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!topic || !questionNumbers || !remarks}
                  className="px-4 py-2 rounded-lg text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPaper, setEditingPaper] = useState<Partial<EditablePaper> | null>(null)
  const [branches, setBranches] = useState<string[]>([])
  const [batches, setBatches] = useState<string[]>([])
  const [showToast, setShowToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TestPaper | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const canReview = ['superadmin', 'admin', 'principal', 'hod'].includes(user?.role || '')

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
            number: q.number || i + 1,
            topic: q.topic || q.chapter || '',
            type: q.type || 'long_answer',
            marks: q.marks || s.marksPerQuestion || 1,
            text: q.text || q.questionText || '',
            options: Array.isArray(q.options) ? q.options : undefined,
          }))),
          sections: (p.sections || []).map((s: any) => ({
            id: s.id,
            name: s.name || s.title,
            questions: (s.questions || []).map((q: any, i: number) => ({
              number: q.number || i + 1,
              topic: q.topic || q.chapter || '',
              type: q.type || 'long_answer',
              marks: q.marks || s.marksPerQuestion || 1,
              text: q.text || q.questionText || '',
              options: Array.isArray(q.options) ? q.options : undefined,
            })),
          })),
          questionIds: Array.isArray((p as any).questionIds) ? (p as any).questionIds.map(String) : [],
          linkedQuestionIds: Array.isArray((p as any).linkedQuestionIds) ? (p as any).linkedQuestionIds.map(String) : [],
          branch: (p as any).branch || '',
          batch: (p as any).batch || '',
          semester: (p as any).semester || '',
          examType: (p as any).examType || '',
          date: (p as any).date || '',
          instructions: typeof (p as any).instructions === 'string' ? (p as any).instructions : ((p as any).instructions || []).join('\n'),
          fileUrl: (p as any).fileUrl || '',
          filePath: (p as any).filePath || '',
          answerKeyUrl: (p as any).answerKeyUrl || '',
          answerKeyName: (p as any).answerKeyName || '',
          answerKeyPath: (p as any).answerKeyPath || '',
          requiresApproval: (p as any).requiresApproval ?? false,
          printReady: (p as any).printReady,
          onlineReady: (p as any).onlineReady,
          bankReady: (p as any).bankReady,
          createdBy: p.createdByName || p.createdBy || '',
          createdByUid: p.createdBy || '',
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

  useEffect(() => {
    if (!collegeId) return
    getBatchBranchConfig(collegeId)
      .then((cfg) => {
        setBranches(cfg.branches || [])
        setBatches(cfg.batches || [])
      })
      .catch(() => undefined)
  }, [collegeId])

  const reviewPaper = httpsCallable<
    { paperId: string; action: 'approve' | 'request_modification'; topic?: string; questionNumbers?: string; remarks?: string },
    { success: boolean }
  >(functions, 'reviewPaper')

  const handlePaperFileDownload = async (paperId: string) => {
    try {
      const getDownload = httpsCallable<
        { paperId: string; kind: 'paper' },
        { url: string; fileName: string }
      >(functions, 'getPaperFileDownload')
      const response = await getDownload({ paperId, kind: 'paper' })
      const anchor = document.createElement('a')
      anchor.href = response.data.url
      anchor.download = response.data.fileName
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.click()
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Paper file could not be downloaded')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  /**
   * Generated (non-uploaded) papers come from the API's Puppeteer renderer; if
   * that is unavailable the helper renders the paper in the browser and we show
   * its "approximate styling" notice instead of a dead error toast.
   */
  const handleGeneratedPaperDownload = async (paperId: string, title: string) => {
    try {
      const result = await downloadPaperPDF(paperId, title || 'paper')
      setShowToast(result.renderedBy === 'client' ? (result.notice || 'PDF generated in your browser') : 'PDF downloaded')
      setTimeout(() => setShowToast(''), result.renderedBy === 'client' ? 6000 : 3000)
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to download PDF')
      setTimeout(() => setShowToast(''), 4000)
    }
  }

  const handleVerify = async (paperId: string) => {
    try {
      await reviewPaper({ paperId, action: 'approve' })
      setShowToast('Paper verified and published')
      setSelectedPaper(null)
      await loadData()
      setTimeout(() => setShowToast(''), 3000)
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to verify paper')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleRequestModify = async (paperId: string, data: { topic: string; questionNumbers: string; remarks: string }) => {
    try {
      await reviewPaper({ paperId, action: 'request_modification', ...data })
      setShowToast('Modification request sent')
      setSelectedPaper(null)
      await loadData()
      setTimeout(() => setShowToast(''), 3000)
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to submit request')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleDeletePaper = async () => {
    if (!deleteTarget || deleteBusy) return
    setDeleteBusy(true)
    try {
      const deletePaperCall = httpsCallable<
        { paperId: string },
        { status: string; removedQuestions: number; unlinkedQuestions: number }
      >(functions, 'deletePaper')
      const response = await deletePaperCall({ paperId: deleteTarget.id })
      const removed = response.data.removedQuestions || 0
      const unlinked = response.data.unlinkedQuestions || 0
      setDeleteTarget(null)
      setPapers((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setShowToast(
        `"${deleteTarget.title}" was deleted` +
        (removed || unlinked ? ` — ${removed} bank question(s) removed, ${unlinked} shared question(s) unlinked` : '')
      )
      setTimeout(() => setShowToast(''), 4500)
      await loadData()
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to delete paper')
      setTimeout(() => setShowToast(''), 4500)
    } finally {
      setDeleteBusy(false)
    }
  }

  const openNewPaper = () => {
    setEditingPaper(null)
    setEditorOpen(true)
  }

  const openEditPaper = (paper: TestPaper) => {
    setEditingPaper({
      id: paper.id,
      title: paper.title,
      subject: paper.subject,
      branch: paper.branch || '',
      batch: paper.batch || paper.className || '',
      semester: paper.semester || '',
      examType: paper.examType || 'Internal Assessment 1',
      date: paper.date || new Date().toISOString().split('T')[0],
      duration: paper.duration || 90,
      totalMarks: paper.totalMarks || 0,
      instructions: paper.instructions || '',
      fileName: paper.fileName,
      fileUrl: paper.fileUrl,
      filePath: paper.filePath,
      answerKeyUrl: paper.answerKeyUrl,
      answerKeyName: paper.answerKeyName,
      answerKeyPath: paper.answerKeyPath,
      requiresApproval: paper.requiresApproval,
      // Pass the section layout so multi-section (parsed) papers round-trip;
      // fall back to the flat question list for legacy single-section papers.
      sections: (paper.sections.length > 0
        ? paper.sections
        : [{
            name: 'Section A',
            questions: paper.questions.map((q) => ({
              number: q.number,
              topic: q.topic,
              type: q.type || 'long_answer',
              marks: q.marks || 0,
              text: q.text || '',
              options: q.options,
            })),
          }]
      ).map((section, sectionIndex) => ({
        rowId: `edit_sec_${sectionIndex}`,
        name: section.name || section.title || `Section ${sectionIndex + 1}`,
        questions: (section.questions || []).map((q, qIndex) => ({
          rowId: `edit_q_${sectionIndex}_${qIndex}`,
          text: q.text || '',
          type: q.type || 'long_answer',
          marks: q.marks || 0,
          topic: q.topic || '',
          options: Array.isArray(q.options)
            ? q.options.map((option) => (typeof option === 'string' ? option : String((option as Record<string, unknown>)?.text || '')))
            : undefined,
        })),
      })),
    })
    setEditorOpen(true)
  }

  const pendingCount = papers.filter(
    (p) => p.verificationStatus === 'pending-verification' || p.verificationStatus === 'submitted-for-approval'
  ).length

  const filteredPapers = papers.filter(p => {
    if (activeTab === 'pending')
      return p.verificationStatus === 'pending-verification' || p.verificationStatus === 'submitted-for-approval'
    if (activeTab === 'verified')
      return (
        p.verificationStatus === 'verified' ||
        p.verificationStatus === 'approved-by-hod' ||
        p.verificationStatus === 'not-required'
      )
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
    'not-required': { label: 'Ready to use', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  }
  const fallbackStatus = { label: 'Ready to use', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/faculty"
          className="p-2 rounded-lg glass-card/50 hover:border-teal-500/30 text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papers</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage test papers and answer keys</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Papers' },
          { id: 'pending', label: 'Awaiting Approval' },
          { id: 'verified', label: 'Ready / Verified' },
          { id: 'requests', label: 'My Requests' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-400 text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab !== 'requests' ? (
        <div className="space-y-4">
          {filteredPapers.map(paper => {
            const status = statusConfig[paper.verificationStatus] || fallbackStatus
            const badges = paperBadges(paper)
            const isAuthor = paper.createdByUid === (user?.uid || user?.id)
            // Slice 1: authors may re-open their own file-only "Ready to use"
            // papers to add structured questions (server enforces the same gate).
            const canEdit = (canReview || isAuthor)
              && (['draft', 'modification-requested', 'rejected-by-hod'].includes(paper.verificationStatus)
                || (paper.verificationStatus === 'not-required' && paper.questions.length === 0 && isAuthor))
            return (
              <div
                key={paper.id}
                className="p-5 rounded-xl glass-card/50 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10">
                      <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{paper.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{paper.subject} • {paper.className}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    title="Original file attached — this paper can be printed as a photocopy"
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                      badges.print
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                        : 'bg-slate-500/5 text-slate-400 border-slate-500/20 opacity-60'
                    }`}
                  >
                    <Printer className="w-3 h-3" /> Print
                  </span>
                  <span
                    title={badges.online
                      ? 'Has structured questions — can be scheduled online in Assessments'
                      : 'No structured questions yet — parse the file in the editor to make it online-ready'}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                      badges.online
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                        : 'bg-slate-500/5 text-slate-400 border-slate-500/20 opacity-60'
                    }`}
                  >
                    <Globe className="w-3 h-3" /> Online
                  </span>
                  <span
                    title={badges.bank
                      ? 'Questions are saved in the question bank'
                      : 'Questions not yet synced to the question bank'}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                      badges.bank
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30'
                        : 'bg-slate-500/5 text-slate-400 border-slate-500/20 opacity-60'
                    }`}
                  >
                    <Database className="w-3 h-3" /> Bank
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                  {canReview && (paper.verificationStatus === 'pending-verification' ||
                    paper.verificationStatus === 'submitted-for-approval') && (
                    <button
                      onClick={() => setSelectedPaper(paper)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-100 dark:bg-teal-900/30 transition-all text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Review & Verify
                    </button>
                  )}
                  {!canReview && (paper.verificationStatus === 'pending-verification' || paper.verificationStatus === 'submitted-for-approval') && (
                    <span className="flex items-center gap-2 text-sm text-amber-500">
                      <Clock className="w-4 h-4" /> Awaiting authorized review
                    </span>
                  )}
                  {(paper.verificationStatus === 'verified' || paper.verificationStatus === 'approved-by-hod') && (
                    <span className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  )}
                  {paper.verificationStatus === 'not-required' && (
                    <span className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Ready to use — no approval needed
                    </span>
                  )}
                  {paper.verificationStatus === 'modification-requested' && (
                    <span className="flex items-center gap-2 text-sm text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      Changes requested
                    </span>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => openEditPaper(paper)}
                      className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-colors ml-auto"
                    >
                      <FileUp className="w-4 h-4" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => paper.filePath
                      ? void handlePaperFileDownload(paper.id)
                      : void handleGeneratedPaperDownload(paper.id, paper.title || 'paper')}
                    className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  {(canReview || isAuthor) && (
                    <button
                      onClick={() => setDeleteTarget(paper)}
                      title="Delete this paper (and the bank questions its confirm created). Blocked while it is under review or linked to a scheduled test."
                      className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {filteredPapers.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-slate-800/30 border border-slate-700/50 border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No papers found</p>
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
                className="p-5 rounded-xl glass-card/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{req.paperTitle}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{req.subject} • {req.className}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    req.status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-500/20'
                  }`}>
                    {req.status === 'verified' ? 'Verified' : 'Modification Requested'}
                  </span>
                </div>
                {req.requestedChanges && (
                  <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 space-y-1.5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Requested Changes</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Topic:</span> {req.requestedChanges.topic}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Questions:</span> {req.requestedChanges.questionNumbers}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-500 dark:text-slate-400">Remarks:</span> {req.requestedChanges.remarks}</p>
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
              <p className="text-slate-600 dark:text-slate-400">No verification requests yet</p>
            </div>
          )}
        </div>
      )}

      {/* Upload / Create Section */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Upload a Question Paper
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Attach a ready PDF/DOC/image or type the questions in. You can review and edit every detail — title,
          program, marks, instructions and each question — before saving as a draft or submitting for approval.
          The attached file is kept for printing; a digital PDF/DOCX can also be parsed into editable questions
          (review first, then confirm) to make the paper online-ready for assessments.
        </p>
        <button
          onClick={openNewPaper}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-all"
        >
          <FileUp className="w-4 h-4" />
          Upload / Create Paper
        </button>
      </div>

      {/* Upload & edit modal */}
      <PaperUploadEditor
        open={editorOpen}
        collegeId={collegeId}
        userId={user?.id || user?.uid || ''}
        userName={user?.name || ''}
        branches={branches}
        batches={batches}
        paper={editingPaper}
        canPublishDirectly={canReview}
        onClose={() => {
          setEditorOpen(false)
          setEditingPaper(null)
        }}
        onSaved={async (_id, action, structureConfirmed) => {
          const baseMessage =
            action === 'draft'
              ? 'Paper saved as draft — you can keep editing it'
              : action === 'save'
                ? 'Paper saved and ready to use (no approval needed)'
                : action === 'published'
                  ? 'Paper approved and published'
                  : 'Paper submitted for HOD approval'
          setShowToast(
            structureConfirmed ? `${baseMessage} — question structure confirmed and online-ready` : baseMessage
          )
          setTimeout(() => setShowToast(''), structureConfirmed ? 4500 : 3000)
          await loadData()
        }}
      />

      {/* Verification Modal */}
      {selectedPaper && (
        <VerificationModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onVerify={handleVerify}
          onRequestModify={handleRequestModify}
          onDownload={handlePaperFileDownload}
        />
      )}

      {/* Delete confirmation dialog — the server enforces the same gates */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delete “{deleteTarget.title}”?</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{deleteTarget.subject} • {deleteTarget.className}</p>
              </div>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <p>Deleting this paper removes:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>The paper record, its structure and review history links</li>
                <li>The attached PDF/DOCX and answer key stored for printing</li>
                <li>The question bank entries created by this paper’s confirm — shared bank questions are only unlinked</li>
              </ul>
              <p className="font-medium text-slate-700 dark:text-slate-300">This cannot be undone.</p>
              {(deleteTarget.verificationStatus === 'submitted-for-approval' || deleteTarget.verificationStatus === 'pending-verification') && (
                <p className="text-amber-500">This paper is under review — deletion will be blocked until a reviewer returns or rejects the submission.</p>
              )}
              {(deleteTarget.verificationStatus === 'approved-by-hod' || deleteTarget.verificationStatus === 'published') && !canReview && (
                <p className="text-amber-500">Approved/published papers can only be deleted by a reviewer (HOD or above).</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteBusy}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 border border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Keep paper
              </button>
              <button
                onClick={handleDeletePaper}
                disabled={deleteBusy}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500/90 text-white hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleteBusy ? 'Deleting…' : 'Delete paper'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 z-50">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{showToast}</span>
        </div>
      )}
    </div>
  )
}