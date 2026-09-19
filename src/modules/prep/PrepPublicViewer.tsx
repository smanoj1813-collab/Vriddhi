// src/modules/prep/PrepPublicViewer.tsx
//
// The PUBLIC face of the Prep catalog — a shareable URL anyone can open to
// browse, check and verify the platform's prep content WITHOUT a college
// assignment (and without signing in). This is the "URL for the Prep studio"
// the platform team asked for: the authoring studio itself stays a
// superadmin surface (it writes content), but everything it publishes is
// platform-wide reference data, so browsing it needs no tenancy at all.
//
// Routes (all public, all deep-linkable):
//   /prep                                            → hub, ?program=bcom
//   /prep/subject/:subjectId                         → subject's topic list
//   /prep/subject/:subjectId/topic/:topicId          → full topic payload
//
// The server already enforces the boundary: GET /prep/subjects and the topic
// endpoints serve PUBLISHED content to anonymous callers and draft/review
// content only to the superadmin, so this page can never leak an unpublished
// draft even though it is reachable from any URL.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Assignment,
  AutoAwesome,
  Calculate,
  FormatListNumbered,
  Lightbulb,
  MenuBook,
} from '@mui/icons-material';
import {
  fetchPrepSubjects,
  fetchPrepSubject,
  fetchPrepTopics,
  fetchPrepTopic,
  fetchPracticeQuestions,
  effectivePrepTrack,
  topicSubtopics,
  type PrepSubject,
  type PrepTopic,
  type UniversalQuestion,
  rememberLearnerCollege,
} from '@/shared/services/prepContentService';
import { formatStreamLabel } from '@/shared/utils/prepHelpers';
import { CompanyStrip, CompanyView } from './PrepCompanyViews';
import { AUDIENCE_LABELS, DifficultyChip, PROGRAMS, PROGRAM_LABELS, PrepMarkdown, ShareLinkButton, renderInline } from './prepPublicShared';
import { useAuth } from '@/modules/auth/context/AuthContext';

// ─── Header (shared by all three views) ─────────────────────────────────────

function PrepHeader() {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg" sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MenuBook color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Vriddhi <span style={{ color: 'primary.main' }}>Prep</span>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>
          Platform-wide NEP 2020 / CBCS study packs — no college or account needed
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button size="small" component={Link} to="/">Open Vriddhi</Button>
          <Button size="small" component={Link} to="/login">Sign in</Button>
        </Box>
      </Container>
    </Box>
  );
}

// ─── Program bar (hub + subject views) ──────────────────────────────────────

function ProgramBar({
  active,
  onPick,
}: {
  active: string;
  onPick: (code: string) => void;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
      {PROGRAMS.map((p) => (
        <Chip
          key={p.code}
          label={`${p.label}${p.level === 'postgraduate' ? ' (PG)' : ''}`}
          onClick={() => onPick(p.code)}
          color={active === p.code ? 'primary' : 'default'}
          variant={active === p.code ? 'filled' : 'outlined'}
        />
      ))}
    </Stack>
  );
}



/** One sub-topic row: title always visible, brief expands on tap. */
function SubtopicBrief({ index, title, briefMd }: { index: number; title: string; briefMd: string }) {
  const [open, setOpen] = useState(false);
  const hasBrief = Boolean(briefMd && briefMd.trim());
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box
        role={hasBrief ? 'button' : undefined}
        tabIndex={hasBrief ? 0 : undefined}
        aria-expanded={hasBrief ? open : undefined}
        onClick={() => hasBrief && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!hasBrief) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, cursor: hasBrief ? 'pointer' : 'default' }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', minWidth: 20 }}>{index}.</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{title}</Typography>
        {hasBrief ? (
          <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>{open ? 'Hide brief' : 'Brief'}</Typography>
        ) : null}
      </Box>
      {hasBrief && open ? (
        <Box sx={{ px: 1.5, pb: 1.5, pl: { xs: 1.5, sm: 5.5 } }}>
          <Divider sx={{ mb: 1 }} />
          <PrepMarkdown text={briefMd} />
        </Box>
      ) : null}
    </Box>
  );
}

