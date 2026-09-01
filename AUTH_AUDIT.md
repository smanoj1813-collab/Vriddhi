# Vriddhi authentication and identity audit

## Identity model

Firebase Authentication proves the email/password identity. The application role is wired across Auth custom claims, `users/{uid}`, and the role-specific profile collection. Cloud Functions are the trusted boundary for grants and provisioning; the client only presents the request.

## Access Control SOP

1. A current superadmin opens **Superadmin → Access Control**.
2. Enter an existing Auth email to repair or grant an identity. Existing passwords are preserved.
3. To create a new account, provide the display name and either a password or accept the generated temporary password. Deliver temporary credentials securely and ask the user to change the password.
4. Select the role and college. A superadmin does not require a college; every tenant-scoped role does.
5. Use Identity audit after a grant to confirm claims, lookup documents, profile documents, and student linkage.
6. Re-authentication is required after a role grant so the browser receives refreshed custom claims.

## Guarantees

`grantUserRole` is superadmin-only, region `asia-south1`, idempotent for existing accounts, and records an audit document in `logs`. Granting `superadmin` creates/merges `superadmins/{uid}`; granting another role removes that document as the revocation path. Staff profiles are merged by email when available and students receive both `uid` and `userId` links.

## Legacy identities in Firestore rules

Accounts created before the Access Control work (imported faculty, hand-written profile documents, spreadsheet uploads) may have no custom claims and no `users/{uid}` document. `current-firestore.rules` now resolves those identities itself, in the same order as the client lookup in `src/modules/auth/context/auth.ts`:

1. Auth custom claim `role`.
2. `users/{uid}.role` (also `userRole`, then `userType`).
3. Role profile collection keyed by uid: `superadmins` → `admins` → `faculty` → `hods` → `mentors` → `students`. A profile document without a role field is read as the role the collection names.
4. Nothing — the request is unauthenticated or has no identity, and every staff read stays denied.

Role spellings are normalised before comparison (`Faculty`, `teacher`, `Head of Department`, `super admin`, ...), and the tenant is resolved from `collegeId`, `collegeID`, or `college` on the profile document.

An account that can only be matched by email (no uid-keyed document anywhere) cannot be resolved by rules, because rules cannot query by email. Repair those identities once with **Superadmin → Access Control**; the grant writes `users/{uid}` and the custom claims, and the account then resolves from step 2.

## Tenant scoping

College data is scoped by `collegeId` on the document, or by the collection path for the legacy per-college collections whose documents pre-date that field.

**Scoped to the caller's college:** students, faculty, admins, hods, mentors, attendance, attendanceRecords, attendanceSummary, classSessions, weeklySchedules, studentAssessments, studentSubmissions, submissions, gradeRecords, feeStructures, payments, notifications, and every `colleges/{collegeId}/{...}` subcollection.

**Shared across colleges by design:** `questions`, `papers`, `assessments`, `scheduledTests`, `curriculum`, `syllabusExtracts`, and the cloud question bank (`questionBank_meta`, `papers_universal`, `paperTemplates`, `questionReviews`). Any signed-in staff can read these. If cross-college sharing is not intended, these need a college check too.

Superadmin retains the cross-college view needed for support, and callables resolve tenancy server-side regardless of these rules.

## Composite indexes

Queries that filter on more than one field need a composite index, and Firestore rejects them at runtime without one — several call sites catch the error and return empty data, so the gap is easy to miss. `firestore.indexes.json` is the source of truth; re-check it whenever a query gains a `where` or `orderBy`.

## Important safety notes

- Never put Firebase Admin credentials or passwords in the client.
- Treat temporary passwords as secrets; the callable response is shown only to the initiating superadmin.
- Firestore rules and callable authorization remain the enforcement boundary; UI role checks are not security controls.
- Review audit results and the diff before deploying functions or hosting.
