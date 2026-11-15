# Vriddhi functional debug and security review — 13 November 2026

## Conclusion

**Do not treat the application as security-clean or this report as production sign-off.**
The executable test/build coverage is healthy, and several reproducible bugs were fixed on
`arena/a96bdd6e-vriddhi` / PR #131. The review also found a pre-existing **critical tenant-read
permission gap** and other unfinished security/settings functionality that remain open below.
These findings should be addressed before a broad production rollout; a green CI run alone
is not sufficient evidence for them.

This was a repository-wide automated/regression sweep plus targeted source and browser review,
not an exhaustive manual UAT of every live account, device, integration, or production record.
No production authentication, database mutation, email, payment, deployment, or risk scan was
performed.

## Highest-priority findings still open

### R1 — Critical: staff directory list access is not tenant-bound

**Evidence:** `firestore.rules`, the `allow list` statements in `/students/{id}` and
`/faculty/{id}` (around lines 410 and 434), together with `isStaff()` (around line 124).

Both list grants contain a standalone `isStaff()` alternative. That helper verifies the
signed-in role/suspension state, **not the caller's college**. Therefore an ordinary staff
identity satisfies the list rule independently of a row's `collegeId`. For example, the
student directory rule currently has this shape:

```text
allow list: if isSignedIn() && (
  (isOffice() && sameCollege(resource.data))
  || isStaff() || isSuperadmin() || ownsStudentProfile(...)
);
```

The separate tenant-aware point-get rules and client-side `where('collegeId', ...)` filters
do not close an overly broad collection-list grant. A caller can construct their own query.
This is a source-confirmed authorization gap; it was **not probed against production** and
is not a claim that production data has been accessed or exfiltrated.

Other remaining role-only reads warrant the same review, notably the college-path faculty,
materials/events/notifications collections. Not every role-only read is wrong: platform-wide
universities, shared topic banks, and intentionally universal content must stay available.
Do not globally replace every `isStaff()` occurrence without checking the contract.

**Required remediation:** bind private staff directory/report reads to the verified college
claim; retain Super Admin cross-college access and UID/email-scoped legacy identity resolution;
review affected client queries; add emulator cases for own-college, foreign-college and unbounded
lists for each supported staff role. Rules changes must not restore client authority over roles,
tenants, profile identity, or academic records. This broader authorization change was not folded
into a cosmetic-settings fix without its corresponding query and emulator regression work.

### R2 — High: the “Two-Factor Authentication” switch is not MFA enrollment

**Evidence:** `src/modules/admin/pages/Settings.tsx` (`handleToggle2FA` and the Security tab)
and `src/modules/faculty/pages/FacultySettings.tsx` (Security tab).

These handlers change a React/local-storage boolean and attempt a profile-document write.
They do not enroll a Firebase second factor or implement a second-factor challenge. Failed
writes can leave the switch visually on. The toggle must not be relied on as proof that MFA
protects an account. Externally configured Identity Platform enforcement was not inspected.

The admin Active Sessions card also contains static example devices/locations, and the Revoke
button has no handler; the page does contain a note that backend session revocation is not yet
integrated. It is not a real session inventory or revocation control.

**Required remediation:** integrate real enrollment/challenge and verified server-backed session
revocation, including Firebase project capability/configuration checks, or present explicit,
honest unavailable/status-only UI rather than implying the preference enables protection.
No working authentication feature was removed or simulated as a fix in this debug pass.

### R3 — High: ordinary faculty profile / notification cloud saves still target protected profiles

**Evidence:** `FacultySettings.tsx`, `handleSaveProfile` and `handleSavePrefs`, versus the
`/faculty/{id}` create/update grants in `firestore.rules`.

These UI handlers write directly to `faculty/{auth.uid}`, whereas the rules intentionally
reserve profile mutations to authorized management/server workflows (and a narrowly scoped
employee case), not ordinary faculty self-edits. Legacy faculty profile document IDs can also
differ from the Auth UID. A profile change can update the Firebase Auth display name first and
then fail its Firestore write, leaving the two displays inconsistent.

