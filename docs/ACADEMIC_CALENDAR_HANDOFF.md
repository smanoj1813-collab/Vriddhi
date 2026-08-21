# Academic Calendar — Module Handoff

**Status:** ✅ Built, integrated, type-clean, builds green. **Parked** — no further work planned until we return to it.
**Branch:** `arena/01a023c7-vriddhi`
**Commits:** `72dd091` (feature + integration) · `efc1f06` (preview harness)
**Last verified:** 2026-08-21 — `npx tsc --noEmit` → 0 errors · `npm run build` → success (24s)

---

## 1. What was built

A full Academic Calendar for admin/principal: month / week / day / list views over a
Firestore-backed event store, with academic context (curriculum → course → module → faculty → batch).

### Files created

| File | Role |
|---|---|
| `src/shared/types/academicCalendar.ts` | Types supplied by the user, verbatim. `CalendarEvent`, `Create/UpdateCalendarEventInput`, `CalendarFilterOptions`, `CalendarStats`, `DayCell`, plus the 4 union types. |
| `src/shared/api/academicCalendarApi.ts` | Firestore CRUD on collection `academicCalendarEvents` + `computeCalendarStats`, `EVENT_TYPE_COLORS`, `eventColor`, `toISODate`, `bulkCreateCalendarEvents`, `deleteEventSeries`. |
| `src/shared/hooks/useAcademicCalendar.ts` | All state: events, filters (search/type/status/faculty), view mode, current date, month/week grids, day + list projections, navigation (`goPrev`/`goNext`/`goToday`), CRUD wrappers with optimistic local updates. Exports date helpers `startOfDay`, `addDays`, `startOfWeek`, `isSameDay`, `eventCoversDate`. |
| `src/components/AcademicCalendar.tsx` | The UI. Stats strip, toolbar (nav + view switch + filters + legend), 4 views, create/edit modal, event details popover. Default export. |
| `src/modules/admin/pages/AcademicCalendarPage.tsx` | Page wrapper for the sidebar route; pulls `user` from `useAuth()` and `facultyList`/`curriculumList` from `useCurriculumMapping(collegeId)`. |

### Files modified

| File | Change |
|---|---|
| `src/modules/admin/pages/AdminDashboard.tsx` | `CalendarDays` icon import; `AcademicCalendar` + `useCurriculumMapping` imports; `{ id: 'calendar', label: 'Academic Calendar' }` in `tabs`; `case 'calendar'` in `renderContent()`; header subtitle line; `pathToTab` entries for `/admin/academic-calendar`. |
| `src/shared/components/Layout.tsx` | Nav item `Academic Calendar → /admin/academic-calendar` in both the `["admin","principal"]` block and the `["hod","principal"]` block. |
| `src/modules/admin/routes.tsx` | Lazy import + child route `academic-calendar` under `/admin`. |
| `firestore.indexes.json` | Composite index `academicCalendarEvents: collegeId ASC + startDate ASC`. |
| `tailwind.config.js` | Added `./preview/**/*.{html,ts,tsx}` to `content` (for the preview harness only). |

### Preview harness (dev-only, excluded from `npm run build`)

| File | Role |
|---|---|
| `preview/index.html`, `preview/main.tsx` | Standalone mount of the real component with sample faculty/curriculum props. Dark/light toggle. |
| `preview/mockCalendarApi.ts` | In-memory replacement for the Firestore API — 12 seeded events dated relative to *today*. |
| `vite.preview.config.ts` | Root `preview/`, aliases `@/shared/api/academicCalendarApi` → the mock, serves on `0.0.0.0:5180`. |

Run it any time with:
```bash
npx vite --config vite.preview.config.ts
```

---

## 2. Design decisions worth remembering

- **Types live at `src/shared/types/`**, matching the user's setup guide (not `src/types/`, where the first draft landed — the file was moved).
- **The component is decoupled from admin-module types.** It declares its own structural prop interfaces
  (`CalendarFacultyOption`, `CalendarCurriculumOption`, `CalendarCourseOption`) which `FacultyOption` from
  `useCurriculumMapping` and `CurriculumDoc` from `@/shared/types/curriculum` satisfy structurally.
  → Faculty/student dashboards can reuse it later; a `readOnly` prop already exists for that.
- **Only one Firestore query.** `listCalendarEvents` filters by `collegeId` and orders by `startDate`; every
  other filter (type, status, branch, semester, batch, faculty, date-range, search) is applied in memory.
  Keeps composite-index requirements to exactly one.
- **`deepSanitize`** mirrors the pattern in `curriculumMappingApi.ts` — strips `undefined` before writes.
- **Local dates, never UTC.** `toISODate()` formats from local components to avoid the off-by-one-day bug.
- **Styling** reuses the repo's `glass-card`, `input-field`, `btn-primary`, `btn-secondary` classes and the
  teal/slate palette; `animate-fade-in` for entry.
