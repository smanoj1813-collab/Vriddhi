# Vriddhi Student Portal — Complete Audit

**Audit date:** 2026-08-29
**Branch:** `arena/01a04b70-vriddhi`
**Scope:** student authentication, routing/layout, dashboard, attendance, assessments and test-taking, assignments, grades, materials, timetable, fees, library, events, notifications, settings, the hidden student-directory route, Firebase authorization, supporting Cloud Functions, testing, dependencies, performance, accessibility, and maintainability.

## Executive verdict

**Release decision: NO-GO for production student use.**

The frontend compiles and the portal has a broad, responsive UI, but the checked-in backend contract does not support most student workflows. The most consequential problems are:

1. **Officially provisioned student profiles are not resolved by the student hooks.** The provisioning function stores the Auth UID in `students.userId`, while both profile readers search by document ID, then `uid`, then email—not `userId`. The email fallback cannot satisfy the ownership rule as a safe Firestore query. A provisioned student can authenticate through `/users/{uid}` but then commonly reaches a dashboard with fabricated defaults and no real student data.
2. **The assessment engine is denied by the checked-in Firestore rules.** There are no rules for `studentAssessments`, `scheduledTests`, their question snapshots, or proctor logs.
3. **The proposed assessment design is insecure even if those paths are opened.** Answer keys are stored in documents available to the browser, grading happens in the student-controlled client, and the client writes its own score, grade, result detail, and graded status.
4. **Published question and paper records already expose answer material.** Student reads are permitted on published `questions` and `papers`, but those documents include `correctAnswer`, option `isCorrect`, explanations, and embedded questions. Firestore cannot redact individual fields.
5. **The fee portal is not a payment system.** It has no provider checkout, webhook, server verification, ledger, or idempotency. It directly mutates accounting data and displays success plus invented transaction/receipt numbers without awaiting a successful write. Checked-in rules currently deny the nested records, so it is both nonfunctional and unsafe to enable as written.
6. **Assignment reads and submissions are incompatible across the faculty UI, student UI, and rules.** `studentId`/`studentUid`, `deadline`/`dueDate`, `maxScore`/`maxMarks`, and required `collegeId` fields disagree. Storage rules are absent. The normal student submission is denied.
7. **Several advertised portal modules have no end-to-end producer at all.** Faculty materials use a stub API; faculty library data is component-local mock state; no event or persisted-notification authoring path was found.
8. **Failures are routinely converted into empty arrays.** Permission, index, schema, and backend failures therefore appear to students as “no records,” “fully cleared,” or “all caught up.”

## Audit evidence and verification

| Check | Result |
|---|---|
| Frontend clean install | `npm ci` succeeded; 463 packages installed |
| Frontend production build | **Passed** (`tsc && vite build`) |
| Functions clean install | Succeeded with `PUPPETEER_SKIP_DOWNLOAD=true`; 404 packages installed |
| Functions TypeScript build | **Passed** |
| Dead-code reachability check | **Passed**: 216 source files, 194 reachable, 19 deliberately unrouted |
| Functions tests | **Suite failed**: 10 assertions passed, then `timetableConflicts.test.ts` failed with `ReferenceError: describe is not defined` |
| Firestore rules tests | **Skipped**, because CI/test invocation does not start or target the emulator |
| Frontend tests | No frontend test script or student tests |
| Frontend lint | No lint script |
| Root dependency audit | 3 findings: 2 high, 1 moderate |
| Functions dependency audit | 13 findings: 3 high, 9 moderate, 1 low |
| Git changes made by this audit | Documentation only; no application or rules code changed |

The conclusions about permissions describe the behavior of the **checked-in** `current-firestore.rules` and `firebase.json`. A separately deployed, untracked Firebase configuration could differ; that difference would itself be a release/configuration-drift risk.

## Severity model

- **P0 — Critical/blocker:** release-blocking, academic/financial integrity risk, or primary workflow unavailable.
- **P1 — High:** serious privacy, authorization, data-integrity, or major functional failure.
- **P2 — Medium:** significant correctness, reliability, performance, accessibility, or maintainability weakness.
- **P3 — Low:** polish, minor inconsistency, or low-impact technical debt.

---

# 1. Critical and high-priority findings

## P0-01 — Provisioned students cannot reliably resolve their own student profile

**Evidence**

