# Karnataka academic engine: scheme packs, assessments and credits

**Scope:** Karnataka only. This is a repository implementation and rollout guide, not a university-regulations certification. Regional expansion is deferred. **No production data migration, scheme activation or deployment has been performed.**

## Current delivery — 13 November 2026

- **College creation and editing:** select zero (explicitly unconfigured), one, two or more packs, with exactly one explicit primary whenever any packs are assigned. Add programme/admission-batch/semester routes for exceptions.
- **Same rules in both runtimes:** shared resolution and assessment/credit code; authoritative grading uses the linked server roster, never a spreadsheet-selected university.
- **Research for all 23 seeds:** 23 downloadable, non-assignable preparation drafts, 43 extracted course rows and source/blocker records. **This is not 23 certified live university schemes.** There are 8 partial-evidence, 6 conflicting/unapproved, 8 source-required and 1 identity-review records.
- **Research catalogue:** available under Scheme Packs and college onboarding; choosing an affiliation filters evidence but never chooses a policy.
- **Published history:** stored credits, grade points and policy provenance are not recomputed with today's primary.

See [the 23-university research handover](karnataka-scheme-research-2026-11-13.md) and the machine-readable catalogue at `functions/src/academic/research/karnataka-scheme-drafts.json`.

## 1. What the audit found

The application already had useful foundations: a college-level `schemePackId`, Karnataka examination templates, pure assessment calculations, and an audited draft/publish workflow for official grades. The core credit-weighted GPA formula was sound. Its consumers and configuration boundaries were not consistent.

| Area | Previous behaviour | Implemented behaviour |
| --- | --- | --- |
| Missing/unreadable college configuration | Several paths silently selected BCU | Explicit configuration errors; no substitute university |
| Incomplete custom pack | Missing sections inherited BCU rules | Complete structural/semantic validation |
| College assignment UI | No multi-pack onboarding; unconfigured colleges could show every preset as assigned | Shared onboarding/settings selector, independent pins, explicit primary and scoped routes |
| Editing an assigned custom pack | Mutable source document could change live rules | Saved revisions and explicitly activated snapshots |
| Scheme administration | Reused scheduling-only authorization | Separate academic authoring and activation permissions |
| Course credits | Import guessed four credits; manual grades trusted submitted values | Approved, scoped course mapping; submitted credits must match |
| Assessment maxima | Proportional scaling; zero overrides could become default maxima | Explicit course profiles, including genuine zero components |
| Pass vs grade | A failed external component could retain positive grade points | One full pass/grade decision; failures carry zero GPA points |
| Journey CGPA | Excluded failed zero-point courses from the denominator | Same shared credit summary as the student transcript |
| Earned credits | Journey/transcript could count failed-course credits as earned | Attempted, GPA and earned credits are separate |
| Result import | Nested shadow grades, immediate publication, semester SGPA written into CGPA | Canonical server-validated drafts, institutional publication, no CGPA overwrite |
| Promotion bridge | Different course-field names; absence/withheld could be misclassified | Canonical field aliases and conservative absence/withheld backlog handling |

Existing template numbers have **not** been rewritten as a purported Karnataka-wide regulation. BCU remains available as an **explicitly selected** template, alongside the existing KUD and generic Karnataka authoring templates. An institution must verify applicability, admission cohort, programme and amendments before activation.

## 2. How credits and GPA actually work

### A course's credit value is an approved syllabus value

The engine does **not** derive college credits from marks, attendance percentage, quizzes, AI assessments or scheduled teaching hours. For example, a course approved as four credits remains four attempted credits whether the student scores 90 or fails it.

The college records the approved value in `courses[].credits`, together with the course code, assessment profile, GPA inclusion, category and programme/cohort scope. A timetable/master-curriculum credit field is not automatically copied over and treated as approved policy. Alignment with that catalogue is an explicit institutional configuration task in this release.

### Semester GPA

