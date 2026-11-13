// src/modules/admin/pages/SchemePacks.tsx
// College-wide Karnataka academic policy. Templates require explicit selection;
// saved revisions do not change the active college snapshot until activation.

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  Stack, Switch, TextField, Typography, MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon, AssignmentTurnedIn as AssignIcon, ContentCopy as CloneIcon,
  Delete as DeleteIcon, Edit as EditIcon, School as SchoolIcon,
} from '@mui/icons-material';
import {
  configureCollegeSchemePacks,
  fetchSchemePacks,
  getCollegeSchemePack,
  saveSchemePack,
  type ListedSchemePack,
} from '../api/schemePackApi';
import { SCHEME_PACK_PRESETS } from '@/shared/types/schemePack';
import type {
  AttendanceMarksSlab,
  SchemeGrade,
  UniversitySchemePack,
} from '@/shared/types/schemePack';

import { normalizeSchemePack } from '@/shared/utils/schemeEngine';
import { useAuth } from '../../auth/context/AuthContext';
import { CollegeSchemeSelector, useCollegeSchemeEditor } from '../components/CollegeSchemeSelector';
import SchemeResearchCatalogue from '../components/SchemeResearchCatalogue';
import { normalizeCollegeSchemeSelection } from '../../../../functions/src/academic/collegeSchemes';

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
  revision: number;
  status: UniversitySchemePack['status'];
  gradePointPolicy: UniversitySchemePack['gradePointPolicy'];
  profilesJson: string;
  coursesJson: string;
  requirementsJson: string;
}

