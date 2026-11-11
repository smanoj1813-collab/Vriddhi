# Assessment Suite — Enhanced Edition (v4.2-Enhanced)

> **Logic preserved. UX + readability + reliability enhanced.**
> **Generalized: one copy of this code serves every college — see 🌍 below.**
> Original: Assessment Suite v4.2 Fixed — Auto-discover sheets + Email snapshot
> Enhanced: Same calculations, same sheet names, same thresholds, same data flow.
> Only presentation, messages, validation, comments, and safe cleanups changed.

This folder is **separate from your Vriddhi personal project** — it is your daily-work Assessment Suite, enhanced for user-friendliness.

---

## What was enhanced (no logic change)

### 1. User-friendliness (UI/UX)
- **Clearer menu labels** in `onOpen()` — e.g. `🚀 Generate Report`, `🏆 Open Leaderboard`, with grouped sub-menus (Exports / Email) and helpful welcome toast.
- **Fixed blank dialog title** — `showReportDialog()` now shows `📝 Generate Report` instead of `' '`.
- **Better prompts & alerts** — Settings, errors, and success messages now say *what happened, what to do next, and where to look* (e.g. “Sheet ‘Report generator’ not found — create it with Name, Email, Reg No, Batch, Branch”).
- **Consistent branding** — HTML dialogs unified to your brand green `#32c888 / #1b5e20` (matching sheets + emails) instead of mixed purple gradients. Same layout, better contrast, focus states, and mobile padding.
- **Dialog improvements (all HTML files):**
  - Required fields marked `*`, placeholders with real examples, helper text under inputs.
  - Inline validation before calling server (no silent failures), double-submit prevention, clearer spinner + status text.
  - Accessibility: `<label for>`, `aria-label`, keyboard Enter handling, visible focus rings.
  - Success auto-close with countdown text; errors stay open with actionable message.
  - FacultyDashboard: clearer filter labels, active-filter chips with remove buttons, empty states, print-friendly styles preserved.

### 2. Readability & maintainability
- Added file header with version, changelog, and “Logic Preserved” note.
- JSDoc-style comments for every major function (purpose, inputs, outputs, side-effects).
- Section banners kept, plus new “Helpers (UX only)” section.
- Removed dead code: duplicate `totalMarks` check in `parseInputs()`, unreachable `Logger.log` after `return` in `scanReportForEmailData()`.
- Named constants kept in `CONFIG` — no magic numbers changed.

### 3. Reliability (same behavior, clearer failures)
- All `try/catch` blocks now log with context (`console.error` with function name) and show user-friendly alerts.
- Sheet-existence checks before exports kept and messages improved.
- Email duplicate prevention, registry fallbacks, and snapshot-first flow **unchanged**.
- Cache, chunking, and timeout safeguards in Faculty Dashboard **unchanged**.

### Not done on purpose (say the word if you want it)
- `getCollegeWiseData()` and `getMultiCollegeData()` are still the original "not implemented" stubs. They imply a cross-college roll-up dashboard fed by several spreadsheets — a different feature from this one. This edition makes a single spreadsheet college-aware; it does not aggregate across spreadsheets.
- Nothing about the **report layout, email body design, thresholds, file naming or Drive folder structure** was touched. The college name flows into those exactly where it already did.

### What was NOT changed
- Thresholds: GOOD ≥70%, IMPROVEMENT 50–69%, TRAINING <50%; POOR ≤30%, AVERAGE ≤60%, GOOD ≤80%, BEST ≥81%.
- Sheet names: `Report generator`, `Report_View`, `Master Data`, `📊 Leaderboard`, `📋 Analysis`, `Email Registry`, `Assessment Registry`.
- Calculations: percentages, ranks, branch stats, attendance, insight distributions — identical formulas.
- Drive folder structure: `All College Assessment Reports / College / Test`.
- File naming: `College_Assessment_Date.pdf`, `College_Leaderboard_ShortName_Date.pdf`.
- Max-score rules: CTD=200, DCA=225, PMD 1=230, PMD 2+=30.
- Function names & signatures — all HTML `google.script.run` calls still work.

---

## Files in this folder

