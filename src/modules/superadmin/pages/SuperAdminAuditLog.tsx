// src/modules/superadmin/pages/SuperAdminAuditLog.tsx
//
// Internal Employee Portal — audit trail, platform level (superadmin).
// Reads the shared `logs` collection through the `listAuditLogs` callable.
// A superadmin may read every college; leaving the college filter empty
// returns the platform-wide trail. The trail is append-only: Cloud
// Functions write it with the Admin SDK and no client can forge a row
// (pinned by functions/test/firestore.rules.test.ts).

import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem,
  Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { listAuditLogs, type AuditEntry } from '../api/employeePortalApi';

const ACTION_COLORS: Record<string, 'primary' | 'warning' | 'error' | 'success' | 'default'> = {
  'employee.provision': 'success',
  'employee.reprovision': 'warning',
  'employee.status': 'warning',
  'employee.update': 'default',
  'employee.backfill': 'primary',
  'employeeAttendance.managerMark': 'primary',
  'questionBank.create': 'default',
  'questionBank.update': 'default',
  'questionBank.delete': 'error',
  'assessmentTest.duplicate': 'primary',
  grantUserRole: 'warning',
};

interface CollegeOption {
  id: string;
  name: string;
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SuperAdminAuditLog() {
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegeId, setCollegeId] = useState(''); // '' = every college

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    let cancelled = false;
    getDocs(query(collection(db, 'colleges'), orderBy('name'), limit(200)))
      .then((snapshot) => {
        if (cancelled) return;
        setColleges(snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return { id: docSnap.id, name: String(data.name || docSnap.id) };
        }));
      })
      .catch((err) => !cancelled && setError((err as Error)?.message || 'Could not load colleges'));
    return () => { cancelled = true; };
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAuditLogs({
        collegeId: collegeId || undefined,
        action: action || undefined,
        targetEmail: targetEmail || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: 100,
      });
      setEntries(result.entries);
    } catch (err) {
      setError((err as Error)?.message || 'Could not load the audit log');
    } finally {
      setLoading(false);
    }
  }, [collegeId, action, targetEmail, from, to]);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Audit Log</Typography>
          <Typography variant="body2" color="text.secondary">
            Every provisioning, attendance correction, question-bank and test action — newest first, append-only.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchEntries()}>Refresh</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ width: 280 }}>
          <InputLabel>College</InputLabel>
          <Select
            label="College" value={collegeId}
            onChange={(event) => setCollegeId(String(event.target.value || ''))}
          >
            <MenuItem value="">All colleges</MenuItem>
            {colleges.map((college) => (
              <MenuItem key={college.id} value={college.id}>{college.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small" label="Action" value={action} sx={{ width: 220 }}
          placeholder="e.g. employee.provision"
          onChange={(event) => setAction(event.target.value.trim())}
        />
        <TextField
          size="small" label="Target email contains" value={targetEmail} sx={{ width: 240 }}
          onChange={(event) => setTargetEmail(event.target.value.trim())}
        />
        <TextField
          size="small" type="date" label="From" slotProps={{ inputLabel: { shrink: true } }}
          value={from} onChange={(event) => setFrom(event.target.value)}
        />
        <TextField
          size="small" type="date" label="To"
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from } }}
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>College</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatWhen(entry.createdAt)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={entry.action} color={ACTION_COLORS[entry.action] || 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {entry.actorName || entry.actorUid}
                    {entry.actorRole && (
                      <Typography variant="caption" component="span" sx={{ display: 'block' }} color="text.secondary">{entry.actorRole}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.targetEmail || entry.targetUid || entry.targetId || '—'}
                    {entry.targetType && (
                      <Typography variant="caption" component="span" sx={{ display: 'block' }} color="text.secondary">{entry.targetType}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{entry.collegeId || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {entry.details ? JSON.stringify(entry.details) : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No audit entries match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
