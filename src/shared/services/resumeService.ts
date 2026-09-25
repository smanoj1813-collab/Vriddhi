// src/shared/services/resumeService.ts
//
// Browser client for the Resume Builder add-on (functions/src/routes/resume.ts).
// Every call carries the Firebase ID token; the server decides what the
// student may do (add-on enabled? template on? credits left?). Nothing about
// credits is computed here — the page only displays what the server reports.

import { apiUrl, ApiResponseError, assertJsonResponse, HOSTING_REWRITE_HINT, isHtmlContentType } from '../api/apiBase'
import type {
  ResumeAdminSettingsResponse,
  ResumeData,
  ResumeDownloadRow,
  ResumeMeResponse,
  ResumeSettings,
  ResumeTemplateCredit,
  ResumeTemplateId,
} from '../types/resume'

async function getBearerToken(): Promise<string | null> {
  try {
    const { auth } = await import('@/Firebase/config')
    if (auth.currentUser) return await auth.currentUser.getIdToken()
  } catch {
    /* fall through */
  }
  const stored = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token')
  return stored || null
}

async function authedRequest(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const token = await getBearerToken()
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) || {}) }
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(apiUrl(endpoint), { ...init, headers })
}

async function authedJson<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const url = apiUrl(endpoint)
  const response = await authedRequest(endpoint, init)
  await assertJsonResponse(response, url)
  return (await response.json()) as T
}

function withCollege(endpoint: string, collegeId?: string): string {
  if (!collegeId) return endpoint
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}collegeId=${encodeURIComponent(collegeId)}`
}

// ─── Student ────────────────────────────────────────────────────────────────

export async function fetchMyResume(collegeId?: string): Promise<ResumeMeResponse> {
  return authedJson<ResumeMeResponse>(withCollege('/resume/me', collegeId))
}

export async function saveMyResume(
  data: ResumeData,
  templateId: ResumeTemplateId,
  collegeId?: string,
): Promise<{ ok: boolean; savedAt: string; words: number }> {
  return authedJson('/resume/me', { method: 'PUT', body: JSON.stringify({ data, templateId, collegeId }) })
}

export async function fetchResumePreview(
  data: ResumeData,
  templateId: ResumeTemplateId,
  collegeId?: string,
  signal?: AbortSignal,
): Promise<{ html: string; words: number }> {
  return authedJson('/resume/preview', { method: 'POST', body: JSON.stringify({ data, templateId, collegeId }), signal })
}

export async function fetchMyResumeDownloads(collegeId?: string): Promise<ResumeDownloadRow[]> {
  const res = await authedJson<{ downloads: ResumeDownloadRow[] }>(withCollege('/resume/downloads', collegeId))
  return res.downloads || []
}

export class ResumeCreditsExhaustedError extends Error {
  constructor(message: string, readonly used: number, readonly allowed: number, readonly templateId: ResumeTemplateId) {
    super(message)
    this.name = 'ResumeCreditsExhaustedError'
  }
}

export interface ResumePdfResult {
  blob: Blob
  fileName: string
  downloadId: string | null
  version: number | null
  creditsRemaining: number | null
}

function fileNameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1]) : fallback
}

async function readPdfOrThrow(response: Response, url: string, fallbackName: string): Promise<ResumePdfResult> {
  const contentType = response.headers.get('content-type') || ''
  if (response.ok && /application\/pdf/i.test(contentType)) {
    const version = Number(response.headers.get('x-resume-version'))
    const remaining = Number(response.headers.get('x-resume-credits-remaining'))
    return {
      blob: await response.blob(),
      fileName: fileNameFromDisposition(response.headers.get('content-disposition'), fallbackName),
      downloadId: response.headers.get('x-resume-download-id'),
      version: Number.isFinite(version) && version > 0 ? version : null,
      creditsRemaining: Number.isFinite(remaining) && remaining >= 0 ? remaining : null,
    }
  }
  const isJson = /application\/json/i.test(contentType)
  const body: any = isJson ? await response.json().catch(() => ({})) : undefined
  if (response.status === 409 && body?.error === 'credits_exhausted') {
    throw new ResumeCreditsExhaustedError(body.message || 'No downloads left for this template.', Number(body.used) || 0, Number(body.allowed) || 0, body.templateId)
  }
  const serverMessage = typeof body?.message === 'string' ? body.message : typeof body?.error === 'string' ? body.error : ''
  const where = `${response.status}${response.statusText ? ` ${response.statusText}` : ''} from ${url}`
  const message = serverMessage
    || (isHtmlContentType(contentType) ? `Unexpected HTML response (${where}). ${HOSTING_REWRITE_HINT}` : `PDF request failed (${where}).`)
  throw new ApiResponseError(message, { status: response.status, url, contentType, body })
}

/** Spends ONE credit: the server renders a text PDF with Chrome and stores it for free re-downloads. */
export async function generateResumePdf(
  templateId: ResumeTemplateId,
  data: ResumeData,
  collegeId?: string,
): Promise<ResumePdfResult> {
  const endpoint = '/resume/pdf'
  const response = await authedRequest(endpoint, { method: 'POST', body: JSON.stringify({ templateId, data, collegeId }) })
  return readPdfOrThrow(response, apiUrl(endpoint), 'Resume.pdf')
}

/** Free: streams an already generated PDF. */
export async function redownloadResumePdf(downloadId: string, fallbackName = 'Resume.pdf'): Promise<ResumePdfResult> {
  const endpoint = `/resume/downloads/${encodeURIComponent(downloadId)}/file`
  const response = await authedRequest(endpoint, { method: 'GET' })
  return readPdfOrThrow(response, apiUrl(endpoint), fallbackName)
}

export function saveBlobAs(blob: Blob, fileName: string): void {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 10_000)
}

export type ResumeAiKind = 'summary' | 'bullet' | 'headline'

export async function improveWithAi(
  kind: ResumeAiKind,
  text: string,
  context: { role?: string; program?: string } = {},
  collegeId?: string,
): Promise<{ text: string; remaining: number }> {
  return authedJson('/resume/ai/improve', { method: 'POST', body: JSON.stringify({ kind, text, context, collegeId }) })
}

// ─── Staff / superadmin ─────────────────────────────────────────────────────

export async function fetchResumeAdminSettings(collegeId?: string): Promise<ResumeAdminSettingsResponse> {
  return authedJson<ResumeAdminSettingsResponse>(withCollege('/resume/admin/settings', collegeId))
}

export async function saveResumeAdminSettings(
  settings: Partial<ResumeSettings>,
  collegeId?: string,
): Promise<{ collegeId: string; settings: ResumeSettings }> {
  return authedJson('/resume/admin/settings', { method: 'PUT', body: JSON.stringify({ collegeId, settings }) })
}

export async function resetResumeCredits(
  params: { collegeId?: string; email?: string; uid?: string; templateId?: ResumeTemplateId; scope?: 'pdf' | 'ai' | 'all' },
): Promise<{ ok: boolean; uid: string; credits: ResumeTemplateCredit[]; aiUsed: number }> {
  return authedJson('/resume/admin/credits/reset', { method: 'POST', body: JSON.stringify(params) })
}

export async function fetchResumeAdminDownloads(collegeId?: string, limit = 50): Promise<ResumeDownloadRow[]> {
  const res = await authedJson<{ downloads: ResumeDownloadRow[] }>(withCollege(`/resume/admin/downloads?limit=${limit}`, collegeId))
  return res.downloads || []
}