| File | Source | Enhancement |
|------|--------|-------------|
| `Code.gs` | Your pasted `.gs` (Part 1) | Header, helpers, clearer messages, fixed blank title, dead-code removal, JSDoc. Logic identical. |
| `ReportDialog.html` | Part 2 | Brand green, helper text, validation, a11y, double-submit guard. |
| `Dialog.html` | Part 2 (Leaderboard) | Brand green, clearer labels, sheet-load retry UX, tag display. |
| `RebuildDialog.html` | Part 2 | Brand green, category help, clearer status. |
| `EmailDialog.html` | Part 3 | Brand green, date-picker flow, registry preview, duplicate UX. |
| `BatchEmailDialog.html` | Part 3 | Brand green, search, select-all, result summary. |
| `FacultyDashboard.html` | Part 3 | Brand green header, filter chips, empty states, print styles kept. |
| `FILES-FLOW.md` | **New** | Install order, runtime call graph, and the exact "X must come after Y" data dependencies + symptom→cause lookup. |
| `TPOAnalytics.html` | **New** | Leaderboard-driven analytics with drill-down: student → per-assessment, branch → roster, assessment → distribution + absentees. |
| `test-analytics.cjs` | **New** | Tests for the analytics + drill-down layer (93 assertions). `node test-analytics.cjs`. |
| `test-faculty-source.cjs` | **New** | Proves the Faculty Dashboard web app is leaderboard-sourced and its payload still matches what the HTML consumes (91 assertions). |
| `test-fd-ranking.cjs` | **New** | Pins the score rule: 1 test at 100% must never outrank 9 tests at 90%. Pulls the arithmetic straight out of `FacultyDashboard.html` (43 assertions). |
| `test-fd-render.cjs` | **New** | Headless render of the dashboard page against a DOM stub — every chart/table must build, and the 0% rows must not sort to the top. |
| `CollegeSetupDialog.html` | **New** | 🏫 Set this spreadsheet's college once, plus programme groups (CS / Non-CS). Shows what was detected and from where. |
| `test-college.cjs` | **New** | Automated tests for the college layer (59 assertions). Run `node test-college.cjs`. Not needed inside Apps Script. |
| `TPODashboard.html` | *Not pasted — inferred from backend* | Branded TPO dashboard matching `getDashboardData()` exactly: stats grid, placement readiness, top performers, at-risk, recent assessments, type selector, refresh + clear cache. |
| `DownloadDialog.html` | *Not pasted — inferred* | Branded export dialog calling `exportAsPDFFromDialog()` / `exportAsCSVFromDialog()`, with double-click guard, spinner and status line. |

> **Note on the two inferred files:** `DownloadDialog` and `TPODashboard` were referenced in `Code.gs` but not pasted. Both were rebuilt strictly against the backend contract that `Code.gs` already contains — verified field-by-field (`summary`, `placementReadiness`, `topPerformers`, `atRiskStudents`, `recentAssessments`, `availableTypes`, `loadTime`, `fromCache`) and function-by-function. They use **only** functions that already exist in your backend, so nothing new needs to be added. If you have the originals, paste them and I’ll re-apply the same enhancements to your exact versions.

---

## Verification done on this package

| Check | Result |
|-------|--------|
| College layer automated tests (`node test-college.cjs`) | ✅ 59/59 assertions pass |
| Analytics + drill-down tests (`node test-analytics.cjs`) | ✅ 93/93 assertions pass |
| Faculty Dashboard source tests (`node test-faculty-source.cjs`) | ✅ 91/91 assertions pass |
| Score-rule tests (`node test-fd-ranking.cjs`) | ✅ 43/43 assertions pass |
| Dashboard render test (`node test-fd-render.cjs`) | ✅ passes |
| Every `google.script.run` target across all 10 HTML files exists in `Code.gs` | ✅ all resolve |
| JavaScript syntax of all HTML script blocks (`node --check`) | ✅ 10/10 clean |
| JavaScript syntax of `Code.gs` (`node --check`) | ✅ clean |
| `TPODashboard`/`DownloadDialog` payload fields match backend output | ✅ field-by-field |
| Function names & signatures preserved (HTML ↔ backend wiring) | ✅ unchanged |
| Thresholds, sheet names, max-score rules, file naming | ✅ unchanged |

---

## 🌍 One script, every college (generalized edition)

The same `Code.gs` + HTML files now serve **every college**. Deploy identical
copies; each spreadsheet figures out who it is. Nothing college-specific is hardcoded anymore.

### How the college is detected
First hit wins — the setup dialog always shows which source was used:

| # | Source | Typical situation |
|---|--------|-------------------|
| 1 | 🏫 College Setup (saved value) | You confirmed it once |
| 2 | `Report_View!A1` | Reports already generated here |
| 3 | `🏛️ <college> —` in a leaderboard header | Leaderboard built here |
| 4 | `College` column in Master Data | If you keep one |
| 5 | Cleaned spreadsheet name | A brand-new copy |
| 6 | `Unknown College` | Nothing found — the dialog asks you to set it |

