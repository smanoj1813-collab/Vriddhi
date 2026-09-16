### What

**1. Student polish — assignment linkage visible where students work**
- `getMyAssignments` now returns `courseId/courseName/moduleId/moduleTitle`, so the student Assignments page renders a violet **course → module badge** on every linked assignment.
- Deadline countdown chips on each card (`5 days left` / `6h left` / `Overdue by 2 days`) with urgency colouring.
- **Filter by course** on the Assignments page (linked course name, subject fallback).
- The bell feed renders the same badge + a live countdown chip for assignment-published notifications: the publish-time notification now persists `deadline`, `courseName`, `moduleTitle` on the document and `getMyNotifications` serializes them (dashboard card + full notifications page, with a "View assignment" jump link).

**2. Admin schedule → assignment — optional toggle in the weekly form**
- `AdminClassSchedule` weekly form gains an **"Attach an assignment to this class (optional)"** toggle (title, max score, deadline) — the timetable-side equivalent of the faculty's curriculum link. Untouched schedules keep working exactly as before.
- `generateClassSessions` linkage: every planned slot with a validated config gets **exactly one draft assignment** under a deterministic id (`sched-assign-{slotId}`), targeting the slot's own branch/batch/division/semester, linked back through `scheduleId`; the slot remembers `assignmentId` (idempotent reruns) and generated sessions inherit it. The draft is left for the slot's faculty to publish — publishing is what fans out the student bell notification with the deadline.
- Generate dialog + snackbar report how many assignment drafts were linked; the timetable grid shows an "Assigns · due …" chip on configured slots.

**3. Analytics / reporting — assignment completion**
- New `getAssignmentAnalytics` callable (staff-only, tenancy from the auth claim; faculty scope = own assignments, others = whole college). Server-side computation from `assignments` + `submissions` + the `students` roster, so the denominator always matches what students can see.
- New **Assignment Analytics** admin page (`/admin/assignment-analytics`, admin/principal/HOD nav): overall completion KPIs, **overdue alerts table** (past deadline + missing students + days overdue), completion % **by course / module / batch / division**, per-assignment table with submitted/late/graded/missing, CSV export.
- Resubmission dedupe (latest per student), case-insensitive cohort matching mirroring the student read path, empty-cohort-targets-nobody rule.

**4. QA + deploy prep**
- `scripts/seed-linked-assignment.mjs`: seeds one linked end-to-end assignment (draft with course→module link + real roster cohort; optional `--publish` writes the exact bell notification shape, `--auto-submit` uploads a real PDF through Storage and writes the submission, `--auto-grade` grades it) and prints the manual verification checklist: faculty Publish → student bell → submit → grade → analytics.
- 31 new functions unit tests pinning the pure cores: slot→assignment id/config/doc builders, deadline parsing, analytics targeting, completion math, grouping and overdue alerts.

### Why

PR #56 made the curriculum→assignment link optional on the faculty side. This session closes the loop: students can see *where* an assignment comes from and *when* it is due (badge + countdown, in the list and in the bell), admins can create the same link from the timetable (which is where most work items actually originate), and the college can finally answer "what percentage of each course/module/batch/division has submitted" with overdue follow-up — all computed server-side so no two surfaces disagree.

### Verification

- `cd functions && npm run build` — passed (TypeScript).
- `cd functions && npm run test:unit` — **422/422 passed** (391 pre-existing + 31 new).
- `npm run build` — passed (TypeScript + Vite + PWA).
- `npm run test:unit` (shared utils) — 119/119 passed.
- `npm run check:dead-code` — no unlisted orphans (new page routed).
- Seed script syntax-checked; run instructions in its header (service account + `NODE_PATH=./functions/node_modules`).

### Deploy after merge

```bash
firebase deploy --only functions      # new callables + generateClassSessions linkage
firebase deploy --only hosting        # student/admin UI
```

No Firestore index changes (all queries reuse indexes already in `firestore.indexes.json`) and no rules changes (everything new runs in authenticated callables; the new `notifications`/`assignments` fields are read through existing paths).
