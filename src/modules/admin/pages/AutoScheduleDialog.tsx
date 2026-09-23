// src/modules/admin/pages/AutoScheduleDialog.tsx
// G4 auto-scheduler dialog: config → dry-run preview (grid + hours/day +
// faculty load + unplaced) → apply. The server is the only writer; this is a
// pure remote-plan renderer (same preview→approve discipline as AutoMap).

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AutoFixHigh as AutoIcon,
  Close as CloseIcon,
  PlayArrow as PreviewIcon,
  PublishRounded as ApplyIcon,
} from '@mui/icons-material';
import { db } from '@/Firebase/config';
import {
  autoGenerateWeeklySchedule,
  type AutoSchedulePlan,
  type AutoScheduleResponse,
} from '../api/autoScheduleApi';
import type { DayOfWeek } from '../types/schedule';

interface CurriculumOption {
  id: string;
  title: string;
  branch: string;
  semester: number;
}

const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface Props {
  collegeId: string;
  open: boolean;
  onClose: () => void;
  /** called after a successful apply so the timetable reloads */
  onApplied: () => void;
}

interface FormState {
  curriculumId: string;
  batch: string;
  division: string;
  section: string;
  periodsPerDay: number;
  startTime: string;
  periodMinutes: number;
  breakAfterPeriod: number;
  breakMinutes: number;
  labSpan: number;
  rooms: string;
  maxPerDay: number;
}

const initialForm: FormState = {
  curriculumId: '',
  batch: String(new Date().getFullYear()),
  division: '',
  section: '',
  periodsPerDay: 5,
  startTime: '08:00',
  periodMinutes: 50,
  breakAfterPeriod: 3,
  breakMinutes: 15,
  labSpan: 2,
  rooms: 'Room 1, Room 2, Room 3',
  maxPerDay: 4,
};

