// src/shared/utils/serverReportPdf.ts
//
// Ask the server to print a report as a text PDF (item 4.3 of
// docs/HANDOFF_OPTIMISATION_2026-09-25.md), and tell the caller when to draw it
// in the browser instead.
//
// The rule for every document migrated this way: the server path is an
// improvement, never a dependency. Any answer that is not a PDF — the renderer
// being cold or down (503), a spent rate limit (429), a refusal (400), a hostile
// proxy returning the SPA shell (200 text/html), a slow Chrome (timeout) or no
// connection at all — resolves to `{ kind: 'fallback' }` and the caller renders
// locally with the code it already had. That is why nothing here throws.
//
// A rejection is not a bug: it is the answer to "should I render this in the
// browser?" and it is unit-tested.

import { pdfUrl } from '@/shared/api/apiBase'

/** The document shape the server route validates (functions/src/reports/attendanceRegister.ts). */
export interface ServerReportSheet {
  name: string
  headers: string[]
  rows: Array<Array<string | number>>
}

export interface ServerReportInput {
  title: string
  subtitle?: string
  collegeName?: string
  sheets: ServerReportSheet[]
  columnWeights?: number[][]
  landscape?: boolean
}

export type ServerReportOutcome =
  | { kind: 'pdf'; blob: Blob }
  | { kind: 'fallback'; reason: ServerReportFallbackReason }

export type ServerReportFallbackReason =
  | 'no_fetch'
  | 'no_token'
  | 'renderer_unavailable'
  | 'unexpected_content_type'
  | 'empty_pdf'
  | 'timeout'
  | 'network'
  | `http_${number}`

export interface ServerReportDeps {
  /** Injected in tests; defaults to the stored/auth token. */
  getToken?: () => Promise<string>
  fetchImpl?: typeof fetch
  /** Milliseconds before we give up and render locally. */
  timeoutMs?: number
  /** Injected in tests; defaults to the `pdf` function host. */
  url?: string
}

/** Default route for the attendance register. */
export const ATTENDANCE_REGISTER_PDF_URL = '/attendance/register/pdf'

async function defaultGetToken(): Promise<string> {
  try {
    const stored = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (stored) return stored
  } catch {
    // No storage (private mode / non-browser): fall through to Firebase auth.
  }
  try {
    const { auth } = await import('@/Firebase/config')
    if (auth.currentUser) return await auth.currentUser.getIdToken()
  } catch {
    // ignore — no token means the caller renders locally
  }
  return ''
}

/**
 * POST the report and return the PDF bytes, or the reason the browser must draw
 * it. Never throws, and never returns a half-filled result.
 */
export async function fetchServerReportPdf(
  report: ServerReportInput,
  deps: ServerReportDeps = {},
  path: string = ATTENDANCE_REGISTER_PDF_URL,
): Promise<ServerReportOutcome> {
  const doFetch = deps.fetchImpl ?? (typeof fetch === 'function' ? fetch : undefined)
  if (!doFetch) return { kind: 'fallback', reason: 'no_fetch' }

  const getToken = deps.getToken ?? defaultGetToken
  let token = ''
  try {
    token = (await getToken()) || ''
  } catch {
    token = ''
  }
  if (!token) return { kind: 'fallback', reason: 'no_token' }

  const url = deps.url ?? pdfUrl(path)
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  const timer = controller ? setTimeout(() => controller.abort(), deps.timeoutMs ?? 45_000) : undefined

  try {
    const res = await doFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(report),
      signal: controller?.signal,
    })

    // The renderer says so itself: `503 { fallback: 'client' }`.
    if (res.status === 503) return { kind: 'fallback', reason: 'renderer_unavailable' }
    if (!res.ok) return { kind: 'fallback', reason: `http_${res.status}` }

    const contentType = (res.headers?.get('content-type') || '').toLowerCase()
    if (!contentType.includes('pdf')) {
      // A hosting rewrite answering with the SPA shell is the classic case.
      return { kind: 'fallback', reason: 'unexpected_content_type' }
    }

    const blob = await res.blob()
    if (!blob || blob.size === 0) return { kind: 'fallback', reason: 'empty_pdf' }
    return { kind: 'pdf', blob }
  } catch {
    return { kind: 'fallback', reason: controller?.signal.aborted ? 'timeout' : 'network' }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** One line for the console when the browser had to take over — the operator's breadcrumb. */
export function describeServerReportFallback(reason: ServerReportFallbackReason): string {
  switch (reason) {
    case 'renderer_unavailable':
      return 'The PDF service is warming up; this sheet was rendered in your browser instead.'
    case 'timeout':
      return 'The PDF service took too long; this sheet was rendered in your browser instead.'
    case 'no_token':
      return 'No sign-in token was available; this sheet was rendered in your browser instead.'
    default:
      return 'The PDF service could not be reached; this sheet was rendered in your browser instead.'
  }
}
