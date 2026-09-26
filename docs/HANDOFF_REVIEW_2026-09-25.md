# Review of the 25 Sep 2026 optimisation hand-off

**Answers three questions:** what the clauses really are, what the plan does to performance and
user experience, and how a ZIP of previous-year question papers (English + Kannada) gets into the
system.

Companion documents: `docs/HANDOFF_OPTIMISATION_2026-09-25.md` (the plan itself),
`docs/COSTING_AND_PRICING_ANALYSIS_2026-09-25.md`, `docs/RESUME_BUILDER.md`.
Tooling added with this review: `scripts/prep-import.mjs` (§5).

Every "verified" claim below was checked against the working tree at `2511fe9` on 25 Sep 2026;
the file:line evidence is in §8. Nothing here was verified against production — the sandbox has
no access to the Firebase project, to Cloud Logging or to any Google API.

---

## 0. The short answer

| Question | Answer |
|---|---|
| Are the clauses right? | Yes. The "old path stays as fallback / never rename in the same PR" contract is exactly what this codebase needs. **11 more clauses are missing** and they are all in the code today (§2). |
| Does it hurt performance or UX? | **No, not as planned** — every Phase-1 item is a net UX win. Three items change what users *see* (admin/superadmin freshness, student attendance percentage, PDF/download behaviour) and those need a UI affordance or an announcement before they ship (§3). Two items have a hidden risk profile the plan understates: the attendance trigger (3.1) and the model lifecycle in 2.1 (§2 A1). |
| Biggest surprise | **§2.1's cost assumption expires in weeks, not years.** Moving the "fast" tier to `gemini-2.5-flash-lite` gives the promised ₹40–50 K/yr — but the 3.x replacements Google actually recommends cost 2.5×–3.75× more per token, which puts the same traffic at ≈ **₹86 K** today and ≈ **₹1.58 L** at the 1 Jan 2027 prices. The AI cache (§4.1) and the `/chat` cap stop being "Phase 3 nice-to-have" and become the load-bearing mitigation (§4). |
| Hidden blocker for the PYQ corpus | `PrepPaper.language` is typed as the literal `'en'` (3 places), and every paper must cite an http(s) **source URL** or the existing import endpoint rejects it. Kannada support and a corpus-level source are code changes, not configuration (§5.4). |

---

## 1. The clauses, as written

Restated as a contract, with what I found when checking each one.

| # | Clause | Checked today |
|---|---|---|
| C1 | One PR per item (or per small group): code + tests + docs + "deploy & verify" note. | — |
| C2 | Ship Phase 1 first; Phase 2 changes data paths; Phase 3 is structural. | — |
| C3 | Any change to a data path keeps the **old path as a fallback** for one release (summary → raw query; new model → old provider chain; new route → old route still mounted). | Only 3.1, 3.4 and 4.1 actually create new paths. 2.1 already has a provider fallback; extend it to a *model* fallback (§2 A1) or it will fail the same way twice. |
| C4 | Never rename a callable / Express route / collection / Storage path in the PR that introduces its replacement. | Consistent with `functions/src/index.ts` mounting every router at `/api/<name>` **and** `/<name>` (L171–192) — that dual mount is itself a C4-style compatibility shim, keep it. |
| C5 | Test gates: functions `tsc` + `test:unit` (820); root `tsc` + `test:unit` (435) + `test:render` (306); `vite build`; `test:rules` when rules change. | Lists are explicit in `package.json` `test:unit` and `functions/package.json` `test:unit` — a new test file that is not listed never runs. Confirmed. |
| C6 | New service ⇒ render-check stub in `scripts/render-check/stubs/` + alias in `vite.config.mts` + a section in `run.mjs`. | 11 stubs exist; `resumeService.ts` is the pattern to copy. |
| C7 | functions ESLint on changed files; root has no ESLint config. | Confirmed (no `.eslintrc` at root). |
| C8 | Invariants: resume credit inside the transaction; dual route mount; callable names/regions are client contracts; default-deny rules with a case in `functions/test/firestore.rules.test.ts`; indexes deployed before the code that needs them. | Confirmed: `resume.ts` (credit inside transaction), `index.ts` dual mounts, `current-firestore.rules` default deny, `firestore.indexes.json` deployed separately. |
| C9 | Deploy runbook, one command at a time, rollback options, 15-minute post-deploy watch, hard-refresh for the PWA. | Confirmed; with §2.2 (immutable assets) the hard-refresh step becomes *more* important, not less (§3.2). |
| C10 | §2.3 delete command for the 14 orphan functions. | All 14 names now have **zero** references in `src/` and `functions/src` — verified by grep today. The delete is safe from the source side; the Cloud Run request-count pre-check is still the right gate. |

