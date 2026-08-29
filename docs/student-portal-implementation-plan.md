# Student Portal Implementation Plan

**Started:** 2026-08-29
**Delivery model:** two phases, with production safety gates between them.

## Phase 1 — Secure foundation and core academics

Goal: a provisioned student can reliably authenticate and use the daily academic portal without exposing another student’s data or trusting the browser for academic authority.

### Workstreams

1. **Identity and account lifecycle**
   - Canonical Auth UID → student document ID resolution through `students.userId`.
   - Safe bulk provisioning for batches up to 500.
   - Server-owned profile updates and explicit profile-not-linked errors.
   - Shared student-session/data cache to eliminate duplicate portal fetches.

2. **Authorization and data contracts**
   - Collection-by-collection Firestore rules for profiles, attendance, schedules, assignments, assessments, and published grades.
   - Remove student access to question-bank answer keys and authoring papers.
   - Tenant-scoped queries and required indexes.
   - Storage rules for assignment files.

3. **Core academic workflows**
   - Attendance with one status policy and correct student ownership.
   - Timetable with recurring classes plus daily overrides/cancellations.
   - Canonical assignment targeting, attachments, upload, submission, resubmission policy, and grading feedback.
   - Server-side test enrollment/start/autosave/submit/grading/result release with transactions and idempotency.
   - Registrar-owned grade records; no invented credits or mark splits.

4. **Reliability gate**
   - Real error states instead of converting failures into empty data.
   - Firestore and Storage emulator tests.
   - Frontend unit/integration tests for identity and data mappers.
   - CI runs builds, tests, lint, rules tests, and dead-code checks.

### Phase 1 acceptance gate

- A student created by `bulkCreateStudentAccounts` loads the correct profile.
- Cross-student and cross-college academic reads/writes fail.
- Attendance, timetable, assignment, assessment, and grade journeys pass in staging.
- Students cannot read answer keys or write scores/grades/counters.
- Required tests run in CI and do not skip.

## Phase 2 — Finance, campus services, and production experience

Goal: complete the supporting portal and make the entire experience operationally ready.

### Workstreams

1. **Finance**
   - Payment-provider order flow, signed webhook verification, idempotent ledger, reconciliation, refunds, and verified receipts.
   - Student-scoped invoices and consistent dashboard/detail totals.

2. **Campus services**
   - Real faculty material upload and audience/publication workflow.
   - Persistent library catalog, issue/return/renewal, fines, and student views.
   - Event authoring and transactional student registration/capacity.
   - One notification model with immutable broadcasts and per-recipient read state.

3. **Settings and communication**
   - Persisted notification preferences applied to delivery.
   - Password recovery and robust account recovery.
   - Profile consistency across Auth, users, students, and college index records.

4. **Experience and operations**
   - Accessibility remediation and automated axe/keyboard coverage.
   - Full localization of student pages and locale-aware dates/numbers.
   - Responsive table alternatives, consistent design system, reduced motion.
   - Bundle/read budgets, observability, privacy-safe audit logs, and dependency upgrades.

### Phase 2 acceptance gate

- Verified payments are the only path that changes fee balances.
- Materials, library, events, and notifications work end-to-end from staff authoring to student action.
- Accessibility, localization, performance, security, and operational checklists pass.

## Current Phase 1 milestone

**Milestone 1: identity and authorization baseline**

- Repair official student profile resolution.
- Harden bulk provisioning duplicate checks/rollback behavior.
- Scope attendance and schedule reads by canonical identity/college.
- Remove the unsafe student-directory route.
- Close current question/paper answer-key reads.
- Add explicit dashboard/page error handling for profile linkage failures.
- Add rule/index tests for the repaired contract.

### Implementation status (2026-08-29)

Completed in the first Phase 1 increment:

- Canonical `students.userId` profile resolution and explicit unlinked-account errors.
- Chunked, validated bulk provisioning with atomic Firestore writes and UID-safe Auth rollback.
- Server-owned student profile/preferences updates in the deployed Functions region.
- Student-directory route and source removed.
- Tenant-scoped attendance and timetable reads with required indexes.
- Student access to answer-bearing question/paper authoring documents closed.
- Realtime Database client access closed because no active product workflow uses it.
- Deployable Storage rules added.
- Assignment discovery, upload sessions, orphan cleanup, transactional submission, and bounded server-side grading introduced.
- Official `gradeRecords` contract introduced; the UI no longer fabricates credits or mark splits from assessment attempts.
- Unit tests repaired and Firestore/Realtime Database/Storage emulator coverage wired into CI without a skip path.
- Server-filtered assessment discovery, server-created attempts, frozen question snapshots, answer-key-safe delivery, autosave, deadline enforcement, idempotent submission, server-owned objective grading, basic proctor event logging, controlled result release, and staff manual grading implemented.
- Faculty assessment scheduling now uses real paper/student cohorts and callable publish/cancel contracts; a routed faculty assessment workspace exposes scheduling and pending manual grading.
- Assessment attempt/submission writes and direct student score reads denied; grading unit tests and emulator authorization cases added.
- Assignment authoring, draft-only edits/deletion, validated status transitions, and authorized short-lived faculty submission downloads migrated to callables.
- Registrar grade drafts, deterministic record identities, transactional publication/deletion, immutable audit events, draft isolation, and a routed admin/HOD publication workspace implemented.
- Paper uploads now use tenant/author namespaces; validated callable authoring enforces high-stakes review, and routed admin/HOD review transitions and short-lived file downloads replace direct browser approval writes.
- Student routes now share one academic-data provider, eliminating duplicate sidebar/page profile and six-domain fetches.

Still in Phase 1:

- Add callable/integration coverage for assessment, assignment, grade-publication, and paper-review transaction races and run the academic journeys in staging.
- Complete remaining page-level academic error states and remove obsolete duplicate data APIs.
- Run the full emulator suite in Java-enabled CI/staging and complete the Phase 1 acceptance gate.
