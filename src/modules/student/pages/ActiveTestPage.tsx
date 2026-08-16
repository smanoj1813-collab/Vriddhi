import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Radio, RadioGroup,
  FormControlLabel, FormControl, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, LinearProgress,
  Paper,
} from '@mui/material';
import {
  Timer, Bookmark, BookmarkBorder, NavigateNext, NavigateBefore, Send,
  Warning,
} from '@mui/icons-material';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const DEMO_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'What is the time complexity of binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
  },
  {
    id: 'q2',
    text: 'Which data structure uses LIFO (Last In First Out)?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctAnswer: 1,
  },
  {
    id: 'q3',
    text: 'In DBMS, which normal form eliminates transitive dependency?',
    options: ['1NF', '2NF', '3NF', 'BCNF'],
    correctAnswer: 2,
  },
  {
    id: 'q4',
    text: 'What does the OS scheduler primarily manage?',
    options: ['Memory allocation', 'Process execution', 'File storage', 'Device I/O'],
    correctAnswer: 1,
  },
  {
    id: 'q5',
    text: 'Which protocol is used for secure web browsing?',
    options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
    correctAnswer: 2,
  },
];

const TEST_DURATION_MINUTES = 30;

const ActiveTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(TEST_DURATION_MINUTES * 60);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSubmit = (auto = false) => {
    if (submitted) return;
    let correct = 0;
    DEMO_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    const finalScore = Math.round((correct / DEMO_QUESTIONS.length) * 100);

    console.log('[ActiveTest] Submitted. Score:', finalScore, '%');

    setSubmitted(true);
    setShowSubmitConfirm(false);

    setTimeout(() => {
      navigate(`/student/assessments/${testId}/result`, {
        state: { score: finalScore, total: DEMO_QUESTIONS.length, correct, answers },
      });
    }, 1500);
  };

  const currentQ = DEMO_QUESTIONS[currentQIndex];
  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length;
  const unansweredCount = DEMO_QUESTIONS.length - answeredCount;
  const isLast = currentQIndex === DEMO_QUESTIONS.length - 1;
  const progress = ((currentQIndex + 1) / DEMO_QUESTIONS.length) * 100;

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 4, borderRadius: 3 }}>
          <Send color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Test Submitted!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Redirecting to results...
          </Typography>
          <LinearProgress sx={{ mt: 3 }} />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          px: { xs: 2, md: 4 },
          py: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderRadius: 0,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Demo Assessment
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Question {currentQIndex + 1} of {DEMO_QUESTIONS.length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<Timer />}
            label={formatTime(timeRemaining)}
            color={timeRemaining < 300 ? 'error' : 'primary'}
            sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}
          />
          <Button
            variant="contained"
            color="success"
            startIcon={<Send />}
            onClick={() => setShowSubmitConfirm(true)}
          >
            Submit
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Left: Question */}
        <Box sx={{ flex: '1 1 600px' }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Chip label={`Q${currentQIndex + 1}`} color="primary" sx={{ fontWeight: 700 }} />
                <Button
                  size="small"
                  startIcon={flagged.has(currentQ.id) ? <Bookmark color="warning" /> : <BookmarkBorder />}
                  onClick={() => toggleFlag(currentQ.id)}
                  color={flagged.has(currentQ.id) ? 'warning' : 'inherit'}
                >
                  {flagged.has(currentQ.id) ? 'Flagged' : 'Flag for Review'}
                </Button>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, lineHeight: 1.5 }}>
                {currentQ.text}
              </Typography>

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={answers[currentQ.id] ?? ''}
                  onChange={(e) => handleAnswer(currentQ.id, Number(e.target.value))}
                >
                  {currentQ.options.map((opt, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        mb: 1.5,
                        borderRadius: 2,
                        borderColor: answers[currentQ.id] === idx ? 'primary.main' : 'divider',
                        bgcolor: answers[currentQ.id] === idx ? 'primary.50' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                      }}
                    >
                      <FormControlLabel
                        value={idx}
                        control={<Radio />}
                        label={
                          <Typography variant="body1" sx={{ py: 1 }}>
                            {opt}
                          </Typography>
                        }
                        sx={{ width: '100%', mx: 0, px: 2 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<NavigateBefore />}
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((p) => p - 1)}
                >
                  Previous
                </Button>
                {isLast ? (
                  <Button
                    variant="contained"
                    color="success"
                    endIcon={<Send />}
                    onClick={() => setShowSubmitConfirm(true)}
                  >
                    Finish & Submit
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    endIcon={<NavigateNext />}
                    onClick={() => setCurrentQIndex((p) => p + 1)}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ px: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        </Box>

        {/* Right: Question Palette */}
        <Box sx={{ flex: '0 0 280px' }}>
          <Card sx={{ borderRadius: 3, position: 'sticky', top: 100 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Question Palette
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {DEMO_QUESTIONS.map((q, idx) => {
                  const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = idx === currentQIndex;

                  return (
                    <Button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      sx={{
                        minWidth: 44,
                        height: 44,
                        borderRadius: 2,
                        fontWeight: 700,
                        border: isCurrent ? 2 : 1,
                        borderColor: isCurrent ? 'primary.main' : 'divider',
                        bgcolor: isAnswered
                          ? 'success.main'
                          : isFlagged
                            ? 'warning.light'
                            : 'grey.100',
                        color: isAnswered ? 'white' : 'text.primary',
                        '&:hover': {
                          bgcolor: isAnswered ? 'success.dark' : 'primary.100',
                        },
                      }}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <LegendItem color="success.main" label="Answered" />
                <LegendItem color="warning.light" label="Flagged" />
                <LegendItem color="grey.100" label="Not visited" />
                <LegendItem color="primary.main" label="Current" outline />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Summary
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {answeredCount} answered • {unansweredCount} unanswered • {flagged.size} flagged
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Submit Test?
        </DialogTitle>
        <DialogContent>
          {unansweredCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have <strong>{unansweredCount}</strong> unanswered question
              {unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?
            </Alert>
          )}
          <Typography variant="body1">
            Once submitted, you cannot change your answers. The test will be finalized and your score calculated.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)} variant="outlined">
            Continue Test
          </Button>
          <Button onClick={() => handleSubmit()} variant="contained" color="success">
            Yes, Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const LegendItem: React.FC<{ color: string; label: string; outline?: boolean }> = ({
  color,
  label,
  outline,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box
      sx={{
        width: 20,
        height: 20,
        borderRadius: 1,
        bgcolor: color,
        border: outline ? 2 : 0,
        borderColor: 'primary.main',
      }}
    />
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export default ActiveTestPage;