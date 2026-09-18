import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AutoAwesome, RestartAlt } from '@mui/icons-material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * Manual grading queue for test submissions.
 *
 * Shared by:
 *  - /faculty/assessments → "Manual grading" tab (faculty, hod, mentor)
 *  - /admin/test-reports  → "Assessments" page (admin, principal, hod, superadmin)
 *
 * Server policy: faculty see (and grade) their own tests' pending
 * submissions; hod/principal/admin/superadmin see every pending submission
 * in the college and may grade any of them.
 *
 * Speed features (manual grading is the bottleneck for descriptive papers):
 *  - Per-question quick marks (0 / half / full) that auto-sum into the manual total
 *  - One-click AI suggestion (suggestAssessmentGrading) with per-question
 *    marks + feedback, cached on the attempt row, applied in one click
 *  - "Publish" removes the card locally — no full list reload
 */

export interface PendingResponse {
  questionId: string;
  questionText: string;
  type: string;
  marks: number;
  answer: string;
}

export interface AiQuestionSuggestion {
  questionId: string;
  marks: number;
  feedback: string;
}

export interface AiSuggestion {
  perQuestion: AiQuestionSuggestion[];
  totalMarks: number;
  overallFeedback: string;
  provider?: string;
  model?: string;
  generatedAt?: string;
}

export interface PendingSubmission {
  id: string;
  testId: string;
  title: string;
  subject: string;
  studentId: string;
  studentName: string;
  regNo: string;
  autoScore: number;
  autoMax: number;
  manualMax: number;
  totalMarks: number;
  submittedAt: string;
  isLateSubmission: boolean;
  latePenaltyPercentage: number;
  responses: PendingResponse[];
  aiSuggestion?: AiSuggestion | null;
}

interface SuggestionResponse {
  success: boolean;
  cached: boolean;
  suggestion: AiSuggestion;
}

const halfOf = (marks: number): number => Math.round((marks / 2) * 4) / 4;
const round2 = (value: number): number => Math.round(value * 100) / 100;

