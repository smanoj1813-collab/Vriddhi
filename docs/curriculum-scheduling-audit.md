# Curriculum ↔ Scheduling ↔ Attendance — Connectedness Audit

Date: 2026-09-10 · Scope: as committed on `arena/01a08608-vriddhi` @ `28b52c4`.
Method: file/line evidence, not vibes. This answers: *"we have curriculum and scheduling, but
how efficient and how well connected is it?"*

## Verdict

Each island is individually decent. **The bridges between them don't exist yet** — curriculum is
not attached to the timetable, sessions are not attached to topics, coverage is not attached to
anything. Today `Curriculum → Mapping → WeeklySchedules → ClassSessions → Attendance → Progress`
is really `Curriculum → Mapping` + `WeeklySchedules` + `ClassSessions(+Attendance)` — three
hand-built stacks joined only by **duplicated free-text strings** (`subject`, `subjectCode`,
`branch`, `batch`, `semester`) and manual typing.

## What exists (working, with rules)

| Layer | Collection | Evidence |
| --- | --- | --- |
| Curriculum definition (superadmin) | `curriculum` (course+semester+subjects), `topics` (superadmin-only writes) | `src/modules/superadmin/api/curriculumApi.ts`; rules 729–752 |
| AI syllabus ingestion | `syllabusExtracts` (extract → review → publish) | curriculumApi.ts:204–279 |
| Faculty assignment | `curriculumFacultyMappings` (curriculumId↔facultyIdcourse/sem/branch/batch, hours, credits) | `curriculumMappingApi.ts:45–85`; rules 595–599 |
| Faculty topic ledger | `facultyTopics` (per-topic status; faculty own rows) | rules 764+ |
| Recurring timetable | `weeklySchedules` (dayOfWeek, start/end, room, subject strings, facultyId) | `scheduleApi.ts:440–475`; rules 568+ |
| Actual class instances | `classSessions` (status, `topicsCovered: string[]`, attendanceCount) | `scheduleApi.ts:181–199`, `attendanceApi.ts:31–36` |
| Attendance | per-session records + summaries (present/absent/leave/late/onDuty/ML) | `admin/types/attendance.ts` |
| Client conflict util | `timetableConflicts.ts` (337 LOC), "integrated" in scheduleApi:790 | client-only |

## Findings (the disconnection, ranked)

1. **No materialisation: the timetable never produces sessions.** Greps for
   instantiate/materialize/generateSessions → 0 hits. `weeklySchedules` is decorative grid data;
   a class only exists once a human creates a `classSessions` doc. Cancel a recurring slot → all
   future sessions stay "scheduled". Nothing keeps the two in sync.
2. **Two writers, two shapes for `classSessions`.** `scheduleApi.createSchedule` writes ISO
   string dates + `topicsCovered` + counters; `attendanceApi.createClassSession` writes a
   different `ClassSession` payload (Timestamp `createdAt`, per `admin/types/attendance.ts`); the
   reader has a `d.topicsCovered || d.topicsPlanned` fallback (`scheduleApi.ts:84`) — schema drift
   is already happening. Attendance and the "schedule" half of a session can disagree silently.
3. **Topics are strings, not references.** `classSessions.topicsCovered: string[]` and
   `topicsPlanned` are free text — nothing links to `topics/*` ids, so a completed lecture cannot
   flip the faculty topic ledger, and coverage per course/semester cannot be computed. The mapping
   table stores `totalHours/credits/modulesCount` snapshots, but nothing ever compares them to
   actuals.
4. **The "Coverage/Journey" analytics is fake in this area.** `useJourney.ts:125`:
   `topicsCovered: faculty.topicsCovered || 0` — a static number field on the faculty doc;
   `classesThisWeek: 0` hardcoded; `avgAttendance: 85` fallback default. Admins see a gauge that
   is not computed from `facultyTopics`/`classSessions` at all.