This is separate from appearance: **appearance now uses the private owner-only preference
path and does not require faculty-profile permission**. Notification-save rejection is now
caught and announced instead of becoming an unhandled rejection, but that error-handling fix
does not make the protected cloud write authorized.

**Required remediation:** add a self-only, server-validated profile/preference mutation workflow
with canonical faculty-document resolution and an explicit allowed-field list; do not widen
faculty identity/tenant write rules just to make the existing client `setDoc` succeed.

### R4 — High advisories remain after the critical dependency patch

Audit results after the patch:

| Dependency tree | Critical | High | Moderate | Low |
|---|---:|---:|---:|---:|
| Frontend, all dependencies | 0 | 7 | 6 | 4 |
| Functions, production dependencies only | 0 | 15 | 10 | 1 |
| Functions, including dev/tooling | 0 | 26 | 29 | 1 |

These are npm advisory/package counts, **not a count of proven remotely exploitable app bugs**.
Some are Node/tooling/optional transitive paths, while production entries such as Nodemailer,
Zod/OpenAI-related dependencies, PDF/browser tooling and body-parser need path-specific triage
and compatible upgrades. Major-version replacements were not blindly applied: the suggested
force fix also proposes incompatible Firebase downgrades/other major changes. Avoid
`npm audit fix --force` as an unreviewed production remedy.

### R5 — Medium: non-appearance notification caches are still browser-wide

Faculty, student and admin notification caches use shared keys such as
`vriddhi_faculty_prefs`, `vriddhi_notification_prefs`, and `vriddhi_admin_notifications`.
A second account on a shared browser can inherit cached choices when canonical profile data
is unavailable. Appearance colour/font caches are account-isolated; this remaining finding is
about the older non-appearance preferences.

## Fixed in this debug pass

| Finding | Fix / regression evidence |
|---|---|
| Critical `proxy-addr` advisory GHSA-jqcg-44mw-7w3h in the Functions runtime tree | Targeted patch **2.0.7 → 2.0.8**; only that package's lock entry changed, with no major dependency upgrade. Actual Express-resolved proxy-address tests failed before the patch and pass afterward. The advisory's misconfigured trust-subnet exposure was not demonstrated in this app's production configuration. |
| Backend dependencies were absent from CI's critical-advisory gate | Added `npm audit --omit=dev --audit-level=critical` to the Functions job. The frontend audit alone does not inspect the separately locked backend tree. |
| Appearance Retry could race a pending Save and restore an older cloud snapshot | Retry is disabled while loading/saving. A deferred-write regression reproduced the wrong selected colour before the fix and now preserves the saved colour/font without the competing read. |
| A selected/cloud font was ignored if browser storage was blocked/full | Apply the validated font directly, independently of caching. Regression previously produced 16px instead of 18px and now passes with throwing localStorage access. |
| Faculty password settings still had the old six-character, no-current-password form | Replaced it with the existing shared flow: verify current password, enforce 10 characters, rotate, best-effort clear the forced-change flag and refresh claims. Ordinary account security was not weakened. |
| Shared password fields lacked programmatic label links / announced feedback | Added unique IDs/label associations, show-password pressed states, and alert/status roles. Tested in faculty, student and Super Admin hosts. |
| Rejected faculty notification saves produced an unhandled promise rejection | Added visible error handling and clear stale success state. Protected write rules are unchanged; R3 remains open. |
| Six existing unit-test files were never invoked by the test scripts | Registered all six: 31 frontend and 44 backend checks. Added three new proxy-address regressions and a 16-check role-settings security suite. |

No authentication, tenant, academic-profile or identity rule was loosened. No client-triggered
risk scan, new background listener/poll, or unrelated data migration was added.

## Validation executed

### Final local checks after the fixes

| Check | Result |
|---|---|
| Frontend production build / TypeScript | PASS |
| Functions build / TypeScript | PASS |
| Frontend units | **874 / 874** |
| Functions units | **1618 / 1618** |
| Aggregate page/role/auth/faculty/cost/appearance/settings render checks | **709 / 709** |
| Academic/onboarding/import render checks | **54 / 54** |
| Course render checks | **586 / 586** |
| Previous-year-paper render checks | **27 / 27** |
| Course content validation | **4 / 4 packs valid** |
| Browser-test TypeScript, dead-code check, whitespace checks | PASS |
| Functions production audit at critical threshold | PASS; non-critical advisories remain above |

