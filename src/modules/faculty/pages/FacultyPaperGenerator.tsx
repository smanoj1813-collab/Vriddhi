import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckSquare, Square, Eye, Printer, Download,
  Send, CheckCircle, Clock, AlertTriangle, X, Sparkles, Plus, Trash2,
  Loader2, BookOpen, Calendar, Award, ChevronRight, Save, Pencil, FileUp, RotateCcw,
  Wand2, Bot, Layers, Check, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { DEFAULT_DEPARTMENT } from '@/shared/constants/academicPrograms'
import { getQuestions, linkQuestionToPaper, updateQuestion, getBatchBranchConfig, getQuestionStats } from '../../admin/api/questionBankApi'
import PaperUploadEditor from '@/shared/components/question-paper/PaperUploadEditor'
import { createPaper, generatePaper } from '../../admin/api/paperApi'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'
import { getPapers } from '../../admin/services/paperAPI'
import { downloadPaperPDF } from '../../../shared/utils/pdfDownloader'
import type { Question as BankQuestion } from '../../admin/types/questionBank'
import PaperBuilder from '../components/PaperBuilder'
import { useFacultyCurriculum } from '../hooks/useFacultyCurriculum'
import { isSameSubject } from '@/shared/utils/curriculumMatcher'
import { isPermissionDeniedError, staleClaimMessage } from '@/shared/utils/identityClaims'

interface FacultyQuestion {
  id: string
  status: string
  courseCode: string
  marks: number
  questionText: string
  topic: string
  difficulty: string
  questionType: string
  options?: string[] | Array<{ id: string; text: string }>
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
  const facultyId = user?.id || user?.uid || ''

  const { curriculum } = useFacultyCurriculum(facultyId, collegeId)

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
  const [activeTab, setActiveTab] = useState<'generate' | 'my-papers' | 'visual-builder'>('generate')

  // ── Automated Generation State ──
  const [generationStrategy, setGenerationStrategy] = useState<'auto' | 'manual'>('auto')
  const [autoMode, setAutoMode] = useState<'bank' | 'ai' | 'hybrid'>('bank')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [numSets, setNumSets] = useState<1 | 2 | 3>(1)

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
  // Subjects that exist in the college question bank. A faculty member can
  // only be MAPPED to a handful of courses (curriculumFacultyMappings), and
  // before this list was merged in, the course selector could show just that
  // single mapped course even when the bank held questions for more.
  const [bankSubjects, setBankSubjects] = useState<string[]>([])

  const currentFaculty = useMemo(() => ({
    name: user?.name || 'Faculty',
    department: user?.department || DEFAULT_DEPARTMENT,
    subject: user?.department || 'General',
  }), [user])

  /**
   * Everything this faculty member may author a paper for: their mapped
   * curriculum courses PLUS any subject that already has questions in the
   * college bank. A faculty member mapped to a single course could otherwise
   * never generate a paper for a second subject they teach — the selector
   * simply drew from curriculumFacultyMappings and nothing else.
   */
  const subjectOptions = useMemo(() => {
    const mapped = curriculum.map((c) => ({
      id: `course:${c.courseId}`,
      label: `${c.courseName}${c.courseCode ? ` (${c.courseCode})` : ''}`,
      subjectName: c.courseName,
      course: c as (typeof curriculum)[number] | undefined,
    }))
    const mappedNames = new Set(mapped.map((m) => m.subjectName.trim().toLowerCase()))
    const bankOnly = bankSubjects
      .filter((s) => s && s !== 'Unknown' && !mappedNames.has(s.trim().toLowerCase()))
      .map((s) => ({
        id: `bank:${s}`,
        label: `${s} — question bank`,
        subjectName: s,
        course: undefined,
      }))
    return [...mapped, ...bankOnly]
  }, [curriculum, bankSubjects])

