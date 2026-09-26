// src/modules/superadmin/api/questionImportApi.ts
//
// Client side of the bulk question-paper import.
//
//   reserveJob()      → server issues a job id + the Storage path for the zip
//   uploadArchive()   → the browser uploads the zip straight to Storage (resumable)
//   runJob()          → ONE unit of work per call; the panel loops until done
//   getJob()          → resume/refresh an interrupted import
//   retryFailedJob()  → re-queue documents that failed (bad scan, timeout, …)
//   checkJobDuplicates() → one pass over the pool, after the job, to flag drafts
//                          that already exist; rejectQuestions() clears them
//
// Every Firebase / Storage import lives in THIS file so the render-check stub
// (scripts/render-check/stubs/questionImportApi.ts) can replace it wholesale.

import { apiUrl, assertJsonResponse } from '@/shared/api/apiBase'
import { auth, db, storage } from '@/Firebase/config'
import { ref, uploadBytesResumable } from 'firebase/storage'
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { fingerprintMetaDoc } from '../data/questionBankSeed'
import type { ImportJobView } from '../utils/importProgress'

export type { ImportJobView } from '../utils/importProgress'

async function bearerToken(): Promise<string> {
  const stored =
    localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token')
  if (stored) return stored
  try {
    if (auth.currentUser) return await auth.currentUser.getIdToken()
  } catch {
    /* fall through to the empty token — the server answers 401 with a message */
  }
  return ''
}

async function requestJson<T>(
  path: string,
  body?: unknown,
  // Explicit because the run/retry endpoints are POST-only: passing no body must
  // NOT silently fall back to GET (Express answers an unknown method with its
  // 404 'Route not found', which reads like a missing endpoint).
  method: 'GET' | 'POST' = body === undefined ? 'GET' : 'POST'
): Promise<T> {
  const token = await bearerToken()
  const url = apiUrl(path)
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  await assertJsonResponse(response, url)
  return (await response.json()) as T
}

export interface JobDefaultsPayload {
  program: string
  branch: string
  semester: number
  subjectId: string
  topicId: string
  difficulty: 'easy' | 'medium' | 'hard'
  examYear: number | null
  universityCode: string
}

export interface RunJobResult {
  success: boolean
  done: boolean
  job: ImportJobView
  note?: string
}

/** Fallback when the browser left `file.type` empty (some OS pickers do). */
function guessUploadContentType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.zip')) return 'application/zip'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lower.endsWith('.doc')) return 'application/msword'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/pdf'
}

async function reserveJob(file: File, defaults: JobDefaultsPayload) {
  return requestJson<{ success: boolean; jobId: string; storagePath: string }>('/question-import/jobs', {
    fileName: file.name,
    bytes: file.size,
    defaults,
  })
}

export async function runJob(jobId: string): Promise<RunJobResult> {
  // POST (no body) — the worker advances one unit of work per call.
  return requestJson<RunJobResult>(`/question-import/jobs/${jobId}/run`, undefined, 'POST')
}

export async function getJob(jobId: string): Promise<{ success: boolean; job: ImportJobView }> {
  return requestJson<{ success: boolean; job: ImportJobView }>(`/question-import/jobs/${jobId}`)
}

export async function retryFailedJob(jobId: string): Promise<{ success: boolean; requeued: number; job: ImportJobView }> {
  // POST (no body) — same worker contract as runJob.
  return requestJson<{ success: boolean; requeued: number; job: ImportJobView }>(
    `/question-import/jobs/${jobId}/retry`,
    undefined,
    'POST'
  )
}

/**
 * Uploads the archive to the path the server reserved, reporting progress.
 * 3 arguments of plumbing: the path is bound to the operator's uid and to the
 * job id issued by the server, so the storage rule can verify both.
 */
export function uploadArchive(
  storagePath: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, storagePath), file, {
      contentType: file.type || guessUploadContentType(file.name),
    })
    task.on(
      'state_changed',
      (snapshot) => {
        const total = snapshot.totalBytes || file.size || 1
        onProgress(Math.min(100, Math.round((snapshot.bytesTransferred / total) * 100)))
      },
      (error) => reject(new Error(error.message || 'The upload failed.')),
      () => resolve()
    )
  })
}

/** Reserve + upload in one call; returns the job id and the reserved path. */
export async function startImportJob(
  file: File,
  defaults: JobDefaultsPayload,
  onProgress: (percent: number) => void
): Promise<{ jobId: string; storagePath: string }> {
  const reserved = await reserveJob(file, defaults)
  await uploadArchive(reserved.storagePath, file, onProgress)
  return { jobId: reserved.jobId, storagePath: reserved.storagePath }
}

// ─── Duplicate pass (runs once, after the job) ──────────────────────────────

export interface DuplicateReport {
  checked: number
  duplicateIds: string[]
  /** True when the pool could not be read, so the check is inconclusive. */
  failed: boolean
  error?: string
}

/**
 * Compares this job's drafts with everything already in the pool.
 *
 * One read of `questionBank_meta` per run — the same cost the CSV seeder already
 * pays (`scanExistingQuestionFingerprints`) — and it deliberately excludes the
 * job's own rows, which are inside that same collection while they wait for
 * review. Imported rows carry `importFingerprint`, written by the server with the
 * same normaliser this module verifies against.
 */
export async function checkJobDuplicates(jobId: string): Promise<DuplicateReport> {
  try {
    const poolSnap = await getDocs(collection(db, 'questionBank_meta'))
    const existing = new Set<string>()
    poolSnap.forEach((d) => {
      const data = d.data() as Record<string, any>
      if (data?.importJobId === jobId) return // our own drafts
      existing.add(fingerprintMetaDoc({ ...data, id: d.id }))
    })

    const ownSnap = await getDocs(query(collection(db, 'questionBank_meta'), where('importJobId', '==', jobId)))
    const duplicateIds: string[] = []
    ownSnap.forEach((d) => {
      const data = d.data() as Record<string, any>
      const fingerprint = String(data?.importFingerprint || '')
      if (fingerprint && existing.has(fingerprint)) duplicateIds.push(d.id)
    })

    return { checked: ownSnap.size, duplicateIds, failed: false }
  } catch (error) {
    return { checked: 0, duplicateIds: [], failed: true, error: (error as Error).message }
  }
}

/** Marks questions as rejected in bulk (used by the duplicate pass). */
export async function rejectQuestions(ids: string[], reviewerName = 'Import duplicate check'): Promise<number> {
  let rejected = 0
  const now = new Date().toISOString()
  for (let i = 0; i < ids.length; i += 400) {
    const slice = ids.slice(i, i + 400)
    const batch = writeBatch(db)
    slice.forEach((id) => {
      batch.update(doc(db, 'questionBank_meta', id), {
        status: 'rejected',
        updatedAt: now,
        reviewNote: `Rejected by ${reviewerName}: already present in the question bank.`,
      })
    })
    await batch.commit()
    rejected += slice.length
  }
  return rejected
}
