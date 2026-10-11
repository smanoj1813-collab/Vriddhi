# Ops close-out — 2026-10-10

Phase A of `docs/HANDOFF_POST_PR6_NEXT_PHASE_2026-10-10.md`, worked from the
`arena/cf78e418-vriddhi` checkout (based on `main` @ `091c6d5`).

**Important mismatch:** the handoff describes the `vriddhi-engineering` project
after PR #6 (`ff406e1`, `55a8954`). This checkout is a different line: it deploys
to `vriddhi-academic` (`package.json` `deploy:*`), has no OBE code
(`obe.ts`, `obeAttainment.ts`, etc. are absent), and has no `041d053` commit.
Items below are therefore assessed against *this* repo. Anything that lives in
the `vriddhi-engineering` checkout needs to be re-run there.

## Status table

| # | Item | Status | Finding | Next action |
|---|------|--------|---------|-------------|
| C3 | `provisionUser` ops path | **Documented (agent)** | Callable exists in `functions/src/userProvisioning.ts`, `region: asia-south1`. No frontend or script caller in this repo. The prior audits flagged it as an unused surface. Contract documented below. | Confirm which operator tool (if any) calls it in production. |
| C4 | Delete RTDB instance | **Zero code readers here — human action pending** | `getRtdb()` in `functions/src/config/firebase.ts` is defined but has **no callers**. `database.rules.json` is deny-all. `firebase.json` still lists `database`. Frontend `src/Firebase/config.ts` reads `VITE_FIREBASE_DATABASE_URL` only as config. | Human: check the RTDB console for activity, then delete. Code cleanup (remove `getRtdb`, `database` in `firebase.json`, `firebase/database` in `vite.config.ts`) is not done here; handoff says it was retired in PR #6, which is not in this checkout. |
| P4-14 | Marketing-binary externalization | **Not actionable here** | `041d053` does not exist in this repo. `marketing/` still holds binaries tracked in Git (PDF, PPTX, ZIP). | Human on the connected machine, against the plan in `041d053` in the other checkout. |
| Deps | Deferred major upgrades | **Partly done** | Before: `npm audit --omit=dev` frontend 10 (5 high, 3 moderate, 2 low); functions 23 (11 high, 11 moderate, 1 critical). The 2026-09-21 doc claimed 0 high for both trees, so these regressed. **Done:** `axios` 1.19.0 → 1.20.0 (lockfile only, the one non-breaking frontend fix). Frontend now 9 (4 high, 3 moderate, 2 low). Remaining frontend findings need semver-major fixes (`firebase`, `mammoth`). Functions untouched. | Decide per package. See the recommendation below. |
| Store | ~1 GB Storage cleanup | **Human** | Not verifiable from the repo. | Console: clear `question-paper-imports/` failed-job folders; check bucket size. |
| Quota | Cloud Run CPU quota | **Human** | Not verifiable from the repo. | Console: confirm whether the asia-south1 increase was filed/approved. |
| Nightly | Rules-nightly watch | **No such workflow here** | `.github/workflows/` contains only `ci.yml` (push to `main` and PRs). No nightly rules job. The last `main` CI run (PR #100) succeeded. | Confirm the nightly exists in the `vriddhi-engineering` repo. |
| Stash | Deploy-clone stash | **Human** | This checkout has no stash. The stash is in the user's Windows clone. | `git stash list` there; drop `pre-pr6: …` after confirming it's obsolete. |

## C3 — `provisionUser` operator contract

Server-only privileged account creation. Trusted staff call it from an
authenticated client session.

- **Caller roles allowed:** `superadmin`, `admin`, `hod`. A legacy superadmin
  with only a `superadmins/{uid}` doc is also accepted.
- **Input:** `{ email, name, role, password?, collegeId? }`
  - `email`, `name`, `role` are required.
  - `role` must be one of: `superadmin, admin, principal, hod, faculty, mentor,
    student, parent, accounts, operations`.
  - Only a superadmin can create `superadmin`, `admin`, or `principal`. An admin
    or superadmin can create `hod`.
  - `password` is used only if it is at least 10 characters. Otherwise one is generated.
  - `collegeId` is required for non-superadmin targets. Non-superadmin callers
    can only provision into their own college.
- **Effects:** creates the Auth user, verifies it by reading it back, sets custom
  claims (`role`, `collegeId`, `mustChangePassword: true`), and writes
  `users/{uid}` with `status: 'active'`.

**Ops path (for operators):** call the callable from a signed-in staff session,
or from the Firebase Functions shell with an admin-authenticated context. The
callable is not wired into any UI in this repo, so there is no console button.

## Deps — recommendation

The 2026-09-21 security pass used pinned or patched upgrades, and deferred
`firebase-admin` 14 because it removes the namespace API (~30 files). The
current audit regressed because the lockfile drifted. Options, one package at a time:

1. **Frontend `firebase` / `mammoth` / `@firebase/firestore`.** The fix is semver-major
   (`firebase` 9 → 12 range, `mammoth` 0.3.x). Do not run `npm audit fix` unscoped: it
   also moved `re2js` 0.4 → 2.8 and `commander` 8 → 15 (majors) in the lockfile, so it
   was reverted. `axios` was the only safe bump, and it is done.
2. **Functions `firebase-admin` 12 → 14.** Breaking. Its own migration PR.
   Do not bundle with feature work.
3. **Dev-only Vite 5 → 8.** Breaking, build-time only. Its own PR.

This close-out does not change any dependency. It is a decision record.

## Verification

- Repo-wide checks: none changed code. Doc-only commit.
- `npm audit` numbers above were taken on 2026-10-10 from this checkout.
- After the axios bump: `npm ci` ok; `tsc --noEmit` clean; `npm run test:unit` 670/670 (this checkout has 670 tests; the handoff baseline of 811 is from the vriddhi-engineering repo); `npm run build` exit 0.