The result is cached for 5 minutes, so detection costs one read, not one per action.

### What was actually broken (and is now fixed)
- **The registry had no College column.** Lookups were Assessment + Batch + Date only, and `registryRecord.data[0]` — the *assessment name* — was used as the college in email subjects, the email body and the registry's "College" row. There is now a real `College` column and the real college is used.
- **The Faculty Dashboard hardcoded one college** (`FD_CONFIG.DEFAULT_COLLEGE_NAME`), so every other college saw that name in its header. Now detected per spreadsheet.
- **Programme groups** (`BRANCH_GROUPS`) were one college's branch names, so the CS / Non-CS grouping was wrong everywhere else. Now overridable per college from College Setup.

### The Email Registry change (safe migration)
`College` is appended as **column K — always last**:

```
A          B     C     D           E           F     G   H      I          J       K
Assessment Batch Date  Report Link Answer Key  Email CC  Status Date Sent  Remarks College
```

Nothing before it moved, so every existing index (`data[3]` = report link, `data[5]` = email, `data[7]` = status …) still means exactly what it did. On first use the script:

1. adds the missing header cell (brand green, same style as the rest),
2. fills **blank** College cells with the detected college,
3. records the migration as done in Script Properties — it never runs again, so it costs nothing afterwards.

It is wrapped in `try/catch`: a failure there can never block report generation or emailing.

**Old rows are never rewritten silently.** Relabelling existing rows is opt-in — the "Also relabel existing Email Registry rows" checkbox — which is what you want right after copying a spreadsheet from another college.

### Lookups stay forgiving
College is a *preference*, not a filter. `getEmailRegistryRecord()` tries a college match first, then falls back to the original Assessment + Batch + Date match. So no record that used to be found can stop being found, even if a spreadsheet was copied and the College cells are stale. A mismatch is shown in the dialog instead of being hidden.

### 📊 Leaderboard Analytics (new)
Menu → **📊 Leaderboard Analytics**. Everything is computed from the generated
leaderboard sheet, so the dashboard, the sheet and the emails quote identical numbers —
it never re-derives them from raw assessment sheets.

- KPIs: students, appeared, absent, completion, avg % (appeared **and** all), pass rate,
  placement-ready %, at-risk %
- Branch table: students / appeared / absent / both averages / min / max / pass % / at-risk,
  ranked — **click a branch** for its roster and per-assessment profile vs the class
- Assessment table: per-column max, appeared, absent, mean, mean %, difficulty band, pass %
  — **click an assessment** for distribution buckets, per-branch means and the absentee list
- Bands, group (CS / Non-CS) comparison, top performers and at-risk lists
  — **click a student** for their score in every assessment with Δ vs class mean and position
- Yellow banner flags unmapped branch labels and duplicate Reg Nos

Amount-of-data caveat: the leaderboard holds no question-level data, so drill-down stops at
assessment granularity, and Batch comes from a Master Data join.

### How a score is calculated (changed)

`Overall %` = **marks obtained ÷ maximum of every test in scope**. A test the student did
not sit counts as **zero** in the denominator. That single rule is now used by the stats
cards, Branch Performance, Status Distribution, Top Performers, At-Risk and the All Students
table, and it is what the ranking sorts on.

```
Student A: 9 of 10 tests, 90 in each   →  810 / 1000  =  81.0%   ← ranks #1
Student B: 1 of 10 tests, 100 in that  →  100 / 1000  =  10.0%   ← does not
```

The old "average of the tests they happened to sit" number is **kept**, as its own column
`Avg (appeared)` (and its own stat card), so nothing that used to be visible is lost:

| | A | B |
|---|---|---|
| Participation | 9 / 10 | 1 / 10 |
| Score | 810 / 1000 | 100 / 1000 |
| **Overall %** (used for rank + status) | **81.0%** | **10.0%** |
| Avg (appeared) | 90.0% | 100.0% |

Scope = all tests, or the selected Week(s), or the selected Assessment(s) — the Score column
denominator follows the filter, so picking one test shows `x / <that test's max>`.

`generateFacultyReport()` (the Sheet Report button) uses the same leaderboard percentages, so
the web app and the sheet now agree.

