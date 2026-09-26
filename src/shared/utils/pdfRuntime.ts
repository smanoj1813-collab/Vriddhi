// src/shared/utils/pdfRuntime.ts
//
// THE single entry point for the browser's PDF libraries (jspdf + html2canvas).
//
// Why one module: the two libraries together are ~580 kB of JavaScript. Vite puts
// them in their own chunk, but a chunk is only fetched on demand if nothing in the
// initial graph *statically* imports it — one stray `import jsPDF from 'jspdf'`
// anywhere in the app drags the whole chunk into the first page load for every
// user, including the ones who never download a PDF. So:
//
//   * nothing outside this file may import `jspdf` or `html2canvas` by value;
//   * callers `await loadPdfLibs()` inside the click handler that needs a PDF;
//   * `src/shared/utils/pdfRuntime.test.ts` enforces the first rule on the source.
//
// The libraries are cached after the first load, and a *failed* load is not
// cached — if a student is on a flaky connection the next click retries instead
// of failing forever on a rejected promise.

export interface PdfLibs {
  jsPDF: typeof import('jspdf').jsPDF
  html2canvas: typeof import('html2canvas').default
}

export type PdfLibsLoader = () => Promise<PdfLibs>

export interface PdfLibsCache {
  /** Load (or reuse) the libraries. Safe to call on every click. */
  loadPdfLibs: () => Promise<PdfLibs>
  /** True once a load has started successfully — used by tests and telemetry only. */
  isLoaded: () => boolean
}

/**
 * Wrap a loader with "load once, retry after failure" behaviour. Exported so the
 * caching contract can be unit-tested without importing the real libraries in Node.
 */
export function createPdfLibsCache(load: PdfLibsLoader): PdfLibsCache {
  let pending: Promise<PdfLibs> | null = null

  return {
    loadPdfLibs() {
      if (!pending) {
        const started = load()
        pending = started
        started.catch(() => {
          // Only clear our own attempt — never clobber a newer one.
          if (pending === started) pending = null
        })
      }
      return pending
    },
    isLoaded() {
      return pending !== null
    },
  }
}

async function importPdfLibs(): Promise<PdfLibs> {
  const [jspdfModule, canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])

  // jspdf ships both a named and a default export depending on the bundle flavour.
  const candidate = jspdfModule as { jsPDF?: unknown; default?: unknown }
  const jsPDF = candidate.jsPDF ?? candidate.default
  if (typeof jsPDF !== 'function') {
    throw new Error('jspdf did not provide a constructor')
  }

  const html2canvas = (canvasModule as { default?: unknown }).default
  if (typeof html2canvas !== 'function') {
    throw new Error('html2canvas did not provide a callable')
  }

  return {
    jsPDF: jsPDF as PdfLibs['jsPDF'],
    html2canvas: html2canvas as PdfLibs['html2canvas'],
  }
}

const cache = createPdfLibsCache(importPdfLibs)

/** The only way the app is allowed to reach jspdf / html2canvas. */
export const loadPdfLibs = cache.loadPdfLibs

/** True once the chunk has been requested — for a spinner that must not flash. */
export const pdfLibsLoaded = cache.isLoaded

/**
 * Start the download before the user asks for it, without blocking anything.
 * Attach to a hover/focus handler when a page's primary action is a PDF export,
 * so the click itself only waits for rendering. Never used on page load: a
 * student who never downloads a PDF should never fetch these bytes.
 */
export function preloadPdfLibs(): void {
  void loadPdfLibs().catch(() => {
    // Warming is best-effort; the real click will surface any error.
  })
}