```text
SGPA = Σ(course credits × final grade point) / Σ(GPA-eligible attempted course credits)
```

Failed GPA courses remain in the denominator with zero points. Passed non-GPA courses can earn credits without entering that denominator. Mandatory zero-credit activities can be completed without adding GPA credits.

Example:

| Course | Credits | Final grade point | Credit points | Credits earned |
| --- | ---: | ---: | ---: | ---: |
| A: passed | 4 | 9 | 36 | 4 |
| B: passed | 2 | 6 | 12 | 2 |
| C: failed | 4 | 0 | 0 | 0 |
| **Total** | **10 attempted / GPA credits** | | **48** | **6** |

**SGPA = 48 / 10 = 4.80**, not `48 / 6 = 8.00`.

### Cumulative GPA

The same formula is applied across the student's published course records, rather than taking a simple average of semester SGPAs. The latest recorded correction for the same course code and semester is counted once. This is duplicate/correction handling, **not** a university-approved best-attempt or repeat-course regulation.

The shared summary reports:

- **Attempted credits:** credits attached to the included published course outcomes.
- **GPA credits:** attempted credits included in the GPA denominator.
- **Earned credits:** credits attached to passed courses, including approved non-GPA credits.
- **Credit points:** credits multiplied by final GPA grade points.
- **GPA:** rounded to two decimals for reporting.
- **Incomplete/invalid rows:** missing or unusable credit/grade evidence is visible rather than guessed.

An all-failed credit-bearing transcript has GPA **0**. No published GPA-bearing records produce **unavailable**, not an invented zero. Unresolved GPA data or withheld GPA results make the GPA unavailable. A non-GPA activity can legitimately pass with zero grade points; that is not treated as a failed GPA course.

Legacy published grades are not rewritten. Missing legacy numerical data needs institutional review. Historically stored `students.cgpa` values are not backfilled by this change; the updated transcript/Journey compute from published grade records.

## 3. Multiple assigned packs, with scoped rules inside each pack

Each assigned pack is an independently reviewed, revision-pinned policy. Within that pack the following sections describe assessment and credit rules:

### `assessmentProfiles`

Named profiles for theory, practical, project, viva, internal-only and external-only assessment structures:

- Internal/external maxima and examination duration.
- Named internal components with `single`, `average`, `bestOf`, `sum` or `attendance` methods.
- Count, raw maximum and contribution weight for each component.
- Internal, external and aggregate pass percentages.
- Whether external-component passing is independently required.
- An optional profile-specific grade table and grade-point policy, allowing different programme rules within one pack.

The component `weight` is its contribution to total IA. `sum` normalizes the sum against `count × maxMarksEach`; `average` normalizes the average against `maxMarksEach`. Best-N uses the approved N. Generic component evidence requires the declared number of observations: use zero for an actually recorded absence, not an omitted mark. Unrounded contributions are summed before rounding the IA total to two decimals; the displayed breakdown is also rounded. Other IA contribution-rounding conventions are not configurable yet. Course GP lookup rounding is separate, as described below.

Attendance slabs retain explicit inclusive bounds. No unstated floor/rounding rule is invented for fractional attendance between slab endpoints; such gaps earn no slab marks. Overlaps, uncovered whole-percentage gaps and a missing upper endpoint are rejected. Existing template boundaries are retained for institutional review.

### `gradePointPolicy`

Optional at pack or assessment-profile level:

```ts
{ method: 'bands' | 'percentage-divided-by-ten',
  percentageRounding: 'none' | 'nearest-integer' }
```

Fixed bands support fractional points such as 9.5 or 4.5. The alternative formula uses the actual (or explicitly rounded) percentage divided by ten. The grade table still supplies the approved letter classification and failure floor; a semester alpha classification is not automatically a course-grade table. Profile overrides take precedence. The editor exposes the method and GP-only rounding; profiles can override them in validated JSON.

