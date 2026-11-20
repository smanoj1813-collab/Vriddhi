# Diagnose daily Firestore usage in `vriddhi-academic`

Reported baseline: approximately **12,000 reads and 1,500 writes per day for four consecutive days**. The Firebase Overview screenshot shows project-level totals, not a per-function or per-collection breakdown. The repetition makes scheduled work a good first lead, not a confirmed root cause. The screenshot dates also don't establish which source revisions, scheduler definitions, or indexes were live. This review did not access production metrics, run production queries, or deploy anything.

## Attribute the four days before changing production schedules

1. In [Cloud Monitoring Metrics Explorer](https://console.cloud.google.com/monitoring/metrics-explorer?project=vriddhi-academic), graph `firestore.googleapis.com/document/read_count`, `firestore.googleapis.com/document/write_count`, and `firestore.googleapis.com/document/delete_count` for the same database over the four reported days. View 5–15 minute **sum** buckets, not a per-second rate. Compare contiguous 24-hour windows using the same timezone (use Asia/Kolkata for matching these jobs). First note overnight totals and exact spike times; daily totals alone can't distinguish the sources. Treat these monitoring counters and estimated minimum billable query reads as different measures, not an exact billing reconciliation.
2. Overlay invocations / use [Logs Explorer](https://console.cloud.google.com/logs/query?project=vriddhi-academic) in those time buckets. Match log messages and actual deployed function revisions:

   | Pattern (IST) | Check | What to record |
   | --- | --- | --- |
   | Every 5 min, including overnight | `autoSubmitExpiredStudentTests` | Which revision ran, invocation count (nominally 288/day) and `[StudentAssessments] Expired attempts finalized` / failure logs. The current revision makes **two** `studentAssessments` attempt-recovery queries and **zero** `scheduledTests` reads or writes; an older revision still completing due tests will show up as `scheduledTests` traffic here. Empty queries still have a billing minimum. |
   | Every 15 min | `refreshPlatformStats` | `[PlatformStats] refreshed`, including `written`. Aggregations still depend on index entries scanned and top-college queries return documents. |
   | Around 02:30 | `reconcileAttendanceSummaries`; `scheduledFirestoreExport` on Sundays if configured | `[AttendanceSummary] reconcile finished` (`checked`, `repaired`); look for large raw-record rebuilds or a configured export rather than assuming every day is a backup. |
   | Around 03:00 | `sweepAcademicRiskAlerts` (no-op rollout target) | The current revision performs **no reads and no writes** and logs nothing. Any `[academicRisk]` chunk activity at this hour comes either from the retired scheduled starter still running an older revision, or from an operator-requested manual review; `riskSweepRequests` and `riskJobs` document fields (`cadence`, `period`, `status`, `processed`, `discovered`, `errors`) tell them apart. Manual college reviews use `riskJobs/manual_<collegeHash>` with a `mode` of `self`/`college`. |
   | 06:00 | `retryAcademicRiskPush` | Claimed/sent push attempts. This is independent of reviews and bounded to 100 pending messages. |
   | Only after a staff click | `requestAcademicRiskReview`, `continueAcademicRiskSweep`, `refreshAssessmentTestStatus` | There is no timer for these. `[academicRisk] review chunk finished` totals and `refreshAssessmentTestStatus` transactional read+write pairs should match the number of explicit clicks in the window. |
   | Mostly during teaching hours | Attendance booking, scheduled exams and portal traffic | Compare class saves and attendance-summary trigger invocations, and assessment save/report or other high-volume function calls. Inspect existing Firestore Query Insights if available; direct browser Firestore traffic won't show up as function calls. |

3. Check [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler?project=vriddhi-academic) and the deployed Functions revisions. Verify that `refreshMyAcademicRiskAlerts` is the deny-only revision with **512 MiB** (the earlier 128 MiB rollout failed at startup), that `sweepAcademicRiskAlerts` is the **no-op** revision, and that no legacy frequent risk scanner is still running. Do **not** invoke a potentially old manual scanner to find out. Where existing telemetry is insufficient, use an approved, short and scoped observability window; don't enable blanket Data Access logging or log document payloads by default.

## Changes on this branch (not deployed)

- **Exam recovery is attempts-only.** The five-minute schedule is unchanged, but the handler no longer queries or writes `scheduledTests`. It keeps both `studentAssessments` attempt queries (`autoSubmitAt <= now`, and the legacy `endsAt <= now` pass), so disconnected students are still finalized. At 288 ticks/day that removes every scheduled-test read and status write the idle sweep used to perform. Test lifecycle changes now happen only when staff press **Refresh status** (`refreshAssessmentTestStatus`): one transactional read plus one write per click, only for an ended `published`/`ongoing` test, only for the owning Faculty or a same-college Principal, and never automatically.
- **Risk reviews are manual.** `sweepAcademicRiskAlerts` is a no-op rollout target and the scheduled queueing path is gone. Faculty can request a self-only review; Principals can request a college-wide review; each scope is limited to one request per IST day, and one per-college job document serializes overlapping work. Already-queued scheduled requests still drain via `continueAcademicRiskSweep` so rollout does not strand work. Push recovery is unchanged.
- **Durable lease fencing.** The worker checks its own chunk lease inside every publishing transaction instead of writing and deleting a lock document per account. Expired or replaced workers cannot publish under a stale lease. Each reviewed account avoids one lock write and one lock delete (deletes are a separate metric); an unchanged subject also avoids a net lock-related read. Old lock documents are not migrated or deleted by this change.
- **One index change.** Added `users (role ASC, collegeId ASC, __name__ ASC)` for the college review's `role in [...]` + `collegeId ==` + document-id ordering. Removed the now-unused `scheduledTests (status ASC, endDateTime ASC)`.

## Verify and roll out

- Confirm no older callable/worker can run a separate subject scan outside the current durable lease. Finish in-flight legacy reviews before updating `continueAcademicRiskSweep`. Deploy the new index first, then only the changed Functions after approval (the Functions build and security settings must be current):

  ```sh
  npm run deploy:indexes
  firebase deploy --only 'functions:autoSubmitExpiredStudentTests,functions:refreshAssessmentTestStatus,functions:requestAcademicRiskReview,functions:continueAcademicRiskSweep,functions:sweepAcademicRiskAlerts' --project vriddhi-academic
  ```

- After deployment, compare four equivalent weekdays/use windows, with the same timezone and daily traffic, and log per-review processed counts and chunk outcomes. Verify browser-disconnected exam recovery still completes, ended tests can be refreshed by the owning Faculty (and are refused for a colleague), a second same-day review request is refused without a scan, and no `scheduledTests` traffic appears in the five-minute invocations. Compare **writes and deletes separately**. Do not pause exams, attendance, or push recovery just to make the graphs lower.
