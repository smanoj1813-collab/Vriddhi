// pages/Assessments.tsx
// ============================================
// ADMIN ASSESSMENT HUB — Principal/Admin/HOD
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArchiveIcon from '@mui/icons-material/Archive';

import { listAssessments, getAssessmentStats, publishAssessment, activateAssessment, archiveAssessment } from '../api/assessmentsApi';
import type { Assessment, AssessmentStats } from '../types/assessment';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  published: 'primary',
  active: 'success',
  completed: 'warning',
  archived: 'error',
};

export default function Assessments() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<AssessmentStats | null>(null);

  const statusFilter = ['all', 'draft', 'published', 'active', 'completed', 'archived'][tab];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [items, s] = await Promise.all([
        listAssessments(statusFilter === 'all' ? {} : { status: statusFilter }),
        getAssessmentStats(''),
      ]);
      setAssessments(items);
      setStats(s);
    } catch (e) {
      console.error('[Assessments] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePublish = async (id: string) => {
    await publishAssessment(id);
    fetchData();
  };

  const handleActivate = async (id: string) => {
    await activateAssessment(id);
    fetchData();
  };

  const handleArchive = async (id: string) => {
    await archiveAssessment(id);
    fetchData();
  };

  const statCards = [
    { label: 'Total', value: stats?.totalAssessments ?? 0, color: '#94a3b8' },
    { label: 'Draft', value: stats?.draftCount ?? 0, color: '#64748b' },
    { label: 'Published', value: stats?.publishedCount ?? 0, color: '#38bdf8' },
    { label: 'Active', value: stats?.activeCount ?? 0, color: '#34d399' },
    { label: 'Completed', value: stats?.completedCount ?? 0, color: '#fbbf24' },
    { label: 'Archived', value: stats?.archivedCount ?? 0, color: '#f87171' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
          Assessments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/papers/builder')}
          sx={{ bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
        >
          Create Assessment
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {statCards.map((s) => (
          <Box
            key={s.label}
            sx={{
              flex: '1 1 140px',
              bgcolor: '#1e293b',
              borderRadius: 2,
              p: 2,
              borderLeft: `4px solid ${s.color}`,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
              {s.value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tabs */}
      <Paper sx={{ bgcolor: '#1e293b', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2, pt: 1 }}
        >
          <Tab label="All" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
          <Tab label="Draft" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
          <Tab label="Published" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
          <Tab label="Active" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
          <Tab label="Completed" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
          <Tab label="Archived" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
        </Tabs>
      </Paper>

      {/* Table */}
      <Paper sx={{ bgcolor: '#1e293b', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#0d9488' }} />
          </Box>
        ) : assessments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: '#64748b' }}>No assessments found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: '#94a3b8', borderBottom: '1px solid #334155', fontWeight: 600 } }}>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessments.map((a) => (
                  <TableRow
                    key={a.id}
                    sx={{ '& td': { color: '#e2e8f0', borderBottom: '1px solid #334155' }, '&:hover': { bgcolor: '#253449' } }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'white' }}>
                        {a.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {a.courseCode || a.courseName || a.subjectId}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{a.type || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={a.status}
                        size="small"
                        color={STATUS_COLORS[a.status] || 'default'}
                        sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {a.scheduledDate
                        ? new Date(a.scheduledDate as string).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>{a.totalMarks ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="View">
                          <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={() => navigate(`/admin/assessments/${a.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {a.status === 'draft' && (
                          <Tooltip title="Publish">
                            <IconButton size="small" sx={{ color: '#38bdf8' }} onClick={() => handlePublish(a.id)}>
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {a.status === 'published' && (
                          <Tooltip title="Activate">
                            <IconButton size="small" sx={{ color: '#34d399' }} onClick={() => handleActivate(a.id)}>
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(a.status === 'draft' || a.status === 'published') && (
                          <Tooltip title="Edit">
                            <IconButton size="small" sx={{ color: '#fbbf24' }} onClick={() => navigate(`/admin/papers/builder?edit=${a.id}`)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {a.status !== 'archived' && a.status !== 'active' && (
                          <Tooltip title="Archive">
                            <IconButton size="small" sx={{ color: '#f87171' }} onClick={() => handleArchive(a.id)}>
                              <ArchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}