---

## 2. Clauses that must be added

| # | Clause | Evidence (verified today) | Where it lands |
|---|---|---|---|
| **A1** | **No model id may be a literal in a call site, and every tier is an ordered *list* of model ids with a model-level fallback inside Gemini *before* the provider fallback.** | Four different mechanisms exist today: `GEMINI_PARSE_MODEL` const (`paperParsing.ts:75`), a literal in `routes/ai-questions.ts:86`, a literal in `studentAssessments.ts:2519`, and env `RESUME_AI_MODEL` (`routes/resume.ts:604`). The three dead `gemini-1.5-flash` calls are exactly what this produces. A grep test for `gemini-1.5` only fixes today's outage, not the class of bug. | 2.1 |
| **A2** | **Model lifecycle is a dated constant, not a permanent one.** Put the shutdown date of each tier's model next to its id and re-check quarterly; a scheduled canary (`platform/aiConfig` or a tiny daily function that asks the tier's model for one token) turns a silent outage into a log line. | 1.5 Flash died 29 Sep 2025 and the code still called it a year later. 2.5 Flash-Lite/Flash and `gemini-3.1-flash-lite` (shutdown 7 May 2027) all carry dates (§4). | 2.1 |
| **A3** | **Telemetry must count thinking and cached tokens.** `usageMetadata` is read as `promptTokenCount` + `candidatesTokenCount` only. On 3.x models thinking tokens are billed at the **output** rate, so `ai_usage/*` will under-report spend exactly when the tiers change. Record `thoughtsTokenCount` and `cachedContentTokenCount` too, and pin the thinking level per tier. | `routes/ai-chat.ts:466-470`, `:1385+`; `routes/prep.ts:170-173`. | 2.1 |
| **A4** | **SDK decision must be made in 2.1, not later.** `@google/generative-ai@0.24.1` is the superseded package; thinking-level control and native PDF input (needed for scanned Kannada papers, §5.4) live in `@google/genai`. Wrap the provider in one adapter module so the SDK swap touches one file. | `functions/package.json` deps. | 2.1, 5.4 |
| **A5** | **Kannada is a schema change, not a content change.** `PrepPaper.language` is the **literal type `'en'`** and is hard-set in three places; the papers rules comment even says "(structured text, English)". | `functions/src/prepPapers.ts:140`, `:295`, `:583`; `current-firestore.rules:1524`. | 3.3/3.4 + §5 |
| **A6** | **The existing paper validator is the import contract.** Every paper must have `source.title`, `source.publisher`, an **http(s) URL** and an ISO `retrievedOn`; `durationMinutes` 60–240; `examYear` 2005..now+1; `semester` 1–10; `program` ∈ 8 codes; `university` ∈ 13 codes; a lowercase URL-safe id. A ZIP of scans satisfies none of that automatically. | `prepPapers.ts:509-518`, `:417+`, `expandPrepPaperSeed` (id/derivations). | §5.4 |
| **A7** | **A Firestore delta trigger is not idempotent.** `onDocumentWritten` is at-least-once. With `retry: false` a failed transaction is dropped and the summary silently drifts; with retries it can double-apply. Pick one: (a) exactly-once guard — store the applied event/revision in the same transaction; (b) accept drift + a **scheduled** nightly reconcile per college; (c) recompute-on-read. "Self-heal on read" alone is not enough. | Design of `attendanceSummaries` (3.1). | 3.1 |
| **A8** | **Never let one student's summary doc become a hot document.** A re-import of a semester writes hundreds of `attendanceRecords` for one student in a burst; Firestore's guidance is ~1 write/s/doc. Deltas will be dropped or serialised. Aggregate on the import path or queue the recompute for that student. | 4.5 M attendance docs / 4.8 M writes per year at 5,000 students (`docs/COSTING_AND_PRICING_ANALYSIS_2026-09-25.md:88`). | 3.1 |
| **A9** | **Hosting header rules match the request path, not what is served.** The `**` rewrite serves `index.html` for `/student/dashboard`, but a `/index.html` header rule does not apply to that path — deep links keep Firebase's default 3600 s caching. Either cover the rewrite patterns or ship the `vite:preloadError` guard *before* the immutable-asset change. | `firebase.json` headers + rewrites; `src/main.tsx` has no preloadError handler today. | 2.2 |
| **A10** | **`refetchOnWindowFocus: false` is already the global default** — don't re-implement it per hook; the real work in 2.4 is the interval change + `getCountFromServer` + the server-side stats doc. | `src/main.tsx` queryClient defaults. | 2.4 |
| **A11** | **Whenever a number's freshness changes, the UI must say so** ("Updated 4 min ago" + Refresh). Otherwise the support cost of "the dashboard is wrong" eats the saving. | Applies to 2.4, 3.1, 3.2. | 2.4, 3.1, 3.2 |

