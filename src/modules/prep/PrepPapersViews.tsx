// src/modules/prep/PrepPapersViews.tsx
//
// Previous-year university question papers on the public Prep pages.
//
//   /prep                         → PapersBlock: teaser card in the hub (per program)
//   /prep/papers?program=bcom     → PapersLibraryView: filter by semester / university / year, grouped list
//   /prep/papers/:paperId         → PaperView: the paper as printed (sections, rubric, questions, marks)
//
// Everything here reads through GET /prep/papers, which serves PUBLISHED
// papers to anonymous callers — the same boundary as the study packs, so a
// shared link can never expose a draft.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Divider,
  InputBase,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { ChevronRight, Description, OpenInNew, Print, Search } from '@mui/icons-material';
import {
  fetchFrequentQuestions,
  fetchPrepPaper,
  fetchPrepPapers,
  PREP_PAPER_LEGACY_LABELS,
  type FrequentQuestion,
  type PrepPaper,
  type PrepPaperFacets,
  type PrepPaperSummary,
  type PrepPaperUniversity,
} from '@/shared/services/prepContentService';
import {
  PROGRAM_LABELS,
  PrepPageNav,
  ProgramControl,
  SectionHeader,
  ShareLinkButton,
  readStoredProgram,
  rememberProgram,
} from './prepPublicShared';

// ─── Small shared helpers ────────────────────────────────────────────────────

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function semesterTitle(semester: number): string {
  return ROMAN[semester] ? `Semester ${ROMAN[semester]}` : `Semester ${semester}`;
}

