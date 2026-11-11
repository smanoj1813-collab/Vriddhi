// Turn a Playwright JSON report into check-run annotations and a job summary.
//
// Same reason as the rules-suite reporter: this pipeline's job logs are not
// always reachable from wherever the result is being read, so the failures are
// pushed into the checks API and the step summary instead of being buried in a
// scrolling log.
import { readFileSync, existsSync, appendFileSync } from 'node:fs'

const path = process.argv[2] || 'e2e-results.json'
if (!existsSync(path)) {
  console.log('::notice title=Playwright::no report file was produced — the run probably never started')
  process.exit(0)
}

const report = JSON.parse(readFileSync(path, 'utf8'))

// Playwright's JSON reporter spells a test's outcome two different ways
// depending on the field: `test.status` is expected/unexpected/flaky/skipped,
// while `results[].status` is passed/failed/timedOut/skipped/interrupted. The
// first version of this script compared the *results* spelling against
// 'expected', so every passing test was annotated as a failure — 12 red
// annotations on a green run. Accept both spellings, and only report a test that
// actually failed.
const outcomeOf = (test) => {
  if (test.status) return test.status
  const last = test.results?.[test.results.length - 1]?.status ?? 'unknown'
  return last === 'passed' ? 'expected' : last === 'skipped' ? 'skipped' : 'unexpected'
}

const walk = (suite, out = []) => {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const state = outcomeOf(t)
      if (state === 'unexpected' || state === 'failed' || state === 'timedOut') {
        const error = t.results?.flatMap((r) => r.errors?.map((e) => e.message) ?? []).join(' ') ?? ''
        out.push({ title: [suite.title, spec.title].filter(Boolean).join(' › '), state, error })
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, out)
  return out
}

const failures = (report.suites ?? []).flatMap((s) => walk(s))
const stats = report.stats ?? {}
const passed = stats.expected ?? 0
const total = passed + (stats.unexpected ?? 0) + (stats.flaky ?? 0) + (stats.skipped ?? 0)

console.log(`::notice title=Playwright::${passed}/${total} browser checks passed`)

if (!failures.length) process.exit(0)

const lines = ['### Browser smoke tests failed', '']
for (const f of failures) {
  const first = f.error.split('\n').find((l) => l.trim()) ?? f.state
  lines.push(`- **${f.title}** — ${f.state}: ${first.slice(0, 300)}`)
  console.log(`::error title=Playwright::${f.title} — ${first.slice(0, 400)}`)
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
}
