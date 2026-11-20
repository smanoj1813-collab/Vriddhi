# Safe Firestore cost controls

This implementation reduces duplicate reads and semantically unchanged writes. It does **not** remove assessment availability refresh, live reports, expired-attempt recovery, attendance summaries/repair, Journey, platform statistics, exact AI telemetry, backups or email delivery. Automatic expired-test completion and automatic risk reviews are now explicit staff actions, described below.

These are repository changes, **not a production deployment**. Source examples below are conditional workload models, not measured production usage or promised bill savings.

## What changed

### Student assessment refresh

`useStudentData` now exposes a stable, tests-only `refreshTests()` alongside the existing full refresh. The assessment page retains its 30-second cadence while tests are upcoming/active, but no longer reloads profile, fees, assignments, timetable, attendance or announcements on that timer. Dashboard assessment cards and counts update with the test list.

A shared visible-polling utility stops hidden-tab work, checks initial visibility, prevents overlapping requests, cleans up on unmount, and revalidates on returning to the tab. Errors retain the last good data with a warning. Targeted results from an old account/college cannot overwrite the current account's cards. The ordinary full-portal refresh remains available.

### Staff live reports

The live window still polls every 30 seconds. Hidden/cancelled/completed reports stop polling; a local clock starts/stops polling at the actual test window without a database request just to advance time.

New clients can send an opaque revision from their last full response. After validating the current staff account and college, the callable probes the test and the most recently updated attempt. The probe includes attempt update metadata, so autosaved `timeSpent` or grading changes cannot be missed merely because a test counter stayed unchanged. A matching revision returns an unchanged acknowledgement rather than another 500-attempt download.

- Existing/cached clients that send no revision still receive the full original schema.
- Reports with missing/string legacy attempt update metadata keep the original full-read path, so mixed timestamp ordering cannot hide autosaves.
- Revision reuse expires after five minutes; opening the report again forces a full load. This is a backstop for legacy records lacking canonical update metadata, unusual administrative edits or rollout timing.
- A missing/building change-probe index falls back to a full response, not an error or fake empty report.
- Meaningful changes invalidate immediately at the next normal poll.
- Legacy counter repair now recounts and sets inside a transaction. Concurrent initial report opens cannot double-increment a missing counter.

**Illustration:** for an unchanged report with 500 attempts, the normal poll changes from roughly 502 document reads to 3 (staff, test, latest attempt), between mandatory full refreshes. A changing report still incurs its necessary detail reads. A cold/full request has one extra probe read. This is not a claim of zero read cost or complete pagination beyond the existing 500-row limit.

### Attendance saves and summary triggers

For an existing same-id register with at most 450 students, the client transaction reads the current register, session, class summary and reporting rows, then writes only meaningful differences. It compares fresh server data—not the page's potentially stale copy. Notes, status, subject/date, cohort, student/display fields and counts are preserved. Unrelated metadata is not overwritten. Unchanged saves do not advance audit timestamps simply to create another event.

- All transaction reads precede writes. SDK transaction retries recompute the delta against fresh state.
- Missing or drifted reporting rows/headers are repaired, even when the parent register already matches.
- First-time, legacy/different-id and larger registers retain the original chunked full-upsert path.
- If deployed rules permit the old writes but not the optimization's document reads, a permission-denied read falls back to the original full save. Rules are **not** widened. Other errors surface for retry rather than being silently treated as success.
- Existing claim-repair and one-retry behavior remains.

**Illustration:** a 50-student no-change re-save can now do zero writes, after about 53 direct document reads, instead of 53 client writes plus 50 summary-trigger writes/reads. Changing one student's status/notes writes the three authoritative documents and that student's reporting row; its summary trigger adds one further write. These counts exclude rule-dependent reads, retries and virtual-session materialization. The first save's normal writes are intentionally retained.

The summary trigger also ignores raw-record changes that cannot affect any count, identity or recent-row field. Meaningful notes, check-in/marked timestamps, date/subject, college/student linkage, creates and deletes are **not** suppressed.

### Exam recovery (manual status, automatic attempt recovery)

The five-minute `autoSubmitExpiredStudentTests` job now does **only** attempt recovery. It queries `studentAssessments` with `(status == in_progress, autoSubmitAt <= now)` and the legacy `(status == in_progress, endsAt <= now)` pass, finalizes expired attempts and nothing else. It no longer queries or writes `scheduledTests` at all, so an idle tick is **two minimum-charge queries with zero document reads and zero writes** (down from four queries apiece and \(up to\) two status writes). At 288 ticks/day that removes every scheduled-test read the old idle sweep performed.

The persisted test lifecycle is now changed only by an explicit staff action:

