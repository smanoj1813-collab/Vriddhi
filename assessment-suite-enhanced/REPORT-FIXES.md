# Report & Analysis formatting — issue ledger

Working through the three screenshots one by one. Each row is a defect I could trace
to a specific line, or a decision that changes numbers and therefore needs your call.

Status key: ✅ fixed · ❌ not a bug · ⚠️ needs your decision · ⏳ queued

---

## A. Fixed in this pass

### 1. `Avg Score` rendering vertically, values cut to `9.1` / `91` ⚠️→✅
- **Seen in:** `📋 Class Test Analysis` → BRANCH-WISE ANALYSIS table
- **Cause:** `writeAnalysisFast()` ran `autoResizeColumn()` on every column, then did
  `sheet.setColumnWidth(3, 15)` — hard-forcing column 3 to **15 px**. `9.1` is the visible
  tail of `66.91`, cropped by a 15 px column.
- **Fixed:** that line is gone; widths now floor at 110 px and cap at 240 px.

### 2. Student names cut to `CH`, `HR`, `PA`, `M`, `NS` ⚠️→✅
- **Seen in:** `📋 Class Test Analysis` → BRANCH-WISE TOP 3 PERFORMERS → `👤 Name`
- **Cause:** same line. Column 3 is `👤 Name` in that table's header list
  (`['🏢 Branch','🏅 Rank','👤 Name','🎫 Reg No','💯 Score','📊 %','🎯 Status','💡 Insight']`),
  so it was the *same* 15 px squeeze.
- **Fixed by the same change.** One line was breaking two different tables — worth knowing,
  because it means the analysis sheet never displayed names correctly on any run.

### 3. `Percentage %` header clipped in Top Performers / At-Risk ⚠️→✅
- **Seen in:** `Report_View` rows 18–19 (`🏆 Top Performers`, `⚠️ At-Risk Students`)
- **Cause:** `applyProfessionalFormatting()` called `autoResizeColumns()` and then *overwrote*
  the first five widths with fixed values `[120, 180, 100, 80, 100]`. Column D = 80 px, which
  is narrower than the header text — and the header had no wrap.
- **Fixed:** those values are now **minimums** (`Math.max(current, floor)`), so a column can
  grow but never be squeezed. Headers in both performer blocks now wrap, with a 30 px row height.

---

## B. Checked and **not** a bug — no change made

### 4. `Needs Training | 16 | 40.00% | <50%` looks stranded at row 16
- **Looks like:** a floating orphan row with rows 12–15 empty above it.
- **Reality:** that block is written by `buildStatusSummary()` at **rows 13–16** — header
  (`Status | Count | Percentage | Criteria`) plus Good to Go / Needs Improvement / Needs Training.
  Your screenshot crops rows 4–15, which is why only the 4th row is visible. The row numbering
  down the left edge jumps `1, 2, 3 → 16, 17, 18`, which confirms it.
- **Action:** none. Moving it would shift the hardcoded layout below it (performers at row 18).

---

## C. Needs your decision — these change the numbers

### 5. `Min` is 0 for every branch
- **Cause:** `buildBranchData()` computes `Math.min(...scores)` over **all** rows in the branch,
  including students whose total is 0 (absent / not attempted). Same for the average, which is
  why `Avg Score` looks low against `Total / Students`.
- **Why I didn't just change it:** it changes every average, rank and "POOR/GOOD/BEST" label on
  a sheet you use daily. Two defensible definitions:
  - **Include absentees** (today): every enrolled student counts; a branch with many absentees
    is penalised. Fair for accountability.
  - **Appeared only**: average over students who actually attempted; absentees reported as a
    separate count. Fair for teaching quality.
- **My recommendation:** keep both — `Students`, `Appeared`, `Absent`, `Avg (appeared)` — so
  nobody loses the current number, and the new one sits next to it.

### 6. The same branch appears under different names
From your three screenshots, all of these exist across sheets:

| Variant | Seen in |
|---|---|
| `B.Tech CSE AIDS` | test sheet (Solarits Test 7), Report_View data table |
| `B.Tech CSE-AIDA` | Analysis branch table, Top-3 |
| `B.Tech CSEAIML` / `B.Tech CSE-AIML` | Report_View branch summary / Analysis |
| `B.Tech CSEIOT` / `B.Tech CSE-CSIOT` | Report_View branch summary / Analysis |
| `Computer Science AI and DA (H…` | Analysis branch table (truncated by the 15 px column) |
| `B.Sc(Bioinformatics)` | Analysis branch table |

