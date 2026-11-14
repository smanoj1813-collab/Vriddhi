# Role experience and academic early warnings

## What changed

- The student/landing mint, paper and gold illustration language is shared by faculty/mentor, HOD/department-admin, Principal, accounts, operations, superadmin and employee dashboards. Accounts, operations and platform governance have their own SVG scenes. Existing student scenes, accordion navigation, real metrics and destinations remain.
- Staff navigation and dashboard action icons use finite hover/keyboard-focus greetings. Decorative illustrations stop within five seconds, have unique SVG resource IDs, are hidden from assistive technology and respect `prefers-reduced-motion`. No image requests or animation library was added.
- Students, faculty/mentors, HODs and Principals have a **Risk Alerts** inbox. Faculty/student dashboards and supervisor overviews include a compact entry card. Student phone navigation exposes the inbox in **More → Account**; existing thumb tabs are unchanged.

Automatic checks are now a **monthly review**, not live early-warning monitoring. This is not a final exam-eligibility, compliance, disciplinary or university-policy decision. It does not change attendance, grades, deadlines or academic policies. See the [monthly cost-control revision and rollout](academic-risk-monthly-cost-controls.md) before deploying.

## Evidence and scope

| Check | Authoritative evidence | Important exclusions/coverage limits |
| --- | --- | --- |
| Student attendance | `attendanceRecords`, uniquely linked student, current semester **and batch**, explicitly assigned scheme route | Lifetime `attendanceSummaries` mixes semesters and is deliberately not the denominator here. Deduplicate by class session; unknown/conflicting statuses or missing metadata suppress the percentage conclusion. Present + late + on-duty follow the portal convention. No BCU/75% fallback. |
| Student missed classes | Explicit current-semester records marked `absent`, last 14 days | An unmarked class or a missing register is **not** proof of student absence. Leave/medical leave are not called missed classes. |
| Student assignments | Published/ongoing/closed/graded `assignments`, exact production cohort/specific audience, `submissions` | An empty cohort targets nobody. Submitted/late/graded work satisfies completion; an upload draft cannot erase a completed submission. No missed-submission conclusion after a failed/capped submission read. |
| Student assessments | Targeted published/ongoing/completed `scheduledTests` and `studentAssessments` | Match the production public/college, student-id/uid/regNo, section and cohort semantics. Cancelled tests are excluded. An expired `in_progress` attempt is **needs review**, not an absent student. A paper/assessment template without a delivery window does not prove a missed test. |
| Faculty unmarked registers | Materialized `classSessions` plus approved/legacy-live `weeklySchedules` occurrences, authoritative detailed `attendance` registers | Check after the class ends + buffer; exclude cancelled/rescheduled classes, unpublished proposals, outside-effective-window slots and class-suspending calendar dates. A session's default `attendanceCount: 0` is not a marked register. Virtual timetable occurrences cover registers that have never materialized a session. |
| Faculty self-attendance | Explicit Principal-assigned `riskStaffSchedules`, `staffAttendance`, known effective dates and working weekdays | **No assumed Monday–Saturday working week.** Check last seven days; exclude leave/medical/on-duty/WFH records, explicitly excluded dates and suspending public/college holidays. Exams/study holidays can suspend classes without suspending staff work. Same-day schedules only; overnight shifts are not inferred. |
| Faculty curriculum lag | Active `curriculumFacultyMappings`, readable active/approved `curriculum`, matching faculty/course/topic entries in `facultyTopics` with `plannedDate` and covered/completed states | Only dated topics belonging to the assigned approved syllabus are assessed. Undated/missing plans are coverage warnings, never invented 0% completion. Duplicate pending rows cannot undo covered topics. |
| Faculty assignments | Owned assignments, latest completed submission per student, explicit active roster | Drafts past their deadline; overdue missing-submission follow-up; grading backlog after the **later** of deadline and submission + configured days. No missing-student total without complete roster/submission coverage. |
| Faculty assessments | Owned scheduled tests and latest attempts per student | Closed-window participation follow-up and submitted-but-ungraded backlog. Graded attempts do not remain in backlog. |

All date-only academic deadlines end at **23:59:59.999 IST**. Explicit instants must include a timezone. Unknown/invalid dates are not guessed, including impossible ISO dates that JavaScript would otherwise roll into another day.

### Existing lifecycle integration reviewed

The existing five-minute `studentAssessments` expiry job finalizes disconnected `in_progress` attempts into `submitted` (manual grading still required) or `graded` (objective-only), and marks ended published/ongoing tests `completed`. Risk checks consume those existing states; they do not submit, grade or finalize attempts themselves. A transient expired `in_progress` state stays explicitly **needs review** until the existing job or faculty corrects it.

