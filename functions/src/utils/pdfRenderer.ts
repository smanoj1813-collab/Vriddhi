// functions/src/utils/pdfRenderer.ts
//
// The ONE place the API talks to Puppeteer.
//
//  * `resolveChromePath()`  — finds a Chrome/Chromium binary. Precedence:
//        CHROME_PATH → PUPPETEER_EXECUTABLE_PATH → puppeteer.executablePath()
//        → first existing system binary (see SYSTEM_CHROME_CANDIDATES).
//    Every candidate is validated with `fs.existsSync`; the full list that was
//    probed is kept for diagnostics and returned to the client on failure.
//  * `renderPdfToBuffer()`  — single launch, hard timeouts around launch and
//    render, `browser.close()` in `finally`, SIGKILL when a render hangs.
//  * `sendRenderedPdf()`    — Express-agnostic helper used by BOTH PDF routes so
//    the HTTP degradation contract lives in exactly one place:
//
//        503 { error: 'pdf_renderer_unavailable', fallback: 'client', probed: [...] }
//            → no usable Chrome, or Chrome could not be launched. The web client
//              (src/shared/utils/pdfDownloader.ts) renders the PDF in the browser.
//        500 { error: 'pdf_render_timeout' | 'pdf_render_failed', message }
//            → genuine render faults.
//
// Deployment note: functions/.puppeteerrc.cjs makes Puppeteer download Chrome
// into functions/.cache/puppeteer so the binary ships with the deployed bundle
// (the default ~/.cache/puppeteer is not preserved between the Cloud Build
// install step and the runtime container). CHROME_PATH overrides everything.

import * as fs from 'fs'
import type { Browser, LaunchOptions, Page, PDFOptions } from 'puppeteer'

// ─── Constants ──────────────────────────────────────────────────────────────

export const SYSTEM_CHROME_CANDIDATES: readonly string[] = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
]

/** Budget for `puppeteer.launch()`; a hang here means the binary is unusable → 503. */
export const DEFAULT_LAUNCH_TIMEOUT_MS = 15_000
/** Budget for newPage + setContent + pdf. A hang here is a render fault → 500. */
export const DEFAULT_RENDER_TIMEOUT_MS = 30_000
/** How long we wait for a graceful `browser.close()` before SIGKILL. */
const CLOSE_TIMEOUT_MS = 5_000

export const DEFAULT_LAUNCH_ARGS: readonly string[] = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  // /dev/shm is tiny on Cloud Functions / Cloud Run; without this Chrome
  // crashes on larger pages.
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

// ─── Errors ─────────────────────────────────────────────────────────────────

/** No Chrome binary could be found or launched. Maps to HTTP 503 + client fallback. */
export class PdfRendererUnavailableError extends Error {
  readonly code = 'pdf_renderer_unavailable' as const
  /** Every executable path that was checked, in precedence order. */
  readonly probed: string[]
  readonly cause?: unknown

  constructor(probed: string[], message?: string, cause?: unknown) {
    super(
      message ??
        `No Chrome/Chromium executable is available for PDF rendering ` +
        `(probed: ${probed.length ? probed.join(', ') : 'nothing'}). ` +
        `Set CHROME_PATH or PUPPETEER_EXECUTABLE_PATH, or let Puppeteer download Chrome (see functions/.puppeteerrc.cjs).`,
    )
    this.name = 'PdfRendererUnavailableError'
    this.probed = probed
    this.cause = cause
  }
}

/** Launch or render exceeded its budget. Maps to HTTP 500. */
export class PdfRenderTimeoutError extends Error {
  readonly code = 'pdf_render_timeout' as const
  readonly stage: string
  readonly timeoutMs: number

  constructor(stage: string, timeoutMs: number) {
    super(`PDF rendering timed out after ${timeoutMs}ms during ${stage}`)
    this.name = 'PdfRenderTimeoutError'
    this.stage = stage
    this.timeoutMs = timeoutMs
  }
}

// ─── Small utilities ────────────────────────────────────────────────────────

/** Rejects with `PdfRenderTimeoutError` if `promise` does not settle within `timeoutMs`. */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, stage: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PdfRenderTimeoutError(stage, timeoutMs)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : String(err ?? '')
}