**GP lookup rounding never relaxes raw internal, external or aggregate pass floors.** Old revisions without this option keep their existing behaviour. The effective method/rounding is retained in the official result's policy snapshot. Other formula/rounding modes fail validation rather than silently becoming integer bands.

### `courses`

Each approved mapping specifies:

```text
code, name, credits, category, assessmentProfileId,
includeInGpa, requiredForAward,
programme?, batch?, semester?
```

`assessmentProfileId: "default"` is an **explicit** selection of the pack's standard assessment. It is not permission to infer a different marks split for a course. A custom practical profile may have zero external marks; an external-only profile may have zero internal marks.

The most specific matching programme/batch/semester entry wins. Equally specific competing entries are rejected at evaluation rather than chosen arbitrarily. Programme scope is enforced; English punctuation/case variants are normalized without collapsing distinct Kannada names.

The server obtains the student's programme/batch from the linked student record. The spreadsheet cannot move the student to a more convenient policy scope.

### `creditRequirements`

An approved programme/cohort plan can specify:

```text
programme, batch?, totalSemesters, minimumCredits,
requiredCourseCodes, categoryMinimums
```

The advisory credit audit checks earned total, category minimums and mandatory course completion, including mandatory zero-credit activities. **There is no assumed Karnataka degree-credit total.**

The current award plan is selected by the assigned programme/batch route, not always the primary. Published rows retain their historical credits/points. The whole-programme audit deliberately omits current-semester context: when a possible semester route prevents a unique plan, it reports an unavailable audit. **Combining semester-specific packs into a hybrid whole-award plan is not implemented.**

This audit is shown in Journey. It is **not** automatic graduation approval and does not yet replace the separate promotion-policy workflow. Pending data, backlog rules, permitted attempts, transfer credits, condonation, exit awards and institutional approval need their own approved decisions.

## 4. Assessment-to-official-grade flow

```text
Pinned college assignments + explicit primary + routes
  -> server-owned student programme/batch + record semester
  -> most-specific assigned pack (or explicit primary)
  -> course code/semester
  -> approved course credits + assessment profile
  -> validated aggregate marks OR named IA component evidence
  -> component pass checks + aggregate pass check
  -> grade band only after the full course outcome is determined
  -> canonical draft grade + policy/evidence snapshot
  -> institutional publication with revalidation
  -> transcript / Journey / GPA / advisory credit audit
```

Important behaviours:

1. Missing positive-max component marks are errors, not zeroes. Genuine absent components have maximum zero. An explicit recorded absence can carry zero marks.
2. Over-max, negative and non-finite marks are rejected. Boolean/array numeric coercion is rejected on official draft input.
3. Submitted totals must equal the component total. Submitted credits, letter grade and grade point cannot override the derived outcome.
4. An external failure cannot retain passing GPA points merely because aggregate marks reach a positive grade band.
5. Explicit failures/absences are not auto-promoted to passes. Withheld results must be resolved before official import/publication. The current canonical absence grade label is `AB`, with result status `A`.
6. Official rows retain `schemePackId`, `schemePackRevision`, `schemeConfigurationRevision`, routing selection, an assessment/course/grade-table/GP-policy snapshot and optional IA evidence.
7. Publication resolves current configuration and the current student linkage again. A draft from a different/missing policy revision must be re-saved before publication.
8. Already published rows cannot be overwritten by spreadsheet import or draft entry. An authorized correction/attempt workflow remains a separate follow-up.

The raw grade-band utility is not itself a pass/fail decision. Official consumers use `deriveOfficialGrade` / `evaluateCourseResult`, which combine the two.

### Manual grade entry

Official Grade Records shows approved course credits and calculated, read-only subject/total/grade/point fields. Staff can enter a college-approved aggregate IA mark, or enable component-based IA calculation. Component evidence is recalculated and retained by the server, and checked again on publication.

This does not automatically turn existing online tests or AI-marked quizzes into official IA. A college-approved linkage and evidence workflow would be required for that integration.

### Spreadsheet import