- `functions/src/studentAuth.ts:243-269` creates a random `/students/{documentId}` and stores the Firebase Auth UID as `userId`.
- `src/modules/student/hooks/useStudentProfile.ts:61-89` checks document ID, `uid`, then email.
- `src/modules/student/api/studentDataApi.ts:192-207` repeats the same lookup and also omits `userId`.
- `current-firestore.rules:75-83` correctly recognizes `resource.data.userId == request.auth.uid`, but an email-only query does not prove this ownership condition.
- Authentication itself succeeds through the `/users/{uid}` document created at `functions/src/studentAuth.ts:271-288`, so the failure occurs after login.

**Impact**

The dashboard renders fallback identity/course values and zeroed metrics, while profile-dependent pages either remain on a spinner, show empty content, or use the Auth UID where the domain student document ID is expected.

**Fix**

Adopt one explicit identity contract:

- `authUid`: Firebase Auth principal;
- `studentId`: domain/student document ID.

Query `/students` with `where('userId', '==', auth.uid)`, enforce uniqueness server-side, cache the resolved student ID in an authenticated portal context, and migrate legacy `uid` records. Add emulator tests based on the actual `userId` provisioning schema.

## P0-02 — Assessment collections are not authorized, so the assessment portal is unavailable

**Evidence**

`current-firestore.rules` has no explicit match for:

- `/studentAssessments/{id}`;
- `/scheduledTests/{id}`;
- `/scheduledTests/{id}/assessmentQuestions/{id}`;
- proctor event subcollections;
- legacy `/assessments/{id}` records used by fallback code.

The final catch-all at `current-firestore.rules:271-273` denies all of them. Student reads occur in `studentDataApi.ts:343-364` and throughout `testApi.ts`.

**Impact**

The assessments dashboard, instructions, active test, result, grades, and leaderboard cannot operate under the repository’s rules.

**Fix**

Do not simply make these collections broadly readable/writable. Introduce server-owned enrollment/attempt endpoints and narrowly scoped result reads. Test all lifecycle states in the Firestore emulator before deployment.

## P0-03 — Question answers are exposed to student clients

**Evidence**

- Student reads of published `questions` and `papers` are allowed at `current-firestore.rules:121-143`.
- Question data includes `correctAnswer`, option-level `isCorrect`, explanations, and solutions (`src/modules/admin/api/cloudStorageApi.ts:42-52`).
- Scheduled snapshots copy `isCorrect`, `correctAnswer`, and explanation into the snapshot (`src/modules/admin/api/assessmentsApi.ts:538-561`).
- The test API downloads full question documents and strips keys only afterward in browser memory (`src/modules/student/api/testApi.ts:147-196`, `125-131`).

**Impact**

A student can use the browser, Firebase SDK, network tooling, or a modified client to retrieve answer material. Removing fields from React state after download is not a security boundary.

**Fix**

Split each question into:

- a student-readable immutable prompt/options snapshot with no grading keys;
- a server-only answer/rubric record.

Prevent student reads of source question banks and paper-authoring documents. Deliver attempts through a callable/HTTP backend that validates enrollment and returns only safe fields.

## P0-04 — Students control grading and authoritative assessment results

**Evidence**

`submitStudentAssessment` in `src/modules/student/api/testApi.ts`:

- downloads answer keys;
- calls browser-side `gradePaper`;
- derives percentage and grade in the browser;
- writes `marksObtained`, `percentage`, `grade`, `gradePoint`, counts, question results, timestamps, and `status` directly to Firestore;
- increments scheduled-test counters from the client.

The grading utility is `src/shared/utils/assessmentGrading.ts`.

**Impact**

Any student can modify the client or call Firestore directly to submit arbitrary scores if write access is enabled. Academic results cannot be trusted.

**Fix**

Submit only answers and an attempt/version token to a trusted Cloud Function. The server must load the frozen rubric, validate ownership and status transactionally, calculate objective scores, store manual-grading work, and publish results. Students must have no direct write permission to scores, grade fields, counters, or grading status.

## P0-05 — Test enrollment, schedule enforcement, and submission integrity are missing

**Evidence**

- No active code path was found that fans scheduled tests out into authoritative student-assessment rows; `createStudentAssessment` is defined but not used by page/hook code.
- The student dashboard discovers only existing `studentAssessments` rows, so a newly scheduled test does not naturally appear.
- `ensureStudentAssessmentRow` lets a client create its own row from a known test ID.
- `startStudentAssessment` blocks only cancelled tests; it does not enforce the scheduled start, end, enrollment, cohort, completed state, or attempt limit.
- `studentDataApi.ts:422-424` marks **upcoming** tests as startable; `StudentTestDashboard.tsx:243-249` renders that state as a clickable button.
- Start and submit are not protected by an ownership/status transaction or idempotency key. Concurrent/repeated calls can duplicate rows and inflate `totalStarted`/`totalSubmitted`.
- Timer, `startedAt`, time spent, auto-submit, and proctor evidence are client-controlled.

