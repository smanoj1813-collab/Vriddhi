import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  FileText, Printer, Download, CheckSquare, Square, Loader2, AlertCircle,
  BookOpen, Eye, X, Plus, Search, Filter, ChevronDown, Sparkles, Zap,
  GraduationCap, MapPin, Layers, Bell, Send, CheckCircle, Clock, Users,
  Trash2, Copy, RotateCcw, FileSpreadsheet, BarChart3, Award, TrendingUp,
  Calendar, ChevronRight, AlertTriangle, Pencil, Save, XCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { ref, onValue, push, set, get, update } from 'firebase/database'
import { getDatabase } from 'firebase/database'
import { useAuth } from '../../auth/context/AuthContext'

// ─── Firebase DB Instance ─────────────────────────────
const db = getDatabase()

// ─── Types ──────────────────────────────────────────────
interface Question {
  id: string
  semester: string
  courseCode: string
  courseName: string
  moduleNo: string
  moduleName: string
  topic: string
  questionText: string
  questionType: string
  marks: number
  difficulty: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected'
  bloomLevel: string
  aiGenerated?: boolean
  aiConfidence?: number
}

interface Course {
  code: string
  name: string
  branch: string
  batch: string
  division: string
  totalStudents: number
}

interface Faculty {
  id: string
  name: string
  email: string
  department: string
  subjects: string[]
  fcmToken?: string
  phone?: string
}

interface PaperConfig {
  id: string
  name: string
  courseCode: string
  courseName: string
  branch: string
  batch: string
  division: string
  assessmentType: 'C1' | 'C2' | 'C3' | 'MidTerm' | 'EndSem'
  examDate: string
  examTime: string
  duration: number
  maxMarks: number
  passMark: number
  customInstructions: string
  selectedQuestionIds: string[]
  status: 'draft' | 'generated' | 'sent' | 'approved'
  createdAt: string
  createdBy: string
  sentToFaculty?: string[]
  facultyApproval?: Record<string, 'pending' | 'approved' | 'rejected'>
  aiGenerated?: boolean
}

interface NotificationPayload {
  title: string
  body: string
  type: 'paper_generated' | 'paper_approved' | 'paper_rejected' | 'paper_sent'
  paperId: string
  timestamp: string
  read: boolean
  sender: string
}

interface PaperFilters {
  moduleNo: string
  questionType: string
  difficulty: string
  bloomLevel: string
  topic: string
}

// ─── Constants ──────────────────────────────────────────
const ASSESSMENT_TYPES: Record<string, { label: string; marks: number; duration: number }> = {
  C1: { label: 'Class Test 1 (10 marks)', marks: 10, duration: 60 },
  C2: { label: 'Class Test 2 (10 marks)', marks: 10, duration: 60 },
  C3: { label: 'Class Test 3 (10 marks)', marks: 10, duration: 60 },
  MidTerm: { label: 'Mid Term (40 marks)', marks: 40, duration: 120 },
  EndSem: { label: 'End Semester (80 marks)', marks: 80, duration: 180 },
}

const QUESTION_TYPES = ['MCQ', 'Short Answer', 'Long Answer', 'Case Study', 'Problem Solving', 'Essay']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const BRANCHES = ['Computer Science', 'Commerce', 'Arts', 'Science', 'Management']
const BATCHES = ['2023-2024', '2024-2025', '2025-2026']
const DIVISIONS = ['A', 'B', 'C', 'D']

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// ─── Mock Data ──────────────────────────────────────────
const mockCourses: Course[] = [
  { code: 'CS101', name: 'Data Structures', branch: 'Computer Science', batch: '2024-2025', division: 'A', totalStudents: 45 },
  { code: 'CS102', name: 'Algorithms', branch: 'Computer Science', batch: '2024-2025', division: 'B', totalStudents: 38 },
  { code: 'CS103', name: 'Database Systems', branch: 'Computer Science', batch: '2025-2026', division: 'A', totalStudents: 42 },
  { code: 'COM101', name: 'Financial Accounting', branch: 'Commerce', batch: '2024-2025', division: 'A', totalStudents: 50 },
  { code: 'COM102', name: 'Business Law', branch: 'Commerce', batch: '2023-2024', division: 'B', totalStudents: 45 },
  { code: 'ART101', name: 'Literature', branch: 'Arts', batch: '2024-2025', division: 'A', totalStudents: 35 },
  { code: 'SCI101', name: 'Physics', branch: 'Science', batch: '2025-2026', division: 'B', totalStudents: 40 },
  { code: 'MGT101', name: 'Organizational Behavior', branch: 'Management', batch: '2024-2025', division: 'C', totalStudents: 55 },
]

const mockFaculty: Faculty[] = [
  { id: 'fac1', name: 'Dr. Rajesh Kumar', email: 'rajesh@kgis.edu', department: 'Computer Science', subjects: ['CS101', 'CS102', 'CS103'], fcmToken: 'token_rajesh' },
  { id: 'fac2', name: 'Prof. Priya Sharma', email: 'priya@kgis.edu', department: 'Commerce', subjects: ['COM101', 'COM102'], fcmToken: 'token_priya' },
  { id: 'fac3', name: 'Dr. Amit Patel', email: 'amit@kgis.edu', department: 'Arts', subjects: ['ART101'], fcmToken: 'token_amit' },
  { id: 'fac4', name: 'Prof. Sneha Gupta', email: 'sneha@kgis.edu', department: 'Science', subjects: ['SCI101'], fcmToken: 'token_sneha' },
  { id: 'fac5', name: 'Dr. Vikram Rao', email: 'vikram@kgis.edu', department: 'Management', subjects: ['MGT101'], fcmToken: 'token_vikram' },
]