5. **Conflict checking is advisory, client-side, and timetable-only.** The util lives in the app
   (`scheduleApi.ts:790`); ad-hoc `classSessions` bypass it (a teacher can create a session that
   double-books a room/faculty); nothing runs server-side on write. No room/lab inventory exists
   to conflict against.
6. **Join keys are duplicated strings.** Mapping→schedule→session→paper→test link via
   `subject`/`subjectCode`/`branch`/`batch`/`semester` text (papers and `scheduledTests` included —
   same contract as Slice 1). One typo in a code = silently separate curriculum.
7. **Tenancy via localStorage.** `scheduleApi.ts:47–50` reads `vriddhi_college_id`; Firestore
   rules do the real college-scoping, so it's not a hole, but client-supplied scoping is the wrong
   long-term contract for write paths (compare: papers/tests go through callables that resolve
   college from the auth claim).
8. **Whole domain is un-backed by functions.** No transactional guarantees anywhere in
   schedule→attendance→progress, no server validation, no audit rows (contrast the papers/grades
   pipeline, which has `paperReviewAudit`/`gradeRecordAudit` + optimistic concurrency).

### eGenius parity lens (this domain)

Their college page lists **"Lesson Planner"** and **"Exam Timetable"** as package features. We
currently have the inputs (curriculum topics; test scheduler) but not the glue they imply. The
planned Slice 2 below doesn't just match them — plan↔actual↔coverage is a stronger story than a
lesson-plan checklist, and we can demo it with data we already store.

## Slice 2 — "Delivery Spine" (build plan)

**S2.1 Session materialisation callable** — `functions/src/classSchedule.ts`:
`generateClassSessions({from, to})` expands active `weeklySchedules` into `classSessions`
backlinked with `weeklyScheduleId`, idempotent via `slotDateKey = ${weeklyId}_${yyyy-mm-dd}`;
`cancelWeeklySchedule` cancels unmarked future sessions (transaction + college from auth claim,
not localStorage). Client: admin "generate for term" button; reschedule flow keeps working.

**S2.2 One session schema** — fold `attendanceApi.createClassSession` into the materialised
session (it *marks* the session that exists instead of creating a parallel one); normalise
`date` to `yyyy-mm-dd` string + `startedAt/endedAt` timestamps; reader shim keeps legacy docs
readable; `scheduleApi`'s create path becomes a thin wrapper over the callable.

**S2.3 Topic attachment** — session gets `topicIds: string[]` (picker fed by that faculty's
`facultyTopics`/mapped `topics/*`); a "mark session complete" callable updates session + flips
`facultyTopics` status to covered atomically (one transaction, same pattern as
`confirmPaperStructure`); free-text `topicsCovered` stays as display fallback.

**S2.4 Real coverage** — `getCurriculumProgress(collegeId, {curriculumId|facultyId|batch})`
callable: covered/total topics, hours delivered (Σ sessions) vs `totalHours`, % vs elapsed
semester weeks, per-module rollup; replaces `useJourney`'s static fields with computed data;
admin "Curriculum Progress" page + HOD filter. This is the Lesson-Planner-plus feature.

**S2.5 Server-side conflict enforcement** — move `timetableConflicts` core into
`functions/src/utils` (tests exist), reject hard clashes (faculty/room double-book) on
materialise + manual create via the callables; weekly view shows advisory warnings for the rest.

Out of scope here (deliberate): id-based re-keying of subject/semester everywhere (big-bang —
instead S2.2–S2.4 add a `subjectKey` field computed once), OBE/CO-PO (its own slice), room
inventory beyond a minimal `rooms` list for conflicts, biometric import.

Sequencing: S2.1 → S2.2 → S2.3 → S2.4 → S2.5; each lands with node --test coverage (pure
helpers: `expandWeeklyRange`, `slotDateKey`, `computeProgress`, conflict port) and a rules bump
for any new fields the client writes directly.
