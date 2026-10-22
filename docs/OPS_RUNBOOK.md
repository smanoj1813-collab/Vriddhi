# Vriddhi — Operations Runbook

The five things that must be true before (and while) real colleges run on
Vriddhi: error tracking, backups you have actually restored once, a staging
environment, a demo tenant for sales, and a deploy order that never breaks
a live college mid-exam-season. Written for the Pvt Ltd go-live; keep it
short and honest rather than aspirational.

---

## 1. Error tracking (Sentry) — code shipped, key needed

The frontend reports uncaught errors + ErrorBoundary catches via
`src/shared/utils/sentry.ts`. It is **env-gated**: with no DSN, the SDK
chunk is never downloaded.

1. Create a Sentry project (free tier is fine) → Settings → Client Keys.
2. Set `VITE_SENTRY_DSN=<browser DSN>` in the build env (`.env`), rebuild.
3. Optionally set `VITE_SENTRY_ENVIRONMENT=production|staging`.
4. Verify: log in, open the browser console, run `throw new Error("ops check")`
   on any page... actually use a non-production label first. The issue must
   appear in Sentry with `role` + `collegeId` tags (ids only, no PII).
5. Set an alert: new issue → email/Slack to whoever is on call.

Backend: Cloud Functions errors are in Cloud Logging (GCP console →
Logging, filter `severity>=ERROR`). Create a log-based alert for
`[Mail] delivery failed` bursts and any 5xx spike during onboarding weeks.

## 2. Backups — export shipped, bucket + PITR needed

Two independent safety nets; do both.

### 2a. Weekly managed export (code: `functions/src/backup.ts`)
`scheduledFirestoreExport` runs Sundays 02:30 IST and calls Firestore's
`exportDocuments` to `BACKUP_BUCKET`. Until configured it logs a warning
weekly (search Logs for `[Backup]`) — treat that warning as a failing
alarm, not noise.

Setup once:
1. Create a GCS bucket in `asia-south1`, e.g. `vriddhi-backups` (Standard
   class, uniform access, **Object Versioning ON**, lifecycle: delete
   exports older than 90 days).
2. Grant the functions runtime service account
   (`<project>@appspot.gserviceaccount.com`): `roles/datastore.importExportAdmin`
   on the project + `roles/storage.objectAdmin` on the bucket only.
3. Set `BACKUP_BUCKET=gs://vriddhi-backups` in `functions/.env`, deploy
   functions, then trigger once manually (Cloud Scheduler → Run now) and
   confirm objects land in the bucket.

### 2b. Point-in-time recovery (console, 5 minutes)
Firebase console → Firestore → Backups/PITR → enable **Point-in-Time
Recovery** (7-day window). This covers "a bad bulk edit at 10:04" far
better than a weekly export.

### Restore drill (do once before first paid college, then quarterly)
1. In a **scratch** Firebase project (never production), import the latest
   export: `gcloud firestore import gs://vriddhi-backups/firestore-exports/<stamp>`.
2. Point a local build at the scratch project, log in as a known test user,
   verify students/fees/grades counts roughly match production.
3. Record date + result at the bottom of this file. An untested backup is
   a hope, not a backup.

## 3. Environments & deploy order

- **Staging**: a second Firebase project (`vriddhi-staging`) with its own
  `.env.staging` (VITE_FIREBASE_*), seeded demo tenant (§4), and the same
  rules/indexes/functions as prod. Every release goes staging → smoke test
  the golden paths (login as each role, one fee payment test-mode, one
  grade import, one certificate issue) → production.
- **Deploy order** (production, always):
  1. `firebase deploy --only firestore:indexes` (wait for index build)
  2. `firebase deploy --only firestore:rules` (deploy `current-firestore.rules` —
     confirm `firebase.json` points at it)
  3. `cd functions && npm run build && firebase deploy --only functions`
  4. `npm run build && firebase deploy --only hosting`
- **Never deploy during a customer's exam week** without a freeze exception
  from whoever owns that account. Hall tickets and fee deadlines are
  unforgiving.
- Rules changes: run the rules test suite first (`functions` emulator-based
  suites + `npm run test:unit`), and skim the diff for the colleges subtree —
  most production incidents in Firebase apps are rules regressions.

## 4. Demo tenant (sales)

One disposable college on **staging** (and a prod one only if sales insists),
pre-loaded so a principal sees a living college, not empty tables:

1. Superadmin → create college "Demo Degree College" + principal login.
2. Onboard via the bulk-import templates (`onboardingService` sample rows
   are realistic) — ~120 students across BCA/B.Com/B.Sc, 12 faculty,
   include `APAAR ID` values on most rows and a few blanks (the APAAR
   worklist demo sells itself).
3. Seed: fee structure + a few payments, library books (existing seed
   scripts under `scripts/`), one open elective window
   (Admin → Course Registration), one promotion preview (Admin → Semester
   Promotion) with published grades, scholarship schemes with last dates
   set, certificate types left at defaults (issue a sample bonafide).
4. Keep credentials in the team password manager, rotate quarterly, and
   **reset the tenant before investor/pilot demos** rather than letting it
   drift.

## 5. Routine checks (15 min every Monday)

- Sentry: zero new unresolved issues older than a week.
- Cloud Logging: `[Backup]` shows "export started"; `[Mail]` has no
  failure bursts; no new `permission-denied` spikes (rules regressions).
- Billing: GCP budget alerts at 50/80/100% of the monthly envelope; any
  unexpected Storage/Functions growth investigated same day.
- One college success metric: logins this week per live college (Firestore
  `users.lastLogin` sampling) — silent churn shows here first.

## 6. Incident first hour

1. Is it us or Firebase/Google? Check status.firebase.google.com first.
2. Stop deploys. If the last deploy correlates, roll back hosting first
   (Firebase console → Hosting → previous release → rollback), functions
   next (redeploy previous commit), rules last (console keeps history).
3. If data is wrong: don't "fix forward" blindly — PITR read the doc at a
   pre-incident timestamp to see ground truth, then decide.
4. Tell affected colleges early with a specific ETA. Silence is what
   makes colleges keep parallel Excel sheets forever.

---

### Restore-drill log
| Date | Export used | Scratch project | Result | By |
|---|---|---|---|---|
| _not yet run_ | | | | |
