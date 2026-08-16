// src/components/admin/StudentSeedPanel.tsx
// ============================================================
// Drop-in admin panel to seed / re-import students
// Place this in your SuperAdmin or CollegeAdmin dashboard
// ============================================================

import { useState } from 'react';
import { Box, Button, Typography, Alert, LinearProgress, Paper, Stack } from '@mui/material';
import { seedStudents, importNewStudents } from '../../scripts/seedStudents';

interface StudentSeedPanelProps {
  collegeId: string;
}

export function StudentSeedPanel({ collegeId }: StudentSeedPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSeed = async () => {
    if (!window.confirm('⚠️ This will DELETE all existing students and re-import 500 from seed. Continue?')) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(20);
    try {
      const res = await seedStudents(collegeId);
      setProgress(100);
      setResult(`${res.message} (${res.elapsedMs}ms)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportNew = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(20);
    try {
      const res = await importNewStudents(collegeId);
      setProgress(100);
      setResult(`Created: ${res.created} | Skipped: ${res.skipped} | Failed: ${res.failed} (${res.elapsedMs}ms)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Student Index Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        College ID: <strong>{collegeId}</strong>
      </Typography>

      <Stack spacing={2}>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSeed}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Processing...' : '🔥 Nuke & Re-Seed All 500 Students'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleImportNew}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Processing...' : '➕ Import Only New Students'}
        </Button>

        {loading && <LinearProgress variant="determinate" value={progress} />}

        {error && <Alert severity="error">{error}</Alert>}
        {result && <Alert severity="success">{result}</Alert>}
      </Stack>
    </Paper>
  );
}