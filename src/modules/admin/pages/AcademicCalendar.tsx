// src/modules/admin/pages/AcademicCalendar.tsx
// Academic calendar admin page (Auto-Scheduler v2 — P4): the college's
// holidays, fests and exam windows in one place. Month grid with colour-coded
// type chips + list view, create/edit/delete through the callable single door
// (rules deny client writes), and a one-click "Import Karnataka public
// holidays (year)" from the bundled static list.
//
// Consumers elsewhere: `generateClassSessions` suppresses sessions on
// suspendsClasses dates; AutoScheduleDialog reports teachingDays vs
// blockedDays; the timetable screens banner "Holiday — no classes".

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  EventBusy as BlockIcon,
  FileDownload as ImportIcon,
} from '@mui/icons-material';
import {
  deleteCalendarEvent,
  fetchCalendarEvents,
  importKarnatakaHolidays,
  saveCalendarEvent,
} from '../api/calendarApi';
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_TYPE_COLORS,
  CALENDAR_TYPE_LABELS,
  DEFAULT_SUSPENDS_CLASSES,
  type CalendarEvent,
  type CalendarEventType,
} from '@/shared/types/calendarEvent';
import { karnatakaHolidayYears } from '@/shared/data/karnatakaPublicHolidays';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface EditorState {
  id: string | null;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  suspendsClasses: boolean;
  notes: string;
}

function emptyEditor(dateKey: string): EditorState {
  return {
    id: null,
    title: '',
    type: 'public-holiday',
    startDate: dateKey,
    endDate: dateKey,
    suspendsClasses: DEFAULT_SUSPENDS_CLASSES['public-holiday'],
    notes: '',
  };
}

function eventToEditor(e: CalendarEvent): EditorState {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    startDate: e.startDate,
    endDate: e.endDate,
    suspendsClasses: e.suspendsClasses,
    notes: e.notes ?? '',
  };
}

