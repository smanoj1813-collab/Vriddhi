import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, LinearProgress, Paper, CircularProgress,
} from '@mui/material';
import {
  Timer, NavigateNext, NavigateBefore, Send, PlayArrow,
  Warning, Fullscreen, Security, Save,
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import {
  fetchActiveTest,
  autosaveStudentAssessment,
  submitStudentAssessment,
  logProctorEvent,
} from '../api/testApi';
import QuestionRenderer from '../components/QuestionRenderer';
import { MathRenderer } from '../components/MathRenderer';
import type { ActiveTest, BasicProctorEvent, StudentAnswer } from '../types/assessment';

const AUTOSAVE_INTERVAL_MS = 15_000;

const ActiveTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);

  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEnterGate, setShowEnterGate] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<StudentAnswer>>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const collegeId = profile?.collegeId || user?.collegeId || '';
  const studentId = profile?.id || '';

  // refs mirror state for intervals/closures
  const submitLock = useRef(false);
  const answersRef = useRef<Record<string, Partial<StudentAnswer>>>({});
  const proctorEventsRef = useRef<BasicProctorEvent[]>([]);
  const timeRemainingRef = useRef(0);
  const activeTestRef = useRef<ActiveTest | null>(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { activeTestRef.current = activeTest; }, [activeTest]);

  /* ─── load ─── */
  useEffect(() => {
    if (!testId || !collegeId || !studentId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const test = await fetchActiveTest(collegeId, testId, studentId);
        if (cancelled) return;
        if (!test) {
          setLoadError('This test is not available. It may have been removed.');
          setLoading(false);
          return;
        }
        if (test.studentStatus === 'submitted' || test.studentStatus === 'graded') {
          navigate(`/student/test/${testId}/result`, { replace: true });
          return;
        }
        if (test.studentStatus === 'not_started') {
          // Must go through the instructions page so the row transitions correctly
          navigate(`/student/test/${testId}/instructions`, { replace: true });
          return;
        }
        if (test.questions.length === 0) {
          setActiveTest(test);
          setLoadError('This test has no questions yet. Please contact your faculty.');
          setLoading(false);
          return;
        }
        // in_progress → resume with restored answers + remaining time from startedAt
        const remaining = Math.max(0, Math.floor((new Date(test.endsAt).getTime() - Date.now()) / 1000));
        setActiveTest(test);
        setAnswers(test.answers || {});
        answersRef.current = test.answers || {};
        setTimeRemaining(remaining);
        timeRemainingRef.current = remaining;
        setCurrentQIndex(0);
        setLoading(false);
        if (remaining <= 0) void doSubmit(true);
      } catch {
        if (!cancelled) {
          setLoadError('Could not load this test.');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, collegeId, studentId]);

  /* ─── proctoring: event buffer + immediate log ─── */
  const recordProctorEvent = useCallback(
    (type: BasicProctorEvent['type'], details?: Record<string, unknown>) => {
      const event: BasicProctorEvent = { type, at: new Date().toISOString(), details };
      proctorEventsRef.current = [...proctorEventsRef.current.slice(-199), event];
      const t = activeTestRef.current;
      if (t?.enableProctoring && t.studentAssessmentId) {
        // best-effort immediate log; buffered copy persists with autosave/submit
        void logProctorEvent(t.collegeId, t.testId, t.studentAssessmentId, studentId, event).catch(() => undefined);
      }
    },
    [studentId]
  );

  /* ─── submit ─── */
  const doSubmit = useCallback(
    async (auto = false) => {
      const t = activeTestRef.current;
      if (!t || submitLock.current || !studentId) return;
      submitLock.current = true;
      setSubmitting(true);
      if (auto) recordProctorEvent('auto_submit', { remaining: 0 });

      const durationSec = (t.duration || 0) * 60;
      const timeSpent = Math.max(0, durationSec - timeRemainingRef.current);

      try {
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
        await submitStudentAssessment({
          collegeId: t.collegeId,
          testId: t.testId,
          student: {
            id: studentId,
            name: profile?.name || user?.name || '',
            regNo: profile?.regNo || '',
          },
          studentAssessmentId: t.studentAssessmentId,
          answers: answersRef.current,
          timeSpent,
          proctorEvents: proctorEventsRef.current,
          autoSubmitted: auto,
        });
        setSubmitted(true);
        setShowSubmitConfirm(false);
        setTimeout(() => navigate(`/student/test/${t.testId}/result`, { replace: true }), 1200);
      } catch (err) {
        submitLock.current = false;
        setSubmitting(false);
        setLoadError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
      }
    },
    [navigate, profile, recordProctorEvent, studentId, user]
  );

  /* ─── timer ─── */
  useEffect(() => {
    if (!activeTest || submitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void doSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, submitted, doSubmit]);

  /* ─── autosave ─── */
  const runAutosave = useCallback(async () => {
    const t = activeTestRef.current;
    if (!t || !t.studentAssessmentId || submitted || submitLock.current) return;
    const durationSec = (t.duration || 0) * 60;
    const timeSpent = Math.max(0, durationSec - timeRemainingRef.current);
    try {
      await autosaveStudentAssessment(
        t.studentAssessmentId,
        Object.values(answersRef.current).filter((a): a is StudentAnswer => !!a?.questionId),
        timeSpent,
        proctorEventsRef.current
      );
      setLastSavedAt(new Date());
    } catch {
      recordProctorEvent('autosave_error');
    }
  }, [submitted, recordProctorEvent]);

  useEffect(() => {
    if (!activeTest || submitted) return;
    const id = setInterval(() => void runAutosave(), AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeTest, submitted, runAutosave]);

  /* ─── proctoring listeners (mounted while a test is active) ─── */
  useEffect(() => {
    if (!activeTest || submitted) return;
    const proctored = !!activeTest.enableProctoring;

    const warn = (msg: string) => {
      setProctorWarning(msg);
      setTimeout(() => setProctorWarning(null), 4000);
    };

    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => c + 1);
        recordProctorEvent('tab_switch', { hidden: true });
        if (proctored) warn('Tab switch detected and logged. Stay on the test window.');
      }
    };
    const onBlur = () => {
      recordProctorEvent('window_blur');
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && proctored && !submitLock.current) {
        recordProctorEvent('fullscreen_exit');
        warn('You exited fullscreen. Re-enter to continue.');
      }
    };
    const onCopy = (e: Event) => {
      if (!proctored) return;
      recordProctorEvent('copy_attempt');
      e.preventDefault();
      warn('Copying is disabled during this test.');
    };
    const onPaste = (e: Event) => {
      if (!proctored) return;
      recordProctorEvent('paste_attempt');
      e.preventDefault();
      warn('Pasting is disabled during this test.');
    };
    const onContextMenu = (e: Event) => {
      if (!proctored) return;
      recordProctorEvent('context_menu');
      e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!proctored) return;
      const key = e.key.toLowerCase();
      const blocked =
        (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'p', 's'].includes(key) ||
        key === 'printscreen' ||
        key === 'f12' ||
        (e.altKey && key === 'tab');
      if (blocked) {
        recordProctorEvent('keyboard_shortcut', { key: e.key });
        e.preventDefault();
        warn('This shortcut is disabled during the test.');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeTest, submitted, recordProctorEvent]);

  /* ─── helpers ─── */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: Partial<StudentAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...answer,
        questionId,
        visitedAt: prev[questionId]?.visitedAt || new Date().toISOString(),
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        isFlagged: !prev[questionId]?.isFlagged,
        visitedAt: prev[questionId]?.visitedAt || new Date().toISOString(),
      },
    }));
  };

  const enterTest = async () => {
    const t = activeTestRef.current;
    setShowEnterGate(false);
    if (t?.enableProctoring && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        recordProctorEvent('fullscreen_denied');
      }
    }
  };

  /* ─── render ─── */
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

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 4, borderRadius: 3 }}>
          <Send color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Test Submitted!</Typography>
          <Typography variant="body1" color="text.secondary">Redirecting to results…</Typography>
          <LinearProgress sx={{ mt: 3 }} />
        </Card>
      </Box>
    );
  }

  const questions = activeTest.questions;
  if (questions.length === 0) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="info">This test has no questions yet.</Alert>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate('/student/assessments')}>Back</Button>
      </Box>
    );
  }

  const currentQ = questions[currentQIndex];
  const isAnswered = (qid: string) => {
    const a = answers[qid];
    if (!a) return false;
    return !!(a.selectedOptionId || a.selectedOptionIds?.length || (a.textAnswer && a.textAnswer.trim()) || a.numericalAnswer !== undefined);
  };
  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;
  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;
  const unansweredCount = questions.length - answeredCount;
  const isLast = currentQIndex === questions.length - 1;
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  if (showEnterGate) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 520, width: '100%', textAlign: 'center', p: 4, borderRadius: 3 }}>
          <Fullscreen color="primary" sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {activeTest.resumed ? 'Resume your test' : 'Ready to begin'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <MathRenderer text={activeTest.title} inline /> · {questions.length} questions ·{' '}
            {formatTime(timeRemaining)} remaining
          </Typography>
          {activeTest.enableProctoring && (
            <Alert severity="warning" sx={{ textAlign: 'left', mb: 2 }} icon={<Security />}>
              Proctoring active: the test opens in fullscreen. Tab switches, clipboard use and
              shortcut keys are logged.
            </Alert>
          )}
          {timeRemaining <= 300 && (
            <Alert severity="error" sx={{ mb: 2 }}>Hurry — less than 5 minutes left!</Alert>
          )}
          <Button variant="contained" color="success" size="large" startIcon={<PlayArrow />} onClick={enterTest} sx={{ px: 5, py: 1.5, fontWeight: 700 }}>
            {activeTest.resumed ? 'Re-enter Test' : 'Enter Test'}
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Paper elevation={2} sx={{ position: 'sticky', top: 0, zIndex: 50, px: { xs: 2, md: 4 }, py: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderRadius: 0 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{activeTest.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            Question {currentQIndex + 1} of {questions.length}
            {lastSavedAt && ` · saved ${lastSavedAt.toLocaleTimeString('en-IN')}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {activeTest.enableProctoring && tabSwitchCount > 0 && (
            <Chip icon={<Warning />} label={`${tabSwitchCount} warning${tabSwitchCount > 1 ? 's' : ''}`} color="warning" size="small" />
          )}
          <Chip icon={<Timer />} label={formatTime(timeRemaining)} color={timeRemaining < 300 ? 'error' : 'primary'} sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }} />
          <Button variant="contained" color="success" startIcon={<Send />} onClick={() => setShowSubmitConfirm(true)} disabled={submitting}>Submit</Button>
        </Box>
      </Paper>

      {proctorWarning && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, boxShadow: 6, maxWidth: '90vw' }}>
          {proctorWarning}
        </Alert>
      )}

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 600px' }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <QuestionRenderer
                question={currentQ}
                answer={answers[currentQ.id]}
                onAnswer={(ans) => handleAnswer(currentQ.id, ans)}
                isFlagged={!!answers[currentQ.id]?.isFlagged}
                onToggleFlag={() => toggleFlag(currentQ.id)}
                questionNumber={currentQIndex + 1}
              />

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
                  const answered = isAnswered(q.id);
                  const flagged = !!answers[q.id]?.isFlagged;
                  const isCurrent = idx === currentQIndex;
                  return (
                    <Button key={q.id} onClick={() => setCurrentQIndex(idx)} sx={{
                      minWidth: 44, height: 44, borderRadius: 2, fontWeight: 700,
                      border: isCurrent ? 2 : 1, borderColor: isCurrent ? 'primary.main' : 'divider',
                      bgcolor: answered ? 'success.main' : flagged ? 'warning.light' : 'grey.100',
                      color: answered ? 'white' : 'text.primary',
                      '&:hover': { bgcolor: answered ? 'success.dark' : 'primary.100' },
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
                <Typography variant="caption" color="text.secondary">
                  {answeredCount} answered • {unansweredCount} unanswered • {flaggedCount} flagged
                </Typography>
                <Button size="small" startIcon={<Save />} onClick={() => void runAutosave()} sx={{ mt: 1 }}>
                  Save now
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Warning color="warning" />Submit Test?</DialogTitle>
        <DialogContent>
          {unansweredCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?
            </Alert>
          )}
          <Typography variant="body1">Once submitted, you cannot change your answers. The test will be finalized.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)} variant="outlined">Continue Test</Button>
          <Button onClick={() => void doSubmit(false)} variant="contained" color="success" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Yes, Submit'}
          </Button>
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
