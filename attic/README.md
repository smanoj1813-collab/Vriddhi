# attic/ — code removed from the build, kept for reference

These 136 files (21,808 lines) were **unreachable from `src/main.tsx`** and are
not compiled or bundled. They were moved here rather than deleted so they stay
browsable in the repository.

**Nothing in `src/` imports anything in here.** `tsconfig.json` includes only
`["src", "generate-routes.cjs"]`, so this directory is excluded from
typechecking, and Vite never reaches it from the entry point. It costs nothing
at build time or runtime.

## Why they were unreachable

`scripts/legacy/vriddhi-reorganize.mjs` holds an explicit `MOVES` table that
relocated a flat `src/components|hooks|api|types` layout into
`src/modules/{role}/…`. The originals were left behind, and a chain of codemods
(`fix-imports-v3/v4.mjs`, `fix-barrels.cjs`, `fix-all-imports.mjs`,
`fix-routes-v2.cjs`, `fix-student-imports.mjs`) repointed imports at the new
locations — stranding the old copies. Pages were also re-created under
role-prefixed names (`Curriculum.tsx` → `AdminCurriculum.tsx`, `Dashboard.tsx`
→ `AdminDashboard.tsx`, `Attendance.tsx` → `FacultyAttendance.tsx`), so the
router stopped referencing the originals.

42 of these files have a surviving same-name twin in `src/` that live code
imports. See `docs/` and PR #18 for the full orphan → twin mapping.

## Restoring a file

The directory mirrors `src/`, so relative imports resolve again once the file
is moved back:

```sh
mv attic/hooks/usePDF.ts src/hooks/usePDF.ts
```

Or recover the original byte-exact version from git:

```sh
git checkout 0169550 -- src/hooks/usePDF.ts
```

Note these were last known to compile at `0169550`. They have not been
typechecked since, so a restored file may need updating against current APIs.

## Contents by area

| Area | Files |
|------|-------|
| `modules/admin` | 30 |
| `modules/faculty` | 26 |
| `modules/student` | 14 |
| `hooks` | 10 |
| `types` | 9 |
| `shared/types` | 8 |
| `shared/components` | 8 |
| `modules/superadmin` | 7 |
| `shared/services` | 5 |
| `modules/auth` | 4 |
| `api` | 4 |
| `shared/utils` | 3 |
| `shared/api` | 2 |
| `routes` | 2 |
| `components/admin` | 2 |
| `utils` | 1 |
| `components/assessment` | 1 |

## Full list

