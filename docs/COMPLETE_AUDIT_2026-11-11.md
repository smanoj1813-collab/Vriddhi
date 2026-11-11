# Vriddhi — Complete Audit, 11 Nov 2026

**Commit:** `6f4d2e9` (main) · **Branch audited:** `arena/3d2345ae-vriddhi` · **Auditor:** Arena agent
**Scope:** whole repository — frontend, Cloud Functions, security rules, tests, CI, dependencies,
docs, and the product claims made in the README.
**Method:** everything below was **executed**, not inferred. Where I could not execute something
(rules emulator), I say so explicitly instead of guessing.

> **Status: P0s fixed the same day.** See §9 for what changed, and the current numbers. The
> findings below are kept as written (they are the record of what was wrong); where a number or
> a claim has since been corrected, §9 says so.

---

## 1. Executive summary

This is a **materially healthier codebase than its own documentation suggests**. TypeScript is
strict-clean across 270 k LOC, 1,996 unit tests pass, the build succeeds, dead-code enforcement
works, and the Firestore rules are genuinely well-designed — claims-only identity resolution, no
`if true`, a recursive deny-all default, and cross-tenant denial tests.

The problems are not in the product code. They are in the **verge of the project**: a render test
suite that has been allowed to rot (20 failing checks, invisible to CI), a CI pipeline that
doesn't run the suite that is failing, ~43 MB of uncompressed images, a 457 kB first-load payload,
three unused production dependencies (one of which is a JWT signer), and a handful of legacy
Firestore read rules that are **role-checked but not tenant-checked**.

| Area | Verdict |
|---|---|
| TypeScript / build (frontend) | ✅ 0 errors |
| TypeScript / build (functions) | ✅ 0 errors |
| Unit tests — frontend | ✅ 713 / 713 |
| Unit tests — functions | ✅ 1,283 / 1,283 |
| Render tests (main suite) | ❌ **297 / 317, 20 failing, 17 mount crashes** |
| Render tests (courses / pyq) | ✅ 126 / 126 · 27 / 27 |
| Rules tests | ⚠️ 97 cases exist; **cannot run here** (no Java), CI runs only a subset |
| Dead code | ✅ clean |
| Course packs | ✅ 4 / 4 valid |
| Bundle size | ❌ 457 kB gzip before first paint; 43 MB of images |
| Dependency hygiene | ❌ 23 advisories (1 critical, 11 high); 3 unused prod deps |
| Firestore / Storage rules design | ✅ strong — with 42 legacy tenant-blind read rules to review |
| Secrets in repo | ✅ clean |
| CI coverage | ❌ misses the main render suite, full rules suite, and `npm audit` |
| Docs accuracy | ⚠️ drift on numbers (759 vs 951 seed questions) |

**Nothing here blocks a demo.** Two things would embarrass you in front of a college IT reviewer:
the tenant-blind read rules (P1) and the 457 kB / 43 MB payload on a rural connection (P1).

---

## 2. What I ran (reproducible)

```bash
npm ci                                   # 772 packages, 43 s
npx tsc --noEmit                         # exit 0
npm run test:unit                        # 713 pass, 0 fail, 128 suites
npm run test:render                      # 297/317 · 20 fail · 17 mount crashes
npm run test:render:courses              # 126/126
npm run test:render:pyq                  # 27/27
npm run validate:courses                 # 4/4 packs valid
npm run check:dead-code                  # 607 reachable, 0 orphans
npx vite build                           # ✓ 51 s · 610 assets · 55 MB dist
cd functions && npm ci --ignore-scripts   # 980 packages
cd functions && npx tsc                  # exit 0
cd functions && npm run test:unit        # 1,283 pass, 0 fail, 303 suites
npm audit                                # 23 vulnerabilities
```

One environment note: `functions/npm ci` **fails on a plain run** because Puppeteer's postinstall
tries to download Chromium. CI already sets `PUPPETEER_SKIP_DOWNLOAD: "true"`; a local
`npm ci` does not, and the docs don't mention it. Anyone bootstrapping the backend hits this.

---

## 3. P0 — fix this week

### P0-1. The main render suite is red, and CI cannot see it

`npm run test:render` is **297/317**. Twenty checks fail. `.github/workflows/ci.yml` runs only
`test:render:courses`, so `main` stays green while the suite rots. There are exactly **four root
causes**, all in the test harness, none in product code:

| # | Cause | Failing checks | Evidence |
|---|---|---|---|
| 1 | `scripts/render-check/stubs/prepContentService.ts` is missing the `PREP_PAPER_FILE_PROGRAMS` export. `PrepPapersViews.tsx:65` spreads `[...PROGRAMS, ...PREP_PAPER_FILE_PROGRAMS.map(...)]` at module scope, so the stub's `undefined` throws during import. | **15** (every `prep hub` / `prep subject` / `prep paper` section) | `TypeError: Cannot read properties of undefined (reading 'map')` |
| 2 | Two sections import `src/modules/admin/pages/AdminClassSchedule.tsx`, which **has no history in this repository at all** (`git log --all -- '*AdminClassSchedule*'` is empty) — the harness was driving a page that was never committed here. Scheduling now lives in `AcademicWorkflowPage.tsx` (import sheet + auto-generator → HOD approval). | **2** | `Failed to load url … Does the file exist?` |
| 3 | `challans: shows the amount and the due date` asserts `/Due 30 Sep/`, but the fixture's `dueDate` is `2026-09-30` — now in the past, so the page renders **"Overdue — due 30 Sep"** (lower-case). A date-dependent assertion: it passed in September and fails forever after. | **1** | `StudentChallans.tsx:522` |
| 4 | The seeder checks hardcode `SEED_TOTAL === 759` and `SEED_SUBTOPICS === 144`. The bundled bank is now **951 rows / 192 sub-topics**. | **2** | `parsed 951 rows`, `192 sub-topics` |

**Impact:** the harness that catches SSR/mount crashes across ~100 page sections (exam flows,
fees, finance, payroll) has been quietly off duty. Fixes 1, 2 and 3 are one line each; fix 4 is
"update the constants and make the check assert *shape*, not a magic number".

**Fix:** patch the stub, repoint the two sections, freeze the date in the challan fixture
(`dueDate` in the future, e.g. `2027-09-30`), derive the seeder totals from the dataset instead of
hardcoding them — then add `npm run test:render` to CI next to `test:render:courses`.

### P0-2. Three production dependencies that are not used — one of them signs JWTs

| Package | Declared | Used in `src/` | Used in `functions/src/` |
|---|---|---|---|
| `jsonwebtoken` | ✅ root prod dep | **never** | **never** |
| `openai` | ✅ root prod dep | never | ✅ (`config/aiProviders.ts`) — belongs in `functions` only |
| `axios` | ✅ root prod dep | **never** | never |

`jsonwebtoken` in a *browser* project is a hazard, not just weight: it exists in the dependency
graph, so one careless `import` puts Node's crypto shim (or a signing key path) into a client
bundle. Removing all three also removes the 12 `axios` "high" advisories from the audit.

**Fix:** `npm uninstall jsonwebtoken openai axios` in root; ensure `openai` is declared in
`functions/package.json`.

### P0-3. `npm audit`: 23 advisories, 1 critical

```
critical  dompurify   ≤3.4.16   (via html2pdf.js + jspdf)
high      axios       1.19.0    (unused — see P0-2)
high      firebase    via @grpc/grpc-js  (Node-only path; not shipped to browsers)
high      sharp       ≤0.35.5   (functions: image pipeline, libvips/libheif CVEs)
high      vite        ≤6.4.3    (dev server; no user-facing exposure)
high      undici, source-map-js, brace-expansion   (build-time / Node)
moderate  esbuild, glob, minimatch, workbox-build, vite-plugin-pwa
low       katex, serialize-javascript, deepmerge, @rollup/plugin-node-resolve
```

Honest reading: **the browser-facing blast radius is small.** Most of these are Node-side
(`grpc-js`, `undici`, `brace-expansion`, `vite` dev server). Two matter:

- **`dompurify` (critical).** It arrives through `jspdf`/`html2pdf.js` HTML→PDF rendering. The
  advisories concern `IN_PLACE` mode and sanitize hooks; the app feeds *its own* generated markup,
  so exploitability is low — but pin it with an npm `overrides` entry to `>=3.4.17` and re-run the
  PDF render tests.
- **`sharp` (high).** libvips/libheif CVEs in the image pipeline. Patch-level bump.

Avoid `npm audit fix --force`: it proposes *downgrading* `firebase` to 9.14.0 (from 12.15) and
`vite` to 8.3.8 — both would break the app. Upgrade deliberately instead.

---

## 4. P1 — next sprint

### P1-1. 42 read rules check role but not tenant

The rules file is unusually well-argued (1,959 lines, 130 match blocks, 347 allow statements,
claims-only identity, recursive `allow read, write: if false` at the end). But 42 `read`/`get`/`list`
rules grant `isStaff()` **without any college comparison**. The clearest cases:

```
L622-623  /colleges/{collegeId}/schedules/{docId}         get, list  if isStaff()
L629-630  /colleges/{collegeId}/attendance/{docId}        get, list  if isStaff()
L635-636  /colleges/{collegeId}/attendanceRecords/{docId} get, list  if isStaff()
L641-642  /colleges/{collegeId}/assessments/{docId}       get, list  if isStaff()
L647-648  /colleges/{collegeId}/scores/{docId}            get, list  if isStaff()
L1491     /resumes/{uid}                                  list       if isStaff()
L1500     /resumeDownloads/{downloadId}                   list       if isStaff()
L1521     /proctoringLogs/{logId}                         read       if isStaff()
L1537     /submissions/{submissionId}                     list       if isStaff()
L1807     /attendanceSummaries/{studentId}                list       if isCollegeStaff()
```

