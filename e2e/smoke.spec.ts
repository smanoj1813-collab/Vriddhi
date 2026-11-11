import { expect, test } from '@playwright/test'

// Kannada block. Asserted as a range rather than a string so a translator
// editing the wording does not break the test — the property under test is
// "the dictionary reached the DOM", not one sentence.
const KANNADA = /[\u0C80-\u0CFF]/

/**
 * Uncaught errors that are expected without a backend.
 *
 * The app boots with placeholder Firebase config in CI (there is no project to
 * point at), so the Auth SDK fails its first call. Those rejections are handled
 * by the app's own error paths; what must never happen is a *render* crash, an
 * undefined property, or a router failure. So the filter below excludes only the
 * Firebase/auth noise and fails on everything else.
 */
const EXPECTED_WITHOUT_BACKEND = /firebase|auth\/|Firestore|Firestore|permission-denied|api-key|network|Failed to fetch/i

test.describe('the app boots', () => {
  test('lands an anonymous visitor on the login screen', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeEnabled()
  })

  test('bounces a guarded deep link back to /login', async ({ page }) => {
    // The guard has to survive a cold load, not just an in-app click: this is
    // the path a bookmarked admin URL takes.
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('bounces a guarded student deep link back to /login', async ({ page }) => {
    await page.goto('/student/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('repaints in Kannada when the language is switched', async ({ page }) => {
    await page.goto('/login')
    const switcher = page.locator('select').first()
    await expect(switcher).toBeVisible()

    // The submit button, not the body: the <select>'s own option labels are
    // native names (ಕನ್ನಡ, தமிழ் …), so a whole-page Kannada assertion would
    // pass before anything was even switched.
    const submit = page.locator('button[type="submit"]')
    await expect(submit).toContainText('Sign In to Staff Portal')

    await switcher.selectOption('kn')
    await expect(submit).toContainText(KANNADA)

    // …and the choice is remembered, so a reload keeps it.
    await page.reload()
    await expect(page.locator('button[type="submit"]')).toContainText(KANNADA)
  })

  test('renders without scrolling sideways on a 390 px phone', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth }
    })
    // 2 px of tolerance for sub-pixel rounding; anything more is a layout bug a
    // student on a budget phone would hit immediately.
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 2)
  })

  test('throws nothing unexpected while booting', async ({ page }) => {
    const unexpected: string[] = []
    page.on('pageerror', (error) => {
      const text = `${error.name}: ${error.message}`
      if (!EXPECTED_WITHOUT_BACKEND.test(text)) unexpected.push(text)
    })

    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    // Give the auth restore a beat to reject against the placeholder config.
    await page.waitForTimeout(1_500)

    expect(unexpected, `uncaught errors during boot:\n${unexpected.join('\n')}`).toEqual([])
  })
})
