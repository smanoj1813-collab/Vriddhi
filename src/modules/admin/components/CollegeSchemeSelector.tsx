import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Checkbox, Chip, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { fetchSchemePacks, getCollegeSchemeConfiguration, type ListedSchemePack } from '../api/schemePackApi';
import { normalizeCollegeSchemeSelection, type CollegeSchemeSelection } from '../../../../functions/src/academic/collegeSchemes';

export const emptySchemeSelection = (): CollegeSchemeSelection => ({ assignments: [], primarySchemePackId: null, routes: [] });

/** The same controlled editor is used by onboarding and college academic settings. */
export function useCollegeSchemeEditor(collegeId?: string) {
  const packs = useQuery({ queryKey: ['schemePack', collegeId || '', 'list'], queryFn: () => fetchSchemePacks(collegeId || ''), retry: false });
  const configuration = useQuery({ queryKey: ['schemePack', collegeId, 'configuration'], queryFn: () => getCollegeSchemeConfiguration(collegeId!), enabled: !!collegeId, retry: false });
  const [selection, setSelection] = useState<CollegeSchemeSelection>(emptySchemeSelection);
  const [revision, setRevision] = useState(0);
  const [loadedFor, setLoadedFor] = useState('');
  const currentCollege = useRef(collegeId);
  currentCollege.current = collegeId;
  useEffect(() => {
    if (!collegeId) { setSelection(emptySchemeSelection()); setRevision(0); setLoadedFor(''); return; }
    // Background focus/refetches must not overwrite unsaved primary/routes.
    if (configuration.data && loadedFor !== collegeId) {
      setSelection({ assignments: configuration.data.assignments.map(({ schemePackId, revision }) => ({ schemePackId, revision })), primarySchemePackId: configuration.data.primarySchemePackId, routes: configuration.data.routes });
      setRevision(configuration.data.revision); setLoadedFor(collegeId);
    }
  }, [collegeId, configuration.data, loadedFor]);
  const choices = useMemo(() => {
    const items = [...(packs.data || [])];
    for (const assignment of configuration.data?.assignments || []) if (!items.some(i => i.pack.id === assignment.schemePackId)) items.push({ pack: assignment.snapshot, origin: assignment.schemePackId.includes('__') ? 'custom' : 'preset' });
    return items;
  }, [packs.data, configuration.data]);
  let validationError = '';
  try { normalizeCollegeSchemeSelection(selection); }
  catch (err) { validationError = err instanceof Error ? err.message : 'Review scheme selection'; }
  return { selection, setSelection, revision, choices, validationError,
    loading: packs.isPending || (!!collegeId && (configuration.isPending || loadedFor !== collegeId)),
    error: packs.error?.message || (collegeId ? configuration.error?.message : '') || (collegeId && loadedFor === collegeId && configuration.data && configuration.data.revision !== revision ? 'College scheme assignments changed. Reload to review the latest primary, routes and revisions before saving.' : ''),
    needsReconfirmation: configuration.data?.needsReconfirmation,
    reload: () => { void packs.refetch(); if (collegeId) void configuration.refetch().then(result => {
      if (result.isSuccess && result.data && currentCollege.current === collegeId) { setSelection({ assignments: result.data.assignments.map(({ schemePackId, revision }) => ({ schemePackId, revision })), primarySchemePackId: result.data.primarySchemePackId, routes: result.data.routes }); setRevision(result.data.revision); setLoadedFor(collegeId); }
    }); },
    reset: () => {
      const c = configuration.data;
      setRevision(c?.revision || 0);
      setSelection(c ? { assignments: c.assignments.map(({ schemePackId, revision }) => ({ schemePackId, revision })), primarySchemePackId: c.primarySchemePackId, routes: c.routes } : emptySchemeSelection());
    },
  };
}
export function CollegeSchemeSelector({ choices, value, onChange, disabled = false }: { choices: ListedSchemePack[]; value: CollegeSchemeSelection; onChange: (selection: CollegeSchemeSelection) => void; disabled?: boolean }) {
  const assigned = choices.filter(p => value.assignments.some(a => a.schemePackId === p.pack.id));
  let validationError = '';
  try { normalizeCollegeSchemeSelection(value); } catch (err) { validationError = err instanceof Error ? err.message : 'Review scheme selection'; }
  return <Stack spacing={2}>
    <Box>
      <Typography variant="h6">Assigned scheme packs</Typography>
      <Typography variant="body2" color="text.secondary">Select one or more reviewed packs, then explicitly choose a primary. Programme/cohort routes override the primary. No university is selected automatically. Published results retain their original rules.</Typography>
    </Box>
    {choices.some(p => p.origin === 'preset') && <Alert severity="warning">Built-in presets are legacy authoring templates, not newly verified university regulations. Review programme/cohort applicability, official GP tables, pass rules and course credits before use; the research catalogue below records known gaps. Selecting a template does not fill missing course mappings.</Alert>}
    <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 2 }}>
      {choices.map(({ pack }) => {
        const selected = value.assignments.find(a => a.schemePackId === pack.id);
        return <Stack key={pack.id} direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel label={`${pack.name} · r${selected?.revision ?? pack.revision ?? 1}`} control={<Checkbox checked={!!selected} disabled={disabled || (!selected && (pack.status !== 'active' || value.assignments.length >= 10))} onChange={(_, checked) => onChange(checked ? { ...value, assignments: [...value.assignments, { schemePackId: pack.id, revision: pack.revision ?? 1 }] } : { assignments: value.assignments.filter(a => a.schemePackId !== pack.id), primarySchemePackId: value.primarySchemePackId === pack.id ? null : value.primarySchemePackId, routes: value.routes.filter(r => r.schemePackId !== pack.id) })} />} />
          <Chip size="small" label={choices.find(p => p.pack.id === pack.id)?.origin === 'preset' ? 'Legacy template · verify' : pack.status} variant="outlined" />
          {selected && selected.revision !== (pack.revision ?? 1) && <Button type="button" size="small" disabled={disabled || pack.status !== 'active'} onClick={() => onChange({ ...value, assignments: value.assignments.map(a => a.schemePackId === pack.id ? { ...a, revision: pack.revision ?? 1 } : a) })}>Review & use saved r{pack.revision ?? 1}</Button>}
        </Stack>;
      })}
      {!choices.length && <Typography sx={{ py: 2 }}>No packs available. Create a reviewed college pack under Scheme Packs.</Typography>}
    </Box>
    <FormControl size="small" fullWidth disabled={disabled || !assigned.length}>
      <InputLabel id="college-primary-scheme-label">Primary scheme pack</InputLabel>
      <Select labelId="college-primary-scheme-label" label="Primary scheme pack" value={value.primarySchemePackId || ''} onChange={e => onChange({ ...value, primarySchemePackId: e.target.value || null })}>
        {assigned.map(({ pack }) => <MenuItem value={pack.id} key={pack.id}>{pack.name}</MenuItem>)}
      </Select>
    </FormControl>
    {!value.assignments.length && <Alert severity="warning">No academic scheme assigned. You may save an unconfigured college, but official grading, credit-plan checks and exam eligibility remain blocked until a pack is assigned.</Alert>}
    {assigned.some(p => !p.pack.courses?.length) && <Alert severity="warning">Some selected packs have no approved course-credit mappings. They cannot grade official results until those mappings are reviewed and assigned in a new revision.</Alert>}
    {assigned.length > 1 && <Alert severity="info">Assigning another pack alone does not make it applicable. Add a route for its programme, admission batch and/or semester. Otherwise the explicitly selected primary applies.</Alert>}
    <Typography variant="subtitle2">Programme / cohort routes</Typography>
    {value.routes.map((route, i) => <Stack key={i} direction={{ xs: 'column', md: 'row' }} spacing={1}>
      <TextField size="small" label={`Route ${i + 1} programme`} placeholder="e.g. B.Com" value={route.programme || ''} disabled={disabled} onChange={e => onChange({ ...value, routes: value.routes.map((r, n) => n === i ? { ...r, programme: e.target.value } : r) })} />
      <TextField size="small" label={`Route ${i + 1} batch`} placeholder="e.g. 2024-25" value={route.batch || ''} disabled={disabled} onChange={e => onChange({ ...value, routes: value.routes.map((r, n) => n === i ? { ...r, batch: e.target.value } : r) })} />
      <TextField size="small" label={`Route ${i + 1} semester`} type="number" value={route.semester ?? ''} disabled={disabled} slotProps={{ htmlInput: { min: 1, max: 20 } }} onChange={e => onChange({ ...value, routes: value.routes.map((r, n) => n === i ? { ...r, semester: e.target.value === '' ? undefined : Number(e.target.value) } : r) })} />
      <FormControl size="small" sx={{ minWidth: 220 }} disabled={disabled}><InputLabel id={`route-pack-${i}`}>Assigned pack</InputLabel><Select labelId={`route-pack-${i}`} label="Assigned pack" value={route.schemePackId} onChange={e => onChange({ ...value, routes: value.routes.map((r, n) => n === i ? { ...r, schemePackId: e.target.value } : r) })}>{assigned.map(({ pack }) => <MenuItem key={pack.id} value={pack.id}>{pack.name}</MenuItem>)}</Select></FormControl>
      <Button type="button" color="warning" disabled={disabled} onClick={() => onChange({ ...value, routes: value.routes.filter((_, n) => n !== i) })}>Remove route {i + 1}</Button>
    </Stack>)}
    <Typography variant="caption" color="text.secondary">Blank scope = any. Programme and batch use exact, case-insensitive names, not guessed aliases. The most specific matching route wins; equal-specificity conflicts and missing context block grading.</Typography>
    <Button type="button" variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={disabled || !assigned.length || value.routes.length >= 100} onClick={() => onChange({ ...value, routes: [...value.routes, { schemePackId: value.primarySchemePackId || assigned[0].pack.id }] })}>Add programme/cohort route</Button>
    {validationError && <Alert severity="error">{validationError}</Alert>}
  </Stack>;
}
