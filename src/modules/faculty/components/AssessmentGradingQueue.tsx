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
  TextField,
  Typography,
} from '@mui/material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * Manual grading queue for test submissions.
 *
 * Shared by:
 *  - /faculty/assessments → "Manual grading" tab (faculty, hod, mentor)
 *  - /admin/test-reports  → "Manual grading" tab (admin, principal, hod, superadmin)
 *
 * Server policy: faculty see (and grade) their own tests' pending
 * submissions; hod/principal/admin/superadmin see every pending submission
 * in the college and may grade any of them.
 */

export interface PendingResponse {
  questionId: string;
  questionText: string;
  type: string;
  marks: number;
  answer: string;
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
}

export default function AssessmentGradingQueue({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
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

  const grade = async (submission: PendingSubmission) => {
    const manualScore = Number(scores[submission.id]);
    if (!Number.isFinite(manualScore) || manualScore < 0 || manualScore > submission.manualMax) {
      setError(`Manual score must be between 0 and ${submission.manualMax}.`);
      return;
    }
    try {
      setSavingId(submission.id);
      setError(null);
      const submitGrade = httpsCallable<
        { studentAssessmentId: string; manualScore: number; feedback: string },
        { success: boolean }
      >(functions, 'gradeStudentAssessmentSubmission');
      await submitGrade({
        studentAssessmentId: submission.id,
        manualScore,
        feedback: feedback[submission.id] || '',
      });
      setScores((current) => {
        const next = { ...current };
        delete next[submission.id];
        return next;
      });
      await loadPending();
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
          const manualScore = Number(scores[submission.id] || 0);
          const rawTotal = Math.max(0, submission.autoScore + (Number.isFinite(manualScore) ? manualScore : 0));
          const finalTotal = rawTotal * (1 - submission.latePenaltyPercentage / 100);
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
                  {submission.responses.map((response, index) => (
                    <Box key={response.questionId} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {index + 1}. {response.questionText} ({response.marks} marks)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {response.answer || 'Not answered'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                  <TextField
                    label={`Manual score (0–${submission.manualMax})`}
                    type="number"
                    size="small"
                    value={scores[submission.id] || ''}
                    onChange={(event) => setScores((current) => ({ ...current, [submission.id]: event.target.value }))}
                    slotProps={{ htmlInput: { min: 0, max: submission.manualMax, step: 0.25 } }}
                    sx={{ width: 220 }}
                  />
                  <TextField
                    label="Feedback (optional)"
                    size="small"
                    multiline
                    minRows={2}
                    value={feedback[submission.id] || ''}
                    onChange={(event) => setFeedback((current) => ({ ...current, [submission.id]: event.target.value }))}
                    sx={{ flex: '1 1 320px' }}
                  />
                  <Box sx={{ minWidth: 170 }}>
                    <Typography variant="body2" color="text.secondary">
                      Final after penalty: {finalTotal.toFixed(2)}/{submission.totalMarks}
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ mt: 1 }}
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
