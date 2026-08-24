// src/modules/admin/pages/ReviewQueuePage.tsx
//
// Admin UI for the question submission → review → approval workflow.
// Backed by reviewQueueApi in ../api/questionBankApi.ts, which reads and
// writes the Firestore `questionReviews` collection.
import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import ReviewQueue from '../components/ReviewQueue';
import UniversalQuestionBank from '../components/UniversalQuestionBank';

export default function ReviewQueuePage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Question Review
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Approve or reject submitted questions, and browse the universal question bank.
      </Typography>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Review Queue" />
        <Tab label="Universal Bank" />
      </Tabs>

      {tab === 0 ? <ReviewQueue /> : <UniversalQuestionBank />}
    </Box>
  );
}
