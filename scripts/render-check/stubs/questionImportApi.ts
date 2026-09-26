// Stand-in for src/modules/superadmin/api/questionImportApi.ts so
// PaperImportPanel (and anything that mounts it) renders in jsdom without the
// `api` function, Storage or Firestore.
//
// Fixtures:
//   globalThis.__RC_IMPORT_JOB       — the job the stub reports as the current state
//   globalThis.__RC_IMPORT_DONE      — when true, the first runJob() call reports done
//   globalThis.__RC_IMPORT_DUPLICATES — report returned by checkJobDuplicates()
//   globalThis.__RC_IMPORT_REJECTED  — count returned by rejectQuestions()
//
// Every call is recorded on `globalThis.__RC_IMPORT_CALLS` so a check can assert
// what the panel asked for (e.g. that start = reserve → upload → run).

function g(): any {
  return globalThis as any
}

function record(fn: string, params?: any) {
  g().__RC_IMPORT_CALLS = g().__RC_IMPORT_CALLS ?? []
  g().__RC_IMPORT_CALLS.push({ fn, params })
}

export function __defaultJob(overrides: Record<string, any> = {}) {
  return {
    id: 'job-stub-1',
    status: 'parsing',
    archive: { fileName: 'bcu-papers.zip', bytes: 12_400_000 },
    defaults: {
      program: 'bcom',
      branch: 'B.Com',
      semester: 5,
      subjectId: 'Financial Accounting',
      topicId: '',
      difficulty: 'medium',
      examYear: 2024,
      universityCode: 'bcu',
    },
    counters: { files: 3, unpacked: 3, parsed: 1, failed: 1, skippedFiles: 0, drafted: 14, duplicates: 2 },
    files: [
      { index: 0, name: 'BCU-BCom-5-Sem-Nov-2024.pdf', bytes: 900_000, status: 'done', method: 'ai-text', pages: 6, language: 'en', drafted: 14 },
      { index: 1, name: 'kannada-paper-2023.pdf', bytes: 4_100_000, status: 'failed', error: 'The model could not read this document.' },
      { index: 2, name: 'scan-2022.pdf', bytes: 7_400_000, status: 'queued' },
    ],
    truncated: false,
    error: '',
    progressLabel: 'Transcribing document 2 of 3 — 14 question(s) drafted so far.',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:02:00.000Z',
    completedAt: '',
    ...overrides,
  }
}

export async function startImportJob(file: any, defaults: any, onProgress: (percent: number) => void) {
  record('startImportJob', { name: file?.name, size: file?.size, defaults })
  if (typeof onProgress === 'function') {
    onProgress(45)
    onProgress(100)
  }
  return { jobId: 'job-stub-1', storagePath: 'question-paper-imports/uid/job-stub-1/papers.zip' }
}

export async function runJob(jobId: string) {
  record('runJob', { jobId })
  const job = g().__RC_IMPORT_JOB ?? __defaultJob()
  const done = g().__RC_IMPORT_DONE === true ? true : job.status === 'complete'
  return { success: true, done, job: done ? { ...job, status: 'complete', progressLabel: 'Done: 14 question(s) drafted from 1 document(s), 1 failed.' } : job }
}

export async function getJob(jobId: string) {
  record('getJob', { jobId })
  return { success: true, job: g().__RC_IMPORT_JOB ?? __defaultJob() }
}

export async function retryFailedJob(jobId: string) {
  record('retryFailedJob', { jobId })
  return { success: true, requeued: 1, job: g().__RC_IMPORT_JOB ?? __defaultJob() }
}

export async function checkJobDuplicates(jobId: string) {
  record('checkJobDuplicates', { jobId })
  return (
    g().__RC_IMPORT_DUPLICATES ?? {
      checked: 14,
      duplicateIds: ['q-1', 'q-2'],
      failed: false,
    }
  )
}

export async function rejectQuestions(ids: string[], reviewerName?: string) {
  record('rejectQuestions', { ids, reviewerName })
  return ids.length
}

export function uploadArchive(storagePath: string, file: any, onProgress: (percent: number) => void) {
  record('uploadArchive', { storagePath, name: file?.name })
  if (typeof onProgress === 'function') onProgress(100)
  return Promise.resolve()
}
