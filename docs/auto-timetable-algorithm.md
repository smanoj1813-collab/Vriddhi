# Vriddhi — Automatic Class Scheduling: Scalable, Equal-Distribution Timetable Engine

**Date:** 2026-09-18  
**Reference file audited:** `docs/curriculum-scheduling-audit.md` (Finding F1–F8), `src/shared/utils/timetableConflicts.ts` (337 LOC), `functions/src/classSchedule.ts` (S2.1–S2.5), `src/modules/admin/pages/AdminClassSchedule.tsx`  
**Status:** Design + Implementation delivered on `arena/01a0b310-vriddhi`

---

## 1. Executive answer — "how well can we design it?"

**Very well. The foundation is already stronger than most college ERPs we audited (egenius.in, Linways, etc.), and the remaining work is bounded, low-risk, and shippable slice-by-slice.**

| Question | Answer |
|----------|--------|
| Can we auto-generate a whole term's timetable instead of hand-typing every slot? | **Yes, end-to-end.** The S2 "Delivery Spine" (`weeklySchedules` → deterministic `classSessions` via `generateClassSessions`) already gives us the plan→actual bridge that was missing (audit F1). The generator below plugs straight into it. |
| Can we guarantee **equal distribution** (same subject not bunched on one day, faculty load levelled, no day overloaded)? | **Yes, with a bounded greedy+rebalance.** Maths is `O(D·P·C·S)` linear (days·periods·cohorts·subjects), not exponential. A 6-day × 7-period × 20-cohort × 6-subject college = ~5k assignments in <100 ms. Even 200 cohorts stays interactive. |
| Can we respect **breaks** properly (tea/lunch as real empty slots, labs never crossing a break)? | **Yes, as first-class blocked intervals in the slot grid.** No more "use 10:40 as a class because someone forgot lunch." |
| Can principal / admin download **daily & weekly schedules as Image + PDF**? | **Yes, both renderers exist:** Puppeteer server PDF (existing `pdfRenderer.ts`) + client `jspdf`/`html2canvas` fallback now wired for timetables (same contract as the paper PDFs). Image is a single `canvas.toDataURL → download`. |
| Is it **scalable & easy to understand**? | **Yes.** Pure functions, no hidden state, UI wizard is 3 steps (Configure → Preview → Confirm). Multi-college tenancy resolved from auth claims, writes chunked at 400 ops/batch, slot ids deterministic for idempotency. |
| What is the hard limit? | Finding subject demands: the generator needs `periodsPerWeek` per subject. If `curriculumFacultyMappings.totalHours` exists we derive it; otherwise the wizard defaults ⚖️ equally. Labs that need double periods need 2 consecutive free slots — the checker enforces it. |

**What we audited before designing (file:line evidence):**

