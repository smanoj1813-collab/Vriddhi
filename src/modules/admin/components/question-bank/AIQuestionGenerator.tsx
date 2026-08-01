// src/components/question-bank/AIQuestionGenerator.tsx
// ─── AI Question Generator with Flexible Subject Selection ─────────────

import React, { useState, useCallback } from 'react';
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
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Checkbox,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AutoFixHigh as AIIcon,
  School as SubjectIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '/../../../auth/context/AuthContext';
import { useAIQuestionGenerator } from '../../hooks/useAIQuestionGenerator';
import {
  generateQuestionsWithAI,
  mapToGeneratedQuestions,
} from '../../api/aiQuestionApi';
import type { QuestionType, DifficultyLevel, GeneratedQuestion } from '../../types/questionBank';

// ─── Predefined subjects ───────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  'Mathematics I', 'Mathematics II', 'Mathematics III',
  'Physics', 'Chemistry',
  'Computer Science', 'Data Structures', 'Algorithms',
  'Database Management', 'Operating Systems',
  'Electronics', 'Digital Logic',
  'Mechanics', 'Thermodynamics',
  'English', 'Communication Skills',
  'Accounting', 'Economics', 'Statistics',
];

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
];

const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; color: 'success' | 'warning' | 'error' }[] = [
  { value: 'easy', label: 'Easy', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'hard', label: 'Hard', color: 'error' },
];

// ─── Component ─────────────────────────────────────────────────────────

interface AIQuestionGeneratorProps {
  onQuestionsSaved?: (questions: GeneratedQuestion[]) => void;
  defaultSubject?: string;
  subjects?: string[];
  batches?: string[];
  branches?: string[];
}

