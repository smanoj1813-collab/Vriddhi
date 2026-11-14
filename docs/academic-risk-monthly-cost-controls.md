# Academic-risk monthly cost controls

The automatic academic-risk service is retained as a **monthly review**, not removed and not continuous early-warning monitoring. This implements the requested cost reduction without changing course illustrations, deleting alert history, weakening tenancy checks, or removing explicit self-service checks.

**Deployment status:** these are repository changes. No production scheduler, Function, data, or Hosting configuration was changed during implementation. Existing deployed 15-minute jobs continue until they are paused or the updated Functions are deployed. A frontend-only deploy cannot change a Cloud Scheduler job.

## Behavior

| Component | New behavior |
| --- | --- |
| `sweepAcademicRiskAlerts` | Monthly starter: `0 3 1 * *`, timezone `Asia/Kolkata` — 1st of each month, 03:00 IST. 256 MiB, 60-second timeout; only queues work. |
| `continueAcademicRiskSweep` | Firestore **create** trigger on server-owned `riskSweepRequests/{requestId}`; no idle cron. 1 GiB, 540-second timeout, concurrency 1, max instances 1. |
| `retryAcademicRiskPush` | Monthly recovery: `0 6 1 * *`, 1st at 06:00 IST. Up to 100 pending messages within the 24-hour delivery window, not an all-month poller. |
| Alert persistence | No write if meaningful content/state/recipient scope is unchanged. Repeated incomplete/unverified state is also a no-op. |
| Freshness | One `riskSubjectRuns` document per checked subject. Inbox responses use authorized subjects' run timestamps without rewriting every alert copy. |
| Inbox | No interval, focus or reconnect polling. Loads saved results on entry, explicit refresh, successful mutations, or a real foreground push. |
| Manual checks | Authenticated student/faculty/mentor checks remain explicit and throttled to one request per two minutes. Reading the inbox never starts a scan. |

For a roster that previously finished on every 15-minute tick, automatic full-roster reviews go from approximately **2,880 per 30 days to one monthly cycle**. A cycle may need multiple chunks and retries. This is **not** a claim that the whole Firebase bill falls by the same proportion: manual actions, other jobs, and actual data volume still matter.

## Why there is a continuation worker

Merely changing the old cron expression to monthly would leave a correctness bug: its seven-minute / 1,000-successful-check cap could leave most of a large roster waiting until later months.

The monthly starter transaction initializes `riskJobs/academic-sweep` and creates the first deterministic request (`YYYY-MM__0`) atomically. A month guard prevents another full cycle in the same IST calendar month, whether the job is running, complete, or budget-failed. Delayed events from a different month are ignored. Migration resets the old rotation cursor only after any active legacy lease has expired.

The worker:

1. Validates the request ID, stored period/sequence, current selected job and pending status. Clients cannot create requests; Firestore rules explicitly deny their direct reads and writes, including for superadmins.
2. Claims a nine-minute lease and increments the request's attempt count in a transaction. It never silently acknowledges pending work that is leased by a crashed worker: that delivery throws for a retry after lease expiry.
3. Reads discovery pages of 25 and validates every discovered account against current Auth claims. At most three subjects are processed concurrently; existing tenant, department, policy and incomplete-evidence safeguards remain intact.
4. Checkpoints each complete page and its counters only while still owning the lease. It counts **all discovered hints** toward the 1,000-per-chunk budget, including missing/invalid Auth links, so orphan-heavy directories cannot bypass the cost bound.
5. Stops between complete pages after seven minutes or 1,000 discovered accounts. It atomically finishes the request, releases the lease and either marks the cycle complete or creates exactly one next request. No daily/15-minute scheduler is used to find remaining work.
6. Resumes the last completed-page cursor after an infrastructure failure. An interrupted page can repeat, but completed pages are not deliberately restarted. Stable alert writes are deduplicated on replay.

Claimed attempts are capped at three per chunk, and a cycle is capped at 200 chunks. Exhaustion records a visible failed state rather than silently claiming completion or spawning unlimited work. Failures before a claim can still receive platform delivery retries, but do not enter the academic scan. Old-month deliveries are ignored before any Firestore access.

`cycleComplete` means discovery finished; it does not mean all people were checked successfully or that academic issues are clear. Review `errors`, subject run completeness/coverage, and logs. Account-level linkage failures are counted and logged; they are not retried in an endless per-person loop. Accounts without discovery hints can still self-check after fixing their verified linkage.

## Alert write and freshness invariants

- Compare the next persisted content with the previous content excluding only `updatedAt` and `checkedAt`. A changed finding, role/scope, severity, state, read acknowledgement, dependency, expiry or route still causes the appropriate update.
- Preserve `readAt` when a read alert's meaningful evidence changes; do not reset acknowledgements without a reopening/severity escalation.
- Only opening, reopening or severity escalation creates a push generation, as before. No-op scans do not create push outbox records.
- Unchanged alert copies retain their stored timestamps and ordering. The inbox fetches each distinct, already-authorized subject's run summary and validates its college/subject linkage before using the check timestamp. Historical resolved/archived alert rows retain their historical checked time.
- Subject leases, summary writes and evidence reads still happen for an explicitly requested check or the monthly review. A no-op alert write does **not** mean a whole check has zero operations.
- The UI calls the feature a monthly snapshot and warns that intervening attendance/deadline changes can be absent. It must not be used as a live deadline, eligibility or compliance guarantee.

## Push delivery trade-off

New/reopened/escalated alerts still create immediate push events. Transient sends use the existing create-trigger retries and eight-attempt / 24-hour window. There is no 15-minute recovery scheduler after rollout.

