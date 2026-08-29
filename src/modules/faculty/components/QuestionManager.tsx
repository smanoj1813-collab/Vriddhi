// src/modules/faculty/components/QuestionManager.tsx
// FIXED: useQuestion added to useAssessment, refetch -> refresh, searchQuery -> search

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Paper, FormControlLabel, Checkbox, Radio,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon,
  CheckCircle as ApproveIcon, Cancel as RejectIcon, Search as SearchIcon,
} from '@mui/icons-material';
import { useQuestions, useQuestion } from '../../../hooks/useAssessment';
import { useAuth } from '../../../hooks/useAuth';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../Firebase/config';
import {
  CreateQuestionInput, QuestionType, QuestionDifficulty, QuestionStatus, AssessmentQuestion,
} from '../../../types/assessment';

const createQuestionApi = async (
  collegeId: string,
  input: CreateQuestionInput
): Promise<AssessmentQuestion> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sign in before creating a question.');
  const data = {
    ...input,
    collegeId,
    questionText: input.content,
    questionType: input.type,
    text: input.content,
    status: 'pending',
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const created = await addDoc(collection(db, 'questions'), data);
  return { id: created.id, ...data, marks: Number(input.marks) || 1 } as unknown as AssessmentQuestion;
};

const updateQuestionApi = async (
  collegeId: string,
  questionId: string,
  data: Partial<AssessmentQuestion>
): Promise<AssessmentQuestion> => {
  if (!questionId || !collegeId) throw new Error('Question and college context are required.');
  await updateDoc(doc(db, 'questions', questionId), {
    ...data,
    ...(data.questionText ? { text: data.questionText, content: data.questionText } : {}),
    collegeId,
    updatedAt: serverTimestamp(),
  });
  return { id: questionId, ...data, marks: Number(data.marks) || 1 } as AssessmentQuestion;
};

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'Single Choice MCQ' },
  { value: 'MSQ', label: 'Multiple Choice MCQ' },
  { value: 'TrueFalse', label: 'True / False' },
  { value: 'FillInTheBlanks', label: 'Fill in the Blank' },
  { value: 'ShortAnswer', label: 'Short Answer' },
  { value: 'LongAnswer', label: 'Long Answer' },
  { value: 'Matching', label: 'Match the Following' },
  { value: 'AssertionReason', label: 'Assertion & Reason' },
  { value: 'NAT', label: 'Numerical Answer Type' },
];

const DIFFICULTIES: { value: QuestionDifficulty; label: string; color: 'success' | 'warning' | 'error' }[] = [
  { value: 'easy', label: 'Easy', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'hard', label: 'Hard', color: 'error' },
];

interface QuestionManagerProps {
  collegeId: string;
  subjectId?: string;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({ collegeId, subjectId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<QuestionStatus | ''>('');
  const [filterType, setFilterType] = useState<QuestionType | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState<QuestionDifficulty | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.role === 'superadmin';

  // FIXED: refetch -> refresh, searchQuery -> search
  const { questions, loading, error, refresh } = useQuestions(collegeId, {
    subjectId,
    status: filterStatus || undefined,
    type: filterType || undefined,
    search: searchQuery || undefined,
  });

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Question could not be deleted.');
    }
  };

  const setReviewStatus = async (questionId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        status,
        reviewedBy: user?.uid || '',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : `Question could not be ${status}.`);
    }
  };

  const handleApprove = (questionId: string) => setReviewStatus(questionId, 'approved');
  const handleReject = (questionId: string) => setReviewStatus(questionId, 'rejected');

  const filteredQuestions = ((questions as any[]) || []).filter((q: any) => {
    if (filterStatus && q.status !== filterStatus) return false;
    if (filterType && q.questionType !== filterType) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.questionText?.toLowerCase().includes(query) ||
        q.topic?.toLowerCase().includes(query) ||
        q.tags?.some((t: string) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const paginatedQuestions = filteredQuestions.slice((page - 1) * 10, page * 10);
  const totalPages = Math.ceil(filteredQuestions.length / 10);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Question Bank</Typography>
          <Typography variant="body2" color="text.secondary">Manage assessment questions</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>
          Create Question
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <TextField size="small" placeholder="Search questions..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} sx={{ minWidth: 250 }}
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> } }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value as QuestionStatus)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value as QuestionType)}>
              <MenuItem value="">All</MenuItem>
              {QUESTION_TYPES.map((t) => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select value={filterDifficulty} label="Difficulty" onChange={(e) => setFilterDifficulty(e.target.value as QuestionDifficulty)}>
              <MenuItem value="">All</MenuItem>
              {DIFFICULTIES.map((d) => (<MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedQuestions.map((question: any) => (
              <TableRow key={question.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 400 }} noWrap>{question.questionText}</Typography>
                  {question.topic && <Chip size="small" label={question.topic} variant="outlined" sx={{ mt: 0.5 }} />}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={QUESTION_TYPES.find((t) => t.value === question.questionType)?.label || question.questionType} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={question.difficulty}
                    color={DIFFICULTIES.find((d) => d.value === question.difficulty)?.color || 'default'} />
                </TableCell>
                <TableCell>{question.marks}</TableCell>
                <TableCell>
                  <Chip size="small" label={question.status} color={
                    question.status === 'approved' ? 'success' :
                    question.status === 'pending' ? 'warning' :
                    question.status === 'rejected' ? 'error' : 'default'
                  } />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{question.createdByName}</Typography>
                  <Typography variant="caption" color="text.secondary">{question.createdByRole}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                    {isAdmin && question.status === 'pending' && (
                      <>
                        <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(question.id)}><ApproveIcon /></IconButton></Tooltip>
                        <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(question.id)}><RejectIcon /></IconButton></Tooltip>
                      </>
                    )}
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditingQuestion(question.id)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(question.id)}><DeleteIcon /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      {/* FIXED: onSuccess={refresh} */}
      <CreateQuestionDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}
        collegeId={collegeId} subjectId={subjectId} onSuccess={refresh} />

      {editingQuestion && (
        <EditQuestionDialog open={!!editingQuestion} onClose={() => setEditingQuestion(null)}
          collegeId={collegeId} questionId={editingQuestion} onSuccess={refresh} />
      )}
    </Box>
  );
};

