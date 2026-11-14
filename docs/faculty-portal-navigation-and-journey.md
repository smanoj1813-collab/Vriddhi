# Faculty portal: navigation, Journey and schedule repair

## Report and causes

The faculty sidebar exposed Calendar twice, accumulated expanded groups during navigation, and put Journey inside a one-item Insights menu. Journey returned “No faculty data available” because it depended on `localStorage.vriddhi_user` (not populated by current AuthContext), then looked in `colleges/{collegeId}/faculty` rather than the top-level faculty collection.

The Weekly Schedule failure had a separate cause: its faculty-only queries omitted the college constraint required by the existing `weeklySchedules` list rule. Client-side filtering cannot authorize such a query.

## Behaviour after the change

- Ten top-level faculty entries instead of thirteen. Dashboard, Journey and Risk Alerts remain directly reachable. Calendar appears once under Schedule, alongside My Weekly Schedule and Reschedule Class. Salary, installation instructions and Settings share Account.
- Only one faculty accordion stays open; deep links open their owning group and groups can still be closed manually. All 27 previous unique destinations remain available, including through the phone More sheet. Other roles retain multi-open navigation and existing permissions.
- Journey uses live Auth identity and an explicit Auth college. It resolves top-level faculty records by UID, document ID, faculty code, or email, scoped to that college. Ambiguous matches require administrator repair rather than choosing an arbitrary profile.
- A genuinely missing profile is not confused with a failed read: the former displays the signed-in identity, linking guidance and any matched activity; the latter displays an error and Retry. Missing college access never falls back to a stale browser-storage college.
- Mentees match UID, profile/code, email and legacy normalized name references. Only graded college-scoped results contribute to performance. Each mentee contributes once using their mean score; ungraded mentees are not labelled weak.
- Missing joining dates, scores and attendance remain unknown, including an honest distinction between no marked attendance and a genuine recorded 0%. The term-average class metric is labelled **Avg Classes / Week**, not “Classes This Week.” Paper-upload counts are shown only when recorded; there is no invented five-paper progress target.
- Faculty activity queries constrain the owner before applying a limit, accept UID/profile/email references and legacy ownerless name fields, deduplicate matches, and do not fabricate onboarding or future achievements. Explicitly different owner IDs are not overridden by a matching display name. Missing activity dates stay unknown.
- Timeline, summary and schedule failures have usable retry controls. Summary-source failures do not erase independently available profile/activity data. Identity changes and late responses cannot repaint the previous account's Journey or schedule.
- Weekly schedules merge UID/profile/code slots even when the UID already has some classes. Every query carries college scope, inactive slots are excluded, legacy slots without an active flag remain supported, and Sunday classes are displayed when present.
- Shared timetable consumers pass known college context. Attendance retains materialised/completed sessions and ad-hoc sessions under all returned faculty aliases rather than taking only the first slot's ID spelling.
- The admin Journey faculty tab embeds the same component, retaining the Teaching Record section without a second legacy-storage implementation.

## Read bounds

The faculty summary caps the roster and graded results at 500 records per section/request. A capped response is marked unavailable instead of producing an apparently complete count or score. These reads do not consume the separate legacy student-tab counter, so refreshing the faculty tab cannot silently empty the student tab.

Activity reads are bounded per owner query and display up to 15 deduplicated milestones. A capped/shortened timeline is explicitly labelled a limited summary, not complete career history.

## Validation

- `npm run test:unit` — includes 15 new identity/metric tests in `facultyJourney.test.ts`.
- `npm run test:render:faculty` — 42 regression checks mounting the real Layout, Journey, Schedule, hooks and APIs; only Auth/Firebase/router transport is stubbed. The query guard rejects missing college scope, and fixtures cover stale/missing legacy storage, two colleges, mixed aliases, empty and permission/error states, retries, account switching, read caps and attendance compatibility.
- `npm run test:render` includes that faculty suite in the existing CI command. Course, academic and paper render suites remain independently runnable.
- `npm run build`, `npm run check:dead-code` and `git diff --check`.
- Local isolated Chromium checks at 1440px and 390px: 19 desktop/phone checks, including no horizontal overflow, keyboard accordion operation, mobile More destinations, empty/error/retry states and no external data requests. Scoped axe checks on Journey main content passed for both widths. This is component-level browser QA, not a whole-application accessibility audit.

## Deployment and live acceptance

This is a frontend-only repair: no Firestore rules/index/schema changes, Functions changes, profile writes or data migration. Deploy Hosting after merging, pulling and rebuilding. Existing Firebase permission and profile-link problems must still be repaired by the college administrator; the UI now distinguishes them instead of hiding them as empty success.

No live institutional records were accessed during development. After deployment, sign in as the affected faculty member and verify their own profile, weekly classes, mentee counts and recorded assessment/paper activity. If their actual faculty profile is unlinked, complete the administrator repair indicated on the page; do not populate sample metrics to make the screen look full.
