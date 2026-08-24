import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckSquare, Square, Eye, Printer, Download,
  Send, CheckCircle, Clock, AlertTriangle, X, Sparkles, Plus, Trash2,
  Loader2, BookOpen, Calendar, Award, ChevronRight, Save, Pencil, FileUp, RotateCcw
} from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { DEFAULT_DEPARTMENT } from '@/shared/constants/academicPrograms'
import { getQuestions, linkQuestionToPaper, updateQuestion, getBatchBranchConfig } from '../../admin/api/questionBankApi'
import PaperUploadEditor from '@/shared/components/question-paper/PaperUploadEditor'
import { createPaper, updatePaper } from '../../admin/api/paperApi'
import { getPapers } from '../../admin/services/paperAPI'
import { downloadPaperPDF } from '../../../shared/utils/pdfDownloader'
import type { Question as BankQuestion } from '../../admin/types/questionBank'

interface FacultyQuestion {
  id: string
  status: string
  courseCode: string
  marks: number
  questionText: string
  topic: string
  difficulty: string
  questionType: string
}

interface TestPaperQuestion {
  number: number
  topic: string
  type: string
  marks: number
  questionText: string
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
  questions: TestPaperQuestion[]
  createdBy: string
  createdAt: string
  submittedAt: string
  aiGenerated: boolean
  approvalRemarks?: string
}

interface PaperSection {
  id: string
  name: string
  questions: { questionId: string; question: FacultyQuestion }[]
  totalMarks: number
}

