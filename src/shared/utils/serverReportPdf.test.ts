// src/shared/utils/serverReportPdf.test.ts
//
// The contract that matters: any answer that is not a PDF becomes "render it in
// the browser", and it never throws. If this test file passes, a student on a
// dead connection, an admin during a cold start and a faculty member who hit the
// rate limit all still get their attendance sheet.
//
// Run: `npm run test:unit`.

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ATTENDANCE_REGISTER_PDF_URL,
  describeServerReportFallback,
  fetchServerReportPdf,
  type ServerReportInput,
} from './serverReportPdf'

const REPORT: ServerReportInput = {
  title: 'Student attendance — September 2026',
  subtitle: 'BCA · Semester 5',
  collegeName: 'Sri Siddaganga College',
  sheets: [{ name: 'Detail', headers: ['Date', 'Student'], rows: [['2026-09-01', 'Bala Kumar']] }],
}

const URL_UNDER_TEST = 'https://example.test/pdf/attendance/register/pdf'

function pdfResponse(bytes = 3, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/pdf' },
    blob: async () => new Blob([new Uint8Array(bytes).fill(37)], { type: 'application/pdf' }),
  } as unknown as Response
}

function jsonResponse(status: number, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    blob: async () => new Blob(['{}'], { type: contentType }),
  } as unknown as Response
}

test('a 200 PDF is passed straight through', async () => {
  let seenUrl = ''
  let seenInit: RequestInit | undefined
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => 'token-123',
    fetchImpl: (async (url: string, init: RequestInit) => {
      seenUrl = String(url)
      seenInit = init
      return pdfResponse(2048)
    }) as unknown as typeof fetch,
  })

  assert.equal(outcome.kind, 'pdf')
  assert.ok(outcome.kind === 'pdf' && outcome.blob.size > 1000)
  assert.equal(seenUrl, URL_UNDER_TEST)
  assert.equal((seenInit?.headers as Record<string, string>).Authorization, 'Bearer token-123')
  assert.equal(JSON.parse(String(seenInit?.body)).title, REPORT.title)
})

test('the default path is the attendance register route', () => {
  assert.equal(ATTENDANCE_REGISTER_PDF_URL, '/attendance/register/pdf')
})

test('no token means the browser renders — the request is never sent', async () => {
  let called = false
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => '',
    fetchImpl: (async () => {
      called = true
      return pdfResponse()
    }) as unknown as typeof fetch,
  })

  assert.deepEqual(outcome, { kind: 'fallback', reason: 'no_token' })
  assert.equal(called, false)
})

test('a token lookup that throws is treated as no token', async () => {
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => {
      throw new Error('storage blocked')
    },
    fetchImpl: (async () => pdfResponse()) as unknown as typeof fetch,
  })
  assert.deepEqual(outcome, { kind: 'fallback', reason: 'no_token' })
})

test('503 from the renderer is a fallback, not an error', async () => {
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => 't',
    fetchImpl: (async () => jsonResponse(503)) as unknown as typeof fetch,
  })
  assert.deepEqual(outcome, { kind: 'fallback', reason: 'renderer_unavailable' })
})

test('a 401, 400 or 429 keeps the status in the reason so the console says why', async () => {
  for (const status of [400, 401, 403, 429]) {
    const outcome = await fetchServerReportPdf(REPORT, {
      url: URL_UNDER_TEST,
      getToken: async () => 't',
      fetchImpl: (async () => jsonResponse(status)) as unknown as typeof fetch,
    })
    assert.deepEqual(outcome, { kind: 'fallback', reason: `http_${status}` })
  }
})

test('a 200 that is the SPA shell (text/html) falls back instead of saving a broken file', async () => {
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => 't',
    fetchImpl: (async () => jsonResponse(200, 'text/html; charset=utf-8')) as unknown as typeof fetch,
  })
  assert.deepEqual(outcome, { kind: 'fallback', reason: 'unexpected_content_type' })
})

test('an empty PDF body falls back rather than downloading a 0-byte file', async () => {
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => 't',
    fetchImpl: (async () => pdfResponse(0)) as unknown as typeof fetch,
  })
  assert.deepEqual(outcome, { kind: 'fallback', reason: 'empty_pdf' })
})

test('a network failure falls back and never throws', async () => {
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    getToken: async () => 't',
    fetchImpl: (async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch,
  })
  assert.deepEqual(outcome, { kind: 'fallback', reason: 'network' })
})

test('a slow renderer is abandoned at the timeout and the browser draws the sheet', async () => {
  const outcome = await fetchServerReportPdf(REPORT, {
    url: URL_UNDER_TEST,
    timeoutMs: 5,
    getToken: async () => 't',
    fetchImpl: ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })) as unknown as typeof fetch,
  })
  assert.deepEqual(outcome, { kind: 'fallback', reason: 'timeout' })
})

test('a missing fetch implementation is a fallback (older webviews)', async () => {
  const original = globalThis.fetch
  // @ts-expect-error — deliberately removing fetch for this case
  delete globalThis.fetch
  try {
    const outcome = await fetchServerReportPdf(REPORT, { url: URL_UNDER_TEST, getToken: async () => 't' })
    assert.deepEqual(outcome, { kind: 'fallback', reason: 'no_fetch' })
  } finally {
    globalThis.fetch = original
  }
})

test('every fallback reason has a sentence for the console', () => {
  for (const reason of ['renderer_unavailable', 'timeout', 'no_token', 'network', 'http_429'] as const) {
    const line = describeServerReportFallback(reason)
    assert.ok(line.length > 20, `${reason} needs a readable line`)
    assert.match(line, /browser/, 'the line must say what actually happened to the sheet')
  }
})