Because grouping is exact-string, one branch can split into two rows (or merge two programmes
into one). This is also why the CS / Non-CS grouping needs an alias list rather than literal names.
**Options:** (a) an explicit alias map maintained in 🏫 College Setup, (b) a light normaliser
(hyphens/spaces/case) — fixes `CSE AIDS` vs `CSE-AIDA` but not `AIDS` vs `AIDA`, (c) validate and
reject mismatches at the Master Data level.

---

## D. Cosmetic, by design

### 7. Empty column between Top Performers and At-Risk
`buildPerformers()` starts the At-Risk block at column **6** (`ATRISK_START_COL`), leaving column E
as a spacer. Harmless; say the word if you want them adjacent (change `6` → `5`).

---

## E. Built — leaderboard-driven analytics (your three decisions)

"Faculty dashboard should read the leaderboard sheet and compute all analysis, plus TPO analysis
and drill-down" is a **data-source change**, not formatting. It needs three answers before I
build it, because the leaderboard's schema limits what can be answered:

**Decisions taken:** show *both* bases (existing numbers untouched, `Appeared` / `Absent` / `Avg (appeared)`
added beside them) · branch aliases maintained in 🏫 College Setup · all three drill-downs.

**Built:** `getLeaderboardAnalytics()` + `getStudentDrilldown()` + `getBranchDrilldown()` +
`getAssessmentDrilldown()` in `Code.gs` (Section 10, read-only), and `TPOAnalytics.html`
(menu: **📊 Leaderboard Analytics**). Verified by `test-analytics.cjs` — 93 assertions.

**What `📊 <type> Leaderboard` actually holds** (row 1 = college banner, row 2 = headers, data from row 3):

```
Name | Email | Reg No | Branch | <one column per assessment, e.g. "Quantitative Aptitude (15)"> | Total Score <max> | Rank | Percentage | Status Classification | Insight Interpretation
```

**Answerable from it:** branch / batch rollups, per-assessment difficulty (mean score ÷ max per
column), attendance (non-blank vs blank per assessment), score bands, rank movement, at-risk lists,
topper lists, per-student per-assessment drill-down.

**NOT answerable from it:** anything per question / per topic — there is no question-level data.
`Batch` is also not a leaderboard column (it is in Master Data and in Report_View), so batch-level
analysis would need a Master Data join.

---

## F. Faculty Dashboard — ranking error and layout pass

### 42. A student who sat 1 test at 100% ranked above one who sat 9 at 90% ⚠️→✅
- **Reported:** "student A attended 9 of 10 and scored 90, student B attended 1 of 10 and
  scored 100 — student B is coming in top."
- **Cause:** the page had **two different denominators**. When a Week was selected,
  `recalcForWeek()` built `totalMax` only from the tests present in that student's own record,
  so `Over 100 marks in 1 test` became `100%`. Top Performers then mixed that inflated
  percentage with participation (`pct × 0.5 + participation × 0.5`), which is not enough to
  put a 1-of-10 student back in their place.
- **Fixed:** one function — `computeTotals()` — owns the arithmetic for the whole page.
  `Overall %` divides by the max of **every test in scope** (absent = 0). Ranking is
  `Overall %` desc, then tests sat, then `Avg (appeared)`; the 50/50 composite is gone from
  both the page and `computeAnalytics()`.
- **Nothing removed:** the attended-only figure is now the `Avg (appeared)` column, the
  `Avg (Appeared)` stat card, and the `Appeared:` line in every Branch Performance block.
- **Also fixed while in there:** `sortData()` did `a[key] || ''`, which turned a real `0`
  into an empty string, so 0%-scored rows sorted to the **top** of an "Overall % desc" table.
  Numeric columns now compare numerically.
- **Verified:** `test-fd-ranking.cjs` (43) + `test-fd-render.cjs`.

### 43. Blocks were boxed to 1400 px, uneven, and panels were different heights ⚠️→✅
- **Fixed:** page and header now span the viewport (`max-width: none`, `288px + 1fr` shell);
  eight equal stat tiles in a fixed 4-up grid (was `auto-fit`, which produced a 5 + 2 row and
  two different card heights); all cards share one radius/border/padding; Branch Performance
  scrolls inside a bounded 430 px body so its neighbour no longer stretches to an empty column;
  Top Performers / At-Risk are the same height with sticky table headers; All Students scrolls
  in a 72vh window instead of pushing the page wide.