---

## 3. Performance and user experience

### 3.1 The one-paragraph version

Phase 1 makes the product **feel faster and cheaper to use** — repeat visits stop re-downloading
the whole app (2.2), the superadmin console stops hammering Firestore (2.4), deploys stop asking
about 14 dead functions (2.3), and three broken AI features start working again (2.1). Phase 2
makes the *dashboards* fast (3.1, 3.2) and adds content (3.3–3.5). Nothing in the plan deletes a
user-visible feature. The three things a user will notice changing are: numbers that used to be
live now refresh on a timer (§3.2), a student's attendance percentage is computed over their
**whole** history instead of the most recent 500 records (§3.3) — which can move the number — and
anything that prints a PDF either keeps the current browser path or gains a server path, never
loses both (§3.5).

### 3.2 Item by item

| Item | Machine effect | What the user gets | What could go wrong | Mitigation |
|---|---|---|---|---|
| **2.1 Model switch** | Removes a guaranteed-failing code path; tiering cuts study-material/chat/prep cost 60–75 % *while 2.5 Flash-Lite lasts* | Study material, AI chat and Prep drafts work again instead of falling through to DeepSeek/OpenAI (or failing) | A model swap can change output *shape* (JSON compliance), not just quality → parse failures that the existing fence-stripping tolerates today | Keep `responseMimeType: 'application/json'` on the JSON call sites, keep the existing fallback chain, and run a 20-sample eval per call site before/after; ship the model-list fallback (A1) so a 404 can never take a feature down again |
| **2.2 Cache headers + chunk guard** | Hashed assets become `immutable`; the browser stops re-downloading ~9 MB of JS/CSS per visit; egress on the model drops from ₹3,936 to ~₹1 K | Repeat visits are noticeably faster on the first paint after a deploy and much faster after that — most visible on 4G phones, which is most students | Stale `index.html` referencing a purged chunk → white screen "Failed to fetch dynamically imported module" | The SW already precaches `index.html` + `navigateFallback`; add the one-shot `vite:preloadError` reload guard **in the same PR** (A9), keep `registerType: 'prompt'`, and verify a deep link (`/student/dashboard`) *not* just `/index.html` |
| **2.3 Delete 14 orphans** | Fewer deploy prompts, faster deploys, less console noise | Nothing visible | An old client build calling a deleted callable gets `not-found` | The operator's 30-day Cloud Run traffic check is the gate; source is in git history |
| **2.4 Polling → 10/5 min + counts** | Superadmin tab reads fall from ~81 K/day to ~8 K/day per the sheet's own note; `getCountFromServer` turns collection scans into 1 read per 1,000 docs | Console pages feel the same; Firestore stops being a cost line | Figures look frozen to a superadmin who is used to 60-second updates; a just-created college/student may appear a few seconds later in a `count()` | Manual Refresh button + "as of HH:MM" label (A11); keep the computed fallback when `platform/stats` is missing or >1 h old |
| **3.1 Attendance summary** | Dashboard mount goes from an up-to-500-doc query (~600 reads) to 1 doc read + 1 write per attendance change; ~85 % of student reads | Attendance appears instantly; **and it becomes correct over the whole history** — today the query truncates at 500 records, i.e. about one semester, so the percentage is computed from a window | (a) The percentage can *change* after backfill → "my attendance changed" tickets; (b) drift from dropped deltas (A7); (c) burden on the attendance page | Announce the change; show the window ("all recorded sessions"); keep `AttendancePage` on raw records with `limit(60)` + Load more; add the count-vs-summary check and a scheduled reconcile; never compute the *policy* number differently in two screens |
| **3.2 Admin dashboard `count()`/`sum()`** | ~4×500 = ~2,000 reads → ~10 reads per dashboard load | Dashboard loads in one round trip instead of four sequential scans | `count()`/`sum()` are **eventually consistent** — a student just added may not be counted for a moment; aggregate query feature support is narrower than a normal query | Keep the return shapes pinned by a test, keep the `stats/aggregated` doc as the first source, fall back to the current computation |
| **3.3 Most-repeated questions** | Pure server CPU over 846 seeded questions; no AI, no Firestore reads beyond the papers already fetched | A genuinely new study tool built from content we already own — the strongest Prep hook in the plan | English tokenisation will not work for Kannada (agglutination + no stopword list) | Ship it for English first, keep the normaliser pluggable, add Kannada as its own item (§5.6) |
| **3.4 Model answers (846)** | ≈0.85 M tokens ≈ ₹800–1,200 one-time at Flash-Lite rates (more at 3.x prices — §4) | Draft answers under each question, clearly labelled and reviewed | Review workload is the real cost: 846 answers × ~20 s ≈ 5 hours for the *existing* 50 papers; a 5,000-paper corpus is "review weeks" | Batch by subject, publish in slices, keep `status: 'draft'` until reviewed (the plan already says this) |
| **4.1 Shared AI cache** | Turns a per-college AI call into one call + one doc read for every college after the first | Identical content across colleges appears instantly; spend stops scaling with colleges | Stale cache when prompts/syllabus change | `promptVersion` in the cache key + a purge route; counters in `platform/stats` |
| **4.3 One PDF stack** | Removes `html2canvas` + `jspdf` from the bundle (the `pdf` chunk is heavy) | Faster first load; identical-looking documents | A server renderer that fails takes printing with it | Server route first, client path stays until parity is verified per document — which the plan already requires |
| **4.4 Split `pdf` from `api`** | `api` can drop from 2 GiB to 512 MiB; PDF routes get their own 2 GiB/120 s function | No visible change (small latency win for exports) | A client still calling the old route gets 404 | Mount the render routes in **both** functions for one release (the plan says so); `src/shared/api/apiBase.ts` switches the base for `/pdf/*` only |