**Impact**

With permissions opened, students could self-enroll, start early or late, submit against caller-selected IDs, repeat actions, and manipulate attempt metadata.

**Fix**

Create server-side `startAttempt`, `autosaveAttempt`, and `submitAttempt` operations. Validate Auth UID → student ID, college, cohort/enrollment, schedule window, attempt count, and current row version. Use transactions and idempotency keys, and derive all authoritative times from server timestamps.

## P0-06 — Fee “payment” is unverified and reports false success

**Evidence**

- `src/modules/admin/api/feeApi.ts:167-187` directly increments `paidAmount`, changes status, and invents transaction and receipt IDs.
- `StudentFeePortal.tsx:99-105` waits 1.2 seconds, invokes a non-awaited callback, and enters the success state regardless of the result.
- `StudentFeePortal.tsx:116-131` displays independently generated IDs that need not match any persisted record.
- Receipts substitute a hard-coded number if missing and claim to be “computer-verified” (`StudentFeePortal.tsx:257-298`).
- There is no payment-provider checkout, signed webhook verification, server ledger, reconciliation, refund handling, or idempotency.
- The nested `/colleges/{collegeId}/feePayments` and `feeStructures` paths have no matching Firestore rules and are denied today.

**Impact**

Today the feature does not complete under checked-in rules but can still tell a student it succeeded. If write access is added, a modified client can mark invoices paid without transferring money.

**Fix**

Disable “Pay Now” until a real provider integration exists. Create a server-generated payment order, verify a signed provider webhook, update an append-only ledger transactionally, and generate the receipt only from the verified ledger event. Never let a student write accounting fields directly.

## P0-07 — Assignment delivery and submission are contractually incompatible

**Evidence**

- Faculty assignment/submission schemas use `studentIds`, `studentUid`, `deadline`, `maxScore`, and faculty-specific status values in `src/modules/faculty/api/assignmentApi.ts`.
- Student list code queries `studentIds` but maps `dueDate` and `maxMarks` (`studentDataApi.ts:455-506`). Cohort assignments are not fetched at all.
- The list query does not constrain `collegeId` or allowed statuses, so it cannot satisfy the student-read rule at `current-firestore.rules:207-219`.
- Student submission code writes `studentId` and omits both `studentUid` and `collegeId` (`assignmentService.ts:187-198`). Rules require `studentUid == auth.uid` and `collegeId == collegeId()` (`current-firestore.rules:225-245`).
- Submission reads also query `studentId`, while rules authorize `studentUid`.
- Files are uploaded before the rejected Firestore write and no cleanup runs, leaving orphaned objects on failure.

**Impact**

Assignments generally appear empty and submission writes are denied. If Storage happens to permit upload, failed submissions can leave uploaded student work with no record.

**Fix**

Define one assignment/submission schema and ownership model, migrate existing data, query by server-resolved student/cohort, and write through a server operation. Add Storage rules and cleanup/retention logic.

## P1-01 — Nested student modules have no matching rules

The following current reads are denied by the catch-all:

- `/colleges/{collegeId}/materials`;
- `/colleges/{collegeId}/events`;
- `/colleges/{collegeId}/notifications`;
- `/colleges/{collegeId}/feePayments`;
- `/colleges/{collegeId}/feeStructures`;
- top-level `libraryBooks` and `issuedBooks`;
- the top-level `fees` fallback path.

**Fix:** define a collection-by-collection authorization matrix before writing rules. Queries must carry the fields needed for rules to prove college, publication, audience, and ownership. Do not add a broad recursive `colleges/{collegeId}/{document=**}` student read.

## P1-02 — Attendance records use a domain student ID but rules require the Auth UID

Faculty records are written with `studentId: student.id` (`useFacultyAttendance.ts:201-208`, `facultyApi.ts:346-369`). Student code correctly queries the profile document ID, but `current-firestore.rules:156-159` permits student reads only when `resource.data.studentId == request.auth.uid`.

**Impact:** officially provisioned students cannot read their attendance.

**Fix:** authorize via a server-issued claim containing immutable `studentId`, or validate the ownership mapping through a canonical document. Add `collegeId` and `studentId` query constraints and emulator coverage.

## P1-03 — Grades are unavailable and, if opened, academically misleading

