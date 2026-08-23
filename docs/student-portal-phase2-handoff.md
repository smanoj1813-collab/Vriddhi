# Student Portal — Phase 2 (Test / Assessment Engine) — BUILT

Phase 1 PR: #9 · Phase 2 branch: `arena/01a02d11-vriddhi` · Status: **implemented** (2026-08-23)

Phase 1 delivered login, auth, dashboard, attendance, grades, timetable, fees,
materials, library, events, notifications, settings, and assignment submission
against real Firestore data. **Phase 2 is the end-to-end test/assessment
engine** described below — built, type-checked and wired to the authoritative
data model. This document is now the contract + test plan for the work.

---

## 0. Decisions taken (2026-08-23)

| Decision | Choice |
|---|---|
| Authoritative flow | `assessments → scheduledTests → studentAssessments`; `studentSubmissions` **kept** as raw audit copy; `testResults` **dropped** (dead — no longer read or written) |
| Question source | `scheduledTests/{id}/assessmentQuestions` subcollection (frozen snapshot at schedule time; inline + paper fallbacks for legacy data) |
| Question types | Full set: mcq, multi_select, true_false, fill_in_blank, numerical, short_answer, long_answer, assertion_reason, case_based, matching |
| Grading | Hybrid — objective auto-graded on submit (shared core); subjective queued for faculty (`gradeAssessment` flips row to `graded`) |
| Proctoring | Basic browser: tab-switch/blur detection + warnings, fullscreen enforcement, copy/paste/right-click/shortcut blocking; events → `proctoringLogs` + row + audit copy |
| Timer | Per-student duration from `startedAt` (no hard window); autosave every 15 s; resume `in_progress` attempts; auto-submit on expiry |
| Results | Visible only once graded (objective-only papers grade instantly on submit; mixed papers show "awaiting grading") |

---

## 1. The data contract

```
assessments/{id}                                paper metadata (admin flow)
scheduledTests/{testId}                         scheduling: duration, window (display), instructions,
                                                status, totalStarted/totalSubmitted counters
scheduledTests/{testId}/assessmentQuestions/*   FROZEN question snapshot ← authoritative source
studentAssessments/{saId}                       one row per student per test:
                                                not_started → in_progress → submitted → graded
studentSubmissions/{id}                         raw audit copy written on submit (kind: "test")
proctoringLogs/{id}                             individual proctoring events (immediate, best-effort)
```

### studentAssessments fields (Phase 2 additions in bold)

| Field | Written when | Notes |
|---|---|---|
| `testId` | row creation | scheduledTests id (authoritative link) |
| `assessmentId` | row creation | legacy compat (may equal testId or point at `assessments`) |
| `status` | lifecycle | `not_started \| in_progress \| submitted \| graded` |
| `startedAt` | start | ISO string; timer = startedAt + duration·60 000 |
| `answers[]` | autosave/submit | `StudentAnswer[]` (questionId, selectedOptionId(s), textAnswer, numericalAnswer, isFlagged, …) |
| `timeSpent` | autosave/submit | seconds |
| **`autoScore` / `autoMax` / `manualMax`** | submit | objective score vs available; manual marks pending |
| **`needsManualGrading`** | submit | true when ≥1 attempted subjective question |
| **`objectiveCorrectCount` / `objectiveIncorrectCount`** | submit | |
| **`questionResults[]`** | submit | per-question review rows (yourAnswer, correctAnswer, explanation, status) |
| `marksObtained` / `percentage` / `grade` / `gradePoint` | grading | set instantly if fully objective, else by faculty `gradeAssessment` |
| **`proctorEvents[]`** | autosave/submit | buffered basic-proctoring events (last 100) |

Lifecycle writes:
- **Start** (instructions page): ensure row (idempotent, keyed `collegeId+studentId+testId`,
  falls back to `assessmentId`) → `status: in_progress`, `startedAt`; `scheduledTests.totalStarted` +1.