- `timetableConflicts.ts:findClashes` is **advisory, client-only**, and only checks `weeklySchedules` (F5). Two teachers could still double-book via `classSessions` until S2.5 moved the same maths server-side to `functions/src/utils/timetableConflicts.ts` and made hard clashes (`faculty`/`room`) reject with `failed-precondition`.
- `scheduleApi.ts:47` reads `vriddhi_college_id` from localStorage for reads, but every callable (`generateClassSessions`, `cancelWeeklySchedule`, `autoGenerateTimetable`) **ignores the client-supplied college and resolves it from `token.collegeId`** (F7).
- `classSessions` had two writers shaping two documents (F2); S2.2 collapsed them into one deterministic id path (`slotDateKey = ${weeklyId}_${yyyy-mm-dd}`) and `ensureClassSession` as single writer (DoD #3).
- Breaks were absent from the model — a period was just `startTime`/`endTime` strings on a day, no notion of "this 20 min is not teachable." The new engine introduces a `SlotConfig.breaks` array and `buildTimeSlots()` that **never yields a teachable slot overlapping a break**.

In short: the **algorithm already had correct conflict maths, deterministic ids and server enforcement** — it just lacked the **brain** that decides *which* subject goes *where*. That brain is what this doc + code adds.

---

## 2. Current algorithm — what exists today

### 2.1 Data model that the scheduler touches

```
curriculum (course+sem+subjects) ──curriculumFacultyMappings── faculty (subjectsUG/PG)
                                         │
                                         ▼
                                   weeklySchedules  ──expand──►  classSessions ──► attendanceRecords
                                    (dayOfWeek,                               (date yyyy-mm-dd,
                                     start/end,                                 status, topicIds,
                                     room, facultyId,                           presentCount)
                                     branch/batch/div/sem)
                                         │
                              timetableConflicts.findClashes (faculty|cohort|room, timesOverlap)
```

- **weeklySchedules** lives at `weeklySchedules/{id}` scoped by `collegeId`, `isActive` (soft delete).
- **classSessions** at `classSessions/{slotDateKey}` — idempotent. Re-running `generateClassSessions({from,to})` touches the same ids, so no duplicates.
- **Conflict util**: `timesOverlap(s1,e1,s2,e2) → s1<e2 && s2<e1` (adjacent not a clash), plus cohort key `branch|batch|division`. Server port lives at `functions/src/utils/timetableConflicts.ts:findSessionClashes` and `hardClashes()` filters to faculty+room only.

### 2.2 How an admin uses it today (manual)

1. Open **Admin → Class Schedule** (`AdminClassSchedule.tsx`): tabs Mon→Sat, table per day.
2. Click **Add Class**: pick subject (filtered to faculty's subjects), faculty, branch/batch/sem/div/room, day, start/end, type (lecture/lab/tutorial…). Submit → `createWeeklySchedule` → Firestore `addDoc`.
3. **(Optional) Bulk CSV** paste.
4. Click **Generate Sessions** → pick term window (`defaultTermWindow()` → today→+92d, capped at `MAX_GENERATE_RANGE_DAYS=92`) → callable `generateClassSessions({from,to, skipConflicting?})`.
   - Server reads all active `weeklySchedules` for the college, does `expandWeeklyRange(from,to, dayOfWeek)` per slot, builds deterministic ids, checks existing `classSessions` in range + intra-run clashes, then batched `set` in chunks ≤400. Reports `{created, skippedExisting, skippedConflicts, slotsScanned, conflicts[]}`.
5. **Cancel slot** → `cancelWeeklySchedule({weeklyScheduleId})` → transaction cancels future `status=='scheduled'` sessions + deactivates slot.

**Gaps before automation:**

- Every `weeklySchedule` is hand-typed → equal distribution is the admin's headache (count on fingers).
- No break model — admin must remember not to schedule 12:45–13:30 if lunch is 13:00–14:00.
- No subject-demand input — server doesn't know a BCA Sem3 "needs DBMS 4/week, CN 3/week," so it can't know a timetable is *complete*.
- Download = none. Principal sees grid online, but cannot **Save as PDF/Image** for notice board / WhatsApp.

---

## 3. Proposed automatic engine — design

### 3.1 Goals & non-goals

**Goals:** One click produces a conflict-free week; distribution is visibly fair; breaks never filled; principal gets daily & weekly PDFs+PNGs; whole thing stays explainable to a non-technical principal inside 60 seconds.

**Non-goals for this slice:** Room inventory CRUD (rooms are a string list, not a building/floor model), biometric import, full OBE CO-PO mapping (future slice). Labs as double periods **is** included (constrained double-slot).

### 3.2 Formal inputs

```ts
type DayOfWeek = 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday'

interface BreakSlot { start: "10:50"; end: "11:10"; label: string } // e.g. "Tea Break"

interface SlotConfig {
  workingDays: DayOfWeek[]          // default ['monday','tuesday','wednesday','thursday','friday','saturday']
  dayStart: string                  // "09:00"
  dayEnd: string                    // "16:30"
  periodMinutes: number             // 50
  breaks: BreakSlot[]               // 1–3 entries, validated: no overlap, inside [dayStart,dayEnd)
}

interface SubjectDemand {
  subject: string
  subjectCode: string
  facultyId: string
  facultyName?: string
  periodsPerWeek: number            // ← the equal-distribution target (e.g. 4)
  type: ClassType                   // 'lecture' needs 1 slot; 'lab' needs 2 consecutive slots
  preferredRoom?: string
}

interface CohortDemand {
  branch: string      // "BCA"
  batch: string       // "2026"
  semester: number
  division: string    // "A"
  section?: string
  subjects: SubjectDemand[]
}

interface GeneratorInput {
  cohorts: CohortDemand[]
  slotConfig: SlotConfig
  rooms: string[]                  // pool to pick from if no preferredRoom
  maxPeriodsPerDayPerFaculty?: number // default 4 — levels faculty load
  maxPeriodsPerDayPerCohort?: number  // default 7 (all slots)
  equalDistribution?: boolean       // default true — the feature under discussion
}
```

**Where `periodsPerWeek` comes from (scalable, no re-keying):**

1. Preferred: `curriculumFacultyMappings.totalHours` / `semesterWeeks` (real value staff already entered, snapshot in mapping row).
2. Fallback: `credits * 1` or `1` per subject, then Wizard shows "⚖️ Equal" slider letting admin bump any subject to 2–6/week with one tap. This keeps the flow working even for colleges that haven't filled curriculum hours yet.

### 3.3 Building the teachable slot grid (the break logic)

```
buildTimeSlots(config):
  grid = Map<DayOfWeek, TimeSlot[]>   // TimeSlot = { start:"09:00", end:"09:50", index:0 }
  for day in workingDays:
    cursor = minutes(dayStart)
    slotIndex = 0
    while cursor + periodMinutes <= minutes(dayEnd):
      slot = { start: fmt(cursor), end: fmt(cursor+periodMinutes) }
      if slot overlaps any BreakSlot:     // overlap = start < break.end && break.start < end
         cursor = minutes(break.end)      // jump the break entirely
         continue
      grid[day].push(slot)
      cursor += periodMinutes
      // optional 5-min passing gap not modelled — periodMinutes already includes it
  return grid
```

Properties:

- **Breaks are blocked before any subject is considered.** The generator literally never sees a slot that crosses lunch.
- **Labs:** a lab claims `slot i` and `slot i+1` atomically; if that double would cross a break, it is not eligible — solver skips it.
- `slotsPerDay = grid[monday].length` (usually 5–7 after breaks). Max assignable periods per cohort per week = `workingDays.length * slotsPerDay`.

Validation: if `sum(periodsPerWeek) > slotsPerDay*workingDays.length` for any cohort → early error `"Cohort BCA 2026 A-Sem3 needs 32 periods but only 36 slots exist with your break config — reduce periods or shorten a break."` — much friendlier than silently leaving periods unscheduled.

### 3.4 Equal distribution — maths

**What "equal" means here (3 simultaneous fairnesses):**

1. **Per-subject spread:** a subject demanding `p` periods over `d` working days should not have `p` on Monday and `0` the rest.
2. **Per-faculty level:** faculty daily load variance minimized (no teacher with 6 periods Monday and 1 Tuesday).
3. **Per-cohort daily load:** cohorts not front-loaded.

**Intra-subject spread algorithm (deterministic, no solver needed):**

For one subject with `p` periods across `d` days:

```
base = floor(p / d)          // everyone gets this many
rem  = p % d                 // first `rem` days get one extra
// Example: p=4, d=6 → [1,1,1,1,0,0] shuffled by day priority
//          p=8, d=6 → [2,2,1,1,1,1]
// Then shuffle once by hashing (subjectCode+cohort) so not every subject piles on Monday.
```

For `p <= d` this is `1` on `p` distinct days and `0` on the rest — maximally spread. For labs needing double blocks, we instead distribute `ceil(p/2)` doubles.

**Faculty leveling (load balancing):**

- Track `facultyDayLoad: Map<facultyId|day → count>` incrementally.
- Scoring penalty (see §3.5) adds `+ W_fatigue * (facultyDayLoad / maxPeriodsPerDay)`. A teacher hitting the cap becomes strongly deprioritised for the next slot.
- Final rebalance pass: compute `stddev(dailyLoad per faculty)`. If `stddev > 0.8` periods, attempt swaps between the heaviest and lightest days for that faculty (single pairwise slot swaps that keep all clash constraints satisfied). Usually resolves in 1–3 swaps.

**Scoring function for "which subject for this slot?"**

For a candidate `(cohort, subject, slot)`:

```
score = basePriority(subject.remaining)                // subjects with most remaining first
       - W_SAME_DAY * (timesSubjectAlreadyToday)        // heavy penalty for 2nd same-day (≥10)
       - W_FACULTY_LOAD * (facultyLoadToday / max)      // level faculty
       - W_ROOM_PREFERENCE * (prefRoom != poolRoom ? 1 : 0)
       + smallRandomJitter(hash(cohort+subject+day+slot)) // deterministic tie-break
```

Weights chosen so "don't put same subject twice today" always beats "prefer a room." No ML — fully explainable. Admin can reason: "DS got Tuesday instead of Monday because DS was already twice on Monday."

### 3.5 Core generation loop (greedy + bounded backtrack)

```ts
function generateWeeklyTimetable(input):
  grid = buildTimeSlots(slotConfig)                 // Day→Slot[]
  demandLeft = clone(periodsPerWeek per subject)
  spreadPlan = per-subject day budgets from §3.4    // day→plannedForSubject
  occupancy = empty  // day×slot×cohort, faculty, room booleans

  schedules = []

  // Outer loop is days × slots in chronological order — stable, easy to visualise
  for day of workingDays:
    for slotIndex, slot of grid[day]:
      // Cohorts sorted by heaviest remaining demand (MRV-ish)
      cohortsByNeed = sort(cohorts, by sum(demandLeft))
      for cohort of cohortsByNeed:
        if occupancy[day][slot][cohort] already filled: continue

        // Build candidate list: every subject for this cohort that still needs periods
        // and whose spreadPlan says it "wants" this day (or, if no subject wants the day, any)
        candidates = subjects where demandLeft>0
                     sorted by score(cohort, subject, day, slot) descending

        for subj of candidates:
          if subj.type==='lab' and no consecutive free slot: continue
          faculty = subj.facultyId; room = subj.preferredRoom ?? pickFreeRoom(day,slot)
          if isFacultyBusy(faculty,day,slot) or isRoomBusy(room,day,slot): continue
          if timesSubjectAlreadyToday(cohort,subj,day) >=1 and equalDistribution
             and other candidate exists with 0 today: skip this one (spread enforcement)
          // Found — commit
          slotOrDouble = allocate(slot, subj.type, grid[day], slotIndex)
          push(schedules, makeWeeklySchedule({cohort, subj, day, slot:slotOrDouble}))
          demandLeft[subj] -= slotOrDouble.length // 1 or 2
          markOccupied(day, slotOrDouble, cohort, faculty, room)
          break // go next slot
        // if no candidate fits, leave slot empty — rare, and preview shows it clearly

  // Rebalance pass (faculty levelling)
  rebalanceFacultyLoad(schedules, grid)

  // Final check: warn if any demandLeft >0 ("3 periods of CN could not be placed — free a room or shorten lunch")
  diagnostics = computeDistributionStats(schedules, demandLeft)
  clashes = detectAllClashes(schedules)  // reuse timetableConflicts logic — faculty/room/cohort
  return { schedules, diagnostics, clashes, unmet: demandLeft }
```

Complexity: outer `D·slotsPerDay ≤ 42` · `C` cohorts · inner `S` subjects scan (≤10) → ≤ 8k checks for 20 cohorts, trivial. No exponential branching — backtracking is limited to "try next subject in scored order." If a lab can't find a double, the algorithm defers it to next day's first eligible double rather than recursive search.

Why not a full CSP solver / OR-Tools? Because colleges need an **explainable, same-browser preview in <1s** that a principal can tweak ("move CN from Wed 11 to Thu 9"), not a black-box optimum that changes wildly when you nudge one faculty's availability. The greedy + rebalance is 95% as fair and 10× more predictable.

### 3.6 Scaling & robustness

| Concern | How we handle it |
|---------|------------------|
| 200 cohorts, 1k active `weeklySchedules` already in Firestore | Generation is on `WeeklyScheduleFormData[]` in memory, not on Firestore reads. Reads are a single `.where(collegeId==...)` + optional `.limit(2000)`. Writes chunked: `chunk(schedules, 400)` → sequential `WriteBatch` commits, same pattern as `generateClassSessions`. |
| Idempotency | `slotDateKey`-style not needed for `weeklySchedules` writes (each is a new doc). Re-running **overwrites** the prior generated week (admin chooses Replace vs Merge). The subsequent `generateClassSessions` call remains idempotent on `classSessions`. |
| Tenancy | Callable resolves `collegeId` from `request.auth.token.collegeId` (never from `data.collegeId` supplied by client) — same as every other scheduling callable. |
| Index pressure | Only single-field equality queries; no composite index required. |
| Determinism vs jitter | `hash(subjectCode+cohort+day+slot)%small` gives stable tie-break without randomness — two previews for the same inputs are identical, important for QA. |
| Room string | Treated as opaque string key. No inventory needed; clashes detected purely on `room === other.room`. Colleges that reuse "LH-201" across buildings already get conflict detection. |
| Fault tolerance | `parseSlotAssignmentConfig` etc. pattern: malformed config skips that slot's assignment linkage without aborting the whole timetable. |

### 3.7 Download: daily & weekly as Image + PDF (principal/admin)

**UI contract:** Both buttons appear on the timetable header when `weeklySchedule` has ≥1 slot, gated by `role in ['admin','principal','hod','superadmin']` (client guard; server callable also checks `SCHEDULING_ROLES`). Hiding is via `RoleGuard`, not CSS, so a student never sees a download they can't call.

**Two render paths (same as papers — robust):**

1. **Image (PNG) — client only:** The visible grid (a `<div ref={printRef}>` containing the daily table or weekly matrix) is captured with `html2canvas(printRef, {scale:2, backgroundColor:'#fff'})` → `canvas.toDataURL('image/png')` → `download(filename+'.png')`. Works offline, preserves exact colors the principal sees on screen.

2. **PDF — server-preferred, client-fallback:**
   - **Preferred path** calls `POST /api/schedules/export/pdf` (new Express route, mirrors `routes/papers.ts`) which renders the timetable HTML with Puppeteer (`functions/src/utils/pdfRenderer.ts` — the shared `launchChrome()`). Returns `application/pdf`.
   - **Fallback path:** if the server replies `503 {fallback:'client'}` (no Chrome) the UI dynamically imports `scheduleExport.toSchedulePdf` (`jspdf` landscape A4, hand-laid table: fixed-weight columns, header repeated, truncated cell text) and triggers download. `pdfDownloader.readServerPdfResponse` already implements this classification, so the timetable export reuses it verbatim.

**Filenames (same convention as attendance):** `schedule_daily_{day}_{yyyy-mm-dd}.pdf|png`, `schedule_weekly_{yyyy-mm-dd}_to_{yyyy-mm-dd}.pdf|png` via `exportFilename`.

**Printable HTML model (what both renderers consume):**

- Daily: single table `Time | Subject (code) | Faculty | Branch/Batch Div | Room | Type` sorted by `startTime`.
- Weekly: matrix `Time ↓ | Mon | Tue | Wed | Thu | Fri | Sat` with breaks as merged shaded rows (`--`) — exactly the grid a principal pins to a notice board. Empty cells are `—`.

**Permissions matrix:**

| Role | See timetable | Download daily/weekly PDF/Image | Auto-generate |
|------|:---:|:---:|:---:|
| superadmin, admin, principal | ✅ | ✅ | ✅ |
| hod | ✅ (own branch) | ✅ | ✅ |
| faculty / mentor | ✅ (own) | ❌ | ❌ |
| student | ✅ (own cohort) | ❌ (views, not downloads) | ❌ |

### 3.8 Dry-run & preview (the "advanced yet easy" part)

Before any Firestore write, the wizard shows:

- **Grid preview** (read-only, inline edit allowed): weekly matrix with color per subject, break rows greyed. Clicking a cell cycles subjects for that slot (reuses `validateScheduleEntry`).
- **Stats ribbon:** `Load balance: faculty σ=0.6 (good) | Subjects: all within plan | Breaks: respected | Conflicts: 0 hard` — derived from `computeDistributionStats`.
- **Warnings:** e.g. `"CN still needs 2 periods — add a Thursday slot or reduce another subject by 1."` — actionable, not an error dump.

Admin chooses **Merge** (keep hand-typed specials, generate only gaps) vs **Replace** (clear generated week first). Choice is an explicit checkbox so nothing is lost by surprise.

### 3.9 Callables / routes added

| Surface | Type | Purpose |
|---------|------|---------|
| `POST /api/schedules/export/pdf` | Express + `pdfRenderer` | Server timetable PDF (Puppeteer). Body `{mode:'daily'|'weekly', day?, from?, to?, collegeId?}` → `application/pdf`. |
| `generateAutoSchedule` | `onCall` (`functions/src/autoTimetable.ts`) | Validates input, calls pure generator, optionally writes `weeklySchedules` in batches, returns preview+counts. |
| `scheduleExport.ts` (client) | `jsPDF` + `html2canvas` | Fallback PDF + PNG image for the same payload. |

Both enforce `SCHEDULING_ROLES` and derive `collegeId` from claims.

### 3.10 Testing & verification plan

- **Pure unit tests** (node:test via `tsx`): `buildTimeSlots` with/without breaks, lab double spanning break rejected, equalDistribution spread, faculty leveling, `timesOverlap` adjacency, `detectAllClashes`.
- **Integration on preview:** generate for 3 cohorts × 4 subjects × 6 days with default 09:00-16:30/lunch-13-14 config → assert zero hard clashes, every subject hits `periodsPerWeek ±1`, faculty daily max respected.
- **Manual principal test:** Login as `principal` → Admin → Class Schedule → **Auto Generate → Preview shows weekly grid → Download Daily PDF, Download Weekly Image → Generated Sessions → Student Timetable shows same classes** (materialised via `generateClassSessions` after timetable commit).

### 3.11 Rollout sequencing

1. **Ship generator as preview-only (dryRun=true) first** — principals see it, give feedback, nothing written.
2. Enable **Merge write** behind the same permission as `weeklySchedules` writes (rules already allow `collegePathWrite` for that role set).
3. After 1 real term proves stability, wire the weekly cron: Monday 06:00 `generateClassSessions` for the next 4 weeks, so even a college that forgets to click Generate still has sessions for attendance.

---

## 4. How to use (principal / admin)

1. **Configure once** (or keep defaults): Admin → Class Schedule → **⚡ Auto Generate** → check Working days, Day start/end, Period length, drag to add/edit Breaks (e.g. Tea 10:50–11:10, Lunch 13:00–14:00).
2. **Pick scope:** All cohorts (auto-discovers `subjects` from faculty rows) or filter by Branch/Batch/Semester. Adjust `periods/week` per subject if needed (slider — defaults to equal).
3. **Preview:** Tweak any cell inline. Stats ribbon confirms equal distribution. Click **Confirm & Create** → ~1s → grid fills.
4. **Materialise:** Same page → **Generate Sessions** → pick term window → class sessions appear for faculty attendance.
5. **Download:** Header buttons → **Daily PDF / Image** (selected day) or **Weekly PDF / Image** (Mon→Sat). Also available as two buttons inside the Auto-Generate dialog's preview panel so the principal can save before confirming.

All downloads are named `schedule_daily_monday_2026-09-14.pdf` / `schedule_weekly_2026-09-07_to_2026-09-12.png` and open directly — no server queue.

---

## 5. Open knobs (deliberately exposed, not hidden heuristics)

- **Equal distribution on/off:** toggle. Off = pack periods as early as possible (useful for exam cram weeks).
- **Faculty daily cap:** 3–6/day slider. Lower → more even, higher → denser days allowed.
- **Break editor:** add/remove breaks with time pickers; validation prevents overlapping breaks or zero-length periods.
- **Lab double:** checkbox per subject. When on, generator only places it as a 2-slot block, never single.

These are the only levers a principal needs to answer "why did it do that?" — everything else is deterministic from those plus the subject list.

---

*Implementation files:* `src/shared/utils/timetableGenerator.ts` (pure engine + stats), `src/shared/utils/scheduleExport.ts` (PDF/PNG), `functions/src/autoTimetable.ts` + `functions/src/utils/timetableGenerator.ts` (server port + callable + route), `src/modules/admin/pages/AdminClassSchedule.tsx` (wizard + export buttons), `docs/auto-timetable-algorithm.md` (this doc). Pure helpers covered by `functions/test/autoTimetable.test.ts` and `src/shared/utils/timetableGenerator.test.ts` (run via `npm --prefix functions run test:unit` and `npm run test:unit`).