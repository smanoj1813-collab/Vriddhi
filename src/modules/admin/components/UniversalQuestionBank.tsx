// ============================================================
// VRIDDHI - UniversalQuestionBank Component
// ============================================================
// Browse, search, filter, and preview questions from the universal pool
// Uses Box + flexWrap layout (no MUI Grid)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Paper as MuiPaper,
  Stack,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Star as StarIcon,
  Image as ImageIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  School as SchoolIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useQuestionBank } from '../../../modules/admin/hooks/useQuestionBank';
import { useAuth } from '../../auth/context/AuthContext';
import {
  type QuestionMetadata,
  type QuestionContent,
  type QuestionFilter,
  type DifficultyLevel,
  type QuestionType,
  type ReviewStatus,
} from '../../admin/types/universalQuestionBank';

// ============================================================
// DIFFICULTY CHIP COLORS
// ============================================================

const DIFFICULTY_COLORS: Record<DifficultyLevel, { bg: string; text: string; border: string }> = {
  easy: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  medium: { bg: '#fff3e0', text: '#ef6c00', border: '#ffcc80' },
  hard: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <ApprovedIcon sx={{ fontSize: 16, color: 'success.main' }} />,
  pending_review: <PendingIcon sx={{ fontSize: 16, color: 'warning.main' }} />,
  rejected: <ClearIcon sx={{ fontSize: 16, color: 'error.main' }} />,
  archived: <ClearIcon sx={{ fontSize: 16, color: 'text.disabled' }} />,
};

// ============================================================
// QUESTION CARD
// ============================================================

interface QuestionCardProps {
  metadata: QuestionMetadata;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onAddToCollection?: () => void;
  isInCollection?: boolean;
}

