// src/modules/superadmin/components/PaperImportPanel.tsx
//
// "Import papers" — the superadmin front end for the bulk question-paper import.
//
// Flow (all of it visible on screen):
//   1. pick the programme / subject / semester this batch belongs to
//   2. drop the .zip of previous-year papers (English and Kannada)
//   3. the browser uploads it to Storage, then drives the server worker
//      (one document per call) until every document is transcribed
//   4. drafts land in the question bank as `pending` and are reviewed in the
//      Review Queue tab right next to this panel
//
// The panel never parses anything itself and never writes questions: it uploads,
// it polls, it reports. Everything else is server-side and testable.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  CheckCircle as DoneIcon,
  CloudUpload as UploadIcon,
  ErrorOutlined as ErrorIcon,
  History as ResumeIcon,
  Refresh as RetryIcon,
  Rule as DuplicateIcon,
} from '@mui/icons-material'
import { useAuth } from '../../auth/context/AuthContext'
import {
  checkJobDuplicates,
  getJob,
  retryFailedJob,
  rejectQuestions,
  runJob,
  startImportJob,
  type DuplicateReport,
  type ImportJobView,
} from '../api/questionImportApi'
import {
  EMPTY_IMPORT_FORM,
  formatBytes,
  formToJobDefaults,
  isArchiveFileName,
  jobPercent,
  jobSeverity,
  jobStateLabel,
  problemFiles,
  summariseJob,
  validateImportFiles,
  validateImportForm,
  type ImportFormState,
} from '../utils/importProgress'

const PROGRAM_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'bba', label: 'BBA' },
  { code: 'bcom', label: 'B.Com' },
  { code: 'bca', label: 'BCA' },
  { code: 'bsc', label: 'B.Sc' },
  { code: 'ba', label: 'BA' },
  { code: 'mba', label: 'MBA' },
  { code: 'mcom', label: 'M.Com' },
  { code: 'mca', label: 'MCA' },
]

const UNIVERSITY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: '', label: 'Not specified' },
  { code: 'bcu', label: 'BCU — Bengaluru City University' },
  { code: 'bu', label: 'BU — Bangalore University' },
  { code: 'bnu', label: 'BNU — Bengaluru North University' },
  { code: 'kud', label: 'KUD — Karnatak University, Dharwad' },
  { code: 'mu', label: 'MU — Mangalore University' },
  { code: 'kuvempu', label: 'KU — Kuvempu University' },
  { code: 'uom', label: 'UoM — University of Mysore' },
  { code: 'tu', label: 'TU — Tumkur University' },
  { code: 'dvu', label: 'DU — Davangere University' },
  { code: 'rcub', label: 'RCUB — Rani Channamma University' },
  { code: 'vsku', label: 'VSKU — Vijayanagara S. K. University' },
  { code: 'gug', label: 'GUG — Gulbarga University' },
]

export interface PaperImportPanelProps {
  /** Called after at least one document was drafted, so the parent can refresh counters. */
  onImported?: (job: ImportJobView) => void
}