- Reads the complete pinned configuration freshly; routes each student-semester independently. There is no permanent fallback/memoized university pack.
- Requires registration number, semester, programme/course and subject code columns.
- Uses approved mapping credits when the credits column is absent; a supplied value is a consistency check.
- Does not assume semester one, four credits, 100 marks or an 80/20 ratio.
- Separates students' semesters and rejects duplicate course rows.
- Flags malformed optional numbers and inconsistent supplied grades.
- Blocks the UI import action if **any** validation errors remain.
- Sends valid previews through `saveDraftGradeRecords` with each group's policy identity/revision and the reviewed configuration revision. Primary/route-only changes invalidate stale previews too. The server independently resolves the actual linked student's context.
- Writes no nested grade transcript, immediate publication, university-result mirror or student-CGPA field.
- Reports new drafts and updates to existing drafts separately. Each student's semester is atomic; a multi-student upload can partially succeed and reports failures.

Approve the resulting drafts under **Official Grade Records**. Students see them only after authorized publication.

## 5. Revisioning and college administration

### Authorization

| Stage | Authorized roles |
| --- | --- |
| Author/save a scheme revision | Superadmin, college admin, principal, HOD |
| Activate/clear college-wide policy | Superadmin, college admin, principal |
| Prepare official grade drafts | Existing grade roles, including platform employees |
| Publish official grades | Existing institutional approval roles; not platform employees |

Scheduling/Operations permissions are not reused or broadened to grant college-wide academic-policy authority.

### Save is not assign

- Custom source: `schemePacks/{collegeId}__{CODE}`.
- Immutable saved revisions: `schemePacks/{id}/revisions/{revision}`.
- College assignment: `schemePackAssignments: [{schemePackId, revision, snapshot}]`.
- Explicit primary: `primarySchemePackId`.
- Scoped exceptions: `schemePackRoutes: [{schemePackId, programme?, batch?, semester?}]`.
- Optimistic concurrency: `schemeConfigurationRevision`.
- Save/assignment metadata: `schemePackAudit`.
- Legacy **primary-only mirrors**: `schemePackId`, `schemePackSnapshot`, `schemePackRevision`. New engines use the full assignment configuration, not those mirrors.

A source save increments its own revision and requires the source revision the editor actually read. It does not change any assigned snapshot. Upgrading an assignment requires **Review & use saved rN**, followed by **Save assigned packs & primary**. Unchanged pins remain authoritative even if the source has since been edited or archived.

`configureCollegeSchemePacks({collegeId, selection, expectedConfigurationRevision})` saves all assignments, primary and routes atomically, with the actor and previous/new configuration revision in an audit row. `saveCollegeWithSchemes` performs superadmin college creation/editing plus optional assignments in one transaction. It verifies the onboarding toggle, duplicate college code, and any referenced university document; arbitrary client snapshots/counters/audit actors are not spread into the document. Ordinary metadata-only college edits keep their existing path.

### Routing contract and limits

1. Select **at most 10** reviewed packs. If the list is not empty, explicitly choose exactly one of those IDs as primary; checking the first pack does not choose it for you.
2. Add up to **100** routes. Each route targets an assigned ID and must narrow programme, admission batch, semester, or a combination.
3. The route with the most populated scope dimensions wins. Equal-specificity conflicting intersections and duplicate normalized scopes are rejected. No array-order precedence.
4. With complete context and no matching route, the explicit primary applies. Missing context that could match a route blocks resolution, rather than guessing primary.
5. Programme/batch comparison is NFC-, case- and presentation-punctuation-normalized. It is **not** an alias system: `Bachelor of Commerce` does not automatically mean `B.Com`, and Kannada vowel distinctions are preserved.
6. A context-free lookup returns the primary **for display/settings only**. Official grading always supplies server-owned programme/batch and the record semester. Spreadsheet declarations cannot move a student to another routed policy.
7. A complete-college-document storage guard uses a conservative **900,000-byte budget**, counting UTF-8 strings, numbers, nested fields, all snapshots, the duplicated primary mirror and existing metadata, with further reserved overhead. Ten large packs may not fit. Do not remove required courses merely to bypass this guard; external catalogue storage is a future design task. Non-queryable policy payload fields have explicit single-field index exemptions in `firestore.indexes.json`.

