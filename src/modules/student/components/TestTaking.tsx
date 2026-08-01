// components/student/TestTaking.tsx
// ============================================
// TEST TAKING - Student Test Interface
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider,
  Tooltip,
  Badge,
  Grid,
} from '@mui/material';
import {
  Flag as FlagIcon,
  FlagOutlined as FlagOutlinedIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Send as SubmitIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { useActiveTest } from '../../../hooks/useAssessment';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  PaperQuestion,
  StudentAnswer,
  QuestionType,
} from '../../../types/assessment';

interface TestTakingProps {
  assessmentId: string;
  studentId: string;
  studentName?: string;
  studentRegNo?: string;
  sectionId?: string;
  sectionName?: string;
  onComplete?: () => void;
  onExit?: () => void;
}

const TestTaking: React.FC<TestTakingProps> = ({
  assessmentId,
  studentId,
  studentName,
  studentRegNo,
  sectionId,
  sectionName,
  onComplete,
  onExit,
}) => {
  const {
    activeTest,
    currentQuestion,
    questions,
    answers,
    timeRemaining,
    loading,
    isSubmitting,
    error,
    start,
    saveCurrentAnswer,
    submit,
    navigateQuestion,
    navigateToQuestion,
    toggleFlagQuestion,
    logProctorEvent,
  } = useActiveTest();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [started, setStarted] = useState(false);

  // Start the test on mount
  useEffect(() => {
    if (!started && !activeTest) {
      start(assessmentId, studentId, studentName, studentRegNo, sectionId, sectionName);
      setStarted(true);
    }
  }, [started, activeTest, assessmentId, studentId, studentName, studentRegNo, sectionId, sectionName, start]);

  // Proctoring: detect tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeTest?.status === 'in_progress') {
        logProctorEvent('tab_switch', { timestamp: new Date().toISOString() });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTest?.status, logProctorEvent]);

  const handleAnswer = useCallback((answer: Partial<StudentAnswer>) => {
    if (currentQuestion) {
      saveCurrentAnswer(currentQuestion.questionId, answer);
    }
  }, [currentQuestion, saveCurrentAnswer]);

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    const result = await submit();
    if (result && onComplete) {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: string, index: number) => {
    const isAnswered = !!answers[questionId];
    const isFlagged = activeTest?.flaggedQuestions?.includes(questionId);
    const isCurrent = currentQuestion?.questionId === questionId;

    if (isCurrent) return 'current';
    if (isAnswered && isFlagged) return 'answered-flagged';
    if (isAnswered) return 'answered';
    if (isFlagged) return 'flagged';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'primary';
      case 'answered': return 'success';
      case 'flagged': return 'warning';
      case 'answered-flagged': return 'info';
      default: return 'default';
    }
  };

  if (loading && !activeTest) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading test...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={onExit} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  if (!activeTest || !currentQuestion) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Preparing test...</Typography>
      </Box>
    );
  }

  const isLastQuestion = questions.findIndex((q: PaperQuestion) => q.questionId === currentQuestion.questionId) === questions.length - 1;
  const currentIndex = questions.findIndex((q: PaperQuestion) => q.questionId === currentQuestion.questionId);
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = activeTest.flaggedQuestions?.length || 0;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, zIndex: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {activeTest.paperTitle || 'Test'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Question {currentIndex + 1} of {questions.length}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Chip
              icon={<TimerIcon />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : timeRemaining < 600 ? 'warning' : 'default'}
              sx={{ fontWeight: 600, fontSize: '1.1rem', px: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowQuestionPalette(true)}
            >
              {answeredCount}/{questions.length}
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<SubmitIcon />}
              onClick={() => setShowSubmitConfirm(true)}
            >
              Submit
            </Button>
          </Stack>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 1, height: 6, borderRadius: 3 }}
        />
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Question Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Chip
                  label={currentQuestion.questionType?.replace(/_/g, ' ').toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip label={`${currentQuestion.marks} Marks`} size="small" color="success" />
              </Box>

              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 3 }}>
                <strong>Q{currentIndex + 1}.</strong> {currentQuestion.questionText}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              {/* Answer Input */}
              <AnswerInput
                questionType={currentQuestion.questionType || 'mcq_single'}
                options={currentQuestion.options || []}
                value={answers[currentQuestion.questionId] || {}}
                onChange={handleAnswer}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<PrevIcon />}
              onClick={() => navigateQuestion('prev')}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>

            <Stack direction="row" spacing={1}>
              <Button
                variant={activeTest.flaggedQuestions?.includes(currentQuestion.questionId) ? 'contained' : 'outlined'}
                color="warning"
                startIcon={activeTest.flaggedQuestions?.includes(currentQuestion.questionId) ? <FlagIcon /> : <FlagOutlinedIcon />}
                onClick={() => toggleFlagQuestion(currentQuestion.questionId)}
              >
                {activeTest.flaggedQuestions?.includes(currentQuestion.questionId) ? 'Flagged' : 'Flag'}
              </Button>
            </Stack>

            {isLastQuestion ? (
              <Button
                variant="contained"
                color="success"
                endIcon={<SubmitIcon />}
                onClick={() => setShowSubmitConfirm(true)}
              >
                Submit Test
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={() => navigateQuestion('next')}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>

        {/* Question Palette Sidebar */}
        <Paper
          variant="outlined"
          sx={{
            width: 280,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            borderRadius: 0,
            borderTop: 0,
            borderBottom: 0,
            borderRight: 0,
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Question Palette</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {questions.map((q: PaperQuestion, idx: number) => {
                const status = getQuestionStatus(q.questionId, idx);
                return (
                  <Button
                    key={q.questionId}
                    size="small"
                    variant={status === 'current' ? 'contained' : 'outlined'}
                    color={getStatusColor(status) as any}
                    onClick={() => navigateToQuestion(idx)}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      p: 0,
                      position: 'relative',
                    }}
                  >
                    {idx + 1}
                    {status === 'flagged' || status === 'answered-flagged' ? (
                      <FlagIcon fontSize="small" sx={{ position: 'absolute', top: -4, right: -4, fontSize: 12 }} />
                    ) : null}
                  </Button>
                );
              })}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>Legend</Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: 0.5 }} />
                  <Typography variant="caption">Answered ({answeredCount})</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'warning.main', borderRadius: 0.5 }} />
                  <Typography variant="caption">Flagged ({flaggedCount})</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'info.main', borderRadius: 0.5 }} />
                  <Typography variant="caption">Answered & Flagged</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, border: 1, borderColor: 'divider', borderRadius: 0.5 }} />
                  <Typography variant="caption">Not Answered ({questions.length - answeredCount})</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Test?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have answered {answeredCount} out of {questions.length} questions.
            {questions.length - answeredCount > 0 && ` ${questions.length - answeredCount} questions are unanswered.`}
          </Alert>
          <Typography variant="body2">
            Are you sure you want to submit? You cannot change your answers after submission.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)}>Continue Test</Button>
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <DialogTitle>Leave Test?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to leave? Your progress may be lost.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitConfirm(false)}>Stay</Button>
          <Button color="error" onClick={onExit}>Leave</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Answer Input Component ─────────────────