export default function PaperImportPanel({ onImported }: PaperImportPanelProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<ImportFormState>(EMPTY_IMPORT_FORM)
  const [files, setFiles] = useState<File[]>([])
  const [job, setJob] = useState<ImportJobView | null>(null)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [busy, setBusy] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState<DuplicateReport | null>(null)
  const [rejected, setRejected] = useState(0)
  /** Index of the file the queue is processing (display only). */
  const [fileIndex, setFileIndex] = useState(0)
  /** Per-file results accumulated across the queue. */
  const [fileResults, setFileResults] = useState<Array<{ name: string; drafted: number; failed: number }>>([])
  const cancelled = useRef(false)
  // Mirror of `stopped` as a ref so the run loop sees the latest value without
  // needing a re-render mid-loop.
  const stoppedRef = useRef(false)
  // Queue cursor: how many files have been uploaded and handed to a job. A ref
  // so the loop and the Continue path always agree, even mid-run.
  const startedRef = useRef(0)
  // Synchronous mirror of `fileResults` so the run loop can seed its totals
  // without closing over a stale render.
  const fileResultsRef = useRef<Array<{ name: string; drafted: number; failed: number }>>([])

  const formErrors = useMemo(() => validateImportForm(form), [form])

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    stoppedRef.current = stopped
  }, [stopped])

  /** One unit of work per call, looped until the job is done or the operator stops. Returns the last job view. */
  const driveJob = useCallback(
    async (jobId: string): Promise<ImportJobView | null> => {
      let last: ImportJobView | null = null
      for (let guard = 0; guard < 5_000; guard += 1) {
        if (cancelled.current || stoppedRef.current) return last
        const result = await runJob(jobId)
        last = result.job
        setJob(result.job)
        if (result.done) {
          onImported?.(result.job)
          return result.job
        }
      }
      setError('The import ran for a very long time and was paused. Press Continue to finish it.')
      return last
    },
    [onImported]
  )

  /**
   * Drives the file queue from `nextIndex`, finishing `resumeJobId` first when
   * the pause happened mid-job. Each selected file is its own import job — a
   * lone PDF needs no zip; a zip simply carries more documents inside one job.
   */
  const runQueue = useCallback(
    async (nextIndex: number, resumeJobId?: string | null) => {
      setBusy(true)
      setError('')
      setStopped(false)
      stoppedRef.current = false
      try {
        const totals = {
          files: fileResultsRef.current.length,
          drafted: fileResultsRef.current.reduce((n, f) => n + f.drafted, 0),
          failed: fileResultsRef.current.reduce((n, f) => n + f.failed, 0),
        }
        let lastJob: ImportJobView | null = null
        if (resumeJobId) {
          const fresh = await getJob(resumeJobId)
          setJob(fresh.job)
          lastJob = fresh.job
          if (fresh.job.status !== 'complete') {
            lastJob = (await driveJob(resumeJobId)) ?? fresh.job
          }
        }
        for (let i = nextIndex; i < files.length; i += 1) {
          if (cancelled.current || stoppedRef.current) return
          setFileIndex(i)
          setUploadPercent(0)
          setMessage(files.length > 1 ? `File ${i + 1} of ${files.length} — ${files[i].name}` : '')
          const { jobId } = await startImportJob(files[i], formToJobDefaults(form), setUploadPercent)
          startedRef.current = i + 1
          if (cancelled.current || stoppedRef.current) return
          setMessage(
            isArchiveFileName(files[i].name)
              ? 'Upload complete — unpacking the archive…'
              : 'Upload complete — transcribing the document…'
          )
          const finalJob = await driveJob(jobId)
          if (finalJob) {
            lastJob = finalJob
            totals.files += 1
            totals.drafted += finalJob.counters.drafted
            totals.failed += finalJob.counters.failed
            const row = { name: files[i].name, drafted: finalJob.counters.drafted, failed: finalJob.counters.failed }
            fileResultsRef.current = [...fileResultsRef.current, row]
            setFileResults(fileResultsRef.current)
          }
          if (stoppedRef.current || cancelled.current) return
        }
        if (lastJob && !stoppedRef.current && !cancelled.current) {
          setMessage(
            files.length > 1
              ? `Done: ${totals.drafted} question(s) drafted from ${totals.files} file(s)` +
                  (totals.failed ? `, ${totals.failed} with problems` : '') +
                  '.'
              : lastJob.progressLabel
          )
        }
      } catch (err: any) {
        setError(err?.message || 'The import could not be started.')
      } finally {
        setBusy(false)
      }
    },
    [files, form, driveJob]
  )

  const handleStart = useCallback(async () => {
    const fileErrors = validateImportFiles(files)
    if (fileErrors.length) {
      setError(fileErrors.join(' '))
      return
    }
    const errors = validateImportForm(form)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    // A queue already in flight continues where it stopped instead of
    // re-uploading everything from the top (picking a new selection resets it).
    const queueInFlight =
      startedRef.current > 0 && (startedRef.current < files.length || (job && job.status !== 'complete'))
    if (queueInFlight) {
      await runQueue(startedRef.current, job && job.status !== 'complete' ? job.id : null)
      return
    }
    setJob(null)
    setMessage('')
    setError('')
    setDuplicates(null)
    setRejected(0)
    setUploadPercent(0)
    setFileIndex(0)
    fileResultsRef.current = []
    setFileResults([])
    startedRef.current = 0
    await runQueue(0, null)
  }, [files, form, job, runQueue])

  const handleResume = useCallback(async () => {
    await runQueue(startedRef.current, job && job.status !== 'complete' ? job.id : null)
  }, [runQueue, job])

  const handleRetryFailed = useCallback(async () => {
    if (!job) return
    setBusy(true)
    setError('')
    try {
      const result = await retryFailedJob(job.id)
      setJob(result.job)
      await driveJob(job.id)
    } catch (err: any) {
      setError(err?.message || 'Could not re-queue the failed documents.')
    } finally {
      setBusy(false)
    }
    // Files still waiting in the queue keep going once the retries settle.
    if (!cancelled.current && !stoppedRef.current && startedRef.current < files.length) {
      await runQueue(startedRef.current, null)
    }
  }, [job, driveJob, files, runQueue])

  const handleDuplicateCheck = useCallback(async () => {
    if (!job) return
    setBusy(true)
    setError('')
    try {
      const report = await checkJobDuplicates(job.id)
      setDuplicates(report)
      if (report.failed) setError(`Duplicate check could not read the pool: ${report.error || 'unknown error'}`)
    } finally {
      setBusy(false)
    }
  }, [job])

  const handleRejectDuplicates = useCallback(async () => {
    if (!duplicates?.duplicateIds.length) return
    setBusy(true)
    try {
      const count = await rejectQuestions(duplicates.duplicateIds, user?.name || 'Import duplicate check')
      setRejected(count)
      setDuplicates({ ...duplicates, duplicateIds: [] })
    } catch (err: any) {
      setError(err?.message || 'Could not reject the duplicates.')
    } finally {
      setBusy(false)
    }
  }, [duplicates, user])

  const problems = problemFiles(job)
  const counters = summariseJob(job)

  return (
    <Box data-testid="paper-import-panel">
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Import previous-year papers (ZIP or PDF)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Drop question papers here — pick one or more PDF/DOCX files directly, or a .zip of them. English or Kannada,
        digital or scanned. Each document is transcribed on the server and lands in the question bank as a{' '}
        <strong>pending draft</strong>: nothing is published until the Review Queue approves it.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Programme"
          value={form.program}
          onChange={(e) => {
            const code = e.target.value
            const label = PROGRAM_OPTIONS.find((p) => p.code === code)?.label || code.toUpperCase()
            setForm((f) => ({ ...f, program: code, branch: f.branch || label }))
          }}
          sx={{ minWidth: 140 }}
        >
          {PROGRAM_OPTIONS.map((p) => (
            <MenuItem key={p.code} value={p.code}>
              {p.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          id="import-branch"
          label="Branch tag on the paper"
          value={form.branch}
          onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
          placeholder="B.Com"
          sx={{ minWidth: 150 }}
          helperText="Used for duplicate checks"
        />
        <TextField
          size="small"
          id="import-subject"
          label="Subject"
          required
          value={form.subjectId}
          onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
          placeholder="Financial Accounting"
          sx={{ minWidth: 190 }}
          helperText="Becomes the bank subject"
        />
        <TextField
          size="small"
          id="import-topic"
          label="Topic / unit"
          value={form.topicId}
          onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
          placeholder="Optional"
          sx={{ minWidth: 150 }}
        />
        <TextField
          size="small"
          id="import-semester"
          label="Semester"
          value={form.semester}
          onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value.replace(/[^0-9]/g, '') }))}
          placeholder="5"
          sx={{ width: 100 }}
        />
        <TextField
          size="small"
          id="import-year"
          label="Exam year"
          value={form.examYear}
          onChange={(e) => setForm((f) => ({ ...f, examYear: e.target.value.replace(/[^0-9]/g, '') }))}
          placeholder="2024"
          sx={{ width: 110 }}
        />
        <TextField
          select
          size="small"
          label="University"
          value={form.universityCode}
          onChange={(e) => setForm((f) => ({ ...f, universityCode: e.target.value }))}
          sx={{ minWidth: 210 }}
        >
          {UNIVERSITY_OPTIONS.map((u) => (
            <MenuItem key={u.code || 'none'} value={u.code}>
              {u.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Difficulty"
          value={form.difficulty}
          onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as ImportFormState['difficulty'] }))}
          sx={{ width: 130 }}
        >
          {['easy', 'medium', 'hard'].map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Button variant="outlined" component="label" startIcon={<UploadIcon />} disabled={busy}>
          {files.length === 0 ? 'Choose papers' : files.length === 1 ? files[0].name : `${files.length} files selected`}
          <input
            hidden
            id="import-archive"
            type="file"
            multiple
            accept=".zip,application/zip,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,application/msword,.png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={(e) => {
              setFiles(Array.from(e.target.files ?? []))
              setJob(null)
              setMessage('')
              setError('')
              setFileIndex(0)
              fileResultsRef.current = []
              setFileResults([])
              startedRef.current = 0
            }}
          />
        </Button>
        {files.length > 0 && (
          <Chip size="small" variant="outlined" label={formatBytes(files.reduce((n, f) => n + f.size, 0))} />
        )}
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleStart}
          disabled={busy || files.length === 0 || formErrors.length > 0}
        >
          Start import
        </Button>
        {busy && (
          <Button variant="text" color="inherit" onClick={() => setStopped(true)}>
            Pause after this document
          </Button>
        )}
      </Stack>

      {formErrors.length > 0 && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {formErrors.join(' ')}
        </Alert>
      )}

      {busy && uploadPercent > 0 && uploadPercent < 100 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption">Uploading {uploadPercent} %</Typography>
          <LinearProgress variant="determinate" value={uploadPercent} />
        </Box>
      )}

      {job && (
        <Box sx={{ mb: 1.5 }} data-testid="paper-import-progress">
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
            <Chip size="small" color={jobSeverity(job.status)} label={jobStateLabel(job.status)} />
            {files.length > 1 && (
              <Chip size="small" variant="outlined" label={`File ${fileIndex + 1} of ${files.length}`} />
            )}
            <Typography variant="caption" color="text.secondary">
              {job.progressLabel}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={jobPercent(job)} sx={{ height: 8, borderRadius: 1 }} />
          <Stack direction="row" spacing={2} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
            {counters.map((c) => (
              <Typography key={c.label} variant="caption" color="text.secondary">
                {c.label}: <strong>{c.value}</strong>
              </Typography>
            ))}
          </Stack>

          {files.length > 1 && fileResults.length > 0 && (
            <Stack spacing={0.25} sx={{ mt: 0.75, maxHeight: 120, overflowY: 'auto' }}>
              {fileResults.map((r) => (
                <Typography key={r.name} variant="caption" color="text.secondary">
                  ✓ {r.name} — {r.drafted} drafted{r.failed ? `, ${r.failed} failed` : ''}
                </Typography>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {job.status !== 'complete' && (
              <Button size="small" startIcon={<ResumeIcon />} onClick={handleResume} disabled={busy}>
                Continue
              </Button>
            )}
            {job.counters.failed > 0 && (
              <Button size="small" startIcon={<RetryIcon />} onClick={handleRetryFailed} disabled={busy}>
                Retry {job.counters.failed} failed
              </Button>
            )}
            {job.counters.parsed > 0 && (
              <Tooltip title="Compares this batch with everything already in the pool. One read of the question bank.">
                <Button size="small" startIcon={<DuplicateIcon />} onClick={handleDuplicateCheck} disabled={busy}>
                  Check duplicates
                </Button>
              </Tooltip>
            )}
          </Stack>

          {job.truncated && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              The archive held more documents than one import can hold. Split the corpus and run the import again.
            </Alert>
          )}

          {problems.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Needs attention ({problems.length})
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5, maxHeight: 180, overflowY: 'auto' }}>
                {problems.map((p) => (
                  <Stack key={p.index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <ErrorIcon color="warning" fontSize="small" sx={{ mt: '2px' }} />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {p.error || 'Skipped.'}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {duplicates && !duplicates.failed && (
            <Alert severity={duplicates.duplicateIds.length ? 'warning' : 'success'} sx={{ mt: 1.5 }} icon={<DoneIcon />}>
              Checked {duplicates.checked} imported question(s) against the pool:{' '}
              <strong>{duplicates.duplicateIds.length}</strong> already exist
              {rejected > 0 && <> — {rejected} rejected.</>}
              {duplicates.duplicateIds.length > 0 && (
                <Button size="small" onClick={handleRejectDuplicates} disabled={busy} sx={{ ml: 1 }}>
                  Reject them
                </Button>
              )}
            </Alert>
          )}
        </Box>
      )}

      {message && (
        <Alert severity="success" sx={{ mb: 1.5 }} data-testid="paper-import-message">
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 1.5 }} />
      <Typography variant="caption" color="text.secondary">
        Drafts are reviewed in the <strong>Review queue</strong> tab. Approved questions become visible to colleges
        immediately; a rejected draft leaves nothing behind but the record.
      </Typography>
    </Box>
  )
}
