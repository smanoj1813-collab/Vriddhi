// src/modules/admin/pages/PaperGeneratorPage.tsx
// Admin Paper Generator page — configure sections and generate a paper from the bank.

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../../auth/context/AuthContext';
import PaperGenerator from '../components/question-bank/PaperGenerator';
import { getBatchBranchConfig, getQuestionStats } from '../api/questionBankApi';

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Data Structures',
  'Algorithms',
  'Database Management',
  'Operating Systems',
  'English',
  'Accounting',
  'Economics',
  'Statistics',
];

export default function PaperGeneratorPage() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [batches, setBatches] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collegeId) {
      setError('Not authenticated — missing collegeId');
      setLoading(false);
      return;
    }

    Promise.all([
      getBatchBranchConfig(collegeId),
      getQuestionStats(collegeId).catch(() => null),
    ])
      .then(([cfg, stats]) => {
        const derived = Object.keys(stats?.bySubject || {});
        setBatches(cfg.batches || []);
        setBranches(cfg.branches || []);
        setSubjects(derived.length > 0 ? derived : DEFAULT_SUBJECTS);
      })
      .catch((err) => setError(err.message || 'Failed to load paper generator configuration'))
      .finally(() => setLoading(false));
  }, [collegeId]);

  if (!collegeId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please sign in with a college account to generate papers.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading paper generator...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <PaperGenerator batches={batches} branches={branches} subjects={subjects} />
    </Box>
  );
}
