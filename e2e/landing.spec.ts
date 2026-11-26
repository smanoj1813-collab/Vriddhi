import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'

const ROLES = [
  { label: 'Principal', heading: 'Lead with a clearer view.', href: '/login?role=principal' },
  { label: 'HOD', heading: 'Keep your department in step.', href: '/login?role=hod' },
  { label: 'Faculty', heading: 'Make room for the teaching.', href: '/login?role=faculty' },
  { label: 'Operations', heading: 'Keep the everyday running smoothly.', href: '/login?role=operations' },
  { label: 'Finance', heading: 'Bring order to the numbers.', href: '/login?role=finance' },
  { label: 'Students', heading: 'Your campus life. Your next chapter.', href: '/student/login' },
]

test.describe('public landing page', () => {
  test('shows the 3D campus and exactly six working role entry points', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Less busywork.')
    await expect(page.getByRole('img', { name: /three-dimensional college campus/ })).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(6)

    for (const role of ROLES) {
      const tab = page.getByRole('tab', { name: new RegExp(`^${role.label}`) })
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByRole('tabpanel')).toContainText(role.heading)
      const signInLabel = role.label === 'Students' ? 'Student' : role.label
      await expect(page.getByRole('link', { name: `Sign in as ${signInLabel}`, exact: true })).toHaveAttribute('href', role.href)
    }
  })

  test('role tabs support arrow keys, Home and End', async ({ page }) => {
    await page.goto('/')
    const principal = page.getByRole('tab', { name: /^Principal/ })
    await principal.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /^HOD/ })).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.getByRole('tab', { name: /^Students/ })).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(principal).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: /^Students/ })).toBeFocused()
    await page.keyboard.press('Home')
    await expect(principal).toBeFocused()
  })

  test('mentions upskilling without exposing course titles or catalog links', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto('/')
    await expect(page.getByText('UPSKILL COURSES AVAILABLE', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Access your courses' })).toHaveAttribute('href', '/student/login?next=courses')

    const contentRoot = path.resolve(process.cwd(), 'content/courses')
    const titles = fs.readdirSync(contentRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const manifest = path.join(contentRoot, entry.name, 'course.json')
        if (!fs.existsSync(manifest)) return []
        const title = JSON.parse(fs.readFileSync(manifest, 'utf8')).title
        return typeof title === 'string' ? [title] : []
      })
    expect(titles.length).toBeGreaterThan(0)
    const body = await page.locator('body').innerText()
    for (const title of titles) expect(body).not.toContain(title)
    await expect(page.locator('a[href^="/courses/"]')).toHaveCount(0)
    await expect(page.locator('a[href^="/prep/"]')).toHaveCount(0)
    expect(requests.filter((url) => /content\/courses|courseCatalog/.test(url))).toEqual([])

    await page.getByRole('link', { name: 'Access your courses' }).click()
    await expect(page).toHaveURL(/\/student\/login\?next=courses$/)
    await expect(page.getByText('Sign in to explore the upskill courses assigned to your college.')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('FAQ answers expand and collapse', async ({ page }) => {
    await page.goto('/')
    const question = page.getByText('Who is Vriddhi for?', { exact: true })
    await question.click()
    await expect(page.getByText(/Vriddhi brings principals, HODs, faculty, operations, finance, and students/)).toBeVisible()
    await question.click()
    await expect(page.getByText(/Vriddhi brings principals, HODs, faculty, operations, finance, and students/)).toBeHidden()
  })

  test('mobile navigation opens, follows a section link, and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Open navigation' })
    await toggle.click()
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(nav).toBeVisible()
    await nav.getByRole('link', { name: 'Upskilling' }).click()
    await expect(nav).toBeHidden()
    await expect(page).toHaveURL(/#upskilling$/)
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
    await expect(nav).toBeHidden()
  })

  test('has no horizontal overflow from small phones to desktops', async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }))
      expect(dimensions.scroll, `overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 2)
    }
  })

  test('has no WCAG A/AA axe violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([])
  })

  test('platform cards drill down into details and return focus on Escape', async ({ page }) => {
    await page.goto('/')
    const dialog = page.getByRole('dialog')
    const areas = [
      { trigger: 'Explore academics', title: 'Academics, in step.' },
      { trigger: 'Explore assessments', title: 'Assessments, simplified.' },
      { trigger: 'Explore operations', title: 'Operations, connected.' },
    ]
    for (const area of areas) {
      const trigger = page.getByRole('button', { name: area.trigger, exact: true })
      await trigger.click()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('heading', { name: area.title })).toBeVisible()
      await expect(dialog.getByText('What’s inside')).toBeVisible()
      await expect(dialog.locator('.landing-dialog-scene')).toBeVisible()
      await expect(dialog.locator('.landing-dialog-highlight-icon')).toHaveCount(4)
      await expect(dialog.locator('.landing-dialog-step-icon')).toHaveCount(3)
      await expect(dialog.locator('.landing-dialog-roles li svg')).toHaveCount(await dialog.locator('.landing-dialog-roles li').count())
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
    }
  })

  test('each role can drill down without exposing extra roles', async ({ page }) => {
    await page.goto('/')
    const dialog = page.getByRole('dialog')
    const allowedLabels = ROLES.map((role) => role.label)
    for (const role of ROLES) {
      await page.getByRole('tab', { name: new RegExp(`^${role.label}`) }).click()
      const trigger = page.getByRole('button', { name: `Explore workspace (${role.label})` })
      await trigger.click()
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('What’s inside')).toBeVisible()
      const chips = await dialog.locator('.landing-dialog-roles li').allTextContents()
      expect(chips.length).toBeGreaterThan(0)
      for (const chip of chips) expect(allowedLabels).toContain(chip)
      const signInLabel = role.label === 'Students' ? 'Student' : role.label
      await expect(dialog.getByRole('link', { name: `Sign in as ${signInLabel}`, exact: true })).toHaveAttribute('href', role.href)
      await dialog.getByRole('button', { name: 'Close details' }).click()
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
    }
  })

  test('upskilling drill-down explains the experience without course titles', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto('/')
    await page.getByRole('button', { name: 'See how upskilling works' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'A clearer path from learning to doing.' })).toBeVisible()

    const contentRoot = path.resolve(process.cwd(), 'content/courses')
    const titles = fs.readdirSync(contentRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const manifest = path.join(contentRoot, entry.name, 'course.json')
        if (!fs.existsSync(manifest)) return []
        const title = JSON.parse(fs.readFileSync(manifest, 'utf8')).title
        return typeof title === 'string' ? [title] : []
      })
    const text = await dialog.innerText()
    for (const title of titles) expect(text).not.toContain(title)
    await expect(dialog.locator('a[href^="/courses/"]')).toHaveCount(0)
    await expect(dialog.getByRole('link', { name: 'Access your courses' })).toHaveAttribute('href', '/student/login?next=courses')
    expect(requests.filter((url) => /content\/courses|courseCatalog/.test(url))).toEqual([])
  })

  test('drill-down dialog is accessible and fits a small phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore academics', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const results = await new AxeBuilder({ page }).include('.landing-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([])
    const overflow = await page.locator('.landing-dialog-card').evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, viewport: window.innerWidth }))
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 2)
    expect(overflow.client).toBeLessThanOrEqual(overflow.viewport)
  })

  test('explains the advantage with an honest static comparison graph', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#why-vriddhi')
    await expect(section.getByRole('heading', { name: /It’s not just software/ })).toBeVisible()
    await expect(section.locator('.landing-comparison-row')).toHaveCount(5)
    await expect(section.getByText('A comparison of typical disconnected workflows, not a claim about every other platform.')).toBeVisible()

    const graph = section.locator('.landing-graph-card')
    await expect(graph.getByRole('heading', { name: 'The shape of a semester' })).toBeVisible()
    await expect(graph.getByRole('button')).toHaveCount(0)
    await expect(graph.locator('.landing-graph-line')).toHaveCount(2)
    await expect(graph.locator('.landing-graph-line-without')).toHaveCount(1)
    await expect(graph.locator('.landing-graph-line-with')).toHaveCount(1)
    await expect(graph.getByRole('img')).toHaveAccessibleDescription(/A conceptual comparison.*Without a connected system.*With Vriddhi/s)
    await expect(graph.locator('.landing-graph-legend')).toContainText('Without a connected system')
    await expect(graph.locator('.landing-graph-legend')).toContainText('With Vriddhi')
    await expect(graph.locator('figcaption')).toContainText('not measured customer results')

    for (const title of ['One campus, not ten tabs', 'People still make the calls', 'Shaped around your college']) {
      await expect(section.getByRole('heading', { name: title })).toBeVisible()
    }
  })

  test('mobile preview switches areas without naming courses', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#mobile-view')
    await expect(section.getByRole('heading', { name: /Your college day/ })).toBeVisible()
    const preview = section.getByRole('group', { name: 'Illustrative mobile workspace preview' })
    const tabs = preview.getByRole('group', { name: 'Preview a mobile workspace area' })
    await expect(tabs.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'true')
    await expect(preview.locator('.landing-phone-card')).toHaveCount(3)
    await expect(preview.getByText('Your classes', { exact: true })).toBeVisible()

    await tabs.getByRole('button', { name: 'Learn' }).click()
    await expect(tabs.getByRole('button', { name: 'Learn' })).toHaveAttribute('aria-pressed', 'true')
    await expect(preview.getByText('Assigned courses', { exact: true })).toBeVisible()
    await tabs.getByRole('button', { name: 'Campus' }).click()
    await expect(preview.getByText('Fee information', { exact: true })).toBeVisible()
    await expect(section.getByText('Your college’s live information appears after sign-in.')).toBeVisible()
    await expect(section.getByRole('link', { name: 'Open student sign-in' })).toHaveAttribute('href', '/student/login')

    const contentRoot = path.resolve(process.cwd(), 'content/courses')
    const titles = fs.readdirSync(contentRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const manifest = path.join(contentRoot, entry.name, 'course.json')
        if (!fs.existsSync(manifest)) return []
        const title = JSON.parse(fs.readFileSync(manifest, 'utf8')).title
        return typeof title === 'string' ? [title] : []
      })
    const text = await section.innerText()
    for (const title of titles) expect(text).not.toContain(title)
  })

  test('customization preview updates name and accent and stays accessible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/')
    const section = page.locator('#customise')
    const input = section.getByRole('textbox', { name: 'Try a college name' })
    await input.fill('Green Valley College')
    const preview = section.locator('.landing-custom-preview')
    await expect(preview.getByText('Green Valley College', { exact: true })).toBeVisible()
    await input.fill('   ')
    await expect(preview.getByText('Your college', { exact: true })).toBeVisible()
    await input.fill('W'.repeat(40))
    await expect(input).toHaveValue('W'.repeat(32))

    const accents = [
      { label: 'Teal accent', color: 'rgb(15, 118, 110)' },
      { label: 'Indigo accent', color: 'rgb(79, 70, 229)' },
      { label: 'Amber accent', color: 'rgb(180, 83, 9)' },
      { label: 'Rose accent', color: 'rgb(190, 18, 60)' },
    ]
    for (const accent of accents) {
      const swatch = section.getByRole('button', { name: accent.label })
      await swatch.click()
      await expect(swatch).toHaveAttribute('aria-pressed', 'true')
      await expect(section.locator('.landing-custom-preview-header')).toHaveCSS('background-color', accent.color)
      const results = await new AxeBuilder({ page }).include('.landing-custom-preview-card').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([])
    }
    await expect(section.getByText(/A look-and-feel preview, not your college’s live settings/)).toBeVisible()
    const overflow = await preview.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }))
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 2)
  })

  test('AI section keeps people in charge and FAQs answer the new questions', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#ai')
    await expect(section.getByRole('heading', { name: /A helpful assistant/ })).toBeVisible()
    for (const title of ['A first draft, not a final decision', 'Reviewable grading support', 'Help in the learner’s language']) {
      await expect(section.getByRole('heading', { name: title })).toBeVisible()
    }
    await expect(section.getByRole('list', { name: 'Human-reviewed AI workflow' }).getByRole('listitem')).toHaveCount(4)
    await expect(section.getByText(/AI features depend on your college’s configuration/)).toBeVisible()

    const aiQuestion = page.getByText('Does AI replace our faculty?', { exact: true })
    await aiQuestion.click()
    await expect(page.getByText(/Faculty and administrators still review, decide, and remain responsible/)).toBeVisible()
    const customQuestion = page.getByText('Can we make it feel like our college?', { exact: true })
    await customQuestion.click()
    await expect(page.getByText(/College identity, role-based access, academic scheme packs/)).toBeVisible()
  })

  test('navigation links reach every new section, including the compact menu', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    for (const [label, id] of [['Why Vriddhi', 'why-vriddhi'], ['Mobile view', 'mobile-view'], ['Make it yours', 'customise'], ['AI & you', 'ai']]) {
      if (!(await nav.isVisible())) await page.getByRole('button', { name: 'Open navigation' }).click()
      await nav.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`#${id}$`))
      await expect(page.locator(`#${id}`)).toBeVisible()
      await expect(nav).toBeHidden()
    }
  })

  test('the 3D campus rotates on drag and by keyboard, and settles under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    // No playback chrome: the scene is not a video the visitor has to manage.
    await expect(page.getByRole('button', { name: /pause animation|play animation/i })).toHaveCount(0)

    const stage = page.getByRole('group', { name: /Interactive 3D illustration/ })
    await expect(stage).toBeVisible()
    const solid = page.locator('.campus3d [data-solid="main-body"] polygon').first()
    const before = await solid.getAttribute('points')

    // Dragging turns the model: the projected coordinates must change.
    const box = await stage.boundingBox()
    if (!box) throw new Error('the campus stage has no layout box')
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.68, box.y + box.height * 0.6, { steps: 8 })
    await page.mouse.up()
    const dragged = await solid.getAttribute('points')
    expect(dragged).not.toBe(before)

    // Keyboard parity: the stage is focusable and arrow keys move it too.
    await stage.focus()
    await page.keyboard.press('ArrowLeft')
    expect(await solid.getAttribute('points')).not.toBe(dragged)

    // Reduced motion stops the drift, but the model stays visible and usable.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const still = await solid.getAttribute('points')
    await page.waitForTimeout(400)
    expect(await solid.getAttribute('points')).toBe(still)
    await expect(page.getByRole('img', { name: /three-dimensional college campus/ })).toBeVisible()
  })

  test('feature and role icons still react to hover and focus', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const featureIcon = page.locator('.landing-feature-card .landing-feature-icon svg').first()
    await page.locator('.landing-feature-card').first().hover()
    await expect(featureIcon).toHaveCSS('animation-name', 'landing-icon-wiggle')
    const roleTab = page.getByRole('tab', { name: /^Faculty/ })
    await roleTab.click()
    await expect(roleTab.locator('.landing-role-icon svg')).toHaveCSS('animation-name', 'landing-icon-wiggle')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(featureIcon).toHaveCSS('animation-name', 'none')
    await expect(roleTab.locator('.landing-role-icon svg')).toHaveCSS('animation-name', 'none')
  })

  test('shows a clear path from the landing page into the platform', async ({ page }) => {
    await page.goto('/')
    const steps = page.getByRole('list', { name: 'From the landing page to your workspace' })
    await expect(steps.getByRole('listitem')).toHaveCount(3)
    await expect(steps).toContainText('Sign in with your college account')
    await page.getByRole('tab', { name: /^Faculty/ }).click()
    await page.getByRole('link', { name: 'Sign in as Faculty', exact: true }).click()
    await expect(page).toHaveURL(/\/login\?role=faculty$/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await page.goto('/')
    const question = page.getByText('How do I get from this page to my workspace?', { exact: true })
    await question.click()
    await expect(page.getByText(/this page never assigns permissions/)).toBeVisible()
  })
})
