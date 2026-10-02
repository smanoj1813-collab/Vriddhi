# Internal (Vriddhi) employee access — design & operator guide

**Status:** implemented in this branch, not yet deployed.
**Scope decision (confirmed with the product owner):** academic programme work only.
Admissions, finance, payroll, library/inventory, HR and user administration stay with
the institution (or the superadmin) and are **not** part of this role.

## 1. Who is an "internal employee"?

An internal employee is **Vriddhi platform staff**, not institution staff. They work
across many colleges, so they cannot be modelled as a member of any one tenant:

| | Institution staff (`faculty`, `hod`, …) | Vriddhi employee (`employee`) |
|---|---|---|
| Home college | exactly one (`collegeId` claim = home) | **none** — a set of assigned colleges |
| College scope in the token | the home college | the **active** college, chosen by the employee |
| Colleges visible | their college | every assigned college, one at a time |
| Navigation | role portal | `Employee Workspace` + the academic `/admin` surface |
| Non-academic modules | per role | never |

Everything an employee does uses **their own account**. There is no password sharing
and no silent impersonation: the person is always identifiable in the audit trail and
in the college's own records (see §4).

## 2. Capability matrix (what was asked → how it works)

| # | Requirement | Implementation |
|---|---|---|
| 1 | Access to **all colleges** | `platform_employees/{uid}.assignedColleges` holds every college; the employee switches the active one. Each switch re-mints the `collegeId` claim. |
| 2 | Be assigned / assign themselves to colleges | Superadmin assigns (`assignEmployeeColleges`). Employees choose among their assigned colleges (`setEmployeeActiveCollege`); they can never add one. |
| 3 | Schedule classes | `/admin/class-schedule` (`AdminClassSchedule`), `/faculty/schedule`, `/admin/academic-calendar`. |
| 4 | Assign and verify curriculum | `/admin/curriculum` + `/admin/curriculum-progress` (`AdminCurriculum`, `CurriculumProgress`), `/faculty/curriculum`. |
| 5 | Log in as faculty in that college | `role: employee` + active `collegeId` claim resolves under the same rules as `faculty`; the switch creates an explicit faculty-mode link (`faculty/{uid}` marked `isPlatformEmployee: true`) so the uid-keyed faculty pages (schedule, availability, self-attendance) work. |
| 6 | All programme access | The whole academic `/admin` surface **except** the institution-only list in `EMPLOYEE_EXCLUDED_ADMIN_PATHS` (`src/modules/auth/permissions.ts`). |
| 7 | Schedule assessments | `/admin/assessments`, `/admin/schedule-tests` (`FacultyAssessments` scheduler). |
| 8 | Generate questions & question papers | `/admin/question-bank`, `/admin/ai-questions`, `/admin/paper-generator`, `/admin/paper-review`, `/admin/papers/builder`. |
| 9 | Pull reports | `/admin/test-reports`, `/admin/grade-records`, `/admin/analytics`, `/admin/curriculum-progress`. |
| 10 | Grade marks → **HOD approval** | Employees may create/update grade **drafts** only (`gradeStageAllows('draft','employee')`). Publishing official grades is the institution's approval step and stays with `hod`/`admin`/`principal`/`superadmin`; the Publish button is disabled with an in-page explanation. |

## 3. Identity model

```
users/{uid}                     role: 'employee', collegeId: <active>, employeeStatus
platform_employees/{uid}        the assignment (Auth + Admin SDK only; clients may
                                read their own row, never write it)
faculty/{uid}                   faculty-mode link in the ACTIVE college, marked
                                isPlatformEmployee: true  (delegation record)
ID-token claims                 { role: 'employee',
                                  collegeId: <active college>,
                                  employeeStatus: 'active' | 'suspended' }
logs/{id}                       assignEmployeeColleges / setEmployeeActiveCollege /
                                suspendPlatformEmployee audit rows
```

* **Why one college at a time.** Every Firestore rule and the Express middleware take
  the tenant from the `collegeId` claim (`collegeId()`, `sameCollege()`,
  `resolveCollegeId()`). Giving employees a *list* claim would mean rewriting every
  rule and every API call site. Re-minting one claim on switch keeps the security
  model intact and makes "which college am I acting in?" a visible, auditable act.
* **Superadmin-like global access is deliberately not granted.** Employees are staff,
  not operators: they cannot read the superadmin shell, billing, system management,
  user administration, or any other college's data at the same time.
* **Suspension actually removes power.** `suspendPlatformEmployee` sets
  `employeeStatus: 'suspended'` and clears the college claim; `isStaff()` in
  `current-firestore.rules` rejects suspended employees, and the callable refuses
  further switches. The `users/{uid}` document is kept in step so the self-heal
  (`syncMyIdentity`) cannot resurrect a suspended assignment.

## 4. Faculty mode & the on-behalf-of delegation

Two layers, per the scope decision:

1. **Own identity (default).** An employee signs in as themselves, picks the active
   college, and works with the academic tools. Records they touch carry their own uid.
2. **Explicit, auditable, time-limited delegation.** Switching college upserts
   `faculty/{uid}` in that college with `isPlatformEmployee: true`,
   `delegatedBy` (the assigning superadmin), `confirmedBy` (the employee) and
   `delegationExpiresAt` (90 days, renewed by the next switch). The college therefore
   sees *who* the platform employee is in its own faculty directory instead of a
   ghost account, and the link cannot be used to obtain a college claim once expired.