- `fetchGrades` reads only `studentAssessments`, currently denied.
- It invents a 40% internal / 60% external split when fields are absent and defaults every course to three credits (`studentDataApi.ts:654-685`).
- The page presents the calculated output as comprehensive grade cards and CGPA.

**Impact:** the feature is empty today; once enabled, it could present unofficial online-test heuristics as transcript/CGPA data.

**Fix:** consume a dedicated, registrar-owned published-grade schema. Never synthesize transcript components or credits.

## P1-04 — Top-level notification rules expose college-wide notification records

`current-firestore.rules:262-265` allows a read if `sameCollege(resource.data)` without restricting that branch to staff. Consequently, a student can read any top-level notification in their college, including records intended for another user, if the record includes `collegeId`.

The student dashboard queries top-level `/notifications`, while the notifications page queries nested `/colleges/{id}/notifications`. Neither has a producer in the reviewed source.

**Fix:** choose one schema. Store per-recipient delivery/read state in a student-owned document, keep broadcast content immutable, and authorize personal notifications by immutable Auth UID/student ID. Never place one mutable `read` flag on a shared announcement.

## P1-05 — The student-directory route is an admin screen exposed inside the student router

`src/modules/student/routes.tsx` includes `/student/directory`, which loads `pages/Students.tsx`. That component queries every student in the college and contains email, phone, home address, date of birth, guardian data, attendance, scores, fee status, edit/delete controls, analytics, and export UI.

Current rules deny its college-wide query to students, so it normally appears empty. Broadening student reads to make it work would expose highly sensitive personal and academic information. Many controls are also no-ops.

**Fix:** remove this route from the student bundle/router. If a peer directory is required, build a separate opt-in view with minimal fields and explicit privacy policy.

## P1-06 — No deployable Firebase Storage policy exists in the repository

No `storage.rules` file or `storage` entry in `firebase.json` was found. Assignment submissions upload up to ten client-validated files of 50 MB each. Validation checks only filename extension; there is no trusted MIME/content validation, malware scanning, quota enforcement, or ownership policy in source control.

**Impact:** depending on remote bucket state, uploads are either broken or insufficiently controlled. Security is not reproducible from the repository.

**Fix:** check in and test Storage rules, constrain paths to Auth UID and assignment ownership, cap content type/size where possible, verify on the server, quarantine/scan uploads, and delete objects when record creation fails.

## P1-07 — Materials, library, events, and notifications are mostly facade features

- `src/api/materialApi.ts` returns empty lists and stub objects; faculty upload calls this stub and does not upload the selected file.
- `FacultyLibrary.tsx` explicitly uses empty mock arrays and mutates only component state.
- No persisted event authoring code was found, while the student “Register” button has no click handler.
- No persisted notification authoring code was found.

**Impact:** these polished pages imply capabilities that administrators/faculty cannot populate and students cannot complete.

**Fix:** either implement the complete authoring → authorization → student consumption flow, or hide the modules and remove misleading actions until they are ready.

## P1-08 — Realtime Database rules expose broad institutional data to any authenticated user

`database.rules.json` allows any authenticated user to read all RTDB `students`, `attendance`, `assessments`, `fees`, `schedules`, and `faculty` nodes. The current student portal primarily uses Firestore, but any data present in these RTDB paths is cross-college readable.

**Fix:** remove unused RTDB paths or enforce tenant and owner boundaries. Add emulator tests and document which database is authoritative.

---

# 2. Page-by-page status

