# Handoff — PYQ papers → platform question bank → college assignment → assessment

**Written:** 2026-10-02 · **Base:** `main` @ `091c6d5` (PR #100 merged) · **Status:** none of this is implemented yet.
**Audience:** a fresh Arena session / developer picking this up. Everything below was verified by reading the code at that commit; file:line references are from that revision.

> **Revision note (re-verified 2026-10-02).** An earlier draft of this handoff stated that the
> platform-PYQ read path (`fetchPlatformPyqQuestions()` / `platformPyq.ts`) was dead code. **That was
> wrong.** It is wired: `getQuestions()` merges approved platform PYQs into the college list whenever
> `filters.isPYQ === true` (`questionBankApi.ts:286-298`), and both `FacultyBankAdmin` (PYQ tab) and
> `FacultyQuestionBank` set that flag. The real gaps are its caps, missing filters and question-level (not
> paper-level) shape — see §2.5. Other corrections: seed language is `und` for 137/153 records;
> `checkJobDuplicates()` is client-side; `.zip` is handled as an archive, not via `IMPORT_CANDIDATE_EXTENSIONS`.

---

## 1. What the owner asked for (verbatim intent)

> "I need all these question papers to be added to our platform, not download PDF file. College should be able to conduct assessment using these papers."
> — plus: add the option to **assign** a paper to a college, and add a **previous year question paper block** in the **question bank**, and let it show there.

Decomposed:

| # | Requirement | Meaning |
|---|---|---|
| R1 | All PYQ papers become platform questions | Transcribe the **153 original-PDF PYQs** (plus the 50 transcribed ones already structured) into `questionBank_meta` / `questionBank_content` — no "download the PDF and read it yourself". |
| R2 | A PYQ block in the Question Bank | A visible, filterable "Previous Year Question Papers" surface inside `/admin/question-bank` where staff browse the papers/questions. |
| R3 | Colleges can see them | College staff (faculty/HOD/admin, and `employee`) open the block and see the PYQs relevant to their programmes. |
| R4 | Assign a paper to a college | Superadmin/employee picks a platform PYQ paper and assigns it to one or more colleges (audited). |
| R5 | College can conduct an assessment with it | From the assigned paper → schedule a test → students take it → marks → HOD approval. |

Standing constraint from the same owner, still in force: **PYQs carry no university attribution** (no university name, no invented exam details), and question text must never be invented — only what the source paper contains.

---

## 2. Where the data actually is today (verified)

### 2.1 The 203 prep papers
| Source | Count | Stored where | Structured questions? |
|---|---|---|---|
| Original-PDF PYQs (from PR #100) | 153 | `prep_papers` (`contentType: 'source_pdf'`, file link only) | **No** — that is R1's gap |
| Transcribed papers (pre-existing) | 50 | `prep_papers` (sections + questions) | Yes |

* Seed data: `data/pyq/drive-pyq.seed.json` (`papers[]`, 153 records; `excluded[]`, 22), `functions/src/data/prepPapers/drivePyqFiles.ts`, `drivePyqSources.json`.
* **Seed record shape** (what a batch importer gets as input):
  ```json
  { "id": "pyq-file-1dead8bff9f4cab6f5162fa4", "contentType": "source_pdf", "isPYQ": true,
    "program": "bba", "semester": 1, "subject": "AMC-106A OE-221", "language": "und",
    "sourceFile": { "fileName": "AMC-106A OE-221.pdf", "url": "https://drive.google.com/file/d/<id>/view",
                    "folderPath": "BBA/1ST SEM", "driveFileId": "<id>" },
    "source": { "publisher": "User-provided PYQ collection", "note": "… University not assigned …" },
    "status": "published" }
  ```
  * Programmes: `open-electives` 64, `bba` 27, `bsw` 26, `ug-open-elective` 26, `languages` 10.
  * **Language is `und` (undetermined) for 137 of 153**; only 8 are `en` and 8 are `kn`. The importer must detect language from the paper itself, not trust the seed.
  * `subject` is derived from the **file name** (often a course code such as `AMC-106A OE-221`), not a clean subject name. Treat it as a label, not a join key.
* Public reader: `/prep/papers` (`src/modules/prep/PrepPapersViews.tsx`). `isOriginalPdfPaper()` gates the "Open original PDF" button and blocks answer/MCQ generation for file-only rows.
* Studio panel (the screenshot the owner shared): `src/modules/admin/components/PrepContentStudioTab.tsx` — read-only list + one-paper JSON editor + "Open public library".

`prep_papers` is a **prep/study catalogue**. It is *not* what assessments read. Do not try to schedule a test from a `prep_papers` row.

### 2.2 The two question stores
1. **College bank** — `questions/{id}` (`collegeId` set). Read/written by `src/modules/admin/api/questionBankApi.ts` (const `QUESTIONS_COLLECTION`). Bulk import UI: `src/modules/admin/components/question-bank/BulkImportModal.tsx` (CSV, `isPYQ`, `examYear`, `examName`).
2. **Platform pool** — `questionBank_meta/{id}` (list view + status) + `questionBank_content/{id}` (full payload). `collegeId: null` = platform-wide. Written by the import pipeline and the seeder; read by the review queue and by the college PYQ bridge (§2.5).

Rules (`current-firestore.rules`):
```
:1655  match /questionBank_meta/{docId} {
         allow read:  if isSignedIn() && (isSuperadmin() || isStaff());
         allow write: if isSuperadmin() || isCollegeStaff();      ← too loose (see §6)
       }
:1662  match /questionBank_content/{docId} { same }
```
`isStaff()` (`:123`) already includes `employee` and excludes suspended employees (`employeeSuspended()`, `:118`).

### 2.3 The transcription engine already exists (superadmin-only)
`functions/src/questionImport.ts` + `functions/src/routes/questionImport.ts`:

* **Endpoints** (superadmin only, each behind `importWorkerLimiter`):
  `POST /question-import/jobs` (reserve job + archive path) · `POST /question-import/jobs/:id/run` (one unit of work) · `GET /question-import/jobs/:id` · `POST /question-import/jobs/:id/retry`.
* **One unit of work per call** — the Express `api` function has a 60 s timeout, so the browser drives the loop; progress is resumable. Keep this pattern.
* **Inputs** — single documents `.pdf`, `.docx`, `.doc`, `.png`, `.jpg`, `.jpeg` (`IMPORT_CANDIDATE_EXTENSIONS`, `questionImport.ts:77`), or a `.zip` of them (archive path, `questionImport.ts:79-95`, bounded by `IMPORT_MAX_ARCHIVE_BYTES`).
* **Two pipelines** — digital text first (`extractPaperText`, free) and **AI vision for scans** (`buildVisionImportPrompt`, `questionImport.ts:528`); the vision prompt already forces real Unicode Kannada for Kannada papers and forbids inventing content.
* **Output shape** — `buildImportDraftDocs()` (`questionImport.ts:718`) writes meta+content with `status: 'pending'`, `isPYQ: true`, `collegeId: null`, `tags` incl. `pyq` / `exam-YYYY`, `examYear`, `examName`, `searchKeywords`.
* **UI** — Superadmin → Question Bank → **"Import papers (ZIP / PDF)"** → `src/modules/superadmin/components/PaperImportPanel.tsx` (upload, run loop, duplicate check, `rejectQuestions`). Client API: `src/modules/superadmin/api/questionImportApi.ts` — note **`checkJobDuplicates()` is a client-side pass** (`questionImportApi.ts:170`) over the pool after a job, not a server function.
* **Review** — imported rows land `pending`; the Review Queue (`src/modules/admin/components/ReviewQueue.tsx`, `questionReviews`) approves/rejects. Nothing reaches colleges until approved.
* **Cost logging** — `ai_generation_logs` is written from `functions/src/routes/questionImport.ts` (also `paperParsing.ts`, `routes/ai-questions.ts`).

### 2.4 The paper → test chain (R5 groundwork, already working)
```
papers/{id}  (embedded sections[].questions[] OR linkedQuestionIds/questionIds)
   ↑ savePaper (callable, functions/src/paperWorkflow.ts) — draft → submitted-for-approval → approved-by-hod/published
   ↓ scheduleAssessmentTest (callable, functions/src/studentAssessments.ts:1619)
scheduledTests/{id}  (+ assessmentQuestions subcollection snapshot)
   ↓ loadTestQuestions()  studentAssessments.ts:266   (reads: subcollection → test.questions[] → papers/{id}.sections → linked questions)
```
* `papers/{id}` question shape: `{ number, text, type, marks, topic, options: [{id,text}] }` (`paperWorkflow.ts`, `normalizeQuestionOptions`).
* Scheduling UI: `/admin/schedule-tests` → `src/modules/faculty/pages/FacultyAssessments.tsx` (alias `OnlineAssessmentScheduler` in `src/modules/admin/routes.tsx:31,149`); API `scheduleTest()` in `src/modules/admin/api/assessmentsApi.ts`.
* After publish, `src/modules/faculty/pages/FacultyPapers.tsx:699` already links to the scheduler.

### 2.5 What is missing / broken (the real to-do list)
1. **The 153 PDF PYQs have no questions.** R1 = run them through the import pipeline (vision), then review+approve.
2. **The platform-PYQ bridge exists but is too narrow for a "PYQ papers" surface.** It *is* wired:
   * `getQuestions()` (`questionBankApi.ts:286-298`) calls `fetchPlatformPyqQuestions(filters)` (`:79`) when `filters.isPYQ === true`, and prepends the platform rows (read-only, `isPlatform: true`) to the college rows.
   * Callers that set `isPYQ`: `FacultyBankAdmin.tsx:182` (PYQ tab, `pyqMode` at `:112`, tab at `:421`; mounted from `UniversalQuestionBank.tsx` and `QuestionBankManager.tsx`) and `src/modules/faculty/pages/FacultyQuestionBank.tsx:223`.
   * `getPYQExamYears()` / `getPYQExamNames()` (`:759`, `:791`) also merge platform facets via `loadPlatformPyqMetas()` (`:68`).
   * `FacultyBankAdmin` already hides Edit/Delete/Link for `isPlatform` rows (`:323`, `:714`, `:784`, `:791`).

   Its limits — this is what R2/R3 must fix:
   * **Hard caps:** `loadPlatformPyqMetas()` reads at most **200** metas (`limit(200)`), `fetchPlatformPyqQuestions()` returns at most **50**, and only on the **first page** (`!lastDoc`). Once ~150 papers × ~20–40 questions are approved, most of the pool is invisible.
   * **One N+1 read per row** to `questionBank_content` for the text.
   * **Filters:** only `examYear`, `examName`, and `subject` (compared against `subjectName || subjectId`). No programme, semester, language or source-paper filter.
   * **Question-level only:** no grouping by source paper, so there is no "paper" a college can browse, preview or schedule as a whole.
   * **No `collegeId` check:** `isPlatformPyqMeta()` (`platformPyq.ts:74`) only checks `status` + `pyq`. Combined with the loose write rule (§6), a college-written approved PYQ meta would appear in *every* college's PYQ tab.
   * `total` / `totalPages` in the `getQuestions()` result ignore the merged platform rows.
3. **No assignment concept.** Nothing maps a platform paper/question to a college. R4 is new work.
4. **Role gaps for employees.** `studentAssessments.ts:126 resolveStaff` allows `superadmin|admin|principal|hod|faculty|mentor` and `:120 requireAssessmentManager` allows `superadmin|admin|principal|hod|faculty` — **`employee` is absent**, so the Vriddhi-employee role shipped in PR #100 cannot schedule a test yet. `paperWorkflow.ts:14 PAPER_ROLES` (`superadmin|admin|principal|hod|faculty|mentor`) also lacks `employee`.
5. **`questionBank_meta` write rule is too loose** (`isCollegeStaff()` may write the platform pool).

---

## 3. Recommended design

### R1 — Transcribe the PDFs into the platform pool (do this first)
Reuse the existing engine; add a **batch mode** rather than 153 hand uploads:

* New callable (or route) `importPyqBatch` — superadmin/employee only — that reads records from `data/pyq/drive-pyq.seed.json` `papers[]` (or an explicit list of `sourceFile.driveFileId`s), fetches the PDF server-side (public Drive file links; convert `/file/d/<id>/view` to a direct-download URL), and runs the *same* single-document parse path as the existing import.
  * Why a server fetch: the agent sandbox cannot download Drive binaries (TLS blocked), but Cloud Functions can; the browser-upload path also works today via `PaperImportPanel` if the operator has the PDFs locally (a `.zip` is accepted).
  * Keep the one-unit-per-call + limiter design: process N documents per call (start with 3–5) and return progress so the client can resume.
* **Metadata comes from the seed**, not the operator: `program`, `semester`, `sourceFile.fileName`, `sourceFile.driveFileId` → store as `sourceDriveFileId` and `sourcePaperId` (the seed `id`) on every meta doc so questions can be grouped back into a paper. Per the standing rule — **no `university`, no `examName` beyond what the paper itself shows**. Set `examYear` only when the paper's cover states it; otherwise leave `''` and add no `exam-YYYY` tag. `buildImportDraftDocs` currently takes `defaults.examYear`/`examName`; pass blanks deliberately.
* **Language**: 137/153 seed rows are `und`. Detect from the transcribed text (Kannada Unicode range `U+0C80–U+0CFF`) and write the detected value; keep the seed value only when it is `en`/`kn`. Kannada papers must come out as Unicode Kannada (the vision prompt already enforces this). Verify with one of the 8 known `kn` papers before the bulk run.
* **Idempotency**: dedupe on `sourceDriveFileId` (the seed has `duplicateFileIds: 0`, and `subject` is filename-derived, so the file id alone is the stable key). A re-run must skip, not duplicate. Do this server-side (query meta by `sourceDriveFileId` before parsing); the existing client-side `checkJobDuplicates()` remains a text-similarity safety net, not the idempotency guarantee.
* **Pilot**: run **10 papers first** (mix of digital-text and scanned, incl. at least one `kn`), approve them in the Review Queue, eyeball the question text/marks. Only then run the remaining ~143. This is the single biggest quality risk in the whole plan.
* **Cost**: digital PDFs are free (text extraction); scans cost vision tokens. `ai_generation_logs` already records token counts per call — read it after the pilot and extrapolate before committing to the bulk run. Do not start the bulk run without that number.
* **Reality check to put in the UI**: handwriting/scans will not transcribe perfectly. Rows that fail or look poor stay PDF-only in `prep_papers` (`contentType: 'source_pdf'`) with a recorded reason rather than being published as an assessment-ready paper with wrong text.

### R2/R3 — The PYQ block in the Question Bank
* New block/tab in `/admin/question-bank` (`src/modules/admin/pages/QuestionBank.tsx` is a 3-tab shell: `College Bank | Universal Bank | Review Queue`, `initialTab` = `college | universal | review`, `:20-40`, tabs at `:88-90`; deep links already pass `initialTab`, e.g. `/admin/universal-bank`, `/admin/review-queue`).
  * Recommended: a **4th tab "Previous Year Papers"** (paper-level view) plus a compact **block at the top of the existing "PYQ Questions" tab** in `FacultyBankAdmin.tsx:421` linking to it, so the owner's expectation ("in question bank … let it show it there") is met in both places.
* Data source: **extend** the existing bridge rather than build a second one:
  * Add a paper-level loader that groups approved `questionBank_meta` rows (`tags array-contains 'pyq'`) by `sourcePaperId`, with real pagination instead of the 200/50/first-page caps. If the pool outgrows client-side grouping, write a server-side `pyqPapers/{sourcePaperId}` summary doc at approval time (counts, programme, semester, language, marks total) and list that instead.
  * Add the visibility predicate the bridge lacks: `collegeId == null` OR `collegeId == myCollege` OR assigned-to-my-college (R4).
  * Keep the question-level bridge in `getQuestions()` for the existing PYQ tab, but lift its caps and add the new filters.
* Filters: programme, semester, subject, exam year (only where known), language, source (PDF-only vs transcribed). Extend `getPYQExamYears` / `getPYQExamNames` for the new facets.
* Row actions: preview the questions (read-only, `isPlatform: true` hides Edit/Delete), **"Use in a paper"** (copies into a college `papers/{id}` draft), and **"Open original PDF"** for rows that are still file-only.
* Students must **not** read `questionBank_meta` (rules already restrict it to staff).

### R4 — Assign a paper to colleges
**Recommended: copy-on-assign.** A platform paper stays immutable; assigning it creates a *college-owned copy* so existing rules, existing schedulers and existing HOD approval all work unchanged.

* Callable `assignPaperToColleges({ sourcePaperId | bankQuestionIds, collegeIds[], dueAt? })` — superadmin + `employee`:
  1. Load the platform paper (assemble from `questionBank_meta` + `questionBank_content` rows with that `sourcePaperId`, or from selected ids).
  2. For each target college write `papers/{newId}` with `collegeId`, `assignedFrom: { sourcePaperId, assignedBy, assignedAt }`, `status: 'draft'`, `verificationStatus: 'draft'`, `createdBy: request.auth.uid`. A client write would have to satisfy the `papers` create rule (`current-firestore.rules:1113-1117`: `isCollegeStaff() && sameCollege(...) && createdBy == uid && status == 'draft' && verificationStatus == 'draft'`), which an employee can only meet for their *active* college. For multi-college assignment in one call, **write with the Admin SDK** (bypasses rules) after verifying the caller (superadmin, or employee assigned to each target college) — consistent with `assignEmployeeColleges` (`functions/src/employeeAccess.ts:77`).
  3. Write an audit row (`logs/{id}`: `action: 'assignPaperToColleges'`, sourcePaperId, collegeIds, actorUid).
* Alternative considered and **not** recommended: a `colleges: string[]` visibility array on the platform paper. It would need rules changes on `papers` read paths and touches every scheduler/list query; the copy is cheaper and keeps HOD approval per college meaningful.
* UI: in the new PYQ tab, row action **"Assign to colleges…"** (dialog with a college multi-select, mirroring `src/modules/superadmin/pages/PlatformEmployees.tsx`'s Autocomplete) → writes the copies → success message with the count. Colleges then see the paper in their Papers list and can schedule it.
* Where it lands for the college: `papers` list in `/admin/paper-review` / faculty Papers, `PaperLinkageModal`, then `/admin/schedule-tests`.

### R5 — College conducts the assessment
Already possible once the paper exists in the college:
1. Paper (assigned copy) → `FacultyPapers` publish flow (`savePaper` → review → `published`; HOD approval is `APPROVE_ROLES = ['superadmin','admin','hod']` in `functions/src/routes/papers.ts:17`).
2. `/admin/schedule-tests` → `scheduleTest()` → `scheduleAssessmentTest` callable → `scheduledTests` + `assessmentQuestions` snapshot.
3. Students take it (`studentAssessments.ts`), marks come back, grade drafts → **HOD approval** (the boundary shipped in PR #100: employees draft, institution publishes).

**Required fix:** add `'employee'` to `resolveStaff` and `requireAssessmentManager` in `functions/src/studentAssessments.ts:120-139`, and to `PAPER_ROLES` in `functions/src/paperWorkflow.ts:14` — keeping `employee` *out* of `APPROVE_ROLES`.

---

## 4. Implementation order (each step shippable)

| Step | Deliverable | Files |
|---|---|---|
| 1 | Batch import callable + resume/progress + server-side dedupe on `sourceDriveFileId` + language detection | `functions/src/questionImport.ts`, new `functions/src/pyqImport.ts`, `functions/src/index.ts` export, `functions/src/routes/questionImport.ts` (or a new router) |
| 2 | Batch UI (pick from the 153 seed records, run, watch progress) | new `src/modules/superadmin/components/PyqBatchImportPanel.tsx`, mounted next to `PaperImportPanel` in the superadmin Question Bank |
| 3 | Pilot 10 → review → measure cost → run the rest | Review Queue (`ReviewQueue.tsx`), `ai_generation_logs` |
| 4 | Extend the platform PYQ read path (caps, pagination, new filters, `collegeId` predicate, paper grouping) | `src/modules/admin/api/questionBankApi.ts:60-100, 286-298, 745-810`, `src/modules/admin/utils/platformPyq.ts` |
| 5 | "Previous Year Papers" tab + block in the Question Bank | `src/modules/admin/pages/QuestionBank.tsx`, `src/modules/admin/components/question-bank/FacultyBankAdmin.tsx:411-450`, new `PreviousYearPapersPanel.tsx`; route in `src/modules/admin/routes.tsx` if a deep link is wanted |
| 6 | Assignment callable + dialog + audit | new `functions/src/paperAssignment.ts`, `src/modules/admin/api/paperAssignmentApi.ts`, dialog component |
| 7 | Role gaps for `employee` | `functions/src/studentAssessments.ts:120-139`, `functions/src/paperWorkflow.ts:14` |
| 8 | Rules + tests + docs | `current-firestore.rules` (§6), tests (§7), `docs/` update |

---

## 5. Acceptance criteria (map back to the owner's words)

* [ ] Every one of the 153 PYQ records has either **approved structured questions** in the platform pool **or** is explicitly marked PDF-only with a reason (scan quality) — no silent gaps. A count query on `questionBank_meta` (`tags: 'pyq'`, `sourceDriveFileId` present) proves it.
* [ ] Opening `/admin/question-bank` shows a **Previous Year Papers** surface with the papers, filterable by programme/semester/subject/year/language; rows preview questions without any PDF download — and all approved papers are reachable (no 200/50 cap).
* [ ] A college (faculty/HOD/admin) sees the PYQs for its programmes, including platform-assigned ones, and cannot see other colleges' private papers or PYQs.
* [ ] Superadmin (and `employee` for their assigned colleges) can **assign a paper to one or more colleges**; the assignment is logged; each college gets its own editable/schedulable copy.
* [ ] From an assigned paper, the college can **schedule an assessment** (`/admin/schedule-tests`), students can take it, marks come back, and **HOD approval** gates publication.
* [ ] No PYQ anywhere displays a university name or an invented exam detail.
* [ ] `npm run test:unit`, `npm --prefix functions run test:unit`, `npm run build`, `npm --prefix functions run build` all pass; rules tests updated if rules change.

---

## 6. Security / rules work

1. **Tighten `questionBank_meta` / `questionBank_content` writes** (`:1655-1665`): `allow write: if isSuperadmin() || (role() == 'employee' && isStaff())` (use whatever role helper the file already defines). Colleges must not write the platform pool; they write their own `questions` / `papers`. Until this lands, also add the `collegeId == null || collegeId == myCollege` predicate client-side (§2.5 #2).
2. **`papers` copy-on-assign** is written by the Admin SDK (callable) after the caller is verified as superadmin or employee-assigned-to-the-college. Add `assignedFrom` to the doc and refuse client updates to it.
3. **Read scoping for the new tab** stays client-side over `questionBank_meta`, which is already staff-only. If per-college assignment rows are added (e.g. `paperAssignments/{collegeId__paperId}`), give it `allow read: if isCollegeStaff() && collegeId() == resource.data.collegeId; allow write: if false` (server-written).
4. **Audit**: every assignment writes `logs/{id}` (existing pattern from `employeeAccess.ts`).
5. `isStaff()` already includes `employee` and blocks suspended employees (`employeeSuspended()`, PR #100); the new callables must apply the same checks server-side (custom claim `employeeStatus`).

---

## 7. Tests to add

* `functions/test/pyqImport.test.ts` — seed-record → import defaults mapping (no university, blank year when unknown, `und` → detected language), dedupe key, skip-on-rerun.
* `functions/test/paperAssignment.test.ts` — copy-on-assign produces a valid `papers` doc (sections/questions shape, marks totals validate via `paperWorkflow`'s input validation), audit row, role refusal for faculty/student.
* `src/modules/admin/utils/platformPyq.test.ts` — extend for the new filters (programme/semester/language), the `collegeId` / assigned-to-my-college predicate, and paper grouping.
* `functions/test/firestore.rules.test.ts` — new block: college staff read approved platform PYQs, cannot read another college's assigned copy, cannot write `questionBank_meta`.
* Frontend render/unit test for the new tab's empty/loading/filtered states.

---

## 8. Facts worth not rediscovering

* The college PYQ bridge **is live** (`getQuestions()` → `fetchPlatformPyqQuestions()` when `isPYQ`), capped at 200 metas / 50 rows / first page. Extend it; do not build a parallel one.
* `papers` create rule requires `createdBy == request.auth.uid` and `status == 'draft'` and `verificationStatus == 'draft'` — any client assignment path must satisfy all three, or use the Admin SDK.
* `loadTestQuestions()` precedence: `scheduledTests/{id}/assessmentQuestions` → `test.questions[]` → `papers/{id}.sections` → `papers/{id}.linkedQuestionIds`. A paper with neither sections nor links schedules to an **empty test** — validate before scheduling.
* `paperWorkflow` caps papers at 400 questions / 10 options.
* Seed: 153 papers, `language: 'und'` on 137, `subject` is filename-derived, `driveFileId` unique.
* `prep_papers` visibility is per-college only for *company prep* (`CompanyPrepVisibilityPanel`); the prep/PYQ library itself is platform-wide by design. If the owner later wants per-college hiding of PYQs, that is the panel to mirror.
* The agent sandbox **cannot** download Drive PDFs (TLS blocked) — do the fetching inside Cloud Functions, not locally.
* Do not seed/deploy without an explicit instruction; seeding writes live data.

---

## 9. Open questions for the owner (ask before building R4, not before R1)

1. **Assignment granularity** — assign a whole *paper*, or individual *questions* from the PYQ pool, or both? (Recommend: paper first.)
2. **Who approves a college's assigned copy** — the college's HOD (current paper flow), or is platform-assigned content pre-approved so the HOD only approves marks? (Recommend: pre-approved content, HOD approves marks.)
3. **Do the 50 transcribed papers get assignments too**, or only the 153 PDF-origin ones?
4. **Which programmes first** if the bulk transcription is staged (suggest Open Electives 64 + BBA 27 + BSW 26 — the largest seeded sets).

---

## 10. Copy-paste start for the next session

> Continue from `main` (≥ `091c6d5`). Read `docs/HANDOFF_PYQ_TO_COLLEGE_ASSESSMENTS.md` first. Implement steps 1–3 (batch PYQ transcription into `questionBank_meta`/`questionBank_content` reusing `functions/src/questionImport.ts`, with a superadmin/employee batch panel, server-side dedupe on `sourceDriveFileId`), pilot 10 papers, then report the cost from `ai_generation_logs` before doing the rest. Note the college PYQ bridge in `questionBankApi.ts` is already live — extend it in step 4, don't duplicate it. Do not deploy or seed anything without an explicit instruction.
