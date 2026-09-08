// functions/.puppeteerrc.cjs
//
// Puppeteer configuration for the `api` Cloud Function.
//
// By default Puppeteer downloads Chrome into ~/.cache/puppeteer during
// `npm install`. On Cloud Functions that directory does not survive into the
// runtime container, so `puppeteer.launch()` fails with "Could not find
// Chrome". Following the official guidance for Google Cloud Functions
// (https://pptr.dev/troubleshooting#running-puppeteer-on-google-cloud-functions)
// we keep the cache under node_modules/, which Cloud Build both preserves
// between builds and ships with the deployed bundle.
//
// Precedence at runtime (see src/utils/pdfRenderer.ts → resolveChromePath):
//   CHROME_PATH → PUPPETEER_EXECUTABLE_PATH → this cache → /usr/bin/chromium…
//
// Local dev / CI: set PUPPETEER_SKIP_DOWNLOAD=true (or `npm i --ignore-scripts`)
// to skip the ~150 MB download; PDF routes then answer
// 503 { error: 'pdf_renderer_unavailable', fallback: 'client' } and the web
// app renders the PDF in the browser instead.
const { join } = require('path')

/** @type {import('puppeteer').Configuration} */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
}