| Area | Status | Main observations |
|---|---|---|
| Student login | **Partial** | Firebase login and role rejection exist. “Forgot password” is only `href="#"`. Errors may expose raw backend text. Labels are not programmatically tied to inputs. |
| Route/layout/sidebar | **Mostly UI-ready** | Responsive drawer, lazy pages, theme, and translated navigation are present. There is no skip link/focus management. Icon buttons lack accessible names. Sidebar triggers a full student-data load. |
| Profile resolution | **Blocked for official schema** | Readers omit `userId`; downstream pages do not share one canonical resolved profile. |
| Dashboard | **Deceptive empty state** | Silently renders default profile/course and zeros after profile/query failures. “Active Tests” counts all assessment rows. “Assignments” counts all rows, not pending rows. Fee dashboard uses a different schema from the fee portal. |
| Attendance | **Blocked for official IDs** | UI and summaries are extensive, but record rule compares domain ID to Auth UID. Status treatment differs across cards/calendar. Errors are not surfaced. |
| Assessments dashboard | **Blocked** | Collections denied. No reliable scheduled-test fanout/discovery. Upcoming tests are clickable/startable. |
| Instructions/start | **Blocked and unsafe if opened** | No server enrollment/window enforcement. Missing profile leaves some pages loading indefinitely. |
| Active test | **Blocked and untrusted** | Good UI concept with timer, autosave, palette, and submit confirmation; all authority remains in the browser. Fullscreen denial does not block entry. |
| Results | **Blocked** | Rich result view exists, but depends on client-authored results and exposes peer names/scores in a leaderboard. |
| Assignments | **Blocked** | Rules/query/schema mismatch; cohort assignments absent; submission writes denied; no Storage policy. |
| Grades | **Blocked/misleading** | Denied collection; synthesized internal/external marks and credits are presented as academic records. |
| Materials | **Not end-to-end** | Nested path denied; faculty source API is stubbed; exact-batch query misses “All Batches”; branch/semester filtering occurs after read. |
| Timetable | **Likely denied** | Query constrains only branch, not `collegeId`, while rules require same-college proof. Full timetable ignores daily class-session overrides used by the dashboard implementation. |
| Fees | **Blocked and unsafe** | Nested paths denied; reads all college fee records before filtering; fake/unverified payment and receipt path. |
| Library | **Not end-to-end** | Student reads global Firestore collections that rules deny; faculty manager is local mock state; status/renewal schemas disagree. |
| Events | **Not end-to-end** | Nested path denied; no authoring source; Register is a no-op; fallback can show unpublished records if broad reads are later added. |
| Notifications | **Not end-to-end** | Dashboard and page use different collections/fields; nested path denied; no producer; shared `read` field design is incorrect for broadcasts. |
| Settings | **Partial** | Theme and local preferences work; password change can work after recent login. Profile writes are denied, preferences are effectively local-only, and Auth display name can update before Firestore fails. |
| `/student/directory` | **Must remove** | Wrong-role admin directory with sensitive fields and dead controls. Current query is denied; enabling it would create a major privacy breach. |

---

# 3. Additional correctness and weak/loose points

## Dashboard and shared data loading

1. `StudentSidebar`, `StudentDashboard`, `StudentAssignments`, and `StudentTestDashboard` each instantiate `useStudentData` independently. On those routes, the sidebar and page perform duplicate profile plus six-domain loads. There is no shared cache/provider.
2. `safeQuery` in `studentDataApi.ts:151-157` converts every query error into `[]`, erasing the difference between empty data and unavailable data.
3. Dashboard fee summary queries top-level `feeStructures`/`fees`, while the fee page reads nested college `feePayments`. The two views can disagree even after permissions are fixed.
4. Class schedules and fee structures are queried without sufficient tenant constraints for the checked-in rules, then filtered in memory.
5. LocalStorage `vriddhi_college_id` is a mutable/stale path selector used by admin APIs reused in the student portal. It is not cleared on logout. It must never be trusted for authorization.

## Assessments and test-taking

1. Browser proctoring catches ordinary DOM events only. Developer tools, disabled/modified JavaScript, a second device, screenshots, network interception, and custom Firebase clients bypass it.
2. Fullscreen rejection/exit only logs and warns; entry/continuation is not prevented.
3. Question type `matching` explicitly has no online answer control (`QuestionRenderer.tsx:319-323`).
4. Assertion/reason answers are hard-coded instead of using the authored options.
5. True/false requires options to be present; there is no fallback construction.
6. There is no “clear answer” action.
7. Flag-only answer objects are included in saved/submitted answer arrays. Result `answeredCount` uses array length in the API, so a flagged but unanswered question can be reported as answered.
8. `MathRenderer` is explicitly a plain monospace placeholder (`MathRenderer.tsx:11-17`) despite KaTeX being installed. The active question text does not use it at all.
9. If an objective question is missing a valid answer key, browser grading can treat it as wrong instead of failing the paper as invalid.
10. “Best Grade” on the assessment dashboard displays the latest result rather than calculating the best result.
11. Leaderboards disclose peer names, marks, percentages, pass/fail state, and time taken. This needs an explicit institutional privacy decision and preferably opt-in/anonymization.
12. The active-test route remains inside `StudentLayout`, so the normal sidebar/navigation remains available during an attempt.
13. There is no robust unload/navigation guard; leaving the SPA depends on the next periodic autosave or manual save.

## Assignments