Illustrative selection transport (**synthetic IDs**, not seeded university document IDs):

```json
{
  "assignments": [
    {"schemePackId": "college-demo__UG_2024", "revision": 2},
    {"schemePackId": "college-demo__PG_2025", "revision": 1}
  ],
  "primarySchemePackId": "college-demo__UG_2024",
  "routes": [
    {"programme": "MCA", "batch": "2025-26", "schemePackId": "college-demo__PG_2025"}
  ]
}
```

Assigning another pack without a matching route does not make it apply automatically. Removing a selected primary clears primary selection and dependent routes; it never silently chooses the remaining pack. Reset/reload explicitly restore saved selections. Background refetches preserve unsaved edits and surface concurrent configuration changes for review.

### Existing-college migration (reviewed, not an automatic backfill)

1. Inventory each college's explicit binding and student programme/batch values. No binding means **unconfigured**, not BCU. Do not bulk-assign any university.
2. Valid old single-pack bindings are adapted in memory. Bindings without pinned snapshots show a reconfirmation warning. A legacy college snapshot remains pinned during the first migration even if its source has a newer revision.
3. Saving an assigned, unpinned legacy custom source first pins its previous rules, preventing a silent first-edit policy change.
4. Open Scheme Packs, review the loaded primary/revision, add required assignments/routes and save. The transaction writes the multi-pack fields and primary mirrors together. A later save requires the configuration revision read by the editor.
5. The old single-pack callable refuses to replace a multi-pack or routed configuration. Invalid/ownerless/cross-college/dangling legacy bindings need reviewed administrative repair; there is no fallback or automatic re-ownership.
6. Test both matched and unmatched programmes/cohorts, a semester route, missing context and an ambiguous-route rejection. Check pending drafts and deliberately re-save those whose applicable policy changed.

University affiliation uses the **generated Firestore university ID**, looked up by seed code. `KU` seed identity versus `KUD` preset naming, changed domains/branding and the unresolved `VIJ` identity are recorded in research notes; this work never auto-renames or merges universities or inherits a parent university's rules.

Firestore rules make pack content, assignment/primary/routes/revision fields and audit writes callable-only, including for platform browser clients. Pack reads are tenant-scoped; historical revisions/audits are limited to same-college academic reviewers or superadmins. **The added rules tests still require emulator verification.** No credentials or production configuration were changed.

## 6. How to configure the first Karnataka college

1. Identify the **actual university/autonomy status, programme, admission cohort and approved regulations**. Collect the syllabus/scheme references and amendments.
2. Open **Scheme Packs** and explicitly choose a template. Do not activate a template just because its university name looks familiar.
3. Review the college-standard marks, attendance, pass rules and grade table. Clone a built-in when college-specific course mappings are needed.
4. In the advanced policy JSON sections, add assessment profiles, approved course-credit mappings and programme credit requirements. Use the exact programme/cohort identifiers from student records.
5. Keep incomplete policy authoring as a draft. Record the approved source reference before marking it ready for review.
6. Save, inspect the source revision, select the pack in **Assigned scheme packs**, choose the primary and routes explicitly, then **Save assigned packs & primary** as an authorized college approver.
7. Test a theory course, practical/project, failure, absence, non-GPA/zero-credit activity and different programme/cohort. Compare outcomes against a manually approved sample marks card.
8. Import a small spreadsheet into drafts, review the derived outcomes and explicitly publish it. Check transcript, Journey and the credit audit.

**New college form:** select affiliation independently and optionally select available reviewed packs/primary/routes in the same form. College-owned custom pack IDs require the new college ID, so a new college can start explicitly unconfigured, then have its reviewed custom revisions authored and assigned in Scheme Packs. The built-ins remain prominently labelled legacy authoring templates, not 2026 research certifications.

