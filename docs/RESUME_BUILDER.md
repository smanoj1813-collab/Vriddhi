# Resume Builder add-on — design, API, data model, operations

_Ships with the "Placement Pack" (see `RESUME_BUILDER_ADDON_COSTING_2026-09-25.md` for the
pricing case). This document is the engineering reference._

## 1. What a student gets

| Feature | Where | Notes |
| --- | --- | --- |
| 5 ATS-friendly templates | `functions/src/resume/templates.ts` | Classic · Modern · Compact · Fresher · Executive. One document structure, five stylesheets. Single column, no tables/images/icons/columns, standard headings, Inter / Source Serif 4 at 9.5–10.5 pt. |
| Form editor with autosave | `src/modules/student/pages/StudentResumePage.tsx`, `components/resume/ResumeEditor.tsx` | Contact, summary, education, experience/internships, projects, skills (grouped), certifications, achievements, languages. Sections reorderable. Autosave 1.5 s after typing stops; a copy is kept in `localStorage` so a dropped connection never loses work. Prefilled from the student record on first visit. |
| Live preview | `POST /resume/preview` → `<iframe sandbox srcdoc>` | The **same HTML Chrome prints**, watermarked "VRIDDHI PREVIEW", with A4 page guides. Free and unlimited. |
| ATS readiness score | `src/shared/utils/resumeAts.ts` | Rule-based, runs in the browser: contact fields, summary length, education, bullets with action verbs and numbers, skills count, first-person prose, length/pages, date consistency, emoji/symbols, and keyword coverage against a pasted job description. Wording says "guidance", never "certified". |
| PDF download | `POST /resume/pdf` | Costs **one credit** for the selected template. Real text PDF (Puppeteer → Chrome print, fonts embedded). Never rasterised in the browser. |
| Free re-downloads | `GET /resume/downloads/:id/file` | Every generated version is listed with its date and size. |
| AI rewrite (optional) | `POST /resume/ai/improve` | Gemini, only if the college enabled it; capped per student per year. Summary / headline / single bullet. |

## 2. Credits

* `downloadsPerTemplate` credits per template per **academic year** (`creditCycleKey`: June → May,
  e.g. `2026-27`). Default 3 → 15 PDFs per student per year. Superadmin can set 1–10.
* Reserved **inside the Firestore transaction** that authorises the render, before Chrome is
  launched (`reserveCredit` in `functions/src/resume/model.ts`). Two simultaneous clicks cannot
  both pass; a failed render or upload releases the credit in a second transaction
  (`releaseCredit`) and marks the ledger row `failed`.
* Nothing about credits is trusted from the request; the client only displays what
  `GET /resume/me` reports.
* A superadmin can hand credits back per student (`POST /resume/admin/credits/reset`), for all
  templates or one, logged in `resumeAudit`.

## 3. HTTP API (`api` function, mounted at `/api/resume` and `/resume`)

All routes require a Firebase ID token with a `role` claim (`verifyAuth`). Students act on their
own `uid`; superadmins may pass `collegeId` to try the feature.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/resume/me` | student | `{ enabled, cycle, settings, resume, credits[], aiCredits, downloads[] }` — one call for the whole page. `enabled:false` when the college has not bought the add-on. |
| PUT | `/resume/me` | student | Autosave `{ data, templateId }`. Input passes `sanitizeResumeData` (trim, control-char strip, length and array caps, URL scheme stripping). |
| POST | `/resume/preview` | student | `{ data?, templateId }` → `{ html, words }`. Free. |
| POST | `/resume/pdf` | student | `{ templateId, data? }` → `application/pdf` (+ `X-Resume-Download-Id`, `X-Resume-Version`, `X-Resume-Credits-Remaining`). `409 credits_exhausted`, `403 addon_disabled / template_disabled`, `400 empty_resume`, `503 pdf_renderer_unavailable` (credit released, `fallback: "none"`). |
| GET | `/resume/downloads` | student | Own versions (newest first). |
| GET | `/resume/downloads/:id/file` | owner, college admin/principal, superadmin | Streams the stored PDF. |
| POST | `/resume/ai/improve` | student | `{ kind: summary\|bullet\|headline, text, context? }` → `{ text, remaining }`. `403 ai_disabled`, `409 ai_exhausted`, `502 ai_failed` (AI credit released). |
| GET | `/resume/admin/settings?collegeId=` | admin, principal, superadmin | Settings + usage (resumes started, PDFs this cycle, by template, students with downloads, failed renders, 25 most recent). |
| PUT | `/resume/admin/settings` | superadmin | `{ collegeId, settings: { enabled, downloadsPerTemplate, disabledTemplates[], aiAssist, aiCallsPerStudent } }`. Partial bodies keep stored values. |
| POST | `/resume/admin/credits/reset` | superadmin | `{ collegeId, email \| uid, templateId?, scope?: pdf\|ai\|all }`. |
| GET | `/resume/admin/downloads?collegeId=&limit=` | admin, principal, superadmin | Recent ledger rows for the college. |

## 4. Data model

```
resumes/{uid}
  uid, collegeId, studentName, studentEmail, templateId,
  data: ResumeData,                      // see functions/src/resume/model.ts
  credits: { cycle: '2026-27', used: { classic: 2, … }, aiUsed: 3 },
  createdAt, updatedAt, lastDownloadAt