1. Faculty schema uses `deadline`; student schema uses `dueDate`, so overdue sorting/status can be wrong or absent.
2. Faculty schema uses `maxScore`; student schema uses `maxMarks`/`totalMarks`.
3. Faculty submission schema uses `attachments`, `studentUid`, `score`, and `remarks`; student implementation uses `files`, `studentId`, `marksObtained`, and `feedback`.
4. Student listing fetches direct `studentIds` only; cohort-targeted assignments are omitted.
5. The UI has no assignment attachment download/review despite faculty assignments supporting attachments.
6. Up to 500 MB can be selected per submission (10 × 50 MB) with no server quota or scan.
7. Multiple submissions are not made idempotent and previous file sets are not cleaned up.

## Attendance

1. Overall percentage counts only `present`; monthly percentage counts `present + late`; calendar “present-like” logic differs again. `onDuty`, leave, medical leave, and excused statuses are inconsistently handled.
2. The required threshold is hard-coded to 75 rather than college/course policy.
3. Both `attendance` and `attendanceRecords` models exist; the student page uses one while rules/tests also reference the other.
4. A permission failure can render as 0% attendance, which is materially different from “records unavailable.”

## Fees

1. Student `useFeeData` fetches up to 500 payments and all structures for the college, then filters by student in memory. If nested reads are made broadly available, all classmates’ names, IDs, fee status, balances, transaction IDs, and receipt numbers reach the student browser.
2. `collectPayment` has no server-side checks for positive amount, remaining balance, overpayment, currency, invoice ownership, or already-paid state.
3. `calculateSummary.totalPending` uses full invoice amounts only for `pending`; partial balances are omitted and overdue amounts use full invoices rather than remaining balances.
4. The displayed pending total adds pending and overdue but excludes partial balances.
5. Receipt printing invokes `window.print()` for the whole page with no dedicated print contract or verified receipt endpoint.
6. The modal has no dialog semantics, focus trap, Escape behavior, or announced status changes.

## Materials

1. Student reads exact `batch`, while faculty defaults to `All Batches`; institution-wide materials would not match.
2. Branch and semester are filtered after download. If broad collection access is added, out-of-scope metadata reaches the browser.
3. No publication/status filter is enforced.
4. Faculty’s selected file is not passed to the stub API, so no upload can occur.
5. Student and faculty material types disagree (`doc`/`ppt` versus `document`/`presentation`).

## Timetable

1. `useStudentSchedule` and `fetchTodaySchedule` duplicate schedule mapping/filter logic.
2. The full timetable reads recurring `weeklySchedules` only; dashboard data also attempts daily `classSessions`, so reschedules/cancellations can disagree.
3. Static stored status is displayed instead of deriving upcoming/ongoing/completed from the current time.
4. Querying a whole branch (up to 500) and filtering batch/semester/division in memory is inefficient and potentially cross-cohort data exposure if rules are broadened.
5. Hook errors are returned but ignored by `StudentTimetable`, which displays a friendly empty state.

## Library

1. Catalog reads are global, not college-scoped.
2. Student status expects `active`; faculty mock status uses `issued`.
3. Student expects `renewals`; faculty uses `renewed`.
4. A module-global read counter permanently returns empty data after the session reaches 500 reads; refresh does not reset it.
5. The page says students can “manage issued books” and suggests visiting the catalog to issue books, but offers no issue/renew action.
6. The page discards the hook error state.

## Events

1. “Register” has no handler and `registered` is a single event field, not per-student registration state.
2. The missing-index fallback removes both ordering and `status == published`; if permissions are later broadened, draft/cancelled events can appear.
3. `registeredCount / maxSeats` produces invalid percentages when capacity is zero.
4. Date-only strings are compared to the current timestamp, causing an event to become “past” at the start of its calendar day rather than after its scheduled time.

## Notifications

1. Dashboard expects top-level fields `studentId`, `timestamp`, `actionUrl`; the full page expects nested `recipientId`, `createdAt`, `link`.
2. Sidebar unread count comes from the dashboard schema, not the full notifications page.
3. A shared nested broadcast document has one `read` flag. One student marking it read would mark it read for everyone if writes were allowed.
4. Student write operations are denied in both current notification models.
5. The page imports delete UI/Firestore functions but provides no delete/archive action.
6. Saved notification preferences are never applied to any query or delivery process.

## Settings and authentication