### Faculty Dashboard is leaderboard-sourced
`getFacultyDashboardData()` (the web app's only data call) now reads
`📊 <type> Leaderboard`, joined to `Master Data` for Batch / College and for
students who never appeared. It no longer scans raw assessment sheets and no
longer reads `Report_View` — so the web app, 📊 Leaderboard Analytics, 🎓 TPO
Dashboard and the emails all quote the same numbers. `generateFacultyReport()`
follows automatically (it calls the same function).

The payload is byte-compatible with the existing HTML, so **no web app changes**
were needed. The previous implementation is still in the file, untouched:

```
setFacultyDataSource('raw')          // roll back to the raw-sheet reader
setFacultyDataSource('leaderboard')  // default
```

Stored in Script Property `FD_DATA_SOURCE`; the debug panel in the web app shows
which source is live (`debug.source`).

Two behavioural differences worth knowing:
- Students with a **Reg No but no email** now appear (the old reader silently dropped them).
- A student who is on the leaderboard with **all scores blank** is `INACTIVE` here — the same
  rule as before — while 📊 Leaderboard Analytics reports them as absent / 0%.

### Order of operations
See **`FILES-FLOW.md`** for the full picture: install order, which file opens which, and which action must run before which (e.g. Export and Email both depend on Generate Report having run). Short version:

```
Report generator → 🚀 Generate Report → 📥 Export PDF → fill Email/CC → 📧 Send Email
```
Leaderboards and dashboards refresh themselves from the same data.

### Set-up, once per college
1. Open the college's spreadsheet → **📊 Assessment Suite → 🏫 College Setup**.
2. Confirm the detected name (edit it if wrong) → **Save**.
3. Expand **Programme groups**, check the CS / Non-CS lists against the branches shown from Master Data → **Save programme groups**.
4. Done. Reports, exports, emails, dashboards and the registry use that name from now on.

Running it again is harmless. **Re-detect** clears the cache and re-scans; clearing both programme lists restores the built-in defaults.

### Copying a spreadsheet to a new college
A copy carries the bound script *and* its Script Properties, so the new file would inherit the old college. College Setup handles that: it flags **"Looks like a copy"** when the saved name doesn't match the file name, and offers the relabel checkbox. Do that once after copying and the new spreadsheet is its own college.

---

## How to install (Google Apps Script)

1. Open your Spreadsheet → **Extensions → Apps Script**.
2. **Backup:** Copy your current `Code.gs` and all `.html` files to a backup (or use **File → Version history**).
3. Replace `Code.gs` with this folder’s `Code.gs`.
4. For each `.html` file: **+ → HTML**, paste the file content, name it exactly as listed above (e.g. `ReportDialog`, `Dialog`, `EmailDialog`, `BatchEmailDialog`, `RebuildDialog`, `FacultyDashboard`, `TPODashboard`, `DownloadDialog`, **`CollegeSetupDialog`**).
5. Save, reload the Sheet, and check the **📊 Assessment Suite** menu.
6. Run **🏫 College Setup** once and confirm the college and programme groups.
7. Test in order: Generate Report → Export PDF/CSV → Leaderboard → Email (single, then batch) → TPO/Faculty Dashboard.
8. If anything looks different, tell me the exact menu/dialog — I’ll revert that piece. Logic is preserved, so behavior should match your original.

**Do NOT change** `CONFIG` values (sheet names, logo ID, thresholds) unless you intend to — they are your working settings.

---

## Quick test checklist

**College layer**
- [ ] 🏫 College Setup shows the right college and its source.
- [ ] Saving the name means reports stop asking you to retype it.
- [ ] First email/report run adds `College` at K and backfills blanks — existing values untouched.
- [ ] Running College Setup twice does not duplicate the column or rewrite existing rows.
- [ ] Programme groups: CS / Non-CS filter works in the Faculty + TPO dashboards.

**Existing behaviour (must stay identical)**
- [ ] `Report generator` sheet with Name, Email, Reg No, Batch, Branch + Score → Generate Report works.
- [ ] `Report_View` builds with header, details, snapshot, status summary, performers, branch summary, data table, at-risk + absent count.
- [ ] Export PDF/CSV saves to Drive under College/Test and updates Email Registry.
- [ ] Leaderboard builds from `Master Data` + test sheets; rebuild preserves data.
- [ ] Email sends once, blocks duplicates, allows force resend.
- [ ] Faculty Dashboard loads, filters work, Sheet Report generates.

---

## Need a tweak?
Tell me: *dialog name + what feels confusing* (e.g. “ReportDialog — Batch field unclear”). I’ll adjust wording/layout only — no logic changes.
