// src/modules/admin/pages/SchemePacks.tsx
// University Scheme Packs (G1) — the control room for "which university's
// rules does this college run on". One college assigns ONE pack; presets are
// verified-in-code, customs are authored here (clone a preset and edit).
// Everything downstream (result importer, hall tickets, compliance
// dashboard) reads through getCollegeSchemePack.

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon, AssignmentTurnedIn as AssignIcon, ContentCopy as CloneIcon,
  Delete as DeleteIcon, Edit as EditIcon, School as SchoolIcon,
} from '@mui/icons-material';
import {
  assignCollegeSchemePack,
  fetchSchemePacks,
  getCollegeSchemePack,
  saveSchemePack,
  type ListedSchemePack,
} from '../api/schemePackApi';
import { DEFAULT_SCHEME_PACK } from '@/shared/types/schemePack';
import type {
  AttendanceMarksSlab,
  SchemeGrade,
  UniversitySchemePack,
} from '@/shared/types/schemePack';

// ─── Editor state ────────────────────────────────────────────────────────────

interface EditorState {
  id: string | null; // null = creating
  code: string;
  name: string;
  universityName: string;
  schemeName: string;
  applicableProgrammes: string; // comma separated
  mediums: string;
  minimumPercentage: number;
  blocksExamEligibility: boolean;
  slabs: AttendanceMarksSlab[];
  iaTotal: number;
  testCount: number;
  testMaxEach: number;
  testBestOf: number;
  testWeight: number;
  attendanceMax: number;
  assignmentMax: number;
  seeMax: number;
  seeDuration: number;
  seePass: number;
  aggPass: number;
  minInternal: number;
  requireSeePass: boolean;
  grades: SchemeGrade[];
  sourceNote: string;
}

function packToEditor(pack: UniversitySchemePack, newCode = ''): EditorState {
  return {
    id: newCode ? null : (pack.id.includes('__') ? pack.id : null),
    code: newCode || pack.code,
    name: pack.name,
    universityName: pack.universityName,
    schemeName: pack.schemeName,
    applicableProgrammes: pack.applicableProgrammes.join(', '),
    mediums: pack.mediums.join(', '),
    minimumPercentage: pack.attendance.minimumPercentage,
    blocksExamEligibility: pack.attendance.blocksExamEligibility,
    slabs: pack.attendance.marksSlabs.map((s) => ({ ...s })),
    iaTotal: pack.internalAssessment.totalMarks,
    testCount: pack.internalAssessment.test.count,
    testMaxEach: pack.internalAssessment.test.maxMarksEach,
    testBestOf: pack.internalAssessment.test.bestOf,
    testWeight: pack.internalAssessment.test.weightInTotal,
    attendanceMax: pack.internalAssessment.attendanceMaxMarks,
    assignmentMax: pack.internalAssessment.assignmentMaxMarks,
    seeMax: pack.semesterEndExam.defaultMaxMarks,
    seeDuration: pack.semesterEndExam.durationMinutes,
    seePass: pack.semesterEndExam.passPercentage,
    aggPass: pack.passCriteria.aggregatePassPercentage,
    minInternal: pack.passCriteria.minimumInternalPercentage,
    requireSeePass: pack.passCriteria.requireSemesterEndPass,
    grades: pack.gradeTable.map((g) => ({ ...g })),
    sourceNote: pack.sourceNote ?? '',
  };
}

