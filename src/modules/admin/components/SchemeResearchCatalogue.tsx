import { useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { KARNATAKA_SCHEME_RESEARCH, RESEARCH_VERIFICATION_LABEL, type SchemeResearchDraft } from '../../../../functions/src/academic/schemeResearch';

function downloadDraft(draft: SchemeResearchDraft) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${draft.code.toLowerCase()}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Evidence/work queue, kept visually and structurally separate from live packs. */
export default function SchemeResearchCatalogue({ universityCode = '' }: { universityCode?: string }) {
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
  const rows = useMemo(() => KARNATAKA_SCHEME_RESEARCH.filter(p =>
    (!universityCode || p.universityCode === universityCode) &&
    (status === 'all' || p.verification === status) &&
    `${p.universityName} ${p.universityCode} ${p.scope.programme}`.toLowerCase().includes(filter.toLowerCase().trim())
  ), [filter, status, universityCode]);
  return <Box>
    <Typography variant="h6">Karnataka scheme research catalogue</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>23 seeded university identities reviewed · 23 preparation drafts · 0 newly certified assignable packs. Evidence reviewed 13 November 2026. Programme coverage is partial, not university-wide.</Typography>
    <Alert severity="warning" sx={{ mb: 2 }}>Research drafts cannot be assigned or used for marks, GPA or credits. Missing rules are not filled from BCU or another university. Obtain the listed clarifications, prepare a complete college policy with exact admission-batch/course mappings, save its reviewed revision, then explicitly assign it above. Affiliation alone does not select a policy.</Alert>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <TextField size="small" label="Find university / programme" value={filter} onChange={e => setFilter(e.target.value)} fullWidth />
      <TextField select size="small" label="Evidence status" value={status} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 260 }}>
        <MenuItem value="all">All research statuses</MenuItem>
        {Object.entries(RESEARCH_VERIFICATION_LABEL).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
      </TextField>
    </Stack>
    <Typography variant="caption" role="status">{rows.length} research draft{rows.length === 1 ? '' : 's'} shown</Typography>
    {rows.map(draft => <Accordion key={draft.code} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{draft.universityCode} · {draft.universityName}</Typography>
          <Typography variant="body2" color="text.secondary">{draft.scope.programme} · {draft.scope.framework}</Typography>
          <Chip size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} label={`Not assignable · ${RESEARCH_VERIFICATION_LABEL[draft.verification]}`} />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" sx={{ mb: 1 }}>Admission scope: {draft.scope.admissions}</Typography>
        {!!draft.scope.reviewedSemesters.length && <Typography variant="body2" sx={{ mb: 1 }}>Matrices partly reviewed: semesters {draft.scope.reviewedSemesters.join(', ')}. This does not certify every course/profile.</Typography>}
        {draft.identityNotes.map(note => <Alert key={note} severity="info" sx={{ mb: 1 }}>{note}</Alert>)}
        <Typography variant="subtitle2">Recorded evidence — not active rules</Typography>
        {draft.observations.length ? <Box component="ul" sx={{ pl: 2.5 }}>{draft.observations.map((o, i) => <li key={i}><Typography variant="body2" sx={{ mb: 1 }}>{o.detail} <Typography component="span" variant="caption" color="text.secondary">[{o.sourceIds.join(', ')} · {o.locator}]</Typography></Typography></li>)}</Box> : <Typography variant="body2" sx={{ my: 1 }}>No numeric governing rules verified. Do not copy a neighbouring university’s policy.</Typography>}
        {!!draft.courseRows.length && <Typography variant="body2" sx={{ mb: 1 }}>{draft.courseRows.length} extracted course rows included in the preparation JSON. They are incomplete evidence, not approved course mappings.</Typography>}
        <Typography variant="subtitle2">Required before activation</Typography>
        <Box component="ul" sx={{ pl: 2.5 }}>{draft.blockers.map(b => <li key={b}><Typography variant="body2" sx={{ mb: 1 }}>{b}</Typography></li>)}</Box>
        <Typography variant="subtitle2">Sources and access limitations</Typography>
        <Box component="ul" sx={{ pl: 2.5 }}>{draft.sources.map(s => <li key={s.id}><Typography variant="body2"><a href={s.url} target="_blank" rel="noreferrer">{s.id}: {s.title}</a> · {s.authority} · {s.access}</Typography><Typography variant="caption" color="text.secondary">{s.readScope}</Typography></li>)}</Box>
        <Button type="button" size="small" variant="outlined" onClick={() => downloadDraft(draft)}>Download preparation draft JSON</Button>
      </AccordionDetails>
    </Accordion>)}
    {!rows.length && <Typography sx={{ p: 2 }}>No matching research entry. A university affiliation must still use an explicitly reviewed college scheme.</Typography>}
  </Box>;
}
