# Auth, login and provisioning — complete audit

**Date:** 2026-09-04 · **Scope:** student / faculty / principal(·admin)·HOD·superadmin login,
the two bulk-import screens, the single-admin screen, and `current-firestore.rules`.
**Status:** implemented in this branch. Nothing is live until §5 is run.

This document replaces the diagnostic sections of `AUTH_AUDIT.md`, `LOGIN_FIX.md` and
`STUDENT_BULK_UPLOAD_FIX.md`. Those files describe states of the code that no longer exist;
each carries a banner pointing here. §8 corrects one claim in them that is simply wrong, and
that wrongness is *why* the rules were patched three times without ending the outage.

---

## 0. Thirty-second version

If an account "does not work", it is in exactly one of three states, and they need different
repairs:

| State | Symptom | Repair |
| --- | --- | --- |
| **No Auth account** | Sign-in fails with `auth/user-not-found` / "invalid login credentials" | Import again with *Reclaim*, or Access Control → Identity repair → Apply |
| **Account exists, no role claim** | Sign-in succeeds, every page is empty / `permission-denied` | Identity repair (or the user's own "Repair my access" at sign-in), then **sign out and in** |
| **Claim issued, token stale** | Same as above for up to ~1 h | Sign out and in (the server already called `revokeRefreshTokens`) |

The app now distinguishes these instead of showing a generic error, and the identity
callables refuse to run against a backend that is older than the frontend (§4.1).

---

## 1. The symptoms, stated precisely

1. **Bulk student upload produced no passwords.** Rows appeared in `students`, nobody received
   a credential, and the import screen had nothing to show.
2. **Faculty passwords had to be read out of Firestore.** So a plaintext `password` field was
   being written onto a document that every same-college staff member can read.
3. **Regression across attempts:** at one point uploads created Auth users; after a later
   change they created "only Firestore records", i.e. accounts that cannot sign in.
4. **Principal / admin / HOD logins intermittently fail** with `ACCOUNT_NOT_FOUND` or
   "Missing or insufficient permissions" *after* a successful password check.

---

## 2. Why three previous fixes did not end it

Not one bug: **four independent defects**, in three different deployment targets, plus a
process gap that made every fix look ineffective.

* The repository's `importUsers` **did** create Auth accounts correctly (§3.2) — but the
  **deployed** `bulkCreateStudentAccounts` was a stale, Firestore-only build. CI
  (`github/workflows/ci.yml`) only runs a build; there is no deploy step, no `.firebaserc`,
  and rules / functions / hosting are three separate manual deploys. So the browser was
  talking to old code, and the only clue was one line: `Cloud Function error:`.
  **Any** client-side "fix" to provisioning is inert until `firebase deploy --only functions`
  actually runs. That is how a correct fix gets judged as a failed fix, three times over.
* The failure surfaced as *zero created rows with no reason*, because the importer swallowed
  the callable error into an `errors: string[]` and the UI rendered nothing.
* The rules were edited under a false model of Firestore semantics (§8), so each rules change
  "fixed" the symptom in one screen and re-broke it in another.

---

## 3. Root causes

### 3.1 Faculty: the credential existed but was never displayed
`src/modules/superadmin/pages/FacultyImport.tsx` rendered a success summary with no credential
table. The password *was* returned by the callable and *was* also written to
`faculty/{id}.password` — which is how it was being read out of Firestore. Two bugs, one habit:
**storing a secret to compensate for not displaying it.**

### 3.2 Students: short-circuits that made "no password" a silent success
In `bulkCreateStudentAccounts`, a row whose `email` or `regNo` already existed in Firestore was
reported as imported without touching Auth, and Auth reclaim was gated on the email existing in
`users/{uid}`. A student created by the old Firestore-only path therefore produced a row that
looked successful and had no credential — symptom 1 and 3 at once. `bulkProvisionStaff` had the
mirror bug for staff: existing same-college profiles were marked
`skipped (password unchanged)`, and skipped rows were counted as failures and shown nowhere.

### 3.3 Rules: a student cannot resolve their own record
Student pages resolve a profile through a *constrained query* on `students` (`where userId ==
auth.uid`) and then `colleges/{cid}/students/{regNo}`. `students.allow list` was
`isSuperadmin() || isStaff()`, so a correctly provisioned student's own lookup was denied, and
the UI reported "no student record found" for an account that was actually fine.

### 3.4 Rules: claim-only authorization vs. claim-less accounts
Identity in `current-firestore.rules` is taken from the ID-token **claim only** (correct —
profile documents are client-writable, so they cannot be trusted for a role). Consequence: an
account created without claims — every row imported by the old REST-`signUp` path, and anything
the Identity Toolkit REST API touched — signs in and is then denied everything. Symptom 4.
Previous fixes responded by re-introducing profile-document fallbacks (`roleFromLookupOrProfile`,
`legacyProfileRole`), i.e. by **making the rules forgeable**. Those fallbacks were dead code in
this branch already, and §4 removed them for good.

### 3.5 A whole page that only pretended to import
`/admin/onboarding` ("Onboarding Center") parsed and previewed a CSV, then
`handleProcessUpload` did `showInfo("Processing 240 students...")` in front of
`// TODO: Call API to bulk upload`. An admin who used it saw a success toast and got neither
Firestore rows nor Auth accounts — indistinguishable from the reported bug. The module behind
it (`src/modules/admin/services/onboardingService.ts`) also carried the origin of symptom 2's
bad habit: a default password of `name.slice(0,4) + regNo.slice(-4)` and a decorative
client-side SHA-256 `passwordHash`.

---

## 4. The fix

### 4.1 Functions — one identity contract, versioned, verified, honest
`functions/src/identityShared.ts` (new) is the shared core: role canonicalisation, email/phone
normalisation, `generateRandomPassword`, `verifyCaller`, `findAuthUserByEmail`,
`verifyAuthAccount`, `secretFieldDeletes`, `IDENTITY_API_VERSION = 'identity-2026.09.04-a'`.

* `bulkCreateStudentAccounts` (`studentAuth.ts`) and `bulkProvisionStaff` (`staffAuth.ts`)
  rewritten: create-or-**reclaim** the Auth user (existing email → password rotated + claims set,
  never silently reused), write `users/{uid}` with `studentDocId` / `facultyDocId`, mirror
  `colleges/{cid}/students/{regNo}`, **delete** any plaintext `password`/`passwordHash`/… from
  the profile document, then read every account back with `verifyAuthAccount`.
* Per-row `status: 'created' | 'reclaimed' | 'skipped' | 'failed'` + `authVerified` — skipped is
  never counted as created, and a row whose Auth read-back failed is loud, not silent.
* `deliveryMode: 'temp-password' | 'reset-email'`: the latter returns a
  `generatePasswordResetLink` URL and **no** password (`Admin SDK` has no
  `sendPasswordResetEmail`; client code may use the *client* SDK for that).
* Every response carries `apiVersion`. The client refuses to import against a backend that
  doesn't report the version it was built for → a stale deployment fails loudly **before** any
  write, with the exact deploy command in the message.
* New callables: `auditAndRepairIdentities` (dry-run by default; findings `MISSING_AUTH`,
  `MISSING_CLAIMS`, `PLAINTEXT_SECRET`, `AUTH_ONLY_NO_PROFILE`) and `syncMyIdentity`
  (self-heal a claim from your own profile document; refuses to *change* a role).
* `resetUserPassword`, `syncIdentityClaims`, `grantUserRole`, `promoteToAdmin` return
  `apiVersion` / `authVerified` / `reauthenticateRequired`, and no longer write secrets to
  Firestore.

### 4.2 Rules — tenant-safe self-scoping, secrets impossible, dead fallbacks deleted
* `students.allow list` gains `|| ownsStudentProfile(id, resource.data)`, so a query the client
  constrains to its own row passes while an unbounded sweep still fails (§8 explains why this is
  sound).
* `faculty.allow list` gains the owner/`uid`/`email` branches so a claim-less imported account
  can at least discover its own profile at sign-in.
* `colleges/{cid}/students`: `read` split into `get` (document proves ownership) and `list`
  (path + claim, or own row).
* `noPasswordField()` now guards `students`, `admins`, `hods`, `mentors`, `superadmins` and
  `users/{uid}` writes, not just `faculty`. A credential can no longer be *stored*, so it can
  never again be the recovery procedure.
* `noPrivilegedRole()` extended to the student profile write path (a `role: 'superadmin'` field
  on a `students` document is rejected).
* Deleted: `userDocExists`, `userDoc`, `roleField`, `profileRole`, `legacyProfileRole`,
  `roleFromLookupOrProfile`, `profileCollegeId`, `linkedProfileCollegeId`,
  `collegeIdFromLookupOrProfile` — every one verified to have no remaining call site. Identity is
  the claim, full stop; the header comment now states what follows from that.

### 4.3 Client — credentials surface, error translation, self-healing
* `src/shared/services/identityBackend.ts` + `src/modules/superadmin/api/identityApi.ts`: the
  version handshake, `describeIdentityError()` (turns `functions/not-found` into "deploy it, and
  here is the command"), `credentialsToCsv`, `sendPasswordResetEmailTo`.
* `CredentialsTable.tsx`: masked-by-default one-time passwords, per-row copy, per-row "Send reset
  link", CSV export, amber row when `authVerified === false`. Never persisted anywhere.
* `UserImport.tsx`, `FacultyImport.tsx`, `CreateCollegeAdmin.tsx`, `/admin/onboarding` all render
  it; the two import screens choose `deliveryMode` and the existing-account policy, and show
  created / reclaimed / skipped / failed separately with the backend's warnings.
* `AuthContext` resolves identity once (`roleRoutes.ts` is the single routing map), and on a
  claim-less token calls `syncMyIdentity`, force-refreshes the ID token and re-resolves. If that
  cannot help, the login screen says what is wrong (`auth.identityStale`, `auth.noStudentProfile`)
  and where to click, instead of `ACCOUNT_NOT_FOUND`.
* `resolveStudentRecord()` (`studentRecordResolver.ts`) walks the ownership chain
  (`users/{uid}.studentDocId` → `colleges/{cid}/students/{regNo}` → `students/{uid}` → legacy
  `userId`/`uid`/email), and reports `permission-denied` **differently** from "no record", because
  they are different bugs with different fixes.
* `SuperAdminFaculty` "Fix passwords" now delegates to `auditAndRepairIdentities` (dry-run
  preview → apply) rather than generating passwords in the browser.

### 4.4 Deploys stop being manual archaeology
`.firebaserc` is committed (and un-ignored, with the reason in `.gitignore`); `deploy:rules`,
`deploy:functions`, `deploy:hosting`, `deploy:all` npm scripts; a `deploy.yml` workflow
(manual `workflow_dispatch`, `environment: production`, builds then deploys rules/functions/
hosting to the pinned project); CI now runs the functions unit tests and a non-blocking emulator
job for the rules. `scripts/identity-doctor.mjs` (`npm run identity:doctor`) answers the same
questions from the command line — read-only by default — for when the app itself is unusable.

---

## 5. Deploy runbook — the only order that works

```bash
# 0. One-time: a service account for the doctor script (optional but recommended)
export GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/vriddhi-serviceAccount.json

# 1. Preview the damage before changing anything
npm run identity:doctor -- --college <collegeId>            # read-only

# 2. Deploy rules + functions + hosting together (they are one release)
npm run deploy:all          # = build, then firebase deploy --only firestore:rules,firestore:indexes,functions,hosting

# 3. Repair the accounts created during the broken window
npm run identity:doctor -- --apply --delivery reset-email --csv /tmp/vriddhi-issued.csv
#    …or in-app: Superadmin → Access Control → Identity repair → Preview → Apply

# 4. Delete the CSV once handed over
shred -u /tmp/vriddhi-issued.csv

# 5. Every affected user signs OUT and back IN (claims ride the ID token)
```

Then re-run §6. A `functions/not-found` anywhere means step 2 did not complete — the client will
say so in exactly those words.

---

## 6. Verification checklist

| Check | Expected |
| --- | --- |
| `npm --prefix functions run build` | clean |
| `npm run test:functions:unit` | pass, incl. the version-handshake test that fails if client and functions drift |
| `npm run build` | clean |
| `npm run test:rules` (needs the emulator/Java) | pass, incl. the four new login-path cases |
| Import 3 students, `reset-email` | 3 rows, no passwords shown, "Send reset link" per row; `students/{id}` has **no** `password` field; each `users/{uid}` has `studentDocId` |
| Import the same file again, *Skip* | 0 created, 3 **skipped**, no credential churn |
| Import the same file again, *Reset* | 3 reclaimed with new credentials |
| New student signs in | lands on `/student/dashboard`, profile renders |
| Delete the student's role claim in Auth, sign in | login succeeds, banner says access is stale, "Repair my access" fixes it, sign-out/in restores |
| Sign in as an imported faculty member | faculty dashboard, no `permission-denied` in the console |
| `GET` any student/faculty doc with a `password` field from the browser | **denied** by `noPasswordField()` |
| Student tries `getDocs(collection(db,'students'))` unbounded | **denied** (self-scoping did not widen access) |

---

## 7. Recovering accounts created during the broken window

`Auth only, no profile` and `profile only, no Auth` were both produced by the old code, so
assume a mix. `auditAndRepairIdentities` (and `identity-doctor --apply`) is idempotent,
superadmin-gated, dry-run-by-default, `maxInstances: 1`, and logs to `logs/IDENTITY_REPAIR`.
It will: create the missing Auth user, set `role`/`collegeId` claims, write/repair `users/{uid}`
(+ `studentDocId`/`facultyDocId`), relink a stale `uid`, delete plaintext credential fields, and
emit a reset link per created account. It will **not** change an existing role, delete an Auth
account, or touch a document it cannot read back.

---

## 8. The claim that cost the most time

Earlier documents assert that a Firestore `list`/query rule "has no `resource`, so any rule
referring to `resource.data` always denies a list". **That is not how rules work.** A query rule
is evaluated against each candidate document with `resource` bound; a `list` fails when the query
could return a document that violates the rule. The rules suite in this repo proves it
(`resolves the provisioned profile by canonical userId` asserts a *successful* student `list`).

Consequences:

* Do **not** "fix" a denied query by splitting `allow read` into `allow get` + an open
  `allow list`; that *loosens* security (it is how a blanket staff `list` on `users` across
  colleges would sneak in).
* The right fixes are: constrain the **query** (that is what the client resolver now does), or add
  a *tenant-safe* `||` branch to `list` (that is what §4.2 does), and make the UI tell
  `permission-denied` apart from "not found".
* The 10-`get()`/`exists()`-per-request budget is real, and it is per candidate document for a
  list — which is the actual reason profile-document fallbacks must not come back.

---

## 9. Residual risks / follow-ups

1. **Deploy discipline.** `deploy.yml` is manual by design (a push must not replace a live
   tenant's rules), so a human still has to run it. Making it automatic on `main` is a policy
   decision, not a code one.
2. **`mustChangePassword`** is written by provisioning and consumed by nobody. Either build the
   forced-change screen or drop the claim; today it is decoration.
3. **Schedules / assessments** have no bulk importer; `/admin/onboarding` now labels those tabs
   "Validation only" instead of pretending. Wiring them to real importers is open work.
4. **Rules suite is non-blocking in CI** (`continue-on-error`) because several of its
   `describe`d expectations predate the claim-only rewrite; flip it once it is green locally with
   the emulator.
5. **`functions/src/{config,services,middleware,routes,api}/*.js`** are committed build leftovers
   inside `src/`; they are not compiled (`tsconfig` `include: ["src"]`, `allowJs` off) but they
   invite edits to the wrong file. Add them to `.gitignore` and delete.
6. **Client-side `updatePassword` without re-authentication** (student/faculty/admin Settings)
   relies on `auth/requires-recent-login` producing a helpful message. It does, but a
   re-auth step would be better UX than "log out and back in".
7. **Firebase Auth has no server-side email send here**; "Send reset link" uses the client SDK
   from the importer's own authenticated session. For headless imports use
   `deliveryMode: 'reset-email'`, which returns the link for delivery over any channel.

---

## 10. Invariant → where it is enforced

| Invariant | Enforced by |
| --- | --- |
| A person exists in Auth before they exist in Firestore | `bulkCreateStudentAccounts`, `bulkProvisionStaff`, `grantUserRole` (single batch, read-back verified) |
| Role/college come from the token claim, never from a document | `role()` / `collegeId()` in `current-firestore.rules` (fallback helpers deleted) |
| No profile document ever holds a password | `noPasswordField()` on all profile writes + `secretFieldDeletes()` in the callables |
| Frontend never runs against a stale backend | `IDENTITY_API_VERSION` handshake in `identityBackend.ts` |
| Skipped ≠ created ≠ failed | per-row `status` in both callables → `CredentialsTable` |
| A student sees exactly one student row: their own | `ownsStudentProfile` + self-scoped `list` branch + `resolveStudentRecord` |
| A claim-less account can heal itself | `syncMyIdentity` ← `AuthContext`, plus `auditAndRepairIdentities` for bulk |
| One routing map for roles | `src/modules/auth/roleRoutes.ts` (login pages + `routes/index.tsx` consume it) |
| Deployed-artifact drift is visible | version handshake + `describeIdentityError` + `identity-doctor` |
