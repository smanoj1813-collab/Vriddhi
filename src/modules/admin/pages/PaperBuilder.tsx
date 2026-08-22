// ============================================================
// VRIDDHI - PaperBuilder Component
// ============================================================
// Build papers manually or from templates
// Uses Box + flexWrap layout (no MUI Grid)
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper as MuiPaper,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useAuth } from '../../auth/context/AuthContext';
import { createPaper } from '../api/paperApi';
import { linkQuestionToPaper } from '../api/questionBankApi';
import {
  type Paper,
  type PaperQuestionRef,
  type QuestionMetadata,
} from '../../admin/types/universalQuestionBank';

// ============================================================
// QUESTION SELECTOR DIALOG
// ============================================================

interface QuestionSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (question: QuestionMetadata) => void;
  subjectId: string;
  topicId?: string;
}

function QuestionSelector({ open, onClose, onSelect, subjectId, topicId }: QuestionSelectorProps) {
  const { universalQuestions, loadingUniversal, searchUniversalQuestions } = useQuestionBank();
  const [selectedTopic, setSelectedTopic] = useState(topicId || '');

  React.useEffect(() => {
    if (open) {
      searchUniversalQuestions({ subjectId, topicId: selectedTopic || undefined, status: 'approved' });
    }
  }, [open, subjectId, selectedTopic]);

  if (!open) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
        Select Questions
      </Typography>
      {loadingUniversal.questions ? (
        <CircularProgress />
      ) : (
        <Stack spacing={1}>
          {universalQuestions.map((q) => (
            <MuiPaper
              key={q.id}
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => { onSelect(q); onClose(); }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {q.topicId} - {q.difficulty}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {q.marks} marks | {q.questionType}
                  </Typography>
                </Box>
                <Chip label={q.difficulty} size="small" color={
                  q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'error'
                } />
              </Box>
            </MuiPaper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface PaperBuilderProps {
  initialPaper?: Paper;
  onSave?: (paper: Paper) => void;
  onClose?: () => void;
}

export function PaperBuilder({ initialPaper, onSave, onClose }: PaperBuilderProps) {
  const { user } = useAuth();
  const { generatePaper, previewPaper } = useQuestionBank();

  const [activeTab, setActiveTab] = useState(0);
  const [paper, setPaper] = useState<Paper>(initialPaper || {
    id: '',
    title: '',
    description: '',
    subjectId: '',
    topicIds: [],
    questions: [],
    totalQuestions: 0,
    totalMarks: 0,
    duration: 60,
    difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
    topicDistribution: {},
    createdBy: {
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      collegeId: user?.collegeId || null,
      collegeName: (user as any)?.collegeName || 'Unknown',
      role: (user?.role as any) || 'faculty',
    },
    visibility: 'college_only',
    sharedWith: [],
    isTemplate: false,
    status: 'draft',
    storagePath: '',
    usageStats: { timesUsed: 0, collegesUsing: [] },
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAddQuestion = useCallback((question: QuestionMetadata) => {
    setPaper((prev) => {
      const newQuestion: PaperQuestionRef = {
        questionId: question.id,
        order: prev.questions.length + 1,
        marks: question.marks,
        isRequired: true,
      };
      const questions = [...prev.questions, newQuestion];
      const totalMarks = questions.reduce((sum: number, q: PaperQuestionRef) => sum + q.marks, 0);
      return {
        ...prev,
        questions,
        totalQuestions: questions.length,
        totalMarks,
      };
    });
  }, []);

  const handleRemoveQuestion = useCallback((index: number) => {
    setPaper((prev) => {
      const questions = prev.questions.filter((_: PaperQuestionRef, i: number) => i !== index);
      const reordered = questions.map((q: PaperQuestionRef, i: number) => ({ ...q, order: i + 1 }));
      const totalMarks = reordered.reduce((sum: number, q: PaperQuestionRef) => sum + q.marks, 0);
      return {
        ...prev,
        questions: reordered,
        totalQuestions: reordered.length,
        totalMarks,
      };
    });
  }, []);

  const handleSave = async () => {
    if (!paper.title.trim()) {
      setSaveError('Title is required');
      return;
    }
    if (paper.questions.length === 0) {
      setSaveError('Add at least one question');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (!user?.collegeId) {
        throw new Error('Not authenticated — missing collegeId');
      }

      const subjectName = subjects.find((s) => s.id === paper.subjectId)?.name || paper.subjectId;
      const questionIds = paper.questions.map((q) => q.questionId).filter(Boolean);

      const saved = await createPaper(
        user.collegeId,
        {
          title: paper.title,
          subject: subjectName,
          totalMarks: paper.totalMarks,
          duration: paper.duration,
          instructions: paper.description ? [paper.description] : [],
          negativeMarking: false,
        },
        questionIds,
        user.id || user.uid,
        user.name || user.email || 'Unknown',
        true
      );

      const newPaper: Paper = {
        ...paper,
        id: saved.id,
        status: saved.status === 'published' ? 'published' : 'draft',
        storagePath: '',
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt || new Date().toISOString(),
      };
      setPaper(newPaper);

      // Keep the linked questions and paper in sync.
      for (const qid of questionIds) {
        await linkQuestionToPaper(qid, saved.id);
      }

      onSave?.(newPaper);
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'biology', name: 'Biology' },
    { id: 'english', name: 'English' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Paper Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create custom papers from the universal question pool
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => previewPaper(paper.id)}
            disabled={!paper.id}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            Save Paper
          </Button>
        </Box>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Paper Details" />
          <Tab label={`Questions (${paper.questions.length})`} />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* Tab 1: Paper Details */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <TextField
                fullWidth
                label="Paper Title *"
                value={paper.title}
                onChange={(e) => setPaper((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mid-Term Examination 2026"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Subject *</InputLabel>
                <Select
                  value={paper.subjectId}
                  label="Subject *"
                  onChange={(e) => setPaper((prev) => ({ ...prev, subjectId: e.target.value }))}
                >
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={paper.description}
            onChange={(e) => setPaper((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the paper..."
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={paper.duration}
                onChange={(e) => setPaper((prev) => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={paper.totalMarks}
                slotProps={{ input: { readOnly: true } }}
                helperText="Auto-calculated from questions"
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
              <TextField
                fullWidth
                label="Total Questions"
                type="number"
                value={paper.totalQuestions}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
          </Box>
        </Stack>
      )}

      {/* Tab 2: Questions */}
      {activeTab === 1 && (
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Questions
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSelectorOpen(true)}
              disabled={!paper.subjectId}
            >
              Add Question
            </Button>
          </Box>

          {!paper.subjectId && (
            <Alert severity="info">
              Please select a subject in the Paper Details tab first.
            </Alert>
          )}

          {paper.questions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary">
                No questions added yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Question" to browse the universal pool
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {paper.questions.map((qRef: PaperQuestionRef, index: number) => (
                <MuiPaper
                  key={qRef.questionId}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Typography
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {qRef.order}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Question ID: {qRef.questionId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {qRef.marks} marks | {qRef.isRequired ? 'Required' : 'Optional'}
                    </Typography>
                  </Box>
                  <TextField
                    type="number"
                    size="small"
                    label="Marks"
                    value={qRef.marks}
                    onChange={(e) => {
                      const newMarks = parseInt(e.target.value) || 1;
                      setPaper((prev) => {
                        const questions = prev.questions.map((q: PaperQuestionRef, i: number) =>
                          i === index ? { ...q, marks: newMarks } : q
                        );
                        const totalMarks = questions.reduce((sum: number, q: PaperQuestionRef) => sum + q.marks, 0);
                        return { ...prev, questions, totalMarks };
                      });
                    }}
                    sx={{ width: 80 }}
                  />
                  <Tooltip title="Remove">
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveQuestion(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </MuiPaper>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 2 && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={paper.visibility}
                  label="Visibility"
                  onChange={(e) => setPaper((prev) => ({ ...prev, visibility: e.target.value as any }))}
                >
                  <MenuItem value="public">Public (All Colleges)</MenuItem>
                  <MenuItem value="college_only">College Only</MenuItem>
                  <MenuItem value="shared_with">Shared With Specific Colleges</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Difficulty Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                label="Easy"
                type="number"
                value={paper.difficultyDistribution.easy}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                label="Medium"
                type="number"
                value={paper.difficultyDistribution.medium}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                label="Hard"
                type="number"
                value={paper.difficultyDistribution.hard}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
          </Box>
        </Stack>
      )}

      {/* Question Selector */}
      <QuestionSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddQuestion}
        subjectId={paper.subjectId}
      />
    </Box>
  );
}

export default PaperBuilder;