# Faculty (staff) attendance

Faculty members mark **their own** attendance, and the principal gets the
analysis and the downloads. This is deliberately separate from student
attendance — students are marked per class session by a teacher; staff are
marked once per calendar day by themselves.

| | Student attendance | Faculty attendance |
| --- | --- | --- |
| Collection | `attendance`, `attendanceRecords`, `attendanceSummary` | `staffAttendance` |
| Grain | one row per student per class session | one document per faculty member per calendar day |
| Written by | a teacher, from *Mark Attendance* | the faculty member, from *My Attendance* (admins may correct) |
| Faculty UI | `/faculty/attendance`, `/faculty/attendance-marking` | `/faculty/my-attendance` |
| Principal UI | `/admin/attendance` | `/admin/faculty-attendance` and the *Faculty Attendance* tab on `/admin/dashboard` |

## Where the code lives

```
src/shared/types/staffAttendance.ts          statuses, weights, record shape
src/shared/utils/staffAttendanceStats.ts     date ranges + all aggregation (pure, unit tested)
src/shared/utils/attendanceExport.ts         CSV / XLSX / PDF writers + report builders
src/shared/api/staffAttendanceApi.ts         Firestore reads/writes for staffAttendance
src/modules/faculty/hooks/useMyStaffAttendance.ts
src/modules/faculty/pages/FacultySelfAttendance.tsx        "My Attendance"
src/modules/admin/hooks/useStaffAttendanceAnalytics.ts
src/modules/admin/components/FacultyAttendancePanel.tsx     analysis + downloads
src/modules/admin/components/FacultyAttendanceTodayCard.tsx Overview tile
src/modules/admin/pages/FacultyAttendanceAdmin.tsx          /admin/faculty-attendance
```

## Data model

Document id is deterministic — `{collegeId}__{facultyUid}__{YYYY-MM-DD}` — so a
double-tap updates the day instead of creating a second one. Every percentage in
the app would silently inflate if a day could be counted twice.

```
staffAttendance/{collegeId}__{uid}__{2026-09-10}
  collegeId, facultyId, facultyName, department, designation
  date: "2026-09-10"      month: "2026-09"
  status: present | late | halfday | absent | leave | medical | onduty | wfh
  checkIn, checkOut       "09:15" / "17:45", empty when not captured
  hoursWorked             derived from the two times
  note, source ('self'|'admin'), markedBy, markedAt, updatedAt
```

## How percentages are computed

All of it is in `staffAttendanceStats.ts` and covered by
`staffAttendanceStats.test.ts`.

* **Working days** = every day in the range except Sunday. There is no holiday
  calendar in this codebase; inventing one silently would make every percentage
  wrong in a way nobody could see.
* **Credited days** use `STAFF_STATUS_WEIGHT`: `present`, `late`, `onduty` and
  `wfh` count as a full day, `halfday` as half, and `absent`, `leave` and
  `medical` as zero. A late arrival still counts — they came in.
* **percentage** = credited days ÷ (working days × faculty in scope), clamped to
  0–100, one decimal.
* Faculty with **no records at all still appear** in the rollup at 0%. A report
  that only lists people who bothered to mark hides exactly the rows a principal
  needs.
* Duplicate records for the same faculty/day are counted once.

## Downloads

Three formats, all generated client-side (`src/shared/utils/attendanceExport.ts`):

* **CSV** — RFC 4180 quoting, UTF-8 BOM so Excel renders Indic names correctly.
* **XLSX** — a real workbook via the `xlsx` dependency, one sheet for the faculty
  summary, one for the monthly register (faculty × day), one for the raw daily
  records. The older faculty export wrote CSV bytes with an `.xlsx` extension,
  which Excel opens with a format warning; nothing new does that.
* **PDF** — landscape A4 via jsPDF, header repeated per page.

Scope of a download:

* Principal, faculty attendance → **Month** picker or **Date range** (from/to),
  plus department and search filters. Filenames:
  `faculty_attendance_2026-09.xlsx`, `faculty_attendance_2026-08-15_to_2026-09-14.pdf`.
* Principal, student attendance (`/admin/attendance`) → **Selected day**,
  **Month**, or **Date range**, with the existing branch/batch filters applied.
  Two sheets: student summary and raw records.
* Faculty, own attendance → the month being viewed.

The on-screen table and the downloaded file cannot disagree: both are produced
by `summarizeByFaculty` / `buildRegister`.

## Security

`current-firestore.rules` → `match /staffAttendance/{docId}`:

* A faculty member reads and writes **only their own** document, in their own
  college. `isStaff()` is deliberately *not* used for the college-wide read —
  it includes faculty and mentors, so it would let any teacher list every
  colleague's attendance.
* `facultyId` is **immutable on update**, for management too. Ownership is
  otherwise checked against the *existing* document, so without this a teacher
  editing their own day could re-parent it onto a colleague's uid and move that
  day of attendance between people — no new document, no delete, so nothing
  else in the ruleset would notice.
* `admin` / `principal` / `hod` read the whole college and may correct a record;
  only `admin` / `principal` may delete a day.
* Role and college come from the verified ID-token claim, never from a
  client-writable profile document.

These are covered by the `staff (faculty) attendance` block in
`functions/test/firestore.rules.test.ts` (7 cases). Run them with
`npm run test:rules` — that needs the Firestore emulator, and therefore a JVM.

## Deployment

The rules and the indexes ship together — the college range query needs the
composite index:

```bash
npm run deploy:rules       # firestore rules + storage
npm run deploy:indexes     # adds staffAttendance (collegeId,date), (collegeId,month), (facultyId,date)
```

## Verification

```bash
npm run test:unit          # 57 tests — the stats and export contracts
npm run test:render        # 21 checks — the components actually mount and render
npm run build              # tsc + vite
node scripts/check-dead-code.cjs
```

`test:render` exists because the other three only prove the code *compiles*.
It boots a jsdom DOM, loads the real components through Vite (so the `@` alias
and TSX go through the same pipeline as the app), and asserts on the rendered
text. Only the I/O boundary is stubbed — Firestore, `AuthContext` and the
router live in `scripts/render-check/stubs/`; the components, their hooks, and
`staffAttendanceStats` are the shipped source.

The fixtures are deliberately small enough to check by hand: 3 faculty, 7
records across 1–3 Sep 2026, and September 2026 has 26 working days. So the
rendered overall figure must be `4.5 / (26 × 3) = 5.8%` and Bala Kumar's
`2.5 / 26 = 9.6%`. If either number moves, the aggregation changed.

`npm run test:rules` (the Firestore rules suite) needs the emulator, which needs
a JVM — it was not run in this environment, so the `staffAttendance` rules
block has no automated coverage yet.
