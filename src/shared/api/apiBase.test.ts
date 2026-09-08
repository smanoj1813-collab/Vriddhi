// src/shared/api/apiBase.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Covers the acceptance criteria from the base-URL wiring fix: every documented
// VITE_API_BASE_URL shape must normalise to exactly one `/api`-suffixed base,
// and a 200-HTML "success" (SPA rewrite mishit) must be rejected loudly.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ApiResponseError,
  DEFAULT_API_BASE_URL,
  HOSTING_REWRITE_HINT,
  assertJsonResponse,
  normalizeApiBaseUrl,
} from './apiBase'

const PROD_HOST = 'https://asia-south1-vriddhi-academic.cloudfunctions.net'

describe('normalizeApiBaseUrl', () => {
  it('keeps a value that already ends in /api (.env.production, .env.example)', () => {
    assert.equal(normalizeApiBaseUrl(`${PROD_HOST}/api`), `${PROD_HOST}/api`)
  })

  it('strips a trailing slash after /api', () => {
    assert.equal(normalizeApiBaseUrl(`${PROD_HOST}/api/`), `${PROD_HOST}/api`)
    assert.equal(normalizeApiBaseUrl(`${PROD_HOST}/api///`), `${PROD_HOST}/api`)
  })

  it('appends /api when the host alone is configured', () => {
    assert.equal(normalizeApiBaseUrl(PROD_HOST), `${PROD_HOST}/api`)
    assert.equal(normalizeApiBaseUrl(`${PROD_HOST}/`), `${PROD_HOST}/api`)
  })

  it('never produces a double /api/api prefix', () => {
    for (const raw of [`${PROD_HOST}/api`, `${PROD_HOST}/api/`, PROD_HOST, `${PROD_HOST}/`]) {
      const base = normalizeApiBaseUrl(raw)
      assert.doesNotMatch(`${base}/papers/p1/pdf`, /\/api\/api\//, raw)
      assert.equal(`${base}/papers/p1/pdf`, `${PROD_HOST}/api/papers/p1/pdf`, raw)
    }
  })

  it('falls back to the production function when empty or unset', () => {
    assert.equal(normalizeApiBaseUrl(undefined), DEFAULT_API_BASE_URL)
    assert.equal(normalizeApiBaseUrl(null), DEFAULT_API_BASE_URL)
    assert.equal(normalizeApiBaseUrl(''), DEFAULT_API_BASE_URL)
    assert.equal(normalizeApiBaseUrl('   '), DEFAULT_API_BASE_URL)
    assert.match(DEFAULT_API_BASE_URL, /\/api$/)
  })

  it('supports the README emulator URL (already /api-suffixed)', () => {
    const emulator = 'http://localhost:5001/your-project/asia-south1/api'
    assert.equal(normalizeApiBaseUrl(emulator), emulator)
    assert.equal(normalizeApiBaseUrl('http://localhost:5001/your-project/asia-south1'), emulator)
  })

  it('supports same-origin relative bases for the Vite dev proxy', () => {
    assert.equal(normalizeApiBaseUrl('/api'), '/api')
    assert.equal(normalizeApiBaseUrl('/api/'), '/api')
    assert.equal(normalizeApiBaseUrl('/'), '/api')
  })

  it('is case-insensitive about the suffix and tolerant of whitespace', () => {
    assert.equal(normalizeApiBaseUrl(`  ${PROD_HOST}/API  `), `${PROD_HOST}/API`)
  })
})

function response(status: number, contentType: string | null, body: string): Response {
  const headers = new Headers()
  if (contentType) headers.set('content-type', contentType)
  return new Response(body, { status, statusText: status === 200 ? 'OK' : '', headers })
}

describe('assertJsonResponse', () => {
  const url = `${PROD_HOST}/api/ai/chat`

  it('resolves for 2xx application/json (with charset)', async () => {
    await assertJsonResponse(response(200, 'application/json; charset=utf-8', '{"ok":true}'), url)
  })

  it('rejects a 200 text/html SPA shell and names the hosting rewrite', async () => {
    await assert.rejects(
      assertJsonResponse(response(200, 'text/html; charset=utf-8', '<!doctype html><div id="root"></div>'), url),
      (err: unknown) => {
        assert.ok(err instanceof ApiResponseError)
        assert.equal(err.status, 200)
        assert.equal(err.url, url)
        assert.match(err.message, /Unexpected HTML response \(200 OK from https:\/\/asia-south1/)
        assert.ok(err.message.includes(HOSTING_REWRITE_HINT))
        return true
      },
    )
  })

  it('rejects a 2xx text/plain body as non-JSON, naming the content type', async () => {
    await assert.rejects(
      assertJsonResponse(response(200, 'text/plain', 'ok'), url),
      (err: unknown) => err instanceof ApiResponseError && /non-JSON response/.test(err.message) && /content-type: text\/plain/.test(err.message),
    )
  })

  it('surfaces the server message verbatim for JSON error bodies', async () => {
    await assert.rejects(
      assertJsonResponse(response(429, 'application/json', '{"error":"Too many AI generation requests. Please try again after 15 minutes."}'), url),
      (err: unknown) => {
        assert.ok(err instanceof ApiResponseError)
        assert.equal(err.status, 429)
        assert.equal(err.message, 'Too many AI generation requests. Please try again after 15 minutes.')
        assert.deepEqual(err.body, { error: 'Too many AI generation requests. Please try again after 15 minutes.' })
        return true
      },
    )
    await assert.rejects(
      assertJsonResponse(response(404, 'application/json', '{"message":"Paper not found"}'), url),
      (err: unknown) => err instanceof ApiResponseError && err.message === 'Paper not found',
    )
  })

  it('falls back to a status-bearing message when a JSON error body has no text', async () => {
    await assert.rejects(
      assertJsonResponse(response(500, 'application/json', '{}'), url),
      (err: unknown) => err instanceof ApiResponseError && /API request failed \(500 from/.test(err.message),
    )
  })

  it('reports a Functions "Route not found" 404 (the old double-/api symptom) with its body', async () => {
    await assert.rejects(
      assertJsonResponse(response(404, 'application/json', '{"error":"Route not found","path":"/api/api/papers/p1/pdf"}'), url),
      (err: unknown) => err instanceof ApiResponseError && err.message === 'Route not found' && (err.body as any).path === '/api/api/papers/p1/pdf',
    )
  })
})
