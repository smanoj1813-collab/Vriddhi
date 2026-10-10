# Handoff — post-PR #6: next phase pickup

Date: 2026-10-10 · Author: Arena agent session `arena/c1e6e8c1-vriddhi-engineering`
PR #6 **MERGED** to `main` as `ff406e1` (2026-10-10 17:50 UTC).
Session head at merge: `55a8954` ("Fix post-deploy field issues…").
Production (`vriddhi-engineering`) is deployed at `55a8954`: rules + indexes +
all ~120 functions + hosting. Next session starts from `main`.

> Stored in `docs/` on 2026-10-10 from the pasted handoff. Close-out results for
> Phase A are in `docs/OPS_CLOSEOUT_2026-10-10.md`.

## TL;DR for the next agent

1. Read this file + `docs/DEPLOY_ONE_VRIDDHI.md` (stale branch refs — see
   "Production notes" below for the current deploy procedure).
2. Do the **ops close-out** (half a day): audit tail C3/C4/P4-14, dep majors
   decision, 1 GB storage cleanup check, quota-increase status, rules-nightly
   watch, drop the user's deploy-clone stash.
3. Then start the recommended product phase: **OBE → SAR-ready evidence**
   (below). If the user redirects, the pivot options are listed with context.

## Recommended next phase

### Phase A — Ops close-out (do first, mostly small)

| # | Item | Owner | Notes |
|---|------|-------|-------|
| C3 | `provisionUser` console ops path | agent+human | Audit leftover; see audit docs for the exact gap. Likely: document/support the console-driven provisioning path for operators. |
| C4 | Delete the RTDB instance | human (console) | Code retired the Realtime Database (P2-9, in PR #6). Before deleting in console: re-verify zero readers (grep for `getDatabase`/RTDB imports + check console usage). |
| P4-14 | Marketing-binary externalization runbook | human (connected machine) | Run from a connected machine; plan recorded in `041d053`. Agent can prep the script, human executes. |
| Deps | Deferred major upgrades | agent | See `docs/DEPENDENCY_SECURITY_2026-09-21.md`. Decide upgrade-vs-pin per package; do NOT bundle with feature work. |
| Store | Manual ~1 GB Storage cleanup | human (console) | Failed-job folders under `question-paper-imports/` first. `deleteMaterial` auto-cleanup is deployed; this clears pre-existing junk. Verify bucket size after. |
| Quota | Cloud Run CPU quota increase | human (console) | Suggested 2026-10-10 during the deploy (asia-south1 CPU ceiling broke full deploys). Confirm whether it was filed/approved — determines whether full `deploy:functions` is safe again. |
| Nightly | Rules-nightly workflow | watch | First run on merged `main` happens overnight 2026-10-10→11. Check it green in the morning. |
| Stash | Deploy-clone stash | human (1 cmd) | User's `C:\Projects\Vriddhi-engineering-deploy` holds stash `pre-pr6: runStudentCode removal + lock churn`. The code edit is obsolete (`CORS_EXTRA_ORIGINS` replaced it). `git stash drop` after confirming nothing else is in it. |

### Phase B — Product: OBE → SAR-ready evidence (recommended)

**Why this:** PR #6 shipped the OBE attainment MVP (mapping editor, publish/
archive evidence, 80/20 compute + runs, test-score import, program roll-up)
and it's now live with real HOD/principal users. The market analysis in this
repo's history positions NBA GAPC v4.0 + accreditation readiness as the wedge
against MasterSoft/Camu/vmedulife. Deepening OBE into SAR-ready output is the
highest-ROI follow-on: it converts the MVP into a sales/demo asset.

Suggested slices (refine with the user before building):

1. **Program attainment report** — printable program-level PO/PSO attainment
   across courses/terms (roll-up exists per-course; program view needs
   aggregation + presentation). Reuse `ObeSarTables` / `obeAttainment.ts`.
2. **Indirect-assessment survey capture** — `computeObeAttainment` already
   accepts `surveys[]`; verify whether any UI collects them — if not, build
   the minimal survey → run wiring (alumni/exit survey per CO).
3. **SAR table exports** — criterion-3 course tables + PO/PSO summary tables
   to PDF/Excel (extend `obeCsv.ts` + server `pdf` function).
4. **Evidence vault** — runs are immutable docs; add retention/audit-trail
   presentation (who published/computed what, when) for assessor visits.
5. **Multi-term trends** — attainment deltas across terms per course (needs the
   runs history to accumulate; design now, it pays off in one semester).

**Pivot options** (from the repo's market analysis — pursue only if the user
redirects): placement-readiness module (recruiting-not-readiness gap, no free
tier in market); UUCMS sync + APAAR/ABC–DigiLocker (Karnataka moat); group-ERP
multi-college governance (vs Camu/TCS iON).

**Standing user constraints** (carry over): tackle items one-by-one, start
building (design + implement, user reviews working results — not spec-first);
India-market competition only for build prioritisation.

## Production notes (learned 2026-10-10 — do not re-learn)

- **Functions deploy quota.** A full `npm run deploy:functions` (~120 fns)
  exceeds the asia-south1 Cloud Run total-CPU quota; ~50 succeed, the rest
  fail health-check and keep serving old revisions (no outage, mixed versions).
  Procedure: batches of ≤10 via
  `firebase deploy --only functions:a,functions:b,… --project vriddhi-engineering`
  with 1–2 min gaps. If even a small batch fails, the region needs 15–20 min
  to scale new revisions to zero — wait, then canary with ONE function before
  resuming. All functions are `minInstances: 0`, so pressure is deploy-time
  only. If the quota increase (above) was approved, a full deploy may work —
  still canary first.
- **Indexes ship separately.** `deploy:rules` = rules only. OBE broke in prod
  because `firestore:indexes` was never deployed. `deploy:all` now includes
  `firestore:indexes`; after any index deploy, new indexes need minutes to
  build (check console: Enabled vs Building).
- **Secrets.** `JUDGE0_API_KEY` exists in Secret Manager (v2, set 2026-10-10).
  Unknown whether the value is a real key or the `unused` placeholder — verify
  before announcing code-runner; `runStudentCode` fails at runtime on a
  placeholder.
- **PWA cache.** Hosting deploys need incognito / Ctrl+Shift+R to verify; the
  service worker otherwise serves the old bundle (bit us on 2026-10-10).
- **CORS.** New allow-list = hosting origins + preview channels + localhost.
  External callers need `CORS_EXTRA_ORIGINS` set before functions deploy.
- **Deploy order:** rules → indexes → functions → hosting.
- **Verify commands + baselines:** root `tsc --noEmit` clean;
  `npm run test:unit` → 811/811; functions `npm run build`, `test:unit` →
  1284/1284, `npm run lint` clean. (Sandbox note: functions `npm ci` needs
  `PUPPETEER_SKIP_DOWNLOAD=1` where the Chrome CDN is unreachable.)

## Key file pointers

- OBE backend: `functions/src/obe.ts`, tests `functions/test/obe.test.ts`
- OBE frontend: `src/modules/admin/api/obeApi.ts`,
  `src/modules/admin/pages/ObeMapping*.tsx` + `ObeProgramView.tsx`,
  `src/modules/admin/components/obe/`, `src/shared/utils/obeAttainment.ts`,
  `src/shared/utils/obeCsv.ts`, `src/shared/types/obe.ts`
- Attendance: `src/modules/faculty/pages/FacultyAttendance.tsx`,
  `FacultySelfAttendance.tsx`, `src/modules/faculty/hooks/useFacultyAttendance.ts`,
  `src/modules/faculty/api/facultyApi.ts`
- Retired faculty paths pattern: `RETIRED_FACULTY_PATHS` in
  `src/modules/faculty/routes.tsx` (+ nav in `src/shared/components/Layout.tsx`)
- Deploy scripts: root `package.json` (`deploy:*`); rules `firestore.rules`,
  indexes `firestore.indexes.json`

## Suggested kickoff prompt for the next session

> Continue Vriddhi-engineering from main (post-PR #6, merged ff406e1).
> Read docs/HANDOFF_POST_PR6_NEXT_PHASE_2026-10-10.md first. Work style:
> one item at a time, build directly (no spec-first). Start with the Phase A
> ops close-out table in order, then propose the Phase B slice-1 plan for OBE
> SAR-ready evidence before implementing.
