// src/modules/student/components/TestInterface.tsx
// Full-screen test-taking interface with timer, navigation, question palette

import React, { useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Fullscreen as FullscreenIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import QuestionRenderer from './QuestionRenderer';
import type { ActiveTest, PaperQuestion, StudentAnswer } from '../types/assessment';

interface TestInterfaceProps {
  activeTest: ActiveTest;
  questions: PaperQuestion[];
  answers: Record<string, Partial<StudentAnswer>>;
  currentQuestionIndex: number;
  timeRemaining: number;
  isSubmitting: boolean;
  onAnswer: (questionId: string, answer: Partial<StudentAnswer>) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onNavigateTo: (index: number) => void;
  onToggleFlag: (questionId: string) => void;
  onSubmit: () => void;
  onLogProctor: (eventType: string, details?: Record<string, unknown>) => void;
  isFlagged: (questionId: string) => boolean;
  isAnswered: (questionId: string) => boolean;
  answeredCount: number;
  flaggedCount: number;
}

const TestInterface: React.FC<TestInterfaceProps> = ({
  activeTest,
  questions,
  answers,
  currentQuestionIndex,
  timeRemaining,
  isSubmitting,
  onAnswer,
  onNavigate,
  onNavigateTo,
  onToggleFlag,
  onSubmit,
  onLogProctor,
  isFlagged,
  isAnswered,
  answeredCount,
  flaggedCount,
}) => {
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeRemaining < 300;
  const isTimeCritical = timeRemaining < 60;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onLogProctor('tab_switch', { timestamp: new Date().toISOString() });
      }
    };

    const handleBlur = () => {
      onLogProctor('window_blur', { timestamp: new Date().toISOString() });
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onLogProctor('copy_paste', { action: 'copy' });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onLogProctor('copy_paste', { action: 'paste' });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onLogProctor('right_click', { timestamp: new Date().toISOString() });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onLogProctor]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getQuestionStatus = (q: PaperQuestion, index: number) => {
    if (isFlagged(q.id)) return 'flagged';
    if (isAnswered(q.id)) return 'answered';
    if (index === currentQuestionIndex) return 'current';
    return 'unvisited';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32' };
      case 'flagged': return { bg: '#fff3e0', border: '#ff9800', color: '#ef6c00' };
      case 'current': return { bg: '#e3f2fd', border: '#2196f3', color: '#1565c0' };
      default: return { bg: '#fafafa', border: '#e0e0e0', color: '#9e9e9e' };
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Top Bar */}
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {activeTest.title}
          </Typography>
          <Chip label={activeTest.subject} size="small" color="primary" />
          <Chip label={`${activeTest.totalMarks} marks`} size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 0.5,
              bgcolor: isTimeCritical ? 'error.main' : isTimeLow ? 'warning.main' : 'primary.main',
              color: 'white',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TimeIcon fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'monospace' }}>
              {formatTime(timeRemaining)}
            </Typography>
          </Paper>

          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            <IconButton onClick={handleFullscreen} size="small">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={(answeredCount / totalQuestions) * 100}
        sx={{
          height: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: answeredCount === totalQuestions ? 'success.main' : 'primary.main',
          },
        }}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Question Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {currentQuestion && (
            <Paper elevation={1} sx={{ p: 3, maxWidth: 900, mx: 'auto', minHeight: '60vh' }}>
              <QuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onAnswer={(ans) => onAnswer(currentQuestion.id, ans)}
                isFlagged={isFlagged(currentQuestion.id)}
                onToggleFlag={() => onToggleFlag(currentQuestion.id)}
                questionNumber={currentQuestionIndex + 1}
              />
            </Paper>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, maxWidth: 900, mx: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<PrevIcon />}
              onClick={() => onNavigate('prev')}
              disabled={currentQuestionIndex === 0}
              size="large"
            >
              Previous
            </Button>

            <Button
              variant="contained"
              endIcon={<NextIcon />}
              onClick={() => onNavigate('next')}
              disabled={currentQuestionIndex === totalQuestions - 1}
              size="large"
            >
              Next
            </Button>
          </Box>
        </Box>

        {/* Question Palette Sidebar */}
        <Paper
          elevation={2}
          sx={{
            width: 280,
            minWidth: 280,
            p: 2,
            overflow: 'auto',
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Question Palette
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: '#e8f5e9', border: '1px solid #4caf50' }} />
              <Typography variant="caption">Answered</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: '#fff3e0', border: '1px solid #ff9800' }} />
              <Typography variant="caption">Flagged</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: '#e3f2fd', border: '1px solid #2196f3' }} />
              <Typography variant="caption">Current</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: '#fafafa', border: '1px solid #e0e0e0' }} />
              <Typography variant="caption">Unvisited</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q, idx);
              const colors = getStatusColor(status);
              return (
                <Box
                  key={q.id}
                  onClick={() => onNavigateTo(idx)}
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    color: colors.color,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                >
                  {idx + 1}
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Answered: <strong>{answeredCount}</strong> / {totalQuestions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Flagged: <strong>{flaggedCount}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unanswered: <strong>{totalQuestions - answeredCount}</strong>
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            startIcon={isSubmitting ? undefined : <ExitIcon />}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </Paper>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Submit Test?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Once submitted, you cannot modify your answers.
          </Alert>
          <Typography variant="body1" gutterBottom>
            You have answered <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions.
          </Typography>
          {answeredCount < totalQuestions && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              <strong>{totalQuestions - answeredCount}</strong> questions are still unanswered.
            </Typography>
          )}
          {flaggedCount > 0 && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              <strong>{flaggedCount}</strong> question(s) are flagged for review.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)} variant="outlined">
            Continue Test
          </Button>
          <Button
            onClick={() => { setShowSubmitConfirm(false); onSubmit(); }}
            variant="contained"
            color="success"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestInterface;