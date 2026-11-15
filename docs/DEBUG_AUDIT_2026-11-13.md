# Vriddhi functional debug and security review — 13 November 2026

## Remediation conclusion

The requested bug fixes are implemented on `arena/a96bdd6e-vriddhi`, in
[PR #131](https://github.com/smanoj1813-collab/Vriddhi/pull/131). **This is branch-review
readiness, not a production security certification or authorization to deploy.** Nothing was
merged or deployed, and no production account, email, credential, database record or risk scan
was used as a test.

The critical tenant-read gap, misleading security controls, protected-profile save failures,
account-wide notification caches, student APAAR form bug and two lint errors are addressed.
All three audited dependency trees now have **zero high/critical advisories**. Moderate/low
advisories remain, as detailed below; MFA enrollment and remote session revocation are explicitly
unavailable in the portal, not implemented or simulated by a profile flag.

The runtime changes in `feaab5016a9e48dbf0b39e643633edb59f875ca2` passed all three CI jobs in
[run 43715227666](https://github.com/smanoj1813-collab/Vriddhi/actions/runs/43715227666):
**157 security-rules tests / 0 failures** and **140/140 browser smoke checks**. The follow-up
adds more settings/query regressions, a compatible Firebase CLI update, and stronger audit gates.
Use the latest PR checks for that follow-up's exact-head CI outcome; the earlier run is not
being presented as execution of a later commit.

The [pre-remediation report](https://github.com/smanoj1813-collab/Vriddhi/blob/bce375bf370c7529db480ab44744e7bfab125dd0/docs/DEBUG_AUDIT_2026-11-13.md)
is retained in Git history. The status and measurements below supersede its open-finding list.

## R1 — Critical private-read tenant gap: fixed and emulator-tested

Private collection lists no longer contain a standalone staff-role grant. The rules require
the caller's verified college claim, not a profile field or a browser-local college selection.
An arbitrary caller-supplied query cannot replace that authorization boundary.

Covered paths include:

- Top-level student/faculty directories; class sessions, attendance and attendance records;
  assessments, papers, review queue, attendance summary, issued books and test papers.
- College-path faculty, materials, events, announcements and notifications.
- Notification read-marker descendants, which inherit the parent notification's tenant.
- Faculty planner ledgers: new rows carry a college; older UID/profile-ID ownership queries
  still work without allowing an unbounded staff-wide ledger scan.

Super Admin retains global/cross-college reads. Intentionally shared universities, topic/question
banks and universal papers/templates remain shared. UID, `userId`, document-ID and supported
email-based owner lookups remain available for legacy identity resolution. Suspended employees
and accounts without college scope do not receive private staff-directory/report access.

Users cannot rewrite their own college aliases, identity pointers, email, role or employee/status
fields. Student pointers are checked against the target college and conflicting explicit UID
links before being used to vouch for attendance access. Planner ownership does not trust a
`users.facultyDocId` pointer alone, and an email match cannot override a conflicting explicit
faculty UID/`userId` link. Protected faculty/admin profile writes were **not** widened.

### Matching query changes

`src/shared/api/tenantScope.ts` selects explicit college constraints or cached verified Auth
claims, fails closed when scope is unresolved, and rejects stale-account token responses.
It is a query builder, **not** an authorization service. Only Super Admin can intentionally
request a global list; college-path/write workflows require a concrete selected college.

- Removed four unfiltered directory fallbacks from `scheduleApi.ts`. The weekly-schedule
  fallback now uses Auth claims, not `vriddhi_college_id` from global localStorage.
- Attendance lists, legacy session lookups, faculty maps and session → record → student-name
  joins each carry college constraints. The optional realtime subscription requires a college.
- Assessment list/statistics use one scoped source instead of a second independent read.
- Faculty alias caches include the calling account, college and target identity. Unresolved
  planner identity does not trigger a collection-wide read.

Four additive composite indexes accompany these query changes in `firestore.indexes.json`:

| Collection | Fields in index order |
|---|---|
| assessments | collegeId ASC, createdAt DESC |
| attendanceRecords | collegeId ASC, markedAt DESC |
| attendanceRecords | collegeId ASC, sessionId ASC, markedAt DESC |
| reviewQueue | collegeId ASC, status ASC, submittedAt DESC |

These are source definitions, **not deployed indexes**. The emulator checks authorization, not
production index availability or index build completion.

### Regression evidence

The full Firebase emulator suite grew from 127 to **157 passing cases**. Added cases cover
own-college success, foreign/mixed/unbounded denial across six academic/platform staff roles;
directory checks additionally cover accounts and operations. They also cover college paths,
no-college/suspended callers, owner/legacy queries, a 30-row roster access-budget regression,
planner aliases/conflicts, notification descendants, protected profile/pointer writes,
Super Admin and intentionally shared content.

The separate **23-check tenant-query suite** executes shipped query builders against an
instrumented Auth/Firestore boundary. It verifies constraints, empty-result behavior, account
switches, blocked storage, scoped joins and cache isolation. It is **not** a permissions emulator.

## R2 — Misleading 2FA / session controls: corrected honestly

Faculty/admin security tabs now use `AccountSecurityNotice.tsx`. There is no switch that
purports to enroll MFA by saving a boolean, no invented active-device list, and no nonfunctional
Revoke button. The notice explicitly says factor enrollment/status verification and session
inventory/remote revocation are unavailable here, and directs users to their platform
administrator for verification or account-wide revocation.

The real password flow remains: current-password reauthentication, the platform's 10-character
minimum, password rotation, best-effort clearing of the forced-change flag and claim refresh.
Existing externally configured Identity Platform enrollment/enforcement was not inspected or
changed. This change does **not** claim that MFA itself has been implemented.

## R3 — Canonical self-service staff settings: fixed

New `getMyStaffSettings` and `updateMyStaffProfile` callables run in `asia-south1`.
The server derives UID, role and college from the authenticated request and checks the existing
canonical account/profile. The client cannot select an identity, tenant, role or profile path.

- Editable fields are only validated name, phone and complete known-boolean notification
  preferences. Department, email, college, permissions and academic assignments stay managed.
- Resolution supports provisioning that intentionally creates only `users/{uid}`, official
  faculty pointers, stable non-UID profile IDs, and legacy UID/`userId`/email anchors.
  Missing, conflicting or ambiguous supported links fail visibly rather than creating a
  partial `faculty/{uid}` or `admins/{uid}` shadow record.
- Existing canonical records are updated atomically with snapshot-version preconditions.
  A concurrent reassignment/change requires a fresh lookup instead of overwriting a new owner.
- Firestore commits **before** the derived Auth display-name mirror. A failed batch never
  changes Auth. Name edits reconcile against the current canonical name with bounded retries;
  a mirror failure/nonconvergence is returned as a retryable partial-sync notice, not a lost
  profile save or a false synchronization guarantee. Firebase offers no cross-service transaction.
- Faculty, admin, HOD, principal and Super Admin settings use this transport. Management fields
  remain read-only. Load errors have Retry; unknown cloud preferences cannot be overwritten by
  saving a fallback cache after a failed load.

**70 actual-callable tests** with an atomic/precondition-enforcing fake Admin SDK cover payloads,
claims, canonical targeting, legacy/users-only provisioning, conflicts, failures, retries and
out-of-order Auth-name completions. This fake does not prove live Auth service behavior or
Firestore permissions. The emulator separately verifies protected direct-client writes remain
denied, and the settings render suite checks the actual forms' payloads and feedback.

## R5 — Account-safe caches and asynchronous settings: fixed

Notification caches now use UID-suffixed keys, accept only known boolean fields, ignore
unattributed browser-wide legacy values, and give canonical cloud values precedence. The shared
legacy key is retired only after a confirmed successful save. Blocked/full device storage is
nonfatal; it does not turn a server save into a reported failure. Theme initialization/changes
also work without writable localStorage.

Settings remount on account changes and guard deferred loads/saves against unmount, sign-out,
and an Auth switch that precedes the context update. A previous account cannot populate the
new account's controls, success/error feedback or preference cache. Admin export and deferred
push-permission callbacks also check the current account before acting.

`useStudentProfile` tags state with its owning identity and cancels stale reads; sign-out hides
the old profile immediately. Student settings now hydrate, validate and submit APAAR/ABC ID:
12 digits after formatting is removed, optional blank explicitly clears it, and partial IDs
are rejected before a write. Existing name, notification and academic/contact-management
contracts are preserved. Admin backup frequency hydrates and saves through the college's
existing General settings workflow; it is labelled a preference, not a new backup scheduler.

Regression coverage includes **12 cache unit cases** and **61 settings security/persistence
checks**, including delayed load/save/rejection, account switching, blocked storage, honest
MFA/session copy, password handling, canonical payloads, backup persistence and APAAR.

## R4 — Dependency triage and upgrades

| Dependency tree | Before C / H / M / L | After C / H / M / L |
|---|---:|---:|
| Frontend, including tooling | 0 / 7 / 6 / 4 | **0 / 0 / 4 / 2** |
| Functions, production only | 0 / 15 / 10 / 1 | **0 / 0 / 8 / 0** |
| Functions, including tooling | 0 / 26 / 29 / 1 | **0 / 0 / 25 / 0** |

These are advisory/package counts, not independently exploitable application bugs. Counts are
a snapshot of the npm advisory database, not a promise that future audits will remain unchanged.

Targeted updates include patched grpc, body-parser, Undici, node-forge, brace-expansion,
fast-uri, KaTeX, serializer/source-map utilities and Puppeteer **25.3.0 → 25.17.0** within its
existing major. A narrow Firestore → grpc override removes the old pinned 1.9.16 copy without
a Firebase downgrade. Firebase CLI **15.31.0 → 15.36.0**, a compatible minor update, removes the
remaining vulnerable proxy-agent/get-uri/basic-ftp development-tool chain.

Three direct runtime major upgrades were selected deliberately rather than through `audit fix
--force`: Nodemailer **6.10.1 → 10.5.0**, OpenAI **4.104.0 → 7.57.0** and Zod **3.25.76 → 4.6.7**.
The application's used contracts compile and have offline compatibility regressions:

- Actual mail delivery builds MIME/envelopes using Nodemailer's in-memory stream transport;
  no SMTP socket/email is sent. File/URL access is explicitly disabled for SMTP message data.
- OpenAI and DeepSeek chat-completion URLs, request body and usage results use mocked fetch.
- Zod defaults, transformed pagination, validation failures and middleware feedback are tested.
  Pagination uses `prefault` to retain the previous string-input → number-output defaults.
- Existing PDF-renderer and wider Functions unit suites also pass. These tests do not certify
  a deployed Chrome/PDF container or real provider account/configuration.

The earlier `proxy-addr` **2.0.8** critical fix and three Express-resolved regressions remain.
Lockfile edits were targeted; all existing Windows optional-package entries were retained.
No blanket lockfile regeneration, incompatible Firebase/rules-testing downgrade, forced major
transitive override or unreviewed `npm audit fix --force` was used.

Remaining moderate/low paths include upstream uuid / Google Cloud dependencies and build/CLI
packages such as glob/minimatch and deepmerge. They require continued upstream/compatibility
review, not hiding the audit or forcing an incompatible tree. CI now blocks **high and critical**
advisories in the frontend and in both Functions runtime-only and full-tooling audits.

## Other fixes and preserved behavior

- Fixed holiday cancellation's lint error with an explicit pagination continuation condition;
  a multi-page regression preserves completed/concurrently marked sessions, prevents duplicates,
  and keeps all transaction reads before writes.
- Replaced the college-code control-character regex with explicit character validation; tests
  cover slash rejection, all 32 embedded C0 controls and a valid code. No validation was disabled.
- Preserved owner-only appearance preferences, changed-only saves, Retry/Save race protection,
  legacy appearance fallback, eight colours, font/theme/language controls and account isolation.
- Preserved Super Admin's navigation-only Curriculum Progress/Insights removal and the full-width
  responsive college form. Role routes and college-role navigation remain intact.
- No new client-triggered risk scan, background poll, production migration or listener fan-out.
  Existing risk cadence/acknowledgements, academic/attendance/autosave/recovery, settings/push,
  backup/mail and course-assignment behavior remain under the regression suites.

## Validation and limitations

| Executed check | Result |
|---|---|
| Frontend units | **886 / 886** |
| Functions units | **1693 / 1693** |
| Page/role/auth/faculty/cost/appearance/settings/query render suites | **777 / 777**, zero mount crashes |
| Academic/onboarding/import UI checks | **54 / 54** |
| Course render checks | **586 / 586** |
| Previous-year-paper render checks | **27 / 27** |
| Course content validation | **4 / 4 packs** |
| Frontend production build and Functions build | PASS |
| Functions lint | **0 errors, 26 existing warnings** |
| Browser-test TypeScript, dead-code and whitespace checks | PASS |
| Frontend / Functions production / Functions full audit at high threshold | PASS |
| Core remediation's full Firebase emulator suite in CI | **157 passed, 0 failed** |
| Core remediation's desktop/mobile Chromium smoke suite in CI | **140 / 140** |

Unit/render totals are not live-user end-to-end transactions. Component/query tests replace
only I/O boundaries; the emulator tests real Firestore/Storage/RTDB rules against fixture data.
Java/emulator binaries are unavailable locally, so the official authorization execution is the
PR's isolated CI emulator job. Generated logs/audit JSON and CI annotation snapshots are under
ignored `artifacts/branch-preparation/`; earlier debug evidence remains in
`artifacts/debug-2026-11-13/`.

Build large-chunk and Workbox unmatched-glob warnings remain. Live MFA configuration, real
mail/SMS/push delivery, payments/provider callbacks, deployed PDF/Chrome containers, all legacy
production identity records, production indexes and billing were not validated. Failing closed
on inconsistent legacy identity links can require an administrator's existing repair workflow;
no live identity backfill was performed. No claim of measured production billing savings is made.

## Release implications — not executed

This is no longer a Hosting-only change. A reviewed coordinated rollout needs the **four
indexes**, the **new Functions callables and updated runtime dependencies**, and **Firestore
rules**, followed by Hosting. Verify index build readiness and backend availability before the
new client queries/settings depend on them. Old clients with unscoped private queries will be
refused by the tightened rules; coordinate the release and refresh behavior accordingly.

There are no new Storage/RTDB rule changes, secrets or production migrations. Do not deploy
Hosting alone or widen profile writes to work around an undeployed callable. Nothing in these
results authorizes merging, deployment, a real password/email change, or destructive live tests.
Deployment commands should be provided **one at a time when requested**.

## Reproduction

Use the package scripts `test:unit`, `test:functions:unit`, `test:render`,
`test:render:academic`, `test:render:courses`, `test:render:pyq`, `validate:courses`, `build`,
`build:functions`, `typecheck:e2e` and `check:dead-code`. Settings and query checks can run
separately via `test:render:settings` and `test:render:tenant-scope`. With Java and the official
emulators available, `npm --prefix functions run test:rules` runs the full fixture-only rules
suite against the `demo-vriddhi-student-portal` project ID.
