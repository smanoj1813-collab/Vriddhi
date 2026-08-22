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
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
          Attendance
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ color: '#94a3b8', borderColor: '#334155', '&:hover': { borderColor: '#475569' } }}
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

      {/* Filters + Tabs */}
      <Paper sx={{ bgcolor: '#1e293b', mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, pt: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Class Sessions" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
            <Tab label="Student Summary" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
            <Tab label="Daily Report" sx={{ color: '#cbd5e1', textTransform: 'none' }} />
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
                input: { color: 'white' },
                label: { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': { bgcolor: '#0f172a', borderRadius: 1 },
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#94a3b8' }}>Branch</InputLabel>
              <Select
                value={branch}
                label="Branch"
                onChange={handleBranchChange}
                sx={{ color: 'white', bgcolor: '#0f172a', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#94a3b8' }}>Batch</InputLabel>
              <Select
                value={batch}
                label="Batch"
                onChange={handleBatchChange}
                sx={{ color: 'white', bgcolor: '#0f172a', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }
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
                      <Typography sx={{ color: '#64748b' }}>
                        No sessions found{date ? ` for ${date}` : ''}.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: '#94a3b8', borderBottom: '1px solid #334155', fontWeight: 600 } }}>
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
                              sx={{ '& td': { color: '#e2e8f0', borderBottom: '1px solid #334155' }, '&:hover': { bgcolor: '#253449' } }}
                            >
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, color: 'white' }}>{s.subject}</Typography>
                              </TableCell>
                              <TableCell>{s.topic || '-'}</TableCell>
                              <TableCell>{s.startTime} – {s.endTime}</TableCell>
                              <TableCell>{s.facultyName}</TableCell>
                              <TableCell>{s.batch} / {s.branch}</TableCell>
                              <TableCell>
                                <Chip
                                  label={s.status}
                                  size="small"
                                  sx={{
                                    textTransform: 'capitalize',
                                    bgcolor:
                                      s.status === 'completed' ? '#064e3b' :
                                      s.status === 'ongoing' ? '#78350f' :
                                      s.status === 'cancelled' ? '#450a0a' : '#1e293b',
                                    color:
                                      s.status === 'completed' ? '#34d399' :
                                      s.status === 'ongoing' ? '#fbbf24' :
                                      s.status === 'cancelled' ? '#f87171' : '#94a3b8',
                                    fontWeight: 500,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {s.attendanceMarked ? (
                                  <Chip label="Marked" size="small" sx={{ bgcolor: '#064e3b', color: '#34d399', fontWeight: 500 }} />
                                ) : (
                                  <Chip label="Pending" size="small" sx={{ bgcolor: '#451a03', color: '#fbbf24', fontWeight: 500 }} />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" sx={{ color: '#94a3b8' }}>
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
                      <Typography sx={{ color: '#64748b' }}>No student attendance data available.</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: '#94a3b8', borderBottom: '1px solid #334155', fontWeight: 600 } }}>
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
                              sx={{ '& td': { color: '#e2e8f0', borderBottom: '1px solid #334155' }, '&:hover': { bgcolor: '#253449' } }}
                            >
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, color: 'white' }}>{s.studentName}</Typography>
                              </TableCell>
                              <TableCell>{s.regNo}</TableCell>
                              <TableCell align="center">{s.totalClasses}</TableCell>
                              <TableCell align="center" sx={{ color: '#34d399' }}>{s.present}</TableCell>
                              <TableCell align="center" sx={{ color: '#f87171' }}>{s.absent}</TableCell>
                              <TableCell align="center" sx={{ color: '#fbbf24' }}>{s.late}</TableCell>
                              <TableCell align="center" sx={{ color: '#38bdf8' }}>{s.leave + s.medicalLeave}</TableCell>
                              <TableCell align="right">
                                <Typography sx={{ fontWeight: 700, color: s.percentage >= 75 ? '#34d399' : s.percentage >= 60 ? '#fbbf24' : '#f87171' }}>
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
                  <Typography sx={{ color: '#64748b' }}>Daily report view coming soon.</Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}