The existing class-session completion callable writes session `topicIds`/`topicsCovered` and additively updates the faculty ledger to `covered`, including `sessionId`/`dateCovered` traceability for newly created rows. Risk checks use that ledger plus the approved curriculum and dated faculty plan. They do **not** assume a timetable entry proves delivery. A covered row without a planned date cannot establish a time-based curriculum lag percentage.

### Escalation and authorization

Every faculty issue is materialized for:

1. the faculty member;
2. verified HOD/department-admin recipients whose department matches the faculty's management-owned department/branches;
3. verified Principals in the same college.

Student alerts remain self-only. Accounts, operations, employees and platform dashboards do not acquire academic-risk access merely because they received illustrations.

Current **Firebase Auth claims**, not request payloads or editable `users.role`/`users.department`, decide role and tenant. Faculty profile IDs and auth UIDs are reconciled through same-college, management-owned profiles. HOD authority requires a usable verified department claim; absent metadata never becomes a broadcast to every HOD. Missing HOD/Principal links are coverage warnings.

Inbox reads, acknowledgements and push sends recheck recipient ownership, current role/college and current subject department. Demotion, reassignment, disabled accounts and college moves therefore remove access to old copies without waiting for a client ID-token refresh. All new risk/settings/device/outbox/audit collections deny direct client reads and writes; only authenticated callables and Admin-SDK jobs access them.

### States and deduplication

- **Active:** supported by the completed check.
- **Unverified / recheck needed:** a previously known issue could not be re-evaluated because evidence/configuration is incomplete or checks are paused. Not a confirmed current issue and **not** a resolution.
- **Resolved:** a complete recheck no longer finds the issue.
- **Archived:** a time-bounded observation aged outside its window, not evidence it was fixed.
- **Coverage warnings:** displayed separately; never pushed as confirmed academic risk.

Alert IDs are deterministic over college + subject + recipient + finding key. A read acknowledgement does not resolve the underlying issue. A transactional outbox opens a new push generation only for first opening/reopening or severity escalation, not every sweep or count change. Subject leases prevent a simultaneous self-service and background check from overwriting one another.

## Principal configuration

Open **Principal → Risk Alerts → Warning settings**.

| Setting | Initial operational value | Allowed |
| --- | --- | --- |
| Attendance warning buffer | 5 percentage points above assigned minimum | 0–25 |
| Upcoming deadline warning | 48 hours | 1–168 |
| Unmarked class register buffer | 2 hours after class end | 0–48 |
| Staff check-in/out buffer | 30 minutes | 0–240 |
| Curriculum delay tolerance | 7 days | 0–60 |
| Curriculum lag buffer | 10% of past-due dated topics | 0–100 |
| Grading backlog deadline | 7 days | 1–60 |

These are **operational warning defaults**, not default academic regulations. The attendance minimum always comes from the linked student's explicitly assigned academic scheme. Settings are validated server-side, revision-checked and audited. The Principal can pause checks; pausing never marks old issues resolved.

Staff check-in/out monitoring additionally requires choosing a verified faculty member, explicit working weekdays, same-day check-in/out times, an effective start date and optional end/excluded dates. Removing a schedule pauses coverage instead of silently claiming earlier attendance issues were fixed.

## Background checking and bounded reads

**Cost-control revision: automatic checking is a monthly snapshot, not continuous early-warning monitoring.** `sweepAcademicRiskAlerts` now starts one cycle on the **1st of each month at 03:00 IST** (`0 3 1 * *`, `asia-south1`). A persisted IST-month guard prevents scheduler retries or leftover 15-minute deliveries from starting another cycle in the same month. The starter only creates a server-owned `riskSweepRequests` document; it does not scan academic evidence.

`continueAcademicRiskSweep` handles create-triggered continuations only while that cycle has remaining work. It discovers student/faculty/mentor accounts in deterministic pages of 25, validates Auth, and checks at most three subjects concurrently. Each chunk stops between completed pages after seven minutes or 1,000 **discovered** accounts (including orphan/invalid hints), checkpoints its cursor, and atomically queues the next chunk. Large rosters therefore finish within the same monthly cycle rather than waiting a month after the first 1,000 accounts. Leases serialize chunks; completed deliveries are idempotent; claimed chunk attempts are capped at three, with at most 200 chunks per month. Failure budgets stop visibly instead of triggering unbounded scans. Inspect `riskJobs/academic-sweep` and `riskSweepRequests` for period, cursor, counts, status, errors and completion; discovery completion is not an academic “all clear.”

