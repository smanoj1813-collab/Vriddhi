# Hand-off: Internal Employee Portal — provisioning, attendance, bank, duplication, audit

**Status:** implemented on `arena/01a09bbe-vriddhi` (base: `03a172f`, the tip of
`main` / `arena/01a09bbe-vriddhi` — the commit `fb1edc5` referenced in the task
does not exist in this repository; verified with `git log --all`).
Everything below is code-complete and unit-tested; **nothing is deployed**.

## What shipped

### Backend — secure employee provisioning + authorization (first, as specified)

- `functions/src/authorization.ts` (new) — the shared authorization core:
  - `resolveCaller()` resolves identity **claim-first** from the verified ID
    token, falling back to `users/{uid}` only for legacy accounts.
  - `resolveCollegeScope()` pins college staff to their claim's `collegeId`; a
    disagreeing client-supplied `collegeId` is **rejected, never rewritten**.
    Only superadmins may target another college, and only explicitly.
  - `writeAuditLog()` / `buildAuditEntry()` — append-only trail in the existing
    `logs` collection (same convention as `grantUserRole`), with
    credential-shaped keys stripped from details by construction.
- `functions/src/employeePortal.ts` (new) — 12 callables, all `asia-south1`:
  - `provisionEmployee` — one audited operation: create/reclaim the Auth
    account (orphan-reclaim contract identical to `bulkProvisionStaff`; an
    account bound to another college is refused), issue `role`/`collegeId`
    claims, revoke refresh tokens, write `users/{uid}` + the role profile
    (`faculty`/`hods`/`mentors`/`admins`) + the `employees/{deterministic-id}`
    directory row, then return a **one-time** random password (or validate a
    supplied one against the password policy). `mustChangePassword: true`.
  - `listEmployees`, `updateEmployee`, `setEmployeeStatus` — directory CRUD.
    Deactivation disables the Auth account and revokes tokens; you cannot
    deactivate yourself. HOD may read the directory; only admin/principal/
    superadmin may mutate.
  - `markEmployeeAttendance`, `listEmployeeAttendance`,
    `exportEmployeeAttendanceCsv` — one row per employee per day under a
    deterministic id (`att_{college}__{uid}__{yyyy-mm-dd}`), self-marking by
    the employee or correction by a manager (manager marks are audited).
    Windows capped at 62 days; future dates refused (IST).
  - `upsertQuestionBankItem`, `deleteQuestionBankItem` — college-scoped bank
    writes with server-stamped `collegeId`/`createdBy` (never taken from the
    payload), faculty-own-edit rule, delete is managers-only, all audited.
  - `duplicateAssessmentTest` — deep-copies a `scheduledTests` doc **and its
    frozen `assessmentQuestions` snapshot** (paginated up to 400 questions)
    onto a new future window: counters zeroed, lifecycle fields dropped,
    status `scheduled`, ownership transferred to the duplicator,
    `sourceTestId` kept. Faculty may duplicate only their own tests.
  - `listAuditLogs` — paginated audit reader (admin/principal own college,
    superadmin any college) over the shared `logs` collection.
  - `backfillEmployeeDirectory` — idempotent one-time import of the employee
    directory from the existing `faculty`/`hods`/`mentors`/`admins` profile
    collections, so colleges that pre-date the portal get attendance rosters
    without re-provisioning anyone. Existing rows are NEVER touched; profiles
    without uid+email are skipped and counted. Exposed in the UI as
    Employees → "Import existing staff".
  - CSV contract helpers (`buildCsv`, row mappers) are server-side and
    unit-tested; the client only adds the BOM and triggers the download.
- `current-firestore.rules` — new `employees` and `employeeAttendance` blocks:
  client **writes closed** (callables only, so every mutation is claim-
  authorised and audited); reads claim-tenanted (managers see their college,
  an employee sees their own rows). `logs` read widened to `principal`.
- `firestore.indexes.json` — 7 composite indexes added (`employees`,
  `employeeAttendance`, `logs` query shapes used by the callables).

### Frontend

- `src/modules/superadmin/api/employeePortalApi.ts` — typed callable wrappers.
- The portal is operated at the **platform level** (superadmin picks the
  college; the backend re-verifies tenancy — the picker is UX, not
  authorization):
  - `src/modules/superadmin/pages/SuperAdminEmployees.tsx` —
    `/superadmin/employees`: college picker, search/filter, provision dialog,
    one-time credential dialog, activate/deactivate, CSV export, "Import
    existing staff" backfill.
  - `src/modules/superadmin/pages/SuperAdminEmployeeAttendance.tsx` —
    `/superadmin/employee-attendance`: Day view (roster + inline marking)
    and Range view (rows + summary chips), CSV download.
  - `src/modules/superadmin/pages/SuperAdminAuditLog.tsx` —
    `/superadmin/audit-log`: filters by college (or all)/action/
    target-email/date.
- `TestScheduler.tsx` + `useAssessment.ts` — **Duplicate** on every test card:
  dialog pre-fills title/window (same wall-clock next day), calls
  `duplicateAssessmentTest`, list refreshes.
- Routes (`src/modules/superadmin/routes.tsx`) and the superadmin sidebar
  carry a new **People** section (Employees, Employee Attendance, Audit Log).
  College admins/principals/HODs deliberately do NOT get these pages —
  people management is platform-level.

### Tests

- `functions/test/employeePortal.test.ts` — 52 assertions over the pure core:
  id schemes, password policy, payload validation, IST day maths, attendance
  rate maths (half-day = 0.5, leave excluded), CSV contract, question
  validation, duplication maths, backfill mapping, audit entry
  secret-stripping, and `resolveCollegeScope` authorization decisions. Wired
  into `functions/package.json` `test:unit` (CI runs it).
- `functions/test/firestore.rules.test.ts` — new `employee portal` suite (5
  tests, all passing on the emulator): own-row reads, college-scoped manager
  lists, client writes closed for EVERYONE (including superadmin — callables
  are the only writers), attendance read scoping, and the audit trail's
  management-read / superadmin-write / employee-blind contract.
- `scripts/render-check/run.mjs` — 3 new sections / 11 checks mounting the
  three new pages against callable fixtures. Total now 69.
- `scripts/render-check/domsetup.mjs` — Node-20 shim: jsdom's undici@8 calls
  `worker_threads.markAsUncloneable` (Node ≥ 22 only); a no-op is installed
  before jsdom loads so the harness runs on Node 20 sandboxes and CI.

## Verification (this session)

- `functions: npx tsc --noEmit` — clean.
- `functions: npm run test:unit` — **429/429 pass** (incl. 48 new).
- root: `npx tsc --noEmit` — clean.
- root: `npm run test:unit` — 119/119 pass.
- root: `npm run test:render` — **69/69 pass** (incl. 11 new).
- `functions: npm run build` — clean.
- Firestore rules tests: ran on the emulator via `firebase-tools@13.35.1`
  (v15 needs Java ≥ 21; the sandbox has Java 11). Result **44/48 pass**: all
  5 new employee-portal tests pass, and the 4 failures are byte-identical to
  the pristine-`main` baseline (staffAttendance ×3, mentor office-hours ×1).
  Root cause of those 4: the rules hit the 1000-expression evaluation budget
  on the staffAttendance write path (`Unable to evaluate the expression as
  the maximum of 1000 expressions … for 'create' @ L679 … @ L1129`) — a
  pre-existing budget problem in the legacy rules, reproduced on unmodified
  `main`, NOT introduced by the employee-portal blocks. Fixing it means
  refactoring `canonicalRole()`/the staffAttendance chain and re-pinning
  those tests; treated as out of scope here.
- `npm run build` (vite) could not complete in the 2 GB sandbox (heap OOM);
  `tsc` covers the type gate and CI/GitHub runners run the full build.

## Deploy runbook (from the user's machine, PowerShell)

```powershell
git fetch origin
git checkout arena/01a09bbe-vriddhi   # or merge to main first
git pull

# 1. Indexes first — the new list queries need them.
firebase deploy --only firestore:indexes

# 2. Rules + functions together (claims + callables must land as a pair).
firebase deploy --only firestore:rules
firebase deploy --only functions

# 3. Frontend.
firebase deploy --only hosting
```

Post-deploy:
- Provisioned employees must **sign out/in** to pick up claims (tokens minted
  before the grant carry the old claims — same rule as `grantUserRole`).
- Share the one-time password immediately; it is shown once.
- Smoke test (as superadmin): People → Employees → pick a college →
  "Import existing staff" → Add Employee → sign in as them (fresh sign-in!)
  → People → Employee Attendance → mark the day → Audit Log shows both
  actions.

## Notes for the next session

- Node 20 Functions runtime is decommissioned 2026-10-30 (pre-existing TODO).
- The employee portal deliberately does NOT replace `bulkProvisionStaff`
  (bulk import) or `grantUserRole` (Access Control); `provisionEmployee` is
  the single-employee HR-flow entry point and writes the same identity
  artifacts plus the `employees` directory row.
- For existing colleges, run **Employees → "Import existing staff"** once
  after deploy (or invoke `backfillEmployeeDirectory` from
  `firebase functions:shell`). It is idempotent and never overwrites rows.
- The 4 pre-existing rules-test failures (expression budget on the legacy
  staffAttendance path) are the top candidate for the next hardening slice —
  they fail identically on `main`, and a `canonicalRole()` simplification or
  a rules-split is the likely fix.
