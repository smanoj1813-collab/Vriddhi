// src/shared/utils/pdfDownloader.ts
//
// Backend PDF download helper — fetches the Puppeteer-rendered PDF from the
// `api` Cloud Function and, when the server reports that its renderer is
// unavailable, falls back to rendering the document in the browser.
//
// Server contract (functions/src/utils/pdfRenderer.ts):
//   200 application/pdf                                    → save the blob
//   503 { error: 'pdf_renderer_unavailable', fallback: 'client' }
//                                                          → render locally (jsPDF + html2canvas)
//   4xx/5xx JSON { message | error }                       → surface the server message
//   anything else (HTML, wrong host, …)                    → loud error naming the URL
//
// All six export buttons in the app go through `downloadPaperPDF` /
// `downloadQuestionsPDF`, so the fallback lives in exactly one place.

import { apiUrl, ApiResponseError, HOSTING_REWRITE_HINT, isHtmlContentType } from '../api/apiBase'
import type { PaperPDF, QuestionPDF } from './pdfGenerator'

export type { PaperPDF, QuestionPDF } from './pdfGenerator'

/** Result of a PDF download so callers can tell the user which renderer produced the file. */
export interface PdfDownloadResult {
  /** `server` = Puppeteer PDF from the Cloud Function; `client` = rendered in the browser. */
  renderedBy: 'server' | 'client'
  /** Human-readable, non-blocking notice to show when `renderedBy === 'client'`. */
  notice?: string
}

export const CLIENT_RENDER_NOTICE =
  'The PDF service is temporarily unavailable, so this PDF was generated in your browser. ' +
  'Content is complete but styling and page breaks are approximate.'

/** Thrown when the server said "render it yourself" but the client had nothing to render. */
export class PdfFallbackUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfFallbackUnavailableError'
  }
}

export type ServerPdfOutcome =
  | { kind: 'pdf'; blob: Blob }
  | { kind: 'fallback'; reason: string }

/**
 * Classifies a response from a PDF route per the contract above.
 * Pure with respect to the DOM, so it is unit-tested in plain Node.
 *
 * @throws ApiResponseError for every failure that is NOT an explicit client-fallback signal.
 */
export async function readServerPdfResponse(res: Response, url: string): Promise<ServerPdfOutcome> {
  const contentType = res.headers.get('content-type') || ''

  if (res.ok && /application\/pdf/i.test(contentType)) {
    return { kind: 'pdf', blob: await res.blob() }
  }

  const isJson = /application\/json/i.test(contentType)
  const body: any = isJson ? await res.json().catch(() => ({})) : undefined

  if (res.status === 503 && body?.fallback === 'client') {
    console.warn(`[PDF] server renderer unavailable (${url}); rendering in the browser instead.`, body)
    return { kind: 'fallback', reason: body.message || body.error || 'pdf_renderer_unavailable' }
  }

  if (res.ok) {
    // 2xx but not a PDF: almost certainly the SPA shell from a hosting rewrite mishit.
    const hint = isHtmlContentType(contentType) ? ` ${HOSTING_REWRITE_HINT}` : ''
    throw new ApiResponseError(
      `Expected a PDF from ${url} but received ${contentType || 'an unknown content type'} (HTTP ${res.status}).${hint}`,
      { status: res.status, url, contentType, body },
    )
  }

  const serverMessage = body?.message || body?.error
  throw new ApiResponseError(
    serverMessage ? String(serverMessage) : `Failed to download PDF: ${res.status} from ${url}`,
    { status: res.status, url, contentType, body },
  )
}

async function getToken(): Promise<string> {
  const stored = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token');
  if (stored) return stored;
  try {
    const { auth } = await import('@/Firebase/config');
    if (auth.currentUser) return await auth.currentUser.getIdToken();
  } catch {
    // ignore
  }
  return '';
}

function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

async function fetchServerPdf(url: string, init: RequestInit): Promise<ServerPdfOutcome> {
  const res = await fetch(url, init)
  return readServerPdfResponse(res, url)
}

