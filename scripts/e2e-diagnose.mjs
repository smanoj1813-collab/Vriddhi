// Why did the browser suite fail?
//
// This exists because the answer is normally in a job log, and this pipeline's
// logs are not reliably reachable from where it is read. So the diagnosis is
// produced as *annotations*: the URL, the title, the visible text, and the first
// console/page errors, captured from the app's own boot in a real browser.
//
// Run automatically by CI only when the Playwright suite fails. It starts its own
// dev server, because Playwright's webServer is torn down with the test run.
import { spawn } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const PORT = 4174
const url = `http://127.0.0.1:${PORT}/`
const lines = []

const say = (text) => {
  lines.push(text)
  // Multi-line values are flattened: an annotation is one line, and a truncated
  // one is worth more than none.
  console.log(`::error title=Boot diagnosis::${String(text).replace(/\s+/g, ' ').slice(0, 400)}`)
}

const server = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
  env: {
    ...process.env,
    VITE_FIREBASE_API_KEY: 'demo-e2e-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo-vriddhi.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'demo-vriddhi',
    VITE_FIREBASE_APP_ID: '1:1:web:1',
    VITE_FIREBASE_STORAGE_BUCKET: 'demo-vriddhi.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
    VITE_FIREBASE_DATABASE_URL: 'https://demo-vriddhi.firebaseio.com',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

const serverLog = []
server.stdout.on('data', (d) => serverLog.push(String(d)))
server.stderr.on('data', (d) => serverLog.push(String(d)))

const waitForServer = async () => {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

try {
  if (!(await waitForServer())) {
    say(`dev server never answered on ${url}`)
    say(serverLog.join('').slice(-600))
    process.exit(0)
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()
  const events = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') events.push(`${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => events.push(`pageerror: ${e.message}`))

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch((e) => say(`goto: ${e.message}`))
  await page.waitForTimeout(5_000)

  say(`url after boot: ${page.url()}`)
  say(`title: ${await page.title()}`)
  say(`root children: ${await page.evaluate(() => document.getElementById('root')?.childElementCount ?? -1)}`)
  const text = await page.evaluate(() => document.body.innerText || '')
  say(`visible text: ${text.slice(0, 300) || '(none)'}`)
  for (const e of events.slice(0, 6)) say(e)

  await browser.close()
} catch (error) {
  say(`diagnose script failed: ${error.message}`)
} finally {
  server.kill('SIGTERM')
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Boot diagnosis\n\n${lines.join('\n')}\n`)
  }
}