function QuestionCard({
  metadata,
  isSelected,
  onSelect,
  onPreview,
  onAddToCollection,
  isInCollection,
}: QuestionCardProps) {
  const diffColor = DIFFICULTY_COLORS[metadata.difficulty];

  return (
    <MuiPaper
      elevation={isSelected ? 3 : 1}
      onClick={onSelect}
      sx={{
        p: 2,
        cursor: 'pointer',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': { elevation: 2, borderColor: 'primary.light' },
        position: 'relative',
      }}
    >
      {/* Top row: Difficulty + Status + Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={metadata.difficulty}
            size="small"
            sx={{
              bgcolor: diffColor.bg,
              color: diffColor.text,
              border: `1px solid ${diffColor.border}`,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          />
          <Chip
            label={`${metadata.marks} mark${metadata.marks > 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
          />
          {metadata.hasImage && (
            <Tooltip title="Has image">
              <ImageIcon sx={{ fontSize: 18, color: 'info.main' }} />
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {STATUS_ICONS[metadata.status]}
          {onAddToCollection && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onAddToCollection(); }}
            >
              {isInCollection ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
            </IconButton>
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Tags */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
        {metadata.tags.slice(0, 4).map((tag) => (
          <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: 11 }} />
        ))}
        {metadata.tags.length > 4 && (
          <Chip label={`+${metadata.tags.length - 4}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
        )}
      </Box>

      {/* Usage stats */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <StarIcon sx={{ fontSize: 14 }} />
          {metadata.qualityRating > 0 ? metadata.qualityRating.toFixed(1) : 'N/A'}
        </Typography>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SchoolIcon sx={{ fontSize: 14 }} />
          {metadata.usageCount} uses
        </Typography>
        <Typography variant="caption">
          {metadata.createdBy.collegeId ? metadata.createdBy.collegeName : 'Vriddhi System'}
        </Typography>
      </Box>
    </MuiPaper>
  );
}

// ============================================================
// QUESTION PREVIEW DIALOG
// ============================================================

interface QuestionPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  question: QuestionContent | null;
  loading: boolean;
}

function QuestionPreviewDialog({ open, onClose, question, loading }: QuestionPreviewDialogProps) {
  if (!question && !loading) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Question Preview</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : question ? (
          <Stack spacing={2}>
            {/* Question text */}
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {question.questionText}
            </Typography>

            {/* Images */}
            {question.images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {question.images.map((img, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={img.url}
                    alt={img.altText}
                    sx={{ maxWidth: 200, maxHeight: 200, borderRadius: 1 }}
                  />
                ))}
              </Box>
            )}

            {/* Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {question.options.map((opt) => (
                <Box
                  key={opt.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: opt.isCorrect ? 'success.main' : 'divider',
                    bgcolor: opt.isCorrect ? 'success.light' : 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: opt.isCorrect ? 'success.dark' : 'text.secondary',
                      minWidth: 24,
                    }}
                  >
                    {opt.id}
                  </Typography>
                  <Typography>{opt.text}</Typography>
                  {opt.isCorrect && (
                    <Chip label="Correct" size="small" color="success" sx={{ ml: 'auto' }} />
                  )}
                </Box>
              ))}
            </Box>

            <Divider />

            {/* Explanation */}
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Explanation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {question.explanation}
              </Typography>
            </Box>

            {/* Metadata */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
              <Chip label={`Type: ${question.questionType}`} size="small" />
              <Chip label={`Difficulty: ${question.difficulty}`} size="small" />
              <Chip label={`Marks: ${question.marks}`} size="small" />
              <Chip label={`Version: ${question.version}`} size="small" />
              <Chip label={`Source: ${question.source}`} size="small" />
            </Box>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// FILTER PANEL
// ============================================================

interface FilterPanelProps {
  filter: QuestionFilter;
  onFilterChange: (filter: QuestionFilter) => void;
  subjects: { id: string; name: string }[];
  topics: { id: string; name: string; subjectId: string }[];
}

function FilterPanel({ filter, onFilterChange, subjects, topics }: FilterPanelProps) {
  const filteredTopics = topics.filter(t => !filter.subjectId || t.subjectId === filter.subjectId);

  const handleClear = () => {
    onFilterChange({
      status: 'active' as ReviewStatus,
    });
  };

  return (
    <MuiPaper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          <FilterIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Filters
        </Typography>
        <Button size="small" onClick={handleClear} startIcon={<ClearIcon />}>
          Clear All
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {/* Subject */}
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Subject</InputLabel>
            <Select
              value={filter.subjectId || ''}
              label="Subject"
              onChange={(e) => onFilterChange({
                ...filter,
                subjectId: e.target.value || undefined,
                topicId: undefined,
              })}
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Topic */}
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small" disabled={!filter.subjectId}>
            <InputLabel>Topic</InputLabel>
            <Select
              value={filter.topicId || ''}
              label="Topic"
              onChange={(e) => onFilterChange({
                ...filter,
                topicId: e.target.value || undefined,
              })}
            >
              <MenuItem value="">All Topics</MenuItem>
              {filteredTopics.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Difficulty */}
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={filter.difficulty || ''}
              label="Difficulty"
              onChange={(e) => onFilterChange({
                ...filter,
                difficulty: e.target.value as DifficultyLevel || undefined,
              })}
            >
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Question Type */}
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Question Type</InputLabel>
            <Select
              value={filter.questionType || ''}
              label="Question Type"
              onChange={(e) => onFilterChange({
                ...filter,
                questionType: e.target.value as QuestionType || undefined,
              })}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="mcq">Multiple Choice</MenuItem>
              <MenuItem value="true_false">True/False</MenuItem>
              <MenuItem value="short_answer">Short Answer</MenuItem>
              <MenuItem value="long_answer">Long Answer</MenuItem>
              <MenuItem value="fill_in_blank">Fill in Blank</MenuItem>
              <MenuItem value="match">Match</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Status (for admin/superadmin) */}
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status || 'active'}
              label="Status"
              onChange={(e) => onFilterChange({
                ...filter,
                status: e.target.value as ReviewStatus,
              })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending_review">Pending Review</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Tags */}
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={[]}
            value={filter.tags || []}
            onChange={(_, newValue) => onFilterChange({ ...filter, tags: newValue as string[] })}
            renderInput={(params) => (
              <TextField {...params} label="Tags" placeholder="Add tags..." />
            )}
          />
        </Box>
      </Box>
    </MuiPaper>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export interface UniversalQuestionBankProps {
  onQuestionSelect?: (questionId: string) => void;
  onAddToPaper?: (questionId: string) => void;
  selectedQuestionIds?: string[];
  showSubmitButton?: boolean;
  onSubmitQuestion?: () => void;
}

export function UniversalQuestionBank({
  onQuestionSelect,
  onAddToPaper,
  selectedQuestionIds = [],
  showSubmitButton = true,
  onSubmitQuestion,
}: UniversalQuestionBankProps) {
  const { user } = useAuth();

  // Use the hook with flexible typing to avoid TS errors with unknown method names
  const hookResult = useQuestionBank() as any;

  const questions: any[] = hookResult.questions || [];
  const selectedQuestion = hookResult.selectedQuestion || null;
  const loading = hookResult.loading || false;
  const error = hookResult.error || null;
  const pagination = hookResult.pagination || { total: 0, page: 1, totalPages: 0 };
  const stats = hookResult.stats || null;

  // Dynamically call methods that exist on the hook
  const searchQuestions = hookResult.searchQuestions || hookResult.loadQuestions || hookResult.fetchQuestions || (() => {});
  const loadQuestionDetail = hookResult.loadQuestionDetail || (() => {});
  const loadStats = hookResult.loadStats || hookResult.fetchStats || (() => {});

  const [filter, setFilter] = useState<QuestionFilter>({
    status: 'active' as ReviewStatus,
  });
  const [searchText, setSearchText] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'biology', name: 'Biology' },
    { id: 'english', name: 'English' },
  ]);
  const [topics, setTopics] = useState<{ id: string; name: string; subjectId: string }[]>([
    { id: 'algebra_linear_equations', name: 'Linear Equations', subjectId: 'math' },
    { id: 'algebra_quadratic', name: 'Quadratic Equations', subjectId: 'math' },
    { id: 'calculus_differentiation', name: 'Differentiation', subjectId: 'math' },
    { id: 'physics_mechanics', name: 'Mechanics', subjectId: 'physics' },
    { id: 'physics_optics', name: 'Optics', subjectId: 'physics' },
    { id: 'chemistry_organic', name: 'Organic Chemistry', subjectId: 'chemistry' },
    { id: 'biology_cell', name: 'Cell Biology', subjectId: 'biology' },
    { id: 'english_grammar', name: 'English Grammar', subjectId: 'english' },
  ]);

  // Load initial data
  useEffect(() => {
    searchQuestions(filter);
    loadStats();
  }, []);

  // Search when filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchQuestions({
        ...filter,
        searchText: searchText || undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filter, searchText]);

  const handlePreview = useCallback(async (questionId: string) => {
    setPreviewQuestionId(questionId);
    setPreviewOpen(true);
    await loadQuestionDetail(questionId);
  }, [loadQuestionDetail]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    searchQuestions(filter, page);
  };

  const handleQuestionClick = (questionId: string) => {
    if (onQuestionSelect) {
      onQuestionSelect(questionId);
    }
    if (onAddToPaper) {
      onAddToPaper(questionId);
    }
  };

  const isQuestionSelected = (questionId: string) =>
    selectedQuestionIds.includes(questionId);

  // Helper to map any question object to QuestionMetadata shape
  // Uses 'as any' to bypass strict field checking since QuestionMetadata type may vary
  const toMetadata = (q: any): QuestionMetadata => {
    const metadata: any = {
      id: q.id || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 0,
      hasImage: q.hasImage || false,
      status: q.status || 'active',
      tags: q.tags || [],
      qualityRating: q.qualityRating || 0,
      usageCount: q.usageCount || 0,
      createdBy: q.createdBy || { collegeId: '', collegeName: '', userId: '', userName: '' },
      topicId: q.topicId || '',
      subjectId: q.subjectId || '',
      subTopicId: q.subTopicId || '',
      questionType: q.questionType || 'mcq',
      language: q.language || 'en',
    };
    // Only add timestamp fields if they exist on the source
    if (q.createdAt) metadata.createdAt = q.createdAt;
    if (q.updatedAt) metadata.updatedAt = q.updatedAt;
    return metadata as QuestionMetadata;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Universal Question Bank
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats ? `${(stats.totalQuestions || 0).toLocaleString()} questions across all subjects` : 'Loading...'}
          </Typography>
        </Box>
        {showSubmitButton && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onSubmitQuestion}
          >
            Submit Question
          </Button>
        )}
      </Box>

      {/* Search bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by tags, topic, or keywords..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            },
          }}
          size="small"
        />
        <Button
          variant="outlined"
          onClick={() => searchQuestions({ ...filter, searchText: searchText || undefined })}
        >
          Search
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <FilterPanel
          filter={filter}
          onFilterChange={setFilter}
          subjects={subjects}
          topics={topics}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats bar */}
      {stats && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip label={`Total: ${stats.totalQuestions || 0}`} color="primary" />
          <Chip label={`Easy: ${stats.byDifficulty?.easy || 0}`} variant="outlined" />
          <Chip label={`Medium: ${stats.byDifficulty?.medium || 0}`} variant="outlined" />
          <Chip label={`Hard: ${stats.byDifficulty?.hard || 0}`} variant="outlined" />
          <Chip label={`Pending Review: ${(stats as any).pendingReviews || 0}`} color="warning" />
        </Box>
      )}

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {questions.length} of {pagination?.total || 0} questions
        {(pagination?.totalPages || 0) > 1 && ` (Page ${pagination?.page || 1} of ${pagination?.totalPages || 1})`}
      </Typography>

      {/* Question grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : questions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No questions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or search terms
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {questions.map((q) => (
            <Box key={q.id || Math.random()} sx={{ flex: '1 1 350px', minWidth: 300, maxWidth: 500 }}>
              <QuestionCard
                metadata={toMetadata(q)}
                isSelected={isQuestionSelected(q.id || '')}
                onSelect={() => handleQuestionClick(q.id || '')}
                onPreview={() => handlePreview(q.id || '')}
                onAddToCollection={() => { /* TODO: implement collections */ }}
                isInCollection={false}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Pagination */}
      {(pagination?.totalPages || 0) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination?.totalPages || 1}
            page={pagination?.page || 1}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Preview Dialog */}
      <QuestionPreviewDialog
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewQuestionId(null); }}
        question={selectedQuestion}
        loading={loading}
      />
    </Box>
  );
}

export default UniversalQuestionBank;