Not allowed by construction: sharing a faculty password, impersonating a named
faculty member, editing another user's identity, or acting in a college that is not
assigned.

## 5. Guardrails (what employees cannot reach)

* Finance/payroll/billing/challans, library/inventory/purchases/vendors, no-dues —
  permission-gated in `ADMIN_ROUTE_PERMISSIONS`; employees hold none of those
  permissions.
* `/admin/admissions`, `/admin/settings`, `/admin/onboarding`,
  `/admin/exam-management`, `/admin/uucms-integration`, `/admin/bcu-compliance`,
  `/admin/scheme-packs`, `/admin/result-importer`, `/admin/ai-agent`
  (`EMPLOYEE_EXCLUDED_ADMIN_PATHS`).
* User administration: `/superadmin/*` stays superadmin-only.
* Publishing official grades (§2 #10).
* Reading or writing any college other than the active one — denied by rules, not by
  the UI (the claim is the boundary).

## 6. Operations

**One-time per employee**

1. Superadmin → **Access Control** → Role **Vriddhi Employee** (`employee`), email +
   name. No college is asked for: the employee is platform-wide by definition.
2. Superadmin → **Platform Employees** → assign 1..n colleges and the academic grants
   (schedule, curriculum, assessments, papers, grading, reports), then Save. The
   callable writes `platform_employees/{uid}`, mints `{role, employeeStatus}` claims
   and revokes refresh tokens, so the change applies at next sign-in.

**Day-to-day (employee)**

1. Sign in → lands on `/employee/dashboard`.
2. Pick a college → **Switch college**. The claim is re-minted and the page reloads
   with that college's data; the faculty-mode link is refreshed at the same time.
3. Work the academic tools from the sidebar (or the dashboard shortcuts).
4. Grade as drafts; the college HOD publishes after approval.

**Suspending / ending access**

* Platform Employees → **Suspend**: claims lose the college scope, `isStaff()` is
  false in the rules, and the account is refused further work.
* Removing a college from the assignment has the same effect for that college only.
* **Reactivate** restores the assignment; the employee re-picks their active college.

## 7. Deploying this change

```
# from the repository root
npm run build            # web
npm run build:functions  # functions
firebase deploy --only functions,firestore:rules,hosting   # or npm run deploy:all
```

New callables (exported from `functions/src/index.ts`):
`assignEmployeeColleges`, `setEmployeeActiveCollege`, `getMyEmployeeAccess`,
`listPlatformEmployees`, `suspendPlatformEmployee`.

New Firestore rules: the `employee` role joins `isStaff()`, is gated by
`employeeStatus != 'suspended'`, owns its `faculty/{uid}` row inside the active
college, and `platform_employees/{uid}` is server-written with self-read only.
Clients cannot widen their own assignment.

Firestore rules tests need a JVM (the emulator requires `java`); CI runs the
employee rules block through the `test:rules:course-security` pattern.

## 8. Tests

* `functions/test/employeeAccessCore.test.ts` — assignment normalisation, claim
  issuing, suspension semantics, list-view projection (7 cases).
* `functions/test/firestore.rules.test.ts` → *vriddhi platform employees* — active
  college work, cross-college refusal, suspension with a stale claim, read-only
  assignment document.
* `functions/test/gradeRecords.test.ts` → *official grade record stages* — employees
  draft, institution publishes.
* `src/modules/auth/permissions.test.ts` → *vriddhi employees get the academic
  surface only* — allowed academic pages, excluded institution pages and office
  modules.

## 9. Files touched

| Area | Files |
|---|---|
| Backend role & assignment | `functions/src/employeeAccessCore.ts`, `functions/src/employeeAccess.ts`, `functions/src/index.ts`, `functions/src/identityShared.ts`, `functions/src/roleManagement.ts`, `functions/src/middleware/auth.ts`, `functions/src/middleware/authz.ts` |
| Grading boundary | `functions/src/gradeRecords.ts`, `src/modules/admin/pages/GradeRecords.tsx` |
| Security rules | `current-firestore.rules` |
| Web identity & routing | `src/modules/auth/context/auth.ts`, `src/modules/auth/roleRoutes.ts`, `src/modules/auth/permissions.ts`, `src/modules/admin/routes.tsx`, `src/modules/faculty/routes.tsx`, `src/routes/index.tsx` |
| Employee workspace | `src/modules/employee/api/employeeApi.ts`, `src/modules/employee/pages/EmployeeDashboard.tsx`, `src/modules/employee/routes.tsx` |
| Superadmin assignment | `src/modules/superadmin/pages/PlatformEmployees.tsx`, `src/modules/superadmin/pages/AccessControl.tsx`, `src/modules/superadmin/routes.tsx`, `src/shared/components/Layout.tsx` |

## 10. Known follow-ups (not in this change)

* A dedicated "submit marks for HOD approval" transition (today: drafts + the
  institution's publish step) — needs an approval status on grade records.
* Per-grant enforcement inside individual pages (the grants are recorded and shown,
  but the route gate today is the role + academic/ non-academic split).
* Bulk college assignment (CSV) for large employee lists.
