# Auto Curriculum ↔ Faculty Mapping

**Problem.** Assigning every course of an assigned curriculum to a faculty member
was manual: the principal/HOD opened the Mappings dialog and picked a person for
each course × batch by hand. For a 15-course semester across 2–3 batches that is
hours of pointing and clicking, and the only "intelligence" was whatever the
HOD remembered about who teaches what.

**Fix.** A deterministic, explainable assignment algorithm (`runAutoMapping`)
runs server-side; the HOD reviews a scored proposal and approves — nothing is
written before a human says yes.

```
Admin → Curriculum → [expand a curriculum] → "Auto-Map N unmapped"
        │
        ▼
autoMapCurriculum (callable, DRY RUN — writes nothing)
        │  reads: curriculum doc · faculty roster · all active mappings
        ▼
   proposal:  per course → faculty, score 0–100, point-by-point reasons, flags
        │
        ▼   HOD unticks what they reject, then
applyAutoMapping (callable — recomputes on FRESH data, writes approved subset)
        │
        ▼
curriculumFacultyMappings rows (status: active, autoMapped: true, autoMapScore: n)
```

## The algorithm

### 1. Load
Every faculty member's **current weekly teaching load** is computed from all
*active* `curriculumFacultyMappings` in the college (any curriculum, any
batch). A course's `totalHours` is converted to periods/week by dividing by the
semester length (default 15 weeks, configurable); courses without hours fall
back to `credits × 4`.

### 2. Score (0–100 per faculty × course)

| Component | Points | Signal |
| --- | --- | --- |
| Subject fit | 50 | Token overlap of the course name against the faculty's `subjectsUG` + `subjectsPG` + `specialization`. Stopwords dropped, plurals folded, abbreviations expanded (`com→commerce`, `sc→science`, `math→mathematics`), roman part-markers ignored ("Financial Accounting **I**" still fully matches "Financial Accounting"). |
| Branch fit | 15 | Faculty `branches[]` / `department` vs the curriculum branch (exact = 15, related = 8–10). |
| Experience | 10 | Years of service, capped at 10. |
| Balance | 25 | Headroom: `25 × (1 − currentLoad/capacity)`. Less-loaded faculty score higher — the term ends levelled, not piled on one person. |

Branch is a *bonus*, not a gate — the manual flow deliberately allows faculty to
teach across branches/years, and the algorithm keeps that freedom (a mismatch
just loses points and shows in the reasons).

### 3. Assign (greedy, most-constrained-first)
1. Courses are ordered by **fewest eligible candidates first** (then heavier
   courses, then a stable code/semester tiebreak). A course that only one
   person can teach never loses a bidding war to a popular one.
2. Each course goes to the highest-scoring faculty who is
   - **not already mapped** to that course in this batch/division/section
     (identity matched by uid, profile id *or* email — legacy rows included), and
   - **within capacity** (default 24 periods/week — UGC regular faculty).
3. If *nobody* fits the capacity, the best faculty is still proposed but
   flagged **`overload-risk`** — a visible compromise beats a silent gap.
4. No faculty at all → the course is returned **unassigned** with a reason.

### 4. Guarantees
- **Deterministic** — same data in, same plan out (ties break on score → name
  → email). Preview and apply can disagree only if the data changed between
  the two calls; apply always recomputes on fresh data and skips anything
  that became already-mapped in the meantime.
- **Auditable** — every written row carries `autoMapped: true` and
  `autoMapScore`, and the preview's `reasons` string answers "why this
  person?" in plain language.
- **Never destructive** — existing active mappings are only *inputs* (load +
  dedupe); the algorithm does not move or remove a human's assignment.

## Callables

| Callable | Who | What |
| --- | --- | --- |
| `autoMapCurriculum` | superadmin / admin / principal / hod | `dryRun` semantics: compute and return the plan only. |
| `applyAutoMapping` | same | Recompute, then batch-write the approved `courseIds` (empty = all proposed) as ordinary active mappings. |
| `bulkImportWeeklySchedules` | same | Bulk timetable CSV: `dryRun` (default) returns a per-row report; `dryRun: false` writes only the valid rows. |

Tenancy follows the same contract as the schedule callables: the college comes
from the auth claim (a superadmin may name one explicitly); the client never
gets to pick its own tenant.

## How it fits with the bulk schedule import

The mapping step answers **"who teaches what"**; the timetable answers
**"when and where"**. The two are now linked in both directions:

- **Bulk import cross-references mappings.** Every CSV row is checked against
  the college's active `curriculumFacultyMappings`: a subject not in the
  assigned curriculum, or one booked to a different person than the mapping
  says, surfaces as a warning in the preview. (These were the silent typos
  that used to make "My Curriculum" and topic coverage miss sessions.)
- **The import path is now safe.** The old client-side `split(',')` +
  `writeBatch` path had no validation (a bad `dayOfWeek` silently became
  *monday*), no clash check, and no dedupe. `bulkImportWeeklySchedules` runs
  the *same pure clash maths* (`utils/timetableConflicts.ts`) that
  `generateClassSessions` enforces at materialisation time, plus:
  - full row validation (day aliases, 24 h times, end > start, semester 1–10, class-type aliases);
  - quote-aware CSV parsing (a subject containing a comma no longer breaks the row);
  - duplicate detection against the live timetable *and* against earlier rows of the same file;
  - hard clashes (faculty/room) block the row, cohort overlaps warn;
  - faculty names resolved server-side from the roster in one read, not N round-trips.

The UI flow for both features is the same two-step, human-in-the-loop pattern:
**generate → review → apply**.

## Future enhancements (deliberately out of scope for v1)

1. **Time-slot suggestion** — once a mapping exists, run the same scoring over
   free slots in the weekly grid to propose *times*, not just people.
2. **Preference inputs** — per-faculty "prefers morning / avoids Friday"
   flags fed into the balance term.
3. **Exact solver** — the greedy is O(courses × faculty) and explainable; a
   max-weight bipartite matching (or min-cost flow with capacity) would find
   the globally optimal assignment when scoring gets more sophisticated. The
   pure-core boundary (`runAutoMapping(options) → result`) means swapping the
   strategy touches one function.
4. **Rebalancing** — a "what-if" mode that can *move* an existing mapping
   (with an explicit, logged `autoMapped: 'rebalanced'` marker) when a faculty
   member leaves mid-term.

## Tests

- `functions/test/autoCurriculumMapping.test.ts` — fit ranking, branch bonus,
  load balancing, overload flagging, most-constrained-first ordering, dedupe
  (uid/email identity), unassigned handling, determinism, payload validation.
- `functions/test/scheduleImport.test.ts` — CSV parsing (quotes/escapes/CRLF),
  day/type normalisation, per-row validation, duplicates (file + live),
  faculty/room/cohort clashes, mapping cross-reference warnings, payload caps.
