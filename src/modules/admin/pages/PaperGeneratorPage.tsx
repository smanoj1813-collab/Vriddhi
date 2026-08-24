// src/modules/admin/pages/PaperGeneratorPage.tsx
// Admin Paper Generator page — configure sections and generate a paper from the bank.

import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Alert, Snackbar } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import PaperUploadEditor from '@/shared/components/question-paper/PaperUploadEditor';
import { useAuth } from '../../auth/context/AuthContext';
import PaperGenerator from '../components/question-bank/PaperGenerator';
import { getBatchBranchConfig, getQuestionStats } from '../api/questionBankApi';
import { DEFAULT_SUBJECTS } from '@/shared/constants/academicPrograms';

export default function PaperGeneratorPage() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [batches, setBatches] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setUploadOpen(true)}>
          Upload Question Paper
        </Button>
      </Box>
      <PaperGenerator key={reloadKey} batches={batches} branches={branches} subjects={subjects} />
      <PaperUploadEditor
        open={uploadOpen}
        collegeId={collegeId}
        userId={user?.id || user?.uid || ''}
        userName={user?.name || ''}
        subjects={subjects}
        batches={batches}
        branches={branches}
        canPublishDirectly
        onClose={() => setUploadOpen(false)}
        onSaved={(_id, action) => {
          setToast(action === 'draft' ? 'Paper saved as draft' : action === 'published' ? 'Paper published' : 'Paper submitted for approval');
          setReloadKey((k) => k + 1);
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