function toBuffer(bytes: Uint8Array): Buffer {
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

type Logger = Pick<Console, 'warn' | 'error'>

// ─── Chrome path resolution ─────────────────────────────────────────────────

export type ChromePathSource = 'CHROME_PATH' | 'PUPPETEER_EXECUTABLE_PATH' | 'puppeteer' | 'system'

export interface ChromePathResolution {
  executablePath: string | null
  source: ChromePathSource | null
  /** Every candidate that was checked, in precedence order (deduplicated). */
  probed: string[]
}

export interface ChromePathDeps {
  env?: NodeJS.ProcessEnv
  existsSync?: (path: string) => boolean
  /** Puppeteer's own idea of where its downloaded Chrome lives. */
  bundledExecutablePath?: () => Promise<string | undefined>
  systemCandidates?: readonly string[]
  logger?: Logger
}

async function defaultBundledExecutablePath(): Promise<string | undefined> {
  try {
    const { default: puppeteer } = await import('puppeteer')
    // Async since Puppeteer 22 — it consults .puppeteerrc / PUPPETEER_CACHE_DIR.
    return await puppeteer.executablePath()
  } catch {
    return undefined
  }
}

export async function resolveChromePath(deps: ChromePathDeps = {}): Promise<ChromePathResolution> {
  const env = deps.env ?? process.env
  const existsSync = deps.existsSync ?? fs.existsSync
  const logger = deps.logger ?? console
  const probed: string[] = []

  const consider = (candidate: string | undefined, source: ChromePathSource): ChromePathResolution | null => {
    const value = (candidate || '').trim()
    if (!value || probed.includes(value)) return null
    probed.push(value)
    let exists = false
    try {
      exists = existsSync(value)
    } catch {
      exists = false
    }
    return exists ? { executablePath: value, source, probed } : null
  }

  // 1 + 2. Explicit operator overrides. A configured-but-missing path is
  // reported loudly and skipped rather than taking the whole feature down.
  for (const key of ['CHROME_PATH', 'PUPPETEER_EXECUTABLE_PATH'] as const) {
    const hit = consider(env[key], key)
    if (hit) return hit
    if (env[key]) logger.warn(`[pdfRenderer] ${key}=${env[key]} does not exist; trying the next candidate`)
  }

  // 3. Chrome downloaded by Puppeteer's postinstall (respects .puppeteerrc.cjs).
  const bundled = await (deps.bundledExecutablePath ?? defaultBundledExecutablePath)().catch(() => undefined)
  const bundledHit = consider(bundled, 'puppeteer')
  if (bundledHit) return bundledHit

  // 4. System packages (e.g. `apt install chromium` in a custom image).
  for (const candidate of deps.systemCandidates ?? SYSTEM_CHROME_CANDIDATES) {
    const hit = consider(candidate, 'system')
    if (hit) return hit
  }

  return { executablePath: null, source: null, probed }
}

// ─── Rendering ──────────────────────────────────────────────────────────────

type SetContentOptions = NonNullable<Parameters<Page['setContent']>[1]>

/** The slice of Puppeteer's `Page` the renderer needs (so tests can stub it). */
export interface RendererPage {
  setContent: (html: string, options?: SetContentOptions) => Promise<void>
  pdf: (options?: PDFOptions) => Promise<Uint8Array>
}

/** The slice of Puppeteer's `Browser` the renderer needs (so tests can stub it). */
export interface RendererBrowser {
  newPage: () => Promise<RendererPage>
  close: () => Promise<void>
  process: () => { kill: (signal?: NodeJS.Signals | number) => boolean } | null
}

export type BrowserLauncher = (options: LaunchOptions) => Promise<RendererBrowser>

async function defaultLauncher(options: LaunchOptions): Promise<RendererBrowser> {
  // Lazy so the (heavy) Puppeteer module is only loaded by requests that
  // actually render a PDF, not by every AI-chat cold start.
  const { default: puppeteer } = await import('puppeteer')
  const browser: Browser = await puppeteer.launch(options)
  return browser
}

export interface RenderPdfOptions {
  /** Passed straight to `page.pdf()`; defaults to A4 with backgrounds. */
  pdf?: PDFOptions
  waitUntil?: 'load' | 'domcontentloaded'
  launchTimeoutMs?: number
  renderTimeoutMs?: number
  launchArgs?: readonly string[]
}

export interface RendererDeps extends ChromePathDeps {
  launch?: BrowserLauncher
}

function killBrowser(browser: RendererBrowser): void {
  try {
    browser.process()?.kill('SIGKILL')
  } catch {
    // Process already gone.
  }
}

async function releaseBrowser(browser: RendererBrowser, force: boolean, logger: Logger): Promise<void> {
  if (force) {
    // A hung renderer will not honour a graceful close — do not wait on it.
    killBrowser(browser)
    browser.close().catch(() => undefined)
    return
  }
  try {
    await withTimeout(browser.close(), CLOSE_TIMEOUT_MS, 'browser.close')
  } catch (err) {
    logger.warn('[pdfRenderer] browser.close() failed; killing the process', errorMessage(err))
    killBrowser(browser)
  }
}

/**
 * Renders an HTML document to a PDF `Buffer`.
 *
 * @throws PdfRendererUnavailableError  no Chrome binary, or it failed to launch (→ 503)
 * @throws PdfRenderTimeoutError        render exceeded `renderTimeoutMs` (→ 500)
 * @throws Error                        any other Puppeteer failure (→ 500)
 */
export async function renderPdfToBuffer(
  html: string,
  options: RenderPdfOptions = {},
  deps: RendererDeps = {},
): Promise<Buffer> {
  const logger = deps.logger ?? console
  const launchTimeoutMs = options.launchTimeoutMs ?? DEFAULT_LAUNCH_TIMEOUT_MS
  const renderTimeoutMs = options.renderTimeoutMs ?? DEFAULT_RENDER_TIMEOUT_MS

  const resolution = await resolveChromePath(deps)
  if (!resolution.executablePath) {
    throw new PdfRendererUnavailableError(resolution.probed)
  }

  const launch = deps.launch ?? defaultLauncher
  const launchPromise = launch({
    headless: true,
    executablePath: resolution.executablePath,
    args: [...(options.launchArgs ?? DEFAULT_LAUNCH_ARGS)],
    timeout: launchTimeoutMs,
  })

  let browser: RendererBrowser
  try {
    browser = await withTimeout(launchPromise, launchTimeoutMs, 'launch')
  } catch (err) {
    // If the launch merely outlived our budget, make sure the late browser does not leak.
    launchPromise.then((late) => releaseBrowser(late, true, logger), () => undefined)
    throw new PdfRendererUnavailableError(
      resolution.probed,
      `Chrome at ${resolution.executablePath} (${resolution.source}) could not be launched: ${errorMessage(err)}`,
      err,
    )
  }

  let timedOut = false
  try {
    const bytes = await withTimeout(
      (async () => {
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: options.waitUntil ?? 'load', timeout: renderTimeoutMs })
        return page.pdf({ format: 'A4', printBackground: true, ...options.pdf })
      })(),
      renderTimeoutMs,
      'render',
    )
    return toBuffer(bytes)
  } catch (err) {
    timedOut = err instanceof PdfRenderTimeoutError
    throw err
  } finally {
    await releaseBrowser(browser, timedOut, logger)
  }
}

// ─── HTTP contract ──────────────────────────────────────────────────────────

export interface PdfErrorBody {
  error: 'pdf_renderer_unavailable' | 'pdf_render_timeout' | 'pdf_render_failed'
  message: string
  /** Present only on 503: the client should render the document itself. */
  fallback?: 'client'
  probed?: string[]
}

/** Maps a renderer failure to the HTTP status + JSON body both PDF routes return. */
export function pdfErrorResponse(err: unknown): { status: number; body: PdfErrorBody } {
  if (err instanceof PdfRendererUnavailableError) {
    return {
      status: 503,
      body: { error: err.code, fallback: 'client', message: err.message, probed: err.probed },
    }
  }
  if (err instanceof PdfRenderTimeoutError) {
    return { status: 500, body: { error: err.code, message: err.message } }
  }
  return {
    status: 500,
    body: { error: 'pdf_render_failed', message: errorMessage(err) || 'Failed to generate PDF' },
  }
}

/** Structural subset of `express.Response` so the helper is unit-testable without Express. */
export interface PdfResponseLike {
  headersSent: boolean
  status: (code: number) => PdfResponseLike
  json: (body: unknown) => unknown
  setHeader: (name: string, value: string | number) => unknown
  send: (body: Buffer) => unknown
}

export interface SendPdfOptions extends RenderPdfOptions {
  /** Download filename, including the `.pdf` extension. */
  filename: string
  /** Prefix for log lines, e.g. `papers/pdf`. */
  logTag?: string
}

/**
 * Renders `html` and writes it to `res` as an attachment, or writes the JSON
 * error body defined by `pdfErrorResponse`. Never throws.
 *
 * @returns `true` when a PDF was sent, `false` when an error response was written.
 */
export async function sendRenderedPdf(
  res: PdfResponseLike,
  html: string,
  options: SendPdfOptions,
  deps: RendererDeps = {},
): Promise<boolean> {
  const logger = deps.logger ?? console
  const tag = options.logTag ?? 'pdf'
  try {
    const pdf = await renderPdfToBuffer(html, options, deps)
    const filename = options.filename.replace(/["\r\n]/g, '') || 'document.pdf'
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdf.length)
    res.setHeader('Cache-Control', 'no-store')
    res.send(pdf)
    return true
  } catch (err) {
    const { status, body } = pdfErrorResponse(err)
    if (status === 503) {
      logger.warn(`[${tag}] PDF renderer unavailable — client will render locally. Probed: ${body.probed?.join(', ') || 'nothing'}`)
    } else {
      logger.error(`[${tag}] PDF generation failed:`, err)
    }
    if (!res.headersSent) {
      res.status(status).json(body)
    }
    return false
  }
}
