// src/modules/superadmin/pages/SuperAdminEmployees.tsx
//
// Internal Employee Portal — platform-level directory home (superadmin).
// Lists a chosen college's employees, provisions new ones through the
// audited `provisionEmployee` callable, backfills pre-portal staff, and
// exports the directory as CSV. A superadmin has no claim college, so every
// operation carries the college selected here; the backend re-verifies it
// (functions/src/authorization.ts) — this picker is UX, not authorization.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem,
  Paper, Select, Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { CSV_BOM, triggerDownload } from '@/shared/utils/attendanceExport';
import {
  EMPLOYEE_ROLES, EMPLOYEE_STATUSES,
  backfillEmployeeDirectory, listEmployees, provisionEmployee, setEmployeeStatus, exportEmployeesCsv,
  type Employee, type EmployeeRole, type EmployeeStatus, type ProvisionEmployeeResult,
} from '../api/employeePortalApi';

const ROLE_LABELS: Record<string, string> = {
  faculty: 'Faculty', hod: 'HOD', mentor: 'Mentor', principal: 'Principal', admin: 'Admin',
};

const STATUS_COLOR: Record<string, 'success' | 'default' | 'warning' | 'error'> = {
  active: 'success', inactive: 'default', suspended: 'warning',
};

interface CollegeOption {
  id: string;
  name: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SuperAdminEmployees() {
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegeId, setCollegeId] = useState('');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');

