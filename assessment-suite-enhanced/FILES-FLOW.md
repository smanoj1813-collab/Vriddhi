# Files Flow — what comes after what

Two different orders get confused, so they're separated here:

- **A. Install order** — the order you paste files into Apps Script. Governed by *which file opens which*.
- **B. Data order** — the order you *use* the features. Governed by *which sheet/property the next action reads*.

Getting A wrong gives you an instant error dialog. Getting B wrong gives you an empty dashboard or an email with blank attendance.

Everything below was read out of `Code.gs`, not assumed.

---

## A. Install order

### The one hard rule

**`Code.gs` first.** Every HTML file is loaded by *name at runtime* (`HtmlService.createHtmlOutputFromFile('...')`), so there are no compile-time links between them. Any HTML file can be added in any order — but each must exist **before** the menu item that opens it is clicked.

If a file is missing, Apps Script throws *"Cannot find file: <Name>"* at that moment. Nothing is corrupted — add the file and click again.

### Install in this order

Order = dependency + risk. Items 1–4 are what you need for the daily report loop.

| # | File | Kind | Opened by | If missing / wrong name |
|---|------|------|-----------|-------------------------|
| 1 | `Code.gs` | Script | — | No menu at all. Nothing works. |
| 2 | `CollegeSetupDialog.html` | Dialog | `showCollegeSetupDialog()` → **🏫 College Setup** | That menu item errors. Everything else still runs on auto-detection. |
| 3 | `ReportDialog.html` | Dialog | `showReportDialog()` → **🚀 Generate Report** | Cannot generate reports → nothing downstream has data. |
| 4 | `Dialog.html` | Dialog | `showDialog()` → **🏆 Open Leaderboard** | Leaderboard can still auto-update from reports; only the manual builder is blocked. |
| 5 | `RebuildDialog.html` | Dialog | `showRebuildCategoryDialog()` → **🔄 Rebuild Leaderboard** | Menu item errors. |
| 6 | `EmailDialog.html` | Dialog | `showEmailDialog()` → **📧 Send Single Report** | Menu item errors. |
| 7 | `BatchEmailDialog.html` | Dialog | `showBatchEmailDialog()` → **📧 Send Multiple Reports** | Menu item errors. |
| 8 | `TPODashboard.html` | **Template**, not plain HTML | `showTPODashboard()` → **🎓 TPO Dashboard** | Menu item errors. Must be that exact name — it's loaded with `createTemplateFromFile`. |
| 9 | `TPOAnalytics.html` | Dialog (leaderboard-driven) | `showTPOAnalytics()` → **📊 Leaderboard Analytics** | Menu item errors. Needs a leaderboard sheet with data to show anything. |
| 10 | `FacultyDashboard.html` | **Web app** page | `doGet()` — *not a menu item* | Web app URL 404s. See note below. |
| 11 | `DownloadDialog.html` | Dialog | **nothing** — see note below | Nothing breaks. It is optional. |

### Two things in that table worth knowing

**`FacultyDashboard.html` is not a menu item.** It's served by `doGet()`, so it only appears after **Deploy → New deployment → Web app**. If you only install files and never deploy, there's no way to reach it — that's expected, not a bug.

**`DownloadDialog.html` is currently orphaned.** `showDownloadOptions()` is defined in `Code.gs`, but nothing calls it — I verified the only occurrence is the definition itself. The **📥 Exports** menu items (`manualExportPDF`, `manualExportCSV`, `exportLeaderboardPDF`, `exportLeaderboardCSV`) call `exportAsPDF`/`exportAsCSV` directly and show their own success dialog via `showExportSuccess()`. So `DownloadDialog.html` is required by no path today; install it only if you plan to wire `showDownloadOptions()` into a menu yourself. **This is true of the original file too, not something the enhancement introduced.**

---

## B. Data order (the part that actually matters)

```
                          ┌──────────────────┐
     Master Data ────────►│    LEADERBOARD    │◄──── test sheets (scores)
   (Name/Email/RegNo/     │ 📊 🏆 + 📋 Analysis│
     Branch)              └────────┬──────────┘
                                   │ read by
                                   ▼
                          🎓 TPO Dashboard
   ┌────────────────────────────────────────────────────────────┐
   │  1. Report generator sheet  (raw scores, one row/student)  │
   └───────────────────────────┬────────────────────────────────┘
                               ▼
   ┌────────────────────────────────────────────────────────────┐
   │  2. 🚀 Generate Report   →  Report_View                     │
   │                          →  REPORT_SNAPSHOT_<test>_<batch>  │
   │                          →  Email Registry row = Generated  │
   │                          →  Assessment Registry entry       │
   │                          →  assessment sheet created        │
   │                          →  leaderboard auto-updated        │
   └───────────────────────────┬────────────────────────────────┘
                     ┌─────────┴─────────┐
                     ▼                   ▼
   ┌──────────────────────────┐  ┌──────────────────────────┐
   │ 3a. 📥 Export PDF / CSV  │  │ 3b. 📧 Send Email        │
   │  → Drive file            │  │  reads snapshot +        │
   │  → registry Report Link  │  │  registry row            │
   │  → LAST_REPORT_CONFIG    │  │  → status = Sent         │
   └──────────────────────────┘  └──────────────────────────┘
                     │                   │
                     └─────────┬─────────┘
                               ▼
                    📊 Faculty Dashboard (web app)
                    reads Master Data + assessment sheets
```

### Explicit "X must come after Y"