### 3.3 What I cannot measure from here

* No production access: the read/write deltas are model-based (`npm run cost:model`, `scripts/build-costing-sheet.py`), not billing measurements. Validate each line in the Firebase console the day after each deploy.
* No Gemini access: the 2.1 tiering cannot be smoke-tested in the sandbox at all — it is verified in production after deploy (the plan's own §2.1 verify steps).
* The precache figure is confirmed by a build run today: `npx vite build` reports **324 entries, 8,881 KiB** — the hand-off's "324 files / 8.9 MB" is exact. Re-measure after the optional `globIgnores` change in 2.2.

**Gates run for this review's changes (25 Sep 2026):** functions `tsc` ✔ · functions `test:unit` **820/820** ✔ · root `tsc` ✔ · root `test:unit` **449/449** (435 baseline + 14 new triage tests) ✔ · `test:render` **306/306** ✔ · `vite build` ✔. `test:rules` was not run (no rules/storage change in this commit).

---

## 4. Cost: the §2.1 assumption has a shelf life

Prices below are the **Gemini Developer API paid tier, standard** rates as published on
`ai.google.dev/gemini-api/docs/pricing` on 25 Sep 2026. The 2.5 series still answers on the
Gemini API (the deprecations page shows *no shutdown date* for `gemini-2.5-flash` /
`gemini-2.5-flash-lite`), but Google's enterprise/Cloud surface lists a 2.5 retirement in
**October 2026**, third-party migration guidance names `gemini-3.1-flash-lite` and
`gemini-3.6-flash` as the replacements, and **all 3.x Flash prices double on 1 Jan 2027**.

| Model | In / Out per 1M | Note |
|---|---|---|
| `gemini-2.5-flash` (today's baseline) | $0.30 / $2.50 | still answering on the Gemini API |
| `gemini-2.5-flash-lite` (the plan's "fast") | $0.10 / $0.40 | retirement signalled on the Cloud surface |
| `gemini-3.1-flash-lite` (recommended replacement) | $0.25 / $1.50 | shutdown 7 May 2027 → `gemini-3.5-flash-lite` |
| `gemini-3.5-flash-lite` | $0.30 / $2.50 | batch $0.15 / $1.25 |
| `gemini-3.6` / `3.7` / `3.8-flash` | $0.75 / $3.75 | $1.50 / $7.50 from 1 Jan 2027 |
| Batch API | −50 % | applies to `generateContent` batch jobs |

Re-running `scripts/cost-model.mjs` volumes (₹96/USD) through those rates:

| Scenario | AI / year | vs today |
|---|---|---|
| Baseline now: every call site on `gemini-2.5-flash` | **₹1,16,020** | — |
| Plan as written: fast tier on **2.5 Flash-Lite**, quality unchanged | **₹46,150** | −60 % ✅ (this is the plan's ₹40–50 K) |
| Realistic: fast tier on **3.1 Flash-Lite**, quality unchanged | **₹86,070** | −26 % ⚠️ |
| 3.x tiers at **2027 prices** (fast 3.1 Flash-Lite, quality 3.6 Flash at $1.50/$7.50) | **₹1,57,480** | +36 % ❌ |

Where the money actually is (baseline shares): AI-assistant chat **40 %** (225,000 calls — the
sheet's own analysis calls `/chat` "the only unbounded line"), AI grading suggestions **18 %**
(30,000 calls, the largest token volume), placement prep **22 %**, study packs **13 %**,
question generation **5 %**, paper parsing **1 %**.

So, in priority order, *independently of model choice*:

1. **Cap `/chat` per student/day** (the sheet proposes 20 turns) — the single largest line and the only unbounded one.
2. **Batch the grading suggestions** (−50 %) — not latency-sensitive; 30,000 calls.
3. **§4.1 content cache** for study packs + question generation (the most cacheable, cross-college).
4. **Tiering (2.1)** — still worth it, but treat ₹40–50 K as "while 2.5 Flash-Lite lasts" and re-price before it goes in the costing sheet.
5. **Thinking-level pinning + token telemetry** (A3) — on 3.x, thinking is billed as output; without it the invoice moves and the model does not.

### The two costing tools in this repo disagree

| Source | Firestore reads / yr | Cloud / yr | AI / yr |
|---|---|---|---|
| `npm run cost:model` (`scripts/cost-model.mjs`) | ₹4,287 (92.7 M reads, 80 reads/student/day) | ₹18,123 | ₹1,16,020 |
| `scripts/build-costing-sheet.py` (the XLSX) | ~₹36,853 (per-role daily pages: superadmin 81 K/day/tab, admin 6 K, accounts 4 K, ops 8 K, HOD 600) | ₹52,266 | ₹1,16,020 |

The hand-off's "₹1.7 L total" and "₹36,853 reads" are the **sheet's** world; the script's world is
₹1.34 L. Both are defensible — the sheet is the more conservative one and it already models the
2.4 fix as "~8,000 after fix" in the `saR` input note. **Decide which one is the contract for
`docs/Vriddhi_Costing_Sheet.xlsx`**, then after 2.4 ships set `saR` to 8,000 and re-run
`npm run cost:sheet` so the "after Phase 1–2" column is honest.

---

## 5. Handing over the previous-year paper corpus (English + Kannada)

### 5.1 What I can and cannot do from this session

| | |
|---|---|
| ✅ | Read the repo, write and run code, run `node:test`, zip/unzip, install npm packages. |
| ✅ | Inspect a ZIP of papers **if you attach it to the session** (it lands in this workspace) — text extraction, language, scan-vs-digital, filename metadata. |
| ❌ | Reach the internet from bash (no Gemini/Google APIs, no Drive). Attaching a *link* to a 2 GB Drive folder does not work — it must be attached as a file or run on your machine. |
| ❌ | Read your PC's disk. Nothing is "uploaded" until either you attach a file here or the operator runs a command/route in production. |
| ⚠️ | Repo hygiene: the session snapshot is capped (~128 MB combined / 10,000 files) and raw scans do not belong in git. Keep the corpus **out of the repo** (see 5.3). |

### 5.2 Three intake routes

**Route 1 — triage here, extract on your machine (recommended start).**
Attach a ZIP (or a 10–25 file sample) to the session. I run the new tool, we get an exact picture
(how many scans, how many digital, how much Kannada, what the filenames already tell us), and then
the extractor runs on the operator's PC with his Gemini key — the sandbox cannot call Gemini, and a
5,000-paper job should not be driven through a chat session anyway.

**Route 2 — in-app import (production-grade, best for thousands of files).**
Superadmin → Prep Studio → *Import papers*: upload the ZIP to Storage, then the UI drives a
per-file worker (one document per call — no long-running function, no 60 s timeout, resumable,
progress visible), each file landing as `prep_papers/{id}` with `status: 'draft'`, plus a
`prep_import_jobs/{jobId}` progress doc, and a review queue in Prep Studio. This is the same shape
as the existing `parsePaperFile` → `PaperUploadEditor` → "Confirm" flow
(`functions/src/paperParsing.ts`, `src/shared/components/question-paper/PaperUploadEditor.tsx`),
pointed at `prep_papers` instead of a college paper + question bank. **This is a Phase-2 item of
its own** — new collections, rules + rules test, storage rule for the ZIP, indexes, tests, UI.

**Route 3 — hand-entry through the existing endpoints.**
`POST /api/prep/papers` (superadmin, `normalisePrepPaperInput` + validation) already accepts one
paper at a time. Fine for 20 papers, not for a corpus.

### 5.3 The tool that exists now: `scripts/prep-import.mjs`

Dependency-free triage for a ZIP or a folder (PDF text extraction uses the `pdfjs-dist` already in
`functions/node_modules`, and degrades to metadata-only if it is missing):

```powershell
cd C:\Projects\Vriddhi
node scripts\prep-import.mjs --zip "D:\pyq\bcu-pyq.zip" --limit 25 --dump-text "D:\pyq\out\text"
```

It prints and writes `prep-import-manifest.json` with one row per document:

| Bucket | Meaning | What the importer does |
|---|---|---|
| `digital-en` | real text layer, English | deterministic parse — **no AI, no cost** |
| `digital-kn` / `digital-mixed` | text layer with Kannada | AI text parse (Kannada) |
| `legacy-font` | Kannada paper typeset in **Nudi/KGP** — the text layer is Latin gibberish (`PÀ£ÁðlPÀ`) | AI **vision** parse (render the page, never trust the text layer) |
| `scanned` | no usable text layer (< 40 chars/page) | AI **vision** parse (OCR) |
| `empty`, `unsupported`, `error` | nothing to parse | reported, skipped |

Each row also carries: pages, characters, script ratios (`kn` / `en` / latin-ext), a `sha256`
prefix (duplicate detection) and a filename guess for **university / program / semester / exam
year / month** — which is the metadata the `prep_papers` schema needs. 14 unit tests
(`scripts/prep-import-lib.test.mjs`) cover the ZIP reader (including the data-descriptor case),
script detection, legacy-font detection, the bucket thresholds and the metadata guesses; two more
tests fail if the university/program lists in the script drift from
`functions/src/prepPapers.ts` / `prepShared.ts`.

**Why `legacy-font` matters:** a large share of older Karnataka papers (and many government
papers of any year) were typeset in Nudi or KGP fonts. They *look* like Kannada on screen but the
text layer is unusable, so any pipeline that starts with "extract the text and send it to an LLM"
silently produces garbage for exactly the material you have most of. Detecting it up front is the
difference between a corpus that works and a corpus that quietly wastes a month.

### 5.4 What has to change in the code before a Kannada corpus can ship

| # | Change | Where |
|---|---|---|
| 1 | `language: 'en'` → `language: 'en' \| 'kn' \| 'mixed'` (or a `medium` field), carried through the seed type, `expandPrepPaperSeed`, `normalisePrepPaperInput`, and the `filterPrepPapers` / `prepPaperFacets` pick-lists | `functions/src/prepPapers.ts:140, 295, 583`, `:339+`, `:417+` |
| 2 | `POST /prep/papers` must accept the language field and keep defaulting to `'en'` (so the existing 50 papers are unchanged) | `functions/src/routes/prep.ts:950` |
| 3 | Prep UI: a language facet/chip in `PapersLibraryView` + Kannada rendering (the app already loads Noto Sans Kannada from Google Fonts, and the service worker runtime-caches `fonts.gstatic.com`) | `src/modules/prep/PrepPapersViews.tsx` |
| 4 | Rules comment + a rules case for the new field; `prep_paper_answers` (3.4) needs its own rule + rules test | `current-firestore.rules:1524`, `functions/test/firestore.rules.test.ts` |
| 5 | The validator's mandatory **http(s) source URL** needs a corpus-level escape hatch (e.g. `source.url` = the university's page + `source.note` = the upload batch) or a documented `kind: 'upload'` branch with new tests | `functions/src/prepPapers.ts:509-518` |
| 6 | University/program coverage: the catalogue is 8 programs (bba, bcom, bca, bsc, ba, mba, mcom, mca) and 13 university codes. Any paper outside those is **rejected** by the validator — add codes first or the import fails one file at a time | `functions/src/prepShared.ts:584`, `functions/src/prepPapers.ts:31` |
| 7 | **Server-side PDF printing of Kannada** needs a Kannada font in the render pipeline: `functions/src/resume/fonts.ts` embeds only Inter + Source Serif 4, so a Kannada document would print as boxes today | `functions/src/resume/fonts.ts`, `functions/src/utils/pdfRenderer.ts` |
| 8 | §3.3's "most repeated questions" normaliser must not be English-only: Kannada has no whitespace-tokenisable morphology, so use a Kannada stopword list + character n-grams (or embeddings later) | new `functions/src/prepFrequentQuestions.ts` |

### 5.5 Cost and effort

* **Extraction:** with a PDF/image-capable Flash-Lite model, a 4-page paper is roughly 1–4 K input
  + 2–4 K output tokens ⇒ **≈₹0.4–0.7 per paper** at 3.1 Flash-Lite standard rates (**half** that
  in Batch mode). 5,000 papers ≈ **₹2,000–3,500 one-time**. Digital English papers cost nothing
  (deterministic parse).
* **Review is the real cost, not the AI.** 846 existing questions ≈ 5 review hours; a 5,000-paper
  corpus is a review *programme* — plan it in subjects/semesters, publish per batch, and use the
  existing `status: 'draft' → 'published'` gate (`validatePublishTransition`).
* **Storage:** publish the *structured text* (that is why `prep_papers` is text — see the module
  header in `functions/src/prepPapers.ts`). Keeping the 5,000 source scans in Storage costs
  ~$0.13–0.26/month at 5–10 GB, plus $0.12/GB whenever a student downloads one — decide whether
  "view the original scan" is a feature before publishing the PDFs.
* **Rate limits:** a 5,000-file job at 1–2 requests/second is ~1 hour of wall clock; batch mode or
  a chunked worker keeps it well inside any quota.

### 5.6 Destination — pick one before anything is built

| Option | Collection | Best for | Notes |
|---|---|---|---|
| **A (recommended)** | `prep_papers` | The public PYQ library: browse by university/program/semester/year, "most repeated" (§3.3), model answers (§3.4) | Already has the schema, validator, facets, UI and rules; needs the language field (§5.4) |
| B | universal question bank (`questionBank_meta` + `questionBank_content`) | Question-by-question practice/MCQ sets (§3.5) | Existing CSV/JSON importer already handles **PYQ + Kannada** (`isPYQ`, `examYear`, `examName`, `detectSeedLanguage`) — a good second pass over a curated subset, not the first landing place for a paper corpus |
| C | college `papers` + `paper-files` | A specific college's own exam papers, printable + schedulable online | Per-college, faculty-owned; bulk-loading a shared PYQ corpus here would duplicate it per college and confuse ownership |

### 5.7 Suggested next three steps

1. **Attach** either the whole ZIP (if under ~100 MB) or a 10–25 file sample covering: one digital
   English paper, one Kannada paper, one scan, one Nudi-encoded file. That is enough to lock the
   schema and the extraction plan.
2. **Run** `node scripts\prep-import.mjs --zip <full corpus> --limit 25` on the operator's PC and
   send me `prep-import-manifest.json` (small). With the real bucket mix I can size the AI job and
   write the extractor against real shapes instead of guesses.
3. **Decide** destination A/B/C and answer the five questions in §7 — then §5.4 items 1–6 become a
   single PR (`prep papers: Kannada + corpus import`) that changes no existing paper.

---

## 6. Recommended order (two changes to the hand-off's order)

1. **2.1** — but with A1–A4 folded in (model *list* + model fallback + token telemetry + SDK decision + a lifecycle canary). It is a live outage.
2. **2.2** — biggest UX/egress win, lowest risk, but ship the `preloadError` guard in the **same** PR (A9).
3. **2.3** — 15-minute operator task, removes friction from every later deploy.
4. **2.4 client part**, then the `refreshPlatformStats` + `platform/stats` server part (rules + rules test + indexes).
5. **`/chat` cap + batch grading** — cheapest AI savings that do not depend on model choice (§4).
6. **4.1 content cache** (pulled forward from Phase 3): study material → prep drafts → question generation. This is what keeps the AI line near ₹40–50 K when 2.5 Flash-Lite goes away.
7. **3.3** English "most repeated" (pure code, no AI, high product value).
8. **3.1 attendance summary** — only after A7/A8 are settled in a written design (exactly-once guard or scheduled reconcile, and hot-doc handling).
9. **3.2** admin `count()`/`sum()`.
10. **PYQ corpus import + Kannada schema** (§5) — as its own item; it is a prerequisite for 3.4/3.5 being worth doing at corpus scale.
11. **3.4 → 3.5** model answers, then MCQs (review-bound).
12. **4.3 → 4.4** PDF stack, then the function split. **4.5** whenever.

---

## 7. Open questions for the operator / product owner

1. Which costing model is the contract — `scripts/cost-model.mjs` (₹1.34 L) or the XLSX (₹1.69 L)? (§4)
2. PYQ destination: `prep_papers` (A), the universal question bank (B), or both in that order? (§5.6)
3. Corpus shape: how many files, which universities/programs/semesters/years, and roughly what share are scans vs digital PDFs?
4. Source citation: can every paper cite the university/department page it came from, or do we need the `source.kind: 'upload'` branch? (§5.4 item 5)
5. Publish the raw scans as well, or text-only (cheaper, and the current design's intent)?
6. Who reviews and publishes — superadmin content team, or faculty per subject?
7. Is 2.5 Flash-Lite acceptable as the "fast" tier while it lasts, given it may be retired in October 2026?
8. Does a student's attendance percentage moving after the summary backfill need a one-time notice on the attendance page?

---

## 8. Evidence appendix — what I checked in the tree today

| Claim | Where |
|---|---|
| Three call sites still call the dead `gemini-1.5-flash` | `functions/src/routes/ai-chat.ts:463`, `:1383`; `functions/src/routes/prep.ts:167` |
| Two more on 2.5 (`GEMINI_PARSE_MODEL`, `RESUME_AI_MODEL` env) and two literals | `functions/src/paperParsing.ts:75`, `functions/src/routes/resume.ts:604`, `functions/src/routes/ai-questions.ts:86`, `functions/src/studentAssessments.ts:2519` |
| Hosting sends `no-cache, no-store` for every `.js`/`.css`, including hashed assets | `firebase.json` header rules (`**/*.js`, `**/*.css`) |
| No `vite:preloadError` handler exists | `src/main.tsx` (whole file) |
| `refetchOnWindowFocus: false` is already the global default | `src/main.tsx` queryClient |
| Superadmin polling intervals (2 min / 10 min / 60 s / 2 min / 2 min / 60 s / 2 min) | `src/modules/superadmin/hooks/useSuperAdmin.ts:371, 456, 503, 513, 523, 533, 543` |
| Superadmin collection scans | `src/modules/superadmin/api/superAdminApi.ts:399-401, 443-445, 626, 648` |
| Attendance read: `limit(500)` ordered by date desc; percentage = (present + onDuty + late)/total | `src/modules/student/api/studentDataApi.ts:235-320` |
| Dashboard mount calls it | `src/modules/student/hooks/useStudentData.ts:234` |
| Admin dashboard scans (`MAX_READS = 500`) | `src/modules/admin/api/dashboardApi.ts:10, 134, 160, 177, 187` |
| `PrepPaper.language` literal `'en'` | `functions/src/prepPapers.ts:140, 295, 583` |
| Paper validator requires an http(s) source, duration 60–240, year 2005..now+1, program/university in the catalogue | `functions/src/prepPapers.ts:417+, 509-518` |
| `PREP_PROGRAM_CATALOG` = 8 codes; `PREP_PAPER_UNIVERSITIES` = 13 codes | `functions/src/prepShared.ts:584`, `functions/src/prepPapers.ts:31` |
| `prep_papers` rules say "structured text, English", published-or-superadmin read, no client writes | `current-firestore.rules:1524-1532` |
| Prep Studio already has a "Previous Year Papers" panel + seed bundle | `src/modules/admin/components/PrepContentStudioTab.tsx:66-68, 104+` |
| Server PDF fonts are embedded only for Inter + Source Serif 4 | `functions/src/resume/fonts.ts:40-41` |
| `api` runs at 2 GiB / 60 s / maxInstances 10 | `functions/src/index.ts:212-218` |
| Every router mounted at `/api/<name>` **and** `/<name>` | `functions/src/index.ts:171-192` |
| All 14 orphan function names have zero source references | grep over `src/` + `functions/src` |
| Test lists are explicit (root + functions) | `package.json` `test:unit`; `functions/package.json` `test:unit` |
| CI runs on `main` pushes and PRs, not on feature branches | `.github/workflows/ci.yml` |
| Model prices / retirements quoted in §4 | `ai.google.dev/gemini-api/docs/pricing`, `.../docs/deprecations` (fetched 25 Sep 2026) |