/** Local-date key helpers (never UTC — a holiday is a local date). */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}
function fmtShort(key: string): string {
  return parseKey(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AcademicCalendar() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tab, setTab] = useState(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [importYear, setImportYear] = useState(karnatakaHolidayYears()[0]);
  const [confirmDelete, setConfirmDelete] = useState<CalendarEvent | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['academicCalendar', 'admin'],
    queryFn: () => fetchCalendarEvents(),
  });
  const events = eventsQuery.data ?? [];

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      // Multi-day events paint every day they cover (study holidays span weeks).
      let d = parseKey(e.startDate);
      const end = parseKey(e.endDate);
      let guard = 0;
      while (d <= end && guard < 400) {
        const key = dateKey(d);
        map.set(key, [...(map.get(key) ?? []), e]);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        guard += 1;
      }
    }
    return map;
  }, [events]);

  // Month grid: weeks Mon→Sun, leading blanks for the first partial week.
  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  const saveMutation = useMutation({
    mutationFn: (payload: EditorState) =>
      saveCalendarEvent({
        ...(payload.id ? { id: payload.id } : {}),
        title: payload.title.trim(),
        type: payload.type,
        startDate: payload.startDate,
        endDate: payload.endDate,
        suspendsClasses: payload.suspendsClasses,
        notes: payload.notes.trim(),
      }),
    onSuccess: (res) => {
      setEditor(null);
      setError('');
      setInfo(
        res.warnings.length > 0
          ? `Saved — check overlaps: ${res.warnings.join('; ')}`
          : res.updated
            ? 'Event updated'
            : 'Event created',
      );
      queryClient.invalidateQueries({ queryKey: ['academicCalendar'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      setConfirmDelete(null);
      setInfo('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['academicCalendar'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Delete failed'),
  });

  const importMutation = useMutation({
    mutationFn: (year: number) => importKarnatakaHolidays(year),
    onSuccess: (res) => {
      setInfo(`Imported ${res.created} Karnataka public holidays for ${importYear} — verify tentative (lunar) dates`);
      queryClient.invalidateQueries({ queryKey: ['academicCalendar'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Import failed'),
  });

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" sx={{ mb: 2, gap: 1, flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
        <EventIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>Academic Calendar</Typography>
        <TextField
          select size="small" label="Import year" value={importYear}
          onChange={(e) => setImportYear(Number(e.target.value))}
          sx={{ minWidth: 120 }}
        >
          {karnatakaHolidayYears().map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined" startIcon={<ImportIcon />} disabled={importMutation.isPending}
          onClick={() => importMutation.mutate(importYear)}
        >
          Import Karnataka public holidays
        </Button>
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => setEditor(emptyEditor(dateKey(new Date())))}
        >
          New event
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo('')}>{info}</Alert>}

      <Stack direction="row" sx={{ mb: 1, alignItems: 'center', gap: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Month" />
          <Tab label="List" />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        {tab === 0 && (
          <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
            <IconButton size="small" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <PrevIcon />
            </IconButton>
            <Typography sx={{ minWidth: 160, textAlign: 'center', fontWeight: 600 }}>{monthLabel}</Typography>
            <IconButton size="small" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <NextIcon />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {tab === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {DAY_LABELS.map((d) => (
                <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 700, color: 'text.secondary', py: 0.5 }}>
                  {d}
                </Typography>
              ))}
              {weeks.flat().map((day, i) => {
                if (!day) return <Box key={`blank-${i}`} sx={{ minHeight: 84, bgcolor: 'action.hover', opacity: 0.3, borderRadius: 1 }} />;
                const key = dateKey(day);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isToday = key === dateKey(new Date());
                return (
                  <Box
                    key={key}
                    onClick={() => setEditor(emptyEditor(key))}
                    sx={{
                      minHeight: 84,
                      p: 0.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isToday ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: isToday ? 700 : 400 }}>
                      {day.getDate()}
                    </Typography>
                    <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                      {dayEvents.map((e) => (
                        <Chip
                          key={e.id}
                          size="small"
                          label={`${e.suspendsClasses ? '⛔ ' : ''}${e.title}`}
                          onClick={(ev) => { ev.stopPropagation(); setEditor(eventToEditor(e)); }}
                          sx={{
                            height: 20,
                            fontSize: 10.5,
                            justifyContent: 'flex-start',
                            bgcolor: CALENDAR_TYPE_COLORS[e.type],
                            color: '#fff',
                            '& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Dates</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Classes</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No events yet — add one, or import the Karnataka public holidays.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {events.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {fmtShort(e.startDate)}
                    {e.endDate !== e.startDate ? ` → ${fmtShort(e.endDate)}` : ''}
                  </TableCell>
                  <TableCell>{e.suspendsClasses ? '⛔ ' : ''}{e.title}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={CALENDAR_TYPE_LABELS[e.type] ?? e.type}
                      sx={{ bgcolor: CALENDAR_TYPE_COLORS[e.type], color: '#fff', height: 22 }}
                    />
                  </TableCell>
                  <TableCell>{e.suspendsClasses ? 'Suspended' : 'Run normally'}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}><Typography variant="caption" noWrap>{e.notes}</Typography></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditor(eventToEditor(e))}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setConfirmDelete(e)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Create / edit ── */}
      <Dialog open={!!editor} onClose={() => setEditor(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editor?.id ? 'Edit calendar event' : 'New calendar event'}</DialogTitle>
        <DialogContent dividers>
          {editor && (
            <Stack spacing={2}>
              <TextField
                fullWidth size="small" label="Title" value={editor.title}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                placeholder="Diwali / Study holidays / IA exams…"
              />
              <TextField
                select fullWidth size="small" label="Type" value={editor.type}
                onChange={(e) => {
                  const type = e.target.value as CalendarEventType;
                  setEditor({ ...editor, type, suspendsClasses: DEFAULT_SUSPENDS_CLASSES[type] });
                }}
              >
                {CALENDAR_EVENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{CALENDAR_TYPE_LABELS[t]}</MenuItem>
                ))}
              </TextField>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth size="small" type="date" label="From" value={editor.startDate}
                  onChange={(e) => setEditor({ ...editor, startDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth size="small" type="date" label="To" value={editor.endDate}
                  onChange={(e) => setEditor({ ...editor, endDate: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={editor.suspendsClasses}
                    onChange={(e) => setEditor({ ...editor, suspendsClasses: e.target.checked })}
                  />
                }
                label={
                  editor.suspendsClasses
                    ? '⛔ Suspends classes (no sessions generated on these dates)'
                    : 'Classes run normally (fest/event)'
                }
              />
              <TextField
                fullWidth size="small" multiline minRows={2} label="Notes (optional)" value={editor.notes}
                onChange={(e) => setEditor({ ...editor, notes: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditor(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              !editor ||
              !editor.title.trim() ||
              !editor.startDate ||
              !editor.endDate ||
              editor.endDate < editor.startDate ||
              saveMutation.isPending
            }
            onClick={() => editor && saveMutation.mutate(editor)}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete event?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            “{confirmDelete?.title}” ({confirmDelete ? `${fmtShort(confirmDelete.startDate)}${confirmDelete.endDate !== confirmDelete.startDate ? ` → ${fmtShort(confirmDelete.endDate)}` : ''}` : ''})
            will be removed from the academic calendar. Sessions already generated are unaffected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            color="error" variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {CALENDAR_EVENT_TYPES.map((t) => (
          <Chip
            key={t}
            size="small"
            icon={DEFAULT_SUSPENDS_CLASSES[t] ? <BlockIcon sx={{ color: '#fff !important' }} /> : undefined}
            label={`${CALENDAR_TYPE_LABELS[t]}${DEFAULT_SUSPENDS_CLASSES[t] ? ' — no classes' : ''}`}
            sx={{ bgcolor: CALENDAR_TYPE_COLORS[t], color: '#fff' }}
          />
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          ⛔ = suspends classes (generateClassSessions skips these dates). Fests run normally.
        </Typography>
      </Stack>
    </Box>
  );
}
