# The Curriculum → Timetable → Reschedule flow

Date: 2026-09-30 · Surface: **Admin → Curriculum** (`/admin/curriculum`) ·
Server: `functions/src/classSchedule.ts` (S2.6), `rescheduleClass`

This document describes the one screen an admin uses to take a programme from
"the syllabus was imported" to "the classes are on the timetable and can be
moved when plans change", and the server contract behind the moves.

---

## 1. What the admin sees

```
Curriculum → Timetable
├─ Branch ▾   Batch ▾   ────── 42 of 58 subjects on the timetable   72%
├─ 1. Pick a semester
│    [Sem 1 ready] [Sem 2 to do] [Sem 3 to do] [Sem 4 to do] [Sem 5 —] [Sem 6 —]
├─ 2. Assign faculty, schedule the class, reschedule when it moves
│    Subject                Faculty            Timetable                        Actions
│    Financial Accounting   Asha Rao           [Mon 09:00–10:00 · R12] ⟳ ⇄ ✕    Reassign · Add slot
│    Business Law           — No faculty —     Not on the timetable yet.        Assign   · Schedule
│    Cost Accounting        Ravi Kumar         [Tue 11:00–12:00 · R14] ⟳ ⇄ ✕    Reassign · Add slot
└─ All curricula on file (4)                        ← collapsed
```

Every semester 1–6 is a tile, including the ones with nothing imported: a gap
in the ladder is information ("Semester 4 has no curriculum"), not a blank.

The row actions are the whole flow:

| Action | What happens | Server path |
| --- | --- | --- |
| **Assign / Reassign** | `curriculumFacultyMappings` row for the subject + cohort | `createMapping` / `updateMapping` (rules-gated to admin/hod/principal) |
| **Schedule / Add slot** | Weekly slot in `weeklySchedules`, then optionally the next term's dated classes | `createWeeklySchedule` → `generateClassSessions` |
| **⟳ (create dated classes)** | Top up `classSessions` for an existing slot — idempotent | `generateClassSessions` |
| **⇄ (reschedule)** | Move the slot *or* one class; future unmarked classes follow | `rescheduleClass` |
| **✕ (cancel)** | Switch the slot off and cancel its future unmarked classes | `cancelWeeklySchedule` |

The timetable query on this page uses the same cache key as the Class Schedule
page — `['weeklySchedules', 'admin', collegeId]` — so both screens agree the
moment either one writes.

---

## 2. Where the data lives

| Layer | Collection | Written by |
| --- | --- | --- |
| Curriculum (subjects, modules) | `curriculum` | super-admin import |
| Faculty assignment | `curriculumFacultyMappings` | this page (assign/reassign/remove), Auto-Map |
| Recurring timetable ("the plan") | `weeklySchedules` | this page, Class Schedule page, auto-scheduler, bulk import |
| Dated classes ("the actual") | `classSessions` | `generateClassSessions`, `ensureClassSession`, **`rescheduleClass`** |
| Topic ledger / coverage | `facultyTopics` | `completeClassSession` |

Join key between curriculum and timetable: **subject code + branch + semester**
(the timetable stores no courseId — audit finding F6). Batch is a filter on
top, never part of the key, because one subject can be taught to several
batches. That function is `scheduledClassKey()` in
`src/modules/admin/utils/curriculumFlow.ts`, unit-tested.

Faculty identity is deliberately two-keyed:

* mappings store the **Auth uid** (`useCurriculumMapping.assignFaculty`) — it is
  what the faculty app queries by;
* timetable slots store the **faculty profile document id** — it is what the
  Class Schedule page has always written, and what
  `fetchFacultyWeeklySchedule` resolves either way from.

`ScheduleSlotDialog` translates between them when it prefills from a mapping,
so a class scheduled from this page is identical to one scheduled from the
timetable page.

---

## 3. Rescheduling (`rescheduleClass`)

Faculty had a one-class move (`FacultyReschedule`). Admins had nothing: editing
a slot on the timetable grid left every dated class it had already produced
sitting at the old time.

```
rescheduleClass({
  weeklyScheduleId,
  scope: 'slot' | 'session',
  sessionId?,                      // required for 'session'
  dayOfWeek?, startTime?, endTime?, room?, facultyId?, facultyName?,
  date?,                           // 'session' only: the new date
  reason?, from?,                  // from defaults to today (server clock)
  allowConflicts?                  // explicit override for a hard clash
})
→ { moved, merged, unchanged, skippedMarked, skippedPast, conflicts, slotUpdated, message }
```

Safety rules, all enforced server-side:

1. **Only movable classes move.** `status === 'scheduled'`, date on or after
   `from`, no attendance marked, no topics covered. Anything else is reported
   (`skippedMarked`, `skippedPast`, `skippedStatus`) and left untouched —
   delivered history is immutable from here.
2. **The move is forward.** A class shifts to the next occurrence of the new
   weekday, 1–7 days later, never into the past.
3. **A class already on the new day stays.** It only gets the time/room/faculty
   patch, and is reported as `unchanged` if that too is a no-op. This is what
   stops a Mon→Wed move from cascading a Wednesday class a week forward.
4. **A destination that is already taken** by another class of the same slot is
   reported as `merged` for a slot move (the duplicate source is cancelled with
   `mergedInto` set) and refused for a one-off move (`blocked` →
   `failed-precondition`), because cancelling the very class the admin asked to
   move would be destructive.
5. **Cross-day moves keep the deterministic id.** The class is written to
   `${weeklyScheduleId}_${newDate}` and the old id is removed, so a later
   `generateClassSessions` run can neither resurrect the old class nor create a
   duplicate at the new one. One-off moves keep their id and rewrite `date`.
6. **Hard clashes abort the run** — faculty/room double-booking is checked with
   the same `findSessionClashes` engine generation uses, including the moves
   against each other. The clashes come back as `SessionConflictError` details
   and the client offers an explicit "Move anyway".
7. **A one-off move never touches the slot document** (`slotUpdated: false`) —
   the weekly pattern is still the weekly pattern. A slot move stamps the slot
   with `previousSlot` (day/time/room/faculty before the change) plus
   `rescheduledAt/By`, `rescheduleReason` and `approvalStatus: 'approved'` (an
   admin move is pre-approved; the HOD queue stays for faculty requests).

The dialog previews all of this before writing, using `previewSlotMove()` from
the same pure module — the admin sees "2 classes move · 1 already on Wednesday"
first.

---

## 4. Tests

```bash
# Pure planner + callable helpers (functions side)
cd functions && node --import tsx --test test/classSchedule.test.ts     # 158 pass
npx tsc --noEmit -p functions/tsconfig.json                            # clean

# Flow maths (client side)
node --import ./scripts/raw-asset-hooks.mjs --import tsx \
  --test src/modules/admin/utils/curriculumFlow.test.ts                # 24 pass

npm run test:unit    # 600 pass (575 before this work; 599 until the line-ending fix)
npm run test:render  # 400 checks, 18 of them this flow (mounts the page in jsdom)
npm run build        # tsc + vite build, clean
```

The count moved 599 to 600 with `0e648e3`, which fixed the two failures that
only appeared on a Windows checkout: the bundled question-bank CSV is inlined
through Vite's `?raw`, so a CRLF working copy left a `\r` on the header that the
per-programme datasets did not have. `questionBankSeed.ts` now normalises the CSV
to LF at the module boundary and `generate_seed.py` writes with `newline="\n"`;
the new test pins the invariant. Verified on Windows: 600/600 with the CRLF copy
in place and 600/600 with it restored.

The render checks mount the real page against stubbed Firestore fixtures and
assert what lands in the DOM: the 1–6 ladder, the cross-collection join
(curriculum course → mapping → timetable slot), the progress line, the semester
that lands first, and that both dialogs open with the right defaults — including
the reschedule preview naming the dates a class moves between, and the
"nothing materialised yet" case.

Covered on the pure side: `nextDateForDay` (never backwards),
`isMovableSession`, `planReschedule` for both scopes (moves, merges, blocks,
skips, destination claiming), the semester ladder (per-course semester wins
over the curriculum header, branch/batch filters, overlapping curricula
de-duplicated), the join key, and the reschedule preview.

Not covered without a Firestore emulator: the callable's reads/writes
themselves.

---

## 5. Deliberately not in this slice

* **HOD approval for admin moves** — an admin move is applied immediately
  (`approvalStatus: 'approved'`); the existing faculty-request queue is
  untouched.
* **Bulk "move the whole term"** — moving many slots at once would need a
  conflict-free planner across slots, not just within one.
* **Id-based re-keying** of subject/semester everywhere (audit finding F6) —
  `subjectKey` is the stepping stone; the join key stays textual in this slice.
* **Room inventory** — conflicts are checked against `classSessions.room`
  strings, not a rooms collection.

## 6. Adjacent, unchanged

* `/admin/class-schedule` still owns the week grid, bulk import, auto-schedule
  and "Generate Sessions" for a whole term.
* `CurriculumProgress` (`getCurriculumProgress`) still owns coverage and pace.
* Faculty reschedule lives at `/faculty/reschedule` and still stamps
  `status: 'rescheduled'` + `approvalStatus: 'pending'` for the HOD queue.