/**
 * Download paper as proper text-based PDF from backend
 * GET /api/papers/:id/pdf
 *
 * When the server answers `503 { fallback: 'client' }` the paper is rendered
 * locally via `downloadPaperPreviewPDF`. Pass `paper` if you already have the
 * document in memory; otherwise it is loaded from Firestore on demand.
 */
export async function downloadPaperPDF(
  paperId: string,
  filename?: string,
  options: { paper?: PaperPDF; collegeName?: string } = {},
): Promise<PdfDownloadResult> {
  const token = await getToken()
  const url = apiUrl(`/papers/${encodeURIComponent(paperId)}/pdf`)
  const safeName = filename || 'question_paper'

  const outcome = await fetchServerPdf(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (outcome.kind === 'pdf') {
    saveBlob(outcome.blob, `${safeName}.pdf`)
    return { renderedBy: 'server' }
  }

  const paper = options.paper ?? (await loadPaperForFallback(paperId))
  if (!paper) {
    throw new PdfFallbackUnavailableError(
      `The PDF service is unavailable (${outcome.reason}) and the paper could not be loaded for local rendering.`,
    )
  }

  // jsPDF + html2canvas live in their own chunk; only load them when needed.
  const { downloadPaperPreviewPDF } = await import('./pdfGenerator')
  await downloadPaperPreviewPDF(paper, options.collegeName, safeName)
  return { renderedBy: 'client', notice: CLIENT_RENDER_NOTICE }
}

/**
 * Download questions list as PDF from backend
 * POST /api/questions/export/pdf
 *
 * Pass `questions` (the same objects the caller selected from) so the local
 * fallback can render them when the server renderer is unavailable.
 */
export async function downloadQuestionsPDF(
  questionIds: string[],
  title: string,
  filename?: string,
  options: { questions?: QuestionPDF[] } = {},
): Promise<PdfDownloadResult> {
  const token = await getToken()
  const url = apiUrl('/questions/export/pdf')
  const safeName = filename || 'questions'

  const outcome = await fetchServerPdf(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ questionIds, title }),
  })

  if (outcome.kind === 'pdf') {
    saveBlob(outcome.blob, `${safeName}.pdf`)
    return { renderedBy: 'server' }
  }

  const wanted = new Set(questionIds)
  const questions = (options.questions ?? []).filter((q) => wanted.has(q.id))
  if (questions.length === 0) {
    throw new PdfFallbackUnavailableError(
      `The PDF service is unavailable (${outcome.reason}) and no question data was available for local rendering.`,
    )
  }

  const { downloadQuestionsPreviewPDF } = await import('./pdfGenerator')
  await downloadQuestionsPreviewPDF(questions, title, safeName)
  return { renderedBy: 'client', notice: CLIENT_RENDER_NOTICE }
}

/**
 * Loads a paper (and the full text of its linked questions) from Firestore so
 * the client renderer has something paper-shaped to draw. Returns `null` when
 * the paper does not exist or cannot be read.
 */
async function loadPaperForFallback(paperId: string): Promise<PaperPDF | null> {
  try {
    const { getPaperById, getPaperQuestions } = await import('@/modules/admin/api/paperApi')
    const paper = await getPaperById(paperId)
    if (!paper) return null

    const sections = Array.isArray(paper.sections) ? paper.sections : []
    const sectionsHaveText = sections.some((s: any) => (s.questions || []).some((q: any) => q?.text || q?.questionText))

    if (sectionsHaveText) {
      return {
        ...paper,
        sections: sections.map((s: any) => ({
          ...s,
          questions: (s.questions || []).map((q: any) => ({
            ...q,
            text: q.text || q.questionText || '',
          })),
        })),
      }
    }

    // Sections only carry question ids → hydrate them into a single section.
    const questions = await getPaperQuestions(paperId)
    return {
      ...paper,
      sections: [
        {
          name: 'Questions',
          numQuestions: questions.length,
          questions: questions.map((q) => ({ text: q.text, marks: q.marks, options: q.options })),
        },
      ],
    }
  } catch (err) {
    console.warn('[PDF] could not load paper for local rendering:', err)
    return null
  }
}
