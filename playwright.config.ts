// Browser smoke tests — the one thing this repository never had.
//
// The render harness mounts components in jsdom-ish isolation and the unit
// suites test pure logic, so nothing here has ever verified that the app
// actually boots in a browser: that `/` lands on the login screen, that a deep
// link to a guarded route bounces, that the language switch repaints in
// Kannada, or that a 390 px phone does not scroll sideways.
//
// These tests intentionally stop at the sign-in wall. There is no Firebase
// project (and no emulator: the emulator archives cannot be fetched in this
// environment), so anything behind auth cannot be reached honestly. Faking a
// session would test the fake, not the app — the authenticated contract is
// covered by the render harness and the emulator rules suite instead.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    // Consumed by scripts/e2e-annotate.mjs, because job logs are not always
    // reachable from the environment that reads this pipeline.
    ['json', { outputFile: 'e2e-results.json' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // A budget Android in portrait: the audience this product is sold to.
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dev, not preview: `main.tsx` only renders the app when the Firebase env is
    // present OR the build is non-production, and CI has no Firebase project.
    // A dev-server smoke test therefore exercises the real router, the real
    // guards and the real i18n wiring without pretending to have a backend.
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
