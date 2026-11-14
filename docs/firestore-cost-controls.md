# Safe Firestore cost controls

This implementation reduces duplicate reads and semantically unchanged writes. It does **not** remove assessment availability refresh, live reports, exam recovery, attendance summaries/repair, Journey, platform statistics, exact AI telemetry, backups or email delivery.

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

### Exam recovery

The five-minute `autoSubmitExpiredStudentTests` safety job is retained. Ended-test queries now filter due time in Firestore instead of downloading future tests and discarding them in JavaScript.

- Canonical Firestore timestamps use the due-time range. A bounded string-only legacy pass still parses the actual instant in JavaScript; a lexical UTC comparison would incorrectly delay timezone-offset strings. Future legacy strings may therefore still be read, intentionally.
- The `(status, endDateTime)` index is checked in. Until ready, a precondition/index failure uses the original compatible status-query fallback.
- Other query failures surface; they are not disguised as a successful empty result.
- Per-invocation promise memoization loads a test's frozen question documents once for concurrent expired attempts from that test. It does not create paid cache documents or retain answer keys across requests.
- Final attempt/test transaction checks, cancellation handling, idempotency, penalties, grading and attempt limits remain in place.
- The legacy attempt query is intentionally retained: dropping it without migrating old `autoSubmitAt`-less attempts would strand legitimate work.

**Illustration:** 100 future tests with canonical timestamp dates no longer have to be downloaded 288 times/day once the due-time index is ready. The empty-query minimums still exist; the separate legacy-string pass adds fixed query overhead and any returned legacy documents. When 100 expired attempts share a 100-question paper, question-document reads can fall from 10,000 to 100 in that invocation. Actual attempts, test checks and finalization writes still cost operations.

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

## Risk reviews: not fixed to monthly

The prior monthly-only policy is superseded. `ACADEMIC_RISK_REVIEW_CADENCE` is an **operator deployment setting**, not a college scan button:

| Value | Review schedule (Asia/Kolkata) |
| --- | --- |
| `daily` — default | Every day 03:00 IST (`0 3 * * *`) |
| `weekly` | Monday 03:00 IST (`0 3 * * 1`) |
| `monthly` | 1st 03:00 IST (`0 3 1 * *`) |

Daily is the default because the existing initial “due soon” warning window is 48 hours: weekly reviews can entirely skip that advance-warning window. One bounded daily cycle replaces continuous rescans without enforcing the earlier monthly-only restriction. Weekly/monthly settings are explicit reduced-freshness choices for operators, not automatic cost “savings” that preserve timely deadline warnings. Even daily reviews are snapshots, may miss newly published/short-window deadlines, and are not a substitute for source records or exam timers. Changing this environment setting requires deploying the scheduler and handler definitions together; it is not an instant live configuration toggle. Invalid settings fail validation rather than unexpectedly selecting a high-frequency schedule.

The starter only queues work. Durable cadence/IST-period request IDs, duplicate guards, page checkpoints, 1,000 discovered accounts/seven minutes per chunk, three claimed attempts and 200 chunks per review remain bounded. Already-created legacy monthly requests are understood by the continuation worker during rollout. Pending current-period pages block a cadence change from overwriting their checkpoint, even between leases; completed legacy monthly guards remain valid in the new representation, and switching away/back cannot reset the same-period request budget. Scope/Auth checks, incomplete evidence, acknowledgements and no-op alert-write suppression are preserved.

Push recovery now runs **daily at 06:00 IST**, independently of full reviews. It still queries at most 100 fresh pending messages and retains attempt/time limits. This modest recovery overhead improves delivery reliability without rescanning academic records. Normal edits do not create a per-attendance risk-trigger storm.

Inbox refresh, acknowledgements, push enrollment and Principal configuration saves remain saved-data/configuration operations, never scans. The previously retired manual endpoint stays deny-only; this does not remove any additional feature in this revision. The UI describes the actual backend-supplied cadence, or a generic deployed schedule when talking to an older backend. These remain scheduled snapshots, not live eligibility/compliance guarantees.

## Intentionally retained costs

- Exact AI-cache usage counters still write on hits/misses. Silently sampling or dropping these would change the metrics feature. No unreliable per-instance accounting was introduced.
- Subscription renewal selection still supports the existing date representations. A server-only date-range conversion needs verified/migrated production date formats before safely excluding legacy documents.
- Upload cleanup, email delivery, model canaries and configured managed backups are retained.
- No record history was deleted, no privacy boundary was loosened, and no production data migration/scan was initiated.

## Safe rollout — only after approval

1. Run the current frontend/Functions unit, render and build checks. CI also runs security rules and browser smoke tests. Do not equate source tests with production billing attribution.
2. Deploy the two added indexes with `npm run deploy:indexes`; wait for readiness. They are `(scheduledTests: status ASC, endDateTime ASC)` and `(studentAssessments: testId ASC, updatedAt DESC)`. `deploy:all` now includes Firestore indexes so a normal full release cannot silently omit them. Fallbacks preserve functionality while indexes build, but the expected query savings depend on readiness.
3. Review the actual deployed legacy risk schedulers; pause frequent legacy deliveries and wait for active leases/work to settle. Choose `ACADEMIC_RISK_REVIEW_CADENCE` in the Functions deployment environment (default daily). Do not delete checkpoints, queue rows or alerts to try to force a new review.
4. Deploy the deny-only `refreshMyAcademicRiskAlerts` replacement and saved inbox handlers, and install/update `continueAcademicRiskSweep` **before** the starter can create new requests. Drain already-created current-period work before changing cadence where applicable.
5. Deploy the updated starter/push recovery, assessment report/recovery, Journey, stats and attendance Functions. Deploy the branch's security rules and Hosting with the current build. Older clients and older servers keep compatible full-response/full-save paths during the rolling update.
6. Verify the actual Scheduler definitions and timezone: selected review schedule, daily bounded push recovery, five-minute exam recovery, 15-minute stats and nightly repair. Ensure no duplicate legacy frequent risk jobs remain.
7. Check representative authorized accounts: assessment availability, hidden/visible report behavior, submissions and grading, first/unchanged/corrected/large attendance saves, Journey refresh/standing privacy, course union, settings, inbox acknowledgement and optional push. Do not use a manual whole-roster risk scan as a smoke test.
8. Compare actual operation counts and invocation/duration metrics under a comparable workload, including fallback warnings. No percentage bill reduction is promised without that measurement.

A frontend-only deployment does not update schedulers or server query behavior. Do not remove protective jobs or delete the new indexes during rollback; the original compatibility paths remain available, and existing data/queue state should be preserved.

## Local validation — 13 November 2026

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

The new SDK-boundary tests count real handler/API read/write intentions and test missing-index fallback, concurrent repair, cancellation, shared questions, fresh attendance deltas, no-op progress, account changes, cache tenancy/freshness, shared health loads and cadence metadata. They do not claim to model billable rule/index work, network costs, or deployed activity.