  // Select first available subject by default
  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.some((o) => o.id === selectedCourseId)) {
      setSelectedCourseId(subjectOptions[0].id)
    }
  }, [subjectOptions, selectedCourseId])

  const selectedSubjectOption = useMemo(
    () => subjectOptions.find((o) => o.id === selectedCourseId),
    [subjectOptions, selectedCourseId]
  )

  const assignedCourse = useMemo(() => {
    return selectedSubjectOption?.course
  }, [selectedSubjectOption])

  const activeSubjectName = useMemo(() => {
    return selectedSubjectOption ? selectedSubjectOption.subjectName : currentFaculty.subject
  }, [selectedSubjectOption, currentFaculty.subject])

  const loadData = useCallback(async () => {
    if (!collegeId) return
    setLoadingQuestions(true)
    try {
      const result = await getQuestions(collegeId, { status: 'active' }, 200)
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

      // Subjects present in the bank — feeds the paper-subject selector so a
      // faculty member is not limited to their curriculum mappings.
      getQuestionStats(collegeId)
        .then((stats) => setBankSubjects(Object.keys(stats?.bySubject || {}).filter((s) => s && s !== 'Unknown')))
        .catch(() => undefined)

      const saved = await getPapers(collegeId)
      // "My Generated Papers" honestly means papers THIS faculty member
      // authored; admin/principal views still show the whole college.
      const mine = saved.filter((p: any) => !facultyId || !p.createdBy || p.createdBy === facultyId)
      setPapers(mine.map((p: any) => ({
        id: p.id,
        title: p.title || '',
        subject: p.subject || currentFaculty.subject,
        className: p.batch || p.className || '',
        division: p.branch || p.division || '',
        totalMarks: p.totalMarks || 0,
        duration: p.duration || duration,
        fileName: `${(p.title || 'paper').replace(/\\s+/g, '_')}.pdf`,
        verificationStatus:
          p.status === 'published' ? 'published'
            : p.verificationStatus === 'submitted-for-approval' ? 'submitted-for-approval'
              : 'draft',
        questions: (p.sections || []).flatMap((s: any) => (s.questions || []).map((q: any) => ({
          number: 0,
          topic: q.topic || '',
          type: q.type || 'long',
          marks: q.marks || 1,
          questionText: q.text || q.questionText || '',
        }))),
        createdBy: p.createdByName || currentFaculty.name,
        createdAt: p.createdAt || '',
        submittedAt: p.updatedAt || '',
        aiGenerated: !!p.aiGenerated,
      })))
    } catch {
      // ignore
    } finally {
      setLoadingQuestions(false)
    }
  }, [collegeId, currentFaculty.name, currentFaculty.subject, duration, facultyId])

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

  /** Filter questions for the selected course using canonical subject matching */
  const filteredAvailableQuestions = useMemo(() => {
    if (!activeSubjectName || activeSubjectName === 'General') return availableQuestions
    return availableQuestions.filter(q =>
      isSameSubject(q.courseCode, activeSubjectName) ||
      isSameSubject(q.topic, activeSubjectName)
    )
  }, [availableQuestions, activeSubjectName])

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

  const expectedMarks = assessmentType === 'C3' ? 80 : assessmentType === 'C2' ? 50 : 20

  /** Class tests (C1) don't need sign-off; mid (C2) and end semester (C3) do. */
  const approvalDefault = assessmentType !== 'C1'

  useEffect(() => {
    if (!approvalTouched) setRequiresApproval(approvalDefault)
    if (assessmentType === 'C1') setDuration(45)
    else if (assessmentType === 'C2') setDuration(90)
    else if (assessmentType === 'C3') setDuration(180)
  }, [assessmentType, approvalDefault, approvalTouched])

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  // ─── Automated Generation Action ──────────────────────────────────
  const handleAutoGenerate = async () => {
    if (!collegeId) return
    setIsAutoGenerating(true)
    setShowToast('')

    const subject = activeSubjectName
    const title = paperTitle.trim() || `${subject} - ${assessmentType === 'C1' ? 'Class Test' : assessmentType === 'C2' ? 'Midterm Exam' : 'End Semester Examination'}`

    // Blueprint configuration based on assessment type
    let blueprintSections: any[] = []
    if (assessmentType === 'C1') {
      blueprintSections = [
        { id: 'sec-a', name: 'Section A (MCQs)', title: 'Section A', questionType: 'mcq', numQuestions: 5, marksPerQuestion: 1, difficulty: 'medium', difficultyMix: { easy: 3, medium: 2, hard: 0 } },
        { id: 'sec-b', name: 'Section B (Short Answers)', title: 'Section B', questionType: 'short', numQuestions: 3, marksPerQuestion: 5, difficulty: 'medium', difficultyMix: { easy: 1, medium: 2, hard: 0 } },
      ]
    } else if (assessmentType === 'C2') {
      blueprintSections = [
        { id: 'sec-a', name: 'Section A (MCQs)', title: 'Section A', questionType: 'mcq', numQuestions: 10, marksPerQuestion: 1, difficulty: 'medium', difficultyMix: { easy: 4, medium: 4, hard: 2 } },
        { id: 'sec-b', name: 'Section B (Short Answers)', title: 'Section B', questionType: 'short', numQuestions: 4, marksPerQuestion: 5, difficulty: 'medium', difficultyMix: { easy: 1, medium: 2, hard: 1 } },
        { id: 'sec-c', name: 'Section C (Long Answers / Case)', title: 'Section C', questionType: 'long', numQuestions: 2, marksPerQuestion: 10, difficulty: 'medium', difficultyMix: { easy: 0, medium: 1, hard: 1 } },
      ]
    } else {
      blueprintSections = [
        { id: 'sec-a', name: 'Section A (MCQs)', title: 'Section A', questionType: 'mcq', numQuestions: 10, marksPerQuestion: 1, difficulty: 'medium', difficultyMix: { easy: 4, medium: 4, hard: 2 } },
        { id: 'sec-b', name: 'Section B (Short Answers)', title: 'Section B', questionType: 'short', numQuestions: 6, marksPerQuestion: 5, difficulty: 'medium', difficultyMix: { easy: 2, medium: 3, hard: 1 } },
        { id: 'sec-c', name: 'Section C (Long Answers / Problems)', title: 'Section C', questionType: 'long', numQuestions: 4, marksPerQuestion: 10, difficulty: 'medium', difficultyMix: { easy: 1, medium: 2, hard: 1 } },
      ]
    }

    try {
      const result = await generatePaper(
        collegeId,
        {
          title,
          subject,
          courseCode: assignedCourse?.courseCode || '',
          totalMarks: expectedMarks,
          duration,
          examType: assessmentType.toLowerCase(),
          batch: assignedCourse?.batch || '',
          branch: assignedCourse?.branch || '',
          mode: autoMode,
          numSets,
          sections: blueprintSections,
        },
        user?.id || user?.uid || '',
        user?.name || user?.email || 'Faculty'
      )

      setPaperTitle(title)
      const qIds = result.paper.linkedQuestionIds || result.paper.questionIds || []
      setSelectedQuestions(qIds)
      setLastSavedPaperId(result.paper.id)

      await loadData()

      // Take the faculty member straight to the saved paper — "Generate"
      // used to end on this tab with no sign of where the paper went.
      setActiveTab('my-papers')
      const warnings = Array.isArray((result as any)?.warnings) ? ((result as any).warnings as string[]) : []
      const setCount = Array.isArray((result as any)?.sets) ? (result as any).sets.length : 1
      const setNote = setCount > 1 ? ` (${setCount} sets — A${setCount > 1 ? ', B' : ''}${setCount > 2 ? ', C' : ''})` : ''
      setShowToast(
        warnings.length > 0
          ? `Paper${setCount > 1 ? 's' : ''} generated${setNote} — Note: ${warnings[0]}`
          : `Exam paper${setCount > 1 ? 's' : ''} generated with ${qIds.length} questions${setNote} — saved under "My Generated Papers".`
      )
      setTimeout(() => setShowToast(''), 5000)
    } catch (err: any) {
      console.error('[handleAutoGenerate]', err)
      setShowToast(isPermissionDeniedError(err) ? staleClaimMessage('paper save') : (err?.message || 'Automatic generation failed'))
      setTimeout(() => setShowToast(''), 5000)
    } finally {
      setIsAutoGenerating(false)
    }
  }

  const generatePreviewHTML = () => {
    const selected = availableQuestions.filter(q => selectedQuestions.includes(q.id)).map(withEdits)
    const sections = assessmentType === 'C3' 
      ? [
          { name: 'Section A (1 Mark each)', questions: selected.filter(q => q.marks <= 2) },
          { name: 'Section B (5 Marks each)', questions: selected.filter(q => q.marks > 2 && q.marks <= 6) },
          { name: 'Section C (10 Marks each)', questions: selected.filter(q => q.marks > 6) },
        ]
      : [{ name: 'Questions', questions: selected }]

    let html = `
      <div style="font-family: 'Times New Roman', serif; padding: 25px; color: #111;">
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px;">
          <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">${(user as any)?.collegeName || 'College Examination'}</h1>
          <h2 style="font-size: 16px; margin-bottom: 4px; font-weight: 600;">${paperTitle || 'Examination Paper'}</h2>
          <p style="font-size: 12px; margin-bottom: 4px;"><strong>Course / Subject:</strong> ${activeSubjectName} ${assignedCourse?.courseCode ? `(${assignedCourse.courseCode})` : ''} | <strong>Assessment:</strong> ${assessmentType}</p>
          <p style="font-size: 12px; margin: 0;"><strong>Time Allowed:</strong> ${duration} Minutes &nbsp;|&nbsp; <strong>Maximum Marks:</strong> ${totalSelectedMarks || expectedMarks}</p>
          ${customInstructions ? `<p style="font-size: 11px; margin-top: 8px; font-style: italic;"><strong>General Instructions:</strong> ${customInstructions}</p>` : ''}
        </div>
    `

    sections.forEach((section, si) => {
      if (section.questions.length > 0) {
        html += `<h3 style="font-size: 13px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">${section.name}</h3>`
        section.questions.forEach((q, i) => {
          html += `
            <div style="margin-bottom: 12px; font-size: 12px;">
              <p style="margin: 0;"><strong>Q${si * 10 + i + 1}.</strong> ${q.questionText} <span style="float: right; font-weight: bold;">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span></p>
              <p style="font-size: 10px; color: #777; margin: 2px 0 0 20px;">Topic: ${q.topic} • Difficulty: ${q.difficulty}</p>
            </div>
          `
        })
      }
    })

    html += `</div>`
    return html
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(generatePreviewHTML())
      win.document.close()
      win.print()
    }
  }

  const handleExportPDF = () => {
    handlePrint()
  }

  const handleSubmitForApproval = async () => {
    if (!paperTitle.trim()) {
      setShowToast('Please enter a paper title')
      return
    }
    if (selectedQuestions.length === 0) {
      setShowToast('Please select at least one question')
      return
    }

    const selected = availableQuestions.filter(q => selectedQuestions.includes(q.id)).map(withEdits)
    const questionIds = selected.map(q => q.id)

    const sections = assessmentType === 'C3'
      ? [
          { name: 'Section A', questions: selected.filter(q => q.marks <= 2).map(q => ({ questionId: q.id, question: q })), totalMarks: selected.filter(q => q.marks <= 2).reduce((s, q) => s + q.marks, 0) },
          { name: 'Section B', questions: selected.filter(q => q.marks > 2 && q.marks <= 6).map(q => ({ questionId: q.id, question: q })), totalMarks: selected.filter(q => q.marks > 2 && q.marks <= 6).reduce((s, q) => s + q.marks, 0) },
          { name: 'Section C', questions: selected.filter(q => q.marks > 6).map(q => ({ questionId: q.id, question: q })), totalMarks: selected.filter(q => q.marks > 6).reduce((s, q) => s + q.marks, 0) },
        ]
      : [{ name: 'Questions', questions: selected.map(q => ({ questionId: q.id, question: q })), totalMarks: totalSelectedMarks }]

    try {
      const saved = await createPaper(
        collegeId,
        {
          title: paperTitle,
          subject: activeSubjectName,
          totalMarks: totalSelectedMarks,
          duration,
          examType: assessmentType.toLowerCase(),
          batch: assignedCourse?.batch || '',
          branch: assignedCourse?.branch || '',
          instructions: customInstructions ? [customInstructions] : [],
          negativeMarking: false,
        },
        questionIds,
        user?.id || user?.uid || '',
        user?.name || user?.email || 'Unknown',
        true,
        sections as any
      )

      // Status transitions (draft → submitted-for-approval / published) are
      // server-authoritative: the Firestore rules refuse direct client
      // updates to verificationStatus, so route through the savePaper
      // callable, which validates and audits the transition.
      let transitioned = false
      try {
        const savePaperFn = httpsCallable<
          { paperId: string; collegeId: string; action: 'submitted' | 'save'; paper: Record<string, unknown> },
          { id: string; status: string; verificationStatus: string }
        >(functions, 'savePaper')
        await savePaperFn({
          paperId: saved.id,
          collegeId,
          action: requiresApproval ? 'submitted' : 'save',
          paper: {
            title: paperTitle.trim(),
            subject: activeSubjectName,
            branch: assignedCourse?.branch || '',
            batch: assignedCourse?.batch || '',
            semester: '',
            examType: assessmentType.toLowerCase(),
            date: new Date().toISOString().split('T')[0],
            duration: Number(duration) || 0,
            totalMarks: totalSelectedMarks,
            instructions: customInstructions || '',
            sections: sections
              .map((s, i) => ({
                id: `section-${i + 1}`,
                name: s.name,
                questions: s.questions.map(({ question }) => ({
                  text: question.questionText,
                  type: question.questionType === 'MCQ' ? 'mcq' : question.questionType === 'Short Answer' ? 'short' : 'long',
                  marks: Number(question.marks) || 0,
                  topic: question.topic || '',
                  // Options must travel with the save — savePaper stores what it
                  // is given (and now gates on it). Dropping options here would
                  // strip them from the stored paper and fail the Confirm sync.
                  ...(question.options && question.options.length > 0 ? { options: question.options } : {}),
                })),
              }))
              .filter((s) => s.questions.length > 0),
            requiresApproval,
          },
        })
        transitioned = true
      } catch (transitionErr: any) {
        console.error('[handleSubmitForApproval] savePaper transition failed', transitionErr)
        setShowToast(
          `Paper saved as a DRAFT, but the ${requiresApproval ? 'approval submission' : 'publish step'} failed: ${transitionErr?.message || 'server error'}. Ask an admin to run Access Control → Identity Repair, then retry from My Papers.`
        )
        setTimeout(() => setShowToast(''), 6000)
      }

      if (syncEditsToBank) {
        for (const [qid, edit] of Object.entries(questionEdits)) {
          if (!questionIds.includes(qid)) continue
          try {
            await updateQuestion(qid, { text: edit.questionText, marks: edit.marks })
          } catch {}
        }
      }

      for (const qid of questionIds) {
        await linkQuestionToPaper(qid, saved.id)
      }

      const newPaper: TestPaper = {
        id: saved.id,
        title: paperTitle,
        subject: activeSubjectName,
        className: assignedCourse?.batch || '',
        division: assignedCourse?.branch || '',
        totalMarks: totalSelectedMarks,
        duration,
        fileName: `${paperTitle.replace(/\s+/g, '_')}.pdf`,
        verificationStatus: transitioned ? (requiresApproval ? 'submitted-for-approval' : 'published') : 'draft',
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
        aiGenerated: autoMode === 'ai',
      }

      setLastSavedPaperId(saved.id)
      setPapers(prev => [newPaper, ...prev])
      setShowSubmitConfirm(false)
      if (transitioned) {
        setShowToast(requiresApproval ? 'Paper submitted for HOD approval!' : 'Paper saved and ready to use!')
        setTimeout(() => setShowToast(''), 3000)
      }

      setSelectedQuestions([])
      setPaperTitle('')
      setCustomInstructions('')
      setQuestionEdits({})
      setActiveTab('my-papers')
    } catch (err: any) {
      setShowToast(isPermissionDeniedError(err) ? staleClaimMessage('paper save') : (err?.message || 'Failed to submit paper'))
      setTimeout(() => setShowToast(''), 5000)
    }
  }

  const downloadSavedPaper = async (paperId: string, title: string) => {
    try {
      const result = await downloadPaperPDF(paperId, title)
      if (result.renderedBy === 'client' && result.notice) {
        setShowToast(result.notice)
        setTimeout(() => setShowToast(''), 4000)
      }
    } catch (err: any) {
      setShowToast(err?.message || 'Download failed')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link to="/faculty" className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500/30 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exam Paper Generator</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Automated examination authoring via Question Bank and AI Agent
            </p>
          </div>
        </div>

        {subjectOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Subject:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value)
                const o = subjectOptions.find((item) => item.id === e.target.value)
                if (o) {
                  setPaperTitle(`${o.subjectName} - ${assessmentType} Examination`)
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-teal-700 dark:text-teal-300 focus:outline-none focus:border-teal-500"
            >
              {subjectOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'generate'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Paper Generator
        </button>
        <button
          onClick={() => setActiveTab('visual-builder')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'visual-builder'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Pencil className="w-4 h-4" />
          Visual Builder
        </button>
        <button
          onClick={() => setActiveTab('my-papers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'my-papers'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Generated Papers
          {papers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
              {papers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'visual-builder' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <PaperBuilder collegeId={collegeId} />
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Strategy Switcher */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-teal-500" />
                    Paper Authoring Engine
                  </h3>
                  <p className="text-xs text-slate-500">Choose between one-click automated generation or manual handpicking</p>
                </div>
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    onClick={() => setGenerationStrategy('auto')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      generationStrategy === 'auto'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Automated
                  </button>
                  <button
                    onClick={() => setGenerationStrategy('manual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      generationStrategy === 'manual'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Manual Picker
                  </button>
                </div>
              </div>

              {/* Automated Generation Banner & Controls */}
              {generationStrategy === 'auto' && (
                <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-500/20 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setAutoMode('bank')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        autoMode === 'bank'
                          ? 'border-teal-500 bg-white dark:bg-slate-800 ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Question Bank</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">Pulls approved questions balancing module &amp; difficulty</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoMode('ai')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        autoMode === 'ai'
                          ? 'border-teal-500 bg-white dark:bg-slate-800 ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">AI Agent</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">Generates brand-new leak-proof questions &amp; paper</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoMode('hybrid')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        autoMode === 'hybrid'
                          ? 'border-teal-500 bg-white dark:bg-slate-800 ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Hybrid Engine</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">Pulls from bank and fills missing slots with AI</p>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-teal-500/20">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Target: <strong className="text-slate-900 dark:text-white">{expectedMarks} Marks</strong> • Duration: <strong className="text-slate-900 dark:text-white">{duration} min</strong> • Syllabus: <strong className="text-teal-700 dark:text-teal-300">{activeSubjectName}</strong>
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-[11px] text-slate-500 whitespace-nowrap" htmlFor="num-sets-select">
                        Sets:
                      </label>
                      <select
                        id="num-sets-select"
                        value={numSets}
                        onChange={(e) => setNumSets(Number(e.target.value) as 1 | 2 | 3)}
                        disabled={isAutoGenerating}
                        className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50"
                      >
                        <option value={1}>1 set</option>
                        <option value={2}>2 sets (A, B)</option>
                        <option value={3}>3 sets (A, B, C)</option>
                      </select>
                      <button
                        onClick={handleAutoGenerate}
                        disabled={isAutoGenerating}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        {isAutoGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isAutoGenerating ? 'Generating Paper...' : 'Generate Paper Automatically'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Paper Configuration */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Paper Specifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Paper Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Midterm Exam - Cost Accounting"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assessment Level</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value as 'C1' | 'C2' | 'C3')}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="C1">C1: Class / Unit Test (20 marks • 45 min)</option>
                    <option value="C2">C2: Midterm Examination (50 marks • 90 min)</option>
                    <option value="C3">C3: End Semester University Exam (80 marks • 180 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Simple calculators permitted"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Questions Pool & Selection */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Selected Questions for Paper ({selectedQuestions.length} selected)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {generationStrategy === 'auto'
                      ? 'Review, edit, or swap individual questions in this paper'
                      : `Pick from ${filteredAvailableQuestions.length} active question bank items`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5" /> Upload Ready Paper
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto p-2">
                {selectedQuestions.length === 0 ? (
                  <div className="p-10 text-center">
                    <Sparkles className="w-8 h-8 text-teal-500 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No questions selected yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;Generate Paper Automatically&quot; above to assemble questions instantly, or switch to Manual Picker.
                    </p>
                  </div>
                ) : (
                  availableQuestions
                    .filter(q => selectedQuestions.includes(q.id))
                    .map((q, idx) => {
                      const edited = withEdits(q)
                      return (
                        <div key={q.id} className="p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            Q{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                              {edited.questionText}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                                {edited.marks} Mark{edited.marks > 1 ? 's' : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                {q.difficulty}
                              </span>
                              {q.topic && <span>• Topic: {q.topic}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openQuestionEditor(q)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit question text or marks"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleQuestion(q.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Remove from paper"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Paper Summary & Actions */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Exam Paper Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Subject</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{activeSubjectName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Selected Questions</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedQuestions.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Total Marks</span>
                  <span className={`font-extrabold ${totalSelectedMarks === expectedMarks ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {totalSelectedMarks} / {expectedMarks} Marks
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Exam Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white">{duration} min</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">HOD Approval</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {requiresApproval ? 'Required (C2/C3)' : 'Not Required (Direct Publish)'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={selectedQuestions.length === 0}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Eye className="w-4 h-4" /> Full Paper Preview
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={selectedQuestions.length === 0}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
                >
                  {requiresApproval ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {requiresApproval ? 'Submit for HOD Approval' : 'Save & Publish Exam Paper'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Papers Tab */}
      {activeTab === 'my-papers' && (
        <div className="space-y-3">
          {papers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No generated papers yet</p>
              <p className="text-xs text-slate-500 mt-1">Switch to the Paper Generator tab to author your first exam paper.</p>
            </div>
          ) : (
            papers.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.subject} • {p.totalMarks} Marks • {p.duration} min •{' '}
                    {p.verificationStatus === 'published'
                      ? 'Published'
                      : p.verificationStatus === 'submitted-for-approval'
                        ? 'Submitted for Approval'
                        : 'Draft'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadSavedPaper(p.id, p.title)}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-bold hover:bg-teal-100 flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-teal-600" />
                Paper Print &amp; PDF Preview
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={handleExportPDF} className="px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
                <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
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
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-teal-500/10">
                <Send className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {requiresApproval ? 'Submit for HOD Approval' : 'Save and Publish Paper'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {requiresApproval
                ? `You are about to submit "${paperTitle}" for official review and approval.`
                : `You are about to save "${paperTitle}". As a class test, it will be published immediately.`}
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1 text-xs mb-4">
              <p className="text-slate-600 dark:text-slate-400">Total Questions: <span className="font-bold text-slate-900 dark:text-white">{selectedQuestions.length}</span></p>
              <p className="text-slate-600 dark:text-slate-400">Total Marks: <span className="font-bold text-slate-900 dark:text-white">{totalSelectedMarks}</span></p>
              <p className="text-slate-600 dark:text-slate-400">Duration: <span className="font-bold text-slate-900 dark:text-white">{duration} min</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button onClick={handleSubmitForApproval} className="flex-1 px-4 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                {requiresApproval ? <Send className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                Confirm &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Edit Question Content</h2>
            <textarea
              rows={4}
              value={editDraft.questionText}
              onChange={(e) => setEditDraft(prev => ({ ...prev, questionText: e.target.value }))}
              className="w-full px-3 py-2 mb-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Marks</label>
            <input
              type="number"
              min={1}
              value={editDraft.marks}
              onChange={(e) => setEditDraft(prev => ({ ...prev, marks: Number(e.target.value) || 1 }))}
              className="w-full px-3 py-2 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingQuestionId(null)} className="flex-1 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={saveQuestionEdit} className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <PaperUploadEditor
        open={uploadOpen}
        collegeId={collegeId}
        userId={facultyId}
        userName={user?.name || ''}
        branches={branches}
        batches={batches}
        canPublishDirectly={user?.role === 'hod'}
        onClose={() => setUploadOpen(false)}
        onSaved={async () => {
          setShowToast('Paper uploaded successfully!')
          setTimeout(() => setShowToast(''), 3000)
          await loadData()
        }}
      />

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl bg-teal-500 text-white shadow-xl z-50 text-xs font-bold">
          <CheckCircle className="w-4 h-4" />
          <span>{showToast}</span>
        </div>
      )}
    </div>
  )
}
