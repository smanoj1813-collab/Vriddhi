# Vriddhi — New-Session Handoff — Slice 2 "Delivery Spine"

> Paste this into a fresh Arena session on github.com/smanoj1813-collab/Vriddhi, then say: "Begin S2.1."

## 0. Starting state (verify first)
- PR #41 (deterministic paper parsing + numbered-cell fix, Word template + layout checker, delete gates, competitive analysis, **curriculum-scheduling audit**) was merged to `main` 2026-09-10. Pull `main` into the session clone immediately.
- `docs/curriculum-scheduling-audit.md` on main IS the Slice 2 spec — file:line evidence, findings F1–F8, work items. Read it before coding.
- Baseline checks: `cd functions && npm install --ignore-scripts && npm test` → expect all green (~131 tests at merge). `npx tsc --noEmit` clean in both root and functions.

## 1. Mission
Build Slice 2 "Delivery Spine": make Curriculum → Faculty Mapping → Weekly Timetable → Class Sessions → Attendance → Coverage one connected data graph. The audit verdict: each module is individually sound but the bridges don't exist (timetable never generates sessions; two writers create `classSessions` in different shapes; `topicsCovered` is free text; Journey analytics are hardcoded/static fields; conflict checks are client-only). User also wants competitor-parity features — this slice equals and beats egenius.in's advertised "Lesson Planner" (plan↔actual↔coverage, not just a checklist).

## 2. Build order (one commit/PR per sub-slice, tests included)
- **S2.1** New `functions/src/classSchedule.ts`: callable `generateClassSessions({from,to})` — expand active `weeklySchedules` into `classSessions`; deterministic doc ID `${weeklyScheduleId}_${yyyy-mm-dd}` (create → `already-exists` = skip ⇒ idempotent); ≤92-day range guard; ≤400 ops per WriteBatch; callable `cancelWeeklySchedule` bulk-cancels future `status=='scheduled'` sessions. `collegeId` from auth custom claim ONLY (never the client localStorage pattern at scheduleApi.ts:47). Register in the callable export block at the bottom of `functions/src/index.ts`; mirror guard/sanitize/error conventions of `paperParsing.ts` / `paperWorkflow.ts`.
- **S2.2** Canonical session shape: `{weeklyScheduleId, date 'yyyy-mm-dd', dayOfWeek, startTime/endTime 'HH:mm', subject, subjectCode, branch, batch, semester, facultyId, room, status scheduled|completed|cancelled, topicIds: [], topicsCovered: [] (legacy display), attendanceCount, presentCount, createdAt/updatedAt}`. Attendance marking must attach to the existing (or get-or-create with the deterministic id) session — fold `attendanceApi.createClassSession` into that; keep legacy readers alive (the `topicsCovered || topicsPlanned` fallback in scheduleApi.ts:84 stays).
- **S2.3** `topicIds` on sessions; picker fed by the faculty's mapped topics (`curriculumFacultyMappings` → `topics/*`). New `completeClassSession` callable updates the session and flips `facultyTopics` status atomically (one transaction, same pattern as `confirmPaperStructure`). First check `current-firestore.rules` (topics ≈747 superadmin-write; facultyTopics ≈764) before adding any client write path.
- **S2.4** `getCurriculumProgress` callable + admin page "Curriculum Progress": topics covered/total per curriculum×batch; hours delivered (Σ session durations) vs `curriculumFacultyMappings.totalHours`; pace vs elapsed semester weeks. Replace the fake Journey numbers (`src/modules/admin/hooks/useJourney.ts:125`: static `faculty.topicsCovered`, `classesThisWeek: 0`, `avgAttendance: 85` default) with computed values.
- **S2.5** Port the core of `src/shared/utils/timetableConflicts.ts` (337 LOC, used client-side at scheduleApi.ts:790) into functions; enforce faculty+room double-booking server-side in materialise and session-create; client keeps advisory warnings.

## 3. Repo orientation
- SPA: Vite+React+TS, `src/modules/{admin,faculty,superadmin,student,...}`; Firestore mostly accessed directly from client code. Functions: single express `api` onRequest (asia-south1, 2GiB) **plus** exported v2 onCall callables (bottom of `functions/src/index.ts`). Rules live at repo root `current-firestore.rules` (weeklySchedules ≈568, classSessions ≈588, curriculumFacultyMappings ≈595, curriculum ≈729, topics ≈747, facultyTopics ≈764).
- Key UI: `FacultySchedule` / `FacultyReschedule` / `FacultyAttendanceMarking` (faculty pages), `admin/api/scheduleApi.ts`, `admin/api/attendanceApi.ts`, `admin/api/journeyApi.ts` + `useJourney.ts` + `pages/Journey.tsx`, `superadmin/api/curriculumApi.ts`, `admin/api/curriculumMappingApi.ts`.

## 4. Arena sandbox quirks (read before touching git)
- ALWAYS `npm install --ignore-scripts` (puppeteer postinstall otherwise fails). node_modules may be pruned between turns — check before build/test.
- The local branch can get reset to a stale base between turns while workspace files persist. Before editing: copy changed files to /tmp → `git fetch origin <session-branch> && git reset --hard FETCH_HEAD` → restore (reset --hard discards uncommitted edits). Never push to any branch other than the session branch.
- `npm test | tail` masks failures — grep for `not ok`. No Firestore emulator available; unit-test pure helpers with node:test via tsx. No Firebase deploys from sandbox.
- Web fetches of egenius.in just render blog feeds — don't bother; notes are in `docs/competitive-analysis-and-roadmap.md`.

## 5. Standing user constraints (follow to the letter)
- Never present PR merge as a prerequisite for testing; the user pulls, builds, deploys (`firebase deploy --only functions,hosting`) and retests himself. For guided hands-on testing: ONE command block at a time + "what success looks like", then wait for his paste.
- Do NOT touch: `src/modules/faculty/pages/TestScheduler.tsx`, `PaperUploadEditor.tsx`, `src/shared/utils/paperReadiness.ts` (his local edits); never seed `content/` or `pre-assessment` data; `facultyTopics` semantics preserved (additive writes only).
- Paper-flow policy (applies to anything AI-assisted): assistive only, no auto-publish, never invent MCQ answers.
- egenius.in is a COMPETITOR, not the user's site.
- Papers-flow regression checklist after any deploy (user runs): parse real file → MCQs+marks without Gemini key → Confirm → badges all ✓ → scheduler → delete gates.

## 6. Known debt — do NOT fix in this slice
- String join keys (`subject`/`subjectCode`/`branch`/`batch`/`semester`) everywhere — no repo-wide id migration; just carry a normalized `subjectKey` on new writes if convenient.
- localStorage college scoping in legacy client code — leave, don't extend.
- OBE/CO-PO, fee payment gateway, hall tickets/marksheets, admissions-lite, parent portal — prioritized backlog in `docs/competitive-analysis-and-roadmap.md` §4.1/§5; only start on user request.

## 7. Definition of done (Slice 2)
1) Admin selects a date range → sessions appear in faculty calendars exactly once per slot-day; re-running adds zero duplicates.
2) Cancelling a weekly slot cancels its future unmarked sessions.
3) Attendance marks the real session — verify: for a day+slot there is exactly one `classSessions` doc.
4) Faculty tag topics at "mark complete"; `facultyTopics` flips to covered; Journey/Curriculum-Progress totals match the ledger.
5) Faculty/room double-bookings rejected server-side with clear error codes.
6) `functions` tests all green incl. new helpers; both `tsc --noEmit` clean.
