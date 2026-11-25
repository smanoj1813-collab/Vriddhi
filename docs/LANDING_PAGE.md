# Public landing page

The anonymous root route (`/`) now renders the Vriddhi landing page instead of
redirecting straight to sign-in. Signed-in visitors still go to the dashboard
resolved by `dashboardPathFor(user.role)`.

## What is included

- An interactive **3D campus hero** in place of the old flat illustration. The
  scene is a hand-built projection of real boxes, pyramids and low-poly foliage
  (`src/shared/visuals/campusScene.ts`): faces are lit from a single direction,
  tinted by depth, and sorted far-to-near each frame. Visitors can drag it, use
  the rotate/reset buttons, or arrow-key the angle slider to look around the
  buildings. The login page reuses the same component.
  - **No new runtime cost.** There is no three.js, no WebGL context, no CDN,
    no texture or model download and no paid rendering service: the geometry is
    code that ships in the existing bundle (~4 kB gzipped), drawn with the SVG
    primitives the page already used. Idle drift repaints in place rather than
    re-rendering the React tree, and pauses when the tab is hidden or the hero
    scrolls away.
  - **Accessible and honest about motion.** The stage is a labelled, focusable
    group with a bounded `role="slider"`; the drawing itself carries an
    `aria-label`. `prefers-reduced-motion` is honoured both in CSS and in the
    JavaScript that drives the rotation, and is tracked live rather than read
    once at mount.
- Platform highlights, responsive navigation, FAQs, and an upskilling section.
- A human, everyday-workflow comparison of disconnected tools versus Vriddhi,
  with a static effort graph. The graph is explicitly **illustrative, not
  measured customer results**, and the copy does not claim superiority over
  every named competitor.
- A mobile-experience section with an illustrative phone preview. Visitors can
  switch between Today, Learn, and Campus; live college information still
  requires sign-in. The page itself is responsive down to 320px.
- A customization section with a local college-name/accent preview, plus a
  plain-English explanation of branding, access, scheme packs, and language
  options. The preview does not read or write tenant settings.
- An AI section grounded in the existing product: reviewable question/paper
  drafts, grading support, and supported Indian-language generation. Faculty
  keep the final say; availability depends on college configuration.
- “Explore” drill-downs for the three platform areas, each of the six role
  workspaces, and the upskilling learning experience. Details open in an
  accessible native modal dialog instead of navigating away from the landing
  page. Each dialog includes a themed, finite animated vignette, an icon for
  every highlight and workflow step, and role icons on the connection chips.
- Exactly six advertised entry points: **Principal, HOD, Faculty, Operations,
  Finance, Students**.
- Keyboard-accessible role tabs, visible focus states, reduced-motion support,
  and a light-first treatment of the existing Vriddhi brand.

## Connecting the page to the platform

The landing page is already part of the same React app, not a separate site to
iframe or proxy. `src/routes/index.tsx` renders it at `/` for anonymous visitors.
The visible next step is **pick a role → sign in with a college account → land in
the workspace**:

- Principal/HOD/Faculty/Operations/Finance links open `/login?role=<public-role>`.
  The query is only a hint; `Login.tsx` still authenticates through Firebase and
  redirects using `dashboardPathFor(user.role)`.
- Students open `/student/login`; the upskilling CTA uses the fixed
  `/student/login?next=courses` hint.
- Authenticated visitors to `/` are redirected to their role dashboard by
  `RootRedirect`.

For deployment, build and host this same app with the project's Firebase web
environment variables and existing SPA rewrite. No extra landing-page backend,
API key, or cross-origin integration is needed. Keep college provisioning and
account creation in the existing admin/auth flows.

## Role and course boundaries

`src/modules/landing/roles.ts` is presentation/navigation data, not an
authorization model. Finance is the public label for the existing staff
sign-in used by the internal `accounts` role. A `?role=` query only shows a
sign-in hint; it never grants a role or bypasses a guard. Internal roles,
permissions, and Firestore rules are unchanged.

