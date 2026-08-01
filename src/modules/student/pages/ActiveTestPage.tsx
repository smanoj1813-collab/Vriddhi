import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Radio, RadioGroup,
  FormControlLabel, Checkbox, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Chip, Paper, Divider,
  IconButton, Tooltip, LinearProgress, AppBar, Toolbar,
} from "@mui/material";
import {
  Timer, Flag, NavigateNext, NavigateBefore, Send,
  Warning, Fullscreen, FullscreenExit, Visibility,
  VisibilityOff, CheckCircle, Circle,
} from "@mui/icons-material";
import { useActiveTest } from '../../../hooks/useAssessment';
import { PaperQuestion, StudentAnswer } from '../../../types/assessment';
import { MathRenderer } from '../components/MathRenderer';

interface ProctoringWarning {
  id: string;
  type: "tab_switch" | "copy_paste" | "right_click" | "fullscreen_exit" | "keyboard_shortcut";
  message: string;
  timestamp: Date;
  count: number;
}

const ActiveTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const collegeId = localStorage.getItem("collegeId") || "";
  const studentId = localStorage.getItem("studentId") || "";
  const studentName = localStorage.getItem("studentName") || "";
  const studentRegNo = localStorage.getItem("studentRegNo") || "";
  const {
    activeTest,
    timeRemaining,
    loading,
    error,
    isSubmitting,
    start,
    saveCurrentAnswer,
    navigateToQuestion,
    toggleFlagQuestion,
    submit,
    logProctorEvent,
  } = useActiveTest(collegeId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, Partial<StudentAnswer>>>({});
  const [localFlagged, setLocalFlagged] = useState<Set<string>>(new Set());
  const [testStarted, setTestStarted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [proctoringWarnings, setProctoringWarnings] = useState<ProctoringWarning[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPalette, setShowPalette] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningCounts = useRef<Record<string, number>>({});

  const enterFullscreen = useCallback(async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen();
      else if ((elem as any).msRequestFullscreen) await (elem as any).msRequestFullscreen();
    } catch (err) { console.error("Fullscreen error:", err); }
  }, []);

  const checkFullscreen = useCallback(() => {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement);
  }, []);

  useEffect(() => {
    if (testId && !testStarted && !activeTest) {
      start(testId, studentId, studentName, studentRegNo)
        .then(() => {
          setTestStarted(true);
          enterFullscreen();
        })
        .catch((err: any) => console.error("Failed to start test:", err));
    }
  }, [testId, testStarted, activeTest, start, studentId, studentName, studentRegNo, enterFullscreen]);

  useEffect(() => {
    if (!activeTest) return;
    const handleFsChange = () => {
      const fs = checkFullscreen();
      setIsFullscreen(fs);
      if (!fs && testStarted) {
        addProctoringWarning("fullscreen_exit", "You exited fullscreen mode. Return immediately.");
        logProctorEvent({ type: "dev_tools", details: "User exited fullscreen" });
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [activeTest, testStarted, checkFullscreen, logProctorEvent]);

  useEffect(() => {
    if (!activeTest) return;
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted) {
        addProctoringWarning("tab_switch", "Tab switching detected! Stay on the test page.");
        logProctorEvent({ type: "tab_switch", details: "Tab visibility changed" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeTest, testStarted, logProctorEvent]);

  useEffect(() => {
    if (!activeTest) return;
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addProctoringWarning("copy_paste", "Copy/Paste is not allowed during the test.");
      logProctorEvent({ type: "copy_paste", details: "Copy/paste attempted" });
      return false;
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addProctoringWarning("right_click", "Right-click is disabled during the test.");
      return false;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ["c", "v", "x", "a", "p", "s", "f"];
        if (blockedKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          addProctoringWarning("keyboard_shortcut", `Shortcut blocked: ${e.ctrlKey ? "Ctrl+" : "Cmd+"}${e.key.toUpperCase()}`);
          return false;
        }
      }
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        addProctoringWarning("keyboard_shortcut", "Alt+Tab is blocked.");
      }
      if (e.key === "F12" || e.key === "PrintScreen") {
        e.preventDefault();
        addProctoringWarning("keyboard_shortcut", `${e.key} is blocked.`);
      }
    };
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTest, logProctorEvent]);

  const addProctoringWarning = (type: ProctoringWarning["type"], message: string) => {
    const count = (warningCounts.current[type] || 0) + 1;
    warningCounts.current[type] = count;
    const warning: ProctoringWarning = {
      id: `${type}-${Date.now()}`, type, message: `${message} (Warning ${count}/3)`,
      timestamp: new Date(), count,
    };
    setProctoringWarnings((prev) => [...prev, warning]);
    setWarningMessage(warning.message);
    setShowWarningDialog(true);
    if (count >= 3) {
      setTimeout(() => { handleAutoSubmit("Proctoring violation limit exceeded."); }, 2000);
    }
  };

  const handleAnswerChange = (questionId: string, answerUpdate: Partial<StudentAnswer>) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...answerUpdate } }));
    saveCurrentAnswer(answerUpdate);
  };

  const handleFlagQuestion = (questionId: string) => {
    setLocalFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
      return next;
    });
    toggleFlagQuestion(questionId);
  };

  const goToQuestion = (index: number) => {
    if (!activeTest) return;
    if (index >= 0 && index < activeTest.questions.length) {
      setCurrentQuestionIndex(index);
      navigateToQuestion(index);
    }
  };
  const goNext = () => goToQuestion(currentQuestionIndex + 1);
  const goPrev = () => goToQuestion(currentQuestionIndex - 1);

  const handleSubmit = async () => {
    if (!testId || !activeTest) return;
    const confirmed = window.confirm("Submit? You cannot change answers after submission.");
    if (!confirmed) return;
    await submit();
    navigate(`/student/assessments/${testId}/result`);
  };

  const handleAutoSubmit = async (reason?: string) => {
    if (!testId || !activeTest) return;
    await submit();
    navigate(`/student/assessments/${testId}/result`);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getQuestionStatus = (question: PaperQuestion, index: number) => {
    const localAns = question.questionId ? localAnswers[question.questionId] : undefined;
    const hasAnswer = !!(localAns?.selectedOptionIds?.length || localAns?.textAnswer || localAns?.matchedPairs?.length);
    const isFlagged = (question.questionId && localFlagged.has(question.questionId)) || 
  (question.questionId && activeTest?.flaggedQuestions?.includes(question.questionId)) || false;
    const isCurrent = index === currentQuestionIndex;
    if (isCurrent) return "current";
    if (isFlagged && hasAnswer) return "answered-flagged";
    if (isFlagged) return "flagged";
    if (hasAnswer) return "answered";
    return "unanswered";
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading test...</Typography>
      </Box>
    );
  }

  if (error || !activeTest) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || "Test not found"}</Alert>
      </Box>
    );
  }

  const questions = activeTest.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter((q: PaperQuestion) => {
    const ans = q.questionId ? localAnswers[q.questionId] : undefined;
    return !!(ans?.selectedOptionIds?.length || ans?.textAnswer || ans?.matchedPairs?.length);
  }).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLowTime = timeRemaining < 300;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: "background.paper" }}>
        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1, py: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              Active Test
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentQuestionIndex + 1} of {questions.length}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip icon={<Timer fontSize="small" />} label={formatTime(timeRemaining)}
              color={isLowTime ? "error" : "default"}
              sx={{
                fontWeight: 700, fontSize: "1rem", px: 1,
                animation: isLowTime ? "pulse 1s infinite" : "none",
                "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
              }} />
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton onClick={() => (isFullscreen ? document.exitFullscreen() : enterFullscreen())}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Question Palette">
              <IconButton onClick={() => setShowPalette(!showPalette)}>
                {showPalette ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Button variant="contained" color="primary" size="small" startIcon={<Send />}
              onClick={() => setShowSubmitDialog(true)}>
              Submit
            </Button>
          </Box>
        </Toolbar>
        <LinearProgress variant="determinate" value={progress}
          sx={{
            height: 4, bgcolor: "grey.100",
            "& .MuiLinearProgress-bar": { bgcolor: isLowTime ? "error.main" : "primary.main" },
          }} />
      </AppBar>

      {proctoringWarnings.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Proctoring Alert: {proctoringWarnings[proctoringWarnings.length - 1].message}
          </Typography>
        </Alert>
      )}

      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Box sx={{ flex: 1, overflow: "auto", p: { xs: 2, md: 4 } }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Box>
                  <Chip label={`Q${currentQuestionIndex + 1}`} color="primary" size="small"
                    sx={{ fontWeight: 700, mr: 1 }} />
                  <Chip label={(currentQuestion.questionType || 'mcq_single').replace(/_/g, " ")} variant="outlined" size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {currentQuestion.marks} marks
                  </Typography>
                </Box>
                <Button size="small" startIcon={<Flag color={localFlagged.has(currentQuestion.questionId) ? "warning" : "action"} />}
                  onClick={() => handleFlagQuestion(currentQuestion.questionId)}
                  color={localFlagged.has(currentQuestion.questionId) ? "warning" : "inherit"}>
                  {localFlagged.has(currentQuestion.questionId) ? "Flagged" : "Flag"}
                </Button>
              </Box>

              <Box sx={{ mb: 3 }}>
                <MathRenderer text={currentQuestion.questionText || ''} />
              </Box>

              {currentQuestion.imageUrl && (
                <Box sx={{ mb: 3, textAlign: "center" }}>
                  <img src={currentQuestion.imageUrl} alt="Question"
                    style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }} />
                </Box>
              )}

              <AnswerInput question={currentQuestion}
                answer={localAnswers[currentQuestion.questionId]}
                onChange={(ans) => handleAnswerChange(currentQuestion.questionId, ans)} />
            </CardContent>
          </Card>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <Button variant="outlined" startIcon={<NavigateBefore />}
              disabled={currentQuestionIndex === 0 || !activeTest.allowNavigation} onClick={goPrev}>
              Previous
            </Button>
            <Button variant="outlined" endIcon={<NavigateNext />}
              disabled={currentQuestionIndex === questions.length - 1} onClick={goNext}>
              Next
            </Button>
          </Box>
        </Box>

        {showPalette && (
          <Paper sx={{
            width: 280, minWidth: 280, borderLeft: 1, borderColor: "divider",
            overflow: "auto", p: 2, display: { xs: "none", md: "block" },
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>Question Palette</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <LegendItem color="success.main" label="Answered" />
              <LegendItem color="warning.main" label="Flagged" />
              <LegendItem color="error.main" label="Current" />
              <LegendItem color="grey.400" label="Unanswered" />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
              {questions.map((q: PaperQuestion, idx: number) => {
                const status = getQuestionStatus(q, idx);
                const colors: Record<string, { bg: string; color: string }> = {
                  current: { bg: "error.main", color: "white" },
                  answered: { bg: "success.main", color: "white" },
                  flagged: { bg: "warning.main", color: "white" },
                  "answered-flagged": { bg: "warning.dark", color: "white" },
                  unanswered: { bg: "grey.200", color: "text.primary" },
                };
                const c = colors[status];
                return (
                  <Button key={q.questionId} onClick={() => goToQuestion(idx)} sx={{
                    minWidth: 0, width: 40, height: 40, p: 0, borderRadius: 1,
                    bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: "0.875rem",
                    border: status === "current" ? 2 : 0, borderColor: "error.dark",
                    "&:hover": { bgcolor: c.bg, opacity: 0.9 },
                  }}>
                    {idx + 1}
                  </Button>
                );
              })}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <SummaryRow label="Answered" value={answeredCount} total={questions.length} color="success" />
              <SummaryRow label="Flagged" value={localFlagged.size} total={questions.length} color="warning" />
              <SummaryRow label="Unanswered" value={questions.length - answeredCount} total={questions.length} color="error" />
            </Box>
            <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} startIcon={<Send />}
              onClick={() => setShowSubmitDialog(true)}>
              Submit Test
            </Button>
          </Paper>
        )}
      </Box>

      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Test?</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You have answered {answeredCount} out of {questions.length} questions.
          </Alert>
          {answeredCount < questions.length && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {questions.length - answeredCount} question(s) unanswered. Submit anyway?
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Once submitted, you cannot change answers. Test will be graded immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Yes, Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showWarningDialog} onClose={() => setShowWarningDialog(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" />Proctoring Warning
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">{warningMessage}</Alert>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Repeated violations will result in automatic test submission.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarningDialog(false)} variant="contained">I Understand</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const AnswerInput: React.FC<{
  question: PaperQuestion;
  answer: Partial<StudentAnswer> | undefined;
  onChange: (answer: Partial<StudentAnswer>) => void;
}> = ({ question, answer, onChange }) => {
  switch (question.questionType) {
    case "mcq_single":
      return (
        <RadioGroup value={answer?.selectedOptionIds?.[0] || ""} onChange={(e) => onChange({ selectedOptionIds: [e.target.value] })}>
          {question.options?.map((option: any, idx: number) => (
            <FormControlLabel key={idx} value={option.id} control={<Radio />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip size="small" label={String.fromCharCode(65 + idx)} sx={{ minWidth: 28 }} />
                  <MathRenderer text={option.text || ''} inline />
                </Box>
              }
              sx={{ mb: 1, p: 1, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }} />
          ))}
        </RadioGroup>
      );

    case "mcq_multiple":
      return (
        <Box>
          {question.options?.map((option: any, idx: number) => {
            const selectedIds = answer?.selectedOptionIds || [];
            const isSelected = selectedIds.includes(option.id);
            return (
              <FormControlLabel key={idx}
                control={<Checkbox checked={isSelected} onChange={(e) => {
                  const newIds = e.target.checked
                    ? [...selectedIds, option.id]
                    : selectedIds.filter((id: string) => id !== option.id);
                  onChange({ selectedOptionIds: newIds });
                }} />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip size="small" label={String.fromCharCode(65 + idx)} sx={{ minWidth: 28 }} />
                    <MathRenderer text={option.text || ''} inline />
                  </Box>
                }
                sx={{ mb: 1, p: 1, borderRadius: 2, display: "flex", "&:hover": { bgcolor: "action.hover" } }} />
            );
          })}
        </Box>
      );

    case "true_false":
      return (
        <RadioGroup value={answer?.textAnswer || ""} onChange={(e) => onChange({ textAnswer: e.target.value })}>
          <FormControlLabel value="true" control={<Radio />} label="True" sx={{ mb: 1 }} />
          <FormControlLabel value="false" control={<Radio />} label="False" sx={{ mb: 1 }} />
        </RadioGroup>
      );

    case "fill_in_blank":
      return (
        <TextField fullWidth variant="outlined" placeholder="Type your answer here..."
          value={answer?.textAnswer || ""} onChange={(e) => onChange({ textAnswer: e.target.value })} sx={{ mt: 1 }} />
      );

    case "short_answer":
      return (
        <TextField fullWidth multiline rows={3} variant="outlined" placeholder="Write your short answer..."
          value={answer?.textAnswer || ""} onChange={(e) => onChange({ textAnswer: e.target.value })} sx={{ mt: 1 }} />
      );

    case "long_answer":
      return (
        <TextField fullWidth multiline rows={8} variant="outlined" placeholder="Write your detailed answer..."
          value={answer?.textAnswer || ""} onChange={(e) => onChange({ textAnswer: e.target.value })} sx={{ mt: 1 }} />
      );

    case "match_following":
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {question.options?.map((option: any, idx: number) => (
            <Box key={idx} sx={{
              display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "grey.50", borderRadius: 2,
            }}>
              <Box sx={{ minWidth: 120 }}>
                <MathRenderer text={option.text || ''} inline />
              </Box>
              <Typography color="text.secondary">→</Typography>
              <TextField size="small" placeholder="Match with..."
                value={answer?.matchedPairs?.find((p: any) => p.left === option.text)?.right || ""}
                onChange={(e) => {
                  const current = answer?.matchedPairs || [];
                  const existing = current.findIndex((p: any) => p.left === option.text);
                  const updated = existing >= 0
                    ? current.map((p: any, i: number) => i === existing ? { left: option.text, right: e.target.value } : p)
                    : [...current, { left: option.text, right: e.target.value }];
                  onChange({ matchedPairs: updated });
                }} sx={{ flex: 1 }} />
            </Box>
          ))}
        </Box>
      );

    case "assertion_reason":
      return (
        <Box>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Assertion</Typography>
            <MathRenderer text={question.questionText || ''} />
          </Paper>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>Select the correct option:</Typography>
          <RadioGroup value={answer?.textAnswer || ""} onChange={(e) => onChange({ textAnswer: e.target.value })}>
            <FormControlLabel value="A" control={<Radio />}
              label="Both Assertion and Reason are true and Reason is the correct explanation."
              sx={{ mb: 1 }} />
            <FormControlLabel value="B" control={<Radio />}
              label="Both are true but Reason is not the correct explanation."
              sx={{ mb: 1 }} />
            <FormControlLabel value="C" control={<Radio />}
              label="Assertion is true but Reason is false."
              sx={{ mb: 1 }} />
            <FormControlLabel value="D" control={<Radio />}
              label="Assertion is false but Reason is true."
              sx={{ mb: 1 }} />
          </RadioGroup>
        </Box>
      );

    default:
      return <Typography color="error">Unsupported question type: {question.questionType}</Typography>;
  }
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
    <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color }} />
    <Typography variant="caption">{label}</Typography>
  </Box>
);

const SummaryRow: React.FC<{ label: string; value: number; total: number; color: "success" | "warning" | "error" }> =
  ({ label, value, total, color }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Circle sx={{ fontSize: 10, color: `${color}.main` }} />
        <Typography variant="body2">{label}</Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}/{total}</Typography>
    </Box>
  );

export default ActiveTestPage;
