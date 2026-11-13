import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const packRoot = path.resolve(process.cwd(), 'content/courses/digital-marketing')
const manifest = JSON.parse(readFileSync(path.join(packRoot, 'course.json'), 'utf8'))
const coursePath = '/courses/digital-marketing'
const storageKey = 'vriddhi.course.progress.guest.digital-marketing'
const coursesRoot = path.resolve(process.cwd(), 'content/courses')
const illustratedCourseCount = readdirSync(coursesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => JSON.parse(readFileSync(path.join(coursesRoot, entry.name, 'course.json'), 'utf8')))
  .filter((course) => course.illustrations).length
const isVisualDataRequest = (url: string) => {
  const parsed = new URL(url)
  return /illustrations(?:-[\w-]+)?\.json$/.test(parsed.pathname) && !parsed.searchParams.has('url')
}

/** Only anonymous, device-local public-preview progress; no fabricated auth session. */
async function unlockBefore(page: Page, targetId: string, course = manifest) {
  const progress = { read: {} as Record<string, string>, completed: {} as Record<string, string>, quiz: {} as Record<string, unknown>, moduleAssessments: {} as Record<string, unknown> }
  const at = '2026-11-13T00:00:00.000Z'
  outer: for (const module of course.modules) {
    for (const topic of module.topics) {
      if (topic.id === targetId) break outer
      progress.read[topic.id] = at
      progress.completed[topic.id] = at
      if (topic.type === 'lesson') progress.quiz[topic.id] = { score: 5, total: 5, attempts: 1, at }
    }
    progress.moduleAssessments[module.id] = { score: 10, total: 10, attempts: 1, at }
  }
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: `vriddhi.course.progress.guest.${course.id}`, value: progress })
}

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }))
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport + 2)
}

