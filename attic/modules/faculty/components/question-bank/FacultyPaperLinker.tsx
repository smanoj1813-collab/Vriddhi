// src/modules/faculty/components/question-bank/FacultyPaperLinker.tsx
// Links a question to real papers from the question bank / paper APIs.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText,
  Button, Chip, Divider, Alert, CircularProgress,
} from '@mui/material';
import { Link as LinkIcon, LinkOff as UnlinkIcon } from '@mui/icons-material';
import type { Question } from '../../../admin/types/questionBank';
import type { Paper as PaperType } from '../../../admin/types/paper';
import { getLinkedPapers } from '../../../admin/api/questionBankApi';
import { getPapers } from '../../../admin/services/paperAPI';

interface FacultyPaperLinkerProps {
  question: Question;
  onLink: (questionId: string, paperId: string) => Promise<void>;
  onUnlink: (questionId: string, paperId: string) => Promise<void>;
  onClose: () => void;
}

const FacultyPaperLinker: React.FC<FacultyPaperLinkerProps> = ({
  question,
  onLink,
  onUnlink,
  onClose,
}) => {
  const [linkedIds, setLinkedIds] = useState<string[]>(question.linkedPaperIds || []);
  const [availablePapers, setAvailablePapers] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const loadData = useCallback(async () => {
    setBusy(true);
    try {
      const linked = (await getLinkedPapers(question.id)) as unknown as PaperType[];
      setLinkedIds(linked.map((p) => p.id));

      const all = await getPapers(question.collegeId);
      const linkedSet = new Set(linked.map((p) => p.id));
      setAvailablePapers(all.filter((p) => !linkedSet.has(p.id)));
    } catch {
      // Keep existing empty state on transient errors.
    } finally {
      setBusy(false);
    }
  }, [question.id, question.collegeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLink = async (paperId: string) => {
    setLoading(paperId);
    try {
      await onLink(question.id, paperId);
      await loadData();
    } finally {
      setLoading(null);
    }
  };

  const handleUnlink = async (paperId: string) => {
    setLoading(paperId);
    try {
      await onUnlink(question.id, paperId);
      await loadData();
    } finally {
      setLoading(null);
    }
  };

  const currentLinked = availablePapers.filter((p) => linkedIds.includes(p.id));
  const remaining = availablePapers.filter((p) => !linkedIds.includes(p.id));

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Question: {question.text.slice(0, 100)}{question.text.length > 100 ? '...' : ''}
      </Typography>

      {busy ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {linkedIds.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Currently linked to {linkedIds.length} paper(s)
            </Alert>
          )}

          <Typography variant="subtitle2" gutterBottom>Available Papers</Typography>
          <List dense>
            {remaining.map((paper) => (
              <ListItem
                key={paper.id}
                divider
                secondaryAction={
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleLink(paper.id)}
                    disabled={loading === paper.id}
                    startIcon={<LinkIcon />}
                  >
                    {loading === paper.id ? '...' : 'Link'}
                  </Button>
                }
              >
                <ListItemText
                  primary={paper.title}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip label={paper.examType} size="small" variant="outlined" />
                      <Chip label={`${paper.totalMarks} marks`} size="small" />
                    </Box>
                  }
                />
              </ListItem>
            ))}
            {remaining.length === 0 && (
              <ListItem>
                <ListItemText primary="No unlinked papers available." />
              </ListItem>
            )}
          </List>

          {currentLinked.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Currently Linked</Typography>
              <List dense>
                {currentLinked.map((paper) => (
                  <ListItem
                    key={paper.id}
                    divider
                    secondaryAction={
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleUnlink(paper.id)}
                        disabled={loading === paper.id}
                        startIcon={<UnlinkIcon />}
                      >
                        {loading === paper.id ? '...' : 'Unlink'}
                      </Button>
                    }
                  >
                    <ListItemText primary={paper.title} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </Box>
    </Box>
  );
};

export default FacultyPaperLinker;
