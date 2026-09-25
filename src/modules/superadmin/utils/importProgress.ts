// src/modules/superadmin/utils/importProgress.ts
//
// Pure helpers for the question-paper import panel. No Firebase, no fetch — the
// numbers, labels and colours the panel renders come from here so they can be
// unit-tested (root `test:unit` lists importProgress.test.ts).

export type ImportJobStatus = 'awaiting-upload' | 'unpacking' | 'parsing' | 'complete' | 'failed'
export type ImportFileStatus = 'queued' | 'parsing' | 'done' | 'failed' | 'skipped'

export interface ImportJobCounters {
  files: number
  unpacked: number
  parsed: number
  failed: number
  skippedFiles: number
  drafted: number
  duplicates: number
}

export interface ImportJobFileRow {
  index: number
  name: string
  bytes: number
  status: ImportFileStatus
  method?: string
  pages?: number
  language?: string
  questionCount?: number
  drafted?: number
  duplicates?: number
  error?: string
}

export interface ImportJobView {
  id: string
  status: ImportJobStatus
  archive: { fileName: string; bytes: number }
  counters: ImportJobCounters
  files: ImportJobFileRow[]
  truncated: boolean
  error: string
  progressLabel: string
  createdAt: string
  updatedAt: string
  completedAt: string
}

/** '12.4 MB' / '940 KB' / '312 B' — short enough for a chip. */
export function formatBytes(bytes: number): string {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

/**
 * The document count the panel renders against.
 *
 * The rows the server sent are authoritative for anything the operator sees —
 * `counters.files` is only a fallback while the row list has not arrived yet — so
 * a job whose archive held fewer documents than the counter claims still shows a
 * bar that can reach 100 %.
 */
export function documentTotal(job: ImportJobView | null): number {
  if (!job) return 0
  return job.files.length || job.counters.files || 0
}

/**
 * 0–100 for the progress bar.
 *
 * Unpacking can only be a fixed early slice (the final document count is unknown
 * until the central directory has been read), parsing is determinate. A bar that
 * sits at 0 % while 400 documents unpack looks broken.
 */
export function jobPercent(job: ImportJobView | null): number {
  if (!job) return 0
  const total = documentTotal(job)
  switch (job.status) {
    case 'awaiting-upload':
      return 0
    case 'unpacking':
      return 10
    case 'parsing': {
      if (total === 0) return 10
      const finished = job.files.filter((f) => f.status === 'done' || f.status === 'failed' || f.status === 'skipped').length
      return Math.min(100, 10 + Math.round((finished / total) * 90))
    }
    case 'complete':
    default:
      return 100
  }
}

export interface ImportSummaryLine {
  label: string
  value: string
}

/** The counter strip under the bar. */
export function summariseJob(job: ImportJobView | null): ImportSummaryLine[] {
  if (!job) return []
  const c = job.counters
  return [
    { label: 'Documents', value: `${c.parsed}/${documentTotal(job)}` },
    { label: 'Questions drafted', value: String(c.drafted) },
    { label: 'Skipped duplicates', value: String(c.duplicates) },
    { label: 'Failed', value: String(c.failed) },
  ]
}

/** Plain-language state, used for the chip colour. */
export function jobStateLabel(status: ImportJobStatus): string {
  switch (status) {
    case 'awaiting-upload':
      return 'Waiting for upload'
    case 'unpacking':
      return 'Reading archive'
    case 'parsing':
      return 'Transcribing'
    case 'complete':
      return 'Finished'
    default:
      return 'Stopped'
  }
}

export type JobSeverity = 'info' | 'warning' | 'success' | 'error'

export function jobSeverity(status: ImportJobStatus): JobSeverity {
  switch (status) {
    case 'complete':
      return 'success'
    case 'failed':
      return 'error'
    case 'awaiting-upload':
      return 'info'
    default:
      return 'warning'
  }
}

/** Only the rows an operator has to act on, worst first. */
export function problemFiles(job: ImportJobView | null): ImportJobFileRow[] {
  if (!job) return []
  return job.files.filter((f) => f.status === 'failed' || (f.error && f.status !== 'done'))
}

export function uploadedPercent(loaded: number, total: number): number {
  if (!total || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((loaded / total) * 100)))
}

/** Guard mirrors the server's IMPORT_MAX_ARCHIVE_BYTES (80 MB). */
export const IMPORT_MAX_ARCHIVE_BYTES = 80 * 1024 * 1024

export interface ImportFormState {
  program: string
  branch: string
  semester: string
  subjectId: string
  topicId: string
  difficulty: 'easy' | 'medium' | 'hard'
  examYear: string
  universityCode: string
}

export const EMPTY_IMPORT_FORM: ImportFormState = {
  program: 'bcom',
  branch: 'B.Com',
  semester: '',
  subjectId: '',
  topicId: '',
  difficulty: 'medium',
  examYear: '',
  universityCode: '',
}

/** True when the form has everything a draft document needs. */
export function validateImportForm(form: ImportFormState): string[] {
  const errors: string[] = []
  if (!String(form.program || '').trim()) errors.push('Choose the programme (B.Com, BBA, …).')
  if (!String(form.subjectId || '').trim()) errors.push('Name the subject — it becomes the question bank subject.')
  if (!String(form.branch || '').trim()) errors.push('Choose the programme label printed on the paper (becomes the branch tag).')
  const semester = Number(form.semester)
  if (form.semester !== '' && (!Number.isInteger(semester) || semester < 1 || semester > 10)) {
    errors.push('Semester must be 1–10 (or blank).')
  }
  if (form.examYear !== '' && !/^(19|20)\d{2}$/.test(String(form.examYear).trim())) {
    errors.push('Exam year must be a 4-digit year (or blank).')
  }
  return errors
}

/** The payload the job endpoint expects (numbers, not form strings). */
export function formToJobDefaults(form: ImportFormState) {
  return {
    program: String(form.program || '').trim().toLowerCase(),
    branch: String(form.branch || '').trim(),
    semester: form.semester === '' ? 0 : Number(form.semester),
    subjectId: String(form.subjectId || '').trim(),
    topicId: String(form.topicId || '').trim(),
    difficulty: form.difficulty,
    examYear: form.examYear === '' ? null : Number(form.examYear),
    universityCode: String(form.universityCode || '').trim().toLowerCase(),
  }
}
