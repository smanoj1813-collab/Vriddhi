import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// These checks stay anonymous. Authentication/role decisions and reset results
// are exercised by test:render:auth with I/O fixtures, never a live account.
for (const { route, other, active, submit } of [
  { route: '/login', other: '/student/login', active: 'Staff & Faculty', submit: 'Sign In to Staff Portal' },
  { route: '/student/login', other: '/login', active: 'Student Portal', submit: 'Sign In as Student' },
]) {
  test.describe(`${route} illustrated sign-in`, () => {
    test('keeps password, local recovery guidance and portal navigation usable', async ({ page }) => {
      await page.goto(route)
      await expect(page.getByRole('heading', { name: 'Welcome back.', exact: true })).toBeVisible()
      await expect(page.locator('nav [aria-current="page"]')).toHaveText(active)
      await expect(page.getByRole('button', { name: submit, exact: true })).toBeEnabled()
      // The campus illustration is decorative; it must not enter the tab or
      // screen-reader reading order in front of the actual form.
      await expect(page.locator('.auth-art')).toHaveAttribute('aria-hidden', 'true')
      await expect(page.locator('.auth-art > svg')).toHaveAttribute('focusable', 'false')
      await expect(page.getByRole('img')).toHaveCount(0)

      await page.getByRole('button', { name: 'Forgot?', exact: true }).click()
      await expect(page.locator('.auth-card [role="status"]')).toContainText('Enter your account email above first')
      const password = page.locator('input[autocomplete="current-password"]')
      await password.fill('dummy-test-password')
      await page.getByRole('button', { name: 'Show password', exact: true }).click()
      await expect(password).toHaveAttribute('type', 'text')
      await expect(password).toHaveValue('dummy-test-password')
      await expect(page.getByRole('button', { name: 'Hide password', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Hide password', exact: true }).click()
      await expect(password).toHaveAttribute('type', 'password')

      await page.locator(`.auth-portals a[href="${other}"]`).click()
      await expect(page).toHaveURL(new RegExp(`${other}$`))
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await page.getByRole('link', { name: 'Back to homepage', exact: true }).click()
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Less busywork.')
    })

    test('has readable text contrast in both light and dark mode', async ({ page }) => {
      test.setTimeout(60_000) // Two complete axe audits, including a theme reload.
      await page.goto(route)
      for (const mode of ['light', 'dark']) {
        if (mode === 'dark') {
          await page.evaluate(() => localStorage.setItem('vriddhi-theme-mode', 'dark'))
          await page.reload()
        }
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('html')).toHaveClass(mode === 'dark' ? /dark/ : /^(?!.*\bdark\b)/)
        const result = await new AxeBuilder({ page }).include('.auth-page').withRules(['color-contrast']).analyze()
        expect(result.violations, `${mode} sign-in text contrast`).toEqual([])
      }
    })

    test('fits a 320 px screen in every supported language without sideways scrolling', async ({ page }) => {
      test.setTimeout(60_000) // Six locale/font changes in the same narrow layout.
      await page.setViewportSize({ width: 320, height: 780 })
      await page.goto(route)
      const switcher = page.locator('.auth-header select')
      for (const language of ['en', 'hi', 'kn', 'ta', 'te', 'ml']) {
        await switcher.selectOption(language)
        await expect(page.locator('html')).toHaveAttribute('data-language', language)
        const sizes = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }))
        expect(sizes.content, `${language} on 320 px`).toBeLessThanOrEqual(sizes.width + 2)
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()
      }
    })

    test('honours reduced motion while keeping the illustration and form visible', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('.auth-art > svg')).toBeVisible()
      const animations = await page.locator('.auth-page').evaluate(el => el.getAnimations({ subtree: true }).length)
      expect(animations).toBe(0)
    })

    test('plays a brief greeting then settles instead of looping indefinitely', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto(route)
      await expect(page.locator('input[type="email"]')).toBeVisible()
      const timings = await page.locator('.auth-art').evaluate(el => el.getAnimations({ subtree: true }).map(animation => {
        const effect = animation.effect!
        return { iterations: effect.getTiming().iterations, endTime: effect.getComputedTiming().endTime }
      }))
      expect(timings.length).toBeGreaterThan(0)
      for (const timing of timings) {
        expect(Number.isFinite(timing.iterations)).toBe(true)
        expect(Number(timing.endTime)).toBeLessThanOrEqual(5000)
      }
      await page.waitForTimeout(4700)
      const running = await page.locator('.auth-art').evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)
      expect(running).toBe(0)
    })
  })
}
