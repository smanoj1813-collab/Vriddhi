# Vriddhi — Complete Project Health Audit

**Date:** 2026-09-26
**Branch:** `arena/01a0dd4b-vriddhi` (from `main` @ `6de0b35`, PR #85)
**Method:** Everything below was re-verified from scratch on this commit — builds, test suites,
render checks, dead-code scan, secret scan, rules review, dependency audits, contract mapping
(routes ↔ navigation, frontend ↔ backend callables). Prior reports (`AUDIT_REPORT.md`,
`docs/PROJECT_AUDIT_2026-09-21.md`) were treated as claims, not evidence; their fixes were
confirmed merged (PR #80) and re-tested.

---

## 1. Executive summary — health grade: **B+ (strong, with CI-integrity gaps)**

| Dimension | Grade | One-liner |
|---|---|---|
| Code correctness | **A** | Frontend tsc 0 errors · 513/513 tests · 382/382 render mounts · build ✅. Functions tsc 0 errors · 1025/1025 tests (when run honestly — see P1-1). |
| End-to-end wiring | **A** | 32/32 static navigation targets resolve across 157 routes · all 86 frontend callable references exist on the backend · REST routes match. |
| Security posture | **A−** | Claims-based Firestore rules, no `if true`, RTDB locked, deny-by-default permission matrix, no secrets in tree. Gaps: unused-but-declared `helmet`, CORS origin reflection, rules suite mostly not in CI. |
| CI integrity | **C** | CI is green but *cannot* fail on backend tests (`\|\| true`), skips 6 test files, runs only a filtered slice of the 98-test rules suite, and has no lint or audit step. |
| Performance / bundle | **B−** | Initial JS ≈ 2.4 MB raw (~700 KB gzip); PWA precache 9.7 MB / 376 entries — heavy for the mobile-first student audience. |
| Dependencies | **B** | Root: 2 high (vite, sharp — both dev/build-time, major upgrades pending). Functions: 11 moderate (express stack). eslint 8 is EOL. |
| Repo hygiene | **C+** | 13 root MD files (incl. transient `PR_BODY.md`/`PR_SUMMARY.md`), 21 MB of marketing/brand binaries tracked, typo dirs (`src/Docs/firbase`), stale `Layout_PATCH.txt`, 5k-line seed files inside `src/`. |
| Documentation | **A−** | Excellent README (setup, deploy, data model, scripts) and deep docs/ archive; needs consolidation, not more content. |

**Bottom line:** the application itself is healthy and production-grade at the code level —
type-safe, well-tested, fully wired end to end, and the P0/P1 blockers from the 2026-09-24 audit
are verifiably fixed and merged. The real risk has moved **from the code to the pipeline**: CI can
report green while backend tests, most security-rules tests, and lint are failing or not running.
That is the single most important thing to fix.

---

## 2. Verified evidence (run on this commit, 2026-09-26)

| Check | Command | Result |
|---|---|---|
| Frontend type-check | `npx tsc --noEmit` | ✅ 0 errors |
| Frontend production build | `npm run build` | ✅ 44.8 s, PWA generated (376 precache entries, 9.7 MB) |
| Frontend unit tests | `npm run test:unit` | ✅ **513/513** pass, 0 fail |
| Frontend tests *not registered* in CI | `node --import tsx --test …` (4 files) | ✅ 41/41 pass — **they simply never run in CI** |
| Dead-code scan | `node scripts/check-dead-code.cjs` | ✅ 531 files, 478 reachable, 0 unlisted orphans |
| Course-pack validation | `npm run validate:courses` | ✅ 8 modules · 35 lessons · 605 quiz items |
| Render checks (courses, in CI) | `npm run test:render:courses` | ✅ 60/60 |
| Render checks (full, **not** in CI) | `npm run test:render` | ✅ **382/382** mounts, 0 crashes |
| Functions type-check | `functions: npx tsc` | ✅ 0 errors |
| Functions unit tests (all 53 files) | `node --import tsx --test test/*.test.ts` | ✅ **1025/1025** pass |
| Functions lint | `npx eslint --ext .ts src` | ❌ **35 problems (12 errors, 23 warnings)** — not enforced anywhere |
| Route connectivity | script: every static `navigate()` target vs 157 defined routes | ✅ 0 unresolved |
| Callable contract | script: 86 frontend `httpsCallable` names vs ~100 backend exports | ✅ 0 missing; 4 unreferenced exports are documented legacy/server-only (`createStudentAuth`, `syncStudentsToAuth`, `provisionUser`, `backfillAttendanceSummaries`) |
| Secret scan | `git grep` for API keys, private keys, hardcoded credentials | ✅ none in tracked source |
| Firestore rules | manual review + grep | ✅ claims-based identity, role canonicalisation, **0** `if true`; 126 match blocks; 98-test rules suite exists |
| RTDB rules | `database.rules.json` | ✅ fully locked (`read/write: false`) |
| Storage rules | grep | ✅ single intentional public read (`prep-media`) |
| `npm audit` root | — | ⚠️ 3 (2 high: `vite`, `sharp` — dev/build-time only, major-version fixes; 1 moderate) |
| `npm audit` functions | — | ⚠️ 11 moderate, 0 high/critical |
| Prior-audit P0/P1 fixes | grep/route inspection | ✅ all present: `/unauthorized` page, `colleges/:id/edit`, `admin/assessments/:id`, root+module ErrorBoundary, `escapeHtml` in paper preview, config guard screen |

Scale for context: **~169 K lines** of frontend TS/TSX (531 files), **~69 K lines** of Cloud
Functions TS (104 files), **103 test files**, 1,052 tracked files, 20 MB git pack.

---

## 3. Findings, ranked

### 🔴 P1 — CI integrity (green CI currently does not mean green code)

1. **`functions/package.json` → `test:unit` ends with `|| true`.**
   The CI step "Functions unit tests" can never fail. Any backend regression merges silently.
   *(All 1025 tests pass today — the danger is prospective, but it is the highest-impact one-line
   fix in the repo.)*
   **Fix:** delete `|| true`.

2. **Six test files never run in CI:**
   - Functions: `test/calendar.test.ts`, `test/dailySummary.test.ts` (not in the `test:unit` list).
   - Frontend: `src/modules/superadmin/utils/freshness.test.ts`,
     `src/shared/utils/curriculumMatcher.test.ts`, `src/shared/utils/parseCSV.test.ts`,
     `src/shared/utils/sessionDate.test.ts` (not in the root `test:unit` list; all 41 pass).
   **Fix:** register them, or switch both `test:unit` scripts to glob discovery
   (`node --import tsx --test "test/**/*.test.ts"`) so new files are picked up automatically.

3. **The full Firestore rules suite is not in CI.** `functions/test/firestore.rules.test.ts` has
   **98 tests / 2,166 lines**, but CI runs only `test:rules:course-security` — a `--test-name-pattern`
   slice ("course assignments…|connect with mentors|academic calendar"). Java 21 is already
   provisioned in the CI job, so the emulator is available; the rest of the suite (fees, grades,
   admissions, office, identity…) simply never executes. Also, `test:rules` cannot run in dev
   sandboxes without Java — worth documenting.
   **Fix:** run the full `npm run test:rules` in CI (nightly at minimum; per-PR if runtime allows).

4. **No lint step in CI; functions lint already has 12 errors.** ESLint 8 (EOL) is configured for
   functions only and never runs in the pipeline; the frontend (169 K lines) has **no linter at all**.
   **Fix (staged):** add `eslint` to the functions CI job with `--max-warnings` ratchet; adopt
   ESLint 9 flat config (or Biome) for the frontend starting with `recommended` + `react-hooks`.

5. **No dependency-audit step.** Neither job runs `npm audit`; the pending major bumps (vite 8,
   sharp 0.35) are tracked only in prose.
   **Fix:** add `npm audit --audit-level=high` (non-blocking report or blocking on `high`+ in
   production deps).

### 🟠 P2 — Security & backend polish

6. **`helmet` is declared in `functions/package.json` and claimed in the README, but never used**
   (`grep helmet functions/src` → 0 hits). Either apply it to the Express apps (`api`, `pdf`) or
   remove the dependency and the README claim. Documentation that overstates security is itself a
   risk.

7. **CORS reflects any origin with credentials** (`cors({ origin: true, credentials: true })` in
   `functions/src/index.ts`). Acceptable because auth is Bearer-token based (no cookies), and it is
   commented as deliberate — but a production allow-list (hosting domain + localhost) is cheap
   defence-in-depth. `cors.json` (Storage) already models this.

8. **`provisionUser` callable has no driver** — not referenced by frontend or any script in
   `scripts/`. It is documented as server-only privileged provisioning; confirm the ops path that
   uses it or gate it further (e.g. superadmin-only + audit log).

9. **RTDB is fully locked but still configured**: `databaseURL` is a required env var and the SDK
   is listed in `vite.config.ts` manualChunks, while no code calls `getDatabase()`. Remove the
   requirement (and the RTDB itself in the Firebase console) or document why it must stay.

### 🟡 P3 — Performance & delivery (matters for the mobile student audience)

10. **PWA precache is 9.7 MB across 376 entries** — every lazy route chunk, icon and font is
    precached on first service-worker install. On a mid-range phone over 4G this is minutes of
    background download and storage pressure.
    **Fix:** precache the critical shell (index, react/firebase/mui chunks, manifest, icons) and
    move route chunks to Workbox `runtimeCaching` (StaleWhileRevalidate). The build already has
    the plumbing (`globPatterns`, PDF-chunk preload exclusion) — this is a config change.

11. **Initial JS payload ≈ 2.4 MB raw / ~700 KB gzip** (`index` 779 K, `firebase` 865 K,
    `mui-core` 448 K, `charts` 452 K if eagerly pulled, `utils`/framer 130 K, react-core 179 K).
    Largest single-chunk offenders beyond that: `SuperAdminCurriculum` 497 K, `xlsx` 481 K,
    `pdf` 581 K (correctly never preloaded). Options: verify `charts`/`xlsx` are only loaded on
    demand, audit what lands in the 779 K `index` chunk (`ANALYZE=true npm run build` visualizer
    is already wired), and consider Firebase tree-shaking (modular imports are used — good).

12. **Seven Google Font families load render-blocking in `index.html`** (Inter + Noto Sans +
    Kannada/Tamil/Telugu/Malayalam/Devanagari). `display=swap` mitigates invisibility, but the
    Indic families are only needed per-locale.
    **Fix:** load Inter/Noto Sans statically; inject the active-language family at runtime from
    the existing i18n layer.

### 🟢 P4 — Repo hygiene & maintainability

13. **Root markdown sprawl:** 13 MD files at root, including transient session artifacts
    (`PR_BODY.md`, `PR_SUMMARY.md`, `AUDIT_REPORT.md`, `LOGIN_FIX.md`, `STUDENT_BULK_UPLOAD_FIX.md`…).
    `docs/` already holds 36 dated documents. **Fix:** keep `README.md` (+ maybe `CHANGELOG.md`)
    at root; move the rest to `docs/archive/`.

14. **21 MB of binaries tracked in git:** `marketing/Vriddhi_Marketing_Kit.zip` (6.6 MB),
    Kannada booklet/brochure PDFs (3.8 MB), `brand/logo/concepts/vriddhi-primary-lockup.png`
    (3.5 MB), fonts. Git pack is already 20 MB with a single-contributor history.
    **Fix:** move marketing assets to GitHub Releases / Drive, or adopt Git LFS before history
    grows; `brand/` concepts are working files, not deliverables.

15. **Naming/typo cleanups:** package name `vruddi-attendance` (legacy typo); rules file named
    `current-firestore.rules` (rename to `firestore.rules` + update `firebase.json`);
    `src/Docs/firbase/` (misspelled dir inside `src/`); `src/components/Layout_PATCH.txt`
    (stale patch note); `src/scripts/seedStudents.ts` (5,077 lines) and `seedFaculty.ts` are
    exempted from the dead-code check but live in `src/` — move to `scripts/` or delete.

16. **Toolchain freshness:** ESLint 8 EOL; `@types/puppeteer` deprecated (puppeteer ships types);
    root `package.json` has no `engines` field (CI pins Node 22, functions require 22 — make it
    explicit); pending majors: vite 5→8 (closes both root highs), sharp 0.33→0.35.
    Functions `test:unit` is a 3 KB one-liner script — glob discovery (finding #2) also solves
    its maintainability.

### ✅ Verified sound — no action needed

- Route/navigation graph: 0 dead links (the two found on 2026-09-24 are fixed and merged).
- Frontend↔backend callable + REST contracts: complete.
- Firestore rules: token-claims-only identity (profile-doc trust deliberately removed), role
  canonicalisation, college scoping; storage rules: one intentional public read; RTDB: locked.
- No hardcoded secrets; service-account patterns gitignored with rationale comments.
- Function sizing is deliberate (`api` 512 MiB/10 inst, `pdf` 2 GiB/5 inst with client fallback).
- Error boundaries (root + student + superadmin), production config guard screen, PWA update
  flow (`prompt` + no-cache `sw.js`), dev proxy for `/api` and `/pdf` — all present and tested.
- Cost engineering is unusually mature for this stage (cost model scripts, assessment cost
  baselines, autosave indexing docs, 1-year/5000-student costing plan).

---

## 4. Recommended roadmap

**This week (≈ half a day, all low-risk):**
1. Remove `|| true` from functions `test:unit` (P1-1).
2. Register the 6 orphaned test files, or convert both suites to glob discovery (P1-2).
3. Add functions `eslint` to CI with a warning ratchet; fix or suppress the 12 errors (P1-4).
4. Decide on `helmet`: apply or remove + correct README (P2-6).
5. Move root MD sprawl to `docs/archive/`; delete `Layout_PATCH.txt` (P4-13/15).

**Next two weeks:**
6. Run the full Firestore rules suite in CI (nightly job first to gauge runtime) (P1-3).
7. Add `npm audit --audit-level=high` step (P1-5).
8. Slim the PWA precache to the critical shell + runtime-cache route chunks (P3-10).
9. Schedule the tested majors: vite 8, sharp 0.35 (root); express stack bumps (functions) (P4-16).
10. Per-locale font loading (P3-12).

**This quarter:**
11. Frontend linting standard (ESLint 9 flat config or Biome) + pre-commit hook (P1-4).
12. Externalise marketing/brand binaries (Releases or LFS) (P4-14).
13. Bundle diet: analyze the 779 K index chunk; confirm charts/xlsx are demand-loaded (P3-11).
14. Retire RTDB config or document it; confirm `provisionUser` ops driver (P2-8/9).
15. Rename `current-firestore.rules` → `firestore.rules`; fix package name; add `engines` (P4-15/16).

---

## 5. Method notes

Static: tsc (frontend+functions), eslint (functions), secret scan over tracked files, rules
review, contract mapping scripts (routes↔navigate, callables FE↔BE, apiUrl↔Express routes).
Dynamic: full vite production build, both unit suites (including files CI skips), full and
course render checks, course-pack validation, dead-code reachability scan, `npm audit` on both
packages. Not executable in this sandbox: Firebase emulator suites (no Java) — the 98-test rules
suite was reviewed statically; CI already provisions Java 21, so finding P1-3 is actionable as-is.
