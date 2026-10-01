# Teaching groups, merged classes, and load planning

This document describes how one timetable class can serve one division or a
staff-selected merge of divisions without changing the existing student,
attendance, or schedule collection shapes.

## Stored scope: choose it per mapping or class

`division` and `section` remain plain text fields. A single letter is one group;
a comma-separated letter list means one shared teaching group:

```ts
{ division: 'A,B', section: '' } // one class for divisions A and B
{ division: 'C',   section: '' } // a separate class for C
{ division: '',    section: '' } // legacy/whole-batch scope
```

There is no assumed A–E pattern. Admin/HOD selects the letters available from
the college's student roster and existing timetable/mapping data. The same
selection is available in curriculum mapping, administrator manual/extra-class
schedule forms, and auto-schedule filters. An explicit `A,B` mapping is one class; it is not two
copies of a class. For a manually created weekly schedule, an empty division
field remains a whole-batch class; select the divisions when only some groups
share that slot. An unscoped curriculum mapping is different: the auto-scheduler
expands it into the enrolled groups below.

Legacy unscoped mappings are handled from roster data rather than a hardcoded
group count. When an auto-schedule run includes all groups, the server expands
an unscoped mapping to the distinct division/section scopes of enrolled
students in the selected branch, batch, and semester. When a user selects a
specific division, the run narrows to the overlapping group. A run that reaches
the 5,000-student discovery safety cap fails visibly rather than planning from
partial group data.

## Load arithmetic

A weekly course period demand is computed per teaching group. For a mapping
serving `G` separately taught groups:

```text
requested weekly periods = periods per group × groups served
projected faculty load    = existing mapped periods + requested weekly periods
```

An explicit merged scope such as `A,B` has `groups served = 1`; an unscoped
legacy row uses the distinct enrolled groups found for its branch/batch (and
semester for proposals). Auto Map's preview shows the per-group demand, the
number of groups, the existing + proposed arithmetic, and—when overloaded—a
specific merge recommendation with its estimated periods saved. A merge is a
planning suggestion for the HOD; the system never merges a class without the
administrator selecting the shared divisions.

Illustrative planning example:

- 8 subjects × 5 separate divisions × about 3.5 periods/week ≈ 140 weekly
  periods;
- 5 regular faculty × 24 periods/week = 120 periods of nominal capacity;
- a plan with shared groups such as A+B, C+D, and E can be estimated at about
  2.5 group-equivalents: 8 × 3.5 × 2.5 ≈ 70 periods/week, or about 14 per
  faculty across five faculty members.

Use the actual subject hours and faculty capacities from the preview—the
figures above are an illustration, not a preset grouping rule.

## Auto-schedule behavior and constraints

The scheduler places one subject × teaching-group demand. Disjoint divisions
may use the same period (in different rooms); a merged placement blocks every
member division. The server checks existing and newly placed occupancy by
branch/batch/division/section overlap and preserves the following hard rules:

- no student-cohort, faculty, or room clashes;
- faculty daily cap (default 4 periods) and weekly cap (default 24 periods), with both limits enforced as hard run constraints;
- at most one meeting of a subject for the same teaching group per day;
- consecutive lab spans remain contiguous.

Placement preferences distribute each cohort's classes across the least-loaded
days. The preview reports daily density for every division, with a target of
4–5 classes/day, plus college-wide slot utilization. The target is advisory:
when grid capacity, faculty availability, or no-clash rules make it impossible,
the report shows the actual count rather than weakening a hard constraint.

Preview is read-only. Apply writes only the planned slots; capacity-limited
periods remain visible as unplaced and the faculty load section explains the
arithmetic and any possible merge savings.

## Student visibility and faculty attendance

The student timetable and today's-class feed use the shared
`matchStudentToCohort` rules. A student in either A or B sees the one `A,B`
class; a student in C does not. Admin, faculty, and student schedule views show
a **Merged class · A+B** badge on a merged slot.

Faculty attendance loads one roster for that shared class. Roster diagnostics
include the whole merged scope when a cohort does not match; **Mark all present**
sets the bulk status for the visible roster. Attendance writes remain
per-student records, so reporting and student attendance histories are not
collapsed into a group-level mark.

## CSV schedule-import guidance

The existing schedule CSV still has one `division` column. Since a comma is a
CSV delimiter, quote a merged value:

```csv
subject,subjectCode,facultyId,facultyName,branch,batch,semester,division,section,room,dayOfWeek,startTime,endTime,type
Business Statistics,BST101,faculty_id_here,Dr. Smith,BBA,2027,4,"A,B",,Auditorium,monday,09:00,10:00,lecture
```

`"A,B"` is parsed as the single division-field value `A,B`; leave `section`
blank unless it carries an additional scope letter. Do not upload two duplicate
rows for A and B when they share one lecture. The import preview validates and
clash-checks the row before it is applied.

## Implementation and tests

- `functions/src/autoCurriculumMapping.ts` — group-aware existing/proposed
  load, overload arithmetic, and merge guidance.
- `functions/src/autoSchedule.ts` — teaching-group expansion, scoped
  occupancy, hard faculty caps, balanced placement, and density report.
- `src/shared/utils/cohortMatching.ts` and
  `functions/src/cohortBatch.ts` — existing letter-set cohort matching;
  student timetable and roster paths reuse these rules.
- `src/shared/components/MergedDivisionChip.tsx` — common schedule indicator.
- Unit coverage: `functions/test/autoCurriculumMapping.test.ts`,
  `functions/test/autoSchedule.test.ts`, `functions/test/cohortBatch.test.ts`,
  `src/shared/utils/divisionGroups.test.ts`, and
  `src/modules/student/utils/studentScheduleMatching.test.ts`.