- `src/api/client.ts`
- `src/api/facultyStudentIndexApi.ts`
- `src/api/questions.ts`
- `src/api/topicApi.ts`
- `src/components/admin/FacultyLinkPanel.tsx`
- `src/components/admin/StudentSeedPanel.tsx`
- `src/components/assessment/index.ts`
- `src/hooks/useAttendanceExport.ts`
- `src/hooks/useDashboardData.ts`
- `src/hooks/useFacultyAttendance.ts`
- `src/hooks/useFacultyCurriculum.ts`
- `src/hooks/useFacultyData.ts`
- `src/hooks/useFacultySchedule.ts`
- `src/hooks/useFacultyStudentIndex.ts`
- `src/hooks/useGreeting.ts`
- `src/hooks/usePDF.ts`
- `src/hooks/useStudentIndex.ts`
- `src/modules/admin/api/aiAgentApi.ts`
- `src/modules/admin/api/client.ts`
- `src/modules/admin/api/materialApi.ts`
- `src/modules/admin/api/paperGeneratorApi.ts`
- `src/modules/admin/api/questionSubmissionApi.ts`
- `src/modules/admin/api/questions.ts`
- `src/modules/admin/api/topicApi.ts`
- `src/modules/admin/api/universityApi.ts`
- `src/modules/admin/components/BulkActionsBar.tsx`
- `src/modules/admin/components/ai-agent/AIQuestionGenerator.tsx`
- `src/modules/admin/hooks/useAIAgent.ts`
- `src/modules/admin/hooks/useAdminDashboard.ts`
- `src/modules/admin/hooks/useAssessment.ts`
- `src/modules/admin/hooks/useGreeting.ts`
- `src/modules/admin/hooks/useMaterials.ts`
- `src/modules/admin/hooks/useTopics.ts`
- `src/modules/admin/pages/Curriculum.tsx`
- `src/modules/admin/pages/Dashboard.tsx`
- `src/modules/admin/pages/PaperGeneratorAdmin.tsx`
- `src/modules/admin/services/assignmentService.ts`
- `src/modules/admin/services/llmProviders.ts`
- `src/modules/admin/services/llmService.ts`
- `src/modules/admin/services/promptBuilder.ts`
- `src/modules/admin/services/responseParser.ts`
- `src/modules/admin/types/aiAgent.ts`
- `src/modules/admin/types/curriculum.ts`
- `src/modules/admin/types/index.ts`
- `src/modules/admin/types/student.ts`
- `src/modules/admin/types/system.ts`
- `src/modules/admin/types/university.ts`
- `src/modules/auth/components/ProtectedRoute.tsx`
- `src/modules/auth/guards/RoleGuard.tsx`
- `src/modules/auth/pages/StaffLogin.tsx`
- `src/modules/auth/pages/Unauthorized.tsx`
- `src/modules/faculty/api/assessmentsApi.ts`
- `src/modules/faculty/api/attendanceApi.ts`
- `src/modules/faculty/api/topicApi.ts`
- `src/modules/faculty/components/AttendanceForm.tsx`
- `src/modules/faculty/components/AttendanceTable.tsx`
- `src/modules/faculty/components/BulkActionsBar.tsx`
- `src/modules/faculty/components/ClassCard.tsx`
- `src/modules/faculty/components/ExportButton.tsx`
- `src/modules/faculty/components/StatusBadge.tsx`
- `src/modules/faculty/components/StudentAvatar.tsx`
- `src/modules/faculty/components/question-bank/FacultyBulkImport.tsx`
- `src/modules/faculty/components/question-bank/FacultyPaperLinker.tsx`
- `src/modules/faculty/components/question-bank/FacultyQuestionForm.tsx`
- `src/modules/faculty/components/shared/ExportButton.tsx`
- `src/modules/faculty/hooks/useAttendance.ts`
- `src/modules/faculty/hooks/useAttendanceMarking.ts`
- `src/modules/faculty/hooks/useFacultyAssessment.ts`
- `src/modules/faculty/hooks/useFacultyData.ts`
- `src/modules/faculty/hooks/useMaterials.ts`
- `src/modules/faculty/hooks/useTopics.ts`
- `src/modules/faculty/pages/Attendance.tsx`
- `src/modules/faculty/services/attendanceService.ts`
- `src/modules/faculty/services/questionBankAPI.ts`
- `src/modules/faculty/types/assessment.ts`
- `src/modules/faculty/types/index.ts`
- `src/modules/faculty/types/schedule.ts`
- `src/modules/student/assessment/index.ts`
- `src/modules/student/components/FeeDueCard.tsx`
- `src/modules/student/components/FeeManagementPage.tsx`
- `src/modules/student/components/StatsCards.tsx`
- `src/modules/student/components/StudentAvatar.tsx`
- `src/modules/student/components/UpcomingClasses.tsx`
- `src/modules/student/components/shared/PageHeader.tsx`
- `src/modules/student/components/shared/StatusBadge.tsx`
- `src/modules/student/hooks/useCollegeStudents.ts`
- `src/modules/student/hooks/useCurrentStudent.ts`
- `src/modules/student/hooks/useStudentTests.ts`
- `src/modules/student/hooks/useTestResult.ts`
- `src/modules/student/routes/studentAssessmentRoutes.tsx`
- `src/modules/student/types/schedule.ts`
- `src/modules/superadmin/components/FacultyImport.tsx`
- `src/modules/superadmin/components/ModuleBreakdown.tsx`
- `src/modules/superadmin/components/StudentImport.tsx`
- `src/modules/superadmin/components/SuperAdminCurriculum.tsx`
- `src/modules/superadmin/hooks/useCurriculum.ts`
- `src/modules/superadmin/services/seedUniversities.ts`
- `src/modules/superadmin/services/studentImportService.ts`
- `src/routes/MainRoutes.tsx`
- `src/routes/components.tsx`
- `src/shared/api/client.ts`
- `src/shared/api/cloudStorageApi.ts`
- `src/shared/components/ErrorBoundary.tsx`
- `src/shared/components/Header.tsx`
- `src/shared/components/MathRenderer.tsx`
- `src/shared/components/PageLoader.tsx`
- `src/shared/components/Sidebar.tsx`
- `src/shared/components/StatsCards.tsx`
- `src/shared/components/StatusBadge.tsx`
- `src/shared/components/Toast.tsx`
- `src/shared/services/collegeService.ts`
- `src/shared/services/firebaseAuth.ts`
- `src/shared/services/firebaseDb.ts`
- `src/shared/services/firestoreService.ts`
- `src/shared/services/studentService.ts`
- `src/shared/types/auth-types.ts`
- `src/shared/types/auth.ts`
- `src/shared/types/faculty.ts`
- `src/shared/types/index.ts`
- `src/shared/types/journey.ts`
- `src/shared/types/root-types.ts`
- `src/shared/types/student.ts`
- `src/shared/types/system.ts`
- `src/shared/utils/exportUtils.ts`
- `src/shared/utils/journeyData.ts`
- `src/shared/utils/seedAttendanceData.ts`
- `src/types/curriculum.ts`
- `src/types/faculty.ts`
- `src/types/onboarding.ts`
- `src/types/questionBank.ts`
- `src/types/questionBankApi.ts`
- `src/types/studentMappers.ts`
- `src/types/system.ts`
- `src/types/universalQuestionBank.ts`
- `src/types/university.ts`
- `src/utils/facultyStudentMapper.ts`