function packToEditor(pack: UniversitySchemePack, newCode = ''): EditorState {
  return {
    id: newCode ? null : (pack.id.includes('__') ? pack.id : null),
    code: newCode || pack.code,
    name: newCode ? `${pack.name} — college copy` : pack.name,
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
    sourceNote: newCode ? '' : pack.sourceNote ?? '',
    revision: pack.revision ?? 1,
    status: pack.status,
    gradePointPolicy: pack.gradePointPolicy,
    profilesJson: JSON.stringify(pack.assessmentProfiles ?? [], null, 2),
    coursesJson: JSON.stringify(pack.courses ?? [], null, 2),
    requirementsJson: JSON.stringify(pack.creditRequirements ?? [], null, 2),
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
    ...(s.gradePointPolicy ? { gradePointPolicy: s.gradePointPolicy } : {}),
    status: s.status,
    revision: s.revision,
    sourceNote: s.sourceNote,
    assessmentProfiles: JSON.parse(s.profilesJson),
    courses: JSON.parse(s.coursesJson),
    creditRequirements: JSON.parse(s.requirementsJson),
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
  const { user } = useAuth();
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';
  const canAuthor = ['superadmin', 'admin', 'principal', 'hod'].includes(user?.role || '');
  const canActivate = ['superadmin', 'admin', 'principal'].includes(user?.role || '');
  const [chooseTemplate, setChooseTemplate] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState('');
  const academic = useCollegeSchemeEditor(collegeId || undefined);

  const assignedQuery = useQuery({
    queryKey: ['schemePack', collegeId, 'assigned'],
    queryFn: () => getCollegeSchemePack(collegeId),
    enabled: !!collegeId,
    retry: false,
  });
  const packsQuery = useQuery({
    queryKey: ['schemePack', collegeId, 'list'],
    queryFn: () => fetchSchemePacks(collegeId),
    enabled: !!collegeId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['schemePack'] });
    queryClient.invalidateQueries({ queryKey: ['bcuCompliancePack'] });
    queryClient.invalidateQueries({ queryKey: ['resultImporterPack'] });
  };

  const assignMutation = useMutation({
    mutationFn: () => configureCollegeSchemePacks(normalizeCollegeSchemeSelection(academic.selection), academic.revision, collegeId),
    onSuccess: () => { refresh(); academic.reload(); },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Assignment failed'),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveSchemePack(payload, collegeId),
    onSuccess: () => { setEditor(null); refresh(); },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  const assignedId = assignedQuery.data?.schemePackId ?? null;
  const assignedName = assignedQuery.data?.pack.name ?? (assignedQuery.isPending ? 'Checking configuration…' : 'Configuration required');
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
          <Typography variant="h5" sx={{ fontWeight: 600 }}>College Scheme Packs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
            Assign multiple reviewed packs with an explicit primary and programme/cohort routes.
            Credits, assessment, attendance, pass rules and grades follow the resolved assigned pack.
            Editing a pack never silently changes the active rules. No BCU fallback.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            icon={<AssignIcon />}
            color="primary"
            variant="outlined"
            label={assignedId ? `Primary: ${assignedName} · r${assignedQuery.data?.revision}` : assignedName}
            sx={{ maxWidth: 360 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!collegeId || !canAuthor}
            onClick={() => { setError(''); setEditorError(''); setChooseTemplate(true); }}
          >
            Choose a template
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {!collegeId && <Alert severity="warning" sx={{ mb: 2 }}>Select a college before configuring academic rules.</Alert>}
      {assignedQuery.isError && <Alert severity="warning" sx={{ mb: 2 }}>{assignedQuery.error.message} Existing published records are not changed.</Alert>}
      {packsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>Scheme list could not be loaded: {packsQuery.error.message}</Alert>}
      {assignedQuery.data?.needsReconfirmation && <Alert severity="warning" sx={{ mb: 2 }}>This is an existing explicit assignment, not a default. Reactivate after review to pin its revision.</Alert>}
      {assignedQuery.data && !(assignedQuery.data.pack.courses?.length) && <Alert severity="warning" sx={{ mb: 2 }}>This policy has no approved course-credit mappings yet. Clone/edit it and add courses before saving official grade drafts or importing results. Credits will not be assumed.</Alert>}
      <Card variant="outlined" sx={{ mb: 3 }}><CardContent>
        {academic.error ? <Alert severity="error">{academic.error} <Button onClick={academic.reload}>Reload assignments</Button></Alert> : academic.loading ? <Typography role="status">Loading scheme assignments…</Typography> : <CollegeSchemeSelector choices={academic.choices} value={academic.selection} onChange={academic.setSelection} disabled={!canActivate || assignMutation.isPending} />}
        {canActivate && <Button sx={{ mt: 2 }} variant="contained" disabled={!collegeId || academic.loading || !!academic.error || !!academic.validationError || assignMutation.isPending} onClick={() => {
          if (window.confirm('Save these reviewed scheme assignments, pinned revisions, primary and programme/cohort routes? This changes rules for new drafts and revalidates drafts on publication. Published results are unchanged.')) assignMutation.mutate();
        }}>Save assigned packs & primary</Button>}
        {canActivate && <Button sx={{ mt: 2, ml: 1 }} disabled={assignMutation.isPending} onClick={academic.reset}>Reset selection</Button>}
        {assignMutation.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Scheme assignments saved atomically. Each student now follows the matching programme/cohort route, or the explicit primary.</Alert>}
      </CardContent></Card>
      {saveMutation.isSuccess && <Alert severity="success" sx={{ mb: 2 }}>Revision saved. Review and explicitly activate it to change the college policy.</Alert>}

      <Box component="details" sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography component="summary" sx={{ cursor: 'pointer', fontWeight: 600 }}>University sources & preparation drafts (23 seeds)</Typography>
        <Box sx={{ mt: 2 }}><SchemeResearchCatalogue /></Box>
      </Box>
      <Grid container spacing={2}>
        {packs.map((item: ListedSchemePack) => {
          const p = item.pack;
          const pinned = academic.selection.assignments.find(a => a.schemePackId === p.id);
          const isAssigned = !!pinned;
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
                    {isAssigned && <Chip size="small" color="success" label={`${academic.selection.primarySchemePackId === p.id ? 'Primary' : 'Assigned'} r${pinned?.revision}`} />}
                    <Chip size="small" label={`Saved r${p.revision ?? 1} · ${p.status}`} variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{p.universityName} · {p.schemeName}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>{p.courses?.length ?? 0} course mappings · {p.assessmentProfiles?.length ?? 0} assessment profiles · {p.creditRequirements?.length ?? 0} credit plans</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{facts(p)}</Typography>
                  {p.sourceNote && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
                      Source: {p.sourceNote}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Typography variant="caption" color="text.secondary">Assign and set primary above after review.</Typography>
                    <Button
                      size="small"
                      startIcon={item.origin === 'custom' ? <EditIcon /> : <CloneIcon />}
                      disabled={!canAuthor}
                      onClick={() => {
                        setError(''); setEditorError('');
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
        {packsQuery.isPending && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">Loading packs…</Alert>
          </Grid>
        )}
      </Grid>

      <Dialog open={chooseTemplate} onClose={() => setChooseTemplate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Explicitly choose an authoring template</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Templates are starting points, not a declaration of university compliance. Confirm the approved Karnataka regulations and add your programme/cohort course credits. Nothing is assigned automatically.</Alert>
          <Stack spacing={1}>
            {SCHEME_PACK_PRESETS.map(p => <Button key={p.id} variant="outlined" onClick={() => {
              setEditor(packToEditor(p, 'CUSTOM_' + Math.random().toString(36).slice(2, 9).toUpperCase()));
              setChooseTemplate(false);
            }}>{p.name}</Button>)}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setChooseTemplate(false)}>Cancel</Button></DialogActions>
      </Dialog>
      {/* ─── Editor dialog ─── */}
      <Dialog open={!!editor} onClose={() => setEditor(null)} maxWidth="md" fullWidth>
        {editor && (
          <>
            <DialogTitle>{editor.id ? `Edit custom pack (${editor.code})` : 'Create custom pack'}</DialogTitle>
            <DialogContent dividers>
              <Alert severity="info" sx={{ mb: 2 }}>Saved changes are not live until activation. Use the approved syllabus as the source of truth; programme/cohort names must match student records.</Alert>
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
              <Typography variant="overline" color="text.secondary">Course grade points & classification</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 1 }}>
                <TextField select size="small" label="Course GP calculation" value={editor.gradePointPolicy?.method || 'bands'} onChange={e => setEditor({ ...editor, gradePointPolicy: { method: e.target.value as 'bands' | 'percentage-divided-by-ten', percentageRounding: editor.gradePointPolicy?.percentageRounding || 'none' } })} sx={{ minWidth: 260 }}>
                  <MenuItem value="bands">Fixed points from grade table</MenuItem><MenuItem value="percentage-divided-by-ten">Actual percentage divided by 10</MenuItem>
                </TextField>
                <TextField select size="small" label="Percentage rounding for GP only" value={editor.gradePointPolicy?.percentageRounding || 'none'} onChange={e => setEditor({ ...editor, gradePointPolicy: { method: editor.gradePointPolicy?.method || 'bands', percentageRounding: e.target.value as 'none' | 'nearest-integer' } })} sx={{ minWidth: 280 }}>
                  <MenuItem value="none">No percentage rounding</MenuItem><MenuItem value="nearest-integer">Nearest integer before GP lookup</MenuItem>
                </TextField>
              </Stack>
              <Alert severity="info" sx={{ mb: 1 }}>Use the exact programme/cohort course GP formula, not the semester alpha classification as a substitute. GP rounding does not relax any pass minimum. Profile JSON can override gradeTable and gradePointPolicy; old revisions retain their original behaviour.</Alert>
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
              <Typography variant="overline">Course credits & assessment profiles</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Advanced policy JSON. Use exact course codes and optional programme, batch and semester scopes.
                Credits come from the approved syllabus (0 is allowed for non-GPA courses), never marks.
                assessmentProfileId "default" explicitly uses the college standard. Custom profiles support internal-only,
                external-only, practical, project, viva and best-N assessment components. No marks-ratio guessing.
              </Typography>
              <Stack spacing={2}>
                <TextField label="Assessment profiles (JSON array)" multiline minRows={4} value={editor.profilesJson} onChange={e => setEditor({ ...editor, profilesJson: e.target.value })} helperText='Profile: id, name, internalMaxMarks, externalMaxMarks, durationMinutes, internalComponents [{id,label,method,count,maxMarksEach,bestOf?,weight}], passCriteria {externalPassPercentage,internalPassPercentage,aggregatePassPercentage,requireExternalPass}; optional gradeTable and gradePointPolicy {method,percentageRounding}.' />
                <TextField label="Approved course mappings (JSON array)" multiline minRows={5} value={editor.coursesJson} onChange={e => setEditor({ ...editor, coursesJson: e.target.value })} helperText='Course: code, name, credits, category, assessmentProfileId, includeInGpa, requiredForAward; optional programme, batch, semester. Set includeInGpa:false for zero-credit courses.' />
                <TextField label="Programme credit requirements (JSON array)" multiline minRows={4} value={editor.requirementsJson} onChange={e => setEditor({ ...editor, requirementsJson: e.target.value })} helperText='Plan: programme, batch?, totalSemesters, minimumCredits, requiredCourseCodes:[], categoryMinimums:{}. No statewide credit total is assumed. Credit audit is advisory, not automatic graduation approval.' />
              </Stack>
              <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={editor.status === 'active'} onChange={e => setEditor({ ...editor, status: e.target.checked ? 'active' : 'draft' })} />} label="Ready for review/activation (off saves a draft policy)" />
              {editorError && <Alert severity="error" sx={{ mt: 2 }}>{editorError}</Alert>}
              <Divider sx={{ my: 2 }} />
              <TextField fullWidth size="small" label="Source note (syllabus / regulations reference)" value={editor.sourceNote} onChange={(e) => setEditor({ ...editor, sourceNote: e.target.value })} />

              {saveMutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{saveMutation.error instanceof Error ? saveMutation.error.message : 'Save failed'}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditor(null)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={saveMutation.isPending || !editor.code || !editor.name || !editor.universityName}
                onClick={() => {
                  try { const payload = editorToPayload(editor); normalizeSchemePack(payload); setEditorError(''); saveMutation.mutate(payload); }
                  catch (err) { setEditorError(err instanceof Error ? err.message : 'Invalid academic policy JSON'); }
                }}
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
