import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Radio, RadioGroup,
  FormControlLabel, FormControl, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, LinearProgress,
  Paper, CircularProgress,
} from '@mui/material';
import {
  Timer, Bookmark, BookmarkBorder, NavigateNext, NavigateBefore, Send,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { fetchActiveTest, saveStudentSubmission } from '../api/testApi';
import type { ActiveTest, PaperQuestion } from '../types/assessment';

const ActiveTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);

  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const collegeId = profile?.collegeId || user?.collegeId || '';
  const submitLock = useRef(false);

  // Load test
  useEffect(() => {
    if (!testId || !collegeId) return;
    let cancelled = false;
    setLoading(true);
    // testId from the route may be a studentAssessment id; resolve to assessmentId
    const load = async (assessmentId: string) => {
      const test = await fetchActiveTest(collegeId, assessmentId);
      if (cancelled) return;
      if (!test) {
        setLoadError('This test is not available. It may not have started yet or has been removed.');
        setLoading(false);
        return;
      }
      setActiveTest(test);
      setTimeRemaining((test.duration || 0) * 60);
      setLoading(false);
    };

    (async () => {
      // If the route id points to a studentAssessment, read its assessmentId
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/Firebase/config');
        const saSnap = await getDoc(doc(db, 'studentAssessments', testId));
        if (saSnap.exists()) {
          const data = saSnap.data() as any;
          if (data.assessmentId) {
            await load(data.assessmentId);
            return;
          }
        }
      } catch {
        // fall through to direct id
      }
      await load(testId);
    })();

    return () => { cancelled = true; };
  }, [testId, collegeId]);

  const doSubmit = useCallback(async () => {
    if (submitLock.current || !activeTest || !user) return;
    submitLock.current = true;
    setSubmitting(true);

    let correctCount = 0;
    activeTest.questions.forEach((q) => {
      const correctOpt = (q.options || []).find((o: any) => o.isCorrect);
      const correctId = correctOpt?.id;
      if (correctId && answers[q.id] === correctId) correctCount++;
    });

    try {
      if (profile?.id) {
        await saveStudentSubmission(
          collegeId,
          activeTest.assessmentId,
          profile.id,
          profile.name || user.name || '',
          profile.regNo || '',
          answers as unknown as Record<string, any>,
          timeRemaining,
          []
        );
      }
    } catch (err) {
      console.error('[ActiveTestPage] Failed to save submission:', err);
    }

    setSubmitted(true);
    setShowSubmitConfirm(false);
    setTimeout(() => {
      navigate(`/student/test/${testId}/result`, {
        state: {
          score: correctCount,
          totalQuestions: activeTest.questions.length,
          correct: correctCount,
          incorrect: Object.keys(answers).length - correctCount,
          unattempted: activeTest.questions.length - Object.keys(answers).length,
          title: activeTest.title,
          subject: activeTest.subject,
          totalMarks: activeTest.totalMarks,
          timeTaken: (activeTest.duration || 0) * 60 - timeRemaining,
        },
      });
    }, 1200);
  }, [activeTest, answers, collegeId, navigate, profile, testId, timeRemaining, user]);

  // Timer
  useEffect(() => {
    if (!activeTest || submitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, submitted, doSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading test…</Typography>
      </Box>
    );
  }

  if (loadError || !activeTest) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>{loadError || 'Test not found'}</Alert>
        <Button variant="outlined" onClick={() => navigate('/student/assessments')}>Back to Assessments</Button>
      </Box>
    );
  }

  const questions: PaperQuestion[] = activeTest.questions || [];
  if (questions.length === 0) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="info">This test has no questions yet.</Alert>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate('/student/assessments')}>Back</Button>
      </Box>
    );
  }

  const currentQ = questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isLast = currentQIndex === questions.length - 1;
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 4, borderRadius: 3 }}>
          <Send color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Test Submitted!</Typography>
          <Typography variant="body1" color="text.secondary">Redirecting to results...</Typography>
          <LinearProgress sx={{ mt: 3 }} />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Paper elevation={2} sx={{ position: 'sticky', top: 0, zIndex: 50, px: { xs: 2, md: 4 }, py: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderRadius: 0 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{activeTest.title}</Typography>
          <Typography variant="caption" color="text.secondary">Question {currentQIndex + 1} of {questions.length}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Timer />} label={formatTime(timeRemaining)} color={timeRemaining < 300 ? 'error' : 'primary'} sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }} />
          <Button variant="contained" color="success" startIcon={<Send />} onClick={() => setShowSubmitConfirm(true)} disabled={submitting}>Submit</Button>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 600px' }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Chip label={`Q${currentQIndex + 1}`} color="primary" sx={{ fontWeight: 700 }} />
                <Button size="small" startIcon={flagged.has(currentQ.id) ? <Bookmark color="warning" /> : <BookmarkBorder />} onClick={() => toggleFlag(currentQ.id)} color={flagged.has(currentQ.id) ? 'warning' : 'inherit'}>
                  {flagged.has(currentQ.id) ? 'Flagged' : 'Flag for Review'}
                </Button>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, lineHeight: 1.5 }}>{currentQ.text || currentQ.questionText}</Typography>

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup value={answers[currentQ.id] ?? ''} onChange={(e) => handleAnswer(currentQ.id, e.target.value)}>
                  {(currentQ.options || []).map((opt: any, idx: number) => (
                    <Paper key={opt.id || idx} variant="outlined" sx={{
                      mb: 1.5, borderRadius: 2,
                      borderColor: answers[currentQ.id] === opt.id ? 'primary.main' : 'divider',
                      bgcolor: answers[currentQ.id] === opt.id ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                    }}>
                      <FormControlLabel value={opt.id} control={<Radio />} label={<Typography variant="body1" sx={{ py: 1 }}>{opt.text}</Typography>} sx={{ width: '100%', mx: 0, px: 2 }} />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button variant="outlined" startIcon={<NavigateBefore />} disabled={currentQIndex === 0} onClick={() => setCurrentQIndex((p) => p - 1)}>Previous</Button>
                {isLast ? (
                  <Button variant="contained" color="success" endIcon={<Send />} onClick={() => setShowSubmitConfirm(true)}>Finish &amp; Submit</Button>
                ) : (
                  <Button variant="contained" endIcon={<NavigateNext />} onClick={() => setCurrentQIndex((p) => p + 1)}>Next</Button>
                )}
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ px: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Progress</Typography>
              <Typography variant="caption" color="text.secondary">{Math.round(progress)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        </Box>

        <Box sx={{ flex: '0 0 280px' }}>
          <Card sx={{ borderRadius: 3, position: 'sticky', top: 100 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Question Palette</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = idx === currentQIndex;
                  return (
                    <Button key={q.id} onClick={() => setCurrentQIndex(idx)} sx={{
                      minWidth: 44, height: 44, borderRadius: 2, fontWeight: 700,
                      border: isCurrent ? 2 : 1, borderColor: isCurrent ? 'primary.main' : 'divider',
                      bgcolor: isAnswered ? 'success.main' : isFlagged ? 'warning.light' : 'grey.100',
                      color: isAnswered ? 'white' : 'text.primary',
                      '&:hover': { bgcolor: isAnswered ? 'success.dark' : 'primary.100' },
                    }}>{idx + 1}</Button>
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
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Summary</Typography>
                <Typography variant="caption" color="text.secondary">{answeredCount} answered • {unansweredCount} unanswered • {flagged.size} flagged</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Warning color="warning" />Submit Test?</DialogTitle>
        <DialogContent>
          {unansweredCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?</Alert>
          )}
          <Typography variant="body1">Once submitted, you cannot change your answers. The test will be finalized.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)} variant="outlined">Continue Test</Button>
          <Button onClick={doSubmit} variant="contained" color="success" disabled={submitting}>{submitting ? 'Submitting…' : 'Yes, Submit'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const LegendItem: React.FC<{ color: string; label: string; outline?: boolean }> = ({ color, label, outline }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: color, border: outline ? 2 : 0, borderColor: 'primary.main' }} />
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
);

export default ActiveTestPage;
