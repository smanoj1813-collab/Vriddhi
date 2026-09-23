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
