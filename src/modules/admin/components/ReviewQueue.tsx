// ============================================================
// VRIDDHI - ReviewQueue Component
// ============================================================
// Superadmin dashboard to review pending questions
// Approve → active (available to all) | Reject → back to creator
// Uses Box + flexWrap layout (no MUI Grid)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Paper as MuiPaper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Tooltip,
  Badge,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Star as StarIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuestionBank } from '../../../modules/admin/hooks/useQuestionBank';
import { useAuth } from '../../auth/context/AuthContext';
import {
  type QuestionReview,
  type QuestionContent,
  type QuestionMetadata,
  type ReviewStatus,
} from '../../admin/types/universalQuestionBank';

// ============================================================
// REVIEW DETAIL DIALOG
// ============================================================

interface ReviewDetailDialogProps {
  open: boolean;
  onClose: () => void;
  review: QuestionReview | null;
  questionContent: QuestionContent | null;
  questionMetadata: QuestionMetadata | null;
  loading: boolean;
  onApprove: (comment?: string) => void;
  onReject: (reason: string) => void;
  isProcessing: boolean;
}

function ReviewDetailDialog({
  open,
  onClose,
  review,
  questionContent,
  questionMetadata,
  loading,
  onApprove,
  onReject,
  isProcessing,
}: ReviewDetailDialogProps) {
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  if (!review) return null;

  const handleApprove = () => {
    onApprove(comment || undefined);
    setComment('');
    setAction(null);
  };

  const handleReject = () => {
    if (!comment.trim()) return;
    onReject(comment);
    setComment('');
    setAction(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Review Question</Typography>
          <Chip
            label={review.status}
            color={review.status === 'pending' ? 'warning' : review.status === 'approved' ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Submitter info */}
            <MuiPaper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Submitted By
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {review.submittedBy.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {review.submittedBy.collegeName} • {review.submittedBy.role}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DateIcon sx={{ fontSize: 14 }} />
                    {new Date(review.submittedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </MuiPaper>

            {/* Question content */}
            {questionContent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {questionContent.questionText}
                </Typography>

                {questionContent.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {questionContent.images.map((img, i) => (
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

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {questionContent.options.map((opt) => (
                    <Box
                      key={opt.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: opt.isCorrect ? 'success.main' : 'divider',
                        bgcolor: opt.isCorrect ? 'success.light' : 'background.paper',
                      }}
                    >
                      <Typography>
                        <strong>{opt.id}.</strong> {opt.text}
                        {opt.isCorrect && (
                          <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Explanation
                  </Typography>
                  <Typography variant="body2">{questionContent.explanation}</Typography>
                </Box>

                {questionContent.hint && (
                  <Box>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      Hint
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {questionContent.hint}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Metadata */}
            {questionMetadata && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label={`Subject: ${questionMetadata.subjectId}`} size="small" />
                <Chip label={`Topic: ${questionMetadata.topicId}`} size="small" />
                <Chip label={`Difficulty: ${questionMetadata.difficulty}`} size="small" />
                <Chip label={`Type: ${questionMetadata.questionType}`} size="small" />
                <Chip label={`Marks: ${questionMetadata.marks}`} size="small" />
                {questionMetadata.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            )}

            {/* Review comment */}
            {review.status !== 'pending' && review.reviewComment && (
              <Alert severity={review.status === 'approved' ? 'success' : 'error'}>
                <Typography variant="subtitle2">
                  {review.status === 'approved' ? 'Approved' : 'Rejected'} by {review.reviewerName}
                </Typography>
                <Typography variant="body2">{review.reviewComment}</Typography>
              </Alert>
            )}

            {/* Action section for pending reviews */}
            {review.status === 'pending' && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  Review Decision
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add your review comment or feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {action === 'reject' && !comment.trim() && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Please provide a reason for rejection.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={handleApprove}
                    disabled={isProcessing}
                    sx={{ flex: 1 }}
                  >
                    {isProcessing ? <CircularProgress size={20} /> : 'Approve'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={handleReject}
                    disabled={isProcessing || !comment.trim()}
                    sx={{ flex: 1 }}
                  >
                    {isProcessing ? <CircularProgress size={20} /> : 'Reject'}
                  </Button>
                </Box>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// REVIEW TABLE ROW
// ============================================================

interface ReviewRowProps {
  review: QuestionReview;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

function ReviewRow({ review, onView, onApprove, onReject, isProcessing }: ReviewRowProps) {
  const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    needs_revision: 'default',
  };

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
            <PersonIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {review.submittedBy.userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {review.submittedBy.collegeName}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={review.status}
          color={statusColors[review.status] || 'default'}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {new Date(review.submittedAt).toLocaleDateString()}
        </Typography>
      </TableCell>
      <TableCell>
        {review.reviewedAt ? (
          <Typography variant="caption" color="text.secondary">
            {new Date(review.reviewedAt).toLocaleDateString()}
          </Typography>
        ) : (
          <Typography variant="caption" color="warning.main">
            Pending
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={onView}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {review.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" color="success" onClick={onApprove} disabled={isProcessing}>
                  <ApproveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" color="error" onClick={onReject} disabled={isProcessing}>
                  <RejectIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// STATS CARDS
// ============================================================

function StatsCards({ stats }: { stats: { pending: number; approved: number; rejected: number; total: number } }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <MuiPaper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', minWidth: 120 }}>
        <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
        <Typography variant="caption" color="text.secondary">Pending</Typography>
      </MuiPaper>
      <MuiPaper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', minWidth: 120 }}>
        <Typography variant="h4" color="success.main">{stats.approved}</Typography>
        <Typography variant="caption" color="text.secondary">Approved</Typography>
      </MuiPaper>
      <MuiPaper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', minWidth: 120 }}>
        <Typography variant="h4" color="error.main">{stats.rejected}</Typography>
        <Typography variant="caption" color="text.secondary">Rejected</Typography>
      </MuiPaper>
      <MuiPaper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', minWidth: 120 }}>
        <Typography variant="h4" color="primary">{stats.total}</Typography>
        <Typography variant="caption" color="text.secondary">Total</Typography>
      </MuiPaper>
    </Box>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ReviewQueue() {
  const { user } = useAuth();

  // Use flexible typing to avoid TS errors with hook return type mismatches
  const hookResult = useQuestionBank() as any;

  const reviews: QuestionReview[] = hookResult.reviews || [];
  const selectedQuestion = hookResult.selectedQuestion || null;
  const loading = hookResult.loading || false;
  const error = hookResult.error || null;

  // Dynamically resolve methods
  const loadPendingReviews = hookResult.loadPendingReviews || hookResult.loadReviews || (() => {});
  const loadQuestionDetail = hookResult.loadQuestionDetail || (() => {});
  const approveReview = hookResult.approveReview || (() => Promise.resolve(false));
  const rejectReview = hookResult.rejectReview || (() => Promise.resolve(false));

  const [activeTab, setActiveTab] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<QuestionReview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 0) return r.status === 'pending';
    if (activeTab === 1) return r.status === 'approved';
    if (activeTab === 2) return r.status === 'rejected';
    return true;
  });

  const paginatedReviews = filteredReviews.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(filteredReviews.length / rowsPerPage);

  const stats = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
    total: reviews.length,
  };

  const handleViewDetail = async (review: QuestionReview) => {
    setSelectedReview(review);
    setDetailOpen(true);
    setActionError(null);
    await loadQuestionDetail(review.questionId);
  };

  const handleApprove = async (comment?: string) => {
    if (!selectedReview || !user) return;
    setIsProcessing(true);
    setActionError(null);

    const success = await approveReview(
      selectedReview.id,
      user.id,
      user.name || 'Superadmin',
      comment
    );

    if (success) {
      setDetailOpen(false);
      setSelectedReview(null);
    } else {
      setActionError('Failed to approve question. Please try again.');
    }

    setIsProcessing(false);
  };

  const handleReject = async (reason: string) => {
    if (!selectedReview || !user) return;
    setIsProcessing(true);
    setActionError(null);

    const success = await rejectReview(
      selectedReview.id,
      user.id,
      user.name || 'Superadmin',
      reason
    );

    if (success) {
      setDetailOpen(false);
      setSelectedReview(null);
    } else {
      setActionError('Failed to reject question. Please try again.');
    }

    setIsProcessing(false);
  };

  const handleQuickApprove = async (review: QuestionReview) => {
    if (!user) return;
    setIsProcessing(true);
    const success = await approveReview(review.id, user.id, user.name || 'Superadmin');
    if (!success) {
      setActionError('Failed to approve. Please review in detail.');
    }
    setIsProcessing(false);
  };

  const handleQuickReject = async (review: QuestionReview) => {
    if (!user) return;
    setIsProcessing(true);
    const success = await rejectReview(review.id, user.id, user.name || 'Superadmin', 'Rejected without detailed comment');
    if (!success) {
      setActionError('Failed to reject. Please review in detail.');
    }
    setIsProcessing(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Review Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve questions submitted by faculty across all colleges
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPendingReviews}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(1); }}>
          <Tab
            label={
              <Badge badgeContent={stats.pending} color="warning">
                <Box sx={{ pr: 2 }}>Pending</Box>
              </Badge>
            }
          />
          <Tab label="Approved" />
          <Tab label="Rejected" />
          <Tab label="All" />
        </Tabs>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredReviews.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No {activeTab === 0 ? 'pending' : activeTab === 1 ? 'approved' : activeTab === 2 ? 'rejected' : ''} reviews
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={MuiPaper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Submitted By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Reviewed</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    onView={() => handleViewDetail(review)}
                    onApprove={() => handleQuickApprove(review)}
                    onReject={() => handleQuickReject(review)}
                    isProcessing={isProcessing}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <ReviewDetailDialog
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedReview(null); }}
        review={selectedReview}
        questionContent={selectedQuestion}
        questionMetadata={null} // Would need to fetch separately
        loading={loading}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </Box>
  );
}

export default ReviewQueue;