function editorToPayload(s: EditorState): Record<string, unknown> {
  const split = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  return {
    code: s.code,
    name: s.name,
    universityName: s.universityName,
    schemeName: s.schemeName,
    applicableProgrammes: split(s.applicableProgrammes),
    mediums: split(s.mediums),
    attendance: {
      minimumPercentage: s.minimumPercentage,
      marksSlabs: s.slabs,
      blocksExamEligibility: s.blocksExamEligibility,
    },
    internalAssessment: {
      totalMarks: s.iaTotal,
      test: {
        count: s.testCount,
        maxMarksEach: s.testMaxEach,
        bestOf: s.testBestOf,
        weightInTotal: s.testWeight,
      },
      attendanceMaxMarks: s.attendanceMax,
      assignmentMaxMarks: s.assignmentMax,
    },
    semesterEndExam: {
      defaultMaxMarks: s.seeMax,
      durationMinutes: s.seeDuration,
      passPercentage: s.seePass,
    },
    passCriteria: {
      aggregatePassPercentage: s.aggPass,
      minimumInternalPercentage: s.minInternal,
      requireSemesterEndPass: s.requireSeePass,
    },
    gradeTable: s.grades,
    status: 'active',
    sourceNote: s.sourceNote,
  };
}

// ─── Small field helper ──────────────────────────────────────────────────────

