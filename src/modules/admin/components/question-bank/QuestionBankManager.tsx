// src/components/question-bank/QuestionBankManager.tsx
// ─── Question Bank Manager (Main Page Component) ────────

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  AutoAwesome as AIIcon,
  LibraryBooks as BankIcon,
  Article as PaperIcon,
  SmartToy as AgentIcon,
  CloudUpload as ImportIcon,
  PictureAsPdf as PdfIcon,
  Link as LinkIcon,
  TableRows as TableIcon,
} from '@mui/icons-material'
import { useQuestionBank } from '../../hooks/useQuestionBank'
import { usePaperGenerator } from '../../hooks/usePaperGenerator'
import QuestionForm from './QuestionForm'
import QuestionPreview from './QuestionPreview'
import PaperGenerator from './PaperGenerator'
import AIQuestionGenerator from './AIQuestionGenerator'
import BulkImportModal from './BulkImportModal'
import FacultyBulkImport from './FacultyBulkImport'
import FacultyPaperLinker from './FacultyPaperLinker'
import FacultyQuestionForm from './FacultyQuestionForm'
import PaperLinkageModal from './PaperLinkageModal'
import QuestionPDFExport from './QuestionPDFExport'
import FacultyBankAdmin from './FacultyBankAdmin'
import * as questionBankService from '../../services/questionBankAPI'
import type { Question } from '../../types/questionBank'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

interface QuestionBankManagerProps {
  batches: string[]
  branches: string[]
  subjects: string[]
}

