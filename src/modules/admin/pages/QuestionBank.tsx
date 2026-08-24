// src/modules/admin/pages/QuestionBank.tsx
// Admin Question Bank page — AI generation, CRUD and paper building.

import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Alert, Snackbar } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import QuestionUploadEditor from '@/shared/components/question-paper/QuestionUploadEditor';
import { useAuth } from '../../auth/context/AuthContext';
import QuestionBankManager from '../components/question-bank/QuestionBankManager';
import { getBatchBranchConfig, getQuestionStats } from '../api/questionBankApi';
import { DEFAULT_SUBJECTS } from '@/shared/constants/academicPrograms';

export default function QuestionBank() {
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
      .catch((err) => setError(err.message || 'Failed to load question bank configuration'))
      .finally(() => setLoading(false));
  }, [collegeId]);

  if (!collegeId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please sign in with a college account to manage the question bank.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading question bank...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setUploadOpen(true)}>
          Upload Questions
        </Button>
      </Box>
      <QuestionBankManager key={reloadKey} batches={batches} branches={branches} subjects={subjects} />
      <QuestionUploadEditor
        open={uploadOpen}
        collegeId={collegeId}
        createdBy={user?.id || user?.uid || ''}
        createdByName={user?.name || ''}
        subjects={subjects}
        batches={batches}
        branches={branches}
        canPublishDirectly
        onClose={() => setUploadOpen(false)}
        onSaved={(count, status) => {
          setToast(status === 'draft' ? `${count} question(s) saved as draft` : `${count} question(s) published to the bank`);
          setReloadKey((k) => k + 1);
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
