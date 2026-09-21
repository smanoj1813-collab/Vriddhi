# Vriddhi — Complete project audit (2026-09-21)

**Scope:** full tree at `4763e91` (PR #67 merge, main). Build, typecheck, unit tests,
dead-code scan, dependency audits (frontend + functions), bundle analysis, CI review,
security-rule verification, i18n completeness, and maintainability metrics.
**Method:** executed, not inferred — `tsc`, `vite build`, `node --test` (frontend +
functions), `npm audit`, `rollup` chunk analysis, static grep sweeps. Supersedes
`docs/COMPLETE_PROJECT_AUDIT_2026-09-07.md` for the areas it re-checked.

---

## 1. What was executed (all green)

| Check | Result |
| --- | --- |
| Frontend `tsc --noEmit` | **0 errors** |
| Frontend `vite build` (prod) | **succeeds**, 32s |
| Frontend unit tests (`npm run test:unit`) | **186/186 pass** |
| Dead-code scan (`check:dead-code`) | **clean** — 304/324 files reachable, 0 unlisted orphans |
| Functions `tsc` build | **clean** |
| Functions unit tests | **656/656 pass** |
| Committed secrets sweep (API keys, tokens, service accounts) | **none found** |
| `eval()` / `new Function` usage | **0** |
| Working tree | clean |

**Security posture is the strongest part of the project.** Verified in this tree
(the 09-07 audit's §4 issues are fixed):

- `storage.rules` is claim-only — role/college from `request.auth.token` only,
  profile-doc resolution removed.
- Express `api` auth (`functions/src/middleware/auth.ts:138`) — role/college from
  verified ID-token claims only, **fails closed** when a claim is missing;
  profile doc is read for name/email display only.
- RTDB fully locked (`.read/.write: false`).
- Service-account keys git-ignored with an explanatory note; `.firebaserc` tracked
  intentionally (no secrets inside).
- i18n is genuinely complete: **225 keys × 6 languages** (en/hi/kn/ta/te/ml) with
  per-key English fallback.
- PWA service-worker strategy is correct (NetworkOnly for Firebase/API, no-cache
  `sw.js`, one-tap reload prompt).

---

## 2. Where we are lagging (ranked by risk/effort)

### P0 — Vulnerable input parsers (highest real-world risk)

1. **`xlsx@0.18.5` (frontend, runtime dep) — 2 HIGH advisories, no fix on npm.**
   Prototype pollution + ReDoS (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9).
   The fixed line (0.20.3+) is published only to SheetJS's own CDN, not the npm
   registry. This library parses **user-uploaded spreadsheets in the browser**
   (student/faculty imports: `shared/utils/attendanceExport.ts`,
   `faculty/components/AssessmentTestReports.tsx`,
   `superadmin/services/standardizedTemplate.ts`) — untrusted input hitting a
   prototype-pollution sink.
   → Move to `xlsx@0.20.3` from `https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx-0.20.3.tgz`
   (pin in package.json), or replace the .xlsx path with a maintained lib
   (ExcelJS); CSV imports already use papaparse.

2. **`pdfjs-dist@3.11.174` (functions) — HIGH: arbitrary JS execution when parsing
   a malicious PDF.** This is the paper-parsing path
   (`functions/src/paperParsing.ts`) — i.e. a faculty/admin-uploaded PDF executed
   inside your Cloud Function. Audit suggests 6.x (major bump; verify the
   node/canvas-free render path in `utils/pdfRenderer.ts` before switching).
   → At minimum isolate paper parsing in its own function with a hard
   `timeoutSeconds` + no other routes, and pin a patched pdfjs.

3. **`@xmldom/xmldom@0.8.13` via `mammoth@1.12.0` (frontend) — HIGH, patch
   available.** Parses uploaded .docx syllabi in the browser. `npm audit fix`
   covers it.

4. **`firebase-admin@12.7.0` (functions) — drags in** `fast-xml-parser@5.9.3`
   (HIGH), `js-yaml 4.x` (HIGH, CVE-2026-59870), and moderate CVEs in
   `@google-cloud/firestore` / `@google-cloud/storage`. Bumping to `^14` clears
   most of them.
   (`tar` CRITICAL is dev-only via `firebase-tools` — CI machines only, not a
   runtime risk.)

5. **No audit gate in CI.** Add `npm audit --omit=dev --audit-level=high` to the
   frontend job and `npm audit --audit-level=high` to the functions job
   (fail on new regressions once current list is cleared).

### P1 — Test pyramid is lopsided

- Functions: 656 tests — excellent.
- Frontend: 186 tests, **all in `src/shared`** (12 utils, 2 api, 1 pwa) + 1
  superadmin service. **Zero tests in admin (38.5k LOC), faculty, student,
  superadmin pages, auth.** No component tests (no React Testing Library),
  no e2e (no Playwright/Cypress anywhere).
- `npm run test:rules` exists but **is not in CI** — Firestore rules are your
  security boundary; a broken rules edit currently only fails when someone runs
  the suite by hand.
- **`prep-app/` (standalone Vite app, 14 files) is in no CI job at all** — it
  will rot silently. Either CI it or retire it (see P3-4).

### P2 — CI/CD gaps

- **No lint anywhere in CI.** Functions has an ESLint config that never runs;
  the **frontend has no ESLint config at all** on 121k LOC.
- **Node version mismatch:** `functions/package.json` declares `engines.node: "22"`
  but CI builds functions on **Node 20**. Test matrix doesn't match production
  runtime.
- No e2e smoke, no performance budget (Lighthouse CI), no deploy automation
  (by design, operator-run — fine, but `deploy:all` can still ship mismatched
  rules+functions+hosting sets).

### P3 — Product/architecture gaps

1. **Two Prep implementations.** `src/modules/prep` (4 files, public catalog
   routes, in build) **and** `prep-app/` (own `firebase.ts`, own auth modal,
   own build, not in CI). Same feature, two codebases — guaranteed drift.
   Decide: consolidate into `src/modules/prep` or delete `prep-app/`.
2. **`parent` role has no portal** — falls back to `/student/dashboard`
   (`src/modules/auth/roleRoutes.ts:26` comment: "No parent portal is built
   yet"). If parents are a real user segment, this is a missing module; if not,
   the role should be removed from provisioning.
3. **90 deployable functions** (87 `onCall` + 2 `onSchedule` + 1 `onRequest`) —
   up from 47 on 2026-09-07 (+43 in two weeks). Each is a separate cold-start
   surface. No error tracking (no Sentry/Crashlytics; only `console.*`) means
   failures in the 80+ callables are only visible in Cloud Logs. Add monitoring
   and consider grouping related callables (e.g. per-domain Express endpoints)
   once the count keeps climbing.
4. **26,482 lines of seed data compiled into the functions package**
   (`functions/src/data/*.ts` — 13 files: mcom/bsc/ba/bba/com/aca/aptitude seed
   arrays). `functions/lib` is 4.1 MB. Every function in every region deploys
   and cold-loads data that only a seeder should ever touch. Move to seed
   scripts (you already have seeding tooling in `scripts/`) or Firestore docs.
5. **God files.** Largest: `functions/src/studentAssessments.ts` 2,818 LOC,
   `classSchedule.ts` 2,328, `routes/ai-chat.ts` 1,500, `paperParsing.ts` 1,385;
   frontend `superAdminApi.ts` 2,379, 11 files over 1,100 LOC (Layout 1,182,
   PrepContentStudioTab 1,333, AdminClassSchedule 1,224, View360 1,199…).
   228 `as any` casts + no ESLint = no guardrail against this growing.
6. **`src/scripts/seedStudents.ts` (5,077 LOC)** lives inside `src/` and is
   exempted wholesale from the dead-code scan (`check-dead-code.cjs:36` skips
   `src/scripts/`). It's typechecked but unreferenced — fine as a tool, but it
   should live in `scripts/` next to the other tooling so `src/` = shipped app.
7. `SuperAdminUniversityDetail.tsx` still serves a hardcoded Karnataka
   university list (TODO at line 34) — the one remaining static-data screen.

### P4 — Performance / mobile weight (mobile-first product)

- **PWA precache: 7.28 MB, 236 entries** (`dist` total 8.6 MB). For
  4G/mobile-data students in India the first install is heavy.
- First paint shell (all static imports of `main.tsx`): `index.js` 598 kB +
  `firebase` 874 kB + `mui-core` 458 kB + `react-core` 179 kB + `utils`
  (framer-motion) 130 kB + `mui-icons` 24 kB + CSS 163 kB ≈ **2.4 MB raw /
  ~670 kB gzip** before any route chunk.
  - Firebase is initialized at module load (`main.tsx` → `./Firebase/config`)
    so the 874 kB SDK is on the critical path for the login screen too.
    Auth-only init at start, lazy firestore/database/storage until needed,
    would trim the login path substantially.
- Route chunks: `SuperAdminCurriculum` 503 kB, `FacultyAssessments` 243 kB,
  `FacultyPaperGenerator` 142 kB, `AdmissionCenter` 39 kB — and heavy libs
  (`xlsx` 424 kB, `pdf` 593 kB, `charts` 462 kB) are **statically** imported by
  module pages (xlsx via `attendanceExport.ts`, `AssessmentTestReports.tsx`,
  `standardizedTemplate.ts`), so they download on route load, not on action.
  `pdfDownloader.ts` already does it right with `await import()` — extend that
  pattern to xlsx/charts.
- No Lighthouse CI / performance budget anywhere.
- Minor: `functions/src/middleware/auth.ts` does an extra Firestore profile read
  on **every** API request for display name/email — cacheable in the token
  mint or in an LRU.

### P5 — Hygiene (minor)

- `.env.production` is tracked — it only holds the public API base URL, so it's
  safe, but it invites committing real secrets later. Consider dropping it into
  Firebase Hosting's env or keeping it ignored.
- `attic/` (138 files, 1.2 MB) is a deliberately tracked reference archive —
  fine, but say so in its README so future readers don't treat it as dead
  weight.
- 324 `console.*` calls across src+functions — mostly `console.error` (OK), but
  with no logging service attached, "structured" is aspirational.
- `lucide-react@^1.21.0` + `@types/react@^19` against `react@18` runtime: types
  ahead of runtime; harmless today, drift risk on the next React bump. Pick a
  lane (upgrade to React 19 or pin `@types/react@^18`).

---

## 3. Suggested order of attack

1. **This week (security, ~1–2 days):** SheetJS CDN pin for xlsx,
   `npm audit fix` for @xmldom, `firebase-admin@^14`, pdfjs-dist upgrade or
   isolation of paper parsing; add `npm audit` gates to CI (non-blocking first).
2. **This week (CI, ~half day):** add `test:rules` to CI, add frontend ESLint
   (typescript-eslint + react-hooks) and run it, fix CI Node to 22 for
   functions.
3. **Next sprint (tests, ~3–5 days):** RTL component tests for the auth module
   (login + role routing — your riskiest surface), and one Playwright smoke
   (login as student/faculty/admin/superadmin → dashboard renders) against the
   emulator in CI.
4. **Next sprint (perf, ~2–3 days):** lazy-import xlsx/charts from module pages,
   defer firebase firestore/database/storage past the auth screen, add
   Lighthouse CI budget, shrink PWA precache.
5. **Backlog:** move seed data out of `functions/`, consolidate `prep-app/`,
   parent-portal scope decision, error monitoring (Sentry/Crashlytics), split
   the four 1,500+ LOC function files.

---

## 4. Numbers at a glance

| Metric | Value |
| --- | --- |
| Frontend LOC (src) | ~120.9k (admin 38.5k, faculty 19.9k, superadmin 19.9k, student 12.6k) |
| Functions LOC | 53.1k (of which **26.5k is seed data**) |
| Deployables | 87 onCall + 2 onSchedule + 1 onRequest |
| Tests | 186 frontend (all in shared) / 656 functions / 2 rules suites (not in CI) / **0 e2e** |
| Prod build | 8.6 MB dist; first-paint shell ~2.4 MB raw / ~670 kB gzip; PWA precache 7.28 MB |
| Vulnerabilities (runtime) | 2 HIGH frontend (xlsx ×2, no npm fix; xmldom ×10, fixable), 1 HIGH + 5 HIGH/1 CRIT functions (pdfjs, tar-dev, node-pre-gyp, fast-xml-parser, js-yaml, brace-expansion, canvas) |
| TODOs | 5 (1 real product gap: university data; 2 admin stats stubs) |
| Mock-data screens | **0 remaining** (all 6 from the 09-07 audit now fetch real data) |
