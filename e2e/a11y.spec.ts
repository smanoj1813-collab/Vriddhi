import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Accessibility of the first screen every user meets.
 *
 * §8 of the audit noted that accessibility had never been assessed beyond
 * observing the absence of automated checks, and suggested an axe pass as the
 * natural follow-up. This is that pass, scoped to what exists without a backend:
 * the login screen, on both a desktop and a phone-sized viewport.
 *
 * The gate is deliberately narrow. Only `critical` violations fail the build —
 * those are the ones that make a control unusable with a screen reader or a
 * keyboard (an input with no accessible name, invalid ARIA, a duplicate id). The
 * rest are reported as annotations: most of the plausible remainder on this
 * screen is colour contrast, and "fix contrast" is a design decision about the
 * brand palette, not something to silently change in a security PR.
 */
test.describe('login screen accessibility', () => {
  test('has no critical violations', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()

    const results = await new AxeBuilder({ page })
      // The whole page: the login screen is one route, and there is no third-party
      // embed on it whose violations would be out of our hands.
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const rest = results.violations.filter((v) => v.impact !== 'critical')

    // Surfaced as annotations: the job summary is readable from places the raw
    // log is not.
    for (const violation of rest) {
      console.log(
        `::warning title=axe (${violation.impact})::${violation.id} — ${violation.help} (${violation.nodes.length} node(s))`,
      )
    }

    expect(
      critical.map((v) => `${v.id} [${v.impact}] ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      'critical accessibility violations on the login screen',
    ).toEqual([])
  })

  test('the form is reachable and usable by keyboard alone', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Tab order is the thing a keyboard-only user lives in, and no unit test can
    // see it. Focus must land on the email field, then the password field, then
    // reach the submit button without getting trapped.
    await page.keyboard.press('Tab')
    const seen: string[] = []
    for (let i = 0; i < 12; i += 1) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el) return 'none'
        const type = el.getAttribute('type')
        return `${el.tagName.toLowerCase()}${type ? `:${type}` : ''}`
      })
      seen.push(focused)
      if (focused === 'button:submit') break
      await page.keyboard.press('Tab')
    }

    expect(seen, `tab order was: ${seen.join(' → ')}`).toContain('input:email')
    expect(seen, `tab order was: ${seen.join(' → ')}`).toContain('input:password')
    expect(seen, `tab order was: ${seen.join(' → ')}`).toContain('button:submit')
  })
})