const mockQuestions: Question[] = [
  { id: 'q1', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '1', moduleName: 'Introduction', topic: 'Arrays', questionText: 'Explain the concept of dynamic arrays and their time complexity for insertion and deletion operations.', questionType: 'Long Answer', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Analyze', aiGenerated: true, aiConfidence: 0.92 },
  { id: 'q2', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '2', moduleName: 'Linked Lists', topic: 'Singly Linked List', questionText: 'Write an algorithm to reverse a singly linked list without using extra space.', questionType: 'Problem Solving', marks: 10, difficulty: 'Hard', status: 'Approved', bloomLevel: 'Apply', aiGenerated: true, aiConfidence: 0.88 },
  { id: 'q3', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '1', moduleName: 'Introduction', topic: 'Arrays', questionText: 'What is the difference between array and linked list?', questionType: 'Short Answer', marks: 5, difficulty: 'Easy', status: 'Approved', bloomLevel: 'Understand', aiGenerated: false },
  { id: 'q4', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '3', moduleName: 'Stacks', topic: 'Stack Operations', questionText: 'Implement a stack using two queues and analyze its time complexity.', questionType: 'Problem Solving', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Apply', aiGenerated: true, aiConfidence: 0.95 },
  { id: 'q5', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '4', moduleName: 'Queues', topic: 'Circular Queue', questionText: 'Explain the concept of circular queue with a real-world example.', questionType: 'Short Answer', marks: 5, difficulty: 'Easy', status: 'Approved', bloomLevel: 'Understand', aiGenerated: false },
  { id: 'q6', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '5', moduleName: 'Trees', topic: 'Binary Search Tree', questionText: 'Construct a BST from the following sequence: 50, 30, 70, 20, 40, 60, 80. Show all steps.', questionType: 'Problem Solving', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Apply', aiGenerated: true, aiConfidence: 0.91 },
  { id: 'q7', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '5', moduleName: 'Trees', topic: 'AVL Trees', questionText: 'What is balance factor in AVL trees? How is it calculated?', questionType: 'MCQ', marks: 2, difficulty: 'Easy', status: 'Approved', bloomLevel: 'Remember', aiGenerated: false },
  { id: 'q8', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '6', moduleName: 'Graphs', topic: 'DFS', questionText: 'Compare DFS and BFS traversal algorithms with their time and space complexities.', questionType: 'Long Answer', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Analyze', aiGenerated: true, aiConfidence: 0.89 },
  { id: 'q9', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '6', moduleName: 'Graphs', topic: 'Dijkstra', questionText: 'Apply Dijkstra algorithm to find shortest path from node A to all other nodes.', questionType: 'Problem Solving', marks: 10, difficulty: 'Hard', status: 'Approved', bloomLevel: 'Apply', aiGenerated: true, aiConfidence: 0.93 },
  { id: 'q10', semester: '3', courseCode: 'CS101', courseName: 'Data Structures', moduleNo: '7', moduleName: 'Sorting', topic: 'Quick Sort', questionText: 'Explain quick sort with example and analyze its best, average, and worst case.', questionType: 'Long Answer', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Analyze', aiGenerated: false },
  { id: 'q11', semester: '3', courseCode: 'CS102', courseName: 'Algorithms', moduleNo: '1', moduleName: 'Analysis', topic: 'Big O', questionText: 'Prove that T(n) = 2T(n/2) + n has solution O(n log n).', questionType: 'Problem Solving', marks: 10, difficulty: 'Hard', status: 'Approved', bloomLevel: 'Evaluate', aiGenerated: true, aiConfidence: 0.90 },
  { id: 'q12', semester: '3', courseCode: 'CS102', courseName: 'Algorithms', moduleNo: '2', moduleName: 'Divide & Conquer', topic: 'Merge Sort', questionText: 'Write the merge sort algorithm and trace it on [38, 27, 43, 3, 9, 82, 10].', questionType: 'Problem Solving', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Apply', aiGenerated: true, aiConfidence: 0.94 },
  { id: 'q13', semester: '3', courseCode: 'COM101', courseName: 'Financial Accounting', moduleNo: '1', moduleName: 'Basics', topic: 'Journal Entries', questionText: 'Prepare journal entries for the following transactions.', questionType: 'Problem Solving', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Apply', aiGenerated: false },
  { id: 'q14', semester: '3', courseCode: 'COM101', courseName: 'Financial Accounting', moduleNo: '2', moduleName: 'Ledger', topic: 'Trial Balance', questionText: 'What is trial balance? Why is it prepared?', questionType: 'Short Answer', marks: 5, difficulty: 'Easy', status: 'Approved', bloomLevel: 'Understand', aiGenerated: false },
  { id: 'q15', semester: '3', courseCode: 'ART101', courseName: 'Literature', moduleNo: '1', moduleName: 'Poetry', topic: 'Shakespeare', questionText: 'Analyze the themes in Shakespeare\'s Sonnet 18.', questionType: 'Essay', marks: 10, difficulty: 'Medium', status: 'Approved', bloomLevel: 'Analyze', aiGenerated: true, aiConfidence: 0.87 },
]

const mockPapers: PaperConfig[] = [
  { id: 'p1', name: 'CTD 1 - Data Structures', courseCode: 'CS101', courseName: 'Data Structures', branch: 'Computer Science', batch: '2024-2025', division: 'A', assessmentType: 'C3', examDate: '2026-06-25', examTime: '10:00', duration: 60, maxMarks: 10, passMark: 4, customInstructions: 'Answer all questions. All questions carry equal marks.', selectedQuestionIds: ['q1', 'q3', 'q7'], status: 'sent', createdAt: '2026-06-20', createdBy: 'admin', sentToFaculty: ['fac1'], facultyApproval: { fac1: 'approved' } },
  { id: 'p2', name: 'Mid Term - Algorithms', courseCode: 'CS102', courseName: 'Algorithms', branch: 'Computer Science', batch: '2024-2025', division: 'B', assessmentType: 'MidTerm', examDate: '2026-06-28', examTime: '14:00', duration: 120, maxMarks: 40, passMark: 16, customInstructions: 'Answer any 4 out of 6 questions.', selectedQuestionIds: ['q11', 'q12'], status: 'generated', createdAt: '2026-06-22', createdBy: 'admin' },
]

// ─── Helpers ────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getDaysUntil = (dateStr: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Sub-Components ─────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const bgMap: Record<string, string> = {
    teal: 'bg-teal-500/20',
    blue: 'bg-blue-500/20',
    amber: 'bg-amber-500/20',
    green: 'bg-green-500/20',
    purple: 'bg-purple-500/20',
    red: 'bg-red-500/20',
  }
  const textMap: Record<string, string> = {
    teal: 'text-teal-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  }
  return (
    <div className="glass-card p-5 hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-vriddhi-muted">{title}</p>
      {subtitle && <p className="text-xs text-vriddhi-muted/60 mt-1">{subtitle}</p>}
    </div>
  )
}

interface QuestionCardProps {
  question: Question
  selected: boolean
  onToggle: (id: string) => void
  index: number
}

function QuestionCard({ question, selected, onToggle, index }: QuestionCardProps) {
  const difficultyColor = {
    Easy: 'bg-green-500/20 text-green-400',
    Medium: 'bg-amber-500/20 text-amber-400',
    Hard: 'bg-red-500/20 text-red-400',
  }[question.difficulty] || 'bg-gray-500/20 text-gray-400'

  return (
    <div
      onClick={() => onToggle(question.id)}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${
        selected
          ? 'bg-teal-500/10 border-teal-500/40 hover:bg-teal-500/15'
          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          {selected ? (
            <CheckSquare className="w-5 h-5 text-teal-400" />
          ) : (
            <Square className="w-5 h-5 text-vriddhi-muted group-hover:text-white transition-colors" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-white font-medium leading-relaxed">{index + 1}. {question.questionText}</p>
            {question.aiGenerated && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-3 h-3" />
                AI {question.aiConfidence ? `${Math.round(question.aiConfidence * 100)}%` : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyColor}`}>
              {question.difficulty}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {question.questionType}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-vriddhi-muted">
              {question.marks}m
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-vriddhi-muted">
              M{question.moduleNo}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-vriddhi-muted">
              {question.bloomLevel}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-vriddhi-muted truncate max-w-[120px]">
              {question.topic}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FacultyNotificationModalProps {
  paper: PaperConfig | null
  faculty: Faculty[]
  onClose: () => void
  onSend: (paperId: string, facultyIds: string[], message: string) => void
}

function FacultyNotificationModal({ paper, faculty, onClose, onSend }: FacultyNotificationModalProps) {
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (paper) {
      // Auto-select faculty teaching this course
      const autoSelected = faculty
        .filter(f => f.subjects.includes(paper.courseCode))
        .map(f => f.id)
      setSelectedFaculty(autoSelected)
      setMessage(`A new ${ASSESSMENT_TYPES[paper.assessmentType]?.label || paper.assessmentType} paper for ${paper.courseName} has been generated. Please review and approve.`)
    }
  }, [paper, faculty])

  if (!paper) return null

  const relevantFaculty = faculty.filter(f => f.subjects.includes(paper.courseCode))

  const handleSend = async () => {
    if (selectedFaculty.length === 0) return
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    onSend(paper.id, selectedFaculty, message)
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Send to Faculty</h3>
              <p className="text-sm text-vriddhi-muted">{paper.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-vriddhi-border/50 transition-colors">
            <X className="w-5 h-5 text-vriddhi-muted" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-vriddhi-muted mb-2">Select Faculty</label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {relevantFaculty.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFaculty(prev =>
                    prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                  )}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedFaculty.includes(f.id) ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  {selectedFaculty.includes(f.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Square className="w-5 h-5 text-vriddhi-muted" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{f.name}</p>
                    <p className="text-xs text-vriddhi-muted">{f.department} • {f.email}</p>
                  </div>
                  {f.fcmToken && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                      Push Ready
                    </span>
                  )}
                </div>
              ))}
              {relevantFaculty.length === 0 && (
                <p className="text-sm text-vriddhi-muted text-center py-4">No faculty found for this course.</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-vriddhi-muted mb-2">Notification Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="input-field w-full resize-none"
              placeholder="Enter notification message..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 btn-secondary justify-center">Cancel</button>
            <button
              onClick={handleSend}
              disabled={selectedFaculty.length === 0 || sending}
              className="flex-1 btn-primary justify-center disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PaperPreviewModalProps {
  paper: PaperConfig | null
  questions: Question[]
  onClose: () => void
  onExportPDF: () => void
  onPrint: () => void
}

function PaperPreviewModal({ paper, questions, onClose, onExportPDF, onPrint }: PaperPreviewModalProps) {
  if (!paper) return null

  const selectedQuestions = questions.filter(q => paper.selectedQuestionIds.includes(q.id))
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border sticky top-0 bg-[#0f172a]/90 backdrop-blur-xl z-10">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-400" />
              Paper Preview
            </h3>
            <p className="text-sm text-vriddhi-muted mt-1">{paper.courseName} • {ASSESSMENT_TYPES[paper.assessmentType]?.label || paper.assessmentType}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrint} className="btn-secondary text-sm">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onExportPDF} className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-vriddhi-border/50 transition-colors">
              <X className="w-5 h-5 text-vriddhi-muted" />
            </button>
          </div>
        </div>
        <div className="p-8 space-y-6" id="paper-preview-content">
          {/* Paper Header */}
          <div className="text-center border-b border-vriddhi-border pb-6">
            <h1 className="text-2xl font-bold text-white mb-2">KGIS Institute of Technology</h1>
            <p className="text-lg text-vriddhi-muted">{paper.courseName}</p>
            <p className="text-vriddhi-muted">{ASSESSMENT_TYPES[paper.assessmentType]?.label || paper.assessmentType}</p>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-vriddhi-muted">
              <span>Date: {formatDate(paper.examDate)}</span>
              <span>Time: {paper.examTime}</span>
              <span>Duration: {paper.duration} min</span>
              <span>Max Marks: {paper.maxMarks}</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-vriddhi-muted/60">
              <span>Batch: {paper.batch}</span>
              <span>Branch: {paper.branch}</span>
              <span>Division: {paper.division}</span>
            </div>
          </div>

          {/* Instructions */}
          {paper.customInstructions && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-400 font-medium mb-1">Instructions:</p>
              <p className="text-sm text-vriddhi-muted">{paper.customInstructions}</p>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {selectedQuestions.map((q, i) => (
              <div key={q.id} className="border-b border-vriddhi-border/30 pb-4">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-bold text-teal-400 mt-0.5">Q{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm text-white leading-relaxed">{q.questionText}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-vriddhi-muted">[{q.marks} marks]</span>
                      <span className="text-xs text-vriddhi-muted">{q.questionType}</span>
                      <span className="text-xs text-vriddhi-muted">{q.difficulty}</span>
                      {q.aiGenerated && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          AI Generated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-vriddhi-muted pt-4 border-t border-vriddhi-border">
            <span>Total Questions: {selectedQuestions.length}</span>
            <span className={`font-medium ${totalMarks === paper.maxMarks ? 'text-green-400' : 'text-amber-400'}`}>
              Total Marks: {totalMarks} / {paper.maxMarks}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────
export default function PaperGeneratorAdmin() {
  const { user } = useAuth()

  // ─── State ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'generate' | 'papers'>('generate')
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [questions, setQuestions] = useState<Question[]>(mockQuestions)
  const [faculty, setFaculty] = useState<Faculty[]>(mockFaculty)
  const [papers, setPapers] = useState<PaperConfig[]>(mockPapers)

  // Paper generation state
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [assessmentType, setAssessmentType] = useState<'C1' | 'C2' | 'C3' | 'MidTerm' | 'EndSem'>('C3')
  const [customInstructions, setCustomInstructions] = useState('')
  const [paperName, setPaperName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examTime, setExamTime] = useState('10:00')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('')

  // Filters
  const [filters, setFilters] = useState<PaperFilters>({
    moduleNo: '',
    questionType: '',
    difficulty: '',
    bloomLevel: '',
    topic: '',
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<PaperConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [paperFilter, setPaperFilter] = useState<'all' | 'draft' | 'generated' | 'sent' | 'approved'>('all')
  const [showAIGenerate, setShowAIGenerate] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiCount, setAiCount] = useState(5)
  const [aiLoading, setAiLoading] = useState(false)

  // ─── Firebase Integration (commented for dev) ────────
  /*
  useEffect(() => {
    if (!user?.college) return
    const collegeId = user.college

    // Load courses
    const coursesRef = ref(db, `colleges/${collegeId}/courses`)
    const unsubCourses = onValue(coursesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setCourses(Object.entries(data).map(([id, val]) => ({ id, ...(val as object) })) as Course[])
    })

    // Load questions
    const questionsRef = ref(db, `colleges/${collegeId}/questions`)
    const unsubQuestions = onValue(questionsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setQuestions(Object.entries(data).map(([id, val]) => ({ id, ...(val as object) })) as Question[])
    })

    // Load faculty
    const facultyRef = ref(db, `colleges/${collegeId}/faculty`)
    const unsubFaculty = onValue(facultyRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setFaculty(Object.entries(data).map(([id, val]) => ({ id, ...(val as object) })) as Faculty[])
    })

    // Load papers
    const papersRef = ref(db, `colleges/${collegeId}/papers`)
    const unsubPapers = onValue(papersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) setPapers(Object.entries(data).map(([id, val]) => ({ id, ...(val as object) })) as PaperConfig[])
    })

    return () => {
      unsubCourses()
      unsubQuestions()
      unsubFaculty()
      unsubPapers()
    }
  }, [user?.college])
  */

  // ─── Derived Data ─────────────────────────────────────
  const selectedCourseData = useMemo(() =>
    courses.find(c => c.code === selectedCourse),
  [courses, selectedCourse])

  const filteredQuestions = useMemo(() => {
    if (!selectedCourse) return []
    let filtered = questions.filter(q => q.courseCode === selectedCourse && q.status === 'Approved')

    if (filters.moduleNo) filtered = filtered.filter(q => q.moduleNo === filters.moduleNo)
    if (filters.questionType) filtered = filtered.filter(q => q.questionType === filters.questionType)
    if (filters.difficulty) filtered = filtered.filter(q => q.difficulty === filters.difficulty)
    if (filters.bloomLevel) filtered = filtered.filter(q => q.bloomLevel === filters.bloomLevel)
    if (filters.topic) filtered = filtered.filter(q => q.topic.toLowerCase().includes(filters.topic.toLowerCase()))

    return filtered
  }, [questions, selectedCourse, filters])

  const totalSelectedMarks = useMemo(() =>
    questions
      .filter(q => selectedQuestions.includes(q.id))
      .reduce((sum, q) => sum + (q.marks || 0), 0),
  [questions, selectedQuestions])

  const expectedMarks = ASSESSMENT_TYPES[assessmentType]?.marks || 10
  const marksMatch = totalSelectedMarks === expectedMarks
  const marksDiff = expectedMarks - totalSelectedMarks

  const filteredPapers = useMemo(() => {
    let filtered = papers
    if (paperFilter !== 'all') filtered = filtered.filter(p => p.status === paperFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.courseName.toLowerCase().includes(q) ||
        p.branch.toLowerCase().includes(q) ||
        p.batch.toLowerCase().includes(q)
      )
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [papers, paperFilter, searchQuery])

  const stats = useMemo(() => ({
    total: papers.length,
    draft: papers.filter(p => p.status === 'draft').length,
    generated: papers.filter(p => p.status === 'generated').length,
    sent: papers.filter(p => p.status === 'sent').length,
    approved: papers.filter(p => p.status === 'approved').length,
    totalQuestions: questions.length,
    aiQuestions: questions.filter(q => q.aiGenerated).length,
  }), [papers, questions])

  const questionDistribution = useMemo(() => {
    const data: Record<string, number> = {}
    filteredQuestions.forEach(q => {
      data[q.questionType] = (data[q.questionType] || 0) + 1
    })
    return Object.entries(data).map(([type, count]) => ({ type, count }))
  }, [filteredQuestions])

  const bloomDistribution = useMemo(() => {
    const data: Record<string, number> = {}
    filteredQuestions.forEach(q => {
      data[q.bloomLevel] = (data[q.bloomLevel] || 0) + 1
    })
    return Object.entries(data).map(([level, count]) => ({ level, count }))
  }, [filteredQuestions])

  // ─── Actions ──────────────────────────────────────────
  const handleCourseChange = (courseCode: string) => {
    setSelectedCourse(courseCode)
    setSelectedQuestions([])
    const course = courses.find(c => c.code === courseCode)
    if (course) {
      setSelectedBranch(course.branch)
      setSelectedBatch(course.batch)
      setSelectedDivision(course.division)
      setPaperName(`${ASSESSMENT_TYPES[assessmentType]?.label.split('(')[0].trim() || assessmentType} - ${course.name}`)
    }
  }

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const visibleIds = filteredQuestions.map(q => q.id)
    const allSelected = visibleIds.every(id => selectedQuestions.includes(id))
    if (allSelected) {
      setSelectedQuestions(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedQuestions(prev => [...new Set([...prev, ...visibleIds])])
    }
  }

  const handleAIGenerate = async () => {
    if (!aiTopic || !selectedCourse) return
    setAiLoading(true)
    // Simulate AI generation
    await new Promise(r => setTimeout(r, 2000))

    const newQuestions: Question[] = Array.from({ length: aiCount }, (_, i) => ({
      id: `ai-q-${Date.now()}-${i}`,
      semester: '3',
      courseCode: selectedCourse,
      courseName: selectedCourseData?.name || '',
      moduleNo: String(Math.floor(Math.random() * 5) + 1),
      moduleName: 'AI Generated',
      topic: aiTopic,
      questionText: `AI Generated Question ${i + 1} about ${aiTopic}: Explain the key concepts and provide examples.`,
      questionType: QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)],
      marks: [2, 5, 10][Math.floor(Math.random() * 3)],
      difficulty: DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)],
      status: 'Approved',
      bloomLevel: BLOOM_LEVELS[Math.floor(Math.random() * BLOOM_LEVELS.length)],
      aiGenerated: true,
      aiConfidence: 0.85 + Math.random() * 0.14,
    }))

    setQuestions(prev => [...prev, ...newQuestions])
    setAiLoading(false)
    setShowAIGenerate(false)
    setAiTopic('')
    setSuccess(`Generated ${aiCount} AI questions on "${aiTopic}"`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleGeneratePaper = () => {
    if (!selectedCourse) { setError('Please select a course'); return }
    if (selectedQuestions.length === 0) { setError('Please select at least one question'); return }
    if (!paperName) { setError('Please enter a paper name'); return }
    if (!examDate) { setError('Please select an exam date'); return }

    setGenerating(true)
    setError('')

    setTimeout(() => {
      const newPaper: PaperConfig = {
        id: `paper-${Date.now()}`,
        name: paperName,
        courseCode: selectedCourse,
        courseName: selectedCourseData?.name || '',
        branch: selectedBranch,
        batch: selectedBatch,
        division: selectedDivision,
        assessmentType,
        examDate,
        examTime,
        duration: ASSESSMENT_TYPES[assessmentType]?.duration || 60,
        maxMarks: expectedMarks,
        passMark: Math.round(expectedMarks * 0.4),
        customInstructions,
        selectedQuestionIds: [...selectedQuestions],
        status: 'generated',
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'admin',
        aiGenerated: questions.filter(q => selectedQuestions.includes(q.id)).some(q => q.aiGenerated),
      }

      setPapers(prev => [...prev, newPaper])
      setSelectedPaper(newPaper)
      setShowPreview(true)
      setGenerating(false)
      setSuccess('Paper generated successfully!')
      setTimeout(() => setSuccess(''), 3000)

      // Firebase: set(ref(db, `colleges/${user?.college}/papers/${newPaper.id}`), newPaper)
    }, 1000)
  }

  const handleSendNotification = (paperId: string, facultyIds: string[], message: string) => {
    const timestamp = new Date().toISOString()

    // Update paper status
    setPapers(prev => prev.map(p => {
      if (p.id !== paperId) return p
      return {
        ...p,
        status: 'sent' as const,
        sentToFaculty: facultyIds,
        facultyApproval: facultyIds.reduce((acc, id) => ({ ...acc, [id]: 'pending' as const }), {}),
      }
    }))

    // Create notifications for each faculty
    facultyIds.forEach(facId => {
      const notif: NotificationPayload = {
        title: 'New Question Paper Generated',
        body: message,
        type: 'paper_sent',
        paperId,
        timestamp,
        read: false,
        sender: user?.email || 'admin',
      }
      // Firebase: push(ref(db, `colleges/${user?.college}/faculty/${facId}/notifications`), notif)
    })

    setSuccess('Notification sent to faculty successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleExportPDF = () => {
    if (!selectedPaper) return
    const element = document.getElementById('paper-preview-content')
    if (!element) return

    const paperQuestions = questions.filter(q => selectedPaper.selectedQuestionIds.includes(q.id))
    const totalPaperMarks = paperQuestions.reduce((sum, q) => sum + q.marks, 0)

    // Build a clean printable HTML document
    const printableHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${selectedPaper.name}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin: 0 0 5px 0;
    }
    .header h2 {
      font-size: 14pt;
      font-weight: normal;
      margin: 0 0 10px 0;
    }
    .header .info {
      font-size: 10pt;
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .header .meta {
      font-size: 9pt;
      color: #555;
      margin-top: 8px;
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    .instructions {
      background: #fff8e1;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 10px 15px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    .instructions strong {
      color: #f57c00;
    }
    .question {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      page-break-inside: avoid;
    }
    .question:last-child {
      border-bottom: none;
    }
    .q-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .q-num {
      font-weight: bold;
      font-size: 12pt;
      color: #000;
      min-width: 30px;
    }
    .q-text {
      flex: 1;
      font-size: 12pt;
    }
    .q-meta {
      font-size: 9pt;
      color: #666;
      margin-top: 5px;
      margin-left: 40px;
    }
    .q-meta span {
      margin-right: 15px;
    }
    .ai-badge {
      display: inline-block;
      font-size: 8pt;
      background: #f3e5f5;
      color: #7b1fa2;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #000;
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>KGIS Institute of Technology</h1>
    <h2>${selectedPaper.courseName}</h2>
    <div style="font-size: 11pt; font-weight: bold; margin: 5px 0;">
      ${ASSESSMENT_TYPES[selectedPaper.assessmentType]?.label || selectedPaper.assessmentType}
    </div>
    <div class="info">
      <span>Date: ${formatDate(selectedPaper.examDate)}</span>
      <span>Time: ${selectedPaper.examTime}</span>
      <span>Duration: ${selectedPaper.duration} min</span>
      <span>Max Marks: ${selectedPaper.maxMarks}</span>
    </div>
    <div class="meta">
      <span>Batch: ${selectedPaper.batch}</span>
      <span>Branch: ${selectedPaper.branch}</span>
      <span>Division: ${selectedPaper.division}</span>
    </div>
  </div>

  ${selectedPaper.customInstructions ? `
  <div class="instructions">
    <strong>Instructions:</strong> ${selectedPaper.customInstructions}
  </div>
  ` : ''}

  <div class="questions">
    ${paperQuestions.map((q, i) => `
    <div class="question">
      <div class="q-header">
        <span class="q-num">Q${i + 1}.</span>
        <span class="q-text">${q.questionText}</span>
      </div>
      <div class="q-meta">
        <span>[${q.marks} marks]</span>
        <span>${q.questionType}</span>
        <span>${q.difficulty}</span>
        ${q.aiGenerated ? '<span class="ai-badge">AI Generated</span>' : ''}
      </div>
    </div>
    `).join('')}
  </div>

  <div class="footer">
    <span>Total Questions: ${paperQuestions.length}</span>
    <span>Total Marks: ${totalPaperMarks} / ${selectedPaper.maxMarks}</span>
  </div>
</body>
</html>
    `

    // Create a Blob and download as HTML (user can print to PDF from browser)
    const blob = new Blob([printableHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedPaper.name.replace(/\s+/g, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Also open in new tab for immediate printing to PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printableHTML)
      printWindow.document.close()
      // Auto-trigger print dialog so user can "Save as PDF"
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const handlePrint = () => {
    handleExportPDF()
  }

  const handleDeletePaper = (id: string) => {
    if (confirm('Are you sure you want to delete this paper?')) {
      setPapers(prev => prev.filter(p => p.id !== id))
      // Firebase: remove(ref(db, `colleges/${user?.college}/papers/${id}`))
    }
  }

  const handleDuplicatePaper = (paper: PaperConfig) => {
    const newPaper: PaperConfig = {
      ...paper,
      id: `paper-${Date.now()}`,
      name: `${paper.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      sentToFaculty: undefined,
      facultyApproval: undefined,
    }
    setPapers(prev => [...prev, newPaper])
    setSuccess('Paper duplicated!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const clearFilters = () => {
    setFilters({ moduleNo: '', questionType: '', difficulty: '', bloomLevel: '', topic: '' })
  }

  const hasActiveFilters = filters.moduleNo || filters.questionType || filters.difficulty || filters.bloomLevel || filters.topic

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title mb-1 flex items-center gap-3">
            <FileText className="w-7 h-7 text-teal-400" />
            Paper Generator
          </h1>
          <p className="text-vriddhi-muted">Generate question papers with AI-powered questions and notify faculty</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-vriddhi-muted border border-transparent hover:bg-white/10 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Generate
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'papers'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-vriddhi-muted border border-transparent hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            Papers ({stats.total})
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 glass-card border border-red-500/30 p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mb-4 glass-card border border-green-500/30 p-4 flex items-center gap-3 text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {activeTab === 'generate' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Total Papers" value={stats.total} icon={<FileText className="w-5 h-5 text-teal-400" />} color="teal" />
            <StatCard title="AI Questions" value={stats.aiQuestions} subtitle={`of ${stats.totalQuestions}`} icon={<Sparkles className="w-5 h-5 text-purple-400" />} color="purple" />
            <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="w-5 h-5 text-green-400" />} color="green" />
            <StatCard title="Pending" value={stats.sent} icon={<Clock className="w-5 h-5 text-amber-400" />} color="amber" />
            <StatCard title="Drafts" value={stats.draft} icon={<FileText className="w-5 h-5 text-blue-400" />} color="blue" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: Configuration & Questions */}
            <div className="xl:col-span-8 space-y-6">
              {/* Paper Configuration */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-semibold text-white">Paper Configuration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Course *</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => (
                        <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Assessment Type *</label>
                    <select
                      value={assessmentType}
                      onChange={(e) => {
                        setAssessmentType(e.target.value as typeof assessmentType)
                        if (selectedCourseData) {
                          setPaperName(`${ASSESSMENT_TYPES[e.target.value]?.label.split('(')[0].trim() || e.target.value} - ${selectedCourseData.name}`)
                        }
                      }}
                      className="input-field w-full"
                    >
                      {Object.entries(ASSESSMENT_TYPES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Paper Name *</label>
                    <input
                      type="text"
                      value={paperName}
                      onChange={(e) => setPaperName(e.target.value)}
                      className="input-field w-full"
                      placeholder="e.g., CTD 1 - Data Structures"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Branch</label>
                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="input-field w-full">
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Batch</label>
                    <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="input-field w-full">
                      {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Division</label>
                    <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} className="input-field w-full">
                      {DIVISIONS.map(d => <option key={d} value={d}>Division {d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Exam Date *</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Exam Time</label>
                    <input
                      type="time"
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Duration (min)</label>
                    <input
                      type="number"
                      value={ASSESSMENT_TYPES[assessmentType]?.duration || 60}
                      readOnly
                      className="input-field w-full bg-white/5"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-vriddhi-muted mb-1.5">Custom Instructions</label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={2}
                    className="input-field w-full resize-none"
                    placeholder="e.g., Answer any 5 out of 8 questions. All questions carry equal marks."
                  />
                </div>
              </div>

              {/* AI Generate Button */}
              {selectedCourse && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-400" />
                      Available Questions ({filteredQuestions.length})
                    </h3>
                    <span className="text-xs text-vriddhi-muted">
                      Selected: {selectedQuestions.length} questions ({totalSelectedMarks}/{expectedMarks} marks)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAIGenerate(true)}
                    className="btn-secondary text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Generate
                  </button>
                </div>
              )}

              {/* Filters */}
              {selectedCourse && (
                <div className="glass-card p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={filters.moduleNo}
                      onChange={(e) => setFilters({ ...filters, moduleNo: e.target.value })}
                      className="input-field min-w-[130px]"
                    >
                      <option value="">All Modules</option>
                      {[...new Set(questions.filter(q => q.courseCode === selectedCourse).map(q => q.moduleNo))].map(m => (
                        <option key={m} value={m}>Module {m}</option>
                      ))}
                    </select>
                    <select
                      value={filters.questionType}
                      onChange={(e) => setFilters({ ...filters, questionType: e.target.value })}
                      className="input-field min-w-[130px]"
                    >
                      <option value="">All Types</option>
                      {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                      className="input-field min-w-[130px]"
                    >
                      <option value="">All Difficulty</option>
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                      value={filters.bloomLevel}
                      onChange={(e) => setFilters({ ...filters, bloomLevel: e.target.value })}
                      className="input-field min-w-[130px]"
                    >
                      <option value="">All Bloom Levels</option>
                      {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Filter by topic..."
                      value={filters.topic}
                      onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                      className="input-field min-w-[150px]"
                    />
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="btn-secondary text-xs px-3">
                        <RotateCcw className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                    <button
                      onClick={selectAll}
                      className="btn-secondary text-xs px-3 ml-auto"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select All
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {selectedCourse && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <BookOpen className="w-10 h-10 text-vriddhi-muted/30 mx-auto mb-3" />
                      <p className="text-vriddhi-muted">No approved questions found for this course.</p>
                      <button onClick={() => setShowAIGenerate(true)} className="text-teal-400 hover:text-teal-300 text-sm underline mt-2">
                        Generate AI questions
                      </button>
                    </div>
                  ) : (
                    filteredQuestions.map((q, i) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        selected={selectedQuestions.includes(q.id)}
                        onToggle={toggleQuestion}
                        index={i}
                      />
                    ))
                  )}
                </div>
              )}

              {!selectedCourse && (
                <div className="glass-card p-12 text-center">
                  <BookOpen className="w-12 h-12 text-vriddhi-muted/30 mx-auto mb-4" />
                  <p className="text-lg text-white font-medium mb-2">Select a course to start</p>
                  <p className="text-sm text-vriddhi-muted">Choose a course from the dropdown above to view available questions.</p>
                </div>
              )}
            </div>

            {/* Right: Summary & Actions */}
            <div className="xl:col-span-4 space-y-6">
              {/* Paper Summary */}
              <div className="glass-card p-5 sticky top-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  Paper Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Course</span>
                    <span className="font-medium text-white">{selectedCourseData?.name || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Assessment</span>
                    <span className="font-medium text-white">{ASSESSMENT_TYPES[assessmentType]?.label || assessmentType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Branch</span>
                    <span className="font-medium text-white">{selectedBranch || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Batch</span>
                    <span className="font-medium text-white">{selectedBatch || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Division</span>
                    <span className="font-medium text-white">{selectedDivision || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Questions</span>
                    <span className="font-medium text-white">{selectedQuestions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vriddhi-muted">Total Marks</span>
                    <span className={`font-medium ${marksMatch ? 'text-green-400' : 'text-amber-400'}`}>
                      {totalSelectedMarks} / {expectedMarks}
                    </span>
                  </div>
                  {!marksMatch && (
                    <div className={`text-xs rounded-lg p-2 ${marksDiff > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {marksDiff > 0
                        ? `Need ${marksDiff} more marks to reach ${expectedMarks}`
                        : `Exceeds by ${Math.abs(marksDiff)} marks. Expected ${expectedMarks}.`}
                    </div>
                  )}
                  {selectedQuestions.length > 0 && questions.filter(q => selectedQuestions.includes(q.id)).some(q => q.aiGenerated) && (
                    <div className="text-xs rounded-lg p-2 bg-purple-500/10 text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Contains AI-generated questions
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleGeneratePaper}
                    disabled={generating || selectedQuestions.length === 0 || !marksMatch}
                    className="w-full btn-primary justify-center disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {generating ? 'Generating...' : 'Generate Paper'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedQuestions([])
                      setCustomInstructions('')
                      setPaperName('')
                      setExamDate('')
                    }}
                    className="w-full btn-secondary justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Question Distribution */}
              {selectedCourse && questionDistribution.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Question Types</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={questionDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="type" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                      <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bloom's Distribution */}
              {selectedCourse && bloomDistribution.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Bloom's Taxonomy</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={bloomDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {bloomDistribution.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                      <Legend fontSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* How to */}
              <div className="glass-card p-5 border border-teal-500/20">
                <h4 className="font-medium text-teal-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  How to Generate
                </h4>
                <ol className="text-sm text-vriddhi-muted space-y-2 list-decimal list-inside">
                  <li>Select a course, batch, branch &amp; division</li>
                  <li>Choose assessment type (C1/C2/C3/Mid/End)</li>
                  <li>Select approved questions or generate AI ones</li>
                  <li>Ensure total marks match expected</li>
                  <li>Click "Generate Paper" to preview</li>
                  <li>Send to faculty for review &amp; approval</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      ) : (

        // Papers Tab
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Total Papers" value={stats.total} icon={<FileText className="w-5 h-5 text-teal-400" />} color="teal" />
            <StatCard title="Draft" value={stats.draft} icon={<FileText className="w-5 h-5 text-blue-400" />} color="blue" />
            <StatCard title="Generated" value={stats.generated} icon={<Zap className="w-5 h-5 text-purple-400" />} color="purple" />
            <StatCard title="Sent to Faculty" value={stats.sent} icon={<Send className="w-5 h-5 text-amber-400" />} color="amber" />
            <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="w-5 h-5 text-green-400" />} color="green" />
          </div>

          {/* Filters */}
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vriddhi-muted" />
                <input
                  type="text"
                  placeholder="Search papers by name, course, branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-12 w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'draft', 'generated', 'sent', 'approved'] as const).map(status => {
                  const counts = { all: stats.total, draft: stats.draft, generated: stats.generated, sent: stats.sent, approved: stats.approved }
                  return (
                    <button
                      key={status}
                      onClick={() => setPaperFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        paperFilter === status
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'bg-white/5 text-vriddhi-muted border border-transparent hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                      <span className="ml-1 opacity-60">({counts[status]})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Papers Table */}
          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vriddhi-border">
                    <th className="table-header text-left">Paper</th>
                    <th className="table-header text-left">Batch & Branch</th>
                    <th className="table-header text-left">Exam Date</th>
                    <th className="table-header text-center">Questions</th>
                    <th className="table-header text-center">Marks</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPapers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-cell text-center text-vriddhi-muted py-16">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-10 h-10 text-vriddhi-muted/30" />
                          <p>No papers found.</p>
                          <button onClick={() => setActiveTab('generate')} className="text-teal-400 hover:text-teal-300 text-sm underline">
                            Generate a new paper
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPapers.map((paper) => {
                      const daysUntil = getDaysUntil(paper.examDate)
                      const paperQuestions = questions.filter(q => paper.selectedQuestionIds.includes(q.id))
                      const totalPaperMarks = paperQuestions.reduce((sum, q) => sum + q.marks, 0)

                      return (
                        <tr key={paper.id} className="hover:bg-white/5 transition-colors border-b border-vriddhi-border/50 group">
                          <td className="table-cell">
                            <div>
                              <p className="font-medium text-white">{paper.name}</p>
                              <p className="text-xs text-vriddhi-muted">{paper.courseName} ({paper.courseCode})</p>
                              {paper.aiGenerated && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 mt-1">
                                  <Sparkles className="w-3 h-3" />
                                  AI Enhanced
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                <GraduationCap className="w-3 h-3" />
                                {paper.batch}
                              </span>
                              <div className="text-xs text-vriddhi-muted">
                                {paper.branch} • Div {paper.division}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className="text-sm text-white">{formatDate(paper.examDate)}</p>
                              <p className="text-xs text-vriddhi-muted">{paper.examTime} • {paper.duration}min</p>
                              {paper.status === 'generated' && daysUntil > 0 && (
                                <span className={`text-xs font-medium ${daysUntil <= 3 ? 'text-amber-400' : 'text-blue-400'}`}>
                                  {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days left`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell text-center text-white">{paper.selectedQuestionIds.length}</td>
                          <td className="table-cell text-center">
                            <span className={`font-medium ${totalPaperMarks === paper.maxMarks ? 'text-green-400' : 'text-amber-400'}`}>
                              {totalPaperMarks}/{paper.maxMarks}
                            </span>
                          </td>
                          <td className="table-cell text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              paper.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              paper.status === 'sent' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              paper.status === 'generated' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                              'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}>
                              {paper.status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
                              {paper.status === 'sent' && <Send className="w-3.5 h-3.5" />}
                              {paper.status === 'generated' && <Zap className="w-3.5 h-3.5" />}
                              {paper.status === 'draft' && <FileText className="w-3.5 h-3.5" />}
                              {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setSelectedPaper(paper); setShowPreview(true) }}
                                className="p-2 rounded-lg hover:bg-teal-500/10 text-vriddhi-muted hover:text-teal-400 transition-colors"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(paper.status === 'generated' || paper.status === 'draft') && (
                                <button
                                  onClick={() => { setSelectedPaper(paper); setShowNotificationModal(true) }}
                                  className="p-2 rounded-lg hover:bg-blue-500/10 text-vriddhi-muted hover:text-blue-400 transition-colors"
                                  title="Send to Faculty"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDuplicatePaper(paper)}
                                className="p-2 rounded-lg hover:bg-teal-500/10 text-vriddhi-muted hover:text-teal-400 transition-colors"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePaper(paper.id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-vriddhi-muted hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          AI GENERATE MODAL
          ════════════════════════════════════════════════════ */}
      {showAIGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Question Generator</h3>
                  <p className="text-sm text-vriddhi-muted">Generate questions using AI</p>
                </div>
              </div>
              <button onClick={() => setShowAIGenerate(false)} className="p-2 rounded-lg hover:bg-vriddhi-border/50 transition-colors">
                <X className="w-5 h-5 text-vriddhi-muted" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-vriddhi-muted mb-2">Topic / Subject Area *</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., Operating Systems, Database Normalization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vriddhi-muted mb-2">Number of Questions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiCount}
                  onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                  className="input-field w-full"
                />
              </div>
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <p className="text-xs text-purple-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI will generate questions with varying difficulty, Bloom's levels, and question types.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAIGenerate(false)} className="flex-1 btn-secondary justify-center">Cancel</button>
                <button
                  onClick={handleAIGenerate}
                  disabled={!aiTopic || aiLoading}
                  className="flex-1 btn-primary justify-center disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paper Preview Modal */}
      <PaperPreviewModal
        paper={selectedPaper}
        questions={questions}
        onClose={() => { setShowPreview(false); setSelectedPaper(null) }}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
      />

      {/* Faculty Notification Modal */}
      <FacultyNotificationModal
        paper={selectedPaper}
        faculty={faculty}
        onClose={() => { setShowNotificationModal(false); setSelectedPaper(null) }}
        onSend={handleSendNotification}
      />
    </div>
  )
}