1. Profile save updates Firebase Auth display name first and Firestore second. When Firestore fails, the operation is partially applied but reported as failed.
2. Rules deliberately deny student writes to `/students`; the settings UI nevertheless tries four locations and then attempts to create `/students/{uid}`.
3. Preference sync errors are swallowed and “Saved!” is shown for localStorage only.
4. Password recovery is not implemented on the student login page.
5. `hasPermission` in `AuthContext` always returns `true`. It is not an authorization mechanism and is dangerous if future UI/API code relies on it.
6. Authentication and user-resolution code logs names, roles, UIDs, and detailed flow information in production code.
7. If background auth resolution fails, the Firebase user is not explicitly signed out; app state becomes unauthenticated while the SDK may still hold a session.
8. `bulkCreateStudentAccounts` permits 500 rows but sends the full email and registration-number arrays to Firestore `in` queries; batches above Firestore’s disjunction limit will fail before provisioning.
9. Provisioning creates the Auth account before writing the student/user/index documents and has no rollback, so a later Firestore failure can leave an orphaned Auth account that blocks retry by email.

---

# 4. UX, responsive design, accessibility, and localization

## Positive points

- Main student pages are lazy-loaded.
- The layout supports mobile drawer and desktop collapse behavior.
- Light/dark themes are supported across most portal surfaces.
- Loading, empty, and confirmation visuals are generally polished.
- Core navigation and dashboard/login have a multi-language framework.
- MUI dialogs and controls improve baseline semantics in the test flow.

## Gaps

1. Across the student module and student login there are **64 native `<button>` occurrences and zero explicit `aria-label` attributes**. Text buttons are named, but numerous icon-only theme, menu, close, collapse, refresh, receipt, and back buttons are not.
2. `title` is used on only a subset of icon buttons and is not a sufficient replacement for an accessible name.
3. The custom assignment/payment/receipt modals lack `role="dialog"`, `aria-modal`, a labelled title relationship, focus trapping/restoration, and Escape handling.
4. The question “Flag” control is a clickable MUI `Box`, not a keyboard-operable button.
5. Student-directory table rows are clickable without keyboard equivalents.
6. Form labels generally lack `htmlFor`/matching input IDs. Toggle checkboxes have surrounding labels but no accessible text relationship.
7. There is no skip-to-content link and no explicit keyboard focus transition when the mobile drawer opens/closes.
8. No `prefers-reduced-motion` handling was found despite extensive Framer Motion and CSS animation.
9. Tables rely on horizontal scrolling and offer no compact/card alternative for small screens. Fee, grade, result, and student-directory tables are especially dense.
10. Most pages are hard-coded in English. Only login, sidebar, dashboard, and selected settings strings use translations. Dates also mix `en-IN` and `en-US` regardless of selected language.
11. Tailwind pages and MUI pages have noticeably different spacing, typography, theme behavior, and status colors.
12. Several class strings contain repeated/conflicting light/dark utilities, making contrast behavior difficult to reason about and maintain.
13. Errors are rarely announced with an `aria-live` region; asynchronous save/upload/payment state can be invisible to assistive technology.

**Recommendation:** add `eslint-plugin-jsx-a11y`, automated axe/Playwright coverage, keyboard-only test cases, reduced-motion support, semantic dialog components, and a page-by-page localization pass.

---

# 5. Performance and operational quality

## Bundle

The production build passed but Vite warned about chunks above 500 kB. Notable minified chunks included approximately:

- Firebase: **1,031 kB**;
- `SuperAdminCurriculum`: **925 kB**.

The superadmin chunk is route-lazy and does not necessarily affect the initial student route, but the Firebase shared chunk is substantial. Measure actual compressed student-route transfer and execution with Lighthouse/WebPageTest before setting a budget.

## Firestore read efficiency

- Sidebar plus page duplicate `useStudentData` loads.
- Fees read up to 500 college payments before student filtering.
- Library reads up to 200 global books.
- Materials/events read up to 200–300 records and filter some dimensions in memory.
- Schedule reads up to 500 branch records and filters cohort in memory.
- Student directory has no limit/pagination.
- Several read “caps” are module counters rather than real pagination/cost controls.

Use a portal-level cache (React Query is already installed), server-scoped queries, pagination, count aggregations, and explicit query/index design.

## Index/deployment risks

- `firestore.indexes.json` exists, but `firebase.json` configures only the Firestore rules path and does not explicitly reference the indexes file.
- Required combinations such as the event `status + date` query and attendance `studentId + date` query are not represented in the checked-in index list.
- Fallbacks frequently remove ordering or filters instead of surfacing a deployment error.

Pin index deployment in configuration/CI and fail visibly when a required index is absent.

## Dependency findings

**Root:**

- `vite` — high, direct; fixed only by an indicated major upgrade;
- `xlsx` — high, direct; no fix available in the current package line;
- `esbuild` — moderate, transitive through Vite.

**Functions:** 13 total findings, including high findings in `brace-expansion`, `fast-xml-parser`, and `js-yaml`; direct `firebase-admin` and `firebase-functions` findings require major upgrades according to npm audit.