resumeDownloads/{downloadId}
  uid, collegeId, studentName, studentEmail, templateId, templateName,
  version, cycle, fileName, storagePath, sizeBytes,
  status: 'rendering' | 'ready' | 'failed', error?, redownloads, createdAt, readyAt

colleges/{collegeId}/config/resumeBuilder
  enabled (default false), downloadsPerTemplate (3), disabledTemplates [],
  aiAssist (false), aiCallsPerStudent (20), updatedAt, updatedBy

resumeAudit/{id}   // settings changes + credit resets (superadmin-only read)

Storage: resumes/{collegeId}/{uid}/{downloadId}.pdf   (no client access; streamed by the API)
```

Security rules (`current-firestore.rules`, `storage.rules`): the owner and the college's academic
staff can **read** `resumes` / `resumeDownloads`; **all writes are Admin-SDK only**. No composite
indexes are needed (queries use equality filters only and sort in memory).

## 5. Enabling it for a college

1. Superadmin → Colleges → open the college → Overview → **Resume Builder add-on** → switch
   **Enable**, adjust downloads per template / templates / AI if the contract says so → Save.
2. Students see **Learning → Resume Builder** immediately (the nav item is always present; the
   page explains the add-on when it is off).
3. Uptake and the recent PDFs are visible on the same card; college admins see it read-only in
   Settings → General.

## 6. Operations & deployment

* **Functions:** `functions/src/routes/resume.ts` runs inside the existing `api` function
  (2 GiB, 60 s). Rendering reuses `utils/pdfRenderer.ts` (single launch, hard timeouts, SIGKILL
  on hang). Budget per PDF ≈ 3–6 s cold, ~1.5 s warm. If volume grows beyond ~10 concurrent
  renders, move the router to its own `onRequest` with `concurrency: 1`, `maxInstances: 20`
  (see costing §6).
* **Fonts:** `@fontsource/inter` and `@fontsource/source-serif-4` are functions dependencies;
  the print HTML embeds the woff2 files as base64 so output is identical on any machine. The
  preview links the same families from Google Fonts. Missing font files degrade to
  Arial/Georgia — text is still text.
* **Env:** `GEMINI_API_KEY` (only if AI assist is enabled anywhere), `RESUME_AI_MODEL`
  (optional, default `gemini-2.5-flash`).
* **Deploy checklist:** `firebase deploy --only functions:api,firestore:rules,storage` then the
  web app. Rules must ship with (or before) the functions so the new collections are locked.
* **Retention:** versions are kept indefinitely for now; a yearly clean-up of `resumeDownloads`
  older than 12 months (+ their Storage objects) is the intended policy (costing assumes it).
* **Support playbook:** "student says the download failed" → check `resumeDownloads` for a
  `failed` row (credit was returned automatically); "student wants a redo" → credit reset on
  the college card; "PDF service down" → students see a 503 message and keep their credit.

## 7. Tests

* `functions/test/resumeBuilder.test.ts` — sanitiser, credit cycle + ledger maths (N renders
  then refusal, new-year reset, release floor), settings normalisation, all five templates
  (text-only invariants, escaping, section order, labels, preview vs print markup, fonts,
  PDF options, file names).
* `src/shared/utils/resumeAts.test.ts` — ATS checker rules, keyword coverage, page estimate,
  prefill.
* `scripts/render-check/run.mjs` — mounts the student page (editor, template picker, credit
  line, ATS panel, downloads; typing → debounced autosave + server preview; download → server
  render, refresh; re-download → free fetch; exhausted state; add-on off) and the superadmin /
  read-only add-on panel.
* Run: `npm run test:unit`, `npm --prefix functions run test:unit`, `npm run test:render`,
  `npx tsc --noEmit` (root and `functions/`).
