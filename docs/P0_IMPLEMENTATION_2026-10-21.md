# P0 Implementation — 21 Oct 2026

Implements the P0 list from `docs/COMPLETE_AUDIT_AND_MARKET_GAP_2026-10-21.md`
**except P0-2 (Razorpay per-college settlement), excluded by decision — still
the one item that must be settled with the CA before the first live fee
transaction.** Everything below is committed on
`arena/679b808d-vriddhi` (not pushed), with FE tsc clean, FE tests 711/711,
functions 1278/1278, production build green.

| # | Item | Commit | What shipped |
|---|---|---|---|
| P0-6 | APAAR / ABC + NAD export | `5ade69d`, `c5d2a2c` | 12-digit `apaarId` through CSV templates/import, student self-service in Settings, staff mapping desk (UUCMS screen → "APAAR / ABC IDs" tab: completeness by batch, duplicate detection, per-student + pasted-list mapping), NAD-ABC credit export from **published** grade records with explicit skip list |
| P0-4 | Certificate desk | `73cbf0d` | `/admin/certificates` + `/student/certificates`: bonafide, transfer, conduct, course-completion, fee-structure; editable wordings, numbered letterhead PDFs (counter per type), request queue + walk-in issue, frozen reprint text, CSV register |
| P0-1 | Transactional email | `ee07b60` | Queue + delivery trigger (SMTP or Resend), templates (fee receipt/reminder, hall ticket, result, certificate, deadline, announcement); announcement "also email" fan-out; certificate-issued hook; Settings status card + test send. **Env-gated**: no keys → recorded as `skipped_unconfigured`, nothing breaks |
| P0-3 | Semester promotion | `e2464b8` | `/admin/promotion`: backlog-aware preview from published grades (carryover limit + all-clear-to-graduate policy), per-student overrides, idempotent server run → promote/detain/graduate (Alumni + passing year), backlog list stored on the student, run audit record |
| P0-5 | Scholarship desk | `bb5214d` | `/admin/scholarships` + `/student/scholarships`: SSP/NSP scheme catalog with editable last dates, student apply-with-checklist, verification/e-attestation queue, sanction + DBT amounts, eligible-not-applied worklist with deadline countdowns, register CSV |
| P0-7 | Elective registration | `a9a1032` | `/admin/course-registration` + `/student/course-registration`: semester windows with DSE/OE/SEC/VAC baskets, seats enforced **server-side**, subject-strength + registrations CSV (UUCMS subject-entry ready), confirm/return flow |
| P0-8 | Ops basics | `e42e329` | Env-gated Sentry (FE: init + ErrorBoundary + user tags, no PII, no tracing), weekly scheduled Firestore export function (env-gated), `docs/OPS_RUNBOOK.md` (staging, deploy order, restore drill, demo tenant recipe), `LICENSE` placeholder |

## New backend surface
Callables: `setStudentApaarIds`, `exportNadAbcRecords`, `getMailStatus`,
`sendTestEmail`, `queueTransactionalEmail`, `previewPromotion`,
`runPromotion`, `getMyRegistrationWindow`, `submitCourseRegistration`;
trigger `onMailQueued`; scheduler `scheduledFirestoreExport`.
Collections: `colleges/{cid}/mail`, `certificateRequests`, `scholarships`,
`courseRegistrations`, `promotionRuns`; config docs `certificates`,
`scholarships`, `registration`. New deps: `nodemailer` (functions),
`@sentry/react` (frontend, lazy chunk only when DSN set).

## Your action checklist (keys & consoles — code can't do these)

1. **Before any deploy:** run the Firestore **emulator rules test suite**
   locally (needs Java; not runnable in the build sandbox). The new rules
   blocks mirror the existing noDues/library patterns, but rules are the #1
   production-incident source — test, then deploy in the OPS_RUNBOOK order
   (`indexes → rules → functions → hosting`).
2. **Domain email (you're buying tomorrow):** create a product-mail
   subdomain (e.g. `notify.<domain>`) with SPF + DKIM + DMARC, set in
   `functions/.env`: `MAIL_FROM`, SMTP creds **or** `RESEND_API_KEY`, and
   `APP_URL`. Then Settings → Notifications → **Send test email**. (Full
   lines are pre-written in `.env.example`.)
3. **Sentry:** free project → set `VITE_SENTRY_DSN`, rebuild, verify one
   test error, add an alert. Runbook §1.
4. **Backups:** create `gs://…` bucket + grants + `BACKUP_BUCKET`; enable
   **PITR** in Firebase console; run+log one restore drill. Runbook §2.
5. **Staging project + demo tenant**: Runbook §3–4 (the demo recipe now
   includes APAAR/certificate/scholarship/registration showpieces).
6. **P0-2 (excluded, still open):** Razorpay settlement (per-college keys
   or Route marketplace). Decide with your CA before the first rupee —
   today all college fee money would settle to one platform account.
7. **LICENSE**: replace the placeholder company name once the Pvt Ltd is
   registered (next week), and have the CA/CS review it.

## Honest limitations to demo around
- NAD-ABC export columns are comprehensive but must be checked against
  *your university's* current template (the export says so in its filename
  and UI); APAAR verification itself happens on DigiLocker, not here.
- Promotion and NAD export only see **published** grade records imported
  into Vriddhi — import university results first (Admin → Grade Import).
- Certificate/registration/scholarship caps: roster fetches cap at 5,000
  students per college (fine for degree colleges, revisit for universities).
- Scholarship worklist needs students' `category` on record (add it during
  onboarding); unknown-category students are included as "confirm" rows.
- Elective caps are per-window Firestore reads capped at 5,000 submissions.