function Num({ label, value, onChange, width = 120 }: { label: string; value: number; onChange: (n: number) => void; width?: number }) {
  return (
    <TextField
      label={label}
      size="small"
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      sx={{ width }}
      slotProps={{ htmlInput: { min: 0 } }}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SchemePacks() {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState('');

  const assignedQuery = useQuery({
    queryKey: ['schemePack', 'assigned'],
    queryFn: () => getCollegeSchemePack(),
  });
  const packsQuery = useQuery({
    queryKey: ['schemePack', 'list'],
    queryFn: () => fetchSchemePacks(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['schemePack'] });
    queryClient.invalidateQueries({ queryKey: ['bcuCompliancePack'] });
    queryClient.invalidateQueries({ queryKey: ['resultImporterPack'] });
  };

  const assignMutation = useMutation({
    mutationFn: (id: string | null) => assignCollegeSchemePack(id),
    onSuccess: refresh,
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Assignment failed'),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveSchemePack(payload),
    onSuccess: () => { setEditor(null); refresh(); },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  const assignedId = assignedQuery.data?.schemePackId ?? null;
  const assignedName = assignedQuery.data?.pack.name ?? '…';
  const packs = packsQuery.data ?? [];

  const facts = (p: UniversitySchemePack) =>
    `${p.semesterEndExam.defaultMaxMarks} SEE + ${p.internalAssessment.totalMarks} IA · ` +
    `${p.attendance.minimumPercentage}% attendance floor · ` +
    `${p.semesterEndExam.passPercentage}% exam / ${p.passCriteria.aggregatePassPercentage}% aggregate to pass · ` +
    `${p.mediums.join(' / ') || 'English'}`;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>University Scheme Packs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
            One pack per college: marks split, internal-assessment composition, attendance slabs,
            pass criteria and grades. The active pack drives the compliance dashboard, hall-ticket
            blocking and result import.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            icon={<AssignIcon />}
            color="primary"
            variant="outlined"
            label={`Active: ${assignedName}${assignedId ? '' : ' (default)'}`}
            sx={{ maxWidth: 360 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setError(''); setEditor(packToEditor(DEFAULT_SCHEME_PACK, 'CUSTOM_' + Math.random().toString(36).slice(2, 7).toUpperCase())); }}
          >
            New Pack
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2}>
        {packs.map((item: ListedSchemePack) => {
          const p = item.pack;
          const isAssigned = (assignedId ?? p.code) === p.code || assignedId === p.id;
          return (
            <Grid key={item.origin + ':' + (item.origin === 'custom' ? p.id : p.code)} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <SchoolIcon color={isAssigned ? 'primary' : 'disabled'} fontSize="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>{p.name}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                    <Chip size="small" label={p.code} variant="outlined" />
                    <Chip size="small" label={item.origin === 'preset' ? 'Built-in preset' : 'Custom'} color={item.origin === 'preset' ? 'default' : 'secondary'} variant="outlined" />
                    {isAssigned && <Chip size="small" color="success" label="Assigned" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{p.universityName} · {p.schemeName}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{facts(p)}</Typography>
                  {p.sourceNote && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
                      Source: {p.sourceNote}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant={isAssigned ? 'outlined' : 'contained'}
                      disabled={isAssigned || assignMutation.isPending || item.origin === 'preset' && false}
                      onClick={() => assignMutation.mutate(item.origin === 'preset' ? p.code : p.id)}
                    >
                      {isAssigned ? 'Assigned' : 'Assign to College'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={item.origin === 'custom' ? <EditIcon /> : <CloneIcon />}
                      onClick={() => {
                        setError('');
                        setEditor(
                          item.origin === 'custom'
                            ? packToEditor(p)
                            : packToEditor(p, p.code.includes('KUD') ? 'CUSTOM_KUD' : 'CUSTOM_' + p.code),
                        );
                      }}
                    >
                      {item.origin === 'custom' ? 'Edit' : 'Clone'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {packs.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">Loading packs…</Alert>
          </Grid>
        )}
      </Grid>

      {/* ─── Editor dialog ─── */}
      <Dialog open={!!editor} onClose={() => setEditor(null)} maxWidth="md" fullWidth>
        {editor && (
          <>
            <DialogTitle>{editor.id ? `Edit custom pack (${editor.code})` : 'Create custom pack'}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="overline" color="text.secondary">Identity</Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5, mb: 2 }}>
                <TextField label="Code" size="small" value={editor.code} disabled={!!editor.id}
                  onChange={(e) => setEditor({ ...editor, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} sx={{ width: 200 }}
                  helperText="letters/digits/underscore" />
                <TextField label="Display name" size="small" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} sx={{ minWidth: 260, flex: 1 }} />
                <TextField label="University" size="small" value={editor.universityName} onChange={(e) => setEditor({ ...editor, universityName: e.target.value })} sx={{ minWidth: 240, flex: 1 }} />
                <TextField label="Scheme name" size="small" value={editor.schemeName} onChange={(e) => setEditor({ ...editor, schemeName: e.target.value })} sx={{ width: 180 }} />
                <TextField label="Programmes (comma)" size="small" value={editor.applicableProgrammes} onChange={(e) => setEditor({ ...editor, applicableProgrammes: e.target.value })} sx={{ minWidth: 240, flex: 1 }} />
                <TextField label="Mediums (comma)" size="small" value={editor.mediums} onChange={(e) => setEditor({ ...editor, mediums: e.target.value })} sx={{ width: 220 }} />
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary">Attendance</Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1, mb: 1 }}>
                <Num label="Minimum %" value={editor.minimumPercentage} onChange={(n) => setEditor({ ...editor, minimumPercentage: n })} />
                <FormControlLabel
                  control={<Switch checked={editor.blocksExamEligibility} onChange={(e) => setEditor({ ...editor, blocksExamEligibility: e.target.checked })} />}
                  label="Blocks exam eligibility below minimum"
                />
              </Stack>
              {editor.slabs.map((s, i) => (
                <Stack key={i} direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                  <Num label="From %" width={100} value={s.min} onChange={(n) => setEditor({ ...editor, slabs: editor.slabs.map((x, j) => (j === i ? { ...x, min: n } : x)) })} />
                  <Num label="To %" width={100} value={s.max} onChange={(n) => setEditor({ ...editor, slabs: editor.slabs.map((x, j) => (j === i ? { ...x, max: n } : x)) })} />
                  <Num label="Marks" width={90} value={s.marks} onChange={(n) => setEditor({ ...editor, slabs: editor.slabs.map((x, j) => (j === i ? { ...x, marks: n } : x)) })} />
                  <TextField size="small" label="Label" value={s.label} onChange={(e) => setEditor({ ...editor, slabs: editor.slabs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} sx={{ width: 170 }} />
                  <IconButton size="small" onClick={() => setEditor({ ...editor, slabs: editor.slabs.filter((_, j) => j !== i) })}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              ))}
              <Button size="small" onClick={() => setEditor({ ...editor, slabs: [...editor.slabs, { min: editor.minimumPercentage, max: 100, marks: 1, label: 'New slab' }] })}>+ Add slab</Button>

              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary">Internal assessment</Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 1 }}>
                <Num label="IA total" value={editor.iaTotal} onChange={(n) => setEditor({ ...editor, iaTotal: n })} />
                <Num label="Tests" value={editor.testCount} onChange={(n) => setEditor({ ...editor, testCount: n })} />
                <Num label="Max each" value={editor.testMaxEach} onChange={(n) => setEditor({ ...editor, testMaxEach: n })} />
                <Num label="Best of" value={editor.testBestOf} onChange={(n) => setEditor({ ...editor, testBestOf: n })} />
                <Num label="Test weight" value={editor.testWeight} onChange={(n) => setEditor({ ...editor, testWeight: n })} />
                <Num label="Attendance max" value={editor.attendanceMax} onChange={(n) => setEditor({ ...editor, attendanceMax: n })} />
                <Num label="Assignment max" value={editor.assignmentMax} onChange={(n) => setEditor({ ...editor, assignmentMax: n })} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Test weight + attendance max + assignment max must add up to the IA total ({editor.testWeight + editor.attendanceMax + editor.assignmentMax} / {editor.iaTotal}).
              </Typography>

              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary">Semester-end exam & pass criteria</Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1, mb: 1 }}>
                <Num label="SEE max marks" value={editor.seeMax} onChange={(n) => setEditor({ ...editor, seeMax: n })} />
                <Num label="Duration (min)" value={editor.seeDuration} onChange={(n) => setEditor({ ...editor, seeDuration: n })} />
                <Num label="SEE pass %" value={editor.seePass} onChange={(n) => setEditor({ ...editor, seePass: n })} />
                <Num label="Aggregate pass %" value={editor.aggPass} onChange={(n) => setEditor({ ...editor, aggPass: n })} />
                <Num label="Min internal %" value={editor.minInternal} onChange={(n) => setEditor({ ...editor, minInternal: n })} />
                <FormControlLabel
                  control={<Switch checked={editor.requireSeePass} onChange={(e) => setEditor({ ...editor, requireSeePass: e.target.checked })} />}
                  label="SEE pass required in addition to aggregate"
                />
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary">Grade table (descending)</Typography>
              {editor.grades.map((g, i) => (
                <Stack key={i} direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
                  <TextField size="small" label="Grade" value={g.grade} onChange={(e) => setEditor({ ...editor, grades: editor.grades.map((x, j) => (j === i ? { ...x, grade: e.target.value } : x)) })} sx={{ width: 90 }} />
                  <Num label="Point" width={90} value={g.gradePoint} onChange={(n) => setEditor({ ...editor, grades: editor.grades.map((x, j) => (j === i ? { ...x, gradePoint: n } : x)) })} />
                  <Num label="Min %" width={100} value={g.minPercentage} onChange={(n) => setEditor({ ...editor, grades: editor.grades.map((x, j) => (j === i ? { ...x, minPercentage: n } : x)) })} />
                  <TextField size="small" label="Description" value={g.description} onChange={(e) => setEditor({ ...editor, grades: editor.grades.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} sx={{ width: 180 }} />
                  <IconButton size="small" onClick={() => setEditor({ ...editor, grades: editor.grades.filter((_, j) => j !== i) })}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              ))}
              <Button size="small" onClick={() => setEditor({ ...editor, grades: [...editor.grades, { grade: 'P', gradePoint: 4, minPercentage: 35, description: 'Pass' }] })}>+ Add grade</Button>

              <Divider sx={{ my: 2 }} />
              <TextField fullWidth size="small" label="Source note (syllabus / regulations reference)" value={editor.sourceNote} onChange={(e) => setEditor({ ...editor, sourceNote: e.target.value })} />

              {saveMutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{saveMutation.error instanceof Error ? saveMutation.error.message : 'Save failed'}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditor(null)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={saveMutation.isPending || !editor.code || !editor.name || !editor.universityName}
                onClick={() => saveMutation.mutate(editorToPayload(editor))}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save pack'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
