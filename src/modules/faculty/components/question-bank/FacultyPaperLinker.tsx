// src/modules/components/question-bank/FacultyPaperLinker.tsx
import React, { useState } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText,
  Button, Chip, Divider, Alert,
} from '@mui/material';
import { Link as LinkIcon, LinkOff as UnlinkIcon } from '@mui/icons-material';
import type { Question } from '../../../admin/types/questionBank';

interface FacultyPaperLinkerProps {
  question: Question;
  onLink: (questionId: string, paperId: string) => Promise<void>;
  onUnlink: (questionId: string, paperId: string) => Promise<void>;
  onClose: () => void;
}

// Mock papers — replace with actual hook/API call
const MOCK_PAPERS = [
  { id: 'paper-1', title: 'Mid-Term Exam 2026', examType: 'mid-term', year: 2026 },
  { id: 'paper-2', title: 'End-Term Exam 2026', examType: 'end-term', year: 2026 },
  { id: 'paper-3', title: 'Quiz 1', examType: 'quiz', year: 2026 },
];

const FacultyPaperLinker: React.FC<FacultyPaperLinkerProps> = ({
  question,
  onLink,
  onUnlink,
  onClose,
}) => {
  const [linkedIds, setLinkedIds] = useState<string[]>(question.linkedPaperIds || []);
  const [loading, setLoading] = useState<string | null>(null);

  const handleLink = async (paperId: string) => {
    setLoading(paperId);
    try {
      await onLink(question.id, paperId);
      setLinkedIds([...linkedIds, paperId]);
    } finally {
      setLoading(null);
    }
  };

  const handleUnlink = async (paperId: string) => {
    setLoading(paperId);
    try {
      await onUnlink(question.id, paperId);
      setLinkedIds(linkedIds.filter(id => id !== paperId));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Question: {question.text.slice(0, 100)}{question.text.length > 100 ? '...' : ''}
      </Typography>

      {linkedIds.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Currently linked to {linkedIds.length} paper(s)
        </Alert>
      )}

      <Typography variant="subtitle2" gutterBottom>Available Papers</Typography>
      <List dense>
        {MOCK_PAPERS.map(paper => {
          const isLinked = linkedIds.includes(paper.id);
          return (
            <ListItem
              key={paper.id}
              divider
              secondaryAction={
                <Button
                  size="small"
                  variant={isLinked ? 'outlined' : 'contained'}
                  color={isLinked ? 'error' : 'primary'}
                  onClick={() => isLinked ? handleUnlink(paper.id) : handleLink(paper.id)}
                  disabled={loading === paper.id}
                  startIcon={isLinked ? <UnlinkIcon /> : <LinkIcon />}
                >
                  {loading === paper.id ? '...' : isLinked ? 'Unlink' : 'Link'}
                </Button>
              }
            >
              <ListItemText
                primary={paper.title}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={paper.examType} size="small" variant="outlined" />
                    <Chip label={String(paper.year)} size="small" />
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </Box>
    </Box>
  );
};

export default FacultyPaperLinker;