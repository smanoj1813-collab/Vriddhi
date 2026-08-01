import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useAuth } from '../../auth/context/AuthContext';
import type { Question, QuestionType, DifficultyLevel } from '../../admin/types/questionBank';

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'matching', label: 'Match the Following' },
  { value: 'assertion_reason', label: 'Assertion & Reason' },
  { value: 'case_based', label: 'Case Based' },
  { value: 'short', label: 'Short' },
  { value: 'long', label: 'Long' },
  { value: 'numerical', label: 'Numerical Answer (NAT)' },
];

const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; color: 'success' | 'warning' | 'error' }[] = [
  { value: 'easy', label: 'Easy', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'hard', label: 'Hard', color: 'error' },
];

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const QuestionBank: React.FC = () => {
  const { user } = useAuth();
  const {
    questions,
    total,
    loading,
    error,
    stats,
    hasMore,
    filters,
    fetchQuestions,
    fetchStats,
    addQuestion,
    editQuestion,
    removeQuestion,
    search,
    toggleStatus,
    refresh,
    loadMore,
    setFilter,
    clearFilters,
  } = useQuestionBank();

  // ─── Local UI State ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<Question>>({
    text: '',
    type: 'mcq',
    difficulty: 'medium',
    subject: '',
    chapter: '',
    topic: '',
    marks: 1,
    negativeMarks: 0,
    options: [],
    correctAnswer: '',
    explanation: '',
    tags: [],
    unit: '',
    batch: '',
    branch: '',
    status: 'active',
    isPYQ: false,
  });

  // ─── Effects ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchQuestions();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPage(0);
      if (searchQuery.trim()) {
        search(searchQuery.trim());
      } else {
        refresh();
      }
    },
    [searchQuery, search, refresh]
  );

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormData({
      text: '',
      type: 'mcq',
      difficulty: 'medium',
      subject: '',
      chapter: '',
      topic: '',
      marks: 1,
      negativeMarks: 0,
      options: [],
      correctAnswer: '',
      explanation: '',
      tags: [],
      unit: '',
      batch: '',
      branch: '',
      status: 'active',
      isPYQ: false,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({ ...question });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.text?.trim()) {
        setSnackbar({ open: true, message: 'Question text is required', severity: 'error' });
        return;
      }
      if (!formData.subject?.trim()) {
        setSnackbar({ open: true, message: 'Subject is required', severity: 'error' });
        return;
      }
      if (!formData.type) {
        setSnackbar({ open: true, message: 'Question type is required', severity: 'error' });
        return;
      }

      if (editingQuestion) {
        await editQuestion(editingQuestion.id, formData);
        setSnackbar({ open: true, message: 'Question updated successfully', severity: 'success' });
      } else {
        await addQuestion(formData as any);
        setSnackbar({ open: true, message: 'Question added successfully', severity: 'success' });
      }
      handleCloseDialog();
      refresh();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to save question', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeQuestion(id);
      setSnackbar({ open: true, message: 'Question deleted successfully', severity: 'success' });
      setDeleteConfirmId(null);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete question', severity: 'error' });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id);
      setSnackbar({ open: true, message: 'Status updated', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to toggle status', severity: 'error' });
    }
  };

  const handleCopyQuestion = (question: Question) => {
    const copied = { ...question };
    delete (copied as any).id;
    delete (copied as any).createdAt;
    delete (copied as any).updatedAt;
    setFormData(copied);
    setEditingQuestion(null);
    setDialogOpen(true);
    setSnackbar({ open: true, message: 'Question copied to new entry', severity: 'info' });
  };

  // ─── Option management for MCQ ─────────────────────────────
  const addOption = () => {
    const newOption = {
      id: String.fromCharCode(65 + (formData.options?.length || 0)),
      text: '',
      isCorrect: false,
    };
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption],
    }));
  };

  const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updated = [...(formData.options || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, options: updated }));
  };

  const removeOption = (index: number) => {
    const updated = [...(formData.options || [])];
    updated.splice(index, 1);
    const relettered = updated.map((opt, i) => ({ ...opt, id: String.fromCharCode(65 + i) }));
    setFormData((prev) => ({ ...prev, options: relettered }));
  };

  // ─── Tag management ──────────────────────────────────────────────
  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags?.filter((t) => t !== tag) || [] }));
  };

  // ─── Render ──────────────────────────────────────────────────────
  const displayedQuestions = questions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Question Bank
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" href="/faculty/ai-generator">
            AI Generator
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add Question
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{stats?.totalQuestions ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Questions</Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{stats?.pyqCount ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary">PYQs</Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{stats?.linkedCount ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary">Linked to Papers</Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">{stats?.unusedCount ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary">Unused</Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="All Questions" />
        <Tab label="MCQ" />
        <Tab label="True/False" />
        <Tab label="Fill in Blank" />
        <Tab label="Short Answer" />
        <Tab label="PYQs" />
      </Tabs>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 200 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: '0 1 150px', minWidth: 120 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filters.subject || ''}
                  onChange={(e) => setFilter('subject', e.target.value || undefined)}
                  label="Subject"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Mathematics">Mathematics</MenuItem>
                  <MenuItem value="Physics">Physics</MenuItem>
                  <MenuItem value="Chemistry">Chemistry</MenuItem>
                  <MenuItem value="Computer Science">Computer Science</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '0 1 150px', minWidth: 120 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filters.difficulty || ''}
                  onChange={(e) => setFilter('difficulty', e.target.value || undefined)}
                  label="Difficulty"
                >
                  <MenuItem value="">All</MenuItem>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '0 1 150px', minWidth: 120 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => setFilter('status', e.target.value || undefined)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flex: '0 0 auto' }}>
              <Button variant="outlined" size="small" onClick={() => { clearFilters(); setSearchQuery(''); refresh(); }}>
                Clear
              </Button>
              <Button variant="contained" size="small" type="submit">
                Search
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={refresh}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* Questions Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Question</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : displayedQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="h6" color="text.secondary">No questions found</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ mt: 2 }}>
                      Add First Question
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayedQuestions.map((q, index) => (
                  <TableRow key={q.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.text || 'No text'}
                      </Typography>
                      {(q.tags?.length ?? 0) > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {(q.tags || []).slice(0, 3).map((tag) => (
                            <Chip key={tag} size="small" label={tag} sx={{ mr: 0.5, fontSize: '0.7rem' }} />
                          ))}
                          {(q.tags?.length ?? 0) > 3 && (
                            <Chip size="small" label={`+${(q.tags?.length ?? 0) - 3}`} sx={{ fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={q.difficulty}
                        color={DIFFICULTY_COLORS[q.difficulty] || 'default'}
                      />
                    </TableCell>
                    <TableCell>{q.marks}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={q.status === 'active' ? 'Active' : 'Inactive'}
                        color={q.status === 'active' ? 'success' : 'default'}
                        onClick={() => handleToggleStatus(q.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(q)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <IconButton size="small" onClick={() => handleCopyQuestion(q)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(q.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
          <IconButton onClick={handleCloseDialog}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            {/* Question Text */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Question Text *"
              value={formData.text || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="Enter the question text..."
            />

            {/* Type & Difficulty */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 250px' }}>
                <FormControl fullWidth>
                  <InputLabel>Question Type *</InputLabel>
                  <Select
                    value={formData.type || 'mcq'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as QuestionType }))}
                    label="Question Type *"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 250px' }}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty *</InputLabel>
                  <Select
                    value={formData.difficulty || 'medium'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as DifficultyLevel }))}
                    label="Difficulty *"
                  >
                    {DIFFICULTY_LEVELS.map((d) => (
                      <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Subject, Chapter, Topic */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Subject *"
                  value={formData.subject || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Chapter"
                  value={formData.chapter || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, chapter: e.target.value }))}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Topic"
                  value={formData.topic || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                />
              </Box>
            </Box>

            {/* Marks & Negative Marks */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 250px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Marks"
                  value={formData.marks || 1}
                  onChange={(e) => setFormData((prev) => ({ ...prev, marks: parseFloat(e.target.value) || 0 }))}
                  slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                />
              </Box>
              <Box sx={{ flex: '1 1 250px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Negative Marks"
                  value={formData.negativeMarks || 0}
                  onChange={(e) => setFormData((prev) => ({ ...prev, negativeMarks: parseFloat(e.target.value) || 0 }))}
                  slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
                />
              </Box>
            </Box>

            {/* Unit, Batch, Branch */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Batch"
                  value={formData.batch || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, batch: e.target.value }))}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <TextField
                  fullWidth
                  label="Branch"
                  value={formData.branch || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
                />
              </Box>
            </Box>

            {/* Options (for MCQ only) */}
            {formData.type === 'mcq' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Options</Typography>
                <Stack spacing={1}>
                  {(formData.options || []).map((opt, idx) => (
                    <Box key={opt.id || idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={opt.id || String.fromCharCode(65 + idx)} size="small" />
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={`Option ${opt.id || String.fromCharCode(65 + idx)}`}
                        value={opt.text}
                        onChange={(e) => updateOption(idx, 'text', e.target.value)}
                      />
                      <Chip
                        size="small"
                        label={opt.isCorrect ? 'Correct' : 'Incorrect'}
                        color={opt.isCorrect ? 'success' : 'default'}
                        onClick={() => updateOption(idx, 'isCorrect', !opt.isCorrect)}
                        sx={{ cursor: 'pointer', minWidth: 80 }}
                      />
                      <IconButton size="small" color="error" onClick={() => removeOption(idx)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addOption}>
                    Add Option
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Correct Answer */}
            <TextField
              fullWidth
              label="Correct Answer"
              value={formData.correctAnswer || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))}
              placeholder={formData.type === 'mcq' ? 'e.g., A' : formData.type === 'true_false' ? 'true or false' : 'Enter correct answer'}
              helperText={formData.type === 'mcq' ? 'Enter the option letter (A, B, C, D...)' : 'Enter the correct answer'}
            />

            {/* Explanation */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Explanation"
              value={formData.explanation || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))}
              placeholder="Optional explanation for the correct answer..."
            />

            {/* Tags */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {(formData.tags || []).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button variant="outlined" size="small" onClick={addTag}>Add</Button>
              </Box>
            </Box>

            {/* PYQ Toggle */}
            <FormControl fullWidth size="small">
              <InputLabel>Is Previous Year Question?</InputLabel>
              <Select
                value={formData.isPYQ ? 'yes' : 'no'}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPYQ: e.target.value === 'yes' }))}
                label="Is Previous Year Question?"
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>
            {editingQuestion ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this question? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuestionBank;