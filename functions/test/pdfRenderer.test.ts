import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_LAUNCH_ARGS,
  PdfRenderTimeoutError,
  PdfRendererUnavailableError,
  pdfErrorResponse,
  renderPdfToBuffer,
  resolveChromePath,
  sendRenderedPdf,
  withTimeout,
  type BrowserLauncher,
  type PdfResponseLike,
  type RendererBrowser,
  type RendererPage,
} from '../src/utils/pdfRenderer'

const quietLogger = { warn: () => undefined, error: () => undefined }

/** `existsSync` stub that only knows about the given paths. */
function existsOnly(...paths: string[]) {
  const set = new Set(paths)
  return (p: string) => set.has(p)
}

interface FakeBrowserOptions {
  pdf?: () => Promise<Uint8Array>
  setContent?: () => Promise<void>
  onClose?: () => Promise<void>
}

function fakeBrowser(opts: FakeBrowserOptions = {}) {
  const state = { closed: 0, killed: [] as Array<NodeJS.Signals | number | undefined>, newPages: 0 }
  const page: RendererPage = {
    setContent: opts.setContent ?? (async () => undefined),
    pdf: opts.pdf ?? (async () => new Uint8Array([0x25, 0x50, 0x44, 0x46])), // "%PDF"
  }
  const browser: RendererBrowser = {
    newPage: async () => {
      state.newPages += 1
      return page
    },
    close: async () => {
      state.closed += 1
      if (opts.onClose) await opts.onClose()
    },
    process: () => ({
      kill: (signal?: NodeJS.Signals | number) => {
        state.killed.push(signal)
        return true
      },
    }),
  }
  return { browser, state }
}

function fakeRes() {
  const res = {
    headersSent: false,
    statusCode: 200,
    headers: {} as Record<string, string | number>,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: unknown) {
      res.body = body
      res.headersSent = true
      return res
    },
    setHeader(name: string, value: string | number) {
      res.headers[name] = value
    },
    send(body: Buffer) {
      res.body = body
      res.headersSent = true
      return res
    },
  }
  return res as typeof res & PdfResponseLike
}