Unchanged findings and unchanged unverified states no longer rewrite alert copies just to advance timestamps. `riskSubjectRuns` stores check freshness once per subject; authorized inbox responses derive current check times from those runs. Read acknowledgements and their timestamps are preserved. The inbox has **no interval/focus/reconnect polling**: it loads on entry, explicit refresh, successful user actions, or a real foreground push. Students/faculty can still request **Check my records now** once every two minutes. Monthly checks can miss intervening attendance/deadline changes; the UI explicitly states that it is not live monitoring. Inbox refresh only reloads saved results.

See [monthly cost controls and safe rollout](academic-risk-monthly-cost-controls.md), especially the deployment ordering and the fact that a Hosting-only deploy does not stop an already-deployed 15-minute scheduler.

Caps are explicit, checked with `limit + 1` and reported as incomplete coverage:

- College: 1,500 assignment catalogue rows, 1,000 scheduled tests, 5,000 students, 1,000 calendar events, 200 discovered supervisors.
- Student: 5,000 attendance records, 2,000 submissions, 2,000 attempts.
- Faculty: last 30 days of classes/registers (1,000 each), 200 timetable slots, last seven days of staff attendance (50), 1,500 ledger topics, 100 mappings, up to 5,000 related submissions/attempts.
- Inbox: latest 300 recipient entries, explicitly marked if truncated. Previous active/unverified history is bounded at 3,000 rows per subject before requiring maintenance. Configuration directory lists up to 500 staff/schedules.

A capped or failed source cannot produce a missing-evidence risk or falsely resolve an earlier finding. Do not simply raise caps indefinitely for a large institution: move discovery/catalogues to indexed active-term queries/partitioned jobs, keep completeness markers, and monitor Firestore read cost and sweep cycle times. Accounts without a canonical `users` discovery document can still self-check, but should have their provisioning linkage repaired to participate in scheduled scans.

## Opt-in web push

Push is implemented, but **no deployment, browser opt-in or live FCM delivery is implied by this change**.

1. In the existing `vriddhi-academic` Firebase project's Cloud Messaging settings, make sure the Web Push certificate/public VAPID key is available and the FCM registration/delivery APIs are enabled.
2. Put the **public** key in the frontend build environment as `VITE_FIREBASE_VAPID_KEY`. It is not a service-account key or a secret. Existing Firebase app config must include the project's `messagingSenderId`.
3. Build/serve over HTTPS with the updated PWA worker. `risk-push-sw.js` is imported by the **existing Workbox `/sw.js`**, not registered as a competing root worker. Existing install/update prompts and caches remain intact. Development Vite does not register the production worker, so push is intentionally unavailable there.
4. Each eligible user chooses **Enable push** in Risk Alerts on each supported browser/device. Permission is requested only from this explicit action. Installed iOS/iPadOS PWAs require a supported OS/browser and Home Screen installation; unsupported or denied browsers keep the portal inbox.
5. Validate on real opted-in faculty, HOD, Principal and student devices after deployment: foreground inbox refresh, background notice/click, denied permission, logout/shared-browser account switch, corrected records and HOD department reassignment.

`riskPushDevices` is server-only, token-hashed, owner-bound and bounded to ten devices per account. Re-registering a shared-browser token replaces the previous binding, and one user cannot unregister another user's token. Unused devices older than 90 days are not used for sends; invalid/unregistered tokens are removed when FCM reports them. Plan retention/cleanup of old alert, device and audit records under the institution's policy.

Delivery revalidates current recipient/subject scope and active alert generation. Outbox sends are leased and transient failures use the create trigger's retries (at most eight claimed send attempts/24 hours). The recovery scheduler now runs **monthly at 06:00 IST on the 1st**, not every 15 minutes; it queries only pending messages created within the delivery window so expired backlog cannot crowd out fresh messages. Recovery remains bounded to 100 messages and best-effort; old outbox retention is an operator task. On-demand checks still create their own immediate push events, but no permanent recovery poller is kept alive for them. Web Push TTL is 15 minutes. Delivery is best-effort/at-least-once: a stable browser notification tag replaces a retry of the same alert rather than stacking duplicates; it is not an exactly-once guarantee.

FCM messages contain only routing/account identifiers, **not faculty/student names, marks, attendance percentages or issue text**. The worker checks a persisted active-account + explicit-enrollment binding before showing a generic private-inbox reminder. Sign-out/account switching clears the binding and closes old notices locally even if server token cleanup is offline. Foreground messages invalidate the signed-in inbox cache. Notification clicks only open the same-origin role inbox.

