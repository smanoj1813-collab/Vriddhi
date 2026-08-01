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
} from '@mui/material'
import {
  Add as AddIcon,
  AutoAwesome as AIIcon,
  LibraryBooks as BankIcon,
  Article as PaperIcon,
  SmartToy as AgentIcon,
} from '@mui/icons-material'
import { useQuestionBank } from '../../hooks/useQuestionBank'
import { usePaperGenerator } from '../../hooks/usePaperGenerator'
import QuestionForm from './QuestionForm'
import QuestionPreview from './QuestionPreview'
import PaperGenerator from './PaperGenerator'
import AIQuestionGenerator from './AIQuestionGenerator'
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s, i) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color={`${s.color}.main`}>
                  {s.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  // ─── Question List ────────────────────────────────────
  const renderQuestionList = () => (
    <Box>
      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filters</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={filters.subject || 'All Subjects'}
            onClick={() => {
              /* TODO: Add subject filter dropdown */
            }}
            variant={filters.subject ? 'filled' : 'outlined'}
          />
          <Chip
            label={filters.type || 'All Types'}
            onClick={() => {
              /* TODO: Add type filter dropdown */
            }}
            variant={filters.type ? 'filled' : 'outlined'}
          />
          <Chip
            label={filters.difficulty || 'All Difficulties'}
            onClick={() => {
              /* TODO: Add difficulty filter dropdown */
            }}
            variant={filters.difficulty ? 'filled' : 'outlined'}
          />
          {(filters.subject || filters.type || filters.difficulty) && (
            <Chip label="Clear All" onClick={clearFilters} color="error" size="small" />
          )}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Questions */}
      {questions.map(q => (
        <Paper key={q.id} variant="outlined" sx={{ p: 2, mb: 1, cursor: 'pointer' }} onClick={() => setPreviewQuestion(q)}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {q.text.substring(0, 100)}{q.text.length > 100 ? '...' : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={q.subject} size="small" variant="outlined" />
                <Chip label={q.type.toUpperCase()} size="small" color="primary" />
                <Chip
                  label={q.difficulty}
                  size="small"
                  color={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'error'}
                />
                {q.isPYQ && <Chip label="PYQ" size="small" color="secondary" />}
                <Chip label={`${q.marks || '?'} marks`} size="small" variant="outlined" />
                {q.linkedPaperIds && q.linkedPaperIds.length > 0 && (
                  <Chip label={`${q.linkedPaperIds.length} paper(s)`} size="small" color="info" />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button size="small" onClick={e => { e.stopPropagation(); handleEdit(q) }}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={e => { e.stopPropagation(); handleDelete(q.id) }}>
                Delete
              </Button>
            </Box>
          </Box>
        </Paper>
      ))}

      {loading && <LinearProgress sx={{ mt: 2 }} />}

      {hasMore && !loading && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button onClick={loadMore} variant="outlined" size="small">
            Load More
          </Button>
        </Box>
      )}

      {questions.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BankIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">No questions found. Add your first question!</Typography>
        </Paper>
      )}
    </Box>
  )

  // ─── Papers List ──────────────────────────────────────
  const renderPapersList = () => (
    <Box>
      {papers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PaperIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">No papers generated yet.</Typography>
        </Paper>
      ) : (
        papers.map(p => (
          <Paper key={p.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{p.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.subject} | {p.examType} | {p.totalQuestions} questions | {p.totalMarks} marks
                </Typography>
              </Box>
              <Chip
                label={p.status}
                color={p.status === 'published' ? 'success' : p.status === 'draft' ? 'warning' : 'default'}
                size="small"
              />
            </Box>
          </Paper>
        ))
      )}
    </Box>
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BankIcon />
        Question Bank
      </Typography>

      {renderStats()}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Questions" icon={<BankIcon />} iconPosition="start" />
          <Tab label="Papers" icon={<PaperIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {renderQuestionList()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderPapersList()}
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

      {/* Paper Generator Dialog */}
      <Dialog open={showGenerator} onClose={() => setShowGenerator(false)} maxWidth="lg" fullWidth>
        <DialogContent>
          <PaperGenerator
            batches={batches}
            branches={branches}
            subjects={subjects}
            onPaperCreated={(paperId) => {
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
            onQuestionsSaved={(questions) => {
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