The file's own comment says "the collection path itself is the tenant boundary" — **it isn't**:
`collegeId` is a *caller-supplied path segment*, so a faculty account at College A can read
`colleges/B/attendance` by naming B. Writes in the same blocks are correctly gated by
`collegePathWrite(collegeId)`; the reads are not, which looks like an oversight rather than a
decision. `list` on `resumes` / `resumeDownloads` / `submissions` / `proctoringLogs` is the same
shape at top level: staff-level `list` with no `sameCollege()`.

To be fair: `functions/test/firestore.rules.test.ts` (2,502 lines, 97 cases) does test cross-
college denial for the paths that have been hardened (e.g. "denies cross-college faculty the
record, the list and the write"), and storage rules are properly scoped with claims. So the
discipline exists — it just wasn't applied to these legacy collections.

**Fix:** add `&& (isSuperadmin() || collegeId() == collegeId)` (or `sameCollege(resource.data)`)
to the read rules above; add one cross-tenant test per collection. I could not run the rules
suite here — no Java and no `firebase` CLI in this sandbox — so this needs a local
`npm --prefix functions run test:rules` before and after.

### P1-2. 457 kB of JavaScript before the login screen paints

Measured from `dist/index.html`'s own `modulepreload` list:

| Chunk | gzip |
|---|---|
| `firebase` | **213.3 kB** |
| `mui-core` | **135.1 kB** |
| `react-core` | 57.3 kB |
| `utils` | 41.6 kB |
| `mui-icons` | 9.7 kB |
| **First paint total** | **457 kB** |

Plus a single CSS file, 198 kB raw. For a college audience on 4G in tier-2/3 towns, that is 3–5 s
before the app can even ask for credentials. The rest is lazy (486 chunks total, 11.2 MB raw) —
the code-splitting discipline is there; the *entry* is the problem. `firebase` is preloaded
whole (Auth + Firestore + Storage + Functions + Messaging) even on the login screen, which needs
Auth only.

**Fix (in order of value/effort):** move Firestore/Storage/Messaging initialisation behind the
authenticated shell so they leave the preload set; keep `firebase/auth` eager. Expect ~180-220 kB
gzip off first paint.

### P1-3. 43.3 MB of PNGs in the bundle, single files up to 1.7 MB

```
dist/assets images: 43.3 MB across the emitted assets
54 source files > 300 kB, all in src/assets/prep-images/
largest: bcg-matrix.png 1,713 kB · company-directors.png 1,417 kB · business-profession.png 1,287 kB
```

These are prep-course illustrations imported through the bundler, so they get content-hashed and
served, but never resized or converted. A learner who opens a prep module on mobile pulls
megabytes. **Fix:** convert to WebP/AVIF at ≤1280 px (typically 8–15× smaller), or move to
Firebase Storage + CDN with `srcset`. This is the single largest, cheapest UX win in the repo.

### P1-4. CI doesn't run three of the checks that would have caught this

`.github/workflows/ci.yml` runs: dead-code, frontend unit, validate courses, render **courses
only**, build, functions build, functions unit, and a *subset* of rules tests
(`test:rules:course-security`).

Missing: **`test:render`** (the suite that is red), **`test:rules`** (the full 97-case suite),
and **`npm audit`**. Adding those three turns this audit from "a document" into a gate.

Also: `scripts/render-check` is a hand-rolled harness. There is no Playwright/Cypress — so
nothing verifies a real browser: routing, auth redirects, focus management, actual Paint. For a
product you sell to colleges, one Playwright smoke path per role (student/faculty/admin) would be
worth more than a hundred more unit tests.

---

## 5. P2 — housekeeping and truth-in-docs

**5.1 Docs drift.** `README.md:40` still advertises "759 B.Com / BA / B.Sc questions"; the bundled
dataset now parses **951 rows / 192 sub-topics** (which is why the render check fails). The seeder
grew; the two numbers didn't. Same class of drift: `BBA_SEED_VERIFICATION_2026-11-07.md`.

**5.2 i18n covers ~5 % of the UI.** Six dictionaries, 233 keys each, **100 % parity** across
en/hi/kn/ta/te/ml — genuinely complete for what it covers, and the hard part (Kannada/Tamil/
Telugu/Malayalam Unicode) is done. But only **15 files** call `useTranslation`, **137 `t()` calls**
exist across 615 files, and there are ~315 literal English strings in JSX. The README's
"South Indian language support for the UI" reads as app-wide; it is currently the student area.
Either finish the sweep or scope the claim — a principal will test this in the first five minutes.

**5.3 Maintainability hotspots.** `any` appears **530×**; `console.log` **46×** in `src/`;
`eslint-disable` 20×; `dangerouslySetInnerHTML` 6× (all PDF/markdown paths — worth a glance each);
TODO/FIXME only 7×, which is admirably low for 188 k LOC.

Largest files: `src/scripts/seedStudents.ts` **5,077 lines**, `superAdminApi.ts` 2,612,
`AdminFeeManagement.tsx` 2,064, `shared/components/Layout.tsx` 1,969,
`PrepContentStudioTab.tsx` 1,717, `FacultyPaperGenerator.tsx` 1,683.

`seedStudents.ts` deserves a specific note: `check-dead-code.cjs` **explicitly excludes
`src/scripts/`** (line 36), so the largest file in the repo is invisible to the guard and is not
imported by anything. It's a one-off data script living inside the app's typecheck space. Move it
to `scripts/` where its siblings live.

**5.4 Firebase config naming.** `firebase.json` points `firestore.rules` at
`**current**-firestore.rules`. It works, but every new contributor and every "where are the
rules?" search will look for `firestore.rules`. Rename (or add a pointer comment).

**5.5 PWA precache config warning.** `vite-plugin-pwa` warns that the `workbox-*.js` glob matches
nothing because the same file is in `globIgnores`. Harmless today (24 entries / 2.9 MB precached)
but it means the warning channel is noisy — real warnings will hide behind it.

**5.6 Two `firebase.json` hosting `ignore` gaps.** `dist/` is correctly not committed, but the
`**/.*` ignore plus `jsonschema`-free headers config means no CSP is set for hosting. For a
product handling fee and identity data, an explicit `Content-Security-Policy` header would be
worth adding (`script-src 'self'` + the specific Google Fonts/Sentry/Firebase origins).

---

## 6. What is genuinely strong (don't refactor this away)

- **Security architecture.** Identity comes from the verified ID-token claim *only*, never from a
  client-writable profile doc — and the rules file explains **why** in-line, including the
  10-`get()`-per-request budget and the operand-order trick that protects list queries. That is
  senior-level work, and it's the reason the tenant gaps above read as oversights.
- **Rule + storage rule symmetry.** Both services reimplement the same claim resolution and role
  canonicalisation; storage has cross-tenant denial tests.
- **Test volume where it counts.** 1,283 backend tests including transactions, grading, scheme
  packs, payroll, and timetable conflicts — the financial and academic logic is covered.
- **`syncMyIdentity` / identity repair** exists as a first-class operation instead of a rules
  loophole. Most projects choose the loophole.
- **Dead-code guard, course-pack validator, per-module render harness** — a real quality culture.
- **The docs.** 50+ documents in `docs/` with dated audits and handoffs. Fewer than the code
  deserves credit for, but far more than most teams write.

---

## 7. Suggested order of work

**Week 1 — make the safety net real**
1. Fix the four render-suite root causes (P0-1). ~2 hours.
2. Add `test:render`, `test:rules`, and `npm audit` to CI (P1-4). ~1 hour.
3. Drop `jsonwebtoken`, `openai`, `axios` from root (P0-2). ~15 minutes.
4. `overrides` for `dompurify`, bump `sharp`; leave `firebase`/`vite` majors for a planned upgrade.

**Week 2 — close the tenant gaps**
5. Patch the 42 tenant-blind read rules, one collection at a time, each with a cross-tenant test
   (P1-1). Run the rules suite locally before/after.
6. Add the hosting CSP header (5.6).

**Week 3 — the payload**
7. Images → WebP/AVIF (P1-3), then Firestore/Storage out of the preload set (P1-2). Re-measure
   first-load; target < 250 kB gzip.

**Whenever** — split `seedStudents.ts` out of `src/`, and decide the i18n story (finish or scope
the claim).

---

## 8. Limits of this audit

- **Rules were read, not executed.** No Java or `firebase` CLI in this sandbox, so
  `functions/test:rules` could not run. I reviewed the rules statically and cross-read their
  tests; treat P1-1 as "verify then patch", not "verified broken".
- **No browser was driven.** Layout, focus order, mobile breakpoints, and real paint performance
  are unmeasured. The bundle numbers are build artefacts, not field numbers (no Lighthouse/RUM).
- **No live Firebase project was touched.** Nothing was written, deployed, or migrated.
- **Accessibility** was not assessed beyond noting the absence of automated checks. Given a
  college audience, an axe-core pass on the student portal would be a reasonable next audit.

---

## 9. Fix log — same day

Everything in this section was applied and re-verified. Full re-run at the bottom.

### 9.1 The render suite is green: 391/391, 0 mount crashes

| Fix | File | What changed |
|---|---|---|
| Missing stub export | `scripts/render-check/stubs/prepContentService.ts` | Added `PREP_PAPER_FILE_PROGRAMS` (the 8 paper-only programmes, mirroring the real service) with a comment saying why a missing export here fails at *import* time and takes 15 checks with it. |
| Dead sections | `scripts/render-check/run.mjs` | Removed the two `AdminClassSchedule.tsx` sections (the page never existed in this repo) and replaced them with one shallow, honest section on `AcademicWorkflowPage.tsx`: it mounts, it names the screen, it states that Operations prepares drafts and the HOD approves, and it does **not** fall back to hand-typed "Add Class". Coverage of the timetable surface is kept; the fiction is not. |
| Clock-dependent assertion | `scripts/render-check/run.mjs` | `challans: shows the amount and the due date` now asserts the *shape* of a due date (`/due:?\s*\d{1,2}\s+[A-Za-z]{3,4}\s+\d{4}/i`) instead of the literal `Due 30 Sep`. Two ways it was rotten: the fixture's `2026-09-30` has passed, so the row renders "Overdue — due …", and `en-IN` formats September as **"Sept"**, not "Sep". |
| Snapshot constants | `scripts/render-check/run.mjs` | The two seeder checks no longer pin `759` / `144`. They now assert the bank's **shape**: every programme present and non-empty, branch counts summing to the total, a ≥600 floor (catches a truncated CSV), and zero rows without a sub-topic. The bank is now 951 rows / 192 sub-topics across **four** programmes (B.Com 262 · B.Sc 259 · BA 238 · BCA 192). |

```
npm run test:render          → 391/391 checks passed, 0 mount crash(es)
npm run test:render:courses  → 126/126
npm run test:render:pyq      →  27/27
```

### 9.2 Dependencies

| Change | Effect |
|---|---|
| Removed `jsonwebtoken`, `openai`, `axios` from root `dependencies` | All three were imported by nothing in `src/`. `openai` is already a `functions` dependency (and at a different major — root had 7.x, functions 4.x). |
| Removed `@types/jsonwebtoken` from `devDependencies` | Dead once the package went. |
| `overrides: { "dompurify": "^3.4.17" }` | Clears the **one critical** advisory (DOMPurify, pulled in by `jspdf` / `html2pdf.js`). |
| `sharp` `^0.33.5` → `^0.35.5` | Clears the libvips/libheif CVEs. Dev-only (brand asset pipeline). Verified: `npm run brand:build` still produces all 22 PNGs and 14 SVGs — the regenerated binaries were reverted, since a libvips-version pixel diff does not belong in a security commit. |

```
npm audit before: 23 (1 critical, 11 high, 7 moderate, 4 low)
npm audit after:  19 (0 critical,  8 high, 7 moderate, 4 low)
```

The remaining 8 "high" are Node-side or need a major upgrade: `firebase`/`@firebase/*` (the advisory
range spans every published version — nothing to move to) and `@grpc/grpc-js` (server SDK path, not
in the browser bundle), `brace-expansion`, `source-map-js`, `undici` (build tooling), and `vite`
(dev server; Vite 5 → 7/8 is a migration of its own, deliberately left out of this pass).

### 9.3 CI

`.github/workflows/ci.yml` — the frontend job now runs:

- `npm run test:render` (the suite that was red — this is the fix that matters)
- `npm run test:render:pyq`
- `npm audit --audit-level=critical` as a gate, then the full report un-gated

and the functions job runs the **full** rules suite (`npm run test:rules`), now **blocking**.

**That gate immediately paid for itself.** The suite had never run in this pipeline, so its first
run was also its first measurement — and it came back **96 pass, 1 fail**:

```
not ok 26 - academic workflow schedule approvals
  not ok 1 - keeps published legacy schedule readable but blocks direct staff edits
    7 PERMISSION_DENIED: Unable to evaluate the expression as the maximum of
    1000 expressions to evaluate has been reached. for 'update' @ L1400
```

L1400 was the `classSessions` `allow update` rule — the rule the client goes through to **mark
attendance** (`src/modules/admin/api/attendanceApi.ts`), reschedule a session
(`FacultyReschedule`), and touch one from the HOD dashboard. A rule that cannot be evaluated does
not fall back to "allow" or "deny the field": **it denies every caller**. So this was not a
hardening nit, it was an outage that no other test in the repository could see, sitting in the
collection the product uses every day.

The rule was rewritten with identical semantics and a fraction of the cost: one tenancy read plus a
plain `collegeId` equality instead of `sameCollege()` on both sides (the request-side call
re-expanded `isSuperadmin() → exists()` for no extra safety), and `role()` evaluated once up front
so the common staff caller short-circuits before the principal-only `diff().affectedKeys()` branch.
Suite is **97/97** and the step is a gate.

Two CI notes, since they cost real time here: job logs were not reachable from this environment
(`gh api .../actions/jobs/<id>/logs` returned 0 bytes), and the token cannot post PR comments, so
the failing cases are emitted as **check-run annotations** — visible in the PR without opening a
log. That step is kept permanently.

### 9.4 Docs

- `README.md`: seed count corrected to **951 across B.Com / BA / B.Sc / BCA, 192 sub-topics**; the
  auto-timetable entry point corrected from "Class Schedule → Auto Generate" to
  "Academic workflow → Bulk timetable tools → Auto Generate".

### 9.5 Second pass — the rest of the audit, worked

Everything below was done after the first fix log, in the same session and on the same branch.

#### 9.5.1 P1-1, part 1 — thirteen read paths scoped, six emulator cases added

Two families were role-checked and never college-checked. Both are now scoped on the claim.

*The per-college collections* — `/colleges/{collegeId}/` + `schedules`, `attendance`,
`attendanceRecords`, `assessments`, `scores`, `activities`, `milestones`. The block's own comment
claimed "the collection path itself is the tenant boundary". It is not: `{collegeId}` is a path
segment the caller supplies, and `isStaff()` alone let a faculty token at college A read
`colleges/B/attendance` by naming B. The neighbouring `announcements`, `feeStructures` and
`feePayments` blocks already compared the claim, so this was an oversight in seven blocks, not a
design decision. Fix: `isSuperadmin() || (isStaff() && collegeId() == collegeId)` — a claim
comparison, no document read, and **no client query change**, because the path is fixed for the
whole list query.

*The top-level collections* — `resumes` (list), `resumeDownloads` (list), `proctoringLogs` (read),
`assignments` (read), `submissions` (list), `attendanceSummaries` (list). In each, the `get` rule
was scoped and the `list` rule was not, so any staff account could enumerate every college's rows:
student résumés, who downloaded them, proctoring evidence (another student's exam behaviour), and
attendance summaries. Each now requires `sameCollege(resource.data)`. `submissions` keeps a
`studentUid`/`studentId` arm because the student path in `assignmentApi.fetchStudentSubmission`
asks for its own row by `studentUid` with no college filter — verified by a test rather than
assumed.

Six new cases in `functions/test/firestore.rules.test.ts` (`legacy reads stay inside the caller's
college`): own college allowed, one college over denied for all seven path-scoped and all six
top-level collections, superadmin unaffected, student self-service intact. Suite 97 → **102 cases,
all green**, run on the emulator in CI.

*What is deliberately NOT scoped, and why.* The remaining role-only reads in the file were
triaged one by one; these are correct as they are:

- `universities`, `prep_subjects`/`topics`/`prep_papers`/`prep_mcq_sets`/`universalQuestions`
  (published-only), `accessProducts`, `questionBank_meta`/`questionBank_content`,
  `systemConfig`: platform-wide or catalogue data, not tenant data.
- `platform_employees`, `officeStaff`, `prep_progress`, `ai_generation_logs`, `notifications`,
  `reads`: personal-scoped (`request.auth.uid == …`), which is tighter than a college check.
- `payments`, `fees`, `feeStructures`, `issuedBooks`: already owner-or-finance scoped.
- `questions`, `papers`, `testPapers`, `papers_universal`, `questionReviews`, `reviewQueue`,
  `topics`, `facultyTopics`, `curriculum`: shared authoring catalogues spanning colleges by
  design — the paper/question bank is cross-college, and the file documents that intent.

The rest of the "42" in §4 of this report is that list: the count was right, but most of the 42
turned out to be deliberate platform-wide or personal data, and the seven path-scoped blocks plus
six top-level ones were the real leak.

#### 9.5.2 P1-3 — images: 41.3 MB → 2.7 MB

All 64 prep-course illustrations were PNGs at full resolution, imported through the bundler. 54 of
them were over 300 kB; the largest, `bcg-matrix.png`, was 1.7 MB. They are now WebP, capped at
1280 px wide (no enlargement), quality 82: **41.3 MB → 2.7 MB, 15.5× smaller**. Every one was
imported from a single file (`src/modules/prep/prepPublicShared.tsx`), so the switch is 64 import
paths and no component changes.

`dist/assets` 55 MB → **16 MB**, and zero emitted images over 300 kB. The offline shell shrank with
it: PWA precache 25 entries / 2,928 KiB → 24 / 2,215 KiB.

#### 9.5.3 P1-2 — the preload: split done, the rest is a data-layer job

`main.tsx` imports `src/Firebase/config` on its first line, and Vite modulepreloads everything
statically reachable from the entry. That module initialised all four services, so the login
screen pulled Firestore, Storage, RTDB and Functions — 182.7 kB gzip — before it could ask for a
password. Additionally, one merged `'firebase'` manual chunk made Auth and Firestore
indistinguishable to the bundler.

Done: `config.ts` now holds only the app handle, Auth and the build-time config check; the data
services moved to a new `src/Firebase/data.ts`; 114 files had their imports split mechanically;
`manualChunks` splits `firebase-auth` (33.5 kB gz) from `firebase-data`; and three modules the
entry reaches statically stopped importing the data SDK at module scope (Layout's college-name
lookup, `ChangePasswordForm`'s callable, `identityBackend.syncMyIdentity`).

**Still preloaded after that split** — the fix needed one more pass, done next.

Four static chains connected the entry point to `firebase-data`, all through things that cannot be
lazied without changing when state initialises: `Layout`'s two hooks, `StudentDataProvider`,
`StudentLayout`, and `StudentCourseAccess`'s hook. Each was broken *inside the function that needs
the SDK* instead, so no component mounts differently, nothing renders later, and there is no new
loading state:

| Chain | Cut made |
|---|---|
| `AuthContext → auth.ts → firebase-data` | `resolveIdentity()` imports Firestore + `db` before its first read. It only runs for a signed-in user, and this module is on the boot path. |
| `Layout → useCollegeBranding / useAccessSettings` | the react-query `queryFn` imports its API module; the hooks no longer import it at module scope. |
| `courses/routes → useCourseAssignments → courseCloud` | both modules imported inside the effect, the only place they are used. |
| `student/routes → StudentLayout → useStudentData → studentDataApi` | the API modules imported inside `fetchData()`; every call site already lived in that async function. |

**Entry preload: 457 kB → 449.7 kB (after the split) → 272.6 kB gzip, 5 chunks**, with
`firebase-data` no longer among them. Firestore, Storage, RTDB and Functions now load at the first
moment any of them can be used — when a session exists. That is **−184 kB gzip, −40 %**, at the top
of the range this report predicted.

The remaining 272.6 kB is the login screen itself: mui-core 133.7, react-core 57.5, framer-motion
40.8 (the login card animation), firebase-auth 31.0, mui-icons 9.6. The original <250 kB target is
therefore reachable only by dropping that animation or re-skinning the login form without MUI —
both visual changes, so they are a product decision rather than a performance one.

#### 9.5.4 P2 housekeeping

- **5.2 i18n.** Dictionaries are complete (6 languages × 233 keys, full parity) but only 15
  components and 147 `t()` calls use them — the student area and shared chrome. README now says
  exactly that and states the gap is reach, not content.
- **5.3 `src/scripts/`.** `seedStudents.ts` (5,077 lines) and `seedFaculty.ts` moved to
  `scripts/`, imports repointed, header comments rewritten. The dead-code guard's `src/scripts`
  exclusion is **deleted** — that exclusion is exactly why the largest file in the repository was
  invisible to the guard.
- **5.4 rules naming.** `current-firestore.rules` → `firestore.rules`, with `firebase.json`, the
  emulator tests (which read the file by path), the render harness, README and code comments
  updated. Dated reports under `docs/` keep the old name; they are historical records.
- **5.6 hosting headers.** `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options:
  SAMEORIGIN`, an **enforced** CSP limited to `base-uri 'self'; object-src 'none'; frame-ancestors
  'self'; form-action 'self'`, and a **report-only** full CSP (script/style/connect/img/font/
  worker/frame for Firebase, Google Fonts, Storage, Sentry). Deliberate: only directives that
  cannot break a fetch are enforced, because a wrong enforced `script-src` takes the app down on
  the first deploy and there is no staging project to rehearse on. Watch the report-only
  violations in the browser console, then promote it in one step.
- **5.5 PWA precache warning.** This report's diagnosis was wrong. `globIgnores` only carried
  `**/stats.html`, and `workbox-*.js` matched real emitted files — there was no warning to fix.
  What *was* wrong is adjacent and my own doing: after the P1-2 chunk split the precache glob still
  named `assets/firebase-*.js`, which no longer existed, so the offline shell silently lost the
  auth chunk. It now precaches `assets/firebase-auth-*.js` and deliberately leaves the data chunk
  to the runtime `/assets/` route.
- **5.1 docs drift.** README's seed count and timetable path were corrected in the first pass;
  no other live document repeats the stale numbers.

#### 9.5.5 A real browser, at last

Everything in this repository was jsdom or pure logic: 391 render checks that mount components in
isolation, 713 unit tests, 1,283 backend tests. Nothing had ever opened the app in a browser, so
four ordinary regressions were structurally invisible — a broken `/` redirect, a guard that only
works for in-app clicks and not for bookmarks, a language switch that does not repaint, and a
phone-width layout that scrolls sideways.

`npm run test:e2e` now runs six checks on two projects (desktop Chrome and a Pixel 7 — the budget
Android this product is sold to):

- `/` lands an anonymous visitor on `/login`, form usable;
- a **cold** deep link to `/admin/dashboard` bounces to `/login`;
- the same for `/student/dashboard`;
- switching the interface language repaints the submit button in Kannada and survives a reload —
  asserted on the button, not the page, because the language `<select>`'s own options are native
  names and a whole-page Kannada assertion would pass before anything was switched;
- no horizontal overflow at 390 px;
- no uncaught exceptions during boot.

The suite stops at the sign-in wall deliberately: there is no Firebase project in CI and the
emulator archives cannot be fetched, so a faked session would test the fake. The authenticated
contract stays with the render harness and the 102-case rules suite.

Two things this cost, both worth recording because they will recur:

1. **The first run failed 12/12, and the app was fine.** With `VITE_FIREBASE_*` unset,
   `getAuth(app)` throws `auth/invalid-api-key` during module init, React never mounts, and every
   assertion fails against a blank page. The dev server now receives a placeholder but well-formed
   config; nothing in the suite touches a network.
2. **The job is pinned to `ubuntu-24.04`.** On `ubuntu-latest` (mid-migration to Ubuntu 26)
   Playwright's `install --with-deps` failed with a bare exit code and no explanation. The install
   now tries the browser alone, probes that it launches, and only then reaches for apt.

#### 9.5.6 Vite 5 → 7

`npm audit fix --force` wanted to downgrade firebase to 9.14.0 alongside this, so it was done
deliberately: `vite ^5.3.1 → ^7.3.8`, `@vitejs/plugin-react ^4.3.1 → ^5.2.0`.
`vite-plugin-pwa` 1.3.0 already declared `^7` in its peer range. Advisory count 19 → **17**; the
vite advisory is gone, and the remaining highs have no patched version in range
(`firebase`/`@grpc/grpc-js` — the advisory covers every published version — plus build-time
`brace-expansion`/`undici`).

#### 9.5.7 The `dangerouslySetInnerHTML` review — one live hole, and it was elsewhere

§5.3 said the six `dangerouslySetInnerHTML` sites were "worth a glance each". Done, and the glance
was worth it — but not at the sites the count named.

**The six named sites are clean.**

| Site | Verdict |
|---|---|
| `pdfGenerator.generatePaperHTML` | escapes every field via `escapeHtml` before interpolation |
| `FacultyPaperGenerator.generatePreviewHTML` | same, with a comment explaining the print-window risk |
| `PaperPDFPreview` | delegates to `generatePaperHTML` — escaped |
| `prepPublicShared` ×2 (KaTeX) | `katex.renderToString(math, { throwOnError: false })` — KaTeX's `trust` defaults to **off**, so it emits no `\href`/`\htmlData`/raw HTML, and it escapes its own text |

**The hole was in a sink the count never saw.** Counting `dangerouslySetInnerHTML` misses every
other way a string becomes markup, and there are three more here: one `innerHTML =` assignment and
two `document.write()` calls.

- `timetableExport.buildHtml` → `innerHTML` — escapes everything. Clean.
- `View360.printToPDF` — wrote `${title}` **raw** into a same-origin print window. `title` carries
  student and college names, which staff type. Fixed (escaped).
- **`AIStudyCompanionModal.handlePrint`** — wrote an entire AI-generated study pack into a
  same-origin window **with no escaping at all**: title, subject, overview, summary bullets,
  concept definitions, formulas, worked-example steps, exam questions, model answers and examiner
  tips. Every one of those fields is language-model output, steered by the user's prompt and by any
  source document fed to it.

That is a **stored-XSS path**: a model reply containing `<img src=x onerror=…>` executes in the
app's own origin, in a window whose `window.opener` points back at the app. It is reachable by
anyone who can open the study companion, and it is precisely the class of bug a
`dangerouslySetInnerHTML` grep gives you false comfort about.

Fixed by extracting the markup into a pure, tested builder
(`src/shared/utils/studyPackHtml.ts`) that escapes every interpolated value, with
`escapeHtml` moved to a dependency-free module so a component does not have to import a PDF library
to escape a string. Seven unit tests pin the behaviour: an `<img onerror>` payload and a
`</div><script>` payload must arrive as inert text, and ordinary content with `&`, `<` and `%` must
survive intact rather than being stripped — escaping must not become deletion.

The general lesson, recorded because the repo still has this shape: **grep for sinks, not just for
one sink name.** `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and
`new Function` are the same risk class, and this codebase had three of them outside the count
(no `eval` or `new Function` anywhere, which is worth saying out loud).

### 9.6 Verification after the second pass

```
npx tsc --noEmit              → 0 errors
npm run test:unit             → 713 pass, 0 fail
npm run test:render           → 391/391
npm run test:render:courses   → 126/126
npm run test:render:pyq       →  27/27
npm run validate:courses      → 4/4 packs valid
npm run check:dead-code       → 0 orphans (614 files, guard coverage widened)
npx vite build (Vite 7)       → success; dist/assets 16 MB; entry preload 272.6 kB gz
npm audit                     → 17, 0 critical
functions test:rules (CI)     → 102/102, 0 fail
```

### 9.7 What is actually left

1. **The last 23 kB to the <250 kB target.** Only reachable by changing what the login screen
   renders (drop the framer-motion animation, or replace MUI there). Product decision, not
   engineering debt.
2. **`firebase` / `@grpc/grpc-js` advisories.** No patched version exists; the only fix is a
   firebase downgrade, which is worse. Track upstream.
3. **The other role-only reads from §4's "42".** Each was triaged in 9.5.1 and left as it is:
   platform catalogue data, published-only prep content, or personal-scoped (`uid`-keyed) rows.
   If a future collection is added to those families, scope it on the claim from day one.
4. **Field performance.** A real browser now runs (see 9.5.6), but the numbers in §P1-2 are still
   build artefact sizes, not Lighthouse or RUM on a 4G connection in a tier-2 town. Worth measuring
   once the app is deployed with real traffic.