export default function AutoScheduleDialog({ collegeId, open, onClose, onApplied }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<AutoScheduleResponse | null>(null);
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null);
  const [error, setError] = useState('');
  const [appliedInfo, setAppliedInfo] = useState('');

  const curriculaQuery = useQuery({
    queryKey: ['autoScheduleCurricula', collegeId],
    enabled: !!collegeId && open,
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'curriculum'), where('collegeId', '==', collegeId)),
      );
      const out: CurriculumOption[] = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          if (String(data.status ?? 'active') === 'archived') return null;
          return {
            id: d.id,
            title: String(data.title ?? `${data.branch ?? ''} Sem ${data.semester ?? ''}`),
            branch: String(data.branch ?? ''),
            semester: Number(data.semester ?? 0) || 0,
          };
        })
        .filter((c): c is CurriculumOption => c !== null)
        .sort((a, b) => a.title.localeCompare(b.title));
      return out;
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setPreview(null); // config changed → previous plan is stale
    setAppliedInfo('');
  };

  const run = async (dryRun: boolean) => {
    setError('');
    setBusy(dryRun ? 'preview' : 'apply');
    try {
      const res = await autoGenerateWeeklySchedule({
        curriculumId: form.curriculumId,
        batch: form.batch.trim(),
        division: form.division.trim() || undefined,
        section: form.section.trim() || undefined,
        grid: {
          days: ALL_DAYS,
          periodsPerDay: form.periodsPerDay,
          startTime: form.startTime,
          periodMinutes: form.periodMinutes,
          breakAfterPeriod: form.breakAfterPeriod,
          breakMinutes: form.breakMinutes,
          labSpan: form.labSpan,
        },
        rooms: form.rooms.split(',').map((r) => r.trim()).filter(Boolean),
        maxPeriodsPerDayPerFaculty: form.maxPerDay,
        dryRun,
      });
      setPreview(res);
      if (!dryRun) {
        setAppliedInfo(`Applied: ${res.created ?? res.plan.placements.length} slots written to the timetable`);
        onApplied();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auto-schedule failed');
    } finally {
      setBusy(null);
    }
  };

  const plan: AutoSchedulePlan | null = preview?.plan ?? null;
  const dayHeader = (d: DayOfWeek) => d.slice(0, 3).toUpperCase();

  const gridRows = useMemo(() => {
    if (!plan) return [];
    const rows = [];
    for (let p = 1; p <= plan.grid.periodsPerDay; p++) {
      const cells = plan.grid.days.map((day) =>
        plan.placements.filter((x) => x.dayOfWeek === day && x.periodIndex === p),
      );
      const time = plan.placements.find((x) => x.periodIndex === p);
      rows.push({ period: p, time: time ? `${time.startTime}` : '', cells });
    }
    return rows;
  }, [plan]);

  const canRun = !!form.curriculumId && form.batch.trim().length > 0 && busy === null;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoIcon color="primary" />
        Auto-generate timetable
        <Box sx={{ flex: 1 }} />
        {plan && (
          <Chip
            size="small"
            color={plan.summary.unplacedCourses > 0 ? 'warning' : 'success'}
            label={`${plan.summary.periodsPlaced}/${plan.summary.periodsRequested} periods placed`}
          />
        )}
        <IconButton size="small" onClick={onClose} disabled={!!busy}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {appliedInfo && <Alert severity="success" sx={{ mb: 2 }}>{appliedInfo}</Alert>}

        {/* ─── Config ─── */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select fullWidth size="small" label="Curriculum" value={form.curriculumId}
              onChange={(e) => set('curriculumId', e.target.value)}
            >
              {curriculaQuery.data?.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.title} ({c.branch} · Sem {c.semester})</MenuItem>
              )) ?? <MenuItem disabled value="">Loading…</MenuItem>}
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField fullWidth size="small" label="Batch" value={form.batch} onChange={(e) => set('batch', e.target.value)} placeholder="2026" />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField fullWidth size="small" label="Division (opt.)" value={form.division} onChange={(e) => set('division', e.target.value)} />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField fullWidth size="small" label="Section (opt.)" value={form.section} onChange={(e) => set('section', e.target.value)} placeholder="A" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth size="small" label="Rooms (comma-separated)" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} />
          </Grid>

          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="number" label="Periods/day" value={form.periodsPerDay}
              onChange={(e) => set('periodsPerDay', Number(e.target.value) || 5)} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="time" label="Starts" value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="number" label="Min/period" value={form.periodMinutes}
              onChange={(e) => set('periodMinutes', Number(e.target.value) || 50)} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="number" label="Break after P#" value={form.breakAfterPeriod}
              onChange={(e) => set('breakAfterPeriod', Number(e.target.value) || 0)} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="number" label="Break (min)" value={form.breakMinutes}
              onChange={(e) => set('breakMinutes', Number(e.target.value) || 15)} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="number" label="Lab span" value={form.labSpan}
              onChange={(e) => set('labSpan', Number(e.target.value) || 2)} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }}>
            <TextField fullWidth size="small" type="number" label="Faculty max/day" value={form.maxPerDay}
              onChange={(e) => set('maxPerDay', Number(e.target.value) || 4)} />
          </Grid>
          <Grid size={{ xs: 3, md: 1.5 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">Mon–Sat grid · labs auto-spanned · least-loaded room first</Typography>
          </Grid>
        </Grid>

        {/* ─── Preview ─── */}
        {plan && (
          <Box sx={{ mt: 3 }}>
            {/* daily coverage — the "hours per day" answer */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
              {plan.dailyCoverage.map((d) => (
                <Chip
                  key={d.day}
                  variant={d.periods === 0 ? 'outlined' : 'filled'}
                  color={d.utilization >= 0.8 ? 'success' : d.utilization >= 0.4 ? 'primary' : 'default'}
                  label={`${dayHeader(d.day)} ${d.periods}p · ${d.hours}h (${Math.round(d.utilization * 100)}%)`}
                />
              ))}
            </Stack>

            {/* grid */}
            <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, textAlign: 'left' }}>Period</th>
                    {plan.grid.days.map((d) => (
                      <th key={d} style={{ padding: 8, textAlign: 'left' }}>{dayHeader(d)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((row) => (
                    <tr key={row.period} style={{ borderTop: '1px solid rgba(128,128,128,0.2)' }}>
                      <td style={{ padding: 8, whiteSpace: 'nowrap', fontWeight: 600 }}>
                        P{row.period}
                        <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">{row.time}</Typography>
                      </td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} style={{ padding: 4, verticalAlign: 'top' }}>
                          {cell.length === 0 ? (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          ) : (
                            cell.map((x, i) => (
                              <Box key={i} sx={{
                                p: 0.5, mb: 0.5, borderRadius: 1, fontSize: 11, lineHeight: 1.2,
                                bgcolor: x.type === 'lab' ? 'secondary.50' : 'primary.50',
                                border: '1px solid',
                                borderColor: x.type === 'lab' ? 'secondary.200' : 'primary.200',
                              }}>
                                <b>{x.subjectCode || x.subject}</b>
                                <div>{x.facultyName.split(' ').slice(-1)[0]} · {x.room}{x.type === 'lab' ? ' · lab' : ''}</div>
                              </Box>
                            ))
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* faculty load */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Faculty weekly load</Typography>
                {plan.facultyLoad.length === 0 && <Typography variant="caption" color="text.secondary">No faculty loaded.</Typography>}
                {plan.facultyLoad.map((f) => (
                  <Stack key={f.facultyId} direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.25 }}>
                    <Typography variant="body2" sx={{ flex: 1 }} noWrap>{f.facultyName}</Typography>
                    <Chip size="small" variant="outlined" label={`existing ${f.existingWeekly}`} />
                    <Chip size="small" color={f.overloaded ? 'error' : 'primary'}
                      label={`${f.totalWeekly}/${f.capacity}${f.overloaded ? ' overload' : ''}`} />
                  </Stack>
                ))}
              </Grid>
              {/* unplaced */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Unplaced</Typography>
                {plan.unplaced.length === 0 ? (
                  <Alert severity="success" icon={false} sx={{ py: 0.5 }}>Every requested period found a slot.</Alert>
                ) : (
                  plan.unplaced.map((u, i) => (
                    <Alert key={i} severity="warning" sx={{ mb: 0.5, py: 0.5 }}>
                      {u.subject}: placed {u.periodsPlaced}/{u.periodsRequested} — {u.reason}
                    </Alert>
                  ))
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={!!busy}>Close</Button>
        <Button
          variant="outlined" startIcon={<PreviewIcon />}
          disabled={!canRun} onClick={() => run(true)}
        >
          {busy === 'preview' ? 'Planning…' : 'Preview (no writes)'}
        </Button>
        <Button
          variant="contained" startIcon={<ApplyIcon />}
          disabled={!canRun || !plan || plan.placements.length === 0}
          onClick={() => run(false)}
        >
          {busy === 'apply' ? 'Writing…' : `Apply ${plan ? `${plan.placements.length} slots` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
