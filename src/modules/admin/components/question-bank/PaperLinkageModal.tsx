import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Chip,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  CheckCircle as CheckIcon,
  Description as PaperIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Question } from '../../types/questionBank';
import { Paper as PaperType } from '../../types/paper';
import { getLinkedPapers } from '../../services/questionBankAPI';
import { getPapers as getAllPapers } from '../../services/paperAPI';

interface PaperLinkageModalProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
  onLink: (questionId: string, paperId: string) => void;
  onUnlink: (questionId: string, paperId: string) => void;
}

const PaperLinkageModal: React.FC<PaperLinkageModalProps> = ({
  question,
  onLink,
  onUnlink
}) => {
  const [linkedPapers, setLinkedPapers] = useState<PaperType[]>([]);
  const [availablePapers, setAvailablePapers] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      loadData();
    }
  }, [question]);

  const loadData = async () => {
    if (!question) return;
    setLoading(true);
    try {
      // Load linked papers
      const linked = (await getLinkedPapers(question.id)) as unknown as PaperType[];
      setLinkedPapers(linked);

      // Load all papers (filter out already linked)
      const allPapers = await getAllPapers(question.collegeId);
      const linkedIds = new Set<string>(linked.map((p: PaperType) => p.id));
      setAvailablePapers(allPapers.filter((p: PaperType) => !linkedIds.has(p.id)));
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (paperId: string) => {
    if (!question) return;
    setActionLoading(paperId);
    try {
      await onLink(question.id, paperId);
      await loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlink = async (paperId: string) => {
    if (!question) return;
    setActionLoading(paperId);
    try {
      await onUnlink(question.id, paperId);
      await loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAvailable = availablePapers.filter((p: PaperType) => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!question) return null;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Link Question to Papers
      </Typography>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary">
          Question:
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {question.text.substring(0, 120)}...
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
          <Chip label={question.subject} size="small" />
          <Chip label={question.type} size="small" variant="outlined" />
          <Chip label={question.difficulty} size="small" color={
            question.difficulty === 'easy' ? 'success' :
            question.difficulty === 'medium' ? 'warning' : 'error'
          } />
        </Box>
      </Paper>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab 
          label={`Linked (${linkedPapers.length})`} 
          icon={<LinkIcon />} 
          iconPosition="start" 
        />
        <Tab 
          label={`Available (${availablePapers.length})`} 
          icon={<PaperIcon />} 
          iconPosition="start" 
        />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Linked Papers Tab */}
          {tabValue === 0 && (
            <>
              {linkedPapers.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This question is not linked to any papers yet.
                </Alert>
              ) : (
                <List>
                  {linkedPapers.map((paper: PaperType) => (
                    <ListItem
                      key={paper.id}
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          startIcon={actionLoading === paper.id ? <CircularProgress size={16} /> : <UnlinkIcon />}
                          onClick={() => handleUnlink(paper.id)}
                          disabled={actionLoading === paper.id}
                        >
                          Unlink
                        </Button>
                      }
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                      <ListItemIcon>
                        <PaperIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={paper.title}
                        secondary={`${paper.subject} | ${paper.examType} | ${paper.totalMarks} marks | ${paper.totalQuestions} questions`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}

          {/* Available Papers Tab */}
          {tabValue === 1 && (
            <>
              <TextField
                fullWidth
                size="small"
                placeholder="Search papers by title or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }
                }}
                sx={{ mb: 2 }}
              />

              {filteredAvailable.length === 0 ? (
                <Alert severity="info">
                  {searchQuery ? 'No papers match your search.' : 'No available papers to link.'}
                </Alert>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {filteredAvailable.map((paper: PaperType) => (
                    <ListItem
                      key={paper.id}
                      disablePadding
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={actionLoading === paper.id ? <CircularProgress size={16} /> : <LinkIcon />}
                          onClick={() => handleLink(paper.id)}
                          disabled={actionLoading === paper.id}
                        >
                          Link
                        </Button>
                      }
                    >
                      <ListItemButton>
                        <ListItemIcon>
                          <PaperIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={paper.title}
                          secondary={
                            <>
                              {paper.subject} | {paper.examType} | {paper.totalMarks} marks
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {paper.batch || 'All batches'} | {paper.branch || 'All branches'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

export default PaperLinkageModal;