const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  batches,
  branches,
  subjects,
}) => {
  const [tabValue, setTabValue] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showPdfExport, setShowPdfExport] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedQuestionForLink, setSelectedQuestionForLink] = useState<Question | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)

  const {
    questions,
    loading,
    error,
    hasMore,
    stats,
    filters,
    setFilter,
    clearFilters,
    refresh,
    loadMore,
    addQuestion,
    editQuestion,
    removeQuestion,
    importQuestions,
  } = useQuestionBank()

  const { papers, loadPapers } = usePaperGenerator()

  // ─── Handlers ─────────────────────────────────────────
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    if (newValue === 1) loadPapers()
  }

  const handleSubmitQuestion = async (data: any) => {
    try {
      if (editingQuestion) {
        await editQuestion(editingQuestion.id, data)
      } else {
        await addQuestion(data)
      }
      setShowForm(false)
      setEditingQuestion(null)
    } catch (err) {
      console.error('Failed to save question:', err)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setShowForm(true)
  }

  const handleDelete = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await removeQuestion(questionId)
    }
  }

  // ─── Stats Cards ──────────────────────────────────────
  const renderStats = () => {
    if (!stats) return <LinearProgress />

    const statCards = [
      { label: 'Total Questions', value: stats.total || 0, color: 'primary' as const },
      { label: 'Subjects', value: Object.keys(stats.bySubject || {}).length, color: 'info' as const },
      { label: 'PYQs', value: stats.pyqCount || 0, color: 'secondary' as const },
      { label: 'MCQs', value: stats.byType?.mcq || 0, color: 'success' as const },
      { label: 'Short', value: stats.byType?.short || 0, color: 'warning' as const },
      { label: 'Long', value: stats.byType?.long || 0, color: 'error' as const },
    ]

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2, mb: 3 }}>
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" color={`${s.color}.main`}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    )
  }

  // ─── Question List ────────────────────────────────────
  const renderQuestionList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setShowBulkImport(true)}
          >
            Bulk Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={() => setShowPdfExport(true)}
          >
            Export PDF
          </Button>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditingQuestion(null); setShowForm(true) }}
        >
          Add Question
        </Button>
      </Box>

      {/* Questions list cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {questions.map((q) => (
          <Paper key={q.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ flex: 1, pr: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip label={q.subject} size="small" color="primary" variant="outlined" />
                <Chip label={q.topic} size="small" variant="outlined" />
                <Chip label={q.difficulty} size="small" color={q.difficulty === 'hard' ? 'error' : q.difficulty === 'medium' ? 'warning' : 'success'} />
                <Chip label={`${q.marks} Marks`} size="small" />
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {q.text}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => setPreviewQuestion(q)}>
                Preview
              </Button>
              <Button size="small" onClick={() => { setSelectedQuestionForLink(q); setShowLinkModal(true) }}>
                Link Paper
              </Button>
              <Button size="small" onClick={() => handleEdit(q)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => handleDelete(q.id)}>
                Delete
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button onClick={() => loadMore()}>Load More</Button>
        </Box>
      )}
    </Box>
  )

  // ─── Papers List ──────────────────────────────────────
  const renderPapersList = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowGenerator(true)}
        >
          Generate New Paper
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {papers.map((p) => (
          <Paper key={p.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{p.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {p.subject} • {p.totalMarks} Marks • {p.duration} Mins
              </Typography>
            </Box>
            <Chip label={p.status || 'Draft'} color={p.status === 'published' ? 'success' : 'default'} />
          </Paper>
        ))}
      </Box>
    </Box>
  )

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Question Bank & Exam Management
      </Typography>

      {renderStats()}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Questions" icon={<BankIcon />} iconPosition="start" />
          <Tab label="Papers" icon={<PaperIcon />} iconPosition="start" />
          <Tab label="Table View" icon={<TableIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {renderQuestionList()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderPapersList()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <FacultyBankAdmin />
      </TabPanel>

      {/* Add Question FAB */}
      <Tooltip title="Add Question">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => { setEditingQuestion(null); setShowForm(true) }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* AI Generate FAB */}
      <Tooltip title="AI Generate Questions">
        <Fab
          color="secondary"
          sx={{ position: 'fixed', bottom: 24, right: 96 }}
          onClick={() => setShowAIGenerator(true)}
        >
          <AgentIcon />
        </Fab>
      </Tooltip>

      {/* Generate Paper FAB */}
      <Tooltip title="Generate Paper">
        <Fab
          color="info"
          sx={{ position: 'fixed', bottom: 24, right: 168 }}
          onClick={() => setShowGenerator(true)}
        >
          <AIIcon />
        </Fab>
      </Tooltip>

      {/* Question Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent>
          <QuestionForm
            initialData={editingQuestion || undefined}
            subjects={subjects}
            onSubmit={handleSubmitQuestion}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal Dialog */}
      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={(imported) => {
          setShowBulkImport(false)
          refresh()
        }}
        batches={batches}
        branches={branches}
      />

      {/* PDF Export Dialog */}
      <QuestionPDFExport
        questions={questions}
        title={subjects[0] || 'Question Bank'}
      />

      {/* Paper Linkage Modal */}
      {selectedQuestionForLink && (
        <PaperLinkageModal
          open={showLinkModal}
          onClose={() => { setShowLinkModal(false); setSelectedQuestionForLink(null) }}
          question={selectedQuestionForLink}
          onLink={async (qid, pid) => {
            await questionBankService.linkQuestionToPaper(qid, pid)
            refresh()
          }}
          onUnlink={async (qid, pid) => {
            await questionBankService.unlinkQuestionFromPaper(qid, pid)
            refresh()
          }}
        />
      )}

      {/* Paper Generator Dialog */}
      <Dialog open={showGenerator} onClose={() => setShowGenerator(false)} maxWidth="lg" fullWidth>
        <DialogContent>
          <PaperGenerator
            batches={batches}
            branches={branches}
            subjects={subjects}
            onPaperCreated={() => {
              setShowGenerator(false)
              setTabValue(1)
              loadPapers()
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerator(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Question Generator Dialog */}
      <Dialog open={showAIGenerator} onClose={() => setShowAIGenerator(false)} maxWidth="lg" fullWidth>
        <DialogContent>
          <AIQuestionGenerator
            subjects={subjects}
            onQuestionsSaved={() => {
              setShowAIGenerator(false)
              refresh()
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIGenerator(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Question Preview Dialog */}
      <Dialog open={!!previewQuestion} onClose={() => setPreviewQuestion(null)} maxWidth="md" fullWidth>
        <DialogTitle>Question Preview</DialogTitle>
        <DialogContent>
          {previewQuestion && <QuestionPreview question={previewQuestion} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewQuestion(null)}>Close</Button>
          <Button onClick={() => { previewQuestion && handleEdit(previewQuestion); setPreviewQuestion(null) }}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default QuestionBankManager