| Action | Must come after | Why (what it reads) |
|---|---|---|
| **Export PDF / CSV** | Generate Report | Reads `Report_View` for college (A1) and test name (A3); reads `LAST_REPORT_CONFIG` written during generation. Error otherwise: *"Generate a report first! (🚀 Generate Report)"* |
| **Leaderboard export** | Leaderboard build (or any report, which auto-updates it) | Reads `🏆 Leaderboard`; college name comes from its `🏛️ …` header |
| **Send Single Email** | Generate Report (strong) + Export (soft) | Reads `REPORT_SNAPSHOT_<assessment>_<batch>`. Without the snapshot it falls back to scanning `Report_View`, then to the registry row with **attendance 0**. The report link in the email (`data[3]`) is only filled by the **export** step — without it the email shows "Report: Missing" |
| **Email, at all** | An `Email Registry` row | Row is created by Generate Report with status `Generated`, but **with Email and CC blank**. Fill those two cells before sending, or the dialog stops you with *"No \"To\" email in the registry for this row."* This blank-by-design behaviour is unchanged from your original. |
| **Batch Email** | Multiple registry rows with Email filled | Same check per row; rows already `Sent` are shown disabled |
| **Rebuild Leaderboard** | *(none — but after Clear Leaderboard)* | Clear wipes `📊 Leaderboard` / `📋 Analysis`; rebuild regenerates them from Master Data + test sheets |
| **🎓 TPO Dashboard** | Leaderboard build | Reads the leaderboard and analysis sheets; without them `leaderboardType` is `"None"` and the cards stay empty. Also reads `Assessment Registry` for "Recent Assessments" and `Master Data` for the student count |
| **📊 Leaderboard Analytics** | A built leaderboard | Reads `📊 <type> Leaderboard` only — KPIs, branch and assessment rollups, and the three drill-downs. It never touches raw assessment sheets, so its numbers always equal the sheet the TPO is reading. Batch comes from a Master Data join (the leaderboard has no Batch column). |
| **📊 Faculty Dashboard** (web app) | **A built leaderboard** | Now reads `📊 <type> Leaderboard` (joined to `Master Data` for batch/college and for students who never appeared). It no longer reads raw assessment sheets or `Report_View`. Build the leaderboard before opening the web app. Rollback: `setFacultyDataSource('raw')`. |
| **Anything** | College Setup (optional, recommended first) | Sets the college name used by reports, exports, emails and the registry. Skip it and detection fills the gap (see README). |

### What Generate Report writes (so you know what's downstream)

In one run it produces, in this order:

1. `Report_View` — the formatted report
2. `REPORT_SNAPSHOT_<testName>_<batch>` + `LAST_REPORT_CONFIG` — Script Properties; **the email and export steps depend on these**
3. `Email Registry` row — status `Generated`, Email/CC **blank**
4. `Assessment Registry` entry + the assessment sheet (via `ensureAssessmentSheet` / `registerAssessment`)
5. Leaderboard auto-update (`autoUpdateLeaderboard`) — failure here is logged, never blocks the report

---

## C. First-time sequence (once per college spreadsheet)

1. **Install** `Code.gs` → the 8 required HTML files (table A).
2. **🏫 College Setup** → confirm college → save programme groups.
3. Fill **`Master Data`**: Name, Email, Reg No, Branch.
4. Fill **`Report generator`**: Name, Email, Reg No, Batch, Branch, Score.
5. **🚀 Generate Report** → check `Report_View`.
6. **📥 Export PDF as PDF** → check the Drive folder, and that `Report Link` landed in `Email Registry`.
7. Fill **Email** + **CC** in the `Email Registry` row.
8. **📧 Send Single Report** → pick assessment, batch, date → send.
9. **🏆 Open Leaderboard** (or rely on step 5's auto-update) → **📊 Leaderboard Analytics** (drill-downs) → **🎓 TPO Dashboard**.
10. **Deploy → Web app** → open the URL for **📊 Faculty Dashboard** (reads the same leaderboard as step 9).

## D. Daily sequence

```
Report generator → 🚀 Generate Report → 📥 Export PDF → fill Email/CC → 📧 Send
```
Leaderboard and dashboards refresh themselves from the same data; nothing else needs to run in order.

---

## E. Symptom → cause lookup

| You see | The prerequisite you skipped |
|---|---|
| *"Cannot find file: ReportDialog"* | `ReportDialog.html` not created, or named differently (e.g. `ReportDialog.html.html`) |
| *"Generate a report first!"* | Export clicked before Generate Report |
| *"No Email Registry record found…"* | Email clicked for an assessment/batch/date that was never generated |
| *"No recipients found in Email Registry"* / *"No To email in the registry"* | Email + CC cells are blank on that row |
| TPO dashboard cards all zero, type `"None"` | No leaderboard built yet |
| Leaderboard Analytics says "No leaderboard sheet found" | Same — build the leaderboard first |
| Leaderboard Analytics shows a yellow data-quality banner | Branch labels need mapping in 🏫 College Setup |
| Faculty dashboard empty | No leaderboard built yet — it now reads the leaderboard (or `Master Data` missing for the roster join) |
| Faculty dashboard shows the OLD numbers | `FD_DATA_SOURCE` is still `raw` — run `setFacultyDataSource('leaderboard')` |
| A 1-test student is topping the dashboard | You are on an old copy of `FacultyDashboard.html` — the score rule changed (absent = 0). Re-paste the file. |
| Email body shows attendance 0 | Report was regenerated without the snapshot, or the snapshot expired; regenerate the report |
| Everything shows "Unknown College" | 🏫 College Setup not run and no report/leaderboard exists to detect from |