// Create Question Dialog
const CreateQuestionDialog: React.FC<{
  open: boolean; onClose: () => void; collegeId: string; subjectId?: string; onSuccess: () => void;
}> = ({ open, onClose, collegeId, subjectId, onSuccess }) => {
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [questionText, setQuestionText] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [options, setOptions] = useState<Array<{ id: string; text: string; isCorrect: boolean }>>([
    { id: 'opt_0', text: '', isCorrect: false },
    { id: 'opt_1', text: '', isCorrect: false },
    { id: 'opt_2', text: '', isCorrect: false },
    { id: 'opt_3', text: '', isCorrect: false },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleAddOption = () => {
    setOptions([...options, { id: `opt_${options.length}_${Date.now()}`, text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const handleCorrectToggle = (index: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: questionType === 'MSQ' ? (i === index ? !opt.isCorrect : opt.isCorrect) : i === index,
    }));
    setOptions(updated);
  };

  const handleSubmit = async () => {
    setSaving(true); setDialogError(null);
    try {
      const input = {
        content: questionText,
        type: questionType,
        difficulty,
        marks,
        options: options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
        correctAnswer: questionType === 'MCQ'
          ? (options.find((o) => o.isCorrect)?.text || '')
          : ['MSQ', 'TrueFalse'].includes(questionType)
            ? options.filter((o) => o.isCorrect).map((o) => o.text)
            : (modelAnswer || undefined),
        modelAnswer: modelAnswer || undefined,
        subject: subjectId || '',
        topic: topic || '',
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      await createQuestionApi(collegeId, input as CreateQuestionInput);
      onSuccess();
      onClose();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setSaving(false);
    }
  };

  const isMCQ = ['MCQ', 'MSQ', 'TrueFalse'].includes(questionType);
  const isSubjective = ['ShortAnswer', 'LongAnswer'].includes(questionType);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Question</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ flex: '1 1 200px' }}>
              <InputLabel>Question Type</InputLabel>
              <Select value={questionType} label="Question Type" onChange={(e) => setQuestionType(e.target.value as QuestionType)}>
                {QUESTION_TYPES.map((t) => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: '1 1 200px' }}>
              <InputLabel>Difficulty</InputLabel>
              <Select value={difficulty} label="Difficulty" onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}>
                {DIFFICULTIES.map((d) => (<MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField label="Marks" type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} sx={{ flex: '1 1 120px' }} />
            {isMCQ && (
              <TextField label="Negative Marks" type="number" value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))} sx={{ flex: '1 1 120px' }} />
            )}
          </Box>
          <TextField label="Question Text" multiline rows={3} fullWidth value={questionText}
            onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter your question here..." />

          {isMCQ && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Options</Typography>
              <Stack spacing={1}>
                {options.map((option, index) => (
                  <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel control={
                      questionType === 'MSQ' ? (
                        <Checkbox checked={option.isCorrect} onChange={() => handleCorrectToggle(index)} />
                      ) : (
                        <Radio checked={option.isCorrect} onChange={() => handleCorrectToggle(index)} />
                      )
                    } label="" />
                    <TextField fullWidth size="small" placeholder={`Option ${index + 1}`}
                      value={option.text} onChange={(e) => handleOptionChange(index, e.target.value)} />
                    {options.length > 2 && (
                      <IconButton size="small" color="error" onClick={() => handleRemoveOption(index)}><DeleteIcon /></IconButton>
                    )}
                  </Box>
                ))}
              </Stack>
              <Button startIcon={<AddIcon />} onClick={handleAddOption} size="small" sx={{ mt: 1 }}>Add Option</Button>
            </Box>
          )}

          {!isMCQ && !isSubjective && (
            <TextField label="Correct Answer" fullWidth value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Enter the correct answer" />
          )}

          {isSubjective && (
            <TextField label="Model Answer (for reference)" multiline rows={4} fullWidth value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)} placeholder="Enter model answer for grading reference..." />
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}
              sx={{ flex: '1 1 200px' }} placeholder="e.g., Algebra, Thermodynamics" />
            <TextField label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)}
              sx={{ flex: '1 1 200px' }} placeholder="tag1, tag2, tag3" />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !questionText.trim()} startIcon={<SaveIcon />}>
          {saving ? 'Creating...' : 'Create Question'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Edit Question Dialog
const EditQuestionDialog: React.FC<{
  open: boolean; onClose: () => void; collegeId: string; questionId: string; onSuccess: () => void;
}> = ({ open, onClose, collegeId, questionId, onSuccess }) => {
  const { question, loading } = useQuestion(questionId);
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState(1);

  useEffect(() => {
    if (question) {
      setQuestionText((question as any).questionText || '');
      setMarks(question.marks || 1);
    }
  }, [question]);

  const handleSave = async () => {
    await updateQuestionApi(collegeId, questionId, { questionText, marks } as Partial<AssessmentQuestion>);
    onSuccess();
    onClose();
  };

  if (!question) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Question</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Question Text" multiline rows={3} fullWidth value={questionText}
            onChange={(e) => setQuestionText(e.target.value)} />
          <TextField label="Marks" type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionManager;