// src/modules/prep/PrepCompanyViews.tsx
//
// Company-specific placement prep, rendered inside the public /prep shell:
//   <CompanyStrip />     — cards on the hub, filtered to the selected program
//   <CompanyView />      — /prep/company/:code — pattern, eligibility, rounds,
//                          section → topic checklist, strategy, and a
//                          company-weighted mock sampled from the shared
//                          aptitude question pool.
//
// Companies do not own content: every section maps onto qa-* / lr-* / va-*
// topics that already exist, so the checklist links straight into them.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowLeft, Assignment, Business, CheckCircle, RadioButtonUnchecked, Refresh, Timer } from '@mui/icons-material';
import {
  fetchPrepCompanies,
  fetchPrepCompany,
  fetchPrepCompanyMock,
  type PrepCompany,
  type PrepCompanyMockQuestion,
  type PrepCompanySection,
  type PrepCompanyTopicCard,
} from '@/shared/services/prepContentService';
import {
  AUDIENCE_LABELS,
  DifficultyChip,
  PROGRAM_LABELS,
  PrepMarkdown,
  ShareLinkButton,
  renderInline,
} from './prepPublicShared';

const COVERAGE_LABEL: Record<PrepCompanySection['coverage'], { label: string; color: 'success' | 'warning' | 'default' }> = {
  catalogue: { label: 'Covered in Vriddhi Prep', color: 'success' },
  partial: { label: 'Partly covered — see note', color: 'warning' },
  external: { label: 'Outside this catalogue', color: 'default' },
};

function formatVerified(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Learner's local "done" checklist per company — kept in localStorage so the
// public page works without an account; signed-in progress can layer on later.
function useCompanyChecklist(code: string) {
  const key = `vriddhi.prep.company.${code}.done`;
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(key);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });
  const toggle = (topicId: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  };
  return { done, toggle };
}

// ─── Hub strip ──────────────────────────────────────────────────────────────

