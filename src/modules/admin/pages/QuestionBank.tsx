// src/modules/admin/pages/QuestionBank.tsx
// Unified Question Bank hub for Principal/Admin (B revamp)
// One page with 4 tabs: College Bank | Universal Bank | Review Queue | Previous Year Papers
// Old routes /admin/universal-bank and /admin/review-queue now redirect here via routes.tsx aliases.

import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography, Alert, Snackbar, Tabs, Tab, Paper } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import QuestionUploadEditor from '@/shared/components/question-paper/QuestionUploadEditor';
import { useAuth } from '../../auth/context/AuthContext';
import QuestionBankManager from '../components/question-bank/QuestionBankManager';
import UniversalQuestionBank from '../components/UniversalQuestionBank';
import ReviewQueue from '../components/ReviewQueue';
import { getBatchBranchConfig, getQuestionStats } from '../api/questionBankApi';
import { DEFAULT_SUBJECTS } from '@/shared/constants/academicPrograms';
import AssignedPyqPapersPanel from '@/shared/components/pyq/AssignedPyqPapersPanel';

export type QuestionBankTab = 'college' | 'universal' | 'review' | 'pyq';

const TAB_INDEX: Record<QuestionBankTab, number> = { college: 0, universal: 1, review: 2, pyq: 3 };

interface Props {
  initialTab?: QuestionBankTab;
}

export default function QuestionBank({ initialTab = 'college' }: Props) {
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

  const [tab, setTab] = useState(TAB_INDEX[initialTab] ?? 0);

  useEffect(() => {
    setTab(TAB_INDEX[initialTab] ?? 0);
  }, [initialTab]);
  const schedulePath = ['admin', 'principal', 'superadmin'].includes(String(user?.role || ''))
    ? '/admin/schedule-tests'
    : '/faculty/assessments';

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
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Question Bank & Exam Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        College-private questions, the shared Universal pool, the review queue and assigned previous year papers — one place.
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary">
          <Tab label="College Bank" />
          <Tab label="Universal Bank" />
          <Tab label="Review Queue" />
          <Tab label="Previous Year Papers" />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setUploadOpen(true)}>
              Upload Questions
            </Button>
          </Box>
          <QuestionBankManager key={reloadKey} batches={batches} branches={branches} subjects={subjects} />
        </>
      )}

      {tab === 1 && (
        <Box sx={{ mt: 1 }}>
          <UniversalQuestionBank />
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ mt: 1 }}>
          <ReviewQueue />
        </Box>
      )}

      {tab === 3 && (
        <Box sx={{ mt: 1 }}>
          <AssignedPyqPapersPanel
            collegeId={collegeId}
            schedulePath={schedulePath}
            actAsSuperadmin={user?.role === 'superadmin'}
          />
        </Box>
      )}

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
