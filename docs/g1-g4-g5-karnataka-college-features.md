# G1 + G4 + G5 — Karnataka Degree-College Features

Built from `docs/karnataka-degree-colleges-research.md` (gap register).
This doc is the operator's reference for the three features; each feature's
deepest contract lives at the top of its source file.

---

## G1 — University Scheme Packs

**Problem.** Karnataka has ~33 state universities, each with a different scheme
of examination. BCU's 80+20 / 75% / 35+40 rules were hardcoded in
`bcuCompliance.ts`, which made hall tickets, the compliance dashboard and the
result importer correct for exactly one university.

**What landed.**
- `src/shared/types/schemePack.ts` — `UniversitySchemePack` + three verified
  presets: `BCU_SEP_2024` (default), `KUD_NEP_CBAE` (60+40 CBAE),
  `GENERIC_NEP_2020`.
- `src/shared/utils/schemeEngine.ts` — pure pack-driven engine:
  `calculateSchemeAttendanceMarks`, `calculateSchemeInternalMarks`,
  `checkSchemePassCriteria` (per-course max overrides for 50-mark courses),
  `getSchemeGradeFromMarks`, SGPA, eligibility messaging, `normalizeSchemePack`.
- `src/shared/utils/bcuCompliance.ts` — same exported names and byte-identical
  outputs, now thin wrappers over the BCU pack. 19 parity tests pin this.
- `schemePacks` Firestore collection (college customs only; presets live in
  code). Rules: read staff/same-college, **no client writes** — all writes go
  through the `saveSchemePack` callable, which validates slab structure, IA
  component totals, best-of vs count, grade table and ranges.
  `assignCollegeSchemePack` sets `colleges/{id}.schemePackId` (empty = back to
  BCU default). Custom doc ids are `${collegeId}__${CODE}` — cross-tenant
  overwrite is impossible.
- `src/modules/admin/pages/SchemePacks.tsx` (`/admin/scheme-packs`, nav:
  University Exams → Scheme Packs): assign, clone preset → custom, structured
  editor (slabs / IA / SEE / pass / grades).
- Consumers migrated to `getCollegeSchemePack()`: **result importer**
  (parse + grading in one pack — `preview.schemePack`), **hall-ticket
  generation** (attendance blocking from pack, admin override preserved),
  **compliance dashboard** (fully pack-driven bands/samples/captions),
  **student hall tickets** (eligibility copy follows the pack).

**Contracts.**
- `saveSchemePack { pack }` / `assignCollegeSchemePack { schemePackId }` —
  staff roles via `resolveSchedulingStaff`; superadmin passes `collegeId`.
- Pack identity: preset code (`BCU_SEP_2024` …) or `${collegeId}__${CODE}`.

## G4 — Auto slot scheduler