- Recurrence types exist (`isRecurring`, `recurringRule`, `parentEventId`) and `deleteEventSeries` is
  implemented, but **no recurrence generation UI** was built.

---

## 3. Known gaps / TODO when we resume

1. **Firebase Hosting deploy never happened.** Blocked on two things:
   - No `firebase` CLI + no credentials/`.firebaserc` in the sandbox.
   - **`.env.production` contains only `VITE_API_BASE_URL`** — none of the `VITE_FIREBASE_*` keys that
     `src/Firebase/config.ts` reads. Any build made here would ship an undefined Firebase config.
     Fix the env file before deploying.
2. **Firestore security rules not updated.** `current-firestore.rules` (referenced by `firebase.json`) currently
   contains a CLI error dump — `Error: firestore:rules:get is not a Firebase command` — not actual rules.
   `academicCalendarEvents` needs a real rule wherever the live ruleset lives.
3. **Index not deployed** — `firestore.indexes.json` isn't wired into `firebase.json`; the index entry is
   currently documentation only. Firestore will surface a console link on first query if it's missing.
4. Untested against real data: **only mock data has been exercised.** No live Firestore round-trip yet.
5. Not built: recurrence UI, drag-to-move events, ICS export, conflict detection (room/faculty double-booking),
   student/faculty read-only surfaces, notifications on event creation.
6. `src/modules/faculty/pages/FacultyCalendar.tsx` still has its **own local `CalendarEvent` interface** and
   `mockEvents: CalendarEvent[] = []`. Candidate for migration onto this module.

---

## 4. Next session: Curriculum section

Goal stated by the user: **debug and complete the curriculum section.** Reconnaissance already done:

### The big problem — five competing `curriculum.ts` type files

| Path | Lines | Notes |
|---|---|---|
| `src/shared/types/curriculum.ts` | 269 | Richest; has `CurriculumDoc`, `ParsedCourse`, `ParsedModule`, mapping types. Used by admin API/hooks and the calendar. |
| `src/modules/superadmin/types/curriculum.ts` | 288 | Near-duplicate, diverged. Imported by superadmin + 2 cross-module importers. |
| `src/modules/faculty/types/curriculum.ts` | 65 | Faculty subset. |
| `src/types/curriculum.ts` | 45 | Legacy stub. |
| `src/modules/admin/types/curriculum.ts` | 1 | Re-export shim. |

Import counts: 11 modules use a relative `../types/curriculum`, 3 use `@/shared/types/curriculum`,
2 reach across into `../../superadmin/types/curriculum`. **Consolidation onto `@/shared/types/curriculum`
is the likely first task**, done incrementally with `tsc --noEmit` as the gate.

### Curriculum surface area to review

- **Superadmin:** `pages/SuperAdminCurriculum.tsx`, `components/SuperAdminCurriculum.tsx` (924 kB chunk — largest
  in the build, worth code-splitting), `StandardizedCurriculumUploader.tsx`, `CurriculumReviewTable.tsx`,
  `CurriculumAssignmentDialog.tsx`, `api/curriculumApi.ts`, `api/syllabusCurriculumApi.ts`,
  `hooks/useCurriculum.ts`, `hooks/useSyllabusCurriculum.ts`
- **Admin:** `pages/AdminCurriculum.tsx`, `pages/Curriculum.tsx` (two pages — is one dead?),
  `api/curriculumMappingApi.ts`, `hooks/useCurriculumMapping.ts`
- **Faculty:** `pages/FacultyCurriculum.tsx`, `hooks/useFacultyCurriculum.ts`, plus a duplicate
  `src/hooks/useFacultyCurriculum.ts` at the old top-level path

### Flow to verify end-to-end
`Syllabus upload (docx/pdf) → parse → review/edit → approve → CurriculumDoc → assign to college →
map course to faculty (curriculumFacultyMappings) → faculty sees it → schedule/calendar consumes it`

Ask the user which link in that chain is actually broken before refactoring anything.

---

## 5. Environment notes for the next session

- `npm ci` has been run; `node_modules/` is populated (462 packages, ~40s to reinstall if the sandbox resets).
- Full `npx tsc --noEmit` over the repo takes ~55s and currently reports **0 errors** — use it as the regression gate.
- `npm run build` takes ~25s and succeeds; warns about chunks >500 kB (`SuperAdminCurriculum` 924 kB,
  `firebase` 870 kB).
- The app itself cannot be run interactively in the sandbox (no Firebase keys → login fails). Use the
  mock-based preview pattern from `vite.preview.config.ts` for any UI that needs eyeballing.