**Built-ins deliberately contain no invented course-credit catalogue.** An explicitly assigned template can supply attendance/standard examination rules, but official course grading/import remains blocked until approved mappings exist.

Existing published records remain readable even if today's college configuration is missing. They are not silently reinterpreted under a new university pack. Existing legacy nested imports have not been automatically migrated; reconcile/re-import them through the reviewed draft workflow after checking for canonical published records.

## 7. Architecture and validation

Pure policy code is shared, not copied between runtimes:

| Path | Responsibility |
| --- | --- |
| `functions/src/academic/schemePack.ts` | Shared contract and existing Karnataka templates |
| `functions/src/academic/schemeValidation.ts` | Complete policy validation and scope keys |
| `functions/src/academic/schemeResolution.ts` | SDK-independent, fail-closed configuration reads and legacy adapter |
| `functions/src/academic/collegeSchemes.ts` | Multi-selection validation, pin contracts, primary and scoped routing |
| `functions/src/academic/schemeEngine.ts` | Attendance, IA, profile resolution, pass and grade evaluation |
| `functions/src/academic/gradePolicy.ts` | Official grade derivation and draft-policy checks |
| `functions/src/academic/creditEngine.ts` | GPA/credit summary, correction deduplication and advisory audit |
| `functions/src/schemePacks.ts` | Authorized transactional source revisions, pinning, configuration audit |
| `functions/src/collegeOnboarding.ts` | Atomic superadmin college details + assignment callable |
| `functions/src/academic/schemeResearch.ts`, `research/karnataka-scheme-drafts.json` | Non-assignable 23-seed research contracts/catalogue |
| `functions/src/utils/firestoreBudget.ts` | Complete-document academic storage budget |
| `src/modules/admin/components/{CollegeSchemeSelector,SchemeResearchCatalogue}.tsx` | Shared onboarding/settings editor and separate evidence catalogue |
| `functions/src/gradeRecords.ts` | Canonical, audited official draft/publish persistence |
| `src/shared/types/schemePack.ts`, `src/shared/utils/{schemeEngine,creditEngine}.ts` | Browser facades over the same pure source |
| `src/modules/admin/utils/resultImportEngine.ts` | Testable import evaluation/grouping |

The shared source lives under Functions so Firebase's existing source deployment includes it, while Vite imports only the SDK-independent modules. Frontend-only code is not imported into the Functions build root.

The old university-bound BCU compatibility facade is retained only as `functions/test/helpers/legacyBcuCompatibility.ts` for regression parity, not as production app code. CI also runs the academic UI/parser/transport checks explicitly.

Validation commands:

```sh
npm run test:academic
npm run test:render:academic
npm run test:unit
npm --prefix functions run test:unit
npm run test:render
npm run build
npm run build:functions
# Requires the Firebase emulator environment and Java:
npm run test:rules
```

The backend unit script no longer ends with `|| true`; failed tests now fail the command. Callable persistence tests use an atomic in-memory Firestore boundary that rejects reads after writes and checks rollback, roles, tenants, revision pinning and grade publication. They are **not** a replacement for security-rule emulator tests.

### Validation record — 13 November 2026

| Check | Result |
| --- | --- |
| Configured frontend/shared unit suite | **763 / 763 passed** |
| Configured Functions unit suite | **1,367 / 1,367 passed** |
| Targeted academic suites | **28 frontend + 116 backend passed** (included in the full unit suites) |
| Existing render checks | **391 / 391 passed**, no mount crashes |
| Academic real components / CSV parser / transport checks | **52 / 52 passed** |
| Browser TypeScript + production/PWA build | **Passed** |
| Functions TypeScript build | **Passed** |
| `git diff --check` | **Passed** |
| Runtime dead-code guard | **Passed**, no allowlisted orphans |
| Firestore security-rule emulator tests | **Not run — Java is unavailable in this sandbox** |
| Real-browser E2E / real-project acceptance | **Not run** |