describe('resolveChromePath precedence', () => {
  it('prefers CHROME_PATH over every other source', async () => {
    const result = await resolveChromePath({
      env: { CHROME_PATH: '/opt/chrome', PUPPETEER_EXECUTABLE_PATH: '/opt/other' },
      existsSync: existsOnly('/opt/chrome', '/opt/other', '/bundled/chrome', '/usr/bin/chromium'),
      bundledExecutablePath: async () => '/bundled/chrome',
      logger: quietLogger,
    })
    assert.equal(result.executablePath, '/opt/chrome')
    assert.equal(result.source, 'CHROME_PATH')
    assert.deepEqual(result.probed, ['/opt/chrome'])
  })

  it('falls through to PUPPETEER_EXECUTABLE_PATH when CHROME_PATH points at a missing file', async () => {
    const warnings: string[] = []
    const result = await resolveChromePath({
      env: { CHROME_PATH: '/missing/chrome', PUPPETEER_EXECUTABLE_PATH: '/opt/other' },
      existsSync: existsOnly('/opt/other'),
      bundledExecutablePath: async () => '/bundled/chrome',
      logger: { warn: (msg: string) => warnings.push(msg), error: () => undefined },
    })
    assert.equal(result.executablePath, '/opt/other')
    assert.equal(result.source, 'PUPPETEER_EXECUTABLE_PATH')
    assert.deepEqual(result.probed, ['/missing/chrome', '/opt/other'])
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /CHROME_PATH=\/missing\/chrome does not exist/)
  })

  it('uses the Puppeteer-downloaded Chrome when no env override is set', async () => {
    const result = await resolveChromePath({
      env: {},
      existsSync: existsOnly('/bundled/chrome', '/usr/bin/chromium'),
      bundledExecutablePath: async () => '/bundled/chrome',
      logger: quietLogger,
    })
    assert.equal(result.executablePath, '/bundled/chrome')
    assert.equal(result.source, 'puppeteer')
  })

  it('falls back to the first existing system binary in order', async () => {
    const result = await resolveChromePath({
      env: {},
      existsSync: existsOnly('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'),
      bundledExecutablePath: async () => '/bundled/chrome',
      logger: quietLogger,
    })
    assert.equal(result.executablePath, '/usr/bin/google-chrome')
    assert.equal(result.source, 'system')
    assert.deepEqual(result.probed, ['/bundled/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'])
  })

  it('reports every probed path when nothing exists, tolerating a throwing executablePath()', async () => {
    // Puppeteer's executablePath() rejects when its cache is empty; that must
    // not abort resolution — the system candidates still get probed.
    const result = await resolveChromePath({
      env: { CHROME_PATH: '  ' },
      existsSync: () => false,
      bundledExecutablePath: async () => {
        throw new Error('Could not find Chrome')
      },
      logger: quietLogger,
    })
    assert.equal(result.executablePath, null)
    assert.equal(result.source, null)
    assert.deepEqual(result.probed, ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'])
  })

  it('deduplicates candidates that appear in more than one source', async () => {
    const result = await resolveChromePath({
      env: { CHROME_PATH: '/usr/bin/chromium', PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium' },
      existsSync: () => false,
      bundledExecutablePath: async () => '/usr/bin/chromium',
      logger: quietLogger,
    })
    assert.deepEqual(result.probed, ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'])
  })
})

describe('renderPdfToBuffer', () => {
  const chromeDeps = {
    env: { CHROME_PATH: '/opt/chrome' },
    existsSync: existsOnly('/opt/chrome'),
    bundledExecutablePath: async () => undefined,
    logger: quietLogger,
  }

  it('throws PdfRendererUnavailableError (carrying the probed list) without launching when no Chrome exists', async () => {
    let launched = false
    const launch: BrowserLauncher = async () => {
      launched = true
      return fakeBrowser().browser
    }
    await assert.rejects(
      renderPdfToBuffer('<p>hi</p>', {}, { env: {}, existsSync: () => false, bundledExecutablePath: async () => undefined, launch, logger: quietLogger }),
      (err: unknown) => {
        assert.ok(err instanceof PdfRendererUnavailableError)
        assert.equal(err.code, 'pdf_renderer_unavailable')
        assert.deepEqual(err.probed, ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'])
        return true
      },
    )
    assert.equal(launched, false)
  })

  it('launches with the resolved executablePath and default args, renders, and closes the browser', async () => {
    const { browser, state } = fakeBrowser()
    let launchOptions: any
    const launch: BrowserLauncher = async (options) => {
      launchOptions = options
      return browser
    }
    const html = '<html><body>Paper</body></html>'
    const pdf = await renderPdfToBuffer(html, { pdf: { margin: { top: '1cm' } } }, { ...chromeDeps, launch })

    assert.ok(Buffer.isBuffer(pdf))
    assert.equal(pdf.toString('latin1'), '%PDF')
    assert.equal(launchOptions.executablePath, '/opt/chrome')
    assert.equal(launchOptions.headless, true)
    assert.deepEqual(launchOptions.args, [...DEFAULT_LAUNCH_ARGS])
    assert.equal(state.newPages, 1)
    assert.equal(state.closed, 1)
    assert.deepEqual(state.killed, [])
  })

  it('closes the browser when page.pdf() throws and rethrows the original error', async () => {
    const { browser, state } = fakeBrowser({
      pdf: async () => {
        throw new Error('Protocol error: Target closed')
      },
    })
    await assert.rejects(
      renderPdfToBuffer('<p>x</p>', {}, { ...chromeDeps, launch: async () => browser }),
      /Target closed/,
    )
    assert.equal(state.closed, 1, 'browser.close() must run in finally')
  })

  it('closes the browser when setContent throws', async () => {
    const { browser, state } = fakeBrowser({
      setContent: async () => {
        throw new Error('Navigation failed')
      },
    })
    await assert.rejects(renderPdfToBuffer('<p>x</p>', {}, { ...chromeDeps, launch: async () => browser }), /Navigation failed/)
    assert.equal(state.closed, 1)
  })

  it('SIGKILLs a hung render instead of waiting on a graceful close', async () => {
    const { browser, state } = fakeBrowser({ pdf: () => new Promise(() => undefined) /* never resolves */ })
    await assert.rejects(
      renderPdfToBuffer('<p>x</p>', { renderTimeoutMs: 20 }, { ...chromeDeps, launch: async () => browser }),
      (err: unknown) => {
        assert.ok(err instanceof PdfRenderTimeoutError)
        assert.equal(err.code, 'pdf_render_timeout')
        assert.equal(err.stage, 'render')
        return true
      },
    )
    assert.deepEqual(state.killed, ['SIGKILL'])
  })

  it('maps a launch failure to PdfRendererUnavailableError (503 contract)', async () => {
    const launch: BrowserLauncher = async () => {
      throw new Error('spawn /opt/chrome EACCES')
    }
    await assert.rejects(
      renderPdfToBuffer('<p>x</p>', {}, { ...chromeDeps, launch }),
      (err: unknown) => {
        assert.ok(err instanceof PdfRendererUnavailableError)
        assert.match(err.message, /could not be launched: spawn \/opt\/chrome EACCES/)
        assert.deepEqual(err.probed, ['/opt/chrome'])
        return true
      },
    )
  })

  it('treats a hung launch as unavailable and kills the late browser', async () => {
    const { browser, state } = fakeBrowser()
    let releaseLate!: () => void
    const launch: BrowserLauncher = () => new Promise((resolve) => {
      releaseLate = () => resolve(browser)
    })
    await assert.rejects(
      renderPdfToBuffer('<p>x</p>', { launchTimeoutMs: 20 }, { ...chromeDeps, launch }),
      (err: unknown) => err instanceof PdfRendererUnavailableError,
    )
    releaseLate()
    await new Promise((r) => setTimeout(r, 5))
    assert.deepEqual(state.killed, ['SIGKILL'])
  })
})

describe('withTimeout', () => {
  it('passes through a value that settles in time and clears its timer', async () => {
    assert.equal(await withTimeout(Promise.resolve(42), 1000, 'test'), 42)
  })

  it('rejects with PdfRenderTimeoutError naming the stage', async () => {
    await assert.rejects(
      withTimeout(new Promise(() => undefined), 10, 'setContent'),
      (err: unknown) => err instanceof PdfRenderTimeoutError && /setContent/.test(err.message) && err.timeoutMs === 10,
    )
  })
})

describe('HTTP degradation contract', () => {
  it('pdfErrorResponse maps each failure class to the documented status/body', () => {
    const unavailable = pdfErrorResponse(new PdfRendererUnavailableError(['/a', '/b']))
    assert.equal(unavailable.status, 503)
    assert.equal(unavailable.body.error, 'pdf_renderer_unavailable')
    assert.equal(unavailable.body.fallback, 'client')
    assert.deepEqual(unavailable.body.probed, ['/a', '/b'])

    const timeout = pdfErrorResponse(new PdfRenderTimeoutError('render', 30_000))
    assert.equal(timeout.status, 500)
    assert.equal(timeout.body.error, 'pdf_render_timeout')
    assert.equal(timeout.body.fallback, undefined)

    const generic = pdfErrorResponse(new Error('boom'))
    assert.equal(generic.status, 500)
    assert.deepEqual(generic.body, { error: 'pdf_render_failed', message: 'boom' })
  })

  it('sendRenderedPdf answers 503 + fallback:client when no executable is found', async () => {
    const res = fakeRes()
    const sent = await sendRenderedPdf(res, '<p>x</p>', { filename: 'paper.pdf' }, {
      env: { CHROME_PATH: '/nope/chrome' },
      existsSync: () => false,
      bundledExecutablePath: async () => undefined,
      launch: async () => {
        throw new Error('must not launch')
      },
      logger: quietLogger,
    })
    assert.equal(sent, false)
    assert.equal(res.statusCode, 503)
    const body = res.body as any
    assert.equal(body.error, 'pdf_renderer_unavailable')
    assert.equal(body.fallback, 'client')
    assert.ok(body.probed.includes('/nope/chrome'))
    assert.equal(res.headers['Content-Type'], undefined)
  })

  it('sendRenderedPdf streams the PDF with attachment headers on success', async () => {
    const res = fakeRes()
    const { browser } = fakeBrowser()
    const sent = await sendRenderedPdf(res, '<p>x</p>', { filename: 'Mid_Term".pdf', logTag: 'test' }, {
      env: { CHROME_PATH: '/opt/chrome' },
      existsSync: existsOnly('/opt/chrome'),
      bundledExecutablePath: async () => undefined,
      launch: async () => browser,
      logger: quietLogger,
    })
    assert.equal(sent, true)
    assert.equal(res.statusCode, 200)
    assert.equal(res.headers['Content-Type'], 'application/pdf')
    assert.equal(res.headers['Content-Disposition'], 'attachment; filename="Mid_Term.pdf"')
    assert.equal(res.headers['Content-Length'], 4)
    assert.ok(Buffer.isBuffer(res.body))
  })

  it('sendRenderedPdf keeps genuine render faults on 500 (no client fallback)', async () => {
    const res = fakeRes()
    const { browser, state } = fakeBrowser({
      pdf: async () => {
        throw new Error('Page crashed!')
      },
    })
    const sent = await sendRenderedPdf(res, '<p>x</p>', { filename: 'q.pdf' }, {
      env: { CHROME_PATH: '/opt/chrome' },
      existsSync: existsOnly('/opt/chrome'),
      bundledExecutablePath: async () => undefined,
      launch: async () => browser,
      logger: quietLogger,
    })
    assert.equal(sent, false)
    assert.equal(res.statusCode, 500)
    assert.deepEqual(res.body, { error: 'pdf_render_failed', message: 'Page crashed!' })
    assert.equal(state.closed, 1)
  })
})