export default function FacultyPaperGenerator() {
  const { user } = useAuth()
  const collegeId = user?.collegeId || ''
  const [papers, setPapers] = useState<TestPaper[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<FacultyQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [lastSavedPaperId, setLastSavedPaperId] = useState<string>('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [paperTitle, setPaperTitle] = useState('')
  const [assessmentType, setAssessmentType] = useState<'C1' | 'C2' | 'C3'>('C3')
  const [customInstructions, setCustomInstructions] = useState('')
  const [duration, setDuration] = useState(120)
  const [showPreview, setShowPreview] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showToast, setShowToast] = useState('')
  const [activeTab, setActiveTab] = useState<'generate' | 'my-papers'>('generate')
  // ── Edit-before-submit: per-question overrides applied to this paper ──
  const [questionEdits, setQuestionEdits] = useState<Record<string, { questionText: string; marks: number }>>({})
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ questionText: string; marks: number }>({ questionText: '', marks: 1 })
  const [syncEditsToBank, setSyncEditsToBank] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  // HOD approval is optional — only pre-selected for mid/end semester papers.
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [approvalTouched, setApprovalTouched] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [batches, setBatches] = useState<string[]>([])

  const currentFaculty = useMemo(() => ({
    name: user?.name || 'Faculty',
    department: user?.department || DEFAULT_DEPARTMENT,
    subject: user?.department || 'General',
  }), [user])

  const loadData = useCallback(async () => {
    if (!collegeId) return
    setLoadingQuestions(true)
    try {
      const result = await getQuestions(collegeId, { status: 'active' }, 100)
      const mapped: FacultyQuestion[] = result.data.map((q: BankQuestion) => ({
        id: q.id,
        status: q.status === 'active' ? 'Approved' : q.status,
        courseCode: q.courseCode || q.subject || '',
        marks: q.marks ?? 1,
        questionText: q.text || '',
        topic: q.topic || q.chapter || '',
        difficulty: q.difficulty || 'Medium',
        questionType: q.type || 'Short Answer',
      }))
      setAvailableQuestions(mapped.filter(q => q.status === 'Approved'))

      const saved = await getPapers(collegeId)
      setPapers(saved.map((p: any) => ({
        id: p.id,
        title: p.title || '',
        subject: p.subject || currentFaculty.subject,
        className: p.batch || p.className || '',
        division: p.branch || p.division || '',
        totalMarks: p.totalMarks || 0,
        duration: p.duration || duration,
        fileName: `${(p.title || 'paper').replace(/\\s+/g, '_')}.pdf`,
        verificationStatus: 'submitted-for-approval',
        questions: (p.sections || []).flatMap((s: any) => (s.questions || []).map((q: any) => ({
          number: 0,
          topic: q.topic || '',
          type: q.type || 'long',
          marks: q.marks || 1,
          questionText: q.text || '',
        }))),
        createdBy: currentFaculty.name,
        createdAt: p.createdAt || '',
        submittedAt: p.updatedAt || '',
        aiGenerated: false,
      })))
    } catch {
      // Keep existing empty state; the error is surfaced by the toast below.
    } finally {
      setLoadingQuestions(false)
    }
  }, [collegeId, currentFaculty.name, currentFaculty.subject, duration])

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

  /** Applies any unsaved edits made in this session on top of the bank question. */
  const withEdits = useCallback((q: FacultyQuestion): FacultyQuestion => {
    const edit = questionEdits[q.id]
    return edit ? { ...q, questionText: edit.questionText, marks: edit.marks } : q
  }, [questionEdits])

  const totalSelectedMarks = useMemo(() =>
    availableQuestions
      .filter(q => selectedQuestions.includes(q.id))
      .reduce((sum, q) => sum + withEdits(q).marks, 0),
  [availableQuestions, selectedQuestions, withEdits])

  const openQuestionEditor = (q: FacultyQuestion) => {
    const merged = withEdits(q)
    setEditDraft({ questionText: merged.questionText, marks: merged.marks })
    setEditingQuestionId(q.id)
  }

  const saveQuestionEdit = () => {
    if (!editingQuestionId) return
    setQuestionEdits(prev => ({
      ...prev,
      [editingQuestionId]: { questionText: editDraft.questionText, marks: Number(editDraft.marks) || 1 },
    }))
    setEditingQuestionId(null)
    setShowToast('Question updated for this paper')
    setTimeout(() => setShowToast(''), 2500)
  }

  const resetQuestionEdit = (id: string) => {
    setQuestionEdits(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const expectedMarks = assessmentType === 'C3' ? 80 : assessmentType === 'C2' ? 50 : 20

  /** Class tests (C1) don't need sign-off; mid (C2) and end semester (C3) do. */
  const approvalDefault = assessmentType !== 'C1'

  useEffect(() => {
    if (!approvalTouched) setRequiresApproval(approvalDefault)
  }, [approvalDefault, approvalTouched])

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const allIds = availableQuestions.map(q => q.id)
    const allSelected = allIds.every(id => selectedQuestions.includes(id))
    if (allSelected) {
      setSelectedQuestions(prev => prev.filter(id => !allIds.includes(id)))
    } else {
      setSelectedQuestions(prev => [...new Set([...prev, ...allIds])])
    }
  }

  const generatePreviewHTML = () => {
    const selected = availableQuestions.filter(q => selectedQuestions.includes(q.id)).map(withEdits)
    const sections = assessmentType === 'C3' 
      ? [
          { name: 'Section A (5 marks each)', questions: selected.filter(q => q.marks === 5) },
          { name: 'Section B (10 marks each)', questions: selected.filter(q => q.marks === 10) },
        ]
      : [{ name: 'Questions', questions: selected }]

    let html = `
      <div style="font-family: 'Times New Roman', serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 18px; margin-bottom: 5px;">${(user as any)?.collegeName || 'Question Paper'}</h1>
          <h2 style="font-size: 16px; margin-bottom: 5px;">${paperTitle || 'Untitled Paper'}</h2>
          <p style="font-size: 12px; color: #666;">Subject: ${currentFaculty.subject} | Duration: ${duration} min | Max Marks: ${totalSelectedMarks}</p>
          ${customInstructions ? `<p style="font-size: 12px; color: #666; margin-top: 10px;"><strong>Instructions:</strong> ${customInstructions}</p>` : ''}
        </div>
    `

    sections.forEach((section, si) => {
      if (section.questions.length > 0) {
        html += `<h3 style="font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${section.name}</h3>`
        section.questions.forEach((q, i) => {
          html += `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
              <p style="font-weight: bold; font-size: 13px;">Q${si * 10 + i + 1}. [${q.marks} marks] ${q.questionText}</p>
              <p style="font-size: 11px; color: #666; margin-top: 5px;">Topic: ${q.topic} | Difficulty: ${q.difficulty}</p>
            </div>
          `
        })
      }
    })

    html += `</div>`
    return html
  }

  const handleSubmitForApproval = async () => {
    if (!paperTitle) {
      setShowToast('Please enter a paper title')
      setTimeout(() => setShowToast(''), 3000)
      return
    }
    if (selectedQuestions.length === 0) {
      setShowToast('Please select at least one question')
      setTimeout(() => setShowToast(''), 3000)
      return
    }
    if (!collegeId) {
      setShowToast('Not authenticated — missing collegeId')
      setTimeout(() => setShowToast(''), 3000)
      return
    }

    const selected = availableQuestions.filter(q => selectedQuestions.includes(q.id)).map(withEdits)
    const questionIds = selected.map(q => q.id)

    try {
      const sections = [
        {
          id: 'section-a',
          name: 'Section A',
          questions: selected.map((q, i) => ({
            number: i + 1,
            text: q.questionText,
            type: q.questionType,
            marks: q.marks,
            topic: q.topic,
            questionId: q.id,
            edited: Boolean(questionEdits[q.id]),
          })),
        },
      ] as any

      const saved = await createPaper(
        collegeId,
        {
          title: paperTitle,
          subject: currentFaculty.subject,
          totalMarks: totalSelectedMarks,
          duration,
          instructions: customInstructions ? [customInstructions] : [],
          negativeMarking: false,
        },
        questionIds,
        user?.id || user?.uid || '',
        user?.name || user?.email || 'Unknown',
        true,
        sections
      )

      // Approval is optional: papers that don't need it are immediately usable.
      try {
        await updatePaper(saved.id, {
          ...(requiresApproval
            ? { verificationStatus: 'submitted-for-approval', status: 'draft', submittedAt: new Date().toISOString() }
            : { verificationStatus: 'not-required', status: 'published', finalisedAt: new Date().toISOString() }),
          requiresApproval,
        } as any)
      } catch {
        // Non-fatal: the paper is saved, only its review state may lag.
      }

      // Optionally push the edits back into the shared question bank
      if (syncEditsToBank) {
        for (const [qid, edit] of Object.entries(questionEdits)) {
          if (!questionIds.includes(qid)) continue
          try {
            await updateQuestion(qid, { text: edit.questionText, marks: edit.marks })
          } catch {
            // Non-fatal: the paper still carries the edited version.
          }
        }
      }

      for (const qid of questionIds) {
        await linkQuestionToPaper(qid, saved.id)
      }

      const newPaper: TestPaper = {
        id: saved.id,
        title: paperTitle,
        subject: currentFaculty.subject,
        className: user?.department || '',
        division: '',
        totalMarks: totalSelectedMarks,
        duration,
        fileName: `${paperTitle.replace(/\s+/g, '_')}.pdf`,
        verificationStatus: requiresApproval ? 'submitted-for-approval' : 'not-required',
        questions: selected.map((q, i) => ({
          number: i + 1,
          topic: q.topic,
          type: q.questionType === 'MCQ' ? 'mcq' : q.questionType === 'Short Answer' ? 'short' : 'long',
          marks: q.marks,
          questionText: q.questionText
        })),
        createdBy: currentFaculty.name,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        aiGenerated: false
      }

      setLastSavedPaperId(saved.id)
      setPapers(prev => [newPaper, ...prev])
      setShowSubmitConfirm(false)
      setShowToast(requiresApproval ? 'Paper submitted for HOD approval!' : 'Paper saved and ready to use')
      setTimeout(() => setShowToast(''), 3000)

      // Reset form
      setSelectedQuestions([])
      setPaperTitle('')
      setCustomInstructions('')
      setQuestionEdits({})
      setActiveTab('my-papers')
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to submit paper')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleExportPDF = async () => {
    try {
      let paperId = lastSavedPaperId
      if (!paperId) {
        await handleSubmitForApproval()
        return
      }
      await downloadPaperPDF(paperId, paperTitle || 'question_paper')
      setShowToast('PDF downloaded')
      setTimeout(() => setShowToast(''), 3000)
    } catch (err) {
      setShowToast(err instanceof Error ? err.message : 'Failed to download PDF')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    'draft': { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    'pending-verification': { label: 'Pending Verification', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'verified': { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'modification-requested': { label: 'Changes Requested', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    'submitted-for-approval': { label: 'Awaiting HOD Approval', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'approved-by-hod': { label: 'Approved by HOD', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'rejected-by-hod': { label: 'Rejected by HOD', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  }

  const myPapers = papers.filter(p => p.createdBy === currentFaculty.name)

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paper Generator</h1>
          <p className="text-slate-600 dark:text-slate-400">{currentFaculty.subject} • Create and submit papers for approval</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'generate'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          Generate New Paper
        </button>
        <button
          onClick={() => setActiveTab('my-papers')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'my-papers'
              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          My Papers
          {myPapers.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-700 dark:text-slate-300 text-xs">{myPapers.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration & Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration */}
            <div className="p-4 rounded-xl glass-card/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Paper Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Paper Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., End Semester - Financial Accounting"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/50 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Assessment Type</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value as 'C1' | 'C2' | 'C3')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="C1">Class Test (20 marks)</option>
                    <option value="C2">Mid Semester (50 marks)</option>
                    <option value="C3">End Semester (80 marks)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 120)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Custom Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g., Answer any 5 out of 8"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-700/50 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Questions Selection */}
            <div className="rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Select Questions ({availableQuestions.length} available)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20 hover:bg-slate-500/20 transition-all flex items-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5" /> Upload a ready paper
                  </button>
                  <button
                    onClick={selectAll}
                    className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-100 dark:bg-teal-900/30 transition-all"
                  >
                    {selectedQuestions.length === availableQuestions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {availableQuestions.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                    <p>No approved questions available. Add questions to the Question Bank first.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {availableQuestions.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => toggleQuestion(q.id)}
                        className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                          selectedQuestions.includes(q.id) ? 'bg-teal-500/5' : 'hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="pt-0.5">
                          {selectedQuestions.includes(q.id) ? (
                            <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-white line-clamp-2">{withEdits(q).questionText}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {questionEdits[q.id] && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-500 border border-teal-500/20">edited</span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-500/20">{q.questionType}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">{withEdits(q).marks}m</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-500/20">{q.topic}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                              q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>{q.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openQuestionEditor(q) }}
                            title="Edit this question for the paper"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-500 hover:bg-teal-500/10 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {questionEdits[q.id] && (
                            <button
                              onClick={(e) => { e.stopPropagation(); resetQuestionEdit(q.id) }}
                              title="Revert to the original question"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Summary & Actions */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="p-5 rounded-xl glass-card/50 sticky top-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Paper Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Title</span>
                  <span className="text-slate-900 dark:text-white font-medium truncate max-w-[150px]">{paperTitle || 'Not set'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Assessment</span>
                  <span className="text-slate-900 dark:text-white font-medium">{assessmentType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Questions</span>
                  <span className="text-slate-900 dark:text-white font-medium">{selectedQuestions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Total Marks</span>
                  <span className={`font-medium ${totalSelectedMarks === expectedMarks ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {totalSelectedMarks} / {expectedMarks}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Duration</span>
                  <span className="text-slate-900 dark:text-white font-medium">{duration} min</span>
                </div>
              </div>

              {totalSelectedMarks !== expectedMarks && totalSelectedMarks > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Marks mismatch! Expected {expectedMarks} marks.
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={selectedQuestions.length === 0}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-700/50 text-slate-900 dark:text-white border border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Paper
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={selectedQuestions.length === 0 || !paperTitle}
                  className="w-full px-4 py-2.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {requiresApproval ? 'Submit for HOD Approval' : 'Save Paper'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                How It Works
              </h4>
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>Select approved questions from the bank</li>
                <li>Ensure total marks match expected ({expectedMarks})</li>
                <li>Preview the paper before submitting</li>
                <li>Submit for HOD approval (only if needed)</li>
                <li>Track status in "My Papers" tab</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* My Papers Tab */}
      {activeTab === 'my-papers' && (
        <div className="space-y-4">
          {myPapers.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-800/30 border border-slate-700/50 border-dashed">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No papers created yet</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="mt-3 px-4 py-2 rounded-lg text-sm bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all"
              >
                Generate Your First Paper
              </button>
            </div>
          ) : (
            myPapers.map(paper => {
              const status = statusConfig[paper.verificationStatus]
              return (
                <div key={paper.id} className="p-5 rounded-xl glass-card/50 hover:border-slate-600 transition-all">
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
                  <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> {paper.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> {paper.totalMarks} marks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {paper.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {paper.verificationStatus === 'submitted-for-approval' && (
                      <span className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <Clock className="w-4 h-4" />
                        Awaiting HOD review...
                      </span>
                    )}
                    {paper.verificationStatus === 'approved-by-hod' && (
                      <span className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        Approved by HOD
                      </span>
                    )}
                    {paper.verificationStatus === 'rejected-by-hod' && (
                      <span className="flex items-center gap-2 text-sm text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                        Rejected — see remarks
                      </span>
                    )}
                    {paper.approvalRemarks && (
                      <span className="text-xs text-slate-500 italic">"{paper.approvalRemarks}"</span>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-colors">
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-400 transition-colors"
                        onClick={() => downloadPaperPDF(paper.id, paper.title || 'paper')}
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal-600" />
                Paper Preview
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={handleExportPDF} className="px-3 py-1.5 text-sm bg-teal-600 text-slate-900 dark:text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
                <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div id="paper-preview" dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }} />
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-teal-500/10">
                <Send className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {requiresApproval ? 'Submit for Approval' : 'Save Paper'}
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {requiresApproval ? (
                <>You are about to submit <strong className="text-slate-900 dark:text-white">{paperTitle}</strong> for HOD approval.</>
              ) : (
                <>You are about to save <strong className="text-slate-900 dark:text-white">{paperTitle}</strong>. It will be ready to use straight away.</>
              )}
            </p>
            <div className="p-3 rounded-lg glass-card/50 space-y-1 text-sm mb-4">
              <p className="text-slate-600 dark:text-slate-400">Questions: <span className="text-slate-900 dark:text-white">{selectedQuestions.length}</span></p>
              <p className="text-slate-600 dark:text-slate-400">Total Marks: <span className="text-slate-900 dark:text-white">{totalSelectedMarks}</span></p>
              <p className="text-slate-600 dark:text-slate-400">Duration: <span className="text-slate-900 dark:text-white">{duration} min</span></p>
            </div>
            {Object.keys(questionEdits).length > 0 && (
              <label className="flex items-start gap-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={syncEditsToBank}
                  onChange={(e) => setSyncEditsToBank(e.target.checked)}
                  className="mt-0.5"
                />
                Also save my {Object.keys(questionEdits).length} edited question(s) back to the question bank
                (otherwise the edits only apply to this paper).
              </label>
            )}
            <label className="flex items-start gap-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => { setApprovalTouched(true); setRequiresApproval(e.target.checked) }}
                className="mt-0.5"
              />
              Send this paper to the HOD for approval — normally only needed for mid-semester and
              semester-end exams. Class tests and practice papers can be saved directly.
            </label>
            {requiresApproval && (
              <p className="text-xs text-amber-400 mb-4 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Once submitted, you cannot edit the paper until reviewed.
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button onClick={handleSubmitForApproval} className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-teal-100 dark:bg-teal-900/30 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all font-medium flex items-center justify-center gap-2">
                {requiresApproval ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {requiresApproval ? 'Confirm Submit' : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit a question before it goes into the paper */}
      {editingQuestionId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-teal-500/10">
                <Pencil className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Question</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Changes apply to this paper. You can also push them back to the bank when you submit.
                </p>
              </div>
            </div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Question text</label>
            <textarea
              rows={5}
              value={editDraft.questionText}
              onChange={(e) => setEditDraft(prev => ({ ...prev, questionText: e.target.value }))}
              className="w-full px-3 py-2 mb-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/60"
            />
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Marks</label>
            <input
              type="number"
              min={1}
              value={editDraft.marks}
              onChange={(e) => setEditDraft(prev => ({ ...prev, marks: Number(e.target.value) }))}
              className="w-full px-3 py-2 mb-5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/60"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditingQuestionId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestionEdit}
                disabled={!editDraft.questionText.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload a ready-made paper */}
      <PaperUploadEditor
        open={uploadOpen}
        collegeId={collegeId}
        userId={user?.id || user?.uid || ''}
        userName={user?.name || ''}
        branches={branches}
        batches={batches}
        canPublishDirectly={user?.role === 'hod'}
        onClose={() => setUploadOpen(false)}
        onSaved={async (_id, action) => {
          setShowToast(
            action === 'draft'
              ? 'Paper saved as draft'
              : action === 'save'
                ? 'Paper saved and ready to use'
                : action === 'published'
                  ? 'Paper approved and published'
                  : 'Paper submitted for HOD approval'
          )
          setTimeout(() => setShowToast(''), 3000)
          await loadData()
        }}
      />

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