- `listManagedAssessmentTests` still derives the **displayed** status from the clock, and additionally returns `storedStatus` so the UI can tell a genuinely persisted `completed` row from one that merely looks ended.
- `refreshAssessmentTestStatus(testId)` runs in a transaction and sets `completed` **only** when the stored status is `published`/`ongoing` and the end instant has passed. It is idempotent (`changed: false` for already-completed, still-running, or cancelled rows), rejects cross-college and non-owning-Faculty requests without revealing the row, and is limited to same-college Principals and the owning Faculty.
- The exam manager shows a "Refresh status" button only for an ended test whose `storedStatus` is still `published`/`ongoing`, for exactly those callers. It costs one transactional read plus one write per click, and is never fired automatically by rendering, polling or the scheduler.

Retained: canonical-timestamp and legacy-string due-time handling for **attempts**, the `(studentAssessments: status, autoSubmitAt)` and `(status, endsAt)` indexes, per-invocation question memoization, and every finalization/cancellation/idempotency guard. A cancelled test is never reopened by a refresh.

**Illustration:** 100 future tests with canonical timestamp dates no longer have to be downloaded 288 times/day. When 100 expired attempts share a 100-question paper, question-document reads can fall from 10,000 to 100 in that invocation. Actual attempts and finalization writes still cost operations. The trade-off is deliberate: a college that never presses "Refresh status" keeps `published`/`ongoing` on an ended row even though the UI shows it completed until someone refreshes it.

### Shared health queries

History and performance now share one query key and one canonical performance polling timer. Health overview reuses the same React Query metrics/errors/slow-query requests and fresh cache entries instead of independently downloading the same collections. Individual panels and the overview still receive their data; their actions and error handling remain.

### Journey cohort standing

Only shared college ranking evidence is coalesced in a bounded, server-process-local cache: 90-second maximum reuse, up to eight college entries, tenant-scoped keys, single-flight loads and failed-read eviction. There is no new Firestore cache write or background sweep. A cold instance uses the original source queries.

Identity, personal attendance, own grades/attempts and academic-policy resolution remain normal authoritative reads. A manual Journey refresh requests fresh cohort evidence too. The UI displays the standing snapshot time; completeness caps and null/incomplete standing semantics remain. Peer grade documents never go to the student's browser. This optimization benefits repeated requests to a warm instance; it is not a guaranteed cross-instance cache hit rate.

### Course progress

The existing transaction still unions cross-device progress. Before setting, it compares the entire cleaned, derived record with cloud state. Loading identical saved progress no longer writes it straight back. Manifest/version changes, completion, quiz results, metadata and work from another device are not discarded. The initial transactional read is retained.

### Platform stats and attendance reconciliation

The platform stats job remains every 15 minutes. An unchanged snapshot skips its write, with a mandatory heartbeat at 30 minutes—well within the existing one-hour client freshness limit. Changed counts, top-college data or AI metrics write immediately. This adds one snapshot-read transaction per tick in exchange for suppressing redundant writes; it avoids making clients fall back to expensive live counts when nothing changed. Aggregations still cost reads proportional to their indexed work.

Nightly attendance reconciliation keeps its 200-summary limit and count/repair behavior, but uses a durable rotating document-id cursor rather than checking the same first 200 every night. A small checkpoint read/write buys correct roster coverage; this is a correctness fix, not a claim that the nightly job is free. Rebuilds still run only on detected total-count drift. This is not a complete same-total status-drift detector.

## Risk reviews: requested manually, bounded per college per day

Automatic risk reviews are retired. `sweepAcademicRiskAlerts` remains deployed only as a **no-op rollout target** (`0 3 * * *`, Asia/Kolkata) so an old scheduler trigger cannot keep queueing work; it performs no reads and no writes. `refreshMyAcademicRiskAlerts` stays a deny-only compatibility endpoint. Push delivery recovery (`retryAcademicRiskPush`, **06:00 IST daily**) is independent and unchanged.

Who can request what:

| Caller | Scope | Effect |
| --- | --- | --- |
| Faculty (verified claim) | `self` | Checks that Faculty member's own teaching records only. |
| Principal (verified claim) | `college` | Checks the college's `student`/`faculty`/`mentor` accounts only. |
| Student, HOD, admin, mentor, employee | — | No request control; they still receive alerts addressed to them. |

Guards, all enforced server-side in `requestAcademicRiskReview` → `queueManualRiskSweep`:

- One request **per scope per IST day**. A repeat click returns `{ accepted: false, reason: 'already-requested' }` and performs no scan.
- A single `riskJobs/manual_<collegeHash>` document serializes overlapping reviews. A live review (lease, or a `running` job inside its 24-hour window) rejects a second request with `resource-exhausted` instead of starting a parallel scan.
- Only a **live** legacy scheduled lease blocks a manual request (`failed-precondition`). Rollout leftovers — a `running` legacy checkpoint with no live lease — are drained by their own create trigger and must never permanently disable manual reviews.
- The worker re-verifies the requesting account against Auth claims (`college`, role, scope) before touching the roster, and fails the job as `requester-unauthorized` otherwise.
- Discovery is a bounded page of 25 `users` documents (`role in [student, faculty, mentor]`, `collegeId ==`, ordered by document id), 1,000 discovered accounts and seven minutes per chunk, three claimed attempts, and 200 chunks per review (`failed` with `review-chunk-budget` rather than an endless loop). A review older than 24 hours fails as `review-expired`.
- `queueManualRiskSweep` throws `failed-precondition` only for a live lease; a self review reads no roster at all (it audits the one requesting account).

The durable chunk lease continues to fence every publishing transaction (`refreshRiskSubject(person, college, assertReviewLease)`), so an expired worker cannot publish alerts, push outbox rows or freshness records under a stale lease. Per-subject lock documents are still gone: one lock write, one lock delete and a net lock read are avoided per reviewed account.

Already-created **scheduled** requests (`daily_<date>__n`, `weekly_<date>__n`, `monthly_<month>__n` and legacy `<month>__n`) are still understood by `continueAcademicRiskSweep` during rollout so in-flight work drains; the starter never creates new ones. Inbox reads return `manualReviewScope` (who may request and at which scope), `manualReview` (the latest status), and the legacy `canRefresh: false` so cached clients hide their old button.

The UI mirrors this exactly: Faculty see **Check my risk status**, Principals see **Request college risk review**, and the status line distinguishes `running`, `complete` (with incomplete-check counts) and `failed`. "Refresh inbox" only reloads saved results. These remain on-demand snapshots, not live eligibility/compliance guarantees, and saving settings _never_ starts a check.

### Indexes

`firestore.indexes.json` now carries the manual discovery index — `users (role ASC, collegeId ASC, __name__ ASC)` — because the college review filters an `in` role list, pins `collegeId` and orders by document id. The stale `scheduledTests (status, endDateTime)` composite is removed along with the query that needed it; nothing queries tests by status any more. Deploy indexes **before** the Functions that use them.

## Intentionally retained costs

- Exact AI-cache usage counters still write on hits/misses. Silently sampling or dropping these would change the metrics feature. No unreliable per-instance accounting was introduced.
- Subscription renewal selection still supports the existing date representations. A server-only date-range conversion needs verified/migrated production date formats before safely excluding legacy documents.
- Upload cleanup, email delivery, model canaries and configured managed backups are retained.
- No record history was deleted, no privacy boundary was loosened, and no production data migration/scan was initiated.

## Safe rollout — only after approval

1. Run the current frontend/Functions unit, render and build checks. CI also runs security rules and browser smoke tests. Do not equate source tests with production billing attribution.
2. Deploy the index changes with `npm run deploy:indexes`; wait for readiness. Added: `(users: role ASC, collegeId ASC, __name__ ASC)` for manual college reviews. Removed: `(scheduledTests: status ASC, endDateTime ASC)`, which nothing queries now. `(studentAssessments: testId ASC, updatedAt DESC)` and the two attempt-recovery indexes are unchanged. `deploy:all` includes Firestore indexes so a full release cannot silently omit them.
3. Deploy the updated Functions **first**, then open access: `requestAcademicRiskReview`, `continueAcademicRiskSweep`, `refreshAssessmentTestStatus`, the deny-only `refreshMyAcademicRiskAlerts`, the no-op `sweepAcademicRiskAlerts`, and the attempt-recovery-only `autoSubmitExpiredStudentTests`. Deploy the branch's security rules and Hosting with the current build. Older clients keep the compatible full-response/full-save paths during the rolling update; their cached `canRefresh` is ignored.
4. Pause the deployed legacy `sweepAcademicRiskAlerts` scheduler once the no-op revision is healthy — it queues nothing, but there is no reason to invoke it. Do not delete `riskJobs`, `riskSweepRequests` or alert rows: already-queued scheduled requests drain on their own trigger.
5. Deploy the push recovery, assessment report, Journey, stats and attendance Functions. Deploy the branch's security rules and Hosting with the current build.
6. Verify the actual Scheduler definitions and timezone: no-op risk starter, daily bounded push recovery, five-minute attempt recovery (no `scheduledTests` access), 15-minute stats and nightly repair. Ensure no duplicate legacy frequent risk jobs remain.
7. Check representative authorized accounts: assessment availability, hidden/visible report behavior, submissions and grading, one ended test whose stored status is refreshed by the owning Faculty and rejected for a colleague, a Faculty self review and a Principal college review (including the same-day duplicate and the running-review rejection), first/unchanged/corrected/large attendance saves, Journey refresh/standing privacy, course union, settings, inbox acknowledgement and optional push. Do not use a manual whole-roster risk scan as a smoke test.
8. Compare actual operation counts and invocation/duration metrics under a comparable workload, including fallback warnings. No percentage bill reduction is promised without that measurement.