export function CompanyStrip({ program }: { program: string }) {
  const [companies, setCompanies] = useState<PrepCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPrepCompanies({ program })
      .then((data) => !cancelled && setCompanies(data))
      .catch(() => !cancelled && setCompanies([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [program]);

  if (loading) return <LinearProgress />;
  if (companies.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Company-specific prep</Typography>
        <Typography variant="body2" color="text.secondary">
          Exam pattern, eligibility, rounds and a topic checklist for recruiters that hire {PROGRAM_LABELS[program] || program} graduates — each guide maps onto the aptitude topics above.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {companies.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.code}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea component={Link} to={`/prep/company/${c.code}`} sx={{ height: '100%', p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Business color="primary" fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{c.name}</Typography>
                    {c.negativeMarking ? <Chip size="small" color="error" variant="outlined" label="Negative marking" /> : <Chip size="small" variant="outlined" label="No negative marking" />}
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.testName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.tagline}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.sections.length} sections{c.totalMinutes ? ` · ${c.totalMinutes} min` : ''} · {c.topicCount ?? 0} topics to prepare · pattern checked {formatVerified(c.patternVerifiedOn)}
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

// ─── Company page ───────────────────────────────────────────────────────────

export function CompanyView({ code }: { code: string }) {
  const [company, setCompany] = useState<PrepCompany | null>(null);
  const [topics, setTopics] = useState<PrepCompanyTopicCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'checklist' | 'strategy' | 'mock'>('overview');
  const { done, toggle } = useCompanyChecklist(code);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTab('overview');
    fetchPrepCompany(code)
      .then(({ company: c, topics: t }) => {
        if (cancelled) return;
        setCompany(c);
        setTopics(t);
      })
      .catch(() => !cancelled && setError('This company guide does not exist or is not published.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [code]);

  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const mappedTopicIds = useMemo(() => {
    const out: string[] = [];
    for (const sec of company?.sections || []) for (const id of sec.topicIds) if (!out.includes(id) && topicById.has(id)) out.push(id);
    return out;
  }, [company, topicById]);
  const doneCount = mappedTopicIds.filter((id) => done.has(id)).length;

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error || !company) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Card><Box sx={{ p: 3, color: 'error.main' }}>{error || 'Not found.'}</Box></Card>
      </Container>
    );
  }

  const backProgram = company.eligibility.programs[0] || 'bba';

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Button component={Link} to={`/prep?program=${backProgram}`} startIcon={<ArrowLeft />} size="small">
            Back to catalog
          </Button>
          <ShareLinkButton path={`/prep/company/${company.code}`} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Business color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{company.name}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{company.testName}</Typography>
        <Typography variant="body1" color="text.secondary">{company.tagline}</Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
          {company.totalMinutes ? <Chip size="small" icon={<Timer />} label={`${company.totalMinutes} min total`} /> : null}
          {company.totalQuestions ? <Chip size="small" variant="outlined" label={`~${company.totalQuestions} questions`} /> : null}
          <Chip size="small" variant="outlined" color={company.negativeMarking ? 'error' : 'success'} label={company.negativeMarking ? 'Negative marking' : 'No negative marking'} />
          <Chip size="small" variant="outlined" color={company.sectionalCutoff ? 'warning' : 'default'} label={company.sectionalCutoff ? 'Sectional cut-offs' : 'Overall cut-off'} />
          {company.platform ? <Chip size="small" variant="outlined" label={company.platform} /> : null}
          {company.audience.map((a) => <Chip key={a} size="small" variant="outlined" label={AUDIENCE_LABELS[a] || a} />)}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Pattern last checked against public sources on {formatVerified(company.patternVerifiedOn)}. Recruiters change formats every season — always confirm with the current drive notification.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
          {([
            ['overview', 'Pattern & rounds'],
            ['checklist', `Topics to prepare (${doneCount}/${mappedTopicIds.length})`],
            ['strategy', 'How to prepare'],
            ['mock', 'Company mock'],
          ] as const).map(([id, label]) => (
            <Chip key={id} label={label} onClick={() => setTab(id)} color={tab === id ? 'primary' : 'default'} variant={tab === id ? 'filled' : 'outlined'} />
          ))}
        </Stack>

        {tab === 'overview' && <OverviewTab company={company} />}
        {tab === 'checklist' && <ChecklistTab company={company} topicById={topicById} done={done} toggle={toggle} />}
        {tab === 'strategy' && <StrategyTab company={company} />}
        {tab === 'mock' && <MockTab company={company} />}
      </Stack>
    </Container>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

function OverviewTab({ company }: { company: PrepCompany }) {
  const e = company.eligibility;
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Test pattern</Typography>
          <Stack spacing={1}>
            {company.sections.map((sec) => {
              const cov = COVERAGE_LABEL[sec.coverage];
              return (
                <Box key={sec.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{sec.name}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }} useFlexGap>
                      {sec.questions ? <Chip size="small" variant="outlined" label={`${sec.questions} Q`} /> : null}
                      {sec.minutes ? <Chip size="small" variant="outlined" label={`${sec.minutes} min`} /> : null}
                      <Chip size="small" color={cov.color} variant="outlined" label={cov.label} />
                    </Stack>
                  </Stack>
                  {sec.note ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{sec.note}</Typography> : null}
                  {sec.coverage !== 'catalogue' && sec.coverageNote ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{sec.coverageNote}</Typography>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Eligibility (typical)</Typography>
              <Stack spacing={0.75}>
                <Typography variant="body2"><strong>Programs:</strong> {e.programs.map((p) => PROGRAM_LABELS[p] || p).join(', ')}</Typography>
                <Typography variant="body2"><strong>Degrees:</strong> {e.degrees}</Typography>
                {e.minPercentage ? <Typography variant="body2"><strong>Marks:</strong> {e.minPercentage}</Typography> : null}
                {e.backlogs ? <Typography variant="body2"><strong>Backlogs:</strong> {e.backlogs}</Typography> : null}
                {e.gap ? <Typography variant="body2"><strong>Education gap:</strong> {e.gap}</Typography> : null}
                {e.age ? <Typography variant="body2"><strong>Age:</strong> {e.age}</Typography> : null}
                {e.note ? <Typography variant="body2" color="text.secondary">{e.note}</Typography> : null}
              </Stack>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Selection rounds</Typography>
              <Stack spacing={1}>
                {company.rounds.map((r, idx) => (
                  <Box key={r.id}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 20 }}>{idx + 1}.</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.name}</Typography>
                      {r.eliminator ? <Chip size="small" color="warning" variant="outlined" label="Eliminator" /> : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 3.5 }}>{r.detail}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {company.quickTips.length > 0 ? (
        <Card variant="outlined">
          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Quick tips</Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
              {company.quickTips.map((tip, i) => <Typography key={i} component="li" variant="body2">{tip}</Typography>)}
            </Stack>
          </Box>
        </Card>
      ) : null}

      {company.rolesMd ? (
        <Card variant="outlined">
          <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Roles & packages (as reported)</Typography>
            <PrepMarkdown text={company.rolesMd} />
          </Box>
        </Card>
      ) : null}

      {company.sources.length > 0 ? (
        <Typography variant="caption" color="text.secondary">
          Sources consulted: {company.sources.map((u, i) => (
            <React.Fragment key={u}>
              {i > 0 ? ' · ' : ''}
              <a href={u} target="_blank" rel="noreferrer">{new URL(u).hostname.replace(/^www\./, '')}</a>
            </React.Fragment>
          ))}
        </Typography>
      ) : null}
    </Stack>
  );
}

function ChecklistTab({
  company,
  topicById,
  done,
  toggle,
}: {
  company: PrepCompany;
  topicById: Map<string, PrepCompanyTopicCard>;
  done: Set<string>;
  toggle: (id: string) => void;
}) {
  const sections = company.sections.filter((s) => s.topicIds.some((id) => topicById.has(id)));
  if (sections.length === 0) {
    return <Card><Box sx={{ p: 3, color: 'text.secondary' }}>The aptitude catalogue has not been published yet, so no topics can be linked. A superadmin can seed it from Prep Content Studio.</Box></Card>;
  }
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Ordered by how often each topic appears in this test. Tick topics as you finish them — the list is saved on this device.
      </Typography>
      {sections.map((sec) => {
        const cards = sec.topicIds.map((id) => topicById.get(id)).filter((c): c is PrepCompanyTopicCard => Boolean(c));
        const secDone = cards.filter((c) => done.has(c.id)).length;
        return (
          <Card variant="outlined" key={sec.id}>
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{sec.name}</Typography>
                <Typography variant="caption" color="text.secondary">{secDone}/{cards.length} done</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={cards.length ? (secDone / cards.length) * 100 : 0} sx={{ mb: 1.5, height: 6, borderRadius: 3 }} />
              <Stack spacing={0.75}>
                {cards.map((t, idx) => {
                  const isDone = done.has(t.id);
                  return (
                    <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: 1, borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.75, opacity: isDone ? 0.7 : 1 }}>
                      <Button size="small" onClick={() => toggle(t.id)} sx={{ minWidth: 0, p: 0.5 }} aria-label={isDone ? 'Mark not done' : 'Mark done'}>
                        {isDone ? <CheckCircle color="success" /> : <RadioButtonUnchecked color="disabled" />}
                      </Button>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', minWidth: 20 }}>{idx + 1}.</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography component={Link} to={`/prep/subject/${t.subjectId}/topic/${t.id}`} variant="body2" sx={{ fontWeight: 700, textDecoration: isDone ? 'line-through' : 'none', color: 'inherit' }}>
                          {t.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t.moduleName ? `${t.moduleName} · ` : ''}{t.subtopicCount} sub-topics
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                        {t.examFrequency === 'very_high' ? <Chip size="small" color="warning" variant="outlined" label="Very high" /> : null}
                        <DifficultyChip difficulty={t.difficulty} />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );
}

function StrategyTab({ company }: { company: PrepCompany }) {
  return (
    <Card>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <PrepMarkdown text={company.strategyMd || 'No strategy published yet.'} />
      </Box>
    </Card>
  );
}

function MockTab({ company }: { company: PrepCompany }) {
  const [questions, setQuestions] = useState<PrepCompanyMockQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    fetchPrepCompanyMock(company.code, 20)
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, [company.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const bySection = useMemo(() => {
    const m = new Map<string, { name: string; total: number; correct: number }>();
    for (const q of questions) {
      const e = m.get(q.sectionId) || { name: q.sectionName, total: 0, correct: 0 };
      e.total += 1;
      if (answers[q.id] === q.correctIndex) e.correct += 1;
      m.set(q.sectionId, e);
    }
    return [...m.values()];
  }, [questions, answers]);

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (questions.length === 0) {
    return <Card><Box sx={{ p: 3, color: 'text.secondary' }}>No practice questions are available for this company's sections yet.</Box></Card>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Typography variant="body2" color="text.secondary">
          {questions.length} questions sampled from the topics this test uses, in roughly the same section mix. Untimed — use it to find weak sections, then drill those topics.
        </Typography>
        <Button size="small" startIcon={<Refresh />} onClick={load}>New set</Button>
      </Stack>

      {submitted ? (
        <Card variant="outlined">
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Score: {score} / {questions.length}</Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {bySection.map((s) => (
                <Stack key={s.name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ minWidth: 220 }}>{s.name}</Typography>
                  <LinearProgress variant="determinate" value={s.total ? (s.correct / s.total) * 100 : 0} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                  <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{s.correct}/{s.total}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Card>
      ) : null}

      <Stack spacing={2}>
        {questions.map((q, idx) => {
          const picked = answers[q.id];
          return (
            <Box key={q.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>{idx + 1}.</Typography>
                <Typography sx={{ fontWeight: 500, flex: 1 }}>{renderInline(q.questionText, `cq${idx}`)}</Typography>
                <Chip size="small" variant="outlined" label={q.sectionName} sx={{ display: { xs: 'none', md: 'inline-flex' } }} />
                <DifficultyChip difficulty={q.difficulty} />
              </Stack>
              <Stack spacing={0.5}>
                {q.options.map((opt, oIdx) => {
                  const isPicked = picked === oIdx;
                  const isCorrect = oIdx === q.correctIndex;
                  let borderColor = 'divider';
                  let bgcolor = 'transparent';
                  if (submitted && isCorrect) { borderColor = 'success.main'; bgcolor = 'rgba(46,125,50,0.08)'; }
                  else if (submitted && isPicked && !isCorrect) { borderColor = 'error.main'; bgcolor = 'rgba(211,47,47,0.08)'; }
                  else if (isPicked) { borderColor = 'primary.main'; bgcolor = 'rgba(25,118,210,0.08)'; }
                  return (
                    <Box
                      key={oIdx}
                      role="button"
                      tabIndex={0}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: oIdx }))}
                      onKeyDown={(e) => { if (!submitted && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setAnswers((a) => ({ ...a, [q.id]: oIdx })); } }}
                      sx={{ px: 1.5, py: 0.75, borderRadius: 1.5, border: 1, borderColor, bgcolor, cursor: submitted ? 'default' : 'pointer' }}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </Box>
                  );
                })}
              </Stack>
              {submitted ? (
                <Box sx={{ mt: 1, px: 1.5, py: 1, bgcolor: 'rgba(13,148,136,0.06)', borderRadius: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">{q.explanation}</Typography>
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      <Divider />
      {!submitted ? (
        <Button variant="contained" startIcon={<Assignment />} onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length === 0}>
          Check answers ({Object.keys(answers).length}/{questions.length} answered)
        </Button>
      ) : (
        <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Try a new set</Button>
      )}
    </Stack>
  );
}