Monthly recovery is best-effort, bounded to 100 fresh pending messages. Expired rows are excluded so an old backlog cannot prevent current messages from being considered. The worker's 15-minute Web Push TTL, device ownership, Auth/scope revalidation, opt-in, shared-device privacy and notification tag deduplication are unchanged. Very large backlogs and old outbox retention require operator maintenance; do not interpret a monthly inbox as guaranteed timely push delivery.

## Safe rollout — only after approval

All commands below are instructions, **not actions executed by this change**. Use the existing Firebase-authenticated deployment environment. No credentials belong in chat or Git.

1. In the **`vriddhi-academic`** project's Cloud Scheduler console, find the existing jobs by their target Functions `sweepAcademicRiskAlerts` and `retryAcademicRiskPush`. **Pause both old 15-minute jobs** if immediate cost containment is needed. Do not guess job IDs or pause unrelated jobs. Wait for any already-running sweep to finish (its old timeout is nine minutes); pausing prevents new executions but does not cancel one already running. Manual checks and stored inboxes remain available.
2. Review/merge the current branch through the existing PR. Do not deploy unrelated, unreviewed working-tree changes. Build both projects:

   ```sh
   npm run build
   npm --prefix functions run build
   ```

3. **Deploy the create-triggered worker first.** The trigger must exist before the new starter creates a request; creating queue documents before their create trigger is installed can strand a request.

   ```sh
   firebase deploy --only functions:continueAcademicRiskSweep --project vriddhi-academic
   ```

4. Deploy the changed starter, recovery and callable implementations:

   ```sh
   firebase deploy --only functions:sweepAcademicRiskAlerts,functions:retryAcademicRiskPush,functions:refreshMyAcademicRiskAlerts,functions:getMyAcademicRiskAlerts --project vriddhi-academic
   ```

5. Deploy reviewed rules and the built frontend:

   ```sh
   firebase deploy --only firestore:rules,hosting --project vriddhi-academic
   ```

   The new request collection is already denied by the existing default-deny fallback; the explicit rule documents/enforces the server-only boundary. No new composite index is needed for request documents. The fresh pending-push query uses the existing `riskPushOutbox(status, createdAt)` index; verify it is deployed and ready.

6. Inspect the **actual deployed** Scheduler schedules and timezone. Confirm monthly `0 3 1 * *` and `0 6 1 * *`, then resume only these correctly updated jobs if they remain paused. Confirm no duplicate legacy 15-minute job was left behind. Do not repeatedly press “Run now”: the guard allows one cycle per current month, not a daily retry loop.
7. Optionally run the updated monthly starter **once**, deliberately, if a current-month review is required before the next 1st. Confirm `cadence: monthly`, current IST `period`, pending request delivery, advancing checkpoint, error counts, and completion. A manual scheduler execution still consumes one review and the same monthly budget.
8. Test on a small set of authorized real accounts: read the inbox without recomputation, explicitly self-check, acknowledge an alert, recheck unchanged evidence, confirm fresh check time without rewritten alert rows, verify HOD/Principal isolation and optional real-device push. Compare Firestore/Cloud Run metrics before and after rollout; earlier source analysis did not prove production attribution.

A Hosting-only deploy, a local source edit, or a Git push **does not stop the live scanner**. Setting Principal risk settings to disabled also does not remove the scheduler and per-subject bookkeeping.

## Monitoring, failure recovery and retention

Inspect:

- `riskJobs/academic-sweep`: `period`, `status`, `sequence`, `cursor`, `processed`, `errors`, `discovered`, `checkpointAt`, `leaseUntil`, `cycleComplete`, and `failure`.
- `riskSweepRequests`: deterministic period/sequence, pending/done/failed status, claimed attempts and timestamps.
- `[academicRisk] monthly review chunk finished`, monthly failure/budget logs, subject linkage errors, run completeness/coverage, Firestore operation metrics and Cloud Run duration.

Same-month scheduler retries intentionally do not reset a failed budget. Investigate the failed source/linkage first. A trusted operator can resume a reviewed checkpoint by atomically selecting a **new unused request sequence below the monthly cap** and creating the matching pending request while preserving the month, cursor and totals. This is a deliberate operational action, not a client capability or automatic restart. Exhausting the monthly chunk cap requires reviewed repartitioning/budget changes, not deleting the guard.

Retain the current job/request state for idempotency and audit. Completed prior-month requests and expired outbox entries can be cleaned under an explicit retention policy; no production deletion or automatic paid-TTL policy is introduced here. Do not delete the current month guard to try to reduce storage cost.

## Validation

After the implementation:

- Full Functions unit suite: **1,520 passed**, including monthly schedule/guard, chunk continuation beyond 1,000 hints, time budget, lease takeover/loss, bounded retry failure, cost-operation counts, acknowledgement preservation, freshness and current-scope tests.
- Full frontend unit suite: **823 passed**.
- Combined render suite: **391 general + 33 student + 69 role/risk + 42 faculty** checks passed. The role/risk checks assert the monthly/non-live messaging, no interval/focus/reconnect polling, no recomputation on page entry, and retained explicit checks.
- Frontend TypeScript + production/PWA build: passed. Existing large-chunk and unmatched Workbox-glob warnings remain non-blocking.
- Functions TypeScript/build: passed.

The additional `riskSweepRequests` direct-access denial case is registered in the existing Firestore emulator suite. **No emulator or production acceptance is claimed:** this sandbox has no Java runtime, so those security rules remain subject to the Java-enabled CI emulator run and deployment verification. No production usage, billing, push delivery, scheduler or data changes were performed.

Local logs are in ignored `artifacts/risk-monthly/`.