- **Autosave** (player, 15 s): `answers`, `timeSpent`, `proctorEvents` — in_progress only.
- **Submit**: auto-grade via shared core → `submitted` (+ `graded` immediately when
  fully objective with marks/percentage/grade) + audit copy in `studentSubmissions`
  + `scheduledTests.totalSubmitted` +1.
- **Grade** (faculty/admin): existing `gradeAssessment` sets final marks → `graded`.
  Result page, dashboard and grades page all read the same row.

Answer-key hygiene: `fetchActiveTest` **strips** `correctAnswer`, `isCorrect` and
`explanation` from every question before the paper reaches the browser; they are
only returned by `fetchTestResult` after the row is graded.

## 2. What changed (files)

**Engine (new/rewritten)**
- `src/shared/utils/assessmentGrading.ts` — **new** shared grading core (objective
  auto-grading for mcq/multi_select/true_false/numerical/fill_in_blank/assertion_reason;
  subjective → pending; negative marking; grade derivation).
- `src/modules/student/api/testApi.ts` — **rewritten**: resolveTest, ensureRow,
  fetchTestInstructions, startStudentAssessment, fetchActiveTest (key-stripped,
  resume-aware), autosaveStudentAssessment, submitStudentAssessment (auto-grade +
  audit copy), fetchTestResult (graded/pending states + leaderboard from sibling
  graded rows, client-sorted), logProctorEvent. No `testResults` access anywhere.
- `src/modules/student/api/studentDataApi.ts` — `fetchStudentTests` now batch-joins
  `scheduledTests` (primary) / `assessments` (legacy) in chunks of 30, and returns
  `testId`, `canStart`, `canResume`, `needsManualGrading`.
- `src/modules/student/types/assessment.ts` — `multi_select` type, case/tolerance/
  matchPairs/review fields, `ActiveTest` resume fields, `TestInstructionsData`,
  `SubmitOutcome`, `BasicProctorEvent`.

**Pages**
- `TestInstructionsPage.tsx` — real scheduledTest metadata, live row state
  (Start / Resume / View Result), agreement → `startStudentAssessment`.
- `ActiveTestPage.tsx` — rewritten player: resume with restored answers, per-student
  timer from `startedAt`, 15 s autosave (+ manual save), question palette/flags,
  all question types via `QuestionRenderer`, proctoring listeners (visibility/blur/
  fullscreen/copy/paste/contextmenu/keys) with warnings + counters, auto-submit,
  enter-gate for fullscreen gesture.
- `TestResultPage.tsx` — reads the graded row: score card, section analysis,
  question-wise review (answers + explanations revealed only when graded),
  leaderboard; "Submitted — awaiting grading" state for mixed papers.
- `StudentTestDashboard.tsx` — Resume button, awaiting-grading badge, status logic
  from the authoritative lifecycle.

**Hooks / cleanup**
- `useStudentTests.ts` — delegates to `fetchStudentTests` (single source of truth).
- `useTestResult.ts` — thin adapter over `fetchTestResult`.
- **Deleted dead legacy paths**: `hooks/useActiveTest.ts`, `hooks/useAssessment.ts`
  (student-module duplicate), `pages/TestDashboard.tsx`,
  `components/{TestInterface,TestTaking,TestResults,TestResultView,UpcomingAssessments}.tsx`,
  barrel pruned (`assessment/index.ts`). Also removed in the pre-Phase-2 cleanup:
  `src/shared/api/studentApi.ts`.

**Admin write-side**
- `src/modules/admin/api/assessmentsApi.ts` — `scheduleTest()` now snapshots the
  paper's questions into `scheduledTests/{id}/assessmentQuestions` (embedded
  sections first, then `linkedQuestionIds` → `questions`) and back-fills
  `totalQuestions`; `autoGradeStudentAssessment()` is a real implementation on the
  shared grading core (grades instantly when nothing needs faculty, otherwise
  persists the objective score and keeps `submitted`).

**Infra**
- `firestore.indexes.json` — new composites for `studentAssessments`:
  `(collegeId, studentId, createdAt desc)`, `(collegeId, studentId, status)`,
  `(collegeId, testId, studentId)`, `(testId, status, marksObtained desc)` (leaderboard).
  Deploy with `firebase deploy --only firestore:indexes`.