interface AnswerInputProps {
  questionType: QuestionType;
  options: Array<{ id: string; text: string; matchWith?: string }>;
  value: Partial<StudentAnswer>;
  onChange: (answer: Partial<StudentAnswer>) => void;
}

const AnswerInput: React.FC<AnswerInputProps> = ({ questionType, options, value, onChange }) => {
  switch (questionType) {
    case 'mcq_single':
    case 'true_false':
      return (
        <RadioGroup
          value={value.selectedOptionIds?.[0] || ''}
          onChange={(e) => onChange({ selectedOptionIds: [e.target.value] })}
        >
          <Stack spacing={1}>
            {options.map((option) => (
              <Paper
                key={option.id}
                variant="outlined"
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderColor: value.selectedOptionIds?.includes(option.id) ? 'primary.main' : 'divider',
                  bgcolor: value.selectedOptionIds?.includes(option.id) ? 'primary.50' : 'background.paper',
                }}
                onClick={() => onChange({ selectedOptionIds: [option.id] })}
              >
                <FormControlLabel
                  value={option.id}
                  control={<Radio />}
                  label={option.text}
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            ))}
          </Stack>
        </RadioGroup>
      );

    case 'mcq_multiple':
      return (
        <Stack spacing={1}>
          {options.map((option) => (
            <Paper
              key={option.id}
              variant="outlined"
              sx={{
                p: 2,
                cursor: 'pointer',
                borderColor: value.selectedOptionIds?.includes(option.id) ? 'primary.main' : 'divider',
                bgcolor: value.selectedOptionIds?.includes(option.id) ? 'primary.50' : 'background.paper',
              }}
              onClick={() => {
                const current = value.selectedOptionIds || [];
                const updated = current.includes(option.id)
                  ? current.filter((id) => id !== option.id)
                  : [...current, option.id];
                onChange({ selectedOptionIds: updated });
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={value.selectedOptionIds?.includes(option.id) || false}
                  />
                }
                label={option.text}
                sx={{ width: '100%', m: 0 }}
              />
            </Paper>
          ))}
        </Stack>
      );

    case 'fill_in_blank':
      return (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your answer here..."
          value={value.textAnswer || ''}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          multiline={false}
        />
      );

    case 'short_answer':
      return (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your answer here..."
          value={value.textAnswer || ''}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          multiline
          rows={3}
        />
      );

    case 'long_answer':
      return (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your detailed answer here..."
          value={value.textAnswer || ''}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          multiline
          rows={8}
        />
      );

    case 'match_following':
      return (
        <Stack spacing={2}>
          {options.map((option, idx) => (
            <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 120, fontWeight: 500 }}>{option.text}</Typography>
              <Typography color="text.secondary">→</Typography>
              <TextField
                size="small"
                placeholder={`Match with option ${idx + 1}`}
                value={value.matchedPairs?.find((p) => p.left === option.id)?.right || ''}
                onChange={(e) => {
                  const pairs = value.matchedPairs || [];
                  const filtered = pairs.filter((p) => p.left !== option.id);
                  onChange({
                    matchedPairs: [...filtered, { left: option.id, right: e.target.value }],
                  });
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          ))}
        </Stack>
      );

    default:
      return (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your answer here..."
          value={value.textAnswer || ''}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          multiline
          rows={3}
        />
      );
  }
};

export default TestTaking;
