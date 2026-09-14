// src/modules/superadmin/pages/SuperAdminEmployeeAttendance.tsx
//
// Internal Employee Portal — attendance, platform level (superadmin).
// Pick a college, then either mark/correct a day roster or review a date
// window with a summary and CSV export. All reads and writes go through
// Cloud Functions; the browser never writes attendance documents directly.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem,
  Paper, Select, Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { CSV_BOM, triggerDownload } from '@/shared/utils/attendanceExport';
import {
  ATTENDANCE_STATUSES,
  listEmployeeAttendance, listEmployees, markEmployeeAttendance,
  exportEmployeeAttendanceCsv,
  type AttendanceStatus, type Employee, type EmployeeAttendanceRow,
} from '../api/employeePortalApi';

const STATUS_CHIP: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  present: 'success', absent: 'error', late: 'warning', 'half-day': 'info', leave: 'default',
};

interface CollegeOption {
  id: string;
  name: string;
}

function dateKey(value: Date): string {
  // Local calendar day — colleges run on IST and the staff mark local days.
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(key: string, days: number): string {
  return dateKey(new Date(new Date(`${key}T00:00:00`).getTime() + days * 86_400_000));
}

export default function SuperAdminEmployeeAttendance() {
  const today = dateKey(new Date());

  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegeId, setCollegeId] = useState('');

  const [mode, setMode] = useState<'day' | 'range'>('day');
  const [day, setDay] = useState(today);
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<EmployeeAttendanceRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; present: number; absent: number; late: number; halfDay: number; leave: number; attendanceRate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  // Day view: pending per-employee status edits keyed by uid.
  const [drafts, setDrafts] = useState<Record<string, AttendanceStatus>>({});
  const [savingUid, setSavingUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDocs(query(collection(db, 'colleges'), orderBy('name'), limit(200)))
      .then((snapshot) => {
        if (cancelled) return;
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return { id: docSnap.id, name: String(data.name || docSnap.id) };
        });
        setColleges(items);
        if (items.length === 1) setCollegeId(items[0].id);
      })
      .catch((err) => !cancelled && setError((err as Error)?.message || 'Could not load colleges'));
    return () => { cancelled = true; };
  }, []);

  const fetchDay = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);
    try {
      const [empResult, attResult] = await Promise.all([
        listEmployees({ collegeId, status: 'active' }),
        listEmployeeAttendance({ collegeId, from: day, to: day }),
      ]);
      setEmployees(empResult.employees);
      setRows(attResult.rows);
      setSummary(attResult.summary);
      const initial: Record<string, AttendanceStatus> = {};
      for (const row of attResult.rows) initial[row.employeeUid] = row.status as AttendanceStatus;
      setDrafts(initial);
    } catch (err) {
      setError((err as Error)?.message || 'Could not load attendance');
    } finally {
      setLoading(false);
    }
  }, [collegeId, day]);

  const fetchRange = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listEmployeeAttendance({ collegeId, from, to });
      setRows(result.rows);
      setSummary(result.summary);
    } catch (err) {
      setError((err as Error)?.message || 'Could not load attendance');
    } finally {
      setLoading(false);
    }
  }, [collegeId, from, to]);

  useEffect(() => {
    if (!collegeId) {
      setEmployees([]);
      setRows([]);
      setSummary(null);
      return;
    }
    void (mode === 'day' ? fetchDay() : fetchRange());
  }, [collegeId, mode, fetchDay, fetchRange]);

  const rowsByUid = useMemo(() => {
    const out: Record<string, EmployeeAttendanceRow> = {};
    for (const row of rows) out[row.employeeUid] = row;
    return out;
  }, [rows]);

  const saveDay = async (employee: Employee) => {
    const status = drafts[employee.uid];
    if (!status) return;
    try {
      setSavingUid(employee.uid);
      await markEmployeeAttendance({ employeeUid: employee.uid, date: day, status });
      setToast(`Marked ${employee.name} as ${status}`);
      await fetchDay();
    } catch (err) {
      setError((err as Error)?.message || 'Could not save attendance');
    } finally {
      setSavingUid(null);
    }
  };

  const handleExport = async () => {
    if (!collegeId) return;
    const start = mode === 'day' ? day : from;
    const end = mode === 'day' ? day : to;
    try {
      const { csv, count } = await exportEmployeeAttendanceCsv({ collegeId, from: start, to: end });
      const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8' });
      triggerDownload(blob, `employee_attendance_${start}${start !== end ? `_to_${end}` : ''}.csv`);
      setToast(`Exported ${count} record(s)`);
    } catch (err) {
      setError((err as Error)?.message || 'Export failed');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Employee Attendance</Typography>
          <Typography variant="body2" color="text.secondary">
            Day attendance for everyone a college employs. Manager corrections are attributed and audited.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={!collegeId}>
          Download CSV
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ width: 300 }}>
          <InputLabel>College</InputLabel>
          <Select
            label="College" value={collegeId}
            onChange={(event) => setCollegeId(String(event.target.value || ''))}
          >
            <MenuItem value=""><em>Select a college…</em></MenuItem>
            {colleges.map((college) => (
              <MenuItem key={college.id} value={college.id}>{college.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          size="small" exclusive value={mode}
          onChange={(_, value) => value && setMode(value)}
        >
          <ToggleButton value="day">Day</ToggleButton>
          <ToggleButton value="range">Range</ToggleButton>
        </ToggleButtonGroup>
        {mode === 'day' ? (
          <TextField
            size="small" type="date" label="Date"
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
            value={day}
            onChange={(event) => event.target.value && setDay(event.target.value)}
          />
        ) : (
          <>
            <TextField
              size="small" type="date" label="From"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
              value={from}
              onChange={(event) => event.target.value && setFrom(event.target.value)}
            />
            <TextField
              size="small" type="date" label="To"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today, min: from } }}
              value={to}
              onChange={(event) => event.target.value && setTo(event.target.value)}
            />
          </>
        )}
        {summary && (
          <Stack direction="row" spacing={1}>
            <Chip size="small" color="success" label={`${summary.present} present`} />
            <Chip size="small" color="error" label={`${summary.absent} absent`} />
            <Chip size="small" color="warning" label={`${summary.late} late`} />
            <Chip size="small" color="info" label={`${summary.halfDay} half-day`} />
            <Chip size="small" label={`${summary.leave} leave`} />
            <Chip size="small" variant="outlined" label={`${summary.attendanceRate}% rate`} />
          </Stack>
        )}
      </Stack>

      {!collegeId ? (
        <Alert severity="info">Choose a college to view its employee attendance.</Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : mode === 'day' ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Check in / out</TableCell>
                <TableCell>Recorded</TableCell>
                <TableCell sx={{ width: 200 }}>Status</TableCell>
                <TableCell align="right">Save</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => {
                const row = rowsByUid[employee.uid];
                const draft = drafts[employee.uid];
                const dirty = draft && draft !== row?.status;
                return (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      {employee.name}
                      <Typography variant="caption" component="span" sx={{ display: 'block' }} color="text.secondary">{employee.email}</Typography>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.department || '—'}</TableCell>
                    <TableCell>{row?.checkIn || row?.checkOut ? `${row?.checkIn || '—'} → ${row?.checkOut || '—'}` : '—'}</TableCell>
                    <TableCell>{row ? (row.source === 'self' ? 'self' : 'manager') : '—'}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          label="Status" value={draft || ''}
                          onChange={(event) => setDrafts({ ...drafts, [employee.uid]: event.target.value as AttendanceStatus })}
                        >
                          <MenuItem value=""><em>not marked</em></MenuItem>
                          {ATTENDANCE_STATUSES.map((status) => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small" variant={dirty ? 'contained' : 'text'}
                        startIcon={<SaveIcon />} disabled={!dirty || savingUid === employee.uid}
                        onClick={() => saveDay(employee)}
                      >
                        {savingUid === employee.uid ? 'Saving…' : 'Save'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No active employees — add or import them on the Employees page first.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check in / out</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Recorded</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{row.department || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.status} color={STATUS_CHIP[row.status] || 'default'} />
                  </TableCell>
                  <TableCell>{row.checkIn || row.checkOut ? `${row.checkIn || '—'} → ${row.checkOut || '—'}` : '—'}</TableCell>
                  <TableCell>{row.note || '—'}</TableCell>
                  <TableCell>{row.source}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No attendance recorded in this window.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
