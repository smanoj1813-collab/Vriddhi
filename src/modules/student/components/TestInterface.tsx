// components/student/TestInterface.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent, LinearProgress,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Paper, Radio, RadioGroup, FormControlLabel, Checkbox, TextField,
  Tooltip, Badge,
} from '@mui/material';
import {
  Flag as FlagIcon, FlagOutlined as FlagOutlinedIcon,
  NavigateNext as NextIcon, NavigateBefore as PrevIcon,
  Send as SubmitIcon, Timer as TimerIcon,
} from '@mui/icons-material';
import { useActiveTest } from '../../../hooks/useAssessment';
import { PaperQuestion, StudentAnswer, QuestionType } from '../../../types/assessment';

interface TestInterfaceProps {
  assessmentId: string;
  studentId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ assessmentId, studentId, onComplete, onExit }) => {
  const {
    activeTest,
    currentQuestion,
    questions,
    answers,
    timeRemaining,
    loading,
    isSubmitting,
    error,
    startTest,
    saveCurrentAnswer,
    submitTest,
    navigateQuestion,
    navigateToQuestion,
    toggleFlagQuestion,
  } = useActiveTest();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started && !activeTest) {
      startTest(assessmentId, studentId);
      setStarted(true);
    }
  }, [started, activeTest, assessmentId, studentId, startTest]);

  const handleAnswer = useCallback((answer: Partial<StudentAnswer>) => {
    if (currentQuestion) {
      saveCurrentAnswer(currentQuestion.questionId, answer);
    }
  }, [currentQuestion, saveCurrentAnswer]);

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    const result = await submitTest();
    if (result && onComplete) {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentIndex = questions.findIndex((q: PaperQuestion) => q.questionId === currentQuestion?.questionId);
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  if (loading && !activeTest) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography>Loading...</Typography></Box>;
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert><Button onClick={onExit} sx={{ mt: 2 }}>Go Back</Button></Box>;
  }

  if (!activeTest || !currentQuestion) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography>Preparing test...</Typography></Box>;
  }

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{activeTest.paperTitle || 'Test'}</Typography>
            <Typography variant="caption">Question {currentIndex + 1} of {questions.length}</Typography>
          </Box>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Chip icon={<TimerIcon />} label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : timeRemaining < 600 ? 'warning' : 'default'}
              sx={{ fontWeight: 600 }} />
            <Button variant="contained" color="success" size="small" startIcon={<SubmitIcon />} onClick={() => setShowSubmitConfirm(true)}>
              Submit
            </Button>
          </Stack>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 6, borderRadius: 3 }} />
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Chip label={(currentQuestion.questionType || 'mcq_single').replace(/_/g, ' ').toUpperCase()} size="small" color="primary" variant="outlined" />
                <Chip label={`${currentQuestion.marks} Marks`} size="small" color="success" />
              </Box>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.6, mb: 3 }}>
                <strong>Q{currentIndex + 1}.</strong> {currentQuestion.questionText || 'Question text unavailable'}
              </Typography>
              <AnswerInput
                questionType={currentQuestion.questionType || 'mcq_single'}
                options={currentQuestion.options || []}
                value={answers[currentQuestion.questionId] || {}}
                onChange={handleAnswer}
              />
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" startIcon={<PrevIcon />} onClick={() => navigateQuestion('prev')} disabled={currentIndex === 0}>
              Previous
            </Button>
            <Button variant={activeTest.flaggedQuestions?.includes(currentQuestion.questionId) ? 'contained' : 'outlined'}
              color="warning" startIcon={activeTest.flaggedQuestions?.includes(currentQuestion.questionId) ? <FlagIcon /> : <FlagOutlinedIcon />}
              onClick={() => toggleFlagQuestion(currentQuestion.questionId)}>
              {activeTest.flaggedQuestions?.includes(currentQuestion.questionId) ? 'Flagged' : 'Flag'}
            </Button>
            {isLastQuestion ? (
              <Button variant="contained" color="success" endIcon={<SubmitIcon />} onClick={() => setShowSubmitConfirm(true)}>
                Submit Test
              </Button>
            ) : (
              <Button variant="contained" endIcon={<NextIcon />} onClick={() => navigateQuestion('next')}>
                Next
              </Button>
            )}
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ width: 260, display: { xs: 'none', md: 'block' }, borderRadius: 0, borderTop: 0, borderBottom: 0, borderRight: 0 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Questions</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {questions.map((q: PaperQuestion, idx: number) => {
                const isAnswered = !!answers[q.questionId];
                const isFlagged = activeTest.flaggedQuestions?.includes(q.questionId);
                const isCurrent = currentQuestion.questionId === q.questionId;
                return (
                  <Button key={q.questionId} size="small" variant={isCurrent ? 'contained' : 'outlined'}
                    color={isCurrent ? 'primary' : isAnswered ? 'success' : isFlagged ? 'warning' : 'inherit'}
                    onClick={() => navigateToQuestion(idx)} sx={{ minWidth: 36, height: 36, p: 0 }}>
                    {idx + 1}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Paper>
      </Box>

      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Test?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have answered {answeredCount} out of {questions.length} questions.
          </Alert>
          <Typography>Are you sure you want to submit? You cannot change your answers after submission.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)}>Continue Test</Button>
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

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
        <RadioGroup value={value.selectedOptionIds?.[0] || ''} onChange={(e) => onChange({ selectedOptionIds: [e.target.value] })}>
          <Stack spacing={1}>
            {options.map((option) => (
              <Paper key={option.id} variant="outlined" sx={{
                p: 2, cursor: 'pointer',
                borderColor: value.selectedOptionIds?.includes(option.id) ? 'primary.main' : 'divider',
                bgcolor: value.selectedOptionIds?.includes(option.id) ? 'primary.50' : 'background.paper',
              }} onClick={() => onChange({ selectedOptionIds: [option.id] })}>
                <FormControlLabel value={option.id} control={<Radio />} label={option.text} sx={{ width: '100%', m: 0 }} />
              </Paper>
            ))}
          </Stack>
        </RadioGroup>
      );
    case 'mcq_multiple':
      return (
        <Stack spacing={1}>
          {options.map((option) => (
            <Paper key={option.id} variant="outlined" sx={{
              p: 2, cursor: 'pointer',
              borderColor: value.selectedOptionIds?.includes(option.id) ? 'primary.main' : 'divider',
              bgcolor: value.selectedOptionIds?.includes(option.id) ? 'primary.50' : 'background.paper',
            }} onClick={() => {
              const current = value.selectedOptionIds || [];
              const updated = current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id];
              onChange({ selectedOptionIds: updated });
            }}>
              <FormControlLabel control={<Checkbox checked={value.selectedOptionIds?.includes(option.id) || false} />} label={option.text} sx={{ width: '100%', m: 0 }} />
            </Paper>
          ))}
        </Stack>
      );
    case 'fill_in_blank':
      return <TextField fullWidth variant="outlined" placeholder="Type your answer..." value={value.textAnswer || ''} onChange={(e) => onChange({ textAnswer: e.target.value })} />;
    case 'short_answer':
      return <TextField fullWidth variant="outlined" placeholder="Type your answer..." value={value.textAnswer || ''} onChange={(e) => onChange({ textAnswer: e.target.value })} multiline rows={3} />;
    case 'long_answer':
      return <TextField fullWidth variant="outlined" placeholder="Type your detailed answer..." value={value.textAnswer || ''} onChange={(e) => onChange({ textAnswer: e.target.value })} multiline rows={8} />;
    default:
      return <TextField fullWidth variant="outlined" placeholder="Type your answer..." value={value.textAnswer || ''} onChange={(e) => onChange({ textAnswer: e.target.value })} multiline rows={3} />;
  }
};

export default TestInterface;
