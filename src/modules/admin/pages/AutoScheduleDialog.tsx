// src/modules/admin/pages/AutoScheduleDialog.tsx
// G4 auto-scheduler dialog (Auto-Scheduler v2): config → dry-run preview (grid
// + hours/day + faculty load + unplaced + calendar) → apply. The server is the
// only writer; this is a pure remote-plan renderer (same preview→approve
// discipline as AutoMap).
//
// v2 operator controls:
//   P1  Date range (from/to) — the applicability window written to every doc.
//   P2  Per-course table — include checkbox + weekly-periods override,
//       prefilled from the preview's demand list.
//   P3  Pattern (Uniform · Spread · Random) + Room pick (Least-loaded ·
//       Random) + a visible seed with 🎲 regenerate. Same seed = same grid,
//       so preview == apply and a run is reproducible weeks later.

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, IconButton, MenuItem, Stack, Switch,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
  Table, TableBody, TableCell, TableHead, TableRow, Checkbox,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AutoFixHigh as AutoIcon,
  Casino as SeedIcon,
  Close as CloseIcon,
  EventBusy as BlockIcon,
  PlayArrow as PreviewIcon,
  PublishRounded as ApplyIcon,
} from '@mui/icons-material';
import { db } from '@/Firebase/config';
import {
  autoGenerateWeeklySchedule,
  type AutoSchedulePlan,
  type AutoScheduleRequest,
  type AutoScheduleResponse,
  type PlacementStrategy,
  type RoomStrategy,
} from '../api/autoScheduleApi';
import type { DayOfWeek } from '../types/schedule';

interface CurriculumOption {
  id: string;
  title: string;
  branch: string;
  semester: number;
}

const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const STRATEGY_INFO: Record<PlacementStrategy, string> = {
  uniform: 'Machine-stamped: every day identical, earliest periods first (pre-v2 behaviour).',
  spread: 'Rotated days + early/late period dispersion — a varied grid, still deterministic.',
  random: 'Seeded shuffle of days and periods — different look per seed, constraints unchanged.',
};

const ROOM_INFO: Record<RoomStrategy, string> = {
  leastLoaded: 'Fill the emptiest room first (spreads utilisation).',
  random: 'Seeded pick among the rooms free for that span.',
};