Triage exploitability, replace or isolate `xlsx`, and schedule tested major upgrades. Do not rely on audit count alone; pin and review lockfile changes.

## CI/test quality

1. Active CI builds frontend and Functions but does not run Functions tests, Firestore rules tests, frontend tests, lint, accessibility checks, dependency audit policy, or bundle budgets.
2. `timetableConflicts.test.ts` mixes Jest globals with the Node test runner and duplicates helper declarations.
3. Rules tests skip unless an emulator is already configured. CI never starts one.
4. Rules tests do not cover student assessment, fee, nested college, attendance-record identity, notification, or Storage behavior. The “own profile” case does not actually assert reading the provisioned `students.userId` schema.
5. Frontend has no automated tests for any student route or data mapper.

---

# 6. Recommended remediation plan

## Phase 0 — Immediately before any student pilot

1. **Disable/hide Pay Now, official receipts, test start/submission, and the `/student/directory` route** until their server controls exist.
2. Fix Auth UID → student ID resolution using `userId`; make one shared student-session provider the only source of identity.
3. Inventory every collection/path and freeze a canonical schema. Decide which system is authoritative for attendance, fees, grades, schedules, materials, and notifications.
4. Deny students direct writes to all financial, grade, score, counter, enrollment, and answer-key fields.
5. Split question prompt data from server-only answer/rubric data and remove student access to authoring records.
6. Implement and emulator-test explicit rules for every retained student read/write path.
7. Add and deploy Storage rules before accepting files.

## Phase 1 — Restore core academic workflows

1. Server-side assessment enrollment, start, autosave, submit, grade, manual-grade handoff, and result release with transactions/idempotency.
2. Canonical assignment targeting and submission service, including cohort enrollment and file lifecycle.
3. Attendance authorization based on canonical student identity; normalize status policy.
4. Dedicated registrar-owned published-grade records.
5. Server-scoped timetable queries plus daily override/cancellation consistency.
6. One per-recipient notification model with immutable broadcasts and separate read state.
7. Real error states with retry/support details; never represent permission failure as zero/empty.

## Phase 2 — Financial and supporting modules

1. Payment-provider order creation and signed webhook verification, append-only ledger, reconciliation, refunds, and verified receipt endpoint.
2. Real material upload/storage/authoring pipeline with audience/publication fields.
3. Real library persistence and consistent issue/renewal schemas.
4. Real event authoring and transactional per-student registration/capacity handling.
5. Remove unused duplicate APIs and migrate old collections.

## Phase 3 — Quality gate

1. Add frontend unit/integration tests and Playwright student journeys.
2. Run Firebase emulators in CI for Firestore and Storage rule tests.
3. Fix the Node test runner, run all tests in CI, and add lint/type/accessibility gates.
4. Add dependency policy and bundle budgets.
5. Complete localization and accessibility remediation.
6. Add observability: structured error reporting, audit trails, payment/test correlation IDs, and alerts—without logging unnecessary student PII.

---

# 7. Minimum release acceptance criteria

The student portal should not be called production-ready until all of the following are demonstrated in an emulator/staging environment:

- A student created by `bulkCreateStudentAccounts` can log in and load the exact correct profile.
- Cross-student and cross-college profile, attendance, assignment, fee, grade, notification, and result reads are denied.
- A student cannot read answer keys before submission or write any score/grade/counter.
- A student cannot start outside the allowed window, self-enroll, exceed attempt limits, submit twice, or submit another student’s attempt.
- Assignment cohort targeting works; files are owner-scoped; failed submissions leave no orphan objects.
- Permission/index/network errors display as errors, not legitimate zero/empty states.
- Fee status changes only after a verified provider event and repeated webhooks are idempotent.
- Dashboard and detail pages agree on fees, assessments, assignments, notifications, and timetable changes.
- Rules and Storage tests run rather than skip in CI.
- Frontend, Functions build, all tests, lint, accessibility smoke tests, and vulnerability policy pass.
- Keyboard navigation, screen-reader naming, focus behavior, mobile layouts, reduced motion, and supported languages pass defined acceptance tests.

## Final assessment

Vriddhi has a substantial student-facing interface and several good interaction concepts, but the current portal is primarily a **UI prototype over fragmented and incompatible data contracts**. The fastest safe route is not to patch individual empty states or loosen Firestore rules. First establish canonical identity/data schemas and trusted server boundaries, then reconnect each page one workflow at a time with emulator-tested authorization and end-to-end tests.