  // Provision dialog
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', role: 'faculty' as EmployeeRole, department: '',
    designation: '', phone: '', employmentType: 'full-time', joiningDate: '',
    qualification: '',
  });
  // One-time credential — shown once, never persisted.
  const [credential, setCredential] = useState<ProvisionEmployeeResult | null>(null);
  const [syncing, setSyncing] = useState(false);

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
        // A single-college platform should not make you click twice.
        if (items.length === 1) setCollegeId(items[0].id);
      })
      .catch((err) => !cancelled && setError((err as Error)?.message || 'Could not load colleges'));
    return () => { cancelled = true; };
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!collegeId) { setEmployees([]); return; }
    try {
      setLoading(true);
      setError(null);
      const result = await listEmployees({ collegeId, status: statusFilter, search });
      setEmployees(result.employees);
    } catch (err) {
      setError((err as Error)?.message || 'Could not load employees');
    } finally {
      setLoading(false);
    }
  }, [collegeId, statusFilter, search]);

  useEffect(() => { void fetchEmployees(); }, [fetchEmployees]);

  const handleProvision = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required');
      return;
    }
    try {
      setSaving(true);
      const result = await provisionEmployee({ ...form, collegeId });
      setCredential(result);
      setProvisionOpen(false);
      setForm({
        name: '', email: '', role: 'faculty', department: '', designation: '',
        phone: '', employmentType: 'full-time', joiningDate: '', qualification: '',
      });
      await fetchEmployees();
    } catch (err) {
      setFormError((err as Error)?.message || 'Provisioning failed');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (employee: Employee, status: EmployeeStatus) => {
    try {
      await setEmployeeStatus({ employeeId: employee.id, status });
      setToast(`${employee.name} is now ${status}`);
      await fetchEmployees();
    } catch (err) {
      setError((err as Error)?.message || 'Status change failed');
    }
  };

  const handleExport = async () => {
    if (!collegeId) return;
    try {
      const { csv, count } = await exportEmployeesCsv({ collegeId, status: statusFilter });
      const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8' });
      triggerDownload(blob, `employees_${collegeId}_${todayKey()}.csv`);
      setToast(`Exported ${count} employee(s)`);
    } catch (err) {
      setError((err as Error)?.message || 'Export failed');
    }
  };

  const handleBackfill = async () => {
    if (!collegeId) return;
    try {
      setSyncing(true);
      const result = await backfillEmployeeDirectory({ collegeId });
      setToast(
        result.created > 0
          ? `Imported ${result.created} existing staff member(s)`
          : 'Nothing to import — every staff profile already has a directory row'
      );
      await fetchEmployees();
    } catch (err) {
      setError((err as Error)?.message || 'Import failed');
    } finally {
      setSyncing(false);
    }
  };

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const emp of employees) out[emp.status] = (out[emp.status] || 0) + 1;
    return out;
  }, [employees]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Employees</Typography>
          <Typography variant="body2" color="text.secondary">
            Provision accounts, manage HR details and export the directory for any college.
            Every change is written to the audit log.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Create directory rows for faculty/staff who were added before the Employee Portal existed. Existing rows are never modified.">
            <span>
              <Button variant="outlined" onClick={handleBackfill} disabled={syncing || !collegeId}>
                {syncing ? 'Importing…' : 'Import existing staff'}
              </Button>
            </span>
          </Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={!collegeId}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setProvisionOpen(true)} disabled={!collegeId}>
            Add Employee
          </Button>
        </Stack>
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
        <TextField
          size="small" label="Search name or email" value={search}
          onChange={(event) => setSearch(event.target.value)} sx={{ width: 280 }}
        />
        <FormControl size="small" sx={{ width: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status" value={statusFilter}
            onChange={(event) => setStatusFilter((event.target.value || '') as EmployeeStatus | '')}
          >
            <MenuItem value="">All</MenuItem>
            {EMPLOYEE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {collegeId && (
          <Typography variant="body2" color="text.secondary">
            {employees.length} shown{counts.active ? ` · ${counts.active} active` : ''}
          </Typography>
        )}
      </Stack>

      {!collegeId ? (
        <Alert severity="info">Choose a college to manage its employees.</Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    {employee.name}
                    {employee.mustChangePassword && (
                      <Tooltip title="Still using the temporary password">
                        <Chip label="temp password" size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{ROLE_LABELS[employee.role] || employee.role}</TableCell>
                  <TableCell>{employee.department || '—'}</TableCell>
                  <TableCell>{employee.designation || '—'}</TableCell>
                  <TableCell>{employee.joiningDate || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status} size="small"
                      color={STATUS_COLOR[employee.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {employee.status === 'active' ? (
                      <Tooltip title="Deactivate — signs the account out and blocks sign-in">
                        <IconButton size="small" color="warning" onClick={() => handleStatus(employee, 'inactive')}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Reactivate">
                        <IconButton size="small" color="success" onClick={() => handleStatus(employee, 'active')}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No employees match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Provision dialog ─────────────────────────────────────────── */}
      <Dialog open={provisionOpen} onClose={() => setProvisionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creates the sign-in account, issues role and college access, and records the action in the audit log.
            A random temporary password is generated unless you supply one.
          </Typography>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2}>
            <TextField
              label="Full name" required size="small" value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              label="Work email" required size="small" type="email" value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role" value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value as EmployeeRole })}
                >
                  {EMPLOYEE_ROLES.map((role) => (
                    <MenuItem key={role} value={role}>{ROLE_LABELS[role] || role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Department" size="small" sx={{ flex: 1 }} value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Designation" size="small" sx={{ flex: 1 }} value={form.designation}
                onChange={(event) => setForm({ ...form, designation: event.target.value })}
              />
              <TextField
                label="Phone" size="small" sx={{ flex: 1 }} value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Employment type</InputLabel>
                <Select
                  label="Employment type" value={form.employmentType}
                  onChange={(event) => setForm({ ...form, employmentType: String(event.target.value) })}
                >
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="visiting">Visiting</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Joining date" size="small" type="date" sx={{ flex: 1 }}
                slotProps={{ inputLabel: { shrink: true } }} value={form.joiningDate}
                onChange={(event) => setForm({ ...form, joiningDate: event.target.value })}
              />
            </Stack>
            <TextField
              label="Qualification" size="small" value={form.qualification}
              onChange={(event) => setForm({ ...form, qualification: event.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProvisionOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProvision} disabled={saving}>
            {saving ? 'Provisioning…' : 'Provision account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── One-time credential ──────────────────────────────────────── */}
      <Dialog open={Boolean(credential)} onClose={() => setCredential(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Account {credential?.created ? 'created' : 'repaired'}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Share this temporary password now — it is shown only once and is not stored anywhere.
            The employee must change it at first sign-in.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>{credential?.email}</Typography>
          <TextField
            fullWidth size="small" value={credential?.temporaryPassword || ''}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => { void navigator.clipboard?.writeText(credential?.temporaryPassword || ''); setToast('Password copied'); }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCredential(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