That is **2492 unit tests** and **1376 render/behavior checks**, not 3868 independent live-user
end-to-end transactions. Role/component checks mount the actual components with isolated
Auth/Firebase/callable I/O; they do not prove deployed permissions or live integration success.

### Browser checks and execution limits

- Ran all **140** public Chromium cases (desktop + mobile): **135 passed initially**; five timed
  out. Four failures occurred while creating a browser context, before app assertions ran;
  one exceeded the overall 30-second limit during a multi-viewport check.
- Rechecked those areas serially with the **same assertion/time limits** and tracing disabled:
  **7/8 passed**, with one further browser-context creation failure. The remaining desktop
  upskilling case then passed in a fresh isolated **1/1** run. Every original case has a passing
  execution, but the original full run was **not** a clean first-pass 140/140 run. Local browser
  context/resource flakiness remains a tooling reliability issue, not evidence of an application
  assertion failure.
- Final idle, serial checks passed **16/16 actual-component appearance/college checks** and
  **16/16 eight-palette light/dark axe audits** after these fixes. A combined build/unit/browser
  debug run had hit screenshot/navigation resource timeouts. The component replay skipped
  screenshot capture only, not application assertions; both the failed capture run and the
  passing serial checks are retained in the ignored debug artifacts.
- These audits are scoped automated WCAG A/AA checks, not certification that every portal page
  or custom accent usage is accessible.

### Official emulator / CI evidence

PR #131's original head `8daae111026b1ed51af7e910eae6492d0b0a30dd` completed all three CI jobs
successfully in run [43706958246](https://github.com/smanoj1813-collab/Vriddhi/actions/runs/43706958246).
The Functions check's **Rules suite** annotation reports **127 passed, 0 failed**, including the
new owner-only appearance tests. The full rules step and focused course-security step succeeded.
No Firestore, Storage or RTDB rule was changed during this subsequent debug pass.

Java is unavailable in the local sandbox, so the official emulator suite could not run locally.
CI provides the real emulator execution; component stubs and rules-test TypeScript checks are
not substitutes. Results for the updated debug commit are recorded on PR #131. Passing the
existing 127 cases does **not** cover the missing cross-college list-denial cases in R1.

### Other non-green / non-blocking checks

- `npm --prefix functions run lint`: **2 existing errors, 26 warnings**. The errors are the
  intentionally paged `while (true)` loop in `classSchedule.ts` (`no-constant-condition`) and the
  control-character rejection regex in `collegeOnboarding.ts` (`no-control-regex`). Those source
  files were not modified or their checks disabled just to obtain a green lint result.
- Existing large-chunk and Workbox unmatched-glob build warnings remain.
- Live MFA configuration, real mail/SMS, push delivery, payment/provider callbacks, production
  PDF/container behavior, real-account permissions and production billing were not validated.

## Deployment implications

Nothing has been merged or deployed as part of this audit. Follow the open security findings
before treating this as a production-ready sign-off.

The original appearance-only PR required **Firestore rules first, then Hosting**. This debug
pass also patches a **Functions runtime dependency**, so a reviewed rollout now needs a
**Functions redeploy as well** for that patch to reach production. Hosting alone cannot fix
backend dependencies or activate the new private appearance preference rule. There are no
new indexes, Storage/RTDB rules, secrets, or account/data migrations in these changes.

Deployment commands should be provided one at a time when requested.

## Reproduction / evidence

Re-run the package scripts `test:unit`, `test:functions:unit`, `test:render`,
`test:render:academic`, `test:render:courses`, `test:render:pyq`, `validate:courses`, `build`,
`build:functions`, `typecheck:e2e`, and `check:dead-code`. The new security settings suite can
also run separately with `npm run test:render:settings`.

Ignored local logs, before/after failure reproductions, audit JSON, browser reports/configs,
and the CI annotation snapshot are under `artifacts/debug-2026-11-13/`. They contain fixture
accounts only and are not committed as generated artifacts or dependencies.