**Problem.** Faculty→course mapping was automated (PR #77) but the day×period
grid was still hand-drawn Excel — clashes fixed by phone, no "hours per day"
answer for the cohort.

**What landed.**
- `functions/src/autoSchedule.ts` — callable `autoGenerateWeeklySchedule`.
  Demand = ACTIVE `curriculumFacultyMappings` for (curriculum, batch,
  division, section); placement spreads each course's `hoursPerWeek`
  (totalHours/15wk, ≥1) across distinct days, earliest free period, with:
  cohort/faculty/room busy sets seeded from live `weeklySchedules`, faculty
  daily cap (default 4), lab detection (`lab|practical` in name → consecutive
  spans of `labSpan`), least-loaded-free-room choice, 24-period UGC ceiling
  flags. Output: placements + **unplaced with reasons** + per-faculty load
  (existing + placed vs 24) + **daily coverage (periods + hours/day +
  utilization)**.
- `dryRun` defaults TRUE. `dryRun:false` writes normal weeklySchedules docs
  (same shape as bulk import) stamped `autoScheduled`.
- Callables registered in `functions/src/index.ts`.
- `AutoScheduleDialog.tsx` — wired into the Class Schedule header as
  **"Auto Generate"**: curriculum/batch/division/section + grid config +
  rooms → preview grid (day × period matrix), coverage chips, faculty load,
  unplaced alerts → Apply.
- 13 unit tests (`functions/test/autoSchedule.test.ts`).

**Contract.**
`autoGenerateWeeklySchedule {curriculumId, batch, division?, section?,
grid{days?, periodsPerDay?=5, startTime?='08:00', periodMinutes?=50,
breakAfterPeriod?=3, breakMinutes?=15, labSpan?=2}, rooms?,
maxPeriodsPerDayPerFaculty?=4, semesterWeeks?=15, dryRun?=true, collegeId?}`

## G5 — Guest faculty lifecycle

**Problem.** 30–50% of sections in Karnataka degree colleges are guest/P&T
taught: no system identity, per-period pay in registers, mid-year joins and
expired engagements silently carried into next term.

**What landed.**
- Data model: `guestContract { startDate?, endDate?, periodRate, notes? }` on
  the faculty doc; guest = `employmentType ≠ FULL_TIME` (PART_TIME / ADJUNCT /
  VISITING — the existing taxonomy).
- Write paths: **Create Faculty dialog** (guest panel appears for non-full-time),
  **Faculty CSV import** (`guestPeriodRate`, `guestContractStart`,
  `guestContractEnd` columns), **SuperAdmin faculty detail edit** (contract
  panel + "expired" marker), `provisionStaff` carries it to Firestore.
- **Auto-mapper integration** (`functions/src/autoCurriculumMapping.ts`):
  - guests get a smaller weekly capacity (default **12**, payload
    `guestCapacity`, 1–60) — full-time stays 24;
  - full-time preference tier: a full-time teacher with subject fit ≥15
    always beats a guest; guests are reached for when none exists;
  - `endDate` in the past → excluded from new proposals (existing load still
    counts), surfaced as `summary.contractExpiredGuests`;
  - proposals to guests flagged `guest-assigned`; load rows carry
    `isGuest` + per-faculty capacity.
- **Billing**: `/admin/guest-faculty-billing` (nav: Academics → Guest Faculty
  Billing) — month picker; periods = scheduled weekday occurrences in the
  month × per-period rate, derived from the live timetable; totals cards,
  missing-rate warning, expired markers, CSV export.

## Verification

- functions `tsc` + build clean; unit **737/737** (8 schemePacks, 13
  autoSchedule, 4 new G5 mapping cases).
- frontend `tsc` + `vite build` clean; unit **312/312** (19 scheme engine +
  BCU parity), render **274/274**.
- BCU parity is pinned byte-for-byte: unassigned colleges behave exactly as
  before G1.

---

# Auto-Scheduler v2 — date ranges, topic selection, placement strategies, academic calendar

Operator-driven follow-up to G4 (design record: the v2 handoff brief). Four
asks shipped; contracts below. All defaults preserve pre-v2 behaviour.

## P1 — Slot applicability window (`effectiveFrom` / `effectiveTo`)

- `WeeklySlot` gains optional `effectiveFrom`/`effectiveTo` (`yyyy-mm-dd`,
  inclusive). **Legacy docs without the fields stay perpetual** (no migration).
- `generateClassSessions` skips occurrences outside a slot's window (additive
  `skippedOutsideWindow` count in the response); `cancelWeeklySchedule`
  semantics unchanged.
- `autoGenerateWeeklySchedule` payload gains
  `dateRange?: { from: string; to?: string }` — validated (`validateAutoSchedulePayload`), written through to every created doc. Ranges wider
  than `MAX_GENERATE_RANGE_DAYS` (92) are **warned, not rejected** (the
  expansion callable caps at 92 per run; generate the term in chunks).

## P2 — Course selection & weekly-load overrides (+ topic seeding)

- Payload: `courseOverrides?: Array<{ mappingId, weeklyPeriods?: number|null,
  include?: boolean }>`. `include:false` (or `weeklyPeriods: 0`) excludes the
  course; `weeklyPeriods` overrides the `hoursPerWeek()` derivation.
- A **zero-hour mapping with no override** no longer demands `credits×4`
  periods — it lands in `unplaced` with the explicit reason
  `course has 0 contact hours — set weeklyPeriods`.
- The plan now carries `demand[]` (mappingId, code, name, faculty,
  periodsRequested, included, source: derived|override|excluded|zero-hours) —
  the dialog's per-course table is prefilled from it.
- Topic seeding (v2 scope): when `dateRange` is set, the curriculum course's
  ordered module ids are copied to each created slot as `moduleQueue?: string[]`
  so the session-topics UI can auto-suggest "next module". Full auto-advancing
  topic assignment = v3.