## Rollout checklist (only after review/merge and an explicit deploy request)

1. In the normal deployment checkout, **pull merged `main` first**; do not deploy a stale checkout. Keep this Arena working branch unchanged during implementation.
2. Install locked root and Functions dependencies, run tests, build root and Functions with the public VAPID setting if push is wanted.
3. Deploy the checked-in Firestore indexes and wait for them to be ready, then follow the [monthly revision's safe rollout order](academic-risk-monthly-cost-controls.md#safe-rollout--only-after-approval): pause legacy 15-minute jobs, wait for active work, deploy the continuation trigger **before** its starter, then the changed Functions, rules and Hosting to `vriddhi-academic`. New compound risk queries need the included indexes. A missing index is surfaced as coverage failure, not an empty successful check.
4. Have the Principal review warning defaults, explicit working schedules, existing assigned academic packs and faculty/HOD/Principal provisioning links. Run self-service checks on sample real accounts before relying on the monthly review.
5. Check `riskJobs`, `riskSubjectRuns`, coverage warnings, Functions logs and outbox delivery state. Perform the real-device acceptance cases above. No data migration, default university activation, production configuration or deployment was executed here.

## Validation commands

```sh
npm run test:unit
npm --prefix functions run test:unit
npm --prefix functions run test:risk
npm run test:render
npm run test:render:academic
npm run check:dead-code
npm run build
npm --prefix functions run build
```

New coverage includes pure decisions, actual callable handlers against an atomic in-memory SDK boundary (including reads-before-writes, auth/tenant/department boundaries, outbox/device ownership, deduplication, incomplete rechecks and 805-row reconciliation), the actual push client with held/released SDK calls, the actual worker in an isolated IDB/event boundary, role dashboards/shared shell and real inbox/configuration renders. Tenant + faculty schedule IDs are hashed structured tuples, avoiding delimiter collisions; both stored faculty and college links are rechecked when loading a schedule.

Ten new collection-boundary cases were also added to `functions/test/firestore.rules.test.ts` for anonymous, student, faculty, HOD, department-admin, Principal and superadmin direct get/list/create/update/delete denials. Those emulator tests were **not run in this sandbox**, which has no Java runtime. They are part of the existing blocking Java-enabled CI rules suite.

### Local acceptance — 13 November 2026

| Validation | Result |
| --- | --- |
| Complete frontend unit suite | **800 passed**, 135 suites |
| Complete Functions unit suite | **1,493 passed**, 326 suites (includes **126** risk decision/persistence tests) |
| Actual worker VM privacy/routing suite | **15 passed** (included in the frontend total) |
| Actual push-client account-switch/permission suite | **9 passed** (included in the frontend total) |
| Main, student UI and role/risk render suites | **391 + 33 + 66 passed**, no mount crashes |
| Academic / course / previous-year-paper render suites | **52 / 351 / 27 passed** |
| Sample-data Chromium role/inbox checks | **85 passed**: ten roles at 1,440px and 390px, real dashboards/shells/inbox/settings, keyboard activation, reduced motion and no horizontal overflow |
| Scoped axe checks | No violations in changed faculty/student/Principal inbox content and Principal settings in light mode; Principal inbox/settings in dark mode. **Not** whole-app accessibility certification. |
| Production Workbox build in Chromium | **10 integration checks passed**, using the actual root worker, real IndexedDB/message acknowledgements and CDP-simulated PushEvents/account-switch inbox invalidation; **not live FCM** |
| TypeScript + frontend / Functions production builds | Passed. Frontend retains large-chunk and the existing Workbox unmatched-glob warnings. |
| Course pack validation / dead-code scan / diff whitespace | Passed; no new dependencies or generated build artifacts added to Git |

**Still outside acceptance:** the serverless Chromium's native notification API reports permission denied even after a test permission override (while its Permissions API says granted). Visible OS notification display and click acceptance were therefore **skipped**, not counted as delivered. The actual worker VM tests exercise display/click logic, but physical opted-in devices, production FCM/VAPID, deployed Auth, Firestore indexes/rules and live institution data still need the rollout checks above. No deployment, real-device notification or Firestore emulator run took place.

Local-only logs, browser scripts and screenshots are under ignored `artifacts/role-risk-validation/`. The live preview uses sample Auth/Firestore/callable transports with the real UI and is deliberately labelled **SAMPLE DATA**. It is not production or institutional-data acceptance.