function durationLabel(minutes: number): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`;
  if (m === 30) return `${h}½ hrs`;
  return `${h} hr ${m} min`;
}

function shortUniversity(universities: PrepPaperUniversity[], code: string, fallback: string): string {
  return universities.find((u) => u.code === code)?.shortName || fallback;
}

/** The old-name badge for renamed programs (BBM → BBA). */
function LegacyChip({ paper }: { paper: Pick<PrepPaperSummary, 'legacyProgram'> }) {
  if (!paper.legacyProgram) return null;
  const label = PREP_PAPER_LEGACY_LABELS[paper.legacyProgram] || paper.legacyProgram.toUpperCase();
  return <Chip size="small" color="warning" variant="outlined" label={`${label} · older scheme`} />;
}

// Module-level cache so toggling programs in the hub does not re-hit the API
// (the list is small and static; five minutes is plenty).
const listCache = new Map<string, { at: number; value: Awaited<ReturnType<typeof fetchPrepPapers>> }>();
const CACHE_MS = 5 * 60 * 1000;

async function cachedPapers(program: string) {
  const hit = listCache.get(program);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await fetchPrepPapers({ program });
  listCache.set(program, { at: Date.now(), value });
  return value;
}

export function paperPath(paperId: string, program?: string | null): string {
  return `/prep/papers/${encodeURIComponent(paperId)}${program ? `?program=${program}` : ''}`;
}

export function libraryPath(program: string, extra?: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams({ program });
  for (const [k, v] of Object.entries(extra || {})) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  return `/prep/papers?${qs.toString()}`;
}

// ─── Hub block ───────────────────────────────────────────────────────────────

export function PapersBlock({ program }: { program: string }) {
  const [rows, setRows] = useState<PrepPaperSummary[] | null>(null);
  const [facets, setFacets] = useState<PrepPaperFacets | null>(null);
  const [universities, setUniversities] = useState<PrepPaperUniversity[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setFailed(false);
    cachedPapers(program)
      .then((res) => {
        if (cancelled) return;
        setRows(res.papers);
        setFacets(res.facets);
        setUniversities(res.universities);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [program]);

  // Nothing published for this program (or the API is down): stay out of the
  // way rather than render an empty promise.
  if (failed || (rows && rows.length === 0)) return null;

  const latest = rows ? [...rows].sort((a, b) => b.examYear - a.examYear || a.semester - b.semester).slice(0, 4) : [];
  const years = facets?.years || [];
  const yearSpan = years.length > 1 ? `${years[years.length - 1]}–${years[0]}` : years[0] ? String(years[0]) : '';
  const uniCount = facets?.universities.length || 0;

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: { xs: 1.5, md: 2 },
        backgroundImage: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(155deg, rgba(245,158,11,0.16) 0%, rgba(99,102,241,0.10) 55%, rgba(19,27,46,0) 100%)'
            : 'linear-gradient(155deg, rgba(245,158,11,0.10) 0%, rgba(99,102,241,0.06) 55%, rgba(255,255,255,0) 100%)',
      }}
    >
      <SectionHeader
        kicker="Exam practice"
        title="Previous year question papers"
        meta={
          rows
            ? `${rows.length} ${PROGRAM_LABELS[program] || program} paper${rows.length === 1 ? '' : 's'}${yearSpan ? ` · ${yearSpan}` : ''}${uniCount ? ` · ${uniCount} universit${uniCount === 1 ? 'y' : 'ies'}` : ''}`
            : 'Loading papers…'
        }
      />
      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        {!rows
          ? [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: 2 }} />)
          : latest.map((p) => <PaperRow key={p.id} paper={p} program={program} universities={universities} dense />)}
      </Stack>
      <Button
        component={Link}
        to={libraryPath(program)}
        size="small"
        variant="contained"
        disableElevation
        endIcon={<ChevronRight fontSize="small" />}
        sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
      >
        Browse all {rows ? rows.length : ''} papers
      </Button>
    </Box>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

function PaperRow({
  paper,
  program,
  universities,
  dense = false,
}: {
  paper: PrepPaperSummary;
  program: string;
  universities: PrepPaperUniversity[];
  dense?: boolean;
}) {
  const uni = shortUniversity(universities, paper.universityCode, paper.universityName);
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardActionArea component={Link} to={paperPath(paper.id, program)} sx={{ px: 1.5, py: dense ? 0.9 : 1.25 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              flex: '0 0 auto',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          >
            <Description fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.25 }} noWrap title={paper.subjectName}>
              {paper.subjectName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {uni} · {paper.examLabel} · {semesterTitle(paper.semester)}
              {paper.paperCode ? ` · ${paper.paperCode}` : ''}
              {!dense ? ` · ${paper.maxMarks} marks · ${paper.questionCount} questions` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flex: '0 0 auto' }}>
            <LegacyChip paper={paper} />
            <ChevronRight fontSize="small" sx={{ color: 'text.disabled' }} />
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

// ─── Library ─────────────────────────────────────────────────────────────────

function FilterChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: T[];
  value: T | '';
  onChange: (next: T | '') => void;
  render?: (v: T) => string;
}) {
  if (options.length <= 1) return null;
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }} useFlexGap>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.25 }}>
        {label}
      </Typography>
      <Chip size="small" label="All" color={value === '' ? 'primary' : 'default'} onClick={() => onChange('')} />
      {options.map((opt) => (
        <Chip
          key={String(opt)}
          size="small"
          label={render ? render(opt) : String(opt)}
          color={value === opt ? 'primary' : 'default'}
          variant={value === opt ? 'filled' : 'outlined'}
          onClick={() => onChange(value === opt ? '' : opt)}
        />
      ))}
    </Stack>
  );
}

export function PapersLibraryView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = String(searchParams.get('program') || '').toLowerCase();
  const program = PROGRAM_LABELS[fromUrl] ? fromUrl : readStoredProgram() || 'bba';
  const semester = Number(searchParams.get('sem')) || '';
  const university = String(searchParams.get('uni') || '');
  const year = Number(searchParams.get('year')) || '';
  const [query, setQuery] = useState('');

  const [rows, setRows] = useState<PrepPaperSummary[]>([]);
  const [facets, setFacets] = useState<PrepPaperFacets | null>(null);
  const [universities, setUniversities] = useState<PrepPaperUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    cachedPapers(program)
      .then((res) => {
        if (cancelled) return;
        setRows(res.papers);
        setFacets(res.facets);
        setUniversities(res.universities);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the papers.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [program, attempt]);

  const setParam = (key: string, value: string | number | '') => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === undefined) next.delete(key);
    else next.set(key, String(value));
    setSearchParams(next, { replace: true });
  };

  const pickProgram = (code: string) => {
    rememberProgram(code);
    // Filters belong to the program they were chosen under.
    setSearchParams({ program: code }, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (p) =>
        (semester === '' || p.semester === semester) &&
        (university === '' || p.universityCode === university) &&
        (year === '' || p.examYear === year) &&
        (!q ||
          p.subjectName.toLowerCase().includes(q) ||
          String(p.paperCode || '').toLowerCase().includes(q) ||
          p.universityName.toLowerCase().includes(q) ||
          String(p.examYear).includes(q)),
    );
  }, [rows, semester, university, year, query]);

  const groups = useMemo(() => {
    const map = new Map<number, PrepPaperSummary[]>();
    for (const p of filtered) {
      const list = map.get(p.semester) || [];
      list.push(p);
      map.set(p.semester, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sem, list]) => ({
        semester: sem,
        papers: [...list].sort((a, b) => a.subjectName.localeCompare(b.subjectName) || b.examYear - a.examYear),
      }));
  }, [filtered]);

  const hubPath = `/prep?program=${program}`;
  const crumbs = [{ label: 'Prep', to: '/prep' }, { label: PROGRAM_LABELS[program] || program, to: hubPath }, { label: 'Previous year papers' }];

  return (
    <>
      <ProgramControl active={program} onPick={pickProgram} action={<ShareLinkButton path={libraryPath(program)} compact />} />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <PrepPageNav crumbs={crumbs} sharePath={libraryPath(program, { sem: semester, uni: university, year })} backTo={hubPath} />
          <SectionHeader
            kicker="Exam practice"
            title={`${PROGRAM_LABELS[program] || program} previous year question papers`}
            meta={
              loading
                ? 'Loading papers…'
                : `${filtered.length} of ${rows.length} paper${rows.length === 1 ? '' : 's'} · transcribed from university exam papers · English text`
            }
          />

          {facets && rows.length > 0 ? (
            <Stack spacing={1}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  maxWidth: 480,
                }}
              >
                <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                <InputBase
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subject, paper code, university or year"
                  inputProps={{ 'aria-label': 'Search question papers' }}
                  sx={{ flex: 1, fontSize: 14 }}
                />
              </Box>
              <FilterChips label="Semester" options={facets.semesters} value={semester} onChange={(v) => setParam('sem', v)} render={(v) => `Sem ${v}`} />
              <FilterChips
                label="University"
                options={facets.universities.map((u) => u.code)}
                value={university}
                onChange={(v) => setParam('uni', v)}
                render={(code) => {
                  const f = facets.universities.find((u) => u.code === code);
                  return `${shortUniversity(universities, code, f?.name || code)} (${f?.count || 0})`;
                }}
              />
              <FilterChips label="Year" options={facets.years} value={year} onChange={(v) => setParam('year', v)} />
            </Stack>
          ) : null}

          {error ? (
            <Card variant="outlined">
              <Stack spacing={1.5} sx={{ p: 3, alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 700 }}>Could not load the papers</Typography>
                <Typography variant="body2" color="error.main">{error}</Typography>
                <Button size="small" variant="outlined" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
              </Stack>
            </Card>
          ) : loading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2.5 }} />
              ))}
            </Stack>
          ) : rows.length === 0 ? (
            <Card variant="outlined">
              <Box sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }} gutterBottom>
                  No {PROGRAM_LABELS[program] || program} papers published yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620, mx: 'auto' }}>
                  Previous-year papers for this program are still being added. Try another program above.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  A superadmin can seed the papers from Superadmin → Prep Content Studio → “Previous Year Papers”.
                </Typography>
              </Box>
            </Card>
          ) : filtered.length === 0 ? (
            <Card variant="outlined">
              <Stack spacing={1} sx={{ p: 3, alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 700 }}>No papers match these filters</Typography>
                <Button size="small" variant="outlined" onClick={() => { setQuery(''); setSearchParams({ program }, { replace: true }); }}>
                  Clear filters
                </Button>
              </Stack>
            </Card>
          ) : (
            <Stack spacing={2.5}>
              {groups.map((g) => (
                <Box key={g.semester}>
                  <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1, color: 'text.secondary' }}>
                    {semesterTitle(g.semester)} · {g.papers.length} paper{g.papers.length === 1 ? '' : 's'}
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                    {g.papers.map((p) => (
                      <PaperRow key={p.id} paper={p} program={program} universities={universities} />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  );
}

// ─── Single paper ────────────────────────────────────────────────────────────

function MarksTag({ marks }: { marks: number }) {
  return (
    <Typography
      component="span"
      variant="caption"
      sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', ml: 1, flex: '0 0 auto' }}
    >
      {marks} {marks === 1 ? 'mark' : 'marks'}
    </Typography>
  );
}

export function PaperView({ paperId }: { paperId: string }) {
  const [searchParams] = useSearchParams();
  const urlProgram = String(searchParams.get('program') || '').toLowerCase();
  const [paper, setPaper] = useState<PrepPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPrepPaper(paperId)
      .then((p) => !cancelled && setPaper(p))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'This paper does not exist or is not published.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [paperId]);

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error || !paper) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Card><Box sx={{ p: 3, color: 'error.main' }}>{error || 'This paper does not exist or is not published.'}</Box></Card>
      </Container>
    );
  }

  const program = PROGRAM_LABELS[urlProgram] ? urlProgram : paper.program;
  const hubPath = `/prep?program=${program}`;
  const crumbs = [
    { label: 'Prep', to: '/prep' },
    { label: PROGRAM_LABELS[program] || program, to: hubPath },
    { label: 'Previous year papers', to: libraryPath(program) },
    { label: semesterTitle(paper.semester), to: libraryPath(program, { sem: paper.semester }) },
    { label: `${paper.subjectName} · ${paper.examLabel}` },
  ];
  const legacyLabel = paper.legacyProgram ? PREP_PAPER_LEGACY_LABELS[paper.legacyProgram] || paper.legacyProgram.toUpperCase() : null;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box sx={{ '@media print': { display: 'none' } }}>
          <PrepPageNav crumbs={crumbs} sharePath={paperPath(paper.id, program)} backTo={libraryPath(program, { sem: paper.semester })} />
        </Box>

        {/* Paper header — laid out like the printed title block */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1, color: 'text.secondary' }}>
              {paper.universityName}
              {paper.paperCode ? ` · ${paper.paperCode}` : ''}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
              {semesterTitle(paper.semester)} {paper.programLabel} Degree Examination, {paper.examLabel}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {paper.subjectName}
              {paper.paperNumber ? ` (Paper ${paper.paperNumber})` : ''}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 1 }} useFlexGap>
              <Chip size="small" label={paper.scheme} />
              {paper.subjectArea ? <Chip size="small" variant="outlined" label={paper.subjectArea} /> : null}
              <Chip size="small" variant="outlined" label={`Time: ${durationLabel(paper.durationMinutes)}`} />
              <Chip size="small" variant="outlined" label={`Max. marks: ${paper.maxMarks}`} />
              <Chip size="small" variant="outlined" label={`${paper.questionCount} questions`} />
              {legacyLabel ? <Chip size="small" color="warning" variant="outlined" label={`${legacyLabel} · older scheme`} /> : null}
            </Stack>
            {paper.instructions.length > 0 ? (
              <Box sx={{ mt: 1.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  Instructions to candidates
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 2.5, mt: 0.25 }}>
                  {paper.instructions.map((line, i) => (
                    <Typography key={i} component="li" variant="body2" color="text.secondary">
                      {line}
                    </Typography>
                  ))}
                </Box>
              </Box>
            ) : null}
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1, '@media print': { display: 'none' } }} useFlexGap>
              {paper.prepSubjectId ? (
                <Button
                  component={Link}
                  to={`/prep/subject/${encodeURIComponent(paper.prepSubjectId)}?program=${program}`}
                  size="small"
                  variant="contained"
                  disableElevation
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Open the study pack for this subject
                </Button>
              ) : null}
              <Button
                size="small"
                variant="outlined"
                startIcon={<Print fontSize="small" />}
                onClick={() => window.print()}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Print / save as PDF
              </Button>
            </Stack>
          </Box>
        </Card>

        {/* Sections */}
        {paper.sections.map((section) => (
          <Card key={section.id} variant="outlined" sx={{ borderRadius: 3 }}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {section.title}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  ({section.answerCount > 0 ? section.answerCount : section.questions.length} × {section.marksEach} = {section.totalMarks})
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.25 }}>
                {section.instruction}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1.25}>
                {section.questions.map((q) => (
                  <Box key={q.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                    <Typography sx={{ fontWeight: 800, minWidth: 44, flex: '0 0 auto', color: 'text.secondary' }}>
                      {q.label}.
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>{q.text}</Typography>
                      {q.parts && q.parts.length > 0 ? (
                        <Stack spacing={0.5} sx={{ mt: 0.75, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                          {q.parts.map((part, i) => (
                            <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                              {part}
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}
                    </Box>
                    {q.marks && q.marks !== section.marksEach ? <MarksTag marks={q.marks} /> : null}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Card>
        ))}

        {/* Source attribution */}
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Transcribed (English text only) from the university examination paper published openly by {paper.source.publisher}
            {' — '}
            <Box
              component="a"
              href={paper.source.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
            >
              {paper.source.title}
              <OpenInNew sx={{ fontSize: 12 }} />
            </Box>
            . Retrieved {paper.source.retrievedOn}. {paper.source.note || ''}
            {paper.legacyProgram ? ' BBM was renamed BBA; the syllabus overlaps heavily, so this older paper still makes good practice.' : ''}
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}


// ─── Most repeated questions (item 3.3) ──────────────────────────────────────
//
// /prep/papers/repeats?program=bcom&subject=Financial%20Accounting
//
// The grouping itself happens on the server (functions/src/prepFrequentQuestions.ts)
// so the rule that decides what counts as "the same question" exists once and is
// unit-tested there. This view is presentation only: pick a subject, see what
// keeps coming back, and open the papers it came from.

export function FrequentQuestionsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = String(searchParams.get('program') || '').toLowerCase();
  const program = PROGRAM_LABELS[fromUrl] ? fromUrl : readStoredProgram() || 'bba';
  const subject = String(searchParams.get('subject') || '');

  const [subjects, setSubjects] = useState<Array<{ subjectName: string; repeated: number }>>([]);
  const [questions, setQuestions] = useState<FrequentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFrequentQuestions({ program, subject: subject || undefined })
      .then((res) => {
        if (cancelled) return;
        setSubjects(res.subjects);
        setQuestions(res.questions);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load repeated questions.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [program, subject, attempt]);

  const pickProgram = (code: string) => {
    rememberProgram(code);
    // The subject list is per-program, so the chosen subject cannot carry over.
    setSearchParams({ program: code }, { replace: true });
  };

  const pickSubject = (name: string) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set('subject', name);
    else next.delete('subject');
    setSearchParams(next, { replace: true });
  };

  const hubPath = `/prep?program=${program}`;
  const crumbs = [
    { label: 'Prep', to: '/prep' },
    { label: PROGRAM_LABELS[program] || program, to: hubPath },
    { label: 'Most repeated questions' },
  ];

  return (
    <>
      <ProgramControl active={program} onPick={pickProgram} action={<ShareLinkButton path={`/prep/papers/repeats?program=${program}`} compact />} />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <PrepPageNav crumbs={crumbs} sharePath={`/prep/papers/repeats?program=${program}`} backTo={hubPath} />
          <SectionHeader
            kicker="Exam practice"
            title={`${PROGRAM_LABELS[program] || program} — questions that keep coming back`}
            meta={
              loading
                ? 'Loading…'
                : subject
                  ? `${questions.length} repeated question${questions.length === 1 ? '' : 's'} in ${subject}`
                  : `Pick a subject — ${subjects.length} subject${subjects.length === 1 ? '' : 's'} in this program have questions that appear in more than one paper`
            }
          />

          {error ? (
            <Card variant="outlined">
              <Stack spacing={1.5} sx={{ p: 3, alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 700 }}>Could not load repeated questions</Typography>
                <Typography variant="body2" color="error.main">{error}</Typography>
                <Button size="small" variant="outlined" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
              </Stack>
            </Card>
          ) : loading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2.5 }} />
              ))}
            </Stack>
          ) : subjects.length === 0 ? (
            <Card variant="outlined">
              <Box sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>No repeats found yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  This program has papers, but no question appears in more than one of them yet. Open{' '}
                  <Box component={Link} to={libraryPath(program)} sx={{ color: 'primary.main', fontWeight: 700 }}>
                    previous year papers
                  </Box>{' '}
                  to practise the full sets.
                </Typography>
              </Box>
            </Card>
          ) : (
            <>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">Subject</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                  {subjects.map((entry) => (
                    <Chip
                      key={entry.subjectName}
                      size="small"
                      label={`${entry.subjectName} (${entry.repeated})`}
                      color={subject === entry.subjectName ? 'primary' : 'default'}
                      variant={subject === entry.subjectName ? 'filled' : 'outlined'}
                      onClick={() => pickSubject(subject === entry.subjectName ? '' : entry.subjectName)}
                    />
                  ))}
                </Stack>
              </Stack>

              {subject && questions.length === 0 ? (
                <Card variant="outlined">
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No repeats found for {subject} in this program.
                    </Typography>
                  </Box>
                </Card>
              ) : null}

              {questions.map((entry, index) => (
                <Card key={entry.key} variant="outlined" data-testid="frequent-question">
                  <Stack spacing={1.25} sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Chip size="small" color="primary" label={`Asked ${entry.count} times`} />
                      {entry.marks ? <Chip size="small" variant="outlined" label={`${entry.marks} marks`} /> : null}
                      {entry.years.map((year) => (
                        <Chip key={year} size="small" variant="outlined" label={year} />
                      ))}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        #{index + 1}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{entry.question}</Typography>
                    {entry.variants.length > 0 ? (
                      <Box sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          Also asked as
                        </Typography>
                        {entry.variants.map((variant, i) => (
                          <Typography key={i} variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                            {variant}
                          </Typography>
                        ))}
                      </Box>
                    ) : null}
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      {entry.paperIds.slice(0, 6).map((paperId) => (
                        <Button
                          key={paperId}
                          size="small"
                          variant="text"
                          endIcon={<ChevronRight />}
                          component={Link}
                          to={paperPath(paperId, program)}
                        >
                          {paperId}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
            Grouped from the transcribed texts of published papers: two questions are treated as the same when their wording
            overlaps closely and the marks agree. Nothing here is generated by AI — it is counting.
          </Typography>
        </Stack>
      </Container>
    </>
  );
}