Full unit runs use Node test concurrency limits of four (frontend) and two (Functions). Existing large-chunk and unmatched Workbox-glob build warnings remain nonblocking. Tests cover multiple pins/primary/routes, atomic onboarding, mixed server-roster grading, revision races/rollback, legacy-pin migration, GP methods/rounding, all 23 non-assignable research records and complete document budgets. The render harness also covers mixed-cohort parse/import payloads, explicit primary selection, dependent-route removal, ten-pack limits, unsaved-edit/refetch behaviour, concurrent configuration warnings, GP editor transport, college identity changes, mixed-policy hall-ticket eligibility, safe roster/attendance limits and the research catalogue. Its external I/O is stubbed: **these are not browser E2E or production-security certification**.

Local validation logs are in ignored `artifacts/academic-validation/multi-{academic-test,unit-browser,unit-functions,render-existing,academic-render,browser-build,functions-build}.log`. No test used a real Firestore project. Generated logs/build output are not added to Git.

## 8. Remaining release gates and follow-up work

This is a hardened first implementation, not a declaration that every Karnataka institution's regulations are modeled.

Before production:

- Run the security-rule emulator suite, including the added policy tenant/write-boundary tests.
- Review one real Karnataka college's complete programme/cohort policy and approved sample outcomes with its academic authority.
- Inventory unconfigured colleges, invalid legacy packs and drafts that need re-saving. **Do not bulk-assign BCU.**
- Reconcile legacy nested grade imports, missing credit/grade data and any historically overwritten student CGPA fields. No automatic backfill has been run.
- Release **Functions + Firestore rules + index exemptions + Hosting together**, with a controlled rollout. Deploying only Hosting is insufficient for this change. Old clients may reject new routing constraints; do not downgrade only the grading Functions to pre-routing code while multi-pack configurations exist.

Further engineering:

- A richer course/profile editor and approved curriculum-to-policy mapping workflow; advanced authoring currently uses validated JSON.
- Approved cross-pack whole-programme/award plans for semester-dependent policy transitions. Programme/batch/semester pack routing, including differing pack attendance floors, is implemented; hybrid award-plan composition is not.
- Additional institution-approved rounding/formula variants, grace/condonation, individual component minimums, credit transfers, exit awards, elective baskets and repeat/best-attempt policies. Fixed/fractional GP bands, percentage÷10 and GP-only nearest-integer percentage lookup are implemented, but no unverified university is auto-configured.
- An authorized correction/revaluation/supplementary-attempt workflow for already published grades.
- Gate promotion/graduation on the approved credit plan instead of treating the advisory credit audit as an award decision.
- Scalable catalogue/pagination and full attendance-period/subject eligibility evaluation. Current pack authoring is bounded to 500 course mappings; managed grade listing and compliance views are bounded, and the compliance page is explicitly an illustrative/limited view. Journey uses a separate student transcript query and suppresses cohort rank when its comparison query is truncated.
- Performance and regulatory acceptance testing against real, consented institutional fixtures before any compliance claim.


### Controlled deployment sequence (after review, merge and release gates)

Use a separate deployment checkout already on merged `main`; **pull merged main before installing, building or deploying**. This Arena branch has not been switched, pushed or deployed by these instructions.

```sh
git pull --ff-only origin main
npm ci
npm --prefix functions ci
npm run test:academic
npm run test:render:academic
npm run test:rules  # requires the emulator prerequisites; must pass before release
npm run build:functions
npm run build
firebase deploy --only functions,firestore:rules,firestore:indexes,hosting --project vriddhi-academic
```

Firebase account/project authentication is already configured; these steps do not call for logging in again. Obtain academic sign-off and run a small-college acceptance test before enabling new official writes. Preserve published policy snapshots/audits during any rollback; do not substitute a historical source/template for an assigned pin.