The landing page, its advantage/mobile/customization/AI sections, and its
drill-downs do **not** import the course catalog or display course titles.
Drill-down copy is static and capability-focused; the upskilling dialog and
mobile Learn preview explain the learning flow without naming courses. It links to `/student/login?next=courses`; after successful student
sign-in, that fixed hint opens `/student/courses`, where the existing
college-assignment checks apply. Existing shareable course/prep routes are
unchanged, but are not linked from the landing page.

## Files

- `src/modules/landing/LandingPage.tsx` — page, navigation, FAQs, and interactions
- `src/modules/landing/LandingAdvantage.tsx` — why Vriddhi, graph, mobile preview,
  customization preview, and AI sections
- `src/shared/visuals/campusScene.ts` — the 3D engine: projection, lighting, depth
  sorting, the campus geometry, the view-fitting maths, and the local-clock
  lighting model (all unit tested)
- `src/shared/visuals/Campus3D.tsx` — the hero component: drag, keyboard and
  button controls, idle drift, and motion preferences

### The campus keeps the visitor's local time

The illustration reads the visitor's clock, so a page opened at 22:00 shows a
lit building and one opened at noon shows daylight glass. Two effects, both from
one number:

- **Windows.** After dusk a second lit pattern fades in, so the evening
  arrangement is not simply the daytime one brightened — it looks like a
  caretaker walking the corridors. The transition eases over about an hour at
  each end (`darknessAt`), so a page left open crosses it smoothly.
- **The tower clock.** Its hand points at the current hour on a normal
  twelve-hour dial: 12 up, 3 right, 6 down, 9 left.

This costs nothing at runtime, which is the only reason it exists:

| Cost | Impact |
| --- | --- |
| Network / assets | none — no image, font, or request |
| DOM nodes | none — recolours the polygons the idle drift already repaints |
| Dependencies | none |
| Bundle | +0.61 kB gzip (measured), landing chunk unchanged |
| Animation budget | none — no `animation:` is added, so the five-second rule holds |

Two rules keep it that way, both enforced by `landing-3d.mjs`:

1. **The engine never reads a clock.** `buildScene(view, time?)` takes the hour
   as data, so the scene stays a pure function of its arguments and is
   reproducible in tests. `undefined` means "no opinion" and every window keeps
   the original daytime pattern.
2. **The component reads the clock once, on a slow interval** — ten minutes,
   because the transition spans an hour and a finer tick would repaint
   identically. The drift loop receives the value through a ref so it never
   resubscribes.

The clock hand is a five-face prism, deliberately: it replaces a five-face box,
so supplying a time never changes the model's polygon count (474 at every hour).
Under `prefers-reduced-motion` the drift never starts and the lit state is simply
computed once at mount — a correct still frame, not motion.
- `src/shared/visuals/campus3d.css` — scoped styles, reduced-motion override
- `src/modules/landing/DrilldownDialog.tsx` — accessible detail dialog
- `src/modules/landing/DrilldownScene.tsx` — decorative animated dialog vignettes
- `src/modules/landing/drilldownVisuals.ts` — per-dialog scene/highlight/step icons
- `src/modules/landing/roleIcons.ts` — shared public role presentation icons
- `src/modules/landing/drilldowns.ts` — static platform/role/upskilling detail copy
- `src/modules/landing/landing.css` — scoped responsive styles
- `src/modules/landing/roles.ts` — six public role definitions
- `public/illustrations/connected-campus.svg` — original static campus artwork
- `src/routes/index.tsx` — anonymous homepage / authenticated redirect
- `e2e/landing.spec.ts` — roles, privacy, drill-downs, graph content,
  mobile/customization interactions, figure animation, navigation, responsive
  and axe checks

## Verification

```sh
npx tsc --noEmit
npm run test:unit          # includes the 3D engine and component tests
npm run test:render:landing # the hero, its a11y contract, and the cost claims
npm run test:e2e
npm run build
```

The unit tests cover the projection maths with no browser, and
`scripts/render-check/landing-3d.mjs` mounts the real page to assert that the
hero is genuine geometry, keyboard operable, motion-safe, free of any runtime
network/package dependency, and confined to the two public sign-in surfaces.

The browser suite supplies placeholder Firebase values through its existing
Playwright configuration. It checks the public page and sign-in navigation,
not authenticated backend behavior. A real deployment still needs the
project's Firebase web configuration for sign-in.
