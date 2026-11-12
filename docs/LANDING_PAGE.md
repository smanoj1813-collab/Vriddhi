# Public landing page

The anonymous root route (`/`) now renders the Vriddhi landing page instead of
redirecting straight to sign-in. Signed-in visitors still go to the dashboard
resolved by `dashboardPathFor(user.role)`.

## What is included

- A locally served, original SVG campus illustration (no external image dependency),
  rendered inline with waving student figures, a bouncing book, and animated
  feature/role icons. Greetings finish automatically; hover and keyboard focus
  replay icon reactions. There is no pause/play control, and
  `prefers-reduced-motion` disables the motion.
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
- `src/modules/landing/CampusIllustration.tsx` — inline animated campus figures
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
node --import tsx --test src/modules/landing/roles.test.ts src/modules/landing/drilldowns.test.ts src/modules/landing/drilldownVisuals.test.ts
npm run test:e2e
npm run build
```

The browser suite supplies placeholder Firebase values through its existing
Playwright configuration. It checks the public page and sign-in navigation,
not authenticated backend behavior. A real deployment still needs the
project's Firebase web configuration for sign-in.