export default function AssessmentGradingQueue({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [perQuestion, setPerQuestion] = useState<Record<string, Record<string, number>>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, AiSuggestion | null>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    if (!collegeId) {
      setSubmissions([]);
      onCountChange?.(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = httpsCallable<
        { collegeId: string },
        { submissions: PendingSubmission[] }
      >(functions, 'listPendingAssessmentSubmissions');
      const response = await list({ collegeId });
      setSubmissions(response.data.submissions);
      setAiSuggestion(Object.fromEntries(response.data.submissions.map((s) => [s.id, s.aiSuggestion || null])));
      onCountChange?.(response.data.submissions.length);
    } catch (err) {
      setSubmissions([]);
      setError(err instanceof Error ? err.message : 'Pending submissions could not be loaded.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  /** Quick-mark one question; the manual total follows the per-question sum. */
  const setQuickMark = (submission: PendingSubmission, questionId: string, marks: number) => {
    const current = { ...(perQuestion[submission.id] || {}) };
    current[questionId] = marks;
    setPerQuestion((prev) => ({ ...prev, [submission.id]: current }));
    setScores((prev) => ({ ...prev, [submission.id]: String(round2(Object.values(current).reduce((a, b) => a + b, 0))) }));
  };

  /** Editing the total directly switches the card to holistic mode (clears per-question marks). */
  const setTotalScore = (submissionId: string, value: string) => {
    setScores((prev) => ({ ...prev, [submissionId]: value }));
    if (perQuestion[submissionId]) {
      setPerQuestion((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    }
  };

  const requestAiSuggestion = async (submission: PendingSubmission, refresh = false) => {
    try {
      setAiLoading((prev) => ({ ...prev, [submission.id]: true }));
      setError(null);
      const suggest = httpsCallable<
        { studentAssessmentId: string; refresh?: boolean },
        SuggestionResponse
      >(functions, 'suggestAssessmentGrading');
      const response = await suggest({ studentAssessmentId: submission.id, refresh });
      setAiSuggestion((prev) => ({ ...prev, [submission.id]: response.data.suggestion }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI suggestion could not be generated.');
    } finally {
      setAiLoading((prev) => ({ ...prev, [submission.id]: false }));
    }
  };

  /** One click: fill per-question marks from the suggestion (clamped to each question's max). */
  const applyAiSuggestion = (submission: PendingSubmission) => {
    const suggestion = aiSuggestion[submission.id];
    if (!suggestion) return;
    const filled: Record<string, number> = {};
    for (const response of submission.responses) {
      const found = suggestion.perQuestion.find((entry) => entry.questionId === response.questionId);
      if (found) {
        filled[response.questionId] = Math.min(Math.max(0, round2(found.marks)), round2(response.marks));
      }
    }
    setPerQuestion((prev) => ({ ...prev, [submission.id]: filled }));
    setScores((prev) => ({ ...prev, [submission.id]: String(round2(Object.values(filled).reduce((a, b) => a + b, 0))) }));
  };

  const grade = async (submission: PendingSubmission) => {
    const manualScore = Number(scores[submission.id]);
    if (!Number.isFinite(manualScore) || manualScore < 0 || manualScore > submission.manualMax) {
      setError(`Manual score must be between 0 and ${submission.manualMax}.`);
      return;
    }
    const questionMarks = perQuestion[submission.id]
      ? Object.entries(perQuestion[submission.id]).map(([questionId, marks]) => ({ questionId, marks }))
      : undefined;
    try {
      setSavingId(submission.id);
      setError(null);
      const submitGrade = httpsCallable<
        {
          studentAssessmentId: string;
          manualScore: number;
          feedback?: string;
          manualMarks?: Array<{ questionId: string; marks: number }>;
        },
        { success: boolean }
      >(functions, 'gradeStudentAssessmentSubmission');
      await submitGrade({
        studentAssessmentId: submission.id,
        manualScore,
        feedback: feedback[submission.id] || '',
        ...(questionMarks ? { manualMarks: questionMarks } : {}),
      });
      // Local removal — the rest of the queue is already in memory, so no
      // full reload after every publish.
      setSubmissions((prev) => {
        const next = prev.filter((item) => item.id !== submission.id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The grade could not be published.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && submissions.length === 0 && (
        <Alert severity="info">No submissions are awaiting manual grading.</Alert>
      )}
      <Box sx={{ display: 'grid', gap: 2 }}>
        {submissions.map((submission) => {
          const questionMarks = perQuestion[submission.id] || {};
          const hasPerQuestion = Object.keys(questionMarks).length > 0;
          const manualScore = Number(scores[submission.id] || 0);
          const rawTotal = Math.max(0, submission.autoScore + (Number.isFinite(manualScore) ? manualScore : 0));
          const finalTotal = rawTotal * (1 - submission.latePenaltyPercentage / 100);
          const suggestion = aiSuggestion[submission.id] || null;
          const suggestionFor = (questionId: string): AiQuestionSuggestion | undefined =>
            suggestion?.perQuestion.find((entry) => entry.questionId === questionId);
          return (
            <Card key={submission.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
                  <Box>
                    <Typography variant="h6">{submission.title}</Typography>
                    <Typography color="text.secondary">
                      {submission.studentName || 'Student'}{submission.regNo ? ` · ${submission.regNo}` : ''}
                      {submission.subject ? ` · ${submission.subject}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip label={`Auto: ${submission.autoScore}/${submission.autoMax}`} color="info" />
                    <Chip label={`Manual: ${submission.manualMax} marks`} />
                    {submission.isLateSubmission && (
                      <Chip label={`${submission.latePenaltyPercentage}% late penalty`} color="warning" />
                    )}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {submission.responses.map((response, index) => {
                    const aiEntry = suggestionFor(response.questionId);
                    const setMark = (value: number) =>
                      setQuickMark(submission, response.questionId, Math.min(Math.max(0, value), response.marks));
                    return (
                      <Box key={response.questionId} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600, flex: '1 1 420px' }}>
                            {index + 1}. {response.questionText} ({response.marks} marks)
                          </Typography>
                          {aiEntry && (
                            <Tooltip title={aiEntry.feedback || 'AI suggestion'}>
                              <Chip
                                size="small"
                                color="secondary"
                                icon={<AutoAwesome />}
                                label={`AI: ${round2(aiEntry.marks)}/${response.marks}`}
                              />
                            </Tooltip>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                          {response.answer || 'Not answered'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mt: 1.25 }}>
                          <Button size="small" variant={questionMarks[response.questionId] === 0 ? 'contained' : 'outlined'} onClick={() => setMark(0)}>
                            0
                          </Button>
                          <Button size="small" variant={questionMarks[response.questionId] === halfOf(response.marks) ? 'contained' : 'outlined'} onClick={() => setMark(halfOf(response.marks))}>
                            ½
                          </Button>
                          <Button size="small" variant={questionMarks[response.questionId] === response.marks ? 'contained' : 'outlined'} onClick={() => setMark(response.marks)}>
                            Full
                          </Button>
                          <TextField
                            size="small"
                            type="number"
                            placeholder={`0–${response.marks}`}
                            value={questionMarks[response.questionId] ?? ''}
                            onChange={(event) => {
                              const value = event.target.value === '' ? 0 : Number(event.target.value);
                              setMark(Number.isFinite(value) ? value : 0);
                            }}
                            slotProps={{ htmlInput: { min: 0, max: response.marks, step: 0.25 } }}
                            sx={{ width: 110 }}
                          />
                          {aiEntry?.feedback && (
                            <Typography variant="caption" color="text.secondary" sx={{ flex: '1 1 260px' }}>
                              {aiEntry.feedback}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                {suggestion && (
                  <Alert
                    severity="info"
                    icon={<AutoAwesome />}
                    sx={{ mt: 2, alignItems: 'flex-start' }}
                    action={
                      <>
                        <IconButton size="small" aria-label="Re-run AI suggestion" onClick={() => void requestAiSuggestion(submission, true)} disabled={Boolean(aiLoading[submission.id])}>
                          <RestartAlt fontSize="small" />
                        </IconButton>
                        <Button size="small" color="primary" variant="contained" onClick={() => applyAiSuggestion(submission)}>
                          Use AI marks ({suggestion.totalMarks}/{submission.manualMax})
                        </Button>
                      </>
                    }
                  >
                    {suggestion.overallFeedback || 'The AI reviewed this submission.'}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                  <TextField
                    label={hasPerQuestion ? `Manual total (sum of ${Object.keys(questionMarks).length} questions)` : `Manual score (0–${submission.manualMax})`}
                    type="number"
                    size="small"
                    value={scores[submission.id] || ''}
                    onChange={(event) => setTotalScore(submission.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void grade(submission);
                      }
                    }}
                    slotProps={{ htmlInput: { min: 0, max: submission.manualMax, step: 0.25 } }}
                    helperText={hasPerQuestion ? 'Editing the total clears the per-question marks' : undefined}
                    sx={{ width: 260 }}
                  />
                  <TextField
                    label="Feedback (optional)"
                    size="small"
                    multiline
                    minRows={2}
                    value={feedback[submission.id] || ''}
                    onChange={(event) => setFeedback((current) => ({ ...current, [submission.id]: event.target.value }))}
                    sx={{ flex: '1 1 300px' }}
                  />
                  <Box sx={{ minWidth: 170, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={aiLoading[submission.id] ? <CircularProgress size={14} /> : <AutoAwesome />}
                      onClick={() => void requestAiSuggestion(submission, false)}
                      disabled={Boolean(aiLoading[submission.id]) || Boolean(suggestion)}
                    >
                      {suggestion ? 'AI suggestion ready' : 'Get AI suggestion'}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Final after penalty: {finalTotal.toFixed(2)}/{submission.totalMarks}
                    </Typography>
                    <Button
                      variant="contained"
                      disabled={savingId === submission.id || scores[submission.id] === undefined}
                      onClick={() => void grade(submission)}
                    >
                      {savingId === submission.id ? 'Publishing…' : 'Publish grade'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