- `scripts/seed-phase2-assessment.mjs` — seeds a full mixed-type paper + snapshot +
  optional studentAssessments row (see §4).

## 3. Security rules — status & next step

Deployed rules (`current-firestore.rules`) intentionally remain "any signed-in
user read/write; roles enforced app-layer" until `users/{uid}.role` is trusted —
tightening them per-collection now would silently break admin/faculty flows that
rely on the open baseline. The client already enforces the intended shape
(only the student's own row is written; keys are stripped pre-submit). When role
trust lands, add before the catch-all:

```js
match /studentAssessments/{saId} {
  allow read: if isSignedIn()
                && (resource.data.studentId == request.auth.uid
                    || request.auth.token.role in ['admin', 'faculty', 'superadmin']);
  allow create: if isSignedIn() && request.resource.data.studentId == request.auth.uid;
  allow update: if isSignedIn() && resource.data.studentId == request.auth.uid
                && request.resource.data.status in ['in_progress', 'submitted']
                && !request.resource.data.diff(resource.data).affectedKeys()
                     .hasAny(['marksObtained', 'percentage', 'grade', 'gradePoint', 'gradedBy']);
  allow write: if isSignedIn() && request.auth.token.role in ['admin', 'faculty', 'superadmin'];
}
```

(Note: Firestore ORs overlapping matches with the existing catch-all, so this only
becomes enforcement when the catch-all write is removed — do that as its own PR.)

## 4. Seeded end-to-end test plan

```bash
# 1. seed (needs a service account with Firestore write access)
GOOGLE_APPLICATION_CREDENTIALS=./sa.json \
NODE_PATH=./functions/node_modules \
node scripts/seed-phase2-assessment.mjs --college <COLLEGE_ID> --student-email <STUDENT_EMAIL>

# 2. run the app against the same project
npm run dev   # with .env.local VITE_FIREBASE_* pointing at the project
```

Manual walkthrough (expected results):
1. Login as the seeded student → **Assessments** → the seeded test shows as
   *available* with Start Test.
2. **Instructions** → shows real title/duration/marks/question types → agree →
   Start → row flips to `in_progress` with `startedAt`; re-opening shows **Resume**.
3. **Player** → enter-gate requests fullscreen; answer an mcq, multi-select, a
   numerical, fill-in-blank, a short answer; flag one; wait 15 s → console row
   `answers` updates (check Firestore); refresh mid-test → resumes with answers
   intact and the timer continues from `startedAt` (not restarted).
4. Tab-switch once → warning chip + `proctoringLogs` doc appears; try Ctrl+C → blocked.
5. **Submit** → row = `submitted` + `needsManualGrading: true` + `autoScore` set +
   `studentSubmissions` audit doc (kind `test`) exists → result page shows
   *Submitted — awaiting grading* (no answers revealed).
6. Faculty/admin: grade the row (`gradeAssessment` with final marks) → dashboard
   shows score/grade, **grades** page includes it, result page shows the full
   review + explanations + leaderboard (once ≥2 students graded).
7. Seed a second objective-only paper (drop the short/matching questions from the
   script) → submit → flips straight to `graded` with marks/percentage/grade.
8. Timer expiry: start a 1-minute test (`--minutes 1`) and wait → auto-submit fires
   (`proctorEvents` includes `auto_submit`) and lands on the result state.

## 5. Known follow-ups (not blockers)

- Faculty grading UI: the contract is ready (`status: submitted` +
  `needsManualGrading: true` rows with per-question answers); a dedicated grading
  queue screen is the natural next PR.
- `scheduledTests.totalStarted/totalSubmitted` use `increment()` and may drift if a
  student's row was created outside the engine — acceptable for dashboards.
- Browser clock is trusted for the timer (rules above + audit trail mitigate abuse;
  server-side enforcement would need Cloud Functions).
- Legacy `studentAssessments` rows without `testId` still resolve via
  `assessmentId` (both `scheduledTests` and `assessments` checked) — no migration
  required, but new rows always set `testId`.
