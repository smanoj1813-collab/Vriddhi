// pages/Attendance.tsx
// ============================================
// ADMIN ATTENDANCE MANAGEMENT — Real Firestore Data
// ============================================

import { isAllowedAttendanceBatch } from '../../../shared/utils/attendanceBatches';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactElement } from 'react';
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
  TextField,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
  listClassSessions,
  getAllStudentsAttendanceSummary,
  getAttendanceStats,
  getFacultyMap,
} from '../api/attendanceApi';
import type { AttendanceSummary, ClassSession } from '../types/attendance';

// ─── Try to get collegeId from auth context or localStorage ───
function useCollegeId(): string | undefined {
  const [collegeId, setCollegeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Try localStorage first
    const stored = localStorage.getItem('collegeId');
    if (stored) {
      setCollegeId(stored);
      return;
    }
    // Try auth user object
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.collegeId) setCollegeId(user.collegeId);
      }
    } catch {
      // ignore
    }
  }, []);

  return collegeId;
}

export default function Attendance() {
  const collegeId = useCollegeId();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [branch, setBranch] = useState('all');
  const [batch, setBatch] = useState('all');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    avgPercentage: 0,
  });
  const [facultyMap, setFacultyMap] = useState<Map<string, { name: string; id: string }>>(new Map());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string | undefined> = {};
      if (collegeId) filters.collegeId = collegeId;
      if (branch !== 'all') filters.branch = branch;
      if (batch !== 'all') filters.batch = batch;

      const [sessionsData, summaryData, statsData, facultyData] = await Promise.all([
        listClassSessions({ ...filters, date }),
        getAllStudentsAttendanceSummary(filters),
        getAttendanceStats(filters),
        getFacultyMap(collegeId),
      ]);

      // Resolve faculty names
      const resolvedSessions = sessionsData.map((s) => ({
        ...s,
        facultyName: s.facultyName || facultyData.get(s.facultyId)?.name || s.facultyId || 'Unknown',
      }));

      setSessions(resolvedSessions);
      setSummary(summaryData);
      setStats(statsData);
      setFacultyMap(facultyData);
    } catch (e) {
      console.error('[Attendance] fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [collegeId, branch, batch, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique branches & batches from sessions for filter dropdowns
  // Batches are restricted to 2026 and above (older data stays visible, but
  // is no longer selectable as a filter).
  const { branches, batches } = useMemo(() => {
    const bSet = new Set<string>();
    const baSet = new Set<string>();
    sessions.forEach((s) => {
      if (s.branch) bSet.add(s.branch);
      if (s.batch && isAllowedAttendanceBatch(s.batch)) baSet.add(s.batch);
    });
    return { branches: Array.from(bSet), batches: Array.from(baSet) };
  }, [sessions]);

  const statCards = [
    { label: 'Avg Attendance', value: `${stats.avgPercentage.toFixed(1)}%`, color: '#34d399' },
    { label: 'Present', value: stats.present, color: '#34d399' },
    { label: 'Absent', value: stats.absent, color: '#f87171' },
    { label: 'Late', value: stats.late, color: '#fbbf24' },
    { label: 'Leave', value: stats.leave, color: '#38bdf8' },
    { label: 'Total Classes', value: stats.totalClasses, color: '#94a3b8' },
  ];

  const handleBranchChange = (e: SelectChangeEvent) => setBranch(e.target.value);
  const handleBatchChange = (e: SelectChangeEvent) => setBatch(e.target.value);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Attendance
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'text.secondary' } }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
          >
            Mark Attendance
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {statCards.map((s) => (
          <Box
            key={s.label}
            sx={{
              flex: '1 1 140px',
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderLeft: `4px solid ${s.color}`,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {s.value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Filters + Tabs */}
      <Paper sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, pt: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Class Sessions" sx={{ color: 'text.secondary', textTransform: 'none' }} />
            <Tab label="Student Summary" sx={{ color: 'text.secondary', textTransform: 'none' }} />
            <Tab label="Daily Report" sx={{ color: 'text.secondary', textTransform: 'none' }} />
          </Tabs>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              sx={{
                width: 150,
                input: { color: 'text.primary' },
                label: { color: 'text.secondary' },
                '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 1 },
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'text.secondary' }}>Branch</InputLabel>
              <Select
                value={branch}
                label="Branch"
                onChange={handleBranchChange}
                sx={{ color: 'text.primary', bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'text.secondary' }}>Batch</InputLabel>
              <Select
                value={batch}
                label="Batch"
                onChange={handleBatchChange}
                sx={{ color: 'text.primary', bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }
              }
              >
                <MenuItem value="all">All Batches</MenuItem>
                {batches.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} sx={{ color: '#0d9488' }} />
            </Box>
          ) : (
            <>
              {tab === 0 && (
                <>
                  {sessions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography sx={{ color: 'text.secondary' }}>
                        No sessions found{date ? ` for ${date}` : ''}.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 } }}>
                            <TableCell>Subject</TableCell>
                            <TableCell>Topic</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Faculty</TableCell>
                            <TableCell>Batch / Branch</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Attendance</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sessions.map((s) => (
                            <TableRow
                              key={s.id}
                              sx={{ '& td': { color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }, '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{s.subject}</Typography>
                              </TableCell>
                              <TableCell>{s.topic || '-'}</TableCell>
                              <TableCell>{s.startTime} – {s.endTime}</TableCell>
                              <TableCell>{s.facultyName}</TableCell>
                              <TableCell>{s.batch} / {s.branch}</TableCell>
                              <TableCell>
                                <Chip
                                  label={s.status}
                                  size="small"
                                  sx={(theme) => ({
                                    textTransform: 'capitalize',
                                    bgcolor:
                                      s.status === 'completed' ? (theme.palette.mode === 'dark' ? '#064e3b' : '#d1fae5') :
                                      s.status === 'ongoing' ? (theme.palette.mode === 'dark' ? '#78350f' : '#fef3c7') :
                                      s.status === 'cancelled' ? (theme.palette.mode === 'dark' ? '#450a0a' : '#fee2e2') : (theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9'),
                                    color:
                                      s.status === 'completed' ? (theme.palette.mode === 'dark' ? '#34d399' : '#047857') :
                                      s.status === 'ongoing' ? (theme.palette.mode === 'dark' ? '#fbbf24' : '#b45309') :
                                      s.status === 'cancelled' ? (theme.palette.mode === 'dark' ? '#f87171' : '#b91c1c') : 'text.secondary',
                                    fontWeight: 500,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                {s.attendanceMarked ? (
                                  <Chip label="Marked" size="small" sx={(theme) => ({ bgcolor: theme.palette.mode === 'dark' ? '#064e3b' : '#d1fae5', color: theme.palette.mode === 'dark' ? '#34d399' : '#047857', fontWeight: 500 })} />
                                ) : (
                                  <Chip label="Pending" size="small" sx={(theme) => ({ bgcolor: theme.palette.mode === 'dark' ? '#451a03' : '#fef3c7', color: theme.palette.mode === 'dark' ? '#fbbf24' : '#b45309', fontWeight: 500 })} />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}

              {tab === 1 && (
                <>
                  {summary.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography sx={{ color: 'text.secondary' }}>No student attendance data available.</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 } }}>
                            <TableCell>Student</TableCell>
                            <TableCell>Reg No</TableCell>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Present</TableCell>
                            <TableCell align="center">Absent</TableCell>
                            <TableCell align="center">Late</TableCell>
                            <TableCell align="center">Leave</TableCell>
                            <TableCell align="right">%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {summary.map((s) => (
                            <TableRow
                              key={s.studentId}
                              sx={{ '& td': { color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }, '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{s.studentName}</Typography>
                              </TableCell>
                              <TableCell>{s.regNo}</TableCell>
                              <TableCell align="center">{s.totalClasses}</TableCell>
                              <TableCell align="center" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#34d399' : '#047857' })}>{s.present}</TableCell>
                              <TableCell align="center" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#f87171' : '#dc2626' })}>{s.absent}</TableCell>
                              <TableCell align="center" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#fbbf24' : '#b45309' })}>{s.late}</TableCell>
                              <TableCell align="center" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0369a1' })}>{s.leave + s.medicalLeave}</TableCell>
                              <TableCell align="right">
                                <Typography sx={(theme) => ({ fontWeight: 700, color: s.percentage >= 75 ? (theme.palette.mode === 'dark' ? '#34d399' : '#047857') : s.percentage >= 60 ? (theme.palette.mode === 'dark' ? '#fbbf24' : '#b45309') : (theme.palette.mode === 'dark' ? '#f87171' : '#dc2626') })}>
                                  {s.percentage.toFixed(1)}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}

              {tab === 2 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ color: 'text.secondary' }}>Daily report view coming soon.</Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}