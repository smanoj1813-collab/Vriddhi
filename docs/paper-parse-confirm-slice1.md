# Paper Upload Parse — Slice 1 (parse → review → confirm)

Status: implemented on `arena/01a0853f-vriddhi`. Closes the loop reported after PR #39:
a faculty PRE-ASSESSMENT PDF upload showed **0 questions / Ready to use** and the paper
never appeared in Assessments.

## Agreed model (two artefacts, one paper)

| Artefact | Where | Purpose |
| --- | --- | --- |
| Original file | `papers.filePath` (Storage) | **Print** — the photocopy. Kept untouched by everything below. |
| Structure + bank | `papers.sections[]`, `papers.questionIds[]`, `questions/*` docs | **Online** — what Assessments schedules and grades (short/long answer default → manual grading). |

**Parse is assistive. Confirm is the source of truth.**

## What changed

### Server (`functions/`)

- **`parsePaperFile`** (new callable, `src/paperParsing.ts`)
  - Reads the paper's attached file from Cloud Storage. **Digital PDF / DOCX only**
    (`application/pdf`, `...wordprocessingml.document`). Images and legacy `.doc` are
    rejected with a clear message — scanned images are Slice 2 (no OCR, never
    auto-published).
  - Extracts the text layer (`pdfjs-dist` legacy build for PDF, `mammoth` for DOCX).
    If < 120 characters of text exist it returns `status: "scanned"` instead of
    guessing.
  - Sends the text to Gemini (`gemini-2.5-flash`, strict JSON schema, temperature
    0.1) with a **transcription-only** prompt: keep printed sections/questions, copy
    printed marks (0 when absent), transcribe printed MCQ option texts, and
    **NEVER output correct answers / answer keys** — any answer-bearing field the
    model returns is stripped server-side in `normalizeParsedStructure`.
  - Returns `{ status: "parsed" | "scanned" | "unrecognized", sections, meta,
    questionCount, warnings }`. **No writes** to `papers`, `questions`, or anything
    else — only an `ai_generation_logs` audit row with `savedIds: []` (same
    do-not-auto-save pattern as `routes/ai-questions.ts`).
  - Access: paper author or a reviewer role, same college.

- **`confirmPaperStructure`** (new callable, `src/paperParsing.ts`) — the one
  server-side Confirm:
  - Re-reads the paper document (the faculty already reviewed its structure in the
    editor) — it does **not** trust client-supplied question payloads.
  - Validates strictly: 1–400 questions, marks > 0, only online-schedulable types
    (`mcq, multi_select, true_false, fill_in_blank, short_answer, long_answer,
    numerical, assertion_reason, case_based, matching`).
  - Writes the bank docs it previously owned for this paper (deletes the tagged
    `source: "paper-confirm"`, `paperId` docs, unlinks shared docs) plus the fresh
    `questions` docs (`reviewed: true`, `isAIGenerated: false`), then writes
    `papers.sections`, `questionIds` / `linkedQuestionIds`, `totalQuestions`,
    `totalMarks`, and the readiness flags, appending a `paperReviewAudit` row
    (`paper_structure_confirmed`). The original file fields are never touched.
  - Atomicity: when the write fits in one transaction, ALL of it — deletes,
    creates, paper update, audit — is ONE transaction with an
    optimistic-concurrency guard, so a failure cannot leave orphans or dangling
    `questionIds`. Only unusually large papers use a two-phase write
    (chunked batches + guarded paper update); there, owned-doc deletes are
    **delayed until after the paper update commits**, so an aborted update can
    never leave the paper pointing at deleted docs.
  - State gate (`canConfirmPaperStructure`): editable states + `not-required` +
    in-approval states for author/reviewer; `approved-by-hod` / `published` for
    reviewers only.
  - Re-confirm is idempotent (owned docs are cleaned up, new ids issued).

- **`savePaper`** (`src/paperWorkflow.ts`)
  - New exported gate `canEditExistingPaper`: besides `EDITABLE_STATES`, the
    **author** may re-open their own **file-only `not-required`** paper
    (`totalQuestions === 0`) — this was the exact unblock for "uploaded a PDF, now
    want to add questions".
  - Persists `printReady` / `onlineReady` / `bankReady` (shared helper
    `paperReadiness`) on every save.
  - Still never writes the question bank — the bank write happens only on Confirm.

- New dependencies (functions): `pdfjs-dist@3.11.174` (CJS legacy build),
  `mammoth@1.12.0`. Tests: `functions/test/paperParsing.test.ts` (extraction from a
  generated PDF + DOCX fixture, answer-stripping, caps, strict confirm validation,
  state gates, readiness flags).

### Client (`src/`)

- **`shared/utils/paperReadiness.ts`** (new) — `paperBadges` / `isPaperOnlineReady` /
  `paperQuestionCount`; prefers server flags, derives for legacy docs.
