// ═══════════════════════════════════════════════════════════════════════
// SEED QUESTION BANK DIALOG — load the curated platform question bank
// ═══════════════════════════════════════════════════════════════════════
// The superadmin question-bank page is read-only by design (it browses the
// universal pool), so there was no way to load the curated seed in
// data/question-bank/*.csv short of the per-college Bulk Import modal — which
// writes to the legacy college collection, not to the pool this page reads.
//
// This dialog closes that gap: pick a dataset, preview exactly what will be
// written, and seed. Seeding is idempotent — a row whose text + subject + topic
// + programme already exists in the pool is skipped, so re-running is safe.
// ═══════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CloudUpload as SeedIcon,
  ContentPaste as PreviewIcon,
  CheckCircle as DoneIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { useAuth } from '../../auth/context/AuthContext';
import type { Visibility } from '../../admin/types/universalQuestionBank';
import {
  SEED_BRANCHES,
  SEED_FILES,
  resolveSeedRows,
  toUniversalQuestionType,
  type SeedFileKey,
  type SeedRow,
} from '../data/questionBankSeed';
import {
  buildSeedPlan,
  forceSeedRows,
  runSeedPlan,
  type SeedPlan,
  type SeedRunResult,
} from '../services/questionBankSeeder';

const STEPS = ['Dataset', 'Review', 'Result'];

/** Writes per question: meta + content + review. Shown before committing. */
const DOCS_PER_QUESTION = 3;

interface SeedQuestionBankDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful run so the page can reload the pool. */
  onSeeded?: (result: SeedRunResult) => void;
}