const AIQuestionGenerator: React.FC<AIQuestionGeneratorProps> = ({
  onQuestionsSaved,
  defaultSubject,
  subjects: propSubjects,
  batches = ['2024', '2025', '2026', '2027'],
  branches = ['B.Com', 'BBA', 'BCA', 'B.Sc', 'B.Tech'],
}) => {
  const { user } = useAuth();
  const {
    saving,
    error: hookError,
    savedQuestions,
    saveAll,
    clear: clearHook,
  } = useAIQuestionGenerator();

  // ─── Form State ─────────────────────────────────────
  const [subject, setSubject] = useState<string>(defaultSubject || '');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [topic, setTopic] = useState('');
  const [chapter, setChapter] = useState('');
  const [unit, setUnit] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [count, setCount] = useState(5);
  const [marks, setMarks] = useState(1);
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [language, setLanguage] = useState('english');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // ─── Generated State ────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  // ─── Save Options ───────────────────────────────────
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const subjects = propSubjects || DEFAULT_SUBJECTS;
  const effectiveSubject = isCustomSubject ? customSubject : subject;

  // ─── Handlers ───────────────────────────────────────
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleGenerate = async () => {
    if (!effectiveSubject.trim()) {
      showSnackbar('Please select or enter a subject', 'error');
      return;
    }
    if (!topic.trim()) {
      showSnackbar('Please enter a topic', 'error');
      return;
    }

    setGenerating(true);
    setGenError(null);
    setGenerated([]);

    try {
      const result = await generateQuestionsWithAI({
        topic: topic.trim(),
        subject: effectiveSubject.trim(),
        questionType,
        difficulty,
        count,
        marks,
        chapter: chapter.trim() || undefined,
        unit: unit.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        language,
        includeExplanation,
      });

      // ← FIX: Map Partial<Question>[] to GeneratedQuestion[]
      const mapped = mapToGeneratedQuestions(result.questions, effectiveSubject);
      setGenerated(mapped);
      setSelectedQuestions(new Set());
      showSnackbar(`Generated ${mapped.length} questions for "${effectiveSubject}"`, 'success');
    } catch (err: any) {
      setGenError(err.message || 'Generation failed');
      showSnackbar(err.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (generated.length === 0) return;
    if (!selectedBatch) {
      showSnackbar('Please select a batch', 'error');
      return;
    }
    if (!selectedBranch) {
      showSnackbar('Please select a branch', 'error');
      return;
    }

    try {
      const saved = await saveAll(generated, selectedBatch, selectedBranch);
      showSnackbar(`Saved ${saved.length} questions to Question Bank!`, 'success');
      onQuestionsSaved?.(generated);
      setGenerated([]);
      clearHook();
    } catch (err: any) {
      showSnackbar(err.message || 'Save failed', 'error');
    }
  };

  const handleSaveSelected = async () => {
    if (generated.length === 0 || selectedQuestions.size === 0) return;
    if (!selectedBatch || !selectedBranch) {
      showSnackbar('Please select batch and branch', 'error');
      return;
    }

    const toSave = Array.from(selectedQuestions).map((idx) => generated[idx]);

    try {
      const saved = await saveAll(toSave, selectedBatch, selectedBranch);
      showSnackbar(`Saved ${saved.length} selected questions!`, 'success');
      onQuestionsSaved?.(toSave);

      const remaining = generated.filter((_, idx) => !selectedQuestions.has(idx));
      setGenerated(remaining);
      setSelectedQuestions(new Set());
      if (remaining.length === 0) clearHook();
    } catch (err: any) {
      showSnackbar(err.message || 'Save failed', 'error');
    }
  };

  const toggleQuestionSelection = (idx: number) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleClearAll = () => {
    setGenerated([]);
    setSelectedQuestions(new Set());
    clearHook();
  };

  // ─── Render ─────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ─── Configuration Panel ──────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SubjectIcon fontSize="small" /> Configuration
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {/* Subject Selection */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={isCustomSubject ? '__custom__' : subject}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomSubject(true);
                    setSubject('');
                  } else {
                    setIsCustomSubject(false);
                    setSubject(val);
                    setCustomSubject('');
                  }
                }}
                label="Subject"
              >
                <MenuItem value="">Select a subject...</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
                <Divider />
                <MenuItem value="__custom__">
                  <em>+ Add Custom Subject</em>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Subject Input */}
          {isCustomSubject && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Custom Subject"
                placeholder="Enter subject name..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                autoFocus
                helperText="This subject will be saved with the generated questions"
              />
            </Grid>
          )}

          {/* Topic */}
          <Grid size={{ xs: 12, md: isCustomSubject ? 12 : 6 }}>
            <TextField
              fullWidth
              label="Topic"
              placeholder="e.g., Integration by Parts, Newton's Laws..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </Grid>

          {/* Chapter */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Chapter (Optional)"
              placeholder="e.g., Chapter 3"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />
          </Grid>

          {/* Unit */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Unit (Optional)"
              placeholder="e.g., Unit 2"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </Grid>

          {/* Question Type */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                label="Question Type"
              >
                {QUESTION_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Difficulty */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                label="Difficulty"
              >
                {DIFFICULTY_LEVELS.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    <Chip size="small" color={d.color} label={d.label} sx={{ mr: 1 }} />
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Count */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Number of Questions"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              slotProps={{ input: { inputProps: { min: 1, max: 50 } } }}  // ← FIX: MUI v5 slotProps
            />
          </Grid>

          {/* Marks */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="number"
              label="Marks per Question"
              value={marks}
              onChange={(e) => setMarks(Math.max(0.5, parseFloat(e.target.value) || 1))}
              slotProps={{ input: { inputProps: { min: 0.5, step: 0.5 } } }}  // ← FIX: MUI v5 slotProps
            />
          </Grid>

          {/* Language */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)} label="Language">
                <MenuItem value="english">English</MenuItem>
                <MenuItem value="hindi">Hindi</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Tags */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Press Enter to add tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button variant="outlined" onClick={handleAddTag} sx={{ mt: 0.5 }}>
                Add
              </Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          {/* Include Explanation */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={includeExplanation}
                  onChange={(e) => setIncludeExplanation(e.target.checked)}
                />
                <Typography variant="body2">Include Explanation</Typography>
              </Box>
            </FormControl>
          </Grid>
        </Grid>

        {/* Generate Button */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
            onClick={handleGenerate}
            disabled={generating || !effectiveSubject.trim() || !topic.trim()}
            sx={{ minWidth: 200 }}
          >
            {generating ? 'Generating...' : `Generate ${count} Questions`}
          </Button>
          {generated.length > 0 && (
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleClearAll} color="secondary">
              Clear & Start Over
            </Button>
          )}
        </Box>

        {genError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            {genError}
          </Alert>
        )}
      </Paper>

      {/* ─── Generated Questions ──────────────────────── */}
      {generated.length > 0 && (
        <Fade in>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Generated Questions ({generated.length})
                <Chip
                  label={effectiveSubject}
                  color="primary"
                  size="small"
                  sx={{ ml: 1 }}
                  icon={<SubjectIcon />}
                />
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    setSelectedQuestions(
                      selectedQuestions.size === generated.length
                        ? new Set()
                        : new Set(generated.map((_, i) => i))
                    )
                  }
                >
                  {selectedQuestions.size === generated.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
            </Box>

            {/* Save Options */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Batch</InputLabel>
                  <Select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} label="Batch">
                    <MenuItem value="">Select Batch</MenuItem>
                    {batches.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Branch</InputLabel>
                  <Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} label="Branch">
                    <MenuItem value="">Select Branch</MenuItem>
                    {branches.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* Questions List */}
            <Box>
              {generated.map((q, idx) => (
                <Card
                  key={q.id || idx}
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    borderLeft: 4,
                    borderLeftColor: selectedQuestions.has(idx) ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: 1 },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox
                        checked={selectedQuestions.has(idx)}
                        onChange={() => toggleQuestionSelection(idx)}
                        sx={{ mt: -0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Q{idx + 1}. {q.text}
                        </Typography>

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <Box sx={{ pl: 2, mb: 1 }}>
                            {q.options.map((opt, optIdx) => (
                              <Typography
                                key={optIdx}
                                variant="body2"
                                sx={{
                                  color: opt.isCorrect ? 'success.main' : 'text.secondary',
                                  fontWeight: opt.isCorrect ? 600 : 400,
                                }}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt.text}
                                {opt.isCorrect && <CheckIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {/* Correct Answer (non-MCQ) */}
                        {q.correctAnswer && (!q.options || q.options.length === 0) && (
                          <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
                            <strong>Answer:</strong> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                          </Alert>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <Box sx={{ pl: 2, mb: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Explanation:</strong> {q.explanation}
                            </Typography>
                          </Box>
                        )}

                        {/* Meta Chips */}
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                          <Chip size="small" label={q.type} variant="outlined" />
                          <Chip
                            size="small"
                            label={q.difficulty}
                            color={
                              q.difficulty === 'easy'
                                ? 'success'
                                : q.difficulty === 'medium'
                                ? 'warning'
                                : 'error'
                            }
                          />
                          <Chip size="small" label={`${q.marks} marks`} variant="outlined" />
                          {q.subject && <Chip size="small" label={q.subject} color="primary" variant="outlined" />}
                          {q.topic && <Chip size="small" label={q.topic} variant="outlined" />}
                          {q.bloomLevel && <Chip size="small" label={q.bloomLevel} color="info" variant="outlined" />}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Save Actions */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveSelected}
                disabled={saving || selectedQuestions.size === 0 || !selectedBatch || !selectedBranch}
              >
                {saving ? 'Saving...' : `Save Selected (${selectedQuestions.size})`}
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSaveAll}
                disabled={saving || !selectedBatch || !selectedBranch}
              >
                {saving ? 'Saving...' : `Save All (${generated.length})`}
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* ─── Saved Questions Summary ──────────────────── */}
      {savedQuestions.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'success.light', backgroundOpacity: 0.1 }}>
          <Typography variant="h6" color="success.dark" gutterBottom>
            <CheckIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Successfully Saved Questions
          </Typography>
          <Typography variant="body2" color="success.dark">
            {savedQuestions.length} question(s) have been added to the Question Bank.
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {savedQuestions.map((q, i) => (
              <Chip key={i} size="small" label={q.text?.substring(0, 40) + '...'} color="success" variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}

      {/* ─── Error Display ────────────────────────────── */}
      {hookError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          {hookError}
        </Alert>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AIQuestionGenerator;
