# Student Portal — Phase 2 Handoff (Test / Assessment Engine)

Branch: `arena/01a02a01-vriddhi` · Phase 1 PR: #9
Date: 2026-08-23

Phase 1 delivered login, auth, dashboard, attendance, grades, timetable, fees,
materials, library, events, notifications, settings, and assignment submission
against real Firestore data. **Phase 2 = the end-to-end test/assessment engine.**
The list/instructions/result screens already read real data, but the taking +
grading round-trip is not yet unified.

---

## 1. The core problem to solve: two parallel data models

Today there are **two inconsistent representations** of a test:

| Layer | Collections used |
|---|---|
| Admin writes | `assessments` (metadata) + `scheduledTests` (scheduling/paper) + per-student `studentAssessments` |
| `student/api/testApi.ts` (take/submit/result) | reads `scheduledTests`, **writes `studentSubmissions`**, reads **`testResults`** |
| Phase 1 dashboard/list (`studentDataApi.ts`) | reads `studentAssessments`, hydrates title from `assessments` |

Consequences:
- The test a student **sees** (`studentAssessments`) may not match what they
  **take** (`scheduledTests` + `studentSubmissions`).
- On submit, `ActiveTestPage` → `saveStudentSubmission()` writes to
  `studentSubmissions`, but **grades live on `studentAssessments.status = graded`**
  (updated by admin `gradeAssessment`). The dashboard/grades therefore never
  reflect a completed test.
- `TestResultPage` currently computes a result **locally in the browser** from
  navigation state; nothing persists the score back to `studentAssessments`.

### Target authoritative model (confirm with the team before building)
`assessments` (paper/metadata) → `scheduledTests` (when/window/college) →
`studentAssessments` (one row per student: `not_started | in_progress |
submitted | graded`, answers, `marksObtained`, `percentage`, `grade`).
- On **start**: set `studentAssessments.status = in_progress`, `startedAt`.
- On **submit**: set `status = submitted`, `answers[]`, `timeSpent`,
  `submittedAt` (**not** a new `studentSubmissions` doc).
- On **grade**: faculty/admin flips `status = graded` with marks/grade; the
  dashboard, grades page, and result page all read the same doc.
- Decide: do we keep `studentSubmissions` for raw audit/proctoring, or drop it?
  `testResults` appears unused — confirm and remove if dead.

---

## 2. Files that will change

Student-side:
- `src/modules/student/api/testApi.ts` — align `fetchActiveTest`,
  `saveStudentSubmission`, `fetchTestResult` to the target model.
- `src/modules/student/api/studentDataApi.ts` — `fetchStudentTests()` should
  join `studentAssessments` → `scheduledTests` (and/or `assessments`) for
  question data, duration, window, paperId.
- `src/modules/student/pages/ActiveTestPage.tsx` — call start/submit against
  `studentAssessments`; proctoring event logging; timer auto-submit.
- `src/modules/student/pages/TestInstructionsPage.tsx` — real metadata; "Start"
  should transition the `studentAssessments` row to `in_progress`.
- `src/modules/student/pages/TestResultPage.tsx` — read the graded
  `studentAssessments` (+ question-level review) instead of local state.
- `src/modules/student/pages/StudentTestDashboard.tsx` — keep tabs but ensure
  statuses map to the authoritative lifecycle.
- `src/modules/student/types/assessment.ts` — reconcile with admin types.

Admin/faculty-side (to verify the contract):
- `src/modules/admin/api/assessmentsApi.ts`
  (`createStudentAssessment`, `startAssessment`, `submitAssessment`,
  `gradeAssessment`, `scheduleTest`).
- Question source: `scheduledTests.questions[]` inline **or** the
  `scheduledTests/{id}/assessmentQuestions` subcollection **or** linked
  `papers` / `questions`. Pick one path and make the student reader match.

Firestore indexes:
- `studentAssessments`: `(collegeId, studentId, createdAt desc)` and possibly
  `(collegeId, studentId, status)`. Add to `firestore.indexes.json` and deploy.

Security rules:
- Ensure a student can read their own `studentAssessments` and the parent
  `scheduledTests`/`assessments`, and can update **only their own** row's
  answers/status (and not set `marksObtained`/`grade`/`status=graded`).

---

## 3. Feature questions to answer before Phase 2 starts

1. **Question source & types** — where do questions live, and which types must
   the player support (MCQ, multi-select, true/false, fill-in-blank, numerical,
   short/long answer, matching, assertion-reason, case-based)?
2. **Auto-grading** — objective questions auto-graded on submit; subjective
   questions sent to faculty for manual grading? Where do faculty grade?
3. **Proctoring** — what is required (tab-switch, fullscreen, webcam snapshots,
   copy/paste block)? `proctoringLogs` collection exists; is it in scope?
4. **Timed window vs. duration** — enforce `startDateTime`/`endDateTime` hard
   window, per-student duration, or both? Late join policy?
5. **Resume / disconnect** — save answers periodically so a refresh doesn't
   lose progress; resume `in_progress` tests.
6. **Results & review** — show answers/explainations immediately, only after
   grading, or only after the test window closes? Leaderboard/analytics needed?
7. **Negative marking, section timers, shuffling** — supported?
8. **Practice vs. proctored** — same flow or separate?
9. **Bulk student enrollment** — how do `studentAssessments` rows get created
   (admin bulk create already exists; confirm studentId matches the auth uid /
   student doc id used in Phase 1).

---

## 4. Suggested Phase 2 task breakdown

1. **Data-model contract** — document final collections/fields; align admin +
   student types; add indexes + rules.
2. **List & statuses** — `fetchStudentTests` joins schedule metadata; correct
   upcoming/available/ongoing/submitted/graded/missed logic.
3. **Start flow** — instructions page transitions row to `in_progress`;
   enforce window/eligibility.
4. **Test player** — load real questions from the chosen source; render all
   required question types; question palette; periodic answer autosave; timer +
   auto-submit; warnings on tab switch/fullscreen exit.
5. **Submit** — persist answers/timeSpent to `studentAssessments`
   (`submitted`); optional raw payload for audit.
6. **Grading** — auto-grade objectives; wire to faculty manual grading for
   subjectives; set `graded` with marks/percentage/grade.
7. **Result page** — read graded doc; score summary, question review, section
   analysis; empty/processing state before grading.
8. **Polish** — resume in-progress test, accessibility, empty/error states,
   remove the now-dead `studentSubmissions`/`testResults` paths.
9. **End-to-end test** with seeded data: scheduled test → student starts →
   submits → faculty grades → dashboard/grades/results reflect it.

---

## 5. Phase 1 reference points (so Phase 2 stays consistent)

- Auth identity: `useAuth()` → `user.uid`; student profile via
  `useStudentProfile(uid)` / `useCurrentStudent()`. The Firestore student
  document id is used everywhere (resolved by doc-id → `uid` → `email`).
- All student data access is centralized in
  `src/modules/student/api/studentDataApi.ts` — extend it rather than creating
  parallel APIs.
- Routes live in `src/modules/student/routes.tsx`; test flow paths are
  `/student/test/:testId/{instructions,take,result}` (and the
  `/student/assessments/:id/...` aliases).
- Build/typecheck: `npm run build` (runs `tsc && vite build`) — must stay green.
- A local `.env.local` with `VITE_FIREBASE_*` is required to run against live
  Firebase (not committed).