test.describe('Digital Marketing illustrated edition', () => {
  test('is discoverable without loading the visual banks into the catalog', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto('/courses')
    await expect(page.getByText('Illustrated edition', { exact: true })).toHaveCount(illustratedCourseCount)
    expect(requests.some(isVisualDataRequest)).toBe(false)
    await page.goto(coursePath)
    const banner = page.getByRole('region', { name: 'Illustrated course edition' })
    await expect(banner).toContainText('36 illustrated topics')
    await expect(banner.getByRole('img')).toBeVisible()
    await expect(banner.getByRole('link', { name: /Explore the illustrated lesson/ })).toHaveAttribute('href', `${coursePath}/learn/m1-t1`)
    expect(requests.some(isVisualDataRequest)).toBe(false)
    await expectNoOverflow(page)
  })

  test('keeps the original text, keyboard toggle, reading gate and quiz flow', async ({ page }) => {
    await page.goto(`${coursePath}/learn/m1-t1`)
    await expect(page.locator('.course-illustration')).toHaveCount(4)
    await expect(page.getByRole('heading', { name: 'Learning objectives', exact: true })).toBeVisible()
    const reading = page.locator('.course-markdown')
    const originalText = await reading.evaluate((element) => {
      const clone = element.cloneNode(true) as HTMLElement
      clone.querySelectorAll('.course-illustration').forEach((figure) => figure.remove())
      return clone.textContent
    })
    const quiz = page.getByRole('tab', { name: /^Quiz/ })
    await expect(quiz).toBeDisabled()
    const toggle = page.getByRole('switch', { name: 'Show lesson illustrations' })
    await toggle.focus()
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect(page.locator('.course-illustration')).toHaveCount(0)
    expect(await reading.textContent()).toBe(originalText)
    await page.keyboard.press('Space')
    await expect(page.locator('.course-illustration')).toHaveCount(4)
    await expect(quiz).toBeDisabled()
    const checkpoint = page.locator('.course-illustration details').last()
    await checkpoint.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(checkpoint).toHaveAttribute('open', '')
    await expect(checkpoint).toContainText('Name the audience and business goal')
    await page.getByText('End of topic · reaching this point marks the content as read', { exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByText('End of topic · content read', { exact: true })).toBeVisible()
    await expect(quiz).toBeEnabled()
    await quiz.click()
    const bank = JSON.parse(readFileSync(path.join(packRoot, 'modules/01-foundations/quiz.json'), 'utf8'))
    for (const question of bank.questions['m1-t1']) {
      await page.locator(`input[name="${question.id}"][value="${question.answerIndex}"]`).check()
    }
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('5 / 5 correct (100%)', { exact: true })).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), storageKey)
    expect(stored.read['m1-t1']).toBeTruthy()
    expect(stored.quiz['m1-t1'].score).toBe(5)
    await expectNoOverflow(page)
  })

  test('interactive funnel updates, handles zero and resets without unlocking the quiz', async ({ page }) => {
    await unlockBefore(page, 'm1-t2')
    await page.goto(`${coursePath}/learn/m1-t2`)
    const output = page.locator('.course-illustration output')
    await expect(output).toContainText('3 expected customers · CPA ₹1,000')
    const rate = page.getByRole('slider', { name: 'Enquiries rate' })
    await rate.focus()
    await rate.press('ArrowRight')
    await rate.press('ArrowRight')
    await rate.press('ArrowRight')
    await expect(output).toContainText('6 expected customers · CPA ₹500')
    await rate.press('Home')
    await expect(output).toContainText('0 expected customers · CPA not defined')
    await page.getByRole('button', { name: 'Reset scenario' }).click()
    await expect(output).toContainText('3 expected customers · CPA ₹1,000')
    await page.getByLabel('Scenario media budget (₹)').fill('6000')
    await expect(output).toContainText('CPA ₹2,000')
    const figure = page.locator('.course-illustration').filter({ has: page.locator('output') })
    await figure.getByText('View chart data', { exact: true }).click()
    await expect(figure.getByRole('columnheader', { name: 'people' })).toBeVisible()
    await expect(figure.getByRole('rowheader', { name: 'Customers', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Quiz/ })).toBeDisabled()
    await expectNoOverflow(page)
  })

  test('client-side navigation resets the visual layer for the new topic', async ({ page }) => {
    await unlockBefore(page, 'm1-t2')
    await page.goto(`${coursePath}/learn/m1-t1`)
    const toggle = page.getByRole('switch', { name: 'Show lesson illustrations' })
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await page.getByRole('button', { name: 'Next · 1.2', exact: true }).click()
    await expect(page).toHaveURL(/\/learn\/m1-t2$/)
    await expect(page.locator('.course-illustration')).toHaveCount(4)
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('.course-illustration').first()).toContainText('Five stages, five customer questions')
    await expect(page.getByRole('heading', { name: 'The attract → convert → keep loop', exact: true })).toHaveCount(0)
  })

  test('a matrix, quantitative chart and project brief work with narrow layouts', async ({ page }) => {
    await unlockBefore(page, 'm2-pb1')
    await page.goto(`${coursePath}/learn/m2-t3`)
    await expect(page.locator('.course-illustration')).toHaveCount(4)
    const matrix = page.locator('.course-illustration').last()
    await expect(matrix).toContainText('Lower effort')
    await expect(matrix).toContainText('Higher impact')
    await matrix.scrollIntoViewIfNeeded()
    await expectNoOverflow(page)
    await page.goto(`${coursePath}/learn/m1-t4`)
    await expect(page.locator('.course-illustration')).toHaveCount(4)
    await expect(page.locator('.course-illustration').first()).toContainText('Zero-based scale')
    await page.goto(`${coursePath}/learn/m2-pb1`)
    await expect(page.locator('.course-illustration')).toHaveCount(5)
    await expect(page.getByRole('heading', { name: 'What to submit', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Brief', exact: true })).toHaveAttribute('aria-selected', 'true')
    await expectNoOverflow(page)
  })

  for (const mode of ['light', 'dark'] as const) {
    test(`new visual content meets WCAG A/AA checks in ${mode} mode`, async ({ page }) => {
      await unlockBefore(page, 'm1-t2')
      await page.goto(`${coursePath}/learn/m1-t2`)
      await expect(page.locator('.course-illustration')).toHaveCount(4)
      await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), mode === 'dark')
      const results = await new AxeBuilder({ page })
        .include('.course-visual-intro')
        .include('.course-illustration')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      expect(results.violations.map((violation) => ({ rule: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([])
      await expectNoOverflow(page)
    })
  }

  test('a failed visual download leaves the reading usable and offers a retry', async ({ page }) => {
    const visualRequest = (url: URL) => url.pathname.endsWith('/01-foundations/illustrations.json') && !url.searchParams.has('url')
    await page.route(visualRequest, (route) => route.abort('failed'))
    await page.goto(`${coursePath}/learn/m1-t1`)
    await expect(page.getByText('The visual companion could not be loaded.', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learning objectives', exact: true })).toBeVisible()
    await expect(page.locator('.course-illustration')).toHaveCount(0)
    await page.unroute(visualRequest)
    await page.getByRole('button', { name: 'Retry illustrations' }).click()
    await expect(page.locator('.course-illustration')).toHaveCount(4)
  })
})

const pmRoot = path.join(coursesRoot, 'project-management')
const pmManifest = JSON.parse(readFileSync(path.join(pmRoot, 'course.json'), 'utf8'))
const pmPath = '/courses/project-management'
const pmStorageKey = 'vriddhi.course.progress.guest.project-management'

async function originalReadingText(page: Page) {
  return page.locator('.course-markdown').evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement
    clone.querySelectorAll('.course-illustration').forEach((figure) => figure.remove())
    return clone.textContent
  })
}

const scheduleLab = (page: Page) => page.locator('.course-schedule').filter({ has: page.getByRole('slider') })

test.describe('Project Management illustrated edition', () => {
  test('has its own overview artwork and lazy discoverability', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto('/courses')
    await expect(page.getByText('Illustrated edition', { exact: true })).toHaveCount(illustratedCourseCount)
    expect(requests.some(isVisualDataRequest)).toBe(false)
    await page.goto(pmPath)
    const banner = page.getByRole('region', { name: 'Illustrated course edition' })
    await expect(banner).toContainText('29 illustrated topics')
    await expect(banner).toContainText('Interactive schedule lab')
    await expect(banner).not.toContainText('funnel')
    await expect(banner.getByRole('img', { name: /project delivery dashboard/ })).toBeVisible()
    await expect(banner.getByRole('link', { name: /Explore the illustrated lesson/ })).toHaveAttribute('href', `${pmPath}/learn/m1-t1`)
    expect(requests.some(isVisualDataRequest)).toBe(false)
    await expectNoOverflow(page)
  })

  test('preserves text-only reading, keyboard checks and the original quiz gate', async ({ page }) => {
    await page.goto(`${pmPath}/learn/m1-t1`)
    await expect(page.locator('.course-illustration')).toHaveCount(3)
    const original = await originalReadingText(page)
    const quiz = page.getByRole('tab', { name: /^Quiz/ })
    await expect(quiz).toBeDisabled()
    const toggle = page.getByRole('switch', { name: 'Show lesson illustrations' })
    await toggle.focus()
    await toggle.press('Space')
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect(page.locator('.course-illustration')).toHaveCount(0)
    expect(await page.locator('.course-markdown').textContent()).toBe(original)
    await toggle.press('Space')
    await expect(page.locator('.course-illustration')).toHaveCount(3)
    const checkpoint = page.locator('.course-illustration').last().locator('details')
    await checkpoint.locator('summary').focus()
    await checkpoint.locator('summary').press('Enter')
    await expect(checkpoint).toHaveAttribute('open', '')
    await expect(checkpoint).toContainText('Eight hours is the synthetic handling-time forecast')
    await expect(quiz).toBeDisabled()
    await page.getByText('End of topic · reaching this point marks the content as read', { exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByText('End of topic · content read', { exact: true })).toBeVisible()
    await expect(quiz).toBeEnabled()
    await quiz.click()
    const bank = JSON.parse(readFileSync(path.join(pmRoot, 'modules/01-project-foundations-and-stakeholder-decisions/quiz.json'), 'utf8'))
    for (const question of bank.questions['m1-t1']) await page.locator(`input[name="${question.id}"][value="${question.answerIndex}"]`).check()
    await page.getByRole('button', { name: 'Check answers' }).click()
    await expect(page.getByText('5 / 5 correct (100%)', { exact: true })).toBeVisible()
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), pmStorageKey)
    expect(stored.read['m1-t1']).toBeTruthy()
    expect(stored.quiz['m1-t1'].score).toBe(5)
    await expectNoOverflow(page)
  })

  test('schedule sandbox recalculates float, critical work and the resource-constrained finish', async ({ page }) => {
    await unlockBefore(page, 'm2-t2', pmManifest)
    await page.goto(`${pmPath}/learn/m2-t2`)
    await expect(page.locator('.course-illustration')).toHaveCount(3)
    const original = await originalReadingText(page)
    const lab = scheduleLab(page)
    const output = lab.locator('output')
    await expect(output).toHaveText('Earliest finish: day 14 · Critical tasks: A, B, D, E, F, G, H')
    const c = lab.getByRole('slider', { name: /^C · Test cases and staff guide duration/ })
    await c.focus()
    await c.press('ArrowLeft')
    await expect(c).toHaveValue('2')
    await expect(output).toContainText('day 14')
    await lab.getByRole('button', { name: 'Reset schedule' }).click()
    await c.focus()
    await c.press('ArrowRight')
    await c.press('ArrowRight')
    await expect(output).toHaveText('Earliest finish: day 15 · Critical tasks: A, C, D, E, F, G, H')
    await c.press('End')
    await expect(c).toHaveValue('20')
    await expect(output).toContainText('day 30')
    await lab.getByRole('button', { name: 'Reset schedule' }).click()
    const specialist = lab.getByRole('checkbox', { name: /One specialist/ })
    await specialist.focus()
    await specialist.press('Space')
    await expect(output).toHaveText('Earliest finish: day 17 · Critical tasks: A, B, C, D, E, F, G, H')
    await lab.getByRole('button', { name: 'Dependencies', exact: true }).click()
    await expect(lab.getByRole('button', { name: 'Dependencies', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(lab.getByRole('img', { name: /Finish-to-start dependency network/ })).toBeVisible()
    const network = lab.getByRole('region', { name: /^Dependency network/ })
    await network.focus()
    await network.press('ArrowRight')
    await expect.poll(() => network.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    await lab.getByText('View schedule calculations and task details', { exact: true }).click()
    await expect(lab.getByRole('columnheader', { name: 'Float', exact: true })).toBeVisible()
    await expect(lab.getByRole('rowheader', { name: /H · Handover and closure/ })).toBeVisible()
    expect(await originalReadingText(page)).toBe(original)
    await expectNoOverflow(page)
    await lab.getByRole('button', { name: 'Reset schedule' }).click()
    await expect(output).toContainText('day 14')
    await expect(specialist).not.toBeChecked()
    await expect(c).toHaveValue('3')
    await expect(lab.getByRole('button', { name: 'Timeline', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('tab', { name: /^Quiz/ })).toBeDisabled()
  })

  test('topic navigation restores the visual layer and resets the schedule scenario', async ({ page }) => {
    await unlockBefore(page, 'm2-t3', pmManifest)
    await page.goto(`${pmPath}/learn/m2-t2`)
    const lab = scheduleLab(page)
    await lab.getByRole('checkbox', { name: /One specialist/ }).check()
    await expect(lab.locator('output')).toContainText('day 17')
    await page.getByRole('switch', { name: 'Show lesson illustrations' }).click()
    await expect(page.locator('.course-illustration')).toHaveCount(0)
    await page.getByRole('button', { name: 'Next · 2.3', exact: true }).click()
    await expect(page).toHaveURL(/\/learn\/m2-t3$/)
    await expect(page.locator('.course-illustration')).toHaveCount(3)
    await expect(page.getByRole('switch', { name: 'Show lesson illustrations' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('heading', { name: 'Forecasting does not rewrite approval', exact: true })).toBeVisible()
    await page.getByRole('link', { name: /Previous$/ }).click()
    await expect(scheduleLab(page).locator('output')).toContainText('day 14')
    await expect(scheduleLab(page).getByRole('checkbox', { name: /One specialist/ })).not.toBeChecked()
  })

  test('RACI tables and work boards remain readable on narrow screens', async ({ page }) => {
    await unlockBefore(page, 'm4-t3', pmManifest)
    await page.goto(`${pmPath}/learn/m1-t3`)
    const raci = page.locator('.course-raci')
    await expect(raci.getByRole('columnheader', { name: 'Sponsor', exact: true })).toBeVisible()
    await expect(raci.getByRole('rowheader', { name: /Pilot acceptance/ })).toBeVisible()
    await expect(raci.getByRole('cell', { name: 'Accountable', exact: true })).toHaveCount(1)
    await expect(raci.getByRole('cell', { name: 'Responsible and Accountable', exact: true })).toHaveCount(1)
    await raci.scrollIntoViewIfNeeded()
    const roleTable = raci.getByRole('region', { name: /^RACI responsibility table/ })
    if (await roleTable.evaluate((element) => element.scrollWidth > element.clientWidth)) {
      await roleTable.focus()
      await roleTable.press('ArrowRight')
      await expect.poll(() => roleTable.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    }
    await expectNoOverflow(page)
    await page.goto(`${pmPath}/learn/m4-t3`)
    const board = page.locator('.course-board')
    await expect(board).toContainText('4 / limit 3')
    await expect(board).toContainText('WIP limit exceeded')
    await expect(board).toContainText('Blocked · still counts in WIP')
    await expect(board).toContainText('Active WIP here: 5 items, including 1 blocked')
    await board.scrollIntoViewIfNeeded()
    await expectNoOverflow(page)
  })

  test('risk, cost and nine-section project visuals preserve the original brief', async ({ page }) => {
    await unlockBefore(page, 'm8-cap', pmManifest)
    await page.goto(`${pmPath}/learn/m5-t1`)
    await expect(page.locator('.course-illustration')).toHaveCount(3)
    const matrix = page.locator('.course-illustration').nth(1)
    await expect(matrix).toContainText('Lower likelihood')
    await expect(matrix).toContainText('Higher consequence')
    await expect(matrix).toContainText('not 12%')
    await matrix.scrollIntoViewIfNeeded()
    await expectNoOverflow(page)
    await page.goto(`${pmPath}/learn/m2-t3`)
    const forecast = page.locator('.course-illustration').nth(1)
    await expect(forecast).toContainText('Zero-based scale · ₹')
    await expect(forecast).toContainText('40,000')
    await forecast.getByText('View chart data', { exact: true }).click()
    await expect(forecast.getByRole('rowheader', { name: 'Estimate at completion (EAC)', exact: true })).toBeVisible()
    await page.goto(`${pmPath}/learn/m2-pb1`)
    await expect(page.locator('.course-illustration')).toHaveCount(9)
    await expect(page.getByRole('heading', { name: 'What to submit', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Brief', exact: true })).toHaveAttribute('aria-selected', 'true')
    const original = await originalReadingText(page)
    await page.getByRole('switch', { name: 'Show lesson illustrations' }).click()
    expect(await page.locator('.course-markdown').textContent()).toBe(original)
    await page.goto(`${pmPath}/learn/m8-cap`)
    await expect(page.locator('.course-illustration')).toHaveCount(9)
    await expect(page.getByRole('heading', { name: 'Rubric', exact: true })).toBeVisible()
    await expectNoOverflow(page)
  })

  for (const mode of ['light', 'dark'] as const) {
    test(`schedule, RACI, board and risk visuals meet WCAG A/AA in ${mode} mode`, async ({ page }) => {
      test.setTimeout(90_000)
      await unlockBefore(page, 'm5-t1', pmManifest)
      for (const topic of ['m2-t2', 'm1-t3', 'm4-t3', 'm5-t1']) {
        await page.goto(`${pmPath}/learn/${topic}`)
        await expect(page.locator('.course-illustration')).toHaveCount(3)
        await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), mode === 'dark')
        if (topic === 'm2-t2') {
          const lab = scheduleLab(page)
          await lab.getByRole('checkbox', { name: /One specialist/ }).check()
          await lab.getByText('View schedule calculations and task details', { exact: true }).click()
        }
        const results = await new AxeBuilder({ page })
          .include('.course-visual-intro')
          .include('.course-illustration')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        expect(results.violations.map((violation) => ({ topic, rule: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([])
        await expectNoOverflow(page)
      }
    })
  }

  test('a failed PM companion download preserves reading and retries independently', async ({ page }) => {
    const request = (url: URL) => url.pathname.endsWith('/01-project-foundations-and-stakeholder-decisions/illustrations.json') && !url.searchParams.has('url')
    await page.route(request, (route) => route.abort('failed'))
    await page.goto(`${pmPath}/learn/m1-t1`)
    await expect(page.getByText('The visual companion could not be loaded.', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learning objectives', exact: true })).toBeVisible()
    await expect(page.locator('.course-illustration')).toHaveCount(0)
    await page.unroute(request)
    await page.getByRole('button', { name: 'Retry illustrations' }).click()
    await expect(page.locator('.course-illustration')).toHaveCount(3)
    await expectNoOverflow(page)
  })
})