A frontend-only deployment does not update schedulers or server query behavior. Do not remove protective jobs or delete the new indexes during rollback; the original compatibility paths remain available, and existing data/queue state should be preserved.

## Follow-up: retired callable startup memory

Operator-provided rollout logs showed `refreshMyAcademicRiskAlerts` exceeding its **128 MiB** startup limit with **129 MiB** used, before the HTTP startup probe could succeed. The older 512 MiB revision had started successfully. This was a startup out-of-memory failure, not evidence of a bad port or a request timeout.

The compatibility callable now inherits the shared **512 MiB** allocation. It retains its **10-second timeout**, **two-instance limit**, and deny-only behavior before Admin Auth/Firestore work. No scanner, scheduled review, query, write, or permission is added. Its rejection message now points to the manual review request (`Request risk review in the current portal`) instead of promising a server schedule. Its 512 MiB / 10-second / two-instance configuration is unchanged.

Validation for this correction:

- A deployment-metadata regression test failed against the 128 MiB configuration and passes with 512 MiB, while checking the region, timeout and instance limit.
- **1,571 / 1,571 Functions unit tests passed**, including anonymous denial and all ten client roles being denied without Admin Auth lookups, Firestore reads/writes, push messages or queued work.
- The Functions TypeScript build passed. A local smoke test loaded the full compiled shared entry point, bound an HTTP listener, returned the expected anonymous callable rejection, and checked the authenticated deny-only handler and deployment metadata.
- The local smoke test does **not** emulate a Cloud Run memory limit. A successful deployed revision and startup probe remain required; there is no claim of live deployment acceptance here.

After pulling the approved fix into the deployment checkout, retry **only** the failed Function first:

```powershell
firebase deploy --only "functions:refreshMyAcademicRiskAlerts" --project vriddhi-academic
```

Do not assume a failed update installed the manual-scan block: an older revision may still be serving. Verify a successful update/healthy revision without invoking the old scanner as a test. The two inbox Functions that already updated successfully need not be redeployed for this correction. Continue the staged rollout above only after this update succeeds; do not change the port, weaken the denial, delete the Function, or merely raise the startup timeout to mask the memory failure.

## Initial optimization validation — 13 November 2026

| Check | Result |
| --- | --- |
| Frontend units | 834 / 834 passed |
| Functions units | 1,570 / 1,570 passed |
| Focused backend cost regressions (included in Functions units) | 28 / 28 passed |
| Main render suite | 391 general + 33 student + 80 role/risk + 42 faculty + 34 cost checks passed (580 total) |
| Additional course / academic / PYQ renders | 586 / 586; 52 / 52; 27 / 27 passed |
| Frontend production build / Functions build | Passed, including TypeScript |
| Dead-code check / course validation / browser-test typecheck | Passed |
| Local rules emulator | Blocked before tests: Java is not installed (`Could not spawn java -version`) |

The production frontend build still reports large-chunk and Workbox glob warnings; they are not build failures. Local transport models are not an emulator or a deployed concurrency/billing test. The repository's Java-enabled, blocking CI rules suite and browser checks remain required release gates. No Firebase deployment, production configuration change, data migration or deletion was performed.

## Reproducible checks

- `npm run test:unit`
- `npm --prefix functions run test:unit`
- `npm --prefix functions run test:cost`
- `npm run test:render` (includes `test:render:cost`)
- `npm run test:render:courses && npm run test:render:academic && npm run test:render:pyq`
- `npm run check:dead-code && npm run validate:courses`
- `npm run build && npm --prefix functions run build`
- `npm run test:rules` / CI's Java-enabled emulators

The new SDK-boundary tests count real handler/API read/write intentions and test concurrent repair, cancellation, shared questions, fresh attendance deltas, no-op progress, account changes, cache tenancy/freshness, shared health loads, manual risk request/queue/worker limits (daily scope, duplicates, concurrent rejection, requester re-verification, expiry and chunk budgets, legacy scheduled drain) and the manual test-status refresh (owner/college scope, idempotency, cancelled tests). They do not claim to model billable rule/index work, network costs, or deployed activity.

For the four-day usage investigation and follow-up scheduler optimizations, see [Firestore usage diagnosis](firestore-usage-diagnosis.md).