## P3 — Placement strategies (`uniform` · `spread` · `random`)

- Payload: `strategy?: 'uniform'|'spread'|'random'` (default `'uniform'` =
  pre-v2, regression-pinned), `randomSeed?: string`, `roomStrategy?:
  'leastLoaded'|'random'` (default `'leastLoaded'`).
- **Deterministic RNG** (mulberry32 over the seed string): same seed + same
  inputs = same grid, so preview == apply and a run is auditable weeks later.
  The dialog shows the seed (🎲 = new seed); a seedless random call arrives at
  the default seed and echoes `plan.randomSeed`.
- `spread`: day-tiebreak rotates by course rank (`days[n % len]` first) +
  early/late period pendulum (rank parity picks the first end).
- `random`: seeded shuffle of the day order and same-span candidates.
- **Hard constraints are sacred in every mode** (cohort/faculty/room busy,
  faculty daily cap, ≤1 span per course per day, lab span contiguity). The
  24-period UGC ceiling stays flag-only (pre-v2 semantics), always truthful.
  Unplaced reason text is mode-independent.

## P4 — Academic calendar (holidays, fests, exam windows)

**Model** `academicCalendar/{id}`:
`{ collegeId, title, type: 'public-holiday'|'college-holiday'|'study-holiday'|
'fest'|'exam', startDate, endDate (yyyy-mm-dd, inclusive), suspendsClasses,
notes?, createdBy, createdAt, updatedAt }`.
`DEFAULT_SUSPENDS_CLASSES`: true for holidays/study-holiday/exam, **false for
fests** (spec default; every event's stored flag wins).

**Rules:** staff of the college (+ superadmin) read; **writes are client-denied**
— mirror of `schemePacks`.

**Callables** (registered in `functions/src/index.ts`, region `asia-south1`):

```
saveCalendarEvent { event: { id?, title, type, startDate, endDate,
  suspendsClasses?, notes? }, collegeId? }
  → { id, updated, warnings[] }     // type enum + date order validated;
                                    // overlaps allowed but warned

deleteCalendarEvent { id, collegeId? } → { id }
```

**Scheduler wiring:**
- `autoGenerateWeeklySchedule` reads the college's calendar (≤200 docs) and
  returns `plan.calendar` = events + blocked weekdays (with titles) + blocked
  dates; with a `dateRange`, `summary.teachingDays` / `blockedDays` /
  `blockedBreakdown` split teaching vs suspended grid-days. A calendar-exhausted
  window (0 teaching days) warns explicitly. Weekly patterns still place Mon
  slots on a Mon holiday — sessions, not the grid, are date-skippable.
- `generateClassSessions` suppresses occurrences on `suspendsClasses` dates and
  reports `skippedHolidays: [{ date, reason: 'Holiday: Diwali' }]` +
  `skippedHolidayCount` (additive); fests with `suspendsClasses:false` run
  normally.

**UI:**
- `/admin/academic-calendar` (nav: Academics → Academic Calendar in **both**
  principal and HOD sidebars; Scheme Packs also added to the HOD sidebar):
  month grid + colour-coded type chips + list view + create/edit/delete
  dialog + **"Import Karnataka public holidays (year)"** from the bundled
  static list (`src/shared/data/karnatakaPublicHolidays.ts`, DPAR 2026 + fixed
  2027 dates — verify tentative lunar dates after import).
- `AutoScheduleDialog`: applicability date-range pickers, per-course override
  table, Pattern/Room-pick toggles with one-line explainers, seed field + 🎲,
  calendar summary row, server `warnings[]` surfaced.
- "⛔ Holiday — no classes" banners on AdminClassSchedule (next occurrence of
  the selected weekday), StudentTimetable (today) and FacultySchedule (today)
  via shared `HolidayBanner` + `useAcademicCalendar`.

**Tests:** `functions/test/autoSchedule.test.ts` (batchListMatches ×5 (multi-
batch fix), RNG determinism, strategy/roomStrategy constraint preservation over
a synthetic 6-course input, courseOverrides + 0h reasons, v2 payload
validation), `functions/test/calendar.test.ts` (validation rejects bad type /
inverted dates / missing title; view builders; suppression), `functions/test/
classSchedule.test.ts` (slot windows incl. legacy back-compat),
`firestore.rules.test.ts` (staff-read ok, client write denied).