- **`shared/components/question-paper/PaperUploadEditor.tsx`**
  - Questions are now **section-based** (add/rename/remove sections; per-section
    add/edit/reorder/remove questions; option-text editor for objective types).
  - **Parse → review**: when the saved paper has a file, a "Parse file → add
    questions" button calls `parsePaperFile`; the transcribed sections land in the
    editor (replacing current questions only after an explicit confirm), every row
    is editable, and questions with `0` marks are highlighted as "required" — saving
    with missing marks fails fast with an actionable message.
  - Banners for `parsed` / `scanned` (looks like a scan — Slice 2) / `unrecognized`
    outcomes, and a persistent "nothing is saved or published until you review and
    confirm" note.
  - Primary save buttons (Save paper / Submit for approval / Approve & publish)
    call `savePaper` and, when questions exist and the action is not `draft`,
    immediately call `confirmPaperStructure` — the one server Confirm. Drafts never
    write to the bank.
  - Recovery: if the paper save succeeds but the bank sync fails, the editor
    stays open with an amber banner and a **Retry structure confirm** button that
    re-runs `confirmPaperStructure` alone (a re-save would be rejected, because a
    just-saved paper is locked from editing).
- **`faculty/pages/FacultyPapers.tsx`**
  - **Print / Online / Bank badges** on every paper card (tooltip-explained);
    a file-only paper now reads honestly: Print on, Online/Bank off.
  - Edit button unlocked for authors on file-only `not-required` papers (mirrors the
    server gate).
  - Section layout round-trips through the editor; toasts mention "structure
    confirmed and online-ready".
- **`faculty/components/TestScheduler.tsx`**
  - Paper picker now lists **only online-ready papers** (structured questions in
    `sections` or a bank link); empty state explains how to make a paper
    online-ready.

## Added after deploy: deterministic-first parsing + paper deletion

### Parse without AI (deterministic-first)

`parsePaperFile` now tries **`deterministicParse`** before any AI: a line-layout
parser (section headers, `N.` questions, `A.` option lines, `[n]`/`(n)`/`[n marks]`
marks, "Each question carries N marks" defaults, date/meta line skips) that runs
entirely on the server — **no API key, no cost, nothing leaves the server**. It
also handles numbered-cell layouts (e.g. papers printed from the `content/`
preview template): a `1.` alone on a line opens a question, and float-right marks
that lead the text in the extracted layer (`[1]The accounting equation is:`) are
recognised as that question's marks. It is
accepted when it finds ≥1 question and the recognised lines cover ≥30% of the
document text (the coverage guard defers to the AI fallback for unusual layouts).
"Recognised" means structural evidence — section headers, question starts, option
lines, marks tokens and header meta; ordinary continuation prose is absorbed into
the question text but never counted, so a few stray "1."-like lines in an unrelated
document cannot fake their way past the guard. The result is flagged
`method: 'deterministic' | 'gemini'` in the response and the `ai_generation_logs`
audit row. Faculty review + strict Confirm are identical for both methods. With no
Gemini key configured, standard-layout papers now parse anyway; only unusual
layouts degrade to manual entry (a clear `unrecognized` banner, never a crash).

### Delete paper (`deletePaper` callable + card button)

- **Who**: paper author or a reviewer (superadmin/admin/principal/HOD), same college.
- **When**: never while under review (`submitted-for-approval`/`pending-verification`);
  `approved-by-hod`/`published` reviewer-only; never while a non-cancelled
  `scheduledTests` doc references the paper (tests keep their own question copy,
  but the paper record stays linked to active tests).
- **Cleanup**: question-bank docs created by this paper's Confirm are deleted
  (tagged `source:'paper-confirm'` + `paperId`), shared bank docs only unlinked,
  the original file + answer key are removed from Storage (best effort), and a
  `paperReviewAudit` row (`paper_deleted`) records the action. Paper deletion is
  one optimistic-concurrency-guarded transaction (audit + delete); very large
  papers fall back to the same two-phase ordering as Confirm (delayed owned-doc
  cleanup, so an aborted run can never leave the paper pointing at deleted docs).
- **UI**: Faculty Papers cards show a **Delete** button (author or reviewer) with a
  confirmation dialog explaining what is removed; under-review and
  approved/published states are called out in the dialog before anything happens.

## Deliberately not done (scope guard)

- No OCR of scanned images (Slice 2); no auto-publish of anything AI-produced.
- `content/pre-assessment/*.json` is content, **not** a Firestore seed — nothing
  reads it.
- `facultyTopics` untouched (no re-application).
- No Firestore rule or index changes needed (server-side writes; client-side
  filters).

## End-to-end flow (the bug scenario)

1. Faculty uploads PRE-ASSESSMENT PDF → **Save paper** → card: *Ready to use*,
   badges **Print ✓ / Online ✗ / Bank ✗** (0 questions is now visible, not hidden).
2. Faculty clicks **Edit** (allowed: own file-only `not-required` paper) →
   **Parse file → add questions** → reviews/edits the transcribed sections, fixes
   any `0` marks.
3. **Save paper & confirm structure** → `savePaper` (sections + status) then
   `confirmPaperStructure` (bank docs + `questionIds` + flags) → badges
   **Print ✓ / Online ✓ / Bank ✓**.
4. **Assessments → Test Scheduler** now lists the paper (online-ready) and
   `scheduleAssessmentTest` accepts it (1–400 structured questions, marks > 0,
   supported types — exactly what Confirm guarantees).