const SeedQuestionBankDialog: React.FC<SeedQuestionBankDialogProps> = ({
  open,
  onClose,
  onSeeded,
}) => {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  const [step, setStep] = useState(0);
  const [fileKey, setFileKey] = useState<SeedFileKey>('all');
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [autoApprove, setAutoApprove] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const [plan, setPlan] = useState<SeedPlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [result, setResult] = useState<SeedRunResult | null>(null);

  // ── Step 0: parse + validate the chosen dataset (pure, instant) ──────────
  const resolved = useMemo(
    () => resolveSeedRows(fileKey, branchFilter),
    [fileKey, branchFilter]
  );

  const reset = useCallback(() => {
    setStep(0);
    setPlan(null);
    setPlanError(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    setSeeding(false);
    setPlanning(false);
  }, []);

  // Re-opening the dialog starts a fresh run; a stale plan would report the
  // previous run's "already exists" counts.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  // ── Step 1: diff the dataset against what is already in the pool ─────────
  const handleBuildPlan = useCallback(async () => {
    setPlanning(true);
    setPlanError(null);
    try {
      const built = await buildSeedPlan(resolved.rows, {
        visibility,
        status: autoApprove ? 'approved' : 'pending',
        source: 'platform',
        shuffleOptions,
        author: {
          userId: user?.uid || user?.id || '',
          userName: user?.name || user?.displayName || 'Vriddhi Platform',
        },
      });
      setPlan(built);
      setStep(1);
    } catch (error) {
      setPlanError((error as Error).message || 'Could not prepare the seed plan');
    } finally {
      setPlanning(false);
    }
  }, [resolved.rows, visibility, autoApprove, shuffleOptions, user]);

  // ── Step 2: write ────────────────────────────────────────────────────────
  const handleSeed = useCallback(async () => {
    if (!plan) return;
    setSeeding(true);
    setProgress({ done: 0, total: plan.toSeed.length });
    try {
      const runResult = await runSeedPlan(plan, (done, total) => setProgress({ done, total }));
      setResult(runResult);
      setStep(2);
      if (runResult.created > 0) onSeeded?.(runResult);
    } catch (error) {
      setResult({
        created: 0,
        skipped: plan.skipped.length,
        failed: plan.toSeed.length,
        errors: [(error as Error).message || 'Seeding failed'],
        createdIds: [],
      });
      setStep(2);
    } finally {
      setSeeding(false);
    }
  }, [plan, onSeeded]);

  /** Skip the dedupe diff when the pool could not be read at all. */
  const handleForceSeed = useCallback(async () => {
    setSeeding(true);
    setProgress({ done: 0, total: resolved.rows.length });
    try {
      const runResult = await forceSeedRows(
        resolved.rows,
        {
          visibility,
          status: autoApprove ? 'approved' : 'pending',
          source: 'platform',
          shuffleOptions,
          author: {
            userId: user?.uid || user?.id || '',
            userName: user?.name || user?.displayName || 'Vriddhi Platform',
          },
        },
        (done, total) => setProgress({ done, total })
      );
      setResult(runResult);
      setStep(2);
      if (runResult.created > 0) onSeeded?.(runResult);
    } catch (error) {
      setResult({
        created: 0,
        skipped: 0,
        failed: resolved.rows.length,
        errors: [(error as Error).message || 'Seeding failed'],
        createdIds: [],
      });
      setStep(2);
    } finally {
      setSeeding(false);
    }
  }, [resolved.rows, visibility, autoApprove, shuffleOptions, user, onSeeded]);

  const handleClose = () => {
    if (seeding) return; // never drop a running write — the user loses the summary
    onClose();
  };

  const toggleBranch = (branch: string) => {
    setBranchFilter((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const toSeedCount = plan?.toSeed.length ?? 0;
  const skippedCount = plan?.skipped.length ?? 0;
  const writesEstimate = resolved.rows.length * DOCS_PER_QUESTION;
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SeedIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Seed Platform Question Bank
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Loads the curated B.Com / BA / B.Sc seed into the universal pool
              (questionBank_meta + questionBank_content)
            </Typography>
          </Box>
          <Tooltip title="Start over">
            <span>
              <IconButton onClick={reset} disabled={seeding || planning} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {!isSuperadmin && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            You are signed in as <strong>{user?.role || 'unknown'}</strong>. Seeding the platform
            pool is a superadmin action — Firestore rules will reject these writes.
          </Alert>
        )}

        {/* ══════════ STEP 0 — DATASET ══════════ */}
        {step === 0 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="seed-file-label">Dataset</InputLabel>
              <Select
                labelId="seed-file-label"
                label="Dataset"
                value={fileKey}
                onChange={(e) => setFileKey(e.target.value as SeedFileKey)}
              >
                {SEED_FILES.map((file) => (
                  <MenuItem key={file.key} value={file.key}>
                    {file.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Programmes
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {SEED_BRANCHES.map((branch) => {
                  const count =
                    resolved.branches.find((b) => b.name === branch)?.count ?? 0;
                  const checked = branchFilter.includes(branch);
                  return (
                    <Chip
                      key={branch}
                      label={`${branch}${branchFilter.length ? ` · ${count}` : ''}`}
                      color={checked ? 'primary' : 'default'}
                      variant={checked ? 'filled' : 'outlined'}
                      onClick={() => toggleBranch(branch)}
                      sx={{ fontWeight: 700 }}
                    />
                  );
                })}
                {branchFilter.length > 0 && (
                  <Button size="small" onClick={() => setBranchFilter([])}>
                    Clear filter
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Unselected = every programme in the dataset.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                How the rows land
              </Typography>
              <Stack spacing={1}>
                <FormControl fullWidth size="small">
                  <InputLabel id="seed-visibility-label">Visibility</InputLabel>
                  <Select
                    labelId="seed-visibility-label"
                    label="Visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as Visibility)}
                  >
                    <MenuItem value="public">
                      public — every college can use these questions
                    </MenuItem>
                    <MenuItem value="college_only">
                      college_only — hidden from colleges (platform-internal)
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Mark as <strong>approved</strong> immediately (uncheck to leave them{' '}
                      <em>pending</em> in the review queue)
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Shuffle MCQ options (the seed's answer key is skewed to A/B — shuffling is
                      deterministic, so re-seeding stays a no-op)
                    </Typography>
                  }
                />
              </Stack>
            </Box>

            <Divider />

            {/* Dataset summary — computed from the bundled CSV, no reads needed */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Dataset contents
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Chip label={`${resolved.rows.length} valid questions`} color="primary" />
                <Chip label={`${resolved.totalMarks} total marks`} variant="outlined" />
                <Chip label={`${resolved.subjects.length} subjects`} variant="outlined" />
                {resolved.types.map((t) => (
                  <Chip key={t.name} label={`${t.name}: ${t.count}`} size="small" variant="outlined" />
                ))}
                {resolved.difficulties.map((d) => (
                  <Chip
                    key={d.name}
                    label={`${d.name}: ${d.count}`}
                    size="small"
                    color={d.name === 'hard' ? 'error' : d.name === 'medium' ? 'warning' : 'success'}
                    variant="outlined"
                  />
                ))}
                {resolved.filteredOut > 0 && (
                  <Chip
                    label={`${resolved.filteredOut} hidden by programme filter`}
                    size="small"
                    color="default"
                  />
                )}
              </Stack>

              {resolved.invalid.length > 0 && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {resolved.invalid.length} row(s) failed validation and will be skipped.
                  <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                    {resolved.invalid.slice(0, 5).map((entry) => (
                      <Typography key={entry.row.line} component="li" variant="caption">
                        Line {entry.row.line}: {entry.errors.join('; ')}
                      </Typography>
                    ))}
                    {resolved.invalid.length > 5 && (
                      <Typography component="li" variant="caption">
                        …and {resolved.invalid.length - 5} more
                      </Typography>
                    )}
                  </Box>
                </Alert>
              )}

              <SeedPreviewTable rows={resolved.rows.slice(0, 8)} />
              {resolved.rows.length > 8 && (
                <Typography variant="caption" color="text.secondary">
                  Showing the first 8 of {resolved.rows.length} rows.
                </Typography>
              )}
            </Box>

            {planError && <Alert severity="error">{planError}</Alert>}

            <Alert severity="info" icon={<PreviewIcon />}>
              Next step reads the existing pool once and tells you exactly how many rows are new
              before anything is written. Estimated cost of a full seed:{' '}
              <strong>~{writesEstimate} Firestore writes</strong> ({resolved.rows.length} questions ×{' '}
              {DOCS_PER_QUESTION} documents).
            </Alert>
          </Stack>
        )}

        {/* ══════════ STEP 1 — REVIEW THE PLAN ══════════ */}
        {step === 1 && plan && (
          <Stack spacing={2}>
            {plan.scanFailed ? (
              <Alert severity="warning" icon={<WarningIcon />}>
                Could not read the existing pool ({plan.scanError}), so duplicates cannot be
                detected. You can still seed, but re-running later may create duplicate questions.
              </Alert>
            ) : (
              <Alert severity="success" icon={<DoneIcon />}>
                Pool currently holds <strong>{plan.poolSize}</strong> question(s).{' '}
                <strong>{toSeedCount}</strong> new question(s) will be written
                {skippedCount > 0 && (
                  <>
                    {' '}
                    and <strong>{skippedCount}</strong> skipped as already present
                  </>
                )}
                .
              </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`Dataset: ${resolved.file.label}`} size="small" variant="outlined" />
              <Chip label={`Visibility: ${visibility}`} size="small" variant="outlined" />
              <Chip
                label={`Status: ${autoApprove ? 'approved' : 'pending'}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`MCQ options: ${shuffleOptions ? 'shuffled' : 'as authored'}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`~${toSeedCount * DOCS_PER_QUESTION} writes`}
                size="small"
                color="primary"
              />
            </Stack>

            {skippedCount > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Already in the pool (will be skipped)
                </Typography>
                <SeedPreviewTable rows={plan.skipped.slice(0, 5)} />
                {skippedCount > 5 && (
                  <Typography variant="caption" color="text.secondary">
                    …and {skippedCount - 5} more
                  </Typography>
                )}
              </Box>
            )}

            {toSeedCount > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Will be written
                </Typography>
                <SeedPreviewTable rows={plan.toSeed.slice(0, 8).map(payloadToRow)} />
                {toSeedCount > 8 && (
                  <Typography variant="caption" color="text.secondary">
                    Showing the first 8 of {toSeedCount}.
                  </Typography>
                )}
              </Box>
            )}

            {seeding && (
              <Box>
                <LinearProgress variant="determinate" value={pct} sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Writing {progress.done} / {progress.total} questions ({pct}%)…
                </Typography>
              </Box>
            )}

            {toSeedCount === 0 && !plan.scanFailed && (
              <Alert severity="info">
                Nothing to do — every question in this dataset is already in the pool.
              </Alert>
            )}
          </Stack>
        )}

        {/* ══════════ STEP 2 — RESULT ══════════ */}
        {step === 2 && result && (
          <Stack spacing={2}>
            <Alert
              severity={result.failed > 0 ? (result.created > 0 ? 'warning' : 'error') : 'success'}
              icon={result.failed > 0 ? <WarningIcon /> : <DoneIcon />}
            >
              {result.created > 0
                ? `Seeded ${result.created} question${result.created === 1 ? '' : 's'} into the platform pool.`
                : 'No questions were written.'}
              {result.skipped > 0 && ` ${result.skipped} already existed and were skipped.`}
              {result.failed > 0 && ` ${result.failed} failed.`}
            </Alert>

            {result.errors.length > 0 && (
              <Alert severity="error">
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {result.errors.slice(0, 8).map((err, i) => (
                    <Typography key={i} component="li" variant="caption">
                      {err}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`Created: ${result.created}`} color="success" />
              <Chip label={`Skipped: ${result.skipped}`} />
              <Chip
                label={`Failed: ${result.failed}`}
                color={result.failed > 0 ? 'error' : 'default'}
              />
              <Chip
                label={`Pool now: ${(plan?.poolSize ?? 0) + result.created}`}
                variant="outlined"
              />
            </Stack>

            <Alert severity="info">
              The question list below reloads automatically. Filter by subject (e.g. Financial
              Accounting) or search a topic to see the seeded rows; tagged{' '}
              <Chip label="seed-import" size="small" variant="outlined" /> and{' '}
              <Chip label="vriddhi-curated" size="small" variant="outlined" />.
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 0 && (
          <>
            <Button onClick={handleClose} disabled={seeding}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBuildPlan}
              disabled={planning || seeding || resolved.rows.length === 0}
              startIcon={planning ? <CircularProgress size={16} color="inherit" /> : <PreviewIcon />}
            >
              {planning ? 'Checking pool…' : 'Preview & Validate'}
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)} disabled={seeding || planning}>
              Back
            </Button>
            {plan?.scanFailed ? (
              <Button
                variant="contained"
                color="warning"
                onClick={handleForceSeed}
                disabled={seeding || resolved.rows.length === 0}
                startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <SeedIcon />}
              >
                {seeding ? `Seeding… ${pct}%` : `Seed ${resolved.rows.length} anyway (no dedupe)`}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSeed}
                disabled={seeding || toSeedCount === 0}
                startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <SeedIcon />}
              >
                {seeding ? `Seeding… ${pct}%` : `Seed ${toSeedCount} question${toSeedCount === 1 ? '' : 's'}`}
              </Button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Button onClick={reset} disabled={seeding}>
              Seed another dataset
            </Button>
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Preview table
// ───────────────────────────────────────────────────────────────────────

const SeedPreviewTable: React.FC<{ rows: SeedRow[] }> = ({ rows }) => {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No rows to show.
      </Typography>
    );
  }
  return (
    <TableContainer sx={{ maxHeight: 260, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Question</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Topic</TableCell>
            <TableCell align="center">Type</TableCell>
            <TableCell align="center">Diff.</TableCell>
            <TableCell align="center">Marks</TableCell>
            <TableCell align="center">Programme</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={`${row.line}-${i}`} hover>
              <TableCell sx={{ maxWidth: 320 }}>
                <Typography variant="body2" noWrap title={row.text}>
                  {row.text}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">{row.subject}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">{row.unit}</Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={toUniversalQuestionType(row.type, row.options.length > 0)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption">{row.difficulty}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption">{row.marks}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption">{row.branch}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Renders a planned payload back as a SeedRow so the same preview table can show
 * "will be written" rows (they only exist as mapped documents at that point).
 */
function payloadToRow(payload: {
  fingerprint: string;
  meta: Record<string, any>;
  content: Record<string, any>;
}): SeedRow {
  const content = payload.content || {};
  const meta = payload.meta || {};
  return {
    line: 0,
    text: String(content.questionText || ''),
    subject: String(meta.subjectId || ''),
    type: String(meta.questionType || 'mcq'),
    difficulty: String(meta.difficulty || 'medium'),
    unit: String(meta.topicId || ''),
    marks: Number(meta.marks ?? 1),
    optionsRaw: '',
    options: Array.isArray(content.options) ? content.options.map((o: any) => o.text) : [],
    correctAnswer: String(content.correctAnswer || ''),
    explanation: String(content.explanation || ''),
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    batch: String(meta.seedBatch || ''),
    branch: String(meta.seedBranch || ''),
    isPYQ: Boolean(meta.seedIsPYQ),
    examYear: String(meta.seedExamYear || ''),
    examName: String(meta.seedExamName || ''),
  };
}

export default SeedQuestionBankDialog;
