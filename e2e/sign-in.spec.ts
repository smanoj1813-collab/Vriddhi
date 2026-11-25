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
      // The sign-in art is now an interactive 3D campus, so it is announced
      // rather than hidden — but it must stay *after* the form in the document
      // order so it never comes between a keyboard user and the email field.
      const art = page.locator('.auth-art')
      await expect(art).not.toHaveAttribute('aria-hidden', 'true')
      await expect(art.locator('svg.campus3d-svg')).toHaveAttribute('role', 'img')
      await expect(art.locator('[role="group"][aria-label]')).toHaveCount(1)
      // The illustration must add no tab stop ahead of the email field. (The
      // brand link and language switcher in the header legitimately come
      // first, so assert the artwork's own contribution rather than Tab order.)
      await expect(art.locator('a[href], button, [tabindex="0"]')).toHaveCount(0)
      const artBeforeForm = await page.evaluate(() => {
        const art = document.querySelector('.auth-art')
        const form = document.querySelector('.auth-card')
        if (!art || !form) return null
        return !!(art.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING)
      })
      expect(artBeforeForm).toBe(true)
      // And the form stays reachable and first-tab-focusable among the fields.
      const email = page.locator('input#login-email')
      await email.focus()
      await expect(email).toBeFocused()

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
      await expect(page.locator('.auth-art svg.campus3d-svg')).toBeVisible()
      const animations = await page.locator('.auth-page').evaluate(el => el.getAnimations({ subtree: true }).length)
      expect(animations).toBe(0)
    })

    test('plays a brief greeting then settles instead of looping indefinitely', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto(route)
      await expect(page.locator('input[type="email"]')).toBeVisible()

      // Snapshot the entrance as it happens rather than sampling it cold: it is
      // driven by requestAnimationFrame and may already have finished by the
      // time we look, which would leave only the (intentionally unbounded)
      // ambient sway on screen.
      await page.evaluate(() => {
        const art = document.querySelector('.auth-art')!
        const seen: { iterations: number; endTime: number }[] = []
        ;(window as any).__greetingTimings = seen
        const collect = () => {
          for (const animation of art.getAnimations({ subtree: true })) {
            const effect = animation.effect as KeyframeEffect | null
            if (!effect) continue
            seen.push({
              iterations: effect.getTiming().iterations as number,
              endTime: Number(effect.getComputedTiming().endTime),
            })
          }
        }
        collect()
        // Re-read on every frame for the entrance's duration.
        let frames = 0
        const tick = () => { collect(); if (++frames < 90) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
      await page.waitForTimeout(1800)
      const timings = await page.evaluate(() => (window as any).__greetingTimings as { iterations: number; endTime: number }[])
      expect(timings.length).toBeGreaterThan(0)

      // Every CSS entrance belongs to the greeting: finite, and over in under
      // five seconds.
      const greetings = timings.filter((timing) => Number.isFinite(timing.iterations))
      expect(greetings.length).toBeGreaterThan(0)
      for (const timing of greetings) {
        expect(Number(timing.endTime)).toBeLessThanOrEqual(5000)
      }
      // Nothing from the greeting is still running once it has settled. The
      // scene's ambient sway is intentionally unbounded and stops under
      // reduced motion (covered by the neighbouring test), so this looks
      // specifically at finite animations rather than requiring a silent page.
      const running = await page.locator('.auth-art').evaluate(el =>
        el.getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running')
          .filter((animation) => Number.isFinite((animation.effect as KeyframeEffect).getTiming().iterations as number))
          .map((animation) => (animation as any).animationName ?? 'unnamed'))
      expect(running).toEqual([])
    })
  })
}
