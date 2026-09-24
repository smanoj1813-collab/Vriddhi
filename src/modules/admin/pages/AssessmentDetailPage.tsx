// src/modules/admin/pages/AssessmentDetailPage.tsx
//
// Read-only detail view for a single assessment definition. Reached from
// Admin → Assessments "View" (previously a dead link to /admin/assessments/:id,
// which had no route). Fully additive: a new route + a new page; the list page
// and every other route are untouched.

import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { getAssessmentById } from '../api/assessmentsApi';
import type { Assessment } from '../types/assessment';

const STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  published: 'info',
  active: 'success',
  completed: 'warning',
  archived: 'error',
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75, flexWrap: 'wrap' }}>
      <Typography variant="body2" sx={{ minWidth: 160, color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary' }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getAssessmentById(id);
        if (alive) setAssessment(data);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load assessment');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !assessment) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Assessment not found.'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/assessments')}>
          Back to assessments
        </Button>
      </Box>
    );
  }

  const questionCount =
    assessment.questionIds?.length ?? assessment.sections?.reduce((n, s) => n + (s.questionIds?.length ?? 0), 0) ?? 0;

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 1, alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/assessments')}>
          Back
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {assessment.title || 'Untitled assessment'}
        </Typography>
        <Chip
          label={assessment.status}
          color={STATUS_COLORS[assessment.status] || 'default'}
          sx={{ textTransform: 'capitalize' }}
        />
      </Stack>

      {assessment.description && (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {assessment.description}
        </Typography>
      )}

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Row label="Type" value={<span style={{ textTransform: 'capitalize' }}>{assessment.type}</span>} />
        <Divider />
        <Row label="Course" value={assessment.courseName || assessment.courseCode} />
        <Divider />
        <Row label="Total marks" value={assessment.totalMarks} />
        <Divider />
        <Row label="Passing marks" value={assessment.passingMarks} />
        <Divider />
        <Row label="Duration" value={assessment.durationMinutes ? `${assessment.durationMinutes} min` : undefined} />
        <Divider />
        <Row label="Questions" value={questionCount} />
        <Divider />
        <Row
          label="Scheduled"
          value={
            assessment.scheduledDate
              ? `${new Date(assessment.scheduledDate as unknown as string).toLocaleString()}${assessment.startTime ? ` · ${assessment.startTime}` : ''}${assessment.endTime ? `–${assessment.endTime}` : ''}`
              : undefined
          }
        />
        <Divider />
        <Row label="Branch / Batch" value={[assessment.branch, assessment.batch].filter(Boolean).join(' · ') || undefined} />
        <Divider />
        <Row label="Semester" value={assessment.semester} />
        <Divider />
        <Row label="Mode" value={<span style={{ textTransform: 'capitalize' }}>{assessment.mode}</span>} />
      </Box>

      {assessment.instructions && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Instructions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {assessment.instructions}
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button variant="contained" onClick={() => navigate('/admin/test-reports')}>
          View test reports &amp; results
        </Button>
        <Button variant="outlined" onClick={() => navigate('/admin/assessments')}>
          Back to assessments
        </Button>
      </Stack>
    </Box>
  );
}
