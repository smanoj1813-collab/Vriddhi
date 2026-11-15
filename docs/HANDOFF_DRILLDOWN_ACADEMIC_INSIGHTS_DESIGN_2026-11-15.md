# Handoff — Drill-down, Academic Insights & Design System

**Date:** 2026-11-15
**Source repo:** `smanoj1813-collab/Vriddhi` (this one)
**Target repo:** `smanoj1813-collab/Vriddhi-engineering`
**Status:** Part 1 documents what exists today. Part 2 is the plan to replicate it — **no code has been changed yet.**

> **Standing constraint (from the Academic Risk incident):** keep Firestore reads/writes and cost in mind throughout. The read/write budget rules in [Firestore read/write volume & cost budget](#-non-negotiable-firestore-readwrite-volume--cost-budget) apply to **every** phase, not just Academic Insights. Read `docs/firestore-cost-controls.md` before implementing.

---

## TL;DR

Three independent subsystems, all living in `Vriddhi`, none of which exist in `Vriddhi-engineering`:

| Subsystem | What it is | Home in `Vriddhi` | In `Vriddhi-engineering` |
|---|---|---|---|
| **In-app drill-down** | Generic reusable shell: overview → level 2 → … → item list | `src/shared/components/DrillDown.tsx` | ❌ Missing |
| **Marketing drill-down** | 10 static landing-page scenes in a modal dialog | `src/modules/landing/drilldown*` | ❌ Missing (no `landing` module at all) |
| **Academic Insights** | Server-aggregated semester → subject → student analytics | `pages/AcademicInsights.tsx` + `getAcademicInsights` callable | ❌ Missing (page, API, card, cloud fn, route, nav) |
| **Design system** | Runtime accent theming, Tailwind token ramp, brand assets | `src/shared/theme/`, `tailwind.config.js`, `brand/` | ⚠️ Partial — has `theme/accent.ts`, `tailwind.config.js`, `brand/`; **missing `theme/appearance.ts`** |

---

## ⚠️ Non-negotiable: Firestore read/write volume & cost budget

**Context.** The Academic Risk feature shipped first and drove Firestore reads/writes sharply up. The fix is already documented in this repo — **`docs/firestore-cost-controls.md`** and **`docs/role-experience-and-academic-risk.md`** — and it left behind real tooling. **This port must not repeat that.** Read those two docs before writing any Phase 3 code.

The recurring failure mode was: *client-triggerable, unbounded, on-demand collection scans that recompute on every page open and rewrite unchanged documents.* Academic Insights is the **same shape** (topics + sessions + attendance + submissions, aggregated across a semester), so it is the highest-risk item in this plan.

### Rules carried over from the risk-analysis incident

| # | Rule | Why (the actual incident) |
|---|---|---|
| C1 | **No client-triggered full scans.** No role — student, faculty, HOD, admin, principal — may initiate a college-wide recomputation. | The old `refreshMyAcademicRiskAlerts` endpoint had to be retired to **deny-only**; a cached app or direct call could start a scan. |
| C2 | **Bounded server-owned work only.** Deterministic pages (~25), durable checkpoint cursors, caps on accounts/time/concurrency (the risk sweep used 1,000 discovered accounts / 7 min per chunk, 3 subjects concurrent, ≤3 claim attempts, ≤200 chunks). | Unbounded discovery was the multiplier. |
| C3 | **Filter in Firestore, never download-and-discard in JS.** | Exam recovery had been pulling 100 future tests **288×/day** and discarding them in JavaScript. |
| C4 | **Ship the composite index with the query**; on a missing index fall back to the old path, and **surface coverage failure — never an empty "success"**. | A silent empty result hid the cost. |
| C5 | **Diff before write.** Skip the write when nothing meaningful changed; do **not** advance timestamps just to create an event. | Unchanged re-saves were rewriting 50+ docs per click. |
| C6 | **All transaction reads precede writes**, so SDK retries recompute against fresh state. | Mixed read/write ordering double-incremented counters under concurrency. |
| C7 | **No polling.** Load on entry, on explicit refresh, on a successful user action, or on a real foreground push. No interval / focus / reconnect timers. | The risk inbox was explicitly reworked to remove all of these. |
| C8 | **Process-local caching only**, if at all: short TTL (~90 s), small cap (~8 entries), tenant-scoped keys, single-flight, failed-read eviction. **No new Firestore cache collections.** | Journey cohort standing proved this is safe; a cache collection just moves the cost. |
| C9 | **Cap function instances and set memory explicitly.** | The engineering repo has *already* hit regional CPU quota (`f9c60f6` capped timetable approvals at 5 instances); the risk callable OOM'd at 128 MiB startup and needed 512 MiB. |
| C10 | **Ordinary record edits must not trigger recomputation storms.** | Risk push had to be limited to new/reopened/escalated findings for exactly this reason. |

### Reuse the snapshot pattern instead of live aggregation

The preferred shape — already used by `platformStats`, `attendanceSummary` and `dailySummary` in this repo:

> A **scheduled** job precomputes rollups into a small number of documents, **skips the write when unchanged**, and keeps a **mandatory heartbeat** so clients can tell "stale" from "broken". The page then reads rollups, not raw collections.

If `getAcademicInsights` is ported as a purely on-demand live aggregation, **every page open re-reads the whole semester's source collections.** Budget for the snapshot variant (Phase 3, option A) before accepting the live variant (option B).

### Cost gates that already exist — extend them, don't bypass them

| Gate | Command | What it does |
|---|---|---|
| Backend cost regressions (28) | `npm --prefix functions run test:cost` | Runs `functions/test/costControls.test.ts` + `assessmentCostControls.test.ts` |
| Read/write counting harness | `functions/test/helpers/costStore.ts` | In-memory **SDK boundary** that counts *real handler read/write intentions* against query sizes, versions, transactions and transform semantics |
| Frontend cost checks (34) | `npm run test:render:cost` | `scripts/render-check/cost-controls.mjs` |
| Cost model / baseline | `npm run cost:model`, `npm run assessment:baseline` | `scripts/cost-model.mjs`, `scripts/assessment-cost-baseline.mjs` |

**Acceptance requirement for this port:** add an `academicInsights` cost regression to `functions/test/costControls.test.ts` that asserts a **per-invocation read/write ceiling**, using `makeCostStore()`. It must fail the build when the ceiling is exceeded. Do not deploy Phase 3 without it.

> Note the honest caveat already recorded in `firestore-cost-controls.md`: these are **SDK-boundary counts of handler intentions**, not billable rule/index work, network cost, or deployed billing. They catch regressions — they are **not** a substitute for comparing real operation counts under a comparable workload after deploy.

---

# Part 1 — How it is configured today

## 1. In-app drill-down (`DrillDown`)

**File:** `src/shared/components/DrillDown.tsx` (218 lines, generic over `T`)

One shared component drives every "click a card to dig deeper" screen. Pages never write their own breadcrumb/card/flat-list logic — they only supply **grouping functions**.

### Configuration model

```ts
type DrillGroup<T> = { label: string; subLabel?: string; chips?: string[]; items: T[] }
type DrillLevelSpec<T> = { title: string; group: (items: T[]) => DrillGroup<T>[] }
```

Props a consumer passes:

| Prop | Purpose |
|---|---|
| `items` | The fully-fetched flat array |
| `levels` | **One entry per drill step.** The last level's groups hold the items |
| `itemKey`, `renderItem` | Row identity + row renderer |
| `searchText` | Haystack per item; enables the built-in search box |
| `searchPlaceholder`, `itemUnit`, `toolbar`, `emptyState` | Cosmetic / page-level extras |
| `defaultDrill` | Start drilled in (default `true`) vs. flat list |

### Behaviour worth knowing

- Navigation state is a **breadcrumb label path** (`string[]`), not indices. The component re-walks `levels` each render and **drops stale labels silently** rather than crashing when data refreshes under the user.
- Search filters the flat array *before* grouping, so counts on cards reflect the filter.
- A `Drill-down ⇄ Flat list` toggle resets the path.

### Current consumers (4)

| Page | Levels |
|---|---|
| `admin/pages/GradeRecords.tsx` | Programme → Semester → Subject |
| `admin/pages/CurriculumProgress.tsx` | Programme → Semester → Subject |
| `admin/pages/AssignmentAnalytics.tsx` | Course → Module → … |
| `office/pages/CourseRegistrationPage.tsx` | (its own level set) |

### To add drill-down to a new page

1. Build a flat row type + fetch it.
2. Write `const drillLevels: DrillLevelSpec<Row>[] = [...]` — each `group()` buckets rows into a `Map`, sorts, and returns `{ label, subLabel, chips?, items }`.
3. Render `<DrillDown items levels itemKey renderItem searchText itemUnit />`.

No changes to `DrillDown.tsx` are needed — it is deliberately level-agnostic.

---

## 2. Marketing drill-down (landing page)

**Files:** `src/modules/landing/drilldowns.ts`, `drilldownVisuals.ts`, `DrilldownScene.tsx`, `DrilldownDialog.tsx`, `roles.ts`, `landing.css`

A public, **static** content system — it deliberately imports no course catalogue and no tenant data, so nothing behind student sign-in leaks onto the marketing site.

### Selection model

```ts
type DrilldownSelection =
  | { kind: 'platform';   id: 'academics' | 'assessments' | 'campus-operations' }
  | { kind: 'role';       id: LandingRoleId }   // principal, hod, faculty, operations, finance, students
  | { kind: 'upskilling' }
```

**10 scenes total** (3 platform + 6 role + 1 upskilling).

### Content + visuals are two parallel records

- `drilldowns.ts` → `getDrilldownContent(selection)` returns copy: `eyebrow`, `title`, `intro`, `highlights[]`, `workflow[]` (3 steps), `roleIds`, `note`, `action`.
- `drilldownVisuals.ts` → `getDrilldownVisuals(selection)` returns `{ scene, highlights[], workflow[] }`, where the arrays are **Lucide icon components in the same order as the copy arrays**.

> ⚠️ **Coupling to respect:** the icon arrays are positional. If you add a highlight to `drilldowns.ts`, you must add an icon at the same index in `drilldownVisuals.ts`. `drilldownKey()` maps both to the same string key.

- `DrilldownScene.tsx` renders per-scene SVG art with a `PALETTES[scene]` accent/soft/pop triple.
- `DrilldownDialog.tsx` is a native `<dialog>` — chosen so focus is trapped and the background is inert.
- `LandingPage.tsx` wires four triggers: three "Explore …" buttons (platform), a role-explore button, and an upskilling button.

---

## 3. Academic Insights

**Files:**
- `src/modules/admin/pages/AcademicInsights.tsx` (796 lines)
- `src/modules/admin/api/academicInsightsApi.ts` (client wrapper + response types)
- `src/modules/admin/components/AcademicInsightsCard.tsx`
- `src/modules/faculty/components/PaperAcademicInsights.tsx`
- `functions/src/academicInsights.ts` (**server-side aggregation**)

### The four levels

| Level | Shows |
|---|---|
| 1 | **Semesters** — rollup cards |
| 2 | **Subjects** of one semester — assigned faculty, classes, coverage, attendance, assessments, avg score |
| 3 | **One subject** — attendance, completion, assignments, scores/marks/quizzes (tabbed) |
| 4 | **Individual students** — ranked rows with their own marks |

### Data flow

```
Page ──httpsCallable──▶ getAcademicInsights (Cloud Function)
                            │
                            ├─ no curriculumId  → overview: semesters[] + totals
                            └─ + curriculumId   → result.subject: SubjectDrill
                                                   (assessmentDetail, attendanceTrend, students)
```

- **All aggregation is server-side.** Every number is derived from the topic ledger, sessions, attendance and submissions — never hand-typed.
- Two separate loads: `load()` for levels 1–2, a second effect for levels 3–4 keyed on `view`. Both guard with a `cancelled` flag.
- Input filters: `collegeId` (superadmin only — everyone else is pinned to their own college), `semester`, `branch`, `batch`, `facultyId`, `curriculumId`, `courseId`, `courseCode`, `from`, `to`.
- Time window defaults to `defaultTermWindow()` from `../api/classSessionApi`.
- Errors go through `describeSessionError(..., SESSION_WRITER_MESSAGES)` so session-expiry is reported in human terms.

### Scope by role

`isSelfService` (faculty/mentor) sees only their own subjects; `isDepartmentScoped` (hod/admin) sees the department; everyone else sees college-wide. The `scopeLine` copy changes accordingly.

### Wiring

| Surface | Where |
|---|---|
| Admin route | `src/modules/admin/routes.tsx:195` → `academic-insights` (lazy) |
| Faculty route | `src/modules/faculty/routes.tsx:154` → `insights` (reuses the same admin page) |
| Nav entry | `src/shared/components/Layout.tsx` — label **"Curriculum Insights"**, roles `admin, principal, hod` |

---

## 4. Designs / design system

### Runtime accent (the interesting bit)

**File:** `src/shared/theme/accent.ts`

Tailwind's `teal-*` palette is remapped to CSS variables, so choosing an accent in **Settings → Accent Color** re-colours the whole app **instantly, with no rebuild**.

```
accentScale(hex) ──▶ --accent-50 … --accent-950   (on :root)
                        │
tailwind.config.js  teal.50…950: rgb(var(--accent-N) / <alpha-value>)
```

- `DEFAULT_ACCENT = '#14b8a6'` (teal). `accentScale()` mixes the chosen hex toward white (50–400) and black (600–950), anchoring it at 500.
- `setAccent(hex, persist, uid)` — `persist=false` gives a live preview from the Settings swatch without committing. Dispatches a `vriddhi:accent-change` CustomEvent so MUI components follow too.
- **Appearance prefs are per-account.** Keys are suffixed `__${uid}`. This was a deliberate fix: they used to live in one browser-wide `localStorage` key, so an accent picked in the superadmin account leaked into every college/faculty account signed in on the same shared machine. `writeAppearancePref()` also removes the legacy shared key on write.
- `applyStoredAppearanceForUser(uid)` is called by `AuthContext` on every session change; with `null` it resets to platform defaults so the previous account's colours never bleed onto the login screen.

### Appearance preferences

**File:** `src/shared/theme/appearance.ts`

```ts
type AppearancePreferences = { accentColor, fontSize: 'small'|'medium'|'large', compactMode, animationsEnabled }
```

- 8 preset swatches in `ACCENT_COLORS` (Teal, Indigo, Amber, Red, Violet, Cyan, Pink, Lime).
- `normalizeAppearance()` projects untrusted cloud data onto **cosmetic fields only** — identity fields are never copied.
- Font size maps to `14px / 16px / 18px` on `documentElement`.

### Tokens & fonts

`tailwind.config.js` extends `vriddhi-*` colours (dark `#0f172a`, card `#1e293b`, border `#334155`, muted `#94a3b8`, success/warning/danger) and a font stack led by `var(--vriddhi-font-family)` with **Noto Sans Kannada / Tamil / Telugu / Malayalam / Devanagari** fallbacks — required for the Karnataka/regional rollout.

### Brand assets

`brand/` holds the logo system (SVG + PNG exports, horizontal/stacked/mark/mono/reverse), `dashboard-preview.html`, and concept explorations.

---

# Part 2 — Replication plan for `Vriddhi-engineering`

**Verified state of `smanoj1813-collab/Vriddhi-engineering` @ `main` (`a156b48`, 2026-10-18):** 1,670 paths, 166 Cloud Function sources, 82 docs. It is a parallel codebase with the same `src/modules/*` shape, but **predates** these three subsystems.

### Confirmed gaps

| Needed | Status in `Vriddhi-engineering` |
|---|---|
| `src/shared/components/DrillDown.tsx` | ❌ Missing |
| `src/modules/landing/**` (all 6 files) | ❌ Missing — no `landing` module at all |
| `src/modules/admin/pages/AcademicInsights.tsx` | ❌ Missing |
| `src/modules/admin/api/academicInsightsApi.ts` | ❌ Missing |
| `src/modules/admin/components/AcademicInsightsCard.tsx` | ❌ Missing |
| `functions/src/academicInsights.ts` | ❌ Missing |
| `getAcademicInsights` export in `functions/src/index.ts` | ❌ Missing |
| Route `admin/academic-insights` + nav "Curriculum Insights" | ❌ Missing |
| `src/shared/theme/appearance.ts` | ❌ Missing |
| `src/shared/theme/accent.ts` | ✅ Present |
| `tailwind.config.js` | ✅ Present |
| `brand/` | ✅ Present |
| `GradeRecords.tsx`, `CurriculumProgress.tsx`, `AssignmentAnalytics.tsx` | ⚠️ Present but **flat/older — contain zero `DrillDown` references** |
| `office/pages/CourseRegistrationPage.tsx` | ❌ Missing |
| `faculty/components/PaperAcademicInsights.tsx` | ✅ Present |

> The three consumer pages exist but were never converted — they render flat lists. So porting `DrillDown` is additive, not a rebuild.

---

## Phase 0 — Pre-flight (½ day)

1. **Confirm divergence.** The two repos have been running separately since ~2026-10-18. Diff the shared surfaces the port touches: `src/shared/types/`, `src/Firebase/`, `src/shared/contexts/ThemeProvider`, `src/modules/auth/context/AuthContext.tsx`.
2. **Check the Firestore shape.** Academic Insights aggregates the topic ledger, sessions, attendance and submissions. Verify `Vriddhi-engineering` writes those collections with the same field names; if the engineering repo uses a different `named database`, port the DB handle accordingly (its recent commits show prior work on "the same named Firestore database the writes use").
3. **Decide the sync model.** These are two divergent copies of one product. Either (a) accept one-way manual porting each time, or (b) make the shared pieces a real package/subtree. **This is a decision, not a task** — see Open Questions.
4. **Establish the cost baseline before writing features.** Run `npm --prefix functions run test:cost` and `npm run test:render:cost` on the engineering repo **as it stands today** and record the numbers. Confirm the cost harness (`functions/test/helpers/costStore.ts`) and the two cost suites exist there; if Phase 1's `appearance.ts` port or the missing pieces were never carried across, port the harness too — **you cannot assert a ceiling without it.** Measure first so any regression is attributable.

## Phase 1 — Design system (½ day, no dependencies)

| # | Action |
|---|---|
| 1.1 | Copy `src/shared/theme/accent.ts` → verify byte-identical first; if it already matches, skip. |
| 1.2 | Copy `src/shared/theme/appearance.ts` + `appearance.test.ts`. |
| 1.3 | Compare `tailwind.config.js`. If the engineering copy lacks the `teal.*` → `var(--accent-*)` remap, port that block — **without it the accent picker silently does nothing.** |
| 1.4 | Confirm `AppThemeProvider` is mounted in `main.tsx` and that `AuthContext` calls `applyStoredAppearanceForUser` on session change. |
| 1.5 | Confirm the regional font stack (Noto Sans Kannada/Tamil/Telugu/Malayalam/Devanagari) is present. |

**Risk:** low. **No user-visible change** beyond the accent picker working.

## Phase 2 — In-app drill-down (1 day)

| # | Action |
|---|---|
| 2.1 | Copy `src/shared/components/DrillDown.tsx` verbatim — it has no product-specific imports (MUI only). |
| 2.2 | Convert `GradeRecords.tsx`: add `drillLevels` (Programme → Semester → Subject), swap the list for `<DrillDown>`, keep the existing selection/publish toolbar as the `toolbar` prop. |
| 2.3 | Convert `CurriculumProgress.tsx` the same way (Programme → Semester → Subject), reusing its existing `Bar` cells inside `renderItem`. |
| 2.4 | Convert `AssignmentAnalytics.tsx` (Course → Module → …). Note this page is **Tailwind**, not MUI — `DrillDown` is MUI-based, so expect mixed paradigms; either accept it (GradeRecords already mixes) or wrap. |
| 2.5 | Add `drilldowns.test.ts` equivalents if the engineering repo has the same vitest setup. |

**Cost gate — the one trap in Phase 2.** `DrillDown` is built to receive a **fully-fetched flat array** and group it in memory. It holds `items` in a `useMemo` and never re-queries. Do **not** "optimise" it into lazy-loading per level: fetching on card-click turns one page load into **1 + N queries** (one per drill path the user explores), which across a few thousand page views is exactly how a read count quietly triples. Grouping is deliberately CPU, not Firestore.

| Cost rule for Phase 2 | Detail |
|---|---|
| Fetch once, group in memory | Arrays are already in hand; `DrillDown` adds **zero** extra reads |
| No per-card/per-level fetch | Resist lazy-loading; it multiplies queries per user session |
| Keep the existing page fetch shape | Converting a page must not add a new collection read |
| Verify | `npm run test:render:cost` (34 checks) must stay green |

**Risk:** medium — the three pages have diverged, so `drillLevels` must be written against their **current** row types, not copied blindly.

## Phase 3 — Academic Insights (2–3 days — the bulk)

| # | Action |
|---|---|
| 3.1 | Port `functions/src/academicInsights.ts` first. **This is the long pole** — it is where all aggregation lives. Audit its collection reads against the engineering repo's actual schema and rewrite queries that don't match. |
| 3.2 | Export `getAcademicInsights` from `functions/src/index.ts` (note: the engineering repo **allowlists** its callables — `timetableApproval.ts` is deliberately unrouted — so follow that convention). |
| 3.3 | Copy `api/academicInsightsApi.ts`; confirm it imports from `@/Firebase/data` correctly in the engineering repo and that `describeSessionError` / `SESSION_WRITER_MESSAGES` exist at the same path. |
| 3.4 | Copy `pages/AcademicInsights.tsx`; resolve imports — it pulls `defaultTermWindow` from `../api/classSessionApi`, which must exist there. |
| 3.5 | Copy `components/AcademicInsightsCard.tsx`. |
| 3.6 | Wire routes + nav: `admin/academic-insights` (lazy) and the **"Curriculum Insights"** nav item for `admin, principal, hod` in `Layout.tsx`. Optionally the faculty `insights` route. |
| 3.7 | Add Firestore indexes if the aggregation needs composite indexes the engineering project lacks (`firestore.indexes.json`). |

### ⚠️ Phase 3 carries the cost risk — decide 3.1a/3.1b before coding

Step 3.1 has two possible shapes. **Pick the snapshot one unless it is genuinely impossible:**

| Option | Shape | Read profile |
|---|---|---|
| **3.1a — Snapshot rollups (preferred)** | Scheduled job precomputes per-semester/per-subject rollups into a few documents; page reads rollups. Follow the existing `platformStats` pattern: **skip the write when unchanged**, keep a **mandatory heartbeat** so the UI can distinguish stale from broken. | Page open ≈ a handful of document reads regardless of roster size |
| **3.1b — Live aggregation** | Port `getAcademicInsights` as-is: one callable aggregates topics + sessions + attendance + submissions on every request. | Page open ∝ students × subjects × assessments. **This is the shape that spiked on Academic Risk.** |

If 3.1b is chosen anyway, it must be bounded the way the risk sweep was: cached with a short TTL, tenant-scoped, single-flight, instance-capped, and never reachable as a "refresh everything" button.

**Cost gates — all must pass before Phase 3 ships:**

| Gate | Requirement |
|---|---|
| Per-invocation ceiling | New `academicInsights` case in `functions/test/costControls.test.ts` using `makeCostStore()`, asserting a hard read/write ceiling per call. **Build fails when exceeded.** |
| No client-triggered scan (C1) | No role can invoke a college-wide recomputation; the callable stays request-scoped and college-pinned |
| Bounded (C2) | Paged reads with a durable cursor and explicit caps — no unbounded collection scans |
| Filtered server-side (C3) | Semester/date/branch filters are Firestore query filters, never JS post-filtering |
| Index shipped (C4) | Add needed composites to `firestore.indexes.json`, deploy via `npm run deploy:indexes`, **wait for readiness**; missing index → fallback + visible coverage failure, never an empty success |
| No-op suppression (C5) | Snapshot job skips writes when unchanged (with heartbeat); no timestamp-only writes |
| Instance cap (C9) | Explicit `maxInstances` + memory; the engineering project has already hit regional CPU quota (`f9c60f6`) |
| No edit storms (C10) | Attendance/submission edits must not trigger insight recomputation |
| Baseline before/after | Record per-invocation counts with `makeCostStore()` and re-measure post-deploy — **do not claim savings without measurement** |

**Risks:**
- **Schema drift is the main functional risk.** If the engineering repo models curriculum/topics/sessions differently, step 3.1 becomes a rewrite rather than a copy. Budget accordingly.
- **Cost is the main delivery risk.** Verify the ceiling test exists and passes *before* any deploy, not after the first invoice.
- Security rules: `getAcademicInsights` pins non-superadmins to their own `collegeId`. Carry that guard across unchanged.

## Phase 4 — Marketing drill-down (1 day, independent)

| # | Action |
|---|---|
| 4.1 | Copy all six `src/modules/landing/*` files. |
| 4.2 | Check for a landing/marketing surface to attach to. `Vriddhi-engineering` has **no `src/modules/landing`** — if it has no public marketing page, this subsystem has nowhere to mount and should be **deferred or dropped**. |
| 4.3 | If a marketing page exists, port `landing.css` and wire the four triggers from `LandingPage.tsx`. |
| 4.4 | Verify `lucide-react` is a dependency; add it if not. |

**Cost gate:** effectively **zero Firestore cost** — the landing drill-down is static, hard-coded copy and SVG with no database dependency. Keep it that way: if anyone proposes personalising these scenes per college, that becomes a Phase 3-class cost problem, not a copy change.

**Risk:** low, but **Phase 4 may be unnecessary** — confirm with the team before spending the day.

---

## Suggested order

**Phase 1 → Phase 2 → Phase 3**, with Phase 4 held until someone confirms the engineering project wants a public marketing page.

Phase 1 and Phase 4 are dependency-free and can run in parallel with anything.

**Rough effort:** 5–7 engineer-days if the schemas line up; 8–11 if Phase 3 needs query rewrites. Phase 4 adds 1 day if in scope.

The increase over the earlier estimate is **deliberate cost-engineering time**, not padding: the snapshot-rollup variant (3.1a) plus the `makeCostStore()` ceiling test and the before/after baseline. Skipping it is exactly what produced the Academic Risk spike — treat it as part of the feature, not as optional hardening.

### Definition of done (cost)

- [ ] `docs/firestore-cost-controls.md` read by whoever implements Phase 3
- [ ] Option 3.1a/3.1b chosen and recorded, with a reason
- [ ] `functions/test/costControls.test.ts` extended with an `academicInsights` per-invocation ceiling
- [ ] `npm --prefix functions run test:cost` green
- [ ] `npm run test:render:cost` green
- [ ] Any new composite indexes in `firestore.indexes.json`, deployed and **ready**
- [ ] `maxInstances` + memory set explicitly on every new/changed callable (C9)
- [ ] Per-invocation counts recorded before deploy and re-measured after

---

## Open questions (need answers before Phase 3)

1. **Sync strategy.** Are these two permanent parallel products, or should `Vriddhi-engineering` converge onto `Vriddhi`? Manual porting of a 796-line page + cloud function is expensive to repeat. A shared package or subtree would change the whole shape of this plan.
2. **Does the engineering project need a marketing/landing page?** If not, drop Phase 4.
3. **Engineering-specific curriculum.** The Drive folder `Vriddhi-engineering` holds 5 branch workbooks (CSE, ECE, EEE, MECH, CIVIL). Does Academic Insights need branch-aware grouping, or is "Programme/branch" already covered by the existing `branch` filter?
4. **Semester model.** Engineering programmes run 8 semesters vs. BBA/BCom's 6 — confirm `SemesterInsight` rollups and `defaultTermWindow()` behave correctly at 8.
5. **Function quota.** Confirm the CPU/instance budget for a new aggregation callable before Phase 3.
6. **Snapshot vs. live (3.1a / 3.1b).** Can Academic Insights tolerate rollup freshness of one scheduled cycle? If the answer is "no, it must be live to the second", say so now — it changes the read profile by orders of magnitude and needs an explicit cost sign-off rather than a default.
7. **Read ceiling value.** What per-invocation read budget is acceptable for `getAcademicInsights`? A number is needed to write the `makeCostStore()` assertion; without one the test cannot be written. Suggest deriving it from the existing `platformStats` / `attendanceSummary` jobs as the reference point.
8. **Is the risk-analysis cost incident quantified anywhere?** If the earlier spike has real before/after operation counts, they are the best calibration data for question 7 — `firestore-cost-controls.md` records validation runs but explicitly stops short of promising measured bill savings.