/** Fresh run seed — shown in the dialog; 🎲 rolls another. */
function newSeed(): string {
  return `run-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

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
  dateFrom: string;
  dateTo: string;
  strategy: PlacementStrategy;
  roomStrategy: RoomStrategy;
  seed: string;
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
  dateFrom: '',
  dateTo: '',
  strategy: 'uniform',
  roomStrategy: 'leastLoaded',
  seed: '',
};

interface OverrideEdit {
  include?: boolean;
  periods?: number | null;
}

export default function AutoScheduleDialog({ collegeId, open, onClose, onApplied }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<AutoScheduleResponse | null>(null);
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null);
  const [error, setError] = useState('');
  const [appliedInfo, setAppliedInfo] = useState('');
  // P2 — user edits only. Untouched rows send NO override, so the server's
  // derivation (and its truthful "0 contact hours" unplaced reason) survives.
  const [overrides, setOverrides] = useState<Record<string, OverrideEdit>>({});
  // Last known demand list (survives config edits that invalidate the preview).
  const [demand, setDemand] = useState<AutoSchedulePlan['demand']>([]);

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

  /** Cohort identity changed — the override table no longer describes these courses. */
  const setCohort = (key: 'curriculumId' | 'batch' | 'division' | 'section', value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setPreview(null);
    setAppliedInfo('');
    setOverrides({});
    setDemand([]);
  };

  const buildRequest = (dryRun: boolean): AutoScheduleRequest => {
    const overrideRows = Object.entries(overrides).map(([mappingId, edit]) => ({
      mappingId,
      ...(edit.include === undefined ? {} : { include: edit.include }),
      ...(edit.periods === undefined || edit.periods === null ? {} : { weeklyPeriods: edit.periods }),
    }));
    return {
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
      ...(form.dateFrom
        ? { dateRange: { from: form.dateFrom, ...(form.dateTo ? { to: form.dateTo } : {}) } }
        : {}),
      strategy: form.strategy,
      ...(form.strategy === 'random' || form.roomStrategy === 'random'
        ? { randomSeed: form.seed || undefined }
        : {}),
      roomStrategy: form.roomStrategy,
      ...(overrideRows.length > 0 ? { courseOverrides: overrideRows } : {}),
    };
  };

  const run = async (dryRun: boolean) => {
    setError('');
    setBusy(dryRun ? 'preview' : 'apply');
    try {
      const res = await autoGenerateWeeklySchedule(buildRequest(dryRun));
      setPreview(res);
      if (Array.isArray(res.plan.demand) && res.plan.demand.length > 0) setDemand(res.plan.demand);
      // Server generated a seed for a seedless random run — pin it locally so
      // apply replays exactly the previewed grid.
      if (res.randomSeed && !form.seed) setForm((f) => ({ ...f, seed: res.randomSeed as string }));
      if (!dryRun) {
        setAppliedInfo(`Applied: ${res.created ?? res.plan.placements.length} slots written to the timetable${form.dateFrom ? ` (valid ${form.dateFrom}${form.dateTo ? ` → ${form.dateTo}` : ''})` : ''}`);
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
  const dateRangeInvalid = !!form.dateTo && !!form.dateFrom && form.dateTo < form.dateFrom;

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
        {preview?.warnings?.map((w, i) => (
          <Alert key={i} severity="info" sx={{ mb: 1 }}>{w}</Alert>
        ))}

        {/* ─── Config ─── */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select fullWidth size="small" label="Curriculum" value={form.curriculumId}
              onChange={(e) => setCohort('curriculumId', e.target.value)}
            >
              {curriculaQuery.data?.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.title} ({c.branch} · Sem {c.semester})</MenuItem>
              )) ?? <MenuItem disabled value="">Loading…</MenuItem>}
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField fullWidth size="small" label="Batch" value={form.batch} onChange={(e) => setCohort('batch', e.target.value)} placeholder="2026" helperText="Multi-intake: 2027, 2028" />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField fullWidth size="small" label="Division (opt.)" value={form.division} onChange={(e) => setCohort('division', e.target.value)} />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <TextField fullWidth size="small" label="Section (opt.)" value={form.section} onChange={(e) => setCohort('section', e.target.value)} placeholder="A" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth size="small" label="Rooms (comma-separated)" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} />
          </Grid>

          {/* P1 — applicability window */}
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth size="small" type="date" label="Applies from" value={form.dateFrom}
              onChange={(e) => set('dateFrom', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={dateRangeInvalid}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth size="small" type="date" label="…to (optional)" value={form.dateTo}
              onChange={(e) => set('dateTo', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={dateRangeInvalid}
              helperText={dateRangeInvalid ? 'to < from' : 'Empty = open-ended'}
            />
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

          {/* P3 — pattern + room pick + seed */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="caption" color="text.secondary">Pattern</Typography>
            <ToggleButtonGroup
              exclusive size="small" fullWidth value={form.strategy}
              onChange={(_, v: PlacementStrategy | null) => v && set('strategy', v)}
            >
              <ToggleButton value="uniform">Uniform</ToggleButton>
              <ToggleButton value="spread">Spread</ToggleButton>
              <ToggleButton value="random">Random</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {STRATEGY_INFO[form.strategy]}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Room pick</Typography>
            <ToggleButtonGroup
              exclusive size="small" fullWidth value={form.roomStrategy}
              onChange={(_, v: RoomStrategy | null) => v && set('roomStrategy', v)}
            >
              <ToggleButton value="leastLoaded">Least-loaded</ToggleButton>
              <ToggleButton value="random">Random</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {ROOM_INFO[form.roomStrategy]}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="caption" color="text.secondary">Seed (same seed = same grid)</Typography>
            <Stack direction="row" spacing={0.5}>
              <TextField
                fullWidth size="small" value={form.seed} placeholder="auto"
                onChange={(e) => set('seed', e.target.value)}
              />
              <Tooltip title="Roll a new seed">
                <IconButton onClick={() => set('seed', newSeed())}><SeedIcon /></IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Preview and Apply replay this seed — regenerate for a different layout.
            </Typography>
          </Grid>
        </Grid>

        {/* ─── P4 — calendar summary ─── */}
        {plan?.calendar && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
            <Chip
              size="small"
              icon={<BlockIcon />}
              color={(plan.summary.blockedDays ?? 0) > 0 ? 'warning' : 'default'}
              label={
                plan.summary.teachingDays !== undefined
                  ? `Teaching days: ${plan.summary.teachingDays} · Blocked: ${plan.summary.blockedDays ?? 0}`
                  : `${(plan.calendar?.events ?? []).length} calendar events`
              }
            />
            {Object.entries(plan.summary.blockedBreakdown ?? {}).map(([type, n]) => (
              <Chip key={type} size="small" variant="outlined" label={`${type}: ${n} day${n === 1 ? '' : 's'}`} />
            ))}
            {plan.calendar?.blockedWeekdays.map((bw) => (
              <Chip key={bw.day} size="small" color="warning" variant="outlined" label={`${dayHeader(bw.day)} ⛔ ${bw.titles.join(' · ')}`} />
            ))}
          </Stack>
        )}

        {/* ─── P2 — course overrides ─── */}
        {demand.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Courses this run {Object.keys(overrides).length > 0 ? `(${Object.keys(overrides).length} edited — clear edits by closing the dialog)` : ''}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">In</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Faculty</TableCell>
                  <TableCell sx={{ width: 130 }}>Periods/week</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demand.map((row) => {
                  const edit = overrides[row.mappingId] ?? {};
                  const included = edit.include ?? row.included;
                  const periods = edit.periods !== undefined ? edit.periods : row.periodsRequested;
                  return (
                    <TableRow key={row.mappingId} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={included}
                          onChange={(e) =>
                            setOverrides((o) => ({ ...o, [row.mappingId]: { ...o[row.mappingId], include: e.target.checked } }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <b>{row.courseCode}</b> {row.courseName}
                      </TableCell>
                      <TableCell>{row.facultyName}</TableCell>
                      <TableCell>
                        <TextField
                          size="small" type="number" value={periods} disabled={!included}
                          onChange={(e) => {
                            const v = e.target.value === '' ? null : Number(e.target.value);
                            setOverrides((o) => ({ ...o, [row.mappingId]: { ...o[row.mappingId], periods: v } }));
                          }}
                          sx={{ width: 100 }}
                          slotProps={{ htmlInput: { min: 0, max: 40 } }}
                        />
                      </TableCell>
                      <TableCell>
                        {row.source === 'zero-hours' ? (
                          <Typography variant="caption" color="warning.main">{row.reason ?? 'course has 0 contact hours — set weeklyPeriods'}</Typography>
                        ) : row.source === 'override' ? (
                          <Chip size="small" variant="outlined" label="overridden" />
                        ) : row.source === 'excluded' ? (
                          <Typography variant="caption" color="text.secondary">{row.reason ?? 'excluded'}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">from curriculum hours</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

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

        <Divider sx={{ mt: 2 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Hard constraints (cohort/faculty/room busy, daily cap, one span/day, lab contiguity) hold in every
          pattern — only the preference order changes. Weekly 24-period UGC ceiling is flagged, never hidden.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={!!busy}>Close</Button>
        <Button
          variant="outlined" startIcon={<PreviewIcon />}
          disabled={!canRun || dateRangeInvalid} onClick={() => run(true)}
        >
          {busy === 'preview' ? 'Planning…' : 'Preview (no writes)'}
        </Button>
        <Button
          variant="contained" startIcon={<ApplyIcon />}
          disabled={!canRun || dateRangeInvalid || !plan || plan.placements.length === 0}
          onClick={() => run(false)}
        >
          {busy === 'apply' ? 'Writing…' : `Apply ${plan ? `${plan.placements.length} slots` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
