// src/components/admin/FacultyLinkPanel.tsx
// ============================================================
// SuperAdmin Panel — Seed Faculty + Link Students to Mentors
// Drop this into SuperAdminFaculty or SuperAdminStudents page
// ============================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  seedFaculty,
  linkStudentsToFaculty,
  onboardFacultyAndLinkStudents,
} from '../../scripts/seedFaculty';

interface FacultyLinkPanelProps {
  collegeId: string;
}

const FACULTY_PREVIEW = [
  { id: 'FAC001', name: 'Jayashree G', email: 'jayashree199528@gmail.com', dept: 'Commerce', students: 167 },
  { id: 'FAC002', name: 'Supreeth', email: 'supreethi@vriddhi.com', dept: 'Multi-Dept', students: 167 },
  { id: 'FAC003', name: 'Gangadhar', email: 'gangadhar@vriddhi.com', dept: 'Multi-Dept', students: 166 },
];

export function FacultyLinkPanel({ collegeId }: FacultyLinkPanelProps) {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFullOnboard = async () => {
    if (!window.confirm('This will create 3 faculty docs and link all 500 students. Continue?')) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPhase('Creating faculty docs...');
    setProgress(20);

    try {
      const res = await onboardFacultyAndLinkStudents(collegeId, {
        createAuthAccounts: false, // set true if you want auth accounts too
      });
      setProgress(100);
      setPhase('');
      setResult(
        `Faculty created: ${res.facultyCreated} | Students linked: ${res.studentsLinked} | Errors: ${res.errors.length}`
      );
      if (res.errors.length > 0) {
        console.error('[Onboard] Errors:', res.errors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkOnly = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPhase('Linking students to faculty...');
    setProgress(30);

    try {
      const res = await linkStudentsToFaculty(collegeId);
      setProgress(100);
      setPhase('');
      setResult(`Linked: ${res.linked} | Skipped: ${res.skipped} | Errors: ${res.errors.length}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Linking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 700 }}>
      <Typography variant="h6" gutterBottom>
        Faculty Onboarding & Student Linking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        College ID: <strong>{collegeId}</strong>
      </Typography>

      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Faculty ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>
            <TableCell align="right">Students</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {FACULTY_PREVIEW.map((f) => (
            <TableRow key={f.id}>
              <TableCell sx={{ fontFamily: 'monospace' }}>{f.id}</TableCell>
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.email}</TableCell>
              <TableCell>{f.dept}</TableCell>
              <TableCell align="right">{f.students}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Stack spacing={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFullOnboard}
          disabled={loading}
          fullWidth
        >
          {loading ? phase || 'Processing...' : '🚀 Full Onboard (Seed + Link)'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleLinkOnly}
          disabled={loading}
          fullWidth
        >
          {loading ? phase || 'Processing...' : '🔗 Link Students Only'}
        </Button>

        {loading && <LinearProgress variant="determinate" value={progress} />}

        {error && <Alert severity="error">{error}</Alert>}
        {result && <Alert severity="success">{result}</Alert>}
      </Stack>
    </Paper>
  );
}