// ─── View 1: Hub (subject grid for a program) ───────────────────────────────

function HubView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = String(searchParams.get('program') || 'bba').toLowerCase();
  const program = PROGRAM_LABELS[requested] ? requested : 'bba';
  const [subjects, setSubjects] = useState<PrepSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPrepSubjects({ program })
      .then((data) => !cancelled && setSubjects(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the catalog.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [program]);

  const pickProgram = (code: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('program', code);
    setSearchParams(next, { replace: true });
  };

  // Academic subjects are scoped to the program; aptitude subjects are the
  // shared placement catalogue (QA / LR / Verbal) listed for every program.
  const academicSubjects = subjects.filter((s) => effectivePrepTrack(s) === 'academic');
  const aptitudeSubjects = subjects.filter((s) => effectivePrepTrack(s) === 'aptitude');

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <ProgramBar active={program} onPick={pickProgram} />
          <ShareLinkButton path={`/prep?program=${program}`} />
        </Stack>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {PROGRAM_LABELS[program]} — Prep Catalog
        </Typography>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : error ? (
          <Card><Box sx={{ p: 3, color: 'error.main' }}>{error}</Box></Card>
        ) : subjects.length > 0 && (academicSubjects.length === 0 || aptitudeSubjects.length > 0) ? (
          <Stack spacing={3}>
            {academicSubjects.length > 0 ? (
              <SubjectSection
                title="Academic subjects"
                subtitle={`${PROGRAM_LABELS[program]} syllabus — semester-wise study packs.`}
                subjects={academicSubjects}
              />
            ) : null}
            {aptitudeSubjects.length > 0 ? (
              <SubjectSection
                title="Placement aptitude"
                subtitle="Quantitative Aptitude, Logical Reasoning and Verbal Ability — the shared core of TCS NQT, Infosys, Wipro, Accenture and Capgemini tests, for every UG and PG program."
                subjects={aptitudeSubjects}
              />
            ) : null}
            <CompanyStrip program={program} />
          </Stack>
        ) : subjects.length === 0 ? (
          <Card>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>No published {PROGRAM_LABELS[program]} subjects yet</Typography>
              <Typography variant="body2" color="text.secondary">
                This program's catalogue has not been seeded or published. A superadmin can do that from
                Superadmin → Prep Content Studio (tick the program and press “Seed”), after which it will
                appear here automatically.
              </Typography>
            </Box>
          </Card>
        ) : (
          <Stack spacing={3}>
            <SubjectSection title="Academic subjects" subjects={academicSubjects} />
            <CompanyStrip program={program} />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

function SubjectSection({ title, subtitle, subjects }: { title: string; subtitle?: string; subjects: PrepSubject[] }) {
  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
        {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      <Grid container spacing={2}>
        {subjects.map((subject) => {
          const isAptitude = effectivePrepTrack(subject) === 'aptitude';
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={subject.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea component={Link} to={`/prep/subject/${subject.id}`} sx={{ height: '100%', p: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }} useFlexGap>
                      <Chip size="small" label={formatStreamLabel(subject.stream)} color={isAptitude ? 'primary' : 'default'} variant={isAptitude ? 'outlined' : 'filled'} />
                      {subject.semester ? <Chip size="small" variant="outlined" label={`Sem ${subject.semester}`} /> : null}
                      {subject.yearGroup ? <Chip size="small" variant="outlined" label={subject.yearGroup} /> : null}
                      {isAptitude ? <Chip size="small" variant="outlined" label="All programs" /> : null}
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {subject.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {subject.description || 'Curriculum-aligned study pack.'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subject.topicCount || 0} topics
                      {isAptitude ? ' · UG & PG · placement prep' : ` · ${subject.programs?.map((p) => PROGRAM_LABELS[p] || p).join(', ')}`}
                    </Typography>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

// ─── View 2: Subject (topic list) ───────────────────────────────────────────

function SubjectView({ subjectId }: { subjectId: string }) {
  const [subject, setSubject] = useState<PrepSubject | null>(null);
  const [topics, setTopics] = useState<PrepTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchPrepSubject(subjectId).catch(() => null), fetchPrepTopics(subjectId).catch(() => [])])
      .then(([subj, tops]) => {
        if (cancelled) return;
        if (!subj) {
          setError('This subject does not exist or is not published.');
          return;
        }
        setSubject(subj);
        setTopics(tops);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="lg" sx={{ py: 3 }}><Card><Box sx={{ p: 3, color: 'error.main' }}>{error}</Box></Card></Container>;
  if (!subject) return null;

  const isAptitude = effectivePrepTrack(subject) === 'aptitude';
  // Group topics by module (moduleNumber + moduleName). Academic subjects use
  // one topic per module, which collapses to a single group and renders as
  // before; aptitude subjects have several topics per module.
  const moduleGroups: Array<{ key: string; label: string; topics: PrepTopic[] }> = [];
  for (const t of topics) {
    const key = `${t.moduleNumber ?? t.order}`;
    let g = moduleGroups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: t.moduleName || `Module ${t.moduleNumber ?? t.order}`, topics: [] };
      moduleGroups.push(g);
    }
    g.topics.push(t);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Button component={Link} to={`/prep?program=${subject.programs?.[0] || 'bba'}`} startIcon={<ArrowLeft />} size="small">
            Back to {PROGRAM_LABELS[subject.programs?.[0] || ''] || 'catalog'}
          </Button>
          <ShareLinkButton path={`/prep/subject/${subject.id}`} />
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{subject.name}</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
          <Chip label={formatStreamLabel(subject.stream)} size="small" />
          {subject.semester ? <Chip size="small" variant="outlined" label={`Semester ${subject.semester}`} /> : null}
          {subject.yearGroup ? <Chip size="small" variant="outlined" label={subject.yearGroup} /> : null}
          {isAptitude ? (
            <Chip size="small" variant="outlined" color="primary" label="All UG & PG programs" />
          ) : (
            (subject.programs || []).map((p) => (
              <Chip key={p} size="small" variant="outlined" color="primary" label={PROGRAM_LABELS[p] || p} />
            ))
          )}
          {subject.syllabusRef ? <Chip size="small" variant="outlined" label={subject.syllabusRef} /> : null}
        </Stack>
        {subject.description ? (
          <Typography variant="body1" color="text.secondary">{subject.description}</Typography>
        ) : null}

        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {isAptitude ? 'Modules & topics' : 'Module Topics'}
        </Typography>
        {topics.length === 0 ? (
          <Card><Box sx={{ p: 3, color: 'text.secondary' }}>No published topics yet for this subject.</Box></Card>
        ) : (
          <Stack spacing={3}>
            {moduleGroups.map((group) => (
              <Stack spacing={1.5} key={group.key}>
                {moduleGroups.length > 1 ? (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{group.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.topics.length} topic{group.topics.length === 1 ? '' : 's'} · {group.topics.reduce((n, t) => n + topicSubtopics(t).length, 0)} sub-topics
                    </Typography>
                  </Box>
                ) : null}
                <Grid container spacing={2}>
                  {group.topics.map((topic) => {
                    const subs = topicSubtopics(topic);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={topic.id}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardActionArea component={Link} to={`/prep/subject/${subject.id}/topic/${topic.id}`} sx={{ height: '100%', p: 2 }}>
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                                  {moduleGroups.length > 1
                                    ? `Topic ${topic.order}`
                                    : topic.moduleName ? `Module ${topic.moduleNumber ?? topic.order} — ${topic.moduleName}` : `Module ${topic.order}`}
                                </Typography>
                                <Stack direction="row" spacing={0.5}>
                                  {topic.examFrequency === 'very_high' ? <Chip size="small" color="warning" variant="outlined" label="Very high frequency" /> : null}
                                  <DifficultyChip difficulty={topic.difficulty} />
                                </Stack>
                              </Stack>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>{topic.title}</Typography>
                              {subs.length > 0 ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {subs.length} sub-topics: {subs.map((st) => st.title).join(' · ')}
                                </Typography>
                              ) : null}
                            </Stack>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

// ─── View 3: Topic (the four sections + practice preview) ───────────────────

function TopicView({ subjectId, topicId }: { subjectId: string; topicId: string }) {
  const [topic, setTopic] = useState<PrepTopic | null>(null);
  const [practice, setPractice] = useState<UniversalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'explanation' | 'formulas' | 'tricks' | 'howtosolve' | 'practice'>('explanation');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveSection('explanation');
    Promise.all([
      fetchPrepTopic(subjectId, topicId).catch(() => null),
      fetchPracticeQuestions({ topicId, count: 6 }).catch(() => []),
    ])
      .then(([top, questions]) => {
        if (cancelled) return;
        if (!top) {
          setError('This topic does not exist or is not published.');
          return;
        }
        setTopic(top);
        setPractice(questions);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [subjectId, topicId]);

  if (loading) return <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="lg" sx={{ py: 3 }}><Card><Box sx={{ p: 3, color: 'error.main' }}>{error}</Box></Card></Container>;
  if (!topic) return null;

  const subtopics = topicSubtopics(topic);

  const sections: Array<{ id: typeof activeSection; label: string; icon: React.ReactElement }> = [
    { id: 'explanation', label: 'Explanation', icon: <MenuBook fontSize="small" /> },
    { id: 'formulas', label: 'Formulas', icon: <Calculate fontSize="small" /> },
    { id: 'tricks', label: 'Tricks', icon: <Lightbulb fontSize="small" /> },
    { id: 'howtosolve', label: 'How to Solve', icon: <FormatListNumbered fontSize="small" /> },
    { id: 'practice', label: 'Practice', icon: <Assignment fontSize="small" /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Button component={Link} to={`/prep/subject/${subjectId}`} startIcon={<ArrowLeft />} size="small">
            Back to subject
          </Button>
          <ShareLinkButton path={`/prep/subject/${subjectId}/topic/${topicId}`} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <AutoAwesome color="primary" fontSize="small" />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{topic.title}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
          {topic.moduleName ? <Chip size="small" variant="outlined" label={topic.moduleName} /> : null}
          <DifficultyChip difficulty={topic.difficulty} />
          <Chip size="small" variant="outlined" label={topic.tier === 'free' ? 'Free' : 'Premium'} color={topic.tier === 'free' ? 'success' : 'secondary'} />
          {topic.examFrequency ? <Chip size="small" variant="outlined" label={`Exam frequency: ${topic.examFrequency.replace(/_/g, ' ')}`} /> : null}
          {(topic.audience || []).length > 0 && (topic.audience || []).length < 3 ? (
            <Chip size="small" variant="outlined" label={`Mainly for: ${(topic.audience || []).map((a) => AUDIENCE_LABELS[a] || a).join(', ')}`} />
          ) : null}
        </Stack>

        {subtopics.length > 0 ? (
          <Card variant="outlined">
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>What this topic covers</Typography>
              <Typography variant="caption" color="text.secondary">
                {subtopics.length} sub-topics — expand any one for a quick brief before reading the full explanation.
              </Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {subtopics.map((st, idx) => (
                  <SubtopicBrief key={st.id || idx} index={idx + 1} title={st.title} briefMd={st.briefMd} />
                ))}
              </Stack>
            </Box>
          </Card>
        ) : null}

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }} useFlexGap>
          {sections.map((s) => (
            <Chip
              key={s.id}
              icon={s.icon}
              label={s.label}
              onClick={() => setActiveSection(s.id)}
              color={activeSection === s.id ? 'primary' : 'default'}
              variant={activeSection === s.id ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>

        <Card>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {activeSection === 'explanation' && <PrepMarkdown text={topic.explanationMd || 'No explanation published yet.'} />}
            {activeSection === 'formulas' && (
              (topic.formulas || []).length === 0 ? (
                <Typography color="text.secondary">No formulas published yet.</Typography>
              ) : (
                <Stack spacing={2}>
                  {topic.formulas.map((f) => (
                    <Box key={f.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{f.label}</Typography>
                      <Box sx={{ overflowX: 'auto' }}>
                        <PrepMarkdown text={`$$${f.formula}$$`} />
                      </Box>
                      {f.exampleQ ? (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Example</Typography>
                          <Typography variant="body2">{renderInline(f.exampleQ, 'eq')}</Typography>
                          <Typography variant="body2" color="text.secondary">{renderInline(f.exampleA || '', 'ea')}</Typography>
                        </Box>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              )
            )}
            {activeSection === 'tricks' && (
              (topic.tricks || []).length === 0 ? (
                <Typography color="text.secondary">No tricks published yet.</Typography>
              ) : (
                <Stack spacing={2}>
                  {topic.tricks.map((t) => (
                    <Box key={t.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.title}</Typography>
                      <Typography variant="body2" sx={{ my: 0.5 }}>{renderInline(t.trick, 'trick')}</Typography>
                      {t.whenToUse ? (
                        <Typography variant="caption" color="text.secondary">When to use: {t.whenToUse}</Typography>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              )
            )}
            {activeSection === 'howtosolve' && (
              (topic.howToSolve || []).length === 0 ? (
                <Typography color="text.secondary">No solve guide published yet.</Typography>
              ) : (
                <Stack spacing={2}>
                  {topic.howToSolve.map((s) => (
                    <Box key={s.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{s.step}</Typography>
                      <Typography variant="body2" sx={{ my: 0.5 }}>{renderInline(s.detail, 'solve')}</Typography>
                      {s.questionType ? (
                        <Typography variant="caption" color="text.secondary">{s.questionType}</Typography>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              )
            )}
            {activeSection === 'practice' && (
              practice.length === 0 ? (
                <Typography color="text.secondary">No practice questions linked to this topic yet.</Typography>
              ) : (
                <Stack spacing={2}>
                  {practice.map((q, idx) => (
                    <Box key={q.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1 }}>
                        <Typography sx={{ fontWeight: 800 }}>{idx + 1}.</Typography>
                        <Typography sx={{ fontWeight: 500, flex: 1 }}>{renderInline(q.questionText, `q${idx}`)}</Typography>
                        <DifficultyChip difficulty={q.difficulty} />
                      </Stack>
                      <Stack spacing={0.5}>
                        {q.options.map((opt, oIdx) => (
                          <Box
                            key={oIdx}
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 1.5,
                              border: 1,
                              borderColor: oIdx === q.correctIndex ? 'success.main' : 'divider',
                              bgcolor: oIdx === q.correctIndex ? 'success.main' : 'transparent',
                              color: oIdx === q.correctIndex ? 'common.white' : 'text.primary',
                              opacity: oIdx === q.correctIndex ? 0.9 : 1,
                            }}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </Box>
                        ))}
                      </Stack>
                      <Box sx={{ mt: 1, px: 1.5, py: 1, bgcolor: 'rgba(13,148,136,0.06)', borderRadius: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">{q.explanation}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )
            )}
          </Box>
        </Card>
      </Stack>
    </Container>
  );
}

// ─── Page shell ─────────────────────────────────────────────────────────────

export default function PrepPublicViewer({ view }: { view: 'hub' | 'subject' | 'topic' | 'company' }) {
  const params = useParams<{ subjectId: string; topicId: string; companyCode: string }>();
  // The prep pages are public, but a signed-in learner's college decides
  // which company guides they may see. Remember it so anonymous follow-up
  // visits (and the strip on this page) are filtered the same way.
  const { user } = useAuth();
  useEffect(() => {
    rememberLearnerCollege(user?.collegeId);
  }, [user?.collegeId]);
  const body = useMemo(() => {
    if (view === 'hub') return <HubView />;
    if (view === 'subject') return <SubjectView subjectId={params.subjectId || ''} />;
    if (view === 'company') return <CompanyView code={params.companyCode || ''} />;
    return <TopicView subjectId={params.subjectId || ''} topicId={params.topicId || ''} />;
  }, [view, params.subjectId, params.topicId, params.companyCode]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <PrepHeader />
      {body}
      <Box component="footer" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Vriddhi Prep — Karnataka NEP 2020 / CBCS platform curriculum. Content is platform-wide and
          needs no college assignment; only published material is visible here.
        </Typography>
      </Box>
    </Box>
  );
}
